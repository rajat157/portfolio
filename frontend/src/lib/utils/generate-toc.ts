export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Generates a table of contents from content by extracting headings.
 * Supports both HTML headings and Markdown headings.
 *
 * @param content - The content string to parse (HTML or Markdown)
 * @returns Array of TocItem objects representing the headings
 */
export function generateToc(content: string): TocItem[] {
  const items: TocItem[] = [];

  // Try to parse as HTML first (for pre-rendered content)
  const htmlHeadingRegex = /<h([2-4])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[2-4]>/gi;
  let match;
  while ((match = htmlHeadingRegex.exec(content)) !== null) {
    items.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: match[3],
    });
  }

  // If no HTML headings found, try to parse as Markdown
  if (items.length === 0) {
    // Match markdown headings: ## Heading, ### Heading, #### Heading
    const markdownHeadingRegex = /^(#{2,4})\s+(.+)$/gm;
    while ((match = markdownHeadingRegex.exec(content)) !== null) {
      const level = match[1].length; // Number of # symbols
      const text = match[2].trim();
      const id = slugify(text);
      items.push({
        level,
        id,
        text,
      });
    }
  }

  return items;
}

/**
 * Generates a slug from a heading text.
 * Useful for creating IDs for headings.
 *
 * @param text - The heading text to slugify
 * @returns A URL-safe slug string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Placeholder TOC items for demo purposes.
 * These would normally be generated from actual article content.
 */
export function getPlaceholderToc(): TocItem[] {
  return [
    { id: "introduction", text: "Introduction", level: 2 },
    { id: "the-challenge", text: "The Challenge", level: 2 },
    { id: "architecture-overview", text: "Architecture Overview", level: 2 },
    { id: "frontend-setup", text: "Frontend Setup", level: 3 },
    { id: "backend-integration", text: "Backend Integration", level: 3 },
    { id: "real-time-data", text: "Real-time Data with Kafka", level: 2 },
    { id: "performance-optimization", text: "Performance Optimization", level: 2 },
    { id: "lessons-learned", text: "Lessons Learned", level: 2 },
    { id: "conclusion", text: "Conclusion", level: 2 },
  ];
}
