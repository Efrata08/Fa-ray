import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 'loading' | 'onboarding' | 'login' | 'main'
  const [authState, setAuthState] = useState('loading');
  const [pharmacyName, setPharmacyName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [done, rawProfile] = await Promise.all([
          AsyncStorage.getItem('faray_setup_complete'),
          AsyncStorage.getItem('faray_pharmacy_profile'),
        ]);
        if (rawProfile) {
          try { setPharmacyName(JSON.parse(rawProfile).name || ''); } catch {}
        }
        setAuthState(done === 'true' ? 'login' : 'onboarding');
      } catch {
        setAuthState('onboarding');
      }
    })();
  }, []);

  async function completeOnboarding() {
    await AsyncStorage.setItem('faray_setup_complete', 'true');
    const rawProfile = await AsyncStorage.getItem('faray_pharmacy_profile');
    if (rawProfile) {
      try { setPharmacyName(JSON.parse(rawProfile).name || ''); } catch {}
    }
    setAuthState('login');
  }

  function loginSuccess() {
    setAuthState('main');
  }

  function skipToLogin() {
    setAuthState('login');
  }

  function logout() {
    setAuthState('login');
  }

  async function resetToOnboarding() {
    await AsyncStorage.multiRemove([
      'faray_setup_complete',
      'faray_pharmacy_profile',
      'faray_pin',
      'faray_medicines',
    ]);
    setPharmacyName('');
    setAuthState('onboarding');
  }

  return (
    <AuthContext.Provider value={{ authState, pharmacyName, completeOnboarding, loginSuccess, skipToLogin, logout, resetToOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
