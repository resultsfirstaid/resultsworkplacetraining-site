import fs from 'node:fs/promises';
import path from 'node:path';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set both as Cloudflare Pages build environment secrets.');
  process.exit(1);
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const origin = SUPABASE_URL.replace(/\/+$/, '');
async function query(table, select) {
  const url = `${origin}/rest/v1/${table}?${select}`;
  const response = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } });
  if (!response.ok) throw new Error(`${table}: Supabase returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}
const [base, workplace] = await Promise.all([
  query('courses', 'select=id,name,slug,official_title,id_number,subject,short_description,duration_text,prerequisites,covers,image_url,display_order&active=eq.true'),
  query('workplace_course_content', 'select=course_id,workplace_title,workplace_summary,workplace_description,ideal_for,delivery_options,featured,display_order&published=eq.true')
]);
const byId = new Map(base.map(x => [x.id, x]));
const safeSlug = s => typeof s === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const items = workplace.map(w => ({...byId.get(w.course_id), ...w})).filter(x => x.id && safeSlug(x.slug)).sort((a,b) => (a.display_order ?? 99) - (b.display_order ?? 99));
if (items.length !== workplace.length) throw new Error('One or more published courses lack an active parent course or valid slug.');
const homepage = await fs.readFile('index.html', 'utf8');
const styles = [...homepage.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[0]).join('\n');
const [announcement, header, footer] = await Promise.all(['announcement','header','footer'].map(n => fs.readFile(`partials/${n}.html`, 'utf8')));
const navigationScript = `<script>const menu=document.getElementById('menuToggle');const mobile=document.getElementById('mobileNav');if(menu&&mobile){menu.addEventListener('click',()=>{mobile.hidden=!mobile.hidden;menu.setAttribute('aria-expanded',String(!mobile.hidden))});document.querySelectorAll('#mobileNav a').forEach(a=>a.addEventListener('click',()=>{mobile.hidden=true;menu.setAttribute('aria-expanded','false')}));}</script>`;
const courseStyles = `<style>.course-page-main{min-height:60vh}.course-page-main .course-hero{padding:65px 0 38px}.course-page-main h1{font-size:clamp(38px,5vw,68px);line-height:1.12;margin:16px 0 20px}.course-page-main .lead{max-width:780px}.course-page-main .course-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:35px 0 85px}.course-page-main .course-card{border:1px solid var(--line);border-radius:18px;padding:28px;background:#fff}.course-page-main .course-card h2{font-size:23px;margin:14px 0}.course-page-main .course-card p{color:var(--muted);font-size:14px;line-height:1.7}.course-page-main .course-card .more{display:inline-block;margin-top:22px;color:var(--green);font-weight:800;font-size:13px}.course-page-main .course-detail{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr);gap:50px;padding:30px 0 100px}.course-page-main .course-detail h2{font-size:26px;margin:25px 0 12px}.course-page-main .course-detail p,.course-page-main .course-detail li{color:var(--muted);line-height:1.8}.course-page-main .course-detail li{margin-bottom:10px}.course-page-main .course-panel{background:#f7f5f7;border:1px solid var(--line);border-radius:18px;padding:30px;align-self:start}.course-page-main .course-panel h2{margin-top:0}@media(max-width:850px){.course-page-main .course-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.course-page-main .course-detail{grid-template-columns:1fr}}@media(max-width:560px){.course-page-main .course-grid{grid-template-columns:1fr}.course-page-main .course-hero{padding:45px 0 20px}}</style>`;
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
const page = (title, description, body, canonical) => `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Results Workplace Training</title><meta name="description" content="${esc(description).slice(0,250)}"><link rel="canonical" href="https://www.resultsworkplacetraining.com${canonical}">${fonts}${styles}${courseStyles}</head><body id="top">${announcement}${header}<main class="wrap course-page-main">${body}</main>${footer}${navigationScript}</body></html>`;
const listing = `<section class="course-hero"><div class="eyebrow">Our training</div><h1>Practical training for your team.</h1><p class="lead">Choose a course, then tell us what your workplace needs. We'll help organise the training around your people and schedule.</p></section><section class="course-grid">${items.map(c => `<article class="course-card"><div class="eyebrow">${esc(c.subject || 'Workplace training')}</div><h2><a href="/courses/${esc(c.slug)}/">${esc(c.workplace_title || c.name)}</a></h2><p>${esc(c.workplace_summary || c.short_description || '')}</p><a class="more" href="/courses/${esc(c.slug)}/">Explore course →</a></article>`).join('')}</section>${items.length ? '' : '<p>Course details are being finalised. <a href="/#enquire">Enquire about training</a>.</p>'}`;
await fs.rm('dist', {recursive:true, force:true});
await fs.mkdir('dist', {recursive:true});
for (const item of ['privacy.html','robots.txt','_headers']) await fs.copyFile(item, path.join('dist',item));
await fs.writeFile('dist/index.html', homepage.replace('<!-- SHARED_ANNOUNCEMENT -->', announcement).replace('<!-- SHARED_HEADER -->', header).replace('<!-- SHARED_FOOTER -->', footer));
await fs.cp('assets', 'dist/assets', {recursive:true});
await fs.cp('data', 'dist/data', {recursive:true});
await fs.mkdir('dist/courses', {recursive:true});
await fs.writeFile('dist/courses/index.html', page('Workplace training courses', 'Explore workplace training across Victoria.', listing, '/courses/'));
for (const c of items) {
  const title = c.workplace_title || c.name;
  const summary = c.workplace_summary || c.short_description || '';
  const covers = Array.isArray(c.covers) ? c.covers : [];
  const query = new URLSearchParams({course:c.slug}).toString();
  const section = `<section class="course-hero"><div class="eyebrow">${esc(c.subject || 'Workplace training')}${c.id_number ? ' · '+esc(c.id_number) : ''}</div><h1>${esc(title)}</h1><p class="lead">${esc(summary)}</p><a class="btn" href="/?${query}#enquire">Enquire about this course ↗</a></section><section class="course-detail"><div><h2>About this training</h2><p>${esc(c.workplace_description || summary)}</p>${covers.length ? `<h2>What you'll cover</h2><ul>${covers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}${c.ideal_for ? `<h2>Who it's for</h2><p>${esc(c.ideal_for)}</p>` : ''}</div><aside class="course-panel"><h2>At a glance</h2>${c.duration_text ? `<p><strong>Duration:</strong> ${esc(c.duration_text)}</p>` : ''}${c.prerequisites ? `<p><strong>Prerequisites:</strong> ${esc(c.prerequisites)}</p>` : ''}${c.delivery_options ? `<p><strong>Delivery:</strong> ${esc(c.delivery_options)}</p>` : ''}<p>Need a team session or corporate account? We'll help you organise it.</p><a class="btn" href="/?${query}#enquire">Ask about training ↗</a></aside></section>`;
  const dir = path.join('dist/courses', c.slug);
  await fs.mkdir(dir, {recursive:true});
  await fs.writeFile(path.join(dir, 'index.html'), page(title, summary, section, `/courses/${esc(c.slug)}/`));
}
await fs.writeFile('dist/data/workplace-courses.json', JSON.stringify(items.map(c=>({slug:c.slug,title:c.workplace_title||c.name,subject:c.subject})),null,2));
if (!items.length) throw new Error('No published courses found. Check workplace_course_content.published, courses.active, and Supabase build secrets.');
console.log(`Generated course listing and ${items.length} published course pages.`);
