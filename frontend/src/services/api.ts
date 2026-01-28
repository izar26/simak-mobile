import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const token = await AsyncStorage.getItem('token');
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
    logger.error('API', `Error: ${appError.message}`, {
      code: appError.code,
      status: appError.statusCode,
    });
    return Promise.reject(appError);
  },
);

export default api;
