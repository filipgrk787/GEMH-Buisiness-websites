# Greek Business Website Creator

[![CI](https://github.com/filipgrk787/GEMH-Buisiness-websites/actions/workflows/ci.yml/badge.svg)](https://github.com/filipgrk787/GEMH-Buisiness-websites/actions/workflows/ci.yml)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffilipgrk787%2FGEMH-Buisiness-websites)

**Production-ready static website generator for Greek companies.**

> **Live demo**: Once deployed (see "Deploying the Builder" section below), the form + live preview + ZIP generator will be available on the internet at a public URL. Edit → Push → Live in seconds.

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

## Authentication (Login Required)

The website generator is now protected behind a login screen.

Supported login methods:
- **Google OAuth** (recommended)
- **Email + Password** (Credentials)

### Quick Setup

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Generate a strong secret:
   ```bash
   openssl rand -base64 32
   ```
   Put it in `NEXTAUTH_SECRET`.

3. **For Google OAuth** (recommended):
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and your production URL)
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

4. **For Username + Password**:
   - Generate a hash for your password:
     ```bash
     node -e 'console.log(require("bcryptjs").hashSync("YourStrongPassword123!", 10))'
     ```
   - Set `AUTH_USERS` as a JSON array in `.env.local`:
     ```bash
     AUTH_USERS='[{"email":"you@company.gr","passwordHash":"$2a$10$...","name":"Your Name"}]'
     ```

5. Restart the dev server.

The entire tool (including live preview and ZIP generation) is now only accessible to logged-in users.

**Note for production:** On Vercel, set the same environment variables in your project settings. Make sure `NEXTAUTH_URL` is not needed (Vercel sets it automatically).

See `.env.example` for full details.

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
3. GitHub Actions automatically runs on every push to `main` and on Pull Requests (see jobs below):
   - **Lint** — ESLint
   - **Build & Type Check** — `npm run build` (catches TypeScript / Next.js / React errors)
   - **Verify Site Generator** — runs the full headless generation (`npm run verify`) and asserts that the 4 legal pages + Γ.Ε.ΜΗ. / ΑΦΜ / registered address compliance data are produced correctly.

   The generator verification job is the most important one for this project.

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

#### Best for WSL + Windows (uses Windows Credential Manager - secure)

Most people on Windows + WSL already have Git for Windows installed. Use its built-in secure credential manager:

```bash
git config --global credential.helper "/mnt/c/Program Files/Git/mingw64/bin/git-credential-manager.exe"
```

Then just run `git push`. The first time Git will prompt (nice dialog or terminal) for your username (`filipgrk787`) and PAT. It stores the secret safely in the Windows Credential Manager. No more prompts ever.

#### Simple cross-platform fallback (plain text file in home dir)

```bash
git config --global credential.helper store
git push origin main   # enter credentials one time only
```

This creates `~/.git-credentials`. Acceptable on your personal dev machine.

**Temporary memory-only (never written to disk):**

```bash
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'   # 1 hour
```

#### Best overall developer experience: GitHub CLI (gh)

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

## Deploying the Builder (CD) — Get it live on the internet

The **builder app itself** (the form + live preview + ZIP generator) can be hosted publicly.

Once deployed:
- Anyone can use the full tool at a public URL (no need to `npm run dev` locally).
- `git push` from your PC → GitHub Actions CI runs (lint + build + full generator verification) → site redeploys.

This gives you the complete "develop locally → push → live on the internet" flow.

### Recommended: Vercel (Free + Instant)

Vercel is the best fit for Next.js apps and gives you true **Continuous Deployment**:

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New Project** → **Import Git Repository**.
3. Select `filipgrk787/GEMH-Buisiness-websites`.
4. Vercel will auto-detect it's a Next.js project (a `vercel.json` is also present for explicit config and headers) — just click **Deploy**.

**After setup:**

- Every time you `git push` from your local PC to the `main` branch, Vercel will **automatically build and deploy** a new version.
- You get a production URL like `https://gemh-buisiness-websites.vercel.app`
- Pull Requests get preview deployments automatically (great for testing changes).

This is the full "edit locally → push → live on the internet" CI/CD flow.

A `vercel.json` is included in the repo for explicit Next.js configuration and basic security headers (the deployment will work without it too, but it's recommended).

### Alternative: Self-hosted / Other platforms

You can also deploy the built output (`npm run build` then `npm run start`) to any Node-compatible host (Railway, Fly.io, a VPS with PM2, etc.).

### Advanced: Drive deploys from GitHub Actions (optional)

If you prefer to trigger production deploys from a GitHub Actions workflow (instead of letting Vercel watch the repo directly), create three repository secrets:

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Add:
   - `VERCEL_TOKEN` — create at https://vercel.com/account/tokens (needs "Full Account" scope)
   - `VERCEL_ORG_ID` — get from your Vercel project settings (or run `vercel link` locally and look in `.vercel/project.json`)
   - `VERCEL_PROJECT_ID` — same as above

Then the workflow in `.github/workflows/deploy.yml` will deploy to production on every push to `main`.

**Note:** The simplest and most common setup is still just connecting the repo in the Vercel dashboard (the "Deploy with Vercel" button above). The Actions-driven deploy is only needed if you want full control inside GitHub (e.g. custom pre-deploy steps, multiple environments, etc.).

## License / Use

Free to use for any Greek company or agency building client sites. The generated sites may be used without restriction.

---

Built as a complete, production-grade website template system.

---
