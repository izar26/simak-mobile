import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Text, TouchableOpacity, StatusBar, Image, Modal } from 'react-native';
import { WifiOff, RefreshCw, GraduationCap, XCircle } from 'lucide-react-native';
import './global.css';

import api from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import EditProfileScreen from './src/screens/main/EditProfileScreen';
import BerkasScreen from './src/screens/main/BerkasScreen';
import StudentCardScreen from './src/screens/main/StudentCardScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen'; // New Import
import { getToken } from './src/services/auth';

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

  const LOGO_URL = `${MAIN_APP_URL || 'https://simak.smakniscjr.sch.id'}/storage/logos/q3kO53UObFOXLV7d2dmYZIz8IhPRUE2CEkNHuLc5.png`;

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

  // --- SPLASH SCREEN & ERROR MODAL ---
  if (status === 'checking') {
    return (
      <View className="flex-1 bg-blue-600 justify-center items-center px-6">
        <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
        
        {/* === SPLASH SCREEN CONTENT === */}
        <View className="items-center justify-center w-full">
          {/* Logo Container */}
          <View className="bg-white p-6 rounded-full shadow-lg shadow-blue-900/50 mb-6">
             <Image 
                source={{ uri: LOGO_URL }}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
             />
          </View>
          
          {/* Title */}
          <View className="items-center">
            <Text className="text-white font-extrabold text-5xl tracking-[4px] text-center">
              SIMAK
            </Text>
            <View className="h-1 w-12 bg-white/30 rounded-full my-3" />
            <Text className="text-blue-50 text-sm font-semibold tracking-[1px] text-center uppercase px-4">
              Sistem Informasi Manajemen Akademik
            </Text>
          </View>
        </View>

        {/* Loading Indicator (Hidden if Error Modal is visible to reduce noise, or keep it) */}
        {!isErrorVisible && (
          <View className="absolute bottom-16 items-center w-full">
            <ActivityIndicator size="large" color="white" className="mb-4" />
            <Text className="text-blue-50 text-xs font-medium tracking-wider uppercase opacity-80">
              Memuat Data...
            </Text>
          </View>
        )}

        {/* === ERROR MODAL POPUP === */}
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
                <RefreshCw size={18} color="white" className="mr-2" />
                <Text className="text-white font-bold text-base">Coba Lagi</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </View>
    );
  }

  // --- MAIN APP ---
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} initialParams={{ schoolData }} />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="BerkasSaya" component={BerkasScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="KartuPelajar" component={StudentCardScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Notifikasi" component={NotificationScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Pengumuman" component={AnnouncementsScreen} options={{ animation: 'slide_from_right' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;