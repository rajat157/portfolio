import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "site_title",
      type: "text",
      required: true,
    },
    {
      name: "site_description",
      type: "textarea",
    },
    {
      name: "site_url",
      type: "text",
    },
    {
      name: "og_image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "social_links",
      type: "array",
      fields: [
        { name: "platform", type: "text", required: true },
        { name: "url", type: "text", required: true },
        { name: "label", type: "text" },
      ],
    },
    {
      name: "newsletter_enabled",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "newsletter_title",
      type: "text",
    },
    {
      name: "newsletter_description",
      type: "textarea",
    },
    {
      name: "copyright_text",
      type: "text",
    },
  ],
};
