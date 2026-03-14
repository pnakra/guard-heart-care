import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownPageProps {
  filePath: string;
  backLabel?: string;
  backTo?: string;
}

export default function MarkdownPage({ filePath, backLabel = 'Back', backTo = '/' }: MarkdownPageProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(filePath)
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent('# Error\n\nCould not load document.');
        setLoading(false);
      });
  }, [filePath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-10">
        <article className="prose prose-neutral dark:prose-invert max-w-none
          prose-headings:font-serif prose-headings:text-foreground
          prose-h1:text-3xl prose-h1:mb-4
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
          prose-h3:text-xl prose-h3:mt-8
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-li:text-muted-foreground
          prose-strong:text-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:italic
          prose-code:text-primary prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
          prose-pre:bg-secondary prose-pre:border prose-pre:border-border
          prose-table:text-sm
          prose-th:text-foreground prose-th:font-medium prose-th:bg-secondary/50 prose-th:px-3 prose-th:py-2
          prose-td:text-muted-foreground prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-border
          prose-hr:border-border
          prose-em:text-muted-foreground
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
