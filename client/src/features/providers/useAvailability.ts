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

/**
 * Bookable slots (available and not yet started as of when they were fetched),
 * plus a per-provider summary. Re-fetched every 30s, so the page stays live.
 */
export function useAvailability() {
  const query = useSlots();
  const { data, dataUpdatedAt } = query;

  const derived = useMemo(() => {
    const openSlots = (data ?? []).filter(
      (s) => s.available && new Date(s.start).getTime() > dataUpdatedAt,
    );
    const byProvider = new Map<string, Slot[]>();
    for (const slot of openSlots) {
      byProvider.set(slot.provider, [...(byProvider.get(slot.provider) ?? []), slot]);
    }
    const allProviders = [...new Set((data ?? []).map((s) => s.provider))].sort();
    const providers: ProviderSummary[] = allProviders.map((name) => {
      const slots = byProvider.get(name) ?? [];
      const first = slots[0];
      return {
        name,
        openSlots: slots,
        nextSlot: first,
        durationMinutes: first ? durationMinutes(first.start, first.end) : 30,
      };
    });
    return { openSlots, providers };
  }, [data, dataUpdatedAt]);

  return { ...query, ...derived, allSlots: data ?? [] };
}
