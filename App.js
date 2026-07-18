import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider } from './src/context/StoreContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Onboarding screens
import WelcomeScreen        from './src/screens/onboarding/WelcomeScreen';
import PharmacyProfileScreen from './src/screens/onboarding/PharmacyProfileScreen';
import SetPinScreen         from './src/screens/onboarding/SetPinScreen';
import ConfirmPinScreen     from './src/screens/onboarding/ConfirmPinScreen';
import BuildInventoryScreen from './src/screens/onboarding/BuildInventoryScreen';
import AllSetScreen         from './src/screens/onboarding/AllSetScreen';

// Auth
import PinLoginScreen from './src/screens/PinLoginScreen';

// Main app
import StockListScreen      from './src/screens/StockListScreen';
import AllStockScreen       from './src/screens/AllStockScreen';
import MedicineDetailScreen from './src/screens/MedicineDetailScreen';
import SaleEntryScreen      from './src/screens/SaleEntryScreen';
import RestockEntryScreen   from './src/screens/RestockEntryScreen';
import AnalyticsScreen      from './src/screens/AnalyticsScreen';
import AddMedicineScreen    from './src/screens/AddMedicineScreen';

// ── Notifications setup (module-level so handler is registered before any notification arrives)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();

// Renders screens conditionally based on auth state — React Navigation's recommended auth pattern.
// When authState changes, the navigator automatically unmounts old screens and resets.
function AppNavigator() {
  const { authState } = useAuth();

  // While AsyncStorage is being checked, show nothing to prevent a flash of wrong content.
  if (authState === 'loading') return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        {authState === 'onboarding' && (
          <>
            <Stack.Screen name="Welcome"          component={WelcomeScreen} />
            <Stack.Screen name="PharmacyProfile"  component={PharmacyProfileScreen} />
            <Stack.Screen name="SetPin"           component={SetPinScreen} />
            <Stack.Screen name="ConfirmPin"       component={ConfirmPinScreen} />
            <Stack.Screen name="BuildInventory"   component={BuildInventoryScreen} />
            <Stack.Screen name="AllSet"           component={AllSetScreen} />
          </>
        )}

        {authState === 'login' && (
          <Stack.Screen name="PinLogin" component={PinLoginScreen} />
        )}

        {authState === 'main' && (
          <>
            <Stack.Screen name="StockList"      component={StockListScreen} />
            <Stack.Screen name="AllStock"       component={AllStockScreen} />
            <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
            <Stack.Screen name="SaleEntry"      component={SaleEntryScreen} />
            <Stack.Screen name="RestockEntry"   component={RestockEntryScreen} />
            <Stack.Screen name="Analytics"      component={AnalyticsScreen} />
            <Stack.Screen name="AddMedicine"    component={AddMedicineScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    async function requestPermissions() {
      if (Device.isDevice) {
        await Notifications.requestPermissionsAsync();
      }
    }
    requestPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
