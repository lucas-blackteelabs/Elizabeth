import { queryKeys } from '@/config/queryKeys';
import { addIcs, getEvents, getReminders } from '@/services/calendar.service';
import { useGenericGet, useGenericMutate } from './generic.hooks';

export const useEvents = () => useGenericGet(queryKeys.calendar.events, getEvents);
export const useReminders = () => useGenericGet(queryKeys.calendar.reminders, getReminders);
export const useAddIcs = () =>
  useGenericMutate((v: { url: string; childId?: string }) => addIcs(v.url, v.childId), {
    invalidateQueries: [queryKeys.calendar.events, queryKeys.household.me],
    successMessage: (r) => `Added ${r.added} events from that calendar.`,
  });
