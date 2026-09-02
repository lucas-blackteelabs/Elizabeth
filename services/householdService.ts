import { apiEndpoints } from '@/config/apiEndpoints';
import { ActionClass, Draft, DraftResponse, Household, HouseholdResponse } from '@/types';
import apiClient from './apiClient';

export const getHousehold = async () => (await apiClient.get<HouseholdResponse>(apiEndpoints.households.me)).data;
export const draftHousehold = async (text: string) => (await apiClient.post<DraftResponse>(apiEndpoints.households.draft, { text })).data;
export const sampleIntro = async () => (await apiClient.get<{ text: string }>(apiEndpoints.households.sample)).data.text;
export const commitHousehold = async (draft: Draft, disabledPolicies: string[], trustPreset: string) => (await apiClient.post<HouseholdResponse>(apiEndpoints.households.commit, { draft, disabledPolicies, trustPreset })).data;
export const loadDemo = async () => (await apiClient.post<HouseholdResponse>(apiEndpoints.households.demo)).data;
export const setPolicy = async (id: string, enabled: boolean) => (await apiClient.put<Household>(apiEndpoints.households.policy(id), { enabled })).data;
export const setTrust = async (body: { cls?: ActionClass; level?: number; pinned?: boolean; preset?: string }) => (await apiClient.put<Household>(apiEndpoints.households.trust, body)).data;
