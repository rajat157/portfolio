// Strapi API response types

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiMedia {
  id: number;
  attributes: {
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: {
      thumbnail?: StrapiImageFormat;
      small?: StrapiImageFormat;
      medium?: StrapiImageFormat;
      large?: StrapiImageFormat;
    };
    url: string;
  };
}

export interface StrapiImageFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

export interface Project {
  id: number;
  attributes: {
    title: string;
    slug: string;
    tagline: string | null;
    description: string;
    content: string | null;
    cover_image: { data: StrapiMedia | null };
    gallery: { data: StrapiMedia[] | null };
    technologies: string[];
    category: { data: Category | null };
    featured: boolean;
    featured_order: number;
    live_url: string | null;
    github_url: string | null;
    client: string | null;
    role: string | null;
    completion_date: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

export interface BlogPost {
  id: number;
  attributes: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image: { data: StrapiMedia | null };
    category: { data: Category | null };
    tags: string[];
    published_date: string;
    reading_time: number | null;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

export interface Category {
  id: number;
  attributes: {
    name: string;
    slug: string;
    type: "project" | "blog" | "both";
    description: string | null;
    color: string | null;
  };
}

export interface About {
  id: number;
  attributes: {
    name: string;
    headline: string;
    bio_short: string;
    bio_full: string | null;
    avatar: { data: StrapiMedia | null };
    resume_url: string | null;
    location: string | null;
    available_for_work: boolean;
    skills: Skill[];
    experience: Experience[];
    education: Education[];
  };
}

export interface Skill {
  id: number;
  name: string;
  category: "frontend" | "backend" | "design" | "devops" | "other";
  proficiency: number | null;
  icon: string | null;
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
  company_url: string | null;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  field: string | null;
  start_date: string;
  end_date: string | null;
  description: string | null;
}

export interface SiteSettings {
  id: number;
  attributes: {
    site_title: string;
    site_description: string;
    site_url: string | null;
    og_image: { data: StrapiMedia | null };
    social_links: SocialLink[];
    newsletter_enabled: boolean;
    newsletter_title: string | null;
    newsletter_description: string | null;
    copyright_text: string | null;
  };
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  label: string | null;
}
