import { apiEndpoints } from '@/config/apiEndpoints';
import { BoardView } from '@/lib/types';
import { genericCreate, genericDelete, genericGet } from './generic.service';

export const getBoard = () => genericGet<BoardView>(apiEndpoints.chores.base);
export const completeChore = (id: string) => genericCreate<void, BoardView>(apiEndpoints.chores.complete(id));
export const undoChore = (id: string) => genericCreate<void, BoardView>(apiEndpoints.chores.undo(id));
export const addChore = (body: { childId: string; title: string; points: number; cadence: string }) => genericCreate<typeof body, BoardView>(apiEndpoints.chores.base, body);
export const removeChore = (id: string) => genericDelete<BoardView>(apiEndpoints.chores.remove(id));
export const claimReward = (childId: string, rewardId: string) => genericCreate<{ childId: string; rewardId: string }, BoardView>(apiEndpoints.chores.claims, { childId, rewardId });
export const approveClaim = (id: string) => genericCreate<void, BoardView>(apiEndpoints.chores.approve(id));
