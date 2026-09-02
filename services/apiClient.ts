import * as Localization from 'expo-localization';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { apiEndpoints, isPublicEndpoint } from '@/config/apiEndpoints';
import { appRoutes } from '@/config/appRoutes';
import { AuthTokens } from '@/types';

export const timezone = Localization.getCalendars()[0]?.timeZone ?? 'Australia/Sydney';

const apiClient = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_BASE_URL ?? 'http://localhost:8080'}/api/v1`,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-TimeZone': timezone, 'X-Client': 'app' },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
const onRefreshed = (token: string) => { refreshSubscribers.forEach((cb) => cb(token)); refreshSubscribers = []; };

apiClient.interceptors.request.use(async (config) => {
  if (isPublicEndpoint(config.url)) return config;
  const token = await SecureStore.getItemAsync('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !isPublicEndpoint(original.url)) {
      if (isRefreshing) return new Promise((resolve) => refreshSubscribers.push((t) => { original.headers.Authorization = `Bearer ${t}`; resolve(apiClient(original)); }));
      isRefreshing = true;
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await apiClient.post<AuthTokens>(apiEndpoints.auth.refresh, { refreshToken });
        await Promise.all([SecureStore.setItemAsync('authToken', data.accessToken), SecureStore.setItemAsync('refreshToken', data.refreshToken)]);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        onRefreshed(data.accessToken);
        return apiClient(original);
      } catch (e) {
        refreshSubscribers = [];
        await Promise.all([SecureStore.deleteItemAsync('authToken'), SecureStore.deleteItemAsync('refreshToken')]);
        router.replace(appRoutes.auth.base);
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
