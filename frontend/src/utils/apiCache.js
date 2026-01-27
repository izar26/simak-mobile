import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const fetchWithSmartCache = async (
  endpoint,
  storageKey,
  ttlMinutes = 60,
  forceRefresh = false,
) => {
  try {
    const NOW = Date.now();
    const TTL_MS = ttlMinutes * 60 * 1000;

    // 1. Cek Data Lokal
    console.log(
      `[SmartCache] 🔍 Mengecek penyimpanan untuk: DATA_${storageKey}`,
    );

    const localDataStr = await AsyncStorage.getItem(`DATA_${storageKey}`);
    const lastFetchStr = await AsyncStorage.getItem(`TIME_${storageKey}`);

    console.log(`[SmartCache] 📊 Status Data Lokal:`, {
      adaData: !!localDataStr,
      adaWaktu: !!lastFetchStr,
      forceRefresh: forceRefresh,
    });

    if (!forceRefresh && localDataStr && lastFetchStr) {
      const lastFetchTime = parseInt(lastFetchStr, 10);
      const age = NOW - lastFetchTime;
      const ageSeconds = Math.floor(age / 1000);

      if (age < TTL_MS) {
        console.log(
          `✅ [SmartCache] Data HIT! Umur: ${ageSeconds} detik. (Batas: ${
            ttlMinutes * 60
          } detik)`,
        );
        return JSON.parse(localDataStr);
      }

      console.log(
        `⏰ [SmartCache] Data BASI (Expired). Umur: ${ageSeconds} detik.`,
      );
    } else {
      const alasan = forceRefresh
        ? 'Dipaksa Refresh'
        : 'Data Kosong/Pertama Kali';
      console.log(`🔄 [SmartCache] Fetch ke Server... Alasan: ${alasan}`);
    }

    // 2. Request ke Server
    const response = await api.get(endpoint);

    // 3. Simpan Data Baru
    console.log(`💾 [SmartCache] Mencoba menyimpan ke storage...`);

    try {
      await AsyncStorage.setItem(
        `DATA_${storageKey}`,
        JSON.stringify(response.data),
      );
      await AsyncStorage.setItem(`TIME_${storageKey}`, NOW.toString());
      console.log(`✅ [SmartCache] SUKSES Menyimpan DATA_${storageKey}`);
    } catch (saveError) {
      console.error(`❌ [SmartCache] GAGAL Menyimpan:`, saveError);
    }

    return response.data;
  } catch (error) {
    console.log(
      '⚠️ [SmartCache] Error/Offline. Fallback ke data lokal.',
      error,
    );
    const savedData = await AsyncStorage.getItem(`DATA_${storageKey}`);
    if (savedData) return JSON.parse(savedData);
    throw error;
  }
};
