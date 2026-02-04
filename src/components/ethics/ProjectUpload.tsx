import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileCode, X, FolderOpen, Loader2, Github, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

interface ProjectUploadProps {
  onAnalyze: (files: UploadedFile[], projectName: string) => void;
  isAnalyzing: boolean;
}

const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte',
  '.html', '.css', '.scss', '.json', '.md'
];

export function ProjectUpload({ onAnalyze, isAnalyzing }: ProjectUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'github'>('upload');

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
      if (file.size > 500000) continue; // Skip files > 500KB

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
      toast.success(`Fetched ${data.fileCount} files from ${data.owner}/${data.repoName}`, {
        description: data.totalFiles > data.fileCount 
          ? `Showing first ${data.fileCount} of ${data.totalFiles} files`
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

  const handleAnalyze = () => {
    if (files.length > 0) {
      onAnalyze(files, projectName || 'Uploaded Project');
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
              Import from GitHub
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

        {inputMode === 'github' ? (
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

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={files.length === 0 || isAnalyzing}
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
      </div>
    </div>
  );
}
