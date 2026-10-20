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
const style = `:root{--ink:#202a3b;--muted:#687386;--maroon:#70283f;--navy:#324d73;--paper:#fff;--line:#e9e7ec}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.7 'DM Sans',system-ui,sans-serif}h1,h2,h3{font-family:Manrope,system-ui,sans-serif;letter-spacing:-.045em;line-height:1.2}a{color:var(--maroon)}.wrap{max-width:1200px;margin:auto;padding:0 32px}.header{min-height:92px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{font-weight:800;line-height:1.12;text-decoration:none;color:var(--ink);letter-spacing:-.035em}.brand small{display:block;font-size:10px;letter-spacing:.07em;color:var(--muted);margin-top:5px}.nav{display:flex;gap:24px;align-items:center}.nav a{text-decoration:none;font-size:13px;font-weight:700}.hero{padding:90px 0 40px}.eyebrow{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--maroon);font-weight:800}.hero h1{font-size:clamp(42px,5.3vw,76px);margin:16px 0 20px;max-width:850px}.lead{font-size:19px;max-width:720px;color:var(--muted);line-height:1.7}.btn{display:inline-block;background:var(--maroon);color:#fff;padding:14px 22px;border-radius:9px;text-decoration:none;font-weight:750;margin-top:22px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:36px 0 90px}.card{border:1px solid var(--line);border-radius:18px;padding:28px;background:#fff;transition:transform .2s,box-shadow .2s}.card:hover{transform:translateY(-3px);box-shadow:0 15px 35px #202a3b12}.card h2{font-size:23px;margin:13px 0}.card h2 a{text-decoration:none;color:var(--ink)}.card p{color:var(--muted);font-size:14px}.card .more{font-weight:800;font-size:13px;text-decoration:none}.detail{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr);gap:50px;padding:30px 0 100px}.detail h2{font-size:26px;margin:25px 0 10px}.detail p,.detail li{color:var(--muted)}.detail li{margin-bottom:10px}.panel{background:#f7f5f7;border:1px solid var(--line);border-radius:18px;padding:30px;align-self:start}.panel h2{margin-top:0}.footer{background:#202a3b;color:#fff;padding:42px 0;font-size:13px}.footer a{color:#fff}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.detail{grid-template-columns:1fr}}@media(max-width:560px){.wrap{padding:0 20px}.header{min-height:76px}.nav{gap:12px}.hero{padding:50px 0 20px}.grid{grid-template-columns:1fr}.hero h1{font-size:43px}}`;
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
const page = (title, description, body, canonical) => `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Results Workplace Training</title><meta name="description" content="${esc(description).slice(0,250)}"><link rel="canonical" href="https://www.resultsworkplacetraining.com${canonical}">${fonts}<style>${style}</style></head><body><header class="header wrap"><a class="brand" href="/">RESULTS<br>WORKPLACE TRAINING<small>PART OF RESULTS FIRST AID</small></a><nav class="nav"><a href="/">Home</a><a href="/courses/">All courses</a><a class="btn" href="/#enquire">Enquire</a></nav></header><main class="wrap">${body}</main><footer class="footer"><div class="wrap">Workplace training across Victoria · Part of Results First Aid · <a href="/privacy.html">Privacy</a></div></footer></body></html>`;
const listing = `<section class="hero"><div class="eyebrow">Our training</div><h1>Practical training for your team.</h1><p class="lead">Choose a course, then tell us what your workplace needs. We'll help organise the training around your people and schedule.</p></section><section class="grid">${items.map(c => `<article class="card"><div class="eyebrow">${esc(c.subject || 'Workplace training')}</div><h2><a href="/courses/${esc(c.slug)}/">${esc(c.workplace_title || c.name)}</a></h2><p>${esc(c.workplace_summary || c.short_description || '')}</p><a class="more" href="/courses/${esc(c.slug)}/">Explore course →</a></article>`).join('')}</section>${items.length ? '' : '<p>Course details are being finalised. <a href="/#enquire">Enquire about training</a>.</p>'}`;
await fs.rm('dist', {recursive:true, force:true});
await fs.mkdir('dist', {recursive:true});
for (const item of ['index.html','privacy.html','robots.txt','_headers']) await fs.copyFile(item, path.join('dist',item));
await fs.cp('assets', 'dist/assets', {recursive:true});
await fs.cp('data', 'dist/data', {recursive:true});
await fs.mkdir('dist/courses', {recursive:true});
await fs.writeFile('dist/courses/index.html', page('Workplace training courses', 'Explore workplace training across Victoria.', listing, '/courses/'));
for (const c of items) {
  const title = c.workplace_title || c.name;
  const summary = c.workplace_summary || c.short_description || '';
  const covers = Array.isArray(c.covers) ? c.covers : [];
  const query = new URLSearchParams({course:c.slug}).toString();
  const section = `<section class="hero"><div class="eyebrow">${esc(c.subject || 'Workplace training')}${c.id_number ? ' · '+esc(c.id_number) : ''}</div><h1>${esc(title)}</h1><p class="lead">${esc(summary)}</p><a class="btn" href="/?${query}#enquire">Enquire about this course ↗</a></section><section class="detail"><div><h2>About this training</h2><p>${esc(c.workplace_description || summary)}</p>${covers.length ? `<h2>What you'll cover</h2><ul>${covers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}${c.ideal_for ? `<h2>Who it's for</h2><p>${esc(c.ideal_for)}</p>` : ''}</div><aside class="panel"><h2>At a glance</h2>${c.duration_text ? `<p><strong>Duration:</strong> ${esc(c.duration_text)}</p>` : ''}${c.prerequisites ? `<p><strong>Prerequisites:</strong> ${esc(c.prerequisites)}</p>` : ''}${c.delivery_options ? `<p><strong>Delivery:</strong> ${esc(c.delivery_options)}</p>` : ''}<p>Need a team session or corporate account? We'll help you organise it.</p><a class="btn" href="/?${query}#enquire">Ask about training ↗</a></aside></section>`;
  const dir = path.join('dist/courses', c.slug);
  await fs.mkdir(dir, {recursive:true});
  await fs.writeFile(path.join(dir, 'index.html'), page(title, summary, section, `/courses/${esc(c.slug)}/`));
}
await fs.writeFile('dist/data/workplace-courses.json', JSON.stringify(items.map(c=>({slug:c.slug,title:c.workplace_title||c.name,subject:c.subject})),null,2));
if (!items.length) throw new Error('No published courses found. Check workplace_course_content.published, courses.active, and Supabase build secrets.');
console.log(`Generated course listing and ${items.length} published course pages.`);
