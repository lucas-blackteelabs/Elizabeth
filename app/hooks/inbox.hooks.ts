import { queryKeys } from '@/config/queryKeys';
import { RawMessage } from '@/lib/types';
import { getSamples, getSignals, ingest } from '@/services/inbox.service';
import { useGenericGet, useGenericMutate } from './generic.hooks';

export const useIngest = () =>
  useGenericMutate((raw: RawMessage) => ingest(raw), {
    invalidateQueries: [queryKeys.brief.base, queryKeys.calendar.events, queryKeys.calendar.reminders, queryKeys.chores.base, queryKeys.inbox.signals, queryKeys.ledger.base, queryKeys.household.me],
    errorMessage: 'I could not read that.',
  });
export const useSignals = () => useGenericGet(queryKeys.inbox.signals, getSignals);
export const useSamples = () => useGenericGet(queryKeys.inbox.samples, getSamples, { staleTime: Infinity });
