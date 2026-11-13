const { chromium } = require('C:/Users/akhil/node_modules/playwright');
const fs = require('fs');
const path = require('path');
(async()=>{
 const out=path.resolve(__dirname,'../reports/local-1250-20260928-retest/browser-evidence'); fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const targets=[['customer','http://localhost:8092'],['plumber','http://localhost:8093'],['store','http://localhost:8094'],['admin','http://localhost:3100']]; const results=[];
 for(const [name,url] of targets){const p=await browser.newPage({viewport:{width:1440,height:900}});const consoleMessages=[],failed=[];p.on('console',m=>{if(['error','warning'].includes(m.type()))consoleMessages.push({type:m.type(),text:m.text()})});p.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText||'unknown'}));let error=null;try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await p.waitForTimeout(5000);await p.screenshot({path:path.join(out,`${name}-landing.png`),fullPage:true})}catch(e){error=String(e)}results.push({name,url,finalUrl:p.url(),title:await p.title().catch(()=>''),text:(await p.locator('body').innerText().catch(()=>'' )).slice(0,4000),buttons:await p.locator('button').allTextContents().catch(()=>[]),inputs:await p.locator('input').count().catch(()=>-1),consoleMessages,failed,error});await p.close()}
 await browser.close();fs.writeFileSync(path.join(out,'browser-retest.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
})();
