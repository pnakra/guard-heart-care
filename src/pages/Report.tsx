import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadReport, SavedReport } from '@/services/reportStorage';
import { EthicsReviewPanel } from '@/components/ethics/EthicsReviewPanel';
import { IssueStatusProvider } from '@/contexts/IssueStatusContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppCategory } from '@/services/categoryDetector';

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadReport(id).then((data) => {
      if (data) {
        setReport(data);
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-mono">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Report not found</h1>
          <p className="text-sm text-muted-foreground">
            This report link may be invalid or the report may have been removed.
          </p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={14} />
              Back to Scanner
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ModeProvider>
      <IssueStatusProvider>
        <EthicsReviewPanel
          result={report.result_json}
          capabilities={report.capabilities_json}
          misuseScenarios={report.misuse_scenarios_json}
          activeCategory={report.detected_category as AppCategory | undefined}
          reportId={report.id}
        />
      </IssueStatusProvider>
    </ModeProvider>
  );
}
