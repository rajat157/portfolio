"use client";

import { Reveal } from "@/components/animations/reveal";
import { ArticleCard, type Article } from "./article-card";

interface ArticleGridProps {
  articles: Article[];
}

export function ArticleGrid({ articles }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No articles found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, index) => (
        <Reveal key={article.id} delay={0.1 * (index % 6)}>
          <ArticleCard article={article} />
        </Reveal>
      ))}
    </div>
  );
}
