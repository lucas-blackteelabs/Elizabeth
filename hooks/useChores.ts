import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { approveClaim, claimReward, completeChore, getBoard, undoChore } from '@/services/choreService';

export const useBoard = () => useQuery({ queryKey: queryKeys.chores.base, queryFn: getBoard });
const useBoardMutation = <T,>(fn: (v: T) => Promise<unknown>) => { const qc = useQueryClient(); return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chores.base }) }); };
export const useCompleteChore = () => useBoardMutation((id: string) => completeChore(id));
export const useUndoChore = () => useBoardMutation((id: string) => undoChore(id));
export const useClaimReward = () => useBoardMutation((v: { childId: string; rewardId: string }) => claimReward(v.childId, v.rewardId));
export const useApproveClaim = () => useBoardMutation((id: string) => approveClaim(id));
