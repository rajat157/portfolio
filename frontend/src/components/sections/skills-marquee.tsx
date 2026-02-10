"use client";

import { motion } from "motion/react";
import Image from "next/image";

const skills = [
  { name: "Python", icon: "https://cdn.simpleicons.org/python" },
  { name: "Django", icon: "https://cdn.simpleicons.org/django" },
  { name: "Flask", icon: "https://cdn.simpleicons.org/flask" },
  { name: "FastAPI", icon: "https://cdn.simpleicons.org/fastapi" },
  { name: "Node.js", icon: "https://cdn.simpleicons.org/nodedotjs" },
  { name: "React", icon: "https://cdn.simpleicons.org/react" },
  { name: "Next.js", icon: "https://cdn.simpleicons.org/nextdotjs" },
  { name: "PostgreSQL", icon: "https://cdn.simpleicons.org/postgresql" },
  { name: "MongoDB", icon: "https://cdn.simpleicons.org/mongodb" },
  { name: "Redis", icon: "https://cdn.simpleicons.org/redis" },
  { name: "Docker", icon: "https://cdn.simpleicons.org/docker" },
  { name: "Kubernetes", icon: "https://cdn.simpleicons.org/kubernetes" },
  { name: "AWS", icon: "https://api.iconify.design/simple-icons/amazonaws.svg" },
  { name: "GCP", icon: "https://cdn.simpleicons.org/googlecloud" },
  { name: "Azure", icon: "https://api.iconify.design/simple-icons/microsoftazure.svg" },
  { name: "Git", icon: "https://cdn.simpleicons.org/git" },
  { name: "Kafka", icon: "https://cdn.simpleicons.org/apachekafka" },
];

function SkillBadge({ skill }: { skill: { name: string; icon: string } }) {
  return (
    <span className="inline-flex items-center gap-2.5 px-5 py-2.5 mx-2 text-sm font-medium bg-card border border-border rounded-full whitespace-nowrap hover:bg-muted transition-colors flex-shrink-0">
      <Image
        src={skill.icon}
        alt={skill.name}
        width={20}
        height={20}
        className="dark:invert flex-shrink-0"
        unoptimized
      />
      <span className="flex-shrink-0">{skill.name}</span>
    </span>
  );
}

export function SkillsMarquee() {
  // Duplicate the skills array for seamless infinite scroll
  const duplicatedSkills = [...skills, ...skills];

  return (
    <section className="py-16 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-heading font-bold text-center">Skills & Technologies</h2>
      </div>

      {/* First row - scrolling left */}
      <div className="relative flex overflow-hidden py-4">
        <motion.div
          className="flex"
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            x: {
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {duplicatedSkills.map((skill, index) => (
            <SkillBadge key={`row1-${skill}-${index}`} skill={skill} />
          ))}
        </motion.div>
      </div>

      {/* Second row - scrolling right */}
      <div className="relative flex overflow-hidden py-4">
        <motion.div
          className="flex"
          animate={{
            x: ["-50%", "0%"],
          }}
          transition={{
            x: {
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {duplicatedSkills.map((skill, index) => (
            <SkillBadge key={`row2-${skill}-${index}`} skill={skill} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
