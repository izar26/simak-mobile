import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, MapPin, User, Calendar, BookOpen } from 'lucide-react-native';
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
      
      setJadwalData(data);
      
      const keys = Object.keys(data);
      const daysWithSchedule = keys.sort((a, b) => {
        return dayOrder.indexOf(a) - dayOrder.indexOf(b);
      });
      
      setAvailableDays(daysWithSchedule);

      const todayIndex = new Date().getDay(); 
      const todayName = dayOrder[todayIndex === 0 ? 6 : todayIndex - 1]; 
      
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

  // Helper untuk warna acak kartu agar tidak monoton
  const getAccentColor = (index: number) => {
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'bg-blue-500' },
      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'bg-emerald-500' },
      { bg: 'bg-amber-50', text: 'text-amber-700', border: 'bg-amber-500' },
      { bg: 'bg-purple-50', text: 'text-purple-700', border: 'bg-purple-500' },
    ];
    return colors[index % colors.length];
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
        <Text className="text-xl font-extrabold text-slate-800 tracking-tight">Jadwal Pelajaran</Text>
      </View>

      {/* Day Selector */}
      <View className="bg-white pb-4 shadow-sm z-10">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 10 }}
        >
          {availableDays.length > 0 ? availableDays.map((day) => (
            <TouchableOpacity 
              key={day}
              onPress={() => setSelectedDay(day)}
              className={`px-6 py-2.5 rounded-full border shadow-sm ${
                selectedDay === day 
                  ? 'bg-blue-600 border-blue-600 shadow-blue-200' 
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`font-bold text-sm ${
                selectedDay === day ? 'text-white' : 'text-slate-500'
              }`}>
                {day}
              </Text>
            </TouchableOpacity>
          )) : (
             !loading && <Text className="text-slate-400 italic text-sm">Memuat hari...</Text>
          )}
        </ScrollView>
      </View>

      {/* Timeline Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View className="flex-row items-center mb-6">
            <Calendar size={18} color="#64748b" style={{ marginRight: 8 }} />
            <Text className="text-slate-500 font-semibold text-sm uppercase tracking-wider">
              Timeline Hari {selectedDay}
            </Text>
          </View>

          {currentSchedule.length > 0 ? (
            currentSchedule.map((item: any, index: number) => {
              const theme = getAccentColor(index);
              
              return (
                <View key={index} className="flex-row mb-0 relative">
                  {/* Timeline Line */}
                  {index !== currentSchedule.length - 1 && (
                    <View className="absolute left-[24px] top-12 bottom-[-24px] w-[2px] bg-slate-200 z-0 border-l-2 border-dashed border-slate-300" />
                  )}

                  {/* Time Column */}
                  <View className="mr-5 items-center z-10 w-12 pt-1">
                    <Text className="text-slate-800 font-black text-sm">{item.jam.split(' - ')[0]}</Text>
                    <Text className="text-slate-400 text-[10px] font-medium mt-1">{item.jam.split(' - ')[1]}</Text>
                    <View className={`w-3 h-3 rounded-full mt-2 border-2 border-white shadow-sm ${theme.border}`} />
                  </View>

                  {/* Card Content */}
                  <View className="flex-1 mb-6">
                    <View className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                      <View className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.border}`} />
                      
                      <Text className="text-slate-800 font-bold text-lg mb-1 leading-6">{item.mapel}</Text>
                      
                      <View className="flex-row items-center mt-3 gap-4">
                        <View className="flex-row items-center gap-2">
                          <User size={14} color="#94a3b8" />
                          <Text className="text-slate-500 text-xs font-medium max-w-[120px]" numberOfLines={1}>{item.guru}</Text>
                        </View>
                        {/* Jika ada data ruangan nanti bisa ditambah disini */}
                        <View className="flex-row items-center gap-2">
                          <MapPin size={14} color="#94a3b8" />
                          <Text className="text-slate-500 text-xs font-medium">Ruang Kelas</Text>
                        </View>
                      </View>

                      <View className={`self-start mt-3 px-3 py-1 rounded-lg ${theme.bg}`}>
                        <Text className={`text-[10px] font-bold ${theme.text} uppercase`}>
                          {item.status || 'Reguler'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="items-center justify-center py-16 mt-4 bg-white rounded-[32px] border border-slate-100 shadow-sm mx-2">
              <View className="bg-slate-50 p-6 rounded-full mb-6">
                <BookOpen size={40} color="#cbd5e1" />
              </View>
              <Text className="text-slate-800 font-bold text-xl mb-2">Libur / Kosong</Text>
              <Text className="text-slate-400 text-center px-8 leading-5">
                Tidak ada jadwal mata pelajaran untuk hari {selectedDay}. Selamat beristirahat!
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ScheduleScreen;