import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},120000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 學期摘要：每位學生的出席、點數進出、XP、忘帶、兌換、升級、老師回饋，只算選定學期；可以複製成表格 */
const W=`await new Promise(r=>setTimeout(r,`, E=`));`;
const d=await device("new.html",{w:1366,h:900});
const r=JSON.parse(await d.ev(`hideDeviceLockWarning?.();
const cid=classContext.classId, st=studentsByClass(cid), s0=st[0].id, term=classContext.termId;
const t=today(), iso=new Date().toISOString(), old="2025-03-03";
const att=(date,status)=>state.attendance.push({id:makeId(),studentId:s0,classId:cid,date,status,pointValue:1});
att("2026-09-01","present");att("2026-09-08","present");att("2026-09-15","present");att("2026-09-22","late");att("2026-09-29","absent");att(old,"absent");
state.pointLogs=state.pointLogs.filter(l=>l.studentId!==s0);
state.pointLogs.push({id:makeId(),studentId:s0,amount:5,reason:"a",date:iso},{id:makeId(),studentId:s0,amount:2,reason:"b",date:iso},{id:makeId(),studentId:s0,amount:-3,reason:"兌換：貼紙",date:iso},{id:makeId(),studentId:s0,amount:100,reason:"舊學期",date:old+"T02:00:00.000Z"});
state.points[s0]=42;
state.growthLogs.push({id:makeId(),studentId:s0,termId:term,date:iso,type:"attitude",xp:10,feedback:"吹得很穩"},{id:makeId(),studentId:s0,termId:term,date:iso,type:"attitude",xp:5,feedback:"開始上課即時記錄：專注"},{id:makeId(),studentId:s0,termId:"113-2",date:old,type:"attitude",xp:99,feedback:"舊學期回饋"});
state.forgotLogs=[{id:"f1",studentId:s0,classId:cid,termId:term,date:t,item:"pencil",points:1,at:iso},{id:"f2",studentId:s0,classId:cid,termId:term,date:t,item:"score",points:1,at:iso}];
state.redeemLogs.push({id:"r1",studentId:s0,rewardName:"貼紙",cost:3,date:iso,deducted:true});
state.examLogs.push({id:"e1",studentId:s0,type:"pass",date:iso});
saveState();
statsScope="class";statsClassId=cid;currentPage="stats";document.querySelector('.nav button[data-page="stats"]').click();${W}400${E}
[...document.querySelectorAll(".tabs button")].find(b=>/學期摘要/.test(b.innerText)).click();${W}400${E}
const tb=document.getElementById("termSummaryTable");
const head=[...tb.rows[0].cells].map(c=>c.innerText.trim());
const row=[...tb.rows].find(tr=>tr.cells[0].innerText.trim()===findById(state.students,s0).name);
const cell=h=>row.cells[head.indexOf(h)].innerText.trim();
let copied="";navigator.clipboard.writeText=async x=>{copied=x};tableCopy("termSummaryTable");${W}200${E}
return JSON.stringify({rows:tb.rows.length-1,n:st.length,rate:cell("出席率"),present:cell("出席"),late:cell("遲到"),absent:cell("缺席"),earned:cell("獲得點數"),spent:cell("使用點數"),bal:cell("目前點數"),xp:cell("XP"),forgot:cell("忘帶"),redeem:cell("兌換"),pass:cell("升級"),fb:cell("老師回饋（最近 3 則）"),
copiedLines:copied.split("\\n").length,copiedHead:copied.split("\\n")[0],note:document.querySelector(".term-summary .note").innerText})`));
console.log(r);
ok("每位學生一列",r.rows===r.n,r);
ok("出席：3/5、遲到 1、缺席 1、出席率 60%（舊學期不算）",r.present==="3/5"&&r.late==="1"&&r.absent==="1"&&r.rate==="60%",r);
ok("點數：獲得 +7、使用 -3、目前 42（舊學期 +100 不算）",r.earned==="+7"&&r.spent==="-3"&&r.bal==="42",r);
ok("XP 15（舊學期 99 不算）",r.xp==="15",r);
ok("忘帶 2、兌換 1（貼紙）、升級 1",r.forgot==="2"&&r.redeem==="1（貼紙）"&&r.pass==="1",r);
ok("老師回饋只列真正的回饋",r.fb==="吹得很穩",r);
ok("複製表格：標題列加每位學生",r.copiedLines===r.n+1&&/^學生\t班級\t出席率/.test(r.copiedHead),r);
// 換學期：選舊學期只看到舊資料
const r2=JSON.parse(await d.ev(`const sel=document.querySelector(".term-summary select");const opt=[...sel.options].find(o=>o.value!==sel.value);
if(!opt) return JSON.stringify({skip:true});sel.value=opt.value;sel.dispatchEvent(new Event("change"));${W}400${E}
const tb=document.getElementById("termSummaryTable");return JSON.stringify({term:opt.value,text:tb.innerText})`));
ok("換學期後重新計算",r2.skip||!/吹得很穩/.test(r2.text),r2);
await d.ev(`termSummaryTermId="";render();${W}300${E}document.querySelector(".term-summary").scrollIntoView({block:"start"})`);
await d.shot("ts-summary");
const p=await device("new.html",{w:820,h:1180});
const r3=JSON.parse(await p.ev(`hideDeviceLockWarning?.();document.querySelector('.nav button[data-page="stats"]').click();${W}400${E}statsTab="summary";render();${W}400${E}
const w=document.querySelector(".term-summary-wrap");return JSON.stringify({page:document.documentElement.scrollWidth<=innerWidth+1,wrapScroll:w.scrollWidth>w.clientWidth})`));
ok("iPad 直立：表格在框內左右滑，整頁不會被撐寬",r3.page,r3);
console.log("errs",d.errs,p.errs,"fails",fail);done(fail||d.errs.length||p.errs.length?1:0);
