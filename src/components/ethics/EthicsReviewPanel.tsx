import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PopulationModifier, POPULATION_MODIFIERS } from './ProjectUpload';
import { EthicsReviewResult, HarmCategory } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';
import { ExecutiveSummary } from './ExecutiveSummary';
import { CategoryCard } from './CategoryCard';
import { IssuesList } from './IssuesList';
import { MisuseScenarios } from './MisuseScenarios';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { RefreshCw, Filter, AlertTriangle, Shield, Download, FileText, FileJson, FileType, Sparkles, X, BookOpen, Users } from 'lucide-react';
import { exportReport, generateLovablePrompt, copyToClipboard } from '@/utils/exportReport';
import { toast } from 'sonner';

interface EthicsReviewPanelProps {
  result: EthicsReviewResult;
  capabilities: DetectedCapability[];
  misuseScenarios: MisuseScenario[];
  activePopulations?: PopulationModifier[];
  onRescan?: () => void;
  onPublish?: () => void;
}

export function EthicsReviewPanel({ 
  result, 
  capabilities, 
  misuseScenarios,
  activePopulations = [],
  onRescan,
  onPublish 
}: EthicsReviewPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<HarmCategory | null>(null);
  const [activeTab, setActiveTab] = useState<'issues' | 'misuse'>('issues');

  const handleCategoryClick = (category: HarmCategory) => {
    setSelectedCategory(prev => prev === category ? null : category);
    setActiveTab('issues');
  };

  const selectedCategoryLabel = selectedCategory
    ? result.categories.find(c => c.category === selectedCategory)?.label
    : null;

  const criticalMisuseCount = misuseScenarios.filter(s => s.severity === 'critical').length;

  const handleExport = (format: 'markdown' | 'json' | 'pdf') => {
    exportReport({ result, capabilities, misuseScenarios }, format);
    toast.success(`Report exported as ${format.toUpperCase()}`, {
      description: `Your misuse-by-design scan has been downloaded.`,
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
    <div className="min-h-screen bg-background scan-lines">
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
                <h1 className="font-mono text-lg font-semibold text-foreground tracking-tight">
                  gfc-scanner <span className="text-primary">v2.0</span>
                </h1>
                <p className="font-mono text-[10px] text-muted-foreground tracking-wide">
                  misuse-by-design detection
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                to="/taxonomy"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-secondary/50 transition-colors"
              >
                <BookOpen size={12} />
                Taxonomy v1.0
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRescan}
                className="gap-2"
              >
                <RefreshCw size={14} />
                Rescan
              </Button>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyFixPrompt} className="gap-2">
                    <Sparkles size={14} />
                    Copy Fix Prompt for Lovable
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
        {/* Executive Summary - New component */}
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
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide px-1">
              Harm Categories
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
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'issues' | 'misuse')}>
              <div className="flex items-center justify-between">
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="issues" className="gap-2">
                    <Shield size={14} />
                    Findings
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      {result.issues.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="misuse" className="gap-2">
                    <AlertTriangle size={14} />
                    Misuse Scenarios
                    {criticalMisuseCount > 0 && (
                      <span className="text-xs bg-[hsl(var(--ethics-critical))] text-white px-1.5 py-0.5 rounded-full">
                        {criticalMisuseCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'issues' && selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors"
                  >
                    <Filter size={10} />
                    {selectedCategoryLabel}
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
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              This scanner identifies misuse-by-design patterns, not bugs or security vulnerabilities.
            </p>
            <a 
              href="#" 
              className="text-primary hover:underline"
            >
              Learn about our methodology
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
