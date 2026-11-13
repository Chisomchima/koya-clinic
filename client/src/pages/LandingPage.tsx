import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAppModals } from '../app/app-modals-context';
import type { IllustrationName } from '../assets/illustrations';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { ArrowRightIcon, CheckIcon, ClockIcon } from '../components/ui/Icons';
import { Illustration } from '../components/ui/Illustration';
import { Skeleton } from '../components/ui/Skeleton';
import { useAvailability, type ProviderSummary } from '../features/providers/useAvailability';
import { formatTime, relativeDay } from '../lib/format';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export function LandingPage() {
  const availability = useAvailability();
  const { openFindBooking } = useAppModals();
  const navigate = useNavigate();
  const nextSlot = availability.openSlots[0];

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.p
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink-muted shadow-card"
          >
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            Live availability
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-6 text-[2.75rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl"
          >
            Your next clinic visit, booked <HighlightedWords>in seconds.</HighlightedWords>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-lg text-lg text-ink-muted">
            Pick a doctor, choose a time that suits you, and you're confirmed instantly. No phone
            queues, no back-and-forth.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => void navigate('/book')} className="group">
              Book an appointment
              <ArrowRightIcon className="size-5 transition group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="secondary" onClick={openFindBooking}>
              Manage a booking
            </Button>
          </motion.div>
          <motion.dl variants={fadeUp} className="mt-10 flex gap-10">
            <Stat
              label="Open appointment times"
              value={availability.isSuccess ? availability.openSlots.length : null}
            />
            <Stat
              label="Doctors available"
              value={availability.isSuccess ? availability.providers.length : null}
            />
          </motion.dl>
        </motion.div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-4 animate-blob bg-gradient-to-br from-primary-100 to-primary-50" />
          <Illustration name="heroDoctors" className="relative mx-auto w-[85%] py-10" />

          {nextSlot && (
            <FloatingCard className="top-6 -left-2 animate-float sm:-left-8" delay={0.6}>
              <Avatar name={nextSlot.provider} className="size-10 text-sm ring-2" />
              <div>
                <p className="text-xs font-semibold text-ink-soft">Next available</p>
                <p className="text-sm font-bold">
                  {relativeDay(nextSlot.start)}, {formatTime(nextSlot.start)}
                </p>
              </div>
            </FloatingCard>
          )}
          <FloatingCard
            className="-right-2 bottom-10 animate-float-delayed sm:-right-6"
            delay={0.9}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-success text-white">
              <CheckIcon className="size-5" strokeWidth={3} />
            </span>
            <div>
              <p className="text-xs font-semibold text-ink-soft">Appointment</p>
              <p className="text-sm font-bold">Confirmed instantly</p>
            </div>
          </FloatingCard>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="How it works" title="Three steps. Under a minute." />
          <motion.ol
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-12 grid gap-6 md:grid-cols-3"
          >
            <StepCard n={1} illustration="chooseDoctor" title="Choose your doctor">
              See who's available, or let us match you with the first free doctor.
            </StepCard>
            <StepCard n={2} illustration="pickTime" title="Pick a time">
              Open days light up on the calendar. Tap a time and you're nearly done.
            </StepCard>
            <StepCard n={3} illustration="confirmed" title="Get confirmed">
              Your booking is locked in instantly, and nobody else can take your slot.
            </StepCard>
          </motion.ol>
        </div>
      </section>

      {/* Doctors */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Our team" title="Meet the doctors" />
        <div className="mt-12">
          {availability.isPending ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : availability.providers.length > 0 ? (
            <motion.ul
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {availability.providers.map((p) => (
                <DoctorCard key={p.name} provider={p} />
              ))}
            </motion.ul>
          ) : (
            <p className="text-center text-ink-muted">
              Our schedule is being updated. Please check back soon.
            </p>
          )}
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-primary-500 px-8 py-12 text-white sm:px-12 md:grid-cols-[1fr_auto]"
        >
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-white/5" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready when you are.
            </h2>
            <p className="mt-3 max-w-md text-white/85">
              Grab a time that works for you. It only takes a moment, and you can cancel any time.
            </p>
            <Link
              to="/book"
              className="group mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 font-semibold text-primary-500 transition hover:shadow-lg"
            >
              Find a time
              <ArrowRightIcon className="size-5 transition group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="relative hidden h-48 rounded-3xl bg-white/95 p-4 md:block">
            <Illustration name="medicalCare" className="h-full" />
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function HighlightedWords({ children }: { children: ReactNode }) {
  return (
    <span className="relative whitespace-nowrap text-primary-500">
      {children}
      <svg
        viewBox="0 0 300 20"
        className="absolute -bottom-2 left-0 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          d="M4 14 Q 75 4 150 11 T 296 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          className="text-primary-200"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay: 0.6, ease: 'easeInOut' }}
        />
      </svg>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <dd className="text-3xl font-extrabold text-ink">
        {value === null ? '–' : <AnimatedNumber value={value} />}
      </dd>
      <dt className="text-sm text-ink-muted">{label}</dt>
    </div>
  );
}

function FloatingCard({
  children,
  className,
  delay,
}: {
  children: ReactNode;
  className: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay }}
      className={`absolute ${className}`}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-pop backdrop-blur">
        {children}
      </div>
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <p className="text-sm font-bold tracking-[0.2em] text-primary-500 uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
    </motion.div>
  );
}

function StepCard({
  n,
  illustration,
  title,
  children,
}: {
  n: number;
  illustration: IllustrationName;
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.li
      variants={fadeUp}
      whileHover={{ y: -6 }}
      className="rounded-3xl border border-line/70 bg-canvas p-6 transition-shadow hover:shadow-card"
    >
      <div className="flex h-40 items-center justify-center rounded-2xl bg-white p-4">
        <Illustration name={illustration} className="h-full" />
      </div>
      <p className="mt-6 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
          {n}
        </span>
        <span className="text-lg font-bold">{title}</span>
      </p>
      <p className="mt-2 text-ink-muted">{children}</p>
    </motion.li>
  );
}

function DoctorCard({ provider }: { provider: ProviderSummary }) {
  const { name, nextSlot, openSlots, durationMinutes } = provider;
  return (
    <motion.li variants={fadeUp} whileHover={{ y: -6 }}>
      <Link
        to={`/book?provider=${encodeURIComponent(name)}`}
        className="group block h-full rounded-3xl border border-line/70 bg-white p-6 transition-shadow hover:border-primary-300 hover:shadow-card"
      >
        <div className="flex items-center gap-4">
          <Avatar name={name} className="size-16 text-xl" />
          <div>
            <p className="text-lg font-bold">{name}</p>
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <ClockIcon className="size-4" /> {durationMinutes} min appointments
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="text-sm">
            {nextSlot ? (
              <>
                <p className="text-ink-soft">Next available</p>
                <p className="font-bold text-ink">
                  {relativeDay(nextSlot.start)}, {formatTime(nextSlot.start)}
                </p>
                <p className="mt-0.5 text-primary-500">
                  {openSlots.length} open {openSlots.length === 1 ? 'time' : 'times'}
                </p>
              </>
            ) : (
              <p className="font-semibold text-ink-soft">Fully booked for now</p>
            )}
          </div>
          <span className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary-500 transition group-hover:bg-primary-500 group-hover:text-white">
            <ArrowRightIcon className="size-5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
