/**
 * About seed data
 * Extracted from frontend/src/app/about/page.tsx and related components
 */

export interface SkillSeed {
  name: string;
  category: "frontend" | "backend" | "devops" | "design" | "other";
  proficiency: number;
}

export interface ExperienceSeed {
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  location: string;
  company_url: string | null;
}

export interface EducationSeed {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

export interface AboutSeed {
  name: string;
  headline: string;
  bio_short: string;
  bio_full: string;
  location: string;
  available_for_work: boolean;
  resume_url: string | null;
  skills: SkillSeed[];
  experience: ExperienceSeed[];
  education: EducationSeed[];
}

export const aboutData: AboutSeed = {
  name: "Rajat Kumar R",
  headline: "Software Architect & Developer",
  bio_short:
    "Experienced Software Architect with 8+ years building high-performance systems. From managing India's fastest supercomputer (SahasraT at IISc) to architecting real-time trading platforms, I bring deep expertise in Python, cloud infrastructure, and modern web technologies. Passionate about leveraging AI tools like Claude and Gemini to accelerate development.",
  bio_full: `I'm a Software Architect and Developer based in Bangalore, India, with over 8 years of experience building systems that scale.

My journey in tech has taken me through diverse domains - from managing SahasraT, India's fastest supercomputer at IISc with 33,000 cores, to building real-time trading platforms and high-performance lab infrastructure systems.

I specialize in Python, cloud infrastructure (AWS, GCP, Azure), and modern web technologies. I'm particularly passionate about:

- **System Design**: Architecting scalable, maintainable systems
- **Performance Optimization**: Making things fast and efficient
- **Developer Experience**: Building tools that developers love to use
- **AI-Accelerated Development**: Leveraging Claude, Gemini, and Copilot to boost productivity

When I'm not coding, you'll find me exploring photography, music production, or experimenting in the kitchen. I'm always open to discussing interesting projects and opportunities.`,
  location: "Bangalore, India",
  available_for_work: true,
  resume_url: "/resume.pdf",
  skills: [
    // Languages & Frameworks
    { name: "Python", category: "backend", proficiency: 95 },
    { name: "Django", category: "backend", proficiency: 90 },
    { name: "Flask", category: "backend", proficiency: 90 },
    { name: "FastAPI", category: "backend", proficiency: 85 },
    { name: "Node.js", category: "backend", proficiency: 75 },
    { name: "TypeScript", category: "frontend", proficiency: 80 },
    { name: "React", category: "frontend", proficiency: 80 },
    { name: "Next.js", category: "frontend", proficiency: 85 },
    { name: "Svelte", category: "frontend", proficiency: 70 },

    // Databases
    { name: "PostgreSQL", category: "backend", proficiency: 85 },
    { name: "MongoDB", category: "backend", proficiency: 80 },
    { name: "Redis", category: "backend", proficiency: 80 },

    // DevOps & Cloud
    { name: "Docker", category: "devops", proficiency: 90 },
    { name: "Kubernetes", category: "devops", proficiency: 75 },
    { name: "AWS", category: "devops", proficiency: 80 },
    { name: "GCP", category: "devops", proficiency: 75 },
    { name: "Azure", category: "devops", proficiency: 70 },
    { name: "OCI", category: "devops", proficiency: 65 },
    { name: "Jenkins", category: "devops", proficiency: 70 },
    { name: "Nginx", category: "devops", proficiency: 80 },

    // Testing
    { name: "Pytest", category: "backend", proficiency: 90 },
    { name: "Selenium", category: "other", proficiency: 75 },

    // Tools
    { name: "Git", category: "other", proficiency: 90 },
    { name: "Kafka", category: "backend", proficiency: 70 },
  ],
  experience: [
    {
      company: "Voltvave Innovations",
      position: "Freelance Software Architect & Developer",
      description:
        'Built "Tredye" trading platform with Next.js 16, Docker, Redis, Kafka, PostgreSQL. Architected real-time data streaming and order management systems.',
      start_date: "2025-11-01",
      end_date: null,
      is_current: true,
      location: "Remote",
      company_url: null,
    },
    {
      company: "Red Education",
      position: "Team Lead, Senior Python Support Engineer",
      description:
        "Engineered Labbuild 2.0 achieving 90% faster performance. Built Flask/MongoDB dashboard for monitoring. Developed FastAPI APIs for internal services. Led team of developers.",
      start_date: "2024-02-01",
      end_date: "2025-08-01",
      is_current: false,
      location: "Bangalore, India",
      company_url: "https://rededucation.com",
    },
    {
      company: "Freelancer",
      position: "Technical Consultant",
      description:
        "Developed Django/PostgreSQL/Svelte dashboard solutions for various clients. Conducted AI tools research and implementation.",
      start_date: "2023-11-01",
      end_date: "2024-01-01",
      is_current: false,
      location: "Remote",
      company_url: null,
    },
    {
      company: "Offpriced Canada Inc.",
      position: "Senior Developer",
      description:
        "Led team of 6 developers. Built and maintained e-commerce platform. Implemented Python automation solutions for inventory and order management.",
      start_date: "2022-07-01",
      end_date: "2023-10-01",
      is_current: false,
      location: "Remote",
      company_url: null,
    },
    {
      company: "HCL Technologies",
      position: "Lead Engineer SQA",
      description:
        "Worked with Palo Alto Networks on network security products. Developed Pytest automation framework. Managed Kubernetes clusters for testing infrastructure.",
      start_date: "2021-10-01",
      end_date: "2022-06-01",
      is_current: false,
      location: "Bangalore, India",
      company_url: "https://hcltech.com",
    },
    {
      company: "SERC, IISc",
      position: "System Engineer",
      description:
        "Managed SahasraT supercomputer (33,000 cores) - India's fastest supercomputer. Built Django dashboard for system monitoring. Handled user support and incident response.",
      start_date: "2019-07-01",
      end_date: "2021-09-01",
      is_current: false,
      location: "Bangalore, India",
      company_url: "https://www.serc.iisc.ac.in",
    },
    {
      company: "TEKsystems/HPE",
      position: "Network Support Engineer",
      description:
        "Provided AT&T L1 support for enterprise networking. Managed Aruba networking infrastructure including switches and access points.",
      start_date: "2017-06-01",
      end_date: "2019-06-01",
      is_current: false,
      location: "Bangalore, India",
      company_url: null,
    },
  ],
  education: [
    {
      institution: "ACS College of Engineering, Bangalore",
      degree: "Bachelor of Engineering",
      field: "Computer Science",
      start_date: "2012-08-01",
      end_date: "2016-06-01",
      description: null,
    },
  ],
};
