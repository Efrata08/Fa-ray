import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function AllSetScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const [pharmacyName, setPharmacyName] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('faray_pharmacy_profile').then(raw => {
      if (!raw) return;
      try { setPharmacyName(JSON.parse(raw).name || ''); } catch {}
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Header — no back button */}
      <View style={styles.header}>
        <Text style={styles.brand}>ፍሬ</Text>
      </View>

      {/* Body */}
      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.checkCircle}>
          <Feather name="check-circle" size={26} color="#1A5C35" />
        </View>

        <Text style={styles.title}>ተዘጋጅተዋል!</Text>
        <Text style={styles.subtitle}>You're all set</Text>
        {pharmacyName ? (
          <Text style={styles.pharmacyNote}>{pharmacyName} is ready</Text>
        ) : null}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoHeading}>What happens next</Text>
          <Text style={styles.infoLine}>· Prices are set on your first sale</Text>
          <Text style={styles.infoLine}>· Add more medicines anytime from profile</Text>
          <Text style={styles.infoLine}>· Alerts fire when stock runs low</Text>
        </View>

        <TouchableOpacity
          style={styles.openBtn}
          onPress={completeOnboarding}
          activeOpacity={0.8}
        >
          <Text style={styles.openBtnText}>ፍሬ ክፈት · Open ፍሬ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#1A5C35',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brand: { fontSize: 14, fontWeight: '500', color: '#fff' },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  checkCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#EAF3DE',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },

  title:        { fontSize: 15, fontWeight: '500', color: '#111', textAlign: 'center' },
  subtitle:     { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 4 },
  pharmacyNote: { fontSize: 11, color: '#BBB', textAlign: 'center', marginTop: 4, marginBottom: 20 },

  infoCard: {
    backgroundColor: '#F5F6F5',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  infoHeading: { fontSize: 10, color: '#888', marginBottom: 6 },
  infoLine:    { fontSize: 10, color: '#888', lineHeight: 17 },

  openBtn: {
    backgroundColor: '#1A5C35',
    borderRadius: 10,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
  },
  openBtnText: { fontSize: 14, fontWeight: '500', color: '#fff' },
});
