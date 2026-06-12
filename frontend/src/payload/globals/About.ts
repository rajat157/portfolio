import type { GlobalConfig } from "payload";

export const About: GlobalConfig = {
  slug: "about",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "headline",
      type: "text",
    },
    {
      name: "bio_short",
      type: "textarea",
    },
    {
      name: "bio_full",
      type: "code",
      admin: {
        language: "markdown",
      },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "resume_url",
      type: "text",
      admin: {
        description: "Link to the resume PDF (external URL or /resume.pdf)",
      },
    },
    {
      name: "location",
      type: "text",
    },
    {
      name: "available_for_work",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "skills",
      type: "array",
      fields: [
        { name: "name", type: "text", required: true },
        {
          name: "category",
          type: "select",
          options: ["frontend", "backend", "design", "devops", "other"],
          defaultValue: "other",
        },
        { name: "proficiency", type: "number", min: 0, max: 100 },
        { name: "icon", type: "text" },
      ],
    },
    {
      name: "experience",
      type: "array",
      fields: [
        { name: "company", type: "text", required: true },
        { name: "position", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "start_date", type: "date", required: true },
        { name: "end_date", type: "date" },
        { name: "is_current", type: "checkbox", defaultValue: false },
        { name: "location", type: "text" },
        { name: "company_url", type: "text" },
      ],
    },
    {
      name: "education",
      type: "array",
      fields: [
        { name: "institution", type: "text", required: true },
        { name: "degree", type: "text", required: true },
        { name: "field", type: "text" },
        { name: "start_date", type: "date" },
        { name: "end_date", type: "date" },
        { name: "description", type: "textarea" },
      ],
    },
  ],
};
