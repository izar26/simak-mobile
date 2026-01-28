import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  memo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
  Dimensions,
  Linking,
  FlatList,
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
  ChevronRight,
  AlertTriangle,
  CloudDownload,
  AlertCircle,
  Megaphone,
  Info,
  CalendarDays,
} from 'lucide-react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Skeleton from '../../components/Skeleton';
import { fetchWithSmartCache } from '../../utils/apiCache';

// --- CONFIGURATION ---

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Schedule Card Config
const CARD_WIDTH = 280;
const CARD_SPACING = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

// Menu Config: 4 Columns
const MENU_ITEM_WIDTH = '22%';

// --- UTILS ---

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// --- ISOLATED COMPONENTS ---

const StatPill = memo(({ label, value, icon: Icon }: any) => (
  <View className="flex-1 items-center">
    <View className="bg-white/20 p-2 rounded-2xl mb-1 backdrop-blur-sm">
      <Icon size={18} color="white" />
    </View>
    <Text className="text-white font-black text-lg shadow-sm">{value}</Text>
    <Text className="text-blue-100 text-[10px] font-bold uppercase tracking-wider opacity-80">
      {label}
    </Text>
  </View>
));

const MenuButton = memo(({ item, navigation, user }: any) => {
  const handlePress = useCallback(() => {
    if (item.isLink) {
      const url =
        item.label === 'Website'
          ? user?.siswa?.sekolah?.website
          : user?.siswa?.sekolah?.spmb;
      if (url) Linking.openURL(url);
    } else {
      navigation.navigate(item.nav, { user });
    }
  }, [item, navigation, user]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ width: MENU_ITEM_WIDTH }}
      className="items-center gap-1.5 mb-3 active:opacity-70"
    >
      <View
        className={`${item.bg} w-[54px] h-[54px] rounded-[20px] items-center justify-center border ${item.border} shadow-sm`}
      >
        <item.icon size={22} color={item.color} strokeWidth={2.5} />
      </View>
      <Text
        className="text-slate-600 text-[10px] font-bold text-center leading-3"
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
});

const ScheduleCard = memo(
  ({ item, isLive }: { item: any; isLive: boolean }) => (
    <Animated.View
      layout={Layout.springify()}
      className={`mr-3 w-[280px] h-[160px] rounded-[24px] relative overflow-hidden justify-between ${
        isLive
          ? 'bg-blue-600 shadow-xl shadow-blue-300'
          : 'bg-white border border-slate-100 shadow-sm'
      }`}
    >
      {isLive && (
        <>
          <View className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <View className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-400/20 rounded-full blur-xl" />
          <View className="absolute right-4 top-4 opacity-10">
            <Clock size={80} color="white" />
          </View>
        </>
      )}

      <View className="p-5 pb-0">
        <View className="flex-row justify-between items-start mb-4">
          <View
            className={`flex-row items-center px-2.5 py-1 rounded-lg ${
              isLive ? 'bg-white/20 backdrop-blur-md' : 'bg-slate-50'
            }`}
          >
            <Clock size={10} color={isLive ? 'white' : '#94a3b8'} />
            <Text
              className={`text-[11px] font-bold ml-1.5 ${
                isLive ? 'text-white' : 'text-slate-500'
              }`}
            >
              {item.jam}
            </Text>
          </View>

          {isLive && (
            <View className="bg-green-500 px-2 py-0.5 rounded-md shadow-sm">
              <Text className="text-white text-[9px] font-black tracking-widest uppercase">
                SEKARANG
              </Text>
            </View>
          )}
        </View>

        <Text
          className={`font-black text-[19px] leading-6 mb-1 ${
            isLive ? 'text-white' : 'text-slate-800'
          }`}
          numberOfLines={2}
        >
          {item.mapel}
        </Text>
      </View>

      <View
        className={`px-5 py-3 flex-row items-center ${
          isLive ? 'bg-black/10' : 'bg-slate-50/50 border-t border-slate-50'
        }`}
      >
        {!item.is_non_kbm ? (
          <>
            <View
              className={`w-7 h-7 rounded-full items-center justify-center mr-3 ${
                isLive ? 'bg-white/20' : 'bg-white border border-slate-100'
              }`}
            >
              <User size={14} color={isLive ? 'white' : '#64748b'} />
            </View>

            <View className="flex-1">
              <Text
                className={`text-[9px] font-medium uppercase tracking-wider mb-0.5 ${
                  isLive ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                Pengajar
              </Text>
              <Text
                className={`text-xs font-bold ${
                  isLive ? 'text-white' : 'text-slate-700'
                }`}
                numberOfLines={1}
              >
                {item.guru}
              </Text>
            </View>
          </>
        ) : (
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                isLive ? 'bg-green-400' : 'bg-orange-400'
              }`}
            />
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isLive ? 'text-white' : 'text-slate-500'
              }`}
            >
              Kegiatan Sekolah
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  ),
);

// --- UPGRADED ANNOUNCEMENT CARD (STYLISH WHITE) ---
const AnnouncementCard = memo(({ item, onPress }: any) => {
  const isHoliday = item.type === 'libur';

  // Icon pemilihan berdasarkan tipe
  let WatermarkIcon = Info;
  let accentColor = '#3b82f6'; // Blue default

  if (isHoliday) {
    WatermarkIcon = CalendarDays;
    accentColor = '#ef4444'; // Red
  } else if (item.type === 'berita') {
    WatermarkIcon = Megaphone;
    accentColor = '#f59e0b'; // Amber
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="w-[280px] bg-white rounded-[26px] mr-4 h-[150px] relative overflow-hidden shadow-sm border border-slate-100"
    >
      {/* 1. Watermark Icon Background (Large & Faded) */}
      <View className="absolute -right-4 -bottom-6 opacity-[0.05]">
        <WatermarkIcon size={120} color="#0f172a" />
      </View>

      <View className="p-5 h-full justify-between">
        <View>
          <View className="flex-row justify-between items-center mb-3">
            {/* 2. Stylized Tag: White Pill with Colored Border (Clean Look) */}
            <View
              className="px-3 py-1 rounded-full bg-white border shadow-sm"
              style={{ borderColor: isHoliday ? '#fee2e2' : '#e2e8f0' }}
            >
              <Text
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                {item.type?.toUpperCase() || 'INFO'}
              </Text>
            </View>

            {/* Date */}
            <Text className="text-slate-400 text-[10px] font-bold">
              {new Date(item.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>

          {/* Title with slightly larger font for impact */}
          <Text
            className="text-slate-800 font-black text-[16px] leading-6 pr-4"
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </View>

        {/* Bottom Action Area */}
        <View className="flex-row items-center">
          <View className="w-5 h-5 rounded-full bg-slate-50 items-center justify-center mr-2 border border-slate-100">
            <ChevronRight size={12} color="#94a3b8" />
          </View>
          <Text
            className="text-slate-400 text-[11px] font-semibold"
            numberOfLines={1}
          >
            Selengkapnya
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// --- SUB-SECTIONS ---

const DashboardHeader = memo(
  ({ user, notifCount, onNotifPress, greeting }: any) => {
    const fotoUrl = user?.siswa?.foto
      ? `${MAIN_APP_URL}/storage/${user.siswa.foto}`
      : null;

    return (
      <View className="flex-row justify-between items-center px-6 py-4 bg-slate-50 z-10">
        <View className="flex-row items-center gap-3.5">
          <View className="p-[3px] bg-white rounded-full shadow-sm border border-slate-100">
            {fotoUrl ? (
              <Image
                source={{ uri: fotoUrl }}
                className="w-11 h-11 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-11 h-11 rounded-full bg-blue-50 items-center justify-center">
                <User size={20} color="#3b82f6" />
              </View>
            )}
          </View>
          <View>
            <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">
              {greeting}
            </Text>
            <Text
              className="text-slate-800 font-black text-lg leading-6"
              numberOfLines={1}
            >
              {user?.siswa?.nama || 'Siswa'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onNotifPress}
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
    );
  },
);

const AcademicBanner = memo(({ siswa, attendanceStats }: any) => {
  return (
    <Animated.View entering={FadeIn.duration(600)} className="px-6 mt-2 mb-8">
      <LinearGradient
        colors={['#2563eb', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-6 rounded-[32px] relative shadow-xl shadow-blue-200 overflow-hidden"
      >
        <View className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none">
          <LottieView
            source={require('../../assets/animations/Back to School.json')}
            autoPlay
            loop
            style={{ width: 180, height: 180 }}
            speed={0.8}
            renderMode="HARDWARE"
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
          <StatPill label="Izin" value={attendanceStats.Izin} icon={Clock} />
          <View className="w-[1px] bg-white/10 my-2" />
          <StatPill label="Alfa" value={attendanceStats.Alfa} icon={XCircle} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

const ScheduleSection = memo(
  ({ jadwal, navigation }: any) => {
    const listRef = useRef<FlatList>(null);
    const [currentMinutes, setCurrentMinutes] = useState(() => {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    });

    useEffect(() => {
      const interval = setInterval(() => {
        const d = new Date();
        setCurrentMinutes(d.getHours() * 60 + d.getMinutes());
      }, 30000);
      return () => clearInterval(interval);
    }, []);

    const liveIndex = useMemo(() => {
      return jadwal.findIndex((item: any) => {
        try {
          const [start, end] = item.jam.split(' - ');
          const startM = timeToMinutes(start);
          const endM = timeToMinutes(end);
          return currentMinutes >= startM && currentMinutes < endM;
        } catch {
          return false;
        }
      });
    }, [jadwal, currentMinutes]);

    useEffect(() => {
      if (liveIndex !== -1 && listRef.current && jadwal.length > 0) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: liveIndex,
            animated: true,
            viewPosition: 0.5,
          });
        }, 500);
      }
    }, [liveIndex, jadwal]);

    const renderItem = useCallback(
      ({ item, index }: any) => (
        <ScheduleCard item={item} isLive={index === liveIndex} />
      ),
      [liveIndex],
    );

    return (
      <View className="mb-8">
        <View className="px-6 flex-row justify-between items-center mb-4">
          <Text className="text-slate-800 font-bold text-[17px] tracking-tight">
            Jadwal Hari Ini
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Jadwal')}
            className="flex-row items-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-blue-600 text-xs font-bold mr-1">
              Lihat Semua
            </Text>
            <ChevronRight size={14} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {jadwal.length > 0 ? (
          <FlatList
            ref={listRef}
            data={jadwal}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            getItemLayout={(data, index) => ({
              length: SNAP_INTERVAL,
              offset: SNAP_INTERVAL * index,
              index,
            })}
          />
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
    );
  },
  (prev, next) => prev.jadwal === next.jadwal,
);

// --- STATIC MENU CONFIG ---
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
  },
  {
    label: 'SPMB',
    icon: UserPlus,
    color: '#8b5cf6',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    isLink: true,
  },
  {
    label: 'Pelanggaran',
    icon: AlertTriangle,
    color: '#ef4444',
    bg: 'bg-red-50',
    border: 'border-red-100',
    nav: 'Pelanggaran',
  },
  {
    label: 'Keuangan',
    icon: CreditCard,
    color: '#0f172a',
    bg: 'bg-slate-200',
    border: 'border-slate-300',
    nav: 'Keuangan',
  },
  {
    label: 'Unduhan',
    icon: CloudDownload,
    color: '#6366f1',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    nav: 'Unduhan',
  },
];

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

  const greeting = useMemo(() => getGreeting(), []);

  const fetchData = useCallback(async (isManualRefresh = false) => {
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

      if (jadwalData.jadwal) {
        setJadwal(jadwalData.jadwal);
        setPengumuman(jadwalData.pengumuman || []);
      } else {
        setJadwal(Array.isArray(jadwalData) ? jadwalData : []);
      }

      setAttendanceStats(
        absensiData.stats || { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 },
      );

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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const renderAnnouncement = useCallback(
    ({ item }: any) => (
      <AnnouncementCard
        item={item}
        onPress={() => navigation.navigate('DetailPengumuman', { item })}
      />
    ),
    [navigation],
  );

  // --- SKELETON LOADER ---
  if (loading && !user) return <DashboardSkeleton />;

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

      <DashboardHeader
        user={user}
        notifCount={notifCount}
        greeting={greeting}
        onNotifPress={() => navigation.navigate('Notifikasi')}
      />

      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <AcademicBanner
              siswa={user?.siswa}
              attendanceStats={attendanceStats}
            />

            {/* QUICK MENU */}
            <View className="px-6 mb-6">
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

            {/* JADWAL */}
            <ScheduleSection jadwal={jadwal} navigation={navigation} />

            {/* PENGUMUMAN */}
            <View className="mb-4">
              <View className="px-6 flex-row justify-between items-center mb-4">
                <Text className="text-slate-800 font-bold text-[17px] tracking-tight">
                  Informasi Sekolah
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Pengumuman')}
                >
                  <Text className="text-blue-600 text-xs font-bold">Arsip</Text>
                </TouchableOpacity>
              </View>

              {pengumuman.length > 0 ? (
                <FlatList
                  data={pengumuman}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24 }}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={renderAnnouncement}
                  snapToInterval={280 + 16}
                  decelerationRate="fast"
                />
              ) : (
                <View className="mx-6 bg-slate-50 border border-slate-100 rounded-[24px] p-6 flex-row items-center">
                  <AlertCircle size={20} color="#94a3b8" />
                  <Text className="text-slate-400 font-medium text-xs ml-3">
                    Belum ada pengumuman terbaru.
                  </Text>
                </View>
              )}
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
};

// --- LOADING SKELETON ---
const DashboardSkeleton = () => (
  <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
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

    <FlatList
      data={[1]}
      renderItem={() => (
        <>
          <View className="px-6 mt-2 mb-8 relative">
            <Skeleton
              width="100%"
              height={220}
              borderRadius={32}
              style={{ backgroundColor: '#e2e8f0' }}
            />
            <View className="absolute bottom-4 left-4 right-4">
              <View className="flex-row gap-2 bg-black/5 p-2 rounded-3xl">
                {[1, 2, 3, 4].map((_, i) => (
                  <View key={i} className="flex-1 items-center py-2">
                    <Skeleton
                      variant="circle"
                      width={32}
                      height={32}
                      style={{ marginBottom: 4 }}
                    />
                    <Skeleton
                      width={30}
                      height={16}
                      style={{ marginBottom: 2 }}
                    />
                    <Skeleton width={40} height={10} />
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className="px-6 mb-8">
            <Skeleton width={120} height={22} style={{ marginBottom: 16 }} />
            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                <View key={i} className="w-[22%] items-center gap-2 mb-4">
                  <Skeleton
                    width={54}
                    height={54}
                    borderRadius={20}
                    style={{ marginBottom: 4 }}
                  />
                  <Skeleton width={40} height={10} />
                </View>
              ))}
            </View>
          </View>

          <View className="mb-8">
            <View className="px-6 flex-row justify-between items-center mb-4">
              <Skeleton width={140} height={22} />
              <Skeleton width={80} height={16} />
            </View>
            <FlatList
              horizontal
              data={[1, 2, 3]}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              renderItem={() => (
                <View className="mr-4 w-[280px] h-[160px] justify-between">
                  <Skeleton
                    width={280}
                    height={160}
                    borderRadius={24}
                    style={{ backgroundColor: '#f1f5f9' }}
                  />
                  <View className="p-5 h-full justify-between">
                    <View className="flex-row justify-between items-start">
                      <Skeleton width={80} height={28} borderRadius={20} />
                      <Skeleton width={50} height={24} borderRadius={12} />
                    </View>
                    <View>
                      <Skeleton
                        width={200}
                        height={24}
                        style={{ marginBottom: 8 }}
                      />
                      <Skeleton width={160} height={16} />
                    </View>
                    <View className="flex-row items-center">
                      <Skeleton
                        variant="circle"
                        width={24}
                        height={24}
                        style={{ marginRight: 8 }}
                      />
                      <Skeleton width={100} height={14} />
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        </>
      )}
    />
  </SafeAreaView>
);

export default DashboardScreen;
