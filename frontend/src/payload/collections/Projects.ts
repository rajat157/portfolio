import type { CollectionConfig } from "payload";

import { parseDrawing } from "@/lib/drawing";

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "featured", "_status"],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Short tagline shown on cards and as the project page subtitle",
      },
    },
    {
      name: "content",
      type: "code",
      admin: {
        language: "markdown",
        description: "Full case study in Markdown",
      },
    },
    {
      name: "sheet",
      type: "group",
      admin: { description: "Featured case studies only: the sheet's title block and its four blocks." },
      fields: [
        { name: "short_title", type: "text", admin: { description: "Index and sheet title, e.g. Offpriced" } },
        { name: "kind", type: "text", admin: { description: "What it is. The index shows the part before ' — '." } },
        {
          name: "client",
          type: "text",
          admin: { description: "Who it was for (never name an anonymous client). The index shows the part before ' — '." },
        },
        { name: "problem", type: "textarea" },
        { name: "built", type: "textarea", admin: { description: "What I built — one item per line" } },
        { name: "decisions", type: "textarea", admin: { description: "Key decisions — one item per line" } },
        { name: "outcome", type: "textarea" },
      ],
    },
    {
      name: "drawing",
      type: "json",
      validate: (v: unknown) => v == null || parseDrawing(v) !== null || "Invalid drawing — see src/lib/drawing.ts",
      admin: { description: "Architecture drawing shown as the sheet's figure (shape: src/lib/drawing.ts)." },
    },
    {
      name: "cover_image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "gallery",
      type: "upload",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "technologies",
      type: "array",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "featured_order",
      type: "number",
      admin: { description: "Sheet order among featured projects, 1 = first" },
    },
    {
      name: "live_url",
      type: "text",
    },
    {
      name: "github_url",
      type: "text",
    },
    {
      name: "start_date",
      type: "date",
    },
    {
      name: "end_date",
      type: "date",
    },
  ],
};
