// Helpers for calling Supabase edge functions with the shared access token and
// for surfacing the clear error messages the functions return on 401/429.

/** Header sent with every edge-function call. Empty when no token is configured. */
export function edgeFunctionHeaders(): Record<string, string> {
  const token = import.meta.env.VITE_SCAN_ACCESS_TOKEN as string | undefined;
  return token ? { "x-ethiscan-token": token } : {};
}

/**
 * supabase.functions.invoke surfaces non-2xx responses as a FunctionsHttpError
 * whose `.message` is generic. The edge functions put a human-readable reason in
 * the JSON body (e.g. rate-limit text), so pull that out when present.
 */
export async function extractEdgeError(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = (await context.json()) as { error?: string } | null;
      if (body?.error) return body.error;
    } catch {
      /* body was not JSON or already consumed */
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
