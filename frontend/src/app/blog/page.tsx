"use client";

import { useState, useMemo } from "react";
import { Reveal } from "@/components/animations/reveal";
import { ArticleGrid, CategoryFilter, type Article } from "@/components/blog";

// Placeholder articles data (will connect to Strapi later)
const placeholderArticles: Article[] = [
  {
    id: "1",
    slug: "building-trading-platform-nextjs-kafka",
    title: "Building a Trading Platform with Next.js and Kafka",
    excerpt:
      "Learn how to build a high-performance trading platform using Next.js for the frontend and Apache Kafka for real-time event streaming and data processing.",
    category: "Tech",
    readingTime: 8,
    publishedAt: "2024-01-15",
  },
  {
    id: "2",
    slug: "managing-indias-fastest-supercomputer",
    title: "Managing India's Fastest Supercomputer: Lessons Learned",
    excerpt:
      "Insights and lessons from managing one of the most powerful supercomputers in India, covering infrastructure, monitoring, and optimization strategies.",
    category: "DevOps",
    readingTime: 12,
    publishedAt: "2024-01-10",
  },
  {
    id: "3",
    slug: "monolith-to-microservices-performance",
    title: "From Monolith to Microservices: A 90% Performance Improvement",
    excerpt:
      "A case study on migrating a monolithic application to microservices architecture, achieving significant performance gains and improved scalability.",
    category: "Architecture",
    readingTime: 10,
    publishedAt: "2024-01-05",
  },
  {
    id: "4",
    slug: "leveraging-ai-tools-software-development",
    title: "Leveraging AI Tools in Software Development",
    excerpt:
      "Exploring how AI-powered tools are transforming software development workflows, from code generation to automated testing and documentation.",
    category: "AI",
    readingTime: 6,
    publishedAt: "2024-01-01",
  },
  {
    id: "5",
    slug: "realtime-dashboards-django-plotly",
    title: "Building Real-time Dashboards with Django and Plotly",
    excerpt:
      "A comprehensive guide to creating interactive, real-time data visualization dashboards using Django backend and Plotly for dynamic charts.",
    category: "Web Dev",
    readingTime: 7,
    publishedAt: "2023-12-28",
  },
];

const categories = ["All", "Tech", "DevOps", "Architecture", "AI", "Web Dev"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") {
      return placeholderArticles;
    }
    return placeholderArticles.filter(
      (article) => article.category === activeCategory
    );
  }, [activeCategory]);

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Reveal delay={0.1}>
            <h1 className="text-hero font-bold tracking-tight mb-6">Blog</h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Thoughts on software development, architecture, DevOps, and
              lessons learned from building scalable systems.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Category Filter & Articles */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
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
          <ArticleGrid articles={filteredArticles} />
        </div>
      </section>
    </>
  );
}
