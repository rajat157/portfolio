"use client";

import { useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/animations/reveal";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ArticleHeader } from "@/components/blog/article-header";
import { ArticleToc } from "@/components/blog/article-toc";
import type { TocItem } from "@/lib/utils/generate-toc";
import { slugify } from "@/lib/utils/generate-toc";
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
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
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

        {/* Cover Image */}
        {article.coverImageUrl && (
          <Reveal delay={0.4}>
            <div className="container mx-auto px-4 my-8">
              <div className="max-w-4xl mx-auto aspect-[21/9] relative rounded-xl overflow-hidden border border-border">
                <img
                  src={article.coverImageUrl}
                  alt={article.coverImageAlt || article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        )}

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
              <div className="max-w-none">
                {article.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => {
                        const text = String(children);
                        const id = slugify(text);
                        return <h1 id={id} className="text-4xl font-bold tracking-tight mt-12 mb-6 text-foreground scroll-mt-24">{children}</h1>;
                      },
                      h2: ({ children }) => {
                        const text = String(children);
                        const id = slugify(text);
                        return <h2 id={id} className="text-2xl font-bold tracking-tight mt-12 mb-4 text-foreground scroll-mt-24 border-b border-border/50 pb-2">{children}</h2>;
                      },
                      h3: ({ children }) => {
                        const text = String(children);
                        const id = slugify(text);
                        return <h3 id={id} className="text-xl font-semibold mt-8 mb-3 text-foreground scroll-mt-24">{children}</h3>;
                      },
                      h4: ({ children }) => {
                        const text = String(children);
                        const id = slugify(text);
                        return <h4 id={id} className="text-lg font-semibold mt-6 mb-2 text-foreground/90 scroll-mt-24">{children}</h4>;
                      },
                      p: ({ children }) => (
                        <p className="text-muted-foreground leading-relaxed mb-6 text-base">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-outside ml-6 my-6 space-y-2 text-muted-foreground marker:text-primary/70">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-outside ml-6 my-6 space-y-2 text-muted-foreground marker:text-foreground/50">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="pl-2 leading-relaxed">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/60 pl-6 py-4 my-8 bg-muted/30 rounded-r-lg italic text-muted-foreground/90">{children}</blockquote>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-muted/80 border border-border rounded-lg p-4 my-6 overflow-x-auto">{children}</pre>
                      ),
                      code: ({ className, children, ...props }) => {
                        const isInline = !className;
                        if (isInline) {
                          return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary/90 border border-border/50" {...props}>{children}</code>;
                        }
                        return <code className="text-sm font-mono text-foreground/90" {...props}>{children}</code>;
                      },
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target={href?.startsWith("http") ? "_blank" : undefined}
                          rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors"
                        >
                          {children}
                        </a>
                      ),
                      img: ({ src, alt }) => (
                        <figure className="my-8">
                          <div className="rounded-lg overflow-hidden border border-border/50">
                            <img src={src} alt={alt || "Article image"} className="w-full h-auto" />
                          </div>
                          {alt && (
                            <figcaption className="text-sm text-muted-foreground/70 text-center mt-3 italic">{alt}</figcaption>
                          )}
                        </figure>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      hr: () => (
                        <hr className="my-8 border-border/50" />
                      ),
                    }}
                  >
                    {article.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">No content available.</p>
                )}
              </div>
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
                  {/* Cover Image */}
                  <div className="aspect-[16/9] bg-muted flex items-center justify-center border-b relative overflow-hidden">
                    {relatedArticle.coverImageUrl ? (
                      <img
                        src={relatedArticle.coverImageUrl}
                        alt={relatedArticle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Featured Image
                      </span>
                    )}
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
