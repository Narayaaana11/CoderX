import { memo, useEffect, useMemo, useState } from 'react';
import { classNames } from '~/utils/classNames';
import { parseFileActivity, type FileActivity } from '~/utils/parseFileActivity';

interface AgentActivityProps {
  content: string;
  isStreaming?: boolean;
  maxVisible?: number;
}

function summarizeActivity(activities: FileActivity[], streaming: boolean): string {
  const count = activities.length;

  if (count === 0) {
    return '';
  }

  if (streaming) {
    const done = activities.filter((entry) => entry.done).length;
    return `Writing files... ${done}/${count}`;
  }

  if (count === 1 && activities[0]) {
    const file = activities[0].path.includes('/')
      ? activities[0].path.substring(activities[0].path.lastIndexOf('/') + 1)
      : activities[0].path;

    return `Wrote ${file}`;
  }

  return `Wrote ${count} files`;
}

export const AgentActivity = memo(({ content, isStreaming = false, maxVisible = 5 }: AgentActivityProps) => {
  const [isOpen, setIsOpen] = useState(isStreaming);

  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  const activities = useMemo(() => parseFileActivity(content), [content]);

  if (activities.length === 0) {
    return null;
  }

  const allDone = activities.every((entry) => entry.done);
  const summary = summarizeActivity(activities, isStreaming && !allDone);
  const visible = isOpen ? activities.slice(0, maxVisible) : [];
  const hiddenCount = Math.max(0, activities.length - maxVisible);

  return (
    <div className="my-2 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] hover:bg-bolt-elements-item-backgroundAccent/40 transition-theme"
      >
        <div
          className={classNames('size-3 shrink-0', {
            'i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress': isStreaming && !allDone,
            'i-ph:check text-bolt-elements-icon-success': !isStreaming || allDone,
          })}
        />
        <span className="font-medium text-bolt-elements-textSecondary truncate">{summary}</span>
        <div
          className={classNames('ml-auto i-ph:caret-right text-bolt-elements-textTertiary transition-transform', {
            'rotate-90': isOpen,
          })}
        />
      </button>

      {isOpen && (
        <div className="border-t border-bolt-elements-borderColor px-1 pb-1 pt-0.5">
          {visible.map((entry, index) => {
            const dir = entry.path.includes('/') ? entry.path.substring(0, entry.path.lastIndexOf('/') + 1) : '';
            const file = entry.path.includes('/') ? entry.path.substring(entry.path.lastIndexOf('/') + 1) : entry.path;

            return (
              <div
                key={`${entry.path}-${index}`}
                className="flex items-center gap-2 py-0.5 px-1 text-xs rounded hover:bg-bolt-elements-item-backgroundAccent/30"
              >
                <div
                  className={classNames('size-3.5 shrink-0', {
                    'i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress': !entry.done,
                    'i-ph:check text-bolt-elements-icon-success': entry.done,
                  })}
                />
                <span className="shrink-0">{entry.done ? 'Wrote' : 'Writing'}</span>
                <span className="min-w-0 truncate text-bolt-elements-textTertiary">
                  {dir && <span>{dir}</span>}
                  <span className="text-bolt-elements-textPrimary">{file}</span>
                </span>
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <p className="px-1 py-0.5 text-[10px] text-bolt-elements-textTertiary">+{hiddenCount} more files</p>
          )}
        </div>
      )}
    </div>
  );
});
