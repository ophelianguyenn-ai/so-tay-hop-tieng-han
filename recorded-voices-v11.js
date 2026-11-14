(function(){
'use strict';let manifest={},normalized={},player=null,timer=0,token=0,finishCurrent=null,segment=null;
const key=(text,lang)=>lang.slice(0,2)+'|'+String(text).normalize('NFC').trim().replace(/\s+/g,' ').replace(/[.!?。？！]+$/,'');
const ready=fetch('audio-manifest.json?v=20261114',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Audio manifest unavailable');return r.json();}).then(x=>{manifest=x||{};for(const [k,v]of Object.entries(manifest))normalized[key(k.slice(3),k.slice(0,2))]=v;document.dispatchEvent(new CustomEvent('nhi-audio-ready',{detail:{count:Object.keys(manifest).length}}));return manifest;}).catch(()=>manifest={});
function stop(){token++;clearTimeout(timer);if(player){player.pause();player.removeAttribute('src');player.load();player=null;}finishCurrent=null;segment=null;}
function arm(){clearTimeout(timer);if(!player||!segment)return;timer=setTimeout(finishCurrent,Math.max(0,(segment.end+.06-player.currentTime)/player.playbackRate)*1000);}
function play(text,lang,rate,done){const row=manifest[lang.slice(0,2)+'|'+text]||normalized[key(text,lang)];if(!row)return false;stop();const mine=token,a=player=new Audio(row.src);segment=row;let ended=false;
function finish(){if(ended||mine!==token)return;ended=true;clearTimeout(timer);a.pause();player=null;segment=null;finishCurrent=null;if(done)done();}finishCurrent=finish;
a.playbackRate=rate||1;a.preload='auto';a.onloadedmetadata=()=>{if(mine!==token)return;a.currentTime=Math.max(0,row.start-.03);a.play().catch(finish);};a.ontimeupdate=()=>{if(a.currentTime>=row.end+.06)finish();};a.onplaying=arm;a.onerror=finish;a.onended=finish;return true;}
function pause(){clearTimeout(timer);if(player)player.pause();}
function resume(){if(player)player.play().catch(()=>{if(finishCurrent)finishCurrent();});}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
window.NHI_AUDIO={play,stop,pause,resume,ready,urlFor:(text,lang)=>{const row=manifest[lang.slice(0,2)+'|'+text]||normalized[key(text,lang)];return row?.src||'';},count:()=>{const result={ko:0,vi:0,en:0};for(const k of Object.keys(manifest)){if(k.slice(0,2)in result)result[k.slice(0,2)]++;}return result;}};
})();
