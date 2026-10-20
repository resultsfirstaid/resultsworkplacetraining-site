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
const style = `:root{--ink:#1a2523;--green:#244e40;--paper:#f8f8f5}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.7 system-ui,-apple-system,sans-serif}a{color:var(--green)}header,main,footer{max-width:1080px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}header a{font-weight:750;text-decoration:none}.hero{padding:60px 0 35px}h1{font-size:clamp(36px,5vw,64px);line-height:1.1;letter-spacing:-.05em;margin:12px 0 24px}h2{line-height:1.2}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#52836b;font-weight:800}.lead{font-size:20px;max-width:760px;color:#58685f}.btn{display:inline-block;background:var(--green);color:white;text-decoration:none;padding:13px 20px;border-radius:9px;font-weight:750;margin-top:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:20px;margin:40px 0}.card,.panel{background:white;border:1px solid #e2e8e3;border-radius:16px;padding:25px}.card a{text-decoration:none}.card h2{margin:8px 0}.detail{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(250px,1fr);gap:30px}.detail img{max-width:100%;border-radius:15px;object-fit:cover}.panel ul{padding-left:20px}footer{border-top:1px solid #e2e8e3;margin-top:70px;font-size:13px;color:#64736a}@media(max-width:700px){.detail{grid-template-columns:1fr}.hero{padding-top:30px}}`;
const page = (title, description, body) => `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Results Workplace Training</title><meta name="description" content="${esc(description).slice(0, 250)}"><link rel="canonical" href="https://www.resultsworkplacetraining.com${title === 'Workplace training courses' ? '/courses/' : ''}"><style>${style}</style></head><body><header><a href="/">RESULTS WORKPLACE TRAINING</a><nav><a href="/courses/">All courses</a> &nbsp; <a href="/#enquire">Enquire</a></nav></header><main>${body}</main><footer>Part of Results First Aid · Workplace training across Victoria · <a href="/privacy.html">Privacy</a></footer></body></html>`;
const listing = `<section class="hero"><div class="eyebrow">Our training</div><h1>Practical training for your team.</h1><p class="lead">Choose a course, then tell us what your workplace needs. We'll help organise the training around your people and schedule.</p></section><section class="grid">${items.map(c => `<article class="card"><div class="eyebrow">${esc(c.subject || 'Workplace training')}</div><h2><a href="/courses/${esc(c.slug)}/">${esc(c.workplace_title || c.name)}</a></h2><p>${esc(c.workplace_summary || c.short_description || '')}</p><a href="/courses/${esc(c.slug)}/">Explore course →</a></article>`).join('')}</section>${items.length ? '' : '<p>Course details are being finalised. <a href="/#enquire">Enquire about training</a>.</p>'}`;
await fs.mkdir('courses', {recursive:true});
await fs.writeFile('courses/index.html', page('Workplace training courses', 'Explore workplace training across Victoria.', listing));
for (const c of items) {
  const title = c.workplace_title || c.name;
  const summary = c.workplace_summary || c.short_description || '';
  const covers = Array.isArray(c.covers) ? c.covers : [];
  const query = new URLSearchParams({course:c.slug}).toString();
  const section = `<section class="hero"><div class="eyebrow">${esc(c.subject || 'Workplace training')}${c.id_number ? ' · '+esc(c.id_number) : ''}</div><h1>${esc(title)}</h1><p class="lead">${esc(summary)}</p><a class="btn" href="/#enquire?${query}">Enquire about this course ↗</a></section><section class="detail"><div><h2>About this training</h2><p>${esc(c.workplace_description || summary)}</p>${covers.length ? `<h2>What you'll cover</h2><ul>${covers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}${c.ideal_for ? `<h2>Who it's for</h2><p>${esc(c.ideal_for)}</p>` : ''}</div><aside class="panel"><h2>At a glance</h2>${c.duration_text ? `<p><strong>Duration:</strong> ${esc(c.duration_text)}</p>` : ''}${c.prerequisites ? `<p><strong>Prerequisites:</strong> ${esc(c.prerequisites)}</p>` : ''}${c.delivery_options ? `<p><strong>Delivery:</strong> ${esc(c.delivery_options)}</p>` : ''}<p>Need a team session or corporate account? We'll help you organise it.</p><a class="btn" href="/#enquire?${query}">Ask about training ↗</a></aside></section>`;
  const dir = path.join('courses', c.slug);
  await fs.mkdir(dir, {recursive:true});
  await fs.writeFile(path.join(dir, 'index.html'), page(title, summary, section).replace(`<link rel="canonical" href="https://www.resultsworkplacetraining.com">`, `<link rel="canonical" href="https://www.resultsworkplacetraining.com/courses/${esc(c.slug)}/">`));
}
await fs.writeFile('data/workplace-courses.json', JSON.stringify(items.map(c=>({slug:c.slug,title:c.workplace_title||c.name,subject:c.subject})),null,2));
console.log(`Generated course listing and ${items.length} published course pages.`);
