import { ClientOnly } from 'remix-utils/client-only';
import { SharedProjectPage } from '~/components/SharedProjectPage';

export default function SharedProjectRoute() {
  return <ClientOnly fallback={<div className="min-h-screen bg-zinc-950" />}>{() => <SharedProjectPage />}</ClientOnly>;
}
