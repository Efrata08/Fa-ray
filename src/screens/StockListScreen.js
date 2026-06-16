import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Alert, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ── helpers ────────────────────────────────────────────────────────────────────

function getStatus(med) {
  if (med.stock <= med.reorder * 0.4) return 'critical';
  if (med.stock <= med.reorder) return 'reorder';
  return 'ok';
}

// ── ProfileIcon (view-drawn) ───────────────────────────────────────────────────

function ProfileIcon() {
  return (
    <View style={pi.wrap}>
      <View style={pi.head} />
      <View style={pi.body} />
    </View>
  );
}

const pi = StyleSheet.create({
  wrap: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#fff',
    alignItems: 'center', overflow: 'hidden',
  },
  head: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#fff', marginTop: 4 },
  body: { width: 18, height: 10, borderRadius: 9, backgroundColor: '#fff', marginTop: 2 },
});

// ── SectionDivider ─────────────────────────────────────────────────────────────

function SectionDivider({ title }) {
  return (
    <View style={sd.row}>
      <View style={sd.line} />
      <Text style={sd.text}>{title}</Text>
      <View style={sd.line} />
    </View>
  );
}

const sd = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#D4D4D4' },
  text: { fontSize: 11, fontWeight: '500', color: '#999', marginHorizontal: 10, letterSpacing: 0.4 },
});

// ── AttentionRow ───────────────────────────────────────────────────────────────

function AttentionRow({ med, onPress }) {
  const isCritical = getStatus(med) === 'critical';
  const dotColor   = isCritical ? '#A32D2D' : '#BA7517';
  const stockColor = isCritical ? '#A32D2D' : '#BA7517';
  const stockSize  = isCritical ? 24 : 20;
  const nameSize   = isCritical ? 15 : 14;

  return (
    <TouchableOpacity style={styles.attentionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.rowInfo}>
        <Text style={[styles.rowAmharic, { fontSize: nameSize }]}>{med.amharic}</Text>
        <Text style={styles.rowEnglish}>{med.name} · {med.code}</Text>
      </View>
      <View style={styles.stockCol}>
        <Text style={[styles.stockNum, { fontSize: stockSize, color: stockColor }]}>{med.stock}</Text>
        <Text style={styles.stockUnits}>units</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── screen ─────────────────────────────────────────────────────────────────────

export default function StockListScreen({ navigation }) {
  const { medicines } = useStore();
  const insets = useSafeAreaInsets();

  const attentionMeds = medicines
    .filter(m => getStatus(m) !== 'ok')
    .sort((a, b) => {
      const order = { critical: 0, reorder: 1 };
      return order[getStatus(a)] - order[getStatus(b)];
    });

  const isEmpty  = attentionMeds.length === 0;
  const isSingle = attentionMeds.length === 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>ፍሬ</Text>
          <Text style={styles.headerSub}>Fa-ray · ዕቃ ክምችት</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('የፕሮፋይል ገጽ · Profile coming soon')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ProfileIcon />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* All stock button */}
        <TouchableOpacity
          style={styles.allStockBtn}
          onPress={() => navigation.navigate('AllStock')}
          activeOpacity={0.75}
        >
          <View style={styles.allStockLeft}>
            <Feather name="package" size={20} color="#1A5C35" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.allStockTitle}>ሁሉም ክምችት · All stock</Text>
              <Text style={styles.allStockSub}>{medicines.length} medicines</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={17} color="#1A5C35" />
        </TouchableOpacity>

        {/* Attention section */}
        <SectionDivider title="ትኩረት · Attention" />

        <View style={[styles.attentionSection, isEmpty && styles.attentionSectionEmpty]}>
          {isEmpty ? (
            /* Empty state — centered inside minHeight container */
            <View style={styles.emptyState}>
              <View style={styles.emptyCircle}>
                <Feather name="check-circle" size={22} color="#1A5C35" />
              </View>
              <Text style={styles.emptyTitle}>ሁሉም ጥሩ ነው</Text>
              <Text style={styles.emptySubtitle}>All stock is OK</Text>
              <Text style={styles.emptyNote}>No medicines need attention today</Text>
            </View>
          ) : (
            <>
              {attentionMeds.map((med, index) => (
                <View key={med.id}>
                  <AttentionRow
                    med={med}
                    onPress={() => navigation.navigate('MedicineDetail', { medicineId: med.id })}
                  />
                  {index < attentionMeds.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
              {isSingle && (
                <Text style={styles.singleLabel}>1 medicine needs attention</Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    backgroundColor: '#1A5C35',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '500' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  // All stock button
  allStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF3DE',
    borderWidth: 1.5,
    borderColor: '#1A5C35',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 12,
    marginHorizontal: 14,
  },
  allStockLeft: { flexDirection: 'row', alignItems: 'center' },
  allStockTitle: { fontSize: 14, fontWeight: '500', color: '#1A5C35' },
  allStockSub: { fontSize: 11, color: '#3B6D11', marginTop: 2 },

  // Attention section container
  attentionSection: { minHeight: SCREEN_HEIGHT * 0.35 },
  attentionSectionEmpty: { justifyContent: 'center', alignItems: 'center' },

  // Attention rows
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  rowInfo: { flex: 1 },
  rowAmharic: { fontWeight: '500', color: '#111' },
  rowEnglish: { fontSize: 11, color: '#999', marginTop: 2 },
  stockCol: { alignItems: 'flex-end', minWidth: 44 },
  stockNum: { fontWeight: '500' },
  stockUnits: { fontSize: 10, color: '#AAA', marginTop: 1 },
  rowDivider: { height: 0.5, backgroundColor: '#E5E5E5', marginLeft: 36 },

  // Single item label
  singleLabel: {
    fontSize: 10,
    color: '#BBB',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Empty state
  emptyState: { alignItems: 'center' },
  emptyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF3DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '500', color: '#111', marginTop: 12 },
  emptySubtitle: { fontSize: 11, color: '#888', marginTop: 4 },
  emptyNote: { fontSize: 10, color: '#BBB', marginTop: 3 },
});
