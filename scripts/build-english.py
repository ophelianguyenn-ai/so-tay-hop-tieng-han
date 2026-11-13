#!/usr/bin/env python3
"""Generate VI -> EN translations and English IPA for every shipped Nhi card.
Machine results are marked for human review; no credentials are required.
Uses offline Argos Translate and locally installed eSpeak pronunciation.
"""
import json, os, re, sys, time
from pathlib import Path

SOURCE=Path(".english-sources.json")
OUTPUT=Path("english.json")
records=json.loads(SOURCE.read_text(encoding="utf-8"))
old={}
if OUTPUT.exists():
    try:old=json.loads(OUTPUT.read_text(encoding="utf-8")).get("cards",{})
    except (ValueError, OSError):old={}
todo={k:v for k,v in records.items() if not old.get(k,{}).get("en")}

from argostranslate import package, translate

start=time.time()
print(f"English translation: {len(records)} total, {len(todo)} missing",flush=True)
available=package.get_available_packages()
candidate=next((p for p in available if p.from_code=="vi" and p.to_code=="en"),None)
if not candidate:
    raise RuntimeError("The open-source Argos VI -> EN translation model is not available")
print("Downloading Argos Vietnamese to English language package...",flush=True)
path=candidate.download()
package.install_from_path(path)
engine=translate.get_translation_from_codes("vi","en")
if not engine:
    raise RuntimeError("Cannot initialize VI -> EN model")
# Group by source text, so duplicated phrases share the exact same translation.
unique={x["vi"] for x in todo.values()}
translated={}
for i,vi in enumerate(sorted(unique),1):
    result=str(engine.translate(vi)).strip()
    if result and result.lower()!=vi.lower() or (result and re.search("[a-zA-Z]",result) and not re.search("[\u00c0-\u1ef9]",result)):
        translated[vi]=result
    elif result and re.search("[a-zA-Z]",result):
        translated[vi]=result
    if i%100==0:
        print(f"Translated {i}/{len(unique)} unique VI sources in {int(time.time()-start)}s",flush=True)

eng_texts=list(dict.fromkeys(translated.values()))
print(f"Producing en-US IPA for {len(eng_texts)} English expressions",flush=True)
from phonemizer import phonemize
ipa_map={}
for i in range(0,len(eng_texts),80):
    batch=eng_texts[i:i+80]
    try:
        ipa=phonemize(batch,language="en-us",backend="espeak",strip=True,
          preserve_punctuation=True,with_stress=True,njobs=1)
        if isinstance(ipa,str):ipa=[ipa]
        for en,reading in zip(batch,ipa):
            ipa_map[en]=str(reading).strip()
    except Exception as exc:
        print(f"IPA conversion warning: {exc}",file=sys.stderr)
    if i%400==0:print(f"IPA {i}/{len(eng_texts)}",flush=True)

generated=0
for id,item in todo.items():
    en=translated.get(item["vi"])
    if not en:continue
    old[id]={"en":en,"ipa":ipa_map.get(en,""),"source":"machine"}
    generated+=1
result={"version":1,"model":"Argos VI-EN (open source) + eSpeak IPA",
        "notice":"Machine translation: technical terms require review",
        "cards":{id:old[id] for id in sorted(records) if id in old}}
OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=1)+"\n",encoding="utf-8")
print(f"Saved {len(result['cards'])}/{len(records)} English records ({generated} new) in {int(time.time()-start)}s",flush=True)
if len(result["cards"])!=len(records):
    raise RuntimeError(f"Incomplete English coverage: {len(result['cards'])}/{len(records)}")
