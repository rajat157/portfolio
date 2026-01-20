"use client";

import { useState, useMemo } from "react";
import { Reveal } from "@/components/animations/reveal";
import { ProjectGrid } from "@/components/projects";

// Project type matching what UI components expect
export interface ProjectForUI {
  id: string;
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  category: string;
  imageUrl?: string | null;
}

interface ProjectsClientProps {
  projects: ProjectForUI[];
  categories: string[];
}

export function ProjectsClient({ projects, categories }: ProjectsClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredProjects = useMemo(() => {
    if (activeCategory === "All") {
      return projects;
    }
    return projects.filter((project) => project.category === activeCategory);
  }, [projects, activeCategory]);

  // Transform to match ProjectCard expected type
  const projectsForGrid = filteredProjects.map((p) => ({
    ...p,
    // Cast category to expected type or use as-is since we updated the component
    category: p.category as "Web Dev" | "Backend" | "DevOps",
    imageUrl: p.imageUrl || undefined,
  }));

  return (
    <>
      {/* Filter Section */}
      <section className="pb-8 px-4">
        <div className="container mx-auto">
          <Reveal direction="up" delay={0.2} duration={0.5}>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-border hover:border-foreground/30 ${
                    activeCategory === category
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="pb-24 px-4">
        <div className="container mx-auto">
          <ProjectGrid projects={projectsForGrid} />
        </div>
      </section>
    </>
  );
}
