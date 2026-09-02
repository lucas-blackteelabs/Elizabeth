import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { addIcs, getSamples, ingest } from '@/services/inboxService';
import { RawMessage } from '@/types';

export const useIngest = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (raw: RawMessage) => ingest(raw), onSuccess: () => qc.invalidateQueries() }); };
export const useSamples = () => useQuery({ queryKey: queryKeys.inbox.samples, queryFn: getSamples, staleTime: Infinity });
export const useAddIcs = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (v: { url: string; childId?: string }) => addIcs(v.url, v.childId), onSuccess: () => qc.invalidateQueries() }); };
