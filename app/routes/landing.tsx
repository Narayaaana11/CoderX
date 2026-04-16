import { lazy, Suspense } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

const LandingPage = lazy(async () => {
  const module = await import('~/components/LandingPage');

  return {
    default: module.LandingPage,
  };
});

export default function LandingRoute() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-[#050810]" />}>
      {() => (
        <Suspense fallback={<div className="min-h-screen bg-[#050810]" />}>
          <LandingPage />
        </Suspense>
      )}
    </ClientOnly>
  );
}
