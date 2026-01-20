import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleContent, type ArticleData } from "@/components/blog/article-content";
import { getPlaceholderToc } from "@/lib/utils/generate-toc";

// Placeholder articles data
const articles: ArticleData[] = [
  {
    slug: "building-trading-platform-nextjs-kafka",
    title: "Building a Trading Platform with Next.js and Kafka",
    excerpt: "How I architected a real-time trading platform handling live data for 214 stocks.",
    content: `
      <h2 id="introduction">Introduction</h2>
      <p>Building a real-time trading platform is one of the most challenging endeavors in modern web development. The combination of stringent performance requirements, the need for real-time data streaming, and the complexity of financial calculations creates a unique set of problems that demand innovative solutions.</p>
      <p>In this article, I'll walk you through how I architected and built a trading platform that handles live data for 214 stocks, processing thousands of price updates per second while maintaining a responsive user interface.</p>

      <h2 id="the-challenge">The Challenge</h2>
      <p>The primary challenge was handling real-time market data efficiently. Stock prices can update multiple times per second during active trading hours, and users expect to see these changes instantly. Traditional REST APIs simply couldn't keep up with the data volume and latency requirements.</p>
      <p>Additionally, we needed to support complex features like live portfolio valuation, price alerts, and historical chart rendering - all while maintaining sub-100ms response times.</p>

      <h2 id="architecture-overview">Architecture Overview</h2>
      <p>The solution involved a microservices architecture with Next.js on the frontend, Apache Kafka for event streaming, and a combination of PostgreSQL and Redis for data persistence and caching.</p>

      <h3 id="frontend-setup">Frontend Setup</h3>
      <p>The frontend was built using Next.js 14 with the App Router, leveraging Server Components for initial page loads and Client Components for real-time data subscriptions. We used WebSockets to establish persistent connections for streaming price updates.</p>
      <p>React Query handled server state management, providing automatic background refetching and optimistic updates for a snappy user experience.</p>

      <h3 id="backend-integration">Backend Integration</h3>
      <p>Our backend services were written in Go for maximum performance. Each service communicated through Kafka topics, ensuring loose coupling and high scalability. The order matching engine could process over 10,000 orders per second on a single node.</p>

      <h2 id="real-time-data">Real-time Data with Kafka</h2>
      <p>Apache Kafka served as the backbone of our real-time architecture. Market data providers published price updates to Kafka topics, and our services consumed these events to update user portfolios, trigger alerts, and feed the WebSocket servers.</p>
      <p>The key insight was using Kafka's consumer groups to horizontally scale our WebSocket servers while maintaining message ordering per symbol. This allowed us to add more servers during peak trading hours without any code changes.</p>

      <h2 id="performance-optimization">Performance Optimization</h2>
      <p>Several optimizations were crucial for achieving our performance targets:</p>
      <ul>
        <li>Implementing delta compression for WebSocket messages, reducing bandwidth by 70%</li>
        <li>Using Redis Streams for recent price history, avoiding expensive database queries</li>
        <li>Implementing request coalescing on the frontend to batch API calls</li>
        <li>Lazy loading charts and only rendering visible price points</li>
      </ul>

      <h2 id="lessons-learned">Lessons Learned</h2>
      <p>Building this platform taught me several valuable lessons about real-time systems:</p>
      <p>First, monitoring is critical. We implemented comprehensive observability from day one, which saved us countless hours during debugging. Distributed tracing, in particular, was invaluable for understanding end-to-end latency.</p>
      <p>Second, graceful degradation is non-negotiable. When upstream data providers had issues, our system needed to continue functioning with stale data while clearly communicating the situation to users.</p>

      <h2 id="conclusion">Conclusion</h2>
      <p>Building a real-time trading platform pushed the boundaries of what I thought was possible with modern web technologies. The combination of Next.js and Kafka proved to be a powerful foundation that scaled to meet our demanding requirements.</p>
      <p>The architecture patterns we developed - particularly around WebSocket management and Kafka consumer groups - have applications far beyond trading platforms. Any system requiring real-time data distribution can benefit from these approaches.</p>
    `,
    category: "Tech",
    publishedDate: "2026-01-15",
    readingTime: 8,
    author: "Rajat Kumar R",
  },
  {
    slug: "managing-indias-fastest-supercomputer",
    title: "Managing India's Fastest Supercomputer: Lessons Learned",
    excerpt: "Insights and lessons from managing one of the most powerful supercomputers in India.",
    content: `
      <h2 id="introduction">Introduction</h2>
      <p>Managing a supercomputer is unlike any other IT role. The scale of operations, the diversity of workloads, and the expectations of researchers create a unique environment that demands both technical excellence and strong communication skills.</p>

      <h2 id="the-challenge">The Challenge</h2>
      <p>Our supercomputer serves hundreds of researchers across dozens of institutions, running everything from climate simulations to drug discovery workloads. Balancing these competing demands while maintaining system stability is a constant challenge.</p>

      <h2 id="architecture-overview">Architecture Overview</h2>
      <p>The system comprises thousands of compute nodes connected via a high-speed InfiniBand network. Storage is provided by a parallel file system capable of hundreds of gigabytes per second throughput.</p>

      <h3 id="frontend-setup">Job Scheduling</h3>
      <p>We use SLURM for job scheduling, with custom plugins to enforce fair-share policies and priority queues for different research domains.</p>

      <h3 id="backend-integration">Monitoring Infrastructure</h3>
      <p>Comprehensive monitoring is essential. We collect millions of metrics per minute using Prometheus and visualize them with custom Grafana dashboards.</p>

      <h2 id="real-time-data">Real-time Monitoring</h2>
      <p>Real-time monitoring allows us to detect and respond to issues before they impact researchers. We've developed custom alerting rules that predict node failures hours in advance.</p>

      <h2 id="performance-optimization">Performance Optimization</h2>
      <p>Optimizing a supercomputer requires understanding both hardware and software at a deep level. We regularly work with researchers to profile and optimize their code.</p>

      <h2 id="lessons-learned">Lessons Learned</h2>
      <p>Documentation is crucial when managing complex systems. We maintain detailed runbooks for every operational procedure.</p>

      <h2 id="conclusion">Conclusion</h2>
      <p>Managing a supercomputer is challenging but incredibly rewarding. The impact our work has on scientific research makes every late-night page worthwhile.</p>
    `,
    category: "DevOps",
    publishedDate: "2026-01-10",
    readingTime: 12,
    author: "Rajat Kumar R",
  },
  {
    slug: "monolith-to-microservices-performance",
    title: "From Monolith to Microservices: A 90% Performance Improvement",
    excerpt: "A case study on migrating a monolithic application to microservices architecture.",
    content: `
      <h2 id="introduction">Introduction</h2>
      <p>Migrating from a monolithic architecture to microservices is one of the most significant technical decisions a team can make. This is the story of how we achieved a 90% improvement in response times.</p>

      <h2 id="the-challenge">The Challenge</h2>
      <p>Our monolithic application had grown over five years to over 500,000 lines of code. Deployments took hours, and a bug in any component could bring down the entire system.</p>

      <h2 id="architecture-overview">Architecture Overview</h2>
      <p>We identified natural service boundaries based on business domains and data ownership. The result was a system of 12 services communicating via REST and message queues.</p>

      <h3 id="frontend-setup">Service Decomposition</h3>
      <p>The first step was identifying which parts of the monolith could be extracted as independent services without requiring major refactoring.</p>

      <h3 id="backend-integration">Data Migration</h3>
      <p>Each service needed its own database. We used the strangler fig pattern to gradually migrate data while maintaining system availability.</p>

      <h2 id="real-time-data">Event-Driven Communication</h2>
      <p>Services communicate primarily through events, allowing for loose coupling and independent scaling.</p>

      <h2 id="performance-optimization">Performance Gains</h2>
      <p>The performance improvements came from multiple sources: independent scaling, caching at service boundaries, and optimized database queries.</p>

      <h2 id="lessons-learned">Lessons Learned</h2>
      <p>Start small. Extract the simplest, most independent component first to build confidence and establish patterns.</p>

      <h2 id="conclusion">Conclusion</h2>
      <p>The migration took 18 months but was worth every effort. Our system is now more reliable, scalable, and maintainable than ever before.</p>
    `,
    category: "Architecture",
    publishedDate: "2026-01-05",
    readingTime: 10,
    author: "Rajat Kumar R",
  },
  {
    slug: "leveraging-ai-tools-software-development",
    title: "Leveraging AI Tools in Software Development",
    excerpt: "Exploring how AI-powered tools are transforming software development workflows.",
    content: `
      <h2 id="introduction">Introduction</h2>
      <p>AI tools are revolutionizing how we write, test, and maintain code. From intelligent code completion to automated testing, these tools are becoming essential parts of the modern developer's toolkit.</p>

      <h2 id="the-challenge">The Challenge</h2>
      <p>Integrating AI tools effectively requires understanding their strengths and limitations. Blindly trusting AI-generated code can introduce subtle bugs.</p>

      <h2 id="architecture-overview">Tool Landscape</h2>
      <p>The current landscape includes code assistants like GitHub Copilot, code review tools, and automated testing frameworks.</p>

      <h3 id="frontend-setup">Code Generation</h3>
      <p>AI code assistants can significantly speed up routine coding tasks while allowing developers to focus on architecture and design decisions.</p>

      <h3 id="backend-integration">Testing Automation</h3>
      <p>AI can generate test cases, identify edge cases, and even suggest fixes for failing tests.</p>

      <h2 id="real-time-data">Real-time Assistance</h2>
      <p>The latest tools provide real-time suggestions as you type, learning from your codebase and coding patterns.</p>

      <h2 id="performance-optimization">Productivity Gains</h2>
      <p>Studies show 30-50% productivity improvements for routine tasks, with the biggest gains in documentation and test writing.</p>

      <h2 id="lessons-learned">Lessons Learned</h2>
      <p>AI tools are assistants, not replacements. Critical thinking and code review remain essential.</p>

      <h2 id="conclusion">Conclusion</h2>
      <p>Embracing AI tools while maintaining high standards for code quality is the key to maximizing their benefits.</p>
    `,
    category: "AI",
    publishedDate: "2026-01-01",
    readingTime: 6,
    author: "Rajat Kumar R",
  },
  {
    slug: "realtime-dashboards-django-plotly",
    title: "Building Real-time Dashboards with Django and Plotly",
    excerpt: "A comprehensive guide to creating interactive, real-time data visualization dashboards.",
    content: `
      <h2 id="introduction">Introduction</h2>
      <p>Real-time dashboards are essential for monitoring systems, tracking KPIs, and making data-driven decisions. This guide shows how to build one using Django and Plotly.</p>

      <h2 id="the-challenge">The Challenge</h2>
      <p>Creating responsive visualizations that update in real-time without overwhelming the server or client requires careful architecture.</p>

      <h2 id="architecture-overview">Architecture Overview</h2>
      <p>We use Django Channels for WebSocket support and Plotly for interactive charts that can update without full page reloads.</p>

      <h3 id="frontend-setup">Frontend Setup</h3>
      <p>Plotly.js on the frontend handles rendering and animations, while a thin JavaScript layer manages WebSocket connections.</p>

      <h3 id="backend-integration">Backend Integration</h3>
      <p>Django Channels consumers broadcast updates to connected clients, with Redis as the channel layer backend for scalability.</p>

      <h2 id="real-time-data">Real-time Updates</h2>
      <p>Data flows from sensors or APIs through Django, into Redis, and out to all connected dashboard clients within milliseconds.</p>

      <h2 id="performance-optimization">Performance Optimization</h2>
      <p>Techniques like data decimation, viewport-aware rendering, and efficient update protocols keep the dashboard responsive.</p>

      <h2 id="lessons-learned">Lessons Learned</h2>
      <p>Start with clear requirements around update frequency and data volume - these drive all architectural decisions.</p>

      <h2 id="conclusion">Conclusion</h2>
      <p>Django and Plotly make a powerful combination for real-time dashboards, offering both developer productivity and end-user experience.</p>
    `,
    category: "Web Dev",
    publishedDate: "2023-12-28",
    readingTime: 7,
    author: "Rajat Kumar R",
  },
];

function getArticle(slug: string): ArticleData | undefined {
  return articles.find((article) => article.slug === slug);
}

function getRelatedArticles(currentSlug: string, limit: number = 3): ArticleData[] {
  return articles
    .filter((article) => article.slug !== currentSlug)
    .slice(0, limit);
}

// Generate static params for all articles
export async function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
    };
  }

  return {
    title: article.title,
    description: article.excerpt,
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedDate,
      authors: [article.author],
      tags: [article.category],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
    },
  };
}

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(slug);
  const tocItems = getPlaceholderToc();

  return (
    <ArticleContent
      article={article}
      relatedArticles={relatedArticles}
      tocItems={tocItems}
    />
  );
}
