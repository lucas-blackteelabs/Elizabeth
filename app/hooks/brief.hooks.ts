import { queryKeys } from '@/config/queryKeys';
import { getBrief, getBriefScript } from '@/services/brief.service';
import { useGenericGet } from './generic.hooks';

export const useBrief = (enabled = true) => useGenericGet(queryKeys.brief.base, getBrief, { enabled });
export const useBriefScript = (enabled: boolean) => useGenericGet(queryKeys.brief.script, getBriefScript, { enabled, staleTime: 60_000 });
