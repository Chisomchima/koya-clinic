import { createContext, use } from 'react';

interface AppModalsContextValue {
  openOnboarding: () => void;
  openFindBooking: () => void;
}

export const AppModalsContext = createContext<AppModalsContextValue | null>(null);

export function useAppModals() {
  const ctx = use(AppModalsContext);
  if (!ctx) throw new Error('useAppModals must be used inside <AppModalsProvider>');
  return ctx;
}
