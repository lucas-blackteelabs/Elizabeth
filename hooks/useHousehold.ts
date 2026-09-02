import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { commitHousehold, draftHousehold, getHousehold, loadDemo, setPolicy, setTrust } from '@/services/householdService';
import { ActionClass, Draft } from '@/types';

export const useHousehold = (enabled = true) => useQuery({ queryKey: queryKeys.household.me, queryFn: getHousehold, enabled, retry: false });

const useInvalidateAll = () => { const qc = useQueryClient(); return () => qc.invalidateQueries(); };

export const useDraftHousehold = () => useMutation({ mutationFn: (text: string) => draftHousehold(text) });
export const useCommitHousehold = () => { const inv = useInvalidateAll(); return useMutation({ mutationFn: (v: { draft: Draft; disabledPolicies: string[]; trustPreset: string }) => commitHousehold(v.draft, v.disabledPolicies, v.trustPreset), onSuccess: inv }); };
export const useLoadDemo = () => { const inv = useInvalidateAll(); return useMutation({ mutationFn: loadDemo, onSuccess: inv }); };
export const useSetPolicy = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (v: { id: string; enabled: boolean }) => setPolicy(v.id, v.enabled), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.household.me }) }); };
export const useSetTrust = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (v: { cls?: ActionClass; level?: number; pinned?: boolean; preset?: string }) => setTrust(v), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.household.me }) }); };
