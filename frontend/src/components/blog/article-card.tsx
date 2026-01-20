"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  publishedAt: string;
  imageUrl?: string;
}

interface ArticleCardProps {
  article: Article;
  className?: string;
}

export function ArticleCard({ article, className }: ArticleCardProps) {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className={cn("overflow-hidden p-0 gap-0 group", className)}>
      {/* Image placeholder */}
      <div className="aspect-[16/9] bg-muted flex items-center justify-center border-b">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground text-sm">
            Featured Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-3">
        {/* Category badge */}
        <Badge variant="secondary" className="w-fit">
          {article.category}
        </Badge>

        {/* Title */}
        <Link href={`/blog/${article.slug}`} className="block">
          <h3 className="text-lg font-semibold leading-tight group-hover:underline underline-offset-4 transition-all">
            {article.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-muted-foreground text-sm line-clamp-2">
          {article.excerpt}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
          <span>{article.readingTime} min read</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <time dateTime={article.publishedAt}>{formattedDate}</time>
        </div>
      </div>
    </Card>
  );
}
