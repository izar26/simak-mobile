import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MAIN_APP_URL } from '@env';
import api from '../../services/api';
import {
  Bell, Calendar, CheckCircle, Clock, BookOpen, ChevronRight, User, FileText, CreditCard, XCircle, Thermometer
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data Real dari API
  const stats = [
    { label: 'Hadir', value: attendanceStats.Hadir, icon: CheckCircle, color: 'bg-green-100', iconColor: '#16a34a' },
    { label: 'Izin', value: attendanceStats.Izin, icon: Clock, color: 'bg-yellow-100', iconColor: '#ca8a04' },
    { label: 'Sakit', value: attendanceStats.Sakit, icon: Thermometer, color: 'bg-blue-100', iconColor: '#2563eb' },
    { label: 'Alfa', value: attendanceStats.Alfa, icon: XCircle, color: 'bg-red-100', iconColor: '#dc2626' }, 
  ];

  const pengumuman = [
    { title: 'Libur Nasional', date: '17 Agt 2024', desc: 'Sekolah libur memperingati hari kemerdekaan.' },
    { title: 'Ujian Tengah Semester', date: '20 Sep 2024', desc: 'Persiapkan diri untuk UTS semester ganjil.' },
  ];

  const fetchData = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data);
      
      const jadwalRes = await api.get('/siswa/jadwal-hari-ini');
      setJadwal(jadwalRes.data);

      const absensiRes = await api.get('/siswa/absensi');
      setAttendanceStats(absensiRes.data.stats);
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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const siswa = user?.siswa;
  const fotoUrl = siswa?.foto ? `${MAIN_APP_URL}/storage/${siswa.foto}` : null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header Bar */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-gray-50">
        <View className="flex-row items-center gap-3">
          <View className="bg-blue-50 p-1 rounded-full border border-blue-100">
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} className="w-10 h-10 rounded-full" />
            ) : (
              <View className="w-10 h-10 rounded-full bg-blue-200 items-center justify-center">
                <User size={20} color="white" />
              </View>
            )}
          </View>
          <View>
            <Text className="text-gray-500 text-xs font-medium">Selamat Datang,</Text>
            <Text className="text-gray-800 font-bold text-base" numberOfLines={1}>
              {siswa?.nama ? siswa.nama.split(' ')[0] : user?.username}
            </Text>
          </View>
        </View>
        <TouchableOpacity className="bg-gray-50 p-2.5 rounded-full border border-gray-100 relative">
          <Bell size={20} color="#64748b" />
          <View className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Banner Selamat Datang */}
        <View className="mx-6 mt-6 mb-6 bg-blue-600 rounded-3xl p-6 shadow-lg shadow-blue-200 overflow-hidden relative">
          <View className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full" />
          <View className="absolute -left-10 -bottom-10 bg-white/10 w-32 h-32 rounded-full" />
          
          <Text className="text-white/80 font-medium text-xs mb-1">Status Akademik</Text>
          <Text className="text-white font-black text-xl mb-4">
            Semester {siswa?.tapel_aktif?.semester || '-'} {siswa?.tapel_aktif?.tahun_ajaran || ''}
          </Text>
          
          <View className="flex-row gap-3">
            {stats.map((item, index) => (
              <View key={index} className="flex-1 bg-white/20 backdrop-blur-md rounded-xl p-3 items-center">
                <Text className="text-white font-bold text-lg">{item.value}</Text>
                <Text className="text-white/70 text-[10px] uppercase">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Cepat (Quick Access) */}
        <View className="px-6 mb-8">
          <Text className="text-gray-800 font-bold text-lg mb-4">Menu Cepat</Text>
          <View className="flex-row justify-between flex-wrap gap-y-4">
            {[
              { label: 'Profil', icon: User, color: '#2563eb', bg: 'bg-blue-50', nav: 'Profil' },
              { label: 'Jadwal', icon: Calendar, color: '#f59e0b', bg: 'bg-amber-50', nav: 'Jadwal' },
              { label: 'Dokumen', icon: FileText, color: '#16a34a', bg: 'bg-green-50', nav: 'BerkasSaya' },
              { label: 'Kartu', icon: CreditCard, color: '#dc2626', bg: 'bg-red-50', nav: 'KartuPelajar' },
            ].map((menu, i) => (
              <TouchableOpacity 
                key={i}
                onPress={() => {
                    if (menu.nav === 'Profil' || menu.nav === 'Jadwal') navigation.navigate(menu.nav);
                    else navigation.navigate(menu.nav, { user });
                }}
                className="w-[22%] items-center"
              >
                <View className={`${menu.bg} w-14 h-14 rounded-2xl items-center justify-center mb-2 shadow-sm`}>
                  <menu.icon size={24} color={menu.color} />
                </View>
                <Text className="text-gray-600 text-xs font-medium text-center">{menu.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Jadwal Hari Ini */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-gray-800 font-bold text-lg">Jadwal Hari Ini</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Jadwal')}>
              <Text className="text-blue-600 text-xs font-bold">Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          <View className="gap-3">
            {jadwal.length > 0 ? (
              jadwal.map((item, i) => (
                <View key={i} className="flex-row items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                  <View className="w-12 items-center mr-4">
                    <Text className="text-gray-800 font-bold text-sm">{item.jam.split(' - ')[0]}</Text>
                    <Text className="text-gray-400 text-[10px]">{item.jam.split(' - ')[1]}</Text>
                  </View>
                  <View className="w-[1px] h-8 bg-gray-200 mr-4" />
                  <View className="flex-1">
                    <Text className="text-gray-800 font-bold text-sm" numberOfLines={1}>{item.mapel}</Text>
                    <Text className="text-gray-500 text-xs" numberOfLines={1}>{item.guru}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-md ${
                    item.status === 'Berlangsung' ? 'bg-green-100' : 
                    item.status === 'Selesai' ? 'bg-gray-200' : 'bg-blue-100'
                  }`}>
                    <Text className={`text-[9px] font-bold ${
                      item.status === 'Berlangsung' ? 'text-green-700' : 
                      item.status === 'Selesai' ? 'text-gray-500' : 'text-blue-700'
                    }`}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-6 bg-gray-50 rounded-2xl border-dashed border border-gray-200">
                <Text className="text-gray-400 text-sm">Tidak ada jadwal pelajaran hari ini.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pengumuman Terbaru */}
        <View className="px-6 mb-10">
          <Text className="text-gray-800 font-bold text-lg mb-4">Pengumuman</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
            {pengumuman.map((item, i) => (
              <View key={i} className="w-72 bg-white border border-gray-100 shadow-sm p-4 rounded-2xl mr-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="bg-orange-50 px-2 py-1 rounded-lg">
                    <Text className="text-orange-600 text-[10px] font-bold">INFO</Text>
                  </View>
                  <Text className="text-gray-400 text-[10px]">{item.date}</Text>
                </View>
                <Text className="text-gray-800 font-bold text-sm mb-1 line-clamp-1">{item.title}</Text>
                <Text className="text-gray-500 text-xs leading-4" numberOfLines={2}>{item.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
