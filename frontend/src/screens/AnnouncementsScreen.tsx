import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, Info, FileText } from 'lucide-react-native';
import api from '../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Skeleton from '../components/Skeleton';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';

const AnnouncementsScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/siswa/semua-informasi');
      setData(response.data || []);
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
      case 'agenda': return { label: 'AGENDA', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: Info };
      default: return { label: 'INFO', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: Info };
    }
  };

  const renderItem = ({ item, index }: any) => {
    const badge = getBadge(item.type);
    const Icon = badge.icon;

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(600)}
        className="bg-white rounded-3xl mb-4 border border-slate-100 shadow-sm overflow-hidden"
      >
        <TouchableOpacity 
           onPress={() => navigation.navigate('DetailPengumuman', { item })}
           activeOpacity={0.7}
           className="p-5"
        >
          <View className="flex-row justify-between items-start mb-3">
             <View className={`flex-row items-center px-3 py-1.5 rounded-full border ${badge.bg}`}>
                <Icon size={12} color={badge.color.replace('text-', '').replace('-600', '#ea580c')} /> 
                <Text className={`ml-1.5 text-[10px] font-bold ${badge.color}`}>{badge.label}</Text>
             </View>
             <Text className="text-slate-400 text-xs font-medium mt-1">
                {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
             </Text>
          </View>
          
          <Text className="text-slate-800 font-bold text-lg mb-2 leading-6">{item.title}</Text>
          <Text className="text-slate-500 text-sm leading-6" numberOfLines={3}>{item.desc}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
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
        <Text className="text-xl font-black text-white tracking-tight">Informasi Sekolah</Text>
        <View className="w-10" /> 
      </LinearGradient>

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
            <View className="items-center py-20 px-10 opacity-80">
               <LottieView
                  source={require('../assets/animations/No-Data.json')}
                  autoPlay
                  loop
                  style={{ width: 200, height: 200 }}
               />
               <Text className="text-slate-800 font-bold text-lg -mt-4 text-center">Belum Ada Informasi</Text>
               <Text className="text-slate-400 text-center text-sm leading-6">Tidak ada pengumuman atau berita terbaru dari sekolah saat ini.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AnnouncementsScreen;
