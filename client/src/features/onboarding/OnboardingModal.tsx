import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { IllustrationName } from '../../assets/illustrations';
import { Button } from '../../components/ui/Button';
import { Illustration } from '../../components/ui/Illustration';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../lib/cn';

const STEPS: { illustration: IllustrationName; title: string; body: string }[] = [
  {
    illustration: 'chooseDoctor',
    title: 'Choose your doctor',
    body: 'See who is available and pick the doctor you want, or let us find the first free one.',
  },
  {
    illustration: 'pickTime',
    title: 'Pick a time that works',
    body: 'Browse open days on the calendar and grab a time. Availability updates live.',
  },
  {
    illustration: 'confirmed',
    title: "You're confirmed. That's it!",
    body: 'Get a booking reference instantly, add it to your calendar, and cancel any time.',
  },
];

export function OnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose}>
      <OnboardingSteps onClose={onClose} />
    </Modal>
  );
}

function OnboardingSteps({ onClose }: { onClose: () => void }) {
  const [[index, direction], setPage] = useState([0, 1]);
  const navigate = useNavigate();
  const step = STEPS[index]!;
  const isLast = index === STEPS.length - 1;
  const go = (next: number) => setPage([next, next > index ? 1 : -1]);

  return (
    <div className="text-center">
      <p className="text-xs font-bold tracking-[0.2em] text-primary-500 uppercase">
        Welcome to Koya Clinic
      </p>

      <div className="relative mt-4 h-72 overflow-hidden sm:h-80">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d * 120, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -120, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex flex-col items-center"
          >
            <div className="relative flex h-40 w-full items-center justify-center sm:h-44">
              <div className="absolute size-40 animate-blob bg-primary-50 sm:size-44" />
              <Illustration name={step.illustration} className="relative h-full max-w-[80%]" />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold tracking-tight">{step.title}</h2>
            <p className="mx-auto mt-2 max-w-sm text-ink-muted">{step.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 flex justify-center gap-2" role="tablist" aria-label="Steps">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Step ${i + 1}: ${s.title}`}
            onClick={() => go(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === index ? 'w-8 bg-primary-500' : 'w-2 bg-line hover:bg-primary-300',
            )}
          />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={index === 0 ? onClose : () => go(index - 1)}>
          {index === 0 ? 'Skip' : 'Back'}
        </Button>
        {isLast ? (
          <Button
            size="lg"
            onClick={() => {
              onClose();
              void navigate('/book');
            }}
          >
            Book my appointment
          </Button>
        ) : (
          <Button size="lg" onClick={() => go(index + 1)}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
