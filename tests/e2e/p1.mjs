import {start,device} from "./lib.mjs"; const done=await start(); setTimeout(()=>{console.log("TIMEOUT");done(1)},120000);
let fail=0;const ok=(n,c,x="")=>{console.log(c?"PASS":"FAIL",n,c?"":JSON.stringify(x));if(!c)fail++};
const d=await device("new.html",{w:1366,h:1024});const ev=d.ev;
const r=JSON.parse(await ev(`hideDeviceLockWarning();
const sid=state.students[0].id;
const realFetch=window.fetch;let sent=null;
window.fetch=async(u,o)=>{if(String(u).includes("imgbb")){const b64=o.body.get("image");const img=new Image();await new Promise(res=>{img.onload=res;img.src="data:image/jpeg;base64,"+b64});sent={w:img.width,h:img.height,kb:Math.round(b64.length*3/4/1024)};return new Response(JSON.stringify({success:true,data:{url:"https://example.invalid/a.jpg"}}))}return realFetch(u,o)};
const c=document.createElement("canvas");c.width=3000;c.height=2000;const x=c.getContext("2d");for(let i=0;i<300;i++){x.fillStyle="hsl("+i+",70%,50%)";x.fillRect(Math.random()*3000,Math.random()*2000,200,200)}
const blob=await new Promise(res=>c.toBlob(res,"image/jpeg",.95));const file=new File([blob],"p.jpg",{type:"image/jpeg"});
await handleStudentPhoto(file,sid);
const st=findById(state.students,sid);
window.fetch=realFetch;
render();await new Promise(r=>setTimeout(r,300));
const imgs=[...document.querySelectorAll("img")].filter(i=>i.src.includes("example.invalid"));
return JSON.stringify({sent,orig:Math.round(blob.size/1024),photo:st.photo,imgs:imgs.length,lazy:imgs.every(i=>i.loading==="lazy")});`));
console.log(r);
ok("上傳縮成 400px",Math.max(r.sent.w,r.sent.h)===400,r.sent);
ok("寫入照片網址",r.photo==="https://example.invalid/a.jpg");
// 檢查各頁的大頭貼都有 lazy
const pages=JSON.parse(await ev(`const out={};for(const b of document.querySelectorAll('.nav button[data-page]')){b.click();await new Promise(r=>setTimeout(r,250));const imgs=[...document.querySelectorAll("img")].filter(i=>i.src.includes("example.invalid"));if(imgs.length)out[b.dataset.page]=imgs.map(i=>i.loading).join(",")}return JSON.stringify(out)`));
console.log(pages);ok("每頁大頭貼 lazy",Object.values(pages).every(v=>v.split(",").every(x=>x==="lazy")),pages);
console.log("errs",d.errs,"fails",fail);done(0);
