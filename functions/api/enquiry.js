// Cloudflare Pages Function. Configure RESEND_API_KEY, ENQUIRY_TO and ENQUIRY_FROM in Cloudflare Pages settings.
const allowed = ['name','contact','interest','company','attendees','date','location','message'];
const safe = v => String(v ?? '').trim().slice(0,2000);
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function onRequestPost({request,env}) {
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
 if(Number(request.headers.get('content-length')||0)>16000)return new Response(JSON.stringify({error:'Message too long.'}),{status:413,headers});
 let raw;try{raw=await request.json()}catch{return new Response(JSON.stringify({error:'Invalid request.'}),{status:400,headers})}
 if(!raw || typeof raw!=='object'||Array.isArray(raw))return new Response(JSON.stringify({error:'Invalid request.'}),{status:400,headers});
 if(safe(raw.website))return new Response(JSON.stringify({ok:true}),{headers});
 const data=Object.fromEntries(allowed.map(k=>[k,safe(raw[k])]));
 if(data.name.length<2||data.name.length>120||data.contact.length<5||data.contact.length>200)return new Response(JSON.stringify({error:'Please enter your name and a valid email address or phone number.'}),{status:400,headers});
 if(!(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(data.contact)||/[+\d][\d\s()+-]{6,}/.test(data.contact)))return new Response(JSON.stringify({error:'Please enter a valid email address or phone number.'}),{status:400,headers});
 if(data.attendees && (!/^\d+$/.test(data.attendees)||Number(data.attendees)>100000||Number(data.attendees)<1))return new Response(JSON.stringify({error:'Please check the attendee count.'}),{status:400,headers});
 if(data.date&&!/^\d{4}-\d{2}-\d{2}$/.test(data.date))return new Response(JSON.stringify({error:'Please check the date.'}),{status:400,headers});
 if(!env.RESEND_API_KEY||!env.ENQUIRY_TO||!env.ENQUIRY_FROM)return new Response(JSON.stringify({error:'Enquiries are not configured yet. Please call us instead.'}),{status:503,headers});
 const html='<h2>New workplace training enquiry</h2><table>'+allowed.map(k=>'<tr><th style="text-align:left;padding:8px">'+escapeHtml(k)+'</th><td style="padding:8px;white-space:pre-wrap">'+escapeHtml(data[k])+'</td></tr>').join('')+'</table>';
 try{const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.ENQUIRY_FROM,to:[env.ENQUIRY_TO],subject:'New Results Workplace Training enquiry',html})});if(!result.ok){console.error('Email provider error',result.status);throw Error('Delivery failed')}return new Response(JSON.stringify({ok:true}),{headers});}catch{return new Response(JSON.stringify({error:'We couldn’t send your enquiry right now. Please call us instead.'}),{status:502,headers});}
}
