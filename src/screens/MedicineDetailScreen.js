import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';
import { getSalesStats, getDailySalesWindow } from '../utils/salesInsights';
import { getNearestExpiry } from '../utils/batches';

function getStatus(med) {
  if (med.stock <= med.reorder * 0.4) return 'critical';
  if (med.stock <= med.reorder) return 'reorder';
  return 'ok';
}

const STATUS_COLOR = {
  ok: '#3B6D11',
  reorder: '#BA7517',
  critical: '#A32D2D',
};

const STATUS_LABEL = {
  ok: 'OK',
  reorder: 'Reorder now',
  critical: 'Critical',
};

export default function MedicineDetailScreen({ route, navigation }) {
  const { medicineId } = route.params;
  const { medicines, updatePrice } = useStore();
  const insets = useSafeAreaInsets();

  const med = medicines.find(m => m.id === medicineId);
  const status = getStatus(med);
  const color = STATUS_COLOR[status];

  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState('');

  function startEditPrice() {
    setPriceDraft(String(med.price));
    setEditingPrice(true);
  }

  function savePrice() {
    const price = parseFloat(priceDraft);
    if (!(price > 0)) return;
    updatePrice(med.id, price);
    setEditingPrice(false);
  }

  const now = new Date();
  const stats = getSalesStats(med, now);
  const dailyWindow = stats.hasEnoughData ? getDailySalesWindow(med, now, 7) : [];
  const maxDailyQty = Math.max(1, ...dailyWindow.map(d => d.qty));
  const nearestExpiry = getNearestExpiry(med.batches, now);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{med.name}</Text>
          <Text style={styles.headerAmharic}>{med.amharic}</Text>
          <Text style={styles.headerSub}>{med.code}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Stock card */}
        <View style={styles.stockCard}>
          <Text style={styles.stockLabel}>Current stock</Text>
          <Text style={[styles.stockNumber, { color }]}>{med.stock}</Text>
          <Text style={styles.stockMeta}>units · reorder at {med.reorder}</Text>
          <View style={[styles.badge, { borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[status]}</Text>
          </View>
        </View>

        {/* Price — the only place price can be viewed or changed */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Price per unit</Text>
            <Text style={styles.priceValue}>ETB {med.price.toFixed(2)}</Text>
          </View>
          {!editingPrice && (
            <TouchableOpacity style={styles.priceEditBtn} onPress={startEditPrice} activeOpacity={0.7}>
              <Feather name="edit-2" size={13} color="#1A5C35" />
              <Text style={styles.priceEditBtnText}>Edit price</Text>
            </TouchableOpacity>
          )}
        </View>

        {editingPrice && (
          <View style={styles.priceEditForm}>
            <Text style={styles.priceEditFormLabel}>New price per unit (ETB)</Text>
            <TextInput
              style={styles.priceEditInput}
              value={priceDraft}
              onChangeText={setPriceDraft}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#BBB"
              autoFocus
            />
            <View style={styles.priceEditFormRow}>
              <TouchableOpacity style={styles.priceEditCancelBtn} onPress={() => setEditingPrice(false)}>
                <Text style={styles.priceEditCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priceEditSaveBtn, !(parseFloat(priceDraft) > 0) && { opacity: 0.4 }]}
                onPress={savePrice}
                disabled={!(parseFloat(priceDraft) > 0)}
              >
                <Text style={styles.priceEditSaveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Expiry — soonest-expiring batch still in stock, if any is known */}
        {nearestExpiry && (
          <View
            style={
              nearestExpiry.severity === 'expired' || nearestExpiry.severity === 'danger'
                ? styles.expiryRowDanger
                : nearestExpiry.severity === 'warning'
                ? styles.expiryRowWarning
                : styles.expiryRow
            }
          >
            <View>
              <Text
                style={[
                  styles.expiryLabel,
                  (nearestExpiry.severity === 'expired' || nearestExpiry.severity === 'danger') && styles.expiryTextDanger,
                  nearestExpiry.severity === 'warning' && styles.expiryTextWarning,
                ]}
              >
                {nearestExpiry.severity === 'expired' ? 'Nearest batch — EXPIRED' : 'Nearest batch expiry'}
              </Text>
              <Text
                style={[
                  styles.expiryValue,
                  (nearestExpiry.severity === 'expired' || nearestExpiry.severity === 'danger') && styles.expiryTextDanger,
                  nearestExpiry.severity === 'warning' && styles.expiryTextWarning,
                ]}
              >
                {new Date(nearestExpiry.batch.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}{nearestExpiry.batch.remainingQty} units
              </Text>
            </View>
            <Text
              style={[
                styles.expirySub,
                (nearestExpiry.severity === 'expired' || nearestExpiry.severity === 'danger') && styles.expiryTextDanger,
                nearestExpiry.severity === 'warning' && styles.expiryTextWarning,
              ]}
            >
              {nearestExpiry.severity === 'expired'
                ? `${Math.abs(nearestExpiry.daysUntilExpiry)} days ago`
                : `in ~${nearestExpiry.daysUntilExpiry} days`}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.soldBtn]}
            onPress={() => navigation.navigate('SaleEntry', { medicineId: med.id })}
          >
            <Text style={styles.soldBtnText}>Sold</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.restockBtn]}
            onPress={() => navigation.navigate('RestockEntry', { medicineId: med.id })}
          >
            <Text style={styles.restockBtnText}>Restock</Text>
          </TouchableOpacity>
        </View>

        {/* Recent activity */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { paddingTop: 0, paddingBottom: 0 }]}>Recent activity</Text>
          {med.activity.length > 5 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ActivityHistory', { medicineId: med.id })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        {med.activity.length === 0 ? (
          <Text style={styles.activityEmpty}>No activity yet</Text>
        ) : (
          med.activity.slice(0, 5).map((entry, i, arr) => (
            <View
              key={i}
              style={[styles.activityRow, i < arr.length - 1 && styles.activitySep]}
            >
              <Text style={[styles.activityChange, { color: entry.type === 'sale' ? '#555' : '#3B6D11' }]}>
                {entry.type === 'sale' ? `−${entry.qty} sold` : `+${entry.qty} restocked`}
              </Text>
              <Text style={styles.activityTime}>{entry.displayTime}</Text>
            </View>
          ))
        )}

        {/* Demand forecast — only once there's enough sales history to trust the math */}
        {stats.hasEnoughData && (
          <>
            <Text style={styles.forecastSectionTitle}>የሽያጭ ትንበያ · Demand forecast</Text>

            <View style={styles.statRow}>
              <Text style={styles.statLabelMuted}>Avg daily sales</Text>
              <Text style={styles.statValuePrimary}>{stats.avgDailySales} units/day</Text>
            </View>

            {(() => {
              const days = stats.daysUntilStockout;
              const risk = days <= 3 ? 'danger' : days <= 7 ? 'warning' : 'safe';
              const rowStyle = risk === 'danger' ? styles.statRowDanger : risk === 'warning' ? styles.statRowWarning : styles.statRow;
              const textStyle = risk === 'danger' ? styles.statTextDanger : risk === 'warning' ? styles.statTextWarning : null;
              return (
                <View style={rowStyle}>
                  <Text style={[styles.statLabelMuted, textStyle]}>Days until stockout</Text>
                  <Text style={[styles.statValuePrimary, textStyle]}>
                    {risk === 'danger' ? '⚠ ' : ''}~{days} days
                  </Text>
                </View>
              );
            })()}

            <View style={styles.statRowAccent}>
              <Text style={styles.statTextAccentLabel}>Suggested reorder</Text>
              <Text style={styles.statTextAccentValue}>{stats.suggestedReorder} units</Text>
            </View>

            <Text style={styles.sparkLabel}>Sales last 7 days</Text>
            <View style={styles.sparkContainer}>
              {dailyWindow.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.sparkBar,
                    { height: d.qty === 0 ? 4 : Math.max(4, Math.round((d.qty / maxDailyQty) * 40)) },
                  ]}
                />
              ))}
            </View>
            <View style={styles.sparkLabelRow}>
              {dailyWindow.map((d, i) => (
                <Text key={i} style={styles.sparkDayLabel}>{d.label}</Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#1A5C35',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  backBtn: { marginRight: 12, paddingBottom: 2 },
  backArrow: { color: '#fff', fontSize: 22 },
  headerText: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerAmharic: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  headerSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },

  stockCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  stockLabel: { fontSize: 13, color: '#888' },
  stockNumber: { fontSize: 80, fontWeight: '700', lineHeight: 88, marginTop: 4 },
  stockMeta: { fontSize: 14, color: '#888', marginTop: 2 },
  badge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  priceLabel: { fontSize: 12, color: '#888' },
  priceValue: { fontSize: 20, fontWeight: '700', color: '#111', marginTop: 2 },
  priceEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#1A5C35',
    backgroundColor: '#F0F7EC',
  },
  priceEditBtnText: { fontSize: 12, fontWeight: '600', color: '#1A5C35', marginLeft: 5 },

  priceEditForm: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F0F7EC',
    borderWidth: 1,
    borderColor: '#1A5C35',
  },
  priceEditFormLabel: { fontSize: 11, color: '#888', marginBottom: 6 },
  priceEditInput: {
    backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: '#D4D4D4',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: '#111',
  },
  priceEditFormRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  priceEditCancelBtn: {
    flex: 1, borderRadius: 6, paddingVertical: 10, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#CCC',
  },
  priceEditCancelBtnText: { fontSize: 13, fontWeight: '500', color: '#888' },
  priceEditSaveBtn: {
    flex: 1, backgroundColor: '#1A5C35', borderRadius: 6, paddingVertical: 10, alignItems: 'center',
  },
  priceEditSaveBtnText: { fontSize: 13, fontWeight: '500', color: '#fff' },

  expiryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F6F5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  expiryRowWarning: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FDF3E2',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  expiryRowDanger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF5F5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  expiryLabel: { fontSize: 12, color: '#888' },
  expiryValue: { fontSize: 14, fontWeight: '600', color: '#111', marginTop: 2 },
  expirySub: { fontSize: 12, color: '#888', fontWeight: '500' },
  expiryTextDanger: { color: '#A32D2D' },
  expiryTextWarning: { color: '#BA7517' },

  actionRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 0.5,
    minHeight: 48,
  },
  soldBtn: { backgroundColor: '#F5F6F5', borderColor: '#999', marginRight: 8 },
  soldBtnText: { color: '#555', fontSize: 15, fontWeight: '600' },
  restockBtn: { backgroundColor: '#F0F7EC', borderColor: '#3B6D11', marginLeft: 8 },
  restockBtnText: { color: '#3B6D11', fontSize: 15, fontWeight: '600' },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  seeAllText: { fontSize: 12, fontWeight: '600', color: '#1A5C35' },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  activitySep: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  activityEmpty: { fontSize: 13, color: '#BBB', paddingHorizontal: 16, paddingVertical: 16 },
  activityChange: { fontSize: 14, fontWeight: '500' },
  activityTime: { fontSize: 13, color: '#999' },

  forecastSectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 8,
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F6F5',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  statRowDanger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  statRowWarning: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FDF3E2',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  statRowAccent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EAF3DE',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  statLabelMuted: { fontSize: 11, color: '#999' },
  statValuePrimary: { fontSize: 13, fontWeight: '500', color: '#111' },
  statTextDanger: { color: '#A32D2D' },
  statTextWarning: { color: '#BA7517' },
  statTextAccentLabel: { fontSize: 11, color: '#1A5C35' },
  statTextAccentValue: { fontSize: 13, fontWeight: '500', color: '#1A5C35' },

  sparkLabel: { fontSize: 10, color: '#999', paddingHorizontal: 16, marginBottom: 4 },
  sparkContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    paddingHorizontal: 16,
    gap: 4,
  },
  sparkBar: {
    flex: 1,
    backgroundColor: '#3B6D11',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  sparkLabelRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 4,
    gap: 4,
  },
  sparkDayLabel: { flex: 1, fontSize: 9, color: '#999', textAlign: 'center' },
});
