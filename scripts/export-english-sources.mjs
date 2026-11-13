/* Collect every built-in daily lesson and legacy flashcard for English translation. */
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const head=html.indexOf('  var DECKS = [');
const end=html.indexOf('  /* Vietnamese-style reading of each Korean line',head);
if(head<0||end<head)throw Error('Cannot locate legacy flashcard source arrays');
const context={};
vm.runInNewContext(html.slice(head,end)+'\nthis.__result={DECKS:DECKS,RAW:RAW};',context,{timeout:3000});
const entries=new Map();
const lessons=JSON.parse(fs.readFileSync('lessons.json','utf8'));
for(const lesson of lessons.lessons||[])for(const card of lesson.items||[]){
 if(!card[0]||!card[3]||!card[4])continue;
 entries.set(card[0],{vi:String(card[3]),ko:String(card[4]),source:'lesson'});
}
for(const deck of context.__result.DECKS){
 const rows=context.__result.RAW[deck.id]||[];
 rows.forEach((row,i)=>{
   const id=deck.id+'-'+i;if(!entries.has(id))entries.set(id,{vi:String(row[1]),ko:String(row[2]),source:'legacy'});
 });
}
const dict=Object.fromEntries(entries);
fs.writeFileSync('.english-sources.json',JSON.stringify(dict,null,2)+'\n');
console.log('English sources:',entries.size,'cards',Object.values(dict).filter(x=>x.source==='legacy').length,'legacy');
if(entries.size<1883)throw Error('Source coverage unexpectedly low');
