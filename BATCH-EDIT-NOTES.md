# Batch website refinements — 20 October 2026

Includes: updated shared header logo, favicon variants, homepage training image, former hero photo moved to corporate accounts, 15% slower logo strip (60s → 69s), smaller Results Difference headline, left-aligned training CTA with accessible white hover text, Truganina HQ photograph on Why Results, course-detail CTA spacing, and navy course image overlays.

## Deploy
Unzip the package and copy its **contents** to the repository root. Commit to GitHub; existing Cloudflare Pages build remains `node scripts/build-courses.mjs`, output `dist`. No SQL changes or new secrets required.

## Notes
The homepage hero uses the existing first-aid course photo URL. It can be swapped for a dedicated workplace-training photograph later. The HQ image supplied is low resolution, so it may look soft on large screens; a higher resolution original is preferable. The existing 24-hour certificate claim remains on the homepage; review this for courses where certificate issuance differs.
