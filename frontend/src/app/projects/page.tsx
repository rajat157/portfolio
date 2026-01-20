"use client";

import { useState, useMemo } from "react";
import { Reveal } from "@/components/animations/reveal";
import {
  ProjectGrid,
  ProjectFilter,
  type Project,
  type ProjectCategory,
} from "@/components/projects";

// Placeholder data - will be connected to Strapi later
const projects: Project[] = [
  {
    id: "1",
    slug: "tredye",
    title: "Tredye",
    description:
      "A comprehensive trading platform built with modern technologies for real-time data processing and high-performance trading operations.",
    technologies: ["Next.js 16", "Docker", "Redis", "Kafka", "PostgreSQL"],
    category: "Web Dev",
  },
  {
    id: "2",
    slug: "labbuild-2",
    title: "Labbuild 2.0",
    description:
      "An advanced lab automation tool designed to streamline virtual machine management and infrastructure provisioning in enterprise environments.",
    technologies: ["Python", "pyVmomi", "VMware"],
    category: "DevOps",
  },
  {
    id: "3",
    slug: "labbuild-dashboard",
    title: "Labbuild Dashboard",
    description:
      "A user-friendly web dashboard providing visibility and control over lab resources with real-time monitoring and management capabilities.",
    technologies: ["Flask", "MongoDB", "Bootstrap"],
    category: "Web Dev",
  },
  {
    id: "4",
    slug: "operation-schedules",
    title: "Operation Schedules",
    description:
      "A robust scheduling system for managing and automating operational tasks with flexible scheduling options and reliable execution.",
    technologies: ["FastAPI", "PostgreSQL", "Flask-APScheduler"],
    category: "Backend",
  },
  {
    id: "5",
    slug: "pro-fit-club-dashboard",
    title: "Pro Fit Club Dashboard",
    description:
      "A comprehensive fitness club management dashboard featuring member tracking, workout plans, and performance analytics.",
    technologies: ["Django", "PostgreSQL", "Svelte"],
    category: "Web Dev",
  },
  {
    id: "6",
    slug: "sahsarat-monitoring",
    title: "SahasraT Monitoring",
    description:
      "A monitoring solution for tracking system health and performance metrics with real-time alerts and detailed visualization dashboards.",
    technologies: ["Django", "PostgreSQL", "Twilio", "Plotly"],
    category: "DevOps",
  },
];

const categories: ProjectCategory[] = ["All", "Web Dev", "Backend", "DevOps"];

export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>("All");

  const filteredProjects = useMemo(() => {
    if (activeCategory === "All") {
      return projects;
    }
    return projects.filter((project) => project.category === activeCategory);
  }, [activeCategory]);

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto">
          <Reveal direction="up" duration={0.6}>
            <h1 className="text-display font-bold mb-6">Projects</h1>
          </Reveal>
          <Reveal direction="up" delay={0.1} duration={0.6}>
            <p className="text-xl text-muted-foreground max-w-2xl">
              A collection of projects I have worked on, ranging from web applications
              to backend systems and DevOps tools.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filter Section */}
      <section className="pb-8 px-4">
        <div className="container mx-auto">
          <Reveal direction="up" delay={0.2} duration={0.5}>
            <ProjectFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </Reveal>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="pb-24 px-4">
        <div className="container mx-auto">
          <ProjectGrid projects={filteredProjects} />
        </div>
      </section>
    </>
  );
}
