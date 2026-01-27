import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Calendar,
  Info,
  FileText,
  Bell,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import api from '../services/api'; // Masih butuh jika ada API call lain, tapi utamanya pakai smart cache
import Animated, { FadeInDown } from 'react-native-reanimated';
import Skeleton from '../components/Skeleton';
import LinearGradient from 'react-native-linear-gradient';

// ✅ 1. IMPORT SMART CACHE
import { fetchWithSmartCache } from '../utils/apiCache';

const AnnouncementsScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('semua');

  useEffect(() => {
    fetchData(false); // False = Jangan paksa refresh (Cek Cache dulu)
  }, []);

  // ✅ 2. UPDATE LOGIC FETCH DATA
  const fetchData = async (isManualRefresh = false) => {
    try {
      // Endpoint: /siswa/semua-informasi
      // Key Storage: ANNOUNCEMENTS_LIST
      // TTL: 30 Menit (Cukup fresh untuk papan pengumuman)
      // Force Refresh: True jika ditarik user
      const cachedData = await fetchWithSmartCache(
        '/siswa/semua-informasi',
        'ANNOUNCEMENTS_LIST',
        30,
        isManualRefresh,
      );

      setData(cachedData || []);
    } catch (error) {
      console.log('Error fetching announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ 3. UPDATE REFRESH HANDLER
  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true); // True = Paksa ambil baru dari server
  };

  const filteredData =
    filter === 'semua' ? data : data.filter(item => item.type === filter);

  // Helper untuk styling berdasarkan tipe
  const getCategoryStyles = (type: string) => {
    switch (type) {
      case 'libur':
        return {
          label: 'Libur Nasional',
          bg: 'bg-rose-50',
          text: 'text-rose-600',
          border: 'border-rose-200',
          indicator: 'bg-rose-500',
          iconColor: '#e11d48',
          icon: Calendar,
        };
      case 'berita':
        return {
          label: 'Berita Sekolah',
          bg: 'bg-emerald-50',
          text: 'text-emerald-600',
          border: 'border-emerald-200',
          indicator: 'bg-emerald-500',
          iconColor: '#059669',
          icon: FileText,
        };
      case 'agenda':
        return {
          label: 'Agenda Kegiatan',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          indicator: 'bg-amber-500',
          iconColor: '#b45309',
          icon: Clock,
        };
      default:
        return {
          label: 'Informasi Umum',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          indicator: 'bg-blue-500',
          iconColor: '#2563eb',
          icon: Info,
        };
    }
  };

  const categories = [
    { id: 'semua', label: 'Semua' },
    { id: 'berita', label: 'Berita' },
    { id: 'libur', label: 'Libur' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'info', label: 'Info' },
  ];

  const renderItem = ({ item, index }: any) => {
    const styles = getCategoryStyles(item.type);
    const Icon = styles.icon;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(600)}
        className="mb-4"
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('DetailPengumuman', { item })}
          activeOpacity={0.8}
          className="bg-white rounded-[20px] shadow-sm shadow-slate-200 border border-slate-100 overflow-hidden flex-row min-h-[110px]"
        >
          {/* Side Color Indicator */}
          <View className={`w-1.5 h-full ${styles.indicator}`} />

          <View className="flex-1 p-4">
            {/* Header Card: Kategori & Tanggal */}
            <View className="flex-row justify-between items-start mb-2">
              <View
                className={`flex-row items-center px-2 py-1 rounded-md ${styles.bg}`}
              >
                <Icon size={12} color={styles.iconColor} />
                <Text
                  className={`ml-1.5 text-[10px] font-bold uppercase tracking-wider ${styles.text}`}
                >
                  {styles.label}
                </Text>
              </View>
              <Text className="text-slate-400 text-[11px] font-medium mt-0.5">
                {new Date(item.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Title & Desc */}
            <Text className="text-slate-800 font-bold text-[16px] leading-6 mb-1">
              {item.title}
            </Text>
          </View>

          {/* Chevron Right (Ajak klik) */}
          <View className="justify-center pr-3 pl-1">
            <ChevronRight size={18} color="#cbd5e1" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

      {/* --- HEADER --- */}
      <LinearGradient
        colors={['#2563eb', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-6 rounded-b-[32px] shadow-lg shadow-blue-900/20 z-10"
      >
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/20"
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Papan Informasi</Text>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/20">
            <Bell size={20} color="white" />
          </View>
        </View>

        <Text className="text-white font-black text-2xl mb-1">Pengumuman</Text>
        <Text className="text-blue-100 text-sm">
          Update terbaru seputar kegiatan sekolah
        </Text>
      </LinearGradient>

      {/* --- FILTER CHIPS --- */}
      <View className="-mt-0 py-4 pb-2">
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isActive = filter === item.id;
            return (
              <TouchableOpacity
                onPress={() => setFilter(item.id)}
                activeOpacity={0.7}
                className={`px-5 py-2.5 rounded-full border ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <Text
                  className={`text-[13px] font-bold ${
                    isActive ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* --- CONTENT LIST --- */}
      {loading ? (
        <View className="p-6">
          {[1, 2, 3].map(i => (
            <View
              key={i}
              className="bg-white p-4 rounded-3xl mb-4 border border-slate-100 shadow-sm flex-row"
            >
              <Skeleton
                width={6}
                height={100}
                style={{ marginRight: 16, borderRadius: 4 }}
              />
              <View className="flex-1 py-2">
                <View className="flex-row justify-between mb-3">
                  <Skeleton width={80} height={20} borderRadius={8} />
                  <Skeleton width={60} height={14} />
                </View>
                <Skeleton
                  width="90%"
                  height={24}
                  style={{ marginBottom: 10 }}
                />
                <Skeleton
                  width="100%"
                  height={14}
                  style={{ marginBottom: 4 }}
                />
                <Skeleton width="70%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-10">
              <View className="w-40 h-40 bg-slate-100 rounded-full items-center justify-center mb-6">
                <Info size={60} color="#cbd5e1" />
              </View>
              <Text className="text-slate-800 font-bold text-xl mb-2 text-center">
                Tidak Ada Informasi
              </Text>
              <Text className="text-slate-400 text-center text-sm leading-6">
                Belum ada data untuk kategori{' '}
                <Text className="font-bold text-slate-600">"{filter}"</Text>.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default AnnouncementsScreen;
