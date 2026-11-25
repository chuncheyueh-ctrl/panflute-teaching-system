import fs from "node:fs"; import http from "node:http"; import path from "node:path"; import os from "node:os"; import {fileURLToPath} from "node:url";
/* 瀏覽器端對端測試的共用工具。用法見 tests/e2e/README.md */
export const TEST_DIR=path.dirname(fileURLToPath(import.meta.url));
const REPO=path.resolve(TEST_DIR,"../..");
/* 工作資料夾（截圖、log、暫存瀏覽器資料）：預設在系統暫存區，不進 repo */
export const S=process.env.E2E_WORK||path.join(os.tmpdir(),"panflute-e2e");
fs.mkdirSync(S,{recursive:true});
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* 測試用頁面：new.html＝目前的 App；old.html＝改用 IndexedDB 之前的舊版（從 git 取出，測升級用） */
const OLD_APP_COMMIT="0b1a889";
function page(name){
  if(name==="new.html")return fs.readFileSync(path.join(REPO,"public/legacy-app/index.html"));
  if(name==="old.html"){
    const f=path.join(S,`old-${OLD_APP_COMMIT}.html`);
    if(!fs.existsSync(f)){fs.writeFileSync(f,execFileSync("git",["show",`${OLD_APP_COMMIT}:public/legacy-app/index.html`],{cwd:REPO,maxBuffer:64<<20}))}
    return fs.readFileSync(f);
  }
  if(name==="seed.html")return "<html></html>";
  if(name==="blank.html")return "<!doctype html><title>t</title>";
  return null;
}
// 假雲端：行為仿 RTDB（null/空物件/空陣列會消失、undefined 會丟錯）
export const db={tree:{},writes:[],deny:null,offline:false};
const norm=v=>{if(v===null||v===undefined)return undefined;if(Array.isArray(v)||typeof v==="object"){const o={};for(const [k,x] of Object.entries(v)){const n=norm(x);if(n!==undefined)o[k]=n}const ks=Object.keys(o);if(!ks.length)return undefined;if(ks.every(k=>/^\d+$/.test(k))){const max=Math.max(...ks.map(Number));if(max<ks.length*2){const a=[];for(let i=0;i<=max;i++)a[i]=o[i]===undefined?null:o[i];return a}}return o}return v};
export const get=p=>p.split("/").filter(Boolean).reduce((o,k)=>o==null?undefined:o[k],db.tree);
export const set=(p,v)=>{const ks=p.split("/").filter(Boolean);if(ks.some(k=>/[.#$\[\]]/.test(k)))throw new Error("bad key "+p);let o=db.tree;for(const k of ks.slice(0,-1)){if(o[k]==null||typeof o[k]!=="object")o[k]={};o=o[k]}const n=norm(v);if(n===undefined)delete o[ks.at(-1)];else o[ks.at(-1)]=n};
const subs=new Set(); export const notify=p=>subs.forEach(f=>f(p));
/* ===== 測試瀏覽器生命週期 =====
   - 批次執行（run.mjs）：整批共用一個 Chrome，透過 TEST_CDP_PORT 傳給各測試；
     各測試只建立／關閉自己的 Browser Context（儲存空間互相隔離），不碰 Chrome 本體。
   - 單獨執行：自己開一個 Chrome，結束時關閉整個 process group 並刪除暫存資料夾。
   - 連接埠全部自動分配，可放心並行。
   - 正常結束、失敗、例外、逾時、SIGINT/SIGTERM 都走 finish()；Node 被 kill -9 時由 watchdog 收尾。
   - 只會關閉命令列含有本次專屬資料夾（.test-runs/run-xxxx/）的程序，不碰使用者的 Chrome。 */
import {spawn, execFileSync} from "node:child_process";
export const RUNS_DIR=path.join(S,".test-runs");
const CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HARD_TIMEOUT_MS=Number(process.env.TEST_HARD_TIMEOUT_MS||240000);
const alive=pid=>{try{process.kill(pid,0);return true}catch(e){return e.code==="EPERM"}};

/* 啟動一個專屬 Chrome（批次執行器與單獨執行共用） */
export async function launchChrome(){
  fs.mkdirSync(RUNS_DIR,{recursive:true});
  reapStale();
  const dir=fs.mkdtempSync(path.join(RUNS_DIR,"run-")), prof=path.join(dir,"profile");
  const ch=spawn(CHROME,["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
    "--user-data-dir="+prof,"--crash-dumps-dir="+path.join(dir,"crash"),"--remote-debugging-port=0",
    "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1","about:blank"],{stdio:"ignore",detached:true});
  fs.writeFileSync(path.join(dir,"run.json"),JSON.stringify({nodePid:process.pid,pgid:ch.pid}));
  /* Node 被 kill -9 時，由 watchdog 關掉這組 Chrome */
  spawn("/bin/sh",["-c",`while kill -0 ${process.pid} 2>/dev/null; do sleep 1; done; kill -9 -${ch.pid} 2>/dev/null; rm -rf "${dir}"`],{stdio:"ignore",detached:true}).unref();
  let port=0;
  for(let i=0;i<80&&!port;i++){await sleep(100);try{port=Number(fs.readFileSync(path.join(prof,"DevToolsActivePort"),"utf8").split("\n")[0])}catch{}}
  if(!port){killGroup(ch.pid);fs.rmSync(dir,{recursive:true,force:true});throw new Error("Chrome 沒有啟動")}
  let closed=false;
  return {port,dir,pgid:ch.pid,close:async()=>{
    if(closed)return;closed=true;
    try{const v=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json();const r=await conn(v.webSocketDebuggerUrl);await Promise.race([r.send("Browser.close"),sleep(1000)]);r.close()}catch(e){}
    killGroup(ch.pid);fs.rmSync(dir,{recursive:true,force:true});
  },closeSync:()=>{if(closed)return;closed=true;killGroup(ch.pid);try{fs.rmSync(dir,{recursive:true,force:true})}catch(e){}}};
}
function killGroup(pgid){try{process.kill(-pgid,"SIGKILL")}catch(e){}}
/* 回收主人已不在的執行（只有發現過期資料夾時才掃一次程序表，並確認命令列含該資料夾才關） */
function reapStale(){
  const stale=[];
  for(const name of fs.readdirSync(RUNS_DIR)){
    const dir=path.join(RUNS_DIR,name);let m={};try{m=JSON.parse(fs.readFileSync(path.join(dir,"run.json"),"utf8"))}catch(e){}
    if(m.nodePid&&alive(m.nodePid))continue;
    stale.push({dir,pgid:m.pgid});
  }
  if(!stale.length)return;
  let ps="";try{ps=execFileSync("ps",["-axo","pid=,pgid=,command="],{encoding:"utf8",maxBuffer:32<<20})}catch(e){}
  for(const {dir,pgid} of stale){
    for(const l of ps.split("\n")){const m=l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);if(m&&m[3].includes(dir+path.sep)){try{process.kill(+m[1],"SIGKILL")}catch(e){}}}
    if(pgid&&ps.split("\n").some(l=>{const m=l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);return m&&+m[2]===pgid&&m[3].includes(dir+path.sep)}))killGroup(pgid);
    fs.rmSync(dir,{recursive:true,force:true});
    console.log(`[test] 回收殘留執行 ${path.basename(dir)}`);
  }
}

let srv=null, own=null, PORT=0, finishing=false;
const devices=new Set();
async function finish(code){
  if(finishing)return;finishing=true;
  await Promise.race([Promise.all([...devices].map(d=>d.close().catch(()=>{}))),sleep(2000)]);
  try{root?.close()}catch(e){}
  if(own)await own.close();
  try{srv?.closeAllConnections?.();srv?.close()}catch(e){}
  process.exit(code);
}
export async function start(){
 process.on("exit",()=>{own?.closeSync()});
 for(const sig of ["SIGINT","SIGTERM","SIGHUP"])process.on(sig,()=>finish(130));
 process.on("uncaughtException",e=>{console.error("[test] 未處理的例外：",e);finish(1)});
 process.on("unhandledRejection",e=>{console.error("[test] 未處理的 Promise 錯誤：",e);finish(1)});
 setTimeout(()=>{console.log(`[test] HARD TIMEOUT ${HARD_TIMEOUT_MS/1000}s`);finish(1)},HARD_TIMEOUT_MS).unref();
 srv=http.createServer((q,r)=>{const u=new URL(q.url,"http://x");let b="";q.on("data",d=>b+=d);q.on("end",()=>{
  if(u.pathname==="/db"){const p=u.searchParams.get("p");r.setHeader("content-type","application/json");
   if(db.offline){r.statusCode=503;return r.end("{}")}
   if(db.deny&&db.deny.test(p)){r.statusCode=403;return r.end("{}")}
   try{if(q.method==="GET")return r.end(JSON.stringify({v:get(p)??null}));const body=JSON.parse(b);
    if(body.op==="set"){set(p,body.v);db.writes.push(p)}
    if(body.op==="update"){for(const [k,v] of Object.entries(body.v)){set((p+"/"+k),v);db.writes.push(p+"/"+k)}}
    if(body.op==="tx"){const cur=get(p)??null;if(JSON.stringify(cur)!==JSON.stringify(body.expect))return r.end(JSON.stringify({conflict:true,v:cur}));set(p,body.v);db.writes.push(p)}
    notify(p);return r.end(JSON.stringify({ok:1}))}catch(e){r.statusCode=500;return r.end(JSON.stringify({e:e.message}))}}
  if(u.pathname==="/ev"){r.writeHead(200,{"content-type":"text/event-stream"});const f=p=>r.write("data: "+p+"\n\n");subs.add(f);r.on("close",()=>subs.delete(f));return}
  const body=page(u.pathname.slice(1));if(body==null){r.statusCode=404;return r.end()}r.setHeader("content-type","text/html; charset=utf-8");r.end(body)})});
 await new Promise((res,rej)=>{srv.once("error",rej);srv.listen(0,"127.0.0.1",res)});
 PORT=srv.address().port;
 DEVTOOLS=Number(process.env.TEST_CDP_PORT)||0;
 if(!DEVTOOLS){own=await launchChrome();DEVTOOLS=own.port}
 /* 批次模式：執行器一消失（含 kill -9），stdin 管線就會關閉，跟著清理結束 */
 else{process.stdin.on("end",()=>finish(1));process.stdin.on("error",()=>finish(1));process.stdin.resume();}
 const v=await(await fetch(`http://127.0.0.1:${DEVTOOLS}/json/version`)).json();
 root=await conn(v.webSocketDebuggerUrl);
 return c=>finish(c);
}
let root,DEVTOOLS=0;
async function conn(u){const ws=new WebSocket(u);await new Promise(r=>ws.onopen=r);let id=0;const P={};const L=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(P[m.id])P[m.id](m);L.forEach(f=>f(m))};return{on:f=>L.push(f),close:()=>ws.close(),send:(method,params={})=>new Promise(r=>{P[++id]=r;ws.send(JSON.stringify({id,method,params}))})}}
const STUB=`(()=>{const call=async(p,b)=>{if(!navigator.onLine)throw new Error("offline");const r=await fetch("/db?p="+encodeURIComponent(p),b?{method:"POST",body:JSON.stringify(b)}:{});if(r.status===403)throw Object.assign(new Error("PERMISSION_DENIED: Permission denied"),{code:"PERMISSION_DENIED"});if(!r.ok)throw new Error("network");return r.json()};
const chk=v=>{const w=(x,p)=>{if(x===undefined)throw new Error("set failed: undefined at "+p);if(x&&typeof x==="object")for(const k in x){if(/[.#$\\[\\]\\/]/.test(k))throw new Error("bad key "+p+"/"+k);w(x[k],p+"/"+k)}};w(v,"");return v};
const snap=v=>({exists:()=>v!==null&&v!==undefined,val:()=>v===undefined?null:v,key:null});
const L=[];let es;const listen=()=>{if(es)return;es=new EventSource("/ev");es.onmessage=e=>L.forEach(l=>{if(e.data.startsWith(l.p)||l.p.startsWith(e.data))l.f()})};
const ref=p=>({key:p.split("/").pop(),child:c=>ref(p+"/"+c),set:async v=>{chk(v);await call(p,{op:"set",v})},update:async v=>{for(const k in v)chk(v[k]);await call(p,{op:"update",v})},remove:async()=>call(p,{op:"set",v:null}),once:async()=>snap((await call(p)).v),get:async()=>snap((await call(p)).v),
 on(ev,cb,err){const f=async()=>{try{cb(snap((await call(p)).v))}catch(e){err&&err(e)}};listen();L.push({p,f,cb});f();return cb},off(ev,cb){for(let i=L.length-1;i>=0;i--)if(L[i].p===p&&(!cb||L[i].cb===cb))L.splice(i,1)},
 transaction:async fn=>{let cur=null;for(let i=0;i<20;i++){const nv=fn(cur===null?null:JSON.parse(JSON.stringify(cur)));if(nv===undefined&&i>0)return{committed:false,snapshot:snap(cur)};const got=(await call(p)).v;if(JSON.stringify(got)!==JSON.stringify(cur)){cur=got;continue}if(nv===undefined)return{committed:false,snapshot:snap(cur)};chk(nv);const r=await call(p,{op:"tx",v:nv,expect:cur});if(r.conflict){cur=r.v;continue}return{committed:true,snapshot:snap(nv)}}throw new Error("maxretry")}});
window.firebase={initializeApp(){},database:Object.assign(()=>({ref,goOnline(){},goOffline(){}}),{ServerValue:{TIMESTAMP:Date.now()}}),auth:()=>({signInAnonymously:async()=>({}),onAuthStateChanged(f){setTimeout(()=>f({uid:"u"}),50)},currentUser:{uid:"u"}})};
window.__alerts=[];window.__confirms=[];window.alert=m=>{__alerts.push(String(m))};window.confirm=m=>{__confirms.push(String(m));return window.__confirmAnswer!==false};})();`;
export async function device(file,{seed="",inject="",w=1366,h=1024}={}){
 const ctx=(await root.send("Target.createBrowserContext")).result.browserContextId;
 const tid=(await root.send("Target.createTarget",{url:"about:blank",browserContextId:ctx})).result.targetId;
 const c=await conn(`ws://127.0.0.1:${DEVTOOLS}/devtools/page/`+tid);const errs=[];
 c.on(m=>{if(m.method==="Runtime.exceptionThrown"){const d=(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text||"").slice(0,200);if(!d.includes("renderSyncStatus is not defined"))errs.push(d)}if(m.method==="Page.javascriptDialogOpening")c.send("Page.handleJavaScriptDialog",{accept:true})});
 const ev=async x=>{const r=await c.send("Runtime.evaluate",{expression:`(async()=>{${x}})()`,awaitPromise:true,returnByValue:true});if(r.result?.exceptionDetails)return "EX "+r.result.exceptionDetails.exception?.description;return r.result?.result.value};
 await c.send("Page.enable");await c.send("Runtime.enable");await c.send("Network.enable");await c.send("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:false});
 let sid;const go=async(f=file,inj=inject)=>{if(sid)await c.send("Page.removeScriptToEvaluateOnNewDocument",{identifier:sid});sid=(await c.send("Page.addScriptToEvaluateOnNewDocument",{source:STUB+inj})).result.identifier;await c.send("Page.navigate",{url:`http://localhost:${PORT}/`+f});await sleep(4500)};
 if(seed){await c.send("Page.navigate",{url:`http://localhost:${PORT}/seed.html`});await sleep(400);await ev(seed)}
 await go();
 let closed=false;
 const dev={ev,go,errs,send:c.send,offline:async b=>c.send("Network.emulateNetworkConditions",{offline:b,latency:0,downloadThroughput:-1,uploadThroughput:-1}),shot:async n=>{const r=await c.send("Page.captureScreenshot",{format:"png"});fs.writeFileSync(path.join(S,n+".png"),Buffer.from(r.result.data,"base64"))},
  close:async()=>{if(closed)return;closed=true;devices.delete(dev);try{c.close()}catch(e){}try{await root.send("Target.disposeBrowserContext",{browserContextId:ctx})}catch(e){}}};
 devices.add(dev);
 return dev;
}

