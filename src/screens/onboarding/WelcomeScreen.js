import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function WelcomeScreen({ navigation }) {
  const { skipToLogin } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

      {/* Top 40% — green brand section */}
      <View style={styles.topSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoChar}>ፍ</Text>
        </View>
        <Text style={styles.logoTitle}>ፍሬ</Text>
        <Text style={styles.logoSub}>FA-RAY</Text>
      </View>

      {/* Bottom 60% — white */}
      <View style={styles.bottomSection}>
        <Text style={styles.welcome}>እንኳን ደህና መጡ</Text>
        <Text style={styles.tagline}>Smart inventory for Ethiopian pharmacies</Text>
        <Text style={styles.taglineAm}>ለኢትዮጵያ ፋርማሲዎች</Text>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('PharmacyProfile')}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>ጀምር · Get started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInLink}
          onPress={skipToLogin}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.signInText}>Already set up? Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A5C35' },

  topSection: {
    height: SCREEN_HEIGHT * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoChar:  { fontSize: 26, color: '#fff', fontWeight: '500' },
  logoTitle: { fontSize: 22, color: '#fff', fontWeight: '500', letterSpacing: 1, marginTop: 14 },
  logoSub:   { fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 3, marginTop: 4 },

  bottomSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 36,
    alignItems: 'center',
  },
  welcome:   { fontSize: 14, fontWeight: '500', color: '#111', textAlign: 'center' },
  tagline:   { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
  taglineAm: { fontSize: 11, color: '#888', textAlign: 'center' },

  startBtn: {
    backgroundColor: '#1A5C35',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
  },
  startBtnText: { fontSize: 14, fontWeight: '500', color: '#fff' },

  signInLink: { marginTop: 16 },
  signInText: { fontSize: 11, color: '#888' },
});
