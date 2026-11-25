import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},170000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 開始上課的時間軸：晚上課時自動對準現在、副駕駛只講一件事、延後設定不會沿用到別堂課 */
const d=await device("new.html",{w:1180,h:820});const ev=d.ev;
const now=new Date(), nowMin=now.getHours()*60+now.getMinutes();
if(nowMin<200){console.log("SKIP 現在太接近午夜，無法模擬「晚 3 小時上課」，請稍後再跑");done(0);}
const hhmm=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const late=hhmm(nowMin-180);
// 共用：設定今天這堂課的流程，然後（重新）進入開始上課
await ev(`hideDeviceLockWarning?.();const base=state.students[0];const cls=state.classes.find(c=>state.enrollments.some(e=>e.classId===c.id&&e.studentId===base.id));classContext.classId=cls.id;
window.__prep=async(startTime,mutate)=>{try{exitStartClassMode()}catch(e){}const f=st106Lesson();f.startTime=startTime;delete f.startAligned;delete f.plannedStartTime;
 f.tasks=[{title:"暖身",minutes:10},{title:"本週主線",minutes:10},{title:"個別檢查",minutes:10},{title:"收尾回饋",minutes:10}].map(t=>({...t,done:false,status:"pending"}));
 if(mutate)mutate(f);saveState();document.querySelectorAll(".bt-toast").forEach(t=>t.remove());enterStartClassMode();await new Promise(r=>setTimeout(r,900));hideDeviceLockWarning?.();};
window.__look=()=>({start:st106Lesson().startTime,planned:st106Lesson().plannedStartTime,aligned:st106Lesson().startAligned,
 toast:[...document.querySelectorAll(".bt-toast")].map(x=>x.innerText).join("|"),
 overdue:document.querySelectorAll(".st106-flow .st106-badge[class*=overdue]").length,
 sugVisible:[...document.querySelectorAll(".st106-flow .st106-suggestion")].filter(e=>e.offsetParent).length,
 copilot:document.querySelector(".st1064-copilot")?.innerText.trim()||"",copilotLines:document.querySelectorAll(".st1064-copilot-item,.st107-copilot-strong").length,
 action:document.querySelector(".st108-copilot-action")?.innerText.trim()||"",
 statuses:st106Tasks().map(t=>ST1062_TaskEngine.status(t)).join(",")});return 1`);
const look=async()=>JSON.parse(await ev(`return JSON.stringify(__look())`));

// 1. 晚 3 小時才上課：自動改成從現在開始
await ev(`await __prep(${JSON.stringify(late)});return 1`);
const r1=await look();console.log(r1);
ok("晚上課：自動從現在開始計時",r1.start===hhmm(nowMin)||r1.start===hhmm(nowMin+1),r1);
ok("記住原定時間",r1.planned===late&&r1.aligned===true,r1);
ok("提示可改回原定",r1.toast.includes(`原定 ${late}`)&&r1.toast.includes("改回原定"),r1.toast);
ok("對準後沒有超時任務",r1.overdue===0,r1);
ok("副駕駛只有一句、沒有按鈕",r1.copilotLines===0&&r1.copilot.replace("🧭","").trim().split("\n").length===1&&!r1.action,r1);
await d.shot("tl-aligned");

// 2. 退出再進來：不會再改一次、也不再提示
const r2=JSON.parse(await ev(`exitStartClassMode();const f=st106Lesson();f.startTime=${JSON.stringify(late)};saveState();document.querySelectorAll(".bt-toast").forEach(t=>t.remove());
enterStartClassMode();await new Promise(r=>setTimeout(r,700));return JSON.stringify(__look())`));
ok("同一堂課只判斷一次",r2.start===late&&!r2.toast.includes("開始計時"),r2);

// 3. 按「改回原定」
await ev(`await __prep(${JSON.stringify(late)});[...document.querySelectorAll(".bt-toast-action")].pop().click();await new Promise(r=>setTimeout(r,400));return 1`);
const r3=await look();console.log(r3);
ok("改回原定時間",r3.start===late&&r3.toast.includes(`已改回 ${late} 開始`),r3);
ok("落後時仍顯示超時標籤",r3.overdue===4,r3);
ok("任務卡不再有長句建議",r3.sugVisible===0,r3);
ok("副駕駛只講一件事並附按鈕",r3.copilotLines===0&&/嚴重落後|剩約/.test(r3.copilot)&&r3.action.includes("其餘 3 個任務保留至下次"),r3);
await d.shot("tl-behind");

// 4. 一鍵保留至下次，再復原
const r4=JSON.parse(await ev(`document.querySelectorAll(".bt-toast").forEach(t=>t.remove());document.querySelector(".st108-copilot-action").click();await new Promise(r=>setTimeout(r,400));
const a=__look();[...document.querySelectorAll(".bt-toast-action")].pop().click();await new Promise(r=>setTimeout(r,400));return JSON.stringify({a,b:__look()})`));
console.log(r4);
ok("其餘任務保留至下次，正在上的不動",r4.a.statuses==="pending,carry,carry,carry"&&r4.a.toast.includes("已將 3 個任務保留至下次"),r4.a);
ok("復原保留",r4.b.statuses==="pending,pending,pending,pending",r4.b);

// 5. 不該自動對準的情況
await ev(`await __prep(${JSON.stringify(late)},f=>{f.tasks[0].done=true;f.tasks[0].status="done"});return 1`);
const r5=await look();ok("已勾過任務就不動",r5.start===late&&!r5.toast.includes("開始計時"),r5);
await ev(`await __prep(${JSON.stringify(hhmm(nowMin-5))});return 1`);
const r6=await look();ok("只晚 5 分鐘不動",r6.start===hhmm(nowMin-5)&&!r6.toast.includes("開始計時"),r6);

// 6. 重新整理後保留對準結果
await ev(`await __prep(${JSON.stringify(late)});await new Promise(r=>setTimeout(r,600));return 1`);
const s1=(await look()).start;
await d.go();
const s2=await ev(`hideDeviceLockWarning?.();classContext.classId=state.classes.find(c=>state.enrollments.some(e=>e.classId===c.id&&e.studentId===state.students[0].id)).id;
document.querySelectorAll(".bt-toast").forEach(t=>t.remove());enterStartClassMode();await new Promise(r=>setTimeout(r,800));
return JSON.stringify({start:st106Lesson().startTime,toast:[...document.querySelectorAll(".bt-toast")].map(x=>x.innerText).join("|")})`);
const p=JSON.parse(s2);ok("重新整理後保留、不重複提示",p.start===s1&&!p.toast.includes("開始計時"),{s1,p});
console.log("errs",d.errs,"fails",fail);done(fail?1:0);
