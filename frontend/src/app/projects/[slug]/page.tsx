import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ExternalLink, Github, Calendar, User, Briefcase, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/animations/reveal";
import { fetchAPI, getStrapiMedia } from "@/lib/strapi/client";
import { Project as StrapiProject, StrapiResponse, StrapiMedia } from "@/lib/strapi/types";

// Transformed project type for UI
interface ProjectDetail {
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  content: string | null;
  technologies: string[];
  category: string;
  client: string | null;
  role: string | null;
  year: string | null;
  liveUrl: string | null;
  githubUrl: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  gallery: Array<{
    url: string;
    alt: string | null;
  }>;
}

// Fetch single project by slug
async function getProjectBySlug(slug: string): Promise<StrapiProject | null> {
  try {
    const response = await fetchAPI<StrapiResponse<StrapiProject[]>>({
      endpoint: "/projects",
      query: {
        filters: {
          slug: {
            $eq: slug,
          },
        },
        populate: ["cover_image", "gallery", "category"],
      },
      tags: ["projects", `project-${slug}`],
    });

    if (!response.data || response.data.length === 0) {
      return null;
    }

    return response.data[0];
  } catch (error) {
    console.error(`Failed to fetch project with slug "${slug}":`, error);
    return null;
  }
}

// Fetch all projects for related section and static params
async function getAllProjects(): Promise<StrapiProject[]> {
  try {
    const response = await fetchAPI<StrapiResponse<StrapiProject[]>>({
      endpoint: "/projects",
      query: {
        populate: ["cover_image", "category"],
        sort: ["featured:desc", "createdAt:desc"],
      },
      tags: ["projects"],
    });

    // Ensure we always return an array
    if (!response || !response.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("Failed to fetch all projects:", error);
    return [];
  }
}

// Ensure URL has a protocol prefix
function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  url = url.trim();
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

// Transform Strapi project to UI format (Strapi 5 flat format)
function transformProject(strapiProject: StrapiProject): ProjectDetail {
  // Strapi 5 uses flat structure - no attributes wrapper
  const coverImage = strapiProject.cover_image;
  const galleryImages = strapiProject.gallery || [];

  // Extract year from end_date if available, otherwise use createdAt
  let year: string | null = null;
  if (strapiProject.end_date) {
    year = new Date(strapiProject.end_date).getFullYear().toString();
  } else if (strapiProject.createdAt) {
    year = new Date(strapiProject.createdAt).getFullYear().toString();
  }

  return {
    slug: strapiProject.slug,
    title: strapiProject.title,
    tagline: strapiProject.description?.slice(0, 100) || null, // Use description excerpt as tagline
    description: strapiProject.description,
    content: strapiProject.content,
    technologies: strapiProject.technologies || [],
    category: strapiProject.category?.name || "Uncategorized",
    client: null, // Not in current schema
    role: null, // Not in current schema
    year,
    liveUrl: normalizeUrl(strapiProject.live_url),
    githubUrl: normalizeUrl(strapiProject.github_url),
    coverImageUrl: coverImage ? getStrapiMedia(coverImage.url) : null,
    coverImageAlt: coverImage?.alternativeText || strapiProject.title,
    gallery: galleryImages.map((img: StrapiMedia) => ({
      url: getStrapiMedia(img.url) || "",
      alt: img.alternativeText,
    })),
  };
}

// Transform for related projects card (Strapi 5 flat format)
function transformProjectForCard(strapiProject: StrapiProject) {
  // Strapi 5 uses flat structure - no attributes wrapper
  const coverImage = strapiProject.cover_image;

  return {
    slug: strapiProject.slug,
    title: strapiProject.title,
    tagline: strapiProject.description?.slice(0, 100) + "..." || "",
    technologies: strapiProject.technologies || [],
    category: strapiProject.category?.name || "Uncategorized",
    imageUrl: coverImage ? getStrapiMedia(coverImage.url) : null,
  };
}

// Generate static params for SSG
export async function generateStaticParams() {
  const projects = await getAllProjects();

  // Filter out any projects without valid slug and handle gracefully
  // Strapi 5 uses flat structure - no attributes wrapper
  return projects
    .filter((project) => project?.slug)
    .map((project) => ({
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
  const strapiProject = await getProjectBySlug(slug);

  if (!strapiProject) {
    return {
      title: "Project Not Found",
    };
  }

  // Strapi 5 uses flat structure - no attributes wrapper
  const coverImage = strapiProject.cover_image;
  const description = strapiProject.description?.slice(0, 160) || "";

  return {
    title: `${strapiProject.title} | Projects`,
    description,
    openGraph: {
      title: strapiProject.title,
      description,
      type: "article",
      images: coverImage
        ? [
            {
              url: getStrapiMedia(coverImage.url) || "",
              width: coverImage.width,
              height: coverImage.height,
              alt: coverImage.alternativeText || strapiProject.title,
            },
          ]
        : [],
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
  const strapiProject = await getProjectBySlug(slug);

  if (!strapiProject) {
    notFound();
  }

  const project = transformProject(strapiProject);

  // Get related projects (excluding current one)
  // Strapi 5 uses flat structure - no attributes wrapper
  const allProjects = await getAllProjects();
  const relatedProjects = allProjects
    .filter((p) => p.slug !== slug)
    .slice(0, 3)
    .map(transformProjectForCard);

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
            <div className="max-w-4xl mx-auto text-center">
              {/* Category Badge */}
              <Badge variant="secondary" className="mb-4">
                {project.category}
              </Badge>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {project.title}
              </h1>

              {/* Tagline */}
              {project.tagline && (
                <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                  {project.tagline}
                </p>
              )}

              {/* Tech Stack Badges */}
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {project.technologies.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>

              {/* External Links */}
              <div className="flex flex-wrap gap-4 justify-center">
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

      {/* Cover Image */}
      <section className="px-4 mb-16">
        <Reveal delay={0.1}>
          <div className="container mx-auto">
            {project.coverImageUrl ? (
              <div className="aspect-video w-full relative rounded-xl overflow-hidden border border-border">
                <Image
                  src={project.coverImageUrl}
                  alt={project.coverImageAlt || project.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-muted rounded-xl border border-border flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Layers className="size-12 mx-auto mb-4 opacity-50" />
                  <p>No cover image available</p>
                </div>
              </div>
            )}
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
                <div className="max-w-none">
                  {project.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-3xl font-bold tracking-tight mt-10 mb-4 text-foreground">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4 text-foreground">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-lg font-semibold mt-4 mb-2 text-foreground/90">{children}</h4>,
                        p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-5">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-outside ml-6 my-5 space-y-2 text-muted-foreground marker:text-primary/70">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-outside ml-6 my-5 space-y-2 text-muted-foreground">{children}</ol>,
                        li: ({ children }) => <li className="pl-2 leading-relaxed">{children}</li>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/60 pl-6 py-3 my-6 bg-muted/30 rounded-r-lg italic text-muted-foreground/90">{children}</blockquote>,
                        pre: ({ children }) => <pre className="bg-muted/80 border border-border rounded-lg p-4 my-5 overflow-x-auto">{children}</pre>,
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          if (isInline) {
                            return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary/90 border border-border/50" {...props}>{children}</code>;
                          }
                          return <code className="text-sm font-mono text-foreground/90" {...props}>{children}</code>;
                        },
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target={href?.startsWith("http") ? "_blank" : undefined}
                            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors"
                          >
                            {children}
                          </a>
                        ),
                        img: ({ src, alt }) => (
                          <figure className="my-6">
                            <div className="rounded-lg overflow-hidden border border-border/50">
                              <img src={src} alt={alt || ""} className="w-full h-auto" />
                            </div>
                            {alt && <figcaption className="text-sm text-muted-foreground/70 text-center mt-2 italic">{alt}</figcaption>}
                          </figure>
                        ),
                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {project.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                  )}
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

                    {project.role && (
                      <div className="flex items-start gap-3">
                        <User className="size-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Role</p>
                          <p className="font-medium">{project.role}</p>
                        </div>
                      </div>
                    )}

                    {project.year && (
                      <div className="flex items-start gap-3">
                        <Calendar className="size-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Year</p>
                          <p className="font-medium">{project.year}</p>
                        </div>
                      </div>
                    )}

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

      {/* Image Gallery */}
      {project.gallery.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <Reveal delay={0.1}>
              <h2 className="text-2xl font-bold mb-8">Project Gallery</h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.gallery.map((image, i) => (
                <Reveal key={i} delay={0.1 + i * 0.05}>
                  <div className="aspect-video relative rounded-lg overflow-hidden border border-border">
                    <Image
                      src={image.url}
                      alt={image.alt || `Gallery image ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Projects Section */}
      {relatedProjects.length > 0 && (
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
                      {/* Card Image */}
                      {relatedProject.imageUrl ? (
                        <div className="aspect-video relative rounded-t-xl overflow-hidden border-b">
                          <Image
                            src={relatedProject.imageUrl}
                            alt={relatedProject.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted rounded-t-xl flex items-center justify-center text-muted-foreground border-b">
                          <Layers className="size-8 opacity-50" />
                        </div>
                      )}
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
      )}

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
