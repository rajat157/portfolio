import type { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "categories",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
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
      name: "type",
      type: "select",
      required: true,
      defaultValue: "both",
      options: [
        { label: "Project", value: "project" },
        { label: "Blog", value: "blog" },
        { label: "Both", value: "both" },
      ],
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "color",
      type: "text",
      admin: {
        description: "Optional hex color, e.g. #22d3ee",
      },
    },
  ],
};
