const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const root=__dirname,run=new Date().toISOString().replace(/[:.]/g,'-'),out=path.join(root,run);fs.mkdirSync(out,{recursive:true});
function clean(k,v){return /^(set-cookie|cookie|authorization|password|accessToken|refreshToken|secret)$/i.test(k)?'[REDACTED]':v}
function save(n,d){fs.writeFileSync(path.join(out,n),JSON.stringify(d,clean,2))}
const urls={customer:'https://fixkart-customer-web.vercel.app',plumber:'https://fixkart-plumber-web.vercel.app',store:'https://fixkart-store-web.vercel.app',admin:'https://admin-portal-ten-weld.vercel.app'};
async function main(){const b=await chromium.launch({channel:'chrome',headless:true});try{
for(const [actor,url]of Object.entries(urls)){
const c=await b.newContext({viewport:{width:1440,height:900}}),p=await c.newPage(),events=[];let seq=0;
p.on('console',m=>{if(['warning','error'].includes(m.type()))events.push({type:m.type(),text:m.text()})});p.on('pageerror',e=>events.push({type:'pageerror',text:e.message}));p.on('dialog',async d=>{events.push({type:'dialog',text:d.message()});await d.dismiss()});p.on('requestfailed',r=>events.push({type:'requestfailed',url:r.url(),error:r.failure()?.errorText}));p.on('response',async r=>{const x={type:'response',url:r.url(),status:r.status(),method:r.request().method(),timing:r.request().timing()};if(r.url().startsWith('https://plumbing-qcommerce.onrender.com'))try{x.body=await r.json()}catch{}events.push(x)});
const shotDir=path.join(root,'screenshots',actor,run);fs.mkdirSync(shotDir,{recursive:true});
async function snap(label){const name=String(++seq).padStart(2,'0')+'-'+label;await p.screenshot({path:path.join(shotDir,name+'.png'),fullPage:true,mask:[p.locator('input[type=password]')]});const data={time:new Date().toISOString(),url:p.url(),text:await p.locator('body').innerText(),controls:await p.locator('input,button,a,select,textarea,[role],[tabindex]').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height}).map(e=>({tag:e.tagName,role:e.getAttribute('role'),tabindex:e.getAttribute('tabindex'),type:e.type,label:e.getAttribute('aria-label'),text:(e.innerText||'').trim().slice(0,150),placeholder:e.getAttribute('placeholder'),href:e.getAttribute('href'),disabled:e.disabled}))),cursorControls:await p.locator('div').evaluateAll(es=>es.filter(e=>getComputedStyle(e).cursor==='pointer'&&e.tabIndex>=0).map(e=>({text:e.innerText.slice(0,100),role:e.getAttribute('role'),tabindex:e.tabIndex})))};save(actor+'-'+name+'.json',data);save(actor+'-events.json',events);console.log(actor,name,JSON.stringify(data));}
async function click(text,label){await p.getByText(text,{exact:true}).last().click({timeout:10000});await p.waitForLoadState('networkidle',{timeout:15000}).catch(()=>{});await snap(label)}
try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{});await p.locator('input,button,[tabindex="0"]').first().waitFor({timeout:20000});await snap('landing');
if(actor==='customer'){await click('Next','onboarding-two');await click('Next','onboarding-three');const next=p.getByText('Get Started',{exact:true});if(await next.count())await click('Get Started','registration');else await click('Next','registration');}
if(actor==='plumber')await click('Email','email-login');
if(actor==='store')await click('Register Store','registration');
}catch(e){save(actor+'-error.json',{error:e.message});console.log(actor,e.message)}finally{save(actor+'-events.json',events);await c.close()}
}
}finally{await b.close()}console.log('EVIDENCE',out)}main().catch(e=>{console.error(e.message);process.exitCode=1});
