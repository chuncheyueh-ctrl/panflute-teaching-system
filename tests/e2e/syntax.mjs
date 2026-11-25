/* 檢查 App 裡每段 inline <script> 的語法：node tests/e2e/syntax.mjs [檔案]（預設 public/legacy-app/index.html） */
import fs from "node:fs"; import path from "node:path"; import {fileURLToPath} from "node:url";
const file=process.argv[2]||path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../public/legacy-app/index.html");
const t=fs.readFileSync(file,"utf8");let n=0,bad=0;
for(const m of t.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)){
  try{new Function(m[1].replace(/^\s*import .*$/m,""));n++}
  catch(e){bad++;console.log("ERR 第",t.slice(0,m.index).split("\n").length,"行：",e.message)}
}
console.log(bad?`❌ ${bad} 段語法錯誤`:`✅ ${n} 段 script 語法正確`);process.exit(bad?1:0);
