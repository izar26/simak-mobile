import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import { DeviceEventEmitter } from 'react-native';
import { logger } from '../utils/logger';
import {
  logApiRequest,
  logApiResponse,
  handleApiError,
} from '../utils/errorHandler';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use(
  async config => {
    // Prefer token from EncryptedStorage (secure), fallback to AsyncStorage
    let token: string | null = null;
    try {
      const session = await EncryptedStorage.getItem('user_session');
      if (session) {
        const parsed = JSON.parse(session);
        token = parsed?.token || null;
      }
    } catch (e) {
      // ignore
    }

    if (!token) {
      token = await AsyncStorage.getItem('token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request (only in dev)
    logApiRequest(config.method?.toUpperCase() || 'GET', config.url || '');
    logger.debug('API', `${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  error => {
    logger.error('API', 'Request interceptor error', error);
    return Promise.reject(error);
  },
);

// ✅ RESPONSE INTERCEPTOR
api.interceptors.response.use(
  response => {
    logApiResponse(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
    );
    logger.debug(
      'API',
      `Response ${response.status} from ${response.config.url}`,
    );
    return response;
  },
  error => {
    const appError = handleApiError(error);

    // Central handling for expired session (401)
    if (appError.code === 'AUTH') {
      AsyncStorage.removeItem('token').catch(() => {});
      try {
        EncryptedStorage.removeItem('user_session');
      } catch {}
      // Emit a device event so UI can listen and redirect to login if desired
      try {
        DeviceEventEmitter.emit('auth:expired');
      } catch {}
    }

    logger.error('API', `Error: ${appError.message}`, {
      code: appError.code,
      status: appError.statusCode,
    });
    return Promise.reject(appError);
  },
);

export default api;
