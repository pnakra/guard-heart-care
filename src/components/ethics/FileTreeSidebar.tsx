import { useState, useMemo } from 'react';
import { EthicsIssue, SeverityLevel } from '@/types/ethics';
import { ChevronRight, ChevronDown, FileCode, FolderOpen, Folder, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FileTreeSidebarProps {
  issues: EthicsIssue[];
  selectedFile: string | null;
  onSelectFile: (file: string | null) => void;
}

interface FileNode {
  name: string;
  fullPath: string;
  isDir: boolean;
  children: FileNode[];
  issueCount: number;
  highestSeverity: SeverityLevel;
}

const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  critical: 5, high: 4, medium: 3, low: 2, safe: 1,
};

function getHigherSeverity(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

const SEVERITY_DOT: Record<SeverityLevel, string> = {
  critical: 'bg-[hsl(var(--ethics-critical))]',
  high: 'bg-[hsl(var(--ethics-high))]',
  medium: 'bg-[hsl(var(--ethics-medium))]',
  low: 'bg-[hsl(var(--ethics-low))]',
  safe: 'bg-muted-foreground/30',
};

function extractFileFromLocation(location: string): string | null {
  if (!location) return null;
  // Remove line number suffix like :42
  return location.replace(/:\d+$/, '');
}

function buildFileTree(issues: EthicsIssue[]): { tree: FileNode[]; fileMap: Map<string, { count: number; severity: SeverityLevel }> } {
  const fileMap = new Map<string, { count: number; severity: SeverityLevel }>();

  for (const issue of issues) {
    const file = extractFileFromLocation(issue.location || '');
    if (!file) continue;
    const existing = fileMap.get(file);
    if (existing) {
      existing.count++;
      existing.severity = getHigherSeverity(existing.severity, issue.severity);
    } else {
      fileMap.set(file, { count: 1, severity: issue.severity });
    }
  }

  // Build tree from flat paths
  const root: FileNode[] = [];

  for (const [filePath, info] of fileMap) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join('/');

      let existing = current.find(n => n.name === part);
      if (!existing) {
        existing = {
          name: part,
          fullPath,
          isDir: !isFile,
          children: [],
          issueCount: isFile ? info.count : 0,
          highestSeverity: isFile ? info.severity : 'safe',
        };
        current.push(existing);
      }
      if (!isFile) {
        // Update dir severity
        existing.highestSeverity = getHigherSeverity(existing.highestSeverity, info.severity);
        existing.issueCount += info.count;
      }
      current = existing.children;
    }
  }

  return { tree: root, fileMap };
}

function TreeNode({
  node,
  depth,
  selectedFile,
  onSelectFile,
  collapsed,
}: {
  node: FileNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (file: string | null) => void;
  collapsed: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = !node.isDir && selectedFile === node.fullPath;

  if (collapsed) {
    // In collapsed mode, only show dots for files
    if (node.isDir) {
      return (
        <>
          {node.children.map(child => (
            <TreeNode
              key={child.fullPath}
              node={child}
              depth={depth}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              collapsed
            />
          ))}
        </>
      );
    }
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectFile(isSelected ? null : node.fullPath)}
              className={cn(
                'w-full flex justify-center py-1',
                isSelected && 'bg-primary/10'
              )}
            >
              <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', SEVERITY_DOT[node.highestSeverity])} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            {node.fullPath} ({node.issueCount})
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-1.5 py-1 px-2 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          {isOpen ? <FolderOpen size={12} className="text-primary/60" /> : <Folder size={12} className="text-primary/40" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children.map(child => (
          <TreeNode
            key={child.fullPath}
            node={child}
            depth={depth + 1}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
            collapsed={false}
          />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onSelectFile(isSelected ? null : node.fullPath)}
            className={cn(
              'w-full flex items-center gap-1.5 py-1 px-2 text-xs font-mono transition-colors group',
              isSelected
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <span className={cn('w-2 h-2 rounded-full shrink-0', SEVERITY_DOT[node.highestSeverity])} />
            <FileCode size={12} className="shrink-0 opacity-50" />
            <span className="truncate flex-1 text-left">{node.name}</span>
            <span className={cn(
              'shrink-0 font-mono text-[9px] px-1.5 py-0.5 rounded',
              isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
            )}>
              {node.issueCount}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-mono text-xs max-w-xs">
          {node.fullPath}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function FileTreeSidebar({ issues, selectedFile, onSelectFile }: FileTreeSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { tree } = useMemo(() => buildFileTree(issues), [issues]);
  const totalFiles = useMemo(() => {
    const files = new Set<string>();
    issues.forEach(i => {
      const f = extractFileFromLocation(i.location || '');
      if (f) files.add(f);
    });
    return files.size;
  }, [issues]);

  return (
    <div
      className={cn(
        'border-r border-border bg-card/50 flex flex-col shrink-0 transition-all duration-200 overflow-hidden',
        collapsed ? 'w-8' : 'w-60'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-border shrink-0',
        collapsed ? 'justify-center py-2' : 'justify-between px-3 py-2'
      )}>
        {!collapsed && (
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            files ({totalFiles})
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* All Files option */}
      {!collapsed ? (
        <button
          onClick={() => onSelectFile(null)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono transition-colors border-b border-border/50',
            selectedFile === null
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          All Files
        </button>
      ) : (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectFile(null)}
                className={cn(
                  'w-full flex justify-center py-1.5 border-b border-border/50',
                  selectedFile === null && 'bg-primary/10'
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs">All Files</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {tree.map(node => (
          <TreeNode
            key={node.fullPath}
            node={node}
            depth={0}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}
