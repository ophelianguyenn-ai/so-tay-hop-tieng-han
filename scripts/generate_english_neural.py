#!/usr/bin/env python3
"""Record natural American English MP3 for each unique shipped translation.

Uses Microsoft Edge's online neural TTS through the community edge-tts client.
The voice service receives English text from learning cards; no API secrets.
Files are split into 8 shards for parallel GitHub Actions generation.
"""
import argparse
import asyncio
import hashlib
import json
import pathlib

import edge_tts
from mutagen.mp3 import MP3

ROOT=pathlib.Path(__file__).resolve().parents[1]
PREFIX="window.NHI_ENGLISH_PRELOADED="
VOICE="en-US-JennyNeural"

def collect():
    js=(ROOT/"nhi-english-data-v6.js").read_text(encoding="utf-8")
    if PREFIX not in js:
        raise RuntimeError("English preloaded source missing")
    items=json.loads(js.split(PREFIX,1)[1].strip().rstrip(";"))
    phrases=sorted({str(e.get("en","")).strip() for e in items.values() if str(e.get("en","")).strip()})
    if len(phrases)<1200:
        raise RuntimeError("Unexpectedly few English phrases")
    return phrases

async def produce(phrase,index,total,output,sema):
    key="en|"+phrase
    ident=hashlib.sha256(key.encode("utf-8")).hexdigest()[:20]
    path=output/"audio"/"en"/(ident+".mp3")
    path.parent.mkdir(parents=True,exist_ok=True)
    async with sema:
        for attempt in range(5):
            try:
                if not path.exists() or path.stat().st_size<2000:
                    await edge_tts.Communicate(text=phrase,voice=VOICE,rate="-4%").save(str(path))
                length=round(MP3(str(path)).info.length,3)
                if length<=0 or path.stat().st_size<2000:
                    raise ValueError("empty MP3")
                if index%25==0:
                    print(f"MP3 {index}/{total} recorded",flush=True)
                await asyncio.sleep(.25)
                return key,{"src":"audio/en/"+path.name,"start":0,"end":length}
            except Exception as exc:
                try:path.unlink(missing_ok=True)
                except OSError:pass
                if attempt>=4:
                    print(f"FAILED {index} {phrase[:44]}: {exc}",flush=True)
                else:
                    await asyncio.sleep(3*(attempt+1))
    return None

async def main(args):
    items=[t for i,t in enumerate(collect()) if i%args.shards==args.shard]
    print(f"Shard {args.shard}/{args.shards}, items={len(items)}, voice={VOICE}",flush=True)
    out=ROOT/"english-neural-build"
    sema=asyncio.Semaphore(2)
    tasks=[produce(text,i+1,len(items),out,sema) for i,text in enumerate(items)]
    results=await asyncio.gather(*tasks)
    part={k:v for pair in results if pair for k,v in [pair]}
    manifest=out/(f".en-manifest-{args.shard}.json")
    manifest.parent.mkdir(parents=True,exist_ok=True)
    manifest.write_text(json.dumps(part,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print(f"Shard {args.shard}: completed {len(part)}/{len(items)} recordings",flush=True)
    if len(part)<max(1,int(len(items)*.70)):
        raise RuntimeError("Too many neural TTS errors: aborting partial shard")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--shard",type=int,required=True)
    p.add_argument("--shards",type=int,default=8)
    args=p.parse_args()
    assert 0<=args.shard<args.shards
    asyncio.run(main(args))
