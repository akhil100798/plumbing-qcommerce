const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),http=require('http');
const root=process.cwd(),report=path.resolve(__dirname,'..');
const password=crypto.randomBytes(32).toString('base64');
const ctx={root,report,password,tokens:{},users:{},pages:{},contexts:{},results:[]};
ctx.clean=x=>String(x).replaceAll(password,'[REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED JWT]');
ctx.save=(file,data)=>{const p=path.join(report,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,ctx.clean(typeof data==='string'?data:JSON.stringify(data,null,2)));};
ctx.docker=(args)=>cp.execFileSync('docker',args,{encoding:'utf8',maxBuffer:20*1024*1024});
ctx.record=(id,app,feature,status,detail,evidence='logs/runtime-assertions-continuation.json')=>{ctx.results.push({id,app,feature,status,detail,evidence,time:new Date().toISOString()});ctx.save('logs/runtime-assertions-continuation.json',ctx.results);};
async function boot(){
 const args=['compose','run','--detach','--no-deps','--name','fixkart_retest_backend_20260914','-p','8081:8081'];
 const config={SPRING_DATASOURCE_URL:'jdbc:postgresql://pqc_postgres:5432/fixkart_retest_20260914',DATABASE_URL:'jdbc:postgresql://pqc_postgres:5432/fixkart_retest_20260914',PORT:'8081',SPRING_PROFILES_ACTIVE:'local-staging,staging',APP_SEED_MOBILE_QA_ENABLED:'true',APP_SEED_STAGING_ADMIN_ENABLED:'true',APP_SEED_CATALOG_ENABLED:'true',SMS_PROVIDER:'local-capture',SMS_LOCAL_CAPTURE_ENABLED:'true',OTP_DEMO_BYPASS_ENABLED:'false',RENDER_GIT_BRANCH:'Development-2',GIT_COMMIT:'096fe3c86e71c56302dc63a2004d87b5debb11cc'};
 for(const [k,v]of Object.entries(config))args.push('-e',`${k}=${v}`);
 args.push('-e','APP_SEED_DEMO_PASSWORD','backend');
 const id=cp.execFileSync('docker',args,{env:{...process.env,APP_SEED_DEMO_PASSWORD:password},encoding:'utf8'}).trim();
 ctx.save('logs/backend-launch-continuation.json',{container:id,configuration:config,temporaryPassword:'generated in memory; value never written by harness',sourceSHA:config.GIT_COMMIT});
 http.createServer(async(req,res)=>{if(req.method!=='POST'){res.writeHead(405).end();return;}let data='';for await(const c of req)data+=c;try{const name=JSON.parse(data).module;if(!/^continuation-[a-z0-9-]+\.cjs$/.test(name))throw Error('Invalid module');const file=path.join(__dirname,name);delete require.cache[require.resolve(file)];await require(file)(ctx);res.end(JSON.stringify({ok:true,assertions:ctx.results.length}));}catch(e){const error=ctx.clean(e.stack);ctx.save('logs/controller-last-error.log',error);res.writeHead(500).end(JSON.stringify({ok:false,error}));}}).listen(19331,'127.0.0.1',()=>console.log('QA controller ready; password retained only in process memory.'));
}
boot().catch(e=>{console.error(ctx.clean(e.message));process.exitCode=1;});
