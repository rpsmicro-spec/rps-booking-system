/**
 * Network failure classification for the offline paths.
 *
 * Only failures where the request may never have reached the server (or its
 * response never came back) count as "network" errors: fetch() rejecting,
 * our timeout firing, a gateway saying the upstream is unreachable, or the
 * body stream dying mid-read. A 4xx/500 from our own API is an answer, not a
 * network failure, and must surface as a normal error.
 *
 * Callers that fall back to an offline queue on a NetworkError MUST send an
 * idempotency key with the original request, because "network error" also
 * covers "the server did the work but the response was lost".
 */

export class NetworkError extends Error {
  constructor(message = "Network request failed", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "NetworkError";
  }
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/** Gateway statuses: the upstream may or may not have processed the request. */
const GATEWAY_STATUSES = new Set([502, 503, 504]);

export const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * fetch() with a timeout. Rejects with NetworkError when the network fails,
 * the timeout fires, or a gateway status comes back. Resolves with the
 * Response for every other status (including 4xx/500) — callers decide.
 * A caller-supplied signal that aborts is rethrown as-is (not a NetworkError).
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const outer = init.signal;
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener("abort", onOuterAbort, { once: true });
  }

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (GATEWAY_STATUSES.has(response.status)) {
      throw new NetworkError(`Server unreachable (HTTP ${response.status})`);
    }
    return response;
  } catch (error) {
    if (error instanceof NetworkError) throw error;
    if (outer?.aborted && !timedOut) throw error;
    throw new NetworkError(
      timedOut ? "Request timed out" : "Network request failed",
      { cause: error }
    );
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", onOuterAbort);
  }
}

/**
 * Read a JSON body; a stream that dies mid-read is a network failure (the
 * server already answered, so this is exactly the "lost response" case).
 * Unparseable JSON resolves to null.
 */
export async function readJson<T = unknown>(response: Response): Promise<T | null> {
  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    throw new NetworkError("Connection lost while reading the response", { cause: error });
  }
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Race a promise against a timeout; on timeout reject with NetworkError.
 * The underlying work is NOT cancelled (used for storage uploads, which have
 * no abort hook here) — callers must tolerate it finishing later.
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message = "Request timed out"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new NetworkError(message)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
