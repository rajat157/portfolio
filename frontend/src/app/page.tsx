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
    imageUrl: "/images/covers/tredye-trading-platform.svg",
  },
  {
    id: "2",
    slug: "labbuild-2",
    title: "Labbuild 2.0",
    description: "High-performance lab infrastructure system with 90% faster performance",
    technologies: ["Python", "Flask", "FastAPI", "MongoDB"],
    category: "Backend" as const,
    imageUrl: "/images/covers/labbuild-2.svg",
  },
  {
    id: "3",
    slug: "supercomputer-dashboard",
    title: "Supercomputer Dashboard",
    description: "Django dashboard for monitoring SahasraT supercomputer at IISc",
    technologies: ["Django", "Python", "Linux", "HPC"],
    category: "DevOps" as const,
    imageUrl: "/images/covers/supercomputer-dashboard.svg",
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
    imageUrl: "/images/covers/building-real-time-trading-platforms.svg",
  },
  {
    id: "2",
    slug: "ai-accelerated-development",
    title: "AI-Accelerated Development",
    excerpt: "How I use Claude and Gemini to 10x my development productivity.",
    category: "AI",
    readingTime: 5,
    publishedAt: "2026-01-10",
    imageUrl: "/images/covers/ai-accelerated-development.svg",
  },
  {
    id: "3",
    slug: "managing-supercomputers",
    title: "Managing India's Fastest Supercomputer",
    excerpt: "My experience managing SahasraT at IISc with 33,000 cores.",
    category: "DevOps",
    readingTime: 12,
    publishedAt: "2026-01-05",
    imageUrl: "/images/covers/managing-supercomputers.svg",
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

      {/* Built With Section */}
      <section className="py-12 px-4 border-t border-border/40">
        <div className="container mx-auto">
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm text-muted-foreground">Built with</p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 opacity-60 hover:opacity-100 transition-opacity">
              <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" title="Next.js" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.simpleicons.org/nextdotjs/currentColor" alt="Next.js" className="h-6 w-auto dark:invert" />
              </a>
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" title="Vercel" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.simpleicons.org/vercel/currentColor" alt="Vercel" className="h-5 w-auto dark:invert" />
              </a>
              <a href="https://strapi.io" target="_blank" rel="noopener noreferrer" title="Strapi" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.simpleicons.org/strapi/currentColor" alt="Strapi" className="h-6 w-auto dark:invert" />
              </a>
              <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" title="Neon (PostgreSQL)" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.simpleicons.org/postgresql/currentColor" alt="Neon (PostgreSQL)" className="h-6 w-auto dark:invert" />
              </a>
              <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" title="Cloudinary" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.simpleicons.org/cloudinary/currentColor" alt="Cloudinary" className="h-6 w-auto dark:invert" />
              </a>
              <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" title="shadcn/ui" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.simpleicons.org/shadcnui/currentColor" alt="shadcn/ui" className="h-5 w-auto dark:invert" />
              </a>
              <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" title="Tailwind CSS" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.simpleicons.org/tailwindcss/currentColor" alt="Tailwind CSS" className="h-5 w-auto dark:invert" />
              </a>
              <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer" title="Cloudflare" className="hover:opacity-80 transition-opacity">
                <img src="https://cdn.simpleicons.org/cloudflare/currentColor" alt="Cloudflare" className="h-6 w-auto dark:invert" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
