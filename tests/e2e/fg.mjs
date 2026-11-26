import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},150000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 忘帶紀錄：點名頁按鈕扣點／取消、常忘帶提醒、開始上課面板、統計排行期末整理、重新整理後保留 */
const d=await device("new.html",{w:1180,h:900});const ev=d.ev;
const ctx=`hideDeviceLockWarning?.();window.confirm=()=>true;`;
const info=JSON.parse(await ev(`${ctx}document.querySelector('[data-page="classroom"]').click();await new Promise(r=>setTimeout(r,500));
classroomTab="rollcall";render();await new Promise(r=>setTimeout(r,300));
const ids=[...document.querySelectorAll("[data-forgot-row]")].map(e=>e.dataset.forgotRow);
window.__a=ids[0];window.__b=ids[1];state.points[__a]=10;state.points[__b]=10;state.settings.attendPoint=1;saveState();render();
return JSON.stringify({rows:ids.length,cls:classContext.classId,date:classContext.date,term:classContext.termId,a:__a})`));
console.log(info);ok("點名卡片上有忘帶按鈕",info.rows>0,info);
const look=`const a=__a;const row=document.querySelector('[data-forgot-row="'+a+'"]');
return JSON.stringify({pts:state.points[a],logs:(state.forgotLogs||[]).filter(l=>l.studentId===a).length,
 on:[...row.querySelectorAll(".forgot-btn.on")].map(b=>b.dataset.forgotItem),pl:state.pointLogs.slice(-1)[0]?.reason,
 badge:row.closest(".student-card")?.querySelector(".forgot-badge")?.innerText||"",strip:document.querySelector(".forgot-strip")?.innerText||"",
 often:[...row.querySelectorAll(".forgot-btn.often")].map(b=>b.dataset.forgotItem),
 cnt:row.querySelector('[data-forgot-item="pencil"] .forgot-count')?.innerText||"",toast:[...document.querySelectorAll(".bt-toast")].map(t=>t.innerText).join("|")})`;
const click=item=>`document.querySelector('[data-forgot-row="'+__a+'"] [data-forgot-item="${item}"]').click();await new Promise(r=>setTimeout(r,300));`;
// 1. 按沒帶鉛筆盒
const r1=JSON.parse(await ev(`${click("pencil")}${look}`));console.log(r1);
ok("沒帶鉛筆盒：扣 1 點、留下紀錄、按鈕亮起",r1.pts===9&&r1.logs===1&&JSON.stringify(r1.on)==='["pencil"]'&&r1.pl==="沒帶鉛筆盒",r1);
ok("提示本學期第幾次",r1.toast.includes("本學期第 1 次")&&r1.cnt.includes("1 次"),r1);
// 2. 再按一次取消
const r2=JSON.parse(await ev(`${click("pencil")}${look}`));
ok("再按一次取消：點數加回、紀錄移除",r2.pts===10&&r2.logs===0&&r2.on.length===0&&r2.pl==="取消：沒帶鉛筆盒",r2);
// 3. 復原按鈕
const r3=JSON.parse(await ev(`${click("folder")}const btn=[...document.querySelectorAll(".bt-toast button")].pop();btn?.click();await new Promise(r=>setTimeout(r,300));${look}`));
ok("提示上的復原會取消紀錄並加回點數",r3.pts===10&&r3.logs===0,r3);
// 4. 本學期已有 3 次 → 常忘帶提醒
const r4=JSON.parse(await ev(`["2026-10-01","2026-10-08","2026-10-15"].forEach((dt,i)=>state.forgotLogs.push({id:"old"+i,studentId:__a,classId:classContext.classId,termId:classContext.termId,date:dt,item:"pencil",points:1}));
saveState();render();await new Promise(r=>setTimeout(r,200));${look}`));console.log(r4);
await ev(`document.querySelector(".forgot-strip")?.scrollIntoView();return 1`);await d.shot("fg-rollcall");
ok("本學期 3 次：卡片標記、上方提醒、按鈕變紅",r4.badge.includes("3")&&r4.strip.includes("鉛筆盒 3")&&JSON.stringify(r4.often)==='["pencil"]'&&r4.cnt.includes("3 次"),r4);
// 5. 設定扣點：譜不見扣 2
const r5=JSON.parse(await ev(`state.settings.forgotPoints={score:2};saveState();render();await new Promise(r=>setTimeout(r,200));${click("score")}${look}`));
ok("設定中心的扣點數生效（譜不見 -2）",r5.pts===8&&r5.pl==="譜不見",r5);
const r5b=JSON.parse(await ev(`document.querySelector('[data-page="settings"]').click();await new Promise(r=>setTimeout(r,500));
return JSON.stringify({n:document.querySelectorAll(".forgot-settings input").length,v:[...document.querySelectorAll(".forgot-settings input")].map(i=>i.value)})`));
ok("設定中心有三項扣點與提醒次數",r5b.n===4&&JSON.stringify(r5b.v)==='["1","1","2","3"]',r5b);
// 6. 開始上課：卡片標記、詳細面板裡可以按
const r6=JSON.parse(await ev(`${ctx}document.querySelector('[data-page="classroom"]').click();await new Promise(r=>setTimeout(r,400));enterStartClassMode();await new Promise(r=>setTimeout(r,1500));hideDeviceLockWarning?.();
const card=[...document.querySelectorAll("[data-v1529-card]")].find(c=>c.dataset.studentId===__a);const badge=card?.querySelector(".forgot-badge")?.innerText||"";
v1529SelectStudent(__a);await new Promise(r=>setTimeout(r,300));
const sheetRow=document.querySelector('.v1529-sheet [data-forgot-row="'+__a+'"]');const onBefore=[...sheetRow.querySelectorAll(".forgot-btn.on")].map(b=>b.dataset.forgotItem);
sheetRow.querySelector('[data-forgot-item="folder"]').click();await new Promise(r=>setTimeout(r,400));
const row2=document.querySelector('.v1529-sheet [data-forgot-row="'+__a+'"]');
return JSON.stringify({badge,onBefore,sheetOpen:!!document.querySelector(".v1529-sheet"),on:[...(row2?.querySelectorAll(".forgot-btn.on")||[])].map(b=>b.dataset.forgotItem).sort(),pts:state.points[__a]})`));
console.log(r6);await d.shot("fg-sheet");await ev(`v1529ClearSelection();await new Promise(r=>setTimeout(r,300));return 1`);await d.shot("fg-cards");
ok("開始上課卡片上有常忘帶標記",r6.badge.includes("3"),r6);
ok("開始上課詳細面板可以記錄，面板保持開著",JSON.stringify(r6.onBefore)==='["score"]'&&r6.sheetOpen&&JSON.stringify(r6.on)==='["folder","score"]'&&r6.pts===7,r6);
// 7. 統計排行：忘帶統計
const r7=JSON.parse(await ev(`exitStartClassMode();await new Promise(r=>setTimeout(r,400));statsScope="class";statsClassId=classContext.classId;statsTab="forgot";
document.querySelector('[data-page="stats"]').click();await new Promise(r=>setTimeout(r,500));
const t=document.getElementById("forgotStatsTable");const name=state.students.find(s=>s.id===__a).name;
const row=[...(t?.rows||[])].find(r=>r.innerText.includes(name));
return JSON.stringify({head:t?.rows[0].innerText.replace(/\\s+/g," ")||"",row:row?[...row.cells].map(c=>c.innerText.trim()):null,rows:t?.rows.length||0,note:document.querySelector(".forgot-stats .note")?.innerText||""})`));
console.log(r7);await d.shot("fg-stats");
ok("忘帶統計表：各項次數、合計、扣點、日期",r7.row&&r7.row[2]==="1"&&r7.row[3]==="3"&&r7.row[4]==="1"&&r7.row[5]==="5"&&r7.row[6]==="-6"&&r7.row[7].includes("10-01"),r7);
ok("只列有紀錄的學生並附總計說明",r7.rows===2&&r7.note.includes("1 位有忘帶紀錄"),r7);
// 8. 重新整理後保留
await new Promise(r=>setTimeout(r,800));await d.go();
const r8=JSON.parse(await ev(`${ctx}window.__a=${JSON.stringify(info.a)};return JSON.stringify({logs:(state.forgotLogs||[]).filter(l=>l.studentId===__a).length,pts:state.points[__a]})`));
ok("重新整理後紀錄與點數保留",r8.logs===5&&r8.pts===7,r8);
console.log("errs",d.errs,"fails",fail);done(fail?1:0);
