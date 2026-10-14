import type { CollectionConfig } from "payload";

export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
  access: {
    // signed-in admins see drafts; the public REST/GraphQL API sees published docs only (the site's own
    // queries use the local API, which skips access control and filters _status itself)
    read: ({ req }) => (req.user ? true : { _status: { equals: "published" } }),
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "published_date", "_status"],
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
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "content",
      type: "code",
      required: true,
      admin: {
        language: "markdown",
        description: "Article body in Markdown",
      },
    },
    {
      name: "cover_image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
    {
      name: "tags",
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
      name: "published_date",
      type: "date",
      required: true,
    },
    {
      name: "reading_time",
      type: "number",
      admin: {
        description: "Minutes; shown on cards and the article header",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
