import {start,device,get} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},200000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 大動作前的自動備份：讀取雲端、還原雲端歷史、匯入、全部補扣之前都會存一份；
   動作完成的提示可以直接「復原」，設定中心 → 備份可以挑一份還原；最多保留 10 份 */
const W=`await new Promise(r=>setTimeout(r,`, E=`));`;
const toastUndo=`[...document.querySelectorAll(".bt-toast-action")].filter(b=>/復原/.test(b.innerText)).at(-1)`;
const A=await device("new.html",{w:1366,h:900}), B=await device("new.html",{w:1180,h:820});
await A.ev(`hideDeviceLockWarning?.();localStorage.setItem("bt_device_name","學校桌機");await firebaseUploadAll(true,true);`);
await B.ev(`hideDeviceLockWarning?.();await firebaseDownloadAll();${W}500${E}window.__s0=studentsByClass(classContext.classId)[0].id;`);

// 1. iPad 有還沒上傳的加點，卻按了讀取雲端（確認後蓋掉）→ 提示上有「復原」，按了回到讀取前
const b1=JSON.parse(await B.ev(`addPoints(__s0,7,"iPad 加點");${W}300${E}const before=state.points[__s0];
await firebaseDownloadAll();${W}800${E}const after=state.points[__s0];const btn=${toastUndo};const hasUndo=!!btn;
btn?.click();${W}1500${E}
return JSON.stringify({alerts:__alerts.slice(-3),confirms:__confirms.slice(-2).map(c=>c.slice(0,80)),pts:JSON.stringify(state.points).slice(0,200),before,after,hasUndo,restored:state.points[__s0],log:state.pointLogs.some(l=>l.reason==="iPad 加點"),dirty:syncStatus.dirty,s:document.getElementById("syncStatusBar").innerText.replace(/\\s+/g," ")})`));
console.log(b1);
ok("讀取雲端蓋掉了本機加點",b1.after===b1.before-7,b1);
ok("讀取成功的提示有「復原」",b1.hasUndo,b1);
ok("按復原回到讀取前，加點紀錄回來，標成尚未上傳",b1.restored===b1.before&&b1.log&&b1.dirty,b1);

// 2. 設定中心 → 備份：列出自動備份，原因寫清楚；從清單還原
const b2=JSON.parse(await B.ev(`document.querySelector('.nav button[data-page="settings"]').click();${W}400${E}settingsTab="backup";renderSettings();${W}1200${E}
const rows=[...document.querySelectorAll("#safetyBackupList .safety-row")].map(r=>r.innerText.replace(/\\s+/g," "));
return JSON.stringify({rows})`));
console.log(b2.rows);
ok("備份頁列出自動備份與原因",b2.rows.length>=3&&b2.rows.some(r=>/讀取雲端前/.test(r))&&b2.rows.some(r=>/還原自動備份前/.test(r))&&b2.rows.every(r=>/學生 \d+/.test(r)&&/還原這一份/.test(r)),b2);
// 最新一份是「還原自動備份前」＝讀取雲端後的資料（沒有 iPad 加點）
const b3=JSON.parse(await B.ev(`const row=document.querySelector("#safetyBackupList .safety-row");const reason=row.innerText;row.querySelector("button").click();${W}1500${E}
return JSON.stringify({reason,log:state.pointLogs.some(l=>l.reason==="iPad 加點"),confirm:__confirms.at(-1)||""})`));
ok("從清單還原：確認視窗列出目前和備份的內容，還原成功",/還原自動備份前/.test(b3.reason)&&!b3.log&&/目前資料：學生/.test(b3.confirm)&&/備份內容：學生/.test(b3.confirm),b3);

// 3. 還原雲端歷史版本、匯入備份檔之前也會備份
const key=Object.keys(get("battleSystem/historyIndex")||{}).sort().at(-1);
const b4=JSON.parse(await B.ev(`await restoreCloudHistory(${JSON.stringify(key)});${W}600${E}
const json=JSON.stringify({...state,students:[...state.students,{...state.students[0],id:"imp1",name:"匯入的學生"}]});
importBackup(new File([json],"b.json",{type:"application/json"}));${W}1500${E}
const list=await listSafetyBackupsAll();return JSON.stringify({reasons:list.map(b=>b.reason),imp:state.students.some(s=>s.name==="匯入的學生")})`));
ok("還原雲端歷史、匯入之前都有自動備份",b4.reasons.includes("before-cloud-history-restore")&&b4.reasons.includes("before-import")&&b4.imp,b4);

// 4. 全部補扣：提示上可以復原
const b5=JSON.parse(await B.ev(`const rw=(state.rewards||[]).find(r=>r.active!==false);state.points[__s0]=50;
state.redeemLogs.push({id:"u_sb1",studentId:__s0,rewardId:rw.id,rewardName:rw.name,cost:4,date:new Date().toISOString()});saveState();
redeemBackfillAll();${W}800${E}const mid=state.points[__s0];${toastUndo}?.click();${W}1500${E}
return JSON.stringify({mid,after:state.points[__s0],log:state.redeemLogs.find(l=>l.id==="u_sb1")})`));
ok("全部補扣後可以從提示復原",b5.mid===46&&b5.after===50&&!b5.log?.backfilled,b5);

// 5. 最多保留 10 份（最新的留下來）
const b6=JSON.parse(await B.ev(`for(let i=0;i<12;i++){await createLocalSafetyBackup("before-download-overwrite");${W}20${E}}
const list=await listSafetyBackupsAll();return JSON.stringify({n:list.length,sorted:list.every((b,i)=>!i||String(list[i-1].createdAt)>=String(b.createdAt))})`));
ok("最多保留 10 份，由新到舊",b6.n===10&&b6.sorted,b6);
await B.ev(`document.querySelector('.nav button[data-page="settings"]').click();${W}300${E}settingsTab="backup";renderSettings();${W}1000${E}document.getElementById("safetyBackupList").scrollIntoView({block:"start"});`);
await B.shot("sb-list");

console.log("errs",A.errs,B.errs,"fails",fail);done(fail||A.errs.length||B.errs.length?1:0);
