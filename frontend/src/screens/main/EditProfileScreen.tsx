// Optimized EditProfileScreen.tsx - Fixed Navigation Context & Performance
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  InteractionManager,
  LogBox,
  ScrollView,
  Alert,
  RefreshControl,
  Vibration,
  ToastAndroid,
  Keyboard,
  Pressable,
  StyleSheet,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

import {
  ChevronLeft,
  Save,
  Info,
  Lock,
  User,
  MapPin,
  Heart,
  Users,
  AlertCircle,
  Phone,
  BookOpen,
  Truck,
  FileText,
  Camera,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  Clock,
  Search,
  X,
  Copy,
  ClipboardCheck,
  Briefcase,
  DollarSign,
  CreditCard,
  Landmark,
  Smile,
} from 'lucide-react-native';
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ImageCropPicker from 'react-native-image-crop-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { MAIN_APP_URL } from '@env';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import StatusModal from '../../components/StatusModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants - Moved outside component to prevent recreation
const LOCKED_COLUMNS = new Set([
  'nama',
  'jenis_kelamin',
  'tempat_lahir',
  'tanggal_lahir',
  'agama_id_str',
  'kewarganegaraan',
  'tinggi_badan',
  'berat_badan',
  'nama_ayah',
  'nama_ibu',
  'nama_wali',
  'pekerjaan_ayah_id_str',
  'pekerjaan_ibu_id_str',
  'pekerjaan_wali_id_str',
  'tahun_lahir_ayah',
  'tahun_lahir_ibu',
  'tahun_lahir_wali',
  'pendidikan_ayah_id_str',
  'pendidikan_ibu_id_str',
  'pendidikan_wali_id_str',
  'penghasilan_ayah_id_str',
  'penghasilan_ibu_id_str',
  'penghasilan_wali_id_str',
  'alamat_jalan',
  'no_hp_akun',
  'nomor_telepon_rumah',
  'anak_keberapa',
  'nik',
  'nik_ayah',
  'nik_ibu',
  'nik_wali',
]);

const DISABLED_COLUMNS = new Set([
  'nipd',
  'nisn',
  'kebutuhan_khusus',
  'email_akun',
]);

const PEKERJAAN_OPTIONS = [
  'Tidak bekerja',
  'Nelayan',
  'Petani',
  'Peternak',
  'PNS/TNI/Polri',
  'Karyawan Swasta',
  'Pedagang Kecil',
  'Pedagang Besar',
  'Wiraswasta',
  'Wirausaha',
  'Buruh',
  'Pensiunan',
  'Tenaga Kerja Indonesia',
  'Karyawan BUMN',
  'Tidak dapat diterapkan',
  'Sudah Meninggal',
  'Lainnya',
];

const PENDIDIKAN_OPTIONS = [
  'D1',
  'D2',
  'D3',
  'D4',
  'Informal',
  'Lainnya',
  'Non formal',
  'Paket A',
  'Paket B',
  'Paket C',
  'PAUD',
  'Profesi',
  'Putus SD',
  'S1',
  'S2',
  'S2 Terapan',
  'S3',
  'S3 Terapan',
  'SD / sederajat',
  'SMA / sederajat',
  'SMP / sederajat',
  'Sp-1',
  'Sp-2',
  'Tidak sekolah',
  'TK / sederajat',
];

const PENGHASILAN_OPTIONS = [
  'Kurang dari Rp. 500,000',
  'Rp. 500,000 - Rp. 999,999',
  'Rp. 1,000,000 - Rp. 1,999,999',
  'Rp. 2,000,000 - Rp. 4,999,999',
  'Rp. 5,000,000 - Rp. 20,000,000',
  'Lebih dari Rp. 20,000,000',
  'Tidak Berpenghasilan',
];

const HOBI_OPTIONS = [
  'Belanja',
  'Berkemah',
  'Berlari',
  'Bermain Biola',
  'Bermain Bola Tenis',
  'Bermain Boneka',
  'Bermain Bulu Tangkis',
  'Bermain Gitar',
  'Bermain Musik',
  'Bermain Piano',
  'Berselancar',
  'Fitness',
  'Fotografi',
  'Jogging',
  'Kesenian',
  'Lainnya',
  'Main Puzzle',
  'Makan',
  'Memancing',
  'Membaca',
  'Mendaki',
  'Menggambar',
  'Menjahit',
  'Menulis',
  'Mewarnai',
  'Olah Raga',
  'Traveling',
];

const CITA_OPTIONS = [
  'Arsitek',
  'Astronot',
  'Atlet',
  'Atlet E-Sport Profesional',
  'Atlit Olahraga',
  'Bidan',
  'Content Creator',
  "Da'i / Ustadz",
  'Designer',
  'Dokter',
  'Entertainer / Pekerja Seni',
  'Guru/Dosen',
  'Koki',
  'Lainnya',
  'Masinis Kereta Api',
  'Pegawai Negeri Sipil / PNS',
  'Pelaut',
  'Pemadam Kebakaran',
  'Pembalap',
  'Pembawa Acara / Master Ceremony',
  'Pendeta',
  'Pengacara',
  "Penghafal Al-Qur'an",
  'Pengusaha / Bisnismen',
  'Penulis',
  'Penyiar Radio',
  'Perawat',
  'Perawat / Suster',
  'Pilot',
  'PNS',
  'Polisi',
  'Politikus',
  'Presiden',
  'Seni/Lukis/Artis/Sejenis',
  'TNI/Polri',
  'Translator',
  'Vloger',
  'Wartawan',
  'Wiraswasta',
];

const PROFILE_STRENGTH_FIELDS = [
  'nama',
  'nisn',
  'nik',
  'nik_ayah',
  'nik_ibu',
  'nik_wali',
  'no_kk',
  'tempat_lahir',
  'tanggal_lahir',
  'alamat_jalan',
  'rt',
  'rw',
  'desa_kelurahan',
  'kecamatan',
  'kabupaten_kota',
  'provinsi',
  'kode_pos',
  'email_akun',
  'no_hp_akun',
  'nama_ayah',
  'tahun_lahir_ayah',
  'pendidikan_ayah_id_str',
  'pekerjaan_ayah_id_str',
  'nama_ibu',
  'tahun_lahir_ibu',
  'pendidikan_ibu_id_str',
  'pekerjaan_ibu_id_str',
  'hobi',
  'cita_cita',
];

const YES_NO_OPTIONS = ['Ya', 'Tidak'];
const TINGGAL_OPTIONS = [
  'Bersama orang tua',
  'Wali',
  'Kost',
  'Asrama',
  'Panti Asuhan',
  'Pesantren',
  'Lainnya',
];
const TRANSPORT_OPTIONS = [
  'Sepeda motor',
  'Mobil pribadi',
  'Jalan Kaki',
  'Angkutan Umum',
  'Ojek',
  'Lainnya',
];

const BASE_URL = 'https://ibnux.github.io/data-indonesia';

const LABEL_MAP: Record<string, string> = {
  nama: 'Nama Lengkap',
  nisn: 'NISN',
  nik: 'NIK',
  no_kk: 'Nomor KK',
  tempat_lahir: 'Tempat Lahir',
  tanggal_lahir: 'Tanggal Lahir',
  alamat_jalan: 'Alamat Jalan',
  email_akun: 'Email',
  no_hp_akun: 'No. HP',
  nik_ayah: 'NIK Ayah',
  nik_ibu: 'NIK Ibu',
  nik_wali: 'NIK Wali',
  nama_ayah: 'Nama Ayah',
  nama_ibu: 'Nama Ibu',
};

// Helper functions
const extractYear = (dateValue: any): string => {
  if (!dateValue) return '';
  if (dateValue instanceof Date) return dateValue.getFullYear().toString();
  const match = String(dateValue)
    .trim()
    .match(/(\d{4})/);
  return match ? match[1] : '';
};

const formatLabel = (key: string) =>
  LABEL_MAP[key] ||
  key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const formatLastSynced = (date: Date | null) => {
  if (!date) return 'Belum disinkronkan';
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffInMinutes < 1) return 'Baru saja';
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
  return date
    .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    .replace('.', ':');
};

// Styles object to replace NativeWind classes causing navigation issues
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  syncText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  syncIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  // Add more styles as needed...
});

// Optimized InputField with inline styles instead of NativeWind
const InputField = memo(
  ({
    label,
    fieldKey,
    icon: Icon,
    keyboardType = 'default',
    placeholder = '',
    value,
    onChangeText,
    isPending = false,
    onAlert,
    compact = false,
  }: any) => {
    const isLocked = LOCKED_COLUMNS.has(fieldKey);
    const isDisabled = DISABLED_COLUMNS.has(fieldKey);
    const [isCopied, setIsCopied] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Debounced haptic to prevent context issues
    const triggerHaptic = useCallback((type: string) => {
      requestAnimationFrame(() => {
        ReactNativeHapticFeedback.trigger(type as any, hapticOptions);
      });
    }, []);

    const handlePress = useCallback(() => {
      if (isPending) {
        onAlert?.(
          '⏳ Sedang Dicek Sekolah',
          `Kamu sudah mengajukan perubahan untuk data "${label}". \n\nSaat ini sekolah sedang memeriksa pengajuanmu.`,
          'info',
        );
      } else if (isLocked) {
        triggerHaptic('impactLight');
        onAlert?.(
          '🔍 Butuh Verifikasi Sekolah',
          `Khusus data "${label}", kamu tidak bisa mengubahnya secara langsung.`,
          'warning',
        );
      } else if (isDisabled) {
        triggerHaptic('notificationError');
        onAlert?.(
          '🚫 Data Terkunci Sistem',
          `Data "${label}" ini sudah terkunci secara permanen.`,
          'error',
        );
      }
    }, [isPending, isLocked, isDisabled, label, onAlert, triggerHaptic]);

    const handleCopy = useCallback(() => {
      if (!value) return;
      Clipboard.setString(value.toString());
      setIsCopied(true);
      triggerHaptic('notificationWarning');
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${label} berhasil disalin`, ToastAndroid.SHORT);
      }
      setTimeout(() => setIsCopied(false), 2000);
    }, [value, label, triggerHaptic]);

    const handlePaste = useCallback(async () => {
      const text = await Clipboard.getString();
      if (text) {
        onChangeText(fieldKey, text);
        triggerHaptic('impactLight');
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            `Berhasil menempel ke ${label}`,
            ToastAndroid.SHORT,
          );
        }
      }
    }, [fieldKey, onChangeText, label, triggerHaptic]);

    const bgColor = isDisabled
      ? '#f1f5f9'
      : isPending
        ? '#fefce8'
        : isLocked
          ? '#fffbeb'
          : 'white';
    const borderColor =
      isFocused && !isDisabled && !isPending && !isLocked
        ? '#3b82f6'
        : isDisabled
          ? '#e2e8f0'
          : isPending
            ? '#fde047'
            : isLocked
              ? '#fde68a'
              : '#e2e8f0';
    const iconColor = isDisabled
      ? '#cbd5e1'
      : isPending
        ? '#ca8a04'
        : isLocked
          ? '#d97706'
          : '#94a3b8';
    const textColor = isDisabled
      ? '#94a3b8'
      : isPending
        ? '#854d0e'
        : '#1e293b';

    return (
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text
              style={{
                color: '#475569',
                fontSize: 12,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {label}
            </Text>
            {isPending && (
              <Pressable
                onPress={handlePress}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#fef9c3',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  marginLeft: 6,
                  borderWidth: 1,
                  borderColor: '#fef08a',
                }}
              >
                <Clock size={10} color="#ca8a04" />
                {!compact && (
                  <Text
                    style={{
                      fontSize: 9,
                      color: '#a16207',
                      fontWeight: '700',
                      marginLeft: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Sedang Dicek
                  </Text>
                )}
              </Pressable>
            )}
            {!isPending && isLocked && !isDisabled && (
              <Pressable
                onPress={handlePress}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#fffbeb',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  marginLeft: 6,
                  borderWidth: 1,
                  borderColor: '#fef3c7',
                }}
              >
                <Lock size={10} color="#d97706" />
                {!compact && (
                  <Text
                    style={{
                      fontSize: 9,
                      color: '#b45309',
                      fontWeight: '700',
                      marginLeft: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Butuh Verif
                  </Text>
                )}
              </Pressable>
            )}
            {isDisabled && (
              <Pressable
                onPress={handlePress}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f1f5f9',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  marginLeft: 6,
                }}
              >
                <Lock size={10} color="#94a3b8" />
                {!compact && (
                  <Text
                    style={{
                      fontSize: 9,
                      color: '#64748b',
                      fontWeight: '700',
                      marginLeft: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Terkunci
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          {!compact && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {value && (
                <Pressable
                  onPress={handleCopy}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    backgroundColor: '#f8fafc',
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                  }}
                >
                  {isCopied ? (
                    <CheckCircle size={14} color="#059669" />
                  ) : (
                    <Copy size={14} color="#64748b" />
                  )}
                </Pressable>
              )}
              {!isDisabled && !isPending && (
                <Pressable
                  onPress={handlePaste}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    marginLeft: 8,
                    width: 32,
                    height: 32,
                    backgroundColor: '#eff6ff',
                    borderWidth: 1,
                    borderColor: '#bfdbfe',
                  }}
                >
                  <ClipboardCheck size={14} color="#2563eb" />
                </Pressable>
              )}
            </View>
          )}
        </View>

        <Pressable
          onPress={isPending ? handlePress : undefined}
          style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 16,
            paddingHorizontal: 16,
            borderWidth: 1,
            backgroundColor: bgColor,
            borderColor: borderColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
            elevation: 1,
          }}
        >
          <Icon size={20} color={iconColor} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 12,
              height: '100%',
              fontSize: 14,
              fontWeight: '600',
              color: textColor,
            }}
            editable={!isDisabled && !isPending}
            pointerEvents={isPending ? 'none' : 'auto'}
            value={value ? value.toString() : ''}
            onChangeText={text => onChangeText(fieldKey, text)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || `Masukkan ${label}`}
            placeholderTextColor="#cbd5e1"
            keyboardType={keyboardType}
            autoCapitalize="none"
          />
        </Pressable>
      </View>
    );
  },
);

// Optimized SegmentedField - FIXED: Removed haptic from render phase
const SegmentedField = memo(
  ({
    label,
    fieldKey,
    icon: Icon,
    value,
    options = ['Ya', 'Tidak'],
    onSelect,
    isPending = false,
    disabled = false,
    onAlert,
  }: any) => {
    const isLocked = LOCKED_COLUMNS.has(fieldKey);

    const handlePress = useCallback(
      (option: string) => {
        if (isPending) {
          onAlert?.(
            '⏳ Sedang Dicek Sekolah',
            `Kamu sudah mengajukan perubahan untuk data "${label}".`,
            'info',
          );
          return;
        }
        if (disabled) return;

        // Schedule haptic outside render cycle
        setTimeout(() => {
          ReactNativeHapticFeedback.trigger('selection', hapticOptions);
        }, 0);

        onSelect(fieldKey, option);
      },
      [isPending, disabled, label, fieldKey, onSelect, onAlert],
    );

    const handleLockedPress = useCallback(() => {
      onAlert?.(
        '🔍 Butuh Verifikasi Sekolah',
        `Khusus data "${label}", kamu tidak bisa mengubahnya secara langsung.`,
        'warning',
      );
    }, [label, onAlert]);

    const iconColor = isPending
      ? '#ca8a04'
      : disabled
        ? '#cbd5e1'
        : isLocked
          ? '#d97706'
          : '#94a3b8';

    return (
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: '#475569',
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
          {isPending && (
            <Pressable
              onPress={() =>
                onAlert?.(
                  '⏳ Sedang Dicek Sekolah',
                  `Kamu sudah mengajukan perubahan untuk data "${label}".`,
                  'info',
                )
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fef9c3',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                marginLeft: 6,
                borderWidth: 1,
                borderColor: '#fef08a',
              }}
            >
              <Clock size={10} color="#ca8a04" />
              <Text
                style={{
                  fontSize: 9,
                  color: '#a16207',
                  fontWeight: '700',
                  marginLeft: 4,
                  textTransform: 'uppercase',
                }}
              >
                Sedang Dicek
              </Text>
            </Pressable>
          )}
          {!isPending && isLocked && (
            <Pressable
              onPress={handleLockedPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fffbeb',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                marginLeft: 6,
                borderWidth: 1,
                borderColor: '#fef3c7',
              }}
            >
              <Lock size={10} color="#d97706" />
              <Text
                style={{
                  fontSize: 9,
                  color: '#b45309',
                  fontWeight: '700',
                  marginLeft: 4,
                  textTransform: 'uppercase',
                }}
              >
                Butuh Verif
              </Text>
            </Pressable>
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 16,
            paddingHorizontal: 12,
            borderWidth: 1,
            height: 64,
            backgroundColor: isPending
              ? '#fefce8'
              : disabled
                ? '#f1f5f9'
                : isLocked
                  ? '#fffbeb'
                  : 'white',
            borderColor: isPending
              ? '#fde047'
              : disabled
                ? '#e2e8f0'
                : isLocked
                  ? '#fde68a'
                  : '#e2e8f0',
          }}
        >
          <Icon size={20} color={iconColor} />
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              marginLeft: 12,
              height: 40,
              backgroundColor: '#f1f5f9',
              padding: 4,
              borderRadius: 12,
            }}
          >
            {options.map((option: string) => {
              const isActive = value === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => handlePress(option)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: isActive ? 'white' : 'transparent',
                    shadowColor: isActive ? '#000' : 'transparent',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isActive ? 0.05 : 0,
                    shadowRadius: 1,
                    elevation: isActive ? 1 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: isActive ? '#2563eb' : '#64748b',
                    }}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  },
);

// Memoized CustomBottomSheet
const CustomBottomSheet = React.forwardRef(
  ({ title, children, snapPoints = ['50%', '85%'] }: any, ref: any) => {
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 32 }}
        handleIndicatorStyle={{ backgroundColor: '#cbd5e1', width: 50 }}
        handleStyle={{ paddingTop: 12, paddingBottom: 8 }}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '900',
              color: '#1e293b',
              marginBottom: 24,
              textAlign: 'center',
              letterSpacing: -0.5,
              borderBottomWidth: 1,
              borderBottomColor: '#f1f5f9',
              paddingBottom: 16,
            }}
          >
            {title}
          </Text>
          {children}
        </View>
      </BottomSheetModal>
    );
  },
);

// Optimized SelectField
const SelectField = memo(
  ({
    label,
    fieldKey,
    icon: Icon,
    value,
    options,
    onSelect,
    isPending = false,
    disabled = false,
    onPressDisabled,
    onAlert,
  }: any) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const isLocked = LOCKED_COLUMNS.has(fieldKey);
    const [searchQuery, setSearchQuery] = useState('');

    const handlePress = useCallback(() => {
      if (isPending) {
        onAlert?.(
          '⏳ Sedang Dicek Sekolah',
          `Kamu sudah mengajukan perubahan untuk data "${label}".`,
          'info',
        );
        return;
      }
      if (disabled) {
        onPressDisabled?.();
        return;
      }
      setSearchQuery('');
      bottomSheetRef.current?.present();
    }, [isPending, disabled, label, onAlert, onPressDisabled]);

    const handleCloseModal = useCallback(
      () => bottomSheetRef.current?.dismiss(),
      [],
    );

    const filteredOptions = useMemo(() => {
      if (!searchQuery) return options;
      return options.filter((opt: string) =>
        String(opt).toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }, [options, searchQuery]);

    const handleSelect = useCallback(
      (option: string) => {
        setTimeout(() => {
          ReactNativeHapticFeedback.trigger('selection', hapticOptions);
        }, 0);
        onSelect(fieldKey, option);
        handleCloseModal();
      },
      [fieldKey, onSelect, handleCloseModal],
    );

    return (
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: '#475569',
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
          {isPending && (
            <TouchableOpacity
              onPress={() =>
                onAlert?.(
                  '⏳ Sedang Dicek Sekolah',
                  `Kamu sudah mengajukan perubahan untuk data "${label}".`,
                  'info',
                )
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fef9c3',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                marginLeft: 6,
                borderWidth: 1,
                borderColor: '#fef08a',
              }}
            >
              <Clock size={10} color="#ca8a04" />
              <Text
                style={{
                  fontSize: 9,
                  color: '#a16207',
                  fontWeight: '700',
                  marginLeft: 4,
                  textTransform: 'uppercase',
                }}
              >
                Sedang Dicek
              </Text>
            </TouchableOpacity>
          )}
          {!isPending && isLocked && (
            <TouchableOpacity
              onPress={() =>
                onAlert?.(
                  '🔍 Butuh Verifikasi Sekolah',
                  `Khusus data "${label}", kamu tidak bisa mengubahnya secara langsung.`,
                  'warning',
                )
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fffbeb',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                marginLeft: 6,
                borderWidth: 1,
                borderColor: '#fef3c7',
              }}
            >
              <Lock size={10} color="#d97706" />
              <Text
                style={{
                  fontSize: 9,
                  color: '#b45309',
                  fontWeight: '700',
                  marginLeft: 4,
                  textTransform: 'uppercase',
                }}
              >
                Butuh Verif
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={disabled ? 1 : 0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 56,
            backgroundColor: isPending
              ? '#fefce8'
              : disabled
                ? '#f1f5f9'
                : isLocked
                  ? '#fffbeb'
                  : 'white',
            borderWidth: 1,
            borderColor: isPending
              ? '#fde047'
              : disabled
                ? '#e2e8f0'
                : isLocked
                  ? '#fde68a'
                  : '#e2e8f0',
          }}
        >
          <Icon
            size={20}
            color={
              isPending
                ? '#ca8a04'
                : disabled
                  ? '#cbd5e1'
                  : isLocked
                    ? '#d97706'
                    : '#94a3b8'
            }
          />
          <Text
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 14,
              fontWeight: value ? '600' : '400',
              color: isPending
                ? '#a16207'
                : disabled
                  ? '#94a3b8'
                  : value
                    ? '#1e293b'
                    : '#94a3b8',
            }}
          >
            {value || `Pilih ${label}`}
          </Text>
          {!disabled && (
            <ChevronLeft
              size={20}
              color={isPending ? '#ca8a04' : '#94a3b8'}
              style={{ transform: [{ rotate: '-90deg' }] }}
            />
          )}
        </TouchableOpacity>

        <CustomBottomSheet ref={bottomSheetRef} title={`Pilih ${label}`}>
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                paddingHorizontal: 16,
                height: 48,
              }}
            >
              <Search size={20} color="#94a3b8" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  color: '#1e293b',
                  fontWeight: '600',
                }}
                placeholder="Cari pilihan..."
                placeholderTextColor="#cbd5e1"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <BottomSheetFlatList
            data={filteredOptions}
            keyExtractor={(item: any) => item}
            initialNumToRender={15}
            renderItem={({ item: option }: { item: any }) => (
              <TouchableOpacity
                onPress={() => handleSelect(option)}
                style={{
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: '#f1f5f9',
                  height: 56,
                  backgroundColor: value === option ? '#eff6ff' : 'white',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: value === option ? '700' : '500',
                    color: value === option ? '#1d4ed8' : '#334155',
                  }}
                  numberOfLines={1}
                >
                  {option}
                </Text>
                {value === option && <CheckCircle size={20} color="#2563eb" />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View
                style={{
                  paddingVertical: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Info size={40} color="#cbd5e1" />
                <Text
                  style={{
                    color: '#94a3b8',
                    marginTop: 16,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}
                >
                  {options.length === 0
                    ? 'Data tidak tersedia.\nPastikan pilihan sebelumnya sudah diisi.'
                    : 'Tidak ditemukan.'}
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </CustomBottomSheet>
      </View>
    );
  },
);

// Optimized DateField
const DateField = memo(
  ({
    label,
    fieldKey,
    value,
    onChangeText,
    isPending = false,
    onAlert,
  }: any) => {
    const [show, setShow] = useState(false);
    const isLocked = LOCKED_COLUMNS.has(fieldKey);

    const dateValue = useMemo(
      () => (value ? new Date(value) : new Date()),
      [value],
    );

    const handlePickerChange = useCallback(
      (event: any, selectedDate?: Date) => {
        setShow(Platform.OS === 'ios');
        if (selectedDate) {
          onChangeText(fieldKey, selectedDate.toISOString().split('T')[0]);
        }
      },
      [fieldKey, onChangeText],
    );

    const handlePress = useCallback(() => {
      if (isPending) {
        onAlert?.(
          '⏳ Sedang Dicek Sekolah',
          `Kamu sudah mengajukan perubahan untuk data "${label}".`,
          'info',
        );
        return;
      }
      setShow(true);
    }, [isPending, label, onAlert]);

    const formattedDate = useMemo(() => {
      if (!value) return null;
      return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }, [value]);

    return (
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: '#475569',
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
          {isPending && (
            <TouchableOpacity
              onPress={() =>
                onAlert?.(
                  '⏳ Sedang Dicek Sekolah',
                  `Kamu sudah mengajukan perubahan untuk data "${label}".`,
                  'info',
                )
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fef9c3',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                marginLeft: 6,
                borderWidth: 1,
                borderColor: '#fef08a',
              }}
            >
              <Clock size={10} color="#ca8a04" />
              <Text
                style={{
                  fontSize: 9,
                  color: '#a16207',
                  fontWeight: '700',
                  marginLeft: 4,
                  textTransform: 'uppercase',
                }}
              >
                Sedang Dicek
              </Text>
            </TouchableOpacity>
          )}
          {!isPending && isLocked && (
            <TouchableOpacity
              onPress={() =>
                onAlert?.(
                  '🔍 Butuh Verifikasi Sekolah',
                  `Khusus data "${label}", kamu tidak bisa mengubahnya secara langsung.`,
                  'warning',
                )
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fffbeb',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                marginLeft: 6,
                borderWidth: 1,
                borderColor: '#fef3c7',
              }}
            >
              <Lock size={10} color="#d97706" />
              <Text
                style={{
                  fontSize: 9,
                  color: '#b45309',
                  fontWeight: '700',
                  marginLeft: 4,
                  textTransform: 'uppercase',
                }}
              >
                Butuh Verif
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={handlePress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 56,
            backgroundColor: isPending
              ? '#fefce8'
              : isLocked
                ? '#fffbeb'
                : 'white',
            borderWidth: 1,
            borderColor: isPending
              ? '#fde047'
              : isLocked
                ? '#fde68a'
                : '#e2e8f0',
          }}
        >
          <Calendar
            size={20}
            color={isPending ? '#ca8a04' : isLocked ? '#d97706' : '#94a3b8'}
          />
          <Text
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 14,
              fontWeight: value ? '600' : '400',
              color: isPending ? '#a16207' : value ? '#1e293b' : '#94a3b8',
            }}
          >
            {formattedDate || `Pilih ${label}`}
          </Text>
        </TouchableOpacity>

        {show && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
      </View>
    );
  },
);

// Optimized RegionPicker with better caching
const RegionPicker = memo(
  ({ formData, onChange, pendingFields = [], onShowAlert }: any) => {
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState<{
      provinces: any[];
      regencies: any[];
      districts: any[];
      villages: any[];
    }>({
      provinces: [],
      regencies: [],
      districts: [],
      villages: [],
    });

    // Helper to sort by name
    const sortByName = (data: any[]) => {
      return data.sort((a, b) => a.nama.localeCompare(b.nama));
    };

    // Helper to normalize region name for comparison
    const normalizeRegionName = (name: string) => {
      if (!name) return '';
      return name
        .replace(/^(KABUPATEN|KAB\.|KOTA)\s+/i, '')
        .trim()
        .toUpperCase();
    };

    // Fetch provinces on mount - IBNUX API
    useEffect(() => {
      let mounted = true;
      fetch(`${BASE_URL}/propinsi.json`)
        .then(res => res.json())
        .then(
          data =>
            mounted &&
            setRegions(prev => ({ ...prev, provinces: sortByName(data) })),
        )
        .catch(console.error);
      return () => {
        mounted = false;
      };
    }, []);

    // Fetch regencies when province changes or is already selected
    useEffect(() => {
      if (!formData.provinsi || regions.provinces.length === 0) return;

      const province = regions.provinces.find(
        (p: any) => normalizeRegionName(p.nama) === normalizeRegionName(formData.provinsi),
      );

      if (!province) return;

      // Only fetch if we don't have regencies or if the current regencies don't belong to this province
      // (Simplified check: just fetch if we have a province ID)
      let mounted = true;
      fetch(`${BASE_URL}/kabupaten/${province.id}.json`)
        .then(res => res.json())
        .then(data => {
          if (mounted) {
            setRegions(prev => ({ ...prev, regencies: sortByName(data) }));
          }
        })
        .catch(console.error);

      return () => {
        mounted = false;
      };
    }, [formData.provinsi, regions.provinces]);

    // Fetch districts when regency changes or is already selected
    useEffect(() => {
      if (!formData.kabupaten_kota || regions.regencies.length === 0) return;

      const regency = regions.regencies.find(
        (r: any) => normalizeRegionName(r.nama) === normalizeRegionName(formData.kabupaten_kota),
      );

      if (!regency) return;

      let mounted = true;
      fetch(`${BASE_URL}/kecamatan/${regency.id}.json`)
        .then(res => res.json())
        .then(data => {
          if (mounted) {
            setRegions(prev => ({ ...prev, districts: sortByName(data) }));
          }
        })
        .catch(console.error);

      return () => {
        mounted = false;
      };
    }, [formData.kabupaten_kota, regions.regencies]);

    // Fetch villages when district changes or is already selected
    useEffect(() => {
      if (!formData.kecamatan || regions.districts.length === 0) return;

      const district = regions.districts.find(
        (d: any) => normalizeRegionName(d.nama) === normalizeRegionName(formData.kecamatan),
      );

      if (!district) return;

      let mounted = true;
      fetch(`${BASE_URL}/kelurahan/${district.id}.json`)
        .then(res => res.json())
        .then(data => {
          if (mounted) {
            setRegions(prev => ({ ...prev, villages: sortByName(data) }));
          }
        })
        .catch(console.error);

      return () => {
        mounted = false;
      };
    }, [formData.kecamatan, regions.districts]);

    const handleSelectProv = useCallback(
      async (key: string, name: string) => {
        onChange('provinsi', name);
        onChange('kabupaten_kota', '');
        onChange('kecamatan', '');
        onChange('desa_kelurahan', '');

        const province = regions.provinces.find((p: any) => p.nama === name);
        if (province) {
          setLoading(true);
          try {
            const res = await fetch(
              `${BASE_URL}/kabupaten/${province.id}.json`,
            );
            const data = await res.json();
            setRegions(prev => ({ ...prev, regencies: sortByName(data) }));
          } finally {
            setLoading(false);
          }
        }
      },
      [regions.provinces, onChange],
    );

    const handleSelectReg = useCallback(
      async (key: string, name: string) => {
        onChange('kabupaten_kota', name);
        onChange('kecamatan', '');
        onChange('desa_kelurahan', '');

        const regency = regions.regencies.find((r: any) => r.nama === name);
        if (regency) {
          setLoading(true);
          try {
            const res = await fetch(`${BASE_URL}/kecamatan/${regency.id}.json`);
            const data = await res.json();
            setRegions(prev => ({ ...prev, districts: sortByName(data) }));
          } finally {
            setLoading(false);
          }
        }
      },
      [regions.regencies, onChange],
    );

    const handleSelectDist = useCallback(
      async (key: string, name: string) => {
        onChange('kecamatan', name);
        onChange('desa_kelurahan', '');

        const district = regions.districts.find((d: any) => d.nama === name);
        if (district) {
          setLoading(true);
          try {
            const res = await fetch(`${BASE_URL}/kelurahan/${district.id}.json`);
            const data = await res.json();
            setRegions(prev => ({ ...prev, villages: sortByName(data) }));
          } finally {
            setLoading(false);
          }
        }
      },
      [regions.districts, onChange],
    );

    const handleDisabledPress = useCallback(
      (field: string) => {
        onShowAlert?.(
          'Belum Memilih',
          `Silakan pilih ${field} terlebih dahulu.`,
          'warning',
        );
      },
      [onShowAlert],
    );

    return (
      <>
        <SelectField
          label="Provinsi"
          fieldKey="provinsi"
          icon={MapPin}
          value={formData.provinsi}
          options={regions.provinces.map((p: any) => p.nama)}
          onSelect={handleSelectProv}
          isPending={pendingFields.includes('provinsi')}
          onAlert={onShowAlert}
        />
        <SelectField
          label="Kabupaten / Kota"
          fieldKey="kabupaten_kota"
          icon={MapPin}
          value={formData.kabupaten_kota}
          options={regions.regencies.map((r: any) => r.nama)}
          onSelect={handleSelectReg}
          isPending={pendingFields.includes('kabupaten_kota')}
          disabled={!formData.provinsi}
          onPressDisabled={() => handleDisabledPress('Provinsi')}
          onAlert={onShowAlert}
        />
        {!regions.regencies.length &&
          !formData.kabupaten_kota &&
          formData.provinsi && (
            <Text
              style={{
                fontSize: 12,
                color: '#3b82f6',
                marginBottom: 8,
                paddingHorizontal: 8,
              }}
            >
              * Sedang memuat kabupaten...
            </Text>
          )}
        <SelectField
          label="Kecamatan"
          fieldKey="kecamatan"
          icon={MapPin}
          value={formData.kecamatan}
          options={regions.districts.map((d: any) => d.nama)}
          onSelect={handleSelectDist}
          isPending={pendingFields.includes('kecamatan')}
          disabled={!formData.kabupaten_kota}
          onPressDisabled={() => handleDisabledPress('Kabupaten/Kota')}
          onAlert={onShowAlert}
        />
        <SelectField
          label="Desa / Kelurahan"
          fieldKey="desa_kelurahan"
          icon={MapPin}
          value={formData.desa_kelurahan}
          options={regions.villages.map((v: any) => v.nama)}
          onSelect={(k: any, v: any) => onChange(k, v)}
          isPending={pendingFields.includes('desa_kelurahan')}
          disabled={!formData.kecamatan}
          onPressDisabled={() => handleDisabledPress('Kecamatan')}
          onAlert={onShowAlert}
        />
      </>
    );
  },
);

const FormSection = memo(({ title, icon: Icon, children }: any) => (
  <View
    style={{
      backgroundColor: 'white',
      borderRadius: 32,
      padding: 24,
      marginBottom: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#f1f5f9',
    }}
  >
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
      }}
    >
      <View
        style={{
          backgroundColor: '#eff6ff',
          padding: 10,
          borderRadius: 12,
          marginRight: 16,
        }}
      >
        <Icon size={22} color="#2563eb" />
      </View>
      <Text
        style={{
          color: '#1e293b',
          fontWeight: '900',
          fontSize: 18,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </Text>
    </View>
    {children}
  </View>
));

// Optimized ProfileSkeleton
const ProfileSkeleton = memo(() => (
  <View style={styles.container}>
    {/* Header Skeleton */}
    <View style={styles.header}>
      <View style={styles.backButton}>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Skeleton width={100} height={20} style={{ marginBottom: 4 }} />
        <Skeleton width={80} height={12} />
      </View>
      <View style={{ width: 40 }} />
    </View>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View
        style={{
          paddingVertical: 24,
          backgroundColor: 'white',
          marginBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f8fafc',
          alignItems: 'center',
        }}
      >
        <View
          style={{ width: '100%', paddingHorizontal: 24, marginBottom: 24 }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Skeleton width={120} height={14} />
            <Skeleton width={40} height={14} />
          </View>
          <Skeleton width="100%" height={12} borderRadius={6} />
          <Skeleton width={200} height={10} style={{ marginTop: 8 }} />
        </View>

        <View
          style={{
            marginHorizontal: 24,
            padding: 16,
            width: '88%',
            backgroundColor: '#eff6ff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#dbeafe',
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 24,
          }}
        >
          <Skeleton width={20} height={20} borderRadius={10} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Skeleton width={150} height={12} style={{ marginBottom: 6 }} />
            <Skeleton width="90%" height={10} style={{ marginBottom: 4 }} />
            <Skeleton width="60%" height={10} style={{ marginBottom: 8 }} />
            <Skeleton width={100} height={20} borderRadius={10} />
          </View>
        </View>

        <View
          style={{
            width: 112,
            height: 112,
            borderRadius: 56,
            backgroundColor: '#f1f5f9',
            borderWidth: 4,
            borderColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <Skeleton
            variant="circle"
            width={112}
            height={112}
            borderRadius={56}
          />
        </View>
        <Skeleton width={120} height={12} />
      </View>

      {/* Guide Loading */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <View
          style={{
            padding: 16,
            backgroundColor: 'white',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}
        >
          <Skeleton width={150} height={14} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Skeleton
              width={20}
              height={20}
              borderRadius={6}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Skeleton width={100} height={12} style={{ marginBottom: 4 }} />
              <Skeleton width="80%" height={10} />
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Skeleton
              width={20}
              height={20}
              borderRadius={6}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Skeleton width={100} height={12} style={{ marginBottom: 4 }} />
              <Skeleton width="80%" height={10} />
            </View>
          </View>
        </View>
      </View>

      {/* Tabs Loading */}
      <View
        style={{
          paddingHorizontal: 24,
          marginBottom: 24,
          flexDirection: 'row',
          gap: 8,
        }}
      >
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} width={100} height={40} borderRadius={24} />
        ))}
      </View>

      {/* Form Loading */}
      <View style={{ paddingHorizontal: 24 }}>
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 32,
            padding: 24,
            borderWidth: 1,
            borderColor: '#f1f5f9',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f8fafc',
            }}
          >
            <Skeleton
              width={40}
              height={40}
              borderRadius={12}
              style={{ marginRight: 16 }}
            />
            <Skeleton width={150} height={20} />
          </View>

          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{ marginBottom: 24 }}>
              <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={56} borderRadius={16} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  </View>
));

// Main Component - Use React.memo and proper optimization
const EditProfileScreen = memo(({ navigation, route }: any) => {
  const { user } = route.params;

  // State management
  const [pengajuanList, setPengajuanList] = useState(
    user?.siswa?.pengajuan_perubahan || [],
  );
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [formData, setFormData] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [alertConfig, setAlertConfig] = useState<any>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    children: null,
    onClose: () => { },
  });
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('Pribadi');
  const [photoVersion, setPhotoVersion] = useState(0);

  const initialDataRef = useRef<any>(null);

  // Computed values with useMemo
  const pendingDataOverrides = useMemo(() => {
    let overrides: any = {};
    pengajuanList.forEach((req: any) => {
      if (req.status === 'pending' && req.data_perubahan) {
        try {
          const data =
            typeof req.data_perubahan === 'string'
              ? JSON.parse(req.data_perubahan)
              : req.data_perubahan;
          overrides = { ...overrides, ...data };
        } catch (e) {
          console.warn('Gagal parse data perubahan', e);
        }
      }
    });
    return overrides;
  }, [pengajuanList]);

  const pendingFields = useMemo(
    () => Object.keys(pendingDataOverrides),
    [pendingDataOverrides],
  );

  const monthlyApprovedCount = useMemo(
    () => pengajuanList.filter((req: any) => req.status !== 'ditolak').length,
    [pengajuanList],
  );

  const profileCompletion = useMemo(() => {
    if (!formData) return 0;
    const requiredFields = [
      ...PROFILE_STRENGTH_FIELDS,
      'penerima_kip',
      'penerima_kps',
    ];
    if (formData.penerima_kip === 'Ya') requiredFields.push('no_kip');

    let filled = 0;
    requiredFields.forEach(field => {
      const val = formData[field];
      if (val && String(val).trim() !== '' && val !== '-') filled++;
    });
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  const isDirty = useMemo(() => {
    if (!initialDataRef.current || !formData) return false;
    const keys = Object.keys(formData);
    for (let key of keys) {
      if (key === 'foto' || key === 'berkas' || key === 'pengajuan_perubahan')
        continue;
      const valOld = String(initialDataRef.current[key] || '').trim();
      const valNew = String(formData[key] || '').trim();
      if (valOld !== valNew) return true;
    }
    return false;
  }, [formData]);

  const currentPhotoUrl = useMemo(() => {
    if (selectedPhoto) return selectedPhoto.uri;
    if (!formData.foto) return null;
    return formData.foto.startsWith('http')
      ? formData.foto
      : `${MAIN_APP_URL}/storage/${formData.foto}?v=${photoVersion}`;
  }, [selectedPhoto, formData.foto, photoVersion]);

  // Callbacks
  const handleChange = useCallback((key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const handleShowStatus = useCallback(
    (title: string, message: string, type: any, children?: React.ReactNode) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        type,
        children,
        onClose: () =>
          setAlertConfig((prev: any) => ({ ...prev, visible: false })),
      });
    },
    [],
  );

  const fetchLatestProfile = useCallback(async () => {
    try {
      const freshData = await api.get('/me', {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
      const userData = freshData.data;
      if (!userData?.username) return;

      if (userData.siswa?.pengajuan_perubahan) {
        setPengajuanList(userData.siswa.pengajuan_perubahan);
      }

      let newOverrides: any = {};
      userData.siswa?.pengajuan_perubahan?.forEach((req: any) => {
        if (req.status === 'pending' && req.data_perubahan) {
          try {
            const d =
              typeof req.data_perubahan === 'string'
                ? JSON.parse(req.data_perubahan)
                : req.data_perubahan;
            newOverrides = { ...newOverrides, ...d };
          } catch (e) { }
        }
      });

      const newFormData = {
        ...(userData.siswa || {}),
        ...newOverrides,
        alamat_jalan:
          newOverrides.alamat_jalan ??
          userData.alamat ??
          userData.siswa?.alamat_jalan ??
          '',
        email_akun: newOverrides.email_akun ?? userData.username ?? '',
        nomor_telepon_rumah:
          newOverrides.nomor_telepon_rumah ??
          userData.siswa?.nomor_telepon_rumah ??
          userData.no_telepon ??
          '',
        no_hp_akun: newOverrides.no_hp_akun ?? userData.no_hp ?? '',
      };

      setFormData(newFormData);
      initialDataRef.current = { ...newFormData };
      setLastSynced(new Date());
    } catch (error) {
      console.warn('Gagal sinkronisasi:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchLatestProfile();
    const task = InteractionManager.runAfterInteractions(() =>
      setIsReady(true),
    );
    return () => task.cancel();
  }, [fetchLatestProfile]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLatestProfile();
  }, [fetchLatestProfile]);

  const uploadPhoto = useCallback(
    async (file: any) => {
      setLoading(true);
      try {
        const data = new FormData();
        data.append('foto', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
        const response = await api.post('/siswa/update', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const newPhotoPath = response.data.user?.siswa?.foto;
        if (newPhotoPath) {
          setFormData((prev: any) => ({ ...prev, foto: newPhotoPath }));
          setPhotoVersion(v => v + 1);
        }
        handleShowStatus(
          'Foto Berhasil!',
          'Foto profil Anda telah diperbarui.',
          'success',
        );
      } catch (error: any) {
        handleShowStatus('Gagal Upload', error.message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [handleShowStatus],
  );

  const handleSelectPhoto = useCallback(async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        width: 600,
        height: 800,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });
      if (image.size && image.size > 2 * 1024 * 1024) {
        handleShowStatus('Terlalu Besar', 'Maksimal 2 MB.', 'error');
        return;
      }
      const selectedFile = {
        uri: image.path,
        type: image.mime,
        name: image.path.split('/').pop() || 'profile.jpg',
        size: image.size,
      };
      setSelectedPhoto(selectedFile);
      uploadPhoto(selectedFile);
    } catch (err) {
      console.log('Cancelled');
    }
  }, [uploadPhoto, handleShowStatus]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    const changedKeys: string[] = [];
    const initialData = initialDataRef.current || {};

    Object.keys(formData).forEach(key => {
      if (key !== 'foto' && key !== 'berkas') {
        const valOld = String(initialData[key] || '');
        const valNew = String(formData[key] || '');
        if (valOld !== valNew) changedKeys.push(key);
      }
    });

    const successFields = changedKeys.filter(k => !LOCKED_COLUMNS.has(k));
    const pendingFieldsList = changedKeys.filter(k => LOCKED_COLUMNS.has(k));

    if (changedKeys.length === 0) {
      handleShowStatus(
        'Tidak Ada Perubahan',
        'Anda belum mengubah data apapun.',
        'info',
      );
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'foto' && key !== 'berkas' && formData[key] !== null)
          data.append(key, String(formData[key]));
      });
      // Append keys even if empty to ensure they are sent if needed
      // but usually formData loop covers it.

      const response = await api.post('/siswa/update', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update state based on response strictly
      if (response.data.user) {
        setTimeout(() => {
          ReactNativeHapticFeedback.trigger(
            'notificationSuccess',
            hapticOptions,
          );
        }, 0);

        const storageKey = 'USER_PROFILE_DATA';
        await AsyncStorage.setItem(
          `CACHE_${storageKey}`,
          JSON.stringify(response.data.user),
        );
        await AsyncStorage.setItem(
          `META_${storageKey}`,
          JSON.stringify({ timestamp: Date.now(), etag: null }),
        );

        const userData = response.data.user;

        // Update pengajuan list first
        if (userData.siswa?.pengajuan_perubahan) {
          setPengajuanList(userData.siswa.pengajuan_perubahan);
        }

        // Re-calculate overrides based on the NEW pengajuanList from server
        let newOverrides: any = {};
        if (userData.siswa?.pengajuan_perubahan) {
          userData.siswa.pengajuan_perubahan.forEach((req: any) => {
            if (req.status === 'pending' && req.data_perubahan) {
              try {
                const d = typeof req.data_perubahan === 'string'
                  ? JSON.parse(req.data_perubahan)
                  : req.data_perubahan;
                newOverrides = { ...newOverrides, ...d };
              } catch (e) { }
            }
          });
        }

        // Re-construct formData to be in sync with server state + pending overrides
        const newFormData = {
          ...(userData.siswa || {}),
          ...newOverrides,
          alamat_jalan: newOverrides.alamat_jalan ?? userData.alamat ?? userData.siswa?.alamat_jalan ?? '',
          email_akun: newOverrides.email_akun ?? userData.username ?? '',
          nomor_telepon_rumah: newOverrides.nomor_telepon_rumah ?? userData.siswa?.nomor_telepon_rumah ?? userData.no_telepon ?? '',
          no_hp_akun: newOverrides.no_hp_akun ?? userData.no_hp ?? '',
        };

        setFormData(newFormData);
        initialDataRef.current = { ...newFormData };
        setLastSynced(new Date());
      }

      const { pending_status, direct_updated } = response.data;
      const isPendingTrouble =
        pending_status === 'limit_reached' ||
        pending_status === 'pending_exists';

      // Determine actual success/pending based on response context
      // Note: If we just created a pending request (pending_status === 'ok' or similar), 
      // then pendingFieldsList contains the keys that ARE now pending.
      // direct_updated might be true if SOME fields (non-locked) were updated.

      const hasActualSuccess = successFields.length > 0 && direct_updated;
      const hasActualPending = pendingFieldsList.length > 0 && !isPendingTrouble; // limits logic handled separately

      let modalTitle = 'Perubahan Disimpan ✅';
      let modalType: any = 'success';
      let modalMessage = 'Data profil berhasil diperbarui.';

      if (pendingFieldsList.length > 0 && isPendingTrouble && !hasActualSuccess) {
        modalTitle = 'Perubahan Belum Diterapkan';
        modalType = 'warning';
        modalMessage =
          'Perubahan data penting Anda belum dapat diproses saat ini.';
      } else if (pendingFieldsList.length > 0 && isPendingTrouble && hasActualSuccess) {
        modalTitle = 'Disimpan Sebagian';
        modalType = 'warning';
        modalMessage = 'Data umum tersimpan, namun data penting tertunda.';
      } else if (hasActualPending && !hasActualSuccess) {
        modalTitle = 'Menunggu Verifikasi ⏳';
        modalType = 'info';
        modalMessage = 'Data penting telah diajukan dan menunggu persetujuan sekolah.';
      } else if (hasActualPending && hasActualSuccess) {
        modalTitle = 'Berhasil & Menunggu Verifikasi';
        modalType = 'info';
        modalMessage = 'Data langsung tersimpan, data penting menunggu persetujuan.';
      }

      handleShowStatus(
        modalTitle,
        modalMessage,
        modalType,
        <View style={{ marginTop: 12 }}>
          {/* Show Pending List if we have valid pending fields */}
          {pendingFieldsList.length > 0 && !isPendingTrouble && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#fffbeb', padding: 8, borderRadius: 8 }}>
                <Lock size={14} color="#d97706" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: '#b45309', fontWeight: '700' }}>
                  SEDANG DICEK SEKOLAH
                </Text>
              </View>
              {pendingFieldsList.map((field) => (
                <View key={field} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#d97706', marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: '#4b5563', fontWeight: '500' }}>
                    {formatLabel(field)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Show Trouble List if any */}
          {pendingFieldsList.length > 0 && isPendingTrouble && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#fef2f2', padding: 8, borderRadius: 8 }}>
                <XCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: '#b91c1c', fontWeight: '700' }}>
                  GAGAL DIAJUKAN (KUOTA/PENDING)
                </Text>
              </View>
              {pendingFieldsList.map((field) => (
                <View key={field} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444', marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: '#4b5563', fontWeight: '500' }}>
                    {formatLabel(field)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {hasActualSuccess && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8 }}>
                <CheckCircle size={14} color="#15803d" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: '#166534', fontWeight: '700' }}>
                  BERHASIL DISIMPAN
                </Text>
              </View>
              {successFields.map((field) => (
                <View key={field} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#15803d', marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: '#4b5563', fontWeight: '500' }}>
                    {formatLabel(field)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    } catch (error: any) {
      const status = error.response?.status || error.status;
      if (status === 429) {
        handleShowStatus(
          'Penyimpanan Dibatalkan',
          'Kuota perubahan data penting habis.',
          'error',
        );
      } else {
        handleShowStatus(
          'Gagal Menyimpan',
          error.response?.data?.message || 'Terjadi kesalahan.',
          'error',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [formData, handleShowStatus]);

  // Tab definitions
  const tabs = useMemo(
    () => [
      { id: 'Pribadi', label: 'Data Diri', icon: User },
      { id: 'Alamat', label: 'Domisili', icon: MapPin },
      { id: 'Keluarga', label: 'Keluarga', icon: Users },
      { id: 'Lainnya', label: 'Lainnya', icon: BookOpen },
    ],
    [],
  );

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <Reanimated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
          <ProfileSkeleton />
        </Reanimated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Edit Profil</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={[
                styles.syncIndicator,
                { backgroundColor: refreshing ? '#f59e0b' : '#10b981' },
              ]}
            />
            <Text style={styles.syncText}>
              {refreshing
                ? 'Sedang Memperbarui...'
                : `Sinkron: ${formatLastSynced(lastSynced)}`}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        style={{ flex: 1 }}
      >
        <Reanimated.ScrollView
          entering={FadeIn.duration(600)}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
              title="Memperbarui data..."
              titleColor="#64748b"
            />
          }
        >
          {/* Profile Section */}
          <Reanimated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={{
              alignItems: 'center',
              paddingVertical: 24,
              backgroundColor: 'white',
              marginBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f8fafc',
            }}
          >
            <View
              style={{ width: '100%', paddingHorizontal: 24, marginBottom: 24 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{ color: '#1e293b', fontWeight: '700', fontSize: 14 }}
                >
                  Kelengkapan Profil
                </Text>
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 14,
                    color: profileCompletion === 100 ? '#059669' : '#2563eb',
                  }}
                >
                  {profileCompletion}%
                </Text>
              </View>
              <View
                style={{
                  height: 12,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    borderRadius: 6,
                    backgroundColor:
                      profileCompletion < 50
                        ? '#ef4444'
                        : profileCompletion < 80
                          ? '#f59e0b'
                          : profileCompletion < 100
                            ? '#3b82f6'
                            : '#10b981',
                    width: `${profileCompletion}%`,
                  }}
                />
              </View>
              <Text
                style={{
                  color: '#94a3b8',
                  fontSize: 10,
                  marginTop: 8,
                  fontWeight: '500',
                }}
              >
                {profileCompletion === 100
                  ? 'Luar biasa! Profil Anda sudah lengkap.'
                  : 'Lengkapi data yang kosong agar profil Anda sempurna.'}
              </Text>
            </View>

            <View
              style={{
                marginHorizontal: 24,
                padding: 16,
                width: '88%',
                backgroundColor: '#eff6ff',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#dbeafe',
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 24,
              }}
            >
              <Info size={20} color="#2563eb" style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    color: '#1e40af',
                    fontSize: 12,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}
                >
                  Kuota Perubahan Data Penting
                </Text>
                <Text
                  style={{ color: '#2563eb', fontSize: 11, lineHeight: 16 }}
                >
                  Setiap siswa memiliki jatah{' '}
                  <Text style={{ fontWeight: '700' }}>
                    3x perubahan data penting
                  </Text>{' '}
                  (bertanda gembok).
                </Text>
                <View
                  style={{
                    marginTop: 8,
                    backgroundColor: '#dbeafe',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: '#1e40af',
                      fontSize: 10,
                      fontWeight: '700',
                    }}
                  >
                    Terpakai: {monthlyApprovedCount} / 3
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSelectPhoto}
              style={{ position: 'relative' }}
              activeOpacity={0.9}
            >
              <View
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  backgroundColor: '#f1f5f9',
                  borderWidth: 4,
                  borderColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {currentPhotoUrl ? (
                  <Image
                    source={{ uri: currentPhotoUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <User size={40} color="#cbd5e1" />
                )}
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#2563eb',
                  padding: 8,
                  borderRadius: 20,
                  borderWidth: 3,
                  borderColor: 'white',
                }}
              >
                <Camera size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text
              style={{
                color: '#94a3b8',
                fontWeight: '700',
                fontSize: 10,
                marginTop: 12,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Ketuk foto untuk ubah
            </Text>
          </Reanimated.View>

          {/* Guide Section */}
          <Reanimated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{ paddingHorizontal: 24, marginBottom: 24 }}
          >
            <View
              style={{
                padding: 16,
                backgroundColor: 'white',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  color: '#1e293b',
                  fontSize: 12,
                  fontWeight: '700',
                  marginBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f8fafc',
                  paddingBottom: 8,
                }}
              >
                Panduan Mengubah Data
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: '#fef3c7',
                    padding: 4,
                    borderRadius: 6,
                    marginRight: 12,
                    marginTop: 2,
                  }}
                >
                  <Lock size={12} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#374151',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    Butuh Verifikasi (Bertanda Gembok)
                  </Text>
                  <Text
                    style={{
                      color: '#6b7280',
                      fontSize: 10,
                      lineHeight: 14,
                      marginTop: 2,
                    }}
                  >
                    Data tidak langsung berubah. Menunggu persetujuan admin &{' '}
                    <Text style={{ color: '#d97706', fontWeight: '700' }}>
                      mengurangi kuota
                    </Text>
                    .
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View
                  style={{
                    backgroundColor: '#d1fae5',
                    padding: 4,
                    borderRadius: 6,
                    marginRight: 12,
                    marginTop: 2,
                  }}
                >
                  <CheckCircle size={12} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#374151',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    Langsung Berubah
                  </Text>
                  <Text
                    style={{
                      color: '#6b7280',
                      fontSize: 10,
                      lineHeight: 14,
                      marginTop: 2,
                    }}
                  >
                    Data langsung tersimpan otomatis &{' '}
                    <Text style={{ color: '#059669', fontWeight: '700' }}>
                      bebas kuota
                    </Text>
                    .
                  </Text>
                </View>
              </View>
            </View>
          </Reanimated.View>

          {/* Tabs */}
          <Reanimated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={{ paddingHorizontal: 24, marginBottom: 24, height: 48 }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 24,
                      borderWidth: 1,
                      backgroundColor: isActive ? '#1e293b' : 'white',
                      borderColor: isActive ? '#1e293b' : '#e2e8f0',
                    }}
                  >
                    <Icon size={16} color={isActive ? 'white' : '#64748b'} />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: isActive ? 'white' : '#64748b',
                      }}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Reanimated.View>

          {/* Form Content */}
          <Reanimated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={{ paddingHorizontal: 24, paddingBottom: 256 }}
          >
            {activeTab === 'Pribadi' && (
              <FormSection title="Biodata Diri" icon={User}>
                <InputField
                  onAlert={handleShowStatus}
                  label="Nama Lengkap"
                  fieldKey="nama"
                  icon={User}
                  value={formData.nama}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nama')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="NIPD"
                  fieldKey="nipd"
                  icon={Info}
                  keyboardType="numeric"
                  value={formData.nipd}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nipd')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="NISN"
                  fieldKey="nisn"
                  icon={Info}
                  keyboardType="numeric"
                  value={formData.nisn}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nisn')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="NIK"
                  fieldKey="nik"
                  icon={Info}
                  keyboardType="numeric"
                  value={formData.nik}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nik')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Nomor KK"
                  fieldKey="no_kk"
                  icon={FileText}
                  keyboardType="numeric"
                  value={formData.no_kk}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('no_kk')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Tempat Lahir"
                  fieldKey="tempat_lahir"
                  icon={MapPin}
                  value={formData.tempat_lahir}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('tempat_lahir')}
                />
                <DateField
                  onAlert={handleShowStatus}
                  label="Tgl Lahir"
                  fieldKey="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('tanggal_lahir')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Anak Keberapa"
                  fieldKey="anak_keberapa"
                  keyboardType="numeric"
                  icon={Info}
                  value={formData.anak_keberapa}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('anak_keberapa')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Berkebutuhan Khusus"
                  fieldKey="kebutuhan_khusus"
                  icon={Info}
                  value={formData.kebutuhan_khusus}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('kebutuhan_khusus')}
                />

                <View
                  style={{
                    height: 1,
                    backgroundColor: '#f8fafc',
                    marginVertical: 16,
                  }}
                />
                <Text
                  style={{
                    color: '#94a3b8',
                    fontSize: 10,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 16,
                    marginLeft: 4,
                  }}
                >
                  Kontak Akun
                </Text>

                <InputField
                  onAlert={handleShowStatus}
                  label="Email Akun"
                  fieldKey="email_akun"
                  icon={FileText}
                  value={formData.email_akun}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('email_akun')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="No. HP"
                  fieldKey="no_hp_akun"
                  icon={Phone}
                  keyboardType="phone-pad"
                  value={formData.no_hp_akun}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('no_hp_akun')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Telp Rumah"
                  fieldKey="nomor_telepon_rumah"
                  icon={Phone}
                  keyboardType="phone-pad"
                  value={formData.nomor_telepon_rumah}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nomor_telepon_rumah')}
                />

                <View
                  style={{
                    height: 1,
                    backgroundColor: '#f8fafc',
                    marginVertical: 16,
                  }}
                />
                <Text
                  style={{
                    color: '#94a3b8',
                    fontSize: 10,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 16,
                    marginLeft: 4,
                  }}
                >
                  Kontak Siswa
                </Text>

                <InputField
                  onAlert={handleShowStatus}
                  label="WhatsApp Siswa"
                  fieldKey="no_wa"
                  icon={Phone}
                  keyboardType="phone-pad"
                  value={formData.no_wa}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('no_wa')}
                />
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      onAlert={handleShowStatus}
                      label="Tinggi (cm)"
                      fieldKey="tinggi_badan"
                      icon={Info}
                      keyboardType="numeric"
                      value={formData.tinggi_badan}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('tinggi_badan')}
                      compact
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      onAlert={handleShowStatus}
                      label="Berat (kg)"
                      fieldKey="berat_badan"
                      icon={Info}
                      keyboardType="numeric"
                      value={formData.berat_badan}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('berat_badan')}
                      compact
                    />
                  </View>
                </View>
              </FormSection>
            )}

            {activeTab === 'Alamat' && (
              <FormSection title="Alamat Domisili" icon={MapPin}>
                <InputField
                  onAlert={handleShowStatus}
                  label="Alamat Jalan"
                  fieldKey="alamat_jalan"
                  icon={MapPin}
                  value={formData.alamat_jalan}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('alamat_jalan')}
                />
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      onAlert={handleShowStatus}
                      label="RT"
                      fieldKey="rt"
                      icon={MapPin}
                      keyboardType="numeric"
                      value={formData.rt}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('rt')}
                      compact
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      onAlert={handleShowStatus}
                      label="RW"
                      fieldKey="rw"
                      icon={MapPin}
                      keyboardType="numeric"
                      value={formData.rw}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('rw')}
                      compact
                    />
                  </View>
                </View>
                <RegionPicker
                  formData={formData}
                  onChange={handleChange}
                  pendingFields={pendingFields}
                  onShowAlert={handleShowStatus}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Kode Pos"
                  fieldKey="kode_pos"
                  icon={MapPin}
                  keyboardType="numeric"
                  value={formData.kode_pos}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('kode_pos')}
                />
              </FormSection>
            )}

            {/* Other tabs... */}
            {activeTab === 'Keluarga' && (
              <FormSection title="Data Keluarga" icon={Users}>
                {/* Data Ayah */}
                <Text
                  style={{
                    color: '#94a3b8',
                    fontSize: 10,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 16,
                    marginLeft: 4,
                  }}
                >
                  Data Ayah
                </Text>
                <InputField
                  onAlert={handleShowStatus}
                  label="NIK Ayah"
                  fieldKey="nik_ayah"
                  icon={Info}
                  keyboardType="numeric"
                  value={formData.nik_ayah}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nik_ayah')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Nama Ayah"
                  fieldKey="nama_ayah"
                  icon={User}
                  value={formData.nama_ayah}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nama_ayah')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Tahun Lahir Ayah"
                  fieldKey="tahun_lahir_ayah"
                  icon={Calendar}
                  keyboardType="numeric"
                  value={extractYear(formData.tahun_lahir_ayah)}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('tahun_lahir_ayah')}
                  maxLength={4}
                />
                <SelectField
                  label="Pendidikan Ayah"
                  fieldKey="pendidikan_ayah_id_str"
                  icon={BookOpen}
                  value={formData.pendidikan_ayah_id_str}
                  options={PENDIDIKAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('pendidikan_ayah_id_str')}
                  onAlert={handleShowStatus}
                />
                <SelectField
                  label="Pekerjaan Ayah"
                  fieldKey="pekerjaan_ayah_id_str"
                  icon={Briefcase}
                  value={formData.pekerjaan_ayah_id_str}
                  options={PEKERJAAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('pekerjaan_ayah_id_str')}
                  onAlert={handleShowStatus}
                />
                <SelectField
                  label="Penghasilan Ayah"
                  fieldKey="penghasilan_ayah_id_str"
                  icon={DollarSign}
                  value={formData.penghasilan_ayah_id_str}
                  options={PENGHASILAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('penghasilan_ayah_id_str')}
                  onAlert={handleShowStatus}
                />

                <View
                  style={{
                    height: 1,
                    backgroundColor: '#f8fafc',
                    marginVertical: 16,
                  }}
                />

                {/* Data Ibu */}
                <Text
                  style={{
                    color: '#94a3b8',
                    fontSize: 10,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 16,
                    marginLeft: 4,
                  }}
                >
                  Data Ibu
                </Text>
                <InputField
                  onAlert={handleShowStatus}
                  label="NIK Ibu"
                  fieldKey="nik_ibu"
                  icon={Info}
                  keyboardType="numeric"
                  value={formData.nik_ibu}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nik_ibu')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Nama Ibu"
                  fieldKey="nama_ibu"
                  icon={User}
                  value={formData.nama_ibu}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nama_ibu')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Tahun Lahir Ibu"
                  fieldKey="tahun_lahir_ibu"
                  icon={Calendar}
                  keyboardType="numeric"
                  value={extractYear(formData.tahun_lahir_ibu)}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('tahun_lahir_ibu')}
                  maxLength={4}
                />
                <SelectField
                  label="Pendidikan Ibu"
                  fieldKey="pendidikan_ibu_id_str"
                  icon={BookOpen}
                  value={formData.pendidikan_ibu_id_str}
                  options={PENDIDIKAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('pendidikan_ibu_id_str')}
                  onAlert={handleShowStatus}
                />
                <SelectField
                  label="Pekerjaan Ibu"
                  fieldKey="pekerjaan_ibu_id_str"
                  icon={Briefcase}
                  value={formData.pekerjaan_ibu_id_str}
                  options={PEKERJAAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('pekerjaan_ibu_id_str')}
                  onAlert={handleShowStatus}
                />
                <SelectField
                  label="Penghasilan Ibu"
                  fieldKey="penghasilan_ibu_id_str"
                  icon={DollarSign}
                  value={formData.penghasilan_ibu_id_str}
                  options={PENGHASILAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('penghasilan_ibu_id_str')}
                  onAlert={handleShowStatus}
                />

                <View
                  style={{
                    height: 1,
                    backgroundColor: '#f8fafc',
                    marginVertical: 16,
                  }}
                />

                {/* Data Wali */}
                <Text
                  style={{
                    color: '#94a3b8',
                    fontSize: 10,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 16,
                    marginLeft: 4,
                  }}
                >
                  Data Wali (Opsional)
                </Text>
                <InputField
                  onAlert={handleShowStatus}
                  label="NIK Wali"
                  fieldKey="nik_wali"
                  icon={Info}
                  keyboardType="numeric"
                  value={formData.nik_wali}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nik_wali')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Nama Wali"
                  fieldKey="nama_wali"
                  icon={User}
                  value={formData.nama_wali}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nama_wali')}
                />
                <InputField
                  onAlert={handleShowStatus}
                  label="Tahun Lahir Wali"
                  fieldKey="tahun_lahir_wali"
                  icon={Calendar}
                  keyboardType="numeric"
                  value={extractYear(formData.tahun_lahir_wali)}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('tahun_lahir_wali')}
                  maxLength={4}
                />
                <SelectField
                  label="Pendidikan Wali"
                  fieldKey="pendidikan_wali_id_str"
                  icon={BookOpen}
                  value={formData.pendidikan_wali_id_str}
                  options={PENDIDIKAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('pendidikan_wali_id_str')}
                  onAlert={handleShowStatus}
                />
                <SelectField
                  label="Pekerjaan Wali"
                  fieldKey="pekerjaan_wali_id_str"
                  icon={Briefcase}
                  value={formData.pekerjaan_wali_id_str}
                  options={PEKERJAAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('pekerjaan_wali_id_str')}
                  onAlert={handleShowStatus}
                />
                <SelectField
                  label="Penghasilan Wali"
                  fieldKey="penghasilan_wali_id_str"
                  icon={DollarSign}
                  value={formData.penghasilan_wali_id_str}
                  options={PENGHASILAN_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('penghasilan_wali_id_str')}
                  onAlert={handleShowStatus}
                />
              </FormSection>
            )}

            {activeTab === 'Lainnya' && (
              <FormSection title="Data Lainnya" icon={BookOpen}>
                <Text
                  style={{
                    color: '#94a3b8',
                    fontSize: 10,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 16,
                    marginLeft: 4,
                  }}
                >
                  Kesejahteraan
                </Text>
                <SegmentedField
                  label="Penerima KIP"
                  fieldKey="penerima_kip"
                  icon={CreditCard}
                  value={formData.penerima_kip}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('penerima_kip')}
                  onAlert={handleShowStatus}
                />
                {formData.penerima_kip === 'Ya' && (
                  <InputField
                    onAlert={handleShowStatus}
                    label="Nomor KIP"
                    fieldKey="no_kip"
                    icon={CreditCard}
                    keyboardType="numeric"
                    value={formData.no_kip}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('no_kip')}
                  />
                )}

                <SegmentedField
                  label="Penerima KPS"
                  fieldKey="penerima_kps"
                  icon={CreditCard}
                  value={formData.penerima_kps}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('penerima_kps')}
                  onAlert={handleShowStatus}
                />
                {formData.penerima_kps === 'Ya' && (
                  <InputField
                    onAlert={handleShowStatus}
                    label="Nomor KPS"
                    fieldKey="no_kps"
                    icon={CreditCard}
                    keyboardType="numeric"
                    value={formData.no_kps}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('no_kps')}
                  />
                )}

                <InputField
                  onAlert={handleShowStatus}
                  label="Nomor KKS"
                  fieldKey="no_kks"
                  icon={CreditCard}
                  keyboardType="numeric"
                  value={formData.no_kks}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('no_kks')}
                />

                <InputField
                  onAlert={handleShowStatus}
                  label="Bank"
                  fieldKey="bank"
                  icon={Landmark}
                  value={formData.bank}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('bank')}
                />

                <InputField
                  onAlert={handleShowStatus}
                  label="Nomor Rekening Bank"
                  fieldKey="nomor_rekening_bank"
                  icon={CreditCard}
                  keyboardType="numeric"
                  value={formData.nomor_rekening_bank}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('nomor_rekening_bank')}
                />

                <InputField
                  onAlert={handleShowStatus}
                  label="Atas Nama Rekening"
                  fieldKey="rekening_atas_nama"
                  icon={User}
                  value={formData.rekening_atas_nama}
                  onChangeText={handleChange}
                  isPending={pendingFields.includes('rekening_atas_nama')}
                />

                <View
                  style={{
                    height: 1,
                    backgroundColor: '#f8fafc',
                    marginVertical: 16,
                  }}
                />

                <Text
                  style={{
                    color: '#94a3b8',
                    fontSize: 10,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 16,
                    marginLeft: 4,
                  }}
                >
                  Minat & Bakat
                </Text>

                <SelectField
                  label="Hobi"
                  fieldKey="hobi"
                  icon={Smile}
                  value={formData.hobi}
                  options={HOBI_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('hobi')}
                  onAlert={handleShowStatus}
                />

                <SelectField
                  label="Cita-Cita"
                  fieldKey="cita_cita"
                  icon={Award}
                  value={formData.cita_cita}
                  options={CITA_OPTIONS}
                  onSelect={handleChange}
                  isPending={pendingFields.includes('cita_cita')}
                  onAlert={handleShowStatus}
                />
              </FormSection>
            )}
          </Reanimated.View>
        </Reanimated.ScrollView>

        {/* Sticky Save Button */}
        {!isKeyboardVisible && (
          <Reanimated.View
            entering={FadeIn.duration(300)}
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              padding: 24,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderTopWidth: 1,
              borderTopColor: '#f8fafc',
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 56,
                borderRadius: 16,
                backgroundColor: loading
                  ? '#cbd5e1'
                  : isDirty
                    ? '#2563eb'
                    : '#1e293b',
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  {isDirty ? (
                    <AlertCircle
                      size={16}
                      color="white"
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <Save size={18} color="white" style={{ marginRight: 8 }} />
                  )}
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: '700',
                      fontSize: 16,
                      letterSpacing: 0.5,
                    }}
                  >
                    {isDirty ? 'SIMPAN PERUBAHAN' : 'DATA SUDAH SESUAI'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {isDirty && (
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 10,
                  color: '#2563eb',
                  fontWeight: '700',
                  marginTop: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                ✨ Ada data baru yang belum disimpan
              </Text>
            )}
          </Reanimated.View>
        )}
      </KeyboardAvoidingView>

      <StatusModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={alertConfig.onClose}
      >
        {alertConfig.children}
      </StatusModal>
    </SafeAreaView>
  );
});

export default EditProfileScreen;
