import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider } from './src/context/StoreContext';
import StockListScreen from './src/screens/StockListScreen';
import AllStockScreen from './src/screens/AllStockScreen';
import MedicineDetailScreen from './src/screens/MedicineDetailScreen';
import SaleEntryScreen from './src/screens/SaleEntryScreen';
import RestockEntryScreen from './src/screens/RestockEntryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
              <Stack.Screen name="StockList" component={StockListScreen} />
              <Stack.Screen name="AllStock" component={AllStockScreen} />
              <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
              <Stack.Screen name="SaleEntry" component={SaleEntryScreen} />
              <Stack.Screen name="RestockEntry" component={RestockEntryScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
