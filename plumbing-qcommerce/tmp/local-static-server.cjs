const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2]);
const port = Number(process.argv[3]);
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  const rel = decodeURIComponent((req.url || '/').split('?')[0]);
  const candidate = path.join(root, rel === '/' ? 'index.html' : rel.replace(/^\//,''));
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(root,'index.html');
  fs.readFile(file,(err,data)=>{ if(err){res.statusCode=500; return res.end(String(err));} res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream'); res.end(data); });
}).listen(port,'127.0.0.1',()=>console.log(`static ${root} ${port}`));
