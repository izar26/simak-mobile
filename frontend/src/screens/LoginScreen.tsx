import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { login } from '../services/auth';
import api from '../services/api';
import { MAIN_APP_URL } from '@env';
import { User, Lock, Eye, EyeOff, School } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sekolah, setSekolah] = useState<any>(null);

  useEffect(() => {
    fetchSekolah();
  }, []);

  const fetchSekolah = async () => {
    try {
      const response = await api.get('/sekolah');
      setSekolah(response.data);
    } catch (error) {
      console.log('Gagal mengambil data sekolah', error);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Perhatian', 'Mohon isi Username dan Password.');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      // Navigasi ke MainTabs (Bottom Tabs)
       navigation.replace('MainTabs');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal masuk. Cek kembali data Anda.';
      Alert.alert('Login Gagal', message);
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = sekolah?.logo ? `${MAIN_APP_URL}/storage/${sekolah.logo}` : null;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        
        {/* Background Design */}
        <View className="absolute top-0 w-full h-[45%] bg-blue-600 rounded-b-[50px] shadow-lg" />
        
        <View className="flex-1 px-6 py-6 justify-between min-h-[600px]">
          
          {/* Top Spacer & Logo */}
          <View className="flex-1 justify-center items-center">
            <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()} style={{ alignItems: 'center', marginBottom: 40 }}>
              <View className="bg-white p-4 rounded-3xl shadow-xl shadow-blue-900/20 mb-4 border-4 border-blue-50">
                {logoUrl ? (
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
              <Text className="text-white text-3xl font-extrabold text-center tracking-wide shadow-sm">
                {sekolah?.nama || 'SIMAK Mobile'}
              </Text>
              <Text className="text-blue-100 text-base mt-2 text-center font-medium opacity-90">
                {sekolah?.alamat || 'Sistem Informasi Manajemen Akademik'}
              </Text>
            </Animated.View>
          </View>

          {/* Login Card (Static Height) */}
          <View className="py-6">
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

                  {/* Forgot Password Link (Optional) */}
                  <TouchableOpacity className="self-end" onPress={() => Alert.alert('Info', 'Silakan hubungi administrator sekolah untuk reset password.')}>
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
          <View className="flex-1 justify-end items-center pb-4">
            <Animated.View entering={FadeInUp.delay(600).duration(1000)} style={{ marginTop: 40, alignItems: 'center' }}>
               <Text className="text-slate-400 text-xs font-medium">
                 &copy; {new Date().getFullYear()} {sekolah?.nama || 'SIMAK Mobile'}. All rights reserved.
               </Text>
               <Text className="text-slate-300 text-[10px] mt-1">Versi Aplikasi 1.0.0</Text>
            </Animated.View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;