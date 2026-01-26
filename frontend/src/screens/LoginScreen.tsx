import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { login } from '../services/auth';
import api from '../services/api';
import { MAIN_APP_URL } from '@env';
import { User, Lock, Eye, EyeOff, School, KeyRound, Phone, X } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown, useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import Skeleton from '../components/Skeleton'; 
import Toast from '../components/Toast'; 
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const FloatingBubble = ({ size, initialX, initialY, duration }: any) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-50, { duration: duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          left: initialX,
          top: initialY,
        },
        style,
      ]}
    />
  );
};

const LoginScreen = ({ navigation, route }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data Sekolah
  const [sekolah, setSekolah] = useState<any>(route.params?.schoolData || null);
  const [isFetchingSchool, setIsFetchingSchool] = useState(!route.params?.schoolData);

  // UI States
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'error'
  });
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    if (!sekolah) fetchSekolah();
  }, []);

  const fetchSekolah = async () => {
    setIsFetchingSchool(true);
    try {
      const response = await api.get('/sekolah');
      setSekolah(response.data);
    } catch (error) {
      console.log('Gagal mengambil data sekolah', error);
    } finally {
      setIsFetchingSchool(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Mohon isi Username dan Password.', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
       navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Username atau password salah.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ visible: true, message, type });
  };

  const getLogoUrl = () => {
    if (!sekolah?.logo) return null;
    if (sekolah.logo.startsWith('http')) return sekolah.logo;
    const baseUrl = MAIN_APP_URL || 'https://simak.smakniscjr.sch.id';
    return `${baseUrl}/storage/${sekolah.logo}`;
  };

  const logoUrl = getLogoUrl();

  return (
    <View className="flex-1 bg-slate-50">
      {/* Toast Notification */}
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onDismiss={() => setToast({ ...toast, visible: false })} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} // Tambahan padding bawah agar scrollable saat keyboard muncul
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          
                          {/* Background Design - Gradient & Bubbles */}
                          <LinearGradient 
                            colors={['#3b82f6', '#1e40af']} 
                            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                            style={{ position: 'absolute', top: 0, width: '100%', height: '45%', borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden' }}
                          >
                             <FloatingBubble size={120} initialX={-30} initialY={40} duration={5000} />
                             <FloatingBubble size={180} initialX={width - 100} initialY={120} duration={7000} />
                             <FloatingBubble size={50} initialX={width / 2 - 25} initialY={60} duration={4000} />
                             <FloatingBubble size={80} initialX={40} initialY={200} duration={6000} />
                          </LinearGradient>          <View className="flex-1 px-6 py-6 justify-between min-h-[600px]">
            
            {/* Top Spacer & Logo */}
            <View className="flex-1 justify-center items-center pt-10">
              <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()} style={{ alignItems: 'center', marginBottom: 20 }}>
                
                {/* LOGO CONTAINER */}
                <View className="bg-white p-4 rounded-full shadow-xl shadow-blue-900/20 mb-4 border-4 border-blue-50 w-32 h-32 items-center justify-center">
                  {isFetchingSchool ? (
                     <Skeleton variant="circle" width={80} height={80} />
                  ) : logoUrl ? (
                    <Image 
                      source={{ uri: logoUrl }} 
                      className="w-24 h-24"
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="w-24 h-24 items-center justify-center">
                      <School size={60} color="#2563eb" />
                    </View>
                  )}
                </View>

                {/* SCHOOL NAME */}
                {isFetchingSchool ? (
                  <View className="items-center space-y-2 mt-2">
                     <Skeleton variant="text" width={200} height={30} style={{ backgroundColor: '#93c5fd' }} />
                     <Skeleton variant="text" width={250} height={20} style={{ backgroundColor: '#60a5fa' }} />
                  </View>
                ) : (
                  <>
                    <Text className="text-white text-3xl font-extrabold text-center tracking-wide shadow-sm px-2">
                      {sekolah?.nama || 'SIMAK Mobile'}
                    </Text>
                    <Text className="text-blue-100 text-sm mt-2 text-center font-medium opacity-90 px-4 leading-5">
                      {sekolah?.alamat || 'Sistem Informasi Manajemen Akademik'}
                    </Text>
                  </>
                )}

              </Animated.View>
            </View>

            {/* Login Card */}
            <View className="py-2">
              <Animated.View entering={FadeInUp.delay(400).duration(1000).springify()} style={{ marginHorizontal: 8 }}>
                <View className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50">
                  <Text className="text-2xl font-bold text-slate-800 mb-2 text-center">Selamat Datang</Text>
                  <Text className="text-slate-500 mb-8 text-center text-sm">Silakan masuk ke akun Anda</Text>

                  <View className="space-y-5">
                    {/* Username Input */}
                    <View>
                      <Text className="text-slate-600 mb-2 ml-1 text-sm font-semibold">Username / Email</Text>
                      <View className="flex-row items-center w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 focus:border-blue-500 focus:bg-white transition-colors h-14">
                        <User size={20} color="#64748b" style={{ marginRight: 10 }} />
                        <TextInput
                          className="flex-1 text-slate-800 font-medium text-base h-full"
                          placeholder="Masukkan username"
                          placeholderTextColor="#94a3b8"
                          value={username}
                          onChangeText={setUsername}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    {/* Password Input */}
                    <View>
                      <Text className="text-slate-600 mb-2 ml-1 text-sm font-semibold">Password</Text>
                      <View className="flex-row items-center w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 focus:border-blue-500 focus:bg-white transition-colors h-14">
                        <Lock size={20} color="#64748b" style={{ marginRight: 10 }} />
                        <TextInput
                          className="flex-1 text-slate-800 font-medium text-base h-full"
                          placeholder="Masukkan password"
                          placeholderTextColor="#94a3b8"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                          {showPassword ? (
                            <EyeOff size={20} color="#64748b" />
                          ) : (
                            <Eye size={20} color="#64748b" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Forgot Password Link */}
                    <TouchableOpacity className="self-end" onPress={() => setShowForgotModal(true)}>
                      <Text className="text-blue-600 font-semibold text-sm">Lupa Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                      className={`w-full py-4 rounded-2xl mt-2 shadow-lg shadow-blue-500/30 flex-row justify-center items-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                      onPress={handleLogin}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white text-center font-bold text-lg tracking-wider">MASUK</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Bottom Spacer & Footer */}
            <View className="flex-1 justify-end items-center pb-4 pt-6">
               <Text className="text-slate-400 text-xs font-medium">
                 &copy; {new Date().getFullYear()} {sekolah?.nama || 'SIMAK Mobile'}. All rights reserved.
               </Text>
               <Text className="text-slate-300 text-[10px] mt-1">Versi Aplikasi 1.0.0</Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL LUPA PASSWORD */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showForgotModal}
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            
            {/* Close Button */}
            <TouchableOpacity 
                onPress={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full z-10"
            >
                <X size={18} color="#64748b" />
            </TouchableOpacity>

            {/* Icon */}
            <View className="items-center mb-4">
               <View className="bg-blue-50 p-4 rounded-full">
                  <KeyRound size={32} color="#2563eb" />
               </View>
            </View>

            {/* Title */}
            <Text className="text-slate-800 font-bold text-xl mb-2 text-center">
              Lupa Password?
            </Text>

            {/* Message */}
            <Text className="text-slate-500 text-center text-sm leading-6 mb-6 px-2">
              Untuk alasan keamanan, reset password hanya dapat dilakukan melalui Administrator Sekolah.
            </Text>

            {/* Contact Info (Static Example - can be made dynamic later) */}
            <View className="bg-slate-50 p-4 rounded-xl flex-row items-center justify-center mb-6 border border-slate-100">
               <Phone size={18} color="#64748b" className="mr-3" />
               <View>
                 <Text className="text-slate-400 text-xs font-semibold uppercase">Hubungi Bagian IT/TU</Text>
                 <Text className="text-slate-700 font-bold text-base">Ruang Tata Usaha</Text>
               </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              onPress={() => setShowForgotModal(false)}
              className="bg-blue-600 w-full py-3.5 rounded-xl flex-row justify-center items-center active:bg-blue-700"
            >
              <Text className="text-white font-bold text-base">Saya Mengerti</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
};

export default LoginScreen;