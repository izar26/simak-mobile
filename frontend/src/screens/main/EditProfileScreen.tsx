// Force Refresh Cache
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
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
  Alert, // Tambahkan Alert
  RefreshControl,
  Vibration,
  ToastAndroid,
  Keyboard,
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
} from 'lucide-react-native';
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ImageCropPicker from 'react-native-image-crop-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { MAIN_APP_URL } from '@env';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import StatusModal from '../../components/StatusModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lockedColumns = [
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
];

const disabledColumns = ['nipd', 'nisn', 'kebutuhan_khusus', 'email_akun'];

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

const PROFILE_STRENGTH_FIELDS = [
  'nama', 'nisn', 'nik', 'no_kk', 'tempat_lahir', 'tanggal_lahir', 
  'alamat_jalan', 'rt', 'rw', 'desa_kelurahan', 'kecamatan', 'kabupaten_kota', 'provinsi', 'kode_pos',
  'email_akun', 'no_hp_akun',
  'nama_ayah', 'tahun_lahir_ayah', 'pendidikan_ayah_id_str', 'pekerjaan_ayah_id_str',
  'nama_ibu', 'tahun_lahir_ibu', 'pendidikan_ibu_id_str', 'pekerjaan_ibu_id_str',
  'hobi', 'cita_cita'
];

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
]);
// Helper function to extract year from date string or Date object
const extractYear = (dateValue: any): string => {
  if (!dateValue) return '';

  // If it's a Date object, extract year
  if (dateValue instanceof Date) {
    return dateValue.getFullYear().toString();
  }

  // Convert to string
  const dateString = String(dateValue).trim();

  // Handle formats like YYYY-MM-DD, YYYY/MM/DD, or just YYYY
  const match = dateString.match(/(\d{4})/);
  return match ? match[1] : '';
};

const InputField = ({
  label,
  fieldKey,
  icon: Icon,
  keyboardType = 'default',
  placeholder = '',
  value,
  onChangeText,
  isPending = false,
  onAlert, // Prop baru
  compact = false, // Prop baru untuk UI sempit
}: any) => {
  const isLocked = lockedColumns.includes(fieldKey);
  const isDisabled = disabledColumns.includes(fieldKey);
  const [isCopied, setIsCopied] = useState(false);

  const handlePendingPress = () => {
    if (onAlert) {
      onAlert(
        '⏳ Sedang Dicek Sekolah',
        `Kamu sudah mengajukan perubahan untuk data "${label}". \n\nSaat ini sekolah sedang memeriksa pengajuanmu. Kamu baru bisa mengubahnya lagi setelah ada keputusan (Disetujui/Ditolak) dari sekolah.`,
        'info'
      );
    }
  };

  const handleLockedPress = () => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    if (onAlert) {
      onAlert(
        '🔍 Butuh Verifikasi Sekolah',
        `Khusus data "${label}", kamu tidak bisa mengubahnya secara langsung. \n\nSetiap perubahan harus melalui "Izin/Verifikasi" dari Operator Sekolah terlebih dahulu untuk memastikan data kamu tetap valid dan tidak ada kesalahan input.`,
        'warning'
      );
    }
  };

  const handleDisabledPress = () => {
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
    if (onAlert) {
      onAlert(
        '🚫 Data Terkunci Sistem',
        `Data "${label}" ini sudah terkunci secara permanen di aplikasi. \n\nJika ada kesalahan data ini, silakan hubungi Operator Sekolah secara langsung dengan membawa dokumen pendukung (seperti Akta atau KK).`,
        'error'
      );
    }
  };

  const handleCopy = () => {
    if (!value) return;
    Clipboard.setString(value.toString());
    setIsCopied(true);
    ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${label} berhasil disalin`, ToastAndroid.SHORT);
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePaste = async () => {
    const text = await Clipboard.getString();
    if (text) {
      onChangeText(fieldKey, text);
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Berhasil menempel ke ${label}`, ToastAndroid.SHORT);
      }
    }
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2 px-1">
        <View className="flex-row items-center flex-1">
          <Text className="text-slate-600 text-xs font-bold uppercase tracking-wider">
            {label}
          </Text>
          {isPending && (
            <TouchableOpacity 
              onPress={handlePendingPress}
              className="flex-row items-center bg-yellow-50 px-1.5 py-0.5 rounded-md ml-1.5 border border-yellow-200"
            >
              <Clock size={10} color="#ca8a04" />
              {!compact && (
                <Text className="text-[9px] text-yellow-700 font-bold ml-1 uppercase">
                  Sedang Dicek
                </Text>
              )}
            </TouchableOpacity>
          )}
          {!isPending && isLocked && !isDisabled && (
            <TouchableOpacity 
              onPress={handleLockedPress}
              className="flex-row items-center bg-amber-50 px-1.5 py-0.5 rounded-md ml-1.5 border border-amber-100"
            >
              <Lock size={10} color="#d97706" />
              {!compact && (
                <Text className="text-[9px] text-amber-700 font-bold ml-1 uppercase">
                  Butuh Verif
                </Text>
              )}
            </TouchableOpacity>
          )}
          {isDisabled && (
            <TouchableOpacity 
              onPress={handleDisabledPress}
              className="flex-row items-center bg-slate-100 px-1.5 py-0.5 rounded-md ml-1.5"
            >
              <Lock size={10} color="#94a3b8" />
              {!compact && (
                <Text className="text-[9px] text-slate-500 font-bold ml-1 uppercase">
                  Terkunci
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Copy Paste Buttons OUTSIDE the box */}
        {!compact && (
          <View className="flex-row items-center">
            {value ? (
              <TouchableOpacity 
                onPress={handleCopy}
                className="items-center justify-center rounded-lg w-8 h-8 bg-slate-50 border border-slate-200"
              >
                {isCopied ? (
                  <CheckCircle size={14} color="#059669" />
                ) : (
                  <Copy size={14} color="#64748b" />
                )}
              </TouchableOpacity>
            ) : null}
            {!isDisabled && !isPending && (
              <TouchableOpacity 
                onPress={handlePaste}
                className={`items-center justify-center rounded-lg ml-2 w-8 h-8 bg-blue-50 border border-blue-200`}
              >
                <ClipboardCheck size={14} color="#2563eb" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={1}
        onPress={isPending ? handlePendingPress : undefined}
        className={`flex-row items-center rounded-2xl px-4 border transition-all 
        ${
          isDisabled
            ? 'bg-slate-100 border-slate-200'
            : isPending
            ? 'bg-yellow-50/30 border-yellow-300 shadow-sm shadow-yellow-100'
            : isLocked
            ? 'bg-amber-50/20 border-amber-200'
            : 'bg-white border-slate-200 focus:border-blue-500 shadow-sm'
        }`}
        style={{ height: 56 }}
      >
        <Icon
          size={20}
          color={
            isDisabled
              ? '#cbd5e1'
              : isPending
              ? '#ca8a04'
              : isLocked
              ? '#d97706'
              : '#94a3b8'
          }
        />
        <TextInput
          className={`flex-1 ml-3 font-semibold text-sm h-full ${
            isDisabled
              ? 'text-slate-400'
              : isPending
              ? 'text-yellow-800'
              : 'text-slate-800'
          }`}
          editable={!isDisabled && !isPending}
          pointerEvents={isPending ? 'none' : 'auto'}
          value={value ? value.toString() : ''}
          onChangeText={text => onChangeText(fieldKey, text)}
          placeholder={placeholder || `Masukkan ${label}`}
          placeholderTextColor="#cbd5e1"
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </TouchableOpacity>
    </View>
  );
};

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
        handleStyle={{ paddingTop: 12, paddingBottom: 8 }} // Area drag lebih luas
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <View className="flex-1 px-6 pb-2">
          <Text className="text-xl font-black text-slate-800 mb-6 text-center tracking-tight border-b border-slate-100 pb-4">
            {title}
          </Text>
          {children}
        </View>
      </BottomSheetModal>
    );
  },
);

const SegmentedField = ({
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
  const isLocked = lockedColumns.includes(fieldKey);

  const handlePendingPress = () => {
    if (onAlert) {
      onAlert(
        '⏳ Sedang Dicek Sekolah',
        `Kamu sudah mengajukan perubahan untuk data "${label}". \n\nSaat ini sekolah sedang memeriksa pengajuanmu. Kamu baru bisa mengubahnya lagi setelah ada keputusan (Disetujui/Ditolak) dari sekolah.`,
        'info'
      );
    }
  };

  const handleLockedPress = () => {
    if (onAlert) {
      onAlert(
        '🔍 Butuh Verifikasi Sekolah',
        `Khusus data "${label}", kamu tidak bisa mengubahnya secara langsung. \n\nSetiap perubahan harus melalui "Izin/Verifikasi" dari Operator Sekolah terlebih dahulu untuk memastikan data kamu tetap valid dan tidak ada kesalahan input.`,
        'warning'
      );
    }
  };

  const handlePress = (option: string) => {
    if (isPending) {
      handlePendingPress();
      return;
    }

    if (disabled) return;
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
    onSelect(fieldKey, option);
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-2 px-1">
        <Text className="text-slate-600 text-xs font-bold uppercase tracking-wider">
          {label}
        </Text>
        {isPending && (
          <TouchableOpacity 
            onPress={handlePendingPress}
            className="flex-row items-center bg-yellow-50 px-1.5 py-0.5 rounded-md ml-1.5 border border-yellow-200"
          >
            <Clock size={10} color="#ca8a04" />
            <Text className="text-[9px] text-yellow-700 font-bold ml-1 uppercase">
              Sedang Dicek
            </Text>
          </TouchableOpacity>
        )}
        {!isPending && isLocked && (
          <TouchableOpacity 
            onPress={handleLockedPress}
            className="flex-row items-center bg-amber-50 px-1.5 py-0.5 rounded-md ml-1.5 border border-amber-100"
          >
            <Lock size={10} color="#d97706" />
            <Text className="text-[9px] text-amber-700 font-bold ml-1 uppercase">
              Butuh Verif
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        className={`flex-row items-center rounded-2xl px-3 border transition-all ${
          isPending
            ? 'bg-yellow-50/30 border-yellow-300'
            : disabled
            ? 'bg-slate-100 border-slate-200'
            : isLocked
            ? 'bg-amber-50/20 border-amber-200'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
        style={{ height: 64 }}
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
        
        <View className="flex-1 flex-row ml-3 h-10 bg-slate-100 p-1 rounded-xl">
          {options.map((option: string) => {
            const isActive = value === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => handlePress(option)}
                activeOpacity={0.8}
                className={`flex-1 items-center justify-center rounded-lg ${
                  isActive ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const SelectField = ({
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
  const isLocked = lockedColumns.includes(fieldKey);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePendingPress = () => {
    if (onAlert) {
      onAlert(
        '⏳ Sedang Dicek Sekolah',
        `Kamu sudah mengajukan perubahan untuk data "${label}". \n\nSaat ini sekolah sedang memeriksa pengajuanmu. Kamu baru bisa mengubahnya lagi setelah ada keputusan (Disetujui/Ditolak) dari sekolah.`,
        'info'
      );
    }
  };

  const handleLockedPress = () => {
    if (onAlert) {
      onAlert(
        '🔍 Butuh Verifikasi Sekolah',
        `Khusus data "${label}", kamu tidak bisa mengubahnya secara langsung. \n\nSetiap perubahan harus melalui "Izin/Verifikasi" dari Operator Sekolah terlebih dahulu untuk memastikan data kamu tetap valid dan tidak ada kesalahan input.`,
        'warning'
      );
    }
  };

  const handlePress = () => {
    if (isPending) {
      handlePendingPress();
      return;
    }

    if (disabled) {
      if (onPressDisabled) onPressDisabled();
      return;
    }

    setSearchQuery('');
    bottomSheetRef.current?.present();
  };

  const handleCloseModal = () => bottomSheetRef.current?.dismiss();

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((opt: string) => 
      String(opt).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-2 px-1">
        <Text className="text-slate-600 text-xs font-bold uppercase tracking-wider">
          {label}
        </Text>
        {isPending && (
          <TouchableOpacity 
            onPress={handlePendingPress}
            className="flex-row items-center bg-yellow-50 px-1.5 py-0.5 rounded-md ml-1.5 border border-yellow-200"
          >
            <Clock size={10} color="#ca8a04" />
            <Text className="text-[9px] text-yellow-700 font-bold ml-1 uppercase">
              Sedang Dicek
            </Text>
          </TouchableOpacity>
        )}
        {!isPending && isLocked && (
          <TouchableOpacity 
            onPress={handleLockedPress}
            className="flex-row items-center bg-amber-50 px-1.5 py-0.5 rounded-md ml-1.5 border border-amber-100"
          >
            <Lock size={10} color="#d97706" />
            <Text className="text-[9px] text-amber-700 font-bold ml-1 uppercase">
              Butuh Verif
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={disabled ? 1 : 0.7}
        className={`flex-row items-center rounded-2xl px-4 border transition-all 
        ${
          isPending
            ? 'bg-yellow-50/30 border-yellow-300'
            : disabled
            ? 'bg-slate-100 border-slate-200'
            : isLocked
            ? 'bg-amber-50/20 border-amber-200'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
        style={{ height: 56 }}
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
          className={`flex-1 ml-3 text-sm ${
            isPending
              ? 'text-yellow-800 font-semibold'
              : disabled
              ? 'text-slate-400'
              : value
              ? 'text-slate-800 font-semibold'
              : 'text-slate-400'
          }`}
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
        <View className="mb-4">
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-12">
                <Search size={20} color="#94a3b8" />
                <TextInput 
                    className="flex-1 ml-3 text-slate-800 font-semibold"
                    placeholder="Cari pilihan..."
                    placeholderTextColor="#cbd5e1"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => bottomSheetRef.current?.expand()}
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
              onPress={() => {
                ReactNativeHapticFeedback.trigger('selection', hapticOptions);
                onSelect(fieldKey, option);
                handleCloseModal();
              }}
              className={`px-6 flex-row justify-between items-center border-b border-slate-100 ${
                value === option ? 'bg-blue-50' : 'bg-white'
              }`}
              style={{ height: 56 }}
            >
              <Text
                className={`text-base ${
                  value === option
                    ? 'text-blue-700 font-bold'
                    : 'text-slate-700 font-medium'
                }`}
                numberOfLines={1}
              >
                {option}
              </Text>
              {value === option && <CheckCircle size={20} color="#2563eb" />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="py-10 items-center justify-center">
              <Info size={40} color="#cbd5e1" />
              <Text className="text-slate-400 mt-4 text-center font-medium">
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
};

const DateField = ({
  label,
  fieldKey,
  value,
  onChangeText,
  isPending = false,
  onAlert,
}: any) => {
  const [show, setShow] = useState(false);
  const isLocked = lockedColumns.includes(fieldKey);

  const dateValue = value ? new Date(value) : new Date();

  const handlePendingPress = () => {
    if (onAlert) {
      onAlert(
        '⏳ Sedang Dicek Sekolah',
        `Kamu sudah mengajukan perubahan untuk data "${label}". \n\nSaat ini sekolah sedang memeriksa pengajuanmu. Kamu baru bisa mengubahnya lagi setelah ada keputusan (Disetujui/Ditolak) dari sekolah.`,
        'info'
      );
    }
  };

  const handleLockedPress = () => {
    if (onAlert) {
      onAlert(
        '🔍 Butuh Verifikasi Sekolah',
        `Khusus data "${label}", kamu tidak bisa mengubahnya secara langsung. \n\nSetiap perubahan harus melalui "Izin/Verifikasi" dari Operator Sekolah terlebih dahulu untuk memastikan data kamu tetap valid dan tidak ada kesalahan input.`,
        'warning'
      );
    }
  };

  const handlePress = () => {
    if (isPending) {
      handlePendingPress();
      return;
    }
    setShow(true);
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChangeText(fieldKey, `${year}-${month}-${day}`);
    }
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-2 px-1">
        <Text className="text-slate-600 text-xs font-bold uppercase tracking-wider">
          {label}
        </Text>
        {isPending && (
          <TouchableOpacity 
            onPress={handlePendingPress}
            className="flex-row items-center bg-yellow-50 px-1.5 py-0.5 rounded-md ml-1.5 border border-yellow-200"
          >
            <Clock size={10} color="#ca8a04" />
            <Text className="text-[9px] text-yellow-700 font-bold ml-1 uppercase">
              Sedang Dicek
            </Text>
          </TouchableOpacity>
        )}
        {!isPending && isLocked && (
          <TouchableOpacity 
            onPress={handleLockedPress}
            className="flex-row items-center bg-amber-50 px-1.5 py-0.5 rounded-md ml-1.5 border border-amber-100"
          >
            <Lock size={10} color="#d97706" />
            <Text className="text-[9px] text-amber-700 font-bold ml-1 uppercase">
              Butuh Verif
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        onPress={handlePress}
        className={`flex-row items-center rounded-2xl px-4 border transition-all ${
          isPending
            ? 'bg-yellow-50/30 border-yellow-300 shadow-sm shadow-yellow-100'
            : isLocked
            ? 'bg-amber-50/20 border-amber-200'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
        style={{ height: 56 }}
      >
        <Calendar
          size={20}
          color={isPending ? '#ca8a04' : isLocked ? '#d97706' : '#94a3b8'}
        />
        <Text
          className={`flex-1 ml-3 text-sm ${
            isPending
              ? 'text-yellow-800 font-semibold'
              : value
              ? 'text-slate-800 font-semibold'
              : 'text-slate-400'
          }`}
        >
          {value
            ? new Date(value).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : `Pilih ${label}`}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
    </View>
  );
};

const RegionPicker = ({
  formData,
  onChange,
  pendingFields = [],
  onShowAlert,
}: any) => {
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

  // 1. Load Provinsi (Selalu di awal)
  useEffect(() => {
    fetch(`${BASE_URL}/provinces.json`)
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(console.error);
  }, []);

  // 2. Auto-load Kabupaten jika Provinsi ada (Pre-fill logic)
  useEffect(() => {
    if (provinces.length > 0 && formData.provinsi && regencies.length === 0) {
      const id = provinces.find(p => p.name === formData.provinsi)?.id;
      if (id) {
        fetch(`${BASE_URL}/regencies/${id}.json`)
          .then(res => res.json())
          .then(data => setRegencies(data))
          .catch(console.error);
      }
    }
  }, [provinces, formData.provinsi]);

  // 3. Auto-load Kecamatan jika Kabupaten ada
  useEffect(() => {
    if (
      regencies.length > 0 &&
      formData.kabupaten_kota &&
      districts.length === 0
    ) {
      const id = regencies.find(r => r.name === formData.kabupaten_kota)?.id;
      if (id) {
        fetch(`${BASE_URL}/districts/${id}.json`)
          .then(res => res.json())
          .then(data => setDistricts(data))
          .catch(console.error);
      }
    }
  }, [regencies, formData.kabupaten_kota]);

  // 4. Auto-load Desa jika Kecamatan ada
  useEffect(() => {
    if (districts.length > 0 && formData.kecamatan && villages.length === 0) {
      const id = districts.find(d => d.name === formData.kecamatan)?.id;
      if (id) {
        fetch(`${BASE_URL}/villages/${id}.json`)
          .then(res => res.json())
          .then(data => setVillages(data))
          .catch(console.error);
      }
    }
  }, [districts, formData.kecamatan]);

  const findIdByName = (list: any[], name: string) =>
    list.find(item => item.name === name)?.id;

  const handleSelectProv = async (key: string, name: string) => {
    onChange('provinsi', name);
    onChange('kabupaten_kota', '');
    onChange('kecamatan', '');
    onChange('desa_kelurahan', '');
    const id = findIdByName(provinces, name);
    if (id) {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/regencies/${id}.json`);
      setRegencies(await res.json());
      setLoading(false);
    }
  };

  const handleSelectReg = async (key: string, name: string) => {
    onChange('kabupaten_kota', name);
    onChange('kecamatan', '');
    onChange('desa_kelurahan', '');
    const provId = findIdByName(provinces, formData.provinsi);
    const regId = findIdByName(regencies, name);
    if (regId) {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/districts/${regId}.json`);
      setDistricts(await res.json());
      setLoading(false);
    }
  };

  const handleSelectDist = async (key: string, name: string) => {
    onChange('kecamatan', name);
    onChange('desa_kelurahan', '');
    const distId = findIdByName(districts, name);
    if (distId) {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/villages/${distId}.json`);
      setVillages(await res.json());
      setLoading(false);
    }
  };

  const handleDisabledPress = (field: string) => {
    if (onShowAlert) {
      onShowAlert(
        'Belum Memilih',
        `Silakan pilih ${field} terlebih dahulu.`,
        'warning',
      );
    }
  };

  return (
    <>
      <SelectField
        label="Provinsi"
        fieldKey="provinsi"
        icon={MapPin}
        value={formData.provinsi}
        options={provinces.map(p => p.name)}
        onSelect={handleSelectProv}
        isPending={pendingFields.includes('provinsi')}
        onAlert={onShowAlert}
      />
      <SelectField
        label="Kabupaten / Kota"
        fieldKey="kabupaten_kota"
        icon={MapPin}
        value={formData.kabupaten_kota}
        options={regencies.map(r => r.name)}
        onSelect={handleSelectReg}
        isPending={pendingFields.includes('kabupaten_kota')}
        disabled={!formData.provinsi}
        onPressDisabled={() => handleDisabledPress('Provinsi')}
        onAlert={onShowAlert}
      />
      {!regencies.length && !formData.kabupaten_kota && formData.provinsi && (
        <Text className="text-xs text-blue-500 mb-2 px-2">
          * Sedang memuat kabupaten...
        </Text>
      )}
      <SelectField
        label="Kecamatan"
        fieldKey="kecamatan"
        icon={MapPin}
        value={formData.kecamatan}
        options={districts.map(d => d.name)}
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
        options={villages.map(v => v.name)}
        onSelect={(k: any, v: any) => onChange(k, v)}
        isPending={pendingFields.includes('desa_kelurahan')}
        disabled={!formData.kecamatan}
        onPressDisabled={() => handleDisabledPress('Kecamatan')}
        onAlert={onShowAlert}
      />
    </>
  );
};

const FormSection = ({ title, icon: Icon, children }: any) => (
  <View className="bg-white rounded-[32px] p-6 mb-8 shadow-sm border border-slate-100">
    <View className="flex-row items-center mb-6 pb-4 border-b border-slate-50">
      <View className="bg-blue-50 p-2.5 rounded-xl mr-4">
        <Icon size={22} color="#2563eb" />
      </View>
      <Text className="text-slate-800 font-black text-lg tracking-tight">
        {title}
      </Text>
    </View>
    {children}
  </View>
);

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
  nama_ayah: 'Nama Ayah',
  nama_ibu: 'Nama Ibu',
  // Silakan tambahkan field lain jika perlu, default akan memformat key-nya
};

const formatLabel = (key: string) => {
  if (LABEL_MAP[key]) return LABEL_MAP[key];
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const ProfileSkeleton = () => (
  <View className="flex-1 bg-slate-50">
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Bagian Profil & Progress (Delay 100 area) */}
      <View className="py-6 bg-white mb-4 border-b border-slate-50 items-center">
        {/* Skeleton Completion Bar */}
        <View className="w-full px-6 mb-6">
          <View className="flex-row justify-between mb-2">
            <Skeleton width={120} height={14} />
            <Skeleton width={40} height={14} />
          </View>
          <Skeleton width="100%" height={12} borderRadius={6} />
          <View className="mt-2">
             <Skeleton width={180} height={10} />
          </View>
        </View>
        
        {/* Skeleton Banner Kuota */}
        <View className="mx-6 p-4 w-[88%] bg-slate-50 rounded-2xl border border-slate-100 flex-row items-start mb-6">
           <Skeleton width={20} height={20} borderRadius={10} />
           <View className="ml-3 flex-1">
              <Skeleton width={150} height={12} style={{ marginBottom: 6 }} />
              <Skeleton width="100%" height={10} style={{ marginBottom: 4 }} />
              <Skeleton width="80%" height={10} style={{ marginBottom: 8 }} />
              <Skeleton width={80} height={20} borderRadius={10} />
           </View>
        </View>

        {/* Skeleton Photo */}
        <View className="items-center">
          <Skeleton variant="circle" width={112} height={112} style={{ marginBottom: 12 }} />
          <Skeleton width={100} height={12} />
        </View>
      </View>

      {/* Panduan Area (Delay 200 area) */}
      <View className="px-6 mb-6">
         <View className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Skeleton width={120} height={14} style={{ marginBottom: 12 }} />
            <View className="flex-row mb-3">
               <Skeleton width={24} height={24} borderRadius={6} style={{ marginRight: 12 }} />
               <View className="flex-1">
                  <Skeleton width={140} height={12} style={{ marginBottom: 4 }} />
                  <Skeleton width="90%" height={10} />
               </View>
            </View>
            <View className="flex-row">
               <Skeleton width={24} height={24} borderRadius={6} style={{ marginRight: 12 }} />
               <View className="flex-1">
                  <Skeleton width={140} height={12} style={{ marginBottom: 4 }} />
                  <Skeleton width="90%" height={10} />
               </View>
            </View>
         </View>
      </View>

      {/* Tabs Area (Delay 300 area) */}
      <View className="px-6 mb-6 h-12 flex-row">
        <Skeleton width={120} height={44} borderRadius={22} style={{ marginRight: 8 }} />
        <Skeleton width={120} height={44} borderRadius={22} style={{ marginRight: 8 }} />
        <Skeleton width={120} height={44} borderRadius={22} />
      </View>

      {/* Form Section Area (Delay 400 area) */}
      <View className="px-6">
        <View className="bg-white rounded-[32px] p-6 mb-8 border border-slate-100">
          <View className="flex-row items-center mb-6 pb-4 border-b border-slate-50">
            <Skeleton width={36} height={36} borderRadius={10} style={{ marginRight: 12 }} />
            <Skeleton width={150} height={20} />
          </View>
          {[1, 2, 3].map((i) => (
            <View key={i} className="mb-6">
              <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={56} borderRadius={16} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  </View>
);

  const EditProfileScreen = ({ navigation, route }: any) => {
    const { user } = route.params;
    // State khusus untuk list pengajuan (lebih ringan & aman daripada simpan full user object)
    const [pengajuanList, setPengajuanList] = useState(user?.siswa?.pengajuan_perubahan || []);
    const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
    
    // Fungsi format waktu sinkronisasi yang ramah
    const formatLastSynced = useCallback((date: Date | null) => {
      if (!date) return 'Belum disinkronkan';
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffInMinutes < 1) return 'Baru saja';
      if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
      
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }).replace('.', ':');
    }, []);

    // Gunakan useState agar angkanya bisa update real-time
    const initialDataRef = useRef<any>(null); // Simpan data awal untuk perbandingan
  
    // 1. EKSTRAK DATA PENDING (Agar yang tampil adalah data yang diajukan, bukan data lama)
    const pendingDataOverrides = useMemo(() => {
      let overrides: any = {};
      if (pengajuanList.length > 0) {
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
      }
      return overrides;
    }, [pengajuanList]);
  
    // 2. FORM INIT (Prioritas: Pending > User > Siswa)
    const [formData, setFormData] = useState<any>({
      ...(user?.siswa || {}), // Base data siswa (tetap pakai initial user untuk start)
      ...pendingDataOverrides, // Timpa dengan data yang sedang diverifikasi
  
      // Mapping field khusus
      alamat_jalan:
        pendingDataOverrides.alamat_jalan ??
        user?.alamat ??
        user?.siswa?.alamat_jalan ??
        '',
      email_akun: pendingDataOverrides.email_akun ?? user?.username ?? '',
      nomor_telepon_rumah:
        pendingDataOverrides.nomor_telepon_rumah ??
        user?.siswa?.nomor_telepon_rumah ??
        '',
      no_hp_akun: pendingDataOverrides.no_hp_akun ?? user?.no_hp ?? '',
    });
  
    // 3. pendingFields sekarang cukup ambil keys dari overrides
    const pendingFields = useMemo(
      () => Object.keys(pendingDataOverrides),
      [pendingDataOverrides],
    );
  
    const [refreshing, setRefreshing] = useState(false);
  
    // Fungsi Sinkronisasi Data (Bisa dipanggil otomatis atau manual)
    const fetchLatestProfile = useCallback(async () => {
      try {
        // Force refresh dari server dengan header anti-cache
        const freshData = await api.get('/me', {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });
  
        // API return structure: User Object directly (based on logs)
        const userData = freshData.data;
  
        if (userData && userData.username) {
          // UPDATE STATE LIST PENGAJUAN SAJA
          if (userData.siswa?.pengajuan_perubahan) {
             setPengajuanList(userData.siswa.pengajuan_perubahan);
          }
  
          // Hitung ulang overrides
          let newOverrides: any = {};
          if (userData.siswa?.pengajuan_perubahan) {
            userData.siswa.pengajuan_perubahan.forEach((req: any) => {
              if (req.status === 'pending' && req.data_perubahan) {
                try {
                  const d =
                    typeof req.data_perubahan === 'string'
                      ? JSON.parse(req.data_perubahan)
                      : req.data_perubahan;
                  newOverrides = { ...newOverrides, ...d };
                } catch (e) {}
              }
            });
          }
  
          // Update Form Data (REPLACE TOTAL)
          setFormData({
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
          });
  
          initialDataRef.current = {
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

          setLastSynced(new Date()); // Catat waktu sinkronisasi berhasil
        }
      } catch (error) {
        console.warn('Gagal sinkronisasi data profil terbaru:', error);
      } finally {
        setRefreshing(false); // Stop spinner
      }
    }, []);
  
    const monthlyApprovedCount = useMemo(() => {
      if (!pengajuanList || pengajuanList.length === 0) return 0;
      
      // Hitung TOTAL penggunaan: Semua KECUALI yang ditolak
      return pengajuanList.filter((req: any) => 
        req.status !== 'ditolak'
      ).length;
    }, [pengajuanList]);

  const profileCompletion = useMemo(() => {
    if (!formData) return 0;
    
    // Field dasar yang selalu dihitung
    const requiredFields = [...PROFILE_STRENGTH_FIELDS, 'penerima_kip', 'penerima_kps'];
    
    // Field kondisional: Jika Penerima KIP = Ya, maka No. KIP wajib
    if (formData.penerima_kip === 'Ya') {
      requiredFields.push('no_kip');
    }

    let filled = 0;
    requiredFields.forEach(field => {
      const val = formData[field];
      if (val && String(val).trim() !== '' && val !== '-') {
        filled++;
      }
    });

    return Math.round((filled / requiredFields.length) * 100);
  }, [formData]);

  // Auto-sync saat masuk halaman
  useEffect(() => {
    fetchLatestProfile();
  }, [fetchLatestProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLatestProfile();
  }, [fetchLatestProfile]);

  // Simpan initial data saat pertama kali load (Fallback)
  useEffect(() => {
    if (!initialDataRef.current) {
      initialDataRef.current = { ...formData };
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Deteksi Keyboard
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Cek apakah ada perubahan data (Dirty State)
  const isDirty = useMemo(() => {
    if (!initialDataRef.current || !formData) return false;
    
    // Bandingkan field yang relevan
    const keys = Object.keys(formData);
    for (let key of keys) {
      if (key === 'foto' || key === 'berkas' || key === 'pengajuan_perubahan') continue;
      
      const valOld = String(initialDataRef.current[key] || '').trim();
      const valNew = String(formData[key] || '').trim();
      
      if (valOld !== valNew) return true;
    }
    return false;
  }, [formData]);

  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
    children?: React.ReactNode;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    onClose: () => {},
  });
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('Pribadi');
  const [photoVersion, setPhotoVersion] = useState(0);

  const tabs = [
    { id: 'Pribadi', label: 'Data Diri', icon: User },
    { id: 'Alamat', label: 'Domisili', icon: MapPin },
    { id: 'Keluarga', label: 'Keluarga', icon: Users },
    { id: 'Lainnya', label: 'Lainnya', icon: BookOpen },
  ];

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  const handleChange = (key: string, value: string) =>
    setFormData((prev: any) => ({ ...prev, [key]: value }));

  const uploadPhoto = async (file: any) => {
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
      setAlertConfig({
        visible: true,
        title: 'Foto Berhasil!',
        message: 'Foto profil Anda telah diperbarui.',
        type: 'success',
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: 'Gagal Upload',
        message: error.message,
        type: 'error',
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPhoto = async () => {
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
        setAlertConfig({
          visible: true,
          title: 'Terlalu Besar',
          message: 'Maksimal 2 MB.',
          type: 'error',
          onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        });
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
  };

  const handleSave = async () => {
    setLoading(true);
    // 1. Identifikasi Perubahan (Diffing) - DILUAR try agar bisa diakses di catch/finally
    const changedKeys: string[] = [];
    const initialData = initialDataRef.current || {};

    Object.keys(formData).forEach(key => {
      if (key !== 'foto' && key !== 'berkas') {
        const valOld = String(initialData[key] || '');
        const valNew = String(formData[key] || '');
        if (valOld !== valNew) {
          changedKeys.push(key);
        }
      }
    });

    // Helper: Hitung detail field yang berubah
    const successFields = changedKeys.filter(k => !lockedColumns.includes(k));
    const pendingFieldsList = changedKeys.filter(k => lockedColumns.includes(k));

    if (changedKeys.length === 0) {
      setAlertConfig({
        visible: true,
        title: 'Tidak Ada Perubahan',
        message: 'Anda belum mengubah data apapun.',
        type: 'info',
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'foto' && key !== 'berkas' && formData[key] !== null)
          data.append(key, String(formData[key]));
      });

      const response = await api.post('/siswa/update', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.user) {
        ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
        const storageKey = 'USER_PROFILE_DATA';
        await AsyncStorage.setItem(
          `CACHE_${storageKey}`,
          JSON.stringify(response.data.user),
        );
        await AsyncStorage.setItem(
          `META_${storageKey}`,
          JSON.stringify({
            timestamp: Date.now(),
            etag: null,
          }),
        );
        initialDataRef.current = { ...formData };
        
        // Update list pengajuan agar counter realtime
        if (response.data.user.siswa?.pengajuan_perubahan) {
            setPengajuanList(response.data.user.siswa.pengajuan_perubahan);
        }
      }

      const res = response.data;
      const pendingStatus = res.pending_status; // 'none', 'submitted', 'limit_reached', 'pending_exists'
      const isDirectUpdated = res.direct_updated;

      // --- LOGIC TAMPILAN DINAMIS ---
      
      // 1. Cek apakah ada masalah pada data pending (Gembok)
      const isPendingTrouble = pendingStatus === 'limit_reached' || pendingStatus === 'pending_exists';
      const hasSuccess = successFields.length > 0 && isDirectUpdated;
      const hasPending = pendingFieldsList.length > 0;

      // Tentukan Judul & Tipe Modal
      let modalTitle = 'Perubahan Disimpan ✅';
      let modalType: any = 'success';
      let modalMessage = 'Data profil berhasil diperbarui.';

      if (hasPending && isPendingTrouble && !hasSuccess) {
        // Kasus: Cuma ubah data gembok, dan gagal/antri -> JANGAN BILANG SUKSES
        modalTitle = 'Perubahan Belum Diterapkan';
        modalType = 'warning';
        modalMessage = 'Perubahan data penting Anda belum dapat diproses saat ini.';
      } else if (hasPending && isPendingTrouble && hasSuccess) {
        // Kasus: Campuran (Ada yang sukses, ada yang antri)
        modalTitle = 'Disimpan Sebagian';
        modalType = 'warning';
        modalMessage = 'Data umum tersimpan, namun data penting tertunda.';
      }

      // Render List Item Helper
      const renderList = (keys: string[], icon: any, color: string, title: string, desc: string) => (
        <View className={`p-3 rounded-xl border mb-3 flex-row items-start ${color === 'emerald' ? 'bg-emerald-50 border-emerald-100' : (color === 'red' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100')}`}>
           <View style={{marginTop: 2}}>{icon}</View>
           <View className="ml-3 flex-1">
              <Text className={`text-${color === 'emerald' ? 'emerald' : (color === 'red' ? 'red' : 'amber')}-800 text-xs font-bold mb-1`}>
                {title} ({keys.length})
              </Text>
              <View className="flex-row flex-wrap gap-1 mb-1">
                {keys.map(k => (
                  <View key={k} className="bg-white px-2 py-0.5 rounded border border-slate-100">
                    <Text className="text-[10px] text-slate-600 font-medium">
                      {formatLabel(k)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className={`text-${color === 'emerald' ? 'emerald' : (color === 'red' ? 'red' : 'amber')}-600 text-[10px] leading-3`}>
                {desc}
              </Text>
           </View>
        </View>
      );

      // Konten Modal
      const modalContent = (
        <View className="mt-4">
          {/* 1. LIST SUKSES */}
          {hasSuccess && renderList(
            successFields, 
            <CheckCircle size={18} color="#059669" />, 
            'emerald', 
            'Berhasil Disimpan', 
            'Data ini langsung diperbarui.'
          )}

          {/* 2. LIST PENDING / GAGAL */}
          {hasPending && (
            <>
              {isPendingTrouble ? (
                renderList(
                  pendingFieldsList,
                  pendingStatus === 'limit_reached' ? <XCircle size={18} color="#dc2626" /> : <Clock size={18} color="#d97706" />,
                  pendingStatus === 'limit_reached' ? 'red' : 'amber',
                  pendingStatus === 'limit_reached' ? 'Gagal: Batas Pengajuan Tercapai' : 'Tertunda: Menunggu Antrian',
                  pendingStatus === 'limit_reached' 
                    ? 'Anda sudah melakukan pengajuan 3 kali. Silakan hubungi Operator Sekolah untuk melakukan perubahan data ini.' 
                    : 'Masih ada pengajuan sebelumnya yang belum selesai.'
                )
              ) : (
                // Normal Submitted
                renderList(
                  pendingFieldsList,
                  <AlertCircle size={18} color="#d97706" />,
                  'amber',
                  'Menunggu Persetujuan',
                  'Data ini butuh verifikasi sekolah.'
                )
              )}
            </>
          )}
        </View>
      );

      setAlertConfig({
        visible: true,
        title: modalTitle,
        message: modalMessage,
        type: modalType,
        children: modalContent,
        onClose: () => {
           setAlertConfig(prev => ({ ...prev, visible: false }));
           if (hasSuccess || !isPendingTrouble) navigation.goBack();
        }
      });

    } catch (error: any) {
      // Handle rate limit / pengajuan limit errors
      const status = error.response?.status || error.status;
      const errorData = error.response?.data || error;
      
      const pendingFieldsList = changedKeys.filter(k => lockedColumns.includes(k));

      if (status === 429) {
        // Too Many Requests - Monthly limit reached
        setAlertConfig({
          visible: true,
          title: 'Penyimpanan Dibatalkan',
          message:
            errorData?.detail ||
            'Kuota perubahan data penting habis. Seluruh perubahan dibatalkan.',
          type: 'error',
          children: (
            <View className="bg-red-50 p-4 rounded-2xl border border-red-100 mt-4">
              <Text className="text-red-700 text-sm font-medium">
                ⛔ Tindakan Diperlukan
              </Text>
              <Text className="text-red-600 text-xs mt-2 leading-4">
                Anda mencoba mengubah data berikut saat kuota habis:
              </Text>
              <View className="flex-row flex-wrap gap-1 my-2">
                 {pendingFieldsList.map(k => (
                    <Text key={k} className="text-[10px] bg-white border border-red-100 px-2 py-0.5 rounded text-red-600">
                        {formatLabel(k)}
                    </Text>
                 ))}
              </View>
              <Text className="text-red-800 text-xs font-bold mt-2 leading-4 bg-red-100 p-2 rounded-lg">
                Seluruh perubahan data Anda saat ini DIBATALKAN (termasuk data tanpa gembok).
              </Text>
            </View>
          ),
          onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        });
      } else if (status === 422) {
         // Logic lama untuk 422 jika diperlukan, tapi harusnya masuk flow sukses dengan pendingStatus 'pending_exists'
         // Namun untuk jaga-jaga kalau backend throw error 422
         setAlertConfig({
          visible: true,
          title: 'Ada Pengajuan yang Sedang Diproses',
          message: 'Anda masih memiliki pengajuan yang sedang diverifikasi.',
          type: 'warning',
          onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        });
      } else {
        // Generic error
        setAlertConfig({
          visible: true,
          title: 'Gagal Menyimpan',
          message:
            errorData?.message || 'Terjadi kesalahan jaringan atau server.',
          type: 'error',
          onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const currentPhotoUrl = selectedPhoto
    ? selectedPhoto.uri
    : formData.foto
    ? formData.foto.startsWith('http')
      ? formData.foto
      : `${MAIN_APP_URL}/storage/${formData.foto}?v=${photoVersion}`
    : null;

  const handleShowStatus = useCallback(
    (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      setAlertConfig({
        visible: true,
        title,
        message,
        type,
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
    },
    [],
  );

  return (
    <BottomSheetModalProvider>
      <SafeAreaView className="flex-1 bg-slate-50 relative">
        {/* Header Tetap Statis agar tidak goyang saat transisi */}
        <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-50 z-10">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-100"
          >
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-lg font-black text-slate-800 tracking-tight">
              Edit Profil
            </Text>
            <View className="flex-row items-center">
               <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${refreshing ? 'bg-amber-500' : 'bg-emerald-500'}`} />
               <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                {refreshing ? 'Sedang Memperbarui...' : `Sinkron: ${formatLastSynced(lastSynced)}`}
               </Text>
            </View>
          </View>
          <View className="w-10" />
        </View>

        {!isReady ? (
          <Reanimated.View entering={FadeIn.duration(400)} className="flex-1">
            <ProfileSkeleton />
          </Reanimated.View>
        ) : (
          <>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
              className="flex-1"
            >
              <Reanimated.ScrollView
                entering={FadeIn.duration(600)}
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={onRefresh}
                    colors={['#2563eb']} // Warna biru cerah
                    tintColor="#2563eb"
                    title="Memperbarui data..."
                    titleColor="#64748b"
                  />
                }
              >
                {/* Bagian Profil & Progress */}
                <Reanimated.View entering={FadeInDown.delay(100).duration(500)} className="items-center py-6 bg-white mb-4 border-b border-slate-50">
                  {/* PROFILE STRENGTH METER */}
                  <View className="w-full px-6 mb-6">
                    <View className="flex-row justify-between items-end mb-2">
                        <Text className="text-slate-800 font-bold text-sm">Kelengkapan Profil</Text>
                        <Text className={`font-black text-sm ${profileCompletion === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {profileCompletion}%
                        </Text>
                    </View>
                    <View className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <View 
                            className={`h-full rounded-full ${
                                profileCompletion < 50 ? 'bg-red-500' : 
                                profileCompletion < 80 ? 'bg-amber-500' : 
                                profileCompletion < 100 ? 'bg-blue-500' : 'bg-emerald-500'
                            }`} 
                            style={{ width: `${profileCompletion}%` }} 
                        />
                    </View>
                    <Text className="text-slate-400 text-[10px] mt-2 font-medium">
                        {profileCompletion === 100 
                            ? 'Luar biasa! Profil Anda sudah lengkap.' 
                            : 'Lengkapi data yang kosong agar profil Anda sempurna.'}
                    </Text>
                  </View>

                  {/* BANNER KUOTA */}
                  <View className="mx-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex-row items-start mb-6">
                    <Info size={20} color="#2563eb" style={{ marginTop: 2 }} />
                    <View className="ml-3 flex-1">
                      <Text className="text-blue-800 text-xs font-bold mb-1">
                        Kuota Perubahan Data Penting
                      </Text>
                      <Text className="text-blue-600 text-[11px] leading-4">
                        Setiap siswa memiliki jatah <Text className="font-bold">3x perubahan data penting</Text> (bertanda gembok). Jika kuota habis, hubungi Operator Sekolah.
                      </Text>
                      <View className="mt-2 bg-blue-100 self-start px-3 py-1 rounded-full">
                        <Text className="text-blue-800 text-[10px] font-bold">
                          Terpakai: {monthlyApprovedCount} / 3
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleSelectPhoto}
                    className="relative active:opacity-90"
                  >
                    <View className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-xl shadow-slate-200 items-center justify-center overflow-hidden">
                      {currentPhotoUrl ? (
                        <Image
                          source={{ uri: currentPhotoUrl }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <User size={40} color="#cbd5e1" />
                      )}
                    </View>
                    <View className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-[3px] border-white shadow-md">
                      <Camera size={14} color="white" />
                    </View>
                  </TouchableOpacity>
                  <Text className="text-slate-400 font-bold text-[10px] mt-3 uppercase tracking-widest">
                    Ketuk foto untuk ubah
                  </Text>
                </Reanimated.View>

                {/* PANDUAN ICON */}
                <Reanimated.View entering={FadeInDown.delay(200).duration(500)} className="px-6 mb-6">
                  <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <Text className="text-slate-800 text-xs font-bold mb-3 border-b border-slate-100 pb-2">
                      Panduan Mengubah Data
                    </Text>
                    
                    <View className="flex-row items-start mb-2">
                      <View className="bg-amber-100 p-1 rounded-md mr-3 mt-0.5">
                        <Lock size={12} color="#d97706" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-700 text-xs font-bold">Butuh Verifikasi (Bertanda Gembok)</Text>
                        <Text className="text-slate-500 text-[10px] leading-3 mt-0.5">
                          Data tidak langsung berubah. Menunggu persetujuan admin & <Text className="text-amber-600 font-bold">mengurangi kuota</Text>.
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-start">
                      <View className="bg-emerald-100 p-1 rounded-md mr-3 mt-0.5">
                        <CheckCircle size={12} color="#059669" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-700 text-xs font-bold">Langsung Berubah</Text>
                        <Text className="text-slate-500 text-[10px] leading-3 mt-0.5">
                          Data langsung tersimpan otomatis & <Text className="text-emerald-600 font-bold">bebas kuota</Text>.
                        </Text>
                      </View>
                    </View>
                  </View>
                </Reanimated.View>

                <Reanimated.View entering={FadeInDown.delay(300).duration(500)} className="px-6 mb-6 h-12">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingRight: 24 }}
                  >
                    {tabs.map(tab => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <TouchableOpacity
                          key={tab.id}
                          onPress={() => setActiveTab(tab.id)}
                          className={`flex-row items-center px-5 py-3 rounded-full border shadow-sm ${
                            isActive
                              ? 'bg-slate-800 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <Icon size={16} color={isActive ? 'white' : '#64748b'} />
                          <Text
                            className={`ml-2 text-xs font-bold uppercase tracking-wider ${
                              isActive ? 'text-white' : 'text-slate-500'
                            }`}
                          >
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </Reanimated.View>

                <Reanimated.View entering={FadeInDown.delay(400).duration(600)} className="px-6 pb-64">
                  {activeTab === 'Pribadi' && (
                    <FormSection title="Biodata Diri" icon={User}>
                  <InputField onAlert={handleShowStatus}
                    label="Nama Lengkap"
                    fieldKey="nama"
                    icon={User}
                    value={formData.nama}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('nama')}
                  />
                  <InputField onAlert={handleShowStatus}
                    label="NIPD"
                    fieldKey="nipd"
                    icon={Info}
                    keyboardType="numeric"
                    value={formData.nipd}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('nipd')}
                  />
                  <InputField onAlert={handleShowStatus}
                    label="NISN"
                    fieldKey="nisn"
                    icon={Info}
                    keyboardType="numeric"
                    value={formData.nisn}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('nisn')}
                  />
                  <InputField onAlert={handleShowStatus}
                    label="NIK"
                    fieldKey="nik"
                    icon={Info}
                    keyboardType="numeric"
                    value={formData.nik}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('nik')}
                  />
                  <InputField onAlert={handleShowStatus}
                    label="Nomor KK"
                    fieldKey="no_kk"
                    icon={FileText}
                    keyboardType="numeric"
                    value={formData.no_kk}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('no_kk')}
                  />

                  <InputField onAlert={handleShowStatus}
                    label="Tempat Lahir"
                    fieldKey="tempat_lahir"
                    icon={MapPin}
                    value={formData.tempat_lahir}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('tempat_lahir')}
                  />
                  <DateField onAlert={handleShowStatus}
                    label="Tgl Lahir"
                    fieldKey="tanggal_lahir"
                    value={formData.tanggal_lahir}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('tanggal_lahir')}
                  />
                  <InputField onAlert={handleShowStatus}
                    label="Anak Keberapa"
                    fieldKey="anak_keberapa"
                    value={formData.anak_keberapa}
                    keyboardType="numeric"
                    icon={Info}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('anak_keberapa')}
                  />

                  <InputField onAlert={handleShowStatus}
                    label="Berkebutuhan Khusus"
                    fieldKey="kebutuhan_khusus"
                    icon={Info}
                    value={formData.kebutuhan_khusus}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('kebutuhan_khusus')}
                  />

                  <View className="h-[1px] bg-slate-100 my-4" />
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 ml-1">
                    Kontak Akun
                  </Text>

                  <InputField onAlert={handleShowStatus}
                    label="Email Akun"
                    fieldKey="email_akun"
                    icon={FileText}
                    value={formData.email_akun}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('email_akun')}
                  />
                  <InputField onAlert={handleShowStatus}
                    label="No. HP"
                    fieldKey="no_hp_akun"
                    icon={Phone}
                    keyboardType="phone-pad"
                    value={formData.no_hp_akun}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('no_hp_akun')}
                  />
                  <InputField onAlert={handleShowStatus}
                    label="Telp Rumah"
                    fieldKey="nomor_telepon_rumah"
                    icon={Phone}
                    keyboardType="phone-pad"
                    value={formData.nomor_telepon_rumah}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('nomor_telepon_rumah')}
                  />

                  <View className="h-[1px] bg-slate-100 my-4" />
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 ml-1">
                    Kontak Siswa
                  </Text>

                  <InputField onAlert={handleShowStatus}
                    label="WhatsApp Siswa"
                    fieldKey="no_wa"
                    icon={Phone}
                    keyboardType="phone-pad"
                    value={formData.no_wa}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('no_wa')}
                  />
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <InputField onAlert={handleShowStatus}
                        label="Tinggi (cm)"
                        fieldKey="tinggi_badan"
                        icon={Info}
                        keyboardType="numeric"
                        value={formData.tinggi_badan}
                        onChangeText={handleChange}
                        compact={true}
                      />
                    </View>
                    <View className="flex-1">
                      <InputField onAlert={handleShowStatus}
                        label="Berat (kg)"
                        fieldKey="berat_badan"
                        icon={Info}
                        keyboardType="numeric"
                        value={formData.berat_badan}
                        onChangeText={handleChange}
                        compact={true}
                      />
                    </View>
                  </View>
                </FormSection>
              )}

              {activeTab === 'Alamat' && (
                <FormSection title="Alamat Domisili" icon={MapPin}>
                  <InputField onAlert={handleShowStatus}
                    label="Alamat Jalan"
                    fieldKey="alamat_jalan"
                    icon={MapPin}
                    value={formData.alamat_jalan}
                    onChangeText={handleChange}
                    isPending={pendingFields.includes('alamat_jalan')}
                  />
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <InputField onAlert={handleShowStatus}
                        label="RT"
                        fieldKey="rt"
                        icon={MapPin}
                        keyboardType="numeric"
                        value={formData.rt}
                        onChangeText={handleChange}
                        isPending={pendingFields.includes('rt')}
                        compact={true}
                      />
                    </View>
                    <View className="flex-1">
                      <InputField onAlert={handleShowStatus}
                        label="RW"
                        fieldKey="rw"
                        icon={MapPin}
                        keyboardType="numeric"
                        value={formData.rw}
                        onChangeText={handleChange}
                        isPending={pendingFields.includes('rw')}
                        compact={true}
                      />
                    </View>
                  </View>
                  <RegionPicker
                    formData={formData}
                    onChange={handleChange}
                    pendingFields={pendingFields}
                    onShowAlert={handleShowStatus}
                  />
                  <InputField onAlert={handleShowStatus}
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

              {activeTab === 'Lainnya' && (
                <>
                  <FormSection title="Hobi & Kesejahteraan" icon={Truck}>
                    <InputField onAlert={handleShowStatus}
                      label="Hobi"
                      fieldKey="hobi"
                      icon={Heart}
                      value={formData.hobi}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('hobi')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="Cita-cita"
                      fieldKey="cita_cita"
                      icon={Award}
                      value={formData.cita_cita}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('cita_cita')}
                    />
                    <SelectField
                      label="Jenis Tinggal"
                      fieldKey="jenis_tinggal_id_str"
                      icon={MapPin}
                      value={formData.jenis_tinggal_id_str}
                      options={[
                        'Bersama orang tua',
                        'Wali',
                        'Kost',
                        'Asrama',
                        'Panti Asuhan',
                        'Pesantren',
                        'Lainnya',
                      ]}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes('jenis_tinggal_id_str')}
                    />
                    <SelectField
                      label="Transportasi"
                      fieldKey="alat_transportasi_id_str"
                      icon={Truck}
                      value={formData.alat_transportasi_id_str}
                      options={[
                        'Sepeda motor',
                        'Mobil pribadi',
                        'Jalan Kaki',
                        'Angkutan Umum',
                        'Ojek',
                        'Lainnya',
                      ]}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes(
                        'alat_transportasi_id_str',
                      )}
                    />
                    <View className="flex-row gap-4">
                      <View className="flex-1">
                        <InputField onAlert={handleShowStatus}
                          label="Jarak (km)"
                          fieldKey="jarak_rumah_ke_sekolah_km"
                          icon={MapPin}
                          keyboardType="numeric"
                          value={formData.jarak_rumah_ke_sekolah_km}
                          onChangeText={handleChange}
                          isPending={pendingFields.includes(
                            'jarak_rumah_ke_sekolah_km',
                          )}
                          compact={true}
                        />
                      </View>
                      <View className="flex-1">
                        <InputField onAlert={handleShowStatus}
                          label="Waktu (menit)"
                          fieldKey="waktu_tempuh_menit"
                          icon={Info}
                          keyboardType="numeric"
                          value={formData.waktu_tempuh_menit}
                          onChangeText={handleChange}
                          isPending={pendingFields.includes(
                            'waktu_tempuh_menit',
                          )}
                          compact={true}
                        />
                      </View>
                    </View>
                    <SegmentedField
                      label="Penerima KIP"
                      fieldKey="penerima_kip"
                      icon={Heart}
                      value={formData.penerima_kip}
                      options={['Ya', 'Tidak']}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes('penerima_kip')}
                    />
                    
                    {formData.penerima_kip === 'Ya' && (
                      <Reanimated.View entering={FadeIn.duration(300)}>
                        <InputField onAlert={handleShowStatus}
                          label="No. KIP"
                          fieldKey="no_kip"
                          icon={Info}
                          value={formData.no_kip}
                          onChangeText={handleChange}
                          isPending={pendingFields.includes('no_kip')}
                        />
                      </Reanimated.View>
                    )}

                    <SegmentedField
                      label="Penerima KPS/PKH"
                      fieldKey="penerima_kps"
                      icon={Heart}
                      value={formData.penerima_kps}
                      options={['Ya', 'Tidak']}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes('penerima_kps')}
                    />
                  </FormSection>

                  <FormSection title="Riwayat Pendidikan" icon={BookOpen}>
                    <InputField onAlert={handleShowStatus}
                      label="Sekolah Asal"
                      fieldKey="sekolah_asal"
                      icon={User}
                      value={formData.sekolah_asal}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('sekolah_asal')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="NPSN Sekolah Asal"
                      fieldKey="npsn_sekolah_asal"
                      icon={Info}
                      keyboardType="numeric"
                      value={formData.npsn_sekolah_asal}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('npsn_sekolah_asal')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="No. Ijazah"
                      fieldKey="no_seri_ijazah"
                      icon={FileText}
                      value={formData.no_seri_ijazah}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('no_seri_ijazah')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="No. SKHUN"
                      fieldKey="no_seri_skhun"
                      icon={FileText}
                      value={formData.no_seri_skhun}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('no_seri_skhun')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="No. Peserta UN"
                      fieldKey="no_ujian_nasional"
                      icon={FileText}
                      value={formData.no_ujian_nasional}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('no_ujian_nasional')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="No. Reg Akta Lahir"
                      fieldKey="no_registrasi_akta_lahir"
                      icon={FileText}
                      value={formData.no_registrasi_akta_lahir}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes(
                        'no_registrasi_akta_lahir',
                      )}
                    />
                  </FormSection>
                </>
              )}

              {activeTab === 'Keluarga' && (
                <>
                  <FormSection title="Data Ayah" icon={Users}>
                    <InputField onAlert={handleShowStatus}
                      label="Nama Ayah"
                      fieldKey="nama_ayah"
                      icon={User}
                      value={formData.nama_ayah}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('nama_ayah')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="NIK Ayah"
                      fieldKey="nik_ayah"
                      icon={FileText}
                      keyboardType="numeric"
                      value={formData.nik_ayah}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('nik_ayah')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="Tahun Lahir Ayah"
                      fieldKey="tahun_lahir_ayah"
                      icon={Calendar}
                      keyboardType="numeric"
                      value={extractYear(formData.tahun_lahir_ayah)}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('tahun_lahir_ayah')}
                    />
                    <SelectField
                      label="Pendidikan Ayah"
                      fieldKey="pendidikan_ayah_id_str"
                      icon={BookOpen}
                      value={formData.pendidikan_ayah_id_str}
                      options={PENDIDIKAN_OPTIONS}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes('pendidikan_ayah_id_str')}
                    />
                    <SelectField
                      label="Pekerjaan"
                      fieldKey="pekerjaan_ayah_id_str"
                      icon={Info}
                      value={formData.pekerjaan_ayah_id_str}
                      options={PEKERJAAN_OPTIONS}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes(
                        'pekerjaan_ayah_id_str',
                      )}
                    />
                    <SelectField
                      label="Penghasilan"
                      fieldKey="penghasilan_ayah_id_str"
                      icon={Heart}
                      value={formData.penghasilan_ayah_id_str}
                      options={[
                        'Kurang dari Rp. 500,000',
                        'Rp. 500,000 - Rp. 999,999',
                        'Rp. 1,000,000 - Rp. 1,999,999',
                        'Rp. 2,000,000 - Rp. 4,999,999',
                        'Rp. 5,000,000 - Rp. 20,000,000',
                        'Lebih dari Rp. 20,000,000',
                        'Tidak Berpenghasilan',
                      ]}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes(
                        'penghasilan_ayah_id_str',
                      )}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="WhatsApp Ayah"
                      fieldKey="no_wa_ayah"
                      icon={Phone}
                      keyboardType="phone-pad"
                      value={formData.no_wa_ayah}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('no_wa_ayah')}
                    />
                  </FormSection>

                  <FormSection title="Data Ibu" icon={Users}>
                    <InputField onAlert={handleShowStatus}
                      label="Nama Ibu"
                      fieldKey="nama_ibu"
                      icon={User}
                      value={formData.nama_ibu}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('nama_ibu')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="NIK Ibu"
                      fieldKey="nik_ibu"
                      icon={FileText}
                      keyboardType="numeric"
                      value={formData.nik_ibu}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('nik_ibu')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="Tahun Lahir Ibu"
                      fieldKey="tahun_lahir_ibu"
                      icon={Calendar}
                      keyboardType="numeric"
                      value={extractYear(formData.tahun_lahir_ibu)}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('tahun_lahir_ibu')}
                    />
                    <SelectField
                      label="Pendidikan Ibu"
                      fieldKey="pendidikan_ibu_id_str"
                      icon={BookOpen}
                      value={formData.pendidikan_ibu_id_str}
                      options={PENDIDIKAN_OPTIONS}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes('pendidikan_ibu_id_str')}
                    />
                    <SelectField
                      label="Pekerjaan"
                      fieldKey="pekerjaan_ibu_id_str"
                      icon={Info}
                      value={formData.pekerjaan_ibu_id_str}
                      options={PEKERJAAN_OPTIONS}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes('pekerjaan_ibu_id_str')}
                    />
                    <SelectField
                      label="Penghasilan"
                      fieldKey="penghasilan_ibu_id_str"
                      icon={Heart}
                      value={formData.penghasilan_ibu_id_str}
                      options={[
                        'Kurang dari Rp. 500,000',
                        'Rp. 500,000 - Rp. 999,999',
                        'Rp. 1,000,000 - Rp. 1,999,999',
                        'Rp. 2,000,000 - Rp. 4,999,999',
                        'Rp. 5,000,000 - Rp. 20,000,000',
                        'Lebih dari Rp. 20,000,000',
                        'Tidak Berpenghasilan',
                      ]}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes(
                        'penghasilan_ibu_id_str',
                      )}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="WhatsApp Ibu"
                      fieldKey="no_wa_ibu"
                      icon={Phone}
                      keyboardType="phone-pad"
                      value={formData.no_wa_ibu}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('no_wa_ibu')}
                    />
                  </FormSection>

                  <FormSection title="Data Wali" icon={Users}>
                    <InputField onAlert={handleShowStatus}
                      label="Nama Wali"
                      fieldKey="nama_wali"
                      icon={User}
                      value={formData.nama_wali}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('nama_wali')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="NIK Wali"
                      fieldKey="nik_wali"
                      icon={FileText}
                      keyboardType="numeric"
                      value={formData.nik_wali}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('nik_wali')}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="Tahun Lahir Wali"
                      fieldKey="tahun_lahir_wali"
                      icon={Calendar}
                      keyboardType="numeric"
                      value={extractYear(formData.tahun_lahir_wali)}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('tahun_lahir_wali')}
                    />
                    <SelectField
                      label="Pendidikan Wali"
                      fieldKey="pendidikan_wali_id_str"
                      icon={BookOpen}
                      value={formData.pendidikan_wali_id_str}
                      options={PENDIDIKAN_OPTIONS}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes('pendidikan_wali_id_str')}
                    />
                    <SelectField
                      label="Pekerjaan"
                      fieldKey="pekerjaan_wali_id_str"
                      icon={Info}
                      value={formData.pekerjaan_wali_id_str}
                      options={PEKERJAAN_OPTIONS}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes(
                        'pekerjaan_wali_id_str',
                      )}
                    />
                    <SelectField
                      label="Penghasilan"
                      fieldKey="penghasilan_wali_id_str"
                      icon={Heart}
                      value={formData.penghasilan_wali_id_str}
                      options={[
                        'Kurang dari Rp. 500,000',
                        'Rp. 500,000 - Rp. 999,999',
                        'Rp. 1,000,000 - Rp. 1,999,999',
                        'Rp. 2,000,000 - Rp. 4,999,999',
                        'Rp. 5,000,000 - Rp. 20,000,000',
                        'Lebih dari Rp. 20,000,000',
                        'Tidak Berpenghasilan',
                      ]}
                      onAlert={handleShowStatus}
                      onSelect={handleChange}
                      isPending={pendingFields.includes(
                        'penghasilan_wali_id_str',
                      )}
                    />
                    <InputField onAlert={handleShowStatus}
                      label="WhatsApp Wali"
                      fieldKey="no_wa_wali"
                      icon={Phone}
                      keyboardType="phone-pad"
                      value={formData.no_wa_wali}
                      onChangeText={handleChange}
                      isPending={pendingFields.includes('no_wa_wali')}
                    />
                  </FormSection>
                </>
              )}
            </Reanimated.View>
          </Reanimated.ScrollView>

          {/* Tombol Simpan Cerdas (Sticky & Keyboard Aware) */}
          {!isKeyboardVisible && (
            <Reanimated.View 
              entering={FadeIn.duration(300)}
              className={`absolute bottom-0 w-full p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 ${
                isDirty ? 'shadow-2xl shadow-blue-500/40' : ''
              }`}
            >
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
                className={`flex-row items-center justify-center h-14 rounded-2xl transition-all ${
                  loading 
                    ? 'bg-slate-300' 
                    : isDirty 
                      ? 'bg-blue-600 shadow-lg shadow-blue-300' 
                      : 'bg-slate-800'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    {isDirty ? (
                      <View className="bg-white/20 p-1 rounded-full mr-2">
                        <AlertCircle size={14} color="white" />
                      </View>
                    ) : (
                      <Save size={18} color="white" className="mr-2" />
                    )}
                    <Text className="text-white font-bold text-base tracking-wide">
                      {isDirty ? 'SIMPAN PERUBAHAN' : 'DATA SUDAH SESUAI'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {isDirty && (
                <Reanimated.Text 
                  entering={FadeIn.duration(400)}
                  className="text-center text-[10px] text-blue-600 font-bold mt-2 uppercase tracking-widest"
                >
                  ✨ Ada data baru yang belum disimpan
                </Reanimated.Text>
              )}
            </Reanimated.View>
          )}
        </KeyboardAvoidingView>
      </>
    )}

    <StatusModal
          visible={alertConfig.visible}
          type={alertConfig.type as any}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={alertConfig.onClose}
          children={alertConfig.children}
        />
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
};

export default EditProfileScreen;
