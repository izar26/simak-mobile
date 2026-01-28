import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  FileText,
  Download as DownloadIcon,
  Image as ImageIcon,
  File,
  Search,
  FolderOpen,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Skeleton from '../../components/Skeleton';
import { fetchWithSmartCache } from '../../utils/apiCache';

const UnduhanScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  useEffect(() => {
    fetchData(false);
  }, []);

  const fetchData = async (isManualRefresh = false) => {
    try {
      // Endpoint: /siswa/unduhan
      // Key: DOWNLOAD_LIST
      // TTL: 60 Menit (File jarang berubah)
      const result = await fetchWithSmartCache(
        '/siswa/unduhan',
        'DOWNLOAD_LIST',
        60,
        isManualRefresh,
      );
      setData(result || []);
    } catch (error) {
      console.log('Error fetch unduhan:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // --- LOGIC KATEGORI ---
  // Ambil list kategori unik dari data yang ada
  const categories = useMemo(() => {
    const cats = ['Semua'];
    if (data) {
      const unique = [...new Set(data.map((item: any) => item.category))];
      cats.push(...unique);
    }
    return cats;
  }, [data]);

  // Filter Data
  const filteredData = useMemo(() => {
    if (selectedCategory === 'Semua') return data;
    return data.filter((item: any) => item.category === selectedCategory);
  }, [data, selectedCategory]);

  // --- HELPER IKON ---
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return { icon: FileText, color: '#ef4444', bg: 'bg-red-50' }; // Merah
      case 'doc':
      case 'docx':
        return { icon: FileText, color: '#3b82f6', bg: 'bg-blue-50' }; // Biru
      case 'xls':
      case 'xlsx':
        return { icon: FileText, color: '#10b981', bg: 'bg-emerald-50' }; // Hijau
      case 'png':
      case 'jpg':
      case 'jpeg':
        return { icon: ImageIcon, color: '#8b5cf6', bg: 'bg-violet-50' }; // Ungu (sesuai gambar)
      default:
        return { icon: File, color: '#64748b', bg: 'bg-slate-50' }; // Abu
    }
  };

  const handleDownload = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Gagal membuka link', err));
  };

  const renderItem = ({ item, index }: any) => {
    const style = getFileIcon(item.type);
    const Icon = style.icon;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)} className="mb-3">
        <View className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center">
          {/* Icon Box */}
          <View
            className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${style.bg}`}
          >
            <Icon size={24} color={style.color} />
            <View className="absolute -bottom-1 bg-white px-1 rounded border border-slate-100 shadow-sm">
              <Text className="text-[8px] font-bold uppercase text-slate-500">
                {item.type}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1 mr-2">
            <Text
              className="text-slate-800 font-bold text-sm mb-1 line-clamp-2"
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="bg-slate-100 px-2 py-0.5 rounded">
                <Text className="text-slate-500 text-[10px]">
                  {item.category}
                </Text>
              </View>
              <Text className="text-slate-400 text-[10px]">
                {new Date(item.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
          </View>

          {/* Download Button */}
          <TouchableOpacity
            onPress={() => handleDownload(item.url)}
            className="bg-slate-900 px-3 py-2 rounded-lg flex-row items-center gap-1 shadow-md shadow-slate-300 active:scale-95"
          >
            <Text className="text-white text-xs font-bold">Unduh</Text>
            <DownloadIcon size={12} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* --- HEADER --- */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-6 rounded-b-[32px] shadow-lg z-10"
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold ml-4">
            Pusat Unduhan
          </Text>
        </View>

        <Text className="text-slate-400 text-sm mb-1">
          Temukan modul, panduan, dan arsip digital.
        </Text>
      </LinearGradient>

      {/* --- KATEGORI TABS --- */}
      <View className="mt-4">
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10 }}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                selectedCategory === item
                  ? 'bg-slate-800 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedCategory === item ? 'text-white' : 'text-slate-600'
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* --- LIST FILES --- */}
      <View className="flex-1 px-6">
        {loading ? (
          <View>
            {[1, 2, 3, 4].map(i => (
              <View
                key={i}
                className="bg-white p-4 rounded-2xl mb-3 flex-row items-center"
              >
                <Skeleton
                  width={48}
                  height={48}
                  borderRadius={12}
                  style={{ marginRight: 16 }}
                />
                <View className="flex-1">
                  <Skeleton
                    width="80%"
                    height={16}
                    style={{ marginBottom: 8 }}
                  />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0f172a']}
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <View className="bg-slate-100 p-6 rounded-full mb-4">
                  <FolderOpen size={48} color="#cbd5e1" />
                </View>
                <Text className="text-slate-800 font-bold text-lg">
                  Tidak Ada File
                </Text>
                <Text className="text-slate-400 text-center text-sm px-8 mt-1">
                  Belum ada dokumen yang tersedia untuk kategori "
                  {selectedCategory}".
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

export default UnduhanScreen;
