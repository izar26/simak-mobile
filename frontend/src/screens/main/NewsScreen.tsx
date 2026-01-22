import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl, Modal, Dimensions, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, User, X } from 'lucide-react-native';
import RenderHtml from 'react-native-render-html';
import api from '../../services/api';
import { MAIN_APP_URL } from '@env';
import Skeleton from '../../components/Skeleton';

const NewsSkeleton = () => (
  <View className="p-4">
    {[1, 2, 3].map(i => (
      <View key={i} className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <Skeleton width="100%" height={150} style={{ borderRadius: 12, marginBottom: 12 }} />
        <Skeleton width="90%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} />
      </View>
    ))}
  </View>
);

const NewsScreen = ({ navigation }: any) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await api.get('/berita');
      setNews(response.data);
    } catch (error) {
      console.log('Gagal ambil berita', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${MAIN_APP_URL}/storage/beritas/${path}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <Text className="text-xl font-extrabold text-slate-800 tracking-tight">Berita Sekolah</Text>
      </View>

      {loading ? (
        <NewsSkeleton />
      ) : (
        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
        >
          {news.length > 0 ? (
            <>
              {/* Featured News (Item Pertama) */}
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setSelectedNews(news[0])}
                className="bg-white rounded-[24px] mb-8 shadow-sm border border-slate-100 overflow-hidden"
              >
                <View className="relative">
                  {news[0].gambar ? (
                    <Image 
                      source={{ uri: getImageUrl(news[0].gambar) }} 
                      className="w-full h-56 bg-slate-200"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-56 bg-slate-100 items-center justify-center">
                      <Image source={{ uri: 'https://via.placeholder.com/400x200?text=No+Image' }} className="w-full h-full opacity-50" />
                    </View>
                  )}
                  <View className="absolute top-4 left-4 bg-blue-600 px-3 py-1 rounded-full shadow-lg">
                    <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Terbaru</Text>
                  </View>
                </View>
                
                <View className="p-5">
                  <View className="flex-row items-center mb-2 space-x-2">
                    <Calendar size={12} color="#64748b" />
                    <Text className="text-slate-400 text-xs font-medium ml-1">{formatDate(news[0].created_at)}</Text>
                  </View>
                  <Text className="text-slate-800 font-black text-xl leading-7 mb-2">
                    {news[0].judul}
                  </Text>
                  <Text className="text-slate-500 text-sm leading-5" numberOfLines={2}>
                    {news[0].ringkasan || news[0].isi?.replace(/<[^>]+>/g, '')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Recent News List (Item Selanjutnya) */}
              <Text className="text-slate-800 font-bold text-lg mb-4 px-1">Berita Lainnya</Text>
              
              {news.slice(1).map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => setSelectedNews(item)}
                  className="flex-row bg-white rounded-2xl mb-4 shadow-sm border border-slate-100 overflow-hidden p-3"
                >
                  <View className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 mr-4">
                    {item.gambar ? (
                      <Image 
                        source={{ uri: getImageUrl(item.gambar) }} 
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <User size={20} color="#cbd5e1" />
                      </View>
                    )}
                  </View>
                  
                  <View className="flex-1 justify-center py-1">
                    <View className="flex-row items-center mb-1.5">
                      <Text className="text-blue-600 text-[10px] font-bold uppercase">{item.penulis || 'Sekolah'}</Text>
                      <Text className="text-slate-300 text-[10px] mx-1">•</Text>
                      <Text className="text-slate-400 text-[10px]">{formatDate(item.created_at)}</Text>
                    </View>
                    
                    <Text className="text-slate-800 font-bold text-sm leading-5 mb-1.5" numberOfLines={2}>
                      {item.judul}
                    </Text>
                    
                    <Text className="text-slate-400 text-xs leading-4" numberOfLines={1}>
                      {item.ringkasan || 'Klik untuk membaca selengkapnya...'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View className="items-center py-20">
              <Text className="text-slate-400">Belum ada berita terbaru.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal 
        visible={!!selectedNews} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedNews(null)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
            <TouchableOpacity onPress={() => setSelectedNews(null)} className="p-2 bg-slate-50 rounded-full">
              <ChevronLeft size={24} color="#334155" />
            </TouchableOpacity>
            <Text className="font-bold text-slate-700">Detail Berita</Text>
            <View className="w-10" />
          </View>

          {selectedNews && (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
              <Text className="text-2xl font-black text-slate-800 leading-8 mb-4">
                {selectedNews.judul}
              </Text>
              
              <View className="flex-row items-center mb-6 space-x-4">
                <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
                   <Calendar size={14} color="#2563eb" />
                   <Text className="text-blue-700 text-xs font-bold ml-2">
                     {formatDate(selectedNews.created_at)}
                   </Text>
                </View>
                <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-full ml-2">
                   <User size={14} color="#64748b" />
                   <Text className="text-slate-600 text-xs font-bold ml-2">
                     {selectedNews.penulis || 'Admin'}
                   </Text>
                </View>
              </View>

              {selectedNews.gambar && (
                <Image 
                  source={{ uri: getImageUrl(selectedNews.gambar) }} 
                  className="w-full h-56 rounded-2xl mb-6 bg-slate-100"
                  resizeMode="cover"
                />
              )}

              {/* Render HTML Content */}
              <View>
                 <RenderHtml
                    contentWidth={width - 40}
                    source={{ html: selectedNews.isi }}
                    tagsStyles={{
                        p: { color: '#334155', lineHeight: 24, marginBottom: 16, fontSize: 16 },
                        h1: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
                        h2: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
                        ul: { marginBottom: 16 },
                        li: { color: '#334155', lineHeight: 24 },
                        img: { borderRadius: 12, marginTop: 12, marginBottom: 12 }
                    }}
                 />
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

export default NewsScreen;
