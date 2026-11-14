/* Lương & Nhi: individually illustrated characters, GIF-informed motion.
   Uses independent SVG figures. No GIF displayed, decoded or injected. */
(function(){
'use strict';
const cover=document.getElementById('cover'),hero=document.getElementById('coverHero');
if(!cover||!hero)return;
const asset='?v=20261114-romance-v2';
const make=(tag,cls)=>{const node=document.createElement(tag);if(cls)node.className=cls;return node;};
let ready=false,scheduled=[],audio=null,audioTick=null,sceneId=0;
const delay=(fn,ms)=>{const id=setTimeout(fn,ms);scheduled.push(id);return id;};
const reduce=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd=(a,b)=>a+Math.random()*(b-a);
const scene=()=>cover.classList.contains('nhi-romance-v2-running');
function setup(){
 if(ready)return;ready=true;
 const boy=make('div','nhi-luong-v2');boy.id='nhiLuongV2';
 const standing=make('img','nhi-boy-standing');standing.src='nhi-luong-reference-v2.svg'+asset;
 standing.alt='Lương chibi tóc đen áo polo nâu theo mẫu';standing.draggable=false;
 const kissing=make('img','nhi-boy-kissing');kissing.src='nhi-luong-kiss-v2.svg'+asset;
 kissing.alt='';kissing.setAttribute('aria-hidden','true');kissing.draggable=false;
 boy.append(standing,kissing);hero.append(boy);
 const flowers=make('div','nhi-illustrated-flowers');flowers.setAttribute('aria-hidden','true');cover.append(flowers);
 const hearts=make('div','nhi-illustrated-hearts');hearts.setAttribute('aria-hidden','true');cover.append(hearts);
 const title=make('div','nhi-romance-title-v2');title.id='nhiLoveTitleV2';
 title.setAttribute('role','status');
 title.innerHTML='Lương <span aria-label="yêu">❤️</span> Nhi';cover.append(title);
 const kisses=make('span','nhi-kiss-glimmer');kisses.setAttribute('aria-hidden','true');
 kisses.innerHTML='<svg viewBox="0 0 36 36"><path d="M18 31C-2 18 4 3 17 12 29-2 44 13 18 31" fill="#ffa1b3" stroke="#e47e97" stroke-width="2"/></svg>';hero.append(kisses);
 const girlTalk=make('div','nhi-v2-chat nhi-v2-girl-chat');girlTalk.textContent='ck iu';hero.append(girlTalk);
 const boyTalk=make('div','nhi-v2-chat nhi-v2-boy-chat');boyTalk.textContent='vợ iu';hero.append(boyTalk);
 const sun=make('button','nhi-v2-hotspot');sun.id='nhiSunKiss';sun.type='button';
 sun.setAttribute('aria-label','Chạm mặt trời để xem Lương đến hôn Nhi');sun.title='Mặt trời · Lương ❤️ Nhi';
 sun.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();start();});cover.append(sun);
 const bouquet=make('button','nhi-v2-hotspot');bouquet.id='nhiBouquetLove';bouquet.type='button';
 bouquet.setAttribute('aria-label','Chạm hoa để Lương và Nhi trò chuyện');bouquet.title='Bó hoa · ck iu / vợ iu';
 bouquet.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();talk();});hero.append(bouquet);
 const bridge=make('button','nhi-v2-hotspot');bridge.id='nhiBridgeMusic';bridge.type='button';
 bridge.setAttribute('aria-label','Chạm cầu để bật hoặc tắt nhạc và cánh hoa hồng');
 bridge.setAttribute('aria-pressed','false');bridge.title='Cây cầu · nhạc và hoa hồng';
 bridge.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const playing=toggleSound();
  bridge.setAttribute('aria-pressed',String(playing));if(playing)petals(12);
 });cover.append(bridge);
 const go=make('button','nhi-v2-enter');go.id='nhiRomanceEnter';go.type='button';
 go.title='Vào học';go.setAttribute('aria-label','Vào học');go.innerHTML='<span aria-hidden="true">→</span>';
 go.addEventListener('click',e=>{e.stopPropagation();document.getElementById('coverGo')?.click();});
 cover.append(go);
 // The sun position varies with background crop. Capture its upper-right painted area.
 cover.addEventListener('click',e=>{
  if(e.target.closest('button,a,input,select,textarea,#nhi-season-controls,#coverHero'))return;
  if(!e.isTrusted)return;
  const r=cover.getBoundingClientRect();
  const x=(e.clientX-r.left)/Math.max(r.width,1),y=(e.clientY-r.top)/Math.max(r.height,1);
  if(x>=.67&&x<=.92&&y>=.05&&y<=.29){e.preventDefault();e.stopImmediatePropagation();start();}
 },true);
 new MutationObserver(()=>{if(cover.hidden)reset();}).observe(cover,{attributes:true,attributeFilter:['hidden']});
}
function reset(){
 sceneId++;scheduled.forEach(clearTimeout);scheduled=[];
 cover.classList.remove('nhi-romance-v2-running','nhi-v2-kissing','nhi-v2-done','nhi-v2-talking','nhi-v2-preview');
 document.querySelector('.nhi-illustrated-hearts')?.replaceChildren();
 document.querySelector('.nhi-illustrated-flowers')?.replaceChildren();
}
function pulseHeart(index){
 const holder=cover.querySelector('.nhi-illustrated-hearts');
 if(!holder||reduce())return;
 const outer=make('span','nhi-drawn-heart');
 const isLeft=index%2===0;
 outer.style.setProperty('--start-x',(isLeft?rnd(9,23):rnd(77,91))+'vw');
 outer.style.setProperty('--end-dx',(isLeft?rnd(-38,-7):rnd(7,38))+'px');
 outer.style.setProperty('--heart-size',rnd(13,26)+'px');
 outer.style.setProperty('--heart-delay',rnd(0,.5)+'s');
 outer.style.setProperty('--heart-duration',rnd(5.1,7.4)+'s');
 outer.innerHTML='<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="hgrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd9c8"/><stop offset=".5" stop-color="#ffacc1"/><stop offset="1" stop-color="#e994b4"/></linearGradient></defs><path d="M20 35C14 30 2 22 3 12 4 1 15 1 20 10 26 1 38 3 37 13 36 23 26 31 20 35Z" fill="url(#hgrad)" stroke="#c97891" stroke-width="1.7"/><path d="M10 11q3-4 7-2" stroke="white" stroke-width="2.5" opacity=".75" fill="none" stroke-linecap="round"/></svg>';
 holder.append(outer);delay(()=>outer.remove(),9500);
}
function heartBurst(count){
 for(let i=0;i<count;i++)pulseHeart(i);
}
function petalSVG(index){
 // Original storybook illustration rather than emoji or stock rose.
 if(index%4===0)return '<svg viewBox="0 0 34 44" aria-hidden="true"><path d="M18 3C7 8 1 20 4 32q10 15 22 5C35 27 32 12 18 3Z" fill="#f9b3bf" stroke="#e08fa0" stroke-width="1.4"/><path d="M10 31q13-13 9-25" stroke="#ec8f9c" fill="none" stroke-width="1.7"/></svg>';
 return '<svg viewBox="0 0 34 44" aria-hidden="true"><path d="M17 3C5 5 0 16 5 30c5 11 14 14 23 3C31 23 30 8 17 3Z" fill="'+(['#f6c2c7','#f3abbf','#f9c9b8'][index%3])+'" stroke="#d995a3" stroke-width="1.5"/><path d="M11 29q12-10 9-21" fill="none" stroke="#e49caa" stroke-width="1.7"/></svg>';
}
function petals(count){
 const holder=cover.querySelector('.nhi-illustrated-flowers');
 if(!holder||reduce())return;
 for(let i=0;i<count;i++){
  const p=make('span','nhi-drawn-petal');p.innerHTML=petalSVG(i);
  p.style.setProperty('--petal-left',(i%2?rnd(77,100):rnd(0,23))+'%');
  p.style.setProperty('--petal-size',rnd(14,27)+'px');
  p.style.setProperty('--petal-wind',rnd(-40,40)+'px');
  p.style.setProperty('--petal-delay',rnd(0,4)+'s');
  p.style.setProperty('--petal-time',rnd(9,15)+'s');
  holder.append(p);delay(()=>p.remove(),20000);
 }
}
function talk(){
 if(!scene())cover.classList.add('nhi-v2-preview');
 cover.classList.remove('nhi-v2-talking');void cover.offsetWidth;
 cover.classList.add('nhi-v2-talking');
 delay(()=>cover.classList.remove('nhi-v2-talking'),4600);
}
function start(){
 reset();cover.classList.remove('nhi-v2-preview');void cover.offsetWidth;
 cover.classList.add('nhi-romance-v2-running');
 if(reduce()){cover.classList.add('nhi-v2-done');return;}
 const run=sceneId;
 delay(()=>{if(run===sceneId){cover.classList.add('nhi-v2-kissing');heartBurst(7);petals(8);}},7200);
 delay(()=>{if(run===sceneId)cover.classList.remove('nhi-v2-kissing');},9900);
 delay(()=>{if(run===sceneId)cover.classList.add('nhi-v2-done');},12800);
}
function tone(ctx,hz,start,len,volume){
 const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=hz;
 g.gain.setValueAtTime(.00001,start);g.gain.exponentialRampToValueAtTime(volume,start+.14);
 g.gain.exponentialRampToValueAtTime(.00001,start+len);
 o.connect(g);g.connect(ctx.destination);o.start(start);o.stop(start+len+.03);
}
function stopSound(){
 if(audioTick)clearInterval(audioTick);audioTick=null;
 if(audio){const a=audio;audio=null;a.close().catch(()=>{});}
}
function toggleSound(){
 if(audio){stopSound();return false;}
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return false;
  audio=new Audio();audio.resume().catch(()=>{});
  const chords=[[261.63,329.63,392],[220,261.63,349.23],[196,246.94,329.63],[220,293.66,392]];
  let t=0;const play=()=>{if(!audio)return;const now=audio.currentTime+.04,notes=chords[t++%chords.length];
   notes.forEach((v,i)=>tone(audio,v,now+i*.25,3,.008));tone(audio,notes[0]/2,now,3.2,.004);};
  play();audioTick=setInterval(play,3350);return true;
 }catch(_e){stopSound();return false;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.addEventListener('pagehide',stopSound);
})();