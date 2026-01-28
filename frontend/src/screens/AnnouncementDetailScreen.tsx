import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Calendar,
  Info,
  FileText,
  Share2,
  Clock,
  MapPin,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MAIN_APP_URL } from '@env';
import RenderHTML from 'react-native-render-html';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnnouncementDetailScreen = ({ navigation, route }: any) => {
  const { item } = route.params;
  const { width } = useWindowDimensions();

  const getTheme = (type: string) => {
    switch (type) {
      case 'libur':
        return {
          label: 'LIBUR SEKOLAH',
          bgHeader: 'bg-red-600',
          text: 'text-red-600',
          bgBadge: 'bg-red-50',
          icon: Calendar,
        };
      case 'berita':
        return {
          label: 'BERITA & KEGIATAN',
          bgHeader: 'bg-emerald-600',
          text: 'text-emerald-600',
          bgBadge: 'bg-emerald-50',
          icon: FileText,
        };
      case 'agenda':
        return {
          label: 'AGENDA SEKOLAH',
          bgHeader: 'bg-amber-500',
          text: 'text-amber-600',
          bgBadge: 'bg-amber-50',
          icon: Clock,
        };
      default:
        return {
          label: 'PENGUMUMAN PENTING',
          bgHeader: 'bg-blue-600',
          text: 'text-blue-600',
          bgBadge: 'bg-blue-50',
          icon: Info,
        };
    }
  };

  const theme = getTheme(item.type);
  const Icon = theme.icon;
  const imageUrl = item.image ? `${MAIN_APP_URL}/storage/${item.image}` : null;

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Dynamic Header Background */}
      {imageUrl ? (
        <View className="absolute top-0 w-full h-96 bg-slate-900">
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full opacity-80"
            resizeMode="cover"
          />
          {/* Gradient Overlay for Text Readability */}
          <View className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-black/80 to-transparent" />
        </View>
      ) : (
        <View className={`absolute top-0 w-full h-80 ${theme.bgHeader}`}>
          <View className="absolute -right-10 -bottom-10 opacity-20">
            <Icon size={240} color="white" />
          </View>
          <View className="absolute left-10 top-20 opacity-10 bg-white w-32 h-32 rounded-full" />
        </View>
      )}

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Navigation Bar */}
        <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md items-center justify-center border border-white/30"
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md items-center justify-center border border-white/30">
            <Share2 size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Animated.View entering={FadeInUp.duration(600).springify()}>
            {/* Main Content Card (Floating) */}
            <View className="mx-5 mt-4 bg-white rounded-[32px] p-6 shadow-xl shadow-slate-300">
              {/* Metadata Row */}
              <View className="flex-row items-center justify-between mb-4">
                <View className={`px-3 py-1.5 rounded-full ${theme.bgBadge}`}>
                  <Text
                    className={`text-[10px] font-black tracking-widest ${theme.text}`}
                  >
                    {theme.label}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Clock size={12} color="#94a3b8" />
                  <Text className="text-slate-400 text-xs font-bold ml-1.5">
                    {new Date(item.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text className="text-2xl font-black text-slate-900 leading-9 mb-6">
                {item.title}
              </Text>

              {/* Agenda Specific Info */}
              {item.type === 'agenda' && (
                <View className="mb-6 gap-3">
                  {item.lokasi && (
                    <View className="flex-row items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <View className="bg-amber-100 p-2 rounded-xl mr-3">
                        <MapPin size={16} color="#d97706" />
                      </View>
                      <View>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase">
                          Lokasi
                        </Text>
                        <Text className="text-slate-700 font-bold text-sm">
                          {item.lokasi}
                        </Text>
                      </View>
                    </View>
                  )}
                  {item.jam && (
                    <View className="flex-row items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <View className="bg-blue-100 p-2 rounded-xl mr-3">
                        <Clock size={16} color="#2563eb" />
                      </View>
                      <View>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase">
                          Waktu
                        </Text>
                        <Text className="text-slate-700 font-bold text-sm">
                          {item.jam}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Separator */}
              <View className="flex-row items-center mb-6 opacity-20">
                <View className="h-[2px] flex-1 bg-slate-900" />
                <View className="w-2 h-2 rounded-full bg-slate-900 mx-2" />
                <View className="h-[2px] flex-1 bg-slate-900" />
              </View>

              {/* Body Text (Rendered HTML) */}
              <View className="min-h-[300px]">
                <RenderHTML
                  contentWidth={width - 40} // Accounting for padding
                  source={{ html: item.content || item.isi || item.desc || '' }}
                  tagsStyles={{
                    p: {
                      marginBottom: 16,
                      fontSize: 16,
                      lineHeight: 26,
                      color: '#475569',
                      textAlign: 'left',
                    },
                    b: { fontWeight: 'bold', color: '#1e293b' },
                    strong: { fontWeight: 'bold', color: '#1e293b' },
                    ul: { marginBottom: 16 },
                    li: { fontSize: 16, color: '#475569', marginBottom: 8 },
                    a: { color: '#2563eb', textDecorationLine: 'underline' },
                  }}
                />
              </View>

              {/* Footer / Signature (Optional) */}
              <View className="mt-8 pt-6 border-t border-slate-50">
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center">
                  Simak Mobile Official Info
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AnnouncementDetailScreen;
