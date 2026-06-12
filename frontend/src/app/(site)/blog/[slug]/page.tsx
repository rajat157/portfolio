import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStrapiMedia } from "@/lib/strapi";
import { cmsBlogPosts, cmsBlogPostBySlug } from "@/lib/cms";
import type { BlogPost } from "@/lib/strapi/types";
import { ArticleContent, type ArticleData } from "@/components/blog/article-content";
import { generateToc } from "@/lib/utils/generate-toc";

// Regenerate at most hourly — keeps ISR cadence fixed even if data fetches skip the cache
export const revalidate = 3600;

// Transform Strapi BlogPost to ArticleData format
// Strapi 5 uses flat response format (no .attributes wrapper)
function transformBlogPostToArticleData(post: BlogPost): ArticleData | null {
  // Defensive check for valid post structure
  if (!post || !post.slug) {
    return null;
  }

  const coverImage = post.cover_image;

  return {
    slug: post.slug || "",
    title: post.title || "Untitled",
    excerpt: post.excerpt || "",
    content: post.content || "",
    category: post.category?.name || "Uncategorized",
    publishedDate: post.published_date || post.publishedAt || new Date().toISOString(),
    readingTime: post.reading_time || 5,
    author: "Rajat Kumar R", // Default author
    coverImageUrl: coverImage?.url ? getStrapiMedia(coverImage.url) : null,
    coverImageAlt: coverImage?.alternativeText || post.title,
  };
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await cmsBlogPostBySlug(slug);
  } catch (error) {
    console.error(`Failed to fetch blog post with slug "${slug}":`, error);
    return null;
  }
}

async function getAllBlogPostSlugs(): Promise<string[]> {
  try {
    const posts = await cmsBlogPosts({ limit: 100 });
    return posts.filter((post) => post?.slug).map((post) => post.slug);
  } catch (error) {
    console.error("Failed to fetch all blog posts for static params:", error);
    return [];
  }
}

async function getRelatedPosts(
  currentSlug: string,
  limit: number = 3
): Promise<ArticleData[]> {
  try {
    const posts = await cmsBlogPosts({ excludeSlug: currentSlug, limit });

    // Transform and filter out any null results
    return posts
      .map(transformBlogPostToArticleData)
      .filter((article): article is ArticleData => article !== null);
  } catch (error) {
    console.error("Failed to fetch related posts:", error);
    return [];
  }
}

// Generate static params for all blog posts (for SSG)
export async function generateStaticParams() {
  const slugs = await getAllBlogPostSlugs();

  return slugs.map((slug) => ({
    slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
    };
  }

  // Strapi 5 flat response format
  const coverImage = post.cover_image;
  const coverImageUrl = coverImage?.url ? getStrapiMedia(coverImage.url) : null;

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: "Rajat Kumar R" }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.published_date || post.publishedAt,
      authors: ["Rajat Kumar R"],
      tags: post.tags || [],
      ...(coverImageUrl && {
        images: [
          {
            url: coverImageUrl,
            width: coverImage?.width || 1200,
            height: coverImage?.height || 630,
            alt: coverImage?.alternativeText || post.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      ...(coverImageUrl && {
        images: [coverImageUrl],
      }),
    },
  };
}

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const article = transformBlogPostToArticleData(post);

  // If transformation failed, show not found
  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedPosts(slug);

  // Generate TOC from the article content (markdown format)
  const tocItems = generateToc(article.content);

  return (
    <ArticleContent
      article={article}
      relatedArticles={relatedArticles}
      tocItems={tocItems}
    />
  );
}
