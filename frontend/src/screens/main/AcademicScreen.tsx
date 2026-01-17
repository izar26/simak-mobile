import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, PieChart, CalendarDays, Thermometer } from 'lucide-react-native';
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
    <View className="mb-8 mt-2">
      <Text className="text-slate-800 font-bold text-lg mb-4">Ringkasan Kehadiran</Text>
      <View className="flex-row gap-3">
        {[
          { label: 'Hadir', key: 'Hadir', meta: getStatusMeta('Hadir') },
          { label: 'Sakit', key: 'Sakit', meta: getStatusMeta('Sakit') },
          { label: 'Izin', key: 'Izin', meta: getStatusMeta('Izin') },
          { label: 'Alfa', key: 'Alfa', meta: getStatusMeta('Alfa') },
        ].map((stat, i) => (
          <View key={i} className={`flex-1 p-3 rounded-2xl border items-center ${stat.meta.bg} ${stat.meta.border}`}>
            <View className="mb-1 opacity-80">
              <stat.meta.icon size={18} color={stat.meta.color} />
            </View>
            <Text style={{ color: stat.meta.color }} className="text-2xl font-black">{data.stats[stat.key] || 0}</Text>
            <Text style={{ color: stat.meta.color }} className="text-[10px] font-bold uppercase tracking-wider opacity-80">{stat.label}</Text>
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
        <View className="items-center mr-4 w-12 pt-2 bg-white rounded-2xl border border-slate-100 h-16 justify-center shadow-sm">
          <Text className="text-xl font-black text-slate-800 leading-6">{date.day}</Text>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">{date.month}</Text>
        </View>

        {/* Content Card */}
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
            <View className="flex-row items-center">
              <User size={12} color="#94a3b8" />
              <Text className="text-slate-500 text-xs ml-1.5 font-medium" numberOfLines={1}>{item.guru || 'Guru Tidak Diketahui'}</Text>
            </View>
          </View>

          <View className={`w-8 h-8 rounded-full items-center justify-center ${meta.bg}`}>
            <meta.icon size={16} color={meta.color} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header Title */}
      <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row justify-between items-center shadow-sm z-10">
        <Text className="text-xl font-black text-slate-800 tracking-tight">Data Absensi</Text>
        <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
           <Text className="text-blue-700 text-[10px] font-bold uppercase tracking-wide">
             {data?.tapel?.semester || 'Semester'} {data?.tapel?.tahun_ajaran || ''}
           </Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-6 py-4 bg-white shadow-sm z-0">
        <View className="flex-row bg-slate-100 p-1 rounded-xl">
          {['harian', 'mapel'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab)}
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
                {tab === 'harian' ? 'Per Hari' : 'Per Mata Pelajaran'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                <CalendarDays size={40} color="#cbd5e1" />
              </View>
              <Text className="text-slate-500 font-bold text-lg">Belum ada data</Text>
              <Text className="text-slate-400 text-center text-sm mt-1 max-w-[200px]">Data absensi akan muncul setelah kegiatan belajar dimulai.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AcademicScreen;