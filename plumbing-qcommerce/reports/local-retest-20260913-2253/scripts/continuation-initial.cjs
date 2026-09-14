module.exports=async c=>{
 c.api=async(method,url,role,body)=>{const start=Date.now();try{const r=await fetch('http://localhost:8081'+url,{method,headers:{'content-type':'application/json',...(role&&c.tokens[role]?{Authorization:'Bearer '+c.tokens[role]}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}return {status:r.status,ms:Date.now()-start,data};}catch(e){return {status:0,ms:Date.now()-start,error:e.message}}};
 const health=[];for(const url of ['/health/live','/health/ready','/version','/actuator/health','/actuator/info']){const r=await c.api('GET',url);health.push({url,...r});}c.save('logs/backend-health-continuation.json',health);
 let log=c.docker(['logs','fixkart_retest_backend_20260914']);log=log.split('\n').filter(x=>!/password|authorization|refreshToken|secret/i.test(x)).join('\n');c.save('logs/backend-isolated-qa.log',log);
 const {chromium}=require('playwright');c.browser=await chromium.launch({channel:'chrome',headless:true});c.network={};c.console={};
 for(const [app,port]of Object.entries({customer:8082,plumber:8083,store:8084,admin:3001})){
 const context=await c.browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();c.contexts[app]=context;c.pages[app]=page;c.network[app]=[];c.console[app]=[];
 page.on('response',r=>{const u=new URL(r.url());if(u.pathname.includes('/api/')||r.status()>=400)c.network[app].push({method:r.request().method(),url:u.origin+u.pathname,status:r.status(),time:new Date().toISOString()});});
 page.on('requestfailed',r=>{const u=new URL(r.url());c.network[app].push({method:r.method(),url:u.origin+u.pathname,failure:r.failure()?.errorText});});
 page.on('console',m=>{if(['error','warning'].includes(m.type()))c.console[app].push({type:m.type(),text:c.clean(m.text())});});page.on('pageerror',e=>c.console[app].push({type:'pageerror',text:c.clean(e.message)}));
 try{await page.goto('http://localhost:'+port,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(3500);c.save('logs/'+app+'-smoke-continuation.json',{url:page.url(),title:await page.title(),text:await page.locator('body').innerText(),snapshot:await page.locator('body').ariaSnapshot()});await page.screenshot({path:c.report+'/screenshots/'+app+'-smoke-continuation.png',fullPage:true});c.record('LOCAL-SMOKE-'+app,app,'Chrome loads current local app','PASS',page.url());}catch(e){c.record('LOCAL-SMOKE-'+app,app,'Chrome loads current local app','FAIL',e.message);}
 }
 c.flush=()=>{for(const app of Object.keys(c.pages)){c.save('network/'+app+'-network.json',c.network[app]);c.save('network/'+app+'-console.json',c.console[app]);}};c.flush();
};
