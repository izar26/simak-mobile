import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, MapPin, User, Calendar } from 'lucide-react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const ScheduleScreen = ({ navigation }: any) => {
  const [jadwalData, setJadwalData] = useState<any>({});
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState('Senin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    try {
      const response = await api.get('/siswa/jadwal-mingguan');
      const data = response.data;
      console.log('Jadwal Data Raw:', JSON.stringify(data, null, 2)); // DEBUG LOG
      
      setJadwalData(data);
      
      // Ambil hari yang ada jadwalnya saja & urutkan
      const keys = Object.keys(data);
      console.log('Jadwal Keys:', keys); // DEBUG LOG

      const daysWithSchedule = keys.sort((a, b) => {
        return dayOrder.indexOf(a) - dayOrder.indexOf(b);
      });
      
      setAvailableDays(daysWithSchedule);

      // Auto-select today or first available day
      const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon
      const todayName = dayOrder[todayIndex === 0 ? 6 : todayIndex - 1]; // Convert to Indo day name
      
      if (daysWithSchedule.includes(todayName)) {
        setSelectedDay(todayName);
      } else if (daysWithSchedule.length > 0) {
        setSelectedDay(daysWithSchedule[0]);
      }

    } catch (error) {
      console.log('Gagal ambil jadwal', error);
    } finally {
      setLoading(false);
    }
  };

  const currentSchedule = jadwalData[selectedDay] || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100 mr-4"
        >
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-800 tracking-tight">Jadwal Pelajaran</Text>
      </View>

      {/* Day Selector */}
      <View className="bg-white pb-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          className="mt-4"
        >
          {availableDays.length > 0 ? availableDays.map((day) => (
            <TouchableOpacity 
              key={day}
              onPress={() => setSelectedDay(day)}
              className={`px-5 py-2.5 rounded-full border ${
                selectedDay === day 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-bold text-sm ${
                selectedDay === day ? 'text-white' : 'text-gray-500'
              }`}>
                {day}
              </Text>
            </TouchableOpacity>
          )) : (
             !loading && <Text className="text-gray-400 italic">Jadwal belum tersedia</Text>
          )}
        </ScrollView>
      </View>

      {/* Schedule Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          <Text className="text-gray-500 font-medium mb-4 text-xs uppercase tracking-widest">
            Jadwal Hari {selectedDay}
          </Text>

          {currentSchedule.length > 0 ? (
            currentSchedule.map((item: any, index: number) => (
              <View key={index} className="flex-row mb-4 relative">
                {/* Timeline Line */}
                {index !== currentSchedule.length - 1 && (
                  <View className="absolute left-[27px] top-10 bottom-[-20px] w-[2px] bg-gray-100 z-0" />
                )}

                {/* Time Column */}
                <View className="mr-4 items-center z-10 bg-gray-50">
                  <View className="bg-blue-50 border border-blue-100 w-14 h-14 rounded-2xl items-center justify-center mb-1">
                    <Text className="text-blue-700 font-bold text-xs">{item.jam.split(' - ')[0]}</Text>
                  </View>
                  <Text className="text-gray-400 text-[10px] font-medium">{item.jam.split(' - ')[1]}</Text>
                </View>

                {/* Card Content */}
                <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <Text className="text-gray-800 font-bold text-base mb-1">{item.mapel}</Text>
                  
                  <View className="flex-row items-center mt-2">
                    <View className="bg-gray-100 p-1.5 rounded-full mr-2">
                      <User size={14} color="#64748b" />
                    </View>
                    <Text className="text-gray-500 text-xs font-medium flex-1">{item.guru}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <View className="bg-gray-50 p-4 rounded-full mb-4">
                <Calendar size={32} color="#94a3b8" />
              </View>
              <Text className="text-gray-800 font-bold text-lg">Tidak Ada Jadwal</Text>
              <Text className="text-gray-400 text-center px-10 mt-1">
                Hari ini tidak ada kegiatan belajar mengajar atau jadwal belum diatur.
              </Text>
            </View>
          )}
          
          <View className="h-10" /> 
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ScheduleScreen;