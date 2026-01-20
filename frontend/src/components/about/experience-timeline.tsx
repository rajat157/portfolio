"use client";

import { Reveal } from "@/components/animations/reveal";
import { Badge } from "@/components/ui/badge";

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string[];
  technologies?: string[];
}

const experiences: Experience[] = [
  {
    company: "Voltvave Innovations",
    role: "Freelance Software Architect & Developer",
    period: "Nov 2025 - Present",
    description: [
      'Built "Tredye" trading platform with Next.js 16, Docker, Redis, Kafka, PostgreSQL',
    ],
    technologies: ["Next.js", "Docker", "Redis", "Kafka", "PostgreSQL"],
  },
  {
    company: "Red Education",
    role: "Team Lead, Senior Python Support Engineer",
    period: "Feb 2024 - Aug 2025",
    description: [
      "Engineered Labbuild 2.0 achieving 90% faster performance",
      "Built Flask/MongoDB dashboard for monitoring",
      "Developed FastAPI APIs for internal services",
    ],
    technologies: ["Python", "Flask", "FastAPI", "MongoDB"],
  },
  {
    company: "Freelancer",
    role: "Technical Consultant",
    period: "Nov 2023 - Jan 2024",
    description: [
      "Developed Django/PostgreSQL/Svelte dashboard solutions",
      "Conducted AI tools research and implementation",
    ],
    technologies: ["Django", "PostgreSQL", "Svelte", "AI Tools"],
  },
  {
    company: "Offpriced Canada Inc.",
    role: "Senior Developer",
    period: "Jul 2022 - Oct 2023",
    description: [
      "Led team of 6 developers",
      "Built and maintained e-commerce platform",
      "Implemented Python automation solutions",
    ],
    technologies: ["Python", "E-commerce", "Team Leadership"],
  },
  {
    company: "HCL Technologies",
    role: "Lead Engineer SQA",
    period: "Oct 2021 - Jun 2022",
    description: [
      "Worked with Palo Alto Networks",
      "Developed Pytest automation framework",
      "Managed Kubernetes clusters",
    ],
    technologies: ["Pytest", "Kubernetes", "Palo Alto Networks"],
  },
  {
    company: "SERC, IISc",
    role: "System Engineer",
    period: "Jul 2019 - Sep 2021",
    description: [
      "Managed SahasraT supercomputer (33,000 cores) - India's fastest supercomputer",
      "Built Django dashboard for system monitoring",
    ],
    technologies: ["HPC", "Django", "Linux", "System Administration"],
  },
  {
    company: "TEKsystems/HPE",
    role: "Network Support Engineer",
    period: "Jun 2017 - Jun 2019",
    description: [
      "Provided AT&T L1 support",
      "Managed Aruba networking infrastructure",
    ],
    technologies: ["Aruba", "Networking", "AT&T"],
  },
];

export function ExperienceTimeline() {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border md:hidden" />

      <div className="space-y-12">
        {experiences.map((experience, index) => (
          <Reveal key={index} delay={index * 0.1} direction={index % 2 === 0 ? "left" : "right"}>
            <div
              className={`relative flex flex-col md:flex-row ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } gap-8 md:gap-16`}
            >
              {/* Timeline dot */}
              <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-foreground rounded-full -translate-x-1/2 mt-2 z-10" />

              {/* Content */}
              <div
                className={`flex-1 pl-12 md:pl-0 ${
                  index % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left"
                }`}
              >
                <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <span className="text-sm text-muted-foreground font-medium">
                    {experience.period}
                  </span>
                  <h3 className="text-xl font-bold mt-1">{experience.company}</h3>
                  <p className="text-primary font-medium mt-1">{experience.role}</p>
                  <ul
                    className={`mt-4 space-y-2 text-muted-foreground ${
                      index % 2 === 0 ? "md:text-right" : "md:text-left"
                    }`}
                  >
                    {experience.description.map((item, i) => (
                      <li key={i} className="text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                  {experience.technologies && (
                    <div
                      className={`mt-4 flex flex-wrap gap-2 ${
                        index % 2 === 0 ? "md:justify-end" : "md:justify-start"
                      }`}
                    >
                      {experience.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Empty space for alternating layout */}
              <div className="flex-1 hidden md:block" />
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
