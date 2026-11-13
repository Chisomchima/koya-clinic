import { useMemo } from 'react';
import { useSlots } from '../../api/queries';
import type { Slot } from '../../api/types';
import { durationMinutes } from '../../lib/format';

export interface ProviderSummary {
  name: string;
  openSlots: Slot[];
  nextSlot: Slot | undefined;
  durationMinutes: number;
}

/** Bookable slots (available and not started when fetched), plus a summary per provider. */
export function useAvailability() {
  const query = useSlots();
  const { data = [], dataUpdatedAt } = query;

  const derived = useMemo(() => {
    const openSlots = data.filter(
      (s) => s.available && new Date(s.start).getTime() > dataUpdatedAt,
    );
    const names = [...new Set(data.map((s) => s.provider))].sort();
    const providers: ProviderSummary[] = names.map((name) => {
      const slots = openSlots.filter((s) => s.provider === name);
      const next = slots[0];
      return {
        name,
        openSlots: slots,
        nextSlot: next,
        durationMinutes: next ? durationMinutes(next.start, next.end) : 30,
      };
    });
    return { openSlots, providers };
  }, [data, dataUpdatedAt]);

  return { ...query, ...derived };
}
