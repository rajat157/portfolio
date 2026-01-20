import Link from "next/link";
import { Hero, SkillsMarquee } from "@/components/sections";
import { fetchAPI, getStrapiMedia } from "@/lib/strapi";
import type { Project, BlogPost, StrapiResponse } from "@/lib/strapi/types";
import { ProjectCard } from "@/components/projects/project-card";
import { ArticleCard } from "@/components/blog/article-card";

// Default fallback data when API returns empty
const defaultProjects = [
  {
    id: "1",
    slug: "tredye-trading-platform",
    title: "Tredye Trading Platform",
    description: "Real-time trading platform built with Next.js 16, Docker, Redis, Kafka, and PostgreSQL",
    technologies: ["Next.js", "Docker", "Redis", "Kafka", "PostgreSQL"],
    category: "Web Dev" as const,
  },
  {
    id: "2",
    slug: "labbuild-2",
    title: "Labbuild 2.0",
    description: "High-performance lab infrastructure system with 90% faster performance",
    technologies: ["Python", "Flask", "FastAPI", "MongoDB"],
    category: "Backend" as const,
  },
  {
    id: "3",
    slug: "supercomputer-dashboard",
    title: "Supercomputer Dashboard",
    description: "Django dashboard for monitoring SahasraT supercomputer at IISc",
    technologies: ["Django", "Python", "Linux", "HPC"],
    category: "DevOps" as const,
  },
];

const defaultBlogPosts = [
  {
    id: "1",
    slug: "building-real-time-trading-platforms",
    title: "Building Real-Time Trading Platforms",
    excerpt: "Lessons learned from architecting high-frequency trading systems with modern tech stack.",
    category: "Architecture",
    readingTime: 8,
    publishedAt: "2026-01-15",
  },
  {
    id: "2",
    slug: "ai-accelerated-development",
    title: "AI-Accelerated Development",
    excerpt: "How I use Claude and Gemini to 10x my development productivity.",
    category: "AI",
    readingTime: 5,
    publishedAt: "2026-01-10",
  },
  {
    id: "3",
    slug: "managing-supercomputers",
    title: "Managing India's Fastest Supercomputer",
    excerpt: "My experience managing SahasraT at IISc with 33,000 cores.",
    category: "DevOps",
    readingTime: 12,
    publishedAt: "2026-01-05",
  },
];

async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const response = await fetchAPI<StrapiResponse<Project[]>>({
      endpoint: "/projects",
      query: {
        populate: "*",
        pagination: {
          limit: 6,
        },
        sort: ["createdAt:desc"],
      },
      tags: ["projects"],
    });
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch featured projects:", error);
    return [];
  }
}

async function getLatestBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetchAPI<StrapiResponse<BlogPost[]>>({
      endpoint: "/blog-posts",
      query: {
        sort: ["published_date:desc"],
        pagination: {
          limit: 3,
        },
        populate: "*",
      },
      tags: ["blog-posts"],
    });
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch latest blog posts:", error);
    return [];
  }
}

// Transform Strapi 5 project data to component format (flat structure)
function transformProject(project: Project) {
  // Defensive check for valid project structure
  if (!project || !project.id) {
    return null;
  }

  const coverUrl = project.cover_image?.url
    ? getStrapiMedia(project.cover_image.url)
    : undefined;

  return {
    id: String(project.id || ""),
    slug: project.slug || "",
    title: project.title || "Untitled",
    description: project.description || "",
    technologies: project.technologies || [],
    category: (project.category?.name || "Web Dev") as string,
    imageUrl: coverUrl || undefined,
  };
}

// Transform Strapi 5 blog post data to component format (flat structure)
function transformBlogPost(post: BlogPost) {
  // Defensive check for valid post structure
  if (!post || !post.id) {
    return null;
  }

  const coverUrl = post.cover_image?.url
    ? getStrapiMedia(post.cover_image.url)
    : undefined;

  return {
    id: String(post.id || ""),
    slug: post.slug || "",
    title: post.title || "Untitled",
    excerpt: post.excerpt || "",
    category: post.category?.name || "General",
    readingTime: post.reading_time || 5,
    publishedAt: post.published_date || new Date().toISOString(),
    imageUrl: coverUrl || undefined,
  };
}

export default async function Home() {
  const [featuredProjects, latestBlogPosts] = await Promise.all([
    getFeaturedProjects(),
    getLatestBlogPosts(),
  ]);

  // Transform API data or use defaults (filter out null results from transformation)
  const transformedProjects = featuredProjects
    .map(transformProject)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const transformedBlogPosts = latestBlogPosts
    .map(transformBlogPost)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const projects = transformedProjects.length > 0
    ? transformedProjects
    : defaultProjects;

  const blogPosts = transformedBlogPosts.length > 0
    ? transformedBlogPosts
    : defaultBlogPosts;

  return (
    <>
      <Hero />

      {/* Skills Marquee Section */}
      <SkillsMarquee />

      {/* About Preview Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-heading font-bold mb-6">About Me</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Experienced Software Architect with 8+ years building high-performance systems.
            From managing India&apos;s fastest supercomputer (SahasraT at IISc) to architecting
            real-time trading platforms, I bring deep expertise in Python, cloud infrastructure,
            and modern web technologies.
          </p>
          <Link
            href="/about"
            className="text-foreground font-medium hover:underline underline-offset-4"
          >
            Learn more about me &rarr;
          </Link>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-heading font-bold">Featured Projects</h2>
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          {/* Project grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-heading font-bold">Latest Posts</h2>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          {/* Blog post grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <ArticleCard key={post.id} article={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-8">
            Subscribe to my newsletter to get updates on new projects, blog posts,
            and things I find interesting.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
