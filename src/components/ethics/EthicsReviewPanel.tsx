import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PopulationModifier, POPULATION_MODIFIERS } from './ProjectUpload';
import { EthicsReviewResult, HarmCategory } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';
import { ExecutiveSummary } from './ExecutiveSummary';
import { CategoryCard } from './CategoryCard';
import { IssuesList } from './IssuesList';
import { MisuseScenarios } from './MisuseScenarios';
import { ForkAnalysisTab } from './ForkAnalysisTab';
import { PreLaunchChecklist } from './PreLaunchChecklist';
import { ModePillToggle } from './ModePillToggle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Filter, AlertTriangle, Shield, Download, FileText, FileJson, FileType, Sparkles, X, BookOpen, Users, GitPullRequest, ScanSearch, GitFork, ClipboardCheck, Award, Loader2 } from 'lucide-react';
import { exportReport, generateLovablePrompt, generatePRComment, copyToClipboard } from '@/utils/exportReport';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useMode } from '@/contexts/ModeContext';
import { getGFSBand } from '@/services/gfsCalculator';
import { BadgeModal } from './BadgeModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EthicsReviewPanelProps {
  result: EthicsReviewResult;
  capabilities: DetectedCapability[];
  misuseScenarios: MisuseScenario[];
  activePopulations?: PopulationModifier[];
  onRescan?: () => void;
  onPublish?: () => void;
}

type TabValue = 'issues' | 'misuse' | 'fork' | 'checklist';

export function EthicsReviewPanel({ 
  result, 
  capabilities, 
  misuseScenarios,
  activePopulations = [],
  onRescan,
  onPublish 
}: EthicsReviewPanelProps) {
  const { isVibe } = useMode();
  const defaultTab: TabValue = result.isForkAnalysis ? 'fork' : isVibe ? 'checklist' : 'issues';
  const [selectedCategory, setSelectedCategory] = useState<HarmCategory | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const gfsScore = result.executiveSummary.riskScore * 10;
  const gfsBand = getGFSBand(Math.round(Math.max(0, Math.min(100, gfsScore))));

  const handleCategoryClick = (category: HarmCategory) => {
    setSelectedCategory(prev => prev === category ? null : category);
    setActiveTab('issues');
  };

  const selectedCategoryLabel = selectedCategory
    ? result.categories.find(c => c.category === selectedCategory)?.label
    : null;

  const criticalMisuseCount = misuseScenarios.filter(s => s.severity === 'critical').length;

  const handleExport = (format: 'markdown' | 'json' | 'pdf' | 'sarif') => {
    exportReport({ result, capabilities, misuseScenarios }, format);
    const label = format === 'sarif' ? 'SARIF' : format.toUpperCase();
    toast.success(`Report exported as ${label}`, {
      description: format === 'sarif' ? 'Upload to GitHub Code Scanning.' : 'Your misuse-by-design scan has been downloaded.',
    });
  };

  const handleCopyPRComment = async () => {
    const comment = generatePRComment({ result, capabilities, misuseScenarios });
    await copyToClipboard(comment);
    toast.success('PR comment copied!', {
      description: 'Paste into your GitHub pull request.',
    });
  };

  const handleCopyFixPrompt = async () => {
    const prompt = generateLovablePrompt({ result, capabilities, misuseScenarios });
    await copyToClipboard(prompt);
    toast.success('Fix prompt copied!', {
      description: 'Paste this into Lovable to address the issues.',
    });
  };

  return (
    <div className={cn(
      'min-h-screen bg-background transition-colors duration-300',
      !isVibe && 'scan-lines'
    )}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border relative">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg 
                  className="w-5 h-5 text-primary-foreground" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                  />
                </svg>
              </div>
              <div>
                <h1 className={cn(
                  'text-lg font-semibold text-foreground tracking-tight',
                  isVibe ? 'font-sans' : 'font-mono'
                )}>
                  {isVibe ? 'Ground Floor Check' : 'gfc-scanner'} <span className="text-primary">{isVibe ? '' : 'v2.0'}</span>
                </h1>
                <p className={cn(
                  'text-[10px] text-muted-foreground tracking-wide',
                  isVibe ? 'font-sans' : 'font-mono'
                )}>
                  {isVibe ? 'Ethics review for your app' : 'misuse-by-design detection'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ModePillToggle />
              <ThemeToggle />
              <Link
                to="/taxonomy"
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary border border-border rounded hover:border-primary/30 transition-colors',
                  isVibe ? 'font-sans' : 'font-mono'
                )}
              >
                <BookOpen size={12} />
                {isVibe ? 'Learn more' : 'Taxonomy v1.0'}
              </Link>
              <button
                onClick={onRescan}
                className={cn(
                  'group inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary border border-border rounded hover:border-primary/30 transition-all',
                  isVibe ? 'font-sans' : 'font-mono hover:terminal-glow'
                )}
              >
                {!isVibe && <span className="text-primary">{'>'}</span>}
                <span>{isVibe ? 'New scan' : 'run scan'}</span>
                {!isVibe && <span className="hidden group-hover:inline text-primary cursor-blink">▌</span>}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download size={14} />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                    <FileType size={14} />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('markdown')} className="gap-2">
                    <FileText size={14} />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2">
                    <FileJson size={14} />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('sarif')} className="gap-2">
                    <ScanSearch size={14} />
                    Export as SARIF (GitHub)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyPRComment} className="gap-2">
                    <GitPullRequest size={14} />
                    Copy PR Comment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyFixPrompt} className="gap-2">
                    <Sparkles size={14} />
                    Copy Fix Prompt for Lovable
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowBadgeModal(true)} className="gap-2">
                    <Award size={14} />
                    Generate Badge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                size="sm" 
                onClick={onPublish}
                className="gap-2"
              >
                <Shield size={14} />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-6">
        {/* Executive Summary */}
        <ExecutiveSummary 
          summary={result.executiveSummary}
          projectName={result.projectName}
          timestamp={result.timestamp}
          detectedCategory={result.detectedCategory}
          issueIds={result.issues.map(i => i.id)}
          lowConfidenceCount={result.issues.filter(i => i.confidence && i.confidence.overallConfidence < 0.6).length}
        />

        {/* Active population modifiers */}
        {activePopulations.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Users size={14} className="text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">Scanning with elevated sensitivity for:</span>
            {activePopulations.map(mod => {
              const info = POPULATION_MODIFIERS.find(m => m.id === mod);
              return (
                <span key={mod} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {info?.shortLabel || mod}
                </span>
              );
            })}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="mt-6 grid lg:grid-cols-[320px,1fr] gap-6">
          {/* Categories Sidebar */}
          <div className="space-y-3">
            <h3 className={cn(
              'font-medium text-[11px] text-muted-foreground uppercase tracking-widest px-1',
              isVibe ? 'font-sans' : 'font-mono'
            )}>
              {isVibe ? 'Risk Categories' : 'harm_categories'}
            </h3>
            <div className="space-y-2">
              {result.categories.map(category => (
                <CategoryCard
                  key={category.category}
                  category={category}
                  isSelected={selectedCategory === category.category}
                  onClick={() => handleCategoryClick(category.category)}
                />
              ))}
            </div>
          </div>

          {/* Tabbed Content Panel */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <div className="flex items-center justify-between">
                <TabsList className={cn('bg-secondary/50', isVibe ? 'font-sans' : 'font-mono')}>
                  <TabsTrigger value="issues" className={cn('gap-2 text-xs', isVibe ? 'font-sans' : 'font-mono')}>
                    <Shield size={14} />
                    {isVibe ? 'Findings' : 'findings'}
                    <span className={cn('text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded', isVibe ? 'font-sans' : 'font-mono')}>
                      {result.issues.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="misuse" className={cn('gap-2 text-xs', isVibe ? 'font-sans' : 'font-mono')}>
                    <AlertTriangle size={14} />
                    {isVibe ? 'Misuse Scenarios' : 'misuse_scenarios'}
                    {criticalMisuseCount > 0 && (
                      <span className={cn('text-[10px] bg-[hsl(var(--ethics-critical))] text-white px-1.5 py-0.5 rounded', isVibe ? 'font-sans' : 'font-mono')}>
                        {criticalMisuseCount}
                      </span>
                    )}
                  </TabsTrigger>
                  {result.isForkAnalysis && result.forkSummary && (
                    <TabsTrigger value="fork" className={cn('gap-2 text-xs', isVibe ? 'font-sans' : 'font-mono')}>
                      <GitFork size={14} />
                      {isVibe ? 'Fork Analysis' : 'fork_analysis'}
                      {result.forkSummary.introducedCount > 0 && (
                        <span className={cn('text-[10px] bg-[hsl(var(--ethics-critical))] text-white px-1.5 py-0.5 rounded', isVibe ? 'font-sans' : 'font-mono')}>
                          {result.forkSummary.introducedCount}
                        </span>
                      )}
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="checklist" className={cn('gap-2 text-xs', isVibe ? 'font-sans' : 'font-mono')}>
                    <ClipboardCheck size={14} />
                    {isVibe ? 'Pre-Launch' : 'pre_launch'}
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'issues' && selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded hover:bg-primary/20 transition-colors',
                      isVibe ? 'font-sans' : 'font-mono'
                    )}
                  >
                    <Filter size={10} />
                    [{selectedCategoryLabel?.toUpperCase()}]
                    <X size={10} />
                  </button>
                )}
              </div>

              <TabsContent value="issues" className="mt-4">
                <IssuesList 
                  issues={result.issues} 
                  selectedCategory={selectedCategory}
                />
              </TabsContent>

              <TabsContent value="misuse" className="mt-4">
                <MisuseScenarios 
                  scenarios={misuseScenarios}
                  capabilities={capabilities}
                />
              </TabsContent>

              {result.isForkAnalysis && result.forkSummary && (
                <TabsContent value="fork" className="mt-4">
                  <ForkAnalysisTab
                    issues={result.issues}
                    forkSummary={result.forkSummary}
                  />
                </TabsContent>
              )}

              <TabsContent value="checklist" className="mt-4">
                <PreLaunchChecklist
                  categories={result.categories}
                  issues={result.issues}
                  timestamp={result.timestamp}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 relative z-[1]">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className={cn(
            'flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground',
            isVibe ? 'font-sans' : 'font-mono'
          )}>
            <p>
              {isVibe
                ? 'Identifies misuse-by-design patterns, not bugs or security vulnerabilities.'
                : '// identifies misuse-by-design patterns, not bugs or security vulnerabilities'}
            </p>
            <a 
              href="#" 
              className="text-primary hover:underline"
            >
              {isVibe ? 'Methodology' : 'methodology.md'}
            </a>
          </div>
        </div>
      </footer>

      <BadgeModal
        open={showBadgeModal}
        onOpenChange={setShowBadgeModal}
        score={Math.round(Math.max(0, Math.min(100, gfsScore)))}
        band={gfsBand}
      />
    </div>
  );
}
