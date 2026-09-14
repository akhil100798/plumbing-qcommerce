const fs=require('fs'),path=require('path'),{chromium,request}=require('playwright');
const base=__dirname, run=process.env.QA_RUN||new Date().toISOString().replace(/[:.]/g,'-');
const out=path.join(base,run); fs.mkdirSync(out,{recursive:true});
const domains={customer:'https://fixkart-customer-web.vercel.app',plumber:'https://fixkart-plumber-web.vercel.app',store:'https://fixkart-store-web.vercel.app',admin:'https://fixkart-admin.vercel.app'};
const api='https://plumbing-qcommerce.onrender.com';
const redact=s=>String(s).replace(/Bearer\s+[^\s"<>]+/gi,'Bearer [REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED JWT]').replace(/("?(?:password|accessToken|refreshToken|token|secret)"?\s*[:=]\s*)"[^"]*"/gi,'$1"[REDACTED]"');
function safe(d){return JSON.parse(JSON.stringify(d,(k,v)=>/^(set-cookie|cookie|authorization|password|accessToken|refreshToken|secret)$/i.test(k)?'[REDACTED]':v))}
function save(n,d){fs.writeFileSync(path.join(out,n),redact(JSON.stringify(safe(d),null,2)))}
async function main(){
 const b=await chromium.launch({channel:'chrome',headless:true});save('run.json',{run,time:new Date().toISOString(),browser:b.version(),domains,api,localBranch:'Development-2',localSHA:'618a8181b165644013422a217bb5dc2ff66b9209'});
 try{
 const baseline=[]; const http=await request.newContext();
 for(const endpoint of ['/version','/health/live','/health/ready']){
  for(let attempt=1;attempt<=3;attempt++) {const start=Date.now();try {const r=await http.get(api+endpoint,{timeout:90000});const item={endpoint,attempt,status:r.status(),ms:Date.now()-start,headers:r.headers(),body:await r.text()};baseline.push(item);console.log(JSON.stringify({endpoint,attempt,status:item.status,ms:item.ms,body:item.body.slice(0,1500)}));save('baseline.json',baseline);if(r.ok()||r.status()===404)break;}catch(e){baseline.push({endpoint,attempt,ms:Date.now()-start,error:e.message});save('baseline.json',baseline);console.log(endpoint,attempt,e.message.slice(0,180));}}
 }
 for(const [actor,url] of Object.entries(domains)){
  const c=await b.newContext({viewport:{width:1440,height:900}}),p=await c.newPage(),events=[];
  p.on('console',m=>{if(['warning','error'].includes(m.type()))events.push({type:m.type(),text:redact(m.text())})});p.on('pageerror',e=>events.push({type:'pageerror',text:redact(e.message)}));
  p.on('requestfailed',r=>events.push({type:'requestfailed',url:r.url(),error:r.failure()?.errorText}));p.on('response',r=>events.push({type:'response',url:r.url(),status:r.status(),method:r.request().method()}));
  try{let r=await p.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForLoadState('networkidle',{timeout:45000}).catch(e=>events.push({type:'readiness',text:e.message}));await p.locator('input,button,[role=button],a').first().waitFor({timeout:20000}).catch(()=>{});
   const shot=path.join(base,'screenshots',actor,run);fs.mkdirSync(shot,{recursive:true});await p.screenshot({path:path.join(shot,'landing.png'),fullPage:true});
   const controls=await p.locator('input,button,[role=button],a,select,textarea,[role=checkbox],[role=tab]').evaluateAll(es=>es.map(e=>({tag:e.tagName,role:e.getAttribute('role'),type:e.type,label:e.getAttribute('aria-label'),text:(e.innerText||'').trim(),placeholder:e.getAttribute('placeholder'),href:e.getAttribute('href'),visible:!!(e.getBoundingClientRect().width&&e.getBoundingClientRect().height),disabled:e.disabled})));
   const item={url:p.url(),status:r.status(),headers:await r.allHeaders(),text:await p.locator('body').innerText(),controls};save(actor+'-landing.json',item);console.log(actor,JSON.stringify({url:item.url,status:item.status,text:item.text,controls}));
  }catch(e){save(actor+'-landing.json',{error:e.message});console.log(actor,e.message)}finally{save(actor+'-network.json',events);await c.close()}
 }
 }finally{await b.close()}
 console.log('EVIDENCE',out);
}
main().catch(e=>{console.error(redact(e.stack));process.exitCode=1});
