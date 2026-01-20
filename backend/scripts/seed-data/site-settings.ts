/**
 * Site settings seed data
 */

export interface SocialLinkSeed {
  platform: string;
  url: string;
  label: string;
}

export interface SiteSettingsSeed {
  site_title: string;
  site_description: string;
  social_links: SocialLinkSeed[];
  newsletter_enabled: boolean;
  contact_email: string;
}

export const siteSettings: SiteSettingsSeed = {
  site_title: "Rajat Kumar R - Software Architect & Developer",
  site_description:
    "Portfolio of Rajat Kumar R, a Software Architect with 8+ years of experience building high-performance systems, from supercomputers to trading platforms.",
  social_links: [
    {
      platform: "github",
      url: "https://github.com/rajatkumarr",
      label: "GitHub",
    },
    {
      platform: "linkedin",
      url: "https://linkedin.com/in/rajatkumarr",
      label: "LinkedIn",
    },
    {
      platform: "twitter",
      url: "https://twitter.com/rajatkumarr",
      label: "Twitter",
    },
    {
      platform: "email",
      url: "mailto:rajat.kumar.r@outlook.com",
      label: "Email",
    },
  ],
  newsletter_enabled: true,
  contact_email: "rajat.kumar.r@outlook.com",
};
