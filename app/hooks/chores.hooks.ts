import { queryKeys } from '@/config/queryKeys';
import { addChore, approveClaim, claimReward, completeChore, removeChore, undoChore, getBoard } from '@/services/chores.service';
import { useGenericGet, useGenericMutate } from './generic.hooks';

const inv = [queryKeys.chores.base];
export const useBoard = () => useGenericGet(queryKeys.chores.base, getBoard);
export const useCompleteChore = () => useGenericMutate((id: string) => completeChore(id), { invalidateQueries: inv });
export const useUndoChore = () => useGenericMutate((id: string) => undoChore(id), { invalidateQueries: inv });
export const useAddChore = () => useGenericMutate((b: { childId: string; title: string; points: number; cadence: string }) => addChore(b), { invalidateQueries: inv });
export const useRemoveChore = () => useGenericMutate((id: string) => removeChore(id), { invalidateQueries: inv });
export const useClaimReward = () => useGenericMutate((v: { childId: string; rewardId: string }) => claimReward(v.childId, v.rewardId), { invalidateQueries: inv, successMessage: 'Claimed. A parent needs to approve it.' });
export const useApproveClaim = () => useGenericMutate((id: string) => approveClaim(id), { invalidateQueries: inv, successMessage: 'Reward approved.' });
