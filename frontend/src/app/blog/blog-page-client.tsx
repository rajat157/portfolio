"use client";

import { useState, useMemo } from "react";
import { Reveal } from "@/components/animations/reveal";
import { ArticleGrid, CategoryFilter, type Article } from "@/components/blog";

interface BlogPageClientProps {
  articles: Article[];
  categories: string[];
}

export function BlogPageClient({ articles, categories }: BlogPageClientProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") {
      return articles;
    }
    return articles.filter((article) => article.category === activeCategory);
  }, [activeCategory, articles]);

  // Handle empty state
  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <Reveal delay={0.3}>
          <p className="text-muted-foreground text-lg">
            No blog posts available yet. Check back soon!
          </p>
        </Reveal>
      </div>
    );
  }

  return (
    <>
      {/* Category Filter */}
      <Reveal delay={0.3}>
        <div className="flex justify-center mb-12">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      </Reveal>

      {/* Article Grid */}
      {filteredArticles.length > 0 ? (
        <ArticleGrid articles={filteredArticles} />
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No articles found in this category.
          </p>
        </div>
      )}
    </>
  );
}
