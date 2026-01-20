"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/animations/reveal";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ArticleHeader } from "@/components/blog/article-header";
import { ArticleToc } from "@/components/blog/article-toc";
import type { TocItem } from "@/lib/utils/generate-toc";
import { Twitter, Linkedin, Link2, ArrowLeft } from "lucide-react";

export interface ArticleData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  publishedDate: string;
  readingTime: number;
  author: string;
}

interface ArticleContentProps {
  article: ArticleData;
  relatedArticles: ArticleData[];
  tocItems: TocItem[];
}

export function ArticleContent({
  article,
  relatedArticles,
  tocItems,
}: ArticleContentProps) {
  const articleRef = useRef<HTMLElement>(null);

  const handleShare = (platform: "twitter" | "linkedin" | "copy") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = article.title;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        break;
    }
  };

  const formattedDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <>
      <ReadingProgress containerRef={articleRef} />

      <article ref={articleRef} className="min-h-screen">
        {/* Back Link */}
        <div className="container mx-auto px-4 pt-8">
          <Reveal>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </Reveal>
        </div>

        {/* Article Header */}
        <div className="container mx-auto px-4 max-w-4xl">
          <ArticleHeader
            title={article.title}
            category={article.category}
            author={article.author}
            publishedDate={article.publishedDate}
            readingTime={article.readingTime}
          />
        </div>

        {/* Cover Image Placeholder */}
        <Reveal delay={0.4}>
          <div className="w-full aspect-[21/9] bg-muted flex items-center justify-center my-8">
            <span className="text-muted-foreground">Cover Image</span>
          </div>
        </Reveal>

        {/* Two Column Layout */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12 max-w-6xl mx-auto">
            {/* Mobile TOC */}
            <div className="lg:hidden">
              <Reveal delay={0.5}>
                <div className="bg-muted/50 rounded-lg p-4 mb-8">
                  <ArticleToc items={tocItems} />
                </div>
              </Reveal>
            </div>

            {/* Article Content */}
            <Reveal delay={0.5}>
              <div
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:scroll-mt-24
                  prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                  prose-ul:text-muted-foreground prose-ul:my-4
                  prose-li:my-1
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </Reveal>

            {/* Desktop TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <Reveal delay={0.6} direction="right">
                  <ArticleToc items={tocItems} />
                </Reveal>
              </div>
            </aside>
          </div>
        </div>

        {/* Share Section */}
        <div className="container mx-auto px-4 max-w-4xl mt-16">
          <Reveal delay={0.2}>
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Share this article</h3>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("twitter")}
                  className="gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("linkedin")}
                  className="gap-2"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("copy")}
                  className="gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Related Articles */}
        <section className="container mx-auto px-4 py-16">
          <Reveal delay={0.1}>
            <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle, index) => (
              <Reveal key={relatedArticle.slug} delay={0.2 + index * 0.1}>
                <Card className="overflow-hidden p-0 gap-0 group h-full">
                  {/* Image placeholder */}
                  <div className="aspect-[16/9] bg-muted flex items-center justify-center border-b">
                    <span className="text-muted-foreground text-sm">
                      Featured Image
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col gap-3">
                    <Badge variant="secondary" className="w-fit">
                      {relatedArticle.category}
                    </Badge>

                    <Link href={`/blog/${relatedArticle.slug}`} className="block">
                      <h3 className="text-lg font-semibold leading-tight group-hover:underline underline-offset-4 transition-all line-clamp-2">
                        {relatedArticle.title}
                      </h3>
                    </Link>

                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {relatedArticle.excerpt}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
                      <span>{relatedArticle.readingTime} min read</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <time dateTime={relatedArticle.publishedDate}>
                        {formattedDate(relatedArticle.publishedDate)}
                      </time>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>
      </article>
    </>
  );
}
