"use client";

import { Reveal } from "@/components/animations/reveal";
import { ProjectCard, type Project } from "./project-card";
import { cn } from "@/lib/utils";

interface ProjectGridProps {
  projects: Project[];
  className?: string;
}

export function ProjectGrid({ projects, className }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No projects found in this category.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
    >
      {projects.map((project, index) => (
        <Reveal
          key={project.id}
          delay={index * 0.1}
          duration={0.5}
          direction="up"
        >
          <ProjectCard project={project} />
        </Reveal>
      ))}
    </div>
  );
}
