import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal, PanResponder, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Save, Info, Lock, User, MapPin, Heart, Users, AlertCircle, Phone, BookOpen, Truck, FileText, Camera, CheckCircle, XCircle, Award } from 'lucide-react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { MAIN_APP_URL } from '@env';
import api from '../../services/api';

const lockedColumns = [
  'nama', 'nipd', 'nisn', 'nik', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 
  'agama_id_str', 'kewarganegaraan', 'kebutuhan_khusus', 
  'tinggi_badan', 'berat_badan', 
  'nama_ayah', 'nama_ibu', 'nama_wali', 
  'pekerjaan_ayah_id_str', 'pekerjaan_ibu_id_str', 'pekerjaan_wali_id_str',
  'tahun_lahir_ayah', 'tahun_lahir_ibu', 'tahun_lahir_wali',
  'pendidikan_ayah_id_str', 'pendidikan_ibu_id_str', 'pendidikan_wali_id_str',
  'penghasilan_ayah_id_str', 'penghasilan_ibu_id_str', 'penghasilan_wali_id_str',
  'alamat_jalan', 'kebutuhan_khusus'
];

const InputField = ({ label, fieldKey, icon: Icon, keyboardType = 'default', placeholder = '', value, onChangeText }: any) => {
  const isLocked = lockedColumns.includes(fieldKey);
  return (
    <View className="mb-5">
      <View className="flex-row justify-between items-center mb-1.5 px-1">
        <Text className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{label}</Text>
        {isLocked && (
          <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            <Lock size={10} color="#d97706" />
            <Text className="text-[9px] text-amber-600 font-bold ml-1 uppercase">Verifikasi</Text>
          </View>
        )}
      </View>
      <View className={`flex-row items-center bg-white border-2 rounded-2xl px-4 ${isLocked ? 'border-amber-100/50 bg-amber-50/30' : 'border-gray-100 focus:border-blue-500'}`}>
        <Icon size={18} color={isLocked ? '#d97706' : '#94a3b8'} />
        <TextInput
          className="flex-1 py-3.5 ml-3 text-gray-800 font-medium text-sm"
          editable={!isLocked}
          value={value ? value.toString() : ''}
          onChangeText={(text) => onChangeText(fieldKey, text)}
          placeholder={placeholder || `Isi ${label}`}
          placeholderTextColor="#cbd5e1"
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DraggableModal = ({ visible, onClose, title, children }: any) => {
  const [panY] = useState(new Animated.Value(0));
  
  const resetPosition = Animated.timing(panY, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: SCREEN_HEIGHT,
    duration: 250,
    useNativeDriver: true,
  });

  const panResponder = useState(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture drag if moving downwards
        return gestureState.dy > 0;
      },
      onPanResponderMove: Animated.event([null, { dy: panY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1.5) {
          // Close if dragged down significantly
          onClose();
        } else {
          // Reset if not dragged enough
          resetPosition.start();
        }
      },
    })
  )[0];

  React.useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-end">
        {/* Backdrop Tap to Close */}
        <TouchableOpacity 
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} 
          onPress={onClose} 
          activeOpacity={1}
        />
        
        <Animated.View 
          style={{ 
            transform: [{ translateY: panY.interpolate({
              inputRange: [0, SCREEN_HEIGHT],
              outputRange: [0, SCREEN_HEIGHT],
              extrapolate: 'clamp'
            }) }] 
          }}
          className="bg-white rounded-t-[40px] p-6 pb-10 h-[60%]"
        >
          {/* Drag Handle Area */}
          <View 
            {...panResponder.panHandlers} 
            className="w-full items-center pt-2 pb-6 bg-transparent"
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </View>
          
          <Text className="text-xl font-black text-gray-800 mb-6 text-center">{title}</Text>
          
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const SelectField = ({ label, fieldKey, icon: Icon, value, options, onSelect }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const isLocked = lockedColumns.includes(fieldKey);

  return (
    <View className="mb-5">
      <View className="flex-row justify-between items-center mb-1.5 px-1">
        <Text className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{label}</Text>
        {isLocked && (
          <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            <Lock size={10} color="#d97706" />
            <Text className="text-[9px] text-amber-600 font-bold ml-1 uppercase">Verifikasi</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        disabled={isLocked}
        onPress={() => setModalVisible(true)}
        className={`flex-row items-center bg-white border-2 rounded-2xl px-4 py-3.5 ${isLocked ? 'border-amber-100/50 bg-amber-50/30' : 'border-gray-100'}`}
      >
        <Icon size={18} color={isLocked ? '#d97706' : '#94a3b8'} />
        <Text className={`flex-1 ml-3 text-sm ${value ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
          {value || `Pilih ${label}`}
        </Text>
        {!isLocked && <ChevronLeft size={18} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />}
      </TouchableOpacity>

      <DraggableModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        title={`Pilih ${label}`}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {options.map((option: string) => (
            <TouchableOpacity 
              key={option}
              onPress={() => onSelect(fieldKey, option)}
              className={`py-4 px-6 rounded-2xl mb-2 flex-row justify-between items-center ${value === option ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-transparent'}`}
            >
              <Text className={`text-base ${value === option ? 'text-blue-600 font-bold' : 'text-gray-700 font-medium'}`}>{option}</Text>
              {value === option && <CheckCircle size={20} color="#2563eb" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          onPress={() => setModalVisible(false)}
          className="mt-4 py-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200"
        >
          <Text className="text-center text-white font-bold text-lg">Selesai</Text>
        </TouchableOpacity>
      </DraggableModal>
    </View>
  );
};

const FormSection = ({ title, icon: Icon, children }: any) => (
  <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-gray-100">
    <View className="flex-row items-center mb-6">
      <View className="bg-blue-100 p-2.5 rounded-2xl mr-4">
        <Icon size={22} color="#2563eb" />
      </View>
      <Text className="text-gray-800 font-extrabold text-lg">{title}</Text>
    </View>
    {children}
  </View>
);

const CustomAlert = ({ visible, title, message, type = 'success', onClose }: any) => {
  if (!visible) return null;
  
  // Menggunakan Absolute View dengan zIndex tinggi sebagai pengganti Modal
  return (
    <View className="absolute top-0 bottom-0 left-0 right-0 bg-black/60 z-50 justify-center items-center px-6" style={{ elevation: 10 }}>
      <View className="bg-white w-full rounded-[32px] p-6 items-center shadow-2xl">
        <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          {type === 'success' ? (
            <CheckCircle size={32} color="#16a34a" />
          ) : (
            <XCircle size={32} color="#dc2626" />
          )}
        </View>
        <Text className="text-xl font-black text-gray-800 mb-2 text-center">{title}</Text>
        <Text className="text-gray-500 text-center mb-6 leading-5">{message}</Text>
        <TouchableOpacity 
          onPress={onClose}
          className={`w-full py-4 rounded-2xl ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          <Text className="text-white text-center font-bold text-base">
            {type === 'success' ? 'Selesai' : 'Tutup'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getFriendlyErrorMessage = (error: any) => {
  // 1. Cek error validasi spesifik dari backend (Laravel usually returns { errors: { field: [...] } })
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (errors.foto) {
      return "Ukuran foto terlalu besar. Pastikan ukurannya di bawah 2 MB.";
    }
    return "Mohon periksa kembali data yang Anda masukkan.";
  }

  // 2. Cek pesan error umum
  const rawMessage = error.response?.data?.message || error.message || '';
  
  // Translate pesan teknis ke bahasa manusia
  if (rawMessage.toLowerCase().includes('2048')) return "Ukuran foto terlalu besar. Maksimal 2 MB.";
  if (rawMessage.toLowerCase().includes('too large')) return "Ukuran file terlalu besar.";
  if (rawMessage.toLowerCase().includes('network')) return "Koneksi internet bermasalah. Cek sinyal Anda.";
  if (rawMessage.toLowerCase().includes('timeout')) return "Waktu koneksi habis. Coba lagi nanti.";
  if (rawMessage.toLowerCase().includes('unauthenticated')) return "Sesi Anda habis. Silakan login ulang.";
  if (rawMessage.toLowerCase().includes('server')) return "Terjadi kesalahan pada server sekolah.";

  // 3. Fallback
  return "Gagal menyimpan data. Silakan coba lagi nanti.";
};

const EditProfileScreen = ({ navigation, route }: any) => {
  const { user } = route.params;
  const [formData, setFormData] = useState<any>({
    ...(user?.siswa || {}),
    alamat_jalan: user?.siswa?.alamat_jalan || user?.alamat || '',
    email_akun: user?.username || '-',
    no_telepon_rumah: user?.no_telepon || '-',
    no_hp_akun: user?.no_hp || '-',
  });
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  
  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success', // 'success' | 'error'
    onClose: () => {}
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const uploadPhoto = async (file: any) => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('foto', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      console.log('Uploading photo...');
      const response = await api.post('/siswa/update', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Photo upload success:', response.status);

      setAlertConfig({
        visible: true,
        title: 'Foto Berhasil Diubah!',
        message: 'Foto profil Anda telah diperbarui.',
        type: 'success',
        onClose: () => setAlertConfig(prev => ({...prev, visible: false}))
      });

      // Update local state to reflect change (optional, if backend returns new path)
      // setSelectedPhoto(file); // Already set in handleSelectPhoto

    } catch (error: any) {
      console.error('Photo upload failed:', error);
      const friendlyMsg = getFriendlyErrorMessage(error);
      setAlertConfig({
        visible: true,
        title: 'Gagal Upload Foto',
        message: friendlyMsg,
        type: 'error',
        onClose: () => setAlertConfig(prev => ({...prev, visible: false}))
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPhoto = async () => {
    try {
      console.log('Opening ImageCropPicker...');
      
      const image = await ImageCropPicker.openPicker({
        width: 600,
        height: 800,
        cropping: true,
        cropperCircleOverlay: true, 
        mediaType: 'photo',
        compressImageQuality: 0.8, 
      });
      
      console.log('ImageCropPicker result:', image);

      if (image.size && image.size > 2 * 1024 * 1024) {
          setAlertConfig({
            visible: true,
            title: 'Foto Terlalu Besar',
            message: 'Ukuran foto maksimal adalah 2 MB. Silakan pilih foto lain.',
            type: 'error',
            onClose: () => setAlertConfig(prev => ({...prev, visible: false}))
          });
          return;
      }

      const selectedFile = {
        uri: image.path,
        type: image.mime,
        name: image.path.split('/').pop() || 'profile_photo.jpg',
        size: image.size
      };

      setSelectedPhoto(selectedFile);
      
      // Auto-upload immediately
      uploadPhoto(selectedFile);

    } catch (err: any) {
      if (err.message === 'User cancelled image selection') {
        console.log('User cancelled selection');
      } else {
        console.error('Error selecting photo:', err);
        setAlertConfig({
          visible: true,
          title: 'Gagal',
          message: 'Gagal memilih foto. ' + (err.message || ''),
          type: 'error',
          onClose: () => setAlertConfig(prev => ({...prev, visible: false}))
        });
      }
    }
  };

  const handleSave = async () => {
    console.log('--- START SAVING PROFILE ---');
    setLoading(true);
    try {
      const data = new FormData();

      // Append all fields EXCEPT foto (handled separately now)
      Object.keys(formData).forEach(key => {
        if (key !== 'foto' && key !== 'berkas' && formData[key] !== null && formData[key] !== undefined) {
           data.append(key, String(formData[key]));
        }
      });

      console.log('Sending API request...');
      const response = await api.post('/siswa/update', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('API Response success:', response.status);

      let message = 'Perubahan Anda berhasil dikirim.';
      if (response.data.pending_request && Object.keys(response.data.pending_request).length > 0) {
        message += '\n\nData Identitas/Orang Tua akan muncul setelah disetujui operator sekolah.';
      }
      
      console.log('Showing success alert');
      setAlertConfig({
        visible: true,
        title: 'Berhasil Disimpan!',
        message: message,
        type: 'success',
        onClose: () => {
          setAlertConfig(prev => ({...prev, visible: false}));
          navigation.goBack();
        }
      });

    } catch (error: any) {
      console.error('Update failed error:', error);
      const friendlyMsg = getFriendlyErrorMessage(error);
      
      console.log('Showing error alert');
      setAlertConfig({
        visible: true,
        title: 'Gagal Menyimpan',
        message: friendlyMsg,
        type: 'error',
        onClose: () => setAlertConfig(prev => ({...prev, visible: false}))
      });
    } finally {
      setLoading(false);
      console.log('--- END SAVING PROFILE ---');
    }
  };

  const currentPhotoUrl = selectedPhoto 
    ? selectedPhoto.uri 
    : (formData.foto ? `${MAIN_APP_URL}/storage/${formData.foto}` : null);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 relative">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-50">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100"
        >
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-800 tracking-tight">Edit Profil</Text>
        <View className="w-10" /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View className="items-center py-6 bg-white mb-6 border-b border-gray-100">
            <TouchableOpacity onPress={handleSelectPhoto} className="relative active:opacity-80">
                <View className="w-28 h-28 rounded-full bg-gray-100 border-4 border-white shadow-lg items-center justify-center overflow-hidden">
                    {currentPhotoUrl ? (
                        <Image source={{ uri: currentPhotoUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <User size={40} color="#cbd5e1" />
                    )}
                </View>
                <View className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full border-[3px] border-white shadow-sm">
                    <Camera size={16} color="white" />
                </View>
            </TouchableOpacity>
            <Text className="text-blue-600 font-bold text-xs mt-3 uppercase tracking-wider">Ubah Foto Profil</Text>
            <View className="mt-4 px-6 py-2 bg-amber-50 rounded-2xl border border-amber-100 flex-row items-center">
                <Info size={14} color="#d97706" />
                <Text className="text-amber-800 text-[10px] font-bold ml-2">
                    WAJIB: Foto Formal, Background Merah/Biru & Seragam Sekolah
                </Text>
            </View>
          </View>

          <View className="px-6 mb-6">
             <View className="p-4 bg-blue-600 rounded-[24px] shadow-lg shadow-blue-200">
                <View className="flex-row items-start">
                <AlertCircle size={20} color="white" />
                <View className="ml-3 flex-1">
                    <Text className="text-white font-bold text-sm">Informasi Pengajuan</Text>
                    <Text className="text-blue-100 text-[11px] mt-1 leading-4">
                    Data dengan tanda gembok <Lock size={10} color="white" /> membutuhkan verifikasi operator. Data lain langsung terupdate.
                    </Text>
                </View>
                </View>
             </View>
          </View>

          <View className="px-6 pb-24">
            
            <FormSection title="Biodata Diri" icon={User}>
              <InputField label="Nama Lengkap" fieldKey="nama" icon={User} value={formData.nama} onChangeText={handleChange} />
              <InputField label="NIPD" fieldKey="nipd" icon={Info} keyboardType="numeric" value={formData.nipd} onChangeText={handleChange} />
              <InputField label="NIK" fieldKey="nik" icon={Info} keyboardType="numeric" value={formData.nik} onChangeText={handleChange} />
              <InputField label="Nomor KK" fieldKey="no_kk" icon={FileText} keyboardType="numeric" value={formData.no_kk} onChangeText={handleChange} />
              <View className="flex-row gap-4">
                <View className="flex-1"><InputField label="Tempat Lahir" fieldKey="tempat_lahir" icon={MapPin} value={formData.tempat_lahir} onChangeText={handleChange} /></View>
                <View className="flex-1"><InputField label="Tgl Lahir" fieldKey="tanggal_lahir" icon={AlertCircle} placeholder="YYYY-MM-DD" value={formData.tanggal_lahir} onChangeText={handleChange} /></View>
              </View>
              <InputField label="Berkebutuhan Khusus" fieldKey="kebutuhan_khusus" icon={Info} value={formData.kebutuhan_khusus} onChangeText={handleChange} />
              
              {/* Read Only Account Info */}
              <View className="bg-gray-50 p-4 rounded-2xl mb-5 border border-gray-200">
                 <Text className="text-gray-500 text-xs font-bold uppercase mb-3">Info Akun (Read Only)</Text>
                 <View className="mb-2"><Text className="text-xs text-gray-400">Email/Username</Text><Text className="font-bold text-gray-700">{formData.email_akun}</Text></View>
                 <View className="mb-2"><Text className="text-xs text-gray-400">No. Telp Rumah</Text><Text className="font-bold text-gray-700">{formData.no_telepon_rumah}</Text></View>
                 <View><Text className="text-xs text-gray-400">No. HP Akun</Text><Text className="font-bold text-gray-700">{formData.no_hp_akun}</Text></View>
              </View>

              <InputField label="No. WhatsApp Siswa" fieldKey="no_wa" icon={Phone} keyboardType="phone-pad" value={formData.no_wa} onChangeText={handleChange} />
              <View className="flex-row gap-4">
                <View className="flex-1"><InputField label="Tinggi (cm)" fieldKey="tinggi_badan" icon={Info} keyboardType="numeric" value={formData.tinggi_badan} onChangeText={handleChange} /></View>
                <View className="flex-1"><InputField label="Berat (kg)" fieldKey="berat_badan" icon={Info} keyboardType="numeric" value={formData.berat_badan} onChangeText={handleChange} /></View>
              </View>
            </FormSection>

            <FormSection title="Alamat Domisili" icon={MapPin}>
              <InputField label="Alamat Jalan" fieldKey="alamat_jalan" icon={MapPin} value={formData.alamat_jalan} onChangeText={handleChange} />
              <View className="flex-row gap-4">
                <View className="flex-1"><InputField label="RT" fieldKey="rt" icon={MapPin} keyboardType="numeric" value={formData.rt} onChangeText={handleChange} /></View>
                <View className="flex-1"><InputField label="RW" fieldKey="rw" icon={MapPin} keyboardType="numeric" value={formData.rw} onChangeText={handleChange} /></View>
              </View>
              <InputField label="Desa / Kelurahan" fieldKey="desa_kelurahan" icon={MapPin} value={formData.desa_kelurahan} onChangeText={handleChange} />
              <InputField label="Kecamatan" fieldKey="kecamatan" icon={MapPin} value={formData.kecamatan} onChangeText={handleChange} />
              <InputField label="Kabupaten / Kota" fieldKey="kabupaten_kota" icon={MapPin} value={formData.kabupaten_kota} onChangeText={handleChange} />
              <InputField label="Kode Pos" fieldKey="kode_pos" icon={MapPin} keyboardType="numeric" value={formData.kode_pos} onChangeText={handleChange} />
            </FormSection>

            <FormSection title="Kesejahteraan & Transport" icon={Truck}>
              <InputField label="Hobi" fieldKey="hobi" icon={Heart} value={formData.hobi} onChangeText={handleChange} />
              <InputField label="Cita-cita" fieldKey="cita_cita" icon={Award} value={formData.cita_cita} onChangeText={handleChange} />
              
              <SelectField 
                label="Jenis Tinggal" 
                fieldKey="jenis_tinggal_id_str" 
                icon={MapPin} 
                value={formData.jenis_tinggal_id_str} 
                options={['Bersama orang tua', 'Wali', 'Kost', 'Asrama', 'Panti Asuhan', 'Pesantren', 'Lainnya']}
                onSelect={handleChange} 
              />
              <SelectField 
                label="Transportasi" 
                fieldKey="alat_transportasi_id_str" 
                icon={Truck} 
                value={formData.alat_transportasi_id_str} 
                options={['Sepeda motor', 'Mobil pribadi', 'Lainnya']}
                onSelect={handleChange} 
              />
              <InputField label="Jarak Sekolah (km)" fieldKey="jarak_rumah_ke_sekolah_km" icon={MapPin} keyboardType="numeric" value={formData.jarak_rumah_ke_sekolah_km} onChangeText={handleChange} />
              <InputField label="Waktu Tempuh (menit)" fieldKey="waktu_tempuh_menit" icon={Info} keyboardType="numeric" value={formData.waktu_tempuh_menit} onChangeText={handleChange} />
              
              <SelectField 
                label="Penerima KIP" 
                fieldKey="penerima_kip" 
                icon={Heart} 
                value={formData.penerima_kip} 
                options={['Ya', 'Tidak']}
                onSelect={handleChange} 
              />
              <InputField label="No. KIP" fieldKey="no_kip" icon={Info} value={formData.no_kip} onChangeText={handleChange} />
              <InputField label="Nama di KIP" fieldKey="nama_di_kip" icon={User} value={formData.nama_di_kip} onChangeText={handleChange} />
              <InputField label="Layak PIP" fieldKey="layak_pip" icon={CheckCircle} value={formData.layak_pip} onChangeText={handleChange} />
              <SelectField 
                label="Penerima KPS/PKH" 
                fieldKey="penerima_kps" 
                icon={Heart} 
                value={formData.penerima_kps} 
                options={['Ya', 'Tidak']}
                onSelect={handleChange} 
              />
              <InputField label="No. KPS / KKS" fieldKey="no_kps" icon={Info} value={formData.no_kps} placeholder="No KPS / KKS" onChangeText={handleChange} />
            </FormSection>

            <FormSection title="Orang Tua (Ayah)" icon={Users}>
              <InputField label="Nama Ayah" fieldKey="nama_ayah" icon={User} value={formData.nama_ayah} onChangeText={handleChange} />
              <InputField label="Tahun Lahir" fieldKey="tahun_lahir_ayah" icon={Info} keyboardType="numeric" value={formData.tahun_lahir_ayah} onChangeText={handleChange} />
              <InputField label="Pekerjaan" fieldKey="pekerjaan_ayah_id_str" icon={Info} value={formData.pekerjaan_ayah_id_str} onChangeText={handleChange} />
              <InputField label="Penghasilan" fieldKey="penghasilan_ayah_id_str" icon={Heart} value={formData.penghasilan_ayah_id_str} onChangeText={handleChange} />
              <InputField label="No. WA Ayah" fieldKey="no_wa_ayah" icon={Phone} keyboardType="phone-pad" value={formData.no_wa_ayah} onChangeText={handleChange} />
            </FormSection>

            <FormSection title="Orang Tua (Ibu)" icon={Users}>
              <InputField label="Nama Ibu" fieldKey="nama_ibu" icon={User} value={formData.nama_ibu} onChangeText={handleChange} />
              <InputField label="Tahun Lahir" fieldKey="tahun_lahir_ibu" icon={Info} keyboardType="numeric" value={formData.tahun_lahir_ibu} onChangeText={handleChange} />
              <InputField label="Pekerjaan" fieldKey="pekerjaan_ibu_id_str" icon={Info} value={formData.pekerjaan_ibu_id_str} onChangeText={handleChange} />
              <InputField label="Penghasilan" fieldKey="penghasilan_ibu_id_str" icon={Heart} value={formData.penghasilan_ibu_id_str} onChangeText={handleChange} />
              <InputField label="No. WA Ibu" fieldKey="no_wa_ibu" icon={Phone} keyboardType="phone-pad" value={formData.no_wa_ibu} onChangeText={handleChange} />
            </FormSection>

            <FormSection title="Wali (Opsional)" icon={Users}>
              <InputField label="Nama Wali" fieldKey="nama_wali" icon={User} value={formData.nama_wali} onChangeText={handleChange} />
              <InputField label="Tahun Lahir" fieldKey="tahun_lahir_wali" icon={Info} keyboardType="numeric" value={formData.tahun_lahir_wali} onChangeText={handleChange} />
              <InputField label="Pekerjaan" fieldKey="pekerjaan_wali_id_str" icon={Info} value={formData.pekerjaan_wali_id_str} onChangeText={handleChange} />
              <InputField label="Penghasilan" fieldKey="penghasilan_wali_id_str" icon={Heart} value={formData.penghasilan_wali_id_str} onChangeText={handleChange} />
              <InputField label="No. WA Wali" fieldKey="no_wa_wali" icon={Phone} keyboardType="phone-pad" value={formData.no_wa_wali} onChangeText={handleChange} />
            </FormSection>

            <FormSection title="Riwayat Pendidikan" icon={BookOpen}>
              <InputField label="Sekolah Asal" fieldKey="sekolah_asal" icon={User} value={formData.sekolah_asal} onChangeText={handleChange} />
              <InputField label="NPSN Sekolah Asal" fieldKey="npsn_sekolah_asal" icon={Info} keyboardType="numeric" value={formData.npsn_sekolah_asal} onChangeText={handleChange} />
              <InputField label="No. Ijazah" fieldKey="no_seri_ijazah" icon={FileText} value={formData.no_seri_ijazah} onChangeText={handleChange} />
              <InputField label="No. SKHUN" fieldKey="no_seri_skhun" icon={FileText} value={formData.no_seri_skhun} onChangeText={handleChange} />
              <InputField label="No. Peserta UN" fieldKey="no_ujian_nasional" icon={FileText} value={formData.no_ujian_nasional} onChangeText={handleChange} />
              <InputField label="No. Reg Akta Lahir" fieldKey="no_registrasi_akta_lahir" icon={FileText} value={formData.no_registrasi_akta_lahir} onChangeText={handleChange} />
            </FormSection>

          </View>
        </ScrollView>

        <View className="absolute bottom-0 w-full p-6 bg-gray-50/80 backdrop-blur-lg">
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={loading}
            activeOpacity={0.8}
            className={`flex-row items-center justify-center h-16 rounded-[24px] shadow-xl ${loading ? 'bg-blue-400' : 'bg-blue-600 shadow-blue-200'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text className="text-white font-extrabold text-lg ml-3 tracking-wide">SIMPAN PERUBAHAN</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
      
      {/* Custom Alert Component - Absolute Positioned */}
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={alertConfig.onClose}
      />
    </SafeAreaView>
  );
};

export default EditProfileScreen;