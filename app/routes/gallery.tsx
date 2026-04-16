import { ClientOnly } from 'remix-utils/client-only';
import { GalleryPage } from '~/components/GalleryPage';

export default function GalleryRoute() {
  return <ClientOnly fallback={<div className="min-h-screen bg-zinc-950" />}>{() => <GalleryPage />}</ClientOnly>;
}
