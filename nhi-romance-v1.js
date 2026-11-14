/* Optional storybook cover scene, deliberately isolated from study data. */
(function(){
'use strict';
const cover=document.getElementById('cover');
const hero=document.getElementById('coverHero');
if(!cover||!hero)return;
const make=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n;};
let installed=false,timers=[],music=null,musicTimer=null;
const later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.push(t);return t;};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const random=(a,b)=>a+Math.random()*(b-a);
function setup(){
 if(installed)return;installed=true;
 const boy=make('img','nhi-luong');boy.src='nhi-luong-v1.svg?v=20261114';boy.alt='Lương, chàng trai mặc áo polo nâu';boy.draggable=false;hero.append(boy);
 const kiss=make('span','nhi-kiss-mark');kiss.setAttribute('aria-hidden','true');kiss.textContent='💋';hero.append(kiss);
 for(const [cls,words] of [['nhi-girl-bubble','ck iu'],['nhi-boy-bubble','vợ iu']]){
  const bubble=make('span','nhi-couple-bubble '+cls);bubble.textContent=words;bubble.setAttribute('role','status');hero.append(bubble);
 }
 const bouquet=make('button');bouquet.id='nhiBouquetLove';bouquet.type='button';bouquet.setAttribute('aria-label','Chạm bó hoa: Nhi và Lương trò chuyện');bouquet.title='Bó hoa: ck iu / vợ iu';hero.append(bouquet);
 bouquet.addEventListener('click',e=>{e.stopPropagation();talk();});
 const sun=make('button','nhi-love-hotspot');sun.id='nhiSunKiss';sun.type='button';sun.setAttribute('aria-label','Bấm vào mặt trời để xem Lương và Nhi hôn nhau');sun.title='Mặt trời: Lương và Nhi';cover.append(sun);
 sun.addEventListener('click',e=>{e.stopPropagation();startScene();});
 // The sun is part of a background painting: its visual position can shift
 // with the viewport crop. Catch the painted upper-right area as well.
 cover.addEventListener('click',e=>{
  if(e.target.closest('#nhiSunKiss,#nhiBridgeMusic,#nhiBouquetLove,#nhi-season-controls,#coverGo'))return;
  const r=cover.getBoundingClientRect();
  const x=(e.clientX-r.left)/Math.max(1,r.width),y=(e.clientY-r.top)/Math.max(1,r.height);
  if(x>=.62&&x<=.93&&y>=.035&&y<=.33){
   e.preventDefault();e.stopImmediatePropagation();startScene();
  }
 },true);
 const bridge=make('button','nhi-love-hotspot');bridge.id='nhiBridgeMusic';bridge.type='button';bridge.setAttribute('aria-label','Bấm vào cầu: bật hoặc tắt nhạc và hoa hồng rơi');bridge.title='Cây cầu: âm nhạc và hoa hồng';bridge.setAttribute('aria-pressed','false');cover.append(bridge);
 bridge.addEventListener('click',e=>{e.stopPropagation();const now=toggleMusic();bridge.setAttribute('aria-pressed',String(now));if(now)roses();});
 const layer=make('div','nhi-story-layer');layer.id='nhiRomanceHearts';layer.setAttribute('aria-hidden','true');cover.append(layer);
 const roseLayer=make('div','nhi-story-layer');roseLayer.id='nhiRomanceRoses';roseLayer.setAttribute('aria-hidden','true');cover.append(roseLayer);
 const name=make('div','nhi-romance-title');name.id='nhiLoveTitle';name.setAttribute('aria-live','polite');
 name.append(document.createTextNode('Lương '));const h=make('b');h.textContent='❤️';name.append(h,document.createTextNode(' Nhi'));cover.append(name);
}
function talk(){
 if(!cover.classList.contains('nhi-romance-on'))cover.classList.add('nhi-love-preview');
 hero.querySelector('.nhi-luong').style.opacity='1';
 hero.querySelector('.nhi-luong').style.transform='translateX(-20px)';
 for(const bubble of hero.querySelectorAll('.nhi-couple-bubble')){
  bubble.classList.remove('nhi-speaking');void bubble.offsetWidth;bubble.classList.add('nhi-speaking');
 }
 later(()=>{hero.querySelectorAll('.nhi-couple-bubble').forEach(b=>b.classList.remove('nhi-speaking'));},5500);
}
function hearts(count){
 const layer=document.getElementById('nhiRomanceHearts');
 if(!layer||reduced())return;
 const frag=document.createDocumentFragment();
 const marks=['♡','♥','♡','♥'];
 for(let i=0;i<count;i++){
  const item=make('span','nhi-love-heart');item.textContent=marks[i%marks.length];
  item.style.setProperty('--heart-size',random(15,26)+'px');
  item.style.setProperty('--heart-color',['#f296a6','#ed6f83','#e3a64f','#ffbb71'][i%4]);
  item.style.left=(i%2===0?'17%':'83%');
  item.style.top=random(34,55)+'%';
  item.style.setProperty('--heart-time',random(5.3,10)+'s');
  item.style.setProperty('--heart-delay',random(0,4)+'s');
  item.style.setProperty('--start-x',random(-35,35)+'px');
  item.style.setProperty('--start-y',random(0,75)+'px');
  item.style.setProperty('--end-x',(i%2===0?-1:1)*random(35,115)+'px');
  item.style.setProperty('--end-y',random(-innerHeight*.55,-innerHeight*.9)+'px');
  item.style.setProperty('--turn',random(-250,250)+'deg');
  frag.append(item);
 }
 layer.append(frag);
 later(()=>{layer.replaceChildren();},14500);
}
function startScene(){
 timers.forEach(clearTimeout);timers=[];
 const layer=document.getElementById('nhiRomanceHearts');layer.replaceChildren();
 const title=document.getElementById('nhiLoveTitle');title.classList.remove('nhi-visible');
 cover.classList.remove('nhi-love-preview','nhi-romance-on');
 hero.querySelector('.nhi-luong').style.removeProperty('opacity');
 hero.querySelector('.nhi-luong').style.removeProperty('transform');
 void cover.offsetWidth;
 cover.classList.add('nhi-romance-on');
 if(reduced()){title.classList.add('nhi-visible');talk();return;}
 later(()=>hearts(innerWidth<700?6:9),5300);
 later(()=>hearts(innerWidth<700?5:7),11300);
 later(()=>talk(),17300);
 later(()=>title.classList.add('nhi-visible'),19200);
}
function roses(){
 const layer=document.getElementById('nhiRomanceRoses');if(!layer||reduced())return;
 layer.replaceChildren();const frag=document.createDocumentFragment();
 for(let i=0;i<(innerWidth<700?24:42);i++){
  const item=make('span','nhi-rose');item.textContent=i%5===0?'🌸':'🌹';
  item.style.setProperty('--rose-x',random(0,100)+'%');
  item.style.setProperty('--rose-size',random(17,36)+'px');
  item.style.setProperty('--rose-duration',random(7,13)+'s');
  item.style.setProperty('--rose-delay',random(0,7)+'s');
  item.style.setProperty('--rose-drift',random(-150,150)+'px');
  item.style.setProperty('--rose-turn',random(-720,720)+'deg');
  frag.append(item);
 }
 layer.append(frag);setTimeout(()=>layer.replaceChildren(),21000);
}
/* Original, very soft instrumental ambience; starts only after a user gesture.
   No third-party recording or chat link is used. */
function tone(ctx,hz,at,dur,volume){
 const osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type='sine';osc.frequency.setValueAtTime(hz,at);
 gain.gain.setValueAtTime(.00001,at);
 gain.gain.exponentialRampToValueAtTime(volume,at+.12);
 gain.gain.exponentialRampToValueAtTime(.00001,at+dur);
 osc.connect(gain);gain.connect(ctx.destination);
 osc.start(at);osc.stop(at+dur+.04);
}
function stopMusic(){
 if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
 if(music){const old=music;music=null;old.close().catch(()=>{});}
}
function toggleMusic(){
 if(music){stopMusic();return false;}
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return false;
 try{
  music=new Audio();music.resume().catch(()=>{});
  const chords=[[261.63,329.63,392],[220,261.63,349.23],[196,246.94,329.63],[220,293.66,392]];
  let step=0;
  const play=()=>{
   if(!music)return;
   const now=music.currentTime+.04, chord=chords[step++%chords.length];
   chord.forEach((hz,i)=>tone(music,hz,now+i*.29,3.2,.008));
   tone(music,chord[0]/2,now,3.6,.006);
  };
  play();musicTimer=setInterval(play,3550);
  return true;
 }catch(_e){stopMusic();return false;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.addEventListener('pagehide',stopMusic);
})();