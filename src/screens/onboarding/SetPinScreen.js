import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinPad from '../../components/PinPad';

function PinDots({ entered }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[styles.dot, i < entered ? styles.dotFilled : styles.dotEmpty]} />
      ))}
    </View>
  );
}

export default function SetPinScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');

  // Reset when screen regains focus (e.g. user navigates back from ConfirmPin)
  useFocusEffect(useCallback(() => { setPin(''); }, []));

  useEffect(() => {
    if (pin.length === 4) {
      const t = setTimeout(() => navigation.navigate('ConfirmPin', { pin }), 120);
      return () => clearTimeout(t);
    }
  }, [pin]);

  function handleKey(key) {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(p => p + key);
    }
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
        <Text style={styles.stepLabel}>Step 2 of 3</Text>
      </View>

      {/* Body */}
      <View style={[styles.body, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>PIN ያዘጋጁ</Text>
        <Text style={styles.subtitle}>Create your 4-digit PIN</Text>

        <PinDots entered={pin.length} />
        <PinPad onKey={handleKey} />

        <Text style={styles.warning}>
          Write this down — there is no recovery option
        </Text>
      </View>
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

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title:    { fontSize: 13, fontWeight: '500', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 20 },

  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  dot:      { width: 14, height: 14, borderRadius: 7 },
  dotFilled:{ backgroundColor: '#1A5C35' },
  dotEmpty: { borderWidth: 1.5, borderColor: '#D4D4D4' },

  warning: { fontSize: 10, color: '#BBB', textAlign: 'center', marginTop: 10 },
});
