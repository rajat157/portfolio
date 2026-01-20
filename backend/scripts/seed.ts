/**
 * Strapi Seed Script
 *
 * Populates Strapi with content extracted from Next.js frontend.
 *
 * Prerequisites:
 * 1. Strapi must be running (npm run develop)
 * 2. Admin user must be created
 * 3. Full Access API token must be generated in Strapi Admin → Settings → API Tokens
 * 4. Token added to backend/.env as STRAPI_SEED_TOKEN
 *
 * Usage:
 *   npm run seed
 *
 * Or with inline token:
 *   STRAPI_SEED_TOKEN=your_token npm run seed
 */

import "dotenv/config";

import {
  seedEntry,
  findBySlug,
  upsertSingleType,
  STRAPI_URL,
} from "./lib/strapi-client";
import { categories } from "./seed-data/categories";
import { projects } from "./seed-data/projects";
import { blogPosts } from "./seed-data/blog-posts";
import { aboutData } from "./seed-data/about";
import { siteSettings } from "./seed-data/site-settings";

interface Category {
  id: number;
  documentId: string;
  slug: string;
}

// Store category mappings for foreign key references
const categoryMap = new Map<string, Category>();

async function seedCategories() {
  console.log("\n📁 Seeding Categories...");

  for (const category of categories) {
    const { entry } = await seedEntry<Category>("categories", {
      name: category.name,
      slug: category.slug,
      type: category.type,
      description: category.description,
      color: category.color,
    });

    // Store for later reference
    categoryMap.set(category.slug, entry);
  }
}

async function seedProjects() {
  console.log("\n🚀 Seeding Projects...");

  for (const project of projects) {
    // Get category reference
    const category = categoryMap.get(project.categorySlug);

    await seedEntry("projects", {
      title: project.title,
      slug: project.slug,
      description: project.description,
      content: project.content,
      technologies: project.technologies,
      category: category?.documentId || null,
      featured: project.featured,
      featured_order: project.featured_order,
      live_url: project.live_url,
      github_url: project.github_url,
      start_date: project.start_date,
      end_date: project.end_date,
    });
  }
}

async function seedBlogPosts() {
  console.log("\n📝 Seeding Blog Posts...");

  for (const post of blogPosts) {
    // Get category reference
    const category = categoryMap.get(post.categorySlug);

    await seedEntry("blog-posts", {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: category?.documentId || null,
      tags: post.tags,
      published_date: post.published_date,
      reading_time: post.reading_time,
    });
  }
}

async function seedAbout() {
  console.log("\n👤 Seeding About...");

  try {
    const entry = await upsertSingleType("about", {
      name: aboutData.name,
      headline: aboutData.headline,
      bio_short: aboutData.bio_short,
      bio_full: aboutData.bio_full,
      location: aboutData.location,
      available_for_work: aboutData.available_for_work,
      resume_url: aboutData.resume_url,
      skills: aboutData.skills,
      experience: aboutData.experience,
      education: aboutData.education,
    });

    console.log("  ✅ About: single type updated");
  } catch (error) {
    console.error("  ❌ About: failed to update -", error);
  }
}

async function seedSiteSettings() {
  console.log("\n⚙️ Seeding Site Settings...");

  try {
    await upsertSingleType("site-setting", {
      site_title: siteSettings.site_title,
      site_description: siteSettings.site_description,
      social_links: siteSettings.social_links,
      newsletter_enabled: siteSettings.newsletter_enabled,
      contact_email: siteSettings.contact_email,
    });

    console.log("  ✅ Site Settings: single type updated");
  } catch (error) {
    console.error("  ❌ Site Settings: failed to update -", error);
  }
}

async function main() {
  console.log("🌱 Starting Strapi Seed Script");
  console.log(`   Strapi URL: ${STRAPI_URL}`);
  console.log("");

  try {
    // Seed in order (categories first, as they are referenced by others)
    await seedCategories();
    await seedProjects();
    await seedBlogPosts();
    await seedAbout();
    await seedSiteSettings();

    console.log("\n✨ Seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Blog Posts: ${blogPosts.length}`);
    console.log(`   - About: 1 (single type)`);
    console.log(`   - Site Settings: 1 (single type)`);

    console.log("\n🔗 Next steps:");
    console.log("   1. Verify content in Strapi Admin: http://localhost:1337/admin");
    console.log("   2. Test API endpoints:");
    console.log("      - curl http://localhost:1337/api/about?populate=*");
    console.log("      - curl http://localhost:1337/api/projects?populate=*");
    console.log("      - curl http://localhost:1337/api/blog-posts?populate=*");
    console.log("   3. Restart Next.js frontend to fetch new data");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
