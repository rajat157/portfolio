"use client";

import { Reveal } from "@/components/animations/reveal";
import { Badge } from "@/components/ui/badge";
import type { Skill as StrapiSkill } from "@/lib/strapi/types";

interface SkillCategory {
  name: string;
  skills: string[];
  icon: string;
}

// Default fallback data when API returns empty
const defaultSkillCategories: SkillCategory[] = [
  {
    name: "Languages & Frameworks",
    icon: "code",
    skills: [
      "Python",
      "Django",
      "Flask",
      "FastAPI",
      "Node.js",
      "ReactJS",
      "Next.js",
      "Svelte",
    ],
  },
  {
    name: "Databases",
    icon: "database",
    skills: ["PostgreSQL", "MongoDB", "Redis"],
  },
  {
    name: "DevOps & Cloud",
    icon: "cloud",
    skills: [
      "Docker",
      "Kubernetes",
      "AWS",
      "GCP",
      "Azure",
      "OCI",
      "Jenkins",
      "Nginx",
    ],
  },
  {
    name: "Testing",
    icon: "test",
    skills: ["Pytest", "Selenium", "Automated Testing"],
  },
  {
    name: "Tools",
    icon: "tools",
    skills: ["Git", "Jira", "Confluence", "Kafka"],
  },
];

// Map Strapi skill categories to display names and icons
const categoryDisplayMap: Record<string, { name: string; icon: string }> = {
  frontend: { name: "Frontend", icon: "code" },
  backend: { name: "Backend", icon: "database" },
  devops: { name: "DevOps & Cloud", icon: "cloud" },
  design: { name: "Design", icon: "tools" },
  other: { name: "Other", icon: "tools" },
};

// Transform Strapi skills data to component format (grouped by category)
function transformSkills(skills: StrapiSkill[]): SkillCategory[] {
  const grouped = skills.reduce((acc, skill) => {
    const category = skill.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(grouped).map(([category, skillNames]) => ({
    name: categoryDisplayMap[category]?.name || category,
    icon: categoryDisplayMap[category]?.icon || "tools",
    skills: skillNames,
  }));
}

const iconMap: Record<string, React.ReactNode> = {
  code: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  database: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  ),
  cloud: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  test: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  ),
  tools: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

interface SkillsGridProps {
  skills?: StrapiSkill[];
}

export function SkillsGrid({ skills }: SkillsGridProps) {
  // Transform Strapi data or use defaults
  const skillCategories: SkillCategory[] = skills && skills.length > 0
    ? transformSkills(skills)
    : defaultSkillCategories;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skillCategories.map((category, index) => (
        <Reveal key={category.name} delay={index * 0.1}>
          <div className="bg-card border border-border rounded-xl p-6 h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-muted rounded-lg text-foreground">
                {iconMap[category.icon]}
              </div>
              <h3 className="font-semibold">{category.name}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
