import {start,device,db,get,set,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},200000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
const d=await device("new.html",{w:1366,h:1024});
const ev=d.ev;
await ev(`hideDeviceLockWarning();document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500));scoreAddExam("期中考");await new Promise(r=>setTimeout(r,300))`);
const ids=JSON.parse(await ev(`return JSON.stringify(studentsByClass(scoreContext.classId).map(s=>s.id))`));
console.log("students",ids.length);
const fill=async(sc)=>ev(`const sc=${JSON.stringify(sc)};document.querySelectorAll('.score-input').forEach(el=>{const v=sc[el.dataset.student]?.[el.dataset.field];if(v!==undefined){el.focus();el.value=v;scoreInput(el);el.blur()}});scoreSaveNow();render();return 1`);
await fill({[ids[0]]:{written:100,practical:100},[ids[1]]:{written:96,practical:95},[ids[2]]:{written:90,practical:80}});
const pts=()=>ev(`return JSON.stringify(${JSON.stringify(ids)}.map(i=>state.points[i]||0))`);
const bar=()=>ev(`return document.getElementById("scoreBonusBar").innerText.replace(/\\n/g," ")+" | "+[...document.querySelectorAll('[id^=score_bonus_]')].map(e=>e.innerText).join(",")`);
const p0=JSON.parse(await pts());console.log("before",p0,await bar());
ok("顯示待發",(await bar()).includes("2 位學生待發"));
await ev(`__confirms.length=0;scoreBonusAward(scoreContext.examId)`);
const p1=JSON.parse(await pts());console.log("confirm:",await ev(`return __confirms[0]`));
ok("發點數 +5 +3 +0",p1[0]-p0[0]===5&&p1[1]-p0[1]===3&&p1[2]===p0[2],[p0,p1]);
console.log("after",await bar());ok("已發完",(await bar()).includes("已發完點數"));
ok("按鈕停用",await ev(`return document.querySelector('#scoreBonusBar .btn.gold').disabled`));
await ev(`scoreBonusAward(scoreContext.examId)`);ok("不重複發",await pts()===JSON.stringify(p1));
ok("點數紀錄",(await ev(`return state.pointLogs.filter(l=>l.source==="score_bonus").map(l=>l.reason).join("|")`)).includes("總分 100 分 +5"),await ev(`return state.pointLogs.filter(l=>l.source==="score_bonus").map(l=>l.reason).join("|")`));
// 改成績 → 補差額
await fill({[ids[1]]:{written:100,practical:100}});console.log("changed",await bar());
ok("改成績後提示",(await bar()).includes("1 位學生待發")&&(await bar()).includes("已發 +3，應為 +5"));
await ev(`scoreBonusAward(scoreContext.examId)`);let p2=JSON.parse(await pts());ok("補發 +2",p2[1]-p1[1]===2,[p1,p2]);
// 降分 → 扣回
await fill({[ids[1]]:{written:80,practical:80}});await ev(`scoreBonusAward(scoreContext.examId)`);let p3=JSON.parse(await pts());ok("扣回 -5",p3[1]-p2[1]===-5,[p2,p3]);
// 規則：依紙筆、新增一級
await ev(`scoreBonusSetBasis("written");scoreBonusAddTier()`);console.log("rules",await ev(`return JSON.stringify(state.scoreBonusRules)+document.querySelector(".score-bonus-rules summary").innerText+" open="+document.querySelector(".score-bonus-rules").open`));
await ev(`scoreBonusSetTier(0,"points","abc")`);ok("錯誤點數提示",(await ev(`return __alerts.at(-1)`)).includes("整數"));
// 收回
await ev(`scoreBonusRevoke(scoreContext.examId)`);ok("收回後回到原點",await pts()===JSON.stringify(p0),[p0,await pts()]);
ok("收回後可再發",await ev(`return !document.querySelector('#scoreBonusBar .btn.gold').disabled`));
// 第二項：平時成績
await ev(`scoreSetSecondKind("regular")`);console.log("head",await ev(`return [...document.querySelectorAll(".score-table th")].map(t=>t.innerText).join(",")+" | "+document.getElementById("scoreStats").innerText.replace(/\\n/g," / ")`));
ok("平時成績標題",(await ev(`return document.querySelector(".score-table thead").innerText`)).includes("平時成績"));
ok("其他班仍是術科",await ev(`const other=classesBySchool(scoreContext.schoolId).find(c=>c.id!==scoreContext.classId);if(!other)return "none";scoreChangeContext("classId",other.id);return document.querySelector(".score-table thead")?.innerText.includes("排笛術科")??"nostudents"`)!==false);
await ev(`scoreChangeContext("classId",${JSON.stringify(await ev(`return null`))}||state.classes[0].id);scoreChangeContext("examId","summary")`);console.log("summary head",await ev(`return document.querySelector(".score-table thead")?.innerText.replace(/\\s+/g," ")`));
await ev(`scoreChangeContext("examId",scoreExamList()[0].id)`);await d.shot("bonus");
// 重新載入保留
await d.go();await ev(`hideDeviceLockWarning();document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500))`);
ok("重載保留設定",(await ev(`return JSON.stringify([state.scoreBonusRules.basis,findById(state.classes,scoreContext.classId).scoreSecondKind])`))==='["written","regular"]');
await ev(`document.body.classList.add("dark-mode")`);await d.shot("bonus-dark");
const P=await device("new.html",{w:820,h:1180});await P.ev(`hideDeviceLockWarning();state.scoreExams=[];document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500));scoreAddExam("期中考");document.querySelector(".score-bonus-rules").open=true;document.getElementById("scoreBonusBar").scrollIntoView()`);await P.shot("bonus-ipad");
console.log("errs",d.errs,P.errs,"fails",fail);done(0);
