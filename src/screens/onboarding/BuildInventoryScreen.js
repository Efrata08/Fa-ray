import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../context/StoreContext';

function Chip({ med, onRemove }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{med.amharic}</Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={{ marginLeft: 4 }}
      >
        <Feather name="x" size={10} color="#1A5C35" />
      </TouchableOpacity>
    </View>
  );
}

function SuggestionRow({ med, onAdd }) {
  return (
    <TouchableOpacity style={styles.suggRow} onPress={onAdd} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.suggAmharic}>{med.amharic}</Text>
        <Text style={styles.suggEnglish}>{med.name}</Text>
      </View>
      <Feather name="plus" size={16} color="#1A5C35" />
    </TouchableOpacity>
  );
}

export default function BuildInventoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { medicines } = useStore();

  const [selected, setSelected]         = useState([]);
  const [query, setQuery]               = useState('');
  const [showCustom, setShowCustom]     = useState(false);
  const [customAm, setCustomAm]         = useState('');
  const [customEn, setCustomEn]         = useState('');

  const selectedIds = new Set(selected.map(m => m.id));

  const q = query.trim().toLowerCase();
  const available = medicines
    .filter(m => !selectedIds.has(m.id))
    .filter(m =>
      q === '' ||
      m.name.toLowerCase().includes(q) ||
      m.amharic.includes(query.trim()) ||
      m.code.toLowerCase().includes(q)
    );

  function addMed(med) {
    setSelected(prev => [...prev, med]);
  }

  function removeMed(id) {
    setSelected(prev => prev.filter(m => m.id !== id));
  }

  function addCustom() {
    if (!customAm.trim()) return;
    const item = {
      id: `custom_${Date.now()}`,
      name: customEn.trim() || customAm.trim(),
      amharic: customAm.trim(),
      code: 'CUSTOM',
      stock: 0, reorder: 5, price: 0, activity: [],
    };
    setSelected(prev => [...prev, item]);
    setCustomAm('');
    setCustomEn('');
    setShowCustom(false);
  }

  async function handleDone() {
    await AsyncStorage.setItem('faray_medicines', JSON.stringify(selected));
    navigation.navigate('AllSet');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.brand}>ፍሬ</Text>
        <Text style={styles.stepLabel}>Step 3 of 3</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Static top area */}
        <View style={styles.topArea}>
          <Text style={styles.title}>ክምችትዎን ያዋቅሩ</Text>
          <Text style={styles.subtitle}>Add the medicines you carry</Text>

          {/* Search */}
          <View style={styles.searchRow}>
            <Feather name="search" size={13} color="#BBB" style={{ marginRight: 7 }} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="መድሃኒት ፈልግ · Search medicines"
              placeholderTextColor="#BBB"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 13, color: '#BBB' }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Selected chips */}
          {selected.length > 0 && (
            <View style={styles.chipsSection}>
              <Text style={styles.addedLabel}>Added ({selected.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {selected.map(m => (
                  <Chip key={m.id} med={m} onRemove={() => removeMed(m.id)} />
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.sectionHint}>Common medicines · tap to add</Text>
        </View>

        {/* Scrollable medicine list */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {available.map(med => (
            <SuggestionRow key={med.id} med={med} onAdd={() => addMed(med)} />
          ))}

          {/* Add custom */}
          <TouchableOpacity
            style={styles.customRow}
            onPress={() => setShowCustom(v => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.customRowText}>ሌላ ነገር · Add custom item</Text>
            <Feather name="plus" size={16} color="#1A5C35" />
          </TouchableOpacity>

          {showCustom && (
            <View style={styles.customForm}>
              <TextInput
                style={styles.customInput}
                value={customAm}
                onChangeText={setCustomAm}
                placeholder="Amharic name"
                placeholderTextColor="#BBB"
                autoFocus
              />
              <TextInput
                style={[styles.customInput, { marginTop: 8 }]}
                value={customEn}
                onChangeText={setCustomEn}
                placeholder="English name (optional)"
                placeholderTextColor="#BBB"
              />
              <TouchableOpacity
                style={[styles.customAddBtn, !customAm.trim() && { opacity: 0.4 }]}
                onPress={addCustom}
                disabled={!customAm.trim()}
              >
                <Text style={styles.customAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Fixed footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>ጨርስ · Done</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#1A5C35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backArrow: { color: '#fff', fontSize: 20 },
  brand:     { fontSize: 14, fontWeight: '500', color: '#fff' },
  stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  topArea: { paddingHorizontal: 12, paddingTop: 12 },

  title:    { fontSize: 13, fontWeight: '500', color: '#111' },
  subtitle: { fontSize: 11, color: '#888', marginBottom: 10 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F6F5',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 0.5, borderColor: '#E5E5E5',
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111', paddingVertical: 0, height: 20 },

  chipsSection:  { marginBottom: 8 },
  addedLabel:    { fontSize: 10, color: '#888', marginBottom: 4 },
  chipsScroll:   { flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EAF3DE',
    borderWidth: 0.5, borderColor: '#1A5C35',
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8,
    marginRight: 6,
  },
  chipText: { fontSize: 10, color: '#1A5C35' },

  sectionHint: { fontSize: 10, color: '#AAA', marginBottom: 4 },

  suggRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#EBEBEB',
  },
  suggAmharic: { fontSize: 11, fontWeight: '500', color: '#111' },
  suggEnglish: { fontSize: 10, color: '#999', marginTop: 1 },

  customRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EBEBEB',
  },
  customRowText: { fontSize: 11, color: '#1A5C35', fontWeight: '500' },

  customForm: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F9F9F9' },
  customInput: {
    borderBottomWidth: 1, borderBottomColor: '#D4D4D4',
    paddingVertical: 8, fontSize: 13, color: '#111',
  },
  customAddBtn: {
    marginTop: 10, backgroundColor: '#1A5C35',
    borderRadius: 6, paddingVertical: 10, alignItems: 'center',
  },
  customAddBtnText: { fontSize: 13, fontWeight: '500', color: '#fff' },

  footer: { paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#E5E5E5' },
  doneBtn: {
    backgroundColor: '#1A5C35', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  doneBtnText: { fontSize: 14, fontWeight: '500', color: '#fff' },
});
