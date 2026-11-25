import {start,device,db,get,set,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},290000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":x);if(!c)fail++};
const open=(d,date="2026-11-20")=>d.ev(`V15341RouteTo("classroom");classContext.schoolId=state.schools[0].id;classContext.classId=state.classes[0].id;classContext.date="${date}";classContext.__manualOverride=true;classroomTab="notes";render();await new Promise(r=>setTimeout(r,1200));`);
const val=(d,id)=>d.ev(`return document.getElementById("${id}")?.value`);
const type=(d,id,v)=>d.ev(`const e=document.getElementById("${id}");e.focus();e.value=${JSON.stringify(v)};e.dispatchEvent(new Event("input",{bubbles:true}));return 1`);
const G=await device("new.html");await open(G);await type(G,"lessonWeeklyTitle","第一版");await sleep(2500);await G.ev(`await firebaseUploadAll(true,true)`);const key=Object.keys(get("battleSystem/historyIndex")).sort().at(-1);
const H=await device("new.html");await H.ev(`await firebaseDownloadAll()`);await open(H);ok("H",await val(H,"lessonWeeklyTitle")==="第一版");
await type(G,"lessonWeeklyTitle","第二版");await sleep(2500);
const ct=()=>JSON.parse(Object.values(get("battleSystem/lessons"))[0].s.weeklyPlan.d).title;
await G.ev(`await restoreCloudHistory("${key}")`);await sleep(2000);
ok("還原：畫面舊、雲端未動",await val(G,"lessonWeeklyTitle")==="第一版"&&ct()==="第二版",[await val(G,"lessonWeeklyTitle"),ct()]);
await G.go();await open(G);await sleep(1500);ok("重開後還原仍保留未傳",await val(G,"lessonWeeklyTitle")==="第一版"&&ct()==="第二版",[await val(G,"lessonWeeklyTitle"),ct()]);
set("battleSystem/sessionLock",null);ok("上傳",await G.ev(`return await guardedFirebaseUpload(true)`)===true);await sleep(2500);ok("雲端+H 都回第一版",ct()==="第一版"&&await val(H,"lessonWeeklyTitle")==="第一版",[ct(),await val(H,"lessonWeeklyTitle")]);
// 匯入備份檔
await type(G,"lessonWeeklyTitle","第三版");await sleep(2500);
// 兩台同時改同一格
await Promise.all([type(G,"lessonGrowthText","G"),type(H,"lessonGrowthText","H")]);await sleep(4000);
console.log("同時改",await val(G,"lessonGrowthText"),await val(H,"lessonGrowthText"),await G.ev(`return document.querySelectorAll(".lesson-conflict").length`),await H.ev(`return document.querySelectorAll(".lesson-conflict").length`));
// 連續打字＝不自我衝突
for(let i=1;i<=25;i++){await type(G,"lessonTodayNote","字".repeat(i));await sleep(170)}await sleep(3000);
ok("連續打字",await val(H,"lessonTodayNote")==="字".repeat(25)&&await G.ev(`return LessonSync.probe().record.sync.todayFlow.conflict`)===undefined);
for(let i=1;i<=8;i++){await type(G,"lessonTodayNote","慢".repeat(i));await sleep(900)}await sleep(3000);
ok("慢速打字",await val(H,"lessonTodayNote")==="慢".repeat(8)&&await G.ev(`return LessonSync.probe().record.sync.todayFlow.conflict`)===undefined,await val(H,"lessonTodayNote"));
// 模式模板
await G.ev(`state.modeTemplates=[{id:"m1",name:"音樂會",title:"音樂會主題",goal:"g",tasks:"a\\nb",sideQuest:"s"}];applyModeTemplateToWeeklyPlan("m1")`);await sleep(2500);ok("模式模板→H",await val(H,"lessonWeeklyTitle")==="音樂會主題");
// 上課模式
await G.ev(`st120SetTaskAttr(0,ST120_TASK_ATTRS[1].id);sc939SetStartTime("13:20")`);await sleep(2500);ok("上課時間/屬性→H",await val(H,"lessonTodayStartTime")==="13:20"&&await H.ev(`return lessonRecord().todayFlow.tasks[0].magicAttr===ST120_TASK_ATTRS[1].id`));
// 固定課綱仍顯示
console.log("課綱",(await G.ev(`return document.getElementById("lessonFixedCurriculumCore").innerText`)).slice(0,60));
// 大量搬移時間
console.log("errs",JSON.stringify([G,H].map(d=>d.errs)));
// 所有頁面
const pages=await G.ev(`return [...document.querySelectorAll(".nav button[data-page]")].map(b=>b.dataset.page).join()`);
for(const p of pages.split(",")){await G.ev(`document.querySelector('.nav button[data-page="${p}"]').click();await new Promise(r=>setTimeout(r,600))`);const t=await G.ev(`return document.getElementById("app").innerText.length+"|"+/系統載入錯誤/.test(document.getElementById("app").innerText)`);if(t.startsWith("0|")||t.endsWith("true"))console.log("PAGE?",p,t)}
console.log("pages",pages,"errs",G.errs);
await open(G);await G.ev(`window.scrollTo(0,0)`);await G.shot("notes1");
const P=await device("new.html",{w:820,h:1180});await P.ev(`await firebaseDownloadAll()`);await open(P);await P.shot("notes-ipad");
console.log("fails",fail);done(0);
