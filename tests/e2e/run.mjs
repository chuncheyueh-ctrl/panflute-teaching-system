/* 批次執行瀏覽器測試：npm run test:e2e [-- 測試名稱...]（或 node tests/e2e/run.mjs [測試名稱...]）
   - 整批共用一個 headless Chrome；每個測試是獨立的 Node 程序、使用自己的 Browser Context 與假雲端伺服器。
   - 並行數依 CPU 核心數、記憶體與目前負載決定（TEST_JOBS 可覆寫）。
   - 整批結束、或收到 Ctrl-C / SIGTERM、或執行器本身出錯時：結束所有子測試、關閉 Chrome、刪除暫存資料夾。 */
import {spawn} from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import {S, TEST_DIR, launchChrome} from "./lib.mjs";

const DEFAULT=["n1","n2","n3","n4","n5","b1","b2","s3","d2","c1","p1","tt","sp","sc3","sa","tl","rd","dc","fg","sy","sb","ts"];
const tests=process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
const cpus=os.cpus().length, memGB=os.totalmem()/2**30, load=os.loadavg()[0];
const auto=Math.max(1, Math.min(Math.floor(cpus/2), Math.floor(memGB/4), cpus-Math.round(load)));
const jobs=Math.max(1, Number(process.env.TEST_JOBS)||auto);
const logDir=path.join(S,"logs"); fs.mkdirSync(logDir,{recursive:true});

const children=new Set(); let chrome=null, stopping=false;
async function stop(code){
  if(stopping)return; stopping=true;
  for(const c of children){try{c.kill("SIGTERM")}catch(e){}}
  const t=Date.now(); while(children.size && Date.now()-t<3000) await new Promise(r=>setTimeout(r,100));
  for(const c of children){try{c.kill("SIGKILL")}catch(e){}}
  if(chrome) await chrome.close();
  process.exit(code);
}
process.on("exit",()=>{for(const c of children){try{c.kill("SIGKILL")}catch(e){}} chrome?.closeSync()});
for(const sig of ["SIGINT","SIGTERM","SIGHUP"]) process.on(sig,()=>{console.log(`\n[run] 收到 ${sig}，停止並清理`);stop(130)});
process.on("uncaughtException",e=>{console.error("[run] 錯誤：",e);stop(1)});
process.on("unhandledRejection",e=>{console.error("[run] 錯誤：",e);stop(1)});

function runOne(name){
  return new Promise(resolve=>{
    const t0=Date.now(), log=path.join(logDir,name+".log");
    const c=spawn(process.execPath,[path.join(TEST_DIR,name+".mjs")],{cwd:TEST_DIR,env:{...process.env,TEST_CDP_PORT:String(chrome.port)},stdio:["pipe","pipe","pipe"]});
    children.add(c); let out="";
    c.stdout.on("data",d=>out+=d); c.stderr.on("data",d=>out+=d);
    c.on("exit",code=>{
      children.delete(c); fs.writeFileSync(log,out);
      const bad=out.split("\n").filter(l=>/^FAIL |HARD TIMEOUT|^TIMEOUT|未處理的/.test(l));
      resolve({name,code,secs:Math.round((Date.now()-t0)/1000),bad,log});
    });
  });
}

const t0=Date.now();
chrome=await launchChrome();
console.log(`[run] ${tests.length} 個測試，並行 ${Math.min(jobs,tests.length)}（${cpus} 核心、${Math.round(memGB)}GB、負載 ${load.toFixed(1)}），共用一個 Chrome`);
const queue=[...tests], results=[];
await Promise.all(Array.from({length:Math.min(jobs,queue.length)},async()=>{
  while(queue.length && !stopping){
    const r=await runOne(queue.shift()); results.push(r);
    const ok=r.code===0 && !r.bad.length;
    console.log(`${ok?"✅":"❌"} ${r.name.padEnd(4)} ${String(r.secs).padStart(3)}s${ok?"":"  exit="+r.code+"  "+r.bad.slice(0,3).join(" | ")+"  → "+r.log}`);
  }
}));
const failed=results.filter(r=>r.code!==0||r.bad.length);
console.log(`[run] 完成 ${results.length}/${tests.length}，失敗 ${failed.length}，總時間 ${Math.round((Date.now()-t0)/1000)}s`);
await stop(failed.length?1:0);
