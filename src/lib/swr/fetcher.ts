import { fetchWithTimeout, readJson } from "@/lib/offline/network";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Default SWR fetcher: JSON GET with the shared 15s timeout. Throws
 * NetworkError on connectivity problems and HttpError on non-2xx, so SWR
 * keeps the last good (possibly persisted) data and exposes `error`.
 */
export async function jsonFetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetchWithTimeout(url, { headers: { Accept: "application/json" } });
  const body = await readJson<{ error?: string } & T>(response);
  if (!response.ok) {
    throw new HttpError(response.status, body?.error || `Request failed (HTTP ${response.status})`);
  }
  return body as T;
}
