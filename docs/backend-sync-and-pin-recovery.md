# ፍሬ — Backend Sync & PIN Recovery: Implementation Plan

**Status:** Post-launch fast-follow. Does **not** block the current Play Store
submission — the pilot ships on the existing local-only build (AsyncStorage +
manual export + optional Downloads auto-backup). This work starts after that.

**Context:** App is currently fully offline (React Native/Expo, AsyncStorage).
Devices get intermittent internet access, so we're adding a lightweight
backend for two purposes: (1) PIN recovery when a pharmacist is locked out,
(2) data backup/restore if a device is lost or reinstalled. This does not
change the offline-first design — the app must continue to work fully without
connectivity; sync is opportunistic, not required.

**Backend:** Supabase (Postgres).

---

## ⚠️ Prerequisite: this changes the privacy story — reconcile before shipping

The published privacy policy currently states data **never leaves the
device** and that Fa-Ray "doesn't have a server to send it to." This feature
makes that false. Before this ships (not after):

1. **Rewrite the privacy policy** to disclose: what's synced (stock, sales,
   restocks, a recovery contact), where (Supabase, name the region if it
   matters for the pharmacy's comfort), and that it's opt-in/best-effort, not
   automatic-and-mandatory (sync only happens when online; a pharmacy that
   never has connectivity is disclosed as staying fully local).
2. **Update the Play Store Data Safety form** to match — "no data collected"
   becomes "yes, collects X/Y/Z, for backup purposes, not shared with third
   parties" (assuming Supabase is the only processor and nothing is sold/ad-shared).
3. Treat this as one task, not two separate ones that can drift out of sync —
   ship the copy change in the same release as the feature.

---

## Schema

```
pharmacies
  id                 uuid primary key        -- see "Identity" below
  pharmacy_name      text
  recovery_contact   text                    -- phone or email, pharmacist's choice
  created_at         timestamptz
  last_synced_at     timestamptz

sync_snapshots
  pharmacy_id        uuid primary key references pharmacies(id)  -- ONE row per
                                                                   -- pharmacy, upserted
  payload            jsonb                   -- full local data blob: stock, sales, restocks
  synced_at          timestamptz
  device_id          text                    -- metadata only, not used for access control

recovery_requests
  id                 uuid primary key
  pharmacy_id        uuid references pharmacies(id)
  status             text                    -- 'pending' | 'verified' | 'completed'
  reset_token        text
  requested_at       timestamptz
```

**Change from the original draft: `sync_snapshots` is upsert-in-place (one
row per pharmacy), not an append-only log.** The goal here is "restore the
latest good state if a device is lost," not an audit trail — an unbounded
snapshot history means unbounded storage growth for no benefit this feature
needs. If a real audit trail becomes a separate future requirement, add it
as its own table later; don't conflate the two.

---

## Identity — how `pharmacies.id` gets set (the open question from the draft)

1. On completing onboarding (before any network is involved), generate a
   local UUID (`expo-crypto`'s `randomUUID()`) and store it as
   `faray_pharmacy_id` in AsyncStorage. This is the pharmacy's identity from
   day one, sync or no sync.
2. **Use Supabase Anonymous Auth**, not a bare API call with the public anon
   key, to actually create the `pharmacies` row. Anonymous sign-in gives the
   device a real `auth.uid()`. Link it to the locally-generated UUID once, at
   first successful sync.
3. **This is the part that can't be skipped: without real auth, RLS on
   `pharmacy_id` alone is not security** — the anon key ships inside the APK
   (anyone can decompile it), so any client could claim any `pharmacy_id` and
   read or write another pharmacy's data unless row access is actually tied
   to an authenticated session. RLS policies should read `pharmacy_id =
   auth.uid()` (post-linking), not just "does this row's pharmacy_id match
   the one the client sent."
4. `device_id` is metadata only (useful later if a pharmacy ever runs the
   app on a second phone) — not part of the access-control story for this
   pass. Don't build multi-device merge logic now; out of scope, noted below.

---

## App-side work

1. **Sync module** — detect connectivity (`@react-native-community/netinfo`),
   push the local snapshot on a schedule *and* after key actions (sale,
   restock, price edit). Fail silently, retry later, never block the UI —
   matches how the existing local auto-backup already behaves.
2. **Manual "Sync now" + status, in the existing profile menu** — next to
   "Turn on automatic backup" / "Export data" (same bottom-sheet menu built
   for those). Show `last_synced_at` so the pharmacist has visibility instead
   of a fully invisible background process. Auto-sync is the primary path;
   manual is the fallback/confidence-check, not the only way to trigger it.
3. **Restore flow** — on fresh install / re-onboarding, if a `faray_pharmacy_id`
   from a *previous* onboarding on this device doesn't exist locally but the
   pharmacist enters a recovery contact that matches a `pharmacies` row,
   offer to restore that snapshot. **Never silently overwrite existing local
   data** — if the device already has non-empty local data, this must be an
   explicit choice ("Replace this device's data with the cloud backup?"),
   not automatic.
4. **PIN recovery flow:**
   - Replace "Recovery coming soon" with a real flow.
   - Pharmacist submits their recovery contact (must match what they set at
     onboarding).
   - Creates a `recovery_requests` row, status `pending`.
   - Manual verification against `recovery_contact` (fine at pilot scale) →
     issue a reset token.
   - Pharmacist enters token in-app → sets new PIN → status `completed`.
5. **Zero-connectivity fallback** — if a pharmacy has never synced (no
   `sync_snapshots` row), backend recovery isn't possible. Say so clearly,
   and fall back to the existing local erase-and-restart as the last resort
   — don't leave the pharmacist without *any* path forward.

---

## Explicitly out of scope for this pass

Multi-device conflict resolution, automated identity verification (SMS/email
OTP — manual verification is fine at pilot scale), per-staff accounts,
snapshot history/audit trail (see schema note above).

---

## Testing priorities

- Sync interrupted mid-push (airplane mode toggled mid-request).
- App killed during sync.
- Restore attempted on a device that already has local data — must prompt,
  never silently overwrite.
- Pharmacy with no connectivity, ever — confirm the app is fully usable
  forever without sync, and that recovery correctly reports "not available"
  rather than hanging or erroring unclearly.
- A second device attempting to read/write a pharmacy it doesn't own —
  confirm RLS actually blocks it (this is the one to not skip).
