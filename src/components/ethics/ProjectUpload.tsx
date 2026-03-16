import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileCode, X, FolderOpen, Loader2, Github, ArrowRight, Settings2, ChevronDown, ChevronRight, AlertCircle, Check, GitFork, Pencil, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { detectAppCategory, getAppCategoryLabel, AppCategory } from '@/services/categoryDetector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

export interface CustomRulesConfig {
  disabledCategories?: string[];
  elevatedCategories?: string[];
  customPatterns?: {
    name: string;
    description: string;
    category: string;
    severity: string;
  }[];
}

export type PopulationModifier =
  | 'minors'
  | 'financially-vulnerable'
  | 'mental-health'
  | 'domestic-abuse'
  | 'elderly';

export const POPULATION_MODIFIERS: { id: PopulationModifier; label: string; shortLabel: string }[] = [
  { id: 'minors', label: 'App may be used by minors (under 18)', shortLabel: 'Minors' },
  { id: 'financially-vulnerable', label: 'Users may be in financially vulnerable situations', shortLabel: 'Financially Vulnerable' },
  { id: 'mental-health', label: 'App addresses mental health or crisis situations', shortLabel: 'Mental Health' },
  { id: 'domestic-abuse', label: 'Users may be in domestic abuse or coercive control situations', shortLabel: 'Domestic Abuse' },
  { id: 'elderly', label: 'Elderly users are a primary audience', shortLabel: 'Elderly' },
];

interface ForkComparisonData {
  upstreamUrl: string;
  forkUrl: string;
  upstreamFiles: UploadedFile[];
  forkFiles: UploadedFile[];
  upstreamRepo: string;
  forkRepo: string;
}

interface ProjectUploadProps {
  onAnalyze: (files: UploadedFile[], projectName: string, customRules?: CustomRulesConfig, populationModifiers?: PopulationModifier[], forkData?: ForkComparisonData, categoryOverride?: AppCategory) => void;
  isAnalyzing: boolean;
  onShowOnboarding?: () => void;
}

const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte',
  '.html', '.css', '.scss', '.json', '.md',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift',
  '.c', '.cpp', '.h', '.php', '.dart', '.yaml', '.yml',
];

const CUSTOM_RULES_KEY = 'gfc-custom-rules';

const VALID_CATEGORIES = ['false-authority', 'manipulation', 'surveillance', 'admin-abuse', 'ai-hallucination'];
const VALID_SEVERITIES = ['safe', 'low', 'medium', 'high', 'critical'];

const DEFAULT_RULES = `{
  "disabledCategories": [],
  "elevatedCategories": [],
  "customPatterns": []
}`;

function validateCustomRules(jsonStr: string): { valid: boolean; parsed?: CustomRulesConfig; error?: string } {
  if (!jsonStr.trim()) return { valid: true, parsed: undefined };

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${(e as Error).message}` };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, error: 'Root must be a JSON object' };
  }

  if (parsed.disabledCategories !== undefined) {
    if (!Array.isArray(parsed.disabledCategories)) return { valid: false, error: '"disabledCategories" must be an array' };
    for (const cat of parsed.disabledCategories) {
      if (!VALID_CATEGORIES.includes(cat)) return { valid: false, error: `Invalid category "${cat}". Valid: ${VALID_CATEGORIES.join(', ')}` };
    }
  }

  if (parsed.elevatedCategories !== undefined) {
    if (!Array.isArray(parsed.elevatedCategories)) return { valid: false, error: '"elevatedCategories" must be an array' };
    for (const cat of parsed.elevatedCategories) {
      if (!VALID_CATEGORIES.includes(cat)) return { valid: false, error: `Invalid category "${cat}". Valid: ${VALID_CATEGORIES.join(', ')}` };
    }
  }

  if (parsed.customPatterns !== undefined) {
    if (!Array.isArray(parsed.customPatterns)) return { valid: false, error: '"customPatterns" must be an array' };
    for (let i = 0; i < parsed.customPatterns.length; i++) {
      const p = parsed.customPatterns[i];
      if (!p.name || typeof p.name !== 'string') return { valid: false, error: `customPatterns[${i}].name is required (string)` };
      if (p.name.length > 200) return { valid: false, error: `customPatterns[${i}].name exceeds 200 chars` };
      if (!p.description || typeof p.description !== 'string') return { valid: false, error: `customPatterns[${i}].description is required (string)` };
      if (p.description.length > 1000) return { valid: false, error: `customPatterns[${i}].description exceeds 1000 chars` };
      if (!VALID_CATEGORIES.includes(p.category)) return { valid: false, error: `customPatterns[${i}].category "${p.category}" invalid` };
      if (!VALID_SEVERITIES.includes(p.severity)) return { valid: false, error: `customPatterns[${i}].severity "${p.severity}" invalid` };
    }
    if (parsed.customPatterns.length > 20) return { valid: false, error: 'Maximum 20 custom patterns allowed' };
  }

  return { valid: true, parsed: parsed as CustomRulesConfig };
}

const QUIZ_STORAGE_KEY = 'gfc-category-quiz';

interface QuizAnswers {
  minors: boolean;
  location: boolean;
  social: boolean;
  health: boolean;
  finance: boolean;
  domesticAbuse: boolean;
  elderly: boolean;
}

const DEFAULT_QUIZ: QuizAnswers = { minors: false, location: false, social: false, health: false, finance: false, domesticAbuse: false, elderly: false };

const QUIZ_QUESTIONS: { key: keyof QuizAnswers; label: string }[] = [
  { key: 'minors', label: 'Could minors (under 18) use this app?' },
  { key: 'location', label: 'Does the app involve location data?' },
  { key: 'social', label: 'Does it connect users with each other (messaging, matching, social)?' },
  { key: 'health', label: 'Does it involve health, mental health, or body data?' },
  { key: 'finance', label: 'Does it involve money, credit, or financial decisions?' },
  { key: 'domesticAbuse', label: 'Could users be in domestic abuse or coercive control situations?' },
  { key: 'elderly', label: 'Are elderly users a primary audience?' },
];

function getQuizElevations(answers: QuizAnswers): { elevatedCategories: string[]; populationMods: PopulationModifier[]; verticalProfiles: string[] } {
  const cats = new Set<string>();
  const pops: PopulationModifier[] = [];
  const verticals: string[] = [];

  if (answers.minors) pops.push('minors');
  if (answers.location) cats.add('surveillance');
  if (answers.social) { cats.add('manipulation'); cats.add('surveillance'); }
  if (answers.health) { cats.add('false-authority'); cats.add('ai-hallucination'); verticals.push('health'); pops.push('mental-health'); }
  if (answers.finance) { cats.add('dark-patterns'); verticals.push('fintech'); pops.push('financially-vulnerable'); }
  if (answers.domesticAbuse) { cats.add('surveillance'); pops.push('domestic-abuse'); }
  if (answers.elderly) pops.push('elderly');

  return { elevatedCategories: Array.from(cats), populationMods: pops, verticalProfiles: verticals };
}
const CATEGORY_OVERRIDE_KEY = 'gfc-category-override';
const ALL_CATEGORIES: AppCategory[] = ['fitness', 'dating', 'fintech', 'health', 'productivity', 'social', 'b2b', 'gaming', 'general'];

export function ProjectUpload({ onAnalyze, isAnalyzing, onShowOnboarding }: ProjectUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'github' | 'fork'>('upload');
  const [upstreamUrl, setUpstreamUrl] = useState('');
  const [forkUrl, setForkUrl] = useState('');
  const [isFetchingFork, setIsFetchingFork] = useState(false);
  const [forkStatus, setForkStatus] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customRulesText, setCustomRulesText] = useState(() => {
    try { return sessionStorage.getItem(CUSTOM_RULES_KEY) || DEFAULT_RULES; } catch { return DEFAULT_RULES; }
  });
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>(() => {
    try {
      const stored = sessionStorage.getItem(QUIZ_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_QUIZ;
    } catch { return DEFAULT_QUIZ; }
  });
  const [rulesValidation, setRulesValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
  const [categoryOverride, setCategoryOverride] = useState<AppCategory | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Validate on change
  useEffect(() => {
    const result = validateCustomRules(customRulesText);
    setRulesValidation({ valid: result.valid, error: result.error });
  }, [customRulesText]);

  // Persist quiz answers
  useEffect(() => {
    try { sessionStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizAnswers)); } catch { /* ignore */ }
  }, [quizAnswers]);

  // Persist to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(CUSTOM_RULES_KEY, customRulesText); } catch { /* ignore */ }
  }, [customRulesText]);

  // Auto-detect category when files change
  const detectedCategory = useMemo<AppCategory>(() => {
    if (files.length === 0) return 'unknown';
    return detectAppCategory(files);
  }, [files]);

  const activeCategory = categoryOverride || (detectedCategory !== 'unknown' ? detectedCategory : null);

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
      if (file.size > 500000) continue;

      try {
        const content = await file.text();
        newFiles.push({
          name: file.webkitRelativePath || file.name,
          content,
          size: file.size,
        });
      } catch (e) {
        console.error('Failed to read file:', file.name, e);
      }
    }

    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const unique = newFiles.filter(f => !existing.has(f.name));
      return [...prev, ...unique];
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleFetchGithub = async () => {
    if (!githubUrl.trim()) {
      toast.error('Please enter a GitHub URL');
      return;
    }

    setIsFetchingGithub(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-github-repo', {
        body: { url: githubUrl },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setFiles(data.files);
      setProjectName(data.repoName);
      const sizeNote = data.sizeLimitReached ? ' (content size limit reached)' : '';
      toast.success(`Fetched ${data.fileCount} files from ${data.owner}/${data.repoName}`, {
        description: data.totalFiles > data.fileCount 
          ? `Analyzing ${data.fileCount} of ${data.totalFiles} eligible files${sizeNote}`
          : undefined,
      });
    } catch (err) {
      console.error('GitHub fetch error:', err);
      toast.error('Failed to fetch repository', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const handleFetchFork = async () => {
    if (!upstreamUrl.trim() || !forkUrl.trim()) {
      toast.error('Please enter both upstream and fork URLs');
      return;
    }

    setIsFetchingFork(true);
    setForkStatus('Fetching upstream repo...');
    try {
      // Fetch upstream
      const { data: upstreamData, error: upstreamError } = await supabase.functions.invoke('fetch-github-repo', {
        body: { url: upstreamUrl },
      });
      if (upstreamError || upstreamData?.error) throw new Error(upstreamData?.error || upstreamError?.message || 'Failed to fetch upstream');

      setForkStatus('Fetching fork repo...');
      // Fetch fork
      const { data: forkData, error: forkError } = await supabase.functions.invoke('fetch-github-repo', {
        body: { url: forkUrl },
      });
      if (forkError || forkData?.error) throw new Error(forkData?.error || forkError?.message || 'Failed to fetch fork');

      setFiles(forkData.files);
      setProjectName(`${forkData.repoName} (fork comparison)`);

      toast.success(`Fetched both repos`, {
        description: `Upstream: ${upstreamData.fileCount} files, Fork: ${forkData.fileCount} files`,
      });

      // Trigger analysis with fork data
      const validation = validateCustomRules(customRulesText);
      const quizElev = getQuizElevations(quizAnswers);
      const mergedElevated = Array.from(new Set([
        ...(showAdvanced && validation.valid && validation.parsed?.elevatedCategories || []),
        ...quizElev.elevatedCategories,
      ]));
      const mergedPopulations = Array.from(new Set([...quizElev.populationMods])) as PopulationModifier[];
      const customRules: CustomRulesConfig | undefined = mergedElevated.length > 0 || (showAdvanced && validation.valid && validation.parsed)
        ? { ...(showAdvanced && validation.valid ? validation.parsed : {}), elevatedCategories: mergedElevated }
        : undefined;
      const populations = mergedPopulations.length > 0 ? mergedPopulations : undefined;
      const forkComparisonData: ForkComparisonData = {
        upstreamUrl,
        forkUrl,
        upstreamFiles: upstreamData.files,
        forkFiles: forkData.files,
        upstreamRepo: `${upstreamData.owner}/${upstreamData.repoName}`,
        forkRepo: `${forkData.owner}/${forkData.repoName}`,
      };
      onAnalyze(forkData.files, forkData.repoName, customRules, populations, forkComparisonData, activeCategory || undefined);
    } catch (err) {
      console.error('Fork fetch error:', err);
      toast.error('Failed to fetch repositories', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsFetchingFork(false);
      setForkStatus('');
    }
  };

  const handleAnalyze = () => {
    if (files.length > 0) {
      const validation = validateCustomRules(customRulesText);
      const baseRules = showAdvanced && validation.valid ? validation.parsed : undefined;

      // Merge quiz elevations into custom rules
      const quizElev = getQuizElevations(quizAnswers);
      const mergedElevated = Array.from(new Set([
        ...(baseRules?.elevatedCategories || []),
        ...quizElev.elevatedCategories,
      ]));
      const mergedPopulations = Array.from(new Set([
        ...quizElev.populationMods,
      ])) as PopulationModifier[];

      const customRules: CustomRulesConfig | undefined = mergedElevated.length > 0 || baseRules
        ? { ...baseRules, elevatedCategories: mergedElevated }
        : undefined;
      const populations = mergedPopulations.length > 0 ? mergedPopulations : undefined;
      onAnalyze(files, projectName || 'Uploaded Project', customRules, populations, undefined, activeCategory || undefined);
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasCustomRulesContent = (() => {
    try {
      const parsed = JSON.parse(customRulesText);
      return (parsed.disabledCategories?.length > 0) || (parsed.elevatedCategories?.length > 0) || (parsed.customPatterns?.length > 0);
    } catch { return false; }
  })();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <FileCode className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            Ethical Code Review
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload your project files or import from GitHub to analyze for ethical concerns, potential misuse scenarios, and dark patterns.
          </p>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex items-center justify-center gap-2 p-1 bg-secondary/50 rounded-lg w-fit mx-auto">
          <button
            onClick={() => setInputMode('upload')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              inputMode === 'upload' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-2">
              <Upload size={16} />
              Upload Files
            </span>
          </button>
          <button
            onClick={() => setInputMode('github')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              inputMode === 'github' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-2">
              <Github size={16} />
              GitHub
            </span>
          </button>
          <button
            onClick={() => setInputMode('fork')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              inputMode === 'fork' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-2">
              <GitFork size={16} />
              Fork Comparison
            </span>
          </button>
        </div>

        {/* Project Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Project Name
          </label>
          <Input
            placeholder="e.g., Social Connect App"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-card"
          />
        </div>

        {inputMode === 'fork' ? (
          /* Fork Comparison */
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Upstream Repository URL
              </label>
              <Input
                placeholder="https://github.com/original-org/repo"
                value={upstreamUrl}
                onChange={(e) => setUpstreamUrl(e.target.value)}
                className="bg-card"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Your Fork URL
              </label>
              <Input
                placeholder="https://github.com/your-username/repo"
                value={forkUrl}
                onChange={(e) => setForkUrl(e.target.value)}
                className="bg-card"
              />
            </div>
            <Button
              onClick={handleFetchFork}
              disabled={isFetchingFork || !upstreamUrl.trim() || !forkUrl.trim()}
              className="w-full gap-2"
            >
              {isFetchingFork ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {forkStatus || 'Fetching...'}
                </>
              ) : (
                <>
                  <GitFork size={16} />
                  Compare Fork Against Upstream
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Both must be public repos. We'll fetch and diff both, then classify each issue as inherited, introduced, or remediated.
            </p>
          </div>
        ) : inputMode === 'github' ? (
          /* GitHub Import */
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                GitHub Repository URL
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="bg-card flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchGithub()}
                />
                <Button
                  onClick={handleFetchGithub}
                  disabled={isFetchingGithub || !githubUrl.trim()}
                  className="gap-2"
                >
                  {isFetchingGithub ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  Fetch
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Works with public repositories. We'll fetch up to 50 source files from the src folder.
              </p>
            </div>
          </div>
        ) : (
          /* Drop Zone */
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 transition-all duration-200',
              'flex flex-col items-center justify-center gap-4',
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className={cn('w-6 h-6', isDragging ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports .ts, .tsx, .js, .jsx, .vue, .html, .css, .json files
              </p>
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild>
                  <span className="gap-2">
                    <FileCode size={14} />
                    Select Files
                  </span>
                </Button>
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  // @ts-ignore - webkitdirectory is non-standard but widely supported
                  webkitdirectory=""
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild>
                  <span className="gap-2">
                    <FolderOpen size={14} />
                    Select Folder
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
                <span className="text-muted-foreground ml-2">({formatSize(totalSize)})</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between py-1.5 px-3 bg-secondary/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode size={14} className="shrink-0 text-muted-foreground" />
                    <span className="truncate text-foreground">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(file.name)}
                    className="shrink-0 p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detected Category */}
        {files.length > 0 && (
          <div className="border border-border rounded-lg bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-primary" />
                <span className="text-sm font-medium text-foreground">App Category</span>
              </div>
              {detectedCategory !== 'unknown' && !categoryOverride && (
                <span className="text-[10px] text-muted-foreground">Auto-detected</span>
              )}
              {categoryOverride && (
                <button
                  onClick={() => setCategoryOverride(null)}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline"
                >
                  Reset to auto-detect
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditingCategory ? (
                <Select
                  value={activeCategory || 'general'}
                  onValueChange={(val) => {
                    setCategoryOverride(val as AppCategory);
                    setIsEditingCategory(false);
                  }}
                >
                  <SelectTrigger className="h-8 text-sm w-auto min-w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-sm">
                        {getAppCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <button
                  onClick={() => setIsEditingCategory(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  {activeCategory ? getAppCategoryLabel(activeCategory) : 'None detected — select manually'}
                  <Pencil size={12} />
                </button>
              )}
            </div>
            {activeCategory === 'general' && (
              <p className="text-xs text-muted-foreground">
                No vertical risk profile will be applied. The scanner will use its base prompt only.
              </p>
            )}
            {activeCategory && activeCategory !== 'general' && activeCategory !== 'unknown' && (
              <p className="text-xs text-muted-foreground">
                Vertical risk profile for <span className="font-medium text-foreground">{getAppCategoryLabel(activeCategory)}</span> will be applied during scanning.
              </p>
            )}
          </div>
        )}


        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card"
          >
            <span className="flex items-center gap-2">
              <Settings2 size={14} />
              Advanced: Custom Rules
              {hasCustomRulesContent && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Active</span>
              )}
            </span>
            {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 pt-2 bg-card border-t border-border/50 space-y-3">
              <p className="text-xs text-muted-foreground">
                Configure custom scan rules as JSON. Disable or elevate categories, and add custom patterns to detect.
              </p>
              <div className="relative">
                <textarea
                  value={customRulesText}
                  onChange={(e) => setCustomRulesText(e.target.value)}
                  spellCheck={false}
                  className={cn(
                    'w-full h-48 px-4 py-3 rounded-lg border font-mono text-xs leading-relaxed resize-y',
                    'bg-background text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50',
                    rulesValidation.valid
                      ? 'border-border'
                      : 'border-[hsl(var(--ethics-high))] bg-[hsl(var(--ethics-high-bg))]'
                  )}
                />
                {/* Validation indicator */}
                <div className="absolute top-2 right-2">
                  {rulesValidation.valid ? (
                    <span className="flex items-center gap-1 text-xs text-[hsl(var(--ethics-safe))]">
                      <Check size={12} />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-[hsl(var(--ethics-high))]">
                      <AlertCircle size={12} />
                    </span>
                  )}
                </div>
              </div>
              {!rulesValidation.valid && rulesValidation.error && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-[hsl(var(--ethics-high-bg))] border border-[hsl(var(--ethics-high)/0.3)]">
                  <AlertCircle size={12} className="shrink-0 mt-0.5 text-[hsl(var(--ethics-high))]" />
                  <p className="text-xs text-[hsl(var(--ethics-high))]">{rulesValidation.error}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCustomRulesText(DEFAULT_RULES)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset to defaults
                </button>
                <p className="text-xs text-muted-foreground">
                  Max 20 custom patterns
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Context Quiz */}
        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Quick Context Quiz
            </label>
            <p className="text-xs text-muted-foreground">
              Answer these to automatically tune the scan for your app's context.
            </p>
          </div>
          <div className="space-y-2">
            {QUIZ_QUESTIONS.map(q => (
              <button
                key={q.key}
                type="button"
                onClick={() => setQuizAnswers(prev => ({ ...prev, [q.key]: !prev[q.key] }))}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all text-left',
                  quizAnswers[q.key]
                    ? 'bg-primary/8 border-primary/30 text-foreground'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                )}
              >
                <span>{q.label}</span>
                <span className={cn(
                  'shrink-0 ml-3 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                  quizAnswers[q.key]
                    ? 'bg-primary/15 text-primary'
                    : 'bg-secondary text-muted-foreground'
                )}>
                  {quizAnswers[q.key] ? 'Yes' : 'No'}
                </span>
              </button>
            ))}
          </div>

          {/* Scan config summary */}
          {(() => {
            const elev = getQuizElevations(quizAnswers);
            const allCats = Array.from(new Set([...elev.elevatedCategories]));
            const allPops = Array.from(new Set([...elev.populationMods]));
            const hasSomething = allCats.length > 0 || allPops.length > 0 || activeCategory;
            if (!hasSomething) return null;
            return (
              <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Scanning with: </span>
                  {activeCategory && (
                    <span className="font-medium">[{getAppCategoryLabel(activeCategory)}]</span>
                  )}
                  {activeCategory && (allCats.length > 0 || allPops.length > 0) && <span> | </span>}
                  {allCats.length > 0 && (
                    <span>{allCats.map(c => c.replace('-', ' ')).join(', ')}</span>
                  )}
                  {allCats.length > 0 && allPops.length > 0 && <span> | </span>}
                  {allPops.length > 0 && (
                    <span>{allPops.join(', ')}</span>
                  )}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={files.length === 0 || isAnalyzing || (showAdvanced && !rulesValidation.valid)}
          className="w-full gap-2"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyzing Code...
            </>
          ) : (
            <>
              <FileCode size={18} />
              Analyze for Ethical Issues
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Your code is analyzed securely and not stored. Analysis powered by AI.
        </p>
        {onShowOnboarding && (
          <button
            onClick={() => {
              localStorage.removeItem('gfc_onboarding_complete');
              onShowOnboarding();
            }}
            className="text-xs text-center text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors w-full"
          >
            Show intro again
          </button>
        )}
      </div>
    </div>
  );
}
