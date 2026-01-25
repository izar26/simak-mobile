import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal, PanResponder, Animated, Dimensions, InteractionManager, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Save, Info, Lock, User, MapPin, Heart, Users, AlertCircle, Phone, BookOpen, Truck, FileText, Camera, CheckCircle, XCircle, Award } from 'lucide-react-native';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import ImageCropPicker from 'react-native-image-crop-picker';
import { MAIN_APP_URL } from '@env';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';

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

// Reusable Input Field with Modern Design
const InputField = ({ label, fieldKey, icon: Icon, keyboardType = 'default', placeholder = '', value, onChangeText }: any) => {
  const isLocked = lockedColumns.includes(fieldKey);
  
  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-2 px-1">
        <Text className="text-slate-600 text-xs font-bold uppercase tracking-wider">{label}</Text>
        {isLocked && (
          <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-md ml-2 border border-amber-100">
            <Lock size={10} color="#d97706" />
            <Text className="text-[9px] text-amber-700 font-bold ml-1 uppercase">Verifikasi</Text>
          </View>
        )}
      </View>
      <View 
        className={`flex-row items-center rounded-2xl px-4 border transition-all 
        ${isLocked ? 'bg-amber-50/20 border-amber-200' : 'bg-white border-slate-200 focus:border-blue-500 shadow-sm'}`}
        style={{ height: 56 }}
      >
        <Icon size={20} color={isLocked ? '#d97706' : '#94a3b8'} />
        <TextInput
          className="flex-1 ml-3 text-slate-800 font-semibold text-sm h-full"
          editable={true}
          value={value ? value.toString() : ''}
          onChangeText={(text) => onChangeText(fieldKey, text)}
          placeholder={placeholder || `Masukkan ${label}`}
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
  
  const resetPosition = Animated.timing(panY, { toValue: 0, duration: 250, useNativeDriver: true });
  const panResponder = useState(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1.5) onClose();
        else resetPosition.start();
      },
    })
  )[0];

  React.useEffect(() => { if (visible) panY.setValue(0); }, [visible]);
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableOpacity style={{ position: 'absolute', inset: 0 }} onPress={onClose} activeOpacity={1} />
        <Animated.View 
          style={{ transform: [{ translateY: panY.interpolate({ inputRange: [0, SCREEN_HEIGHT], outputRange: [0, SCREEN_HEIGHT], extrapolate: 'clamp' }) }] }}
          className="bg-white rounded-t-[32px] p-6 pb-10 h-[65%]"
        >
          <View {...panResponder.panHandlers} className="w-full items-center pt-2 pb-6"><View className="w-12 h-1.5 bg-slate-200 rounded-full" /></View>
          <Text className="text-xl font-black text-slate-800 mb-6 text-center tracking-tight">{title}</Text>
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
    <View className="mb-6">
      <View className="flex-row items-center mb-2 px-1">
        <Text className="text-slate-600 text-xs font-bold uppercase tracking-wider">{label}</Text>
        {isLocked && (
          <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-md ml-2 border border-amber-100">
            <Lock size={10} color="#d97706" />
            <Text className="text-[9px] text-amber-700 font-bold ml-1 uppercase">Verifikasi</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        className={`flex-row items-center rounded-2xl px-4 border transition-all 
        ${isLocked ? 'bg-amber-50/20 border-amber-200' : 'bg-white border-slate-200 shadow-sm'}`}
        style={{ height: 56 }}
      >
        <Icon size={20} color={isLocked ? '#d97706' : '#94a3b8'} />
        <Text className={`flex-1 ml-3 text-sm ${value ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
          {value || `Pilih ${label}`}
        </Text>
        <ChevronLeft size={20} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
      </TouchableOpacity>

      <DraggableModal visible={modalVisible} onClose={() => setModalVisible(false)} title={`Pilih ${label}`}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {options.map((option: string) => (
            <TouchableOpacity 
              key={option}
              onPress={() => onSelect(fieldKey, option)}
              className={`py-4 px-6 rounded-2xl mb-2 flex-row justify-between items-center ${value === option ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-transparent'}`}
            >
              <Text className={`text-base ${value === option ? 'text-blue-700 font-bold' : 'text-slate-700 font-medium'}`}>{option}</Text>
              {value === option && <CheckCircle size={20} color="#2563eb" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => setModalVisible(false)} className="mt-4 py-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
          <Text className="text-center text-white font-bold text-lg">Selesai</Text>
        </TouchableOpacity>
      </DraggableModal>
    </View>
  );
};

const FormSection = ({ title, icon: Icon, children }: any) => (
  <View className="bg-white rounded-[32px] p-6 mb-8 shadow-sm border border-slate-100">
    <View className="flex-row items-center mb-6 pb-4 border-b border-slate-50">
      <View className="bg-blue-50 p-2.5 rounded-xl mr-4">
        <Icon size={22} color="#2563eb" />
      </View>
      <Text className="text-slate-800 font-black text-lg tracking-tight">{title}</Text>
    </View>
    {children}
  </View>
);

const CustomAlert = ({ visible, title, message, type = 'success', onClose }: any) => {
  if (!visible) return null;
  return (
    <View className="absolute top-0 bottom-0 left-0 right-0 bg-black/60 z-50 justify-center items-center px-6" style={{ elevation: 10 }}>
      <View className="bg-white w-full rounded-[32px] p-8 items-center shadow-2xl">
        <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
          {type === 'success' ? <CheckCircle size={40} color="#16a34a" /> : <XCircle size={40} color="#dc2626" />}
        </View>
        <Text className="text-2xl font-black text-slate-800 mb-2 text-center tracking-tight">{title}</Text>
        <Text className="text-slate-500 text-center mb-8 leading-6 text-base px-2">{message}</Text>
        <TouchableOpacity onPress={onClose} className={`w-full py-4 rounded-2xl shadow-lg ${type === 'success' ? 'bg-green-600 shadow-green-200' : 'bg-red-600 shadow-red-200'}`}>
          <Text className="text-white text-center font-bold text-lg">{type === 'success' ? 'Selesai' : 'Tutup'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const EditProfileScreen = ({ navigation, route }: any) => {
  const { user } = route.params;
  const [formData, setFormData] = useState<any>({
    ...(user?.siswa || {}),
    alamat_jalan: user?.alamat || user?.siswa?.alamat_jalan || '',
    email_akun: user?.username || '-',
    nomor_telepon_rumah: user?.siswa?.nomor_telepon_rumah || user?.no_telepon || '-',
    no_hp_akun: user?.no_hp || '-',
  });
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'success', onClose: () => {}
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => { setIsReady(true); });
    return () => task.cancel();
  }, []);

  const handleChange = (key: string, value: string) => setFormData((prev: any) => ({ ...prev, [key]: value }));

  const uploadPhoto = async (file: any) => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('foto', { uri: file.uri, type: file.type, name: file.name } as any);
      
      console.log('Uploading photo...');
      const response = await api.post('/siswa/update', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      const newPhotoPath = response.data.user?.siswa?.foto;

      if (newPhotoPath) {
         setFormData((prev: any) => ({ ...prev, foto: newPhotoPath }));
      }
      
      setAlertConfig({ visible: true, title: 'Foto Berhasil!', message: 'Foto profil Anda telah diperbarui.', type: 'success', onClose: () => setAlertConfig(prev => ({...prev, visible: false})) });
    } catch (error: any) {
      setAlertConfig({ visible: true, title: 'Gagal Upload', message: error.message, type: 'error', onClose: () => setAlertConfig(prev => ({...prev, visible: false})) });
    } finally { setLoading(false); }
  };

  const currentPhotoUrl = selectedPhoto 
    ? selectedPhoto.uri 
    : (formData.foto 
        ? (formData.foto.startsWith('http') ? formData.foto : `${MAIN_APP_URL}/storage/${formData.foto}`) 
        : null);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'foto' && key !== 'berkas' && formData[key] !== null) data.append(key, String(formData[key]));
      });
      const response = await api.post('/siswa/update', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      let message = 'Perubahan data berhasil disimpan.';
      if (response.data.pending_request && Object.keys(response.data.pending_request).length > 0) {
        message += '\n\nBeberapa data memerlukan verifikasi sekolah sebelum berubah.';
      }
      
      setAlertConfig({
        visible: true, title: 'Berhasil Disimpan!', message: message, type: 'success',
        onClose: () => { setAlertConfig(prev => ({...prev, visible: false})); navigation.goBack(); }
      });
    } catch (error: any) {
      setAlertConfig({ visible: true, title: 'Gagal Menyimpan', message: 'Terjadi kesalahan jaringan.', type: 'error', onClose: () => setAlertConfig(prev => ({...prev, visible: false})) });
    } finally { setLoading(false); }
  };

  if (!isReady) {
    return (
      <SafeAreaView className="flex-1 bg-white">
         <View className="flex-row items-center px-6 py-4 border-b border-slate-50">
            <View className="w-10 h-10 rounded-xl bg-slate-100" />
            <View className="flex-1 ml-4 h-6 bg-slate-100 rounded-md w-32" />
         </View>
         <View className="p-6 items-center">
            <Skeleton variant="circle" width={120} height={120} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={100} borderRadius={24} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={400} borderRadius={32} />
         </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 relative">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-50 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-100">
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-slate-800 tracking-tight">Edit Profil</Text>
        <View className="w-10" /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <Reanimated.ScrollView entering={FadeIn.duration(500)} className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Photo Section */}
          <View className="items-center py-8 bg-white mb-6 border-b border-slate-50">
            <TouchableOpacity onPress={handleSelectPhoto} className="relative active:opacity-90">
                <View className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-xl shadow-slate-200 items-center justify-center overflow-hidden">
                    {currentPhotoUrl ? (
                        <Image 
                          source={{ uri: currentPhotoUrl }} 
                          className="w-full h-full" 
                          resizeMode="cover"
                        />
                    ) : (
                        <User size={48} color="#cbd5e1" />
                    )}
                </View>
                <View className="absolute bottom-1 right-1 bg-blue-600 p-2.5 rounded-full border-[3px] border-white shadow-md">
                    <Camera size={18} color="white" />
                </View>
            </TouchableOpacity>
            <Text className="text-slate-400 font-bold text-xs mt-4 uppercase tracking-widest">Ketuk untuk ubah</Text>
          </View>

          {/* Info Banner */}
          <View className="px-6 mb-8">
             <View className="p-5 bg-blue-600 rounded-[28px] shadow-lg shadow-blue-200 flex-row items-start border border-blue-500">
                <View className="bg-blue-500/50 p-2 rounded-xl mr-3">
                   <Info size={20} color="white" />
                </View>
                <View className="flex-1">
                    <Text className="text-white font-bold text-base mb-1">Informasi Data</Text>
                    <Text className="text-blue-50 text-xs leading-5">
                    Data dengan tanda <Text className="font-bold text-amber-300">VERIFIKASI</Text> memerlukan persetujuan sekolah sebelum berubah.
                    </Text>
                </View>
             </View>
          </View>

          <View className="px-6 pb-32">
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
              <View className="bg-slate-50 p-5 rounded-3xl mb-6 border border-slate-100">
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Akun Terdaftar</Text>
                 <View className="gap-4">
                    <View className="flex-row justify-between"><Text className="text-slate-500 text-xs font-medium">Username/Email</Text><Text className="font-bold text-slate-700 text-sm">{formData.email_akun}</Text></View>
                    <View className="flex-row justify-between"><Text className="text-slate-500 text-xs font-medium">Telp Rumah</Text><Text className="font-bold text-slate-700 text-sm">{formData.nomor_telepon_rumah}</Text></View>
                    <View className="flex-row justify-between"><Text className="text-slate-500 text-xs font-medium">HP Akun</Text><Text className="font-bold text-slate-700 text-sm">{formData.no_hp_akun}</Text></View>
                 </View>
              </View>

              <InputField label="WhatsApp Siswa" fieldKey="no_wa" icon={Phone} keyboardType="phone-pad" value={formData.no_wa} onChangeText={handleChange} />
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

            <FormSection title="Kesejahteraan" icon={Truck}>
              <InputField label="Hobi" fieldKey="hobi" icon={Heart} value={formData.hobi} onChangeText={handleChange} />
              <InputField label="Cita-cita" fieldKey="cita_cita" icon={Award} value={formData.cita_cita} onChangeText={handleChange} />
              <SelectField label="Jenis Tinggal" fieldKey="jenis_tinggal_id_str" icon={MapPin} value={formData.jenis_tinggal_id_str} options={['Bersama orang tua', 'Wali', 'Kost', 'Asrama', 'Panti Asuhan', 'Pesantren', 'Lainnya']} onSelect={handleChange} />
              <SelectField label="Transportasi" fieldKey="alat_transportasi_id_str" icon={Truck} value={formData.alat_transportasi_id_str} options={['Sepeda motor', 'Mobil pribadi', 'Jalan Kaki', 'Angkutan Umum', 'Ojek', 'Lainnya']} onSelect={handleChange} />
              <View className="flex-row gap-4">
                 <View className="flex-1"><InputField label="Jarak (km)" fieldKey="jarak_rumah_ke_sekolah_km" icon={MapPin} keyboardType="numeric" value={formData.jarak_rumah_ke_sekolah_km} onChangeText={handleChange} /></View>
                 <View className="flex-1"><InputField label="Waktu (menit)" fieldKey="waktu_tempuh_menit" icon={Info} keyboardType="numeric" value={formData.waktu_tempuh_menit} onChangeText={handleChange} /></View>
              </View>
              <SelectField label="Penerima KIP" fieldKey="penerima_kip" icon={Heart} value={formData.penerima_kip} options={['Ya', 'Tidak']} onSelect={handleChange} />
              <InputField label="No. KIP" fieldKey="no_kip" icon={Info} value={formData.no_kip} onChangeText={handleChange} />
              <SelectField label="Penerima KPS/PKH" fieldKey="penerima_kps" icon={Heart} value={formData.penerima_kps} options={['Ya', 'Tidak']} onSelect={handleChange} />
            </FormSection>

            <FormSection title="Data Ayah" icon={Users}>
              <InputField label="Nama Ayah" fieldKey="nama_ayah" icon={User} value={formData.nama_ayah} onChangeText={handleChange} />
              <InputField label="Tahun Lahir" fieldKey="tahun_lahir_ayah" icon={Info} keyboardType="numeric" value={formData.tahun_lahir_ayah} onChangeText={handleChange} />
              <InputField label="Pekerjaan" fieldKey="pekerjaan_ayah_id_str" icon={Info} value={formData.pekerjaan_ayah_id_str} onChangeText={handleChange} />
              <InputField label="Penghasilan" fieldKey="penghasilan_ayah_id_str" icon={Heart} value={formData.penghasilan_ayah_id_str} onChangeText={handleChange} />
              <InputField label="WhatsApp Ayah" fieldKey="no_wa_ayah" icon={Phone} keyboardType="phone-pad" value={formData.no_wa_ayah} onChangeText={handleChange} />
            </FormSection>

            <FormSection title="Data Ibu" icon={Users}>
              <InputField label="Nama Ibu" fieldKey="nama_ibu" icon={User} value={formData.nama_ibu} onChangeText={handleChange} />
              <InputField label="Tahun Lahir" fieldKey="tahun_lahir_ibu" icon={Info} keyboardType="numeric" value={formData.tahun_lahir_ibu} onChangeText={handleChange} />
              <InputField label="Pekerjaan" fieldKey="pekerjaan_ibu_id_str" icon={Info} value={formData.pekerjaan_ibu_id_str} onChangeText={handleChange} />
              <InputField label="Penghasilan" fieldKey="penghasilan_ibu_id_str" icon={Heart} value={formData.penghasilan_ibu_id_str} onChangeText={handleChange} />
              <InputField label="WhatsApp Ibu" fieldKey="no_wa_ibu" icon={Phone} keyboardType="phone-pad" value={formData.no_wa_ibu} onChangeText={handleChange} />
            </FormSection>

            <FormSection title="Data Wali" icon={Users}>
              <InputField label="Nama Wali" fieldKey="nama_wali" icon={User} value={formData.nama_wali} onChangeText={handleChange} />
              <InputField label="Tahun Lahir" fieldKey="tahun_lahir_wali" icon={Info} keyboardType="numeric" value={formData.tahun_lahir_wali} onChangeText={handleChange} />
              <InputField label="Pekerjaan" fieldKey="pekerjaan_wali_id_str" icon={Info} value={formData.pekerjaan_wali_id_str} onChangeText={handleChange} />
              <InputField label="WhatsApp Wali" fieldKey="no_wa_wali" icon={Phone} keyboardType="phone-pad" value={formData.no_wa_wali} onChangeText={handleChange} />
            </FormSection>

            <FormSection title="Riwayat Pendidikan" icon={BookOpen}>
              <InputField label="Sekolah Asal" fieldKey="sekolah_asal" icon={User} value={formData.sekolah_asal} onChangeText={handleChange} />
              <InputField label="NPSN Sekolah Asal" fieldKey="npsn_sekolah_asal" icon={Info} keyboardType="numeric" value={formData.npsn_sekolah_asal} onChangeText={handleChange} />
              <InputField label="No. Ijazah" fieldKey="no_seri_ijazah" icon={FileText} value={formData.no_seri_ijazah} onChangeText={handleChange} />
              <InputField label="No. SKHUN" fieldKey="no_seri_skhun" icon={FileText} value={formData.no_seri_skhun} onChangeText={handleChange} />
              <InputField label="No. Peserta UN" fieldKey="no_ujian_nasional" icon={FileText} value={formData.no_ujian_nasional} onChangeText={handleChange} />
            </FormSection>

          </View>
        </Reanimated.ScrollView>

        <View className="absolute bottom-0 w-full p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100">
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={loading}
            activeOpacity={0.8}
            className={`flex-row items-center justify-center h-14 rounded-2xl shadow-lg shadow-blue-200 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2 tracking-wide">SIMPAN DATA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
      
      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={alertConfig.onClose} />
    </SafeAreaView>
  );
};

export default EditProfileScreen;
