import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitFeedback } from '@/services/reportStorage';
import { cn } from '@/lib/utils';

interface FeedbackButtonsProps {
  reportId: string;
  issueId: string;
}

export function FeedbackButtons({ reportId, issueId }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);

  const handleFeedback = async (isHelpful: boolean) => {
    setSubmitted(isHelpful);
    await submitFeedback(reportId, issueId, isHelpful);
  };

  if (submitted !== null) {
    return (
      <span className="text-xs text-muted-foreground">
        {submitted ? 'Thanks! Marked as accurate.' : 'Thanks for the feedback.'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground mr-1">Accurate?</span>
      <button
        onClick={(e) => { e.stopPropagation(); handleFeedback(true); }}
        className={cn(
          'p-1 rounded hover:bg-[hsl(var(--ethics-safe)/0.15)] text-muted-foreground hover:text-[hsl(var(--ethics-safe))] transition-colors'
        )}
        title="Yes, this finding is accurate"
      >
        <ThumbsUp size={13} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleFeedback(false); }}
        className={cn(
          'p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors'
        )}
        title="No, this finding is inaccurate"
      >
        <ThumbsDown size={13} />
      </button>
    </div>
  );
}
