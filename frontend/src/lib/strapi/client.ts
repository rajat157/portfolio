import qs from "qs";

// Server-side uses internal URL, client-side uses relative paths (via nginx)
const STRAPI_URL = typeof window === "undefined"
  ? (process.env.STRAPI_URL || "http://localhost:1337")
  : (process.env.NEXT_PUBLIC_STRAPI_URL || "");
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

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
  revalidate = 60,
  tags,
}: FetchOptions): Promise<T> {
  const queryString = query ? `?${qs.stringify(query, { encodeValuesOnly: true })}` : "";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (STRAPI_TOKEN) {
    headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
  }

  const response = await fetch(`${STRAPI_URL}/api${endpoint}${queryString}`, {
    headers,
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

export function getStrapiMedia(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("//")) {
    return url;
  }
  return `${STRAPI_URL}${url}`;
}
