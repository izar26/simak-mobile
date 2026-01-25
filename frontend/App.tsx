import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Text, TouchableOpacity, StatusBar, Image } from 'react-native';
import { WifiOff, RefreshCw, Server } from 'lucide-react-native';
import axios from 'axios'; // Import axios langsung untuk tes Google
import './global.css';

import api from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import EditProfileScreen from './src/screens/main/EditProfileScreen';
import BerkasScreen from './src/screens/main/BerkasScreen';
import StudentCardScreen from './src/screens/main/StudentCardScreen';
import { getToken } from './src/services/auth';

import { API_URL } from '@env';

const Stack = createNativeStackNavigator();

function App() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [initialRoute, setInitialRoute] = useState('Login');
  const [errorMsg, setErrorMsg] = useState('');

  const initializeApp = useCallback(async () => {
    setStatus('checking');
    setErrorMsg('');

    try {
      console.log('Current API_URL:', API_URL); // Verify env var
      // DIAGNOSTIC STEP: Cek koneksi ke Server Sekolah langsung
      console.log('Checking connection to School Server...');
      
      // Menggunakan endpoint /sekolah sebagai health check
      await api.get('/sekolah', { timeout: 10000 });
      console.log('School Server Connected.');

      // 2. Jika koneksi OK, cek Token Login
      const token = await getToken();
      if (token) {
        setInitialRoute('MainTabs');
      } else {
        setInitialRoute('Login');
      }

      setStatus('connected');
    } catch (error: any) {
      console.log('Connection Error:', error);
      let message = 'Gagal terhubung ke internet.';
      let debugInfo = error.message;

      if (error.code === 'ECONNABORTED') {
        message = 'Koneksi lambat (timeout). Cek internet Anda.';
      } else if (error.message === 'Network Error') {
        message = 'Tidak ada koneksi internet (Cek Kuota/WiFi).';
      } else if (error.response) {
         message = `Server Error: ${error.response.status}`;
         debugInfo = JSON.stringify(error.response.data);
      }

      setErrorMsg(`${message}\n\nDebug: ${debugInfo}\nTarget: google.com`);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // --- TAMPILAN: LOADING CHECK ---
  if (status === 'checking') {
    return (
      <View className="flex-1 bg-blue-600 justify-center items-center p-6">
        <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
        <View className="bg-white p-5 rounded-full mb-6 shadow-lg shadow-blue-900/30">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
        <Text className="text-white font-bold text-lg mb-2">Menghubungkan...</Text>
        <Text className="text-blue-100 text-sm text-center">
          Sedang memeriksa koneksi ke server sekolah.
        </Text>
      </View>
    );
  }

  // --- TAMPILAN: ERROR KONEKSI ---
  if (status === 'error') {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center p-8">
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        
        <View className="w-40 h-40 bg-red-50 rounded-full items-center justify-center mb-8 border border-red-100">
          <WifiOff size={64} color="#ef4444" />
        </View>

        <Text className="text-slate-800 font-black text-2xl mb-3 text-center">
          Koneksi Bermasalah
        </Text>
        
        <Text className="text-slate-500 text-center leading-6 mb-10 px-4">
          {errorMsg || 'Aplikasi tidak dapat menghubungi server. Pastikan internet Anda aktif dan stabil.'}
        </Text>

        <TouchableOpacity 
          onPress={initializeApp}
          className="bg-blue-600 w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-blue-200"
          activeOpacity={0.8}
        >
          <RefreshCw size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">Coba Lagi</Text>
        </TouchableOpacity>

        <View className="mt-8 flex-row items-center">
           <Server size={14} color="#94a3b8" />
           <Text className="text-slate-400 text-xs ml-2">Server: simak.smakniscjr.sch.id</Text>
        </View>
      </View>
    );
  }

  // --- TAMPILAN: APLIKASI UTAMA ---
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="BerkasSaya" component={BerkasScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="KartuPelajar" component={StudentCardScreen} options={{ animation: 'slide_from_bottom' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;