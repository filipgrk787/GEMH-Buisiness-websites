/**
 * Production-grade static site generator for Greek business websites.
 * Takes SiteData + processed images → complete ready-to-deploy file tree.
 *
 * Output is 100% static HTML/CSS/JS. No build step required on the hosting side.
 */

import { SiteData, GeneratedSite } from "./types";
import { processHero, processLogo, processFavicon, processServiceImage, processTeamPhoto } from "./imageProcessor";

interface ProcessedAssets {
  logo?: { blob: Blob; filename: string; dataUrl: string };
  hero?: { blob: Blob; filename: string; dataUrl: string };
  favicon?: { blob: Blob; filename: string; dataUrl: string };
  services: Array<{ id: string; blob: Blob; filename: string; dataUrl: string }>;
  team: Array<{ id: string; blob: Blob; filename: string; dataUrl: string }>;
}

export async function generateSite(data: SiteData): Promise<GeneratedSite> {
  // 1. Process all images (parallel where possible)
  const assets = await processAllAssets(data);

  // 2. Build CSS (color variables + full stylesheet)
  const css = buildStylesheet(data);

  // 3. Build each HTML page (inject content + colors + asset paths)
  const indexHtml = buildIndex(data, assets, css);
  const servicesHtml = buildServices(data, assets, css);
  const aboutHtml = buildAbout(data, assets, css);
  const contactHtml = buildContact(data, assets, css);

  // 4. Generate supporting files
  const today = new Date().toISOString().split("T")[0];
  const sitemap = buildSitemap(today);
  const robots = buildRobots();
  const htaccess = buildHtaccess();
  const readme = buildReadme(data);

  // 5. Assemble file map (paths are relative to zip root)
  const files: Record<string, Blob | string> = {
    "index.html": new Blob([indexHtml], { type: "text/html;charset=utf-8" }),
    "services.html": new Blob([servicesHtml], { type: "text/html;charset=utf-8" }),
    "about.html": new Blob([aboutHtml], { type: "text/html;charset=utf-8" }),
    "contact.html": new Blob([contactHtml], { type: "text/html;charset=utf-8" }),
    "assets/styles.css": new Blob([css], { type: "text/css;charset=utf-8" }),
    "robots.txt": robots,
    "sitemap.xml": new Blob([sitemap], { type: "application/xml;charset=utf-8" }),
    ".htaccess": new Blob([htaccess], { type: "text/plain;charset=utf-8" }),
    "README.md": new Blob([readme], { type: "text/markdown;charset=utf-8" }),
    "404.html": new Blob([build404(data, css)], { type: "text/html;charset=utf-8" }),
  };

  // Add images
  if (assets.logo) {
    files[`assets/${assets.logo.filename}`] = assets.logo.blob;
  }
  if (assets.hero) {
    files[`assets/${assets.hero.filename}`] = assets.hero.blob;
  }
  if (assets.favicon) {
    files[`assets/${assets.favicon.filename}`] = assets.favicon.blob;
  }
  assets.services.forEach((s, i) => {
    files[`assets/service-${i + 1}.jpg`] = s.blob;
  });
  assets.team.forEach((t, i) => {
    files[`assets/team-${i + 1}.jpg`] = t.blob;
  });

  // Always provide a default favicon fallback (simple 1x1)
  if (!assets.favicon) {
    const favBlob = await createSimpleFaviconBlob(data.primaryColor);
    files["assets/favicon.png"] = favBlob;
  }

  return {
    files,
    indexHtml,
    pages: {
      home: indexHtml,
      services: servicesHtml,
      about: aboutHtml,
      contact: contactHtml,
    },
  };
}

async function processAllAssets(data: SiteData): Promise<ProcessedAssets> {
  const assets: ProcessedAssets = { services: [], team: [] };

  if (data.logo) {
    assets.logo = await processLogo(data.logo);
  }
  if (data.hero) {
    assets.hero = await processHero(data.hero);
  }
  if (data.favicon) {
    assets.favicon = await processFavicon(data.favicon);
  }

  // Services (in order)
  for (const svc of data.services) {
    if (svc.image) {
      const p = await processServiceImage(svc.image);
      assets.services.push({ id: svc.id, ...p });
    }
  }

  // Team
  for (const member of data.team) {
    if (member.photo) {
      const p = await processTeamPhoto(member.photo);
      assets.team.push({ id: member.id, ...p });
    }
  }

  return assets;
}

// ---------- STYLES ----------
function buildStylesheet(data: SiteData): string {
  const { primaryColor, secondaryColor } = data;

  return `:root {
  --primary: ${primaryColor};
  --primary-dark: ${adjustColor(primaryColor, -18)};
  --secondary: ${secondaryColor};
  --accent: ${secondaryColor};
  --text: #1f2937;
  --text-light: #4b5563;
  --bg: #ffffff;
  --bg-alt: #f8fafc;
  --border: #e5e7eb;
  --success: #15803d;
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans Greek", sans-serif;
  color: var(--text);
  line-height: 1.65;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}
h1,h2,h3,h4 { font-weight: 700; line-height: 1.2; color: #111827; margin: 0 0 0.5em; }
h1 { font-size: 2.75rem; }
h2 { font-size: 2.1rem; }
h3 { font-size: 1.35rem; }

a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }

.container { max-width: 1140px; margin: 0 auto; padding: 0 20px; }

/* Header */
.site-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.nav { display: flex; align-items: center; justify-content: space-between; height: 76px; }
.logo { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.35rem; color: #111827; }
.logo img { height: 42px; width: auto; display: block; }
.nav-links { display: flex; gap: 32px; font-weight: 500; font-size: 15px; }
.nav-links a { color: #374151; padding: 6px 2px; }
.nav-links a.active, .nav-links a:hover { color: var(--primary); text-decoration: none; border-bottom: 2px solid var(--primary); }

.mobile-menu-btn { display: none; background: none; border: 0; font-size: 26px; cursor: pointer; }

/* Hero */
.hero {
  position: relative;
  min-height: 620px;
  display: flex;
  align-items: center;
  background: #111827;
  color: white;
  overflow: hidden;
}
.hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(17,24,39,0.78) 0%, rgba(17,24,39,0.55) 55%, rgba(17,24,39,0.35) 100%); }
.hero-content { position: relative; z-index: 2; max-width: 620px; padding: 80px 0; }
.hero h1 { color: white; font-size: 3.1rem; margin-bottom: 16px; }
.hero .tagline { font-size: 1.35rem; opacity: 0.95; margin-bottom: 28px; }
.cta-row { display: flex; gap: 14px; flex-wrap: wrap; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;
  transition: transform .1s ease, box-shadow .1s ease;
  text-decoration: none !important;
}
.btn-primary { background: var(--primary); color: white; border: 0; }
.btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 4px 14px -2px rgb(0 0 0 / 0.2); }
.btn-secondary { background: white; color: #111827; border: 1px solid #d1d5db; }
.btn-secondary:hover { background: #f8fafc; }

/* Sections */
.section { padding: 80px 0; }
.section-alt { background: var(--bg-alt); }
.section h2 { margin-bottom: 12px; }
.lead { font-size: 1.1rem; color: var(--text-light); max-width: 720px; }

/* Cards */
.card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: transform .2s ease, box-shadow .2s ease;
}
.card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px -8px rgb(0 0 0 / 0.1); }
.card-body { padding: 24px; }
.card h3 { font-size: 1.25rem; margin-bottom: 8px; }

/* Services */
.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 32px; }
.service-card img { width: 100%; height: 210px; object-fit: cover; display: block; }

/* Team */
.team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 28px; margin-top: 40px; }
.team-card { text-align: center; }
.team-card img { width: 148px; height: 148px; border-radius: 999px; object-fit: cover; margin: 0 auto 16px; border: 4px solid #fff; box-shadow: 0 0 0 1px var(--border); }
.team-card h4 { margin-bottom: 2px; }

/* Contact */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
@media (max-width: 860px) { .contact-grid { grid-template-columns: 1fr; } }

.contact-info div { display: flex; gap: 14px; margin-bottom: 20px; }
.contact-info svg { flex-shrink: 0; margin-top: 3px; color: var(--primary); }

.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-weight: 500; margin-bottom: 6px; font-size: 14px; }
.form-group input, .form-group textarea {
  width: 100%; padding: 12px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 15px; font-family: inherit;
}
.form-group textarea { min-height: 140px; resize: vertical; }

/* Footer */
.site-footer {
  background: #0f172a;
  color: #cbd5e1;
  padding: 56px 0 32px;
  font-size: 14px;
}
.site-footer a { color: #94a3b8; }
.site-footer a:hover { color: #e0f2fe; }
.legal { margin-top: 28px; padding-top: 24px; border-top: 1px solid #334155; font-size: 12.5px; line-height: 1.7; color: #64748b; }
.legal strong { color: #e2e8f0; }

/* Misc */
.badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.15);
  color: white;
}
.divider { height: 1px; background: var(--border); margin: 32px 0; }

/* Responsive */
@media (max-width: 768px) {
  .nav-links { display: none; position: absolute; top: 76px; left: 0; right: 0; background: white; padding: 20px; flex-direction: column; gap: 14px; box-shadow: 0 8px 20px -4px rgb(0 0 0 / 0.1); }
  .nav-links.open { display: flex; }
  .mobile-menu-btn { display: block; }
  h1 { font-size: 2.2rem; }
  .hero { min-height: 520px; }
  .section { padding: 56px 0; }
}

/* Print (good for PDF export if needed) */
@media print {
  .site-header, .cta-row, .site-footer .legal { display: none !important; }
}

/* Accessibility */
:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }
`;

  function adjustColor(hex: string, amount: number): string {
    let usePound = false;
    if (hex[0] === "#") {
      hex = hex.slice(1);
      usePound = true;
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return (usePound ? "#" : "") + (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
  }
}

// ---------- PAGE BUILDERS (Greek content) ----------

function commonHead(title: string, description: string, css: string, faviconPath: string) {
  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <link rel="icon" href="${faviconPath}" type="image/png">
  <link rel="stylesheet" href="assets/styles.css">
  <style>
    /* Page-specific overrides injected at build */
  </style>
</head>`;
}

function header(active: string, logoSrc: string, displayName: string) {
  const links = [
    { href: "index.html", label: "Αρχική", key: "home" },
    { href: "services.html", label: "Υπηρεσίες", key: "services" },
    { href: "about.html", label: "Σχετικά", key: "about" },
    { href: "contact.html", label: "Επικοινωνία", key: "contact" },
  ];
  const nav = links.map(l =>
    `<a href="${l.href}" class="${l.key === active ? "active" : ""}">${l.label}</a>`
  ).join("");

  return `
<header class="site-header">
  <div class="container">
    <nav class="nav">
      <a href="index.html" class="logo" aria-label="${escapeHtml(displayName)}">
        ${logoSrc ? `<img src="${logoSrc}" alt="${escapeHtml(displayName)}" height="42">` : `<span>${escapeHtml(displayName)}</span>`}
      </a>

      <div class="nav-links" id="navLinks">
        ${nav}
      </div>

      <button class="mobile-menu-btn" aria-label="Μενού" onclick="toggleMenu()">☰</button>
    </nav>
  </div>
</header>`;
}

function footer(data: SiteData) {
  const year = new Date().getFullYear();
  return `
<footer class="site-footer">
  <div class="container">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:40px;">
      <div>
        <div style="font-weight:700;font-size:1.1rem;color:#f1f5f9;margin-bottom:8px;">${escapeHtml(data.displayName)}</div>
        <div style="opacity:.75;">${escapeHtml(data.tagline)}</div>
      </div>
      <div>
        <div style="font-weight:600;color:#f1f5f9;margin-bottom:10px;">Επικοινωνία</div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <a href="mailto:${data.email}">${data.email}</a>
          <a href="tel:${data.phone.replace(/\s/g, "")}">${data.phone}</a>
          <span>${escapeHtml(data.registeredAddress)}</span>
        </div>
      </div>
      <div>
        <div style="font-weight:600;color:#f1f5f9;margin-bottom:10px;">Γρήγοροι Σύνδεσμοι</div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <a href="services.html">Οι Υπηρεσίες μας</a>
          <a href="about.html">Η Εταιρεία</a>
          <a href="contact.html">Επικοινωνήστε μαζί μας</a>
        </div>
      </div>
    </div>

    <div class="legal">
      <strong>Νομικά Στοιχεία Εταιρείας:</strong><br>
      ${escapeHtml(data.legalName)} • Νομική Μορφή: ${escapeHtml(data.legalForm)}<br>
      Γ.Ε.ΜΗ.: <strong>${escapeHtml(data.gemi)}</strong> • ΑΦΜ: <strong>${escapeHtml(data.afm)}</strong><br>
      Έδρα: ${escapeHtml(data.registeredAddress)}<br><br>
      Η παρούσα ιστοσελίδα δημιουργήθηκε σύμφωνα με τις απαιτήσεις της ελληνικής νομοθεσίας για την ενημέρωση των καταναλωτών και των συναλλασσόμενων (Π.Δ. 131/2003 και ισχύουσα φορολογική/εμπορική νομοθεσία). Όλα τα στοιχεία είναι αληθή και ενημερωμένα κατά την ημερομηνία δημοσίευσης.
      <br><br>
      &copy; ${year} ${escapeHtml(data.legalName)}. Με επιφύλαξη παντός δικαιώματος.
    </div>
  </div>
</footer>

<script>
function toggleMenu() {
  const nav = document.getElementById('navLinks');
  if (nav) nav.classList.toggle('open');
}
// Fake contact form handler (static)
function handleContactForm(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;

  setTimeout(() => {
    const success = document.getElementById('form-success');
    if (success) success.style.display = 'block';
    form.style.display = 'none';
    // Scroll to message
    success && success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 650);
}
</script>`;
}

function buildIndex(data: SiteData, assets: ProcessedAssets, css: string): string {
  const logoPath = assets.logo ? `assets/${assets.logo.filename}` : "";
  const heroPath = assets.hero ? `assets/${assets.hero.filename}` : "https://picsum.photos/id/1015/1920/1080"; // fallback only if no hero

  const featuredServices = data.services.slice(0, 3).map((s, idx) => {
    const img = assets.services[idx] ? `assets/service-${idx + 1}.jpg` : null;
    return `
      <div class="card">
        ${img ? `<img src="${img}" alt="${escapeHtml(s.title)}" loading="lazy">` : `<div style="height:210px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:13px;">ΕΙΚΟΝΑ ΥΠΗΡΕΣΙΑΣ</div>`}
        <div class="card-body">
          <h3>${escapeHtml(s.title)}</h3>
          <p style="margin:0 0 16px;color:#475569;">${escapeHtml(s.description)}</p>
          <a href="services.html" style="font-weight:600;font-size:14px;">Μάθετε περισσότερα →</a>
        </div>
      </div>`;
  }).join("");

  const head = commonHead(
    `${data.displayName} | ${data.tagline}`,
    data.shortDescription,
    css,
    assets.favicon ? `assets/${assets.favicon.filename}` : "assets/favicon.png"
  );

  return `${head}
<body>
  ${header("home", logoPath, data.displayName)}

  <!-- HERO -->
  <section class="hero">
    <div class="hero-bg" style="background-image:url('${heroPath}')"></div>
    <div class="hero-overlay"></div>
    <div class="container">
      <div class="hero-content">
        <div class="badge" style="margin-bottom:16px;">ΕΓΓΕΓΡΑΜΜΕΝΗ ΕΤΑΙΡΕΙΑ ΣΤΟ Γ.Ε.ΜΗ.</div>
        <h1>${escapeHtml(data.displayName)}</h1>
        <p class="tagline">${escapeHtml(data.tagline)}</p>
        <div class="cta-row">
          <a href="contact.html" class="btn btn-primary">Επικοινωνήστε μαζί μας</a>
          <a href="services.html" class="btn btn-secondary">Δείτε τις Υπηρεσίες</a>
        </div>
        <div style="margin-top:22px;font-size:13px;opacity:.8;">${escapeHtml(data.shortDescription)}</div>
      </div>
    </div>
  </section>

  <!-- INTRO -->
  <section class="section">
    <div class="container">
      <div style="max-width:780px;">
        <h2>Επαγγελματική Υποστήριξη για την Επιχείρησή σας</h2>
        <p class="lead">${escapeHtml(data.shortDescription)}</p>
      </div>

      <div style="margin-top:42px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;">
        <div class="card" style="padding:22px;">
          <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:4px;">ΑΞΙΟΠΙΣΤΙΑ</div>
          <div style="font-weight:600;">Πάνω από 15 χρόνια εμπειρίας</div>
        </div>
        <div class="card" style="padding:22px;">
          <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:4px;">ΔΙΑΦΑΝΕΙΑ</div>
          <div style="font-weight:600;">Πλήρης συμμόρφωση με τον νόμο</div>
        </div>
        <div class="card" style="padding:22px;">
          <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:4px;">ΠΡΟΣΩΠΙΚΗ ΠΡΟΣΕΓΓΙΣΗ</div>
          <div style="font-weight:600;">Λύσεις προσαρμοσμένες στις ανάγκες σας</div>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURED SERVICES -->
  <section class="section section-alt">
    <div class="container">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:12px;">
        <h2>Οι Υπηρεσίες μας</h2>
        <a href="services.html" style="font-weight:600;">Όλες οι υπηρεσίες →</a>
      </div>
      <div class="services-grid">
        ${featuredServices}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="section">
    <div class="container" style="text-align:center;max-width:620px;">
      <h2>Έτοιμοι να ξεκινήσουμε;</h2>
      <p class="lead" style="margin:0 auto 28px;">Επικοινωνήστε μαζί μας σήμερα για μια πρώτη συνάντηση χωρίς υποχρέωση.</p>
      <a href="contact.html" class="btn btn-primary" style="padding:16px 36px;">Κλείστε Ραντεβού</a>
    </div>
  </section>

  ${footer(data)}
</body>
</html>`;
}

function buildServices(data: SiteData, assets: ProcessedAssets, css: string): string {
  const logoPath = assets.logo ? `assets/${assets.logo.filename}` : "";
  const servicesHTML = data.services.map((s, idx) => {
    const img = assets.services[idx] ? `assets/service-${idx + 1}.jpg` : null;
    return `
      <div id="service-${idx}" class="card" style="margin-bottom:28px;">
        <div style="display:grid;grid-template-columns:1fr 1.15fr;gap:0;">
          <div style="background:#f8fafc;padding:36px 32px;">
            <div style="display:inline-block;padding:3px 11px;border-radius:999px;background:var(--primary);color:white;font-size:12px;font-weight:600;margin-bottom:18px;">ΥΠΗΡΕΣΙΑ</div>
            <h2 style="margin-bottom:16px;">${escapeHtml(s.title)}</h2>
            <p style="font-size:15.5px;color:#334155;">${escapeHtml(s.description)}</p>
            <div style="margin-top:24px;font-size:13px;color:#64748b;">Επικοινωνήστε μαζί μας για να συζητήσουμε τις ανάγκες της επιχείρησής σας.</div>
          </div>
          <div>
            ${img ? `<img src="${img}" alt="${escapeHtml(s.title)}" style="width:100%;height:100%;object-fit:cover;min-height:320px;display:block;">` :
      `<div style="height:100%;min-height:320px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#64748b;font-size:14px;">Φωτογραφία Υπηρεσίας</div>`}
          </div>
        </div>
      </div>`;
  }).join("");

  const head = commonHead(
    `Υπηρεσίες | ${data.displayName}`,
    `Αναλυτική παρουσίαση των υπηρεσιών που προσφέρει η ${data.displayName}.`,
    css,
    assets.favicon ? `assets/${assets.favicon.filename}` : "assets/favicon.png"
  );

  return `${head}
<body>
  ${header("services", logoPath, data.displayName)}

  <div style="background:#0f172a;color:#e2e8f0;padding:52px 0;">
    <div class="container">
      <div style="max-width:680px;">
        <div class="badge">ΟΛΕΣ ΟΙ ΥΠΗΡΕΣΙΕΣ</div>
        <h1 style="color:white;margin:12px 0 8px;">Εξειδικευμένη Υποστήριξη</h1>
        <p style="font-size:1.1rem;opacity:.85;">Παρέχουμε πλήρες φάσμα λογιστικών, φοροτεχνικών και επιχειρηματικών υπηρεσιών με υψηλή ποιότητα και απόλυτη εχεμύθεια.</p>
      </div>
    </div>
  </div>

  <section class="section">
    <div class="container">
      ${servicesHTML}
      <div style="margin-top:40px;padding:28px;background:#f8fafc;border-radius:12px;font-size:14px;">
        <strong>Σημείωση:</strong> Όλες οι υπηρεσίες παρέχονται σύμφωνα με τον Κώδικα Φορολογίας και τα ισχύοντα Ελληνικά Λογιστικά Πρότυπα (Ε.Λ.Π.). Η εταιρεία μας διαθέτει πιστοποιημένους λογιστές Α' και Β' τάξης.
      </div>
    </div>
  </section>

  ${footer(data)}
</body>
</html>`;
}

function buildAbout(data: SiteData, assets: ProcessedAssets, css: string): string {
  const logoPath = assets.logo ? `assets/${assets.logo.filename}` : "";

  const teamHTML = data.team.map((member, idx) => {
    const img = assets.team[idx] ? `assets/team-${idx + 1}.jpg` : null;
    return `
      <div class="team-card card">
        ${img ? `<img src="${img}" alt="${escapeHtml(member.name)}">` :
      `<div style="width:148px;height:148px;border-radius:999px;margin:0 auto 16px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:13px;">ΦΩΤΟΓΡΑΦΙΑ</div>`}
        <h4>${escapeHtml(member.name)}</h4>
        <div style="color:var(--primary);font-weight:600;font-size:14px;margin-bottom:12px;">${escapeHtml(member.role)}</div>
        <p style="font-size:14.5px;color:#475569;margin:0;">${escapeHtml(member.bio)}</p>
      </div>`;
  }).join("");

  const head = commonHead(
    `Σχετικά με εμάς | ${data.displayName}`,
    data.aboutText.substring(0, 155) + "...",
    css,
    assets.favicon ? `assets/${assets.favicon.filename}` : "assets/favicon.png"
  );

  return `${head}
<body>
  ${header("about", logoPath, data.displayName)}

  <div class="container" style="padding-top:60px;">
    <div style="max-width:760px;margin:0 auto;text-align:center;">
      <h1>Η Ιστορία μας</h1>
      <p class="lead" style="margin:0 auto;">${escapeHtml(data.aboutText)}</p>
    </div>
  </div>

  <section class="section section-alt">
    <div class="container">
      <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:42px;align-items:center;">
        <div>
          <h2>Αποστολή &amp; Αξίες</h2>
          <p style="font-size:17px;color:#334155;">${escapeHtml(data.missionText)}</p>
          <ul style="margin-top:22px;padding-left:20px;line-height:1.85;color:#334155;">
            <li>Ακεραιότητα και απόλυτη εχεμύθεια</li>
            <li>Συνεχής ενημέρωση για νομοθετικές αλλαγές</li>
            <li>Προσωποποιημένη εξυπηρέτηση</li>
            <li>Έγκαιρη και ακριβής υποστήριξη</li>
          </ul>
        </div>
        <div class="card" style="padding:32px;background:#0f172a;color:#e2e8f0;">
          <div style="font-size:13px;letter-spacing:1px;opacity:.6;margin-bottom:8px;">ΑΠΟ ΤΟ 2008</div>
          <div style="font-size:1.65rem;line-height:1.3;font-weight:700;">Εμπιστοσύνη που χτίζεται με τα χρόνια.</div>
          <div style="margin-top:24px;font-size:14px;opacity:.75;">Σήμερα υποστηρίζουμε περισσότερες από 180 επιχειρήσεις σε όλη την Ελλάδα.</div>
        </div>
      </div>
    </div>
  </section>

  ${data.team.length > 0 ? `
  <section class="section">
    <div class="container">
      <h2 style="text-align:center;margin-bottom:8px;">Η Ομάδα μας</h2>
      <p style="text-align:center;color:#475569;max-width:420px;margin:0 auto 12px;">Έμπειροι επαγγελματίες με βαθιά γνώση και αγάπη για αυτό που κάνουμε.</p>
      <div class="team-grid">
        ${teamHTML}
      </div>
    </div>
  </section>` : ""}

  ${footer(data)}
</body>
</html>`;
}

function buildContact(data: SiteData, assets: ProcessedAssets, css: string): string {
  const logoPath = assets.logo ? `assets/${assets.logo.filename}` : "";

  const head = commonHead(
    `Επικοινωνία | ${data.displayName}`,
    `Επικοινωνήστε με την ${data.displayName}. Διεύθυνση, τηλέφωνο, email και φόρμα επικοινωνίας.`,
    css,
    assets.favicon ? `assets/${assets.favicon.filename}` : "assets/favicon.png"
  );

  return `${head}
<body>
  ${header("contact", logoPath, data.displayName)}

  <div class="container" style="padding:64px 20px 20px;">
    <h1 style="text-align:center;">Επικοινωνήστε μαζί μας</h1>
    <p style="text-align:center;color:#475569;max-width:460px;margin:12px auto 32px;">Είμαστε εδώ για να σας υποστηρίξουμε. Συμπληρώστε τη φόρμα ή χρησιμοποιήστε τα στοιχεία επικοινωνίας.</p>

    <div class="contact-grid">
      <!-- Info -->
      <div class="contact-info">
        <div>
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.32 1.78.6 2.62a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.46-1.18a2 2 0 012.11-.45c.84.28 1.72.48 2.62.6A2 2 0 0122 16.92z"/></svg>
          <div>
            <div style="font-weight:600;">Τηλέφωνο</div>
            <a href="tel:${data.phone.replace(/\s/g,"")}" style="font-size:17px;">${data.phone}</a>
          </div>
        </div>
        <div>
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
          <div>
            <div style="font-weight:600;">Email</div>
            <a href="mailto:${data.email}" style="font-size:17px;">${data.email}</a>
          </div>
        </div>
        <div>
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="3"/></svg>
          <div>
            <div style="font-weight:600;">Έδρα / Γραφεία</div>
            <div>${escapeHtml(data.registeredAddress)}</div>
          </div>
        </div>

        <div style="margin-top:30px;padding:18px 20px;background:#fefce8;border:1px solid #fde047;border-radius:10px;font-size:13.5px;line-height:1.55;">
          <strong>Ωράριο:</strong> Δευτέρα - Παρασκευή 09:00 - 17:30<br>
          Ραντεβού κατόπιν συνεννόησης. Απαντάμε εντός 24 ωρών.
        </div>
      </div>

      <!-- Form -->
      <div>
        <form class="card" style="padding:32px;" onsubmit="handleContactForm(event)">
          <div class="form-group">
            <label for="name">Ονοματεπώνυμο *</label>
            <input id="name" name="name" required placeholder="Παράδειγμα: Γιώργος Παπαδόπουλος">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" name="email" required placeholder="you@company.gr">
            </div>
            <div class="form-group">
              <label for="phone">Τηλέφωνο</label>
              <input id="phone" name="phone" placeholder="+30 69...">
            </div>
          </div>
          <div class="form-group">
            <label for="message">Μήνυμα *</label>
            <textarea id="message" name="message" required placeholder="Περιγράψτε σύντομα τις ανάγκες σας..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:15px;">Αποστολή Μηνύματος</button>
          <div style="font-size:12px;color:#64748b;margin-top:12px;text-align:center;">Τα στοιχεία σας χρησιμοποιούνται μόνο για επικοινωνία.</div>
        </form>

        <div id="form-success" style="display:none;margin-top:14px;padding:22px 24px;background:#ecfdf5;border:1px solid #10b981;border-radius:10px;color:#065f46;font-weight:500;">
          Ευχαριστούμε! Το μήνυμά σας ελήφθη.<br>
          Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό (συνήθως εντός 24 ωρών).
        </div>
      </div>
    </div>
  </div>

  ${footer(data)}
</body>
</html>`;
}

function build404(data: SiteData, css: string): string {
  const logoPath = ""; // no logo needed
  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Σελίδα δεν βρέθηκε | ${escapeHtml(data.displayName)}</title>
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;padding:40px;">
    <div style="text-align:center;max-width:420px;">
      <div style="font-size:92px;line-height:1;font-weight:800;color:#e2e8f0;">404</div>
      <h1 style="margin:12px 0;">Η σελίδα δεν βρέθηκε</h1>
      <p style="color:#475569;">Η διεύθυνση που ζητήσατε δεν υπάρχει ή μετακινήθηκε.</p>
      <a href="index.html" class="btn btn-primary" style="margin-top:20px;">Επιστροφή στην Αρχική</a>
    </div>
  </div>
</body>
</html>`;
}

function buildSitemap(today: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://YOUR-DOMAIN-HERE.com/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>https://YOUR-DOMAIN-HERE.com/services.html</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://YOUR-DOMAIN-HERE.com/about.html</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.7</priority></url>
  <url><loc>https://YOUR-DOMAIN-HERE.com/contact.html</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.7</priority></url>
</urlset>`;
}

function buildRobots(): string {
  return `User-agent: *
Allow: /
Sitemap: https://YOUR-DOMAIN-HERE.com/sitemap.xml

# Generated by Greek Business Website Creator
`;
}

function buildHtaccess(): string {
  return `# Hellenic Business Website - Apache configuration
# Upload this file together with the HTML files to your hosting root (public_html)

Options -Indexes +FollowSymLinks
AddDefaultCharset UTF-8

# Performance & caching (adjust as needed)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Security headers (many hosts support these)
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Clean URLs (optional). If you rename files remove .html from links in HTML too.
# RewriteEngine On
# RewriteCond %{REQUEST_FILENAME} !-f
# RewriteCond %{REQUEST_FILENAME} !-d
# RewriteRule ^([^\.]+)$ $1.html [NC,L]

# Error pages
ErrorDocument 404 /404.html

# Generated automatically - safe to customize
`;
}

function buildReadme(data: SiteData): string {
  const now = new Date().toLocaleDateString("el-GR");
  return `# ${data.displayName} — Επαγγελματική Ιστοσελίδα

Αυτή η ιστοσελίδα δημιουργήθηκε αυτόματα από το **Greek Business Website Creator** στις ${now}.

## Περιεχόμενα Πακέτου

- index.html — Αρχική σελίδα
- services.html — Υπηρεσίες
- about.html — Σχετικά με την εταιρεία
- contact.html — Επικοινωνία + Φόρμα
- assets/styles.css — Όλα τα στυλ (με τα χρώματα που επιλέξατε)
- assets/ — Όλες οι εικόνες (logo, hero, favicon, υπηρεσίες, μέλη ομάδας)
- robots.txt + sitemap.xml — Βασικό SEO
- .htaccess — Ρυθμίσεις Apache / βελτιστοποίηση
- 404.html — Σελίδα σφάλματος
- README.md — Αυτό το αρχείο

## Πώς να ανεβάσετε σε Hosting (Hostinger, cPanel, Plesk, κ.ά.)

1. Αποσυμπιέστε το ZIP.
2. Συνδεθείτε στον πίνακα ελέγχου του hosting σας (File Manager).
3. Ανεβάστε **όλα τα αρχεία** (συμπεριλαμβανομένων των φακέλων) απευθείας στον φάκελο **public_html** (ή στον ριζικό φάκελο του domain σας).
4. Βεβαιωθείτε ότι το index.html βρίσκεται απευθείας στον public_html.
5. Ενημερώστε το **sitemap.xml** και το **robots.txt** αντικαθιστώντας το \`YOUR-DOMAIN-HERE.com\` με το πραγματικό σας domain.
6. Το site είναι άμεσα διαθέσιμο.

### Ειδικά για Hostinger
- Χρησιμοποιήστε το File Manager → Upload (ή FTP).
- Αν το domain δείχνει σε άλλη σελίδα, διαγράψτε τυχόν υπάρχοντα index.html ή αλλάξτε το index στο Domain settings.

### Ειδικά για cPanel
- File Manager → public_html → Upload → επιλέξτε όλα τα αρχεία ή ανεβάστε το ZIP και αποσυμπιέστε.

## Φόρμα Επικοινωνίας

Η φόρμα είναι **στατική** για μέγιστη συμβατότητα. Για να λαμβάνετε email:

**Προτεινόμενες λύσεις (δωρεάν/εύκολες):**
- [Formspree](https://formspree.io) — αλλάξτε το action του form σε https://formspree.io/f/xxxxxxxx
- [Netlify Forms](https://www.netlify.com/products/forms/) (αν hostάρετε εκεί)
- Hostinger Email Forwarding / Contact Form widget (στον πίνακα ελέγχου)
- Προσθέστε ένα απλό PHP handler (δείτε παράδειγμα παρακάτω)

### Προαιρετικό: PHP Contact Handler (για shared hosting με PHP)

Δημιουργήστε αρχείο \`contact.php\` στον ίδιο φάκελο:

\`\`\`php
<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = strip_tags(trim($_POST["name"]));
  $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
  $phone = strip_tags(trim($_POST["phone"] ?? ""));
  $message = trim($_POST["message"]);

  $to = "${data.email}";
  $subject = "Νέο μήνυμα από την ιστοσελίδα - $name";
  $body = "Όνομα: $name\\nEmail: $email\\nΤηλ: $phone\\n\\nΜήνυμα:\\n$message";
  $headers = "From: $email";

  if (mail($to, $subject, $body, $headers)) {
    header("Location: contact.html?sent=1");
  } else {
    echo "Σφάλμα αποστολής. Δοκιμάστε ξανά.";
  }
}
\`\`\`

Μετά ενημερώστε το \`<form>\` στο contact.html: action="contact.php" method="post".

## Χρώματα & Προσαρμογή

Τα χρώματα είναι ενσωματωμένα στο assets/styles.css ως CSS Variables:
\`\`\`css
--primary: ${data.primaryColor};
--secondary: ${data.secondaryColor};
\`\`\`

Μπορείτε να τα αλλάξετε απευθείας στο CSS και να επαναφορτώσετε.

## Συμβουλές SEO & Νομικής Συμμόρφωσης

- Αντικαταστήστε το YOUR-DOMAIN-HERE.com παντού.
- Προσθέστε Google Analytics / Search Console.
- Ενημερώστε τα νομικά στοιχεία (Γ.Ε.ΜΗ., ΑΦΜ, έδρα) αν αλλάξουν.
- Για e-shop ή cookies, προσθέστε cookie banner + πολιτική απορρήτου.

## Υποστήριξη

Αυτό το πακέτο δημιουργήθηκε από το εργαλείο Greek Business Website Creator.
Για ερωτήσεις σχετικά με το generator, επικοινωνήστε με τον διαχειριστή του συστήματος.

Καλή επιτυχία με την επιχείρησή σας!
`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function createSimpleFaviconBlob(primary: string): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("G", 32, 36);
  return new Promise(r => c.toBlob(b => r(b!)));
}
