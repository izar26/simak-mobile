import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MAIN_APP_URL } from '@env';
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  CreditCard,
  XCircle,
  Thermometer,
  Globe,
  UserPlus,
  User,
  MapPin,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInRight, ZoomIn } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Skeleton from '../../components/Skeleton';
import { fetchWithSmartCache } from '../../utils/apiCache';

// --- HELPERS & CONFIG ---

const { width } = Dimensions.get('window');

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const checkIsLive = (jamRange: string, now: Date) => {
  try {
    const [start, end] = jamRange.split(' - ');
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const s = new Date(now);
    s.setHours(startH, startM, 0);
    const e = new Date(now);
    e.setHours(endH, endM, 0);

    return now >= s && now < e;
  } catch {
    return false;
  }
};

// Static Menu Data (Prevent recreation on render)
const MENU_ITEMS = [
  {
    label: 'Profil',
    icon: User,
    color: '#2563eb',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    nav: 'Profil',
  },
  {
    label: 'Jadwal',
    icon: Calendar,
    color: '#d97706',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    nav: 'Jadwal',
  },
  {
    label: 'Dokumen',
    icon: FileText,
    color: '#16a34a',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    nav: 'BerkasSaya',
  },
  {
    label: 'Kartu',
    icon: CreditCard,
    color: '#dc2626',
    bg: 'bg-red-50',
    border: 'border-red-100',
    nav: 'KartuPelajar',
  },
  {
    label: 'Website',
    icon: Globe,
    color: '#0ea5e9',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    isLink: true,
  }, // Dynamic link handled in component
  {
    label: 'SPMB',
    icon: UserPlus,
    color: '#8b5cf6',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    isLink: true,
  },
];

// --- SUB-COMPONENTS (MEMOIZED) ---

const StatPill = React.memo(
  ({ label, value, icon: Icon, colorClass, iconColor }: any) => (
    <View className="flex-1 items-center">
      <View className="bg-white/20 p-2 rounded-2xl mb-1 backdrop-blur-sm">
        <Icon size={18} color="white" />
      </View>
      <Text className="text-white font-black text-lg shadow-sm">{value}</Text>
      <Text className="text-blue-100 text-[10px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </Text>
    </View>
  ),
);

const MenuButton = React.memo(({ item, navigation, user }: any) => {
  const handlePress = () => {
    if (item.isLink) {
      const url =
        item.label === 'Website'
          ? user?.siswa?.sekolah?.website
          : user?.siswa?.sekolah?.spmb;
      if (url) Linking.openURL(url);
    } else {
      navigation.navigate(item.nav, { user });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="w-[30%] items-center gap-2 mb-2 active:opacity-70"
    >
      <View
        className={`${item.bg} w-[68px] h-[68px] rounded-[26px] items-center justify-center border ${item.border} shadow-sm`}
      >
        <item.icon size={26} color={item.color} strokeWidth={2} />
      </View>
      <Text className="text-slate-600 text-[11px] font-bold text-center tracking-tight">
        {item.label}
      </Text>
    </TouchableOpacity>
  );
});

const ScheduleCard = React.memo(
  ({ item, isLive }: { item: any; isLive: boolean }) => {
    return (
      <Animated.View
        entering={FadeInRight}
        className={`mr-4 w-72 p-5 rounded-[28px] border relative overflow-hidden h-[170px] justify-between ${
          isLive
            ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-200'
            : 'bg-white border-slate-100 shadow-sm'
        }`}
      >
        {/* Background Decor for Live */}
        {isLive && (
          <View className="absolute -right-10 -bottom-10 opacity-10">
            <Clock size={150} color="white" />
          </View>
        )}

        <View>
          <View className="flex-row justify-between items-start mb-3">
            <View
              className={`flex-row items-center px-3 py-1.5 rounded-full ${
                isLive
                  ? 'bg-blue-500/50 border border-blue-400'
                  : 'bg-slate-50 border border-slate-100'
              }`}
            >
              <Clock size={12} color={isLive ? 'white' : '#64748b'} />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  isLive ? 'text-white' : 'text-slate-600'
                }`}
              >
                {item.jam}
              </Text>
            </View>
            {isLive && (
              <View className="bg-red-500 px-3 py-1 rounded-full animate-pulse shadow-sm border border-red-400">
                <Text className="text-white text-[9px] font-black tracking-widest uppercase">
                  LIVE
                </Text>
              </View>
            )}
          </View>

          <Text
            className={`font-black text-xl leading-7 mb-1 ${
              isLive ? 'text-white' : 'text-slate-800'
            }`}
            numberOfLines={2}
          >
            {item.mapel}
          </Text>
        </View>

        <View>
          {/* Divider */}
          <View
            className={`h-[1px] w-full mb-3 ${
              isLive ? 'bg-white/20' : 'bg-slate-100'
            }`}
          />

          <View className="flex-row items-center">
            {!item.is_non_kbm ? (
              <>
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                    isLive ? 'bg-blue-400' : 'bg-blue-50'
                  }`}
                >
                  <User size={12} color={isLive ? 'white' : '#3b82f6'} />
                </View>
                <Text
                  className={`text-xs font-bold flex-1 ${
                    isLive ? 'text-blue-50' : 'text-slate-500'
                  }`}
                  numberOfLines={1}
                >
                  {item.guru}
                </Text>
              </>
            ) : (
              <Text
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  isLive
                    ? 'bg-white/20 text-white'
                    : 'bg-orange-50 text-orange-600'
                }`}
              >
                Kegiatan Sekolah
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  },
);

const AnnouncementCard = React.memo(({ item, onPress }: any) => {
  const isHoliday = item.type === 'libur';
  const borderColor = isHoliday ? 'border-red-100' : 'border-slate-100';
  const tagBg = isHoliday ? 'bg-red-50' : 'bg-blue-50';
  const tagText = isHoliday ? 'text-red-600' : 'text-blue-600';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`w-[280px] bg-white border ${borderColor} shadow-sm p-5 rounded-[24px] mr-4 h-[140px] justify-between`}
    >
      <View>
        <View className="flex-row justify-between items-center mb-3">
          <View className={`px-2.5 py-1 rounded-lg ${tagBg}`}>
            <Text
              className={`text-[9px] font-black uppercase tracking-wider ${tagText}`}
            >
              {item.type === 'libur'
                ? 'Libur'
                : item.type === 'berita'
                ? 'Berita'
                : 'Info'}
            </Text>
          </View>
          <Text className="text-slate-400 text-[10px] font-bold">
            {new Date(item.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>
        <Text
          className="text-slate-800 font-black text-[15px] leading-5"
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
      <View className="flex-row items-center">
        <Text
          className="text-slate-400 text-xs font-medium flex-1 mr-2"
          numberOfLines={1}
        >
          {item.desc || 'Ketuk untuk detail informasi'}
        </Text>
        <ChevronRight size={14} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );
});

// --- MAIN SCREEN ---

const DashboardScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [pengumuman, setPengumuman] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    Hadir: 0,
    Sakit: 0,
    Izin: 0,
    Alfa: 0,
  });
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  const scheduleScrollRef = useRef<ScrollView>(null);

  // Time ticker (Separated from data fetch to be lightweight)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (jadwal.length > 0) {
      const liveIndex = jadwal.findIndex(item => checkIsLive(item.jam, now));
      if (liveIndex !== -1 && scheduleScrollRef.current) {
        scheduleScrollRef.current.scrollTo({
          x: liveIndex * 288,
          animated: true,
        });
      }
    }
  }, [jadwal, now]);

  const fetchData = async (isManualRefresh = false) => {
    try {
      const [userData, jadwalData, absensiData, notifList] = await Promise.all([
        fetchWithSmartCache('/me', 'USER_PROFILE_DATA', 60, isManualRefresh),
        fetchWithSmartCache(
          '/siswa/jadwal-hari-ini',
          'DASHBOARD_JADWAL',
          30,
          isManualRefresh,
        ),
        fetchWithSmartCache(
          '/siswa/absensi',
          'DASHBOARD_ABSENSI',
          60,
          isManualRefresh,
        ),
        fetchWithSmartCache(
          '/siswa/notifikasi',
          'DASHBOARD_NOTIF',
          15,
          isManualRefresh,
        ),
      ]);

      setUser(userData);

      // Handle legacy structure
      if (jadwalData.jadwal) {
        setJadwal(jadwalData.jadwal);
        setPengumuman(jadwalData.pengumuman || []);
      } else {
        setJadwal(Array.isArray(jadwalData) ? jadwalData : []);
      }

      setAttendanceStats(
        absensiData.stats || { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 },
      );

      // Notif logic
      const lastSeen = await AsyncStorage.getItem('last_seen_notif_count');
      setNotifCount(
        Math.max(
          0,
          (notifList?.length || 0) - (lastSeen ? parseInt(lastSeen) : 0),
        ),
      );
    } catch (error) {
      console.log('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  if (loading && !user) return <DashboardSkeleton />;

  const siswa = user?.siswa;
  const fotoUrl = siswa?.foto ? `${MAIN_APP_URL}/storage/${siswa.foto}` : null;

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50"
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      {/* HEADER */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-slate-50 z-10">
        <View className="flex-row items-center gap-3.5">
          <View className="p-[3px] bg-white rounded-full shadow-sm border border-slate-100">
            {fotoUrl ? (
              <Image
                source={{ uri: fotoUrl }}
                className="w-11 h-11 rounded-full"
              />
            ) : (
              <View className="w-11 h-11 rounded-full bg-blue-50 items-center justify-center">
                <User size={20} color="#3b82f6" />
              </View>
            )}
          </View>
          <View>
            <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">
              {getGreeting()}
            </Text>
            <Text
              className="text-slate-800 font-black text-lg leading-6"
              numberOfLines={1}
            >
              {siswa?.nama ? siswa.nama.split(' ')[0] : 'Siswa'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Notifikasi')}
          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm"
        >
          <Bell size={20} color="#64748b" />
          {notifCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full w-4 h-4 items-center justify-center border-2 border-white">
              <Text className="text-white text-[8px] font-black">
                {notifCount > 9 ? '9+' : notifCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
          />
        }
      >
        {/* BANNER AKADEMIK */}
        <Animated.View
          entering={FadeIn.duration(600)}
          className="px-6 mt-2 mb-8"
        >
          <LinearGradient
            colors={['#2563eb', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6 rounded-[32px] relative shadow-xl shadow-blue-200 overflow-hidden"
          >
            {/* Decoration */}
            <View className="absolute -right-6 -bottom-6 opacity-20">
              <LottieView
                source={require('../../assets/animations/Back to School.json')}
                autoPlay
                loop
                style={{ width: 180, height: 180 }}
              />
            </View>

            <View className="mb-8">
              <View className="bg-white/10 self-start px-3 py-1 rounded-full mb-3 backdrop-blur-md border border-white/10">
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                  {siswa?.tapel_aktif?.semester || 'Semester Ganjil'}
                </Text>
              </View>
              <Text className="text-white font-black text-3xl tracking-tight">
                {siswa?.tapel_aktif?.tahun_ajaran || '2025/2026'}
              </Text>
              <Text className="text-blue-100 font-medium text-sm">
                Tahun Ajaran Aktif
              </Text>
            </View>

            <View className="flex-row gap-2 bg-black/10 p-2 rounded-3xl border border-white/5 backdrop-blur-sm">
              <StatPill
                label="Hadir"
                value={attendanceStats.Hadir}
                icon={CheckCircle}
              />
              <View className="w-[1px] bg-white/10 my-2" />
              <StatPill
                label="Sakit"
                value={attendanceStats.Sakit}
                icon={Thermometer}
              />
              <View className="w-[1px] bg-white/10 my-2" />
              <StatPill
                label="Izin"
                value={attendanceStats.Izin}
                icon={Clock}
              />
              <View className="w-[1px] bg-white/10 my-2" />
              <StatPill
                label="Alfa"
                value={attendanceStats.Alfa}
                icon={XCircle}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* QUICK MENU */}
        <View className="px-6 mb-8">
          <Text className="text-slate-800 font-bold text-[17px] mb-4 tracking-tight">
            Akses Cepat
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {MENU_ITEMS.map((menu, i) => (
              <MenuButton
                key={i}
                item={menu}
                navigation={navigation}
                user={user}
              />
            ))}
          </View>
        </View>

        {/* JADWAL HARI INI */}
        <View className="mb-8">
          <View className="px-6 flex-row justify-between items-center mb-4">
            <Text className="text-slate-800 font-bold text-[17px] tracking-tight">
              Jadwal Hari Ini
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Jadwal')}
              className="flex-row items-center"
            >
              <Text className="text-blue-600 text-xs font-bold mr-1">
                Lihat Semua
              </Text>
              <ChevronRight size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {jadwal.length > 0 ? (
            <ScrollView
              ref={scheduleScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {jadwal.map((item, i) => (
                <ScheduleCard
                  key={i}
                  item={item}
                  isLive={checkIsLive(item.jam, now)}
                />
              ))}
            </ScrollView>
          ) : (
            <View className="mx-6 bg-slate-50 border border-slate-100 border-dashed rounded-[24px] p-8 items-center justify-center">
              <View className="bg-white p-4 rounded-full mb-3 shadow-sm">
                <Calendar size={24} color="#94a3b8" />
              </View>
              <Text className="text-slate-400 font-bold text-sm">
                Tidak ada jadwal pelajaran.
              </Text>
            </View>
          )}
        </View>

        {/* PENGUMUMAN */}
        <View className="mb-4">
          <View className="px-6 flex-row justify-between items-center mb-4">
            <Text className="text-slate-800 font-bold text-[17px] tracking-tight">
              Informasi Sekolah
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Pengumuman')}>
              <Text className="text-blue-600 text-xs font-bold">Arsip</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {pengumuman.length > 0 ? (
              pengumuman.map((item, i) => (
                <AnnouncementCard
                  key={i}
                  item={item}
                  onPress={() =>
                    navigation.navigate('DetailPengumuman', { item })
                  }
                />
              ))
            ) : (
              <View className="w-[width-48] bg-slate-50 border border-slate-100 rounded-[24px] p-6 flex-row items-center">
                <AlertCircle size={20} color="#94a3b8" />
                <Text className="text-slate-400 font-medium text-xs ml-3">
                  Belum ada pengumuman terbaru.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
// --- LOADING SKELETON ---
const DashboardSkeleton = () => (
  <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
    {/* Header Skeleton */}
    <View className="flex-row justify-between items-center px-6 py-4">
      <View className="flex-row items-center gap-3.5">
        <Skeleton variant="circle" width={44} height={44} />
        <View>
          <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
          <Skeleton width={140} height={20} />
        </View>
      </View>
      <Skeleton variant="circle" width={44} height={44} borderRadius={16} />
    </View>

    <ScrollView 
      className="flex-1" 
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner Academic Skeleton */}
      <View className="px-6 mt-2 mb-8">
        <Skeleton 
          width="100%" 
          height={220} 
          borderRadius={32}
          style={{ backgroundColor: '#e2e8f0' }}
        >
          {/* Inner content overlay to simulate the stats row */}
          <View className="absolute bottom-4 left-4 right-4">
            <View className="flex-row gap-2 bg-black/5 p-2 rounded-3xl">
              {[1, 2, 3, 4].map((_, i) => (
                <View key={i} className="flex-1 items-center py-2">
                  <Skeleton variant="circle" width={32} height={32} style={{ marginBottom: 4 }} />
                  <Skeleton width={30} height={16} style={{ marginBottom: 2 }} />
                  <Skeleton width={40} height={10} />
                </View>
              ))}
            </View>
          </View>
        </Skeleton>
      </View>

      {/* Quick Menu Skeleton */}
      <View className="px-6 mb-8">
        <Skeleton width={120} height={22} style={{ marginBottom: 16 }} />
        <View className="flex-row flex-wrap justify-between">
          {[1, 2, 3, 4, 5, 6].map((_, i) => (
            <View key={i} className="w-[30%] items-center gap-2 mb-4">
              <Skeleton 
                width={68} 
                height={68} 
                borderRadius={26} 
                style={{ marginBottom: 4 }}
              />
              <Skeleton width={50} height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Jadwal Hari Ini Skeleton */}
      <View className="mb-8">
        <View className="px-6 flex-row justify-between items-center mb-4">
          <Skeleton width={140} height={22} />
          <Skeleton width={80} height={16} />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {[1, 2, 3].map((_, i) => (
            <View 
              key={i} 
              className="mr-4 w-72 h-[170px] justify-between"
            >
              <Skeleton 
                width={288} 
                height={170} 
                borderRadius={28}
                style={{ backgroundColor: '#f1f5f9' }}
              >
                {/* Card content simulation */}
                <View className="p-5 h-full justify-between">
                  <View className="flex-row justify-between items-start">
                    <Skeleton width={80} height={28} borderRadius={20} />
                    <Skeleton width={50} height={24} borderRadius={12} />
                  </View>
                  <View>
                    <Skeleton width={200} height={24} style={{ marginBottom: 8 }} />
                    <Skeleton width={160} height={16} />
                  </View>
                  <View className="flex-row items-center">
                    <Skeleton variant="circle" width={24} height={24} style={{ marginRight: 8 }} />
                    <Skeleton width={100} height={14} />
                  </View>
                </View>
              </Skeleton>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Pengumuman Skeleton */}
      <View className="mb-4">
        <View className="px-6 flex-row justify-between items-center mb-4">
          <Skeleton width={160} height={22} />
          <Skeleton width={40} height={16} />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {[1, 2].map((_, i) => (
            <View key={i} className="mr-4 w-[280px] h-[140px]">
              <Skeleton 
                width={280} 
                height={140} 
                borderRadius={24}
                style={{ backgroundColor: '#f8fafc' }}
              >
                <View className="p-5 h-full justify-between">
                  <View className="flex-row justify-between items-center mb-3">
                    <Skeleton width={60} height={24} borderRadius={8} />
                    <Skeleton width={50} height={14} />
                  </View>
                  <Skeleton width={240} height={18} style={{ marginBottom: 4 }} />
                  <Skeleton width={200} height={18} />
                  <View className="flex-row items-center mt-2">
                    <Skeleton width={180} height={14} style={{ flex: 1 }} />
                    <Skeleton variant="circle" width={16} height={16} />
                  </View>
                </View>
              </Skeleton>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  </SafeAreaView>
);

export default DashboardScreen;
