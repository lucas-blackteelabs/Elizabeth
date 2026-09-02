import { queryKeys } from '@/config/queryKeys';
import { decide, DecisionKind, getTrace } from '@/services/ledger.service';
import { useGenericGet, useGenericMutate } from './generic.hooks';

export const useDecide = () =>
  useGenericMutate((v: { ledgerId: string; kind: DecisionKind; alternativeIndex?: number }) => decide(v.ledgerId, v.kind, v.alternativeIndex), {
    invalidateQueries: [queryKeys.brief.base, queryKeys.calendar.events, queryKeys.calendar.reminders, queryKeys.household.me, queryKeys.ledger.base, queryKeys.chores.base],
  });
export const useTrace = (signalId?: string) => useGenericGet(queryKeys.ledger.trace(signalId), () => getTrace(signalId), { enabled: !!signalId });
