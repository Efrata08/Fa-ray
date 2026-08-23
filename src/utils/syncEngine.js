import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// AsyncStorage keys
const QUEUE_KEY       = 'faray_sync_queue';
const ID_MAP_KEY      = 'faray_server_id_map';   // local int id → server UUID
const LAST_SYNC_KEY   = 'faray_last_sync_at';    // ISO timestamp cursor for pull
const DEVICE_ID_KEY   = 'faray_device_id';
const PHARMACY_ID_KEY = 'faray_pharmacy_id';
const APPLIED_IDS_KEY = 'faray_applied_event_ids'; // prevents replaying our own pulled events

// ── Internal helpers ──────────────────────────────────────────────────────────

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = makeId('device');
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function getIdMap() {
  const raw = await AsyncStorage.getItem(ID_MAP_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function getQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function getAppliedIds() {
  const raw = await AsyncStorage.getItem(APPLIED_IDS_KEY);
  return raw ? new Set(JSON.parse(raw)) : new Set();
}

async function addAppliedIds(ids) {
  const set = await getAppliedIds();
  for (const id of ids) set.add(id);
  // Cap at 10 000 entries to prevent unbounded growth in long-running installs.
  const arr = [...set].slice(-10000);
  await AsyncStorage.setItem(APPLIED_IDS_KEY, JSON.stringify(arr));
}

// ── Pharmacy identity ─────────────────────────────────────────────────────────
// Set once after account creation / login; read by every sync operation.

export async function getPharmacyId() {
  return AsyncStorage.getItem(PHARMACY_ID_KEY);
}

export async function setPharmacyId(id) {
  return AsyncStorage.setItem(PHARMACY_ID_KEY, id);
}

// ── Enqueue ───────────────────────────────────────────────────────────────────
// Called immediately when a sale or restock is recorded locally — before any
// network attempt. If the device is offline the event stays in the queue until
// the next successful sync.

export async function enqueueEvent({ medicineLocalId, type, qty, pricePerUnit = null, occurredAt }) {
  const queue = await getQueue();
  queue.push({
    clientEventId:   makeId('event'),
    medicineLocalId: String(medicineLocalId),
    type,
    qty,
    pricePerUnit,
    occurredAt,
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ── Medicine registration ──────────────────────────────────────────────────────
// Ensures every local medicine has a corresponding server row and that the
// local-id → server-UUID map is populated. Safe to call repeatedly (upserts
// on pharmacy_id + code).

async function ensureMedicinesRegistered(medicines, pharmacyId) {
  const idMap = await getIdMap();
  const unregistered = medicines.filter(m => m.code && !idMap[String(m.id)]);
  if (unregistered.length === 0) return idMap;

  const rows = unregistered.map(m => ({
    pharmacy_id:   pharmacyId,
    name:          m.name,
    amharic:       m.amharic ?? null,
    code:          m.code,
    price:         m.price,
    reorder_point: m.reorder,
    stock:         m.stock,
  }));

  const { data, error } = await supabase
    .from('medicines')
    .upsert(rows, { onConflict: 'pharmacy_id,code' })
    .select('id, code');

  if (error) throw error;

  const byCode = Object.fromEntries(unregistered.map(m => [m.code, m]));
  const updated = { ...idMap };
  for (const row of data) {
    const local = byCode[row.code];
    if (local) updated[String(local.id)] = row.id;
  }
  await AsyncStorage.setItem(ID_MAP_KEY, JSON.stringify(updated));
  return updated;
}

// ── Push ──────────────────────────────────────────────────────────────────────
// Uploads all queued events to the server. The UNIQUE constraint on
// (pharmacy_id, client_event_id) makes this safe to retry after a network
// failure — duplicates are silently ignored.

async function push(medicines, pharmacyId) {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  const idMap = await ensureMedicinesRegistered(medicines, pharmacyId);
  const deviceId = await getDeviceId();

  // Skip events whose medicine has no server UUID yet (shouldn't happen after
  // ensureMedicinesRegistered, but guard against medicines with no code).
  const uploadable = queue.filter(e => idMap[e.medicineLocalId]);
  if (uploadable.length === 0) return 0;

  const rows = uploadable.map(e => ({
    pharmacy_id:     pharmacyId,
    medicine_id:     idMap[e.medicineLocalId],
    type:            e.type,
    qty:             e.qty,
    price_per_unit:  e.pricePerUnit,
    occurred_at:     e.occurredAt,
    client_event_id: e.clientEventId,
    device_id:       deviceId,
  }));

  const { error } = await supabase
    .from('activity_log')
    .upsert(rows, { onConflict: 'pharmacy_id,client_event_id', ignoreDuplicates: true });

  if (error) throw error;

  const uploaded = new Set(uploadable.map(e => e.clientEventId));
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(queue.filter(e => !uploaded.has(e.clientEventId)))
  );

  return uploadable.length;
}

// ── Pull ──────────────────────────────────────────────────────────────────────
// Downloads events recorded on OTHER devices since the last sync cursor.
// Returns them with local medicine IDs so StoreContext can apply them without
// knowing anything about server UUIDs.
//
// Note: remote restocks don't create local batch objects (we lack expiry info
// in the activity_log). Stock totals stay correct; FEFO ordering only applies
// to batches entered on this device.

async function pull(pharmacyId) {
  const [lastSync, deviceId] = await Promise.all([
    AsyncStorage.getItem(LAST_SYNC_KEY),
    getDeviceId(),
  ]);

  let query = supabase
    .from('activity_log')
    .select('medicine_id, type, qty, price_per_unit, occurred_at, client_event_id')
    .eq('pharmacy_id', pharmacyId)
    .neq('device_id', deviceId)   // skip our own events — already applied locally
    .order('occurred_at', { ascending: true });

  if (lastSync) query = query.gt('occurred_at', lastSync);

  const { data, error } = await query;
  if (error) throw error;

  if (data.length > 0) {
    await AsyncStorage.setItem(LAST_SYNC_KEY, data[data.length - 1].occurred_at);
  }

  const idMap = await getIdMap();
  const reverseMap = Object.fromEntries(
    Object.entries(idMap).map(([localId, serverId]) => [serverId, Number(localId)])
  );
  const appliedIds = await getAppliedIds();

  return data
    .filter(e => reverseMap[e.medicine_id] && !appliedIds.has(e.client_event_id))
    .map(e => ({
      clientEventId:   e.client_event_id,
      localMedicineId: reverseMap[e.medicine_id],
      type:            e.type,
      qty:             e.qty,
      pricePerUnit:    e.price_per_unit,
      occurredAt:      e.occurred_at,
    }));
}

// ── Public API ────────────────────────────────────────────────────────────────

// Push queued events up, pull foreign events down. Returns pulled events so
// the caller (StoreContext) can apply them to local state.
// Errors in push and pull are isolated — one failing doesn't block the other.
export async function sync(medicines) {
  const pharmacyId = await getPharmacyId();
  if (!pharmacyId) return { pushed: 0, pulled: [] };

  const [pushed, pulled] = await Promise.all([
    push(medicines, pharmacyId).catch(() => 0),
    pull(pharmacyId).catch(() => []),
  ]);

  return { pushed, pulled };
}

// Call after applying pulled events to local state so they aren't replayed
// on the next pull.
export async function markEventsApplied(clientEventIds) {
  if (clientEventIds.length > 0) await addAppliedIds(clientEventIds);
}
