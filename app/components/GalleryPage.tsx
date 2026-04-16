import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { Compass, Sparkles, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/openlovable/button';
import { fetchGallery, fetchSharedProject } from '@/services/share';
import { createProject, saveProject } from '@/services/projects-api';

interface GalleryItem {
  id: string;
  name: string;
  description: string;
  shareId?: string;
  updatedAt: number;
}

export function GalleryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remixingId, setRemixingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { projects } = await fetchGallery(36, 0);
      setItems(projects as GalleryItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const remixProject = async (item: GalleryItem) => {
    if (!item.shareId) return;
    setRemixingId(item.id);
    try {
      const { project } = await fetchSharedProject(item.shareId);
      const created = createProject(`${project.name} (Remix)`, project.description || 'Remixed from gallery');
      const saved = saveProject({
        ...created,
        files: project.files,
      });
      navigate(`/workspace/${saved.id}`);
    } catch {
      // ignore for now
    } finally {
      setRemixingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
            <div className="flex items-center gap-2 text-zinc-300">
              <Compass size={16} className="text-primary" />
              <span className="text-sm font-semibold">Discover Projects</span>
            </div>
          </div>
          <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            Back to home
          </a>
          <a href="/workspace" className="text-xs text-zinc-500 hover:text-zinc-300">
            Open workspace
          </a>
          <Button variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={() => void load()}>
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="ml-2 text-sm">Loading public gallery…</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-8 text-center">
            <Sparkles size={28} className="mx-auto mb-2 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              No local public projects yet. Share one from the workspace in this browser.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{item.name}</p>
                <p className="mt-1 line-clamp-3 text-xs text-zinc-500">
                  {item.description || 'No description provided.'}
                </p>
                <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-600">
                  Updated {new Date(item.updatedAt).toLocaleDateString()}
                </p>
                <Button
                  size="sm"
                  className="mt-4 w-full gap-1.5"
                  disabled={!item.shareId || remixingId === item.id}
                  onClick={() => void remixProject(item)}
                >
                  {remixingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {remixingId === item.id ? 'Remixing…' : 'Remix'}
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
