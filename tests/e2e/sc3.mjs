import {start,device,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},170000);
/* 建一個 24 人的班級並進入開始上課模式 */
const setup=`hideDeviceLockWarning?.();const base=state.students[0];const cls=state.classes.find(c=>state.enrollments.some(e=>e.classId===c.id&&e.studentId===base.id));classContext.classId=cls.id;
const names="王小明 李佳穎 陳柏宇 林雨晴 張家豪 黃子涵 吳承恩 劉欣妤 蔡宗翰 楊詩涵 許哲瑋 鄭雅婷 謝宇翔 郭芷若 洪偉傑 邱詠晴 曾子軒 廖品妍 賴冠廷 周心怡 葉柏翰".split(" ");
names.forEach((n,i)=>{const id="s"+i;state.students.push({...base,id,name:n,photo:"",photoUrl:""});state.enrollments.push({studentId:id,classId:cls.id});state.points[id]=i*3%40});
saveState();enterStartClassMode();await new Promise(r=>setTimeout(r,1500));hideDeviceLockWarning?.();return document.body.innerText.length`;
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
for(const [n,w,h] of [["land",1180,820],["port",820,1180]]){
const d=await device("new.html",{w,h});const ev=d.ev;await ev(setup);
await d.shot("v-"+n+"-0");
// 4. 深色/退出不重疊，同步列不蓋卡片
const r4=JSON.parse(await ev(`const r=e=>e&&e.getBoundingClientRect();const g=document.getElementById("themeToggleBtn");const ex=[...document.querySelectorAll(".v1529-head-actions button")].find(b=>b.innerText.includes("退出"));const sb=document.getElementById("syncStatusBar");const cards=[...document.querySelectorAll("[data-v1529-card]")].map(r);const s=r(sb);const hit=cards.some(c=>!(c.right<s.left||c.left>s.right||c.bottom<s.top||c.top>s.bottom));const e=r(ex);const top=document.elementFromPoint(e.left+e.width/2,e.top+e.height/2);return JSON.stringify({globalHidden:getComputedStyle(g).display==="none",exitOnTop:ex.contains(top),syncHitsCards:hit,sync:[s.left,s.top,s.width,s.height]})`));
console.log(n,r4);ok(n+" 全域深色按鈕隱藏",r4.globalHidden);ok(n+" 退出按鈕沒被擋",r4.exitOnTop);ok(n+" 同步列不蓋小卡",!r4.syncHitsCards);
// 1. 點小卡 → 面板在畫面內
const sid="s5";
await ev(`window.scrollTo(0,0);[...document.querySelectorAll("[data-v1529-card]")].find(e=>e.dataset.studentId==="${sid}").click();await new Promise(r=>setTimeout(r,500));return 1`);
const r1=JSON.parse(await ev(`const s=document.querySelector(".v1529-sheet");const b=s.getBoundingClientRect();return JSON.stringify({top:b.top,bottom:b.bottom,h:innerHeight,scrollY,title:s.querySelector(".v1529-drawer-title").innerText,fixed:getComputedStyle(s).position})`));
console.log(n,r1);ok(n+" 面板直接出現在畫面上",r1.fixed==="fixed"&&r1.top>0&&r1.top<r1.h*0.3&&Math.abs(r1.bottom-r1.h)<2&&r1.scrollY===0);
await d.shot("v-"+n+"-1");
// 面板裡捲到底按 +3，面板捲動位置保留
const r1b=JSON.parse(await ev(`const s=document.querySelector(".v1529-sheet");s.scrollTop=s.scrollHeight;await new Promise(r=>setTimeout(r,200));const before=s.scrollTop;const p0=st106Points("${sid}");const b=[...s.querySelectorAll("button")].find(b=>b.innerText.trim()==="+3 點");b.click();await new Promise(r=>setTimeout(r,300));const s2=document.querySelector(".v1529-sheet");return JSON.stringify({before,after:s2.scrollTop,dp:st106Points("${sid}")-p0,open:!!s2})`));
console.log(n,r1b);ok(n+" 面板內加 3 點後位置不跳",r1b.open&&r1b.dp===3&&Math.abs(r1b.after-r1b.before)<5,r1b);
await d.shot("v-"+n+"-2");
// 點暗處關閉
await ev(`document.querySelector(".v1529-sheet-backdrop").click();await new Promise(r=>setTimeout(r,300));return 1`);
ok(n+" 點暗處關閉",await ev(`return !document.querySelector(".v1529-sheet")&&!document.body.classList.contains("v1529-sheet-open")`));
// 2. 點數模式點小卡 +1
await ev(`st106SetMode("points");await new Promise(r=>setTimeout(r,300));return 1`);
const r2=JSON.parse(await ev(`const p0=st106Points("${sid}");const c=()=>[...document.querySelectorAll("[data-v1529-card]")].find(e=>e.dataset.studentId==="${sid}");c().click();await new Promise(r=>setTimeout(r,120));const fl=!!c().querySelector(".v1529-float");const t=[...document.querySelectorAll(".bt-toast")].map(x=>x.innerText);const p1=st106Points("${sid}");const shown=c().innerText.includes("🎁 "+p1);return JSON.stringify({dp:p1-p0,fl,t,shown,sheet:!!document.querySelector(".v1529-sheet")})`));
console.log(n,r2);ok(n+" 點小卡直接 +1",r2.dp===1&&r2.shown&&!r2.sheet,r2);ok(n+" 有 +1 動畫與提示",r2.fl&&r2.t.some(x=>x.includes("+1 點")&&x.includes("復原")),r2);
await d.shot("v-"+n+"-3");
const r2b=await ev(`const p0=st106Points("${sid}");[...document.querySelectorAll(".bt-toast-action")].pop().click();await new Promise(r=>setTimeout(r,200));return st106Points("${sid}")-p0`);
ok(n+" 復原 -1",r2b===-1,r2b);
ok(n+" ⋯ 打開面板",await ev(`[...document.querySelectorAll("[data-v1529-card]")].find(e=>e.dataset.studentId==="${sid}").querySelector(".v1529-more").click();await new Promise(r=>setTimeout(r,300));return document.querySelector(".v1529-sheet")?.dataset.sid==="${sid}"`));
await ev(`v1529ClearSelection();st106SetMode("xp");return 1`);
ok(n+" XP 模式點小卡開面板（不加點）",await ev(`const p0=st106Points("${sid}");[...document.querySelectorAll("[data-v1529-card]")].find(e=>e.dataset.studentId==="${sid}").click();await new Promise(r=>setTimeout(r,300));return !!document.querySelector(".v1529-sheet")&&st106Points("${sid}")===p0`));
await ev(`exitStartClassMode();await new Promise(r=>setTimeout(r,300));return 1`);
ok(n+" 退出後可捲動、再進來面板是關的",await ev(`const a=getComputedStyle(document.body).overflow!=="hidden"&&getComputedStyle(document.getElementById("themeToggleBtn")).display!=="none";enterStartClassMode();await new Promise(r=>setTimeout(r,500));return a&&!document.querySelector(".v1529-sheet")`));
console.log("errs",d.errs);await d.close();}
console.log("fails",fail);done(0);
