/* November polish: editable AI quick prompts, accessible navigation and viewport-fit sessions. */
(function(){
'use strict';
const KEY='nhi-ai-quick-prompts-v15';
const DEFAULTS={
 card:['Giải thích thẻ này','Phân tích ngữ pháp','Cho 3 ví dụ khác','Cách nói lịch sự hơn','Bản dịch này tự nhiên chưa?'],
 general:['Cách chào sếp buổi sáng','Phân biệt 은/는 và 이/가','Mẫu câu báo cáo tiến độ']
};
let data={},scope='card';
try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');if(x&&typeof x==='object')data=x;}catch(e){}
function sanitize(arr){return Array.isArray(arr)?arr.filter(x=>typeof x==='string').map(x=>x.trim().slice(0,140)).filter(Boolean).slice(0,15):null;}
function list(isCard,fallback){
 const k=isCard?'card':'general',v=sanitize(data[k]);return v===null?(fallback||DEFAULTS[k]).slice():v;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){return false;}refreshQuick();return true;}
function refreshQuick(){if(document.body.classList.contains('ai-open')&&window.NLC_AI)window.NLC_AI.open();}
window.NHI_PROMPTS={list};
function node(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
function makeBtn(text,action){const b=node('button','ghost',text);b.type='button';b.addEventListener('click',action);return b;}
function setupPrompts(){
 const target=document.getElementById('nhiCardFontSettings');if(!target)return;
 const root=node('section','setgroup');root.id='nhiAiQuickEditor';
 root.append(node('h3',null,'Câu hỏi mẫu trong chatbox AI'));
 root.append(node('p','voice-note','Thêm, sửa hoặc xóa câu hỏi nhanh. Nội dung được lưu trên trình duyệt này.'));
 const tabs=node('div','nhi-prompt-scopes');const rows=node('div','nhi-prompt-rows');const actions=node('div','nhi-prompt-actions');
 const names=[['card','Khi đang học thẻ'],['general','Hỏi chung']];
 const tabButtons=names.map(([k,text])=>{const b=makeBtn(text,()=>{scope=k;draw();});b.setAttribute('aria-label','Câu hỏi mẫu: '+text);tabs.append(b);return [k,b];});
 function current(){return list(scope==='card');}
 function setCurrent(values){data[scope]=values.slice(0,15);save();}
 function draw(){
  for(const [k,b] of tabButtons)b.setAttribute('aria-pressed',String(k===scope));
  rows.replaceChildren();
  const values=current();
  values.forEach((v,i)=>{
   const row=node('div','nhi-prompt-row');
   const field=node('input','field');field.type='text';field.value=v;field.maxLength=140;
   field.setAttribute('aria-label','Câu hỏi mẫu '+(i+1));
   field.addEventListener('change',()=>{const copy=current();copy[i]=field.value.trim();setCurrent(copy.filter(Boolean));draw();});
   const remove=makeBtn('×',()=>{const copy=current();copy.splice(i,1);setCurrent(copy);draw();});
   remove.title='Xóa câu hỏi '+(i+1);remove.setAttribute('aria-label',remove.title);
   row.append(field,remove);rows.append(row);
  });
 }
 const add=makeBtn('+ Thêm câu hỏi',()=>{
  const copy=current();
  if(copy.length>=15)return;
  copy.push('Câu hỏi mới');
  setCurrent(copy);draw();
  const fields=rows.querySelectorAll('input');const last=fields[fields.length-1];
  if(last){last.focus();last.select();}
 });
 const restore=makeBtn('Khôi phục mặc định',()=>{delete data[scope];save();draw();});
 actions.append(add,restore);root.append(tabs,rows,actions);target.before(root);draw();
}
function setupMenu(){
 const menu=document.getElementById('menuList'),top=document.getElementById('aiBtn');if(!menu||!top)return;
 const b=node('button',null,'Hỏi AI');
 b.type='button';b.id='menuAi';b.style.setProperty('--mc','#08b4bd');
 const ic=node('span','mi');ic.setAttribute('data-ic','spark');b.prepend(ic);
 b.onclick=()=>{if(!menu.hidden)document.getElementById('menuBtn')?.click();window.NLC_AI?.open();};
 menu.querySelector('hr')?.before(b);
}
let scheduled=false;
function fit(){
 scheduled=false;
 const card=document.querySelector('#planBox .pcard');
 if(!card||innerWidth<720||innerHeight<600){
  document.body.classList.remove('nhi-viewport-fit');
  if(card)card.style.removeProperty('--nhi-card-fit');
  return;
 }
 const top=card.getBoundingClientRect().top;
 if(top<0||top>innerHeight-280){
  document.body.classList.remove('nhi-viewport-fit');return;
 }
 const usable=Math.max(310,Math.round(innerHeight-top-10));
 card.style.setProperty('--nhi-card-fit',usable+'px');
 document.body.classList.add('nhi-viewport-fit');
}
function scheduleFit(){if(scheduled)return;scheduled=true;requestAnimationFrame(fit);}
function setupFit(){
 const plan=document.getElementById('planBox');
 if(plan)new MutationObserver(scheduleFit).observe(plan,{childList:true});
 window.addEventListener('resize',scheduleFit,{passive:true});
 window.addEventListener('orientationchange',scheduleFit,{passive:true});
 scheduleFit();
}
function init(){setupPrompts();setupMenu();setupFit();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();