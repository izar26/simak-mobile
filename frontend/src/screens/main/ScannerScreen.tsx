import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { ArrowLeft, Flashlight, ScanLine, XCircle, CheckCircle2, RefreshCcw } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { API_URL, MAIN_APP_URL } from '@env';
import { getToken } from '../../services/auth';
import axios from 'axios';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Sound from 'react-native-sound';

// Prevent audio from stopping when device is silenced
Sound.setCategory('Playback');

// Pre-load sounds (loaded from native bundle)
const successSound = new Sound('success.wav', Sound.MAIN_BUNDLE, (error) => {
  if (error) console.log('Failed to load success sound', error);
});
const errorSound = new Sound('error.wav', Sound.MAIN_BUNDLE, (error) => {
  if (error) console.log('Failed to load error sound', error);
});

const { width } = Dimensions.get('window');
const SCAN_DELAY = 2500; // ms to prevent rapid multi-scanning

const ScannerScreen = ({ navigation }: any) => {
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(cameraPosition);
  const [hasPermission, setHasPermission] = useState(false);
  const [torch, setTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    visible: boolean;
    success: boolean;
    message: string;
    siswa?: { nama: string; kelas: string; foto_url: string };
    status?: string;
  } | null>(null);

  const lastScannedTime = useRef(0);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleScanCode = useCallback(async (codes: any[]) => {
    const now = Date.now();
    if (isProcessing || (scanResult?.visible) || codes.length === 0) return;
    if (now - lastScannedTime.current < SCAN_DELAY) return;

    const value = codes[0].value;
    if (!value) return;

    lastScannedTime.current = now;
    setIsProcessing(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await axios.post(
        `${API_URL}/siswa/scan-absensi`,
        { token: value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      // Trigger success haptic and sound
      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      successSound.stop(() => successSound.play());

      setScanResult({
        visible: true,
        success: true,
        message: response.data.message || 'Data absen tercatat.',
        siswa: response.data.siswa,
        status: response.data.status,
      });

    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Gagal tersambung ke server.';
      
      // Trigger error haptic and sound
      ReactNativeHapticFeedback.trigger('notificationError', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      errorSound.stop(() => errorSound.play());

      setScanResult({
        visible: true,
        success: false,
        message: errorMessage,
        siswa: error.response?.data?.siswa,
      });
    } finally {
      setIsProcessing(false);
      
      // Auto dismiss after 2 seconds
      setTimeout(() => {
        setScanResult(prev => prev ? { ...prev, visible: false } : null);
      }, 2000);
    }
  }, [isProcessing, scanResult?.visible]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: handleScanCode,
  });

  if (!hasPermission) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center px-6">
        <Text className="text-white text-center text-lg font-bold mb-4">
          Akses Kamera Diperlukan
        </Text>
        <Text className="text-slate-400 text-center mb-8">
          Aplikasi butuh izin kamera untuk melakukan pemindaian barcode/QR.
        </Text>
        <TouchableOpacity
          className="bg-emerald-500 py-3 px-6 rounded-xl active:bg-emerald-600"
          onPress={async () => {
            const status = await Camera.requestCameraPermission();
            setHasPermission(status === 'granted');
          }}
        >
          <Text className="text-white font-bold">Izinkan Kamera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (device == null) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-slate-400 mt-4">Menyiapkan Kamera...</Text>
      </SafeAreaView>
    );
  }

  // Apakah scanner harus aktif (kamera merender/membaca)?
  // Tetap aktifkan kamera saat ada hasil scan agar bisa scan beruntun tanpa delay startup kamera
  const isActive = true;

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top', 'bottom']}>
      {/* Header overlay */}
      <View className="absolute top-12 left-0 right-0 z-20 flex-row items-center justify-between px-6 pt-4">
        <TouchableOpacity
          className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-2xl"
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <View className="flex-row items-center">
          <TouchableOpacity
            className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-2xl mr-3"
            onPress={() => setCameraPosition(prev => prev === 'back' ? 'front' : 'back')}
          >
            <RefreshCcw size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            className={`w-12 h-12 rounded-full items-center justify-center backdrop-blur-2xl ${
              torch ? 'bg-emerald-500' : 'bg-black/40'
            }`}
            onPress={() => setTorch(!torch)}
          >
            <Flashlight size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 rounded-3xl overflow-hidden relative border-t-[0.5px] border-slate-700">
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          codeScanner={codeScanner}
          torch={torch && device.hasTorch ? 'on' : 'off'}
          photo={false}
          video={false}
          audio={false}
        />

        {/* Scanner overlay guides */}
        <View className="absolute inset-0 z-10 justify-center items-center bg-black/50">
          {/* Header text */}
          <View className="absolute top-32 w-full px-6 flex items-center">
            <Text className="text-white text-2xl font-black mb-2 shadow-2xl">
              Scan QR Absensi
            </Text>
            <Text className="text-emerald-400 font-medium text-center shadow-lg px-8">
              Arahkan ke QR Code profil siswa untuk mencatat rekam jejak.
            </Text>
          </View>

          {/* Scanner Box */}
          <View
            style={{ width: width * 0.7, height: width * 0.7 }}
            className="border-2 border-emerald-400/50 bg-transparent rounded-3xl relative justify-center items-center"
          >
            {/* 4 corners */}
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-3xl" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-3xl" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-3xl" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-3xl" />

            {/* Animation / Processing Indicator */}
            {isProcessing && (
              <View className="bg-black/80 rounded-2xl p-6 items-center shadow-2xl flex-row">
                <ActivityIndicator size="small" color="#34d399" />
                <Text className="font-bold text-white ml-3 text-lg">Memproses...</Text>
              </View>
            )}
            
            {/* Center icon */}
            {!isProcessing && (
              <ScanLine size={48} color="rgba(52, 211, 153, 0.4)" />
            )}
          </View>

          {/* Bottom tips */}
          <View className="absolute bottom-20 px-8 w-full flex-row items-center justify-center">
             <View className="bg-black/60 py-3 px-6 rounded-full flex-row items-center justify-center border border-white/10">
               <Text className="text-slate-300 font-medium text-sm">Scan akan secara otomatis dicatat</Text>
             </View>
          </View>
        </View>
      </View>

      {/* QUICK RAPID RESULT OVERLAY */}
      {scanResult?.visible && (
        <Animated.View 
          entering={SlideInUp.springify().mass(0.5)} 
          exiting={SlideOutUp.duration(200)}
          className="absolute top-24 w-full px-4 z-50"
        >
          <View className={`p-4 rounded-3xl border shadow-2xl flex-row items-center overflow-hidden backdrop-blur-3xl ${scanResult.success ? 'bg-emerald-900/90 border-emerald-500/50' : 'bg-red-900/90 border-red-500/50'}`}>
            
            {/* Minimal Photo or Icon */}
            {scanResult.siswa?.foto_url ? (
               <Animated.Image 
                 entering={FadeIn.delay(100)}
                 source={{ uri: `${MAIN_APP_URL}/storage/${scanResult.siswa.foto_url}` }} 
                 className="w-14 h-14 rounded-2xl border-2 border-white/20 mr-4" 
                 resizeMode="cover"
               />
            ) : (
               <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${scanResult.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                 {scanResult.success ? <CheckCircle2 size={28} color="#34d399" /> : <XCircle size={28} color="#f87171" />}
               </View>
            )}

            <View className="flex-1 justify-center">
              <Text className="text-white font-black text-lg mb-0.5 tracking-tight" numberOfLines={1}>
                {scanResult.siswa?.nama || (scanResult.success ? 'Berhasil Dibaca' : 'Gagal')}
              </Text>
              
              <Text className={`${scanResult.success ? 'text-emerald-100' : 'text-red-200'} text-xs font-medium leading-4`} numberOfLines={2}>
                {scanResult.message}
              </Text>

              {scanResult.status && (
                <View className="self-start mt-2 bg-white/10 px-2 py-0.5 rounded-md">
                   <Text className="text-white text-[10px] font-bold uppercase tracking-widest">{scanResult.status}</Text>
                </View>
              )}
            </View>

          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default ScannerScreen;
