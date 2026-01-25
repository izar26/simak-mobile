import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, Info, FileText } from 'lucide-react-native';
import api from '../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Skeleton from '../components/Skeleton';

const AnnouncementsScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Kita gunakan endpoint jadwal-hari-ini sementara karena endpoint khusus belum ada
      // Idealnya nanti buat endpoint /siswa/berita-lengkap
      const response = await api.get('/siswa/jadwal-hari-ini');
      setData(response.data.pengumuman || []);
    } catch (error) {
      console.log('Error fetching announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'libur': return { label: 'LIBUR', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: Calendar };
      case 'berita': return { label: 'BERITA', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: FileText };
      default: return { label: 'INFO', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: Info };
    }
  };

  const renderItem = ({ item, index }: any) => {
    const badge = getBadge(item.type);
    const Icon = badge.icon;

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(600)}
        className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm"
      >
        <View className="flex-row justify-between items-start mb-3">
           <View className={`flex-row items-center px-3 py-1.5 rounded-full border ${badge.bg}`}>
              <Icon size={12} color={badge.color.replace('text-', '').replace('-600', '#ea580c')} /> 
              {/* Note: Color mapping simplistic, using theme classes is better */}
              <Text className={`ml-1.5 text-[10px] font-bold ${badge.color}`}>{badge.label}</Text>
           </View>
           <Text className="text-slate-400 text-xs font-medium mt-1">
              {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
           </Text>
        </View>
        
        <Text className="text-slate-800 font-bold text-lg mb-2 leading-6">{item.title}</Text>
        <Text className="text-slate-500 text-sm leading-6">{item.desc}</Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-100 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-100">
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-slate-800 tracking-tight">Informasi Sekolah</Text>
        <View className="w-10" /> 
      </View>

      {loading ? (
        <View className="p-6 pt-4">
           {[1,2,3,4].map(i => (
              <View key={i} className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm">
                 <View className="flex-row justify-between mb-3">
                    <Skeleton width={60} height={24} borderRadius={20} />
                    <Skeleton width={80} height={14} />
                 </View>
                 <Skeleton width="90%" height={20} style={{ marginBottom: 8 }} />
                 <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
                 <Skeleton width="70%" height={14} />
              </View>
           ))}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center py-20">
               <Text className="text-slate-400">Belum ada informasi terbaru.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AnnouncementsScreen;
