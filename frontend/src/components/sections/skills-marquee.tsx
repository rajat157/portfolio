"use client";

import { motion } from "motion/react";

const skills = [
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "Node.js",
  "ReactJS",
  "Next.js",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Git",
  "Kafka",
];

function SkillBadge({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center px-4 py-2 mx-2 text-sm font-medium bg-card border border-border rounded-full whitespace-nowrap hover:bg-muted transition-colors">
      {skill}
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
