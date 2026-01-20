"use client";

import { cn } from "@/lib/utils";

export type ProjectCategory = string;

interface ProjectFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function ProjectFilter({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}: ProjectFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            "border border-border hover:border-foreground/30",
            activeCategory === category
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
