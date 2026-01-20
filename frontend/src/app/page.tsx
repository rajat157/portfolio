import { Hero, SkillsMarquee } from "@/components/sections";

export default function Home() {
  return (
    <>
      <Hero />

      {/* Skills Marquee Section */}
      <SkillsMarquee />

      {/* About Preview Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-heading font-bold mb-6">About Me</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Experienced Software Architect with 8+ years building high-performance systems.
            From managing India&apos;s fastest supercomputer (SahasraT at IISc) to architecting
            real-time trading platforms, I bring deep expertise in Python, cloud infrastructure,
            and modern web technologies.
          </p>
          <a
            href="/about"
            className="text-foreground font-medium hover:underline underline-offset-4"
          >
            Learn more about me &rarr;
          </a>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-heading font-bold">Featured Projects</h2>
            <a
              href="/projects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              View all &rarr;
            </a>
          </div>

          {/* Project grid placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-[4/3] bg-card rounded-lg border border-border flex items-center justify-center text-muted-foreground"
              >
                Project {i} (Connect to Strapi)
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-heading font-bold">Latest Posts</h2>
            <a
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              View all &rarr;
            </a>
          </div>

          {/* Blog post grid placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-card rounded-lg border border-border"
              >
                <span className="text-xs text-muted-foreground">5 min read</span>
                <h3 className="text-lg font-semibold mt-2 mb-3">
                  Blog Post Title {i}
                </h3>
                <p className="text-muted-foreground text-sm">
                  A brief excerpt of the blog post content goes here...
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-heading font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-8">
            Subscribe to my newsletter to get updates on new projects, blog posts,
            and things I find interesting.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
