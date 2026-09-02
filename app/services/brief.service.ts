import { apiEndpoints } from '@/config/apiEndpoints';
import { Brief } from '@/lib/types';
import { genericGet } from './generic.service';

export const getBrief = () => genericGet<Brief>(apiEndpoints.brief.base);
export const getBriefScript = () => genericGet<{ script: string; source: string }>(apiEndpoints.brief.script);
