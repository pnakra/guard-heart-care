import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.html', '.css', '.scss', '.json'];
const MAX_FILE_SIZE = 500000; // 500KB per file
const MAX_FILES = 50;

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string;
}

function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  // Support formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo/tree/branch
  // github.com/owner/repo
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

async function fetchRepoTree(owner: string, repo: string, branch?: string): Promise<GitHubFile[]> {
  // First, get the default branch if not specified
  let targetBranch = branch;
  if (!targetBranch) {
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'User-Agent': 'Lovable-Ethics-Scanner' },
    });
    if (!repoResponse.ok) {
      throw new Error(`Repository not found or not accessible: ${owner}/${repo}`);
    }
    const repoData = await repoResponse.json();
    targetBranch = repoData.default_branch;
  }

  // Get the tree recursively
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
    { headers: { 'User-Agent': 'Lovable-Ethics-Scanner' } }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch repository tree: ${treeResponse.status}`);
  }

  const treeData = await treeResponse.json();
  return treeData.tree || [];
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
      { headers: { 'User-Agent': 'Lovable-Ethics-Scanner' } }
    );
    if (!response.ok) return null;
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
    const tree = await fetchRepoTree(owner, repo, branch);

    // Filter to allowed file types and prioritize src folder
    const candidateFiles = tree.filter((file: any) => {
      if (file.type !== 'blob') return false;
      const ext = '.' + file.path.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
      if (file.size && file.size > MAX_FILE_SIZE) return false;
      // Skip node_modules, dist, build, etc.
      if (file.path.includes('node_modules/')) return false;
      if (file.path.includes('dist/')) return false;
      if (file.path.includes('build/')) return false;
      if (file.path.includes('.next/')) return false;
      if (file.path.includes('coverage/')) return false;
      return true;
    });

    // Prioritize src folder files
    const sortedFiles = candidateFiles.sort((a: any, b: any) => {
      const aInSrc = a.path.startsWith('src/') ? 0 : 1;
      const bInSrc = b.path.startsWith('src/') ? 0 : 1;
      return aInSrc - bInSrc;
    });

    // Limit to MAX_FILES
    const filesToFetch = sortedFiles.slice(0, MAX_FILES);

    // Fetch file contents in parallel (batch of 10 at a time to avoid rate limits)
    const files: { name: string; content: string; size: number }[] = [];
    
    for (let i = 0; i < filesToFetch.length; i += 10) {
      const batch = filesToFetch.slice(i, i + 10);
      const results = await Promise.all(
        batch.map(async (file: any) => {
          const content = await fetchFileContent(owner, repo, file.path);
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
      files.push(...results.filter((f): f is NonNullable<typeof f> => f !== null));
    }

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No analyzable files found in repository" }),
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
