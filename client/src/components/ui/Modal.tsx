import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** When false, Escape and backdrop clicks don't close it (e.g. while saving). */
  dismissible?: boolean;
  /** Content shown above the title, e.g. an illustration. */
  hero?: ReactNode;
}

const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

/**
 * An accessible, animated dialog: focus moves in and is trapped, Escape closes it,
 * page scrolling is locked, and focus returns to where it was afterwards.
 * On phones it slides up as a bottom sheet.
 */
export function Modal(props: ModalProps) {
  return createPortal(
    <AnimatePresence>{props.open && <ModalPanel {...props} />}</AnimatePresence>,
    document.body,
  );
}

function ModalPanel({
  onClose,
  title,
  description,
  children,
  size = 'md',
  dismissible = true,
  hero,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onEscape = useEffectEvent(() => {
    if (dismissible) onClose();
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () => [
      ...(panel?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ];

    // Focus the first form field if there is one, otherwise the panel itself.
    (panel?.querySelector<HTMLElement>('input, textarea, select') ?? panel)?.focus();

    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape();
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dismissible && onClose()}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className={cn(
          'relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-pop outline-none sm:rounded-3xl sm:p-8',
          widths[size],
        )}
      >
        <div
          className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden"
          aria-hidden="true"
        />
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:rotate-90 hover:bg-primary-50 hover:text-primary-500"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        {hero}
        {title && (
          <h2
            id={titleId}
            className={cn('text-2xl font-extrabold tracking-tight text-ink', hero ? 'mt-4' : '')}
          >
            {title}
          </h2>
        )}
        {description && (
          <p id={descriptionId} className="mt-1.5 text-ink-muted">
            {description}
          </p>
        )}
        <div className={title || description ? 'mt-6' : ''}>{children}</div>
      </motion.div>
    </div>
  );
}
