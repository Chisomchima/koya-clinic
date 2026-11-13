import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { BookPage } from './pages/BookPage';
import { LandingPage } from './pages/LandingPage';
import { ManageBookingPage } from './pages/ManageBookingPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: true } },
});

// Client routes must not overlap the API's paths (/slots, /bookings), which the server owns.
// The server lists these same paths in CLIENT_ROUTES (server/src/app.ts).
const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/book', element: <BookPage /> },
      { path: '/booking/:id', element: <ManageBookingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Respect the OS "reduce motion" setting for every animation. */}
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </QueryClientProvider>
  );
}
