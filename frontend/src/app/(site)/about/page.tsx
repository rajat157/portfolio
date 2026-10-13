import type { Metadata } from "next";
import { cmsAbout } from "@/lib/cms";
import type { About, Education, Experience, Skill } from "@/lib/cms/types";

// Regenerate at most hourly — keeps ISR cadence fixed even if data fetches skip the cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Rajat - Software Architect with 8+ years of experience building high-performance systems.",
};

// Default fallback data when the CMS returns empty (CLAUDE.md: "Pages keep
// hardcoded fallback content... preserve this pattern"). Ported from the old
// about/page.tsx, experience-timeline.tsx and skills-grid.tsx fallbacks.
const defaultAboutData = {
  headline: "Software Architect & Developer",
  bio_short:
    "Experienced Software Architect with 8+ years building high-performance systems. From managing India's fastest supercomputer (SahasraT at IISc) to architecting real-time trading platforms, I bring deep expertise in Python, cloud infrastructure, and modern web technologies. Passionate about leveraging AI tools like Claude and Gemini to accelerate development.",
  location: "Bangalore, India",
  education: [
    {
      id: 1,
      institution: "ACS College of Engineering, Bangalore",
      degree: "B.E. Computer Science",
      field: null,
      start_date: "2012-01-01",
      end_date: "2016-01-01",
      description: null,
    },
  ] as Education[],
};

const FALLBACK_EXPERIENCE: Experience[] = [
  {
    id: 1,
    company: "Independent",
    position: "Freelance Software Architect & Developer",
    description:
      "Building full-stack web platforms for clients end to end — B2B commerce and CRM, multi-portal operations software and motion-led brand sites — with Next.js, Payload CMS and PostgreSQL.",
    start_date: "2026-02-01",
    end_date: null,
    is_current: true,
    location: null,
    company_url: null,
  },
  {
    id: 2,
    company: "Voltvave Innovations",
    position: "Freelance Software Architect & Developer",
    description:
      'Built "Tredye", a real-time market-monitoring platform for NSE stocks: Python services on Kafka, Redis and PostgreSQL, with a Next.js dashboard. Built the event-driven data pipeline, alerts and backtesting.',
    start_date: "2025-11-01",
    end_date: "2026-01-31",
    is_current: false,
    location: null,
    company_url: null,
  },
  {
    id: 3,
    company: "Red Education",
    position: "Team Lead, Senior Python Support Engineer",
    description:
      "Engineered Labbuild 2.0 achieving 90% faster performance. Built Flask/MongoDB dashboard for monitoring. Developed FastAPI APIs for internal services.",
    start_date: "2024-02-01",
    end_date: "2025-08-31",
    is_current: false,
    location: null,
    company_url: null,
  },
  {
    id: 4,
    company: "Freelancer",
    position: "Technical Consultant",
    description: "Developed Django/PostgreSQL/Svelte dashboard solutions. Conducted AI tools research and implementation.",
    start_date: "2023-11-01",
    end_date: "2024-01-31",
    is_current: false,
    location: null,
    company_url: null,
  },
  {
    id: 5,
    company: "Offpriced Canada Inc.",
    position: "Senior Developer",
    description: "Led team of 6 developers. Built and maintained e-commerce platform. Implemented Python automation solutions.",
    start_date: "2022-07-01",
    end_date: "2023-10-31",
    is_current: false,
    location: null,
    company_url: null,
  },
  {
    id: 6,
    company: "HCL Technologies",
    position: "Lead Engineer SQA",
    description: "Worked with Palo Alto Networks. Developed Pytest automation framework. Managed Kubernetes clusters.",
    start_date: "2021-10-01",
    end_date: "2022-06-30",
    is_current: false,
    location: null,
    company_url: null,
  },
  {
    id: 7,
    company: "SERC, IISc",
    position: "System Engineer",
    description:
      "Managed SahasraT supercomputer (33,000 cores) - India's fastest supercomputer. Built Django dashboard for system monitoring.",
    start_date: "2019-07-01",
    end_date: "2021-09-30",
    is_current: false,
    location: null,
    company_url: null,
  },
  {
    id: 8,
    company: "TEKsystems/HPE",
    position: "Network Support Engineer",
    description: "Provided AT&T L1 support. Managed Aruba networking infrastructure.",
    start_date: "2017-06-01",
    end_date: "2019-06-30",
    is_current: false,
    location: null,
    company_url: null,
  },
];

// Group names/order from the old skills-grid.tsx:61 categoryDisplayMap (icons dropped, D-summary 6).
const CATEGORY_LABEL: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  devops: "DevOps & Cloud",
  design: "Design",
  other: "Other",
};

type SkillGroup = { label: string; items: string[] };

function groupSkills(skills: Skill[]): SkillGroup[] {
  const order: string[] = [];
  const byCategory = new Map<string, string[]>();
  for (const s of skills) {
    const category = s.category || "other";
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
      order.push(category);
    }
    byCategory.get(category)!.push(s.name);
  }
  return order.map((category) => ({ label: CATEGORY_LABEL[category] ?? category, items: byCategory.get(category)! }));
}

// Ported from skills-grid.tsx's defaultSkillCategories (icons dropped).
const FALLBACK_SKILL_GROUPS: SkillGroup[] = [
  { label: "Languages & Frameworks", items: ["Python", "Django", "Flask", "FastAPI", "Node.js", "ReactJS", "Next.js", "Svelte"] },
  { label: "Databases", items: ["PostgreSQL", "MongoDB", "Redis"] },
  { label: "DevOps & Cloud", items: ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "OCI", "Jenkins", "Nginx"] },
  { label: "Testing", items: ["Pytest", "Selenium", "Automated Testing"] },
  { label: "Tools", items: ["Git", "Jira", "Confluence", "Kafka"] },
];

const BEYOND_CODE = ["Photography & Videography", "Music Production", "Video Editing", "FPS Gaming", "Culinary Arts"];

function expRange(e: Experience): string {
  const start = new Date(e.start_date).getFullYear();
  if (e.is_current || !e.end_date) return `${start}–now`;
  return `${start}–${new Date(e.end_date).getFullYear()}`;
}

function eduRange(e: Education): string {
  const start = e.start_date ? new Date(e.start_date).getFullYear() : null;
  if (!start) return "—";
  if (!e.end_date) return `${start}–now`;
  return `${start}–${new Date(e.end_date).getFullYear()}`;
}

async function getAboutData(): Promise<About | null> {
  try {
    return await cmsAbout();
  } catch (error) {
    console.error("Failed to fetch about data:", error);
    return null;
  }
}

export default async function AboutPage() {
  const aboutData = await getAboutData();

  const headline = aboutData?.headline || defaultAboutData.headline;
  const bio = aboutData?.bio_short || defaultAboutData.bio_short;
  const location = aboutData?.location || defaultAboutData.location;
  const resumeUrl = aboutData?.resume_url || "/resume.pdf";
  const experience = aboutData?.experience?.length ? aboutData.experience : FALLBACK_EXPERIENCE;
  const education = aboutData?.education?.length ? aboutData.education : defaultAboutData.education;
  const skillGroups = aboutData?.skills?.length ? groupSkills(aboutData.skills) : FALLBACK_SKILL_GROUPS;

  return (
    <div className="sheet">
      <div className="sheet-grid">
        <div className="sh-head">
          <p className="lab">
            About · <span data-fact>{location}</span>
          </p>
          {/* D25: "Rajat" everywhere — never the full name */}
          <h1 className="sheet-title">Rajat</h1>
          <p className="sheet-one" data-fact>
            {headline}
          </p>
        </div>

        <aside className="tb" aria-label="Title block">
          <dl>
            <div className="tb-row">
              <dt className="lab">Role</dt>
              <dd data-fact>{headline}</dd>
            </div>
            <div className="tb-row">
              <dt className="lab">Based</dt>
              <dd data-fact>{location}</dd>
            </div>
            <div className="tb-row">
              <dt className="lab">Experience</dt>
              <dd data-fact>8+ years</dd>
            </div>
          </dl>
          <a className="tb-link" href={resumeUrl} target="_blank" rel="noopener noreferrer">
            <span>Résumé</span>
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </aside>
      </div>

      <div className="blocks">
        <div className="blk">
          <h4 className="blk-h">Bio</h4>
          <div data-fact>
            <p className="ln">{bio}</p>
          </div>
        </div>
      </div>

      <section aria-labelledby="exp-h">
        <div className="sec-head">
          <h2 id="exp-h" className="t-h2" data-cons="text">
            Experience
          </h2>
          <p className="lab">{experience.length} roles</p>
        </div>
        <table className="idx">
          <caption className="sr-only">Work experience, most recent first.</caption>
          <thead>
            <tr>
              <th scope="col">Years</th>
              <th scope="col">Role</th>
              <th scope="col" className="k">Organisation</th>
              <th scope="col" className="st">Where</th>
            </tr>
          </thead>
          <tbody>
            {experience.map((e) => (
              <tr className="prow" key={e.id}>
                <td className="sh">{expRange(e)}</td>
                <th scope="row">
                  <span className="rowbtn">{e.position}</span>
                  {e.description && (
                    <p className="row-sub" data-fact>
                      {e.description}
                    </p>
                  )}
                </th>
                <td className="k" data-fact>
                  {e.company_url ? (
                    <a href={e.company_url} target="_blank" rel="noopener noreferrer">
                      {e.company}
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    e.company
                  )}
                </td>
                <td className="st" data-fact>
                  {e.location || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="skills-h">
        <div className="sec-head">
          <h2 id="skills-h" className="t-h2" data-cons="text">
            Skills
          </h2>
        </div>
        <div className="blocks">
          {skillGroups.map((g) => (
            <div className="blk" key={g.label}>
              <h4 className="blk-h">{g.label}</h4>
              <p data-fact>{g.items.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="edu-h">
        <div className="sec-head">
          <h2 id="edu-h" className="t-h2" data-cons="text">
            Education
          </h2>
        </div>
        <table className="idx">
          <caption className="sr-only">Education.</caption>
          <thead>
            <tr>
              <th scope="col">Years</th>
              <th scope="col">Degree</th>
              <th scope="col" className="k">Institution</th>
            </tr>
          </thead>
          <tbody>
            {education.map((e) => (
              <tr className="prow" key={e.id}>
                <td className="sh">{eduRange(e)}</td>
                <th scope="row">
                  <span className="rowbtn">{e.degree}</span>
                </th>
                <td className="k" data-fact>
                  {e.institution}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="beyond-h">
        <div className="sec-head">
          <h2 id="beyond-h" className="t-h2" data-cons="text">
            Beyond code
          </h2>
        </div>
        <p data-fact>{BEYOND_CODE.join(" · ")}</p>
      </section>
    </div>
  );
}
