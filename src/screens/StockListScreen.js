import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Alert, Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

// ── helpers ────────────────────────────────────────────────────────────────────

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

const ROW_BG = {
  critical: '#FFF5F5',
  reorder: '#FFFBEB',
  ok: '#fff',
};

// ── sub-components ─────────────────────────────────────────────────────────────

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
  head: {
    width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  body: {
    width: 18, height: 10, borderRadius: 9,
    backgroundColor: '#fff',
    marginTop: 2,
  },
});

// Package icon: box outline with a horizontal stripe near the top
function PackageIcon() {
  return (
    <View style={pkg.box}>
      <View style={pkg.stripe} />
    </View>
  );
}

const pkg = StyleSheet.create({
  box: {
    width: 36, height: 36,
    borderWidth: 2, borderColor: '#1A5C35',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  stripe: {
    width: '100%',
    height: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1A5C35',
  },
});

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
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#D4D4D4' },
  text: {
    fontSize: 11, fontWeight: '500', color: '#999',
    marginHorizontal: 10, letterSpacing: 0.4,
  },
});

function MedRow({ med, onPress }) {
  const status = getStatus(med);
  const color = STATUS_COLOR[status];

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: ROW_BG[status] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowAmharic}>{med.amharic}</Text>
        <Text style={styles.rowEnglish}>{med.name} · {med.code}</Text>
      </View>
      <View style={styles.stockCol}>
        <Text style={[styles.stockNum, { color }]}>{med.stock}</Text>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
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

      {/* Go to all stock */}
      <View style={styles.allStockWrap}>
        <TouchableOpacity
          style={styles.allStockBtn}
          onPress={() => navigation.navigate('AllStock')}
          activeOpacity={0.75}
        >
          <PackageIcon />
          <Text style={styles.allStockText}>ሁሉም ክምችት · Go to all stock</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <SectionDivider title="ትኩረት · Attention" />

        {attentionMeds.length === 0 ? (
          <View style={styles.allOk}>
            <Text style={styles.allOkCheck}>✓</Text>
            <Text style={styles.allOkText}>ሁሉም ጥሩ ነው · All stock is OK</Text>
          </View>
        ) : (
          attentionMeds.map(med => (
            <MedRow
              key={med.id}
              med={med}
              onPress={() => navigation.navigate('MedicineDetail', { medicineId: med.id })}
            />
          ))
        )}
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
  headerLeft: {},
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '500' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  // All stock button
  allStockWrap: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  allStockBtn: {
    minHeight: SCREEN_HEIGHT * 0.30,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#F0F7EC',
    borderWidth: 1,
    borderColor: '#C3D9B0',
    borderRadius: 16,
  },
  allStockText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A5C35',
    marginTop: 14,
  },
  chevron: { fontSize: 22, color: '#7AAE5A', marginTop: 6 },

  // Attention rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEBEB',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  rowInfo: { flex: 1 },
  rowAmharic: { fontSize: 15, fontWeight: '500', color: '#111' },
  rowEnglish: { fontSize: 11, color: '#999', marginTop: 2 },
  stockCol: { alignItems: 'flex-end', minWidth: 44 },
  stockNum: { fontSize: 22, fontWeight: '500' },
  stockUnits: { fontSize: 10, color: '#AAA', marginTop: 1 },

  // All OK empty state
  allOk: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 32,
  },
  allOkCheck: { fontSize: 36, color: '#3B6D11', marginBottom: 10 },
  allOkText: { fontSize: 13, color: '#BBB', textAlign: 'center' },
});
