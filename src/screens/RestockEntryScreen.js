import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, StatusBar, ScrollView, Platform, Modal,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

function formatExpiry(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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

export default function RestockEntryScreen({ route, navigation }) {
  const { medicineId } = route.params;
  const { medicines, recordRestock } = useStore();
  const insets = useSafeAreaInsets();

  const [qtyStr, setQtyStr] = useState('0');
  const [receipt, setReceipt] = useState(null); // { qty, total, time, expiryDate }
  const [expiryDate, setExpiryDate] = useState(null); // Date | null — optional per batch
  const [webExpiryText, setWebExpiryText] = useState(''); // YYYY-MM-DD, non-Android fallback only
  // Prompted up front, right when this screen opens — expiry is per-batch and
  // easy to forget once you're focused on typing a quantity, so it's asked
  // for before that, not left as a button someone has to remember to tap.
  const [showExpiryPrompt, setShowExpiryPrompt] = useState(true);

  const med = medicines.find(m => m.id === medicineId);
  const qty = parseInt(qtyStr, 10) || 0;
  const total = qty * med.price;
  const canConfirm = qty > 0;

  function handlePickExpiry() {
    const initial = expiryDate || new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        minimumDate: new Date(),
        onValueChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) setExpiryDate(selectedDate);
        },
      });
    } else {
      // Android is the real target (Play Store pilot); this text fallback
      // just keeps the surrounding flow testable/usable elsewhere. Built
      // from explicit Y/M/D components (local midnight), not `new
      // Date(string)` — a bare "YYYY-MM-DD" string parses as UTC midnight,
      // which displays as the previous day in any timezone behind UTC.
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(webExpiryText.trim());
      if (match) {
        const [, year, month, day] = match;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(parsed.getTime())) setExpiryDate(parsed);
      }
    }
  }

  function clearExpiry() {
    setExpiryDate(null);
    setWebExpiryText('');
  }

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
    const snap = { qty, total: qty * med.price, time: nowString(), expiryDate };
    recordRestock(med.id, qty, expiryDate ? expiryDate.toISOString() : null);
    setReceipt(snap);
  }

  function handleNewRestock() {
    setQtyStr('0');
    setReceipt(null);
    clearExpiry();
    setShowExpiryPrompt(true);
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
          <Text style={styles.receiptHeading}>Restock Recorded</Text>
          <Text style={styles.receiptHeadingAm}>ክምችት ተጨምሯል</Text>

          {/* Receipt card */}
          <View style={styles.card}>
            <Text style={styles.cardMedName}>{med.name}</Text>
            <Text style={styles.cardMedAmharic}>{med.amharic}</Text>
            <Text style={styles.cardCode}>{med.code}</Text>

            <View style={styles.cardDivider} />

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Units added</Text>
              <Text style={styles.cardValue}>{receipt.qty} units</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Price / unit</Text>
              <Text style={styles.cardValue}>ETB {med.price.toFixed(2)}</Text>
            </View>
            {receipt.expiryDate && (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Batch expiry</Text>
                <Text style={styles.cardValue}>{formatExpiry(receipt.expiryDate)}</Text>
              </View>
            )}

            <View style={styles.cardDivider} />

            <View style={styles.cardRow}>
              <Text style={styles.totalLabel}>Stock value added</Text>
              <Text style={styles.totalValue}>ETB {receipt.total.toFixed(2)}</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>New stock level</Text>
              <Text style={styles.cardValue}>{med.stock} units</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Recorded at</Text>
              <Text style={styles.cardValue}>{receipt.time}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.newRestockBtn} onPress={handleNewRestock}>
              <Text style={styles.newRestockBtnText}>New Restock</Text>
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

      {/* Expiry prompt — appears immediately when this screen opens, before
          quantity entry. Skippable (tap backdrop or "Skip"), since not every
          restock has a printed expiry on hand, but it's front-and-center
          instead of an easy-to-miss button. */}
      <Modal visible={showExpiryPrompt} transparent animationType="fade" onRequestClose={() => setShowExpiryPrompt(false)}>
        <TouchableOpacity style={ep.backdrop} activeOpacity={1} onPress={() => setShowExpiryPrompt(false)}>
          <TouchableOpacity style={ep.card} activeOpacity={1} onPress={() => {}}>
            <Text style={ep.icon}>📅</Text>
            <Text style={ep.title}>When does this batch expire?</Text>
            <Text style={ep.subtitle}>{med.name} · {med.amharic}</Text>

            {expiryDate ? (
              <>
                <View style={ep.setRow}>
                  <Text style={ep.setRowText}>Batch expires {formatExpiry(expiryDate)}</Text>
                </View>
                <TouchableOpacity style={ep.primaryBtn} onPress={() => setShowExpiryPrompt(false)}>
                  <Text style={ep.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePickExpiry}>
                  <Text style={ep.changeText}>Change date</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={ep.primaryBtn} onPress={handlePickExpiry}>
                  <Text style={ep.primaryBtnText}>Pick a date</Text>
                </TouchableOpacity>
                {Platform.OS !== 'android' && (
                  <TextInput
                    style={ep.webInput}
                    value={webExpiryText}
                    onChangeText={setWebExpiryText}
                    onSubmitEditing={handlePickExpiry}
                    placeholder="YYYY-MM-DD (dev/web only)"
                    placeholderTextColor="#BBB"
                  />
                )}
              </>
            )}

            <TouchableOpacity onPress={() => setShowExpiryPrompt(false)}>
              <Text style={ep.skipText}>Skip · I don't know</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>ክምችት መጨመር · restock</Text>
          <Text style={styles.headerSub}>{med.name}</Text>
          <Text style={styles.headerAmharic}>{med.amharic}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.howMany}>How many units added?</Text>

        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={handleMinus} style={styles.circleBtn}>
            <Text style={styles.circleBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyDisplay}>{qtyStr}</Text>
          <TouchableOpacity onPress={handlePlus} style={styles.circleBtn}>
            <Text style={styles.circleBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.expiryRow}>
          <TouchableOpacity style={styles.expiryBtn} onPress={handlePickExpiry} activeOpacity={0.7}>
            <Text style={styles.expiryBtnIcon}>📅</Text>
            <Text style={expiryDate ? styles.expiryBtnTextSet : styles.expiryBtnText}>
              {expiryDate ? `Batch expires ${formatExpiry(expiryDate)}` : 'Set batch expiry date (optional)'}
            </Text>
          </TouchableOpacity>
          {expiryDate && (
            <TouchableOpacity onPress={clearExpiry} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.expiryClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {Platform.OS !== 'android' && (
          <TextInput
            style={styles.webExpiryInput}
            value={webExpiryText}
            onChangeText={setWebExpiryText}
            onSubmitEditing={handlePickExpiry}
            placeholder="YYYY-MM-DD (dev/web only)"
            placeholderTextColor="#BBB"
          />
        )}

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
            Confirm · +{qty} units · ETB {total.toFixed(2)}
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
  body: { flex: 1 },
  howMany: { fontSize: 15, color: '#555', textAlign: 'center', marginTop: 24, marginBottom: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 24 },
  circleBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 0.5, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  circleBtnText: { fontSize: 26, color: '#1a1a1a', lineHeight: 30 },
  qtyDisplay: { fontSize: 64, fontWeight: '700', color: '#111', minWidth: 120, textAlign: 'center' },

  expiryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 16, paddingHorizontal: 16,
  },
  expiryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: '#D4D4D4', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  expiryBtnIcon: { fontSize: 13, marginRight: 6 },
  expiryBtnText: { fontSize: 12, color: '#888' },
  expiryBtnTextSet: { fontSize: 12, color: '#1A5C35', fontWeight: '600' },
  expiryClear: { fontSize: 14, color: '#BBB' },
  webExpiryInput: {
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 0.5, borderColor: '#D4D4D4', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#111',
  },

  numpad: { borderTopWidth: 0.5, borderTopColor: '#E5E5E5' },
  numpadRow: { flexDirection: 'row' },
  numKey: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E5E5' },
  numKeyText: { fontSize: 22, color: '#111', fontWeight: '400' },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5E5' },
  confirmBtn: { backgroundColor: '#F0F7EC', borderWidth: 0.5, borderColor: '#3B6D11', borderRadius: 8, paddingVertical: 16, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  confirmBtnDisabled: { opacity: 0.35 },
  confirmBtnText: { color: '#3B6D11', fontSize: 15, fontWeight: '600' },

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

  actionRow: { flexDirection: 'row', width: '100%' },
  newRestockBtn: { flex: 1, backgroundColor: '#F0F7EC', borderWidth: 0.5, borderColor: '#3B6D11', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginRight: 6 },
  newRestockBtnText: { color: '#3B6D11', fontSize: 14, fontWeight: '600' },
  doneBtn: { flex: 1, backgroundColor: '#1A5C35', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginLeft: 6 },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

// ── Expiry prompt modal ──────────────────────────────────────────────────────
const ep = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,20,14,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  icon: { fontSize: 28, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '600', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 3, marginBottom: 18 },

  primaryBtn: {
    backgroundColor: '#1A5C35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  setRow: {
    backgroundColor: '#F0F7EC',
    borderWidth: 0.5, borderColor: '#1A5C35',
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14,
    width: '100%', marginBottom: 12,
  },
  setRowText: { fontSize: 13, color: '#1A5C35', fontWeight: '600', textAlign: 'center' },

  changeText: { fontSize: 12, color: '#888', marginTop: 12, textDecorationLine: 'underline' },

  webInput: {
    marginTop: 12,
    width: '100%',
    borderWidth: 0.5, borderColor: '#D4D4D4', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#111', textAlign: 'center',
  },

  skipText: { fontSize: 12, color: '#BBB', marginTop: 18 },
});
