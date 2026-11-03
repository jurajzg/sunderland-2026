const SESSION_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
}
function hex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function sha256(value){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));}
function cookie(req,name){return (req.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);}
function setCookie(value,maxAge=900){return `sunderland_session=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;}
async function session(req,env){
 const id=cookie(req,'sunderland_session'); if(!id)return null;
 const row=await env.DB.prepare('SELECT id,pin_fingerprint,last_seen,revoked FROM ticket_sessions WHERE id=?').bind(id).first();
 if(!row||row.revoked||row.pin_fingerprint!==env.TICKET_PIN_HASH||Date.now()-row.last_seen>=SESSION_MINUTES*60000){
  if(row)await env.DB.prepare('UPDATE ticket_sessions SET revoked=1 WHERE id=?').bind(id).run();
  return null;
 }
 await env.DB.prepare('UPDATE ticket_sessions SET last_seen=? WHERE id=?').bind(Date.now(),id).run();
 return row;
}
async function admin(req,env){
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
 if(!token||!env.ADMIN_TOKEN_HASH)return false;
 return (await sha256(token))===env.ADMIN_TOKEN_HASH;
}
async function handle(req,env){
 const url=new URL(req.url),path=url.pathname,ip=req.headers.get('CF-Connecting-IP')||'unknown';
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN||'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Credentials':'true'}});
 if(path==='/api/health')return json({ok:true,service:'sunderland-2026'});
 if(path==='/api/unlock'&&req.method==='POST'){
  const lock=await env.DB.prepare('SELECT failures,locked_until FROM ticket_unlock_attempts WHERE ip=?').bind(ip).first();
  if(lock?.locked_until>Date.now())return json({error:'Previše pokušaja. Pokušajte kasnije.'},429);
  const body=await req.json().catch(()=>({}));
  const submitted=String(body.pin||'');
  const valid=env.TICKET_PIN_HASH && await sha256(submitted)===env.TICKET_PIN_HASH;
  if(!valid){
   await env.DB.prepare(`INSERT INTO ticket_unlock_attempts(ip,failures,locked_until) VALUES(?,1,0)
    ON CONFLICT(ip) DO UPDATE SET failures=CASE WHEN locked_until> ? THEN failures ELSE failures+1 END,
    locked_until=CASE WHEN locked_until> ? THEN locked_until WHEN failures+1>=? THEN ? ELSE 0 END`)
    .bind(ip,Date.now(),Date.now(),MAX_ATTEMPTS,Date.now()+LOCK_MINUTES*60000).run();
   return json({error:'PIN nije ispravan.'},401);
  }
  await env.DB.prepare('DELETE FROM ticket_unlock_attempts WHERE ip=?').bind(ip).run();
  const id=crypto.randomUUID();
  await env.DB.prepare('INSERT INTO ticket_sessions(id,pin_fingerprint,last_seen,revoked) VALUES(?,?,?,0)').bind(id,env.TICKET_PIN_HASH,Date.now()).run();
  return json({ok:true},{status:200,headers:{'Set-Cookie':setCookie(id),'Access-Control-Allow-Credentials':'true'}});
 }
 if(path==='/api/lock'&&req.method==='POST'){
  const id=cookie(req,'sunderland_session');if(id)await env.DB.prepare('UPDATE ticket_sessions SET revoked=1 WHERE id=?').bind(id).run();
  return json({ok:true},{headers:{'Set-Cookie':setCookie('',0)}});
 }
 if(path==='/api/tickets'&&req.method==='GET'){
  if(!await session(req,env))return json({error:'Zaključano'},401);
  const rows=await env.DB.prepare('SELECT person,category,object_key,filename FROM tickets ORDER BY person,category').all();
  return json({tickets:rows.results||[]});
 }
 if(path.startsWith('/api/tickets/')&&req.method==='GET'){
  if(!await session(req,env))return json({error:'Zaključano'},401);
  const key=decodeURIComponent(path.slice('/api/tickets/'.length));
  if(key.includes('..')||key.includes('/'))return json({error:'Neispravan zahtjev'},400);
  const obj=await env.BUCKET.get(key);if(!obj)return json({error:'Datoteka nije pronađena'},404);
  return new Response(obj.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="ulaznica.pdf"','Cache-Control':'no-store'}});
 }
 if(path==='/api/admin/tickets'&&(req.method==='POST'||req.method==='DELETE')){
  if(!await admin(req,env))return json({error:'Nedozvoljeno'},401);
  if(req.method==='DELETE'){
   const body=await req.json();await env.BUCKET.delete(body.key);
   await env.DB.prepare('DELETE FROM tickets WHERE object_key=?').bind(body.key).run();return json({ok:true});
  }
  const body=await req.json();
  const {person,category,filename,base64}=body;
  if(!['Juraj','Buco'].includes(person)||!['flight','train','match'].includes(category)||typeof base64!=='string'||base64.length>8_000_000)return json({error:'Neispravni podaci'},400);
  const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
  if(bytes[0]!==0x25||bytes[1]!==0x50||bytes[2]!==0x44||bytes[3]!==0x46)return json({error:'Datoteka nije PDF'},400);
  const key=`${person.toLowerCase()}/${category}/${crypto.randomUUID()}.pdf`;
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'application/pdf'}});
  await env.DB.prepare('INSERT INTO tickets(person,category,object_key,filename) VALUES(?,?,?,?)').bind(person,category,key,filename||'ulaznica.pdf').run();
  return json({ok:true});
 }
 return json({error:'Not found'},404);
}
export default {fetch(req,env){return handle(req,env).catch(()=>json({error:'Interna pogreška'},500));}};
