import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clinicApi } from './clinic';
import { ApiError } from './http';
import type { NewBooking } from './types';

export const queryKeys = {
  slots: ['slots'] as const,
  booking: (id: string) => ['booking', id] as const,
};

export function useSlots() {
  return useQuery({
    queryKey: queryKeys.slots,
    queryFn: clinicApi.listSlots,
    refetchInterval: 30_000, // keep availability fresh while someone is browsing
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: () => clinicApi.getBooking(id),
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  });
}

/** Only network failures and server errors are worth retrying, never a 4xx answer. */
const isRetryable = (err: unknown) => !(err instanceof ApiError) || err.status >= 500;

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: NewBooking; idempotencyKey: string }) =>
      clinicApi.createBooking(input, idempotencyKey),
    // Retrying is safe because every attempt carries the same Idempotency-Key.
    retry: (count, err) => isRetryable(err) && count < 2,
    onSuccess: (booking) => {
      queryClient.setQueryData(queryKeys.booking(booking.id), booking);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.slots }),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clinicApi.cancelBooking,
    onSuccess: (booking) => {
      queryClient.setQueryData(queryKeys.booking(booking.id), booking);
      void queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
  });
}
