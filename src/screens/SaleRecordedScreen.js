import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

export default function SaleRecordedScreen({ navigation }) {
  const { currentTransaction, clearTransaction } = useStore();
  const insets = useSafeAreaInsets();

  const grandTotal = currentTransaction.reduce((sum, item) => sum + item.lineTotal, 0);

  function handleDoneAndPrint() {
    const txData = [...currentTransaction];
    const total = grandTotal;
    clearTransaction();
    navigation.navigate('Receipt', { transactions: txData, grandTotal: total });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Check circle */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>

        {/* Title — Amharic first, English below */}
        <View style={{ height: 12 }} />
        <Text style={styles.titleAmharic}>ሽያጭ ተመዝግቧል</Text>
        <Text style={styles.titleEnglish}>Sale Recorded</Text>

        {/* Transaction card */}
        <View style={{ height: 20 }} />
        <View style={styles.card}>
          {currentTransaction.map((item, index) => (
            <View key={index}>
              <View style={styles.itemBlock}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemAmharic}>{item.nameAmharic}</Text>
                  <Text style={styles.itemLineTotal}>ETB {item.lineTotal.toFixed(2)}</Text>
                </View>
                <Text style={styles.itemEnglish}>{item.nameEnglish}</Text>
                <Text style={styles.itemCalc}>
                  {item.quantity} units × ETB {item.pricePerUnit.toFixed(2)}
                </Text>
              </View>
              {index < currentTransaction.length - 1 && (
                <View style={styles.thinDivider} />
              )}
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ጠቅላላ · Total</Text>
            <Text style={styles.totalValue}>ETB {grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ height: 24 }} />
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('AllStock')}
          >
            <Text style={styles.outlineBtnIcon}>+</Text>
            <Text style={styles.outlineBtnText}>ሌላ መድሃኒት · Add another medicine</Text>
          </TouchableOpacity>

          <View style={{ height: 8 }} />

          <TouchableOpacity style={styles.filledBtn} onPress={handleDoneAndPrint}>
            <Feather name="printer" size={15} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.filledBtnText}>ጨርስና አትም · Done & Print</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAF3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 36, color: '#1A5C35', lineHeight: 42 },

  titleAmharic: { fontSize: 18, fontWeight: '500', color: '#111', textAlign: 'center' },
  titleEnglish: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 3 },

  card: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    padding: 16,
  },

  itemBlock: { paddingVertical: 10 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemAmharic: { fontSize: 14, fontWeight: '500', color: '#111', flex: 1, paddingRight: 8 },
  itemLineTotal: { fontSize: 13, fontWeight: '500', color: '#111' },
  itemEnglish: { fontSize: 11, color: '#888', marginTop: 2 },
  itemCalc: { fontSize: 11, color: '#888', marginTop: 2 },

  thinDivider: { height: 0.5, backgroundColor: '#E5E5E5' },
  divider: { height: 0.5, backgroundColor: '#D0D0D0', marginTop: 4, marginBottom: 12 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontWeight: '500', color: '#111' },
  totalValue: { fontSize: 26, fontWeight: '500', color: '#111' },

  buttons: { width: '100%' },

  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#1A5C35',
    borderRadius: 8,
    paddingVertical: 14,
  },
  outlineBtnIcon: { fontSize: 16, color: '#1A5C35', marginRight: 6, fontWeight: '600' },
  outlineBtnText: { fontSize: 13, fontWeight: '500', color: '#1A5C35' },

  filledBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A5C35',
    borderRadius: 8,
    paddingVertical: 14,
  },
  filledBtnText: { fontSize: 13, fontWeight: '500', color: '#fff' },
});
