import { Link } from 'react-router';

export function Logo() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-ink"
    >
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary-500 text-white shadow-md shadow-primary-500/30 transition group-hover:rotate-6">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          <path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z" />
        </svg>
      </span>
      Koya Clinic
    </Link>
  );
}
