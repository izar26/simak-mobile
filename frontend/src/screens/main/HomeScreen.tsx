import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOutUp,
  Layout,
  FadeInDown,
  FadeOutDown,
  ZoomIn, // Tambahan import
  ZoomOut, // Tambahan import
  Easing, // Tambahan import untuk kurva animasi halus
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  User,
  MapPin,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  LogOut,
  Award,
  Phone,
  Mail,
  Edit3,
  BookOpen,
  Printer,
  Home,
  Calendar,
  CreditCard,
  Shield,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import { fetchWithSmartCache } from '../../utils/apiCache';
import { getToken, logout } from '../../services/auth';
import { MAIN_APP_URL, API_URL } from '@env';
import StatusModal from '../../components/StatusModal';
import Skeleton from '../../components/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ TYPES
interface SiswaData {
  nama?: string;
  nisn?: string;
  nipd?: string;
  nik?: string;
  no_kk?: string;
  jenis_kelamin?: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  agama_id_str?: string;
  kebutuhan_khusus?: string;
  nomor_telepon_seluler?: string;
  no_wa?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  kode_pos?: string;
  desa_kelurahan?: string;
  kecamatan?: string;
  kabupaten_kota?: string;
  nama_ayah?: string;
  pekerjaan_ayah_id_str?: string;
  no_wa_ayah?: string;
  nama_ibu?: string;
  pekerjaan_ibu_id_str?: string;
  no_wa_ibu?: string;
  sekolah_asal?: string;
  npsn_sekolah_asal?: string;
  no_seri_ijazah?: string;
  no_seri_skhun?: string;
  foto?: string;
  nama_rombel?: string;
}

interface UserData {
  nama?: string;
  username?: string;
  email?: string;
  siswa?: SiswaData;
}

// ✅ THEME CONFIG
const THEME = {
  male: {
    primary: 'bg-blue-600',
    primarySoft: 'bg-blue-50',
    primaryBorder: 'border-blue-100',
    primaryText: 'text-blue-600',
    gradient: ['#3b82f6', '#1d4ed8', '#1e40af'] as const,
    accent: '#2563eb',
    lightAccent: '#dbeafe',
  },
  female: {
    primary: 'bg-rose-500',
    primarySoft: 'bg-rose-50',
    primaryBorder: 'border-rose-100',
    primaryText: 'text-rose-600',
    gradient: ['#f43f5e', '#be123c', '#9f1239'] as const,
    accent: '#f43f5e',
    lightAccent: '#ffe4e6',
  },
};

// ✅ UTILITY FUNCTIONS
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  isDestructive = false,
}: any) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>

        <Animated.View
          // GANTI DARI SINI: Hapus springify, ganti dengan duration & easing
          entering={FadeInUp.duration(300).easing(Easing.out(Easing.cubic))}
          exiting={FadeOutDown.duration(200)}
          // SAMPAI SINI
          className="bg-white w-full rounded-3xl p-6 shadow-2xl items-center"
        >
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isDestructive ? 'bg-red-50' : 'bg-blue-50'
            }`}
          >
            {isDestructive ? (
              <LogOut size={32} color="#ef4444" />
            ) : (
              <AlertTriangle size={32} color="#3b82f6" />
            )}
          </View>

          <Text className="text-slate-900 font-black text-xl text-center mb-2">
            {title}
          </Text>
          <Text className="text-slate-500 text-sm text-center font-medium leading-5 mb-8 px-4">
            {message}
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3.5 bg-slate-100 rounded-2xl items-center justify-center active:opacity-80"
            >
              <Text className="text-slate-600 font-bold text-sm">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className={`flex-1 py-3.5 rounded-2xl items-center justify-center active:opacity-80 ${
                isDestructive
                  ? 'bg-red-500 shadow-lg shadow-red-200'
                  : 'bg-blue-600 shadow-lg shadow-blue-200'
              }`}
            >
              <Text className="text-white font-bold text-sm">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ✅ PERMISSION HELPER
const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const permission =
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

      const granted = await PermissionsAndroid.request(permission, {
        title: 'Izin Akses Penyimpanan',
        message:
          'Aplikasi memerlukan akses ke penyimpanan untuk menyimpan file unduhan.',
        buttonNeutral: 'Tanya Nanti',
        buttonNegative: 'Batal',
        buttonPositive: 'Izinkan',
      });

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // iOS doesn't need explicit permission request
};

// ✅ MEMOIZED SUB-COMPONENTS

const InfoItem = memo(({ label, value, icon: Icon, delay = 0 }: any) => (
  <Animated.View
    entering={FadeInUp.delay(delay).duration(400)}
    className="flex-1 min-w-[48%] mb-4 pr-2"
  >
    <View className="flex-row items-center mb-1.5">
      {Icon && <Icon size={12} color="#94a3b8" style={{ marginRight: 6 }} />}
      <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
        {label}
      </Text>
    </View>
    <Text
      className="text-slate-800 text-sm font-semibold leading-5"
      numberOfLines={2}
    >
      {value || '-'}
    </Text>
  </Animated.View>
));

const ContactChip = memo(
  ({ icon: Icon, label, value, theme, isFemale }: any) => (
    <View className="flex-row items-center py-3 border-b border-slate-100 last:border-0">
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center mr-3`}
        style={{ backgroundColor: isFemale ? '#ffe4e6' : '#dbeafe' }}
      >
        <Icon size={18} color={theme.accent} />
      </View>
      <View className="flex-1">
        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
          {label}
        </Text>
        <Text className="text-slate-800 text-sm font-bold" numberOfLines={1}>
          {value || '-'}
        </Text>
      </View>
    </View>
  ),
);

const ParentCard = memo(
  ({ title, name, job, phone, theme, isFemale, delay }: any) => (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(400)}
      className="flex-row items-center bg-slate-50 p-4 rounded-2xl mb-3"
    >
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-sm"
        style={{ backgroundColor: isFemale ? '#ffe4e6' : '#dbeafe' }}
      >
        <Text
          className={`text-xl font-bold ${
            isFemale ? 'text-rose-600' : 'text-blue-600'
          }`}
        >
          {title[0]}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mr-2">
            {title}
          </Text>
          {phone && (
            <View className="flex-row items-center bg-white px-2 py-0.5 rounded-full shadow-sm">
              <Phone size={10} color={theme.accent} />
              <Text
                className={`text-[10px] font-bold ml-1 ${
                  isFemale ? 'text-rose-600' : 'text-blue-600'
                }`}
              >
                {phone}
              </Text>
            </View>
          )}
        </View>
        <Text
          className="text-slate-900 font-bold text-base mb-0.5"
          numberOfLines={1}
        >
          {name || 'Belum diisi'}
        </Text>
        <Text className="text-slate-500 text-xs font-medium" numberOfLines={1}>
          {job || '-'}
        </Text>
      </View>
    </Animated.View>
  ),
);

// ✅ IMPROVED SECTION CARD (ACCORDION)
// Menambahkan properti exiting pada konten untuk animasi tutup yang halus
const SectionCard = memo(
  ({
    title,
    icon: Icon,
    sectionKey,
    isExpanded,
    onToggle,
    children,
    theme,
    badge,
  }: any) => (
    <Animated.View
      // Menggunakan transition yang lebih smooth
      layout={Layout.springify().damping(14).mass(1).stiffness(100)}
      className="bg-white rounded-3xl mb-4 shadow-sm border border-slate-100 overflow-hidden"
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onToggle(sectionKey)}
        className="flex-row justify-between items-center p-5"
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4 shadow-sm"
            style={{ backgroundColor: theme.lightAccent }}
          >
            <Icon size={22} color={theme.accent} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-base">{title}</Text>
            {badge && (
              <Text className="text-slate-400 text-xs mt-0.5">{badge}</Text>
            )}
          </View>
        </View>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: isExpanded ? theme.lightAccent : '#f1f5f9',
          }}
        >
          {isExpanded ? (
            <ChevronUp
              size={20}
              color={isExpanded ? theme.accent : '#94a3b8'}
            />
          ) : (
            <ChevronDown size={20} color="#94a3b8" />
          )}
        </View>
      </TouchableOpacity>

      {/* Konten Accordion */}
      {isExpanded && (
        <Animated.View
          // KUNCI PERBAIKAN: Gunakan exiting dengan durasi yang pas
          // agar container menunggu konten memudar sebelum menyusut.
          entering={FadeInUp.duration(300)}
          exiting={FadeOutUp.duration(200)}
          className="px-5 pb-6"
        >
          <View className="h-px bg-slate-100 mb-5" />
          {children}
        </Animated.View>
      )}
    </Animated.View>
  ),
);

// ✅ MAIN COMPONENT
const HomeScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // State untuk Modal Konfirmasi Logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [modalStatus, setModalStatus] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning'; // 👈 Ini kuncinya, kita izinkan dua kata ini
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    identitas: true,
    alamat: false,
    ortu: false,
    riwayat: false,
  });

  // ✅ MEMOIZED VALUES
  const siswa = useMemo(() => user?.siswa, [user]);
  const isFemale = useMemo(() => siswa?.jenis_kelamin === 'P', [siswa]);
  const theme = useMemo(
    () => (isFemale ? THEME.female : THEME.male),
    [isFemale],
  );

  const fotoUrl = useMemo(() => {
    if (!siswa?.foto || imageError) return null;
    return `${MAIN_APP_URL}/storage/${siswa.foto}`;
  }, [siswa?.foto, imageError]);

  const fullAddress = useMemo(() => {
    if (!siswa) return 'Alamat belum diisi';
    const parts = [
      siswa.alamat,
      `RT ${siswa.rt || '-'} / RW ${siswa.rw || '-'}`,
      siswa.desa_kelurahan,
      siswa.kecamatan,
      siswa.kabupaten_kota,
      siswa.kode_pos,
    ].filter(Boolean);
    return parts.join(', ');
  }, [siswa]);

  // ✅ CALLBACKS
  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    try {
      const data = await fetchWithSmartCache(
        '/me',
        'USER_PROFILE_DATA',
        240,
        isManualRefresh,
      );
      setUser(data);
      setImageError(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setModalStatus({
        visible: true,
        type: 'error',
        title: 'Gagal Memuat Data',
        message: 'Silakan periksa koneksi internet Anda dan coba lagi.',
      });
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

  const handleCetakBiodata = useCallback(async () => {
    if (!siswa?.nama) {
      setModalStatus({
        visible: true,
        type: 'warning',
        title: 'Data Tidak Lengkap',
        message: 'Nama siswa tidak ditemukan.',
      });
      return;
    }

    // Request permission first
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      setModalStatus({
        visible: true,
        type: 'error',
        title: 'Izin Ditolak',
        message:
          'Anda perlu memberikan izin akses penyimpanan untuk mengunduh file.',
      });
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = `Biodata_${siswa.nama.replace(/\s+/g, '_')}.pdf`;

      if (Platform.OS === 'android') {
        const downloadDir = dirs.DownloadDir;

        try {
          // Ensure download directory exists
          const isDir = await ReactNativeBlobUtil.fs.isDir(downloadDir);
          if (!isDir) {
            await ReactNativeBlobUtil.fs.mkdir(downloadDir);
          }

          const path = `${downloadDir}/${fileName}`;

          await ReactNativeBlobUtil.config({
            fileCache: true,
            addAndroidDownloads: {
              useDownloadManager: true,
              notification: true,
              path: path,
              description: 'Mengunduh Biodata Siswa...',
              mediaScannable: true,
              title: fileName,
              mime: 'application/pdf',
            },
          })
            .fetch('GET', `${API_URL}/siswa/cetak-biodata`, {
              Authorization: `Bearer ${token}`,
            })
            .then(res => {
              // Trigger media scanner
              ReactNativeBlobUtil.fs
                .scanFile([
                  {
                    path: res.path(),
                    mime: 'application/pdf',
                  },
                ])
                .catch(err => console.log('Scan error:', err));

              setModalStatus({
                visible: true,
                type: 'success',
                title: 'Unduhan Berhasil!',
                message: `File tersimpan di folder Download sebagai ${fileName}`,
              });
            });
        } catch (error) {
          console.error('Android download error:', error);
          setModalStatus({
            visible: true,
            type: 'error',
            title: 'Gagal Mengunduh',
            message: `Error: ${error.message || 'Tidak dapat mengunduh file.'}`,
          });
        }
      } else {
        // iOS handling
        const path = `${dirs.DocumentDir}/${fileName}`;
        await ReactNativeBlobUtil.config({
          fileCache: true,
        })
          .fetch('GET', `${API_URL}/siswa/cetak-biodata`, {
            Authorization: `Bearer ${token}`,
          })
          .then(res => {
            ReactNativeBlobUtil.ios.previewDocument(res.path());
            setModalStatus({
              visible: true,
              type: 'success',
              title: 'Berhasil!',
              message: 'File PDF telah dibuka',
            });
          });
      }
    } catch (error) {
      console.error('Download error:', error);
      setModalStatus({
        visible: true,
        type: 'error',
        title: 'Gagal Mengunduh',
        message: 'Tidak dapat mengunduh file. Silakan coba lagi.',
      });
    } finally {
      setLoading(false);
    }
  }, [siswa]);

  // Fungsi Logout yang baru (hanya memicu modal)
  const onLogoutPress = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  // Fungsi Konfirmasi Logout (Eksekusi sebenarnya)
  const confirmLogout = useCallback(async () => {
    setShowLogoutModal(false);
    await logout();
    navigation.getParent()?.replace('Login');
  }, [navigation]);

  // ✅ SKELETON LOADING
  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar
          barStyle="light-content"
          backgroundColor={isFemale ? '#be123c' : '#1d4ed8'}
        />
        <View className="bg-slate-200 pb-24 rounded-b-[40px]">
          <View className="items-center pt-12 px-6">
            <Skeleton
              variant="circle"
              width={120}
              height={120}
              className="mb-4"
            />
            <Skeleton width={200} height={28} className="mb-2 rounded-lg" />
            <Skeleton width={140} height={16} className="rounded-lg" />
          </View>
        </View>
        <ScrollView
          className="px-5 -mt-12"
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3].map(i => (
            <View key={i} className="bg-white rounded-2xl mb-4 p-5 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Skeleton
                  width={48}
                  height={48}
                  borderRadius={12}
                  className="mr-4"
                />
                <Skeleton width={150} height={20} className="rounded-lg" />
              </View>
              <View className="h-px bg-slate-100 mb-4" />
              <View className="flex-row flex-wrap">
                <Skeleton
                  width="48%"
                  height={60}
                  className="mr-2 mb-2 rounded-xl"
                />
                <Skeleton width="48%" height={60} className="rounded-xl" />
                <Skeleton width="48%" height={60} className="mr-2 rounded-xl" />
                <Skeleton width="48%" height={60} className="rounded-xl" />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor={theme.gradient[1]} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.accent]}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(500)}>
          {/* Header */}
          <LinearGradient
            colors={(theme.gradient || ['#2563eb', '#1e40af']) as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="relative pb-24 rounded-b-[40px] shadow-2xl"
          >
            <View className="absolute top-0 right-0 p-12 opacity-10">
              <Award size={200} color="white" />
            </View>
            <View className="absolute bottom-10 left-5 opacity-10">
              <Shield size={100} color="white" />
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('EditProfile', { user })}
              className="absolute top-12 right-6 z-10 bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30 active:scale-95"
              style={{ elevation: 5 }}
            >
              <Edit3 size={20} color="white" />
            </TouchableOpacity>

            <View className="items-center pt-12 px-6">
              <View className="relative mb-6">
                <View className="bg-white p-1.5 rounded-full shadow-2xl">
                  {fotoUrl ? (
                    <Image
                      source={{ uri: fotoUrl }}
                      className="w-32 h-32 rounded-full bg-slate-200"
                      resizeMode="cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <View
                      className="w-32 h-32 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isFemale ? '#ffe4e6' : '#dbeafe',
                      }}
                    >
                      <Text
                        className={`text-3xl font-bold ${theme.primaryText}`}
                      >
                        {getInitials(siswa?.nama || user?.nama)}
                      </Text>
                    </View>
                  )}
                  <View className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white" />
                </View>
              </View>

              <Text
                className="text-white text-2xl font-bold text-center mb-1"
                numberOfLines={2}
              >
                {siswa?.nama || user?.nama}
              </Text>

              <View className="flex-row items-center bg-white/20 px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm">
                <CreditCard size={14} color="white" className="mr-2" />
                <Text className="text-white/90 font-semibold text-sm">
                  {siswa?.nisn || user?.username}
                </Text>
                {siswa?.nipd && (
                  <Text className="text-white/70 text-sm ml-1">
                    • {siswa.nipd}
                  </Text>
                )}
              </View>

              {siswa?.nama_rombel && (
                <View className="bg-white/20 px-5 py-2 rounded-2xl border border-white/30 flex-row items-center backdrop-blur-sm">
                  <Award size={16} color="white" className="mr-2" />
                  <Text className="text-white font-bold text-sm tracking-wide">
                    {siswa.nama_rombel}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Content */}
          <View className="px-5 -mt-12">
            {/* Identity Section */}
            <SectionCard
              title="Identitas & Kontak"
              icon={User}
              sectionKey="identitas"
              isExpanded={expandedSections.identitas}
              onToggle={toggleSection}
              theme={theme}
              badge="Data Pribadi"
            >
              <View className="flex-row flex-wrap -mr-2">
                <InfoItem
                  label="NIK"
                  value={siswa?.nik}
                  icon={CreditCard}
                  delay={0}
                />
                <InfoItem
                  label="No. KK"
                  value={siswa?.no_kk}
                  icon={Shield}
                  delay={50}
                />
                <InfoItem
                  label="Jenis Kelamin"
                  value={
                    siswa?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'
                  }
                  icon={User}
                  delay={100}
                />
                <InfoItem
                  label="Tempat Lahir"
                  value={siswa?.tempat_lahir}
                  icon={MapPin}
                  delay={150}
                />
                <InfoItem
                  label="Tanggal Lahir"
                  value={formatDate(siswa?.tanggal_lahir)}
                  icon={Calendar}
                  delay={200}
                />
                <InfoItem
                  label="Agama"
                  value={siswa?.agama_id_str}
                  icon={Shield}
                  delay={250}
                />
              </View>

              <View
                className="mt-4 rounded-2xl p-4 border"
                style={{
                  backgroundColor: theme.lightAccent,
                  borderColor: isFemale ? '#fecdd3' : '#bfdbfe',
                }}
              >
                <ContactChip
                  icon={Mail}
                  label="Email"
                  value={user?.email || user?.username}
                  theme={theme}
                  isFemale={isFemale}
                />
                <ContactChip
                  icon={Phone}
                  label="Telepon"
                  value={siswa?.nomor_telepon_seluler}
                  theme={theme}
                  isFemale={isFemale}
                />
                <ContactChip
                  icon={Phone}
                  label="WhatsApp"
                  value={siswa?.no_wa}
                  theme={theme}
                  isFemale={isFemale}
                />
              </View>
            </SectionCard>

            {/* Address Section */}
            <SectionCard
              title="Alamat Lengkap"
              icon={Home}
              sectionKey="alamat"
              isExpanded={expandedSections.alamat}
              onToggle={toggleSection}
              theme={theme}
              badge={siswa?.kode_pos}
            >
              <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                <Text className="text-slate-700 font-medium text-sm leading-6">
                  {fullAddress}
                </Text>
              </View>

              <View className="flex-row flex-wrap">
                <InfoItem
                  label="RT / RW"
                  value={`${siswa?.rt || '-'} / ${siswa?.rw || '-'}`}
                />
                <InfoItem label="Kode Pos" value={siswa?.kode_pos} />
                <InfoItem
                  label="Desa/Kelurahan"
                  value={siswa?.desa_kelurahan}
                />
                <InfoItem label="Kecamatan" value={siswa?.kecamatan} />
                <InfoItem
                  label="Kabupaten/Kota"
                  value={siswa?.kabupaten_kota}
                  width="100%"
                />
              </View>
            </SectionCard>

            {/* Parents Section */}
            <SectionCard
              title="Data Orang Tua"
              icon={Users}
              sectionKey="ortu"
              isExpanded={expandedSections.ortu}
              onToggle={toggleSection}
              theme={theme}
            >
              <ParentCard
                title="Ayah"
                name={siswa?.nama_ayah}
                job={siswa?.pekerjaan_ayah_id_str}
                phone={siswa?.no_wa_ayah}
                theme={theme}
                isFemale={isFemale}
                delay={0}
              />
              <ParentCard
                title="Ibu"
                name={siswa?.nama_ibu}
                job={siswa?.pekerjaan_ibu_id_str}
                phone={siswa?.no_wa_ibu}
                theme={theme}
                isFemale={isFemale}
                delay={100}
              />
            </SectionCard>

            {/* Education History */}
            <SectionCard
              title="Riwayat Pendidikan"
              icon={BookOpen}
              sectionKey="riwayat"
              isExpanded={expandedSections.riwayat}
              onToggle={toggleSection}
              theme={theme}
            >
              <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3">
                <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Sekolah Asal
                </Text>
                <Text className="text-slate-800 font-bold text-base mb-1">
                  {siswa?.sekolah_asal || '-'}
                </Text>
                <Text className="text-slate-500 text-xs">
                  NPSN: {siswa?.npsn_sekolah_asal || '-'}
                </Text>
              </View>

              <View className="flex-row flex-wrap">
                <InfoItem
                  label="No. Ijazah"
                  value={siswa?.no_seri_ijazah}
                  icon={FileText}
                />
                <InfoItem
                  label="No. SKHUN"
                  value={siswa?.no_seri_skhun}
                  icon={FileText}
                />
              </View>
            </SectionCard>

            {/* Action Buttons */}
            <Animated.View entering={FadeInUp.delay(400)} className="mt-2">
              <TouchableOpacity
                className={`${theme.primary} p-5 rounded-2xl flex-row justify-center items-center shadow-lg mb-4 active:opacity-90`}
                onPress={handleCetakBiodata}
                disabled={loading}
                style={{ elevation: 4 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Printer size={22} color="white" />
                    <Text className="text-white font-bold ml-3 text-sm tracking-wide">
                      Unduh Biodata (PDF)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white p-5 rounded-2xl border border-red-100 flex-row justify-center items-center shadow-sm mb-6 active:bg-red-50"
                onPress={onLogoutPress}
              >
                <LogOut size={22} color="#ef4444" />
                <Text className="text-red-600 font-bold ml-3 text-sm tracking-wide">
                  Keluar Aplikasi
                </Text>
              </TouchableOpacity>

              <Text className="text-slate-400 text-center text-xs font-medium pb-4">
                Simak Mobile v1.2.0 • {new Date().getFullYear()}
              </Text>
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* MODAL STATUS UMUM */}
      <StatusModal
        visible={modalStatus.visible}
        type={modalStatus.type}
        title={modalStatus.title}
        message={modalStatus.message}
        onClose={() => setModalStatus(prev => ({ ...prev, visible: false }))}
      />

      {/* MODAL KONFIRMASI LOGOUT */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari aplikasi? Anda perlu login kembali untuk mengakses akun Anda."
        confirmText="Keluar"
        cancelText="Batal"
        isDestructive={true}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </SafeAreaView>
  );
};

export default memo(HomeScreen);
