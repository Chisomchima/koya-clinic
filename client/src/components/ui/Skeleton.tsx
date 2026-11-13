import { cn } from '../../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100/70 to-primary-50',
        className,
      )}
    />
  );
}
