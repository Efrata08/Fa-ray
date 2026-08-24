import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// ── Auth state machine ────────────────────────────────────────────────────────
//
//  loading          — AsyncStorage / session check on startup
//  onboarding       — brand new device, no local setup
//  account_login    — known device (has setup_complete) but no local PIN,
//                     OR user tapped "Already have account?" from welcome
//                     OR user tapped "Sign in with email" from PIN screen
//  set_pin          — signed in via email on a new device; PIN not yet set
//  login            — returning device with a PIN, waiting for PIN entry
//  main             — fully authenticated and past PIN
//
// Transitions:
//   loading     → onboarding | login | account_login
//   onboarding  → (within-stack nav to CreateAccount / SignIn)
//                 completeOnboarding() → login
//   account_login → (within-stack nav to SignInScreen)
//                   onEmailSignIn() → login | set_pin
//   set_pin     → (within-stack: SetPin → ConfirmPin)
//                 loginSuccess() → main
//   login       → loginSuccess() → main
//                 showAccountLogin() → account_login
//   main        → logout() → login

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState]               = useState('loading');
  const [pharmacyName, setPharmacyName]         = useState('');
  const [sortPreference, setSortPreferenceState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [done, rawProfile, pin] = await Promise.all([
          AsyncStorage.getItem('faray_setup_complete'),
          AsyncStorage.getItem('faray_pharmacy_profile'),
          AsyncStorage.getItem('faray_pin'),
        ]);

        if (rawProfile) {
          try {
            const p = JSON.parse(rawProfile);
            setPharmacyName(p.name || '');
            setSortPreferenceState(p.sortPreference || null);
          } catch {}
        }

        if (done !== 'true') {
          setAuthState('onboarding');
          return;
        }

        if (pin) {
          // Existing device with a PIN — go straight to PIN login.
          setAuthState('login');
        } else {
          // Setup complete but no local PIN (e.g. device was wiped or new
          // install on a device that already has an account).
          setAuthState('account_login');
        }
      } catch {
        setAuthState('onboarding');
      }
    })();
  }, []);

  // ── Onboarding path ─────────────────────────────────────────────────────────

  async function completeOnboarding() {
    await AsyncStorage.setItem('faray_setup_complete', 'true');
    const raw = await AsyncStorage.getItem('faray_pharmacy_profile');
    if (raw) {
      try {
        const p = JSON.parse(raw);
        setPharmacyName(p.name || '');
        setSortPreferenceState(p.sortPreference || null);
      } catch {}
    }
    setAuthState('login');
  }

  // ── Email sign-in path (new device) ─────────────────────────────────────────

  // Called by SignInScreen after a successful Supabase sign-in.
  // Refreshes local state from AsyncStorage (bootstrapFromServer already wrote
  // the pharmacy profile there) and decides whether to ask for a PIN setup or
  // go straight to the PIN entry screen.
  async function onEmailSignIn() {
    await AsyncStorage.setItem('faray_setup_complete', 'true');
    const raw = await AsyncStorage.getItem('faray_pharmacy_profile');
    if (raw) {
      try {
        const p = JSON.parse(raw);
        setPharmacyName(p.name || '');
        setSortPreferenceState(p.sortPreference || null);
      } catch {}
    }
    const pin = await AsyncStorage.getItem('faray_pin');
    setAuthState(pin ? 'login' : 'set_pin');
  }

  // ── PIN paths ────────────────────────────────────────────────────────────────

  // After the correct PIN is entered (PinLoginScreen) OR after PIN setup is
  // complete on a new device (ConfirmPinScreen in set_pin state).
  function loginSuccess() {
    // Silently refresh the Supabase session so syncing keeps working. Don't
    // block the user if this fails — they're still authenticated locally.
    supabase.auth.refreshSession().catch(() => {});
    setAuthState('main');
  }

  // Sends the user to the email sign-in screen. Called from PinLoginScreen's
  // "Sign in with email" link (when user forgets PIN or is on a new device).
  function showAccountLogin() {
    setAuthState('account_login');
  }

  // ── Session management ───────────────────────────────────────────────────────

  function logout() {
    supabase.auth.signOut().catch(() => {});
    setAuthState('login');
  }

  async function resetToOnboarding() {
    await AsyncStorage.multiRemove([
      'faray_setup_complete',
      'faray_pharmacy_profile',
      'faray_pin',
      'faray_medicines',
    ]);
    await supabase.auth.signOut().catch(() => {});
    setPharmacyName('');
    setSortPreferenceState(null);
    setAuthState('onboarding');
  }

  // Kept for WelcomeScreen's existing "Already set up? Sign in" link which
  // previously called this (now it navigates to SignIn within the stack).
  function skipToLogin() {
    setAuthState('account_login');
  }

  return (
    <AuthContext.Provider value={{
      authState,
      pharmacyName,
      sortPreference,
      completeOnboarding,
      onEmailSignIn,
      loginSuccess,
      showAccountLogin,
      logout,
      resetToOnboarding,
      skipToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
