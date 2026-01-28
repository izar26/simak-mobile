import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage'; // 👈 Import ini
import api from './api';

export const login = async (username: any, password: any) => {
  try {
    const response = await api.post('/login', { username, password });

    if (response.data.access_token) {
      // 🔒 1. SIMPAN TOKEN DI BRANKAS (Encrypted)
      await EncryptedStorage.setItem(
        'user_session',
        JSON.stringify({
          token: response.data.access_token,
          // Bisa tambah refresh token disini kalau ada
        }),
      );

      // 📦 2. SIMPAN DATA PROFIL DI GUDANG (AsyncStorage - Biar cepat load UI)
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.log('Logout API error', error);
  } finally {
    // 🧹 BERSIH-BERSIH TOTAL
    try {
      // 1. Hapus Token dari Brankas
      await EncryptedStorage.removeItem('user_session');

      // 2. Hapus Cache dari Gudang (AsyncStorage)
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(
        key =>
          key === 'user' || // Hapus profil user
          key.startsWith('CACHE_') || // Hapus data cache ETag
          key.startsWith('META_'),
      );

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (e) {
      console.error('Gagal logout bersih:', e);
    }
  }
};

export const getToken = async () => {
  try {
    // 🔑 AMBIL DARI BRANKAS
    const session = await EncryptedStorage.getItem('user_session');
    if (session) {
      const { token } = JSON.parse(session);
      return token;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const getUser = async () => {
  // Profil ambil dari AsyncStorage aja biar enteng
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
