import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, CheckCircle, XCircle, Clock, Info } from 'lucide-react-native';
import api from '../services/api';
import Animated, { FadeInUp } from 'react-native-reanimated';

const NotificationScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/siswa/notifikasi');
      setNotifications(response.data);
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return { icon: CheckCircle, color: '#10b981', bg: 'bg-emerald-50' };
      case 'error': return { icon: XCircle, color: '#ef4444', bg: 'bg-red-50' };
      default: return { icon: Clock, color: '#f59e0b', bg: 'bg-amber-50' };
    }
  };

  const renderItem = ({ item, index }: any) => {
    const theme = getIcon(item.type);
    const Icon = theme.icon;

    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 100).duration(500)}
        className={`mb-4 p-4 rounded-2xl border ${item.type === 'error' ? 'bg-red-50/30 border-red-100' : 'bg-white border-slate-100'} shadow-sm`}
      >
        <View className="flex-row items-start">
          <View className={`${theme.bg} p-2.5 rounded-full mr-3`}>
            <Icon size={20} color={theme.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
               <Text className="text-slate-800 font-bold text-base flex-1 mr-2">{item.title}</Text>
               <Text className="text-slate-400 text-[10px] mt-1">{item.date}</Text>
            </View>
            
            <Text className="text-slate-600 text-sm mt-1 leading-5">{item.message}</Text>
            
            {item.catatan && (
              <View className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <Text className="text-slate-500 text-xs font-medium italic">
                  " {item.catatan} "
                </Text>
                <Text className="text-slate-400 text-[10px] mt-1 text-right">- Admin Sekolah</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-100 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-100">
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-slate-800 tracking-tight">Notifikasi</Text>
        <View className="w-10" /> 
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center py-20 px-10">
              <View className="bg-slate-100 p-6 rounded-full mb-6">
                 <Bell size={48} color="#cbd5e1" />
              </View>
              <Text className="text-slate-800 font-bold text-lg mb-2 text-center">Belum Ada Notifikasi</Text>
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