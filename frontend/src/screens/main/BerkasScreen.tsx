import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, TextInput, Modal, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, Upload, Trash2, ExternalLink, XCircle, Eye, Download, AlertCircle, CheckCircle } from 'lucide-react-native';
import { pick, types, isCancel } from '@react-native-documents/picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api from '../../services/api';
import { MAIN_APP_URL } from '@env';
import Skeleton from '../../components/Skeleton';

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

const FancyAlert = ({ visible, title, message, type, onClose, onConfirm, onSelectOption }: any) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-center items-center p-6">
        <View className="bg-white w-full max-w-sm rounded-[32px] p-6 items-center shadow-2xl">
          
          {/* Icon */}
          <View className={`w-20 h-20 rounded-full items-center justify-center mb-5 ${
            type === 'success' ? 'bg-green-100' : 
            type === 'error' ? 'bg-red-100' : 
            type === 'warning' ? 'bg-amber-100' : 'bg-blue-50'
          }`}>
            {type === 'success' && <CheckCircle size={40} color="#16a34a" />}
            {type === 'error' && <XCircle size={40} color="#dc2626" />}
            {type === 'warning' && <AlertCircle size={40} color="#d97706" />}
            {(type === 'selection' || type === 'confirm') && <FileText size={40} color="#2563eb" />}
          </View>

          <Text className="text-xl font-black text-gray-800 mb-2 text-center">{title}</Text>
          <Text className="text-gray-500 text-center mb-8 leading-5">{message}</Text>

          {/* Action Buttons based on Type */}
          {type === 'selection' ? (
            <View className="w-full gap-3">
              <TouchableOpacity 
                onPress={() => onSelectOption('photo')}
                className="flex-row items-center bg-blue-50 p-4 rounded-2xl border border-blue-100"
              >
                <View className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Image source={{ uri: 'https://img.icons8.com/color/48/camera.png' }} className="w-6 h-6" /> 
                  {/* Fallback icon if remote image fails, though lucide is better */}
                  <View className="absolute inset-0 items-center justify-center"><Eye size={16} color="white"/></View>
                </View>
                <View>
                  <Text className="text-blue-900 font-bold text-base">Foto / Gambar</Text>
                  <Text className="text-blue-400 text-xs">Ambil dari galeri & otomatis kompres</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => onSelectOption('pdf')}
                className="flex-row items-center bg-red-50 p-4 rounded-2xl border border-red-100"
              >
                <View className="bg-red-500 p-2 rounded-lg mr-3">
                  <FileText size={20} color="white" />
                </View>
                <View>
                  <Text className="text-red-900 font-bold text-base">Dokumen PDF</Text>
                  <Text className="text-red-400 text-xs">Pilih file PDF (Maks. 1 MB)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} className="mt-2 py-3">
                <Text className="text-gray-400 font-bold text-center">Batal</Text>
              </TouchableOpacity>
            </View>
          ) : type === 'confirm' ? (
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity onPress={onClose} className="flex-1 py-3.5 bg-gray-100 rounded-2xl">
                <Text className="text-gray-600 font-bold text-center">Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} className="flex-1 py-3.5 bg-red-600 rounded-2xl shadow-lg shadow-red-200">
                <Text className="text-white font-bold text-center">Hapus</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={onClose}
              className={`w-full py-4 rounded-2xl shadow-lg ${
                type === 'success' ? 'bg-green-600 shadow-green-200' : 
                type === 'error' ? 'bg-red-600 shadow-red-200' : 
                'bg-amber-500 shadow-amber-200'
              }`}
            >
              <Text className="text-white text-center font-bold text-lg">
                {type === 'success' ? 'Selesai' : 'Mengerti'}
              </Text>
            </TouchableOpacity>
          )}
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
  
  // Custom Alert State
  const [alert, setAlert] = useState<any>({ visible: false, type: 'success' });

  const showAlert = (type: string, title: string, message: string, onConfirm?: any, onSelectOption?: any) => {
    setAlert({ visible: true, type, title, message, onConfirm, onSelectOption });
  };

  const closeAlert = () => setAlert({ ...alert, visible: false });

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
      showAlert('error', 'File Terlalu Besar', 'Ukuran file maksimal adalah 1 MB. Silakan kecilkan file Anda terlebih dahulu.');
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
      showAlert('success', 'Berhasil Upload', 'Dokumen Anda berhasil disimpan ke dalam sistem.');
    } catch (error) {
      console.error(error);
      showAlert('error', 'Gagal Upload', 'Terjadi kesalahan saat mengupload file. Coba lagi nanti.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!judul.trim()) {
      showAlert('warning', 'Judul Kosong', 'Silakan isi nama dokumen terlebih dahulu sebelum memilih file.');
      return;
    }

    showAlert('selection', 'Pilih Jenis File', 'Format apa yang ingin Anda upload?', null, (option: string) => {
      closeAlert();
      setTimeout(async () => {
        if (option === 'photo') {
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
        } else {
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
      }, 500);
    });
  };

  const handleDeleteBerkas = async (id: number) => {
    showAlert('confirm', 'Hapus Dokumen?', 'Apakah Anda yakin ingin menghapus dokumen ini secara permanen?', async () => {
      closeAlert();
      try {
        await api.post('/siswa/hapus-berkas', { id });
        setBerkasList(prev => prev.filter(b => b.id !== id));
      } catch (error) {
        setTimeout(() => showAlert('error', 'Gagal Hapus', 'Tidak dapat menghapus dokumen ini.'), 500);
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-50">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100"
        >
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-800 tracking-tight">Dokumen Saya</Text>
        <View className="w-10" /> 
      </View>

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
          <View className="items-center py-10">
            <Text className="text-gray-400">Belum ada berkas yang diupload.</Text>
          </View>
        )}

      </ScrollView>

      {/* Preview Modal */}
      <PreviewModal 
        visible={!!selectedBerkas} 
        berkas={selectedBerkas} 
        onClose={() => setSelectedBerkas(null)} 
      />

      {/* Fancy Alert Modal */}
      <FancyAlert 
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
        onSelectOption={alert.onSelectOption}
      />
    </SafeAreaView>
  );
};

export default BerkasScreen;
