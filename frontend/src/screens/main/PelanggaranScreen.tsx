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
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Calendar,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Skeleton from '../../components/Skeleton';
import { fetchWithSmartCache } from '../../utils/apiCache'; // ✅ Pakai SmartCache

const PelanggaranScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData(false);
  }, []);

  const fetchData = async (isManualRefresh = false) => {
    try {
      // Endpoint: /siswa/pelanggaran
      // Key: PELANGGARAN_DATA
      // TTL: 30 Menit
      const result = await fetchWithSmartCache(
        '/siswa/pelanggaran',
        'PELANGGARAN_DATA',
        30,
        isManualRefresh,
      );
      setData(result);
    } catch (error) {
      console.log('Error fetch pelanggaran:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // Helper Warna Status
  const getStatusColor = (warna: string) => {
    switch (warna) {
      case 'danger':
        return {
          bg: ['#ef4444', '#b91c1c'],
          text: 'text-red-600',
          border: 'border-red-200',
          icon: AlertOctagon,
        };
      case 'warning':
        return {
          bg: ['#f59e0b', '#b45309'],
          text: 'text-amber-600',
          border: 'border-amber-200',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: ['#10b981', '#059669'],
          text: 'text-emerald-600',
          border: 'border-emerald-200',
          icon: ShieldCheck,
        };
    }
  };

  const renderItem = ({ item, index }: any) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(600)}
        className="mb-4"
      >
        <View className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center">
          {/* Skor Badge */}
          <View className="bg-red-50 w-12 h-12 rounded-xl items-center justify-center border border-red-100 mr-4">
            <Text className="text-red-600 font-black text-lg">
              +{item.poin}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-slate-800 font-bold text-base mb-1">
              {item.pelanggaran}
            </Text>

            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <Calendar size={10} color="#94a3b8" />
                <Text className="text-slate-400 text-xs ml-1">
                  {new Date(item.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={10} color="#94a3b8" />
                <Text className="text-slate-400 text-xs ml-1">{item.jam}</Text>
              </View>
            </View>

            {item.tindakan && item.tindakan !== '-' && (
              <Text className="text-slate-500 text-xs mt-1 italic">
                Tindakan: {item.tindakan}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const statusConfig = data
    ? getStatusColor(data.summary.warna)
    : getStatusColor('success');
  const StatusIcon = statusConfig.icon;

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar
        barStyle="light-content"
        backgroundColor={statusConfig.bg[0]}
      />

      {/* --- HEADER DYNAMIC COLOR --- */}
      <LinearGradient
        colors={statusConfig.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-24 px-6 rounded-b-[40px] shadow-lg relative"
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/20"
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold ml-4">
            Kedisiplinan Siswa
          </Text>
        </View>

        <View className="items-center">
          <View className="bg-white/20 p-4 rounded-full mb-4 border border-white/20 backdrop-blur-md">
            <StatusIcon size={48} color="white" />
          </View>
          <Text className="text-white/80 font-bold text-sm uppercase tracking-widest mb-1">
            Status Kedisiplinan
          </Text>
          <Text className="text-white font-black text-3xl text-center px-4">
            {loading ? '...' : data?.summary?.status_sanksi || 'Siswa Teladan'}
          </Text>
        </View>
      </LinearGradient>

      {/* --- SUMMARY CARD (FLOATING) --- */}
      <View className="px-6 -mt-16 mb-4">
        <View className="bg-white p-5 rounded-[24px] shadow-lg shadow-slate-200 border border-slate-100 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Total Poin Pelanggaran
            </Text>
            <Text className={`text-4xl font-black ${statusConfig.text}`}>
              {loading ? '...' : data?.summary?.total_poin || 0}
              <Text className="text-sm font-bold text-slate-400"> Poin</Text>
            </Text>
          </View>
          <View
            className={`h-16 w-16 rounded-full border-4 ${statusConfig.border} items-center justify-center`}
          >
            <Text className={`font-black text-xl ${statusConfig.text}`}>
              {loading
                ? '-'
                : Math.min(
                    100,
                    Math.round(((data?.summary?.total_poin || 0) / 100) * 100),
                  )}
              %
            </Text>
          </View>
        </View>
      </View>

      {/* --- LIST RIWAYAT --- */}
      <View className="flex-1 px-6">
        <Text className="text-slate-800 font-bold text-lg mb-4">
          Riwayat Kasus
        </Text>

        {loading ? (
          <View>
            {[1, 2, 3].map(i => (
              <View
                key={i}
                className="bg-white p-4 rounded-2xl mb-4 flex-row items-center gap-4"
              >
                <Skeleton width={48} height={48} borderRadius={12} />
                <View className="flex-1">
                  <Skeleton
                    width="80%"
                    height={20}
                    style={{ marginBottom: 6 }}
                  />
                  <Skeleton width="40%" height={14} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={data?.history || []}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={statusConfig.bg}
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <View className="bg-emerald-50 p-6 rounded-full mb-4">
                  <ShieldCheck size={48} color="#10b981" />
                </View>
                <Text className="text-slate-800 font-bold text-lg">
                  Bersih & Aman!
                </Text>
                <Text className="text-slate-500 text-center text-sm px-8 mt-1">
                  Tidak ada catatan pelanggaran. Pertahankan sikap disiplinmu!
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

export default PelanggaranScreen;
