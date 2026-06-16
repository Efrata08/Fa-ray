import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

function nowString() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${date}  ${h}:${min} ${ampm}`;
}

export default function ReceiptScreen({ route, navigation }) {
  const { transactions, grandTotal } = route.params;
  const { clearTransaction } = useStore();
  const insets = useSafeAreaInsets();

  function handleNewSale() {
    clearTransaction();
    navigation.navigate('StockList');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Receipt card */}
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.brand}>ፍሬ</Text>
          <Text style={styles.brandSub}>Your Pharmacy Name</Text>
          <View style={styles.dashedDivider} />

          {/* Items */}
          {transactions.map((item, index) => (
            <View key={index} style={styles.itemBlock}>
              <View style={styles.itemRow}>
                <Text style={styles.itemAmharic}>{item.nameAmharic}</Text>
                <Text style={styles.itemCalc}>
                  {item.quantity} × ETB {item.pricePerUnit.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.itemEnglish}>{item.nameEnglish}</Text>
            </View>
          ))}

          <View style={styles.dashedDivider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ጠቅላላ · Total</Text>
            <Text style={styles.totalValue}>ETB {grandTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.dashedDivider} />

          {/* Date */}
          <Text style={styles.dateText}>{nowString()}</Text>

          {/* Footer */}
          <Text style={styles.thankYou}>አመሰግናለሁ · Thank you</Text>

          <View style={styles.poweredDivider} />
          <Text style={styles.poweredBy}>Powered by ፍሬ</Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.printBtn} onPress={() => {}}>
          <Text style={styles.printBtnText}>ጨርስና አትም · Done & Print</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />

        <TouchableOpacity style={styles.newSaleBtn} onPress={handleNewSale}>
          <Text style={styles.newSaleBtnText}>አዲስ ሽያጭ · New Sale</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 },

  card: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
    alignItems: 'center',
  },

  brand: { fontSize: 26, fontWeight: '700', color: '#1A5C35', textAlign: 'center' },
  brandSub: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 14, textAlign: 'center' },

  dashedDivider: {
    width: '100%',
    borderStyle: 'dashed',
    borderTopWidth: 1,
    borderColor: '#C8C8C8',
    marginVertical: 12,
  },

  itemBlock: { width: '100%', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemAmharic: { fontSize: 13, fontWeight: '500', color: '#111', flex: 1, paddingRight: 8 },
  itemEnglish: { fontSize: 11, color: '#999', marginTop: 2 },
  itemCalc: { fontSize: 11, color: '#555' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '500', color: '#111' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#111' },

  dateText: { fontSize: 12, color: '#AAA', marginTop: 4, textAlign: 'center' },
  thankYou: { fontSize: 13, color: '#555', marginTop: 12, fontWeight: '500', textAlign: 'center' },
  poweredDivider: { height: 0.5, backgroundColor: '#E5E5E5', width: '100%', marginTop: 14 },
  poweredBy: { fontSize: 10, color: '#CCC', textAlign: 'center', marginTop: 6, marginBottom: 4 },

  printBtn: {
    width: '100%',
    backgroundColor: '#1A5C35',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  printBtnText: { fontSize: 14, fontWeight: '500', color: '#fff' },

  newSaleBtn: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#1A5C35',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newSaleBtnText: { fontSize: 14, fontWeight: '500', color: '#1A5C35' },
});
