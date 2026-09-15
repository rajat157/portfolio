import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ["image/*", "application/pdf", "video/mp4"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
};
