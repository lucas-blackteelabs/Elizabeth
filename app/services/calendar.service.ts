import { apiEndpoints } from '@/config/apiEndpoints';
import { CalendarEvent, Reminder } from '@/lib/types';
import { genericCreate, genericGet } from './generic.service';

export const getEvents = () => genericGet<CalendarEvent[]>(apiEndpoints.calendar.base);
export const getReminders = () => genericGet<Reminder[]>(apiEndpoints.calendar.reminders);
export const addIcs = (url: string, childId?: string) => genericCreate<{ url: string; childId?: string }, { added: number; total: number }>(apiEndpoints.calendar.ics, { url, childId });
