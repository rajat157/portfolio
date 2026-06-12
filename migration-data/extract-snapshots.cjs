/**
 * Extracts structured migration data from pre-rendered Next.js HTML snapshots
 * (D:/Projects/portfolio/.backup/live-snapshot-2026-06-12) back into JSON.
 *
 * Run: node D:/Projects/portfolio/migration-data/extract-snapshots.cjs
 */
const fs = require('fs');
const path = require('path');
const { parseDocument, DomUtils } = require('D:/Projects/portfolio/backend/node_modules/htmlparser2');

const SNAP = 'D:/Projects/portfolio/.backup/live-snapshot-2026-06-12';
const OUT = 'D:/Projects/portfolio/migration-data';

// ---------- DOM helpers ----------
const isEl = (n) => n && n.type === 'tag';
const attr = (n, name) => (isEl(n) && n.attribs ? n.attribs[name] : undefined);
const cls = (n) => attr(n, 'class') || '';
const text = (n) => DomUtils.textContent(n).replace(/ /g, ' ');
const findAll = (pred, nodes) => DomUtils.findAll(pred, Array.isArray(nodes) ? nodes : [nodes]);
const findOne = (pred, nodes) => DomUtils.findOne(pred, Array.isArray(nodes) ? nodes : [nodes]);
const childrenEl = (n) => (n.children || []).filter(isEl);

function parse(file) {
  const html = fs.readFileSync(path.join(SNAP, file), 'utf8');
  return parseDocument(html);
}

function metaContent(doc, key) {
  const m = findOne(
    (e) => e.name === 'meta' && (attr(e, 'property') === key || attr(e, 'name') === key),
    doc.children
  );
  return m ? attr(m, 'content') : null;
}

// ---------- HTML -> Markdown ----------
function inlineMd(node) {
  if (node.type === 'text') {
    // collapse rendered-whitespace, keep literal text
    return node.data.replace(/\s+/g, ' ');
  }
  if (!isEl(node)) return '';
  const kids = () => (node.children || []).map(inlineMd).join('');
  switch (node.name) {
    case 'strong':
    case 'b':
      return `**${kids().trim()}**`;
    case 'em':
    case 'i':
      return `*${kids().trim()}*`;
    case 'del':
    case 's':
      return `~~${kids().trim()}~~`;
    case 'code':
      return `\`${text(node)}\``;
    case 'a': {
      const href = attr(node, 'href') || '';
      const t = kids().trim();
      return href ? `[${t}](${href})` : t;
    }
    case 'br':
      return '\n';
    case 'img': {
      const src = attr(node, 'src') || '';
      return `![${attr(node, 'alt') || ''}](${src})`;
    }
    case 'span':
    default:
      return kids();
  }
}

function listMd(node, depth, ordered) {
  const out = [];
  let i = 1;
  for (const li of childrenEl(node)) {
    if (li.name !== 'li') continue;
    const inlineParts = [];
    const nestedBlocks = [];
    for (const c of li.children || []) {
      if (isEl(c) && (c.name === 'ul' || c.name === 'ol')) {
        nestedBlocks.push(listMd(c, depth + 1, c.name === 'ol'));
      } else if (isEl(c) && c.name === 'p') {
        inlineParts.push((c.children || []).map(inlineMd).join(''));
      } else {
        inlineParts.push(inlineMd(c));
      }
    }
    const marker = ordered ? `${i}.` : '-';
    const indent = '  '.repeat(depth);
    out.push(`${indent}${marker} ${inlineParts.join('').replace(/\s+/g, ' ').trim()}`);
    for (const nb of nestedBlocks) out.push(nb);
    i++;
  }
  return out.join('\n');
}

function blockMd(node) {
  if (node.type === 'text') {
    return node.data.trim() ? node.data.replace(/\s+/g, ' ').trim() : null;
  }
  if (!isEl(node)) return null;
  const inline = () => (node.children || []).map(inlineMd).join('').replace(/\s+/g, ' ').trim();
  switch (node.name) {
    case 'h1': return `# ${inline()}`;
    case 'h2': return `## ${inline()}`;
    case 'h3': return `### ${inline()}`;
    case 'h4': return `#### ${inline()}`;
    case 'h5': return `##### ${inline()}`;
    case 'h6': return `###### ${inline()}`;
    case 'p': {
      const t = inline();
      return t ? t : null;
    }
    case 'ul': return listMd(node, 0, false);
    case 'ol': return listMd(node, 0, true);
    case 'pre': {
      const code = findOne((e) => e.name === 'code', node.children) || node;
      const lang = (cls(code).match(/language-([\w-]+)/) || [])[1] || '';
      const body = text(code).replace(/\n$/, '');
      return '```' + lang + '\n' + body + '\n```';
    }
    case 'blockquote': {
      const innerBlocks = (node.children || []).map(blockMd).filter(Boolean);
      return innerBlocks.join('\n\n').split('\n').map((l) => `> ${l}`).join('\n');
    }
    case 'hr': return '---';
    case 'table': {
      // minimal table support
      const rows = findAll((e) => e.name === 'tr', node.children);
      const lines = rows.map((r) =>
        '| ' + findAll((e) => e.name === 'td' || e.name === 'th', r.children)
          .map((c) => text(c).replace(/\s+/g, ' ').trim()).join(' | ') + ' |'
      );
      if (lines.length > 1) {
        const cols = (lines[0].match(/\|/g) || []).length - 1;
        lines.splice(1, 0, '|' + ' --- |'.repeat(cols));
      }
      return lines.join('\n');
    }
    case 'div': {
      const innerBlocks = (node.children || []).map(blockMd).filter(Boolean);
      return innerBlocks.length ? innerBlocks.join('\n\n') : null;
    }
    default: {
      const t = inline();
      return t || null;
    }
  }
}

function containerToMarkdown(container) {
  const blocks = (container.children || []).map(blockMd).filter(Boolean);
  return blocks.join('\n\n').trim() + '\n';
}

// ---------- project detail extraction ----------
function extractProject(file) {
  const slug = file.replace(/^project-/, '').replace(/\.html$/, '');
  const doc = parse(file);
  const main = findOne((e) => e.name === 'main', doc.children);

  const sections = findAll((e) => e.name === 'section', main.children).filter(
    (s) => attr(s, 'aria-label') === undefined
  );
  const hero = sections[0];

  const title = text(findOne((e) => e.name === 'h1', hero.children)).trim();

  const descEl = findOne((e) => e.name === 'p' && /text-xl/.test(cls(e)), hero.children);
  const description = descEl ? text(descEl).replace(/\s+/g, ' ').trim() : null;

  const categoryEl = findOne(
    (e) => e.name === 'span' && attr(e, 'data-slot') === 'badge' && /mb-4/.test(cls(e)),
    hero.children
  );
  const category = categoryEl ? text(categoryEl).trim() : null;

  const techWrap = findOne((e) => e.name === 'div' && /gap-2 mb-8/.test(cls(e)), hero.children);
  const technologies = techWrap
    ? findAll((e) => e.name === 'span' && attr(e, 'data-slot') === 'badge', techWrap.children).map(
        (e) => text(e).trim()
      )
    : [];

  let live_url = null;
  let github_url = null;
  const linksWrap = findOne((e) => e.name === 'div' && /gap-4 justify-center/.test(cls(e)), hero.children);
  if (linksWrap) {
    for (const a of findAll((e) => e.name === 'a', linksWrap.children)) {
      const href = attr(a, 'href');
      if (!href) continue;
      if (/github\.com/.test(href)) github_url = href;
      else live_url = href;
    }
  }

  // sidebar "Project Details" card: label/value p pairs
  let year = null;
  const labels = findAll(
    (e) => e.name === 'p' && /text-sm text-muted-foreground/.test(cls(e)),
    main.children
  );
  for (const label of labels) {
    const key = text(label).trim();
    const parent = label.parent;
    const value = parent
      ? findOne((e) => e.name === 'p' && /font-medium/.test(cls(e)), parent.children)
      : null;
    if (key === 'Year' && value) year = text(value).trim();
  }

  // case study: div sibling right after <h2>About the Project</h2>
  let content_markdown = null;
  const aboutH2 = findOne(
    (e) => e.name === 'h2' && text(e).trim() === 'About the Project',
    main.children
  );
  if (aboutH2) {
    let sib = aboutH2.next;
    while (sib && !(isEl(sib) && sib.name === 'div')) sib = sib.next;
    if (sib) content_markdown = containerToMarkdown(sib);
  }

  const cover_image_url = metaContent(doc, 'og:image');

  // gallery: cloudinary images inside main that are NOT the cover and NOT inside
  // a related-project card link (<a href="/projects/...">)
  const gallery_urls = [];
  for (const img of findAll((e) => e.name === 'img', main.children)) {
    let src = attr(img, 'src') || '';
    const m = src.match(/url=([^&]+)/);
    if (m) src = decodeURIComponent(m[1]);
    if (!/res\.cloudinary\.com/.test(src)) continue;
    let inRelatedCard = false;
    for (let p = img.parent; p; p = p.parent) {
      if (isEl(p) && p.name === 'a' && /^\/projects\//.test(attr(p, 'href') || '')) {
        inRelatedCard = true;
        break;
      }
    }
    if (inRelatedCard) continue;
    if (src === cover_image_url) continue;
    if (!gallery_urls.includes(src)) gallery_urls.push(src);
  }

  return {
    slug,
    title,
    description,
    content_markdown,
    technologies,
    category,
    featured: null,
    live_url,
    github_url,
    start_date: null,
    end_date: null,
    year,
    cover_image_url,
    gallery_urls,
  };
}

// ---------- projects listing extraction ----------
function extractListing() {
  const doc = parse('projects.html');
  const main = findOne((e) => e.name === 'main', doc.children);
  const cards = findAll(
    (e) => e.name === 'a' && /^\/projects\/[a-z0-9-]+$/.test(attr(e, 'href') || ''),
    main.children
  );
  const projects = [];
  for (const a of cards) {
    const slug = attr(a, 'href').replace('/projects/', '');
    if (projects.some((p) => p.slug === slug)) continue;
    const bg = findOne((e) => /background-image/.test(attr(e, 'style') || ''), a.children);
    const cover = bg ? (attr(bg, 'style').match(/url\((.*?)\)/) || [])[1] || null : null;
    const badges = findAll(
      (e) => e.name === 'span' && attr(e, 'data-slot') === 'badge',
      a.children
    ).map((e) => text(e).trim());
    const h3 = findOne((e) => e.name === 'h3', a.children);
    const p = findOne((e) => e.name === 'p', a.children);
    // first badge is the category overlay on the image; rest are technologies
    const category = badges.length ? badges[0] : null;
    const techBadges = badges.slice(1);
    let hidden = 0;
    const technologies_preview = [];
    for (const b of techBadges) {
      const mm = b.match(/^\+\s*(\d+)$/);
      if (mm) hidden = parseInt(mm[1], 10);
      else technologies_preview.push(b);
    }
    projects.push({
      slug,
      title: h3 ? text(h3).trim() : null,
      description: p ? text(p).replace(/\s+/g, ' ').trim() : null,
      category,
      technologies_preview,
      technologies_hidden_count: hidden,
      cover_image_url: cover,
    });
  }
  return projects;
}

// ---------- about extraction ----------
function extractAbout() {
  const doc = parse('about.html');
  const main = findOne((e) => e.name === 'main', doc.children);
  const sections = findAll((e) => e.name === 'section', main.children).filter(
    (s) => attr(s, 'aria-label') === undefined
  );

  const sectionByH2 = (label) =>
    sections.find((s) => {
      const h2 = findOne((e) => e.name === 'h2', s.children);
      return h2 && text(h2).trim() === label;
    });

  // hero
  const hero = sections[0];
  const name = text(findOne((e) => e.name === 'h1', hero.children)).trim();
  const heroPs = findAll((e) => e.name === 'p', hero.children).map((e) => text(e).trim());
  const headline = heroPs.find((t) => t !== 'About Me') || null;
  const spans = findAll((e) => e.name === 'span', hero.children).map((e) =>
    text(e).replace(/\s+/g, ' ').trim()
  );
  const location = spans.find((t) => t && !t.includes('@')) || null;
  const emailA = findOne((e) => e.name === 'a' && /^mailto:/.test(attr(e, 'href') || ''), hero.children);
  const email = emailA ? attr(emailA, 'href').replace('mailto:', '') : null;

  // bio
  const bioSection = sectionByH2('Who I Am');
  const bio_paragraphs = bioSection
    ? findAll((e) => e.name === 'p', bioSection.children)
        .map((e) => text(e).replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    : [];

  // experience
  const expSection = sectionByH2('Work Experience');
  const experience = [];
  if (expSection) {
    for (const h3 of findAll((e) => e.name === 'h3', expSection.children)) {
      const entryWrap = h3.parent; // div containing span(dates), h3(company), p(position), ul(bullets)
      const dateSpan = findOne((e) => e.name === 'span', entryWrap.children);
      const posP = findOne((e) => e.name === 'p', entryWrap.children);
      const bullets = findAll((e) => e.name === 'li', entryWrap.children).map((e) =>
        text(e).replace(/\s+/g, ' ').trim()
      );
      const dates = dateSpan ? text(dateSpan).trim() : null;
      let start = null,
        end = null;
      if (dates && dates.includes(' - ')) {
        [start, end] = dates.split(' - ').map((s) => s.trim());
      }
      experience.push({
        company: text(h3).trim(),
        position: posP ? text(posP).replace(/\s+/g, ' ').trim() : null,
        dates,
        start_date: start,
        end_date: end,
        description: bullets.join(' '),
      });
    }
  }

  // skills
  const skillsSection = sectionByH2('Skills & Technologies');
  const skills = [];
  if (skillsSection) {
    for (const h3 of findAll((e) => e.name === 'h3', skillsSection.children)) {
      const card = h3.parent.parent; // header div -> card div
      const items = findAll(
        (e) => e.name === 'span' && attr(e, 'data-slot') === 'badge',
        card.children
      ).map((e) => text(e).trim());
      skills.push({ category: text(h3).trim(), items });
    }
  }

  // education
  const eduSection = sectionByH2('Education');
  const education = [];
  if (eduSection) {
    for (const h3 of findAll((e) => e.name === 'h3', eduSection.children)) {
      const wrap = h3.parent;
      const ps = findAll((e) => e.name === 'p', wrap.children).map((e) =>
        text(e).replace(/\s+/g, ' ').trim()
      );
      const yearP = ps.find((t) => /Class of/.test(t));
      education.push({
        degree: text(h3).trim(),
        institution: ps.find((t) => !/Class of/.test(t)) || null,
        year: yearP ? (yearP.match(/(\d{4})/) || [])[1] || null : null,
      });
    }
  }

  // beyond code / hobbies
  const beyondSection = sectionByH2('Beyond Code');
  const interests = beyondSection
    ? findAll((e) => e.name === 'p', beyondSection.children)
        .map((e) => text(e).replace(/\s+/g, ' ').trim())
        .filter((t) => t && !t.startsWith('When I'))
    : [];

  // resume url (cloudinary pdf)
  const resumeA = findOne(
    (e) => e.name === 'a' && /res\.cloudinary\.com.*\.pdf$/.test(attr(e, 'href') || ''),
    main.children
  );
  const resume_url = resumeA ? attr(resumeA, 'href') : null;

  return {
    name,
    headline,
    bio_paragraphs,
    location,
    email,
    resume_url,
    skills,
    experience,
    education,
    interests,
  };
}

// ---------- run ----------
fs.mkdirSync(path.join(OUT, 'projects'), { recursive: true });

const detailFiles = [
  'project-cloud-testing-automation-suite.html',
  'project-ecommerce-platform-fulfillment.html',
  'project-email-validation-tool.html',
  'project-tredye-trading-platform.html',
  'project-operation-schedules.html',
  'project-pro-fit-club-dashboard.html',
];

const written = [];
for (const f of detailFiles) {
  const data = extractProject(f);
  const out = path.join(OUT, 'projects', `${data.slug}.json`);
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
  written.push(out);
  console.log(`wrote ${out} (md ${data.content_markdown ? data.content_markdown.length : 0} chars, ${data.technologies.length} techs)`);
}

const listing = {
  source: 'projects.html (live snapshot 2026-06-12)',
  note:
    'technologies_preview shows only the badges rendered on the listing card (max 4); technologies_hidden_count is the "+N" overflow badge. Full technology lists for projects with detail snapshots are in projects/<slug>.json.',
  projects: extractListing(),
};
fs.writeFileSync(path.join(OUT, 'projects-listing.json'), JSON.stringify(listing, null, 2) + '\n');
written.push(path.join(OUT, 'projects-listing.json'));
console.log(`wrote projects-listing.json (${listing.projects.length} projects)`);

const about = extractAbout();
fs.writeFileSync(path.join(OUT, 'about.json'), JSON.stringify(about, null, 2) + '\n');
written.push(path.join(OUT, 'about.json'));
console.log('wrote about.json');
