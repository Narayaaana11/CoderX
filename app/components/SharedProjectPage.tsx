import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@remix-run/react';
import { Loader2, Link2, AlertTriangle, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/openlovable/button';
import { fetchSharedProject } from '@/services/share';
import { createProject, saveProject } from '@/services/projects-api';

interface SharedPayload {
  name: string;
  description: string;
  files: Record<string, string>;
}

export function SharedProjectPage() {
  const navigate = useNavigate();
  const { shareId } = useParams<{ shareId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<SharedPayload | null>(null);
  const [remixing, setRemixing] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!shareId) {
        setError('Missing share ID.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { project } = await fetchSharedProject(shareId);
        setProject(project as SharedPayload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared project.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [shareId]);

  const remix = async () => {
    if (!project) return;
    setRemixing(true);
    try {
      const created = createProject(`${project.name} (Remix)`, project.description || 'Remixed shared project');
      const saved = saveProject({
        ...created,
        files: project.files,
      });
      navigate(`/workspace/${saved.id}`);
    } finally {
      setRemixing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-300">
        <Loader2 size={18} className="animate-spin" />
        <span className="ml-2 text-sm">Loading shared project…</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            <p className="text-sm font-semibold">Unable to open share link</p>
          </div>
          <p className="mt-2 text-xs">{error || 'Shared project not found in this browser profile.'}</p>
          <Button className="mt-3" size="sm" onClick={() => navigate('/')}>
            Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
              <Link2 size={10} />
              Shared Project
            </div>
            <h1 className="mt-2 text-xl font-semibold">{project.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">{project.description || 'No description provided.'}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
            Home
          </Button>
        </div>

        <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs text-zinc-500">Files</p>
          <p className="mt-1 text-sm text-zinc-300">{Object.keys(project.files).length} file(s) included</p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button className="gap-1.5" onClick={() => void remix()} disabled={remixing}>
            {remixing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            {remixing ? 'Creating Remix…' : 'Remix In Workspace'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/workspace')}>
            Open Workspace
          </Button>
        </div>
      </div>
    </div>
  );
}
