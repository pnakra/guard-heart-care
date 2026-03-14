import { cn } from '@/lib/utils';
import { useMode } from '@/contexts/ModeContext';

export function ModePillToggle() {
  const { mode, toggleMode } = useMode();
  const isVibe = mode === 'vibe';

  return (
    <button
      onClick={toggleMode}
      className="relative flex items-center h-8 rounded-full border border-border bg-secondary/60 p-0.5 transition-colors hover:border-primary/30"
      aria-label={`Switch to ${isVibe ? 'Dev' : 'Vibe'} mode`}
    >
      {/* Sliding pill background */}
      <div
        className={cn(
          'absolute h-7 rounded-full bg-primary/15 border border-primary/30 transition-all duration-300 ease-out',
          isVibe ? 'left-0.5 w-[72px]' : 'left-[72px] w-[64px]'
        )}
      />

      {/* Vibe label */}
      <span
        className={cn(
          'relative z-10 flex items-center gap-1 px-3 py-1 text-xs font-medium transition-colors duration-200',
          isVibe ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        <span className="text-sm">✦</span>
        Vibe
      </span>

      {/* Dev label */}
      <span
        className={cn(
          'relative z-10 flex items-center gap-1 px-3 py-1 text-xs font-mono font-medium transition-colors duration-200',
          !isVibe ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {'{ }'}
        Dev
      </span>
    </button>
  );
}
