/* Shared card editing, dictionary docks and continuous AI reading. */
(function(){
'use strict';
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function button(text,fn){const b=make('button','ghost',text);b.type='button';b.onclick=fn;return b;}
const palettes=[['#dbeefe','Xanh biển'],['#fce1ed','Hồng'],['#fff3c4','Vàng'],['#ffe4cc','Cam'],['#ffdddd','Đỏ nhạt'],['#e6e0fa','Tím'],['#ddf4e4','Xanh lá']];
function icon(kind){
 const svg=kind==='headphones'?'<path d="M8 32v-7a24 24 0 0 1 48 0v7M13 25h5v29h-5a7 7 0 0 1-7-7V32a7 7 0 0 1 7-7zm38 0h-5v29h5a7 7 0 0 0 7-7V32a7 7 0 0 0-7-7z" fill="none" stroke="#00bda5" stroke-width="4"/><path d="M11 22a21 21 0 0 1 42 0" fill="none" stroke="#12bafa" stroke-width="3"/>':'<g stroke="#171717" stroke-width="3" stroke-linejoin="round"><path d="M9 45L44 10l12 12-35 35-16 4z" fill="#ffd343"/><path d="M44 10l4-4q4-4 8 0l6 6q4 4 0 8l-6 4z" fill="#ed493b"/><path d="M9 45l12 12-16 4z" fill="#f4cd7e"/><path d="M6 54l6 5-7 2z" fill="#4e4f55"/><path d="M15 48l34-34M20 53l34-34" fill="none"/></g>';
 return '<svg viewBox="0 0 68 68" aria-hidden="true" focusable="false">'+svg+'</svg>';
}
function dictionaryIcon(kind){return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="4" fill="#073dbb"/><text x="7" y="47" fill="#00ed68" font-family="Arial,sans-serif" font-size="43" font-weight="900">'+(kind==='ko-vi'?'V':'K')+'</text><g fill="white" font-family="sans-serif" font-size="14" font-weight="700"><text x="47" y="20">가</text><text x="47" y="37">あ</text><text x="47" y="54">文</text></g></svg>';}
let dock=null,dictWidth=480;
try{dictWidth=Number(localStorage.getItem('nhi-dictionary-width-v1'))||480;}catch(e){}
function setVar(name,value){if(document.documentElement.style.getPropertyValue(name)!==value)document.documentElement.style.setProperty(name,value);}
function layout(){
 const ai=document.body.classList.contains('ai-open'),di=document.body.classList.contains('dictionary-open');
 const desiredAI=parseFloat(document.documentElement.style.getPropertyValue('--nhi-ai-width'))||520;
 let a=ai?desiredAI:0,d=di?dictWidth:0;
 const available=Math.max(180,innerWidth-(innerWidth>=700?300:Math.round(innerWidth*.44)));
 if(a+d>available){const scale=available/(a+d);a*=scale;d*=scale;}
 setVar('--nhi-ai-effective',a+'px');
 setVar('--nhi-dict-effective',d+'px');
 setVar('--nhi-dock-width',(a+d)+'px');
 if(document.body.classList.contains('nhi-docked')!==(ai||di))document.body.classList.toggle('nhi-docked',ai||di);
}
function dictionary(word,kind){
 word=String(word||'').trim();if(!word)return;
 const url=kind==='en'?'https://vdict.com/'+encodeURIComponent(word)+',1,0,0.html':
 'https://korean.dict.naver.com/'+(kind==='ko-en'?'koendict':'kovidict')+'/#/search?query='+encodeURIComponent(word);
 if(!dock){
  dock=make('aside','nhi-dictionary-dock');dock.id='nhiDictionary';dock.setAttribute('aria-label','Cửa sổ từ điển');
  const grip=make('div','nhi-dict-resize');grip.tabIndex=0;grip.setAttribute('role','separator');grip.setAttribute('aria-label','Đổi độ rộng từ điển');grip.setAttribute('aria-orientation','vertical');
  const head=make('div','nhi-dialog-head'),title=make('strong');head.append(title,button('×',()=>{document.body.classList.remove('dictionary-open');dock.hidden=true;layout();}));head.lastChild.setAttribute('aria-label','Đóng từ điển');
  const link=make('a','nhi-dictionary-external','Mở riêng ↗');link.target='_blank';link.rel='noopener noreferrer';
  const hint=make('p','hint','Nếu trang từ điển chặn nhúng, bấm Mở riêng ↗.');
  const frame=make('iframe');frame.title='Từ điển';frame.referrerPolicy='no-referrer';
  dock.append(grip,head,link,hint,frame);document.body.append(dock);
  let drag=null;
  const persist=()=>{try{localStorage.setItem('nhi-dictionary-width-v1',String(dictWidth));}catch(e){}};
  grip.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();drag={x:e.clientX,w:dock.getBoundingClientRect().width};grip.setPointerCapture(e.pointerId);};
  grip.onpointermove=e=>{if(!drag)return;dictWidth=Math.max(220,Math.min(innerWidth-260,drag.w+drag.x-e.clientX));layout();};
  grip.onpointerup=grip.onpointercancel=()=>{if(!drag)return;drag=null;persist();};
  grip.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();dictWidth=Math.max(220,Math.min(innerWidth-260,dictWidth+(e.key==='ArrowLeft'?24:-24)));persist();layout();};
 }
 dock.querySelector('strong').textContent=(kind==='en'?'VDict':kind==='ko-en'?'Naver Hàn–Anh':'Naver Hàn–Việt')+' · '+word;
 dock.querySelector('iframe').src=url;dock.querySelector('a').href=url;dock.hidden=false;document.body.classList.add('dictionary-open');layout();
}
function dictionaryButtons(root,value){
 for(const kind of ['ko-vi','ko-en']){const b=button('',()=>dictionary(value(),kind));b.innerHTML=dictionaryIcon(kind);b.className='iconbtn sm nhi-dict-button';b.title=kind==='ko-vi'?'Tra Naver Hàn–Việt: từ đã chọn':'Tra Naver Hàn–Anh: từ đã chọn';b.setAttribute('aria-label',b.title);root.append(b);}
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
 const points=[...cuts].sort((a,b)=>a-b),frag=document.createDocumentFragment();for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],span=make('span',null,node.data.slice(a-start,b-start));for(const r of ranges){if(r.start<=a&&r.end>=b){if(r.bold)span.style.fontWeight='800';if(r.underline)span.style.textDecoration='underline';if(/^#[0-9a-f]{6}$/i.test(r.color||'')){span.style.backgroundColor=r.color;span.style.color='#172b3a';span.style.borderRadius='3px';}}}frag.append(span);}node.replaceWith(frag);}
}
function formatText(root,format,lang){markText(root,format[lang]||[]);const size=Number((format._sizes||{})[lang]);if(size>=12&&size<=72)root.style.setProperty('font-size',size+'px','important');}
/* One toolbar, one directly editable surface per language; plain text remains the storage format. */
function editor(form,fields,saved,options={}){
 const draft=JSON.parse(JSON.stringify(saved||{}));draft._sizes=draft._sizes||{};
 const tools=make('div','nhi-format-tools');tools.setAttribute('role','toolbar');tools.setAttribute('aria-label','Định dạng chữ');
 const activeLabel=make('span','nhi-format-active');tools.append(activeLabel);
 const labels={ko:'Hàn',vi:'Việt',en:'Anh',note:'Ghi chú'};const views={};let active=Object.keys(fields)[0],selection={start:0,end:0},painting=false;
 function rangesToChars(lang){return Array.from({length:fields[lang].value.length},(_,i)=>{const style={};for(const r of draft[lang]||[])if(i>=r.start&&i<r.end)Object.assign(style,{...(r.bold?{bold:true}:{}),...(r.underline?{underline:true}:{}),...(r.color?{color:r.color}:{})});return style;});}
 function charsToRanges(chars){const ranges=[];for(let i=0;i<chars.length;i++){if(!Object.keys(chars[i]).length)continue;const last=ranges.at(-1),key=JSON.stringify(chars[i]);if(last&&last.end===i&&last.key===key)last.end++;else ranges.push({start:i,end:i+1,...chars[i],key});}return ranges.map(({key,...r})=>r);}
 function remember(){if(painting)return;const sel=getSelection(),view=views[active];if(!sel?.rangeCount||!view.contains(sel.anchorNode)||!view.contains(sel.focusNode))return;const r=sel.getRangeAt(0),before=r.cloneRange();before.selectNodeContents(view);before.setEnd(r.startContainer,r.startOffset);selection={start:before.toString().length,end:before.toString().length+r.toString().length};refresh();}
 function restore(){const view=views[active],walker=document.createTreeWalker(view,NodeFilter.SHOW_TEXT);let n,pos=0,start=null,end=null;while((n=walker.nextNode())){if(!start&&selection.start<=pos+n.length)start=[n,Math.max(0,selection.start-pos)];if(selection.end<=pos+n.length){end=[n,Math.max(0,selection.end-pos)];break;}pos+=n.length;}view.focus();if(start&&end){const r=document.createRange();r.setStart(...start);r.setEnd(...end);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);}}
 function paint(lang,keep){painting=true;views[lang].textContent=fields[lang].value;formatText(views[lang],draft,lang);if(keep)restore();painting=false;refresh();}
 function toggle(prop,value){remember();const a=selection.start,b=selection.end;if(a===b){if(active==='note'&&prop==='color'&&options.noteColor){options.noteColor.value=options.noteColor.value===value?'#ffffff':value;views.note.style.backgroundColor=options.noteColor.value;}restore();return;}const chars=rangesToChars(active),remove=chars.slice(a,b).every(c=>c[prop]===value);for(let i=a;i<b;i++){if(remove)delete chars[i][prop];else chars[i][prop]=value;}draft[active]=charsToRanges(chars);paint(active,true);}
 const bold=button('B',()=>toggle('bold',true));bold.title='In đậm / bỏ in đậm';bold.setAttribute('aria-label',bold.title);bold.style.fontWeight='800';
 const underline=button('U',()=>toggle('underline',true));underline.title='Gạch chân / bỏ gạch chân';underline.setAttribute('aria-label',underline.title);underline.style.textDecoration='underline';tools.append(bold,underline);
 const size=make('select');size.setAttribute('aria-label','Cỡ chữ phần đang sửa');for(let i=12;i<=72;i+=2){const o=make('option',null,i+'');o.value=i;size.append(o);}size.onchange=()=>{draft._sizes[active]=Number(size.value);paint(active,true);};tools.append(size);
 const colors=[];for(const [color,name] of palettes){const b=button('',()=>toggle('color',color));b.className='nhi-color-swatch';b.style.background=color;b.title=name+' / bỏ màu';b.setAttribute('aria-label',b.title);tools.append(b);colors.push([b,color]);}
 tools.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault();});
 function refresh(){activeLabel.textContent=labels[active];size.value=String(draft._sizes[active]||parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nhi-card-'+active))||18);const chars=rangesToChars(active).slice(selection.start,selection.end),every=(p,v)=>chars.length>0&&chars.every(c=>c[p]===v);bold.setAttribute('aria-pressed',String(every('bold',true)));underline.setAttribute('aria-pressed',String(every('underline',true)));for(const [b,c]of colors)b.setAttribute('aria-pressed',String(every('color',c)));}
 for(const [lang,field]of Object.entries(fields)){
  const view=make('div','field nhi-rich-field');views[lang]=view;view.contentEditable='true';view.setAttribute('role','textbox');view.setAttribute('aria-multiline','true');view.setAttribute('aria-label',labels[lang]);view.dataset.language=lang;view.lang=lang==='note'?'ko':lang;view.spellcheck=false;
  field.hidden=true;field.setAttribute('aria-hidden','true');field.after(view);
  view.addEventListener('focus',()=>{if(active!==lang){active=lang;selection={start:0,end:0};}refresh();});
  view.addEventListener('keyup',remember);view.addEventListener('pointerup',remember);
  view.addEventListener('input',()=>{active=lang;const old=field.value,text=view.textContent.replace(/\r/g,'');let prefix=0;while(prefix<old.length&&prefix<text.length&&old[prefix]===text[prefix])prefix++;let suffix=0;while(suffix<old.length-prefix&&suffix<text.length-prefix&&old[old.length-1-suffix]===text[text.length-1-suffix])suffix++;const chars=rangesToChars(lang),insert=text.length-prefix-suffix,style=chars[Math.max(0,prefix-1)]||{};chars.splice(prefix,old.length-prefix-suffix,...Array.from({length:insert},()=>({...style})));draft[lang]=charsToRanges(chars);field.value=text;remember();});
  view.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['b','u'].includes(e.key.toLowerCase())){e.preventDefault();remember();toggle(e.key.toLowerCase()==='b'?'bold':'underline',true);}if(e.key==='Enter'){e.preventDefault();document.execCommand('insertText',false,'\n');}});
  view.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));});
  paint(lang,false);
 }
 if(options.noteColor&&views.note)views.note.style.backgroundColor=options.noteColor.value;
 fields[Object.keys(fields)[0]].parentElement.before(tools);
 document.addEventListener('selectionchange',remember); // Detached forms are ignored by containment checks.
 return ()=>draft;
}
let audioContext;
function feedback(kind){try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const now=audioContext.currentTime;(kind==='hard'?[330,261,196]:[392,440]).forEach((f,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=now+i*.13;o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.22);});}catch(e){}}
function initReader(){
 const log=document.getElementById('aiLog');if(!log)return;
 const bar=make('div','nhi-reader-toolbar'),language=make('select'),speed=make('select');language.setAttribute('aria-label','Ngôn ngữ đọc AI');for(const [value,label]of [['auto','Tự nhận diện'],['vi-VN','Tiếng Việt'],['ko-KR','Tiếng Hàn'],['en-US','Tiếng Anh']]){const o=make('option',null,label);o.value=value;language.append(o);}speed.setAttribute('aria-label','Tốc độ đọc AI');for(const r of [.5,.75,1,1.25,1.5,2]){const o=make('option',null,r+'×');o.value=r;o.selected=r===1;speed.append(o);}bar.append(language,speed);log.before(bar);
 let token=0,active=null;
 function stop(){token++;window.NHI_SPEECH.stop();if(active){active.setAttribute('aria-pressed','false');active=null;}}
 function pieces(text){const lines=String(text).split(/\n+/).filter(x=>x.trim()),out=[];for(const line of lines){const chunks=line.match(/[가-힣]+(?:[ \t]+[가-힣]+)*|[^가-힣]+/g)||[line];for(const t of chunks){if(!t.trim())continue;out.push({text:t,lang:language.value!=='auto'?language.value:/[가-힣]/.test(t)?'ko-KR':/[àáạảãăâđêôơưếệềễểấậầẩẫớờởỡợứừửữự]/i.test(t)?'vi-VN':'en-US'});}}return out;}
 function readFrom(b){if(active===b&&window.NHI_SPEECH.active()){stop();return;}stop();active=b;b.setAttribute('aria-pressed','true');const blocks=[...log.querySelectorAll('.nhi-ai-paragraph')],start=blocks.indexOf(b.parentElement),queue=blocks.slice(start).flatMap(p=>pieces(p.querySelector('.nhi-ai-paragraph-text').textContent)),mine=token;function next(){if(token!==mine)return;const item=queue.shift();if(!item){if(active)active.setAttribute('aria-pressed','false');active=null;return;}window.NHI_SPEECH.speak(item.text,item.lang,next,Number(speed.value));}next();}
 function mount(){for(const msg of log.querySelectorAll('.aimsg.ai:not(.wait)')){if(msg.dataset.readerMounted)continue;msg.dataset.readerMounted='true';const source=msg.cloneNode(true),links=[...source.querySelectorAll('a')].map(a=>{const link=a.cloneNode(true);a.remove();return link;}),paragraphs=source.innerHTML.split(/<br\s*\/?\s*>|\n+/i);msg.replaceChildren();for(const paragraph of paragraphs){const text=make('span','nhi-ai-paragraph-text');text.innerHTML=paragraph;if(!text.textContent.trim())continue;const p=make('div','nhi-ai-paragraph'),b=button('',()=>readFrom(b));b.innerHTML=icon('headphones');b.classList.add('nhi-read-message');b.setAttribute('aria-label','Đọc từ đoạn này trở xuống / dừng');b.setAttribute('aria-pressed','false');p.append(b,text);msg.append(p);}for(const link of links)msg.append(link);}}

 new MutationObserver(mount).observe(log,{childList:true});mount();document.getElementById('aiClose').addEventListener('click',stop);document.getElementById('aiNewBtn').addEventListener('click',stop);
}
function init(){
 initReader();
 const settings=document.getElementById('nhiCardFontSettings');let sizes={ko:36,vi:26,en:22};try{Object.assign(sizes,JSON.parse(localStorage.getItem('nhi-card-fonts-v1')||'{}'));}catch(e){}
 for(const [lang,label]of [['ko','Tiếng Hàn'],['vi','Tiếng Việt'],['en','Tiếng Anh']]){const row=make('div','setrow'),lab=make('label',null,label),select=make('select');select.id='nhiFont-'+lang;select.setAttribute('aria-label','Cỡ chữ '+label);lab.htmlFor=select.id;for(let n=12;n<=72;n+=2){const o=make('option',null,n+'');o.value=n;select.append(o);}select.value=String(sizes[lang]);const apply=()=>document.documentElement.style.setProperty('--nhi-card-'+lang,Math.max(12,Math.min(72,Number(sizes[lang])||22))+'px');select.onchange=()=>{sizes[lang]=Number(select.value);apply();try{localStorage.setItem('nhi-card-fonts-v1',JSON.stringify(sizes));}catch(e){}};apply();row.append(lab,select);settings?.append(row);}
 new MutationObserver(layout).observe(document.body,{attributes:true,attributeFilter:['class']});new MutationObserver(layout).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
 window.addEventListener('resize',layout);layout();
 document.dispatchEvent(new Event('nhi-study-ready'));
}
window.NHI_STUDY={dictionary,dictionaryButtons,wordElements,markText,formatText,editor,feedback,icon};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
