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
console.log("errs",d.errs,"fails",fail);done(fail?1:0);
