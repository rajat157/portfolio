import qs from "qs";

// Server-side uses internal URL, client-side uses relative paths (via nginx)
const STRAPI_URL = typeof window === "undefined"
  ? (process.env.STRAPI_URL || "http://localhost:1337")
  : (process.env.NEXT_PUBLIC_STRAPI_URL || "");
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// Kill switch: skip Strapi entirely (callers fall back to their default content).
// Set STRAPI_DISABLED=1 on Vercel while the backend is down/being migrated.
const STRAPI_DISABLED =
  process.env.STRAPI_DISABLED === "1" || process.env.STRAPI_DISABLED === "true";

// A dead/spinning-down backend must fail fast, not hold the function for the
// full 300s Vercel max duration (that's what burns the compute quota).
const FETCH_TIMEOUT_MS = Number(process.env.STRAPI_TIMEOUT_MS) || 5000;

interface FetchOptions {
  endpoint: string;
  query?: Record<string, unknown>;
  wrappedByKey?: string;
  revalidate?: number | false;
  tags?: string[];
}

export async function fetchAPI<T>({
  endpoint,
  query,
  wrappedByKey,
  revalidate = 3600,
  tags,
}: FetchOptions): Promise<T> {
  if (STRAPI_DISABLED) {
    return { data: null } as T;
  }

  const queryString = query ? `?${qs.stringify(query, { encodeValuesOnly: true })}` : "";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (STRAPI_TOKEN) {
    headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
  }

  const response = await fetch(`${STRAPI_URL}/api${endpoint}${queryString}`, {
    headers,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    next: {
      revalidate,
      tags,
    },
  });

  if (!response.ok) {
    // Log but don't throw on 404 - content might not exist yet
    console.error(`Strapi API error: ${response.status} ${response.statusText}`);
    if (response.status === 404) {
      return { data: null } as T; // Return empty data for missing content
    }
    throw new Error(`Strapi API error: ${response.statusText}`);
  }

  const data = await response.json();
  return wrappedByKey ? data[wrappedByKey] : data;
}

export function getStrapiURL(path = "") {
  return `${STRAPI_URL}${path}`;
}

// Media URLs now come from Payload: app-relative (/api/media/file/...) in dev,
// absolute Blob/Cloudinary URLs in prod. Both are usable as-is.
export function getStrapiMedia(url: string | null) {
  return url || null;
}
