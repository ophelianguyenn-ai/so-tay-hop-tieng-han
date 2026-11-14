/* Shared study controls. Persisted card data is owned by the existing synced plan. */
(function(){
'use strict';
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function button(text,fn){const b=make('button','ghost',text);b.type='button';b.onclick=fn;return b;}
function dictionary(word,kind){
 word=String(word||'').trim();if(!word)return;
 const url=kind==='en'?'https://vdict.com/'+encodeURIComponent(word)+',1,0,0.html':
 'https://korean.dict.naver.com/'+(kind==='ko-en'?'koendict':'kovidict')+'/#/search?query='+encodeURIComponent(word);
 const dialog=make('dialog','nhi-dictionary-dialog'),head=make('div','nhi-dialog-head');
 head.append(make('strong',null,(kind==='en'?'VDict':kind==='ko-en'?'Naver Hàn–Anh':'Naver Hàn–Việt')+' · '+word),button('× Đóng',()=>dialog.close()));
 const frame=make('iframe');frame.title='Tra từ '+word;frame.referrerPolicy='no-referrer';frame.src=url;
 const link=make('a','ghost','Mở từ điển trong cửa sổ riêng');link.href=url;link.target='_blank';link.rel='noopener noreferrer';
 dialog.append(head,make('p','hint','Nếu từ điển chặn hiển thị trong khung, dùng nút mở cửa sổ riêng.'),link,frame);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
}
function dictionaryButtons(root,value){
 for(const [label,kind] of [['🇰🇷🇻🇳','ko-vi'],['🇰🇷🇬🇧','ko-en']]){const b=button(label,()=>dictionary(value(),kind));b.className='iconbtn sm nhi-dict-button';b.title=kind==='ko-vi'?'Tra Naver Hàn–Việt: từ đã chọn':'Tra Naver Hàn–Anh: từ đã chọn';b.setAttribute('aria-label',b.title);root.append(b);}
}
function wordElements(root,text){
 root.replaceChildren();for(const part of String(text).split(/([\p{L}\p{N}]+(?:['’'-][\p{L}\p{N}]+)*)/u)){
 if(/[\p{L}\p{N}]/u.test(part)){const word=make('span','nhi-en-word',part);word.tabIndex=0;word.setAttribute('role','button');word.title='Nhấn: sao chép · Nhấn đúp: tra VDict';
 const copy=async()=>{try{await navigator.clipboard.writeText(part);word.classList.add('copied');setTimeout(()=>word.classList.remove('copied'),700);}catch(e){const sel=getSelection(),range=document.createRange();range.selectNodeContents(word);sel.removeAllRanges();sel.addRange(range);}};
 word.onclick=e=>{e.stopPropagation();copy();};word.ondblclick=e=>{e.preventDefault();e.stopPropagation();dictionary(part,'en');};
 word.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();dictionary(part,'en');}if(e.key===' '){e.preventDefault();copy();}};root.append(word);
 }else root.append(document.createTextNode(part));}
}
function markText(root,ranges){
 if(!Array.isArray(ranges)||!ranges.length)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let node,offset=0;
 while((node=walker.nextNode())){nodes.push({node,start:offset,end:offset+node.length});offset+=node.length;}
 for(const {node,start,end} of nodes){const cuts=new Set([start,end]);for(const r of ranges){if(r.start>start&&r.start<end)cuts.add(r.start);if(r.end>start&&r.end<end)cuts.add(r.end);}
 const points=[...cuts].sort((a,b)=>a-b),frag=document.createDocumentFragment();for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],span=make('span',null,node.data.slice(a-start,b-start));for(const r of ranges){if(r.start<=a&&r.end>=b){if(r.bold)span.style.fontWeight='800';if(/^#[0-9a-f]{6}$/i.test(r.color||'')){span.style.backgroundColor=r.color;span.style.color='#172b3a';span.style.borderRadius='3px';}}}frag.append(span);}node.replaceWith(frag);}
}
function editor(form,fields,saved){
 let draft=JSON.parse(JSON.stringify(saved));const palette=['#fff3a6','#bfe8ff','#ffd5e5','#ccf0d2','#ffdfbf','#dfd5fa'];
 for(const [lang,field] of Object.entries(fields)){
 const tools=make('div','nhi-format-tools'),preview=make('p','nhi-format-preview'),target=field.parentElement;
 tools.append(make('span',null,'Bôi chọn chữ trong ô '+(lang==='vi'?'Việt':'Hàn')+':'));
 function paint(){preview.textContent=field.value;markText(preview,draft[lang]||[]);}
 function apply(style){const a=field.selectionStart,b=field.selectionEnd;if(a===b){field.focus();return;}draft[lang]=[...(draft[lang]||[]),{start:a,end:b,...style}];paint();field.focus();field.setSelectionRange(a,b);}
 const bold=button('B',()=>apply({bold:true}));bold.style.fontWeight='800';tools.append(bold);
 for(const color of palette){const b=button('●',()=>apply({color}));b.style.color=color;b.style.background='#34495e';b.title='Tô nền '+color;b.setAttribute('aria-label',b.title);tools.append(b);}
 const custom=make('input');custom.type='color';custom.value=palette[0];custom.title='Chọn màu tô nền';custom.setAttribute('aria-label',custom.title);
 custom.onchange=()=>apply({color:custom.value});tools.append(custom,button('Bỏ định dạng',()=>{draft[lang]=[];paint();}));
 tools.addEventListener('mousedown',e=>{if(e.target.tagName==='BUTTON')e.preventDefault();});
 field.addEventListener('input',()=>{draft[lang]=[];paint();});target.after(tools,preview);paint();
 }
 return ()=>draft;
}
let audioContext;
function feedback(kind){
 try{audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const now=audioContext.currentTime;
 (kind==='hard'?[330,261,196]:[392,440]).forEach((f,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=now+i*.13;o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.22);});}catch(e){}
}
function initReader(){
 const panel=document.getElementById('aiPanel'),log=document.getElementById('aiLog');if(!panel||!log)return;
 const bar=make('div','nhi-reader-toolbar'),speed=make('select');speed.setAttribute('aria-label','Tốc độ đọc AI');
 for(const r of [.5,.75,1,1.25,1.5,2]){const o=make('option',null,r+'×');o.value=r;o.selected=r===1;speed.append(o);}
 let selected='',lastMessage=null;
 document.addEventListener('selectionchange',()=>{const selection=getSelection();if(selection&&selection.rangeCount&&log.contains(selection.anchorNode)&&log.contains(selection.focusNode)&&selection.toString().trim())selected=selection.toString().trim();});
 const pause=button('⏸ Tạm dừng',()=>{const speech=window.NHI_SPEECH;if(speech.paused()){speech.resume();pause.textContent='⏸ Tạm dừng';}else{speech.pause();pause.textContent='▶ Tiếp tục';}});
 const read=(text)=>{window.NHI_SPEECH.speak(text,/[가-힣]/.test(text)&&!/[àáạảãăâđêôơư]/i.test(text)?'ko-KR':'vi-VN',null,Number(speed.value));pause.textContent='⏸ Tạm dừng';};
 bar.append(button('🔊 Đọc đoạn chọn',()=>{const text=selected;if(text)read(text);}),button('Đọc trả lời cuối',()=>{const msg=log.querySelector('.aimsg.ai:last-of-type');if(msg)read(msg.innerText.replace('🔊 Đọc đoạn này',''));}),speed,pause,button('■ Dừng',()=>{window.NHI_SPEECH.stop();pause.textContent='⏸ Tạm dừng';}));
 log.before(bar);
 function mount(){for(const msg of log.querySelectorAll('.aimsg.ai:not(.wait)')){if(msg.querySelector('.nhi-read-message'))continue;const b=button('🔊 Đọc đoạn này',()=>{lastMessage=msg;read(msg.innerText.replace('🔊 Đọc đoạn này',''));});b.classList.add('nhi-read-message');msg.append(b);}}
 new MutationObserver(mount).observe(log,{childList:true});mount();
 document.getElementById('aiClose').addEventListener('click',()=>window.NHI_SPEECH.stop());
}
window.NHI_STUDY={dictionary,dictionaryButtons,wordElements,markText,editor,feedback};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initReader);else initReader();
})();
