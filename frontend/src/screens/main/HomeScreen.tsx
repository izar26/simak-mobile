import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getUser, logout } from '../../services/auth';
import { MAIN_APP_URL, API_URL } from '@env';
import api from '../../services/api';
import {
  User, MapPin, Heart, Truck, Users, FileText, ChevronDown, ChevronUp, ExternalLink, LogOut, Award, Phone, Mail, Edit3, Folder, BookOpen, CreditCard, Printer, Download
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Skeleton from '../../components/Skeleton';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { getToken } from '../../services/auth';
import { Alert, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import StatusModal from '../../components/StatusModal';

const HomeScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal Status State
  const [modalStatus, setModalStatus] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'identitas': true, 'alamat': false, 'kesejahteraan': false, 'ortu': false, 'riwayat': false
  });

  const toggleSection = (key: string) => setExpandedSections(prev => ({...prev, [key]: !prev[key]}));

  const fetchData = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data);
    } catch (error) {
      const localUser = await getUser();
      setUser(localUser);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleCetakBiodata = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = `Biodata_${siswa?.nama || 'Siswa'}.pdf`;
      const path = Platform.OS === 'android' ? `${dirs.DownloadDir}/${fileName}` : `${dirs.DocumentDir}/${fileName}`;

      ReactNativeBlobUtil.config({
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
        .then((res) => {
          if (Platform.OS === 'ios') {
            ReactNativeBlobUtil.ios.previewDocument(res.path());
          } else {
            setModalStatus({
              visible: true,
              type: 'success',
              title: 'Berhasil di Unduh!',
              message: 'Biodata Anda telah tersimpan di folder Download perangkat Anda.'
            });
          }
        })
        .catch((err) => {
          setModalStatus({
            visible: true,
            type: 'error',
            title: 'Gagal Mengunduh',
            message: 'Terjadi kesalahan saat mencoba mengunduh file. Cek internet Anda.'
          });
          console.error(err);
        })
        .finally(() => setLoading(false));
    } catch (error) {
      setLoading(false);
      setModalStatus({
        visible: true,
        type: 'error',
        title: 'Kesalahan Sistem',
        message: 'Aplikasi tidak dapat menghubungi layanan cetak saat ini.'
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.getParent()?.replace('Login');
  };

  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="relative bg-slate-200 pb-20 rounded-b-[40px] shadow-lg mb-14">
           <View className="items-center pt-8 px-6">
              <Skeleton variant="circle" width={112} height={112} style={{ marginBottom: 16, borderWidth: 4, borderColor: 'white' }} />
              <Skeleton width={180} height={28} style={{ marginBottom: 8 }} />
              <Skeleton width={120} height={16} />
           </View>
        </View>
        <ScrollView className="px-4 -mt-14" showsVerticalScrollIndicator={false}>
           {[1,2,3,4].map(i => (
              <View key={i} className="bg-white rounded-2xl mb-4 p-4 flex-row items-center justify-between shadow-sm">
                 <View className="flex-row items-center gap-3">
                    <Skeleton width={36} height={36} borderRadius={8} />
                    <Skeleton width={120} height={20} />
                 </View>
                 <Skeleton width={20} height={20} borderRadius={10} />
              </View>
           ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const siswa = user?.siswa;
  const isFemale = siswa?.jenis_kelamin === 'P';
  
  // THEME COLORS
  const theme = {
    primary: isFemale ? 'bg-rose-500' : 'bg-blue-600',
    primarySoft: isFemale ? 'bg-rose-50' : 'bg-blue-50',
    primaryBorder: isFemale ? 'border-rose-100' : 'border-blue-100',
    primaryText: isFemale ? 'text-rose-600' : 'text-blue-600',
    gradient: isFemale ? ['#f43f5e', '#be123c'] : ['#3b82f6', '#1d4ed8'],
    tabActive: isFemale ? 'bg-rose-500/20 border-rose-500/30' : 'bg-white/20 border-white/30'
  };

  const fotoUrl = siswa?.foto ? `${MAIN_APP_URL}/storage/${siswa.foto}` : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const SectionCard = ({ title, icon: Icon, sectionKey, children }: any) => (
    <View className="bg-white rounded-[28px] mb-4 shadow-sm border border-slate-100 overflow-hidden">
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => toggleSection(sectionKey)}
        className="flex-row justify-between items-center p-5 bg-white"
      >
        <View className="flex-row items-center gap-4">
          <View className={`${theme.primarySoft} p-2.5 rounded-2xl`}>
            <Icon size={20} color={isFemale ? '#f43f5e' : '#2563eb'} />
          </View>
          <Text className="text-slate-800 font-black text-base tracking-tight">{title}</Text>
        </View>
        <View className="bg-slate-50 p-1.5 rounded-full">
           {expandedSections[sectionKey] ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
        </View>
      </TouchableOpacity>
      
      {expandedSections[sectionKey] && (
        <View className="px-5 pb-6 pt-0">
          <View className="h-[1px] bg-slate-50 mb-5 w-full" />
          {children}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={isFemale ? ['#f43f5e'] : ['#2563eb']} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)}>
        
        {/* Modern Header Design */}
        <LinearGradient 
          colors={theme.gradient}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
          style={{ borderBottomLeftRadius: 48, borderBottomRightRadius: 48 }}
          className="relative pb-20 shadow-2xl"
        >
          <View className="absolute top-0 right-0 p-10 opacity-10">
             <Award size={180} color="white" />
          </View>
          
          <View className="absolute top-10 right-6 z-10">
            <TouchableOpacity 
              onPress={() => navigation.navigate('EditProfile', { user })}
              className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/30"
            >
              <Edit3 size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View className="items-center pt-10 px-6">
            <View className="relative">
              <View className="bg-white p-1.5 rounded-full shadow-2xl mb-5">
                {fotoUrl ? (
                  <Image source={{ uri: fotoUrl }} className="w-32 h-32 rounded-full" resizeMode="cover" />
                ) : (
                  <View className="w-32 h-32 bg-slate-100 rounded-full items-center justify-center">
                     <User size={48} color="#94a3b8" />
                  </View>
                )}
              </View>
              {/* Indikator Online Dihapus Sesuai Permintaan */}
            </View>

            <Text className="text-white text-2xl font-black text-center mb-1 tracking-tight">
              {siswa?.nama || user?.nama}
            </Text>
            <Text className="text-white/80 font-bold text-sm mb-5 tracking-wide">
              {siswa?.nisn ? `${siswa.nisn} • ${siswa?.nipd || '-'}` : user?.username}
            </Text>
            
            <View className={`${theme.tabActive} backdrop-blur-md px-5 py-2 rounded-2xl border flex-row items-center gap-2 shadow-sm`}>
               <Award size={14} color="white" />
               <Text className="text-white text-xs font-black uppercase tracking-widest">
                 {siswa?.nama_rombel || 'Belum Masuk Kelas'}
               </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content Container */}
        <View className="px-5 -mt-14">
          
          <SectionCard title="Identitas & Kontak" icon={User} sectionKey="identitas">
            <View className="flex-row flex-wrap">
              <InfoBox label="NIK" value={siswa?.nik} width="50%" />
              <InfoBox label="Nomor KK" value={siswa?.no_kk} width="50%" />
              <InfoBox label="Jenis Kelamin" value={siswa?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} width="50%" />
              <InfoBox label="Tempat Lahir" value={siswa?.tempat_lahir} width="50%" />
              <InfoBox label="Tanggal Lahir" value={formatDate(siswa?.tanggal_lahir)} width="50%" />
              <InfoBox label="Agama" value={siswa?.agama_id_str} width="50%" />
              <InfoBox label="Kewarganegaraan" value="Indonesia" width="50%" />
              <InfoBox label="Kebutuhan Khusus" value={siswa?.kebutuhan_khusus} width="50%" />
            </View>
            
            <View className={`${theme.primarySoft} p-4 rounded-[20px] border ${theme.primaryBorder} mt-4`}>
              <ContactRow icon={Mail} label="Email Akun" value={user?.username || user?.email} isFemale={isFemale} />
              <ContactRow icon={Phone} label="HP Siswa" value={siswa?.nomor_telepon_seluler} isFemale={isFemale} />
              <ContactRow icon={Phone} label="WhatsApp" value={siswa?.no_wa} isFemale={isFemale} />
            </View>
          </SectionCard>

          <SectionCard title="Alamat Lengkap" icon={MapPin} sectionKey="alamat">
            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
               <Text className="text-slate-700 font-bold text-sm leading-5">
                 {user?.alamat || 'Alamat jalan belum diisi'}
               </Text>
            </View>
            <View className="flex-row flex-wrap bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <InfoBox label="RT / RW" value={`${siswa?.rt || '-'} / ${siswa?.rw || '-'}`} width="50%" />
              <InfoBox label="Kode Pos" value={siswa?.kode_pos} width="50%" />
              <InfoBox label="Desa/Kel" value={siswa?.desa_kelurahan} width="50%" />
              <InfoBox label="Kecamatan" value={siswa?.kecamatan} width="50%" />
              <InfoBox label="Kab/Kota" value={siswa?.kabupaten_kota} width="100%" />
            </View>
          </SectionCard>

          <SectionCard title="Data Orang Tua" icon={Users} sectionKey="ortu">
            <View className="gap-6">
              <ParentInfo title="Ayah" name={siswa?.nama_ayah} job={siswa?.pekerjaan_ayah_id_str} phone={siswa?.no_wa_ayah} isFemale={isFemale} />
              <View className="h-[1px] bg-slate-50 w-full" />
              <ParentInfo title="Ibu" name={siswa?.nama_ibu} job={siswa?.pekerjaan_ibu_id_str} phone={siswa?.no_wa_ibu} isFemale={isFemale} />
            </View>
          </SectionCard>

          <SectionCard title="Pendidikan Asal" icon={BookOpen} sectionKey="riwayat">
            <InfoBox label="Sekolah Asal" value={siswa?.sekolah_asal} />
            <InfoBox label="NPSN Asal" value={siswa?.npsn_sekolah_asal} />
            <View className="flex-row flex-wrap mt-2">
               <InfoBox label="No. Ijazah" value={siswa?.no_seri_ijazah} width="50%" />
               <InfoBox label="No. SKHUN" value={siswa?.no_seri_skhun} width="50%" />
            </View>
          </SectionCard>

          <TouchableOpacity
            className={`${theme.primary} p-5 rounded-[24px] flex-row justify-center items-center shadow-lg mb-4 active:opacity-90`}
            onPress={handleCetakBiodata}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Printer size={20} color="white" />
                <Text className="text-white font-black ml-3 uppercase tracking-widest text-xs">Unduh Biodata (PDF)</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white p-5 rounded-[24px] border border-red-100 flex-row justify-center items-center shadow-sm mb-6 active:bg-red-50"
            onPress={handleLogout}
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-600 font-black ml-3 uppercase tracking-widest text-xs">Keluar Aplikasi</Text>
          </TouchableOpacity>
          
          <Text className="text-slate-400 text-center text-[10px] font-bold uppercase tracking-widest pb-4">Simak Mobile v1.0.0</Text>
        </View>

        </Animated.View>
      </ScrollView>

      {/* MODAL STATUS GLOBAL */}
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

// UI Components Helpers
const InfoBox = ({ label, value, width = '100%' }: any) => (
  <View style={{ width }} className="mb-4 pr-2">
    <Text className="text-slate-400 text-[10px] uppercase font-black tracking-tighter mb-1">{label}</Text>
    <Text className="text-slate-800 text-sm font-bold leading-4">{value || '-'}</Text>
  </View>
);

const ContactRow = ({ icon: Icon, label, value, isFemale }: any) => (
  <View className="flex-row items-center py-2.5">
    <View className={`p-1.5 rounded-lg ${isFemale ? 'bg-rose-100' : 'bg-blue-100'} mr-3`}>
       <Icon size={14} color={isFemale ? '#f43f5e' : '#2563eb'} />
    </View>
    <Text className="text-slate-500 text-xs font-bold flex-1">{label}</Text>
    <Text className="text-slate-800 text-xs font-black">{value || '-'}</Text>
  </View>
);

const ParentInfo = ({ title, name, job, phone, isFemale }: any) => (
  <View className="flex-row items-center">
    <View className={`w-12 h-12 rounded-2xl ${isFemale ? 'bg-rose-100' : 'bg-blue-100'} items-center justify-center mr-4`}>
      <Text className={`${isFemale ? 'text-rose-600' : 'text-blue-600'} font-black text-lg`}>{title.substring(0,1)}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-0.5">{title}</Text>
      <Text className="text-slate-800 font-black text-base mb-0.5">{name || '-'}</Text>
      <Text className="text-slate-500 text-xs font-bold">{job || '-'}</Text>
      {phone && (
        <View className="flex-row items-center mt-1.5">
           <Phone size={10} color={isFemale ? '#f43f5e' : '#2563eb'} />
           <Text className={`${isFemale ? 'text-rose-600' : 'text-blue-600'} text-[11px] font-black ml-1.5`}>{phone}</Text>
        </View>
      )}
    </View>
  </View>
);

export default HomeScreen;