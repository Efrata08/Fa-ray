// Shared sales math for the per-medicine Demand Forecast section
// (MedicineDetailScreen) and the store-wide AnalyticsScreen. Everything here
// reads from each medicine's `activity` log, which records isoDate (real
// timestamp) and displayTime (human label) on every sale/restock entry.

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MIN_SALES_FOR_FORECAST = 3;
export const STOCKOUT_DISPLAY_CAP = 99;
export const REORDER_HORIZON_DAYS = 30;
export const STOCK_RISK_DAYS = 7;

function saleEntries(medicine) {
  return medicine.activity.filter(e => e.type === 'sale' && e.isoDate);
}

// Per-medicine average daily sales, projected stockout, and a suggested
// 30-day reorder quantity. `rawAvgDailySales` (unrounded) drives the stockout
// and reorder math; `avgDailySales` (rounded to 1dp) is for display only —
// rounding first would let very slow movers divide by zero.
export function getSalesStats(medicine, now = new Date()) {
  const sales = saleEntries(medicine);
  if (sales.length < MIN_SALES_FOR_FORECAST) {
    return { hasEnoughData: false, saleCount: sales.length };
  }

  const totalSold = sales.reduce((sum, e) => sum + e.qty, 0);
  const firstSaleTime = Math.min(...sales.map(e => new Date(e.isoDate).getTime()));
  const daysSinceFirstSale = Math.max(1, Math.round((now.getTime() - firstSaleTime) / MS_PER_DAY));

  const rawAvgDailySales = totalSold / daysSinceFirstSale;
  const avgDailySales = Math.round(rawAvgDailySales * 10) / 10;
  const daysUntilStockout = Math.min(STOCKOUT_DISPLAY_CAP, Math.floor(medicine.stock / rawAvgDailySales));
  const suggestedReorder = Math.ceil((rawAvgDailySales * REORDER_HORIZON_DAYS) / 5) * 5;

  return {
    hasEnoughData: true,
    saleCount: sales.length,
    totalSold,
    rawAvgDailySales,
    avgDailySales,
    daysUntilStockout,
    suggestedReorder,
  };
}

// Daily sold-units for a bar chart, most-recent maxDays calendar days. Stops
// at the medicine's own history instead of padding with days before it had
// any sales, so a brand-new store doesn't show six empty bars.
export function getDailySalesWindow(medicine, now = new Date(), maxDays = 7) {
  const sales = saleEntries(medicine);
  if (sales.length === 0) return [];

  const firstSaleTime = Math.min(...sales.map(e => new Date(e.isoDate).getTime()));
  const daysAvailable = Math.min(
    maxDays,
    Math.floor((now.getTime() - firstSaleTime) / MS_PER_DAY) + 1
  );

  const byDayKey = new Map();
  for (const e of sales) {
    const d = new Date(e.isoDate);
    const key = d.toDateString();
    byDayKey.set(key, (byDayKey.get(key) || 0) + e.qty);
  }

  const days = [];
  for (let i = daysAvailable - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      qty: byDayKey.get(key) || 0,
    });
  }
  return days;
}

// Price can be edited after the fact (see StoreContext.updatePrice), so
// revenue must use each sale's own pricePerUnit snapshot, not the medicine's
// current price — otherwise editing a price would retroactively rewrite past
// revenue. Falls back to current price only for entries recorded before this
// field existed.
export function getWeeklyStats(medicines, now = new Date()) {
  const cutoff = now.getTime() - STOCK_RISK_DAYS * MS_PER_DAY;
  let weeklyRevenue = 0;
  let weeklyUnits = 0;
  const medicinesSold = new Set();

  for (const m of medicines) {
    for (const e of saleEntries(m)) {
      if (new Date(e.isoDate).getTime() < cutoff) continue;
      const price = e.pricePerUnit ?? m.price;
      weeklyRevenue += e.qty * price;
      weeklyUnits += e.qty;
      medicinesSold.add(m.id);
    }
  }

  return { weeklyRevenue, weeklyUnits, medicineCount: medicinesSold.size };
}

export function getStockRisk(medicines, now = new Date()) {
  return medicines
    .map(medicine => {
      if (medicine.stock <= 0) return { medicine, daysUntilStockout: 0 };
      const stats = getSalesStats(medicine, now);
      if (!stats.hasEnoughData) return { medicine, daysUntilStockout: Infinity };
      return { medicine, daysUntilStockout: stats.daysUntilStockout };
    })
    .filter(r => r.daysUntilStockout <= STOCK_RISK_DAYS || r.medicine.stock === 0)
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

export function getTopSellers(medicines, now = new Date(), limit = 5) {
  const cutoff = now.getTime() - STOCK_RISK_DAYS * MS_PER_DAY;
  return medicines
    .map(medicine => {
      const units = saleEntries(medicine)
        .filter(e => new Date(e.isoDate).getTime() >= cutoff)
        .reduce((sum, e) => sum + e.qty, 0);
      return { medicine, units };
    })
    .filter(r => r.units > 0)
    .sort((a, b) => b.units - a.units)
    .slice(0, limit);
}
