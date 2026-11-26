import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},150000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 獎品商店兌換：要扣點數、重新整理後保留；取消兌換加回點數（修正前沒扣點的舊紀錄不加回） */
const d=await device("new.html",{w:1180,h:900});const ev=d.ev;
const info=JSON.parse(await ev(`hideDeviceLockWarning?.();window.confirm=()=>true;window.__al=[];window.alert=m=>__al.push(String(m));
document.querySelector('[data-page="rewards"]').click();await new Promise(r=>setTimeout(r,600));rewardTabMode='shop';renderRewards();
const sid=RewardCore.selectedStudentId();state.points[sid]=20;saveState();renderRewards();await new Promise(r=>setTimeout(r,200));
const rw=state.rewards[0];window.__sid=sid;window.__rw=rw.id;
return JSON.stringify({sid,rw:rw.id,price:RewardCore.discountInfo(rw).price,stock:rw.stock,logs:state.redeemLogs.length})`));
console.log(info);
const look=`const sid=__sid;return JSON.stringify({pts:state.points[sid],disp:document.querySelector(".reward-student-points")?.innerText||"",stock:state.rewards.find(r=>r.id===__rw)?.stock,
 logs:state.redeemLogs.filter(l=>l.studentId===sid).length,pl:(state.pointLogs||[]).filter(l=>l.studentId===sid).slice(-1)[0]?.reason||"",al:__al.slice(-1)[0]||"",toast:[...document.querySelectorAll(".bt-toast")].map(t=>t.innerText).join("|")})`;
// 1. 用畫面上的按鈕兌換
const r1=JSON.parse(await ev(`const b=[...document.querySelectorAll(".reward-redeem-button.can")].find(b=>b.getAttribute("onclick").includes(__rw));b.click();await new Promise(r=>setTimeout(r,400));${look}`));
console.log(r1);
ok("兌換後扣點數",r1.pts===20-info.price,r1);
ok("畫面上的目前點數同步更新",r1.disp.includes(String(20-info.price)),r1);
ok("庫存減 1、留下兌換紀錄與點數紀錄",r1.stock===info.stock-1&&r1.logs===1&&r1.pl.startsWith("兌換："),r1);
ok("提示兌換完成",r1.toast.includes("兌換完成"),r1);
// 2. 重新整理後保留
await new Promise(r=>setTimeout(r,800));await d.go();
const ctx=`window.__sid=${JSON.stringify(info.sid)};window.__rw=${JSON.stringify(info.rw)};hideDeviceLockWarning?.();window.confirm=()=>true;window.__al=[];window.alert=m=>__al.push(String(m));`;
const r2=JSON.parse(await ev(`${ctx}return JSON.stringify({pts:state.points[__sid],logs:state.redeemLogs.filter(l=>l.studentId===__sid).length})`));
ok("重新整理後點數仍是扣過的",r2.pts===20-info.price&&r2.logs===1,r2);
// 3. 取消兌換：加回點數與庫存
const r3=JSON.parse(await ev(`${ctx}
const log=state.redeemLogs.find(l=>l.studentId===__sid);RewardCore.cancelRedeem(log.id);await new Promise(r=>setTimeout(r,300));${look}`));
ok("取消兌換：點數與庫存加回",r3.pts===20&&r3.stock===info.stock&&r3.logs===0,r3);
// 4. 修正前留下的舊紀錄（沒扣過點）取消時不加點
const r4=JSON.parse(await ev(`state.redeemLogs.push({id:"old1",studentId:__sid,rewardId:__rw,rewardName:"舊獎品",cost:5,date:"2026-11-01"});
RewardCore.cancelRedeem("old1");await new Promise(r=>setTimeout(r,300));${look}`));
ok("舊的未扣點紀錄取消時不多加點",r4.pts===20&&r4.logs===0,r4);
// 5. 點數不足不能兌換
const r5=JSON.parse(await ev(`state.points[__sid]=1;RewardCore.redeem(__rw);await new Promise(r=>setTimeout(r,200));${look}`));
ok("點數不足擋下且不扣點",r5.pts===1&&r5.al.includes("點數不足")&&r5.logs===0,r5);
// 6. 未扣點清單：只列出沒扣到點的兌換；舊流程有扣點（有「兌換：」點數紀錄）的不列，取消時要加回
const r6=JSON.parse(await ev(`state.points[__sid]=30;const sid2=state.students.find(s=>s.id!==__sid).id;state.points[sid2]=7;
state.redeemLogs.push({id:"u1",studentId:__sid,rewardId:__rw,rewardName:"糖果",cost:5,date:"2026-10-01T10:00"},
 {id:"u2",studentId:__sid,rewardId:__rw,rewardName:"貼紙",cost:3,date:"2026-10-02T10:00"},
 {id:"u3",studentId:sid2,rewardId:__rw,rewardName:"糖果",cost:5,date:"2026-10-03T10:00"},
 {id:"k1",studentId:__sid,rewardId:__rw,rewardName:"糖果",cost:5,date:"2026-09-01T10:00"});
state.pointLogs.push({id:"pk1",studentId:__sid,amount:-5,reason:"兌換：糖果",date:"2026-09-01T10:00"});
saveState();rewardTabMode="logs";renderRewards();await new Promise(r=>setTimeout(r,200));
const a=redeemDeductionAudit();const box=document.querySelector(".redeem-audit");
const res={ids:[...a.ids].sort(),total:a.total,stu:a.students.map(g=>g.total),box:box?.innerText||"",tags:[...document.querySelectorAll(".redeem-audit-tag")].length,
 p1:state.points[__sid],p2:state.points[sid2]};
RewardCore.cancelRedeem("k1");await new Promise(r=>setTimeout(r,300));res.afterK1=state.points[__sid];
RewardCore.cancelRedeem("u1");await new Promise(r=>setTimeout(r,300));res.afterU1=state.points[__sid];
rewardTabMode="logs";renderRewards();res.left=[...redeemDeductionAudit().ids].sort();
return JSON.stringify(res)`));
console.log(r6);await ev(`window.scrollTo(0,0);document.querySelector(".redeem-audit")?.scrollIntoView();return 1`);await d.shot("rd-audit");
ok("清單只列出沒扣到點的兌換",JSON.stringify(r6.ids)==='["u1","u2","u3"]'&&r6.total===13&&JSON.stringify(r6.stu)==="[8,5]",r6);
ok("畫面顯示清單與標記，且說明只列出不改點",r6.box.includes("少扣 8 點")&&r6.box.includes("少扣 5 點")&&r6.box.includes("不會改任何點數")&&r6.tags===3,r6);
ok("看清單不會改點數",r6.p1===30&&r6.p2===7,r6);
ok("舊流程有扣過點的兌換，取消時加回",r6.afterK1===35,r6);
ok("沒扣到點的兌換，取消時不加回",r6.afterU1===35&&JSON.stringify(r6.left)==='["u2","u3"]',r6);
console.log("errs",d.errs,"fails",fail);done(fail?1:0);
