import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinPad from '../components/PinPad';
import { useAuth } from '../context/AuthContext';

function PinDots({ entered, error }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.dot,
            i < entered
              ? error ? styles.dotError : styles.dotFilled
              : styles.dotEmpty,
          ]}
        />
      ))}
    </View>
  );
}

export default function PinLoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginSuccess, pharmacyName } = useAuth();

  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked]   = useState(false);

  useFocusEffect(useCallback(() => {
    setPin('');
    setError('');
  }, []));

  useEffect(() => {
    if (pin.length === 4) checkPin();
  }, [pin]);

  async function checkPin() {
    const stored = await AsyncStorage.getItem('faray_pin');
    if (pin === stored) {
      loginSuccess();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setPin('');
    if (next >= 5) {
      setLocked(true);
      setError('');
      Alert.alert('Too many attempts', 'Please wait 30 seconds.', [{ text: 'OK' }]);
      setTimeout(() => {
        setLocked(false);
        setAttempts(0);
      }, 30000);
    } else {
      setError('Incorrect PIN. Try again.');
    }
  }

  function handleKey(key) {
    if (locked) return;
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      setError('');
    } else if (pin.length < 4) {
      setPin(p => p + key);
      setError('');
    }
  }

  function handleHelp() {
    Alert.alert('Recovery coming soon', '', [{ text: 'OK' }]);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Green top band */}
      <View style={[styles.topBand, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.brand}>ፍሬ</Text>
        {pharmacyName ? (
          <Text style={styles.bandSub}>{pharmacyName}</Text>
        ) : null}
      </View>

      {/* PIN body */}
      <View style={[styles.body, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>PIN ያስገቡ</Text>
        <Text style={styles.subtitle}>Enter your PIN</Text>

        <PinDots entered={pin.length} error={!!error} />

        <PinPad
          onKey={handleKey}
          disabled={locked}
          leftAction={{ label: 'እርዳታ', onPress: handleHelp }}
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : locked ? (
          <Text style={styles.lockedText}>Locked. Please wait 30 seconds.</Text>
        ) : (
          <View style={{ height: 18 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  topBand: {
    backgroundColor: '#1A5C35',
    paddingBottom: 18,
    alignItems: 'center',
  },
  brand:   { fontSize: 20, fontWeight: '500', color: '#fff', letterSpacing: 1 },
  bandSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title:    { fontSize: 13, fontWeight: '500', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 18 },

  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  dot:      { width: 14, height: 14, borderRadius: 7 },
  dotFilled:{ backgroundColor: '#1A5C35' },
  dotError: { backgroundColor: '#A32D2D' },
  dotEmpty: { borderWidth: 1.5, borderColor: '#D4D4D4' },

  errorText:  { fontSize: 11, color: '#A32D2D', marginTop: 10, textAlign: 'center' },
  lockedText: { fontSize: 11, color: '#888', marginTop: 10, textAlign: 'center' },
});
