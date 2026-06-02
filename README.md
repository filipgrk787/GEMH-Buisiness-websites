# Greek Business Website Creator

[![CI](https://github.com/filipgrk787/GEMH-Buisiness-websites/actions/workflows/ci.yml/badge.svg)](https://github.com/filipgrk787/GEMH-Buisiness-websites/actions/workflows/ci.yml)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffilipgrk787%2FGEMH-Buisiness-websites)

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

### Important: Pushing Workflow Changes (`.github/workflows/`)

GitHub has a security restriction: **Personal Access Tokens (PATs) cannot create or modify files in `.github/workflows/` unless the token has the `workflow` scope**.

If you see this error when pushing:

```
! [remote rejected] main -> main (refusing to allow a Personal Access Token to create or update workflow `.github/workflows/ci.yml` without `workflow` scope)
```

**Fix:**

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Tokens (classic)**
3. Give it a name (e.g. "GEMH Website Creator - full access")
4. **Select these scopes**:
   - `repo` (full control of private repositories)  ← this is required
   - `workflow` (update GitHub Action workflows)   ← **this is the critical one for CI**
5. Click **Generate token** and **copy it immediately** (you won't see it again).
6. Use it to push:

   ```bash
   # One-time (replace YOUR_TOKEN with the one you just copied)
   git push https://filipgrk787:YOUR_TOKEN@github.com/filipgrk787/GEMH-Buisiness-websites.git main
   ```

   After the first successful push that includes the workflow file, you can change the remote back to the clean URL:

   ```bash
   git remote set-url origin https://github.com/filipgrk787/GEMH-Buisiness-websites.git
   ```

   Future pushes can use `git push` normally (Git will prompt for the token once and can store it in your credential helper).

**Tip:** For ongoing work, consider using the [GitHub CLI](https://cli.github.com/) (`gh auth login`) — it handles scopes and authentication more cleanly for GitHub-specific operations.

Once the initial push with the `workflow` scope succeeds, the CI will run and you can connect the repo to Vercel for full CD.

### Storing Git Credentials (avoid typing username + PAT on every push)

Git will normally prompt for your GitHub username and Personal Access Token on every `git push` / `git pull`.

#### Fastest way (stores credentials in a file in your home directory)

```bash
# Run once
git config --global credential.helper store

# Do one push (it will ask for username + PAT this time only)
git push origin main

# Username: filipgrk787
# Password: paste-your-PAT-here
```

Git will create `~/.git-credentials` and remember it for all future HTTPS operations to GitHub.

**Security note:** The token is stored in plain text. Fine for personal machines; on shared computers use the `cache` helper instead:

```bash
git config --global credential.helper cache
# optional: keep for 1 hour
git config --global credential.helper 'cache --timeout=3600'
```

#### Best long-term solution: GitHub CLI (gh)

```bash
# Install GitHub CLI (Ubuntu/WSL/Debian)
sudo apt update
sudo apt install gh -y

# Login (this creates a PAT for you with the scopes you choose)
gh auth login

# Tell git to use gh for credentials
gh auth setup-git
```

After this, `git push` and `git pull` will "just work" without ever asking for username or password again. `gh` also makes creating releases, managing issues, etc. much nicer.

You can even do the login with the exact scopes we need:

```bash
gh auth login --scopes "repo,workflow"
```

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

---

**Dummy update** — testing the new CI/CD pipeline (push from local PC) — June 2026
