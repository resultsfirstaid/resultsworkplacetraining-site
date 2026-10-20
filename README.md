# Results Workplace Training — deployment-ready starter

Static responsive website based on approved V2 concept, with a Cloudflare Pages Function for enquiry delivery.

## Deploy
1. Create a **new GitHub repository** and upload the contents of this folder (not the parent folder).
2. In Cloudflare **Workers & Pages → Create → Pages → Connect to Git**, select the repository.
3. Choose **no framework**, build command **blank**, build output directory **/** (repository root). If the dashboard requires a build output folder, use `public` and move `index.html`, `privacy.html`, `robots.txt`, and `_headers` into `public/`, leaving `functions/` at repository root.
4. In Pages → Settings → Variables and Secrets, add `RESEND_API_KEY` (secret), `ENQUIRY_TO` (your team's inbox), and `ENQUIRY_FROM` (verified sender, e.g. `enquiries@resultsworkplacetraining.com`). Set them for **Production** and redeploy.
5. In Resend, verify your domain and configure DNS records as instructed. Free quotas/eligibility may change; check Resend pricing. Test an actual enquiry end to end before publishing.
6. Attach `www.resultsworkplacetraining.com` as a custom domain in Cloudflare Pages and follow the DNS prompts. Redirect the apex domain to www if desired.

## Content to finish before launch
- Replace placeholder testimonial and generic trust line with **approved** quotes and client logos (do not imply endorsements without permission).
- Replace temporary Unsplash photography with authorised training images.
- Confirm the phone number, all course names, availability and exact certificate turnaround conditions.
- Review provisional privacy notice with business policy and add appropriate privacy contact and retention details.
- Check mental health / psychosocial training wording, any accreditation or qualification claims, and pricing before adding them.
- Add spam/rate limiting using Cloudflare WAF or Turnstile if needed; the included honeypot is only basic protection.
- The enquiry endpoint deliberately does **not** persist submissions to a database; configure and test email delivery and consider durable backup if critical.

## Local preview
Open `index.html` in a browser to inspect layout. Form submissions require deployment to Cloudflare Pages (or `wrangler pages dev`) and configured secrets.

## Editing
The site is a single static HTML file, plus Pages Function. No CMS, database, build dependencies or paid framework required.


## Supabase-backed workplace course pages
1. Run `sql/01_workplace_courses.sql` once in Supabase SQL Editor.
2. Review and edit `workplace_course_content` records; set `published=true` only for approved offerings. Check qualification codes and claims first.
3. In Cloudflare Pages project build settings, set **Build command** to `node scripts/build-courses.mjs` and **Build output directory** to `/` (repository root). No framework preset.
4. Add **build-time** environment secrets `SUPABASE_URL` (Supabase project URL) and `SUPABASE_SERVICE_ROLE_KEY` (server-only service role key). Never expose these in HTML or client-side JavaScript. Do not prefix with PUBLIC_.
5. Redeploy. The build generates `/courses/`, one `/courses/<slug>/` page per approved course, and `/data/workplace-courses.json`. Each course-data change needs a new deployment.
6. Existing `/api/enquiry` continues to email via Resend; it is not yet stored in Supabase. No Acuity connection is added.
7. If your Cloudflare Pages Git integration does not accept repository-root output `/`, configure a staging output folder with a copy step; do not move `functions/` into the static output.


## FIXED Cloudflare Pages deployment settings
- Build command: `node scripts/build-courses.mjs`
- Build output directory: `dist` (NOT `/` or repository root)
- Framework preset: None
- Keep `functions/` in the repository root; Cloudflare Pages discovers it separately.
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the Production build environment, then **retry deployment**. Do not put the key in frontend files.
- Publishing requires BOTH `courses.active=true` and `workplace_course_content.published=true`.
- A successful build log should say `Generated course listing and 9 published course pages.` (number varies). If zero are published, the build fails visibly rather than silently deploying an empty catalogue.
- Generated HTML now uses the site's maroon/navy design and fixes the enquiry deep link to `/?course=slug#enquire`.
