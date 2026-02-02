import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const fetchWithSmartCache = async (
  endpoint: string,
  key: string,
  ttlMinutes: number,
  forceRefresh = false,
) => {
  const STORAGE_KEY = `CACHE_${key}`;
  const META_KEY = `META_${key}`; // Menyimpan ETag dan Timestamp

  try {
    // 1. Cek Data Lokal (Cache) di Gudang Biasa
    const cachedData = await AsyncStorage.getItem(STORAGE_KEY);
    const cachedMeta = await AsyncStorage.getItem(META_KEY);

    let etag = null;
    let isExpired = false;

    if (cachedMeta) {
      const meta = JSON.parse(cachedMeta);
      const now = new Date().getTime();
      const expiry = meta.timestamp + ttlMinutes * 60 * 1000;

      isExpired = now > expiry; // Cek apakah data sudah basi
      etag = meta.etag; // Ambil ETag terakhir
    }

    // Jika data masih segar (belum expired) dan tidak dipaksa refresh, pakai cache aja (Super Cepat)
    if (!forceRefresh && !isExpired && cachedData) {
      console.log(`[SmartCache] Pakai Cache Lokal (Valid): ${key}`);
      return JSON.parse(cachedData);
    }

    // Use shared `api` instance so auth/interceptors stay consistent.
    const headers: any = {};
    if (etag) {
      headers['If-None-Match'] = etag;
      headers['X-ETag'] = etag;
    }

    console.log(`[SmartCache] Fetching Server via shared api: ${endpoint}`);

    const response = await api.get(endpoint, {
      headers,
      validateStatus: status => status >= 200 && status < 400, // allow 304
    });

    // KASUS 1: Data Tidak Berubah (Hemat Kuota)
    if (response.status === 304) {
      console.log(`[SmartCache] 304 Not Modified. Pakai Data Lama.`);
      // Perbarui timestamp agar TTL reset (diperpanjang umurnya)
      if (cachedMeta) {
        const meta = JSON.parse(cachedMeta);
        meta.timestamp = new Date().getTime();
        await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
      }
      return JSON.parse(cachedData!); // Kembalikan data lokal
    }

    // KASUS 2: Data Baru Diterima (200 OK)
    if (response.status === 200) {
      console.log(`[SmartCache] 200 OK. Simpan Data Baru.`);
      const newData = response.data;

      // Cek header ETag (baik yang standar maupun kustom X-ETag)
      const newEtag =
        response.headers['x-etag'] ||
        response.headers['etag'] ||
        response.headers['ETag'];

      if (newEtag) {
        // Simpan Data + Meta ETag
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        await AsyncStorage.setItem(
          META_KEY,
          JSON.stringify({
            timestamp: new Date().getTime(),
            etag: newEtag,
          }),
        );
      } else {
        // Kalau server lupa kirim ETag, simpan datanya saja
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      }

      return newData;
    }
  } catch (error) {
    console.warn(`[SmartCache] Error/Offline (${key}):`, error);

    // Fallback: Jika offline/error, paksa pakai data cache yang ada (meski sudah expired)
    const fallbackData = await AsyncStorage.getItem(STORAGE_KEY);
    if (fallbackData) {
      console.log(`[SmartCache] Menggunakan data offline.`);
      return JSON.parse(fallbackData);
    }

    // Kalau tidak ada cache sama sekali, baru lempar error
    throw error;
  }
};
