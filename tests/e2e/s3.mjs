import {start,device,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},200000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
const d=await device("new.html",{w:1366,h:1024});const ev=d.ev;
await ev(`hideDeviceLockWarning();document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500));`);
await ev(`const cid=scoreContext.classId;const base=studentsByClass(cid)[0];for(let i=0;i<2;i++){state.students.push({...base,id:"tst"+i,name:"測試"+i,seat:String(10+i)});state.enrollments.push({studentId:"tst"+i,classId:cid})}saveState();render()`);
await ev(`scoreAddExam("期中考");await new Promise(r=>setTimeout(r,200))`);
const ids=JSON.parse(await ev(`return JSON.stringify(studentsByClass(scoreContext.classId).map(s=>s.id))`));
const fill=async(sc)=>ev(`const sc=${JSON.stringify(sc)};document.querySelectorAll('.score-input').forEach(el=>{const v=sc[el.dataset.student]?.[el.dataset.field];if(v!==undefined){el.focus();el.value=v;scoreInput(el);el.blur()}});scoreSaveNow();render();return 1`);
// 第一次：80,70,60,90,50
const t1=[80,70,60,90,50];const s1={};ids.forEach((id,i)=>s1[id]={written:t1[i],practical:t1[i]});await fill(s1);
await ev(`scoreAddExam("期中考");await new Promise(r=>setTimeout(r,200))`);
const t2=[85,90,55,90,70];const s2={};ids.forEach((id,i)=>s2[id]={written:t2[i],practical:t2[i]});await fill(s2);
// 缺考：第 4 位（90 分）
await ev(`scoreSetMark(scoreContext.examId,${JSON.stringify(ids[3])},"absent")`);
const row=i=>ev(`return [...document.querySelectorAll(".score-table tbody tr")][${i}].innerText.replace(/\\s+/g," ")`);
console.log("absent row",await row(3));
const r=JSON.parse(await ev(`const rows=scoreExamRows(findById(state.scoreExams,scoreContext.examId));return JSON.stringify(rows.map(r=>[r.mark,r.total,r.totalRank]))`));console.log(r);
ok("缺考不排名",r[3][0]==="absent"&&r[3][1]===null&&r[3][2]===null,r);
ok("其他人名次重排",r[0][2]===2&&r[1][2]===1,r);
ok("缺考輸入停用",await ev(`return [...document.querySelectorAll('.score-input[data-student="${ids[3]}"]')].every(e=>e.disabled&&e.placeholder==="缺考")`));
ok("統計顯示缺考",(await ev(`return document.getElementById("scoreStats").innerText`)).includes("缺考 1"));
// 補考
await ev(`scoreSetMark(scoreContext.examId,${JSON.stringify(ids[2])},"makeup")`);
const r2=JSON.parse(await ev(`const rows=scoreExamRows(findById(state.scoreExams,scoreContext.examId));return JSON.stringify(rows.map(r=>[r.mark,r.total,r.totalRank]))`));
ok("補考照常計分",r2[2][0]==="makeup"&&r2[2][1]===55&&r2[2][2]===4,r2);
// 取消缺考 → 分數回來
await ev(`scoreSetMark(scoreContext.examId,${JSON.stringify(ids[3])},"")`);
ok("取消缺考分數回來",(await ev(`return scoreExamRows(findById(state.scoreExams,scoreContext.examId))[3].total`))===90);
await ev(`scoreSetMark(scoreContext.examId,${JSON.stringify(ids[3])},"absent")`);
// 進步名單
const prog=await ev(`document.getElementById("scoreProgress").open=true;return document.getElementById("scoreProgress").innerText.replace(/\\s+/g," ")`);console.log(prog);
ok("進步名單",prog.includes("3 位進步")&&prog.includes("+20")&&!prog.includes("測試0"),prog);
// 匯出 CSV
const csv=await ev(`let cap=null;const orig=URL.createObjectURL;URL.createObjectURL=b=>{cap=b;return "blob:x"};const oc=HTMLAnchorElement.prototype.click;let nm="";HTMLAnchorElement.prototype.click=function(){nm=this.download};scoreExportCsv();URL.createObjectURL=orig;HTMLAnchorElement.prototype.click=oc;return nm+"\\n"+await cap.text()`);
console.log(csv);
ok("CSV 有 BOM 與標題",csv.split("\n")[1].startsWith("﻿座號,姓名,狀態,紙筆測驗"),csv.split("\n")[1]);
ok("CSV 缺考",csv.includes("缺考,,"),csv);
await ev(`scoreChangeContext("examId","summary")`);
const csv2=await ev(`let cap=null;const orig=URL.createObjectURL;URL.createObjectURL=b=>{cap=b;return "blob:x"};const oc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};scoreExportCsv();URL.createObjectURL=orig;HTMLAnchorElement.prototype.click=oc;return await cap.text()`);
console.log(csv2);ok("總表 CSV",csv2.includes("第二次期中考 總分")&&csv2.includes("缺考,缺考,缺考"),csv2);
console.log("summary row",await row(3));ok("總表缺考與補",(await row(3)).includes("缺考")&&(await row(2)).includes("55 補"),[await row(2),await row(3)]);
// 列印
await ev(`window.print=()=>{window.__printed=document.body.classList.contains("score-printing")};scorePrint();await new Promise(r=>setTimeout(r,200))`);
ok("列印模式",await ev(`return window.__printed===true`));
await ev(`scoreChangeContext("examId",scoreExamList()[1].id)`);
await d.send("Emulation.setEmulatedMedia",{media:"print"}).catch(()=>{});
await ev(`document.body.classList.add("score-printing")`);await d.shot("score-print");
await d.send("Emulation.setEmulatedMedia",{media:""}).catch(()=>{});await ev(`document.body.classList.remove("score-printing");document.getElementById("scoreProgress").open=true`);await d.shot("score3");
// 重新載入保留
await d.go();await ev(`hideDeviceLockWarning();document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500))`);
ok("重載保留狀態",(await ev(`return JSON.stringify(state.scoreRecords.filter(r=>r.mark).map(r=>r.mark).sort())`))==='["absent","makeup"]');
const P=await device("new.html",{w:820,h:1180});await P.ev(`hideDeviceLockWarning();document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500));scoreChangeContext("examId",scoreExamList().at(-1)?.id||null);document.querySelector(".score-table")?.scrollIntoView()`);await P.shot("score3-ipad");
console.log("errs",d.errs,P.errs,"fails",fail);done(0);
