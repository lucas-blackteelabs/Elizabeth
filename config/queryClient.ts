import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

export const CACHE_TIMES = { short: 60_000, medium: 5 * 60_000, long: 10 * 60_000 } as const;

export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: CACHE_TIMES.long, staleTime: CACHE_TIMES.short, refetchOnWindowFocus: false, retry: 1 }, mutations: { retry: 1 } },
});

export const asyncStoragePersister = createAsyncStoragePersister({ storage: AsyncStorage });
