import { MetadataRoute } from "next";
import { fetchAPI, StrapiResponse, Project, BlogPost } from "@/lib/strapi";

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

  // Fetch projects from Strapi
  let projectPages: MetadataRoute.Sitemap = [];
  try {
    const projectsResponse = await fetchAPI<StrapiResponse<Project[]>>({
      endpoint: "/projects",
      query: {
        fields: ["slug", "updatedAt"],
        pagination: { pageSize: 100 },
        sort: ["updatedAt:desc"],
      },
      revalidate: 3600,
      tags: ["projects"],
    });

    if (projectsResponse?.data && Array.isArray(projectsResponse.data)) {
      projectPages = projectsResponse.data
        .filter((project) => project?.slug)
        .map((project) => ({
          url: `${baseUrl}/projects/${project.slug}`,
          lastModified: new Date(project.updatedAt || new Date()),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error("Failed to fetch projects for sitemap:", error);
  }

  // Fetch blog posts from Strapi
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const blogResponse = await fetchAPI<StrapiResponse<BlogPost[]>>({
      endpoint: "/blog-posts",
      query: {
        fields: ["slug", "updatedAt"],
        pagination: { pageSize: 100 },
        sort: ["updatedAt:desc"],
      },
      revalidate: 3600,
      tags: ["blog-posts"],
    });

    if (blogResponse?.data && Array.isArray(blogResponse.data)) {
      blogPages = blogResponse.data
        .filter((post) => post?.slug)
        .map((post) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: new Date(post.updatedAt || new Date()),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }));
    }
  } catch (error) {
    console.error("Failed to fetch blog posts for sitemap:", error);
  }

  return [...staticPages, ...projectPages, ...blogPages];
}
