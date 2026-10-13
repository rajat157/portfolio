import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cmsBlogPosts, cmsBlogPostBySlug } from "@/lib/cms";
import type { BlogPost } from "@/lib/cms/types";
import { Markdown } from "@/components/markdown";
import { CopyButton } from "@/components/copy-button";
import { generateToc } from "@/lib/utils/generate-toc";
import { pad2 } from "@/lib/sheet-format";

// Regenerate at most hourly — keeps ISR cadence fixed even if data fetches skip the cache
export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await cmsBlogPostBySlug(slug);
  } catch (error) {
    console.error(`Failed to fetch blog post with slug "${slug}":`, error);
    return null;
  }
}

async function getAllPosts(): Promise<BlogPost[]> {
  try {
    return await cmsBlogPosts({ limit: 100 });
  } catch (error) {
    console.error("Failed to fetch all blog posts for static params:", error);
    return [];
  }
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.filter((p) => p?.slug).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Post not found",
      description: "The requested post could not be found.",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: "Rajat" }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.published_date || post.publishedAt,
      authors: ["Rajat"],
      tags: post.tags || [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const all = await getAllPosts();
  const postNo = all.findIndex((p) => p.slug === slug) + 1;
  const total = all.length;

  let related: BlogPost[] = [];
  try {
    related = await cmsBlogPosts({ excludeSlug: slug, limit: 2 });
  } catch (error) {
    console.error("Failed to fetch related posts:", error);
  }

  // Only h2/h3 (the body's raw ## and ### headings) go in the TOC.
  const tocItems = generateToc(post.content).filter((item) => item.level <= 3);
  const category = post.category?.name || "Uncategorized";
  const readingTime = post.reading_time || 5;
  const date = (post.published_date || post.publishedAt || new Date().toISOString()).slice(0, 10);

  const postUrl = `${siteUrl}/blog/${slug}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
  const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`;

  return (
    <div className="sheet">
      <div className="progress" aria-hidden="true" />
      <div className="sheet-top">
        <Link href="/blog" className="btn">
          ← Back to blog
        </Link>
        <p className="lab">
          Post {pad2(postNo)} of {pad2(total)} · {readingTime} min read
        </p>
      </div>

      <div className="sheet-grid">
        <div className="sh-head">
          <p className="lab" data-fact>
            {category}
          </p>
          <h1 className="sheet-title sheet-title--long" data-fact>
            {post.title}
          </h1>
          <p className="sheet-one" data-fact>
            {post.excerpt}
          </p>
        </div>

        <aside className="tb" aria-label="Title block">
          <dl>
            <div className="tb-row">
              <dt className="lab">Post</dt>
              <dd className="tb-sheet">
                {pad2(postNo)} / {pad2(total)}
              </dd>
            </div>
            <div className="tb-row">
              <dt className="lab">Published</dt>
              <dd className="mono" data-fact>
                {date}
              </dd>
            </div>
            <div className="tb-row">
              <dt className="lab">Reading</dt>
              <dd data-fact>{readingTime} min</dd>
            </div>
            <div className="tb-row">
              <dt className="lab">Category</dt>
              <dd data-fact>{category}</dd>
            </div>
            <div className="tb-row">
              <dt className="lab">Tags</dt>
              <dd data-fact>{post.tags && post.tags.length > 0 ? post.tags.join(", ") : "—"}</dd>
            </div>
          </dl>
          {tocItems.length > 0 && (
            <a className="tb-link toc-link" href="#toc">
              <span>Contents</span>
              <span aria-hidden="true">↓</span>
            </a>
          )}
        </aside>

        <div className="fig prose" data-fact>
          <Markdown content={post.content} headingShift />
        </div>

        {tocItems.length > 0 && (
          <nav className="toc tb" id="toc" aria-label="Contents">
            <h2>Contents</h2>
            <ul>
              {tocItems.map((item) => (
                <li key={item.id} data-level={item.level}>
                  <a href={`#${item.id}`}>{item.text}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="share">
        <CopyButton />
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
          LinkedIn<span aria-hidden="true">&nbsp;↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href={xUrl} target="_blank" rel="noopener noreferrer">
          X<span aria-hidden="true">&nbsp;↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="more-h">
          <div className="sec-head">
            <h2 id="more-h" className="t-h2" data-cons="text">
              More posts
            </h2>
          </div>
          <table className="idx">
            <caption className="sr-only">More posts.</caption>
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">Title</th>
                <th scope="col" className="k">Category</th>
                <th scope="col" className="st">Date · read</th>
              </tr>
            </thead>
            <tbody>
              {related.map((p, i) => (
                <tr className="prow" key={p.slug}>
                  <td className="sh">{pad2(i + 1)}</td>
                  <th scope="row">
                    <Link className="rowbtn" href={`/blog/${p.slug}`}>
                      {p.title}
                    </Link>
                    <p className="row-sub" data-fact>
                      {p.excerpt}
                    </p>
                  </th>
                  <td className="k" data-fact>
                    {p.category?.name || "Uncategorized"}
                  </td>
                  <td className="st" data-fact>
                    {(p.published_date || p.publishedAt || new Date().toISOString()).slice(0, 10)} · {p.reading_time || 5} min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
