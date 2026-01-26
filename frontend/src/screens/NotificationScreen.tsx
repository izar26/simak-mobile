import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SectionList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, CheckCircle, XCircle, Clock, Info, Calendar } from 'lucide-react-native';
import api from '../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';

const NotificationScreen = ({ navigation }: any) => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<number>(Date.now());

  useEffect(() => {
    // 1. Ambil waktu terakhir baca
    AsyncStorage.getItem('last_read_time').then(time => {
       if (time) setLastReadTime(parseInt(time));
       else setLastReadTime(0); // Belum pernah baca
       
       fetchNotifications();
    });

    // 2. Saat keluar (unmount), update waktu baca ke sekarang
    return () => {
       const now = Date.now();
       AsyncStorage.setItem('last_read_time', now.toString());
    };
  }, []);

  const groupNotifications = (data: any[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: any[] } = {
      'Hari Ini': [],
      'Kemarin': [],
      'Minggu Ini': [],
      'Bulan Ini': [],
      'Riwayat Lama': []
    };

    data.forEach(item => {
      const date = new Date(item.raw_date); // Pastikan backend kirim raw_date ISO
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (date.toDateString() === today.toDateString()) {
        groups['Hari Ini'].push(item);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups['Kemarin'].push(item);
      } else if (diffDays <= 7) {
        groups['Minggu Ini'].push(item);
      } else if (diffDays <= 30) {
        groups['Bulan Ini'].push(item);
      } else {
        groups['Riwayat Lama'].push(item);
      }
    });

    // Convert object to array for SectionList, removing empty sections
    return Object.keys(groups)
      .map(title => ({ title, data: groups[title] }))
      .filter(section => section.data.length > 0);
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/siswa/notifikasi');
      const grouped = groupNotifications(response.data);
      setSections(grouped);
      
      // Mark as read (save total count)
      await AsyncStorage.setItem('last_seen_notif_count', response.data.length.toString());
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getTheme = (type: string) => {
    switch (type) {
      case 'success': return { 
        icon: CheckCircle, color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700' 
      };
      case 'error': return { 
        icon: XCircle, color: '#ef4444', bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' 
      };
      default: return { 
        icon: Clock, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700' 
      };
    }
  };

  const renderItem = ({ item, index }: any) => {
    const theme = getTheme(item.type);
    const Icon = theme.icon;
    
    // Cek apakah notifikasi baru (lebih baru dari terakhir dibuka)
    const itemTime = new Date(item.raw_date).getTime();
    const isNew = itemTime > lastReadTime;

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(600)}
        className={`mb-4 bg-white rounded-2xl shadow-sm border overflow-hidden flex-row ${isNew ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}
      >
        {/* Left Border Indicator */}
        <View className={`w-1.5 h-full ${theme.bg}`} style={{ backgroundColor: theme.color }} />

        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between mb-2">
             <View className="flex-row items-center flex-1 mr-2">
                <View className={`${theme.bg} p-1.5 rounded-full mr-2`}>
                   <Icon size={16} color={theme.color} />
                </View>
                <Text className={`font-bold text-sm ${theme.text} flex-1`} numberOfLines={1}>
                  {item.title}
                </Text>
                {isNew && (
                  <View className="bg-red-500 px-2 py-0.5 rounded-full ml-2 animate-pulse">
                    <Text className="text-white text-[8px] font-bold">BARU</Text>
                  </View>
                )}
             </View>
             <Text className="text-slate-400 text-[10px] font-medium mt-1">{item.date}</Text>
          </View>

          <Text className="text-slate-600 text-sm leading-5 mb-2 pl-9">
            {item.message}
          </Text>

          {item.catatan && (
            <View className="ml-9 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <View className="flex-row items-center mb-1">
                 <Info size={12} color="#64748b" />
                 <Text className="text-slate-500 text-[10px] font-bold ml-1 uppercase">Catatan Operator</Text>
              </View>
              <Text className="text-slate-700 text-xs italic">"{item.catatan}"</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View className="flex-row items-center mb-3 mt-2">
       <View className="bg-slate-100 px-3 py-1 rounded-full">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{title}</Text>
       </View>
       <View className="h-[1px] flex-1 bg-slate-100 ml-3" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <LinearGradient 
        colors={['#3b82f6', '#1d4ed8']} 
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
        className="flex-row items-center justify-between px-6 py-4 pt-4 shadow-lg mb-2"
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center border border-white/30 backdrop-blur-md"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-tight">Notifikasi</Text>
        <View className="w-10" /> 
      </LinearGradient>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center py-10 px-10 opacity-90">
              <LottieView
                source={require('../assets/animations/No-Data.json')}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
              <Text className="text-slate-800 font-bold text-xl -mt-4 text-center">Belum Ada Kabar</Text>
              <Text className="text-slate-400 text-center text-sm leading-6">
                Notifikasi persetujuan atau informasi penting dari sekolah akan muncul di sini.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
