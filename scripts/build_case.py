#!/usr/bin/env python3
"""Build site/content/adventure.json from the spoiler authoring source.

The source (docs/development-spoilers/v2/case-source.json) holds plaintext
answers. The deployed file stores only salted SHA-256 hashes of normalized
answers, so a casual look at the content does not show solutions. Hints and
reveals stay readable in the deployed file; a static site cannot fully hide them.

Usage: python3 scripts/build_case.py [--check]
"""
import argparse
import copy
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/development-spoilers/v2/case-source.json'
OUTPUT = ROOT / 'site/content/adventure.json'
ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
STRUCTURED = {'choice', 'final', 'multi', 'order', 'strips', 'classify'}


def normalize_text(value):
    """Must match normalizeText() in site/scripts/engine.js."""
    s = unicodedata.normalize('NFKC', value).lower()
    s = s.replace('&', ' and ')
    s = re.sub(r"[’‘'`]", '', s)
    s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    s = re.sub(r'^the ', '', s)
    return s


def normalize_keyword(value):
    return re.sub(r'[^a-z]', '', unicodedata.normalize('NFKC', value).lower())


def normalize(kind, value):
    if kind == 'keyword':
        return normalize_keyword(value)
    if kind in STRUCTURED:
        return value.strip().lower()
    return normalize_text(value)


def answer_hash(puzzle_id, normalized):
    return hashlib.sha256(f'berea|{puzzle_id}|{normalized}'.encode()).hexdigest()


def keyed_alphabet(keyword):
    seen = []
    for ch in keyword.upper() + ALPHABET:
        if ch in ALPHABET and ch not in seen:
            seen.append(ch)
    return ''.join(seen)


def encipher(plaintext, keyword):
    key = keyed_alphabet(keyword)
    return ''.join(key[ALPHABET.index(c)] if c in ALPHABET else c for c in plaintext.upper())


def build(source):
    out = copy.deepcopy(source)
    out.pop('_comment', None)
    for pid, puzzle in out['puzzles'].items():
        kind = puzzle['input']['type']
        if kind == 'keyword':
            inp = puzzle['input']
            cipher = encipher(inp.pop('plaintext'), inp.pop('keyword'))
            inp['cipher'] = cipher
            for ev in out['evidence'].values():
                for block in ev.get('blocks', []):
                    if block.get('x') == '{{%s_CIPHER}}' % pid:
                        block['x'] = cipher
        puzzle['answers'] = sorted({answer_hash(pid, normalize(kind, a)) for a in puzzle['answers']})
        near = {}
        for item in puzzle.get('near', []):
            near[answer_hash(pid, normalize(kind, item['a']))] = item['m']
        puzzle['near'] = near
    text = json.dumps(out, ensure_ascii=False, indent=1)
    if '{{' in text:
        raise SystemExit('Unresolved placeholder in built content')
    return text + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    text = build(json.loads(SOURCE.read_text()))
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != text:
            print('FAIL: site/content/adventure.json is stale; run scripts/build_case.py', file=sys.stderr)
            return 1
        print('PASS: built case content matches its source.')
        return 0
    OUTPUT.write_text(text)
    print(f'Built {OUTPUT.relative_to(ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
