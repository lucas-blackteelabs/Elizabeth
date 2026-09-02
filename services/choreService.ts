import { apiEndpoints } from '@/config/apiEndpoints';
import { BoardView } from '@/types';
import apiClient from './apiClient';

export const getBoard = async () => (await apiClient.get<BoardView>(apiEndpoints.chores.base)).data;
export const completeChore = async (id: string) => (await apiClient.post<BoardView>(apiEndpoints.chores.complete(id))).data;
export const undoChore = async (id: string) => (await apiClient.post<BoardView>(apiEndpoints.chores.undo(id))).data;
export const claimReward = async (childId: string, rewardId: string) => (await apiClient.post<BoardView>(apiEndpoints.chores.claims, { childId, rewardId })).data;
export const approveClaim = async (id: string) => (await apiClient.post<BoardView>(apiEndpoints.chores.approve(id))).data;
