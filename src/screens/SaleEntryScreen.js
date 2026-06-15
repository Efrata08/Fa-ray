import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

const NUMPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '←'],
];

function nowString() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return `Today, ${h}:${m} ${ampm}`;
}

export default function SaleEntryScreen({ route, navigation }) {
  const { medicineId } = route.params;
  const { medicines, recordSale } = useStore();
  const insets = useSafeAreaInsets();

  const [qtyStr, setQtyStr] = useState('0');
  const [receipt, setReceipt] = useState(null); // { qty, total, time }

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
    // Snapshot values before state update changes them
    const snap = { qty, total: qty * med.price, time: nowString() };
    recordSale(med.id, qty);
    setReceipt(snap);
  }

  function handleNewSale() {
    setQtyStr('0');
    setReceipt(null);
  }

  // ── Receipt screen ──────────────────────────────────────────────────────────
  if (receipt) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.receiptScroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Success mark */}
          <Text style={styles.bigCheck}>✓</Text>
          <Text style={styles.receiptHeading}>Sale Recorded</Text>
          <Text style={styles.receiptHeadingAm}>ሽያጭ ተመዝግቧል</Text>

          {/* Receipt card */}
          <View style={styles.card}>
            {/* Medicine */}
            <Text style={styles.cardMedName}>{med.name}</Text>
            <Text style={styles.cardMedAmharic}>{med.amharic}</Text>
            <Text style={styles.cardCode}>{med.code}</Text>

            <View style={styles.cardDivider} />

            {/* Line items */}
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Qty sold</Text>
              <Text style={styles.cardValue}>{receipt.qty} units</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Price / unit</Text>
              <Text style={styles.cardValue}>ETB {med.price.toFixed(2)}</Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Total */}
            <View style={styles.cardRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>ETB {receipt.total.toFixed(2)}</Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Meta */}
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Remaining stock</Text>
              <Text style={styles.cardValue}>{med.stock} units</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Recorded at</Text>
              <Text style={styles.cardValue}>{receipt.time}</Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.printBtn} onPress={() => {}}>
            <Text style={styles.printBtnText}>🖨  Print Receipt</Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.newSaleBtn} onPress={handleNewSale}>
              <Text style={styles.newSaleBtnText}>New Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Entry screen ────────────────────────────────────────────────────────────
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

  // ── Header ──
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

  // ── Entry body ──
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

  // ── Receipt screen ──
  receiptScroll: { alignItems: 'center', paddingHorizontal: 20 },
  bigCheck: { fontSize: 64, color: '#3B6D11' },
  receiptHeading: { fontSize: 22, fontWeight: '700', color: '#3B6D11', marginTop: 6 },
  receiptHeadingAm: { fontSize: 14, color: '#3B6D11', opacity: 0.75, marginTop: 3, marginBottom: 20 },

  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  cardMedName: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardMedAmharic: { fontSize: 13, color: '#777', marginTop: 2 },
  cardCode: { fontSize: 11, color: '#AAA', marginTop: 2, marginBottom: 4 },
  cardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5E5', marginVertical: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  cardLabel: { fontSize: 13, color: '#888' },
  cardValue: { fontSize: 13, color: '#333', fontWeight: '500' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#1A5C35' },

  printBtn: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  printBtnText: { fontSize: 14, color: '#888', fontWeight: '500' },

  actionRow: { flexDirection: 'row', width: '100%' },
  newSaleBtn: { flex: 1, backgroundColor: '#F0F7EC', borderWidth: 0.5, borderColor: '#3B6D11', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginRight: 6 },
  newSaleBtnText: { color: '#3B6D11', fontSize: 14, fontWeight: '600' },
  doneBtn: { flex: 1, backgroundColor: '#1A5C35', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginLeft: 6 },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
