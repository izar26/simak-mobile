import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { School, Building, ArrowRight } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '../components/Toast';
import LinearGradient from 'react-native-linear-gradient';
import { handleApiError, logError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { URL_ADMIN, X_ADMIN_ACCESS_KEY, URL_ADMIN_HEXANUSA_KEY, X_ADMIN_HEXANUSA_KEY } from '@env';

const { width } = Dimensions.get('window');

const NpsnScreen = ({ navigation }: any) => {
  const [npsn, setNpsn] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'error',
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'error') => {
      setToast({ visible: true, message, type });
    },
    [],
  );

  const handleVerifyNpsn = useCallback(async () => {
    if (!npsn.trim()) {
      showToast('NPSN tidak boleh kosong', 'error');
      return;
    }

    setLoading(true);
    try {
      logger.info('NpsnScreen', `Verifying NPSN: ${npsn}`);
      
      // 1. Dapatkan daftar API dari Central Hub Hexanusa
      const hexanusaResponse = await fetch(URL_ADMIN_HEXANUSA_KEY, {
        headers: { 'X-Admin-Hexanusa-Key': X_ADMIN_HEXANUSA_KEY }
      });
      const hexanusaResult = await hexanusaResponse.json();
      let servers = hexanusaResult.data || [];

      // Sisipkan server dari .env sebagai fallback (untuk developer/localhost)
      if (URL_ADMIN && X_ADMIN_ACCESS_KEY) {
        servers.push({
           isLocalFallback: true,
           access: X_ADMIN_ACCESS_KEY
        });
      }

      let foundSchool: any = null;
      let validApiDomain: string | null = null;

      // 2. Loop Concurrent ke seluruh server untuk mencari NPSN ini
      await Promise.all(servers.map(async (server: any) => {
         try {
           const queryUrl = server.isLocalFallback ? `${URL_ADMIN}query` : `https://${server.api}/api/admin-panel/query`;
           const baseApiUrl = server.isLocalFallback ? URL_ADMIN.replace(/\/admin-panel\/?$/, '') : `https://${server.api}/api`;
           
           const res = await fetch(queryUrl, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'X-Admin-Access-Key': server.access,
               },
               body: JSON.stringify({
                   sql: `SELECT * FROM sekolahs WHERE npsn = '${npsn}' LIMIT 1`,
               }),
           });
           const result = await res.json();
           
           // Jika berhasil ditemukan didalam salah satu server sekolah
           if (res.ok && result?.success && result?.data && result.data.length > 0) {
               // Periksa lagi kalau-kalau ada npsn mirip yang tembus
               if (result.data[0].npsn === npsn) {
                   foundSchool = result.data[0];
                   validApiDomain = baseApiUrl;
               }
           }
         } catch(e) {
           // Ignore server yang mati atau timeout
         }
      }));

      if (!foundSchool || !validApiDomain) {
        throw new Error('Sekolah dengan NPSN tersebut tidak ditemukan di server manapun.');
      }

      const schoolData = {
        id: foundSchool.id,
        nama: foundSchool.nama,
        alamat: `${foundSchool.alamat_jalan}, ${foundSchool.kecamatan}, ${foundSchool.kabupaten_kota}`,
        logo: foundSchool.logo,
        telepon: foundSchool.nomor_telepon,
        email: foundSchool.email,
        website: foundSchool.website,
        npsn: foundSchool.npsn,
      };
      
      // Save NPSN & TARGET_API_DOMAIN to storage
      await AsyncStorage.setItem('npsn', npsn);
      await AsyncStorage.setItem('APP_API_URL', validApiDomain);
      
      showToast('Sekolah ditemukan!', 'success');
      
      // Navigate to Login after short delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login', params: { schoolData } }],
        });
      }, 500);

    } catch (error: any) {
      const appError = handleApiError(error);
      logError('NpsnScreen.handleVerifyNpsn', appError);
      
      let message = appError.message || 'Gagal memverifikasi NPSN.';
      if (appError.statusCode === 404) {
        message = 'NPSN tidak ditemukan. Pastikan NPSN yang dimasukkan benar.';
      }
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [npsn, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Graphic */}
          <LinearGradient
            colors={['#3b82f6', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: 60,
              paddingBottom: 80,
              borderBottomLeftRadius: 50,
              borderBottomRightRadius: 50,
              alignItems: 'center',
            }}
          >
            <Animated.View
              entering={FadeInDown.delay(200).duration(800).springify()}
              style={{ alignItems: 'center' }}
            >
              <View className="bg-white/20 p-5 rounded-full mb-4">
                <Building size={64} color="#ffffff" strokeWidth={1.5} />
              </View>
              <Text className="text-white text-3xl font-extrabold tracking-white">
                SIMAK
              </Text>
              <Text className="text-blue-100 mt-2 font-medium">
                Pilih Sekolah Anda
              </Text>
            </Animated.View>
          </LinearGradient>

          {/* Form Card */}
          <View className="px-6 -mt-16">
            <Animated.View
              entering={FadeInUp.delay(400).duration(800).springify()}
              className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50"
            >
              <Text className="text-xl font-bold text-slate-800 mb-2 text-center">
                Masukkan NPSN
              </Text>
              <Text className="text-slate-500 mb-8 text-center text-sm leading-5">
                Nomor Pokok Sekolah Nasional digunakan untuk mengarahkan Anda ke sistem sekolah yang tepat.
              </Text>

              <View className="space-y-6">
                <View>
                  <Text className="text-slate-600 mb-2 ml-1 text-sm font-semibold">
                    Kode NPSN
                  </Text>
                  <View className="flex-row items-center w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 focus:border-blue-500 focus:bg-white transition-colors h-14">
                    <School
                      size={20}
                      color="#64748b"
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      className="flex-1 text-slate-800 font-bold text-lg h-full tracking-wider"
                      placeholder="Contoh: 20212345"
                      placeholderTextColor="#94a3b8"
                      value={npsn}
                      onChangeText={setNpsn}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyNpsn}
                      maxLength={12}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  className={`w-full py-4 rounded-2xl mt-4 shadow-lg flex-row justify-center items-center ${
                    loading || !npsn.trim() ? 'bg-blue-400 shadow-blue-400/30' : 'bg-blue-600 shadow-blue-600/30'
                  }`}
                  onPress={handleVerifyNpsn}
                  disabled={loading || !npsn.trim()}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white text-center font-bold text-lg tracking-wider mr-2">
                        LANJUTKAN
                      </Text>
                      <ArrowRight size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NpsnScreen;
