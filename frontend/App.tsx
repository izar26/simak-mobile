import React, { useEffect, useState, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import {
  WifiOff,
  RefreshCw,
  GraduationCap,
  XCircle,
} from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';
import './global.css';

import api from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import EditProfileScreen from './src/screens/main/EditProfileScreen';
import BerkasScreen from './src/screens/main/BerkasScreen';
import StudentCardScreen from './src/screens/main/StudentCardScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import PelanggaranScreen from './src/screens/main/PelanggaranScreen';
import AnnouncementDetailScreen from './src/screens/AnnouncementDetailScreen'; // New
import KeuanganScreen from './src/screens/main/KeuanganScreen';
import UnduhanScreen from './src/screens/main/UnduhanScreen';
import { getToken } from './src/services/auth';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { API_URL, MAIN_APP_URL } from '@env';

const Stack = createNativeStackNavigator();

function App() {
  // Status: 'checking' (splash screen) or 'connected' (main app)
  // Error handling is now done via a popup modal on top of 'checking'
  const [status, setStatus] = useState<'checking' | 'connected'>('checking');
  const [initialRoute, setInitialRoute] = useState('Login');
  const [schoolData, setSchoolData] = useState(null); // Data sekolah untuk LoginScreen

  // Error Modal State
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const LOGO_URL = `${
    MAIN_APP_URL || 'https://simak.smakniscjr.sch.id'
  }/storage/logos/q3kO53UObFOXLV7d2dmYZIz8IhPRUE2CEkNHuLc5.png`;

  const initializeApp = useCallback(async () => {
    setStatus('checking');
    setIsErrorVisible(false); // Hide error modal when retrying

    try {
      console.log('Checking connection...');

      // Health check endpoint & Get School Data
      const response = await api.get('/sekolah', { timeout: 10000 });
      setSchoolData(response.data); // Simpan data sekolah
      console.log('Connected.');

      // Check Token
      const token = await getToken();
      if (token) {
        setInitialRoute('MainTabs');
      } else {
        setInitialRoute('Login');
      }

      setStatus('connected');
    } catch (error: any) {
      console.log('Connection Error:', error);

      // User-friendly error messages
      let message = 'Gagal terhubung ke server sekolah.';
      if (error.code === 'ECONNABORTED') {
        message = 'Koneksi terlalu lambat. Silakan cek sinyal Anda.';
      } else if (error.message === 'Network Error') {
        message = 'Tidak ada koneksi internet. Pastikan WiFi/Data aktif.';
      } else if (error.response && error.response.status >= 500) {
        message = 'Server sekolah sedang dalam perbaikan.';
      }

      setErrorMessage(message);
      setIsErrorVisible(true); // Show modal instead of changing screen
      // Note: We stay in 'checking' status to keep the Splash Screen visible
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Global listener: when token/session expired on API layer,
  // transition back to login/check state and re-initialize.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('auth:expired', () => {
      // Clear cached user and force re-check
      AsyncStorage.removeItem('user').catch(() => {});
      initializeApp();
    });
    return () => sub.remove();
  }, [initializeApp]);

  // --- TAMPILAN: LOADING CHECK (SPLASH SCREEN) ---
  if (status === 'checking') {
    return (
      <View className="flex-1 bg-blue-600 justify-center items-center px-6">
        <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

        {/* Animated Loading Lottie */}
        <View className="w-64 h-64 items-center justify-center">
          <LottieView
            source={require('./src/assets/animations/Book loading.json')}
            autoPlay
            loop
            style={{ width: '100%', height: '100%' }}
          />
        </View>

        {/* Title */}
        <View className="items-center -mt-10">
          <Text className="text-white font-extrabold text-5xl tracking-[4px] text-center">
            SIMAK
          </Text>
          <View className="h-1.5 w-16 bg-white/30 rounded-full my-4" />
          <Text className="text-blue-50 text-xs font-black tracking-[2px] text-center uppercase px-4 opacity-80">
            Sistem Informasi Manajemen Akademik
          </Text>
        </View>

        {/* Floating Text Indicator */}
        <View className="absolute bottom-16 items-center w-full">
          <Text className="text-white text-[10px] font-bold tracking-[3px] uppercase opacity-60">
            Menyiapkan Sistem
          </Text>
        </View>

        {/* ERROR MODAL TETAP ADA DI SINI */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isErrorVisible}
          onRequestClose={() => {}} // Prevent hardware back button closing it without action
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-2xl">
              {/* Icon Error */}
              <View className="bg-red-50 p-4 rounded-full mb-4">
                <WifiOff size={32} color="#ef4444" />
              </View>

              {/* Title */}
              <Text className="text-slate-800 font-bold text-xl mb-2 text-center">
                Gagal Terhubung
              </Text>

              {/* Message */}
              <Text className="text-slate-500 text-center text-sm leading-5 mb-6 px-2">
                {errorMessage}
              </Text>

              {/* Action Button */}
              <TouchableOpacity
                onPress={initializeApp}
                className="bg-blue-600 w-full py-3.5 rounded-xl flex-row justify-center items-center active:bg-blue-700"
              >
                <RefreshCw size={18} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base">
                  Coba Lagi
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // --- TAMPILAN: APLIKASI UTAMA ---
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <BottomSheetModalProvider>
            <Stack.Navigator
              initialRouteName={initialRoute}
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="BerkasSaya"
                component={BerkasScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="KartuPelajar"
                component={StudentCardScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="Notifikasi"
                component={NotificationScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="Pengumuman"
                component={AnnouncementsScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="Pelanggaran"
                component={PelanggaranScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="DetailPengumuman"
                component={AnnouncementDetailScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="Keuangan"
                component={KeuanganScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="Unduhan"
                component={UnduhanScreen}
                options={{ animation: 'slide_from_right' }}
              />
            </Stack.Navigator>
          </BottomSheetModalProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
