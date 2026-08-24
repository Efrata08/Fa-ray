import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { setPharmacyId } from '../../utils/syncEngine';
import { useAuth } from '../../context/AuthContext';

// Pulls the pharmacy name and medicines down from the server and stores them
// locally so the app has data to work with on this new device.
async function bootstrapFromServer(pharmacyId) {
  const [{ data: pharmacy }, { data: medicines }] = await Promise.all([
    supabase.from('pharmacies').select('name, sort_preference').eq('id', pharmacyId).single(),
    supabase.from('medicines').select('*').eq('pharmacy_id', pharmacyId).eq('is_active', true),
  ]);

  if (pharmacy) {
    await AsyncStorage.setItem('faray_pharmacy_profile', JSON.stringify({
      name:           pharmacy.name,
      sortPreference: pharmacy.sort_preference,
    }));
  }

  if (medicines?.length) {
    // Map server column names back to the local shape used by StoreContext.
    const local = medicines.map(m => ({
      id:       m.id,
      name:     m.name,
      amharic:  m.amharic  ?? '',
      code:     m.code     ?? '',
      stock:    m.stock,
      reorder:  m.reorder_point,
      price:    parseFloat(m.price),
      activity: [],
      batches:  [],
    }));
    await AsyncStorage.setItem('faray_medicines', JSON.stringify(local));
  }
}

export default function SignInScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { onEmailSignIn } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSignIn() {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;

      // Find which pharmacy this user belongs to
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('pharmacy_id')
        .eq('id', session.user.id)
        .single();
      if (profileError) throw profileError;

      await setPharmacyId(profile.pharmacy_id);
      await bootstrapFromServer(profile.pharmacy_id);

      // onEmailSignIn checks if a local PIN exists:
      // - yes → go to login (PIN screen, session already refreshed above)
      // - no  → go to set_pin (new device, needs PIN setup)
      await onEmailSignIn();
    } catch (e) {
      setError(e.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1A5C35" />

        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 12 }}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.brand}>ፍሬ</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>ይግቡ</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#C4C4C4"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
            placeholderTextColor="#C4C4C4"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>ይግቡ · Sign in</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#1A5C35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backArrow: { color: '#fff', fontSize: 20 },
  brand:     { fontSize: 14, fontWeight: '500', color: '#fff' },

  body: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title:    { fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#888', marginBottom: 28 },

  label: { fontSize: 11, color: '#555', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: '#111',
  },

  errorText: { fontSize: 11, color: '#A32D2D', marginTop: 12 },

  btn: {
    backgroundColor: '#1A5C35',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 14, fontWeight: '500', color: '#fff' },
});
