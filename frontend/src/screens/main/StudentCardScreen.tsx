import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { ChevronLeft, Download } from 'lucide-react-native';
import { MAIN_APP_URL } from '@env';
import StatusModal from '../../components/StatusModal';
import {
  checkAndRequestDownloadPermission,
  getDownloadConfig,
  saveToMediaStore, // Tambahkan import ini
} from '../../services/PermissionHelper';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.58; // Aspect ratio ~56mm / 88mm

const StudentCardScreen = ({ navigation, route }: any) => {
  const { user } = route.params;
  const siswa = user?.siswa;
  const sekolah = siswa?.sekolah;
  const viewShotRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // State untuk melacak loading gambar
  const [imagesLoaded, setImagesLoaded] = useState({
    background: false,
    logo: false,
    photo: false,
  });

  // State untuk mengontrol Modal Notifikasi
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success', // 'success' | 'error' | 'warning'
    onClose: () => { },
  });

  const getFullUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${MAIN_APP_URL}/storage/${path}`;
  };

  const fotoUrl = getFullUrl(siswa?.foto);
  const logoUrl = getFullUrl(sekolah?.logo);
  const bgUrl = getFullUrl(sekolah?.background_kartu_siswa);

  // Cek apakah semua gambar yang ada sudah selesai dimuat
  const isAllImagesLoaded = useMemo(() => {
    const needBg = !!bgUrl;
    const needLogo = !!logoUrl;
    const needPhoto = !!fotoUrl;

    return (
      (!needBg || imagesLoaded.background) &&
      (!needLogo || imagesLoaded.logo) &&
      (!needPhoto || imagesLoaded.photo)
    );
  }, [bgUrl, logoUrl, fotoUrl, imagesLoaded]);

  const handleDownload = async () => {
    // Gunakan Helper untuk cek permission
    const hasPermission = await checkAndRequestDownloadPermission();
    if (!hasPermission) {
      setAlertConfig({
        visible: true,
        title: 'Izin Ditolak',
        message: 'Aplikasi butuh izin penyimpanan untuk menyimpan kartu.',
        type: 'error',
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
      return;
    }

    setLoading(true);
    try {
      const uri = await viewShotRef.current.capture();
      const fileName = `Kartu_Pelajar_${siswa.nisn || 'Siswa'}.png`;

      // Bersihkan prefix file:// jika ada
      let sourcePath = uri;
      if (sourcePath.startsWith('file://')) {
        sourcePath = sourcePath.replace('file://', '');
      }

      // Panggil Helper saveToMediaStore (Ringan & Aman OOM)
      const savedPath = await saveToMediaStore(sourcePath, fileName, 'photo');

      console.log('Saved to:', savedPath);

      setAlertConfig({
        visible: true,
        title: 'Berhasil Disimpan!',
        message: `Kartu pelajar tersimpan di Galeri/Download.`,
        type: 'success',
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });

    } catch (error: any) {
      console.error('Download Error:', error);
      setAlertConfig({
        visible: true,
        title: 'Gagal Menyimpan',
        message: `Error: ${error?.message || 'Gagal menyimpan kartu.'}`,
        type: 'error',
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100"
        >
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-800 tracking-tight">
          Kartu Pelajar
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingVertical: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Container with Shadow */}
        <View
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
            borderRadius: 16,
          }}
        >
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
            <View
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                backgroundColor: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                position: 'relative',
                borderWidth: 1,
                borderColor: '#eee',
              }}
            >
              {/* Background Pattern/Image */}
              {bgUrl ? (
                <Image
                  source={{ uri: bgUrl }}
                  onLoad={() => setImagesLoaded(prev => ({ ...prev, background: true }))}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View className="absolute w-full h-full bg-white opacity-10">
                  <View
                    className="w-full h-full"
                    style={{ backgroundColor: '#ffffff', opacity: 0.5 }}
                  />
                </View>
              )}

              {/* Header Section */}
              <View className="flex-row items-center px-4 py-3 bg-white/95 border-b border-gray-100 z-10 h-16">
                {logoUrl ? (
                  <Image
                    source={{ uri: logoUrl }}
                    onLoad={() => setImagesLoaded(prev => ({ ...prev, logo: true }))}
                    className="w-10 h-10 mr-3"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-10 h-10 bg-gray-200 rounded-full mr-3" />
                )}
                <Text className="flex-1 text-sm font-black text-[#002b5c] uppercase leading-4">
                  KARTU PESERTA DIDIK
                </Text>
              </View>

              {/* Content Section */}
              <View className="flex-1 items-center justify-center p-4 z-10 mt-[-10px]">
                {/* Profile Photo */}
                <View className="mb-4 shadow-sm">
                  <Image
                    source={
                      fotoUrl
                        ? { uri: fotoUrl }
                        : { uri: 'https://via.placeholder.com/150' }
                    }
                    onLoad={() => setImagesLoaded(prev => ({ ...prev, photo: true }))}
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      borderWidth: 6,
                      borderColor: 'white',
                    }}
                    resizeMode="cover"
                  />
                </View>

                {/* Name */}
                <Text className="text-xl font-black text-gray-800 text-center uppercase mb-1 drop-shadow-md bg-white/80 px-2 rounded">
                  {siswa?.nama || 'Nama Siswa'}
                </Text>

                {/* NISN */}
                <Text className="text-sm font-bold text-gray-600 text-center mb-6 bg-white/80 px-2 rounded">
                  NISN: {siswa?.nisn || '-'}
                </Text>

                {/* QR Code */}
                <View className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <QRCode
                    value={siswa?.qr_token || siswa?.nisn || 'NO_DATA'}
                    size={100}
                  />
                </View>
              </View>
            </View>
          </ViewShot>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleDownload}
          disabled={loading || !isAllImagesLoaded}
          className={`mt-10 px-8 py-4 rounded-2xl flex-row items-center shadow-lg active:opacity-80 ${loading || !isAllImagesLoaded ? 'bg-gray-400 shadow-gray-200' : 'bg-blue-600 shadow-blue-300'
            }`}
        >
          {loading ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" className="mr-2" />
              <Text className="text-white font-bold text-lg">Menyimpan...</Text>
            </View>
          ) : !isAllImagesLoaded ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" size="small" className="mr-3" />
              <Text className="text-white font-bold text-lg">Memuat Gambar...</Text>
            </View>
          ) : (
            <>
              <Download size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-3">
                Simpan Kartu
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 text-xs mt-4 text-center px-10">
          Kartu ini adalah dokumen sah yang diterbitkan secara elektronik oleh
          sekolah.
        </Text>
      </ScrollView>

      {/* Render Status Modal di sini */}
      <StatusModal
        visible={alertConfig.visible}
        type={alertConfig.type as any}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={alertConfig.onClose}
      />
    </SafeAreaView>
  );
};

export default StudentCardScreen;
