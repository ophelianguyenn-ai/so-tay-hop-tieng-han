"""Generate only missing Neural clips for the selected daily lesson's displayed text."""
import asyncio,hashlib,json,pathlib
import edge_tts
from mutagen.mp3 import MP3
ROOT=pathlib.Path(__file__).resolve().parents[1]
VOICE={'ko':'ko-KR-SunHiNeural','vi':'vi-VN-HoaiMyNeural'}
async def main():
    path=ROOT/'audio-manifest.json';manifest=json.loads(path.read_text())
    rows=json.loads((ROOT/'scripts/daily-audio-texts.json').read_text())
    missing=[]
    for row in rows:
        for lang,text in zip(('vi','ko'),row):
            if text and '\n' not in text and f'{lang}|{text}' not in manifest and (lang,text) not in missing:missing.append((lang,text))
    print('Missing clips:',len(missing),flush=True)
    sem=asyncio.Semaphore(2);failures=[]
    async def generate(lang,text):
        async with sem:
            key=f'{lang}|{text}';sha=hashlib.sha256(key.encode()).hexdigest()[:20]
            audio=ROOT/'audio'/lang/(sha+'.mp3');audio.parent.mkdir(parents=True,exist_ok=True)
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text,VOICE[lang]).save(str(audio))
                    duration=round(MP3(str(audio)).info.length,3)
                    if duration<=0:raise ValueError('Empty audio')
                    manifest[key]={'src':audio.relative_to(ROOT).as_posix(),'start':0,'end':duration}
                    print('Generated',lang,text[:45],flush=True);break
                except Exception as exc:
                    if audio.exists():audio.unlink()
                    if attempt==3:failures.append(key);print('FAILED',key,exc,flush=True)
                    else:await asyncio.sleep(2*(attempt+1))
            await asyncio.sleep(.4)
    await asyncio.gather(*(generate(*item) for item in missing))
    # A legacy card stores a Vietnamese explanation in its Korean field: pronounce the headword only.
    for row in rows:
        if '\n' in row[1] and 'ko|'+row[1].split('\n')[0] in manifest:manifest['ko|'+row[1]]=manifest['ko|'+row[1].split('\n')[0]]
    path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
    if failures:raise SystemExit(f'{len(failures)} clips failed')
    print('All selected daily lesson texts have Neural audio.',flush=True)
if __name__=='__main__':asyncio.run(main())
