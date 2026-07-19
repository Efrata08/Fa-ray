import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/medicineCatalog';

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

// Default browse order for this list. Falls back to urgency-first (the
// original behavior) when the pharmacy hasn't chosen a shelf-organization
// preference during onboarding — e.g. installs that predate ShelfSetupScreen.
function sortByPreference(list, pref) {
  const sorted = [...list];
  if (pref === 'alphabetical') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (pref === 'category') {
    return sorted.sort((a, b) =>
      (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name)
    );
  }
  if (pref === 'dosageForm') {
    return sorted.sort((a, b) =>
      (a.unitType || '').localeCompare(b.unitType || '') || a.name.localeCompare(b.name)
    );
  }
  return sorted.sort((a, b) => STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)]);
}

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

// ── CategoryChips ─────────────────────────────────────────────────────────────

function CategoryChips({ options, selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryScrollContent}
    >
      {['All', ...options].map(cat => {
        const isSelected = cat === 'All' ? selected === null : selected === cat;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
            onPress={() => onSelect(cat === 'All' ? null : cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── screen ─────────────────────────────────────────────────────────────────────

export default function AllStockScreen({ navigation }) {
  const { medicines } = useStore();
  const { sortPreference } = useAuth();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null); // null = All

  const q = query.trim().toLowerCase();
  const searching = q !== '';

  const sortedMeds = sortByPreference(medicines, sortPreference);

  const categoryFiltered = category
    ? sortedMeds.filter(m => m.category === category)
    : sortedMeds;

  const displayMeds = searching
    ? categoryFiltered.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.amharic.includes(query.trim()) ||
        m.code.toLowerCase().includes(q)
      )
    : categoryFiltered;

  const filtering = searching || category !== null;

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
        <TouchableOpacity
          onPress={() => navigation.navigate('AddMedicine')}
          style={styles.addBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
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

      <CategoryChips options={CATEGORIES} selected={category} onSelect={setCategory} />

      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        {filtering && (
          <Text style={styles.resultsLabel}>
            {displayMeds.length} results · {displayMeds.length} ውጤቶች
          </Text>
        )}

        {filtering && displayMeds.length === 0 ? (
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
  addBtn: { paddingBottom: 2 },

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

  // Category chips
  categoryScroll: {
    backgroundColor: '#F5F6F5',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  categoryScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
  },
  categoryChipSelected: {
    backgroundColor: '#1A5C35',
    borderColor: '#1A5C35',
  },
  categoryChipText: { fontSize: 12, color: '#666', fontWeight: '500' },
  categoryChipTextSelected: { color: '#fff' },

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
