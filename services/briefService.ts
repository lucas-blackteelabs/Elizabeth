import { apiEndpoints } from '@/config/apiEndpoints';
import { Brief } from '@/types';
import apiClient from './apiClient';

export const getBrief = async () => (await apiClient.get<Brief>(apiEndpoints.brief.base)).data;
export const getBriefScript = async () => (await apiClient.get<{ script: string; source: string }>(apiEndpoints.brief.script)).data;
export const decide = async (ledgerId: string, kind: 'APPROVE' | 'DECLINE' | 'SNOOZE', alternativeIndex?: number) =>
  (await apiClient.post(apiEndpoints.ledger.decision(ledgerId), { kind, alternativeIndex })).data;
