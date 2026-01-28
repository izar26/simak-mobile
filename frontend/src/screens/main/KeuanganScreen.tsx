import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Wallet,
  History,
  Receipt,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Skeleton from '../../components/Skeleton';
import { fetchWithSmartCache } from '../../utils/apiCache';

// Helper Format Rupiah
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

const KeuanganScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'tagihan' | 'riwayat'>('tagihan');

  useEffect(() => {
    fetchData(false);
  }, []);

  const fetchData = async (isManualRefresh = false) => {
    try {
      // Endpoint: /siswa/keuangan
      // Key: KEUANGAN_DATA
      // TTL: 15 Menit (Keuangan tidak berubah tiap detik)
      const result = await fetchWithSmartCache(
        '/siswa/keuangan',
        'KEUANGAN_DATA',
        15,
        isManualRefresh,
      );
      setData(result);
    } catch (error) {
      console.log('Error fetch keuangan:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // --- RENDER ITEMS ---

  const renderTagihan = ({ item, index }: any) => (
    <Animated.View entering={FadeInDown.delay(index * 50)} className="mb-3">
      <View className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-1">
            {item.jenis === 'tunggakan' && (
              <View className="bg-red-100 px-2 py-0.5 rounded mr-2">
                <Text className="text-red-600 text-[10px] font-bold">
                  TUNGGAKAN
                </Text>
              </View>
            )}
            <Text
              className="text-slate-800 font-bold text-base flex-1"
              numberOfLines={1}
            >
              {item.nama}
            </Text>
          </View>

          <Text className="text-slate-500 text-xs mb-2">
            {item.tipe === 'Bulanan' && item.periode
              ? `Periode: Bulan ${item.periode}`
              : 'Tagihan Bebas/Sekali Bayar'}
          </Text>

          {/* Progress Bar Sederhana */}
          <View className="h-1.5 bg-slate-100 rounded-full w-full overflow-hidden flex-row">
            <View
              style={{
                width: `${Math.max(
                  0,
                  ((item.total - item.sisa) / item.total) * 100,
                )}%`,
              }}
              className="bg-emerald-500 h-full"
            />
          </View>
          <Text className="text-slate-400 text-[10px] mt-1">
            Terbayar: {formatRupiah(item.total - item.sisa)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-rose-600 font-black text-lg">
            {formatRupiah(item.sisa)}
          </Text>
          <View
            className={`px-2 py-1 rounded-lg mt-1 ${
              item.status === 'Cicilan' ? 'bg-orange-50' : 'bg-rose-50'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                item.status === 'Cicilan' ? 'text-orange-600' : 'text-rose-600'
              }`}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderHistory = ({ item, index }: any) => (
    <Animated.View entering={FadeInDown.delay(index * 50)} className="mb-3">
      <View className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center border border-emerald-100 mr-3">
          <CheckCircle2 size={20} color="#10b981" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-800 font-bold text-sm">
            {item.nama_iuran}
          </Text>
          <Text className="text-slate-400 text-xs mt-0.5">
            {new Date(item.tanggal).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-emerald-600 font-bold text-base">
            + {formatRupiah(item.jumlah)}
          </Text>
          <Text className="text-slate-400 text-[10px]">{item.metode}</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* --- HEADER --- */}
      <LinearGradient
        colors={['#0f172a', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-6 rounded-b-[32px] shadow-lg z-10"
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold ml-4">
            Informasi Keuangan
          </Text>
        </View>

        <View className="items-center py-2">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
            Sisa Tagihan Anda
          </Text>
          {loading ? (
            <Skeleton
              width={150}
              height={40}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            />
          ) : (
            <Text className="text-white font-black text-4xl">
              {formatRupiah(data?.summary?.total_tagihan || 0)}
            </Text>
          )}
          <View className="bg-white/10 px-3 py-1 rounded-full mt-3 border border-white/10">
            <Text className="text-white text-xs">
              {data?.summary?.count_tagihan || 0} Item Belum Lunas
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* --- TABS --- */}
      <View className="flex-row mx-6 mt-6 mb-4 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
        <TouchableOpacity
          onPress={() => setActiveTab('tagihan')}
          className={`flex-1 py-3 rounded-xl flex-row justify-center items-center gap-2 ${
            activeTab === 'tagihan' ? 'bg-slate-800' : 'bg-transparent'
          }`}
        >
          <Receipt
            size={16}
            color={activeTab === 'tagihan' ? 'white' : '#64748b'}
          />
          <Text
            className={`font-bold text-xs ${
              activeTab === 'tagihan' ? 'text-white' : 'text-slate-500'
            }`}
          >
            Tagihan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('riwayat')}
          className={`flex-1 py-3 rounded-xl flex-row justify-center items-center gap-2 ${
            activeTab === 'riwayat' ? 'bg-emerald-600' : 'bg-transparent'
          }`}
        >
          <History
            size={16}
            color={activeTab === 'riwayat' ? 'white' : '#64748b'}
          />
          <Text
            className={`font-bold text-xs ${
              activeTab === 'riwayat' ? 'text-white' : 'text-slate-500'
            }`}
          >
            Riwayat
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- CONTENT LIST --- */}
      <View className="flex-1 px-6">
        {loading ? (
          <View>
            {[1, 2, 3].map(i => (
              <View key={i} className="mb-3">
                <Skeleton width="100%" height={100} borderRadius={16} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={
              activeTab === 'tagihan' ? data?.tagihan_list : data?.history_list
            }
            keyExtractor={item => item.id.toString() + activeTab}
            renderItem={activeTab === 'tagihan' ? renderTagihan : renderHistory}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0f172a']}
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <View className="bg-slate-100 p-6 rounded-full mb-4">
                  {activeTab === 'tagihan' ? (
                    <CheckCircle2 size={48} color="#cbd5e1" />
                  ) : (
                    <History size={48} color="#cbd5e1" />
                  )}
                </View>
                <Text className="text-slate-800 font-bold text-lg">
                  {activeTab === 'tagihan'
                    ? 'Tidak Ada Tagihan'
                    : 'Belum Ada Riwayat'}
                </Text>
                <Text className="text-slate-400 text-center text-sm px-8 mt-1 leading-5">
                  {activeTab === 'tagihan'
                    ? 'Hore! Kamu tidak memiliki tagihan aktif saat ini. Terima kasih sudah lunas.'
                    : 'Kamu belum melakukan pembayaran apapun sejauh ini.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

export default KeuanganScreen;
