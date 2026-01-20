export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Generates a table of contents from HTML content by extracting headings.
 * This is a placeholder implementation that works with rendered HTML.
 * In a real implementation, this would parse markdown or rich text content.
 *
 * @param content - The HTML content string to parse
 * @returns Array of TocItem objects representing the headings
 */
export function generateToc(content: string): TocItem[] {
  // Placeholder implementation - in production, this would parse
  // actual content from a CMS like Strapi
  const headingRegex = /<h([2-4])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[2-4]>/gi;
  const items: TocItem[] = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    items.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: match[3],
    });
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
