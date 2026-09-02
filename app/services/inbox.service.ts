import { apiEndpoints } from '@/config/apiEndpoints';
import { IngestResult, RawMessage, Signal } from '@/lib/types';
import { genericCreate, genericGet } from './generic.service';

export const ingest = (raw: RawMessage) => genericCreate<RawMessage, IngestResult>(apiEndpoints.inbox.base, raw);
export const getSignals = () => genericGet<Signal[]>(apiEndpoints.inbox.signals);
export const getSamples = () => genericGet<RawMessage[]>(apiEndpoints.inbox.samples);
