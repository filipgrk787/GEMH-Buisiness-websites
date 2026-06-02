# Greek Business Website Creator

[![CI](https://github.com/filipgrk787/GEMH-Buisiness-websites/actions/workflows/ci.yml/badge.svg)](https://github.com/filipgrk787/GEMH-Buisiness-websites/actions/workflows/ci.yml)

**Production-ready static website generator for Greek companies.**

Create fully compliant, professional, mobile-friendly business websites in minutes. The output is **pure static HTML/CSS/JS** — no server, no Node, no build step required on the hosting side. Perfect for Hostinger, cPanel, Plesk, GitHub Pages, or any traditional web host.

## Features

- Fixed 4-page structure: Αρχική (Home), Υπηρεσίες (Services), Σχετικά (About), Επικοινωνία (Contact)
- Full Greek legal disclosure baked into every generated footer (Γ.Ε.ΜΗ., ΑΦΜ, legal name, registered address)
- Custom logo, hero, favicon, service images, team photos (client-side optimized)
- Live color theming (primary + secondary) applied via CSS variables
- Real-time live preview (iframe)
- One-click ZIP export with:
  - All 4 HTML pages
  - Optimized assets
  - `assets/styles.css`
  - `robots.txt` + `sitemap.xml`
  - `.htaccess` (performance + security)
  - `404.html`
  - Detailed `README.md` with hosting instructions + optional PHP contact form

## Quick Start (for end users)

1. Run the builder:
   ```bash
   npm install
   npm run dev
   ```
2. Open http://localhost:3000
3. Fill in the form (or click **Φόρτωση Demo**)
4. Click **Λήψη ZIP**
5. Extract and upload the contents of the ZIP directly to `public_html` (or equivalent) of your hosting.

See the README inside the generated ZIP for detailed Hostinger / cPanel steps and how to activate the contact form.

## Developer Notes

- All generation logic lives in:
  - `app/lib/siteGenerator.ts` — builds every HTML page + supporting files
  - `app/lib/imageProcessor.ts` — pure browser Canvas resizing + compression
  - `app/lib/types.ts` — data model

- The entire generated website is self-contained. You can even use the generator programmatically (Node + jsdom/canvas if needed).

- Want to add more pages, bilingual support, or extra sections? Edit the template literals inside `siteGenerator.ts`.

## Compliance

The generated sites include all mandatory information required under Greek law for traders (P.D. 131/2003 for information society services + commercial registry rules).

- Full legal name + form
- Γ.Ε.ΜΗ. number
- ΑΦΜ
- Registered office address
- Contact details

## Tech Stack

Next.js 16 + TypeScript + Tailwind + JSZip (client-side ZIP) + Canvas image processing.

## Local Development

```bash
npm install
npm run dev
```

Other useful commands:

- `npm run build` — production build (used in CI)
- `npm run lint` — ESLint check
- `npm run verify` — runs the headless generator test (ensures all 4 pages + legal footer + assets are produced correctly)

## CI/CD

This project uses **GitHub Actions** for Continuous Integration.

### What happens when you push from your PC

1. You make changes locally.
2. `git add . && git commit -m "..." && git push`
3. GitHub Actions automatically runs on every push to `main` and on Pull Requests:
   - Installs dependencies (with npm cache)
   - Runs `npm run lint`
   - Runs `npm run build` (catches TypeScript / Next.js errors)
   - Runs `npm run verify` (validates that the core website generator still produces correct, compliant static output)

The status is visible via the badge at the top of this README and in the "Actions" tab.

### Workflow File

The pipeline is defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

You can also manually trigger it from the Actions tab ("Run workflow").

## Deploying the Builder (CD)

The **builder app itself** (the form + live preview + ZIP generator) can be hosted so anyone can use it without cloning the repo.

### Recommended: Vercel (Free + Instant)

Vercel is the best fit for Next.js apps and gives you true **Continuous Deployment**:

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New Project** → **Import Git Repository**.
3. Select `filipgrk787/GEMH-Buisiness-websites`.
4. Vercel will auto-detect it's a Next.js project — just click **Deploy**.

**After setup:**

- Every time you `git push` from your local PC to the `main` branch, Vercel will **automatically build and deploy** a new version.
- You get a production URL like `https://gemh-buisiness-websites.vercel.app`
- Pull Requests get preview deployments automatically (great for testing changes).

This is the full "edit locally → push → live on the internet" CI/CD flow.

### Alternative: Self-hosted / Other platforms

You can also deploy the built output (`npm run build` then `npm run start`) to any Node-compatible host (Railway, Fly.io, a VPS with PM2, etc.).

## License / Use

Free to use for any Greek company or agency building client sites. The generated sites may be used without restriction.

---

Built as a complete, production-grade website template system.
