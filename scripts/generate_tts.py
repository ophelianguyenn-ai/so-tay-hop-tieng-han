#!/usr/bin/env python3
"""Generate Korean/Vietnamese MP3 files from the study deck using Microsoft Edge voices.
Voice service receives the text; do not include secrets or private information.
Requires: pip install edge-tts mutagen
Runs explicitly, not from website visitors.
"""
import argparse
import asyncio
import hashlib
import json
import pathlib
import re
import time

import edge_tts
from mutagen.mp3 import MP3

ROOT = pathlib.Path(__file__).resolve().parents[1]
AUDIO = ROOT / "audio"
MANIFEST = ROOT / "audio-manifest.json"
VOICE = {"ko": "ko-KR-SunHiNeural", "vi": "vi-VN-HoaiMyNeural"}


def collect():
    data = json.loads((ROOT / "lessons.json").read_text(encoding="utf-8"))
    seen = set()
    for lesson in data.get("lessons", []):
        for row in lesson.get("items", []):
            if not isinstance(row, list) or len(row) < 5:
                continue
            for lang, value in (("vi", row[3]), ("ko", row[4])):
                s = str(value).strip()
                if s and (lang, s) not in seen:
                    seen.add((lang, s))
                    yield lang, s
    # Classic Vietnamese/Korean cards are defined in the root index.html.
    # Capture literal short rows where written on one line, if present.
    text = (ROOT / "index.html").read_text(encoding="utf-8")
    for match in re.finditer(r"\['[wsaq]',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'", text):
        for lang, token in (("vi", match.group(1)), ("ko", match.group(2))):
            s = token.replace("\\'", "'").strip()
            if s and (lang, s) not in seen:
                seen.add((lang, s))
                yield lang, s


async def main(args):
    existing = {}
    if MANIFEST.exists():
        try:
            existing = json.loads(MANIFEST.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            pass
    entries = list(collect())
    if args.lang != "both":
        entries = [(l, t) for l, t in entries if l == args.lang]
    if args.limit > 0:
        entries = entries[args.offset : args.offset + args.limit]
    else:
        entries = entries[args.offset:]
    print(f"Items selected: {len(entries)}; audio service: Microsoft Edge TTS")
    done, failed = 0, 0
    for index, (lang, phrase) in enumerate(entries, 1):
        key = lang + "|" + phrase
        sha = hashlib.sha256(key.encode("utf-8")).hexdigest()[:20]
        path = AUDIO / lang / f"{sha}.mp3"
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists() or path.stat().st_size == 0:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(phrase, VOICE[lang]).save(str(path))
                    break
                except Exception as exc:
                    if path.exists():
                        path.unlink()
                    if attempt == 3:
                        failed += 1
                        print(f"FAILED {index}: {lang} {phrase[:40]!r} ({exc})", flush=True)
                    else:
                        await asyncio.sleep(3 * (attempt + 1))
            if not path.exists():
                continue
            await asyncio.sleep(args.delay)
        try:
            duration = round(MP3(str(path)).info.length, 3)
            if duration <= 0:
                raise ValueError("Empty MP3")
        except Exception as exc:
            failed += 1
            print("INVALID", path, exc)
            continue
        existing[key] = {"src": path.relative_to(ROOT).as_posix(), "start": 0, "end": duration}
        done += 1
        if index % 25 == 0:
            MANIFEST.write_text(json.dumps(existing, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            print(f"Progress {index}/{len(entries)}", flush=True)
    MANIFEST.write_text(json.dumps(existing, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Available: {done}; errors: {failed}; total manifest: {len(existing)}")
    if failed:
        raise SystemExit(f"{failed} audio items failed; rerun to resume.")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--lang", choices=("both", "ko", "vi"), default="both")
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--limit", type=int, default=0, help="0 means all remaining")
    p.add_argument("--delay", type=float, default=0.35, help="Pause between requests to avoid bursts")
    asyncio.run(main(p.parse_args()))
