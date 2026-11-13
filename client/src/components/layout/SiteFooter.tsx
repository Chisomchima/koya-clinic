export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-ink-soft sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Koya Clinic. Care that fits your schedule.</p>
        <p>
          Illustrations by{' '}
          <a
            href="https://undraw.co"
            className="font-medium text-ink-muted hover:text-primary-500"
            target="_blank"
            rel="noreferrer"
          >
            unDraw
          </a>
        </p>
      </div>
    </footer>
  );
}
