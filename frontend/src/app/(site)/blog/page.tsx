import type { Metadata } from "next";
import Link from "next/link";
import { cmsBlogPosts } from "@/lib/cms";
import { FALLBACK_POSTS, type FallbackPost } from "@/lib/cms/fallback";
import type { BlogPost } from "@/lib/cms/types";
import { pad2 } from "@/lib/sheet-format";

// Regenerate at most hourly — keeps ISR cadence fixed even if data fetches skip the cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Thoughts on software development, architecture, DevOps, and lessons learned from building scalable systems.",
};

type PostRow = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: number;
};

function toPostRow(p: BlogPost): PostRow {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category?.name || "Uncategorized",
    date: (p.published_date || p.publishedAt || new Date().toISOString()).slice(0, 10),
    readingTime: p.reading_time || 5,
  };
}

function toPostRowFromFallback(p: FallbackPost): PostRow {
  return { slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category, date: p.publishedAt, readingTime: p.readingTime };
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    return await cmsBlogPosts();
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return [];
  }
}

export default async function BlogPage() {
  const docs = await getPosts();
  const posts: PostRow[] = docs.length > 0 ? docs.map(toPostRow) : FALLBACK_POSTS.map(toPostRowFromFallback);

  return (
    <section id="blog" aria-labelledby="blog-h">
      <div className="container gv">
        <div className="sec-head">
          <h1 id="blog-h" className="t-h2" data-cons="text">
            Blog
          </h1>
          <p className="lab">{posts.length} posts · newest first</p>
        </div>
        <table className="idx">
          <caption className="sr-only">Blog posts, newest first. Each title links to the full post.</caption>
          <thead>
            <tr>
              <th scope="col">No.</th>
              <th scope="col">Title</th>
              <th scope="col" className="k">Category</th>
              <th scope="col" className="st">Date · read</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p, i) => (
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
                  {p.category}
                </td>
                <td className="st" data-fact>
                  {p.date} · {p.readingTime} min
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
