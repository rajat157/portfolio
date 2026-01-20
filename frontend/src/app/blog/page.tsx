import type { Metadata } from "next";
import { fetchAPI, getStrapiMedia } from "@/lib/strapi";
import type { StrapiResponse, BlogPost, Category } from "@/lib/strapi/types";
import { Reveal } from "@/components/animations/reveal";
import { BlogPageClient } from "./blog-page-client";
import type { Article } from "@/components/blog";

export const metadata: Metadata = {
  title: "Blog | Rajat Kumar R",
  description:
    "Thoughts on software development, architecture, DevOps, and lessons learned from building scalable systems.",
};

// Default fallback articles when API is unavailable
const defaultArticles: Article[] = [
  {
    id: "1",
    slug: "building-real-time-trading-platforms",
    title: "Building Real-Time Trading Platforms",
    excerpt: "Lessons learned from architecting high-frequency trading systems with modern tech stack. Covers Kafka, WebSocket, and low-latency design patterns.",
    category: "Architecture",
    readingTime: 8,
    publishedAt: "2026-01-15",
    imageUrl: "/images/covers/building-real-time-trading-platforms.svg",
  },
  {
    id: "2",
    slug: "ai-accelerated-development",
    title: "AI-Accelerated Development",
    excerpt: "How I use Claude and Gemini to 10x my development productivity. Practical tips and workflow optimizations.",
    category: "AI",
    readingTime: 5,
    publishedAt: "2026-01-10",
    imageUrl: "/images/covers/ai-accelerated-development.svg",
  },
  {
    id: "3",
    slug: "managing-supercomputers",
    title: "Managing India's Fastest Supercomputer",
    excerpt: "My experience managing SahasraT at IISc with 33,000 cores. SLURM job scheduling, monitoring, and performance optimization.",
    category: "DevOps",
    readingTime: 12,
    publishedAt: "2026-01-05",
    imageUrl: "/images/covers/managing-supercomputers.svg",
  },
];

const defaultBlogCategories = ["All", "Architecture", "AI", "DevOps"];

// Transform Strapi BlogPost to Article format used by components
// Strapi 5 uses flat response format (no .attributes wrapper)
function transformBlogPostToArticle(post: BlogPost): Article | null {
  // Defensive check for valid post structure
  if (!post || !post.slug) {
    return null;
  }

  return {
    id: post.id?.toString() || "",
    slug: post.slug || "",
    title: post.title || "Untitled",
    excerpt: post.excerpt || "",
    category: post.category?.name || "Uncategorized",
    readingTime: post.reading_time || 5,
    publishedAt: post.published_date || post.publishedAt || new Date().toISOString(),
    imageUrl: post.cover_image?.url ? getStrapiMedia(post.cover_image.url) || undefined : undefined,
  };
}

async function getBlogPosts(): Promise<Article[]> {
  try {
    const response = await fetchAPI<StrapiResponse<BlogPost[]>>({
      endpoint: "/blog-posts",
      query: {
        populate: ["cover_image", "category"],
        sort: ["published_date:desc"],
        pagination: {
          pageSize: 100,
        },
      },
      tags: ["blog-posts"],
      revalidate: 3600,
    });

    if (!response?.data || !Array.isArray(response.data) || response.data.length === 0) {
      return [];
    }

    // Transform and filter out any null results
    return response.data
      .map(transformBlogPostToArticle)
      .filter((article): article is Article => article !== null);
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return [];
  }
}

async function getBlogCategories(): Promise<string[]> {
  try {
    const response = await fetchAPI<StrapiResponse<Category[]>>({
      endpoint: "/categories",
      query: {
        filters: {
          type: {
            $in: ["blog", "both"],
          },
        },
        sort: ["name:asc"],
      },
      tags: ["categories"],
      revalidate: 3600,
    });

    if (!response?.data || response.data.length === 0) {
      return [];
    }

    // Strapi 5 flat response format
    return response.data.map((cat) => cat.name);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export default async function BlogPage() {
  const [apiArticles, categoryNames] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
  ]);

  // Use API articles or fallback to defaults
  const articles = apiArticles.length > 0 ? apiArticles : defaultArticles;

  // Build categories array with "All" as first option
  let categories: string[];
  if (categoryNames.length > 0) {
    categories = ["All", ...categoryNames];
  } else if (apiArticles.length > 0) {
    // Extract unique categories from articles if API categories are empty
    categories = ["All", ...Array.from(new Set(articles.map((a) => a.category))).sort()];
  } else {
    // Use default categories when no API data
    categories = defaultBlogCategories;
  }

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Reveal delay={0.1}>
            <h1 className="text-hero font-bold tracking-tight mb-6">Blog</h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Thoughts on software development, architecture, DevOps, and
              lessons learned from building scalable systems.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Category Filter & Articles */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <BlogPageClient
            articles={articles}
            categories={categories}
          />
        </div>
      </section>
    </>
  );
}
