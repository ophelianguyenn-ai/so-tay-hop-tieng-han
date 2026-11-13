/* Semantic phrase segmentation v5.
 * Keeps existing author-verified sentence pairs. For multiword single-pair
 * cards it uses dictionary evidence, and never invents a VI↔KO link.
 */
(function(){
'use strict';
const special=[
  {ko:/공장에\s+반입된\s+자재/,vi:/Vật tư đã đưa vào nhà máy/i,
   pairs:[['vật tư','자재'],['đã đưa','반입된'],['vào nhà máy','공장에']]},
  {ko:/공장에\s+반입된\s+자재/,vi:/vật tư.*nhà máy/i,
   pairs:[['vật tư','자재'],['đã đưa','반입된'],['nhà máy','공장에']]}
];
const simple={
 '공장에':['vào nhà máy','nhà máy'], '공장':['nhà máy'],
 '반입된':['đã đưa','đưa vào','nhập vào'], '반입':['nhập vào','đưa vào'],
 '자재':['vật tư'], '탱크':['bồn','bể','tank'], '철판':['thép tấm'],
 '배관':['đường ống'], '시공':['thi công'], '용접':['hàn'],
 '공사':['thi công','công trình'], '진행':['tiến độ','thực hiện'],
 '확인':['xác nhận','kiểm tra'], '보고':['báo cáo'],
 '업체':['nhà thầu','đơn vị'], '검수':['nghiệm thu']
};
function lower(s){return String(s||'').toLocaleLowerCase('vi').normalize('NFC');}
function pieces(s){
 return String(s).match(/[^\s,;，、]+/g)||[];
}
function has(text,p){
 return lower(text).indexOf(lower(p))>=0;
}
function normalizeKo(s){
 return String(s||'').replace(/[.,!?。？！,:;]+$/,'').replace(/(?:에서|으로|에게|까지|부터|은|는|이|가|을|를|에|와|과|로|도|의|만|랑|하고|께)$/,'');
}
function goodPair(a,b,vi,ko,usedVi,usedKo){
 if(!a||!b||!has(vi,a)||!ko.includes(b))return false;
 const k=lower(a),r=ko.indexOf(b);
 if(usedVi.some(x=>x.includes(k)||k.includes(x)))return false;
 if(usedKo.some(x=>x.includes(b)||b.includes(x)))return false;
 usedVi.push(k);usedKo.push(b);return true;
}
function align(it,all){
 const vi=String(it.vi||''),ko=String(it.ko||'');
 if(!vi||!ko)return [[vi,ko]];
 for(const r of special)if(r.ko.test(ko)&&r.vi.test(vi))return r.pairs.filter(p=>has(vi,p[0])&&ko.includes(p[1]));
 const tokens=pieces(ko),viTokens=pieces(vi);
 // Single lexical item: keep one aligned pair as originally authored.
 if(tokens.length<=1&&viTokens.length<=2)return [[vi,ko]];
 const known=new Map();
 Object.values(all||{}).forEach(x=>{
   if(!x||!x.vi0||!x.ko0||x.id===it.id)return;
   const k=String(x.ko0).trim(),v=String(x.vi0).trim();
   if(k&&v&&k.length<=45&&v.length<=50&&v.split(/[;,/]/).length===1){
     if(!known.has(k))known.set(k,[]);
     if(!known.get(k).includes(v))known.get(k).push(v);
   }
   (x.pairs0||[]).forEach(p=>{
     if(!Array.isArray(p)||!p[0]||!p[1]||String(p[1]).length>45)return;
     const key=String(p[1]);if(!known.has(key))known.set(key,[]);
     if(!known.get(key).includes(p[0]))known.get(key).push(p[0]);
   });
 });
 const takenVi=[],takenKo=[],output=[];
 // Longest Korean terms first to retain meaningful multiword noun phrases.
 const candidates=[];
 for(let i=0;i<tokens.length;i++)for(let len=Math.min(4,tokens.length-i);len>=1;len--){
   const k=tokens.slice(i,i+len).join(' ').replace(/[.,!?。？！]+$/,'');
   if(k)candidates.push(k);
 }
 candidates.sort((a,b)=>b.length-a.length);
 const seen=new Set();
 for(const phrase of candidates){
   if(seen.has(phrase))continue;seen.add(phrase);
   const opts=[...(simple[phrase]||[]),...(known.get(phrase)||[]),
     ...(simple[normalizeKo(phrase)]||[]),...(known.get(normalizeKo(phrase))||[])];
   opts.sort((a,b)=>String(b).length-String(a).length);
   for(const v of opts)if(goodPair(v,phrase,vi,ko,takenVi,takenKo)){output.push([v,phrase]);break;}
 }
 // Unmatched Korean words remain independently clickable, without a false VI link.
 for(const t of tokens){
   const word=t.replace(/[.,!?。？！]+$/,'');
   if(word&&!takenKo.some(s=>s.includes(word)||word.includes(s))){output.push(['',word]);takenKo.push(word);}
 }
 // Unmatched Vietnamese text is split at whitespace boundaries, keeping short collocations.
 const extras=vi.match(/[\p{L}\p{N}]+(?:[ -][\p{L}\p{N}]+){0,1}/gu)||[];
 for(const chunk of extras)if(!takenVi.some(x=>x.includes(lower(chunk))||lower(chunk).includes(x))){
   output.push([chunk,'']);takenVi.push(lower(chunk));
 }
 return output.length?output:[[vi,ko]];
}
window.NHI_PHRASES_V5={align};
})();