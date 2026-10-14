// Server component: renders case-study / blog markdown bodies in the sheet
// language. Heading ids come from the same slugify() the TOC uses, so the
// two never drift. `data-fact` wraps the whole body: it is real project
// content, not design copy, and the verify harness' banned-word scan skips it.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { slugify } from "@/lib/utils/generate-toc";

interface MarkdownProps {
  content: string;
  /** Shifts h1-h4 down one level, so the body's own headings nest under the page's h1. */
  headingShift?: boolean;
}

function textOf(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(textOf).join("");
  return "";
}

function Heading({ level, shift, children }: { level: 1 | 2 | 3 | 4; shift: boolean; children?: ReactNode }) {
  const id = slugify(textOf(children));
  switch (shift ? level + 1 : level) {
    case 2:
      return <h2 id={id}>{children}</h2>;
    case 3:
      return <h3 id={id}>{children}</h3>;
    case 4:
      return <h4 id={id}>{children}</h4>;
    case 5:
      return <h5 id={id}>{children}</h5>;
    default:
      return <h1 id={id}>{children}</h1>;
  }
}

export function Markdown({ content, headingShift = false }: MarkdownProps) {
  return (
    <div data-fact>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <Heading level={1} shift={headingShift}>
              {children}
            </Heading>
          ),
          h2: ({ children }) => (
            <Heading level={2} shift={headingShift}>
              {children}
            </Heading>
          ),
          h3: ({ children }) => (
            <Heading level={3} shift={headingShift}>
              {children}
            </Heading>
          ),
          h4: ({ children }) => (
            <Heading level={4} shift={headingShift}>
              {children}
            </Heading>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
