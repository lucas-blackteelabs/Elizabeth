import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getEvents, getReminders } from '@/services/calendarService';

export const useEvents = () => useQuery({ queryKey: queryKeys.calendar.events, queryFn: getEvents });
export const useReminders = () => useQuery({ queryKey: queryKeys.calendar.reminders, queryFn: getReminders });
