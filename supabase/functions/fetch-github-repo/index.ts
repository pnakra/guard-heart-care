import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.html', '.css', '.scss', '.json'];
const MAX_FILE_SIZE = 500000; // 500KB per file
const MAX_FILES = 50;
const MAX_TOTAL_CONTENT_SIZE = 800000; // ~800KB total to stay within AI context limits

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string;
}

function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  const patterns = [
    /(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+?)(?:\/tree\/([^\/]+))?(?:\/.*)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
        branch: match[3],
      };
    }
  }
  return null;
}

async function fetchRepoTree(owner: string, repo: string, branch?: string): Promise<{ files: GitHubFile[]; resolvedBranch: string }> {
  let targetBranch = branch;
  if (!targetBranch) {
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'User-Agent': 'Lovable-Ethics-Scanner' },
    });
    if (!repoResponse.ok) {
      const body = await repoResponse.text();
      if (repoResponse.status === 403 && body.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded. Please wait a few minutes and try again.');
      }
      if (repoResponse.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}. Make sure it's a public repository.`);
      }
      throw new Error(`Failed to access repository: ${owner}/${repo} (HTTP ${repoResponse.status})`);
    }
    const repoData = await repoResponse.json();
    targetBranch = repoData.default_branch;
  }

  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
    { headers: { 'User-Agent': 'Lovable-Ethics-Scanner' } }
  );

  if (!treeResponse.ok) {
    const body = await treeResponse.text();
    if (treeResponse.status === 403 && body.includes('rate limit')) {
      throw new Error('GitHub API rate limit exceeded. Please wait a few minutes and try again.');
    }
    throw new Error(`Failed to fetch repository tree (HTTP ${treeResponse.status})`);
  }

  const treeData = await treeResponse.json();
  return { files: treeData.tree || [], resolvedBranch: targetBranch! };
}

async function fetchFileContent(owner: string, repo: string, path: string, branch: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
      { headers: { 'User-Agent': 'Lovable-Ethics-Scanner' } }
    );
    if (!response.ok) {
      await response.text(); // consume body
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: "GitHub URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { owner, repo, branch } = parsed;

    // Fetch the repository tree
    const { files: tree, resolvedBranch } = await fetchRepoTree(owner, repo, branch);

    // Filter to allowed file types
    const SKIP_PATTERNS = [
      'node_modules/', 'dist/', 'build/', '.next/', 'coverage/',
      '__tests__/', '.test.', '.spec.', 'test/fixtures/',
      'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'fixtures/', '.d.ts', '.min.js', '.min.css',
    ];
    const candidateFiles = tree.filter((file: any) => {
      if (file.type !== 'blob') return false;
      const ext = '.' + file.path.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
      if (file.size && file.size > MAX_FILE_SIZE) return false;
      if (SKIP_PATTERNS.some(p => file.path.includes(p))) return false;
      return true;
    });

    // Prioritize: src/ > app/ > lib/ > components/ > pages/ > rest
    const sortedFiles = candidateFiles.sort((a: any, b: any) => {
      const aInSrc = a.path.startsWith('src/') ? 0 : 1;
      const bInSrc = b.path.startsWith('src/') ? 0 : 1;
      if (aInSrc !== bInSrc) return aInSrc - bInSrc;
      return (a.size || 0) - (b.size || 0);
    });

    const filesToFetch = sortedFiles.slice(0, MAX_FILES);

    // Fetch file contents in parallel with total size tracking
    const files: { name: string; content: string; size: number }[] = [];
    let totalContentSize = 0;
    let reachedSizeLimit = false;
    
    for (let i = 0; i < filesToFetch.length && !reachedSizeLimit; i += 10) {
      const batch = filesToFetch.slice(i, i + 10);
      const results = await Promise.all(
        batch.map(async (file: any) => {
          const content = await fetchFileContent(owner, repo, file.path, resolvedBranch);
          if (content) {
            return {
              name: file.path,
              content,
              size: content.length,
            };
          }
          return null;
        })
      );

      for (const f of results) {
        if (!f) continue;
        if (totalContentSize + f.size > MAX_TOTAL_CONTENT_SIZE) {
          reachedSizeLimit = true;
          break;
        }
        files.push(f);
        totalContentSize += f.size;
      }
    }

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No analyzable files found in repository. Make sure the repo is public and contains source files." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        files,
        repoName: repo,
        owner,
        fileCount: files.length,
        totalFiles: candidateFiles.length,
        sizeLimitReached: reachedSizeLimit,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-github-repo error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
