import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Check, FileCode, FileText, Code2 } from 'lucide-react';
import { generateBadgeSVG, generateMarkdownBadge, generateHTMLBadge } from '@/utils/badgeGenerator';
import { GFSBand } from '@/services/gfsCalculator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BadgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  band: GFSBand;
}

export function BadgeModal({ open, onOpenChange, score, band }: BadgeModalProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const svgString = generateBadgeSVG(score, band);
  const markdownString = generateMarkdownBadge(score, band);
  const htmlString = generateHTMLBadge(score, band);

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success(`${type} copied to clipboard`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const copyOptions = [
    { type: 'Markdown', icon: FileText, value: markdownString },
    { type: 'HTML', icon: Code2, value: htmlString },
    { type: 'SVG', icon: FileCode, value: svgString },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">Badge Generator</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Embed in your README to show users you've scanned for misuse-by-design patterns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Badge preview */}
          <div className="flex justify-center p-6 rounded-lg bg-secondary/40 border border-border">
            <div dangerouslySetInnerHTML={{ __html: svgString }} />
          </div>

          {/* Copy options */}
          <div className="space-y-2">
            {copyOptions.map(({ type, icon: Icon, value }) => {
              const isCopied = copiedType === type;
              return (
                <button
                  key={type}
                  onClick={() => handleCopy(value, type)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                    isCopied
                      ? 'border-[hsl(var(--ethics-safe)/0.4)] bg-[hsl(var(--ethics-safe)/0.06)] text-[hsl(var(--ethics-safe))]'
                      : 'border-border bg-card hover:bg-secondary/50 text-foreground hover:border-primary/30'
                  )}
                >
                  <Icon size={16} className={isCopied ? 'text-[hsl(var(--ethics-safe))]' : 'text-muted-foreground'} />
                  <span className="flex-1 text-left">Copy {type}</span>
                  {isCopied ? <Check size={14} /> : <Copy size={14} className="text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
