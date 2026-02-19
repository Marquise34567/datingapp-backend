import React, { useEffect, useRef } from 'react';
import PillTabs from './PillTabs';
import Button from './Button';

type Mode = 'dating_advice' | 'rizz' | 'strategy';

interface ComposerProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  input: string;
  setInput: (s: string) => void;
  onSend: (text: string) => void;
  onQuickAnalyze: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabledSend?: boolean;
  isPremium?: boolean;
}

const Composer: React.FC<ComposerProps> = ({
  mode,
  setMode,
  input,
  setInput,
  onSend,
  onQuickAnalyze,
  loading = false,
  placeholder,
  disabledSend = false,
  isPremium = false,
}) => {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const resize = () => {
      ta.style.height = '0px';
      const max = 140; // px
      ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
      ta.style.overflowY = ta.scrollHeight > max ? 'auto' : 'hidden';
    };
    resize();
    ta.addEventListener('input', resize);
    return () => ta.removeEventListener('input', resize);
  }, [input]);

  return (
    <div className="composer-panel rounded-2xl premium-shadow elevated p-3 transition-all duration-150" aria-hidden={false}>
      <div className="composer-top mb-2">
        <PillTabs
          options={[
            { value: 'dating_advice', label: 'Dating advice' },
            { value: 'rizz', label: 'Rizz' },
            { value: 'strategy', label: 'Strategy' },
          ]}
          value={mode}
          onChange={(v) => setMode(v as Mode)}
        />
      </div>

      <div className="composer-body">
        <textarea
          ref={taRef}
          aria-label="Message composer"
          placeholder={placeholder || 'Type your situation… paste the convo or describe the vibe'}
          className="composer-textarea w-full bg-transparent resize-none placeholder-muted text-base leading-relaxed"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (input.trim().length) onSend(input.trim());
            }
          }}
        />
      </div>

      <div className="composer-bottom mt-3 flex items-center justify-between gap-2">
        <div className="text-xs text-muted">Enter to send • Shift+Enter for newline • Privacy-first</div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-zinc-500">
            {isPremium ? (
              <span className="font-semibold">Tone controls enabled</span>
            ) : (
              <span>Tone controls (Premium)</span>
            )}
          </div>

          </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onQuickAnalyze(input.trim() || '')}
            disabled={loading}
          >
            Quick Analyze
          </Button>

          <Button
            type="button"
            variant={input.trim().length && !loading ? 'primary' : 'secondary'}
            size="md"
            onClick={() => onSend(input.trim())}
            loading={loading}
            disabled={disabledSend}
            aria-label="Send message"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
