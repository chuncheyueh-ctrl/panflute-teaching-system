import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},180000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 下課提醒上傳、本機資料保護：
   - 離開上課模式時還有沒上傳的變更 → 提醒一次（沒有變更、已經上傳過就不提醒；上課中不跳）
   - 太久（3 天以上）沒上傳 → 打開網頁、回到前景時加強提醒
   - 設定中心 → 備份：顯示保留資料狀態；iPad 用 Safari 分頁時建議加入主畫面 */
const W=`await new Promise(r=>setTimeout(r,`, E=`));`;
const box=`(document.getElementById("uploadReminderBox")?.innerText||"").replace(/\\s+/g," ")`;
const P=await device("new.html",{w:1366,h:900});
await P.ev(`hideDeviceLockWarning?.();await firebaseUploadAll(true,true);${W}500${E}hideUploadReminder();`);

// 1. 上課中改了資料，按「退出」→ 下課提醒；上課中不會跳
const p1=JSON.parse(await P.ev(`enterStartClassMode();${W}1200${E}hideDeviceLockWarning?.();v1529AllPresent();${W}2000${E}
const during=${box};const dirty=syncStatus.dirty;
[...document.querySelectorAll("button")].find(b=>b.innerText.trim()==="退出").click();${W}1800${E}
return JSON.stringify({during,dirty,inClass:document.body.classList.contains("start-class-mode"),after:${box}})`));
ok("上課中改了資料，提醒不會在上課畫面跳出",p1.dirty&&!/下課了/.test(p1.during),p1);
ok("退出上課模式後提醒「下課了！這堂課有 N 筆變更還沒上傳」",!p1.inClass&&/下課了！這堂課有 \d+ 筆變更還沒上傳雲端/.test(p1.after),p1);
const p2=JSON.parse(await P.ev(`[...document.querySelectorAll("#uploadReminderBox button")].find(b=>/現在上傳/.test(b.innerText)).click();${W}2500${E}
return JSON.stringify({dirty:syncStatus.dirty,box:${box}})`));
ok("按「現在上傳」：上傳完成，提醒消失",!p2.dirty&&!p2.box,p2);

// 2. 沒改資料就退出 → 不提醒
const p3=JSON.parse(await P.ev(`enterStartClassMode();${W}1200${E}hideDeviceLockWarning?.();exitStartClassMode();${W}1800${E}return JSON.stringify({dirty:syncStatus.dirty,box:${box}})`));
ok("沒有變更就退出，不提醒",!p3.dirty&&!p3.box,p3);

// 3. 「儲存並結束課堂」：照原本流程走完；離開上課模式後還沒上傳才提醒，已上傳就不提醒
const p4=JSON.parse(await P.ev(`enterStartClassMode();${W}1200${E}hideDeviceLockWarning?.();v1529AllPresent();${W}2000${E}
[...document.querySelectorAll("button")].find(b=>/儲存並結束課堂/.test(b.innerText)).click();${W}2500${E}
const close=[...document.querySelectorAll("button")].find(b=>b.innerText.trim()==="關閉"&&b.offsetParent);const hadSummary=!!close;close?.click();${W}600${E}
if(document.body.classList.contains("start-class-mode")){[...document.querySelectorAll("button")].find(b=>b.innerText.trim()==="退出")?.click();}${W}2500${E}
return JSON.stringify({hadSummary,inClass:document.body.classList.contains("start-class-mode"),dirty:syncStatus.dirty,box:${box}})`));
console.log(p4);
ok("儲存並結束課堂後：還沒上傳就提醒、已上傳就不提醒",!p4.inClass&&(p4.dirty?/下課了/.test(p4.box):!p4.box),p4);

// 4. 超過 3 天沒上傳：重新打開網頁時加強提醒；回到前景 6 小時內不重複
await P.ev(`addPoints(studentsByClass(classContext.classId)[0].id,1,"舊的修改");${W}600${E}state.backupMeta.dirtySinceMs=Date.now()-5*86400000;saveState();${W}800${E}`);
await P.go();
const p5=JSON.parse(await P.ev(`hideDeviceLockWarning?.();${W}1500${E}const first=${box};hideUploadReminder();
Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"visible"});document.dispatchEvent(new Event("visibilitychange"));${W}1800${E}
const again=${box};__storageGuard.lastStaleRemind=0;document.dispatchEvent(new Event("visibilitychange"));${W}1800${E}
return JSON.stringify({first,again,later:${box}})`));
ok("打開網頁：「已經 5 天沒上傳雲端…可能會清掉」",/已經 5 天沒上傳雲端/.test(p5.first)&&/清掉/.test(p5.first),p5);
ok("回到前景：6 小時內不重複提醒，之後會再提醒",!p5.again&&/5 天沒上傳/.test(p5.later),p5);

// 5. 設定中心 → 備份：資料保護狀態（電腦不顯示加入主畫面建議）
const settings=`document.querySelector('.nav button[data-page="settings"]').click();${W}400${E}settingsTab="backup";renderSettings();${W}1200${E}`;
const p6=JSON.parse(await P.ev(`${settings}return JSON.stringify({t:(document.getElementById("storageProtectBox")?.innerText||"").replace(/\\s+/g," ")})`));
ok("備份頁顯示保留資料、開啟方式、上次上傳與未上傳天數",/保留資料：/.test(p6.t)&&/開啟方式：瀏覽器分頁/.test(p6.t)&&/上次上傳雲端：/.test(p6.t)&&/已經 5 天/.test(p6.t)&&!/加入主畫面/.test(p6.t),p6);

// 6. iPad Safari 分頁：建議加入主畫面並說明資料分開；主畫面 App 不顯示建議
const ua=`Object.defineProperty(navigator,"userAgent",{get:()=>"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"});Object.defineProperty(navigator,"maxTouchPoints",{get:()=>5});`;
const I=await device("new.html",{w:820,h:1180,inject:ua});
const i1=JSON.parse(await I.ev(`hideDeviceLockWarning?.();${settings}document.getElementById("storageProtectBox").scrollIntoView({block:"start"});return JSON.stringify({t:(document.getElementById("storageProtectBox")?.innerText||"").replace(/\\s+/g," "),wide:document.documentElement.scrollWidth>innerWidth+1})`));
ok("iPad 分頁：建議加入主畫面，提醒先上傳、打開後再讀取雲端",/加入主畫面/.test(i1.t)&&/先在這裡「上傳雲端」/.test(i1.t)&&/讀取雲端/.test(i1.t)&&!i1.wide,i1);
await I.shot("up-storage");
const S=await device("new.html",{w:820,h:1180,inject:ua+`Object.defineProperty(navigator,"standalone",{get:()=>true});`});
const s1=JSON.parse(await S.ev(`hideDeviceLockWarning?.();${settings}return JSON.stringify({t:(document.getElementById("storageProtectBox")?.innerText||"").replace(/\\s+/g," ")})`));
ok("從主畫面打開：顯示主畫面 App，不再建議",/開啟方式：主畫面 App/.test(s1.t)&&!/加入主畫面/.test(s1.t),s1);

// 7. iPad 下課提醒的位置看得到（先讀取雲端，兩邊一致）
const i2=JSON.parse(await I.ev(`await firebaseDownloadAll();${W}800${E}hideUploadReminder();document.querySelector('.nav button[data-page="classroom"]')?.click();${W}400${E}enterStartClassMode();${W}1200${E}hideDeviceLockWarning?.();addPoints(studentsByClass(classContext.classId)[0].id,1,"iPad 上課加點");${W}800${E}const pre={dirty:syncStatus.dirty,newer:syncStatus.cloudIsNewer};exitStartClassMode();${W}1800${E}
const b=document.getElementById("uploadReminderBox")?.getBoundingClientRect();return JSON.stringify({pre,t:${box},vis:!!b&&b.top>=0&&b.bottom<=innerHeight&&b.left>=0&&b.right<=innerWidth})`));
ok("iPad：下課提醒完整出現在畫面內",/下課了/.test(i2.t)&&i2.vis,i2);
await I.shot("up-afterclass");
// 8. 下課時雲端剛好有別台的新資料：不跳「現在上傳」（會被擋），改顯示雲端較新的處理方式，提醒不疊在一起
await P.ev(`addPoints(studentsByClass(classContext.classId)[1].id,1,"桌機加點");${W}300${E}await firebaseUploadAll(true,true);`);
const i3=JSON.parse(await I.ev(`${W}2500${E}hideUploadReminder();dismissCloudNewerNotice?.();enterStartClassMode();${W}1200${E}hideDeviceLockWarning?.();
const sid=studentsByClass(classContext.classId)[0].id;addPoints(sid,1,"iPad 下課前加點");${W}800${E}exitStartClassMode();${W}1800${E}
return JSON.stringify({newer:syncStatus.cloudIsNewer,up:${box},cloud:(document.getElementById("cloudNewerBox")?.innerText||"").replace(/\s+/g," ")})`));
ok("雲端有較新資料：只顯示雲端較新的提醒（查看處理方式），不疊「下課了」",i3.newer&&!i3.up&&/查看處理方式/.test(i3.cloud),i3);

console.log("errs",P.errs,I.errs,S.errs,"fails",fail);done(fail||P.errs.length||I.errs.length||S.errs.length?1:0);
