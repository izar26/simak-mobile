import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, PieChart, CalendarDays } from 'lucide-react-native';
import api from '../../services/api';

const AcademicScreen = () => {
  const [activeTab, setActiveTab] = useState('harian'); // 'harian' | 'mapel'
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
      // Ensure stats object exists even if API returns partial data
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

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'Hadir': return { color: '#16a34a', bg: 'bg-green-100', icon: CheckCircle };
      case 'Sakit': return { color: '#2563eb', bg: 'bg-blue-100', icon: AlertCircle };
      case 'Izin': return { color: '#ca8a04', bg: 'bg-yellow-100', icon: Clock };
      case 'Alfa': return { color: '#dc2626', bg: 'bg-red-100', icon: XCircle };
      default: return { color: '#64748b', bg: 'bg-gray-100', icon: AlertCircle };
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
    <View className="mb-6">
      {/* Summary Cards */}
      <View className="flex-row justify-between gap-2 mb-2">
        {[
          { label: 'Hadir', key: 'Hadir', meta: getStatusMeta('Hadir') },
          { label: 'Sakit', key: 'Sakit', meta: getStatusMeta('Sakit') },
          { label: 'Izin', key: 'Izin', meta: getStatusMeta('Izin') },
          { label: 'Alfa', key: 'Alfa', meta: getStatusMeta('Alfa') },
        ].map((stat, i) => (
          <View key={i} className={`flex-1 p-3 rounded-2xl border items-center ${stat.meta.bg} border-transparent`}>
            <Text style={{ color: stat.meta.color }} className="text-lg font-black">{data.stats[stat.key] || 0}</Text>
            <Text style={{ color: stat.meta.color }} className="text-[10px] font-bold uppercase">{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderHarianItem = ({ item }: any) => {
    const meta = getStatusMeta(item.status);
    const date = formatDate(item.tanggal);
    const Icon = meta.icon;

    return (
      <View className="flex-row mb-4">
        {/* Date Column */}
        <View className="items-center mr-4 w-12 pt-1">
          <Text className="text-xl font-black text-gray-800">{date.day}</Text>
          <Text className="text-[10px] font-bold text-gray-400 uppercase">{date.month}</Text>
        </View>

        {/* Content Card */}
        <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">{date.full}</Text>
            <View className="flex-row items-center">
              <Clock size={14} color="#64748b" />
              <Text className="text-gray-800 font-bold ml-1.5 text-base">
                {item.jam_masuk ? item.jam_masuk.substring(0, 5) : '--:--'} - {item.jam_pulang ? item.jam_pulang.substring(0, 5) : '--:--'}
              </Text>
            </View>
          </View>
          
          <View 
            style={{ width: 75 }} 
            className={`py-1.5 rounded-lg flex-row items-center justify-center ${meta.bg}`}
          >
            <Text style={{ color: meta.color }} className="text-[10px] font-black mr-1 uppercase">{item.status}</Text>
            <Icon size={12} color={meta.color} /> 
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
        <View className="items-center mr-4 w-12 pt-1">
          <Text className="text-xl font-black text-gray-800">{date.day}</Text>
          <Text className="text-[10px] font-bold text-gray-400 uppercase">{date.month}</Text>
        </View>

        <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-center">
          <View className="flex-1 mr-2">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-gray-800 font-bold text-base flex-1 mr-2" numberOfLines={1}>{item.mapel}</Text>
            </View>
            <View className="flex-row items-center">
              <User size={12} color="#94a3b8" />
              <Text className="text-gray-500 text-xs ml-1.5" numberOfLines={1}>{item.guru || 'Guru Tidak Diketahui'}</Text>
            </View>
          </View>

          <View 
            style={{ width: 75 }} 
            className={`py-1.5 rounded-lg flex-row items-center justify-center ${meta.bg}`}
          >
            <Text style={{ color: meta.color }} className="text-[10px] font-black mr-1 uppercase">{item.status}</Text>
            <meta.icon size={12} color={meta.color} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header Title */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <Text className="text-xl font-black text-gray-800 tracking-tight">Akademik</Text>
        <View className="bg-blue-50 px-3 py-1 rounded-full">
           <Text className="text-blue-600 text-xs font-bold">
             Semester {data?.tapel?.semester || '-'} {data?.tapel?.tahun_ajaran || ''}
           </Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 py-4 gap-3 bg-white pb-2">
        {['harian', 'mapel'].map((tab) => (
          <Pressable 
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: activeTab === tab ? '#2563eb' : '#f8fafc',
            }}
          >
            <Text className={`font-bold text-sm ${activeTab === tab ? 'text-white' : 'text-gray-400'}`}>
              {tab === 'harian' ? 'Absensi Harian' : 'Absensi Mapel'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'harian' ? (data?.history || []) : (data?.history_mapel || [])}
          keyExtractor={(item, index) => index.toString()}
          renderItem={activeTab === 'harian' ? renderHarianItem : renderMapelItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center py-10">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <CalendarDays size={32} color="#cbd5e1" />
              </View>
              <Text className="text-gray-400 font-medium">Belum ada data absensi.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AcademicScreen;