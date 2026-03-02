import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
  Linking,
  Platform,
  TouchableWithoutFeedback,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  FileText,
  Upload,
  Trash2,
  XCircle,
  Eye,
  Download,
  Image as ImageIcon,
  X,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import { pick, types } from '@react-native-documents/picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api from '../../services/api';
import { MAIN_APP_URL } from '@env';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import Skeleton from '../../components/Skeleton';
import StatusModal from '../../components/StatusModal';
import { logger } from '../../utils/logger';
import { handleApiError, logError } from '../../utils/errorHandler';
import { buildStorageUrl } from '../../utils/validation';
import { BerkasItem } from '../../types';

import { checkAndRequestDownloadPermission, saveToMediaStore } from '../../services/PermissionHelper';

// --- KOMPONEN PREVIEW MODAL ---
const PreviewModal = ({ visible, berkas, onClose, onShowStatus }: any) => {
  if (!visible || !berkas) return null;

  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(
    berkas.file_type?.toLowerCase() || '',
  );

  const fileUrl = useMemo(() => {
    return buildStorageUrl(MAIN_APP_URL, berkas.file_path);
  }, [berkas.file_path]);

  const handleDownload = useCallback(async () => {
    if (!fileUrl) {
      onShowStatus({
        visible: true,
        type: 'error',
        title: 'URL Tidak Valid',
        message: 'File tidak dapat diakses. Coba lagi nanti.',
      });
      return;
    }

    // Permission check
    const hasPermission = await checkAndRequestDownloadPermission();
    if (!hasPermission) {
      onShowStatus({
        visible: true,
        type: 'error',
        title: 'Izin Ditolak',
        message: 'Anda perlu memberikan izin akses penyimpanan.',
      });
      return;
    }

    const extension = berkas.file_type || 'pdf';
    const fileName = `${berkas.judul || 'Dokumen'}.${extension}`;

    try {
      if (Platform.OS === 'android') {
        onShowStatus({
          visible: true,
          type: 'info',
          title: 'Mengunduh...',
          message: 'Mohon tunggu sebentar.',
        });

        // 1. Download file ke cache
        const res = await ReactNativeBlobUtil.config({
          fileCache: true,
          appendExt: extension,
        }).fetch('GET', fileUrl);

        // 2. Simpan ke MediaStore / folder kustom
        const mediaType = isImage ? 'photo' : 'download';
        const savedPath = await saveToMediaStore(res.path(), fileName, mediaType);

        // 3. Hapus cache
        res.flush();

        logger.info('PreviewModal', 'Download successful', { fileName });
        onShowStatus({
          visible: true,
          type: 'success',
          title: 'Download Berhasil',
          message: savedPath,
        });
      } else {
        Linking.openURL(fileUrl);
        onShowStatus({
          visible: true,
          type: 'success',
          title: 'Membuka File',
          message: 'File sedang dibuka di aplikasi pihak ketiga.',
        });
      }
    } catch (error) {
      logError('PreviewModal.handleDownload', error);
      onShowStatus({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan saat download',
      });
    }
  }, [fileUrl, berkas, onShowStatus]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <Text
              className="text-gray-800 font-bold flex-1 mr-2"
              numberOfLines={1}
            >
              {berkas.judul}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View className="p-6 items-center justify-center min-h-[200px]">
            {isImage && fileUrl ? (
              <Image
                source={{ uri: fileUrl }}
                className="w-full h-64 rounded-xl bg-gray-100"
                resizeMode="contain"
              />
            ) : (
              <View className="items-center">
                <View className="bg-red-50 p-6 rounded-full mb-4">
                  <FileText size={48} color="#ef4444" />
                </View>
                <Text className="text-gray-500 text-center text-sm px-4">
                  File ini adalah dokumen{' '}
                  {berkas.file_type?.toUpperCase() || 'digital'}.
                </Text>
              </View>
            )}
          </View>
          <View className="p-4 border-t border-gray-100 gap-3">
            <TouchableOpacity
              onPress={handleDownload}
              className="flex-row items-center justify-center bg-blue-600 py-3.5 rounded-xl shadow-lg shadow-blue-200"
            >
              <Download size={18} color="white" />
              <Text className="text-white font-bold ml-2">Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- MAIN SCREEN ---
const BerkasScreen = ({ navigation, route }: any) => {
  const { user } = route.params || {};
  const [berkasList, setBerkasList] = useState<any[]>(
    user?.siswa?.berkas || [],
  );
  const [judul, setJudul] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBerkas, setSelectedBerkas] = useState<any>(null);

  // State baru untuk Modal Pilihan Upload
  const [showUploadOption, setShowUploadOption] = useState(false);

  const [modalStatus, setModalStatus] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    fetchBerkas();
  }, []);

  const fetchBerkas = useCallback(async () => {
    setLoading(true);
    try {
      logger.info('BerkasScreen', 'Fetching berkas data');
      const response = await api.get('/me');
      setBerkasList(response.data.siswa.berkas || []);
      logger.info('BerkasScreen', 'Berkas fetched successfully', {
        count: response.data.siswa.berkas?.length || 0,
      });
    } catch (error) {
      const appError = handleApiError(error);
      logError('BerkasScreen.fetchBerkas', appError);
      logger.error('BerkasScreen', 'Failed to fetch berkas', appError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeUpload = useCallback(
    async (file: {
      uri: string;
      type: string;
      name: string;
      size?: number;
    }) => {
      // Tutup modal pilihan dulu
      setShowUploadOption(false);

      if (file.size && file.size > 2 * 1024 * 1024) {
        setModalStatus({
          visible: true,
          type: 'error',
          title: 'File Terlalu Besar',
          message: 'Ukuran file maksimal adalah 2 MB.',
        });
        return;
      }

      setUploading(true);
      try {
        logger.info('BerkasScreen', 'Uploading berkas', {
          name: file.name,
          size: file.size,
        });

        const data = new FormData();
        data.append('file', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
        data.append('judul', judul);

        const response = await api.post('/siswa/upload-berkas', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setBerkasList(prev => [...prev, response.data.berkas]);
        setJudul('');
        logger.info('BerkasScreen', 'Upload successful');
        setModalStatus({
          visible: true,
          type: 'success',
          title: 'Berhasil Upload',
          message: 'Dokumen Anda berhasil disimpan.',
        });
      } catch (error) {
        const appError = handleApiError(error);
        logError('BerkasScreen.executeUpload', appError);
        setModalStatus({
          visible: true,
          type: 'error',
          title: 'Gagal Upload',
          message:
            appError.message || 'Terjadi kesalahan saat mengupload file.',
        });
      } finally {
        setUploading(false);
      }
    },
    [judul],
  );

  const handleInitialCheck = useCallback(() => {
    if (!judul.trim()) {
      setModalStatus({
        visible: true,
        type: 'warning',
        title: 'Judul Kosong',
        message: 'Silakan isi nama dokumen terlebih dahulu.',
      });
      return;
    }
    // Jika lolos, buka modal custom
    setShowUploadOption(true);
  }, [judul]);

  // Logic pilih Gambar
  const onSelectImage = useCallback(async () => {
    try {
      logger.info('BerkasScreen', 'Opening image picker');
      const image = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        compressImageQuality: 0.7,
        cropping: true,
      });
      executeUpload({
        uri: image.path,
        type: image.mime,
        name: image.path.split('/').pop() || 'document.jpg',
        size: image.size,
      });
    } catch (err: any) {
      if (err?.code !== 'E_PICKER_CANCELLED') {
        logError('BerkasScreen.onSelectImage', err);
      }
      logger.warn('BerkasScreen', 'Image picker cancelled or error');
    }
  }, [executeUpload]);

  // Logic pilih PDF
  const onSelectPDF = useCallback(async () => {
    try {
      logger.info('BerkasScreen', 'Opening PDF picker');
      const result = await pick({
        type: [types.pdf],
        presentationStyle: 'fullScreen',
      });
      const file = result[0];
      executeUpload({
        uri: file.uri,
        type: file.type || 'application/pdf',
        name: file.name || 'document.pdf',
        size: file.size || 0,
      });
    } catch (err: any) {
      if (err?.message !== 'User cancelled document picker') {
        logError('BerkasScreen.onSelectPDF', err);
      }
      logger.warn('BerkasScreen', 'PDF picker cancelled or error');
    }
  }, [executeUpload]);

  const handleDeleteBerkas = useCallback((id: number) => {
    Alert.alert('Hapus Dokumen?', 'Dokumen akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            logger.info('BerkasScreen', 'Deleting berkas', { id });
            await api.post('/siswa/hapus-berkas', { id });
            setBerkasList(prev => prev.filter(b => b.id !== id));
            logger.info('BerkasScreen', 'Berkas deleted successfully');
            setModalStatus({
              visible: true,
              type: 'success',
              title: 'Terhapus',
              message: 'Dokumen berhasil dihapus.',
            });
          } catch (error) {
            const appError = handleApiError(error);
            logError('BerkasScreen.handleDeleteBerkas', appError);
            setModalStatus({
              visible: true,
              type: 'error',
              title: 'Gagal Hapus',
              message: appError.message || 'Gagal menghapus dokumen.',
            });
          }
        },
      },
    ]);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        className="flex-row items-center justify-between px-6 py-4 pt-4 shadow-lg mb-2"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center border border-white/30 backdrop-blur-md"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-tight">
          Dokumen Saya
        </Text>
        <View className="w-10" />
      </LinearGradient>

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* Form Upload */}
        <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <Text className="text-gray-800 font-bold text-base mb-4">
            Upload Dokumen Baru
          </Text>

          <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">
            Nama Dokumen
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 mb-4 font-medium"
            placeholder="Contoh: Ijazah, Akta, KK..."
            placeholderTextColor="#94a3b8"
            value={judul}
            onChangeText={setJudul}
          />

          <TouchableOpacity
            onPress={handleInitialCheck}
            disabled={uploading}
            className={`flex-row items-center justify-center p-4 rounded-xl border-2 border-dashed ${uploading
              ? 'bg-gray-100 border-gray-300'
              : 'bg-blue-50 border-blue-200'
              }`}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <>
                <Upload size={20} color="#2563eb" />
                <Text className="text-blue-700 font-bold ml-2">
                  Pilih File & Upload
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text className="text-gray-400 text-[10px] text-center mt-3">
            Maksimal 2MB (PDF/JPG/PNG)
          </Text>
        </View>

        <Text className="text-gray-800 font-bold text-lg mb-4">
          Berkas Tersimpan
        </Text>

        {loading ? (
          <View className="gap-3">
            {[1, 2, 3].map(i => (
              <View
                key={i}
                className="flex-row items-center justify-between bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <Skeleton
                    width={44}
                    height={44}
                    borderRadius={12}
                    style={{ marginRight: 12 }}
                  />
                  <View>
                    <Skeleton
                      width={120}
                      height={14}
                      style={{ marginBottom: 6 }}
                    />
                    <Skeleton width={80} height={10} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : berkasList.length > 0 ? (
          berkasList.map((berkas, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedBerkas(berkas)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View
                  className={`p-3 rounded-xl mr-3 ${berkas.file_type === 'pdf' ? 'bg-red-50' : 'bg-blue-50'
                    }`}
                >
                  {berkas.file_type === 'pdf' ? (
                    <FileText size={20} color="#ef4444" />
                  ) : (
                    <ImageIcon size={20} color="#2563eb" />
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className="text-gray-800 font-bold text-sm mb-0.5"
                    numberOfLines={1}
                  >
                    {berkas.judul}
                  </Text>
                  <Text className="text-gray-400 text-[10px] uppercase">
                    {berkas.file_type || 'File'} •{' '}
                    {berkas.created_at
                      ? new Date(berkas.created_at).toLocaleDateString('id-ID')
                      : '-'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="p-2 bg-slate-50 rounded-lg">
                  <Eye size={18} color="#64748b" />
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteBerkas(berkas.id)}
                  className="p-2 bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center py-10 opacity-80">
            <LottieView
              source={require('../../assets/animations/No-Data.json')}
              autoPlay
              loop
              style={{ width: 200, height: 200 }}
            />
            <Text className="text-slate-500 font-bold text-lg -mt-4">
              Belum Ada Dokumen
            </Text>
            <Text className="text-slate-400 text-sm">
              Upload berkas penting Anda di sini.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* --- MODAL PILIH FILE TYPE (Custom Bottom Sheet) --- */}
      <Modal
        visible={showUploadOption}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUploadOption(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowUploadOption(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-t-[32px] p-6 pb-10">
                {/* Handle Bar */}
                <View className="items-center mb-6">
                  <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-4" />
                  <Text className="text-lg font-bold text-slate-800">
                    Pilih Format File
                  </Text>
                  <Text className="text-slate-400 text-xs text-center mt-1">
                    Dokumen "{judul}" akan diupload sebagai:
                  </Text>
                </View>

                <View className="gap-4">
                  {/* Pilihan 1: Foto */}
                  <TouchableOpacity
                    onPress={onSelectImage}
                    className="flex-row items-center bg-blue-50 border border-blue-100 p-4 rounded-2xl active:bg-blue-100"
                  >
                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                      <ImageIcon size={24} color="#2563eb" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-blue-900 font-bold text-base">
                        Foto / Gambar
                      </Text>
                      <Text className="text-blue-600/70 text-xs">
                        Ambil dari galeri (JPG, PNG)
                      </Text>
                    </View>
                    <View className="bg-blue-200 p-1 rounded-full">
                      <ChevronLeft
                        size={16}
                        color="#1e40af"
                        style={{ transform: [{ rotate: '180deg' }] }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Pilihan 2: PDF */}
                  <TouchableOpacity
                    onPress={onSelectPDF}
                    className="flex-row items-center bg-red-50 border border-red-100 p-4 rounded-2xl active:bg-red-100"
                  >
                    <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mr-4">
                      <FileText size={24} color="#dc2626" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-red-900 font-bold text-base">
                        Dokumen PDF
                      </Text>
                      <Text className="text-red-600/70 text-xs">
                        File resmi (PDF)
                      </Text>
                    </View>
                    <View className="bg-red-200 p-1 rounded-full">
                      <ChevronLeft
                        size={16}
                        color="#991b1b"
                        style={{ transform: [{ rotate: '180deg' }] }}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Tombol Batal */}
                <TouchableOpacity
                  onPress={() => setShowUploadOption(false)}
                  className="mt-6 py-3 items-center justify-center"
                >
                  <Text className="text-slate-400 font-bold text-base">
                    Batalkan
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Preview Modal */}
      <PreviewModal
        visible={!!selectedBerkas}
        berkas={selectedBerkas}
        onClose={() => setSelectedBerkas(null)}
        onShowStatus={setModalStatus}
      />

      {/* Status Modal Global */}
      <StatusModal
        visible={modalStatus.visible}
        type={modalStatus.type}
        title={modalStatus.title}
        message={modalStatus.message}
        onClose={() => setModalStatus({ ...modalStatus, visible: false })}
      />
    </SafeAreaView>
  );
};

export default BerkasScreen;
