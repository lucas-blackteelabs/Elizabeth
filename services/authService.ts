import { apiEndpoints } from '@/config/apiEndpoints';
import { AuthTokens } from '@/types';
import apiClient from './apiClient';

export const login = async (username: string, password: string) => (await apiClient.post<AuthTokens>(apiEndpoints.auth.login, { username, password })).data;
export const signUp = async (name: string, username: string, password: string, timeZone: string) => (await apiClient.post<AuthTokens>(apiEndpoints.auth.signup, { name, username, password, timeZone })).data;
export const logoutService = async () => { try { await apiClient.post(apiEndpoints.auth.signout); } catch {} };
