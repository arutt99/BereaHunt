#!/usr/bin/env python3
"""Hash the actual local package; no network, dependencies or generated prose."""

import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
MANIFEST = 'content/offline-resources.json'


def fingerprint(path):
    data = path.read_bytes()
    return {'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def serialize(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def inventory_outputs():
    adventure = json.loads((SITE / 'content/adventure.json').read_text())
    registry_path = SITE / 'content/assets.json'
    registry = json.loads(registry_path.read_text())
    for asset in registry['assets']:
        asset.update(fingerprint(SITE / asset['relativePath']))
    registry_text = serialize(registry)
    resources = []
    for path in sorted(SITE.rglob('*')):
        if not path.is_file():
            continue
        relative = path.relative_to(SITE).as_posix()
        if relative == MANIFEST:
            continue
        data = registry_text.encode() if path == registry_path else path.read_bytes()
        resources.append(dict(path=relative, sha256=hashlib.sha256(data).hexdigest(),
                              byteLength=len(data), required=True))
    manifest = dict(adventureId=adventure['id'], contentVersion=adventure['contentVersion'],
                    schemaVersion=adventure['schemaVersion'],
                    stateCompatibility=adventure['stateCompatibility'],
                    inventoryScope='complete_application', applicationImplemented=True, applicationVersion='1.0.0',
                    bootstrap=dict(path=MANIFEST, selfHashExcluded=True,
                                   reason='A manifest cannot contain its own hash. Fetch this versioned bootstrap first; verify every listed resource before declaring the package complete.'),
                    externalResourcesRequired=False,
                    externalExclusions=['Optional external navigation and citation links'],
                    resources=resources)
    return {registry_path: registry_text, SITE / MANIFEST: serialize(manifest)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail without writing if hashes or resource coverage are stale.')
    args = parser.parse_args()
    outputs = inventory_outputs()
    if args.check:
        if any(not p.exists() or p.read_text() != text for p, text in outputs.items()):
            print('FAIL: local content inventory is stale; rebuild after reviewing the changed files.', file=sys.stderr)
            return 1
        print('PASS: resource inventory and asset sizes/hashes match actual files.')
    else:
        for path, text in outputs.items():
            path.write_text(text)
        print('Built complete application inventory and asset fingerprints. Browser verification is required for offline readiness.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
