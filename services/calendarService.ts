import { apiEndpoints } from '@/config/apiEndpoints';
import { CalendarEvent, Reminder } from '@/types';
import apiClient from './apiClient';

export const getEvents = async () => (await apiClient.get<CalendarEvent[]>(apiEndpoints.calendar.base)).data;
export const getReminders = async () => (await apiClient.get<Reminder[]>(apiEndpoints.calendar.reminders)).data;
