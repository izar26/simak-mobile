import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, CalendarDays, Thermometer, Filter } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import LottieView from 'lottie-react-native';

const AcademicScreen = () => {
  const [activeTab, setActiveTab] = useState('harian'); // 'harian' | 'mapel'
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // null | 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [data, setData] = useState<any>({ 
    history: [], 
    history_mapel: [],
    stats: { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 } 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/siswa/absensi');
      const defaultStats = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 };
      const receivedStats = response.data.stats || {};
      
      setData({
        ...response.data,
        stats: { ...defaultStats, ...receivedStats }
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Logika Filtering Data
  const filteredData = useMemo(() => {
    const source = activeTab === 'harian' ? (data?.history || []) : (data?.history_mapel || []);
    if (!activeFilter) return source;
    return source.filter((item: any) => item.status === activeFilter);
  }, [data, activeTab, activeFilter]);

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'Hadir': return { color: '#15803d', bg: 'bg-green-100', border: 'border-green-200', icon: CheckCircle };
      case 'Sakit': return { color: '#1d4ed8', bg: 'bg-blue-100', border: 'border-blue-200', icon: Thermometer };
      case 'Izin': return { color: '#a16207', bg: 'bg-yellow-100', border: 'border-yellow-200', icon: Clock };
      case 'Alfa': return { color: '#b91c1c', bg: 'bg-red-100', border: 'border-red-200', icon: XCircle };
      default: return { color: '#475569', bg: 'bg-slate-100', border: 'border-slate-200', icon: AlertCircle };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('id-ID', { month: 'short' }),
      full: date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    };
  };

  const renderHeader = () => (
    <View className="mb-6 mt-2">
      {/* Kartu Statistik Utama */}
      <View className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-200 mb-6 relative overflow-hidden">
         <View className="absolute right-[-20] top-[-20] bg-white opacity-10 w-32 h-32 rounded-full" />
         <View className="absolute left-[-20] bottom-[-20] bg-black opacity-10 w-24 h-24 rounded-full" />
         
         <Text className="text-blue-100 font-medium text-xs uppercase tracking-wider mb-1">Total Kehadiran</Text>
         <Text className="text-white font-black text-4xl mb-4">{data.stats['Hadir'] || 0} <Text className="text-xl font-medium text-blue-200">Hari</Text></Text>

         <View className="flex-row gap-2">
            {[
              { label: 'Sakit', key: 'Sakit', bg: 'bg-blue-500' },
              { label: 'Izin', key: 'Izin', bg: 'bg-blue-500' },
              { label: 'Alfa', key: 'Alfa', bg: 'bg-red-500' },
            ].map((stat, i) => (
               <View key={i} className={`flex-1 ${stat.bg} p-2 rounded-xl items-center`}>
                  <Text className="text-white font-bold text-lg">{data.stats[stat.key] || 0}</Text>
                  <Text className="text-blue-100 text-[9px] uppercase font-bold">{stat.label}</Text>
               </View>
            ))}
         </View>
      </View>

      {/* Filter Chips */}
      <View className="mb-4">
        <View className="flex-row items-center mb-3">
          <Filter size={16} color="#64748b" />
          <Text className="text-slate-800 font-bold ml-2">Filter Status</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity 
            onPress={() => setActiveFilter(null)}
            className={`px-4 py-2 rounded-full border ${!activeFilter ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-200'}`}
          >
            <Text className={`text-xs font-bold ${!activeFilter ? 'text-white' : 'text-slate-500'}`}>Semua</Text>
          </TouchableOpacity>
          {['Hadir', 'Sakit', 'Izin', 'Alfa'].map((status) => {
            const meta = getStatusMeta(status);
            const isActive = activeFilter === status;
            return (
              <TouchableOpacity 
                key={status}
                onPress={() => setActiveFilter(isActive ? null : status)}
                className={`px-4 py-2 rounded-full border flex-row items-center ${isActive ? meta.bg + ' ' + meta.border : 'bg-white border-slate-200'}`}
              >
                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: meta.color }} />
                <Text className={`text-xs font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{status}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-slate-800 font-bold text-lg">Riwayat {activeTab === 'harian' ? 'Harian' : 'Mapel'}</Text>
        {activeFilter && (
           <View className="bg-slate-100 px-2 py-1 rounded-lg">
             <Text className="text-slate-500 text-[10px] font-bold uppercase">Filter: {activeFilter}</Text>
           </View>
        )}
      </View>
    </View>
  );

  const renderHarianItem = ({ item }: any) => {
    const meta = getStatusMeta(item.status);
    const date = formatDate(item.tanggal);
    const Icon = meta.icon;

    return (
      <View className="flex-row mb-4">
        <View className="items-center mr-4 w-12 pt-2 bg-white rounded-2xl border border-slate-100 h-16 justify-center shadow-sm">
          <Text className="text-xl font-black text-slate-800 leading-6">{date.day}</Text>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">{date.month}</Text>
        </View>

        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">{date.full}</Text>
            <View className="flex-row items-center">
              <Clock size={14} color="#64748b" />
              <Text className="text-slate-700 font-bold ml-2 text-base">
                {item.jam_masuk ? item.jam_masuk.substring(0, 5) : '--:--'} <Text className="text-slate-300 mx-1">|</Text> {item.jam_pulang ? item.jam_pulang.substring(0, 5) : '--:--'}
              </Text>
            </View>
          </View>
          
          <View className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 ${meta.bg}`}>
            <Icon size={12} color={meta.color} /> 
            <Text style={{ color: meta.color }} className="text-[10px] font-black uppercase">{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMapelItem = ({ item }: any) => {
    const meta = getStatusMeta(item.status);
    const date = formatDate(item.tanggal);

    return (
      <View className="flex-row mb-4">
        <View className="items-center mr-4 w-12 pt-2 bg-white rounded-2xl border border-slate-100 h-16 justify-center shadow-sm">
          <Text className="text-xl font-black text-slate-800 leading-6">{date.day}</Text>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">{date.month}</Text>
        </View>

        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center">
          <View className="flex-1 mr-2">
            <Text className="text-slate-800 font-bold text-base mb-1" numberOfLines={1}>{item.mapel}</Text>
            <View className="flex-row items-center mb-1">
              <User size={12} color="#94a3b8" />
              <Text className="text-slate-500 text-xs ml-1.5 font-medium" numberOfLines={1}>{item.guru || 'Guru Tidak Diketahui'}</Text>
            </View>
            <Text className="text-slate-400 text-[10px]">
               {item.jam_mulai} - {item.jam_selesai}
            </Text>
          </View>

          <View className={`w-10 h-10 rounded-full items-center justify-center ${meta.bg}`}>
            <meta.icon size={18} color={meta.color} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      
      {/* Header Title */}
      <View className="px-6 pt-4 pb-2 bg-white flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-black text-slate-800 tracking-tight mb-1">Absensi Siswa</Text>
          <Text className="text-slate-500 text-sm font-medium">Rekap kehadiranmu di sekolah.</Text>
        </View>
        
        <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
           <Text className="text-blue-700 text-[10px] font-bold uppercase tracking-wide">
             {data?.tapel?.semester || 'Semester'} {data?.tapel?.tahun_ajaran || ''}
           </Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-6 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <View className="flex-row bg-slate-100 p-1 rounded-xl">
          {['harian', 'mapel'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                // Biarkan filter tetap aktif saat pindah tab agar user bisa bandingkan
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
                elevation: activeTab === tab ? 1 : 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === tab ? 0.05 : 0,
                shadowRadius: 2,
              }}
            >
              <Text className={`font-bold text-xs ${activeTab === tab ? 'text-slate-800' : 'text-slate-400'}`}>
                {tab === 'harian' ? 'Per Hari' : 'Per Mapel'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="px-6 pt-6">
           {/* Header Stats Skeleton - Precise Match */}
           <View className="w-full h-[180px] bg-slate-100 rounded-3xl p-6 mb-6 justify-between overflow-hidden relative">
              {/* Fake Background Circles */}
              <View className="absolute right-[-20] top-[-20] bg-white opacity-50 w-32 h-32 rounded-full" />
              
              <View>
                 <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                 <Skeleton width={120} height={36} />
              </View>
              
              <View className="flex-row gap-2">
                 <Skeleton width="31%" height={50} borderRadius={12} />
                 <Skeleton width="31%" height={50} borderRadius={12} />
                 <Skeleton width="31%" height={50} borderRadius={12} />
              </View>
           </View>

           {/* Filter Skeleton */}
           <View className="mb-6">
              <View className="flex-row items-center mb-3">
                 <Skeleton variant="circle" width={16} height={16} style={{ marginRight: 8 }} />
                 <Skeleton width={80} height={16} />
              </View>
              <View className="flex-row gap-2">
                 <Skeleton width={70} height={32} borderRadius={20} />
                 <Skeleton width={70} height={32} borderRadius={20} />
                 <Skeleton width={70} height={32} borderRadius={20} />
                 <Skeleton width={70} height={32} borderRadius={20} />
              </View>
           </View>

           {/* List Title */}
           <View className="flex-row justify-between mb-4">
              <Skeleton width={150} height={20} />
           </View>

           {/* List Items Skeleton */}
           {[1,2,3,4].map(i => (
              <View key={i} className="flex-row mb-4">
                 <View className="items-center mr-4 w-12 pt-2 bg-white rounded-2xl border border-slate-100 h-16 justify-center">
                    <Skeleton width={20} height={20} style={{ marginBottom: 4 }} />
                    <Skeleton width={30} height={8} />
                 </View>
                 <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center justify-between">
                    <View className="gap-2">
                       <Skeleton width={100} height={10} />
                       <Skeleton width={140} height={14} />
                    </View>
                    <Skeleton width={60} height={24} borderRadius={8} />
                 </View>
              </View>
           ))}
        </View>
      ) : (
        <Animated.FlatList
          entering={FadeIn.duration(600)}
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={activeTab === 'harian' ? renderHarianItem : renderMapelItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center py-10 px-10 opacity-90">
              <LottieView
                source={require('../../assets/animations/No-Data.json')}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
              <Text className="text-slate-800 font-bold text-lg -mt-4">Tidak ada data</Text>
              <Text className="text-slate-400 text-center text-sm mt-1 max-w-[200px]">
                {activeFilter ? `Tidak ada data dengan status "${activeFilter}"` : 'Riwayat absensi akan muncul di sini.'}
              </Text>
              {activeFilter && (
                <TouchableOpacity onPress={() => setActiveFilter(null)} className="mt-4">
                  <Text className="text-blue-600 font-bold">Hapus Filter</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AcademicScreen;