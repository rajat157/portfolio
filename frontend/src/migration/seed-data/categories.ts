/**
 * Category seed data
 */

export interface CategorySeed {
  name: string;
  slug: string;
  type: "project" | "blog" | "both";
  description: string;
  color: string;
}

export const categories: CategorySeed[] = [
  {
    name: "Web Dev",
    slug: "web-dev",
    type: "project",
    description: "Full-stack web development projects",
    color: "#3B82F6", // Blue
  },
  {
    name: "Backend",
    slug: "backend",
    type: "project",
    description: "Backend systems, APIs, and infrastructure",
    color: "#10B981", // Green
  },
  {
    name: "DevOps",
    slug: "devops",
    type: "both",
    description: "DevOps, cloud infrastructure, and system administration",
    color: "#F59E0B", // Amber
  },
  {
    name: "Architecture",
    slug: "architecture",
    type: "blog",
    description: "Software architecture patterns and system design",
    color: "#8B5CF6", // Purple
  },
  {
    name: "AI",
    slug: "ai",
    type: "blog",
    description: "Artificial intelligence and machine learning",
    color: "#EC4899", // Pink
  },
];
