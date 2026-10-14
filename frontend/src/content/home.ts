// Home copy (BUILD-PLAN.md §0, "Data"), from design/drafted/home-prototype.html
// and the review rounds after it. Confirmed by Rajat on 2026-10-14.
//
// This file doubles as the fallback (D22): counts that depend on the CMS
// (platforms shipped, the map's case-study/earlier-project counts) are NOT
// stored here — src/app/(site)/page.tsx fills them from cmsProjects(), with
// fallbacks matching src/lib/cms/fallback.ts (FALLBACK_SHEETS.length = 4,
// FALLBACK_EARLIER.length = 5).

export const HOME = {
  lead: "I design and build the software a business runs on.",
  steps: [
    { num: "01", lab: "The parts", title: "Most businesses run on parts that don’t talk to each other." },
    { num: "02", lab: "Take apart", title: "I take them apart until I understand them." },
    { num: "03", lab: "Compose", title: "Then I put them back together until they feel right." },
  ],
  subLine: "One system your team can run, and keep changing.",
  hookNote: "you found the view",
  stepNote: "every system has a view where it makes sense",
  hint: { fine: "Move across the pieces to find the view", coarse: "Drag sideways to find the view" },
  cue: "Aligned · scroll on ↓",
  alignLabel: "Line it up",
  processStatic:
    "Most businesses run on parts that don’t talk to each other. I take them apart until I understand them, then put them back together until they feel right: one system your team can run, and keep changing.",
  // The stage’s six blocks: a problem on the front, its fix on the back.
  problems: [
    { problem: "Orders arrive by email", fix: "Orders tracked end to end" },
    { problem: "Stock lives in a spreadsheet", fix: "Live stock, one source" },
    { problem: "Only a developer can update the site", fix: "A site your team edits" },
    { problem: "A login for every tool", fix: "One login, the right access" },
    { problem: "Reports built by hand", fix: "Reports that build themselves" },
    { problem: "The same data typed in four places", fix: "Data entered once" },
  ],
  // "Who I am" and "What I build", told as chapters (canvas board Sections A, picked 2026-10-15): one stop per way of
  // working, one in numbers, then the offerings three to a stop. `next` labels the cue to scroll on.
  who: {
    title: "Who I am",
    wayLab: "How I work",
    numbers: "In numbers",
    ways: [
      {
        title: "Understand the work first",
        body: "I start with how the work actually flows, not with a framework.",
        note: "the boring questions save the most money",
      },
      {
        title: "Build the whole thing",
        body: "Database to screen, by one person who knows why each part exists.",
        note: "fewer handoffs, fewer surprises",
      },
      {
        title: "Leave it runnable",
        body: "Your team can change it after I hand it over, and the notes say why.",
        note: "the best compliment is not needing me",
      },
    ],
    // "Platforms shipped since 2025" (value: null) is filled from cmsProjects() (D22).
    counts: [
      { label: "Years building software", value: "10+" as string | null },
      { label: "Platforms shipped since 2025", value: null as string | null },
      { label: "Largest team led", value: "6" as string | null },
      { label: "Hours to a first reply", value: "24–48" as string | null },
    ],
  },
  build: {
    title: "What I build",
    offerings: [
      { title: "Portals and platforms", line: "Customer, partner and staff portals on one codebase, each person seeing only what they should." },
      { title: "Internal tools", line: "Back-office apps and small ERPs that replace the spreadsheet and the email thread." },
      { title: "Real-time data", line: "Pipelines and live dashboards that update as things happen, not at the end of the day." },
      { title: "Sites you run yourself", line: "Fast websites with a content system your team actually uses, so the site stays current." },
      { title: "AI where it helps", line: "Assistants that do real work inside your tools, like drafting and publishing a page when you ask." },
      { title: "A second look", line: "An architect’s review of a system before a rewrite, a migration or a scale-up gets expensive." },
    ],
    ctaNote: "not sure which one you need? ask me",
  },
  next: { step: "Next", build: "Next · what I build", brief: "Next · the brief" },
  map: {
    sub: "Site map · 4 destinations",
    rootNote: "start anywhere",
    // node 01's desc is filled from cmsProjects() counts (mapProjectsDesc, below).
    nodes: [
      { num: "01", heading: "Projects", title: "The work, drawn", desc: null as string | null, href: "/projects", cta: "Open" },
      { num: "02", heading: "Blog", title: "Notes", desc: "Writing on architecture, building with AI and running large systems.", href: "/blog", cta: "Open" },
      { num: "03", heading: "About", title: "The long version", desc: "10+ years of experience, the skills behind it and a résumé.", href: "/about", cta: "Open" },
      { num: "04", heading: "Contact", title: "Start a conversation", desc: "Tell me what’s slowing your business down. I usually reply within 24–48 hours.", href: "#contact", cta: "Write" },
    ],
  },
  close: {
    title: "Tell me what’s slowing your business down.",
    note: "a few lines is enough to start",
    replyHours: "24–48",
  },
  // the brief's "Need" chips (sent as `subject`); wording differs slightly from
  // the offerings above (e.g. "A site you run yourself" vs. "Sites you run
  // yourself") — both verbatim from the prototype.
  subjects: [
    "Portals and platforms",
    "Internal tools",
    "Real-time data",
    "A site you run yourself",
    "AI where it helps",
    "A second look",
    "Something else",
  ],
} as const;

// Map node 01's description depends on the live count of case studies and
// earlier projects (BUILD-PLAN.md P3b item 3); fallbacks match
// src/lib/cms/fallback.ts.
export function mapProjectsDesc(featuredCount: number, earlierCount: number): string {
  return `${featuredCount} case studies, each with its real architecture, and ${earlierCount} earlier projects.`;
}
