# Indore College Complaint Management System

## Project Structure

- `/frontend/index.html`
- `/frontend/style.css`
- `/frontend/script.js`
- `/frontend/config.js`
- `/backend/server.js`
- `/backend/routes`
- `/backend/models`
- `/backend/lib/supabaseClient.js`
- `/backend/supabase/schema.sql`
- `/uploads` (local fallback folder)

## Run Locally

1. Open terminal in `D:\college-complaint-system\backend`.
2. Install dependencies:
   - `npm install`
3. Copy environment file:
   - `copy .env.example .env`
4. Add your values in `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET` (optional, default `complaint-images`)
   - `OWNER_ADMIN_EMAIL` (optional, default `harshkamle03@gmail.com`)
5. In Supabase SQL Editor, run:
   - `backend/supabase/schema.sql`
6. In Supabase Storage, create a public bucket named `complaint-images` (or match `SUPABASE_STORAGE_BUCKET`).
7. Start server:
   - `npm start`
8. Open:
   - `http://localhost:5000`

## Auth and Admin Rules

- Complaint submit supports anonymous mode and optional name/email.
- Owner admin email is `harshkamle03@gmail.com` (or `OWNER_ADMIN_EMAIL` if set).
- Owner sets password using normal user signup, then logs in as admin.
- Any non-owner trying admin login is marked as `pending` until owner approval.

## Deploy Frontend to GitHub Subdomain (`github.io`)

1. Create a GitHub repository and upload/push this project.
2. Keep default branch as `main`.
3. In GitHub repo, open `Settings -> Pages` and set Source to `GitHub Actions`.
4. In `Settings -> Secrets and variables -> Actions -> Variables`, add:
   - `API_BASE_URL = https://YOUR_BACKEND_DOMAIN/api`
   - `SERVER_BASE_URL = https://YOUR_BACKEND_DOMAIN`
5. Push any change to `main` (workflow `.github/workflows/deploy-pages.yml` auto-deploys).
6. URL format:
   - Project site: `https://USERNAME.github.io/REPO_NAME/`
   - User site (if repo name is `USERNAME.github.io`): `https://USERNAME.github.io/`

## Make It Visible on Google

1. After deployment, open your live site and confirm these URLs load:
   - `/robots.txt`
   - `/sitemap.xml`
2. Go to Google Search Console and add your GitHub Pages URL as a property.
3. Verify ownership using the recommended method.
4. Submit sitemap URL in Search Console:
   - `https://USERNAME.github.io/REPO_NAME/sitemap.xml`
5. Wait for Google indexing (can take days).
