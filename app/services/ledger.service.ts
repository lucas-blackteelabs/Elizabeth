import { apiEndpoints } from '@/config/apiEndpoints';
import { genericCreate, genericGet } from './generic.service';

export type DecisionKind = 'APPROVE' | 'DECLINE' | 'SNOOZE';
export const decide = (ledgerId: string, kind: DecisionKind, alternativeIndex?: number) =>
  genericCreate<{ kind: DecisionKind; alternativeIndex?: number }, unknown>(apiEndpoints.ledger.decision(ledgerId), { kind, alternativeIndex });
export const getTrace = (signalId?: string) => genericGet<{ at: string; signalId: string; agent: string; step: string; detail: string }[]>(apiEndpoints.ledger.trace, { params: { signalId } });
