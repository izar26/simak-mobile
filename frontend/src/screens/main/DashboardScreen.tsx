import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MAIN_APP_URL } from '@env';
import api from '../../services/api';
import {
  Bell, Calendar, CheckCircle, Clock, BookOpen, ChevronRight, User, FileText, CreditCard, XCircle, Thermometer, Globe, Link as LinkIcon, UserPlus
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Skeleton from '../../components/Skeleton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [pengumuman, setPengumuman] = useState<any[]>([]); // Data Pengumuman Real
  const [attendanceStats, setAttendanceStats] = useState({ Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 });
  const [notifCount, setNotifCount] = useState(0); // State Notifikasi
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Data Real dari API
  const stats = [
    { label: 'Hadir', value: attendanceStats.Hadir, icon: CheckCircle, color: 'bg-green-100', iconColor: '#16a34a' },
    { label: 'Izin', value: attendanceStats.Izin, icon: Clock, color: 'bg-yellow-100', iconColor: '#ca8a04' },
    { label: 'Sakit', value: attendanceStats.Sakit, icon: Thermometer, color: 'bg-blue-100', iconColor: '#2563eb' },
    { label: 'Alfa', value: attendanceStats.Alfa, icon: XCircle, color: 'bg-red-100', iconColor: '#dc2626' }, 
  ];

  const fetchData = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data);
      
      const jadwalRes = await api.get('/siswa/jadwal-hari-ini');
      // Handle new response structure
      if (jadwalRes.data.jadwal) {
         setJadwal(jadwalRes.data.jadwal);
         setPengumuman(jadwalRes.data.pengumuman || []);
      } else {
         // Fallback legacy structure support just in case
         setJadwal(Array.isArray(jadwalRes.data) ? jadwalRes.data : []);
      }

      const absensiRes = await api.get('/siswa/absensi');
      setAttendanceStats(absensiRes.data.stats);

      // Cek Notifikasi
      try {
        const notifRes = await api.get('/siswa/notifikasi');
        const totalServer = notifRes.data.length;
        
        // Cek terakhir dilihat local
        const lastSeen = await AsyncStorage.getItem('last_seen_notif_count');
        const lastCount = lastSeen ? parseInt(lastSeen) : 0;
        
        const unread = totalServer - lastCount;
        setNotifCount(unread > 0 ? unread : 0);
      } catch (e) { console.log('Gagal load notifikasi'); }

    } catch (error) {
      console.log('Gagal ambil data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
         <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
         
         {/* Header Skeleton */}
         <View className="flex-row items-center px-6 py-5 gap-4">
            <Skeleton variant="circle" width={48} height={48} />
            <View className="flex-1">
               <Skeleton width={100} height={14} style={{ marginBottom: 6 }} />
               <Skeleton width={150} height={18} />
            </View>
            <Skeleton variant="circle" width={44} height={44} />
         </View>
  
         {/* Banner Skeleton */}
         <View className="px-6 mt-4 mb-8">
            <Skeleton width="100%" height={180} borderRadius={24} />
         </View>
  
         {/* Menu Grid Skeleton */}
         <View className="px-6 mb-8">
            <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
            <View className="flex-row justify-between">
               {[1,2,3,4].map(i => (
                  <View key={i} className="items-center gap-2">
                     <Skeleton width={64} height={64} borderRadius={20} />
                     <Skeleton width={50} height={12} />
                  </View>
               ))}
            </View>
         </View>
  
         {/* Jadwal Skeleton */}
         <View className="px-6 mb-8">
            <View className="flex-row justify-between items-center mb-4">
               <Skeleton width={140} height={20} />
               <Skeleton width={80} height={24} borderRadius={20} />
            </View>
            <View className="gap-4">
               {[1,2].map(i => (
                  <View key={i} className="flex-row bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden items-center">
                     {/* Color Bar Placeholder */}
                     <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200" />
                     
                     {/* Time Box Skeleton */}
                     <Skeleton width={70} height={50} borderRadius={12} style={{ marginLeft: 12, marginRight: 16 }} />
                     
                     {/* Text Content Skeleton */}
                     <View className="flex-1 gap-2">
                        <Skeleton width="80%" height={16} />
                        <Skeleton width="50%" height={12} />
                     </View>
                  </View>
               ))}
            </View>
         </View>

         {/* Pengumuman Skeleton */}
         <View className="pl-6 mb-4">
            <Skeleton width={160} height={20} style={{ marginBottom: 16 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-6">
               {[1,2].map(i => (
                  <View key={i} className="w-80 bg-white border border-slate-100 shadow-sm p-5 rounded-3xl mr-4">
                     <View className="flex-row justify-between items-start mb-3">
                        <Skeleton width={70} height={24} borderRadius={20} />
                        <Skeleton width={80} height={12} />
                     </View>
                     <Skeleton width="90%" height={20} style={{ marginBottom: 8 }} />
                     <Skeleton width="100%" height={12} style={{ marginBottom: 4 }} />
                     <Skeleton width="60%" height={12} />
                  </View>
               ))}
            </ScrollView>
         </View>
      </SafeAreaView>
    );
  }

  const siswa = user?.siswa;
  const fotoUrl = siswa?.foto ? `${MAIN_APP_URL}/storage/${siswa.foto}` : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header Bar */}
      <View className="flex-row justify-between items-center px-6 py-5 bg-slate-50">
        <View className="flex-1 flex-row items-center gap-4 mr-3">
          <View className="p-[2px] bg-white rounded-full shadow-sm">
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} className="w-12 h-12 rounded-full" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center border border-blue-50">
                <User size={24} color="#2563eb" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-slate-500 text-xs font-medium mb-0.5">{getGreeting()},</Text>
            <Text className="text-slate-800 font-bold text-base leading-5" numberOfLines={2}>
              {siswa?.nama || user?.username || 'Siswa'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifikasi')}
          className="bg-white p-3 rounded-full border border-slate-100 shadow-sm relative shrink-0"
        >
          <Bell size={20} color="#64748b" />
          {notifCount > 0 && (
            <View className="absolute top-2 right-2 bg-red-500 rounded-full min-w-[16px] h-4 px-1 items-center justify-center border border-white">
               <Text className="text-white text-[9px] font-bold">{notifCount > 9 ? '9+' : notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        entering={FadeIn.duration(600)}
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
      >
        
        {/* Banner Akademik */}
        <View className="mx-6 mt-4 mb-8">
          <LinearGradient 
            colors={['#3b82f6', '#1d4ed8']} 
            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            style={{ borderRadius: 24 }}
            className="p-6 shadow-xl shadow-blue-200 overflow-hidden relative min-h-[180px] justify-between"
          >
            {/* Dekorasi Lottie */}
            <View className="absolute -right-4 -bottom-4 w-48 h-48 opacity-20">
               <LottieView
                  source={require('../../assets/animations/Back to School.json')}
                  autoPlay
                  loop
                  style={{ width: '100%', height: '100%' }}
               />
            </View>
            <View className="absolute -left-10 -bottom-10 bg-blue-400 w-40 h-40 rounded-full opacity-30" />
            
            <View>
              <Text className="text-blue-100 font-medium text-xs mb-1 tracking-wider uppercase">Semester Aktif</Text>
              <Text className="text-white font-black text-2xl tracking-tight">
                {siswa?.tapel_aktif?.tahun_ajaran || '2023/2024'} <Text className="font-light text-xl">({siswa?.tapel_aktif?.semester || 'Ganjil'})</Text>
              </Text>
            </View>
            
            <View className="flex-row gap-3 mt-6">
              {stats.map((item, index) => (
                <View key={index} className="flex-1 bg-white/10 border border-white/10 rounded-2xl p-2 items-center justify-center">
                  <Text className="text-white font-bold text-xl">{item.value}</Text>
                  <Text className="text-blue-100 text-[9px] uppercase font-bold tracking-wide mt-1">{item.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Menu Cepat (Quick Access) */}
        <View className="px-6 mb-8">
          <Text className="text-slate-800 font-bold text-lg mb-4">Akses Cepat</Text>
          <View className="flex-row flex-wrap justify-between gap-y-6">
            {[
              { label: 'Profil', icon: User, color: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-100', nav: 'Profil' },
              { label: 'Jadwal', icon: Calendar, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-100', nav: 'Jadwal' },
              { label: 'Dokumen', icon: FileText, color: '#16a34a', bg: 'bg-green-50', border: 'border-green-100', nav: 'BerkasSaya' },
              { label: 'Kartu', icon: CreditCard, color: '#dc2626', bg: 'bg-red-50', border: 'border-red-100', nav: 'KartuPelajar' },
              { label: 'Website', icon: Globe, color: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-100', link: user?.siswa?.sekolah?.website },
              { label: 'SPMB', icon: UserPlus, color: '#8b5cf6', bg: 'bg-violet-50', border: 'border-violet-100', link: user?.siswa?.sekolah?.spmb },
            ].map((menu, i) => (
              <TouchableOpacity 
                key={i}
                onPress={() => {
                    if (menu.link) {
                       Linking.openURL(menu.link).catch(err => console.error("Couldn't load page", err));
                    } else if (menu.nav) {
                       if (menu.nav === 'Jadwal' || menu.nav === 'Profil') navigation.navigate(menu.nav);
                       else navigation.navigate(menu.nav, { user });
                    }
                }}
                className="w-[30%] items-center gap-2"
              >
                <View className={`${menu.bg} w-16 h-16 rounded-[24px] items-center justify-center border ${menu.border} shadow-sm`}>
                  <menu.icon size={24} color={menu.color} strokeWidth={2} />
                </View>
                <Text className="text-slate-600 text-xs font-semibold text-center">{menu.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Jadwal Hari Ini */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-slate-800 font-bold text-lg">Jadwal Hari Ini</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Jadwal')} className="bg-blue-50 px-3 py-1.5 rounded-full">
              <Text className="text-blue-600 text-xs font-bold">Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          {jadwal.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6" contentContainerStyle={{ paddingRight: 24 }}>
              {jadwal.map((item, i) => (
                <View key={i} className="mr-4 w-64 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex-col justify-between h-32">
                  <View className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    item.is_non_kbm ? 'bg-orange-400' : (item.status === 'Berlangsung' ? 'bg-green-500' : 'bg-blue-500')
                  }`} />
                  
                  <View className="pl-3 flex-row justify-between items-start">
                    <View>
                        <Text className="text-slate-400 text-xs font-bold mb-1">{item.jam}</Text>
                        <Text className="text-slate-800 font-bold text-lg leading-6 pr-2" numberOfLines={2}>{item.mapel}</Text>
                    </View>
                    {item.status === 'Berlangsung' && (
                      <View className="bg-green-100 px-2 py-1 rounded-lg">
                        <Text className="text-green-700 text-[10px] font-bold">LIVE</Text>
                      </View>
                    )}
                  </View>

                  <View className="pl-3 mt-2">
                    {!item.is_non_kbm ? (
                        <View className="flex-row items-center gap-1.5 bg-slate-50 self-start px-2 py-1 rounded-md">
                            <User size={12} color="#64748b" />
                            <Text className="text-slate-500 text-xs font-medium" numberOfLines={1}>{item.guru}</Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center gap-1.5 bg-orange-50 self-start px-2 py-1 rounded-md">
                            <Clock size={12} color="#f97316" />
                            <Text className="text-orange-600 text-xs font-bold">Kegiatan</Text>
                        </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="items-center py-8 bg-white rounded-3xl border border-dashed border-slate-200">
              <View className="bg-slate-50 p-3 rounded-full mb-2">
                <Calendar size={24} color="#cbd5e1" />
              </View>
              <Text className="text-slate-400 text-sm font-medium">Tidak ada jadwal hari ini</Text>
            </View>
          )}
        </View>

        {/* Pengumuman Terbaru */}
        <View className="pl-6 mb-4">
          <View className="flex-row justify-between items-center mb-4 pr-6">
            <Text className="text-slate-800 font-bold text-lg">Papan Pengumuman</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Pengumuman')}>
              <Text className="text-blue-600 text-xs font-bold">Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {pengumuman.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-6" contentContainerStyle={{ paddingRight: 24 }}>
              {pengumuman.map((item, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => navigation.navigate('DetailPengumuman', { item })}
                  activeOpacity={0.9}
                  className="w-72 bg-white border border-slate-100 shadow-sm p-5 rounded-3xl mr-4"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className={`px-3 py-1 rounded-full border ${
                      item.type === 'libur' ? 'bg-red-50 border-red-100' : 
                      item.type === 'berita' ? 'bg-emerald-50 border-emerald-100' :
                      'bg-blue-50 border-blue-100'
                    }`}>
                      <Text className={`text-[10px] font-bold uppercase ${
                        item.type === 'libur' ? 'text-red-600' : 
                        item.type === 'berita' ? 'text-emerald-600' :
                        'text-blue-600'
                      }`}>
                        {item.type === 'libur' ? 'LIBUR' : item.type === 'berita' ? 'BERITA' : 'INFO'}
                      </Text>
                    </View>
                    <Text className="text-slate-400 text-xs font-medium">
                      {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text className="text-slate-800 font-bold text-base mb-1 leading-6 line-clamp-2" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-1 leading-4" numberOfLines={2}>
                    {item.desc || 'Klik untuk detail'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View className="mr-6 bg-slate-50 border border-slate-100 rounded-3xl p-6 items-center">
               <Text className="text-slate-400 font-medium text-sm">Tidak ada pengumuman hari libur.</Text>
            </View>
          )}
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
