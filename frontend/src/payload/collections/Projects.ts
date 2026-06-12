import type { CollectionConfig } from "payload";

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
