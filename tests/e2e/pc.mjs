import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},150000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 期末小卡：從學期摘要列印，一位學生一張；「老師的話」可先修改；列印時只印小卡、一頁兩欄
   每月提醒下載備份檔：超過 30 天（或從沒下載）才提醒；下載後、下週再說都會收起；其他提醒優先 */
const W=`await new Promise(r=>setTimeout(r,`, E=`));`;
const d=await device("new.html",{w:1366,h:900});
const seed=`hideDeviceLockWarning?.();
const cid=classContext.classId, st=studentsByClass(cid), s0=st[0].id, term=classContext.termId, iso=new Date().toISOString();
window.__s0=s0;window.__n=st.length;
state.attendance=state.attendance.filter(a=>a.studentId!==s0);
const att=(date,status)=>state.attendance.push({id:makeId(),studentId:s0,classId:cid,date,status,pointValue:1});
att("2026-09-01","present");att("2026-09-08","present");att("2026-09-15","present");att("2026-09-22","late");att("2026-09-29","absent");
state.pointLogs=state.pointLogs.filter(l=>l.studentId!==s0);
state.pointLogs.push({id:makeId(),studentId:s0,amount:5,reason:"a",date:iso},{id:makeId(),studentId:s0,amount:2,reason:"b",date:iso});
state.growthLogs=state.growthLogs.filter(l=>l.studentId!==s0);
state.growthLogs.push({id:makeId(),studentId:s0,termId:term,date:iso,type:"attitude",xp:15,feedback:"吹得很穩"});
state.examLogs.push({id:"e1",studentId:s0,type:"pass",date:iso});
saveState();statsScope="class";statsClassId=cid;document.querySelector('.nav button[data-page="stats"]').click();${W}400${E}statsTab="summary";render();${W}400${E}`;
const cardOf=`[...document.querySelectorAll("#termCardsView .term-card")].find(c=>c.dataset.sid===__s0)`;

// 1. 學期摘要 →「列印期末小卡」
const c1=JSON.parse(await d.ev(`${seed}
[...document.querySelectorAll(".term-summary button")].find(b=>/列印期末小卡/.test(b.innerText)).click();${W}400${E}
const c=${cardOf};return JSON.stringify({n:document.querySelectorAll("#termCardsView .term-card").length,want:__n,text:c?.innerText.replace(/\\s+/g," "),words:c?.querySelector(".term-card-words").innerText,
name:findById(state.students,__s0).name,level:levelLabel(findById(state.students,__s0)),open:document.body.classList.contains("term-cards-open")})`));
console.log(c1);
ok("一位學生一張小卡",c1.open&&c1.n===c1.want,c1);
ok("小卡列出姓名、等級與升級次數",c1.text.includes(c1.name)&&c1.text.includes(c1.level)&&/這學期升級 1 次/.test(c1.text),c1);
ok("出席：出席 3 次、遲到 1 次、缺席 1 次（共 5 堂，出席率 60%）",/出席 3 次、遲到 1 次、缺席 1 次（共 5 堂，出席率 60%）/.test(c1.text),c1);
ok("成長：累積 15 XP｜獲得 7 點；老師的話帶入回饋",/累積 15 XP｜獲得 7 點/.test(c1.text)&&c1.words==="吹得很穩",c1);

// 2. 修改「老師的話」：關掉再打開還在，成長日誌沒有被改
const c2=JSON.parse(await d.ev(`const w=${cardOf}.querySelector(".term-card-words");w.innerText="這學期進步很多，繼續加油！";w.dispatchEvent(new Event("input",{bubbles:true}));
closeTermCards();${W}200${E}const closed=!document.getElementById("termCardsView")&&!document.body.classList.contains("term-cards-open");openTermCards();${W}300${E}
return JSON.stringify({closed,words:${cardOf}.querySelector(".term-card-words").innerText,log:state.growthLogs.find(l=>l.studentId===__s0).feedback})`));
ok("修改老師的話：關閉再打開還在，成長日誌不變",c2.closed&&c2.words==="這學期進步很多，繼續加油！"&&c2.log==="吹得很穩",c2);
await d.shot("pc-cards");

// 3. 列印版面：只印小卡、工具列不印、一頁兩欄
await d.send("Emulation.setEmulatedMedia",{media:"print"});
const c3=JSON.parse(await d.ev(`const others=[...document.body.children].filter(e=>e.id!=="termCardsView"&&e.tagName!=="SCRIPT");
const grid=getComputedStyle(document.querySelector("#termCardsView .term-cards")).gridTemplateColumns.split(" ").length;
return JSON.stringify({hidden:others.every(e=>getComputedStyle(e).display==="none"),bar:getComputedStyle(document.querySelector(".term-cards-toolbar")).display,grid,pos:getComputedStyle(document.getElementById("termCardsView")).position})`));
ok("列印時只印小卡、工具列不印、兩欄",c3.hidden&&c3.bar==="none"&&c3.grid===2&&c3.pos==="static",c3);
await d.send("Emulation.setEmulatedMedia",{media:""});
await d.ev(`closeTermCards();`);

// 4. iPad 直立：小卡畫面不撐寬
const p=await device("new.html",{w:820,h:1180});
const c4=JSON.parse(await p.ev(`${seed}openTermCards();${W}400${E}const v=document.getElementById("termCardsView");
return JSON.stringify({n:v.querySelectorAll(".term-card").length,wide:v.scrollWidth>v.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1})`));
ok("iPad 直立：小卡不超出畫面",c4.n>0&&!c4.wide,c4);
await p.shot("pc-cards-ipad");

// 5. 備份檔提醒：從沒下載 → 畫面空下來時提醒
const b1=JSON.parse(await d.ev(`await firebaseUploadAll(true,true);hideUploadReminder();dismissCloudNewerNotice?.();state.backupMeta.lastExportAt="";localStorage.removeItem("bt_backup_file_snooze_until");
scheduleBackupFileReminder(300);${W}1000${E}return JSON.stringify({t:(document.getElementById("backupFileReminderBox")?.innerText||"").replace(/\\s+/g," ")})`));
ok("從沒下載過：提醒「還沒有下載過備份檔」",/還沒有下載過備份檔/.test(b1.t)&&/下載備份檔/.test(b1.t)&&/下週再說/.test(b1.t),b1);

// 6. 按「下載備份檔」：真的下載、記錄時間、提醒收起；網址不會立刻失效（iPad Safari 才下載得到）
const b2=JSON.parse(await d.ev(`const got=[];const oc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){got.push({name:this.download,href:this.href,inDom:document.body.contains(this)})};
const rv=[];const orv=URL.revokeObjectURL;URL.revokeObjectURL=u=>rv.push(u);
[...document.querySelectorAll("#backupFileReminderBox button")].find(b=>/下載備份檔/.test(b.innerText)).click();${W}300${E}
HTMLAnchorElement.prototype.click=oc;URL.revokeObjectURL=orv;
return JSON.stringify({got,rv:rv.length,days:backupFileDaysAgo(),box:!!document.getElementById("backupFileReminderBox"),toast:[...document.querySelectorAll(".bt-toast,.toast")].map(t=>t.innerText).join("|"),due:backupFileReminderDue(),dirty:syncStatus.dirty})`));
ok("下載備份檔：檔名正確、提醒收起、30 天內不再提醒",b2.got.length===1&&/^教學系統備份_\d{4}-\d{2}-\d{2}\.json$/.test(b2.got[0].name)&&b2.got[0].inDom&&b2.days===0&&!b2.box&&!b2.due,b2);
ok("下載網址不會立刻失效；下載不算成「尚未上傳」",b2.rv===0&&!b2.dirty,b2);

// 7. 上次下載 40 天前 → 提醒寫天數；10 天前不提醒；「下週再說」7 天內不提醒
const b3=JSON.parse(await d.ev(`state.backupMeta.lastExportAt=new Date(Date.now()-40*86400000).toISOString();const shown=showBackupFileReminder();const t=document.getElementById("backupFileReminderBox")?.innerText||"";
[...document.querySelectorAll("#backupFileReminderBox button")].find(b=>/下週再說/.test(b.innerText)).click();
const snooze=Number(localStorage.getItem("bt_backup_file_snooze_until"))-Date.now();const again=showBackupFileReminder();
localStorage.removeItem("bt_backup_file_snooze_until");state.backupMeta.lastExportAt=new Date(Date.now()-10*86400000).toISOString();const ten=showBackupFileReminder();
return JSON.stringify({shown,t,snoozeDays:Math.round(snooze/86400000),again,ten,box:!!document.getElementById("backupFileReminderBox")})`));
ok("40 天前：提醒「上次下載備份檔是 40 天前」",b3.shown&&/40 天前/.test(b3.t),b3);
ok("下週再說：7 天內不提醒；10 天前下載過不提醒",b3.snoozeDays===7&&!b3.again&&!b3.ten&&!b3.box,b3);

// 8. 其他提醒優先：未上傳提醒出現時，備份提醒先讓開，之後再排；上課中不提醒
const b4=JSON.parse(await d.ev(`state.backupMeta.lastExportAt="";const s1=showBackupFileReminder();showUploadReminder("測試");
const r={s1,backup:!!document.getElementById("backupFileReminderBox"),upload:!!document.getElementById("uploadReminderBox"),again:showBackupFileReminder()};hideUploadReminder();
enterStartClassMode();${W}1200${E}hideDeviceLockWarning?.();r.inClass=showBackupFileReminder();exitStartClassMode();${W}600${E}return JSON.stringify(r)`));
ok("未上傳提醒出現時備份提醒讓開，不疊在一起",b4.s1&&!b4.backup&&b4.upload&&!b4.again,b4);
ok("上課中不跳備份提醒",!b4.inClass,b4);

// 9. 設定中心 → 備份的說明與按鈕
const b5=JSON.parse(await d.ev(`document.querySelector('.nav button[data-page="settings"]').click();${W}400${E}settingsTab="backup";renderSettings();${W}800${E}return JSON.stringify({t:document.getElementById("settingsBody").innerText.replace(/\\s+/g," ")})`));
ok("備份頁：每個月下載一份的說明與「下載備份檔」按鈕",/建議每個月下載一份/.test(b5.t)&&/下載備份檔（JSON）/.test(b5.t),b5.t.slice(0,300));

console.log("errs",d.errs,p.errs,"fails",fail);done(fail||d.errs.length||p.errs.length?1:0);
