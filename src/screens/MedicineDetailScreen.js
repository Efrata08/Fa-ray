import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

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
  const { medicines } = useStore();
  const insets = useSafeAreaInsets();

  const med = medicines.find(m => m.id === medicineId);
  const status = getStatus(med);
  const color = STATUS_COLOR[status];

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
        <Text style={styles.sectionTitle}>Recent activity</Text>
        {med.activity.length === 0 ? (
          <Text style={styles.activityEmpty}>No activity yet</Text>
        ) : (
          med.activity.slice(0, 20).map((entry, i, arr) => (
            <View
              key={i}
              style={[styles.activityRow, i < arr.length - 1 && styles.activitySep]}
            >
              <Text style={[styles.activityChange, { color: entry.type === 'sale' ? '#A32D2D' : '#3B6D11' }]}>
                {entry.type === 'sale' ? `−${entry.qty} sold` : `+${entry.qty} restocked`}
              </Text>
              <Text style={styles.activityTime}>{entry.time}</Text>
            </View>
          ))
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
  soldBtn: { backgroundColor: '#FFF5F5', borderColor: '#A32D2D', marginRight: 8 },
  soldBtnText: { color: '#A32D2D', fontSize: 15, fontWeight: '600' },
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
});
