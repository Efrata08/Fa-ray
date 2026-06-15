import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

const NUMPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '←'],
];

export default function SaleEntryScreen({ route, navigation }) {
  const { medicineId } = route.params;
  const { medicines, addToTransaction } = useStore();
  const insets = useSafeAreaInsets();

  const [qtyStr, setQtyStr] = useState('0');

  const med = medicines.find(m => m.id === medicineId);
  const qty = parseInt(qtyStr, 10) || 0;
  const total = qty * med.price;
  const canConfirm = qty > 0 && qty <= med.stock;

  function handleNumpad(key) {
    if (key === 'C') {
      setQtyStr('0');
    } else if (key === '←') {
      setQtyStr(prev => { const n = prev.slice(0, -1); return n === '' ? '0' : n; });
    } else {
      setQtyStr(prev => {
        if (prev === '0') return key;
        if (prev.length >= 4) return prev;
        return prev + key;
      });
    }
  }

  function handleMinus() {
    setQtyStr(prev => { const n = parseInt(prev, 10) || 0; return n > 0 ? String(n - 1) : '0'; });
  }

  function handlePlus() {
    setQtyStr(prev => String((parseInt(prev, 10) || 0) + 1));
  }

  function handleConfirm() {
    if (!canConfirm) return;
    addToTransaction({
      medicineId: med.id,
      nameEnglish: med.name,
      nameAmharic: med.amharic,
      code: med.code,
      quantity: qty,
      pricePerUnit: med.price,
      lineTotal: qty * med.price,
    });
    navigation.navigate('SaleRecorded');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>ሽያጭ · sale</Text>
          <Text style={styles.headerSub}>{med.name}</Text>
          <Text style={styles.headerAmharic}>{med.amharic}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.howMany}>How many sold?</Text>

        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={handleMinus} style={styles.circleBtn}>
            <Text style={styles.circleBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyDisplay}>{qtyStr}</Text>
          <TouchableOpacity onPress={handlePlus} style={styles.circleBtn}>
            <Text style={styles.circleBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.numpad}>
          {NUMPAD_ROWS.map((row, ri) => (
            <View key={ri} style={styles.numpadRow}>
              {row.map(key => (
                <TouchableOpacity
                  key={key}
                  style={styles.numKey}
                  onPress={() => handleNumpad(key)}
                  activeOpacity={0.55}
                >
                  <Text style={styles.numKeyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm}
        >
          <Text style={styles.confirmBtnText}>
            Confirm · −{qty} units · ETB {total}
          </Text>
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
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  backBtn: { marginRight: 12, paddingBottom: 2 },
  backArrow: { color: '#fff', fontSize: 22 },
  headerText: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500', marginTop: 3 },
  headerAmharic: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },

  body: { flex: 1, paddingHorizontal: 0 },
  howMany: { fontSize: 15, color: '#555', textAlign: 'center', marginTop: 24, marginBottom: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 24 },
  circleBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 0.5, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  circleBtnText: { fontSize: 26, color: '#1a1a1a', lineHeight: 30 },
  qtyDisplay: { fontSize: 64, fontWeight: '700', color: '#111', minWidth: 120, textAlign: 'center' },
  numpad: { borderTopWidth: 0.5, borderTopColor: '#E5E5E5' },
  numpadRow: { flexDirection: 'row' },
  numKey: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E5E5' },
  numKeyText: { fontSize: 22, color: '#111', fontWeight: '400' },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5E5' },
  confirmBtn: { backgroundColor: '#FFF5F5', borderWidth: 0.5, borderColor: '#A32D2D', borderRadius: 8, paddingVertical: 16, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  confirmBtnDisabled: { opacity: 0.35 },
  confirmBtnText: { color: '#A32D2D', fontSize: 15, fontWeight: '600' },
});
