import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getUser, logout } from '../../services/auth';
import { MAIN_APP_URL } from '@env';
import api from '../../services/api';
import {
  User, MapPin, Heart, Truck, Users, FileText, ChevronDown, ChevronUp, ExternalLink, LogOut, Award, Phone, Mail, Edit3, Folder, BookOpen, CreditCard
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Skeleton from '../../components/Skeleton';

const HomeScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Default expanded sections
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'identitas': true,
    'alamat': false,
    'kesejahteraan': false,
    'ortu': false,
    'transport': false,
    'riwayat': false,
    'berkas': false
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({...prev, [key]: !prev[key]}));
  };

  const fetchData = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data);
    } catch (error) {
      console.log('Gagal ambil data user', error);
      const localUser = await getUser();
      setUser(localUser);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await logout();
    navigation.getParent()?.replace('Login');
  };

  const handleOpenFile = (path: string) => {
    if (path) {
      const fullUrl = `${MAIN_APP_URL}/storage/${path}`;
      Linking.openURL(fullUrl).catch(err => console.error("Couldn't load page", err));
    }
  };

  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="relative bg-blue-600 pb-20 rounded-b-[40px] shadow-lg mb-14">
           {/* Header Skeleton */}
           <View className="items-center pt-8 px-6">
              <Skeleton variant="circle" width={112} height={112} style={{ marginBottom: 16, borderWidth: 4, borderColor: 'white' }} />
              <Skeleton width={180} height={28} style={{ marginBottom: 8, backgroundColor: '#93c5fd' }} />
              <Skeleton width={120} height={16} style={{ marginBottom: 16, backgroundColor: '#60a5fa' }} />
              <Skeleton width={100} height={30} borderRadius={20} style={{ backgroundColor: '#ffffff30' }} />
           </View>
        </View>

        <ScrollView className="px-4 -mt-14" showsVerticalScrollIndicator={false}>
           {[1,2,3,4,5].map(i => (
              <View key={i} className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 p-4 flex-row items-center justify-between">
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
  const fotoUrl = siswa?.foto ? `${MAIN_APP_URL}/storage/${siswa.foto}` : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Komponen Helper Section
  const SectionCard = ({ title, icon: Icon, sectionKey, children }: any) => (
    <View className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => toggleSection(sectionKey)}
        className="flex-row justify-between items-center p-4 bg-white"
      >
        <View className="flex-row items-center gap-3">
          <View className="bg-blue-50 p-2 rounded-lg">
            <Icon size={20} color="#2563eb" />
          </View>
          <Text className="text-gray-800 font-bold text-base">{title}</Text>
        </View>
        {expandedSections[sectionKey] ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
      </TouchableOpacity>
      
      {expandedSections[sectionKey] && (
        <View className="px-4 pb-5 pt-0">
          <View className="h-[1px] bg-gray-100 mb-4 w-full" />
          {children}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)}>
        {/* Modern Header Design */}
        <View className="relative bg-blue-600 pb-20 rounded-b-[40px] shadow-lg">
          <View className="absolute top-0 right-0 p-10 opacity-10">
             <Award size={150} color="white" />
          </View>
          
          {/* Tombol Edit Header */}
          <View className="absolute top-10 right-6 z-10">
            <TouchableOpacity 
              onPress={() => navigation.navigate('EditProfile', { user })}
              className="bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/30"
            >
              <Edit3 size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View className="items-center pt-8 px-6">
            <View className="relative">
              <View className="bg-white p-1.5 rounded-full shadow-2xl mb-4">
                {fotoUrl ? (
                  <Image 
                    source={{ uri: fotoUrl }} 
                    className="w-28 h-28 rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-28 h-28 bg-gray-100 rounded-full items-center justify-center">
                     <User size={40} color="#9ca3af" />
                  </View>
                )}
              </View>
              <View className={`absolute bottom-4 right-0 w-6 h-6 rounded-full border-2 border-white ${siswa?.status === 'Aktif' ? 'bg-green-500' : 'bg-gray-400'}`} />
            </View>

            <Text className="text-white text-2xl font-bold text-center mb-1">
              {siswa?.nama || user?.nama}
            </Text>
            <Text className="text-blue-100 font-medium text-sm mb-4">
              {siswa?.nisn ? `${siswa.nisn} • ${siswa?.nipd || '-'}` : user?.username}
            </Text>
            
            <View className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 flex-row items-center gap-2">
               <Award size={14} color="white" />
               <Text className="text-white text-xs font-bold uppercase tracking-wider">
                 {siswa?.nama_rombel || 'Belum Masuk Kelas'}
               </Text>
            </View>
          </View>
        </View>

        {/* Content Container - Offset to overlap header */}
        <View className="px-4 -mt-14">
          
          {/* 1. IDENTITAS */}
          <SectionCard title="Identitas & Kontak" icon={User} sectionKey="identitas">
            <View className="flex-row flex-wrap">
              <InfoBox label="NIK" value={siswa?.nik} width="50%" />
              <InfoBox label="Nomor KK" value={siswa?.no_kk} width="50%" />
              <InfoBox label="Jenis Kelamin" value={siswa?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} width="50%" />
              <InfoBox label="Tempat Lahir" value={siswa?.tempat_lahir} width="50%" />
              <InfoBox label="Tanggal Lahir" value={formatDate(siswa?.tanggal_lahir)} width="50%" />
              <InfoBox label="Agama" value={siswa?.agama_id_str} width="50%" />
              <InfoBox label="Kewarganegaraan" value="Indonesia" width="50%" />
              <InfoBox label="Berkebutuhan Khusus" value={siswa?.kebutuhan_khusus} width="50%" />
            </View>
            
            <View className="mt-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
              <ContactRow icon={Mail} label="Email Akun" value={user?.username || user?.email} />
              <ContactRow icon={Phone} label="Telp Rumah" value={user?.no_telepon} />
              <ContactRow icon={Phone} label="No. HP Akun" value={user?.no_hp} />
              <View className="h-[1px] bg-blue-200 my-2" />
              <ContactRow icon={Phone} label="HP Siswa" value={siswa?.nomor_telepon_seluler} />
              <ContactRow icon={Phone} label="WhatsApp" value={siswa?.no_wa} />
            </View>
          </SectionCard>

          {/* 2. ALAMAT */}
          <SectionCard title="Alamat Lengkap" icon={MapPin} sectionKey="alamat">
            <Text className="text-gray-800 font-medium text-sm mb-3 leading-6">
              {user?.alamat || 'Alamat belum diisi'}
            </Text>
            <View className="flex-row flex-wrap bg-gray-50 p-3 rounded-xl">
              <InfoBox label="RT / RW" value={`${siswa?.rt || '-'} / ${siswa?.rw || '-'}`} width="50%" />
              <InfoBox label="Kode Pos" value={siswa?.kode_pos} width="50%" />
              <InfoBox label="Desa/Kel" value={siswa?.desa_kelurahan} width="50%" />
              <InfoBox label="Kecamatan" value={siswa?.kecamatan} width="50%" />
              <InfoBox label="Kab/Kota" value={siswa?.kabupaten_kota} width="100%" />
              <InfoBox label="Provinsi" value={siswa?.provinsi} width="100%" />
            </View>
          </SectionCard>

          {/* 3. KESEJAHTERAAN */}
          <SectionCard title="Kesejahteraan" icon={Heart} sectionKey="kesejahteraan">
            <View className="flex-row flex-wrap mb-3">
               <InfoBox label="Hobi" value={siswa?.hobi} width="50%" />
               <InfoBox label="Cita-cita" value={siswa?.cita_cita} width="50%" />
            </View>
            <View className="gap-3">
              <BadgeRow label="Penerima KIP" active={siswa?.penerima_kip === 'Ya'} value={siswa?.no_kip} />
              {siswa?.penerima_kip === 'Ya' && <InfoBox label="Nama di KIP" value={siswa?.nama_di_kip} width="100%" />}
              <BadgeRow label="Layak PIP" active={siswa?.layak_pip === 'Ya'} />
              <BadgeRow label="Penerima KPS/PKH" active={siswa?.penerima_kps === 'Ya'} value={siswa?.no_kps} />
            </View>
          </SectionCard>

          {/* 4. TRANSPORTASI */}
          <SectionCard title="Transportasi & Fisik" icon={Truck} sectionKey="transport">
            <View className="flex-row flex-wrap">
              <InfoBox label="Transportasi" value={siswa?.alat_transportasi_id_str} width="50%" />
              <InfoBox label="Jarak Sekolah" value={siswa?.jarak_rumah_ke_sekolah_km ? `${siswa.jarak_rumah_ke_sekolah_km} km` : '-'} width="50%" />
              <InfoBox label="Waktu Tempuh" value={siswa?.waktu_tempuh_menit ? `${siswa.waktu_tempuh_menit} menit` : '-'} width="50%" />
              <InfoBox label="Jml Saudara" value={siswa?.jumlah_saudara_kandung} width="50%" />
              <InfoBox label="Tinggi Badan" value={siswa?.tinggi_badan ? `${siswa.tinggi_badan} cm` : '-'} width="50%" />
              <InfoBox label="Berat Badan" value={siswa?.berat_badan ? `${siswa.berat_badan} kg` : '-'} width="50%" />
            </View>
          </SectionCard>

          {/* 5. ORANG TUA */}
          <SectionCard title="Data Orang Tua" icon={Users} sectionKey="ortu">
            <View className="gap-6">
              <ParentInfo title="Ayah" name={siswa?.nama_ayah} job={siswa?.pekerjaan_ayah_id_str} phone={siswa?.no_wa_ayah} />
              <ParentInfo title="Ibu" name={siswa?.nama_ibu} job={siswa?.pekerjaan_ibu_id_str} phone={siswa?.no_wa_ibu} />
              {siswa?.nama_wali && (
                <ParentInfo title="Wali" name={siswa?.nama_wali} job={siswa?.pekerjaan_wali_id_str} phone={siswa?.no_wa_wali} />
              )}
            </View>
          </SectionCard>

          {/* 6. RIWAYAT PENDIDIKAN */}
          <SectionCard title="Riwayat Pendidikan" icon={BookOpen} sectionKey="riwayat">
            <View className="mb-2">
               <InfoBox label="Sekolah Asal" value={siswa?.sekolah_asal} width="100%" />
               <InfoBox label="NPSN Sekolah Asal" value={siswa?.npsn_sekolah_asal} width="100%" />
               <View className="flex-row mt-2 gap-2 flex-wrap">
                 <InfoBox label="No. Ijazah" value={siswa?.no_seri_ijazah} width="48%" />
                 <InfoBox label="No. SKHUN" value={siswa?.no_seri_skhun} width="48%" />
                 <InfoBox label="No. Peserta UN" value={siswa?.no_ujian_nasional} width="48%" />
                 <InfoBox label="No. Reg Akta Lahir" value={siswa?.no_registrasi_akta_lahir} width="48%" />
               </View>
            </View>
          </SectionCard>

          <TouchableOpacity
            className="bg-white p-4 rounded-xl border border-red-100 flex-row justify-center items-center shadow-sm mb-4 active:bg-red-50"
            onPress={handleLogout}
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold ml-2">Keluar Aplikasi</Text>
          </TouchableOpacity>
          
          <Text className="text-gray-400 text-center text-xs pb-4">Simak Mobile v1.0.0</Text>
        </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};

// UI Components Helpers
const InfoBox = ({ label, value, width = '100%' }: any) => (
  <View style={{ width }} className="mb-3 pr-2">
    <Text className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">{label}</Text>
    <Text className="text-gray-800 text-sm font-medium">{value || '-'}</Text>
  </View>
);

const ContactRow = ({ icon: Icon, label, value }: any) => (
  <View className="flex-row items-center py-2">
    <Icon size={14} color="#64748b" />
    <Text className="text-gray-500 text-xs ml-2 w-16">{label}</Text>
    <Text className="text-gray-800 text-xs font-bold flex-1 text-right">{value || '-'}</Text>
  </View>
);

const BadgeRow = ({ label, active, value }: any) => (
  <View className="flex-row justify-between items-center bg-gray-50 p-3 rounded-lg">
    <Text className="text-gray-600 text-sm">{label}</Text>
    <View className="flex-row items-center gap-2">
      {value && <Text className="text-gray-800 font-bold text-xs bg-white px-2 py-1 rounded border border-gray-200">{value}</Text>}
      <View className={`px-2 py-1 rounded-md ${active ? 'bg-green-100' : 'bg-gray-200'}`}>
        <Text className={`text-[10px] font-bold ${active ? 'text-green-700' : 'text-gray-500'}`}>
          {active ? 'YA' : 'TIDAK'}
        </Text>
      </View>
    </View>
  </View>
);

const ParentInfo = ({ title, name, job, phone }: any) => (
  <View className="flex-row items-center">
    <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
      <Text className="text-blue-600 font-bold text-xs">{title.substring(0,1)}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-gray-400 text-[10px] uppercase font-bold">{title}</Text>
      <Text className="text-gray-800 font-bold text-sm">{name || '-'}</Text>
      <Text className="text-gray-500 text-xs">{job || '-'}</Text>
      {phone && (
        <View className="flex-row items-center mt-1">
           <Phone size={10} color="#22c55e" />
           <Text className="text-green-600 text-xs font-bold ml-1">{phone}</Text>
        </View>
      )}
    </View>
  </View>
);

export default HomeScreen;
