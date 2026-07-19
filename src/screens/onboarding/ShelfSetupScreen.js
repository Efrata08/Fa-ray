import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OPTIONS = [
  {
    key: 'alphabetical',
    icon: 'type',
    title: 'ፊደል ተራ · Alphabetical',
    subtitle: 'A–Z by medicine name',
  },
  {
    key: 'category',
    icon: 'layers',
    title: 'በዓይነት · By category',
    subtitle: 'Grouped by therapeutic type — Antibiotic, Cardiovascular, etc.',
  },
  {
    key: 'dosageForm',
    icon: 'package',
    title: 'በቅርጽ · By dosage form',
    subtitle: 'Grouped by tablet, syrup, injection, etc.',
  },
];

function OptionCard({ option, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Feather name={option.icon} size={18} color={selected ? '#fff' : '#1A5C35'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{option.title}</Text>
        <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ShelfSetupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState(null);

  async function handleContinue() {
    if (!choice) return;
    const rawProfile = await AsyncStorage.getItem('faray_pharmacy_profile');
    const profile = rawProfile ? JSON.parse(rawProfile) : {};
    await AsyncStorage.setItem('faray_pharmacy_profile', JSON.stringify({
      ...profile,
      sortPreference: choice,
    }));
    navigation.navigate('BuildInventory');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginRight: 12 }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>ፍሬ</Text>
        </View>
        <Text style={styles.stepLabel}>Step 3 of 4</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={styles.title}>መደርደሪያዎን እንዴት ያደራጃሉ?</Text>
        <Text style={styles.subtitle}>How do you organize your shelves?</Text>
        <Text style={styles.hint}>
          This sets how "All stock" is sorted by default — you can still browse by
          category with the filter chips regardless of what you pick here.
        </Text>

        {OPTIONS.map(opt => (
          <OptionCard
            key={opt.key}
            option={opt}
            selected={choice === opt.key}
            onPress={() => setChoice(opt.key)}
          />
        ))}

        <TouchableOpacity
          style={[styles.continueBtn, !choice && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!choice}
        >
          <Text style={styles.continueBtnText}>ቀጥል · Continue</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backArrow:  { color: '#fff', fontSize: 20 },
  brand:      { fontSize: 14, fontWeight: '500', color: '#fff' },
  stepLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  body: { padding: 16 },

  title:    { fontSize: 13, fontWeight: '500', color: '#111', marginBottom: 2 },
  subtitle: { fontSize: 11, color: '#888', marginBottom: 8 },
  hint:     { fontSize: 11, color: '#AAA', lineHeight: 16, marginBottom: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: '#1A5C35',
    backgroundColor: '#F0F7EC',
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EAF3DE',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapSelected: { backgroundColor: '#1A5C35' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#111' },
  cardSubtitle: { fontSize: 11, color: '#888', marginTop: 2, lineHeight: 15 },

  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D4D4D4',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },
  radioSelected: { borderColor: '#1A5C35' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A5C35' },

  continueBtn: {
    backgroundColor: '#1A5C35',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { fontSize: 14, fontWeight: '500', color: '#fff' },
});
