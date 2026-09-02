import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { decide, getBrief, getBriefScript } from '@/services/briefService';

export const useBrief = (enabled = true) => useQuery({ queryKey: queryKeys.brief.base, queryFn: getBrief, enabled });
export const useBriefScript = (enabled: boolean) => useQuery({ queryKey: queryKeys.brief.script, queryFn: getBriefScript, enabled, staleTime: 60_000 });
export const useDecide = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { ledgerId: string; kind: 'APPROVE' | 'DECLINE' | 'SNOOZE'; alternativeIndex?: number }) => decide(v.ledgerId, v.kind, v.alternativeIndex), onSuccess: () => qc.invalidateQueries() });
};
