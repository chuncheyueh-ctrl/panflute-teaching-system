import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},170000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 開始上課的時間軸：晚上課時自動對準現在、副駕駛只講一件事、延後設定不會沿用到別堂課 */
const d=await device("new.html",{w:1180,h:820});const ev=d.ev;
/* 把測試瀏覽器的時區調成「現在是中午左右」，任何時間跑都能模擬「晚 3 小時」與「還沒到上課時間」 */
let off=12-new Date().getUTCHours(); if(off>14)off-=24; if(off<-12)off+=24;
await d.send("Emulation.setTimezoneOverride",{timezoneId:off>=0?`Etc/GMT-${off}`:`Etc/GMT+${-off}`});await d.go();
const pn=JSON.parse(await ev(`const n=new Date();return JSON.stringify({m:n.getHours()*60+n.getMinutes(),dow:n.getDay()})`));
const nowMin=pn.m;console.log("page time",pn);
const hhmm=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const late=hhmm(nowMin-180);
// 共用：設定今天這堂課的流程，然後（重新）進入開始上課
await ev(`hideDeviceLockWarning?.();const base=state.students[0];const cls=state.classes.find(c=>state.enrollments.some(e=>e.classId===c.id&&e.studentId===base.id));classContext.classId=cls.id;
window.__prep=async(startTime,mutate,sched)=>{try{exitStartClassMode()}catch(e){}state.classSchedule=(state.classSchedule||[]).filter(e=>e.classId!==classContext.classId).concat((sched||[]).map((e,i)=>({id:'t'+i,schoolId:classContext.schoolId,classId:classContext.classId,active:true,...e})));const f=st106Lesson();f.startTime=startTime;delete f.startAligned;delete f.plannedStartTime;delete f.manualStart;
 f.tasks=[{title:"暖身",minutes:10},{title:"本週主線",minutes:10},{title:"個別檢查",minutes:10},{title:"收尾回饋",minutes:10}].map(t=>({...t,done:false,status:"pending"}));
 if(mutate)mutate(f);saveState();document.querySelectorAll(".bt-toast").forEach(t=>t.remove());enterStartClassMode();await new Promise(r=>setTimeout(r,900));hideDeviceLockWarning?.();};
window.__look=()=>({start:st106Lesson().startTime,planned:st106Lesson().plannedStartTime,aligned:st106Lesson().startAligned,
 toast:[...document.querySelectorAll(".bt-toast")].map(x=>x.innerText).join("|"),
 overdue:document.querySelectorAll(".st106-flow .st106-badge[class*=overdue]").length,
 sugVisible:[...document.querySelectorAll(".st106-flow .st106-suggestion")].filter(e=>e.offsetParent).length,
 copilot:document.querySelector(".st1064-copilot")?.innerText.trim()||"",copilotLines:document.querySelectorAll(".st1064-copilot-item,.st107-copilot-strong").length,
 action:document.querySelector(".st108-copilot-action")?.innerText.trim()||"",
 statuses:st106Tasks().map(t=>ST1062_TaskEngine.status(t)).join(","),
 phase:document.querySelector(".v1529-phase")?.innerText.replace(/\\s+/g," ").trim()||"",paused:!!document.querySelector(".v1529-paused-flow"),manual:!!st106Lesson().manualStart});return 1`);
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

// 6. 版面：任務清單在最上面，屬性與工具改成一排小按鈕；局部重畫後順序不變
const lay=async()=>JSON.parse(await ev(`const p=document.querySelector(".v1529-left .v1529-panel");const y=sel=>{const e=p.querySelector(":scope > "+sel);return e?Math.round(e.getBoundingClientRect().top):null};
const btns=[...p.querySelectorAll(".st120-attr-btn")].map(b=>b.getBoundingClientRect());const tb=[...p.querySelectorAll(".st107-toolbar button")].map(b=>b.getBoundingClientRect());const pw=p.getBoundingClientRect().width;
return JSON.stringify({flow:y(".st106-flow"),copilot:y(".st1064-copilot"),attr:y(".st120-task-attr-picker"),quest:y(".st120-quest-box"),time:y(".st106-time-row"),toolbar:y(".st107-toolbar"),notes:y(".st106-note-box"),
 attrRows:new Set(btns.map(b=>Math.round(b.top))).size,attrMaxW:Math.max(...btns.map(b=>b.width))/pw,tbRows:new Set(tb.map(b=>Math.round(b.top))).size,n:btns.length})`));
const chk=(L,tag)=>{const seq=[L.flow,L.copilot,L.attr,L.quest,L.time,L.toolbar];
 ok(tag+"：任務清單→副駕駛→屬性→任務說明→開始時間→工具",seq.every(v=>v!=null)&&seq.every((v,i)=>!i||v>seq[i-1]),L);
 ok(tag+"：屬性按鈕是一排小按鈕",L.n===6&&L.attrRows<=2&&L.attrMaxW<0.4,L);
 ok(tag+"：投影/亮點牆/Replay 排成一排",L.tbRows===1,L);};
await ev(`await __prep(${JSON.stringify(late)});return 1`);
chk(await lay(),"橫向");
const rf=JSON.parse(await ev(`st116RefreshFlowOnly();await new Promise(r=>setTimeout(r,300));return JSON.stringify({students:!!document.querySelector(".v1529-students-panel"),notes:!!document.querySelector(".v1529-left .st106-note-box")})`));
ok("局部重畫不會蓋掉學生名單與備註",rf.students&&rf.notes,rf);
chk(await lay(),"局部重畫後");
await d.shot("tl-layout");

// 8. 依課表判斷：今天不是上課日／還沒到時間／已過上課時間
const dow=pn.dow, other=(dow+2)%7, W=["日","一","二","三","四","五","六"];
await ev(`await __prep(${JSON.stringify(late)},null,[{dayOfWeek:${other},startTime:"10:30",endTime:"11:10"}]);return 1`);
const o1=await look();console.log(o1);
ok("今天不是上課日：顯示提示與課表",o1.phase.includes("今天不是這個班的上課日")&&o1.phase.includes(`星期${W[other]} 10:30–11:10`)&&o1.phase.includes("開始上課（補課／臨時課）"),o1);
ok("今天不是上課日：流程不計時、沒有超時與副駕駛",o1.paused&&o1.overdue===0&&!o1.copilot&&o1.start===late&&!o1.toast.includes("開始計時"),o1);
await d.shot("tl-offday");
const o2=JSON.parse(await ev(`document.querySelector(".v1529-phase .btn").click();await new Promise(r=>setTimeout(r,400));return JSON.stringify(__look())`));
ok("按「開始上課」：從現在開始計時、提示消失",(o2.start===hhmm(nowMin)||o2.start===hhmm(nowMin+1))&&o2.manual&&!o2.phase&&!o2.paused&&o2.overdue===0&&o2.toast.includes("開始計時"),o2);
const o3=JSON.parse(await ev(`exitStartClassMode();document.querySelectorAll(".bt-toast").forEach(t=>t.remove());enterStartClassMode();await new Promise(r=>setTimeout(r,700));return JSON.stringify(__look())`));
ok("開始後再進來：維持已開始",o3.start===o2.start&&!o3.phase&&!o3.paused,o3);
// 之前被誤判成已開始的紀錄（例如自動對準到晚上），今天不是上課日時也改回不計時
await ev(`await __prep("22:16",f=>{f.startAligned=true;f.plannedStartTime="10:30"},[{dayOfWeek:${other},startTime:"10:30",endTime:"11:10"}]);return 1`);
const o4=await look();ok("舊的誤判紀錄：改回不計時",o4.paused&&o4.overdue===0,o4);
// 自己改開始時間：視為已開始
const o5=JSON.parse(await ev(`st106SetStartTime(${JSON.stringify(hhmm(nowMin-5))});await new Promise(r=>setTimeout(r,400));return JSON.stringify(__look())`));
ok("自己改開始時間：視為已開始",o5.manual&&!o5.phase&&!o5.paused&&o5.start===hhmm(nowMin-5),o5);
{
  const st=hhmm(nowMin+50), en=hhmm(Math.min(nowMin+90,1439));
  await ev(`await __prep(${JSON.stringify(late)},f=>{f.startAligned=true},[{dayOfWeek:${dow},startTime:${JSON.stringify(st)},endTime:${JSON.stringify(en)}}]);return 1`);
  const b1=await look();console.log(b1);
  ok("還沒到上課時間：顯示提示、時間軸停在課表時間",b1.phase.includes(`今天 ${st} 開始`)&&b1.phase.includes("還有")&&b1.start===st&&b1.overdue===0&&!/嚴重落後|剩約/.test(b1.copilot),b1);
  await d.shot("tl-before");
  const b2=JSON.parse(await ev(`document.querySelector(".v1529-phase .btn").click();await new Promise(r=>setTimeout(r,400));return JSON.stringify(__look())`));
  ok("提前開始上課",(b2.start===hhmm(nowMin)||b2.start===hhmm(nowMin+1))&&!b2.phase,b2);
}
await ev(`await __prep("08:00",null,[{dayOfWeek:${dow},startTime:${JSON.stringify(late)},endTime:${JSON.stringify(hhmm(Math.min(nowMin+60,1439)))}}]);return 1`);
const c1=await look();
ok("已過上課時間：照課表判斷並自動對準",(c1.start===hhmm(nowMin)||c1.start===hhmm(nowMin+1))&&c1.planned===late&&c1.toast.includes(`原定 ${late}`)&&!c1.phase,c1);

// 7. 重新整理後保留對準結果
await ev(`await __prep(${JSON.stringify(late)});await new Promise(r=>setTimeout(r,600));return 1`);
const s1=(await look()).start;
await d.go();
const s2=await ev(`hideDeviceLockWarning?.();classContext.classId=state.classes.find(c=>state.enrollments.some(e=>e.classId===c.id&&e.studentId===state.students[0].id)).id;
document.querySelectorAll(".bt-toast").forEach(t=>t.remove());enterStartClassMode();await new Promise(r=>setTimeout(r,800));
return JSON.stringify({start:st106Lesson().startTime,toast:[...document.querySelectorAll(".bt-toast")].map(x=>x.innerText).join("|")})`);
const p=JSON.parse(s2);ok("重新整理後保留、不重複提示",p.start===s1&&!p.toast.includes("開始計時"),{s1,p});
console.log("errs",d.errs,"fails",fail);done(fail?1:0);
