# Why Results Training update

This package adds `/why-results/`, a continuous client-logo marquee on the homepage, and an editorial testimonial feature.

- Both pages read existing `/data/clients.json` and `/data/testimonials.json`; no Supabase changes needed.
- Client logos pause on hover and respect reduced-motion preferences.
- The HQ panel is deliberately a placeholder until a real photograph is provided.
- Upload the **contents** of this package to the GitHub repository root.
- Keep the Cloudflare build command `node scripts/build-courses.mjs` and output directory `dist`.
- Ensure the build has the same Supabase environment variables as before.
