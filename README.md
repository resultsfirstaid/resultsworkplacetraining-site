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
