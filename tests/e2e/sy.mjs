import {start,device,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},150000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
/* 同步狀態看得到：桌機上傳後，一直開著的 iPad 要自己知道「雲端有較新資料」（以前要手動按檢查，畫面一直顯示已同步）；
   不自動讀取、不自動上傳；這台有未上傳修改時不能讓人一鍵蓋掉 */
const W=`await new Promise(r=>setTimeout(r,`, E=`));`;
const status=`document.getElementById("syncStatusBar")?.innerText.replace(/\\s+/g," ")||""`;
const box=`document.getElementById("cloudNewerBox")?.innerText.replace(/\\s+/g," ")||""`;
const P=await device("new.html",{w:1366,h:900}), I=await device("new.html",{w:1180,h:820});
await P.ev(`hideDeviceLockWarning?.();localStorage.setItem("bt_device_name","學校桌機");await firebaseUploadAll(true,true);`);
await I.ev(`hideDeviceLockWarning?.();localStorage.setItem("bt_device_name","iPad");await firebaseDownloadAll();${W}800${E}`);
const i0=JSON.parse(await I.ev(`return JSON.stringify({s:${status},newer:syncStatus.cloudIsNewer,box:${box}})`));
ok("起點：iPad 讀過雲端，顯示已同步、沒有提醒",/已同步/.test(i0.s)&&!i0.newer&&!i0.box,i0);

// 1. 桌機按全班出席 → 狀態列顯示幾筆尚未上傳（一個動作算一筆）
const p1=JSON.parse(await P.ev(`enterStartClassMode();${W}1200${E}hideDeviceLockWarning?.();
const r=v1529AllPresent();${W}300${E}const a=${status};
${W}1700${E}addPoints(studentsByClass(classContext.classId)[0].id,1,"測試加點");${W}300${E}
window.__cid=classContext.classId;window.__ids=studentsByClass(__cid).map(s=>s.id);
return JSON.stringify({changed:r.changed,a,b:${status},date:classContext.date})`));
ok("全班出席後顯示「1 筆變更尚未上傳」",p1.changed>0&&/1 筆變更尚未上傳/.test(p1.a),p1);
ok("再做一個動作變 2 筆",/2 筆變更尚未上傳/.test(p1.b),p1);

// 2. 桌機上傳：自己不會被誤判成雲端較新
const p2=JSON.parse(await P.ev(`await guardedFirebaseUpload(true);${W}2500${E}return JSON.stringify({s:${status},newer:syncStatus.cloudIsNewer,box:${box},dirty:syncStatus.dirty})`));
ok("桌機上傳後自己顯示已同步、沒有提醒",/已同步/.test(p2.s)&&!p2.newer&&!p2.box&&!p2.dirty,p2);

// 3. iPad 不用按任何鍵就知道雲端變了，但不會自己讀取
const i3=JSON.parse(await I.ev(`${W}1500${E}const t=classContext.date;
return JSON.stringify({s:${status},box:${box},newer:syncStatus.cloudIsNewer,first:document.querySelector("#syncStatusBar .sync-actions button")?.innerText,
present:(state.attendance||[]).filter(a=>a.date===t&&a.status==="present").length})`));
console.log(i3);
ok("iPad 狀態列自動顯示「雲端有較新資料（學校桌機 今天 HH:MM）」",i3.newer&&/雲端有較新資料（學校桌機 今天 \d\d:\d\d）/.test(i3.s),i3);
ok("iPad 跳出提醒，告知沒有未上傳修改可以放心讀取",/學校桌機/.test(i3.box)&&/可以放心讀取/.test(i3.box),i3);
ok("狀態列第一個按鈕換成讀取雲端",/讀取雲端/.test(i3.first||""),i3);
ok("沒有自動讀取（還看不到出席）",i3.present===0,i3);
await I.shot("sy-notice");

// 4. 在提醒上按讀取 → 看得到出席，提醒和警告都消失
const i4=JSON.parse(await I.ev(`[...document.querySelectorAll("#cloudNewerBox button")].find(b=>/讀取雲端/.test(b.innerText)).click();${W}1500${E}
const t=classContext.date;return JSON.stringify({s:${status},box:${box},newer:syncStatus.cloudIsNewer,
present:(state.attendance||[]).filter(a=>a.date===t&&a.status==="present").length})`));
ok("讀取後看得到桌機點的出席",i4.present===p1.changed,{i4,p1});
ok("讀取後顯示已同步、提醒消失",/已同步/.test(i4.s)&&!i4.newer&&!i4.box,i4);

// 5. 按「稍後」：提醒收起來，狀態列繼續提示；同一版不會一直跳
await P.ev(`addPoints(__ids[1],1,"第二次");await guardedFirebaseUpload(true);`);
const i5=JSON.parse(await I.ev(`${W}1500${E}const had=${box};dismissCloudNewerNotice();await quietCloudCheck(true);${W}300${E}
return JSON.stringify({had,box:${box},s:${status}})`));
ok("稍後：提醒收起，狀態列仍顯示雲端較新，同一版不再跳",/雲端有較新的資料/.test(i5.had)&&!i5.box&&/雲端有較新資料/.test(i5.s),i5);

// 6. iPad 自己也有未上傳的修改：提醒不能一鍵讀取蓋掉，改成查看處理方式
const i6=JSON.parse(await I.ev(`await firebaseDownloadAll();${W}500${E}addPoints(studentsByClass(classContext.classId)[2].id,1,"iPad 加點");${W}300${E}`+"return 1"));
await P.ev(`addPoints(__ids[3],1,"第三次");await guardedFirebaseUpload(true);`);
const i6b=JSON.parse(await I.ev(`${W}1500${E}const b=${box};const btns=[...document.querySelectorAll("#cloudNewerBox button")].map(x=>x.innerText);
const sb=${status};[...document.querySelectorAll("#cloudNewerBox button")].find(x=>/處理方式/.test(x.innerText))?.click();${W}300${E}
return JSON.stringify({b,btns,sb,conflict:!!document.getElementById("cloudWarningBox"),dirty:syncStatus.dirty})`));
console.log(i6b);
ok("兩邊都有修改：提醒說這台也有 1 筆未上傳",/這台也有 1 筆還沒上傳/.test(i6b.b)&&/這台也有 1 筆未上傳/.test(i6b.sb),i6b);
ok("沒有一鍵讀取，按了打開衝突處理視窗，本機修改還在",!i6b.btns.some(x=>/^⬇️ 讀取雲端$/.test(x.trim()))&&i6b.conflict&&i6b.dirty,i6b);
await I.ev(`hideCloudWarning();await firebaseDownloadAll();`);

// 7. 即時連線斷掉（iPad 放到背景很久）：回到前景時也會檢查
await I.ev(`firebaseDb.ref("battleSystem/main/updatedAt").off();`);
await P.ev(`addPoints(__ids[4],1,"第四次");await guardedFirebaseUpload(true);`);
const i7=JSON.parse(await I.ev(`${W}1500${E}const before=syncStatus.cloudIsNewer;__cloudWatch.lastQuietCheck=0;
document.dispatchEvent(new Event("visibilitychange"));${W}800${E}return JSON.stringify({before,after:syncStatus.cloudIsNewer,box:${box}})`));
ok("斷線時沒收到，回到前景後偵測到雲端較新",!i7.before&&i7.after&&/雲端有較新的資料/.test(i7.box),i7);

// 8. 上課畫面中也看得到（iPad 尺寸）
const i8=JSON.parse(await I.ev(`enterStartClassMode();${W}1200${E}hideDeviceLockWarning?.();showCloudNewerNotice(true);renderSyncStatus();
const bar=document.getElementById("syncStatusBar").getBoundingClientRect(),bx=document.getElementById("cloudNewerBox")?.getBoundingClientRect();
const vis=r=>r&&r.width>0&&r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;
const overlap=bx&&!(bx.bottom<=bar.top||bx.top>=bar.bottom||bx.right<=bar.left||bx.left>=bar.right);
return JSON.stringify({bar:vis(bar),box:vis(bx),overlap,first:document.querySelector("#syncStatusBar .sync-actions button")?.innerText})`));
ok("上課畫面：狀態列和提醒都在畫面內、互不重疊，讀取鍵看得到",i8.bar&&i8.box&&!i8.overlap&&/讀取雲端/.test(i8.first||""),i8);
await I.shot("sy-class");

// 9. 新裝置（從沒同步過）一打開就提醒雲端有資料
const N=await device("new.html",{w:1180,h:820});
const n9=JSON.parse(await N.ev(`hideDeviceLockWarning?.();${W}1000${E}return JSON.stringify({newer:syncStatus.cloudIsNewer,box:${box}})`));
ok("新裝置打開就提醒雲端有資料",n9.newer&&/雲端有較新的資料/.test(n9.box),n9);

// 10. 會改資料的常用動作都要標成「尚未上傳」（以前點名、成長日誌、兌換、標記、課程紀錄只存本機，狀態列照樣顯示已同步）
const a10=JSON.parse(await N.ev(`await firebaseDownloadAll();hideCloudWarning();
const cid=classContext.classId, st=studentsByClass(cid), s0=st[0].id, s1=st[1].id, dt=classContext.date;
state.points[s0]=100;const rw=(state.rewards||[]).find(r=>r.active!==false&&Number(r.cost)<=100);
const lv0=levelLabel(findById(state.students,s1));
const acts={
 點名:()=>setAttendance(s0,cid,dt,"late"),
 小卡切換出席:()=>v1529CycleAttendance(st[2].id),
 課程紀錄:()=>saveCourseNote(cid,dt,"今天練習 Do Re Mi"),
 成長日誌:()=>addGrowthLog(s0,"attitude",5,"專心"),
 刪除成長日誌:()=>deleteGrowthLog(state.growthLogs.at(-1).id),
 兌換:()=>redeemReward(s0,rw.id),
 取消兌換:()=>undoRedeem(state.redeemLogs.at(-1).id),
 學生標記:()=>st109ToggleTag(s0,ST109_TAGS[0].id),
 通過升級:()=>passExam(s1,"很好"),
 升級未通過:()=>failExam(s1,"再練"),
 降級:()=>downgradeStudent(s1,"調整"),
};
const out={};
for(const [k,f] of Object.entries(acts)){
  markClean();
  try{ f(); }catch(e){ out[k]="EX "+e.message; continue; }
  if(k==="成長日誌") await new Promise(r=>setTimeout(r,3500)); /* 開始上課的 XP（2.6 秒內的會合併成一批再存） */
  out[k]=syncStatus.dirty;
}
markClean();saveCourseNote(cid,dt,"今天練習 Do Re Mi");const same=syncStatus.dirty;
return JSON.stringify({out,same,lv0,lv1:levelLabel(findById(state.students,s1)),
 passLog:state.examLogs.filter(x=>x.studentId===s1).map(x=>x.type).join(","),act:(state.activityLogs||state.activities||[]).length})`));
console.log(a10);
ok("常用動作做完都會顯示尚未上傳",Object.values(a10.out).every(v=>v===true),a10.out);
ok("課程紀錄內容沒變時不算修改",a10.same===false,a10);
ok("通過升級不再出錯、有記錄",a10.out.通過升級===true&&/pass/.test(a10.passLog),a10);

console.log("errs",P.errs,I.errs,N.errs,"fails",fail);done(fail||P.errs.length||I.errs.length||N.errs.length?1:0);
