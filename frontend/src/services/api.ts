import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // LOGGING REQUEST
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  console.log('[API Headers]', config.headers);
  
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.log('[API Error]', error.message);
    if (error.response) {
      console.log('[API Error Response]', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
