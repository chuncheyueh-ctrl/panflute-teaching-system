import {start,device,db,get,set,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},290000);
const K="bt_teaching_system_v2_structured";
const snap=`JSON.stringify({pts:state.points,log:state.growthLogs.map(l=>[l.xp,l.points,l.type]),pl:(state.pointLogs||[]).map(l=>[l.delta??l.points??l.value]),st:state.students.map(s=>[s.name,s.xp,s.points,s.exp]),att:(state.attendance||[]).map(a=>a.status),rd:(state.redeemLogs||[]).length})`;
for(const f of ["old.html","new.html"]){db.tree={};
 const d=await device(f);
 const r=await d.ev(`V15341RouteTo("classroom");classContext.schoolId=state.schools[0].id;classContext.classId=state.classes[0].id;classContext.date="2026-11-23";classContext.__manualOverride=true;const ids=state.students.map(s=>s.id);const W=ms=>new Promise(r=>setTimeout(r,ms));
  try{enterStartClassMode?.()}catch(e){try{startClassModeOpen?.()}catch(e){}}
  await W(1000);const out=[];
  const t=async(n,fn)=>{try{fn()}catch(e){out.push(n+" EX "+e.message)}await W(2500)};
  await t("xp",()=>st106AddXp(ids[0],(state.growthTypes||[])[0]?.id||"focus"));await t("pt",()=>st106AddPoints(ids[1],3));
  await t("att",()=>st106SetAttendance(ids[0],"出席"));await t("xp2",()=>{window.quickAddGrowthXp?.(ids[2],5,"節奏")});await t("p3",()=>window.v1515SetPointByName?.(state.students[2].name,7));
  await t("sc",()=>window.startClassAddXp?.(ids[0],2));
  await W(2500);return out.join()+"\\n"+${snap}`);
 console.log(f,r,d.errs);
 const after=await (await d.ev(`saveState();await new Promise(r=>setTimeout(r,800));return 1`),d.go(),d.ev(`return ${snap}`));console.log(" reload",after);
 await d.close();
}
// ST150 還原 + 雲端較新
db.tree={};const A=await device("new.html");await A.ev(`await firebaseUploadAll(true,true);state.__p="A";await ST150_SaveCore.snapshot("manual",true);await new Promise(r=>setTimeout(r,1500))`);
const m=get("battleSystem/main");set("battleSystem/main/updatedAt",m.updatedAt+60000);set("battleSystem/sessionLock",null);
console.log("restore then upload (want false)",await A.ev(`state.__p="B";await ST150_SaveCore.restore();markDirty("z");const p=state.__p;return p+(await guardedFirebaseUpload(true))`));
console.log("restore w/ IDB write fail (want B)",await A.ev(`state.__p="A2";await ST150_SaveCore.snapshot("manual",true);await new Promise(r=>setTimeout(r,1500));state.__p="B";saveState();await new Promise(r=>setTimeout(r,600));const o=BTMainStore.put;let n=0;BTMainStore.put=async()=>{throw new DOMException("q","QuotaExceededError")};__alerts.length=0;await ST150_SaveCore.restore();BTMainStore.put=o;return state.__p+__alerts.join("|")`));
await A.go();console.log(" reload",await A.ev(`return state.__p`));
// 上傳時斷線
await A.offline(true);console.log("offline upload (want false)",await A.ev(`markDirty("q");return await guardedFirebaseUpload()+__alerts.join("|")`));await A.offline(false);
// 效能：1.5MB + 300 堂
const B=await device("new.html");
const big=await B.ev(`const s=JSON.parse(JSON.stringify(state));s.lessonRecords=Array.from({length:300},(_,i)=>({id:"r"+i,schoolId:"s",classId:s.classes[i%2].id,termId:"115-1",date:"2026-"+String(1+i%12).padStart(2,"0")+"-"+String(1+(i/12|0)).padStart(2,"0"),weeklyPlan:{title:"t"+i,goal:"g".repeat(200),taskText:"a\\nb",tasks:[]},todayFlow:{startTime:"10:30",tasks:[{title:"x"+i,minutes:5}],reminder:"r".repeat(100),homework:"",note:""},fixedCurriculum:{text:""},growthHighlights:{text:""}}));s.activityLogs=Array.from({length:6000},(_,i)=>({id:"a"+i,t:"x".repeat(180)}));window.__s=JSON.stringify(s);return __s.length`);
const raw=await B.ev(`return __s`);console.log("big",big);
db.tree={};const C=await device("new.html",{seed:`localStorage.setItem("${K}",${JSON.stringify(raw)})`});
console.log("boot",await C.ev(`return JSON.stringify([BTMainStore.mode,state.lessonRecords.length,LessonSync.unsaved()])`));
console.log("captureAll ms",await C.ev(`const t=performance.now();LessonSync.captureAll();return performance.now()-t`),"save ms",await C.ev(`const t=performance.now();persistMain();return performance.now()-t`));
for(let i=0;i<8;i++){await sleep(3000);const u=await C.ev(`return LessonSync.unsaved()`);console.log("pending",u);if(!u)break}
console.log(Object.keys(get("battleSystem/lessons")).length,"lessons bytes",JSON.stringify(get("battleSystem/lessons")).length,C.errs);
const D=await device("new.html",{seed:`localStorage.setItem("${K}",${JSON.stringify(raw)})`});await sleep(2500);console.log("D same data: pending",await D.ev(`return LessonSync.unsaved()+" conflicts "+state.lessonRecords.filter(r=>Object.values(r.sync).some(m=>m.conflict)).length`));
done(0);
