import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BottomBorderInput({ label, value, onChangeText, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, focused ? styles.fieldFocused : styles.fieldBlur]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor="#BBB"
        {...rest}
      />
    </View>
  );
}

export default function PharmacyProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName]         = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone]       = useState('');

  const canContinue = name.trim().length > 0;

  async function handleContinue() {
    if (!canContinue) return;
    await AsyncStorage.setItem('faray_pharmacy_profile', JSON.stringify({
      name: name.trim(),
      location: location.trim(),
      phone: phone.trim(),
    }));
    navigation.navigate('SetPin');
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
        <Text style={styles.stepLabel}>Step 1 of 4</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>የፋርማሲ መረጃ</Text>
          <Text style={styles.subtitle}>Pharmacy profile</Text>

          <BottomBorderInput
            label="የፋርማሲ ስም · Pharmacy name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Selam Pharmacy"
            autoFocus
          />
          <BottomBorderInput
            label="ቦታ · Location / City"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Addis Ababa, Bole"
          />
          <BottomBorderInput
            label="ስልክ · Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+251 ..."
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.continueBtnText}>ቀጥል · Continue</Text>
          </TouchableOpacity>
        </ScrollView>
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
  headerLeft:  { flexDirection: 'row', alignItems: 'center' },
  backArrow:   { color: '#fff', fontSize: 20 },
  brand:       { fontSize: 14, fontWeight: '500', color: '#fff' },
  stepLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  body: { padding: 16 },

  title:    { fontSize: 13, fontWeight: '500', color: '#111', marginBottom: 2 },
  subtitle: { fontSize: 11, color: '#888', marginBottom: 20 },

  fieldWrap:    { marginBottom: 24 },
  fieldLabel:   { fontSize: 10, color: '#888', marginBottom: 6 },
  fieldInput:   { fontSize: 14, color: '#111', paddingVertical: 10, paddingHorizontal: 0 },
  fieldFocused: { borderBottomWidth: 1.5, borderBottomColor: '#1A5C35' },
  fieldBlur:    { borderBottomWidth: 0.5, borderBottomColor: '#D4D4D4' },

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
