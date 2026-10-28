const { chromium } = require('playwright');
const crypto = require('crypto');
const childProcess = require('child_process');
const PHONE = '5555500001';
function key(p) { return 'local-staging:otp:' + crypto.createHash('sha256').update(p.replace(/\D/g, '')).digest('hex'); }
function otp(p) { try { return childProcess.execFileSync('C:\\Program Files\\Redis\\redis-cli.exe', ['-h','127.0.0.1','-p','6379','--raw','GET',key(p)], {encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch { return ''; } }
async function main() {
 const b=await chromium.launch({headless:true}); const c=await b.newContext({viewport:{width:390,height:844}}); const p=await c.newPage();
 await p.goto('http://localhost:8082/',{waitUntil:'domcontentloaded'}); await p.getByText('Skip',{exact:true}).waitFor({state:'visible',timeout:10000}).catch(()=>{});
 await p.getByRole('textbox').first().fill(PHONE); await p.getByRole('button',{name:/Get OTP/i}).click(); await p.getByRole('button',{name:/Verify and Proceed/i}).waitFor({state:'visible',timeout:10000}); const code=otp(PHONE); if(!code) throw Error('OTP unavailable'); await p.getByRole('textbox').first().fill(code); await p.getByRole('button',{name:/Verify and Proceed/i}).click(); await p.getByText('HOME',{exact:true}).waitFor({state:'visible',timeout:15000});
 const out=await p.evaluate(async()=>{const t=localStorage.getItem('authToken');const h={Authorization:`Bearer ${t}`};async function g(x){const r=await fetch('http://localhost:8081/api/v1'+x,{headers:h});const s=await r.text();let j;try{j=JSON.parse(s)}catch{j=null}return{status:r.status,body:j}}const me=await g('/auth/me');const orders=await g('/orders/customer/'+me.body.id);const detail=await g('/orders/2');const rating=await g('/orders/2/rating');return{me:me.body?{id:me.body.id,fullName:me.body.fullName,phone:me.body.phone}:null,addresses:(await g('/users/me/addresses')).body,orders:orders.body,detail:detail.body?{id:detail.body.id,status:detail.body.status,rating:detail.body.rating,ratingComment:detail.body.ratingComment,description:detail.body.description}:null,rating:{status:rating.status,body:rating.body}}});
 console.log(JSON.stringify(out)); await b.close();
}
main().catch(e=>{console.error(JSON.stringify({error:e.message}));process.exitCode=1});
