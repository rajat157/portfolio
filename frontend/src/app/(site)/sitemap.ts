import { MetadataRoute } from "next";
import { cmsProjects, cmsBlogPosts } from "@/lib/cms";

// Regenerate at most hourly — keeps ISR cadence fixed even if data fetches skip the cache
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];

  // Fetch projects from the CMS
  let projectPages: MetadataRoute.Sitemap = [];
  try {
    const projects = await cmsProjects();
    projectPages = projects
      .filter((project) => project?.slug)
      .map((project) => ({
        url: `${baseUrl}/projects/${project.slug}`,
        lastModified: new Date(project.updatedAt || new Date()),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.error("Failed to fetch projects for sitemap:", error);
  }

  // Fetch blog posts from the CMS
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await cmsBlogPosts({ limit: 100 });
    blogPages = posts
      .filter((post) => post?.slug)
      .map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || new Date()),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
  } catch (error) {
    console.error("Failed to fetch blog posts for sitemap:", error);
  }

  return [...staticPages, ...projectPages, ...blogPages];
}
