import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { FindBookingModal } from '../features/manage/FindBookingModal';
import { OnboardingModal } from '../features/onboarding/OnboardingModal';
import { onboarding } from '../lib/storage';
import { AppModalsContext } from './app-modals-context';

type AppModal = 'onboarding' | 'find-booking' | null;

export function AppModalsProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<AppModal>(null);
  const { pathname } = useLocation();

  // Show the tour on a first visit.
  useEffect(() => {
    if (pathname !== '/' || onboarding.isDone()) return;
    const timer = setTimeout(() => setModal('onboarding'), 900);
    return () => clearTimeout(timer);
  }, [pathname]);

  const close = useCallback(() => setModal(null), []);
  const value = useMemo(
    () => ({
      openOnboarding: () => setModal('onboarding'),
      openFindBooking: () => setModal('find-booking'),
    }),
    [],
  );

  return (
    <AppModalsContext value={value}>
      {children}
      <OnboardingModal
        open={modal === 'onboarding'}
        onClose={() => {
          onboarding.markDone();
          close();
        }}
      />
      <FindBookingModal open={modal === 'find-booking'} onClose={close} />
    </AppModalsContext>
  );
}
