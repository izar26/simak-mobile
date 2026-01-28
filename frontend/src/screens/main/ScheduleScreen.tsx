import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Clock,
  User,
  Coffee,
  Flag,
  BookOpen,
  Heart,
  Info,
  CalendarDays,
  MapPin,
  AlertCircle,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import LottieView from 'lottie-react-native';
import { logger } from '../../utils/logger';
import { handleApiError, logError } from '../../utils/errorHandler';

const ScheduleScreen = () => {
  const [activeDay, setActiveDay] = useState('');
  const [scheduleData, setScheduleData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const dayOrder = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
  ];

  useEffect(() => {
    fetchSchedule();
    // Update waktu setiap menit untuk indikator "Live"
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await api.get('/siswa/jadwal-mingguan');
      const data = response.data.schedule || {};
      setScheduleData(data);

      const todayIndex = new Date().getDay();
      const todayName = todayIndex === 0 ? 'Minggu' : dayOrder[todayIndex - 1];

      if (data[todayName] && data[todayName].length > 0) {
        setActiveDay(todayName);
      } else {
        const firstAvailableDay = dayOrder.find(
          d => data[d] && data[d].length > 0,
        );
        if (firstAvailableDay) setActiveDay(firstAvailableDay);
        else setActiveDay(todayName);
      }
    } catch (error) {
      console.log('Error fetching schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const availableDays = useMemo(() => {
    return dayOrder.filter(day => {
      const daySchedule = scheduleData[day];
      return Array.isArray(daySchedule) && daySchedule.length > 0;
    });
  }, [scheduleData]);

  // Cek apakah pelajaran sedang berlangsung
  const isLive = (jamRange: string, day: string) => {
    // Pastikan hari yang dipilih adalah hari ini
    const todayIndex = new Date().getDay();
    const todayName = todayIndex === 0 ? 'Minggu' : dayOrder[todayIndex - 1];
    if (day !== todayName) return false;

    const [start, end] = jamRange.split(' - ');
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();

    const [startHour, startMin] = start.split(':').map(Number);
    const startTotal = startHour * 60 + startMin;

    const [endHour, endMin] = end.split(':').map(Number);
    const endTotal = endHour * 60 + endMin;

    return now >= startTotal && now < endTotal;
  };

  const getTypeConfig = (tipe: string, isLiveStatus: boolean) => {
    const baseTipe = tipe?.toLowerCase() || 'kbm';

    // Warna Live Override
    if (isLiveStatus) {
      return {
        color: '#2563eb', // Blue Primary
        bgIcon: 'bg-blue-600',
        iconColor: '#ffffff',
        icon: Clock,
        label: 'SEDANG BERLANGSUNG',
        border: 'border-blue-200 bg-blue-50',
      };
    }

    switch (baseTipe) {
      case 'kbm':
        return {
          color: '#334155', // Slate 700
          bgIcon: 'bg-slate-100',
          iconColor: '#475569',
          icon: BookOpen,
          label: 'PELAJARAN',
          border: 'border-slate-100 bg-white',
        };
      case 'upacara':
        return {
          color: '#dc2626', // Red 600
          bgIcon: 'bg-red-50',
          iconColor: '#dc2626',
          icon: Flag,
          label: 'UPACARA',
          border: 'border-red-100 bg-white',
        };
      case 'istirahat':
        return {
          color: '#ea580c', // Orange 600
          bgIcon: 'bg-orange-50',
          iconColor: '#ea580c',
          icon: Coffee,
          label: 'ISTIRAHAT',
          border: 'border-orange-100 bg-white',
        };
      default:
        return {
          color: '#64748b',
          bgIcon: 'bg-slate-50',
          iconColor: '#64748b',
          icon: Clock,
          label: 'KEGIATAN',
          border: 'border-slate-100 bg-white',
        };
    }
  };

  const renderTimelineItem = (item: any, index: number, isLast: boolean) => {
    const liveStatus = isLive(item.jam, activeDay);
    const config = getTypeConfig(
      item.tipe || (item.is_non_kbm ? 'istirahat' : 'kbm'),
      liveStatus,
    );
    const [startTime, endTime] = item.jam.split(' - ');

    return (
      <View key={index} className="flex-row">
        {/* Waktu */}
        <View className="w-[70px] items-end pr-3 pt-4">
          <Text
            className={`font-bold text-base ${
              liveStatus ? 'text-blue-600' : 'text-slate-900'
            }`}
          >
            {startTime}
          </Text>
          <Text className="text-slate-400 text-xs font-medium">{endTime}</Text>
        </View>

        {/* Garis & Konten */}
        <View className="flex-1 pb-6 relative pl-6">
          {/* Garis Vertikal */}
          {!isLast && (
            <View className="absolute left-[0px] top-[24px] bottom-0 w-[2px] bg-slate-100" />
          )}

          {/* Dot Indikator */}
          <View
            className={`absolute -left-[4px] top-[18px] w-3 h-3 rounded-full border-2 border-white z-10 shadow-sm ${
              liveStatus ? 'bg-blue-600 scale-125' : 'bg-slate-300'
            }`}
          />

          {/* Card */}
          <View
            className={`rounded-2xl p-4 shadow-sm border ${config.border} ${
              liveStatus ? 'shadow-blue-200 shadow-lg' : ''
            }`}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-2">
                {/* Label Kecil */}
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    liveStatus ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {config.label}
                </Text>

                {/* Nama Mapel */}
                <Text className="text-slate-800 font-bold text-lg leading-6 mb-2">
                  {item.mapel}
                </Text>

                {/* Guru */}
                {!item.is_non_kbm && item.guru && (
                  <View className="flex-row items-center">
                    <User
                      size={14}
                      color={liveStatus ? '#2563eb' : '#94a3b8'}
                    />
                    <Text
                      className={`text-xs font-medium ml-1.5 ${
                        liveStatus ? 'text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      {item.guru}
                    </Text>
                  </View>
                )}
              </View>

              {/* Ikon Kanan Atas */}
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${config.bgIcon}`}
              >
                <config.icon size={20} color={config.iconColor} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Tanggal Hari Ini untuk Header
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-2 pb-4 border-b border-slate-50 bg-white">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-sm font-semibold text-slate-400 mb-1 uppercase tracking-widest">
              Jadwal Pelajaran
            </Text>
            <Text className="text-2xl font-black text-slate-900 leading-8">
              {activeDay}
            </Text>
            <Text className="text-slate-500 text-xs font-medium mt-1">
              {dateStr}
            </Text>
          </View>
          <View className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <CalendarDays size={24} color="#0f172a" />
          </View>
        </View>
      </View>

      {/* Tab Hari */}
      <View className="bg-white pb-2 shadow-sm shadow-slate-100 z-10">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}
        >
          {availableDays.map(day => {
            const isActive = activeDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setActiveDay(day)}
                className={`mr-3 px-5 py-2.5 rounded-full border ${
                  isActive
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <Text
                  className={`font-bold text-sm ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 px-6 pt-6">
          {/* Timeline Skeleton */}
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} className="flex-row mb-6">
              {/* Time Column Skeleton */}
              <View className="w-[70px] items-end pr-3 pt-2">
                <Skeleton width={40} height={16} style={{ marginBottom: 4 }} />
                <Skeleton width={30} height={12} />
              </View>

              {/* Card Skeleton */}
              <View className="flex-1 pl-6 relative">
                {/* Vertical Line */}
                <View className="absolute left-[0px] top-[24px] bottom-0 w-[2px] bg-slate-100" />
                {/* Dot */}
                <View className="absolute -left-[4px] top-[18px] w-3 h-3 rounded-full bg-slate-200 border-2 border-white" />

                {/* Card Body */}
                <View
                  className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex-row justify-between items-start"
                  style={{ borderLeftWidth: 4, borderLeftColor: '#e2e8f0' }}
                >
                  <View className="flex-1 mr-4 gap-2">
                    <Skeleton width={60} height={10} borderRadius={4} />
                    <Skeleton width="90%" height={18} />
                    <View className="flex-row items-center mt-1">
                      <Skeleton
                        variant="circle"
                        width={14}
                        height={14}
                        style={{ marginRight: 6 }}
                      />
                      <Skeleton width={100} height={12} />
                    </View>
                  </View>
                  <Skeleton variant="circle" width={32} height={32} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Animated.ScrollView
          entering={FadeIn.duration(600)}
          className="flex-1 bg-white"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {availableDays.length > 0 && scheduleData[activeDay] ? (
            <View className="pr-6">
              {scheduleData[activeDay].map((item: any, index: number) =>
                renderTimelineItem(
                  item,
                  index,
                  index === scheduleData[activeDay].length - 1,
                ),
              )}
            </View>
          ) : (
            <View className="items-center py-10 px-8">
              <LottieView
                source={require('../../assets/animations/No-Data.json')}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
              <Text className="text-slate-800 font-bold text-lg -mt-4 text-center">
                Tidak Ada Jadwal
              </Text>
              <Text className="text-slate-400 text-center text-sm leading-6">
                Hari {activeDay} tidak ada kegiatan.
              </Text>
            </View>
          )}
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ScheduleScreen;
