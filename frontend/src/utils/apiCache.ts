import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MAIN_APP_URL } from '@env'; // Sesuaikan config env

export const fetchWithSmartCache = async (endpoint: string, key: string, ttlMinutes: number, forceRefresh = false) => {
  const STORAGE_KEY = `CACHE_${key}`;
  const META_KEY = `META_${key}`; // Menyimpan ETag dan Waktu

  try {
    // 1. Ambil Data Lokal (Cache)
    const cachedData = await AsyncStorage.getItem(STORAGE_KEY);
    const cachedMeta = await AsyncStorage.getItem(META_KEY);
    
    let etag = null;
    let isValid = false;

    if (cachedData && cachedMeta) {
      const meta = JSON.parse(cachedMeta);
      const now = new Date().getTime();
      const expiry = meta.timestamp + ttlMinutes * 60 * 1000;
      
      isValid = now < expiry; // Cek apakah TTL masih berlaku
      etag = meta.etag;       // Ambil ETag terakhir
    }

   const allKeys = await AsyncStorage.getAllKeys();

   // 2. Coba ambil token (Kita tebak dulu nama-nama umum)
   // Coba tebak key: 'user_data', 'token', 'user', 'auth'
   const values = await AsyncStorage.multiGet([
     'user_data',
     'token',
     'user',
     'auth',
   ]);

   // --- LOGIC PENGAMBILAN TOKEN SEMENTARA ---
   let token = '';

   // CONTOH 1: Jika key-nya 'user_data' dan isinya JSON { token: "..." }
   const userRaw = await AsyncStorage.getItem('user_data');
   if (userRaw) {
     try {
       const user = JSON.parse(userRaw);
       token = user.token || user.access_token; // Coba cari properti token
     } catch (e) {
       // Kalau bukan JSON, mungkin langsung string token?
       token = userRaw;
     }
   }

   // CONTOH 2: Jika login menyimpan langsung dengan key 'token'
   if (!token) {
     token = (await AsyncStorage.getItem('token')) || '';
   }


   const headers: any = {
     Authorization: `Bearer ${token}`,
     Accept: 'application/json',
   };
if (etag) {
  // Kirim dua-duanya biar aman (Server akan baca salah satu)
  headers['If-None-Match'] = etag;
  headers['X-ETag'] = etag;
}

    const response = await axios.get(`${MAIN_APP_URL}/api${endpoint}`, { 
        headers,
        validateStatus: (status) => status >= 200 && status < 400 // Izinkan status 304 dianggap sukses
    });

    if (response.status === 304) {
        console.log(`[SmartCache] 304 Not Modified. Pakai Data Lokal.`);
        if (cachedMeta) {
            const meta = JSON.parse(cachedMeta);
            meta.timestamp = new Date().getTime(); 
            await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
        }
        return JSON.parse(cachedData!); // Kembalikan data lama
    }

  if (response.status === 200) {
    const newData = response.data;

    // 👇 PERBAIKAN: Cek huruf besar ATAU huruf kecil
   const newEtag =
     response.headers['x-etag'] ||
     response.headers['X-ETag'] ||
     response.headers['etag'];

    

    if (newEtag) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      await AsyncStorage.setItem(
        META_KEY,
        JSON.stringify({
          timestamp: new Date().getTime(),
          etag: newEtag, // Simpan
        }),
      );
    } else {
      // Kalau server lupa kirim ETag, kita simpan datanya saja tanpa meta ETag
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    }

    return newData;
  }

  } catch (error) {
    console.warn(`[SmartCache] Error/Offline: ${key}`, error);
    const fallbackData = await AsyncStorage.getItem(STORAGE_KEY);
    if (fallbackData) return JSON.parse(fallbackData);
    throw error;
  }
};