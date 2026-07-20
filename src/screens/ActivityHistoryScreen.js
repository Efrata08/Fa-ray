import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';

export default function ActivityHistoryScreen({ route, navigation }) {
  const { medicineId } = route.params;
  const { medicines } = useStore();
  const insets = useSafeAreaInsets();

  const med = medicines.find(m => m.id === medicineId);

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
          <Text style={styles.headerTitle}>Full history</Text>
          <Text style={styles.headerAmharic}>{med.amharic}</Text>
          <Text style={styles.headerSub}>{med.name} · {med.code}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {med.activity.length === 0 ? (
          <Text style={styles.activityEmpty}>No activity yet</Text>
        ) : (
          med.activity.map((entry, i, arr) => (
            <View
              key={i}
              style={[styles.activityRow, i < arr.length - 1 && styles.activitySep]}
            >
              <Text style={[styles.activityChange, { color: entry.type === 'sale' ? '#555' : '#3B6D11' }]}>
                {entry.type === 'sale' ? `−${entry.qty} sold` : `+${entry.qty} restocked`}
              </Text>
              <Text style={styles.activityTime}>{entry.displayTime}</Text>
            </View>
          ))
        )}
      </ScrollView>
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
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerAmharic: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  headerSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },

  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  activitySep: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  activityEmpty: { fontSize: 13, color: '#BBB', paddingHorizontal: 16, paddingVertical: 16 },
  activityChange: { fontSize: 14, fontWeight: '500' },
  activityTime: { fontSize: 13, color: '#999' },
});
