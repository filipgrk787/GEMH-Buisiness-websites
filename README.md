# Greek Business Website Creator

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

## License / Use

Free to use for any Greek company or agency building client sites. The generated sites may be used without restriction.

---

Built as a complete, production-grade website template system.
