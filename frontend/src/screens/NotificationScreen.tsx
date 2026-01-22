import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, CheckCircle, Clock, Calendar } from 'lucide-react-native';
import api from '../services/api';

const NotificationScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // 1. Ambil Jadwal Hari Ini sebagai basis notifikasi
      const jadwalRes = await api.get('/siswa/jadwal-hari-ini');
      const jadwal = jadwalRes.data;

      // 2. Simulasi Riwayat Notifikasi dari Jadwal
      const generatedNotifs = jadwal.map((item: any) => {
        const startTime = item.jam.split(' - ')[0];
        const now = new Date();
        const [hour, minute] = startTime.split(':').map(Number);
        
        const scheduleTime = new Date();
        scheduleTime.setHours(hour, minute, 0, 0);

        // Status: Apakah notifikasi ini sudah lewat (History) atau akan datang (Upcoming)
        const isPast = scheduleTime.getTime() <= now.getTime();
        
        return {
          id: Math.random().toString(), // Temp ID
          title: item.is_non_kbm ? item.mapel : `Pelajaran ${item.mapel}`,
          body: item.is_non_kbm 
            ? `Waktunya ${item.mapel}. Selamat beraktivitas!`
            : `Pelajaran dimulai. Guru: ${item.guru}`,
          time: startTime,
          type: item.is_non_kbm ? 'info' : 'class',
          isRead: isPast, // Jika sudah lewat, anggap sudah "tampil" (read)
          timestamp: scheduleTime
        };
      });

      // Sort: Yang terbaru di atas
      generatedNotifs.sort((a: any, b: any) => b.timestamp - a.timestamp);

      setNotifications(generatedNotifs);
    } catch (error) {
      console.log('Error fetch notif history', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-200 mr-4 active:bg-slate-100"
        >
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-slate-800 tracking-tight">Notifikasi</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <Text className="text-center text-slate-400 mt-10">Memuat notifikasi...</Text>
        ) : notifications.length > 0 ? (
          <>
            <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-4">Hari Ini</Text>
            {notifications.map((item, index) => (
              <View 
                key={index} 
                className={`flex-row p-4 mb-3 rounded-2xl border ${
                  item.isRead ? 'bg-white border-slate-100' : 'bg-blue-50 border-blue-100'
                }`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                  item.type === 'info' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  {item.type === 'info' ? (
                    <Clock size={20} color="#f97316" />
                  ) : (
                    <Bell size={20} color="#2563eb" />
                  )}
                </View>
                
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className={`font-bold text-base flex-1 mr-2 ${
                      item.isRead ? 'text-slate-700' : 'text-slate-900'
                    }`}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-slate-400 font-medium">{item.time}</Text>
                  </View>
                  <Text className="text-slate-500 text-sm leading-5">
                    {item.body}
                  </Text>
                </View>

                {!item.isRead && (
                  <View className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </View>
            ))}
          </>
        ) : (
          <View className="items-center justify-center mt-20 opacity-50">
            <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
              <Bell size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-800 font-bold text-lg">Tidak Ada Notifikasi</Text>
            <Text className="text-slate-400 text-center px-10 mt-2">
              Belum ada aktivitas atau pemberitahuan baru untuk hari ini.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationScreen;
