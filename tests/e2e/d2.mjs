import {start,device,sleep,get,set} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},150000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
const d=await device("new.html",{w:1366,h:1024});const ev=d.ev;
const m=()=>ev(`return JSON.stringify({dirty:syncStatus.dirty,bar:document.getElementById("syncStatusBar")?.innerText.replace(/\\n/g," "),cls:document.getElementById("syncStatusBar")?.className,rem:document.getElementById("uploadReminderBox")?.innerText.replace(/\\n/g," ")||"",meta:{s:state.backupMeta.dirtySinceMs,p:state.backupMeta.pendingImportant}})`).then(JSON.parse);
await sleep(2500);set("battleSystem/sessionLock",null);await ev(`hideDeviceLockWarning();await guardedFirebaseUpload(true)`);await sleep(300);
let x=await m();ok("上傳後乾淨",!x.dirty&&!x.rem&&!x.meta.s,x);
await d.go();await sleep(3500);x=await m();ok("乾淨重整不提醒",!x.dirty&&!x.rem,x);
// 改點數
await ev(`hideDeviceLockWarning();state.points[state.students[0].id]=(state.points[state.students[0].id]||0)+1;saveState();markDirty("設定點數：1→2")`);
x=await m();console.log(x);ok("顯示含：點數",x.bar.includes("含：點數"),x);
// 30 分鐘前開始 → urgent + 時間
await ev(`state.backupMeta.dirtySinceMs=Date.now()-35*60000;renderSyncStatus()`);x=await m();console.log(x.bar,x.cls);ok("超過30分鐘醒目",x.cls.includes("urgent")&&x.bar.includes("35 分鐘"),x);
// 重整後仍記得
await d.go();await sleep(3500);x=await m();console.log(x);ok("重整後仍是尚未上傳",x.dirty&&x.bar.includes("尚未上傳")&&x.bar.includes("含：點數"),x);
ok("重整後跳出提醒",x.rem.includes("還有修改沒上傳"),x);
await d.shot("remind");
// 讀取雲端前的保護訊息現在也會出現
await ev(`__confirms.length=0;window.confirm=(m)=>{__confirms.push(m);return false};await firebaseDownloadAll();`);
ok("重整後讀取雲端會警告",(await ev(`return __confirms.join("|")`)).includes("尚未上傳"));
// 考試發點數提醒
await ev(`document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,400));hideUploadReminder();scoreAddExam("期中考");await new Promise(r=>setTimeout(r,300));
document.querySelectorAll('.score-input').forEach((el,i)=>{if(i<2){el.value=100;scoreInput(el)}});scoreSaveNow();render();window.confirm=()=>true;scoreBonusAward(scoreContext.examId)`);
x=await m();console.log(x);ok("發點數後提醒",x.rem.includes("點數發好了"),x);ok("含考試成績與發點數",x.bar.includes("考試成績")&&x.bar.includes("考試發點數")&&x.cls.includes("urgent"),x);
// 按現在上傳
set("battleSystem/sessionLock",null);
await ev(`document.querySelector("#uploadReminderBox .btn.gold").click();await new Promise(r=>setTimeout(r,800))`);
x=await m();ok("上傳後清除",!x.dirty&&!x.rem&&!x.meta.s&&!x.meta.p,x);
const cloud=get("battleSystem/main/state/backupMeta");ok("雲端不帶提醒資訊",cloud&&cloud.dirtySinceMs===undefined&&cloud.pendingImportant===undefined,cloud);
// 第二台讀取後乾淨
const e=await device("new.html",{w:820,h:1180});await sleep(2500);await e.ev(`hideDeviceLockWarning();window.confirm=()=>true;await firebaseDownloadAll()`);await sleep(500);
const y=JSON.parse(await e.ev(`return JSON.stringify({d:syncStatus.dirty,r:!!document.getElementById("uploadReminderBox")})`));ok("別台讀取後乾淨",!y.d&&!y.r,y);
await e.ev(`state.points[state.students[0].id]=5;saveState();markDirty("XP batch");showUploadReminder("測試提醒文字，看看在 iPad 直向的樣子。")`);await e.shot("remind-ipad");
console.log("errs",d.errs,e.errs,"fails",fail);done(0);
