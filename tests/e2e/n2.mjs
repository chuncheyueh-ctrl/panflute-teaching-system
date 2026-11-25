import {start,device,db,get,set,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},290000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":x);if(!c)fail++};
const open=(d,date="2026-11-20")=>d.ev(`V15341RouteTo("classroom");classContext.schoolId=state.schools[0].id;classContext.classId=state.classes[0].id;classContext.date="${date}";classContext.__manualOverride=true;classroomTab="notes";render();await new Promise(r=>setTimeout(r,1200));`);
const val=(d,id)=>d.ev(`return document.getElementById("${id}")?.value`);
const type=(d,id,v)=>d.ev(`const e=document.getElementById("${id}");e.focus();e.value=${JSON.stringify(v)};e.dispatchEvent(new Event("input",{bubbles:true}));return 1`);
const K="bt_teaching_system_v2_structured";
// 用舊版做出一份真的舊資料
const O=await device("old.html");await O.ev(`await firebaseUploadAll(true,true)`);
await O.ev(`V15341RouteTo("classroom");classContext.schoolId=state.schools[0].id;classContext.classId=state.classes[0].id;classContext.date="2026-11-20";classroomTab="notes";render();await new Promise(r=>setTimeout(r,2500));document.getElementById("lessonWeeklyTitle").value="舊版主題";lessonSaveWeeklyPlan();document.getElementById("lessonTodayReminder").value="舊版提醒";lessonSaveTodayFlow();await new Promise(r=>setTimeout(r,2500));state.lessonRecords=window.state.lessonRecords;saveState();await new Promise(r=>setTimeout(r,500))`);
const raw=await O.ev(`return localStorage.getItem("${K}")`);console.log("legacy bytes",raw.length,"recs",JSON.parse(raw).lessonRecords?.length);
await O.close();db.tree={};
const mk=f=>{const st=JSON.parse(raw);f&&f(st);return `localStorage.setItem("${K}",${JSON.stringify(JSON.stringify(st))})`};
// A 搬移
const A=await device("new.html",{seed:mk()});
ok("A搬到IDB且第一次保留LS",await A.ev(`return BTMainStore.mode+!!localStorage.getItem("${K}")+localStorage.getItem("bt_main_in_idb")`)==="idbtrue1");
await open(A);ok("A內容",await val(A,"lessonWeeklyTitle")==="舊版主題"&&await val(A,"lessonTodayReminder")==="舊版提醒",await val(A,"lessonWeeklyTitle"));
await sleep(1500);console.log("cloud secs",JSON.stringify(Object.entries(get("battleSystem/lessons")||{}).map(([k,v])=>[k,Object.keys(v.s)])));
// B 舊資料同一堂：主題空、提醒不同、多了功課
const B=await device("new.html",{seed:mk(st=>{const r=st.lessonRecords.find(r=>r.date==="2026-11-20");r.id="other";r.uid="o";r.weeklyPlan={title:"",goal:"B舊目標",taskText:"",sideQuest:"",tasks:[]};r.todayFlow.reminder="B的提醒"})});
await sleep(3000);await open(B);
ok("B合併：主題來自A、目標來自B",await val(B,"lessonWeeklyTitle")==="舊版主題"&&await val(B,"lessonWeeklyGoal")==="B舊目標",[await val(B,"lessonWeeklyTitle"),await val(B,"lessonWeeklyGoal")]);
ok("B流程不同→衝突不蓋",await val(B,"lessonTodayReminder")==="B的提醒"&&await B.ev(`return document.querySelectorAll(".lesson-conflict").length`)===1);
ok("A收到目標",await val(A,"lessonWeeklyGoal")==="B舊目標");
await B.ev(`LessonSync.resolve("todayFlow","other")`);await sleep(800);ok("改用A",await val(B,"lessonTodayReminder")==="舊版提醒");
// 第二次開 LS 清掉
await A.go();ok("第二次開 LS 清掉",await A.ev(`return String(localStorage.getItem("${K}"))+!!(await BTMainStore.get("legacy_main"))+state.students.length`)==="nulltrue"+JSON.parse(raw).students.length);
// 立刻關頁 journal
await A.ev(`state.students[0].name="關前改的";document.dispatchEvent(new Event("x"));setTimeout(()=>{},0)`);
await A.go();ok("沒按存直接關",await A.ev(`return state.students[0].name`)==="關前改的");
// journal 優先
await A.ev(`const s=JSON.parse(JSON.stringify(state));s.students[0].name="JOURNAL";BTMainStore.snapshot=null;localStorage.setItem("bt_main_journal",(BTMainStore.seq+9e6)+"\\n"+JSON.stringify(s))`);
await A.go();ok("journal補寫",await A.ev(`return state.students[0].name+localStorage.getItem("bt_main_journal")+JSON.parse((await BTMainStore.get("main")).raw).students[0].name`)==="JOURNALnullJOURNAL");
// IDB 壞掉且已搬移 → 復原畫面，不用預設資料
await A.go("new.html",`indexedDB.open=()=>{throw new Error("boom")};`);
ok("IDB壞→停住",(await A.ev(`return document.getElementById("app").innerText+typeof firebaseUploadAll`)).includes("資料沒有讀到")&&await A.ev(`return typeof firebaseUploadAll`)==="undefined",await A.ev(`return document.getElementById("app").innerText`));await A.shot("recover");
await A.go("new.html","");ok("修好後資料在",await A.ev(`return state.students[0].name`)==="JOURNAL");
// 開啟卡住逾時
await A.go("new.html",`indexedDB.open=()=>({});`);await sleep(13500);
ok("IDB卡住→停住",(await A.ev(`return document.getElementById("app").innerText`)).includes("資料沒有讀到"));
await A.go("new.html","");
// 寫入失敗 → journal
await A.ev(`const o=IDBObjectStore.prototype.put;window.__o=o;IDBObjectStore.prototype.put=function(){throw new DOMException("q","QuotaExceededError")};state.students[0].name="寫不進去";saveState();await new Promise(r=>setTimeout(r,800));`);
console.log("寫失敗",await A.ev(`return JSON.stringify([__alerts,!!localStorage.getItem("bt_main_journal")])`));
await A.go("new.html","");ok("寫失敗後重開仍在",await A.ev(`return state.students[0].name`)==="寫不進去");
// IDB 記錄被清
await A.ev(`BTMainStore.snapshot=null;await BTMainStore._tx("readwrite",s=>s.clear())`);await A.go("new.html","");
ok("資料被清→復原畫面",(await A.ev(`return document.getElementById("app").innerText`)).includes("讀取雲端"));
await A.ev(`document.getElementById("btRecoverBlank").click();await new Promise(r=>setTimeout(r,2500))`);
set("battleSystem/main",{updatedAt:Date.now(),updatedAtText:"x",state:JSON.parse(raw)});
ok("空白開啟後上傳被擋",await A.ev(`markDirty("x");return await guardedFirebaseUpload(true)`)===false);
// 無 IDB 的新/舊裝置
const C=await device("new.html",{seed:mk(),inject:`delete window.indexedDB;Object.defineProperty(window,"indexedDB",{value:undefined});`});
ok("無IDB用LS",await C.ev(`state.students[0].name="LS";saveState();await new Promise(r=>setTimeout(r,500));return BTMainStore.mode+JSON.parse(localStorage.getItem("${K}")).students[0].name`)==="localLS");
// 壞 JSON
const D=await device("new.html",{seed:`localStorage.setItem("${K}","{壞")`});
ok("壞資料→停住且原檔還在",(await D.ev(`return document.getElementById("app").innerText`)).includes("沒有讀到")&&await D.ev(`return localStorage.getItem("${K}")`)==="{壞");
// 規則拒絕
db.deny=/battleSystem\/lessons/;db.tree.battleSystem.lessons=undefined;
const E=await device("new.html",{seed:mk()});await open(E);await type(E,"lessonWeeklyTitle","拒絕測試");await sleep(2500);
console.log("denied",await E.ev(`return document.getElementById("lessonSyncStatus").innerText+syncStatus.dirty`));
await E.ev(`await firebaseUploadAll(true,true)`);
const F=await device("new.html",{seed:mk()});await F.ev(`await firebaseDownloadAll()`);await open(F);
ok("拒絕時整包仍可同步",await val(F,"lessonWeeklyTitle")==="拒絕測試",await val(F,"lessonWeeklyTitle"));
/* E、F 測完先關掉：不然拒絕解除後 E 會補寫「拒絕測試」到雲端，
   讓下一段 G 出現兩個版本（App 會正確地停下來讓使用者選），干擾下一段要測的情境 */
await E.close();await F.close();
db.deny=null;
// 還原雲端歷史 → hold → 上傳
const G=await device("new.html",{seed:mk()});await sleep(2500);await open(G);await G.ev(`await firebaseUploadAll(true,true)`);const key=Object.keys(get("battleSystem/historyIndex")).sort().at(-1);
await type(G,"lessonWeeklyTitle","之後改的");await sleep(2500);
await G.ev(`await restoreCloudHistory("${key}")`);await sleep(2000);
const ct=()=>JSON.parse(Object.entries(get("battleSystem/lessons")).find(([k])=>k.endsWith("11-20"))[1].s.weeklyPlan.d).title;
ok("還原後畫面是舊的、雲端未動",await val(G,"lessonWeeklyTitle")!=="之後改的"&&ct()==="之後改的",[await val(G,"lessonWeeklyTitle"),ct()]);
console.log(await G.ev(`return document.getElementById("lessonSyncStatus").innerText`));
set("battleSystem/sessionLock",null);ok("上傳後雲端也還原",await G.ev(`return await guardedFirebaseUpload(true)`)===true);await sleep(2000);ok("雲端還原",ct()!=="之後改的",ct());
console.log("errs",JSON.stringify([A,B,C,D,E,F,G].map(d=>d.errs)));console.log("fails",fail);done(0);
