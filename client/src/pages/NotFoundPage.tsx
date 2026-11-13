import { Link } from 'react-router';
import { Illustration } from '../components/ui/Illustration';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <Illustration name="notFound" className="h-48" />
      <h1 className="mt-8 text-3xl font-extrabold">This page wandered off</h1>
      <p className="mt-2 text-ink-muted">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-primary-500 px-6 font-semibold text-white hover:bg-primary-700"
      >
        Take me home
      </Link>
    </div>
  );
}
