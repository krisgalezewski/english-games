#!/usr/bin/env python3
"""
Generate pre-recorded Google Cloud Text-to-Speech audio clips for every
word/sentence in Dictation Drill, plus a manifest.json mapping each exact
spoken string to its audio file. dictationdrill.html's speak() function
prefers these files over the browser's built-in speechSynthesis voice when
they're present, falling back automatically if a file is missing.

Usage:
    python3 generate_audio.py                # generate everything missing
    python3 generate_audio.py --dry-run       # just show what would be generated + cost estimate
    python3 generate_audio.py --voice en-GB-Neural2-D --rate 1.0

The word/sentence lists are the single source of truth already living in
dictationdrill.html (EASY_WORDS / MEDIUM_WORDS / CONNECTED_SPEECH /
FULL_SENTENCES) — this script asks Node to evaluate those exact array
literals rather than keeping a second copy that could drift out of sync.

API key: read from a local file (default: .tts_api_key next to this
script), one line, nothing else. That file is already listed in .gitignore
— never commit it, never paste the key anywhere.
"""
import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
DICTATION_HTML = os.path.join(HERE, "dictationdrill.html")
AUDIO_DIR = os.path.join(HERE, "audio")
MANIFEST_PATH = os.path.join(AUDIO_DIR, "manifest.json")
DEFAULT_KEY_FILE = os.path.join(HERE, ".tts_api_key")

TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"


def read_api_key(key_file):
    if not os.path.exists(key_file):
        sys.exit(
            "No API key file found at {0}\n"
            "Create it with a single line containing just your Google Cloud "
            "TTS API key (nothing else), then re-run this script.".format(key_file)
        )
    with open(key_file) as f:
        key = f.read().strip()
    if not key:
        sys.exit("API key file {0} is empty.".format(key_file))
    return key


def extract_banks():
    """Pull EASY_WORDS / MEDIUM_WORDS / CONNECTED_SPEECH / FULL_SENTENCES
    straight out of dictationdrill.html by having Node evaluate the exact
    array-literal source (handles apostrophes/quotes correctly, unlike a
    hand-rolled regex/JSON parser)."""
    with open(DICTATION_HTML, encoding="utf-8") as f:
        html = f.read()
    start = html.index("const EASY_WORDS")
    # Stop right after the four bank declarations, before any DOM-touching
    # code further down the script (which would fail to evaluate here since
    # there's no `window`/`document` in a plain Node process).
    end = html.index("const MODES", start)
    src = html[start:end]

    node_script = (
        src
        + "\n"
        + "console.log(JSON.stringify({"
        + "easy: EASY_WORDS, medium: MEDIUM_WORDS,"
        + "connected: CONNECTED_SPEECH.map(x => x.spoken),"
        + "full: FULL_SENTENCES"
        + "}));"
    )
    result = subprocess.run(
        ["node", "-e", node_script], capture_output=True, text=True
    )
    if result.returncode != 0:
        sys.exit("Failed to extract word/sentence banks via node:\n" + result.stderr)
    return json.loads(result.stdout)


def build_entries(banks):
    """One entry per unique spoken string, tagged with which bank(s) it's
    used in (for the filename prefix — purely cosmetic/debuggable)."""
    seen = {}
    order = []
    for bank_name in ("easy", "medium", "connected", "full"):
        for text in banks[bank_name]:
            if text not in seen:
                seen[text] = bank_name
                order.append(text)
    entries = []
    for text in order:
        h = hashlib.md5(text.encode("utf-8")).hexdigest()[:12]
        filename = "{0}_{1}.mp3".format(seen[text], h)
        entries.append({"text": text, "filename": filename, "bank": seen[text]})
    return entries


def synthesize(api_key, text, voice, rate):
    body = json.dumps(
        {
            "input": {"text": text},
            "voice": {"languageCode": "-".join(voice.split("-")[:2]), "name": voice},
            "audioConfig": {"audioEncoding": "MP3", "speakingRate": rate},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        TTS_ENDPOINT + "?key=" + api_key,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    last_err = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
                return base64.b64decode(payload["audioContent"])
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")
            if e.code == 429 or e.code >= 500:
                last_err = "{0} {1}: {2}".format(e.code, e.reason, detail)
                time.sleep(1.5 * (attempt + 1))
                continue
            raise RuntimeError("{0} {1}: {2}".format(e.code, e.reason, detail))
        except urllib.error.URLError as e:
            last_err = str(e.reason)
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError("Gave up after retries: " + str(last_err))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--key-file", default=DEFAULT_KEY_FILE, help="path to a file containing just the API key")
    ap.add_argument("--voice", default="en-GB-Neural2-C", help="Cloud TTS voice name (default: en-GB-Neural2-C)")
    ap.add_argument("--rate", type=float, default=1.0, help="speakingRate passed to the API (default: 1.0 — natural speed; the site's own 'slow' toggle handles playback-rate slowdown client-side)")
    ap.add_argument("--dry-run", action="store_true", help="show what would be generated and the character/cost estimate, without calling the API")
    ap.add_argument("--force", action="store_true", help="regenerate every clip even if the file already exists")
    args = ap.parse_args()

    banks = extract_banks()
    entries = build_entries(banks)
    total_chars = sum(len(e["text"]) for e in entries)

    os.makedirs(AUDIO_DIR, exist_ok=True)
    manifest = {}
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH) as f:
            manifest = json.load(f)

    todo = [
        e for e in entries
        if args.force or not os.path.exists(os.path.join(AUDIO_DIR, e["filename"]))
    ]

    print("Banks: easy={0} medium={1} connected={2} full={3}".format(
        len(banks["easy"]), len(banks["medium"]), len(banks["connected"]), len(banks["full"])))
    print("Unique strings: {0} ({1} total characters)".format(len(entries), total_chars))
    print("Already generated: {0}".format(len(entries) - len(todo)))
    print("To generate now: {0}".format(len(todo)))
    todo_chars = sum(len(e["text"]) for e in todo)
    print("Characters to synthesize this run: {0}".format(todo_chars))
    # Google Cloud TTS pricing (Neural2/WaveNet tier) is per character, with
    # a monthly free allotment far larger than this one-time batch — this
    # estimate is just for visibility, not a real cost concern at this size.
    print("(For reference: Neural2 voices bill per character; a few thousand "
          "characters is a trivial fraction of the free monthly allotment.)")

    if args.dry_run:
        print("\n--dry-run: no API calls made.")
        return

    if not todo:
        print("\nNothing to do — all clips already exist. Use --force to regenerate.")
        return

    api_key = read_api_key(args.key_file)

    ok, failed = 0, []
    for i, e in enumerate(todo, 1):
        try:
            audio = synthesize(api_key, e["text"], args.voice, args.rate)
            with open(os.path.join(AUDIO_DIR, e["filename"]), "wb") as f:
                f.write(audio)
            manifest[e["text"]] = e["filename"]
            ok += 1
            print("[{0}/{1}] {2}  ->  {3}".format(i, len(todo), e["text"][:60], e["filename"]))
        except Exception as ex:
            failed.append((e["text"], str(ex)))
            print("[{0}/{1}] FAILED: {2}  ({3})".format(i, len(todo), e["text"][:60], ex))
        time.sleep(0.05)

        # Save progress incrementally so a crash/interrupt partway through
        # doesn't lose everything already generated.
        if i % 20 == 0 or i == len(todo):
            with open(MANIFEST_PATH, "w") as f:
                json.dump(manifest, f, ensure_ascii=False, indent=2, sort_keys=True)

    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2, sort_keys=True)

    print("\nDone: {0} generated, {1} failed, manifest has {2} entries.".format(ok, len(failed), len(manifest)))
    if failed:
        print("\nFailed items:")
        for text, err in failed:
            print(" -", text[:60], "|", err)
        sys.exit(1)


if __name__ == "__main__":
    main()
