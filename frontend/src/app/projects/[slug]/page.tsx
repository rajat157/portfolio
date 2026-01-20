import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, Calendar, User, Briefcase, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/animations/reveal";

// Types
interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  technologies: string[];
  category: string;
  client: string | null;
  role: string;
  year: string;
  liveUrl: string | null;
  githubUrl: string | null;
}

// Placeholder project data
const projects: Project[] = [
  {
    slug: "tredye",
    title: "Tredye",
    tagline: "Real-time trading platform for NSE FNO stocks",
    description: `A high-performance trading platform showcasing live, multi-timeframe RSI data for 214 FNO-listed stocks on the NSE. Built with a robust microservices architecture for scalability.

The platform processes thousands of data points per second, providing traders with real-time technical indicators across multiple timeframes. The architecture leverages Redis for caching frequently accessed data, Kafka for reliable message streaming between services, and PostgreSQL for persistent storage.

Key features include:
- Real-time RSI calculations across 1-min, 5-min, 15-min, and daily timeframes
- WebSocket-based live updates for instant data delivery
- Advanced filtering and sorting capabilities
- Responsive design optimized for both desktop and mobile trading
- Dark mode support for comfortable extended trading sessions`,
    technologies: ["Next.js 16", "Docker", "Redis", "Kafka", "PostgreSQL", "Nginx"],
    category: "Web Dev",
    client: "Voltvave Innovations",
    role: "Software Architect",
    year: "2025",
    liveUrl: null,
    githubUrl: null,
  },
  {
    slug: "portfolio-v2",
    title: "Portfolio V2",
    tagline: "A modern developer portfolio with CMS integration",
    description: `A complete redesign of my personal portfolio website, built with Next.js 15 and integrated with Strapi CMS for content management. The site features smooth animations, dark mode support, and a fully responsive design.

The project showcases modern web development practices including:
- Server-side rendering for optimal SEO and performance
- Framer Motion animations for engaging user interactions
- Tailwind CSS for rapid, consistent styling
- Strapi headless CMS for flexible content management
- TypeScript for type-safe development

The architecture separates content from presentation, allowing for easy updates without code changes while maintaining excellent performance through static generation where possible.`,
    technologies: ["Next.js 15", "TypeScript", "Tailwind CSS", "Strapi", "Framer Motion"],
    category: "Web Dev",
    client: null,
    role: "Full Stack Developer",
    year: "2025",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example/portfolio",
  },
  {
    slug: "ai-content-generator",
    title: "AI Content Generator",
    tagline: "GPT-powered content creation tool for marketers",
    description: `An AI-powered content generation platform designed for marketing teams. The tool leverages OpenAI's GPT models to generate blog posts, social media content, email campaigns, and ad copy tailored to brand voice and guidelines.

The platform includes:
- Custom brand voice training and preservation
- Multi-format content generation (blogs, social, email, ads)
- Content calendar and scheduling integration
- Team collaboration features with approval workflows
- Analytics dashboard for content performance tracking
- A/B testing capabilities for optimizing generated content

Built with a focus on user experience, the interface guides users through the content creation process while providing real-time previews and suggestions for improvement.`,
    technologies: ["React", "Node.js", "OpenAI API", "MongoDB", "Redis", "AWS"],
    category: "AI/ML",
    client: "ContentFlow Inc.",
    role: "Lead Developer",
    year: "2024",
    liveUrl: "https://example.com/ai-content",
    githubUrl: null,
  },
  {
    slug: "ecommerce-dashboard",
    title: "E-commerce Dashboard",
    tagline: "Analytics and inventory management for online stores",
    description: `A comprehensive dashboard solution for e-commerce businesses, providing real-time analytics, inventory management, and order processing capabilities. The platform integrates with major e-commerce platforms including Shopify, WooCommerce, and custom solutions.

Features include:
- Real-time sales and revenue analytics
- Inventory tracking with low-stock alerts
- Order management and fulfillment tracking
- Customer insights and behavior analytics
- Multi-channel integration (Shopify, WooCommerce, Amazon)
- Automated reporting and export capabilities

The dashboard processes millions of transactions daily, with optimized queries and caching strategies ensuring sub-second response times even at scale.`,
    technologies: ["Vue.js", "Python", "FastAPI", "PostgreSQL", "Elasticsearch", "Docker"],
    category: "Web Dev",
    client: "RetailTech Solutions",
    role: "Backend Developer",
    year: "2024",
    liveUrl: null,
    githubUrl: "https://github.com/example/ecommerce-dash",
  },
];

// Helper function to get project by slug
function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

// Helper function to get related projects
function getRelatedProjects(currentSlug: string, limit: number = 3): Project[] {
  return projects
    .filter((project) => project.slug !== currentSlug)
    .slice(0, limit);
}

// Generate static params for all projects
export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.title} | Projects`,
    description: project.tagline,
    openGraph: {
      title: project.title,
      description: project.tagline,
      type: "article",
    },
  };
}

// Project Detail Page Component
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const relatedProjects = getRelatedProjects(slug);

  return (
    <main className="min-h-screen">
      {/* Back Navigation */}
      <div className="container mx-auto px-4 pt-8">
        <Reveal direction="left">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </Link>
        </Reveal>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Reveal>
            <div className="max-w-4xl">
              {/* Category Badge */}
              <Badge variant="secondary" className="mb-4">
                {project.category}
              </Badge>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {project.title}
              </h1>

              {/* Tagline */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                {project.tagline}
              </p>

              {/* Tech Stack Badges */}
              <div className="flex flex-wrap gap-2 mb-8">
                {project.technologies.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>

              {/* External Links */}
              <div className="flex flex-wrap gap-4">
                {project.liveUrl && (
                  <Button asChild>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      View Live Site
                    </a>
                  </Button>
                )}
                {project.githubUrl && (
                  <Button variant="outline" asChild>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="size-4" />
                      View Source
                    </a>
                  </Button>
                )}
                {!project.liveUrl && !project.githubUrl && (
                  <p className="text-muted-foreground text-sm italic">
                    Project links not publicly available
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cover Image Placeholder */}
      <section className="px-4 mb-16">
        <Reveal delay={0.1}>
          <div className="container mx-auto">
            <div className="aspect-video w-full bg-muted rounded-xl border border-border flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Layers className="size-12 mx-auto mb-4 opacity-50" />
                <p>Cover Image Placeholder</p>
                <p className="text-sm">Connect to CMS for actual images</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content - Description */}
            <div className="lg:col-span-2">
              <Reveal delay={0.2}>
                <h2 className="text-2xl font-bold mb-6">About the Project</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  {project.description.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Sidebar - Project Details */}
            <div className="lg:col-span-1">
              <Reveal delay={0.3} direction="right">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {project.client && (
                      <div className="flex items-start gap-3">
                        <Briefcase className="size-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Client</p>
                          <p className="font-medium">{project.client}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <User className="size-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium">{project.role}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="size-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Year</p>
                        <p className="font-medium">{project.year}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Layers className="size-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{project.category}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Placeholder */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <Reveal delay={0.1}>
            <h2 className="text-2xl font-bold mb-8">Project Gallery</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Reveal key={i} delay={0.1 + i * 0.05}>
                <div className="aspect-video bg-card rounded-lg border border-border flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Layers className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Gallery Image {i}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Related Projects Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Reveal>
            <h2 className="text-2xl font-bold mb-8">Related Projects</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProjects.map((relatedProject, index) => (
              <Reveal key={relatedProject.slug} delay={0.1 + index * 0.1}>
                <Link href={`/projects/${relatedProject.slug}`}>
                  <Card className="group hover:border-foreground/20 transition-colors h-full">
                    {/* Card Image Placeholder */}
                    <div className="aspect-video bg-muted rounded-t-xl flex items-center justify-center text-muted-foreground border-b">
                      <Layers className="size-8 opacity-50" />
                    </div>
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2">
                        {relatedProject.category}
                      </Badge>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {relatedProject.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {relatedProject.tagline}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-4">
                        {relatedProject.technologies.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {relatedProject.technologies.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{relatedProject.technologies.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Back to Projects CTA */}
      <section className="py-16 px-4 border-t">
        <div className="container mx-auto text-center">
          <Reveal>
            <p className="text-muted-foreground mb-4">
              Want to see more of my work?
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/projects">
                <ArrowLeft className="size-4" />
                Back to All Projects
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
