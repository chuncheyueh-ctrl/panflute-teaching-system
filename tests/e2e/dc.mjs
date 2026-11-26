import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},120000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 換日：App 一直開著（iPad 常見）到隔天，開始上課的日期要跟著換成今天，才看得到今天別台點的出席；使用者自己選的日期不動 */
const d=await device("new.html",{w:1180,h:820});const ev=d.ev;
const shift=`window.__RD=window.__RD||Date;window.__off=(window.__off||0)+86400000;
window.Date=class extends __RD{constructor(...a){a.length?super(...a):super(__RD.now()+__off)} static now(){return __RD.now()+__off}};`;
const wake=`document.dispatchEvent(new Event("visibilitychange"));await new Promise(r=>setTimeout(r,500));`;
// 1. 第一天進開始上課
const r0=JSON.parse(await ev(`hideDeviceLockWarning?.();enterStartClassMode();await new Promise(r=>setTimeout(r,1200));hideDeviceLockWarning?.();
const ids=studentsByClass(classContext.classId).map(s=>s.id);window.__ids=ids;window.__cls=classContext.classId;
return JSON.stringify({day1:classContext.date,n:ids.length})`));
console.log(r0);
// 2. 隔天：別台點了全班出席（讀取雲端後資料進到這台），iPad 從背景回來
const r1=JSON.parse(await ev(`${shift}const t=today();
__ids.forEach(id=>state.attendance.push({id:"x"+id,studentId:id,classId:__cls,date:t,status:"present",pointValue:1}));saveState();
const ui=()=>__ids.filter(id=>st106AttendanceMeta(id).uiValue==="arrived").length;
renderStartClassMode();await new Promise(r=>setTimeout(r,300));const before={date:classContext.date,arrived:ui()};
${wake}
const pills=[...document.querySelectorAll("[data-v1529-card] .v1529-att")].filter(p=>/出席|已到/.test(p.innerText)).length;
return JSON.stringify({today:t,before,after:classContext.date,arrived:ui(),pills,inClass:!!startClassMode})`));
console.log(r1);
ok("換日前還停在昨天（重現問題）",r1.before.date===r0.day1&&r1.before.arrived===0,r1);
ok("回到前景後日期換成今天",r1.after===r1.today&&r1.today!==r0.day1,r1);
ok("換日後看得到今天別台點的出席，畫面也更新",r1.arrived===r0.n&&r1.pills===r0.n&&r1.inClass,r1);
// 3. 不切到背景，只靠定時檢查也會換日
const r2=JSON.parse(await ev(`${shift}await new Promise(r=>setTimeout(r,11000));return JSON.stringify({today:today(),date:classContext.date})`));
ok("定時檢查也會換日",r2.date===r2.today,r2);
// 4. 使用者自己選了別的日期：換日不動
const r3=JSON.parse(await ev(`classContext.date="2026-10-01";${shift}${wake}return JSON.stringify({today:today(),date:classContext.date})`));
ok("自己選的日期不會被換掉",r3.date==="2026-10-01",r3);
console.log("errs",d.errs,"fails",fail);done(fail?1:0);
