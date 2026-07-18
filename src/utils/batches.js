import * as Notifications from 'expo-notifications';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const EXPIRY_ALERT_DAYS_BEFORE = 30;
export const EXPIRY_DANGER_DAYS = 30;
export const EXPIRY_WARNING_DAYS = 90;

export function createBatch({ qty, expiryDate }) {
  const now = new Date();
  return {
    id: `batch_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    qty,
    remainingQty: qty,
    expiryDate: expiryDate || null, // ISO date string, or null if not recorded
    receivedDate: now.toISOString(),
    notificationId: null,
  };
}

// FEFO order: soonest expiry first. Batches with no known expiry sort last —
// we can't apply first-expire-first-out to stock whose expiry was never
// recorded (e.g. restocked before this feature existed), so they're treated
// as the least urgent to sell through rather than guessed at.
function sortForFEFO(batches) {
  return [...batches].sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return 0;
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });
}

// Decrements remainingQty across batches in FEFO order for a sale of `qty`
// units. Returns the updated batches array plus the ids of any batches that
// became fully depleted just now, so their scheduled expiry reminder (if
// any) can be cancelled — no point warning about a batch that's gone.
export function decrementBatchesFEFO(batches, qty) {
  const active = batches.filter(b => b.remainingQty > 0);
  const sorted = sortForFEFO(active);
  const untouched = batches.filter(b => b.remainingQty <= 0);

  let remaining = qty;
  const depletedIds = [];
  const decremented = sorted.map(b => {
    if (remaining <= 0) return b;
    const take = Math.min(b.remainingQty, remaining);
    remaining -= take;
    const newRemaining = b.remainingQty - take;
    if (newRemaining <= 0) depletedIds.push(b.id);
    return { ...b, remainingQty: newRemaining };
  });

  return { batches: [...decremented, ...untouched], depletedIds };
}

// The single most urgent (soonest-expiring) batch still in stock — what
// MedicineDetailScreen and Analytics both surface. Batches with no recorded
// expiry are excluded (nothing to warn about) rather than treated as "safe."
export function getNearestExpiry(batches, now = new Date()) {
  const active = (batches || []).filter(b => b.remainingQty > 0 && b.expiryDate);
  if (active.length === 0) return null;

  const nearest = sortForFEFO(active)[0];
  const daysUntilExpiry = Math.ceil((new Date(nearest.expiryDate).getTime() - now.getTime()) / MS_PER_DAY);

  let severity;
  if (daysUntilExpiry <= 0) severity = 'expired';
  else if (daysUntilExpiry <= EXPIRY_DANGER_DAYS) severity = 'danger';
  else if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) severity = 'warning';
  else severity = 'safe';

  return { batch: nearest, daysUntilExpiry, severity };
}

// Schedules a local notification EXPIRY_ALERT_DAYS_BEFORE the batch's expiry
// date. If that point has already passed (the batch was already inside the
// warning window when entered), fires right away instead of scheduling in
// the past. Returns the notification id (to allow cancelling later if the
// batch sells out first) or null if nothing was scheduled.
export async function scheduleExpiryAlert(medicine, batch) {
  if (!batch.expiryDate) return null;
  const expiry = new Date(batch.expiryDate);
  const now = new Date();
  const alertDate = new Date(expiry.getTime() - EXPIRY_ALERT_DAYS_BEFORE * MS_PER_DAY);

  const title = '⏳ ማብቂያ ቀርቧል · Expiry approaching';
  const dateLabel = expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const body = `${medicine.amharic} — ${batch.qty} units expire ${dateLabel}`;

  try {
    if (alertDate > now) {
      return await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: alertDate },
      });
    }
    if (expiry > now) {
      return await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    }
  } catch {
    // Best-effort — a scheduling failure shouldn't block recording the restock.
  }
  return null;
}

// Store-wide view for AnalyticsScreen: every medicine whose nearest batch is
// expired or within the warning window, soonest first.
export function getExpiringSoon(medicines, now = new Date()) {
  return medicines
    .map(medicine => {
      const nearest = getNearestExpiry(medicine.batches, now);
      return nearest ? { medicine, ...nearest } : null;
    })
    .filter(r => r && r.severity !== 'safe')
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

export async function cancelExpiryAlert(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already fired/cancelled/invalid — nothing to do.
  }
}
