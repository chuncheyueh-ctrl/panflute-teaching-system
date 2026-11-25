import {start,device,sleep} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},150000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
const d=await device("new.html",{w:1366,h:1024});const ev=d.ev;
await ev(`hideDeviceLockWarning();
const mk=async(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle="#c84";x.fillRect(0,0,w,h);return await new Promise(r=>c.toBlob(r,"image/jpeg",.9))};
window.__imgs={"https://i.ibb.co/big/a.jpg":await mk(1200,900),"https://i.ibb.co/small/b.jpg":await mk(300,300),"https://i.ibb.co/big2/c.jpg":await mk(900,1200)};
window.__uploads=[];
const real=window.fetch;
window.fetch=async(u,o)=>{u=String(u);
  if(u.includes("api.imgbb.com")){const b=o.body.get("image");const im=new Image();await new Promise(r=>{im.onload=r;im.src="data:image/jpeg;base64,"+b});const n=__uploads.length;__uploads.push([im.width,im.height]);return new Response(JSON.stringify({success:true,data:{url:"https://i.ibb.co/new/"+n+".jpg"}}))}
  if(u.startsWith("https://i.ibb.co/")){if(u.includes("broken"))return new Response("x",{status:404});await new Promise(r=>setTimeout(r,150));return new Response(__imgs[u])}
  return real(u,o)};
const st=state.students;st[0].photo="https://i.ibb.co/big/a.jpg";st[1].photo="https://i.ibb.co/small/b.jpg";st[2].photoUrl="https://i.ibb.co/big2/c.jpg";
state.students.push({...st[0],id:"bk",name:"壞照片",photo:"https://i.ibb.co/broken/x.jpg"});
saveState();V15341RouteTo("settings");await new Promise(r=>setTimeout(r,500));
const b=[...document.querySelectorAll("button,.tab,[onclick]")].find(b=>/學生/.test(b.innerText)&&/settingsTab|setSettingsTab|學生/.test(b.getAttribute("onclick")||""));b&&b.click();await new Promise(r=>setTimeout(r,500));return 1`);
ok("看得到按鈕",await ev(`return !!document.getElementById("photoCompressBtn")`));
await ev(`window.confirm=()=>true;window.__p=photoCompressAll();await new Promise(r=>setTimeout(r,250));`);
const mid=await ev(`return document.getElementById("photoCompressStatus").innerText`);console.log("mid:",mid);ok("顯示進度",mid.includes("處理中"));
await ev(`await window.__p`);
const r=JSON.parse(await ev(`const st=state.students;return JSON.stringify({a:[st[0].photo,st[0].photoOriginal],b:[st[1].photo,st[1].photoOriginal||null],c:[st[2].photoUrl,st[2].photoOriginal],bk:findById(st,"bk").photo,up:__uploads,status:document.getElementById("photoCompressStatus").innerText,dirty:syncStatus.dirty,rem:document.getElementById("uploadReminderBox")?.innerText||"",bar:document.getElementById("syncStatusBar").innerText})`));
console.log(r);
ok("大照片換新網址",r.a[0].startsWith("https://i.ibb.co/new/")&&r.a[1]==="https://i.ibb.co/big/a.jpg");
ok("小照片跳過",r.b[0]==="https://i.ibb.co/small/b.jpg"&&r.b[1]===null);
ok("photoUrl 欄位也換",r.c[0].startsWith("https://i.ibb.co/new/"));
ok("縮成400",JSON.stringify(r.up)==="[[400,300],[300,400]]",r.up);
ok("壞的保留並列出",r.bk==="https://i.ibb.co/broken/x.jpg"&&r.status.includes("壞照片"));
ok("完成狀態",r.status.includes("完成")&&r.status.includes("已縮小 2")&&r.status.includes("本來就小 1")&&r.status.includes("失敗 1"),r.status);
ok("提醒上傳",r.dirty&&r.rem.includes("2 張照片")&&r.bar.includes("學生照片"),r);
// 再按一次：都已小（新網址 mock 回傳不存在→失敗? 給它小圖）
await ev(`__imgs["https://i.ibb.co/new/0.jpg"]=__imgs["https://i.ibb.co/small/b.jpg"];__imgs["https://i.ibb.co/new/1.jpg"]=__imgs["https://i.ibb.co/small/b.jpg"];await photoCompressAll()`);
const s2=await ev(`return document.getElementById("photoCompressStatus").innerText`);console.log(s2);ok("第二次不重複上傳",s2.includes("已縮小 0")&&(await ev(`return __uploads.length`))===2);
// 停止
await ev(`findById(state.students,"bk").photo="https://i.ibb.co/big/a.jpg";state.students[1].photo="https://i.ibb.co/big2/c.jpg";window.__p=photoCompressAll();await new Promise(r=>setTimeout(r,50));photoCompressStop();await window.__p`);
const s3=await ev(`return document.getElementById("photoCompressStatus").innerText`);console.log(s3);ok("可以停止",s3.includes("已停止"));
await d.shot("compress");
// 重載保留
await d.go();ok("重載保留新網址",(await ev(`return state.students[0].photo`)).startsWith("https://i.ibb.co/new/"));
console.log("errs",d.errs,"fails",fail);done(0);
