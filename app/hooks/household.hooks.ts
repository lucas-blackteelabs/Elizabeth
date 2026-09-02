import { queryKeys } from '@/config/queryKeys';
import { ActionClass, Draft } from '@/lib/types';
import { commitHousehold, draftHousehold, getMyHousehold, loadDemo, setPolicy, setTrust } from '@/services/household.service';
import { useGenericGet, useGenericMutate } from './generic.hooks';

const ALL = [queryKeys.household.me, queryKeys.brief.base, queryKeys.calendar.events, queryKeys.chores.base, queryKeys.inbox.signals, queryKeys.ledger.base];

export const useHousehold = (enabled = true) => useGenericGet(queryKeys.household.me, getMyHousehold, { enabled, retry: false });
export const useDraftHousehold = () => useGenericMutate((text: string) => draftHousehold(text), { errorMessage: 'Could not read that. Try adding names and ages.' });
export const useCommitHousehold = () => useGenericMutate((v: { draft: Draft; disabledPolicies: string[]; trustPreset: string }) => commitHousehold(v.draft, v.disabledPolicies, v.trustPreset), { invalidateQueries: ALL });
export const useLoadDemo = () => useGenericMutate(() => loadDemo(), { invalidateQueries: ALL, successMessage: 'Demo family loaded.' });
export const useSetPolicy = () => useGenericMutate((v: { id: string; enabled: boolean }) => setPolicy(v.id, v.enabled), { invalidateQueries: [queryKeys.household.me] });
export const useSetTrust = () => useGenericMutate((v: { cls?: ActionClass; level?: number; pinned?: boolean; preset?: string }) => setTrust(v), { invalidateQueries: [queryKeys.household.me] });
