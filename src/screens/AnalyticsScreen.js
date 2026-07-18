import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../context/StoreContext';
import { getWeeklyStats, getStockRisk, getTopSellers } from '../utils/salesInsights';
import { getExpiringSoon } from '../utils/batches';

export default function AnalyticsScreen({ navigation }) {
  const { medicines } = useStore();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const weekly = getWeeklyStats(medicines, now);
  const stockRisk = getStockRisk(medicines, now);
  const topSellers = getTopSellers(medicines, now, 5);
  const expiringSoon = getExpiringSoon(medicines, now);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>ትንታኔ · Analytics</Text>
          <Text style={styles.headerSub}>This week</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Stat cards */}
        <View style={styles.statCardRow}>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Weekly revenue</Text>
            <Text style={styles.statCardValue}>ETB {weekly.weeklyRevenue.toLocaleString()}</Text>
            <Text style={styles.statCardSub}>{weekly.medicineCount} medicines sold</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Units sold</Text>
            <Text style={styles.statCardValue}>{weekly.weeklyUnits}</Text>
            <Text style={styles.statCardSub}>last 7 days</Text>
          </View>
        </View>

        {/* Stock risk */}
        <Text style={styles.sectionTitle}>ክምችት አደጋ · Stock risk</Text>
        {stockRisk.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Feather name="check-circle" size={22} color="#1A5C35" />
            </View>
            <Text style={styles.emptyText}>ሁሉም ጥሩ ነው · All stock is OK</Text>
          </View>
        ) : (
          <View style={styles.sectionBody}>
            {stockRisk.map(({ medicine, daysUntilStockout }) => {
              const isDanger = medicine.stock === 0 || daysUntilStockout <= 2;
              return (
                <View
                  key={medicine.id}
                  style={[styles.riskRow, isDanger ? styles.riskRowDanger : styles.riskRowWarning]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.riskName, isDanger ? styles.dangerText : styles.warningText]}>
                      {medicine.amharic}
                    </Text>
                    <Text style={[styles.riskSub, isDanger ? styles.dangerText : styles.warningText]}>
                      Runs out in ~{daysUntilStockout} days
                    </Text>
                  </View>
                  <Text style={[styles.riskUnits, isDanger ? styles.dangerText : styles.warningText]}>
                    {medicine.stock} units left
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Expiring soon */}
        <Text style={styles.sectionTitle}>ማብቂያ ቀርቧል · Expiring soon</Text>
        {expiringSoon.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Feather name="check-circle" size={22} color="#1A5C35" />
            </View>
            <Text style={styles.emptyText}>ምንም የሚያበቃ የለም · Nothing expiring soon</Text>
          </View>
        ) : (
          <View style={styles.sectionBody}>
            {expiringSoon.map(({ medicine, batch, daysUntilExpiry, severity }) => {
              const isDanger = severity === 'expired' || severity === 'danger';
              return (
                <View
                  key={medicine.id}
                  style={[styles.riskRow, isDanger ? styles.riskRowDanger : styles.riskRowWarning]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.riskName, isDanger ? styles.dangerText : styles.warningText]}>
                      {medicine.amharic}
                    </Text>
                    <Text style={[styles.riskSub, isDanger ? styles.dangerText : styles.warningText]}>
                      {severity === 'expired' ? `Expired ${Math.abs(daysUntilExpiry)} days ago` : `Expires in ~${daysUntilExpiry} days`}
                    </Text>
                  </View>
                  <Text style={[styles.riskUnits, isDanger ? styles.dangerText : styles.warningText]}>
                    {batch.remainingQty} units
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Top sellers */}
        <Text style={styles.sectionTitle}>ምርጥ ሽያጭ · Top sellers this week</Text>
        {topSellers.length === 0 ? (
          <Text style={styles.noSalesText}>No sales recorded this week</Text>
        ) : (
          <View style={styles.sectionBody}>
            {topSellers.map((entry, i) => (
              <View key={entry.medicine.id} style={styles.sellerRow}>
                <View style={styles.sellerLeft}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.sellerName}>{entry.medicine.amharic}</Text>
                </View>
                <Text style={styles.sellerUnits}>{entry.units} units</Text>
              </View>
            ))}
          </View>
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
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },

  statCardRow: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 12,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F6F5',
    borderRadius: 8,
    padding: 8,
  },
  statCardLabel: { fontSize: 10, color: '#999' },
  statCardValue: { fontSize: 18, fontWeight: '500', color: '#111', marginTop: 3 },
  statCardSub: { fontSize: 10, color: '#999', marginTop: 2 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionBody: { paddingHorizontal: 12 },

  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  riskRowDanger: { backgroundColor: '#FFF5F5' },
  riskRowWarning: { backgroundColor: '#FDF3E2' },
  dangerText: { color: '#A32D2D' },
  warningText: { color: '#BA7517' },
  riskName: { fontSize: 11, fontWeight: '500' },
  riskSub: { fontSize: 10, opacity: 0.8, marginTop: 2 },
  riskUnits: { fontSize: 11, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EAF3DE',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  emptyText: { fontSize: 13, color: '#333' },

  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  sellerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankCircle: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EAF3DE',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  rankText: { fontSize: 10, fontWeight: '600', color: '#1A5C35' },
  sellerName: { fontSize: 11, color: '#111', flexShrink: 1 },
  sellerUnits: { fontSize: 11, color: '#999' },

  noSalesText: { fontSize: 12, color: '#999', textAlign: 'center', paddingVertical: 16 },
});
