import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, TextInput,
} from 'react-native';
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

const STATUS_ORDER = { critical: 0, reorder: 1, ok: 2 };

// ── sub-components ─────────────────────────────────────────────────────────────

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

export default function AllStockScreen({ navigation }) {
  const { medicines, currentTransaction } = useStore();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const searching = q !== '';

  const sortedMeds = [...medicines].sort(
    (a, b) => STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)]
  );

  const displayMeds = searching
    ? sortedMeds.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.amharic.includes(query.trim()) ||
        m.code.toLowerCase().includes(q)
      )
    : sortedMeds;

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
          <Text style={styles.headerTitle}>ሁሉም ክምችት</Text>
          <Text style={styles.headerSub}>All stock · {medicines.length} medicines</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="መድሃኒት ፈልግ · Search"
            placeholderTextColor="#BBB"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Transaction banner */}
      {currentTransaction.length > 0 && (
        <View style={styles.txBanner}>
          <Text style={styles.txBannerLeft}>
            {currentTransaction.length} item{currentTransaction.length !== 1 ? 's' : ''} in transaction
            {' · '}ETB {currentTransaction.reduce((s, i) => s + i.lineTotal, 0).toFixed(2)}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SaleRecorded')}>
            <Text style={styles.txBannerFinish}>ጨርስ · Finish</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        {searching && (
          <Text style={styles.resultsLabel}>
            {displayMeds.length} results · {displayMeds.length} ውጤቶች
          </Text>
        )}

        {searching && displayMeds.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsIcon}>🔍</Text>
            <Text style={styles.noResultsText}>
              ተጨማሪ ውጤቶች የሉም · No results
            </Text>
          </View>
        ) : (
          displayMeds.map(med => (
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
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  backBtn: { marginRight: 12, paddingBottom: 2 },
  backArrow: { color: '#fff', fontSize: 22 },
  headerText: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  // Search bar
  searchContainer: {
    backgroundColor: '#F5F6F5',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
  },
  searchIcon: { fontSize: 13, color: '#BBB', marginRight: 7 },
  searchInput: { flex: 1, fontSize: 14, color: '#111', paddingVertical: 0, height: 22 },
  clearBtn: { fontSize: 13, color: '#BBB', paddingLeft: 8 },

  // Results
  resultsLabel: {
    fontSize: 11, color: '#AAA',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 48, paddingBottom: 32,
  },
  noResultsIcon: { fontSize: 28, marginBottom: 10 },
  noResultsText: { fontSize: 13, color: '#BBB', textAlign: 'center' },

  // Transaction banner
  txBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A5C35',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  txBannerLeft: { fontSize: 12, color: '#fff', flex: 1 },
  txBannerFinish: { fontSize: 12, color: '#fff', textDecorationLine: 'underline' },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEBEB',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  rowInfo: { flex: 1 },
  rowAmharic: { fontSize: 13, fontWeight: '500', color: '#111' },
  rowEnglish: { fontSize: 11, color: '#999', marginTop: 2 },
  stockCol: { alignItems: 'flex-end', minWidth: 44 },
  stockNum: { fontSize: 16, fontWeight: '500' },
  stockUnits: { fontSize: 10, color: '#AAA', marginTop: 1 },
});
