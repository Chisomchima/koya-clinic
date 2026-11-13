import { createContext, use } from 'react';

export interface AppModalsContextValue {
  openOnboarding: () => void;
  openFindBooking: () => void;
}

export const AppModalsContext = createContext<AppModalsContextValue | null>(null);

/** Opens the app-wide modals (onboarding tour, find a booking) from any component. */
export function useAppModals() {
  const ctx = use(AppModalsContext);
  if (!ctx) throw new Error('useAppModals must be used inside <AppModalsProvider>');
  return ctx;
}
