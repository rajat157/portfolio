import qs from "qs";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
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
  revalidate = 3600,
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
    console.error(`Strapi API error: ${response.status} ${response.statusText}`);
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
