import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';

const GRADIENTS = [
  'from-[#006BFF] to-[#5AA0FF]',
  'from-[#8247F5] to-[#B48CFF]',
  'from-[#E55CFF] to-[#F5A3FF]',
  'from-[#FF8A00] to-[#FFC266]',
  'from-[#0E9F6E] to-[#5EDBA8]',
  'from-[#0891B2] to-[#5ED3EA]',
];

/** The same colour for a name every time. */
const gradientFor = (name: string) =>
  GRADIENTS[[...initials(name)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % GRADIENTS.length]!;

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-4 ring-white',
        gradientFor(name),
        className ?? 'size-12 text-lg',
      )}
    >
      {initials(name) || '?'}
    </span>
  );
}
