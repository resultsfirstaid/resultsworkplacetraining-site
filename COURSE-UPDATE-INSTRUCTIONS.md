# Workplace course page update

1. Run `sql/02_workplace_copy.sql` in Supabase SQL Editor. It updates only the workplace-specific content table, preserving individual booking descriptions, Acuity links, prices, image URLs and publish flags.
2. Review the course text, qualifications and availability with your training team. Particular care: asthma/anaphylaxis codes, low-voltage rescue CPR prerequisites, and chief warden certification turnaround.
3. Upload this package's contents to the GitHub repository root (not the outer directory). Keep Cloudflare Pages build command `node scripts/build-courses.mjs`, output `dist`, and the existing build secrets.
4. Redeploy. The course listing and details use `courses.image_url` directly. Missing/broken images fall back to a branded title panel. To change a picture later, update `courses.image_url` and redeploy.
5. Test `/courses/`, a detail page, and its enquiry link on desktop and mobile. Enquiries still use the existing email function; no Acuity integration is added.

The `onerror` image fallback hides a broken image and shows the text background. Remote image URLs must be publicly accessible over HTTPS. Do not expose the Supabase service role key to the browser.
