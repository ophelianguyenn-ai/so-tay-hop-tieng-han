/* Batch add evidenced VI↔KO phrase matches. Keeps original lesson text unchanged. */
import fs from 'node:fs';import vm from 'node:vm';
const context={window:{}};vm.runInNewContext(fs.readFileSync('nhi-phrases-v5.js','utf8'),context);
const file='lessons.json',source=fs.readFileSync(file,'utf8'),data=JSON.parse(source),all={};
for(const L of data.lessons)for(const r of L.items)all[r[0]]={id:r[0],type:r[1],vi:r[3],ko:r[4],vi0:r[3],ko0:r[4],pairs0:r[6]||[]};
let changed=0,pairs=0;
for(const L of data.lessons)for(const r of L.items){
 const original=Array.isArray(r[6])?r[6]:[];
 if(original.length>1)continue;
 const found=context.window.NHI_PHRASES_V5.align(all[r[0]],all);
 if(found.length>1){r[6]=found;changed++;pairs+=found.filter(p=>p[0]&&p[1]).length;}
}
if(changed)fs.writeFileSync(file,JSON.stringify(data));console.log(JSON.stringify({cardsImproved:changed,alignedPairs:pairs}));
