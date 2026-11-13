import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import type { Slot } from '../api/types';

/** Renders with the providers the app uses: React Query and a router. */
export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/** A JSON Response, as fetch would return it. */
export const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

/** A slot starting `hoursFromNow` hours from now (on the hour), 30 minutes long. */
export function slotIn(hoursFromNow: number, overrides: Partial<Slot> = {}): Slot {
  const start = new Date();
  start.setHours(start.getHours() + hoursFromNow, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60_000);
  return {
    id: `slot-${hoursFromNow}`,
    provider: 'Dr Ade',
    start: start.toISOString(),
    end: end.toISOString(),
    available: true,
    ...overrides,
  };
}
