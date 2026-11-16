const CORS_PROXIES=[u=>"https://api.allorigins.win/get?url="+encodeURIComponent(u),u=>"https://corsproxy.io/?url="+encodeURIComponent(u),u=>"https://api.codetabs.com/v1/proxy?quest="+encodeURIComponent(u)];
const $=id=>document.getElementById(id);
const W={responsive:.25,typography:.15,structure:.2,performance:.2,ux:.2};
const NAMES={responsive:"Responsive Design & Mobile",typography:"Typography & Readability",structure:"Page Structure & Hierarchy",performance:"Load Speed & Performance",ux:"UX & Retention Signals"};
const SEV={critical:30,high:18,medium:12,low:8};
function norm(s){s=s.trim();return /^https?:\/\//i.test(s)?s:"https://"+s}
async function fetchHTML(url){
 for(const p of CORS_PROXIES){
  try{const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),12000);const r=await fetch(p(url),{signal:ac.signal});clearTimeout(tm);if(!r.ok)continue;const t=await r.text();
   try{const j=JSON.parse(t);if(j&&j.contents)return j.contents}catch(e){}
   if(t&&t.includes("<"))return t}catch(e){}
 }return null}
function mk(){const f=[];return{f,add:(s,m)=>f.push({s,m}),score:()=>Math.max(10,100-f.reduce((a,x)=>a+(SEV[x.s]||0),0))}}
const q=(d,s)=>[...d.querySelectorAll(s)];
const css=(d)=>q(d,"style").map(s=>s.textContent).join("\n")+q(d,"[style]").map(e=>e.getAttribute("style")).join("\n");
function aResp(d,html){const r=mk(),vp=d.querySelector('meta[name=viewport]'),c=css(d);
 if(!vp)r.add("critical","Missing viewport meta tag. Pages will render at desktop width on phones.");
 else{const v=vp.content||"";if(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?(\D|$)/i.test(v))r.add("high","Viewport blocks pinch-zoom (WCAG 1.4.4).");if(!/width\s*=\s*device-width/i.test(v))r.add("high","Viewport lacks width=device-width.")}
 if(!/@media/i.test(c)&&!q(d,"link[rel=stylesheet][media]").length)r.add("medium","No media queries found in inline CSS or linked stylesheet media attributes.");
 if(/width\s*:\s*(9\d{2}|[1-9]\d{3})px/i.test(c))r.add("high","Fixed pixel widths of 900px or more detected.");
 const im=q(d,"img");if(im.length&&!im.some(i=>i.hasAttribute("srcset"))&&!q(d,"picture").length)r.add("medium","Images don’t use srcset or picture for responsive delivery.");
 const nd=im.filter(i=>!(i.getAttribute("width")&&i.getAttribute("height"))).length;if(nd>2)r.add("low",nd+" images lack width/height, which risks layout shift.");
 if(q(d,"table").length&&!/overflow/i.test(c))r.add("low","Tables present with no overflow handling for small screens.");
 return r}
function aType(d,html){const r=mk(),c=css(d);
 if(!d.documentElement.getAttribute("lang"))r.add("medium","<html> has no lang attribute.");
 if(/font-size\s*:\s*(\d|1[01])px/i.test(c))r.add("medium","Font sizes under 12px detected.");
 if(c&&!/clamp\(|rem|vw|em/i.test(c))r.add("low","No fluid or relative type units (rem, em, clamp) found.");
 const fam=new Set((c.match(/font-family\s*:[^;}]+/gi)||[]).map(x=>x.toLowerCase()));if(fam.size>3)r.add("low","More than 3 distinct font-family declarations.");
 if(/fonts\.googleapis\.com/.test(html)&&!/display=swap/.test(html))r.add("medium","Google Fonts loaded without display=swap.");
 if(q(d,"font,center,big").length)r.add("medium","Deprecated presentational tags (font, center, big) in use.");
 return r}
function aStruct(d,html){const r=mk(),h1=q(d,"h1").length;
 if(!d.title.trim())r.add("high","Missing <title>.");
 if(!d.querySelector('meta[name=description]'))r.add("medium","Missing meta description.");
 if(!h1)r.add("high","No <h1> found.");else if(h1>1)r.add("low",h1+" <h1> elements; one is recommended.");
 const hs=q(d,"h1,h2,h3,h4,h5,h6").map(h=>+h.tagName[1]);let sk=0;hs.forEach((l,i)=>{if(i&&l>hs[i-1]+1)sk++});if(sk)r.add("medium","Heading levels skipped "+sk+" time(s).");
 if(!d.querySelector("main"))r.add("medium","No <main> landmark.");
 if(!d.querySelector("nav")&&!d.querySelector("header"))r.add("low","No <nav> or <header> landmark.");
 if(!d.querySelector("footer"))r.add("low","No <footer> landmark.");
 const na=q(d,"img").filter(i=>!i.hasAttribute("alt")).length;if(na)r.add(na>5?"high":"medium",na+" image(s) missing alt text.");
 return r}
function aPerf(d,html){const r=mk(),sc=q(d,"script[src]"),bl=sc.filter(s=>!s.async&&!s.defer&&!s.type?.includes("module")&&s.closest("head")).length;
 if(html.length>500000)r.add("high","HTML document is over 500 KB.");else if(html.length>150000)r.add("medium","HTML document is over 150 KB.");
 if(bl)r.add(bl>2?"high":"medium",bl+" render-blocking script(s) in <head>.");
 if(sc.length>10)r.add("medium",sc.length+" external scripts; consider bundling.");
 const ss=q(d,"link[rel=stylesheet]").length;if(ss>5)r.add("low",ss+" stylesheets; each is a request.");
 const im=q(d,"img");if(im.length>3&&!im.some(i=>i.loading==="lazy"))r.add("medium","No lazy-loaded images.");
 if(!d.querySelector('link[rel=preconnect],link[rel=preload]'))r.add("low","No preconnect or preload hints.");
 if(q(d,"[style]").length>40)r.add("low","Heavy use of inline styles.");
 return r}
function aUX(d,html){const r=mk();
 if(!d.querySelector('meta[property^="og:"]'))r.add("low","No Open Graph tags (poor link previews).");
 if(!d.querySelector('link[rel*=icon]'))r.add("low","No favicon declared.");
 if(!d.querySelector('meta[name=theme-color]'))r.add("low","No theme-color meta tag.");
 const inp=q(d,"input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea").filter(i=>!i.getAttribute("aria-label")&&!(i.id&&d.querySelector('label[for="'+i.id+'"]'))&&!i.closest("label"));
 if(inp.length)r.add("high",inp.length+" form field(s) without labels.");
 const el=q(d,"a").filter(a=>!a.textContent.trim()&&!a.getAttribute("aria-label")&&!a.querySelector("img[alt]"));if(el.length)r.add("medium",el.length+" link(s) with no accessible name.");
 if(!q(d,"button,a.btn,a[class*=cta],input[type=submit]").length)r.add("medium","No clear call-to-action button found.");
 if(!d.querySelector('a[href^="#"]')&&q(d,"a").length>20)r.add("low","No skip link or in-page anchors on a long page.");
 if(!/^https:/i.test(d.baseURI)&&0)r.add("low","");
 return r}
function grade(s){return s>=95?"A+":s>=90?"A":s>=80?"B":s>=70?"C":s>=60?"D":"F"}
function label(s){return s>=90?"Excellent":s>=80?"Well Built Site":s>=65?"Needs Work":"Poor"}
function col(s){return s>=80?"var(--ok)":s>=60?"var(--warn)":"var(--bad)"}
function render(res,note){
 const keys=Object.keys(W),ov=Math.round(keys.reduce((a,k)=>a+res[k].score*W[k],0)),g=grade(ov),C=2*Math.PI*62;
 const top=[...keys].sort((a,b)=>res[b].score-res[a].score).slice(0,3);
 let h=(note?'<div class="note">'+note+'</div>':'')+'<div class="sum"><div class="ring"><svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" fill="none" stroke="var(--line)" stroke-width="12"/><circle id="rc" cx="75" cy="75" r="62" fill="none" stroke="'+col(ov)+'" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+C+'" style="transition:stroke-dashoffset 1s"/></svg><div class="n"><b>'+ov+'</b><span class="grade">Grade '+g+'</span></div></div><div><h2 style="margin:0">'+label(ov)+'</h2><div class="badges">'+top.map(k=>'<span class="badge">'+NAMES[k].split(" ")[0]+' · '+res[k].score+'</span>').join("")+'</div></div></div><div class="cards">';
 keys.forEach(k=>{const r=res[k],s=r.score;h+='<div class="c"><h3>'+NAMES[k]+'<small>'+Math.round(W[k]*100)+'% · '+s+'/100</small></h3><div class="bar"><i style="width:0" data-w="'+s+'"></i></div>'+(r.f.length?r.f.map(x=>'<div class="f"><span class="tag '+x.s+'">'+x.s+'</span><span>'+x.m+'</span></div>').join(""):'<div class="f"><span class="tag pass">pass</span><span>No issues found.</span></div>')+'</div>'});
 $("res").innerHTML=h+"</div>";$("res").style.display="block";
 requestAnimationFrame(()=>{$("rc").style.strokeDashoffset=C*(1-ov/100);document.querySelectorAll(".bar i").forEach(i=>i.style.width=i.dataset.w+"%")});
 $("res").scrollIntoView({behavior:"smooth"})}
function analyze(html){const d=new DOMParser().parseFromString(html,"text/html");return{responsive:aResp(d,html),typography:aType(d,html),structure:aStruct(d,html),performance:aPerf(d,html),ux:aUX(d,html)}}
function fallback(url){const mkr=(s,m)=>{const r=mk();if(s)r.add(s,m);return r};
 return{responsive:mkr("medium","Could not verify viewport or media queries (page HTML unavailable)."),typography:mkr("low","Typography checks skipped."),structure:mkr("low","Structure checks skipped."),performance:mkr(/^https:/.test(url)?"":"high",/^https:/.test(url)?"":"Site isn’t served over HTTPS."),ux:mkr("low","UX checks skipped.")}}
async function run(url){
 $("res").style.display="none";$("load").style.display="block";$("lt").textContent="Fetching HTML…";
 const html=await fetchHTML(url);$("lt").textContent="Analyzing…";await new Promise(r=>setTimeout(r,300));
 $("load").style.display="none";
 if(html)render(analyze(html));
 else render(fallback(url),"All CORS proxies failed or were blocked, so this is a partial fallback score. The target site may block proxy requests; try another URL.")}
function go(){const v=$("u").value;if(!v.trim()){const e=$("u");e.classList.add("shake");setTimeout(()=>e.classList.remove("shake"),450);return}run(norm(v))}
$("go").onclick=go;$("u").addEventListener("keydown",e=>{if(e.key==="Enter")go()});
