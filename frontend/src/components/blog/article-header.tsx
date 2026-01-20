"use client";

import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations/reveal";
import { Calendar, Clock, User } from "lucide-react";

interface ArticleHeaderProps {
  title: string;
  category: string;
  author: string;
  publishedDate: string;
  readingTime: number;
}

export function ArticleHeader({
  title,
  category,
  author,
  publishedDate,
  readingTime,
}: ArticleHeaderProps) {
  const formattedDate = new Date(publishedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-8">
      {/* Category Badge */}
      <Reveal delay={0.1}>
        <Badge variant="secondary" className="mb-4">
          {category}
        </Badge>
      </Reveal>

      {/* Title */}
      <Reveal delay={0.2}>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
          {title}
        </h1>
      </Reveal>

      {/* Meta Information */}
      <Reveal delay={0.3}>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm md:text-base">
          {/* Author */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{author}</span>
          </div>

          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />

          {/* Published Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <time dateTime={publishedDate}>{formattedDate}</time>
          </div>

          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />

          {/* Reading Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{readingTime} min read</span>
          </div>
        </div>
      </Reveal>
    </header>
  );
}
