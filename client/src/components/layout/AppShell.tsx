import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { AppModalsProvider } from '../../app/AppModals';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function AppShell() {
  const location = useLocation();
  return (
    <AppModalsProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1 overflow-x-clip">
          <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <FrozenOutlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <SiteFooter />
      </div>
    </AppModalsProvider>
  );
}

/** Keeps showing the old page while it animates out, instead of swapping to the new one early. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}
