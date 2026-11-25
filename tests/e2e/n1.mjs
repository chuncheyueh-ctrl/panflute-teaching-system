import {start,device,db,get,set,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},280000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":x);if(!c)fail++};
const A=await device("new.html");
console.log("boot A",await A.ev(`return JSON.stringify({mode:BTMainStore.mode,students:state.students.length,ls:Object.keys(localStorage),probe:LessonSync.probe().cloud})`),A.errs);
await A.ev(`await firebaseUploadAll(true,true)`);
const B=await device("new.html");await B.ev(`await firebaseDownloadAll()`);await sleep(800);
ok("window.state===state",await B.ev(`return window.state===state`));
const open=(d,date="2026-11-23")=>d.ev(`V15341RouteTo("classroom");classContext.schoolId=state.schools[0].id;classContext.classId=state.classes[0].id;classContext.date="${date}";classContext.__manualOverride=true;classroomTab="notes";render();await new Promise(r=>setTimeout(r,1200));return !!document.getElementById("lessonWeeklyTitle")+" "+classroomTab+" "+classContext.date+" "+document.getElementById("lessonSyncStatus")?.innerText`);
console.log("open",await open(A),"|",await open(B));
const type=(d,id,v)=>d.ev(`const e=document.getElementById("${id}");e.focus();e.value=${JSON.stringify(v)};e.dispatchEvent(new Event("input",{bubbles:true}));return 1`);
const val=(d,id)=>d.ev(`return document.getElementById("${id}")?.value`);
// 1 打字不按儲存就同步，且有裝置鎖
set("battleSystem/sessionLock",{deviceId:"other",deviceName:"x",updatedAt:Date.now()+1e6});
await type(A,"lessonWeeklyTitle","A主題");await sleep(2500);
ok("A打字→B即時看到",await val(B,"lessonWeeklyTitle")==="A主題",await val(B,"lessonWeeklyTitle"));
// 2 不同格同時改
await Promise.all([type(A,"lessonWeeklyGoal","A目標"),type(B,"lessonTodayReminder","B提醒")]);await sleep(3000);
ok("不同格都保留",await val(A,"lessonTodayReminder")==="B提醒"&&await val(B,"lessonWeeklyGoal")==="A目標");
// 3 任務
await A.ev(`lessonAddTodayTask("音階",12);`);await sleep(2500);
ok("B看到新任務",(await B.ev(`return [...document.querySelectorAll(".lesson-today-title")].map(x=>x.value).join()`)).endsWith("音階"));
await B.ev(`document.querySelectorAll(".lesson-today-done")[0].click()`);await sleep(2500);
ok("A看到勾選",await A.ev(`return document.querySelectorAll(".lesson-today-done")[0].checked`));
// 4 按鈕
console.log(await A.ev(`document.getElementById("lessonWeeklyTaskText").value="甲\\n乙";document.getElementById("lessonWeeklyTaskText").dispatchEvent(new Event("input",{bubbles:true}));lessonSyncWeeklyToToday();await lessonSaveWeeklyPlan();return document.getElementById("saveFlashToast")?.textContent+__alerts.join()`));await sleep(2000);
ok("同步到今天",await B.ev(`return [...document.querySelectorAll(".lesson-today-title")].map(x=>x.value).join()`)==="甲,乙");
await type(A,"lessonGrowthText","亮點A");await sleep(2500);ok("亮點",await val(B,"lessonGrowthText")==="亮點A");
// 5 衝突：B離線改同一格
await B.offline(true);await type(B,"lessonWeeklyTitle","B離線主題");await sleep(1500);
console.log("B離線狀態",await B.ev(`return document.getElementById("lessonSyncStatus").innerText`));
await type(A,"lessonWeeklyTitle","A線上主題");await sleep(2500);
await B.offline(false);await sleep(17000);
ok("雲端仍是A",JSON.parse(Object.values(get("battleSystem/lessons"))[0].s.weeklyPlan.d).title==="A線上主題");
ok("B字還在",await val(B,"lessonWeeklyTitle")==="B離線主題");
console.log("B 衝突",await B.ev(`return document.querySelector(".lesson-conflict")?.innerText+" / "+document.getElementById("lessonSyncStatus").innerText`));
await B.shot("conf");
await B.ev(`LessonSync.resolve("weeklyPlan","mine")`);await sleep(2500);
ok("選B後A看到B",await val(A,"lessonWeeklyTitle")==="B離線主題",await val(A,"lessonWeeklyTitle"));
ok("目標沒掉",await val(A,"lessonWeeklyGoal")==="A目標");
// 6 離線改→連線自動補
await B.offline(true);await type(B,"lessonTodayHomework","離線功課");await sleep(1500);await B.offline(false);await sleep(17000);
ok("離線補傳",await val(A,"lessonTodayHomework")==="離線功課");
// 7 打字中收到別台更新不洗掉
await A.ev(`const e=document.getElementById("lessonTodayNote");e.focus();e.value="打到一";e.dispatchEvent(new Event("input",{bubbles:true}));e.setSelectionRange(3,3)`);
await type(B,"lessonWeeklySideQuest","B支線");await sleep(2500);
ok("打字保留+焦點",await A.ev(`return document.activeElement.id+document.activeElement.value`)==="lessonTodayNote打到一",await A.ev(`return document.activeElement.id+document.activeElement.value`));
// 8 上課模式任務狀態
await A.ev(`document.activeElement.blur();ST1062_TaskActions.setStatus(1,"done")`);await sleep(2500);
ok("上課模式→B",await B.ev(`return document.querySelectorAll(".lesson-today-done")[1].checked`));
// 9 切日期不串
await open(A,"2026-11-30");ok("新日期是空",await val(A,"lessonWeeklyTitle")==="");
console.log("回顧",(await A.ev(`return document.querySelector(".v1537-prev-review").innerText`)).replace(/\n/g," / "));
ok("只開不寫",Object.keys(get("battleSystem/lessons")).length===1,Object.keys(get("battleSystem/lessons")));
// 10 重新載入 IndexedDB
await A.go();await open(A);ok("重載後還在",await val(A,"lessonWeeklyTitle")==="B離線主題");
console.log("A ls",await A.ev(`return JSON.stringify(Object.keys(localStorage))+BTMainStore.mode`));
// 11 讀取雲端（整包是舊的）不會洗掉課程紀錄
await A.ev(`await firebaseDownloadAll()`);await sleep(1500);ok("讀取雲端後仍是新的",await val(A,"lessonWeeklyTitle")==="B離線主題",await val(A,"lessonWeeklyTitle"));
await type(A,"lessonWeeklyTitle","下載後再改");await sleep(2500);ok("下載後再改→B",await val(B,"lessonWeeklyTitle")==="下載後再改");
// 12 整包防護
set("battleSystem/sessionLock",null);
const C=await device("new.html");await C.ev(`await firebaseDownloadAll()`);
await A.ev(`state.students[0].name="新名字";markDirty("x");await firebaseUploadAll(true,true)`);await sleep(3500);set("battleSystem/sessionLock",null);
ok("舊裝置被擋",await C.ev(`state.points[state.students[0].id]=99;saveState();markDirty("p");return await guardedFirebaseUpload(true)`)===false);
ok("雲端沒被蓋",get("battleSystem/main/state/students/0/name")==="新名字");
set("battleSystem/sessionLock",null);ok("A自己可再傳",await A.ev(`markDirty("y");return await guardedFirebaseUpload(true)`)===true);
// 13 denied
console.log("errs",A.errs,B.errs,C.errs);console.log("fails",fail);
await open(A);await A.shot("new-notes");
done(0);
