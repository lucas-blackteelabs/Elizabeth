import { apiEndpoints } from '@/config/apiEndpoints';
import { ActionClass, Draft, DraftResponse, Household, HouseholdResponse } from '@/lib/types';
import { genericCreate, genericGet, genericUpdate } from './generic.service';

export const getMyHousehold = () => genericGet<HouseholdResponse>(apiEndpoints.households.me);
export const draftHousehold = (text: string) => genericCreate<{ text: string }, DraftResponse>(apiEndpoints.households.draft, { text });
export const sampleIntro = () => genericGet<{ text: string }>(apiEndpoints.households.sample);
export const commitHousehold = (draft: Draft, disabledPolicies: string[], trustPreset: string) =>
  genericCreate<{ draft: Draft; disabledPolicies: string[]; trustPreset: string }, HouseholdResponse>(apiEndpoints.households.commit, { draft, disabledPolicies, trustPreset });
export const loadDemo = () => genericCreate<void, HouseholdResponse>(apiEndpoints.households.demo);
export const setPolicy = (id: string, enabled: boolean) => genericUpdate<{ enabled: boolean }, Household>(apiEndpoints.households.policy(id), { enabled });
export const setTrust = (body: { cls?: ActionClass; level?: number; pinned?: boolean; preset?: string }) => genericUpdate<typeof body, Household>(apiEndpoints.households.trust, body);
