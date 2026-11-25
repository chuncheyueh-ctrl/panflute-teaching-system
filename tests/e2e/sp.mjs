import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},150000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
const d=await device("new.html",{w:1024,h:768});const ev=d.ev;
const sid=await ev(`hideDeviceLockWarning?.();return state.students[0].id`);
ok("IDB 模式",await ev(`return BTMainStore.mode`)==="idb");
const p0=await ev(`return Number(state.points["${sid}"]||0)`);
// 1. 加點後馬上重新整理（300ms 內）
await ev(`addPoints("${sid}",7,"立刻重整");return 1`);
await d.go();
ok("加點後立刻重整也有存到",await ev(`return Number(state.points["${sid}"]||0)`)===p0+7,await ev(`return state.points["${sid}"]`));
// 2. 連續加點合併成一次寫入
const w=await ev(`let n=0;const o=BTMainStore.save.bind(BTMainStore);BTMainStore.save=r=>{n++;return o(r)};for(let i=0;i<5;i++)addPoints("${sid}",1,"連按");await new Promise(r=>setTimeout(r,800));return n`);
ok("連按 5 次只寫 1~2 次",w>=1&&w<=2,w);
await d.go();ok("連按後重整保留",await ev(`return Number(state.points["${sid}"]||0)`)===p0+12);
// 3. 切到背景立刻存
await ev(`addPoints("${sid}",1,"背景");Object.defineProperty(document,"visibilityState",{value:"hidden",configurable:true});document.dispatchEvent(new Event("visibilitychange"));return 1`);
ok("切背景時立刻寫入",await ev(`return BTMainStore.raw.includes('"背景"')`));
await d.go();
// 4. 出席狀態
const cls=await ev(`return classContext.classId`);
await ev(`setAttendance("${sid}",classContext.classId,classContext.date,"late");return 1`);
ok("出席狀態顯示遲到",await ev(`return attendanceStatus("${sid}",classContext.classId,classContext.date)==="late" && document.getElementById("classroomBody").innerText.includes("遲到")`));
await ev(`setAttendance("${sid}",classContext.classId,classContext.date,"present");return 1`);
ok("改成出席",await ev(`return attendanceStatus("${sid}",classContext.classId,classContext.date)==="present"`));
ok("同步執行內新增紀錄也查得到",await ev(`const d0="2099-01-01";attendanceStatus("${sid}",classContext.classId,d0);state.attendance.push({id:"zz",studentId:"${sid}",classId:classContext.classId,date:d0,status:"leave"});return attendanceStatus("${sid}",classContext.classId,d0)==="leave"`));
ok("同步執行內改狀態也反映",await ev(`const d0="2099-01-01";attendanceStatus("${sid}",classContext.classId,d0);state.attendance.find(a=>a.id==="zz").status="absent";return attendanceStatus("${sid}",classContext.classId,d0)==="absent"`));
// 5. XP
const x0=await ev(`return growthXpTotal("${sid}")`);
ok("XP 同步執行內新增立即反映",await ev(`growthXpTotal("${sid}");state.growthLogs.push({id:"gx",studentId:"${sid}",xp:9,date:new Date().toISOString(),type:"x"});return growthXpTotal("${sid}")`)===x0+9);
ok("XP 刪除後反映",await ev(`growthXpTotal("${sid}");state.growthLogs=state.growthLogs.filter(l=>l.id!=="gx");return growthXpTotal("${sid}")`)===x0);
await ev(`render();return 1`);
ok("點名頁顯示 XP",await ev(`return document.getElementById("classroomBody").innerText.includes("累積 ${x0} XP")`));
console.log("errs",d.errs,"fails",fail);done(0);
