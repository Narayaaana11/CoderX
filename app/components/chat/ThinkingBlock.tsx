import { memo, useEffect, useState } from 'react';
import { classNames } from '~/utils/classNames';

interface ThinkingBlockProps {
  thinking: string;
  isStreaming?: boolean;
}

export const ThinkingBlock = memo(({ thinking, isStreaming = false }: ThinkingBlockProps) => {
  const [isOpen, setIsOpen] = useState(isStreaming);

  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (!thinking) {
    return null;
  }

  return (
    <div className="mb-3 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bolt-elements-item-backgroundAccent/40 transition-theme"
      >
        <div
          className={classNames('i-ph:brain text-sm text-bolt-elements-item-contentAccent', {
            'animate-pulse': isStreaming,
          })}
        />
        <span className="text-[11px] font-semibold text-bolt-elements-item-contentAccent tracking-wide">
          {isStreaming ? 'Thinking...' : 'Reasoning'}
        </span>
        {!isStreaming && (
          <span className="ml-1 text-[10px] text-bolt-elements-textTertiary">
            ({thinking.split(/\s+/).length} words)
          </span>
        )}
        <div
          className={classNames(
            'ml-auto i-ph:caret-down text-sm text-bolt-elements-textSecondary transition-transform',
            {
              '-rotate-90': !isOpen,
            },
          )}
        />
      </button>

      {isOpen && (
        <div className="px-3 pt-2 pb-3 border-t border-bolt-elements-borderColor max-h-52 overflow-y-auto">
          <p className="text-[11px] leading-relaxed text-bolt-elements-textSecondary whitespace-pre-wrap">{thinking}</p>
        </div>
      )}
    </div>
  );
});
