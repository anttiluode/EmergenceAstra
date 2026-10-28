import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.md':'text/plain','.png':'image/png'};
const port=Number(process.env.PORT ?? 4173);
http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`);
    const relative=path.relative(root,file);
    if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(part=>part.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':`${types[path.extname(file)]??'application/octet-stream'}; charset=utf-8`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end('File not found or invalid request');}
}).listen(port,'127.0.0.1',()=>console.log(`Emergence Astra: http://localhost:${port}`));
