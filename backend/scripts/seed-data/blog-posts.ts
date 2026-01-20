/**
 * Blog post seed data
 * Extracted from frontend/src/app/page.tsx
 */

export interface BlogPostSeed {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  tags: string[];
  published_date: string;
  reading_time: number;
  featured: boolean;
}

export const blogPosts: BlogPostSeed[] = [
  {
    title: "Building Real-Time Trading Platforms",
    slug: "building-real-time-trading-platforms",
    excerpt:
      "Lessons learned from architecting high-frequency trading systems with modern tech stack.",
    content: `
# Building Real-Time Trading Platforms

After spending months building Tredye, a real-time trading platform, I've accumulated valuable insights into the unique challenges of financial technology systems. Here's what I learned.

## The Challenge of Real-Time

Trading platforms have unique requirements that push traditional web architectures to their limits:

- **Sub-millisecond latency**: Price updates must reach users instantly
- **High throughput**: Thousands of events per second per user
- **Data consistency**: Order execution must be atomic and reliable
- **Always-on reliability**: Downtime means lost money

## Architecture Decisions

### Message-Driven Architecture

We chose Apache Kafka as our event backbone. Every price tick, order, and trade is an event flowing through Kafka topics. This provides:

1. **Durability**: Events are persisted and can be replayed
2. **Ordering**: Critical for maintaining price history
3. **Scalability**: Easy to add more consumers as load increases

### WebSocket Strategy

REST APIs don't cut it for real-time data. We implemented a WebSocket layer with:

- **Connection pooling**: Efficient resource management
- **Heartbeat mechanism**: Detect and recover from stale connections
- **Reconnection logic**: Automatic recovery with exponential backoff
- **Message batching**: Aggregate updates within animation frames

### State Management

The frontend uses a carefully designed state architecture:

\`\`\`typescript
// Tick batching for smooth updates
const tickBuffer = new Map<string, PriceTick>();
const BATCH_INTERVAL = 16; // 60fps

setInterval(() => {
  if (tickBuffer.size > 0) {
    updatePrices(Array.from(tickBuffer.values()));
    tickBuffer.clear();
  }
}, BATCH_INTERVAL);
\`\`\`

## Lessons Learned

### 1. Measure Everything

Without metrics, you're flying blind. We instrumented:
- WebSocket message latency
- Order execution time
- UI render performance
- Database query duration

### 2. Plan for Failure

In trading systems, failure modes must be well-defined:
- What happens when Kafka is down?
- How do we handle database failover?
- What's the degraded experience for users?

### 3. Test Under Load

We discovered critical bugs only under production-like load. Invest in load testing infrastructure early.

## Conclusion

Building real-time trading platforms is challenging but rewarding. The key is embracing event-driven architecture, investing in observability, and planning for failure from day one.
    `.trim(),
    categorySlug: "architecture",
    tags: ["trading", "real-time", "kafka", "websocket", "architecture"],
    published_date: "2026-01-15",
    reading_time: 8,
    featured: true,
  },
  {
    title: "AI-Accelerated Development",
    slug: "ai-accelerated-development",
    excerpt: "How I use Claude and Gemini to 10x my development productivity.",
    content: `
# AI-Accelerated Development

AI coding assistants have fundamentally changed how I build software. Here's my practical workflow for leveraging Claude, Gemini, and other AI tools effectively.

## The Productivity Multiplier

After integrating AI assistants into my workflow, I've seen dramatic improvements:

- **Code generation**: 3-5x faster for boilerplate and CRUD operations
- **Debugging**: Issues that took hours now take minutes
- **Learning**: Exploring new frameworks and libraries is much faster
- **Documentation**: Auto-generated docs and comments

## My AI Toolkit

### Claude (Anthropic)

My primary coding assistant. Excels at:
- Complex architectural discussions
- Code review and refactoring suggestions
- Explaining unfamiliar codebases
- Writing comprehensive documentation

### Gemini (Google)

Great for:
- Quick code snippets
- Stack Overflow-style Q&A
- Rapid prototyping

### GitHub Copilot

Integrated directly in VS Code:
- Line-by-line completions
- Function generation from comments
- Test case suggestions

## Effective Prompting Strategies

### 1. Provide Context

Bad:
> "Write a function to process users"

Good:
> "Write a TypeScript function that takes an array of User objects (with id, name, email fields), filters out users without verified emails, and returns them sorted by name. Include JSDoc comments."

### 2. Iterate and Refine

AI rarely gets it perfect on the first try. Use follow-up prompts:
- "Now add error handling for invalid input"
- "Optimize this for large arrays"
- "Add unit tests for edge cases"

### 3. Review Critically

AI-generated code needs human review:
- Check for security issues
- Verify business logic
- Ensure consistency with codebase style

## Practical Examples

### Rapid Prototyping

When building Tredye's order form, I described the requirements to Claude and had a working prototype in minutes:

\`\`\`
Me: "Create a React component for a trading order form with:
- Buy/Sell toggle
- Symbol input with autocomplete
- Quantity input with validation
- Order type dropdown (market, limit, stop)
- Price input (disabled for market orders)
- Submit button with loading state"

Claude: [generates complete component with TypeScript types]
\`\`\`

### Debugging Sessions

When facing a cryptic error, I paste the stack trace and relevant code:

\`\`\`
Me: "I'm getting 'Cannot read property of undefined' in this Kafka consumer code: [code]. The error happens when processing messages after the consumer has been running for about 30 minutes."

Claude: "The issue is likely a race condition in your message handler. When the consumer rebalances partitions, pending promises aren't being cancelled..."
\`\`\`

## The Future

AI assistants will only get better. My advice:
1. Start using them now to build the skill
2. Focus on clear communication
3. Always verify and understand the output

The goal isn't to replace thinking - it's to amplify it.
    `.trim(),
    categorySlug: "ai",
    tags: ["ai", "claude", "gemini", "productivity", "copilot"],
    published_date: "2026-01-10",
    reading_time: 5,
    featured: false,
  },
  {
    title: "Managing India's Fastest Supercomputer",
    slug: "managing-supercomputers",
    excerpt: "My experience managing SahasraT at IISc with 33,000 cores.",
    content: `
# Managing India's Fastest Supercomputer

For two years, I had the privilege of managing SahasraT, the supercomputer at the Indian Institute of Science (IISc). Here's what it's like to operate a machine that serves hundreds of researchers.

## What is SahasraT?

SahasraT (meaning "thousand-headed" in Sanskrit) was India's fastest supercomputer during my tenure at SERC (Supercomputer Education and Research Centre). The numbers are impressive:

- **33,000+ CPU cores** across 1,500+ nodes
- **Petabytes of storage** using Lustre parallel filesystem
- **InfiniBand interconnect** with 100 Gbps bandwidth
- **Serving 500+ researchers** from institutions across India

## Daily Operations

### Morning Health Checks

Every day started with reviewing overnight alerts:
- Node failures (typically 1-3 nodes per day in a system this size)
- Storage utilization (researchers can fill a petabyte surprisingly fast)
- Job queue status (SLURM scheduler logs)
- Network performance metrics

### User Support

Researchers aren't systems administrators. Common support requests:
- "My job has been queued for 3 days"
- "I need more storage quota"
- "Why is my MPI program only using one node?"
- "Can you install [obscure library]?"

### Incident Response

When 33,000 cores depend on you, incidents are inevitable:

**Memorable Incident #1**: A researcher's job ran away with memory, causing the Lustre filesystem to thrash. We had to identify and kill the job while 200 other jobs were affected.

**Memorable Incident #2**: A power fluctuation took down an entire rack. Coordinating with facilities to restore power while managing user expectations was challenging.

## The Dashboard I Built

Manual monitoring wasn't scalable. I built a Django dashboard that:

1. **Aggregated metrics** from SLURM, Nagios, and custom agents
2. **Visualized node health** with an interactive cluster map
3. **Tracked job analytics** - which queues are busy, average wait times
4. **Automated reporting** - weekly utilization reports for management

### Technical Challenges

**Data volume**: With 33,000 cores reporting metrics every minute, we generated gigabytes of time-series data daily. PostgreSQL with TimescaleDB handled this efficiently.

**Real-time updates**: Users wanted live job status. Server-Sent Events provided efficient push updates without WebSocket complexity.

**Authentication**: Integrating with the institute's LDAP while maintaining security was tricky.

## Lessons for Any Large System

### 1. Automation is Essential

At scale, manual intervention doesn't work. Automate:
- Health checks
- Log rotation
- Backup verification
- User provisioning

### 2. Documentation Saves Lives

When I started, tribal knowledge was scattered. I documented:
- Runbooks for common incidents
- Architecture diagrams
- Vendor contact information
- Escalation procedures

### 3. Capacity Planning

Researchers always want more. Track usage trends and plan expansion before you hit limits.

## Conclusion

Operating a supercomputer taught me systems thinking at scale. The principles - automation, monitoring, documentation, capacity planning - apply to any distributed system, from Kubernetes clusters to cloud infrastructure.

If you get the chance to work on large-scale systems, take it. The experience is invaluable.
    `.trim(),
    categorySlug: "devops",
    tags: ["hpc", "supercomputer", "linux", "infrastructure", "iisc"],
    published_date: "2026-01-05",
    reading_time: 12,
    featured: false,
  },
];
