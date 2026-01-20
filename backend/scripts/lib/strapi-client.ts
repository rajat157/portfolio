/**
 * Strapi REST API client for seeding data
 */

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_SEED_TOKEN;

if (!STRAPI_TOKEN) {
  console.error("❌ STRAPI_SEED_TOKEN environment variable is required");
  console.error("   Generate a Full Access API token in Strapi Admin → Settings → API Tokens");
  process.exit(1);
}

interface StrapiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    status: number;
    name: string;
    message: string;
  };
}

interface StrapiListResponse<T> {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

async function strapiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${STRAPI_URL}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...options.headers,
    },
  });

  const data = (await response.json()) as T & { error?: { message: string } };

  if (!response.ok) {
    throw new Error(
      `Strapi API error: ${response.status} - ${data.error?.message || JSON.stringify(data)}`
    );
  }

  return data as T;
}

/**
 * Find an entry by slug in a collection
 */
export async function findBySlug<T extends { slug: string }>(
  contentType: string,
  slug: string
): Promise<T | null> {
  try {
    const response = await strapiRequest<StrapiListResponse<T>>(
      `/${contentType}?filters[slug][$eq]=${encodeURIComponent(slug)}`
    );
    return response.data?.[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Create a new entry in a collection
 */
export async function createEntry<T>(
  contentType: string,
  data: Record<string, unknown>
): Promise<T> {
  const response = await strapiRequest<StrapiResponse<T>>(`/${contentType}`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  return response.data;
}

/**
 * Update an existing entry
 */
export async function updateEntry<T>(
  contentType: string,
  documentId: string,
  data: Record<string, unknown>
): Promise<T> {
  const response = await strapiRequest<StrapiResponse<T>>(
    `/${contentType}/${documentId}`,
    {
      method: "PUT",
      body: JSON.stringify({ data }),
    }
  );
  return response.data;
}

/**
 * Publish an entry (Strapi 5)
 */
export async function publishEntry(
  contentType: string,
  documentId: string
): Promise<void> {
  await strapiRequest(`/${contentType}/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        publishedAt: new Date().toISOString(),
      },
    }),
  });
}

/**
 * Get a single type entry
 */
export async function getSingleType<T>(contentType: string): Promise<T | null> {
  try {
    const response = await strapiRequest<StrapiResponse<T>>(`/${contentType}`);
    return response.data || null;
  } catch (error) {
    return null;
  }
}

/**
 * Update or create a single type entry
 * Note: Single types always use PUT directly to the base endpoint (POST not supported)
 */
export async function upsertSingleType<T>(
  contentType: string,
  data: Record<string, unknown>
): Promise<T> {
  const response = await strapiRequest<StrapiResponse<T>>(`/${contentType}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
  return response.data;
}

/**
 * Get all entries from a collection
 */
export async function getAllEntries<T>(
  contentType: string,
  query?: string
): Promise<T[]> {
  try {
    const endpoint = query ? `/${contentType}?${query}` : `/${contentType}`;
    const response = await strapiRequest<StrapiListResponse<T>>(endpoint);
    return response.data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Seed helper - creates entry if slug doesn't exist
 */
export async function seedEntry<T extends { slug?: string; documentId?: string }>(
  contentType: string,
  data: Record<string, unknown>,
  identifierField: string = "slug"
): Promise<{ entry: T; created: boolean }> {
  const identifier = data[identifierField] as string;

  if (identifier) {
    const existing = await findBySlug<T & { slug: string }>(contentType, identifier);
    if (existing) {
      console.log(`  ⏭️  ${contentType}: "${identifier}" already exists`);
      return { entry: existing, created: false };
    }
  }

  const entry = await createEntry<T>(contentType, data);
  console.log(`  ✅ ${contentType}: "${identifier || "entry"}" created`);

  // Auto-publish the entry
  if (entry.documentId) {
    await publishEntry(contentType, entry.documentId);
    console.log(`  📢 ${contentType}: "${identifier || "entry"}" published`);
  }

  return { entry, created: true };
}

export { STRAPI_URL };
