import {start,device,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},200000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
const d=await device("new.html",{w:1366,h:1024});const ev=d.ev;
await ev(`hideDeviceLockWarning();document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500));`);
console.log("setup",await ev(`const cid=scoreContext.classId;const base=studentsByClass(cid)[0];for(let i=0;i<4;i++){state.students.push({...base,id:"tst"+i,name:"測試"+i});state.enrollments.push({studentId:"tst"+i,classId:cid})}saveState();render();await new Promise(r=>setTimeout(r,300));return cid+" "+studentsByClass(cid).length`));
await ev(`scoreAddExam("期中考");await new Promise(r=>setTimeout(r,300))`);
const ids=JSON.parse(await ev(`return JSON.stringify(studentsByClass(scoreContext.classId).map(s=>s.id))`));console.log("students",ids.length);
const fill=async(sc)=>ev(`const sc=${JSON.stringify(sc)};document.querySelectorAll('.score-input').forEach(el=>{const v=sc[el.dataset.student]?.[el.dataset.field];if(v!==undefined){el.focus();el.value=v;scoreInput(el);el.blur()}});scoreSaveNow();render();return 1`);
const totals=[100,98,98,90,85,85,70];const sc={};totals.forEach((t,i)=>{if(ids[i])sc[ids[i]]={written:t,practical:t}});await fill(sc);
const pts=()=>ev(`return JSON.stringify(${JSON.stringify(ids)}.map(i=>state.points[i]||0))`).then(JSON.parse);
const bar=()=>ev(`return document.getElementById("scoreBonusBar").innerText.replace(/\\n/g," ")+" | "+[...document.querySelectorAll('[id^=score_bonus_]')].map(e=>e.innerText).join(",")`);
// 舊資料（沒有 mode）→ 預設依分數
ok("預設依分數",(await ev(`return scoreBonusRules().mode`))==="score");
await ev(`scoreBonusSetMode("rank")`);
console.log(await bar());
ok("預設前5名+5",(await ev(`return JSON.stringify(scoreBonusRules().rankTiers)`))==='[{"from":1,"to":5,"points":5}]');
ok("規則開著",await ev(`return document.querySelector(".score-bonus-rules").open`));
// 設成 1:+5, 2-3:+3, 4-5:+2
await ev(`scoreBonusSetRankTier(0,"to","1");scoreBonusAddRankTier();scoreBonusSetRankTier(1,"to","3");scoreBonusSetRankTier(1,"points","3");scoreBonusAddRankTier();scoreBonusSetRankTier(2,"to","5");scoreBonusSetRankTier(2,"points","2")`);
console.log("rules",await ev(`return JSON.stringify(scoreBonusRules().rankTiers)+" / "+document.querySelector(".score-bonus-rules summary").innerText`));
ok("規則",(await ev(`return JSON.stringify(scoreBonusRules().rankTiers)`))==='[{"from":1,"to":1,"points":5},{"from":2,"to":3,"points":3},{"from":4,"to":5,"points":2}]');
console.log(await bar());
const p0=await pts();
await ev(`__confirms.length=0;scoreBonusAward(scoreContext.examId)`);console.log("confirm:",await ev(`return __confirms[0]`));
const p1=await pts();const diff=p1.map((v,i)=>v-p0[i]);console.log("diff",diff);
// 100(1)=5, 98,98(2)=3,3, 90(4)=2, 85,85(5並列)=2,2, 70(7)=0
ok("依名次發，同分同點",JSON.stringify(diff.slice(0,7))==="[5,3,3,2,2,2,0]",diff);
ok("已發完",(await bar()).includes("已發完點數"));
ok("紀錄原因",(await ev(`return state.pointLogs.filter(l=>l.source==="score_bonus").map(l=>l.reason).join("|")`)).includes("總分第 2 名 +3"),await ev(`return state.pointLogs.filter(l=>l.source==="score_bonus").map(l=>l.reason).join("|")`));
// 名次變動：第7名改成 99 → 他變第2名，98 兩位變第3名, 90 變第5, 85 變第6
await fill({[ids[6]]:{written:99,practical:99}});console.log(await bar());
await ev(`scoreBonusAward(scoreContext.examId)`);const p2=await pts();const tot=p2.map((v,i)=>v-p0[i]);console.log("total now",tot);
ok("名次變動補扣",JSON.stringify(tot.slice(0,7))==="[5,3,3,2,0,0,3]",tot);
// 錯誤輸入
await ev(`scoreBonusSetRankTier(0,"from","0")`);ok("名次錯誤提示",(await ev(`return __alerts.at(-1)`)).includes("1 以上"));
// 切回依分數：依分數規則還在
await ev(`scoreBonusSetMode("score")`);ok("切回依分數規則保留",(await ev(`return JSON.stringify(scoreBonusRules().tiers)`))==='[{"min":100,"points":5},{"min":95,"points":3}]');
console.log(await bar());
await ev(`scoreBonusSetMode("rank")`);await d.shot("rank");
await d.go();await ev(`hideDeviceLockWarning();document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500))`);
ok("重載保留",(await ev(`return scoreBonusRules().mode+scoreBonusRules().rankTiers.length`))==="rank3");
const P=await device("new.html",{w:820,h:1180});await P.ev(`hideDeviceLockWarning();state.scoreBonusRules={mode:"rank",rankTiers:[{from:1,to:1,points:5},{from:2,to:3,points:3}]};document.querySelector('.nav button[data-page="scores"]').click();await new Promise(r=>setTimeout(r,500));scoreAddExam("期中考");await new Promise(r=>setTimeout(r,300));document.querySelector(".score-bonus-rules").open=true;document.getElementById("scoreBonusBar").scrollIntoView()`);await P.shot("rank-ipad");
console.log("errs",d.errs,P.errs,"fails",fail);done(0);
