import { Metadata } from "next";
import { fetchAPI, getStrapiMedia } from "@/lib/strapi/client";
import { Project as StrapiProject, Category, StrapiResponse } from "@/lib/strapi/types";
import { Reveal } from "@/components/animations/reveal";
import { ProjectsClient } from "./projects-client";

export const metadata: Metadata = {
  title: "Projects | Rajat Kumar R",
  description: "A collection of projects I have worked on, ranging from web applications to backend systems and DevOps tools.",
};

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
  const projects = strapiProjects
    .map(transformProject)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Get category names, either from dedicated categories endpoint or from projects (Strapi 5 flat format)
  let categoryNames: string[];
  if (strapiCategories.length > 0) {
    categoryNames = strapiCategories
      .filter((cat) => cat && cat.name)
      .map((cat) => cat.name);
  } else {
    // Fallback: extract categories from projects
    categoryNames = extractCategories(strapiProjects);
  }

  // Add "All" as the first option
  const categories = ["All", ...categoryNames];

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
