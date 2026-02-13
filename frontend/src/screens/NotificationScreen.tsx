import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react-native';
import api from '../services/api';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';

const NotificationScreen = ({ navigation }: any) => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<number>(Date.now());

  // STATE MODAL
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Load Waktu Baca Terakhir
      const time = await AsyncStorage.getItem('last_read_time');
      if (time) setLastReadTime(parseInt(time));
      else setLastReadTime(0);

      // 2. CEK CACHE DULU (Agar user tidak menunggu loading spinner)
      const cachedData = await AsyncStorage.getItem('notif_cache');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          // Langsung tampilkan data lama
          setSections(groupNotifications(parsed));
          setLoading(false);
        } catch (e) {
          console.log('Cache error', e);
        }
      }

      // 3. Ambil data baru di background (Silent Update)
      fetchNotifications();
    };

    loadInitialData();

    // Update waktu baca saat keluar halaman
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
      Kemarin: [],
      'Minggu Ini': [],
      'Bulan Ini': [],
      'Riwayat Lama': [],
    };

    data.forEach(item => {
      const date = new Date(item.raw_date);
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

    return Object.keys(groups)
      .map(title => ({ title, data: groups[title] }))
      .filter(section => section.data.length > 0);
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/siswa/notifikasi');

      // Simpan ke Cache
      await AsyncStorage.setItem('notif_cache', JSON.stringify(response.data));
      await AsyncStorage.setItem(
        'last_seen_notif_count',
        response.data.length.toString(),
      );

      const grouped = groupNotifications(response.data);
      setSections(grouped);
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
      case 'success':
        return {
          icon: CheckCircle,
          color: '#10b981',
          bg: 'bg-emerald-50',
          border: 'border-emerald-500',
          text: 'text-emerald-700',
          gradient: ['#d1fae5', '#ffffff'],
        };
      case 'error':
        return {
          icon: XCircle,
          color: '#ef4444',
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-700',
          gradient: ['#fee2e2', '#ffffff'],
        };
      default:
        return {
          icon: Clock,
          color: '#f59e0b',
          bg: 'bg-amber-50',
          border: 'border-amber-500',
          text: 'text-amber-700',
          gradient: ['#fef3c7', '#ffffff'],
        };
    }
  };

  const formatLabel = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // Gunakan useCallback agar item tidak render ulang saat modal dibuka (Mencegah kedip)
  const renderItem = useCallback(
    ({ item, index }: any) => {
      const theme = getTheme(item.type);
      const Icon = theme.icon;
      const itemTime = new Date(item.raw_date).getTime();
      const isNew = itemTime > lastReadTime;

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenDetail(item)}
            className={`mb-4 bg-white rounded-2xl shadow-sm border overflow-hidden flex-row ${isNew ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'
              }`}
          >
            <View
              className={`w-1.5 h-full ${theme.bg}`}
              style={{ backgroundColor: theme.color }}
            />
            <View className="flex-1 p-4">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className={`${theme.bg} p-1.5 rounded-full mr-2`}>
                    <Icon size={16} color={theme.color} />
                  </View>
                  <Text
                    className={`font-bold text-sm ${theme.text} flex-1`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {isNew && (
                    <View className="bg-red-500 px-2 py-0.5 rounded-full ml-2 animate-pulse">
                      <Text className="text-white text-[8px] font-bold">
                        BARU
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-slate-400 text-[10px] font-medium mt-1">
                  {item.date}
                </Text>
              </View>

              <Text
                className="text-slate-600 text-sm leading-5 mb-2 pl-9"
                numberOfLines={2}
              >
                {item.message}
              </Text>

              <View className="flex-row justify-end mt-1">
                <Text className="text-blue-500 text-[10px] font-bold">
                  Ketuk untuk detail
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [lastReadTime],
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View className="flex-row items-center mb-3 mt-2">
      <View className="bg-slate-100 px-3 py-1 rounded-full">
        <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
          {title}
        </Text>
      </View>
      <View className="h-[1px] flex-1 bg-slate-100 ml-3" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
        className="flex-row items-center justify-between px-6 py-4 pt-4 shadow-lg mb-2"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center border border-white/30 backdrop-blur-md"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-tight">
          Notifikasi
        </Text>
        <View className="w-10" />
      </LinearGradient>

      {/* Tampilkan Loading hanya jika tidak ada cache DAN sedang fetch awal */}
      {loading && sections.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center py-10 px-10 opacity-90">
              <LottieView
                source={require('../assets/animations/No-Data.json')}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
              <Text className="text-slate-800 font-bold text-xl -mt-4 text-center">
                Belum Ada Kabar
              </Text>
              <Text className="text-slate-400 text-center text-sm leading-6">
                Notifikasi persetujuan atau informasi penting dari sekolah akan
                muncul di sini.
              </Text>
            </View>
          }
        />
      )}

      {/* --- MODAL DETAIL PREMIUM --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center px-4">
          {/* Animated Container */}
          {selectedItem && (
            <Animated.View
              entering={ZoomIn.duration(300).springify().damping(12)}
              className="bg-white w-full max-h-[85%] rounded-[32px] overflow-hidden shadow-2xl"
            >
              {(() => {
                const theme = getTheme(selectedItem.type);
                const Icon = theme.icon;

                // Parse data JSON
                let dataPerubahan = null;
                if (selectedItem.data_perubahan) {
                  try {
                    dataPerubahan =
                      typeof selectedItem.data_perubahan === 'string'
                        ? JSON.parse(selectedItem.data_perubahan)
                        : selectedItem.data_perubahan;
                  } catch (e) { }
                }

                // Tentukan Judul List & Warna
                let listTitle = 'Rincian Data Pengajuan';
                let listDesc = 'Berikut data yang Anda ajukan untuk diubah:';

                if (selectedItem.type === 'error') {
                  listTitle = 'Kolom Ditolak';
                  listDesc = 'Data berikut belum disetujui oleh sekolah:';
                } else if (selectedItem.type === 'success') {
                  listTitle = 'Data Disetujui';
                  listDesc = 'Perubahan data berikut telah berhasil diterapkan:';
                }

                return (
                  <>
                    {/* Header Premium */}
                    <LinearGradient
                      colors={theme.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      className="pt-8 pb-10 px-6 items-center relative overflow-hidden"
                    >
                      {/* Decorative Circles */}
                      <View className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
                      <View className="absolute top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-xl" />

                      <View
                        className={`w-20 h-20 rounded-3xl bg-white shadow-lg shadow-slate-200/50 items-center justify-center mb-5 rotate-3 border-4 border-white/50`}
                      >
                        <Icon size={40} color={theme.color} strokeWidth={2.5} />
                      </View>

                      <Text className={`text-xl font-black text-center ${theme.text} mb-1 tracking-tight`}>
                        {selectedItem.title}
                      </Text>
                      <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest bg-white/60 px-3 py-1 rounded-full overflow-hidden">
                        {selectedItem.date}
                      </Text>
                    </LinearGradient>

                    {/* Content Scroll */}
                    <ScrollView
                      className="flex-1 -mt-6 rounded-t-[32px] bg-white pt-8 px-6"
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 40 }}
                    >
                      <Text className="text-slate-600 text-center text-sm leading-6 mb-8 font-medium">
                        {selectedItem.message}
                      </Text>

                      {/* Catatan Operator Premium */}
                      {selectedItem.catatan && (
                        <View className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 mb-8 relative">
                          <View className="absolute -top-3 left-4 bg-slate-800 px-3 py-1 rounded-full">
                            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                              Catatan Verifikator
                            </Text>
                          </View>
                          <Text className="text-slate-700 text-sm font-medium italic mt-2 leading-relaxed">
                            "{selectedItem.catatan}"
                          </Text>
                        </View>
                      )}

                      {/* Rincian Data Modern List */}
                      {dataPerubahan && Object.keys(dataPerubahan).length > 0 ? (
                        <View>
                          <View className="flex-row items-center mb-4">
                            <View className={`w-1 h-5 rounded-full mr-3 ${theme.bg}`} style={{ backgroundColor: theme.color }} />
                            <View>
                              <Text className="text-slate-800 font-bold text-base">
                                {listTitle}
                              </Text>
                              <Text className="text-slate-400 text-[11px] font-medium">
                                {listDesc}
                              </Text>
                            </View>
                          </View>

                          <View className="space-y-3">
                            {Object.keys(dataPerubahan).map((key, i) => (
                              <View
                                key={key}
                                className="flex-row items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm shadow-slate-100"
                              >
                                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${selectedItem.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
                                  }`}>
                                  <FileText
                                    size={18}
                                    color={selectedItem.type === 'error' ? '#ef4444' : '#3b82f6'}
                                    strokeWidth={2}
                                  />
                                </View>
                                <View className="flex-1">
                                  <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">
                                    {formatLabel(key)}
                                  </Text>
                                  <Text className={`text-sm font-bold ${selectedItem.type === 'error' ? 'text-slate-400 line-through' : 'text-slate-800'
                                    }`}>
                                    {dataPerubahan[key] || '-'}
                                  </Text>
                                </View>
                                {selectedItem.type === 'success' && (
                                  <View className="bg-emerald-50 p-1.5 rounded-full">
                                    <CheckCircle size={14} color="#10b981" />
                                  </View>
                                )}
                                {selectedItem.type === 'error' && (
                                  <View className="bg-red-50 p-1.5 rounded-full">
                                    <XCircle size={14} color="#ef4444" />
                                  </View>
                                )}
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : (
                        selectedItem.type === 'error' && (
                          <View className="py-8 items-center opacity-50">
                            <FileText size={40} color="#cbd5e1" />
                            <Text className="text-center text-slate-400 text-xs font-bold mt-2 uppercase">
                              Data Tidak Tersedia
                            </Text>
                          </View>
                        )
                      )}
                    </ScrollView>

                    {/* Footer Action */}
                    <View className="p-6 pt-2 pb-8 bg-white border-t border-slate-50">
                      <TouchableOpacity
                        onPress={() => setModalVisible(false)}
                        className="bg-slate-900 h-14 rounded-2xl items-center justify-center shadow-lg shadow-slate-200 active:scale-95 transition-transform"
                        activeOpacity={0.9}
                      >
                        <Text className="text-white font-bold text-base tracking-wide">
                          Tutup Detail
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
            </Animated.View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default NotificationScreen;
