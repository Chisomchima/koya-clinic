import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAppModals } from '../../app/app-modals-context';
import { cn } from '../../lib/cn';
import { Logo } from '../ui/Logo';

export function SiteHeader() {
  const { openOnboarding, openFindBooking } = useAppModals();
  const { pathname } = useLocation();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 8));

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-white/80 shadow-[0_1px_0_var(--color-line)] backdrop-blur-lg'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <button
            type="button"
            onClick={openOnboarding}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:bg-primary-50 hover:text-primary-500 md:block"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={openFindBooking}
            className="rounded-full px-3 py-2 text-sm font-semibold text-ink transition hover:bg-primary-50 hover:text-primary-500 sm:px-4"
          >
            <span className="sm:hidden">Manage</span>
            <span className="hidden sm:inline">Manage booking</span>
          </button>
          {pathname !== '/book' && (
            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/book"
                className="inline-flex h-10 items-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white shadow-sm shadow-primary-500/30 transition-colors hover:bg-primary-700"
              >
                Book now
              </Link>
            </motion.div>
          )}
        </nav>
      </div>
    </header>
  );
}
