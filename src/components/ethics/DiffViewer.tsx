import { useState } from 'react';
import { CodeChange } from '@/types/ethics';
import { Copy, Check, Wand2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DiffViewerProps {
  codeChange: CodeChange;
}

function parseDiffLines(diff: string) {
  return diff.split('\n').map((line, i) => {
    const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'remove' : 'context';
    return { content: line, type, key: i };
  });
}

function renderSplitView(currentCode: string, suggestedCode: string) {
  const leftLines = currentCode.split('\n');
  const rightLines = suggestedCode.split('\n');
  const maxLines = Math.max(leftLines.length, rightLines.length);

  return (
    <div className="grid grid-cols-2 divide-x divide-border">
      <div className="overflow-x-auto">
        {Array.from({ length: maxLines }, (_, i) => (
          <div
            key={`l-${i}`}
            className={cn(
              'px-3 py-0.5 text-xs font-mono whitespace-pre flex',
              i < leftLines.length ? 'bg-[hsl(0,50%,12%)] text-[hsl(0,70%,70%)]' : 'bg-transparent'
            )}
          >
            <span className="w-8 shrink-0 text-muted-foreground/50 select-none text-right pr-2">{i < leftLines.length ? i + 1 : ''}</span>
            <span>{i < leftLines.length ? leftLines[i] : ''}</span>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        {Array.from({ length: maxLines }, (_, i) => (
          <div
            key={`r-${i}`}
            className={cn(
              'px-3 py-0.5 text-xs font-mono whitespace-pre flex',
              i < rightLines.length ? 'bg-[hsl(140,40%,10%)] text-[hsl(140,60%,65%)]' : 'bg-transparent'
            )}
          >
            <span className="w-8 shrink-0 text-muted-foreground/50 select-none text-right pr-2">{i < rightLines.length ? i + 1 : ''}</span>
            <span>{i < rightLines.length ? rightLines[i] : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiffViewer({ codeChange }: DiffViewerProps) {
  const [copiedFix, setCopiedFix] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const pathParts = codeChange.file.split('/');

  const handleCopyFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeChange.suggestedCode);
    setCopiedFix(true);
    toast.success('Fix code copied');
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = `In ${codeChange.file}, make the following change: ${codeChange.action}. Current code:\n\`\`\`\n${codeChange.currentCode}\n\`\`\`\nChange to:\n\`\`\`\n${codeChange.suggestedCode}\n\`\`\``;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    toast.success('Prompt copied');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card" onClick={(e) => e.stopPropagation()}>
      {/* File path breadcrumb */}
      <div className="flex items-center gap-1 px-3 py-2 bg-secondary/50 border-b border-border text-xs font-mono text-muted-foreground">
        {pathParts.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={10} className="text-muted-foreground/40" />}
            <span className={cn(i === pathParts.length - 1 && 'text-foreground font-medium')}>{part}</span>
          </span>
        ))}
      </div>

      {/* Diff content */}
      <div className="overflow-hidden">
        {codeChange.diffPreview ? (
          <div className="overflow-x-auto">
            {parseDiffLines(codeChange.diffPreview).map(({ content, type, key }) => (
              <div
                key={key}
                className={cn(
                  'px-3 py-0.5 text-xs font-mono whitespace-pre',
                  type === 'add' && 'bg-[hsl(140,40%,10%)] text-[hsl(140,60%,65%)]',
                  type === 'remove' && 'bg-[hsl(0,50%,12%)] text-[hsl(0,70%,70%)]',
                  type === 'context' && 'text-muted-foreground'
                )}
              >
                {content}
              </div>
            ))}
          </div>
        ) : (
          renderSplitView(codeChange.currentCode, codeChange.suggestedCode)
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-secondary/30">
        <button
          onClick={handleCopyFix}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors',
            copiedFix
              ? 'bg-[hsl(var(--ethics-safe)/0.15)] text-[hsl(var(--ethics-safe))]'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border'
          )}
        >
          {copiedFix ? <Check size={12} /> : <Copy size={12} />}
          {copiedFix ? 'Copied' : 'Copy fix'}
        </button>
        <button
          onClick={handleCopyPrompt}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors',
            copiedPrompt
              ? 'bg-[hsl(var(--ethics-safe)/0.15)] text-[hsl(var(--ethics-safe))]'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border'
          )}
        >
          {copiedPrompt ? <Check size={12} /> : <Wand2 size={12} />}
          {copiedPrompt ? 'Copied' : 'Copy as prompt'}
        </button>
      </div>
    </div>
  );
}
