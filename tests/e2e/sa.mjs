import {start,device,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},170000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 建一個 24 人的班級並進入開始上課模式 */
const setup=`hideDeviceLockWarning?.();const base=state.students[0];const cls=state.classes.find(c=>state.enrollments.some(e=>e.classId===c.id&&e.studentId===base.id));classContext.classId=cls.id;
const names="王小明 李佳穎 陳柏宇 林雨晴 張家豪 黃子涵 吳承恩 劉欣妤 蔡宗翰 楊詩涵 許哲瑋 鄭雅婷 謝宇翔 郭芷若 洪偉傑 邱詠晴 曾子軒 廖品妍 賴冠廷 周心怡 葉柏翰".split(" ");
names.forEach((n,i)=>{const id="s"+i;state.students.push({...base,id,name:n,photo:"",photoUrl:""});state.enrollments.push({studentId:id,classId:cls.id});state.points[id]=i*3%40});
saveState();enterStartClassMode();await new Promise(r=>setTimeout(r,1500));hideDeviceLockWarning?.();return document.body.innerText.length`;
const d=await device("new.html",{w:1180,h:820});const ev=d.ev;await ev(setup);
const info=JSON.parse(await ev(`state.settings.attendPoint=2;
const ids=studentsByClass(classContext.classId).map(s=>s.id);window.__ids=ids;
window.__p0=Object.fromEntries(ids.map(id=>[id,st106Points(id)]));
st106SetAttendance(ids[1],"leave");await new Promise(r=>setTimeout(r,200));
const ui=id=>st106AttendanceMeta(id).uiValue;
return JSON.stringify({n:ids.length,none:ids.filter(id=>ui(id)==="none").length,leave:ui(ids[1])})`));
console.log(info);ok("一開始未點名、一位先請假",info.none===info.n-1&&info.leave==="leave",info);
await d.shot("att-0");
// 全班出席
const r1=JSON.parse(await ev(`const ids=__ids,ui=id=>st106AttendanceMeta(id).uiValue;const rc=window.__v1529.renderCount;
document.querySelector(".v1529-allpresent").click();await new Promise(r=>setTimeout(r,300));
const t=[...document.querySelectorAll(".bt-toast")].map(x=>x.innerText).join("|");
return JSON.stringify({renders:window.__v1529.renderCount-rc,arrived:ids.filter(id=>ui(id)==="arrived").length,leave:ui(ids[1]),
 pts:ids.filter(id=>id!==ids[1]).every(id=>st106Points(id)===__p0[id]+2),leavePts:st106Points(ids[1])===__p0[ids[1]],
 rec:state.attendance.filter(a=>a.classId===classContext.classId&&a.date===classContext.date&&a.status==="present").length,
 badge:document.querySelector(".v1529-head-right .badge").innerText,t,
 pills:[...document.querySelectorAll("[data-v1529-card] .v1529-att")].filter(p=>p.innerText.trim()==="出席"||p.innerText.trim()==="已到").length,
 classroom:attendanceStatus(ids[0],classContext.classId,classContext.date)})`));
console.log(r1);
ok("全班出席：未點名的都設為出席",r1.arrived===info.n-1&&r1.rec===info.n-1,r1);
ok("已請假的不動",r1.leave==="leave"&&r1.leavePts,r1);
ok("每人加出席點數",r1.pts,r1);
ok("只重畫一次",r1.renders<=2,r1.renders);
ok("到課人數與標籤",r1.badge.includes(`到課 ${info.n-1}／${info.n}`)&&r1.pills===info.n-1,r1);
ok("提示可復原",r1.t.includes(`已將 ${info.n-1} 位設為出席`)&&r1.t.includes("各 +2 點")&&r1.t.includes("復原"),r1.t);
ok("上課介面點名頁看到同一筆出席",r1.classroom==="present",r1.classroom);
await d.shot("att-1");
// 復原
const r2=JSON.parse(await ev(`const ids=__ids,ui=id=>st106AttendanceMeta(id).uiValue;[...document.querySelectorAll(".bt-toast-action")].pop().click();await new Promise(r=>setTimeout(r,300));
return JSON.stringify({none:ids.filter(id=>ui(id)==="none").length,leave:ui(ids[1]),pts:ids.every(id=>st106Points(id)===__p0[id])})`));
console.log(r2);ok("復原：回到未點名、點數扣回、請假的不動",r2.none===info.n-1&&r2.leave==="leave"&&r2.pts,r2);
// 再按一次全班出席，然後全部點過時再按
await ev(`document.querySelector(".v1529-allpresent").click();await new Promise(r=>setTimeout(r,200));return 1`);
const r3=await ev(`document.querySelectorAll(".bt-toast").forEach(t=>t.remove());document.querySelector(".v1529-allpresent").click();await new Promise(r=>setTimeout(r,200));return [...document.querySelectorAll(".bt-toast")].map(x=>x.innerText).join("|")`);
ok("全部點過再按：提示已點過",r3.includes("全班都已經點過名了"),r3);
// 點右上角切換：出席→遲到→請假→缺席→未到→出席
const r4=JSON.parse(await ev(`const id=__ids[0],ui=id=>st106AttendanceMeta(id).uiValue;const seq=[];const pts=[];
const pill=()=>[...document.querySelectorAll("[data-v1529-card]")].find(c=>c.dataset.studentId===id).querySelector(".v1529-att");
const sheet0=!!document.querySelector(".v1529-sheet");
for(let i=0;i<5;i++){pill().click();await new Promise(r=>setTimeout(r,120));seq.push(ui(id)+":"+pill().innerText.trim());pts.push(st106Points(id)-__p0[id]);}
return JSON.stringify({seq,pts,sheet:!!document.querySelector(".v1529-sheet")||sheet0,p:st106Points(id)-__p0[id]})`));
console.log(r4);
ok("點狀態依序切換",r4.seq.map(x=>x.split(":")[0]).join(">")==="late>leave>absent>none>arrived",r4.seq);
ok("切換時點數正確（離開出席扣回、回到出席再加）",JSON.stringify(r4.pts)==="[0,0,0,0,2]",r4.pts);
ok("點狀態不會打開面板或加點",!r4.sheet,r4);
// 點數模式下點狀態也不會 +1
const r5=await ev(`st106SetMode("points");await new Promise(r=>setTimeout(r,200));const id=__ids[2];const p=st106Points(id);
[...document.querySelectorAll("[data-v1529-card]")].find(c=>c.dataset.studentId===id).querySelector(".v1529-att").click();await new Promise(r=>setTimeout(r,200));
return st106AttendanceMeta(id).uiValue+" "+(st106Points(id)-p)`);
ok("點數模式點狀態只切換出席",r5==="late -2",r5);
await d.shot("att-2");
// 重新整理後保留
const before=await ev(`return JSON.stringify(__ids.map(id=>st106AttendanceMeta(id).uiValue))`);
await d.go();await ev(`hideDeviceLockWarning?.();classContext.classId=state.classes.find(c=>state.enrollments.some(e=>e.classId===c.id&&e.studentId==="s0")).id;enterStartClassMode();await new Promise(r=>setTimeout(r,800));return 1`);
const after=await ev(`const ids=studentsByClass(classContext.classId).map(s=>s.id);return JSON.stringify(ids.map(id=>st106AttendanceMeta(id).uiValue))`);
ok("重新整理後出席狀態保留",before===after,[before,after]);
console.log("errs",d.errs,"fails",fail);done(0);
