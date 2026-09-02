import { apiEndpoints } from '@/config/apiEndpoints';
import { IngestResult, RawMessage } from '@/types';
import apiClient from './apiClient';

export const ingest = async (raw: RawMessage) => (await apiClient.post<IngestResult>(apiEndpoints.inbox.base, raw)).data;
export const getSamples = async () => (await apiClient.get<RawMessage[]>(apiEndpoints.inbox.samples)).data;
export const addIcs = async (url: string, childId?: string) => (await apiClient.post<{ added: number }>(apiEndpoints.calendar.ics, { url, childId })).data;
