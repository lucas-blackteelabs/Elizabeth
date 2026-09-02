import axios, { InternalAxiosRequestConfig } from 'axios';
import { apiEndpoints, isPublicEndpoint } from '@/config/apiEndpoints';
import { appRoutes } from '@/config/appRoutes';
import { Timeout } from '@/lib/constants/timeout';
import { AuthTokens } from '@/lib/types';
import { tokenStorage } from '@/lib/utils/auth/authStorage';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Client': 'web' },
  timeout: Timeout.DEFAULT,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isPublicEndpoint(config.url)) return config;
  const token = tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !isPublicEndpoint(original.url)) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }
      isRefreshing = true;
      original._retry = true;
      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await apiClient.post<AuthTokens>(apiEndpoints.auth.refresh, { refreshToken });
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        onRefreshed(data.accessToken);
        return apiClient(original);
      } catch (e) {
        refreshSubscribers = [];
        tokenStorage.clear();
        if (typeof window !== 'undefined') window.location.href = appRoutes.auth.login;
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
