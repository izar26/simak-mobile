import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const login = async (username, password) => {
  try {
    const response = await api.post('/login', { username, password });
    if (response.data.access_token) {
      await AsyncStorage.setItem('token', response.data.access_token);
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
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }
};

export const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

export const getUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
