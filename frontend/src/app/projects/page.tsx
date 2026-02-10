import { Metadata } from "next";
import { fetchAPI, getStrapiMedia } from "@/lib/strapi/client";
import { Project as StrapiProject, Category, StrapiResponse } from "@/lib/strapi/types";
import { Reveal } from "@/components/animations/reveal";
import { ProjectsClient } from "./projects-client";

export const metadata: Metadata = {
  title: "Projects | Rajat Kumar R",
  description: "A collection of projects I have worked on, ranging from web applications to backend systems and DevOps tools.",
};

// Default fallback projects when API is unavailable
const defaultProjects = [
  {
    id: "1",
    slug: "tredye-trading-platform",
    title: "Tredye Trading Platform",
    description: "Real-time trading platform built with Next.js 16, Docker, Redis, Kafka, and PostgreSQL. Features live market data, order management, and portfolio tracking.",
    technologies: ["Next.js", "Docker", "Redis", "Kafka", "PostgreSQL"],
    category: "Web Dev",
    imageUrl: "/images/covers/tredye-trading-platform.svg",
  },
  {
    id: "2",
    slug: "labbuild-2",
    title: "Labbuild 2.0",
    description: "High-performance lab infrastructure system achieving 90% faster performance. Rebuilt from ground up with modern Python stack.",
    technologies: ["Python", "Flask", "FastAPI", "MongoDB"],
    category: "Backend",
    imageUrl: "/images/covers/labbuild-2.svg",
  },
  {
    id: "3",
    slug: "supercomputer-dashboard",
    title: "Supercomputer Dashboard",
    description: "Django dashboard for monitoring SahasraT supercomputer at IISc with 33,000 cores. Real-time job tracking and resource monitoring.",
    technologies: ["Django", "Python", "Linux", "HPC", "SLURM"],
    category: "DevOps",
    imageUrl: "/images/covers/supercomputer-dashboard.svg",
  },
  {
    id: "4",
    slug: "labbuild-dashboard",
    title: "Labbuild Dashboard",
    description: "Internal monitoring dashboard for Labbuild infrastructure. Real-time metrics, user sessions, and system health monitoring.",
    technologies: ["Flask", "MongoDB", "Chart.js", "Bootstrap"],
    category: "Backend",
    imageUrl: "/images/covers/labbuild-dashboard.svg",
  },
  {
    id: "5",
    slug: "operation-schedules",
    title: "Operation Schedules",
    description: "Automated workflow scheduling system for batch operations. Handles complex dependencies and parallel execution.",
    technologies: ["FastAPI", "Celery", "Redis", "PostgreSQL"],
    category: "Backend",
    imageUrl: "/images/covers/operation-schedules.svg",
  },
  {
    id: "6",
    slug: "pro-fit-club-dashboard",
    title: "Pro Fit Club Dashboard",
    description: "Fitness club management dashboard with member tracking, class scheduling, and revenue analytics.",
    technologies: ["React", "Node.js", "MongoDB", "Tailwind CSS"],
    category: "Web Dev",
    imageUrl: "/images/covers/pro-fit-club-dashboard.svg",
  },
];

const defaultCategories = ["All", "Web Dev", "Backend", "DevOps"];

// Transform Strapi 5 project data to the format expected by UI components (flat structure)
function transformProject(strapiProject: StrapiProject) {
  // Defensive check for valid project structure
  if (!strapiProject || !strapiProject.id) {
    return null;
  }

  return {
    id: strapiProject.id?.toString() || "",
    slug: strapiProject.slug || "",
    title: strapiProject.title || "Untitled",
    description: strapiProject.description || "",
    technologies: strapiProject.technologies || [],
    category: strapiProject.category?.name || "Uncategorized",
    imageUrl: strapiProject.cover_image ? getStrapiMedia(strapiProject.cover_image.url) : null,
  };
}

// Extract unique categories from projects (Strapi 5 flat format)
function extractCategories(projects: StrapiProject[]): string[] {
  const categorySet = new Set<string>();

  projects.forEach((project) => {
    if (project && project.category?.name) {
      categorySet.add(project.category.name);
    }
  });

  return Array.from(categorySet).sort();
}

async function getProjects() {
  try {
    const response = await fetchAPI<StrapiResponse<StrapiProject[]>>({
      endpoint: "/projects",
      query: {
        populate: ["cover_image", "category"],
        sort: ["featured:desc", "start_date:desc", "createdAt:desc"],
      },
      tags: ["projects"],
    });

    // Ensure we always return an array
    if (!response || !response.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

async function getCategories() {
  try {
    const response = await fetchAPI<StrapiResponse<Category[]>>({
      endpoint: "/categories",
      query: {
        filters: {
          type: {
            $in: ["project", "both"],
          },
        },
        sort: ["name:asc"],
      },
      tags: ["categories"],
    });

    // Ensure we always return an array
    if (!response || !response.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export default async function ProjectsPage() {
  const [strapiProjects, strapiCategories] = await Promise.all([
    getProjects(),
    getCategories(),
  ]);

  // Transform projects for UI (filter out null results)
  const transformedProjects = strapiProjects
    .map(transformProject)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Use transformed projects or fallback to defaults
  const projects = transformedProjects.length > 0 ? transformedProjects : defaultProjects;

  // Get category names, either from dedicated categories endpoint or from projects (Strapi 5 flat format)
  let categoryNames: string[];
  if (strapiCategories.length > 0) {
    categoryNames = strapiCategories
      .filter((cat) => cat && cat.name)
      .map((cat) => cat.name);
  } else if (strapiProjects.length > 0) {
    // Fallback: extract categories from projects
    categoryNames = extractCategories(strapiProjects);
  } else {
    // Use default categories when no API data
    categoryNames = [];
  }

  // Add "All" as the first option, or use defaults
  const categories = categoryNames.length > 0 ? ["All", ...categoryNames] : defaultCategories;

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto">
          <Reveal direction="up" duration={0.6}>
            <h1 className="text-display font-bold mb-6">Projects</h1>
          </Reveal>
          <Reveal direction="up" delay={0.1} duration={0.6}>
            <p className="text-xl text-muted-foreground max-w-2xl">
              A collection of projects I have worked on, ranging from web applications
              to backend systems and DevOps tools.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Client component for filtering and grid */}
      <ProjectsClient projects={projects} categories={categories} />
    </>
  );
}
