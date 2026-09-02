import { QueryKey, useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'sonner';

export const useGenericGet = <Response>(queryKey: QueryKey, queryFn: () => Promise<AxiosResponse<Response>>, options?: Partial<UseQueryOptions<Response, AxiosError>>) =>
  useQuery<Response, AxiosError>({ queryKey, queryFn: async () => (await queryFn()).data, ...options });

export const useGenericMutate = <Request, Response>(
  mutationFn: (req: Request) => Promise<AxiosResponse<Response>>,
  options?: { invalidateQueries?: QueryKey[]; successMessage?: string | ((r: Response) => string); errorMessage?: string; onSuccess?: (r: Response) => void }
) => {
  const queryClient = useQueryClient();
  return useMutation<Response, AxiosError<{ message?: string }>, Request>({
    mutationFn: async (req) => (await mutationFn(req)).data,
    onSuccess: (data) => {
      options?.invalidateQueries?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      const msg = typeof options?.successMessage === 'function' ? options.successMessage(data) : options?.successMessage;
      if (msg) toast.success(msg);
      options?.onSuccess?.(data);
    },
    onError: (error) => toast.error(error.response?.data?.message ?? options?.errorMessage ?? 'Something went wrong'),
  });
};
