"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  category: string;
  imageUrl?: string;
}

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`} className="block group">
      <Card
        className={cn(
          "overflow-hidden p-0 gap-0 transition-all duration-300",
          "hover:scale-[1.02] hover:shadow-lg hover:shadow-foreground/5",
          className
        )}
      >
        {/* Image placeholder area */}
        <div className="aspect-video bg-muted relative overflow-hidden">
          {project.imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${project.imageUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <svg
                className="w-16 h-16 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Category badge overlay */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {project.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-5">
          {/* Title */}
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {project.description}
          </p>

          {/* Tech badges */}
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
            {project.technologies.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{project.technologies.length - 4}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
