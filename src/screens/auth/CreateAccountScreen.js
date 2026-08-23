import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { setPharmacyId } from '../../utils/syncEngine';

export default function CreateAccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  // Creates the pharmacy + profile row for a freshly-authenticated session
  // and moves on to PIN setup. Shared by the immediate-session signUp path
  // and the "I've confirmed" retry path below.
  async function finishAccountSetup() {
    const raw = await AsyncStorage.getItem('faray_pharmacy_profile');
    const profile = raw ? JSON.parse(raw) : {};

    const { data: pharmacyId, error: rpcError } = await supabase.rpc('create_pharmacy_and_profile', {
      pharmacy_name: profile.name || 'My Pharmacy',
      sort_pref:     profile.sortPreference ?? null,
    });
    if (rpcError) throw rpcError;

    await setPharmacyId(pharmacyId);
    navigation.navigate('SetPin');
  }

  async function handleCreate() {
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      const { data: { session }, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signUpError) throw signUpError;

      // If email confirmations are enabled in the Supabase dashboard, signUp
      // returns no session until the user clicks the confirmation link. The
      // email is confirmed server-side as soon as they click it, regardless
      // of where that link redirects — so we don't need to catch the
      // redirect at all, just let the user tap back in and retry sign-in.
      if (!session) {
        setAwaitingConfirm(true);
        setLoading(false);
        return;
      }

      await finishAccountSetup();
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmContinue() {
    setError('');
    setLoading(true);
    try {
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;

      await finishAccountSetup();
    } catch (e) {
      const notYetConfirmed = /confirm/i.test(e.message || '');
      setError(notYetConfirmed
        ? "Still not confirmed — check your email, tap the link, then try again."
        : (e.message || 'Something went wrong. Please try again.'));
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginRight: 12 }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>ፍሬ</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          {awaitingConfirm ? (
            <>
              <Text style={styles.title}>ኢሜይልዎን ያረጋግጡ</Text>
              <Text style={styles.subtitle}>
                We sent a confirmation link to {email.trim()}. Tap it, then come back here and continue.
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleConfirmContinue}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>I've confirmed · Continue</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setAwaitingConfirm(false); setError(''); }}
                style={styles.signInLink}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.signInText}>Wrong email? Go back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>መለያ ይፍጠሩ</Text>
              <Text style={styles.subtitle}>Create an account to back up your pharmacy data</Text>

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
                placeholder="At least 6 characters"
                placeholderTextColor="#C4C4C4"
                returnKeyType="next"
              />

              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder="Same password again"
                placeholderTextColor="#C4C4C4"
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>ቀጥል · Continue</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SignIn')}
                style={styles.signInLink}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.signInText}>Already have an account? Sign in</Text>
              </TouchableOpacity>
            </>
          )}
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

  body: { paddingHorizontal: 24, paddingTop: 32 },

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

  signInLink: { alignItems: 'center', marginTop: 18 },
  signInText: { fontSize: 11, color: '#888' },
});
