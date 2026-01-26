import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, TextInput, Modal, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, Upload, Trash2, ExternalLink, XCircle, Eye, Download, AlertCircle, CheckCircle } from 'lucide-react-native';
import { pick, types, isCancel } from '@react-native-documents/picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api from '../../services/api';
import { MAIN_APP_URL } from '@env';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import Skeleton from '../../components/Skeleton';
import StatusModal from '../../components/StatusModal';

const PreviewModal = ({ visible, berkas, onClose }: any) => {
  if (!visible || !berkas) return null;

  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(berkas.file_type?.toLowerCase() || '');
  const fileUrl = `${MAIN_APP_URL}/storage/${berkas.file_path}`;

  const handleDownload = async () => {
    const { dirs } = ReactNativeBlobUtil.fs;
    const fileName = berkas.judul || 'Dokumen';
    const extension = berkas.file_type || 'pdf'; // Fallback extension
    const path = `${dirs.DownloadDir}/${fileName}.${extension}`;

    if (Platform.OS === 'android') {
      ReactNativeBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: path,
          description: 'Downloading file...',
          mediaScannable: true,
          title: fileName,
        },
      })
        .fetch('GET', fileUrl)
        .then((res) => {
          Alert.alert('Berhasil', `File tersimpan di: ${res.path()}`);
        })
        .catch((err) => {
          console.error(err);
          Alert.alert('Gagal', 'Gagal mendownload file.');
        });
    } else {
      // iOS Fallback (Share/Open)
      Linking.openURL(fileUrl);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <Text className="text-gray-800 font-bold flex-1 mr-2" numberOfLines={1}>
              {berkas.judul}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="p-6 items-center justify-center min-h-[200px]">
            {isImage ? (
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
                  File ini adalah dokumen PDF.
                </Text>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View className="p-4 border-t border-gray-100 gap-3">
            <TouchableOpacity 
              onPress={handleDownload}
              className="flex-row items-center justify-center bg-blue-600 py-3.5 rounded-xl shadow-lg shadow-blue-200"
            >
              <Download size={18} color="white" />
              <Text className="text-white font-bold ml-2">Download</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onClose} className="py-3">
              <Text className="text-gray-400 font-bold text-center">Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const BerkasScreen = ({ navigation, route }: any) => {
  const { user } = route.params || {}; 
  const [berkasList, setBerkasList] = useState<any[]>(user?.siswa?.berkas || []);
  const [judul, setJudul] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBerkas, setSelectedBerkas] = useState<any>(null);
  
  // Status Modal State
  const [modalStatus, setModalStatus] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  // Fetch ulang data agar sinkron
  useEffect(() => {
    fetchBerkas();
  }, []);

  const fetchBerkas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/me');
      setBerkasList(response.data.siswa.berkas || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const executeUpload = async (file: { uri: string, type: string, name: string, size?: number }) => {
    if (file.size && file.size > 1 * 1024 * 1024) {
      setModalStatus({ visible: true, type: 'error', title: 'File Terlalu Besar', message: 'Ukuran file maksimal adalah 1 MB. Silakan kecilkan file Anda.' });
      return;
    }

    setUploading(true);
    try {
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
      setModalStatus({ visible: true, type: 'success', title: 'Berhasil Upload', message: 'Dokumen Anda berhasil disimpan ke dalam sistem.' });
    } catch (error) {
      console.error(error);
      setModalStatus({ visible: true, type: 'error', title: 'Gagal Upload', message: 'Terjadi kesalahan saat mengupload file. Coba lagi nanti.' });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!judul.trim()) {
      setModalStatus({ visible: true, type: 'warning', title: 'Judul Kosong', message: 'Silakan isi nama dokumen terlebih dahulu sebelum memilih file.' });
      return;
    }

    Alert.alert(
      'Pilih Jenis File',
      'Format dokumen apa yang ingin Anda upload?',
      [
        {
          text: 'Foto / Gambar',
          onPress: async () => {
            try {
              const image = await ImageCropPicker.openPicker({
                mediaType: 'photo',
                compressImageQuality: 0.6,
                compressImageMaxWidth: 1500,
                compressImageMaxHeight: 1500,
              });
              executeUpload({
                uri: image.path,
                type: image.mime,
                name: image.path.split('/').pop() || 'document.jpg',
                size: image.size
              });
            } catch (err) { console.log('Picker cancelled'); }
          }
        },
        {
          text: 'Dokumen PDF',
          onPress: async () => {
            try {
              const result = await pick({
                type: [types.pdf],
                presentationStyle: 'fullScreen',
              });
              const file = result[0];
              executeUpload({
                uri: file.uri,
                type: file.type || 'application/pdf',
                name: file.name || 'document.pdf',
                size: file.size || 0
              });
            } catch (err: any) { if (!isCancel(err)) console.error(err); }
          }
        },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  const handleDeleteBerkas = async (id: number) => {
    Alert.alert(
      'Hapus Dokumen?',
      'Apakah Anda yakin ingin menghapus dokumen ini secara permanen?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.post('/siswa/hapus-berkas', { id });
              setBerkasList(prev => prev.filter(b => b.id !== id));
              setModalStatus({ visible: true, type: 'success', title: 'Terhapus', message: 'Dokumen berhasil dihapus.' });
            } catch (error) {
              setModalStatus({ visible: true, type: 'error', title: 'Gagal Hapus', message: 'Tidak dapat menghapus dokumen ini.' });
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient 
        colors={['#3b82f6', '#1d4ed8']} 
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        className="flex-row items-center justify-between px-6 py-4 pt-4 shadow-lg mb-2"
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center border border-white/30 backdrop-blur-md"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-tight">Dokumen Saya</Text>
        <View className="w-10" /> 
      </LinearGradient>

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        
        {/* Form Upload */}
        <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
          {/* ... existing form code ... */}
          <Text className="text-gray-800 font-bold text-base mb-4">Upload Dokumen Baru</Text>
          
          <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">Nama Dokumen</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 mb-4"
            placeholder="Contoh: Ijazah, Akta Kelahiran..."
            placeholderTextColor="#94a3b8"
            value={judul}
            onChangeText={setJudul}
          />

          <TouchableOpacity 
            onPress={handleUpload}
            disabled={uploading}
            className={`flex-row items-center justify-center p-4 rounded-xl border-2 border-dashed ${uploading ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'}`}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <>
                <Upload size={20} color="#2563eb" />
                <Text className="text-blue-700 font-bold ml-2">Pilih File & Upload</Text>
              </>
            )}
          </TouchableOpacity>
          <Text className="text-gray-400 text-[10px] text-center mt-3">Maksimal 1MB (PDF/JPG/PNG)</Text>
        </View>

        <Text className="text-gray-800 font-bold text-lg mb-4">Berkas Tersimpan</Text>

        {loading ? (
           <View className="gap-3">
              {[1,2,3].map(i => (
                 <View key={i} className="flex-row items-center justify-between bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100">
                    <View className="flex-row items-center flex-1 mr-2">
                       <Skeleton width={44} height={44} borderRadius={12} style={{ marginRight: 12 }} />
                       <View>
                          <Skeleton width={120} height={14} style={{ marginBottom: 6 }} />
                          <Skeleton width={80} height={10} />
                       </View>
                    </View>
                    <View className="flex-row gap-2">
                       <Skeleton width={34} height={34} borderRadius={8} />
                       <Skeleton width={34} height={34} borderRadius={8} />
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
                <View className={`p-3 rounded-xl mr-3 ${berkas.file_type === 'pdf' ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <FileText size={20} color={berkas.file_type === 'pdf' ? '#ef4444' : '#2563eb'} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-sm mb-0.5" numberOfLines={1}>{berkas.judul}</Text>
                  <Text className="text-gray-400 text-[10px] uppercase">
                    {berkas.file_type || 'File'} • {berkas.created_at ? new Date(berkas.created_at).toLocaleDateString('id-ID') : '-'}
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center gap-2">
                <View className="p-2 bg-blue-50 rounded-lg">
                  <Eye size={18} color="#2563eb" />
                </View>
                <TouchableOpacity onPress={() => handleDeleteBerkas(berkas.id)} className="p-2 bg-red-50 rounded-lg">
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
            <Text className="text-slate-500 font-bold text-lg -mt-4">Belum Ada Dokumen</Text>
            <Text className="text-slate-400 text-sm">Upload berkas penting Anda di sini.</Text>
          </View>
        )}

      </ScrollView>

      {/* Preview Modal */}
      <PreviewModal 
        visible={!!selectedBerkas} 
        berkas={selectedBerkas} 
        onClose={() => setSelectedBerkas(null)} 
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
