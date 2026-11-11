#!/usr/bin/env python3
"""Full-path browser regressions. Never prints case text or screenshots of play.
Defaults to isolated local fixtures; --live-url checks the deployed Pages game
using only disposable browser profiles and read-only requests.
"""
import argparse
from functools import partial
import gzip
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import tempfile
import traceback
from threading import Thread
from types import SimpleNamespace
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright, expect, Error as BrowserError

ROOT = Path(__file__).resolve().parents[1]
SAVE = 'berea-case-01:investigation'


def need(condition, label):
    if not condition:
        raise AssertionError(label)


class Host:
    def __init__(self, directory):
        self.directory = directory
        self.failure = None
        self.hits = 0
        outer = self

        class Handler(SimpleHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_GET(self):
                outer.hits += 1
                if outer.failure and urlsplit(self.path).path.endswith(outer.failure):
                    self.send_error(503, 'Test interruption')
                else:
                    path = Path(self.translate_path(urlsplit(self.path).path))
                    if path.is_file() and path.suffix in ('.json','.js','.css','.html','.svg','.webmanifest'):
                        # Exercise decoded-byte hashing and compressed static hosts.
                        data = gzip.compress(path.read_bytes())
                        self.send_response(200)
                        self.send_header('Content-Type', self.guess_type(str(path)))
                        self.send_header('Content-Encoding', 'gzip')
                        self.send_header('Content-Length', str(len(data)))
                        self.end_headers(); self.wfile.write(data)
                    else:
                        super().do_GET()

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(directory)))
        Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = f'http://127.0.0.1:{self.server.server_port}/BereaHunt/'

    def update(self, version='1.0.1', compatibility=1):
        site = self.directory / 'BereaHunt'
        adventure = json.loads((ROOT/'site/content/adventure.json').read_text())
        adventure.update(contentVersion=version, stateCompatibility=compatibility)
        (site/'content/adventure.json').write_text(json.dumps(adventure, ensure_ascii=False, indent=2)+'\n')
        prep = json.loads((ROOT/'site/content/preparation.json').read_text())
        prep['practicalGuidance'].append('Complete package update check.')
        (site/'content/preparation.json').write_text(json.dumps(prep, ensure_ascii=False, indent=2)+'\n')
        manifest = json.loads((ROOT/'site/content/offline-resources.json').read_text())
        manifest.update(contentVersion=version, stateCompatibility=compatibility)
        for r in manifest['resources']:
            data = (site/r['path']).read_bytes()
            r.update(byteLength=len(data), sha256=hashlib.sha256(data).hexdigest())
        (site/'content/offline-resources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine', choices=('chromium', 'webkit'), default='chromium')
    parser.add_argument('--chromium', default=shutil.which('chromium') or shutil.which('chromium-browser'))
    parser.add_argument('--preparation-screenshot', help='Optional spoiler-free screenshot path; no gameplay screenshots.')
    parser.add_argument('--live-url', choices=('https://arutt99.github.io/BereaHunt/',),
                        help='Read-only Pages smoke; never changes the deployed game or a player save.')
    parser.add_argument('--expected-site', type=Path, default=ROOT/'site',
                        help='Expected deployed site snapshot (live checks only).')
    args = parser.parse_args()
    site_root = args.expected_site.resolve() if args.live_url else ROOT/'site'
    with tempfile.TemporaryDirectory(prefix='berea-browser-') as temp, sync_playwright() as pw:
        directory = Path(temp)
        shutil.copytree(ROOT/'site', directory/'BereaHunt')
        host = SimpleNamespace(url=args.live_url) if args.live_url else Host(directory)
        browser_type = getattr(pw, args.engine)
        launch = dict(headless=True)
        if args.engine == 'chromium':
            launch.update(executable_path=args.chromium, args=['--no-sandbox'])
        browser = browser_type.launch(**launch)
        errors = []
        solutions = {f'P{i:02}': json.loads((site_root/f'content/solutions/p{i:02}.json').read_text()) for i in range(1, 9)}
        contexts = []

        def context(script=None):
            c = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
            if script:
                c.add_init_script(script)
            if args.live_url:
                c.route('**/*', lambda route: route.continue_() if route.request.url.startswith(host.url) else route.abort())
            contexts.append(c)
            return c

        def page_for(c, prepare=True):
            page = c.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(host.url)
            if prepare:
                page.get_by_role('button', name='Download complete adventure', exact=True).click()
                expect(page.get_by_role('heading', name='Ready offline', exact=True)).to_be_visible(timeout=60000)
            return page

        def click(page, label):
            page.get_by_role('button', name=label, exact=True).click()

        def saved(page):
            return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE)

        def begin(page):
            click(page, 'Start the investigation')
            click(page, 'Start in this browser')
            expect(page.locator('#answer-form')).to_be_visible()

        def advance(page, refs=False):
            expect(page.get_by_role('heading', name='Finding recorded', exact=True)).to_be_visible()
            button = page.get_by_role('button', name='Review confirmed destination', exact=True)
            if button.count():
                button.click()
                need(page.locator('#answer-form').count() == 0, 'Travel cannot expose an active form')
                if args.live_url:
                    link = page.get_by_role('link', name='Open optional external map', exact=True)
                    need(urlsplit(link.get_attribute('href')).scheme == 'https', 'Unlocked optional map has a secure external URL')
                    with page.expect_popup() as popup:
                        link.click()
                    popup.value.close()
                if refs:
                    click(page, 'Can’t visit — continue with references from a safe place')
                    click(page, 'I’m safely stopped — use references')
                else:
                    click(page, 'Confirm destination')
                    need(page.locator('#answer-form').count() == 0, 'Travel waits for safe stop')
                    click(page, 'I’m safely stopped — continue')
            else:
                click(page, 'Continue the case')
            expect(page.locator('#answer-form')).to_be_visible()

        def dimensions(page):
            need(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'No viewport-wide horizontal overflow')
            need(page.evaluate("[...document.querySelectorAll('button,input,select')].filter(n=>n.getBoundingClientRect().width && n.type!=='checkbox').every(n=>n.getBoundingClientRect().height>=47)"), 'Comfortable visible controls')

        try:
            if args.live_url:
                audit = context()
                inventory = json.loads((site_root/'content/offline-resources.json').read_text())
                resources = [r['path'] for r in inventory['resources']] + ['content/offline-resources.json']
                for path in resources:
                    response = audit.request.get(host.url + path)
                    need(response.status == 200, 'Live required resource returns HTTP 200')
                    need(response.url == host.url + path, 'Live resource stays under the expected Pages path')
                    need(hashlib.sha256(response.body()).digest() == hashlib.sha256((site_root/path).read_bytes()).digest(),
                         'Live resource bytes match the expected deployed revision')
                    content_type = response.headers.get('content-type', '').lower()
                    if path.endswith('.js'):
                        need('javascript' in content_type, 'Live modules have a JavaScript MIME type')
                    if path.endswith('.css'):
                        need('text/css' in content_type, 'Live stylesheet has a CSS MIME type')
                for internal in ('README.md', 'AGENTS.md', 'docs/requirements.md', 'site/index.html'):
                    response = audit.request.get(host.url + internal, headers={'Cache-Control':'no-cache'})
                    print(f'CHECK: excluded path {internal}: HTTP {response.status}; response URL {response.url}')
                    need(response.status == 404, 'Internal repository files are not deployed')
                audit.close()
                print(f'PASS: live HTTPS Pages origin; all {len(resources)} files match expected bytes; MIME types and internal-file exclusion.')
            # A real normal path using every rendered aid, draft restore and final submission.
            c = context(); page = page_for(c)
            if args.live_url:
                need(page.evaluate('navigator.serviceWorker.controller.scriptURL') == host.url + 'service-worker.js',
                     'Live service-worker script uses the actual Pages path')
                need(page.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.scope)') == host.url,
                     'Live service-worker scope is the Pages project root')
                c.set_offline(True)
            if args.preparation_screenshot:
                page.screenshot(path=args.preparation_screenshot, full_page=True)
            need('Wallace Lake' not in page.locator('body').inner_text(), 'Preparation conceals future names')
            dimensions(page); begin(page)
            for fragment in ('#evidence/E17', '#puzzle/P08'):
                page.evaluate('(fragment)=>location.hash=fragment', fragment)
                expect(page.get_by_text('Investigation complete.', exact=False)).to_have_count(0)
            page.evaluate("history.replaceState(null,'',location.pathname)")
            page.locator('#answer-reference').fill('incorrect')
            click(page, 'Check answer')
            expect(page.locator('#answer-feedback')).not_to_be_empty()
            need(saved(page)['completedPuzzleIds'] == [], 'Wrong answer cannot advance')
            page.locator('#answer-reference').fill(' R-1 ')
            page.reload(); expect(page.locator('#answer-reference')).to_have_value(' R-1 ')
            page.locator('#answer-reference').press('Enter'); advance(page)
            # Image inspection has a keyboard/native zoom control and full text.
            page.get_by_role('button', name='Enlarge reference image', exact=True).click()
            expect(page.get_by_role('heading', name='Inspect reference image', exact=True)).to_be_visible()
            page.locator('#image-zoom').focus(); page.keyboard.press('ArrowRight')
            need(page.locator('#dialog .inspection img').evaluate('(n)=>parseInt(n.style.width)') > 960, 'Keyboard image zoom works')
            page.locator('#dialog > form button').click()
            # Atomic causal answer and explicit button movement.
            page.locator('#answer-mechanism').select_option(solutions['P02']['canonical']['mechanism'])
            click(page, 'Check answer'); need(len(saved(page)['completedPuzzleIds']) == 1, 'Both causal fields required')
            for i, target in enumerate(solutions['P02']['canonical']['sequence']):
                p = json.loads((site_root/'content/puzzles/p02.json').read_text())
                label = next(card['label'] for card in p['workingAid']['initialCards'] if card['id'] == target)
                while saved(page)['workingAidDraftByPuzzle']['P02']['values']['sequence'].index(target) > i:
                    page.get_by_role('button', name=f'Move {label} up', exact=True).click()
            page.reload(); expect(page.locator('#answer-mechanism')).to_have_value(solutions['P02']['canonical']['mechanism'])
            click(page, 'Check answer'); advance(page)
            # The citation's destination name must not shortcut the current deduction.
            need('Wallace Lake' not in page.locator('body').inner_text(), 'Naming citations stay gated before deduction')
            click(page, 'Compare relevant evidence')
            dimensions(page)
            page.locator('#answer-keyword').fill('SHALE'); click(page, 'Build grid from my keyword')
            expect(page.locator('#grid-0')).to_have_value('S')
            page.locator('#grid-24').fill('Z')
            page.locator('#answer-answer').fill(solutions['P03']['canonical'])
            page.reload(); expect(page.locator('#grid-0')).to_have_value('S'); expect(page.locator('#grid-24')).to_have_value('Z')
            click(page, 'Check answer'); advance(page)
            click(page, 'After merge')
            serials = solutions['P04']['canonical']
            page.get_by_role('checkbox', name=serials[0], exact=True).check()
            click(page, 'Undo')
            expect(page.get_by_role('checkbox', name=serials[0], exact=True)).not_to_be_checked()
            for serial in serials:
                page.get_by_role('checkbox', name=serial, exact=True).check()
            page.reload()
            for serial in serials:
                expect(page.get_by_role('checkbox', name=serial, exact=True)).to_be_checked()
            expect(page.get_by_role('button', name='After merge', exact=True)).to_have_attribute('aria-pressed', 'true')
            click(page, 'Check answer'); advance(page)
            page.locator('#classification-choice').select_option(solutions['P05']['canonical'])
            expect(page.locator('#answer-answer')).to_have_value(solutions['P05']['canonical'])
            click(page, 'Check answer'); advance(page)
            page.locator('#answer-lower').fill('bad'); page.locator('#answer-upper').fill('bad')
            click(page, 'Check answer'); expect(page.locator('#answer-feedback')).to_contain_text('hour:minute')
            lower, upper = solutions['P06']['canonical']
            page.locator('#answer-lower').fill(lower); page.locator('#answer-upper').fill(upper)
            click(page, 'Check answer'); advance(page)
            people = json.loads((site_root/'content/puzzles/p07.json').read_text())['workingAid']['people']
            for i, person in enumerate(people):
                page.locator(f'#badge-{i}').select_option(solutions['P07']['canonical'][person])
            page.reload()
            for i, person in enumerate(people):
                expect(page.locator(f'#badge-{i}')).to_have_value(solutions['P07']['canonical'][person])
            click(page, 'Check answer'); advance(page)
            pair = solutions['P08']['canonical']
            page.locator('#answer-actor').fill(pair['actor']); page.locator('#answer-order').fill('wrong')
            click(page, 'Record finding')
            need(len(saved(page)['completedPuzzleIds']) == 7, 'Final pair is checked atomically')
            page.locator('#answer-order').fill(pair['order']); click(page, 'Record finding')
            expect(page.get_by_role('heading', name='Investigation complete', exact=True)).to_be_visible()
            need(len(saved(page)['evidenceIds']) == 18, 'Full normal path retains every record')
            page.locator('summary').filter(has_text='How the case fits together').click()
            page.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).fullExplanationViewed', arg=SAVE)
            page.reload(); expect(page.get_by_role('heading', name='Investigation complete', exact=True)).to_be_visible()
            click(page, 'Case file'); need(page.locator('.case-list button').count() >= 26, 'Completed case remains reviewable')
            # Responsive geometry at desktop and narrow phone widths too.
            for width in (320, 1280):
                page.set_viewport_size({'width': width, 'height': 844}); dimensions(page)
            need(not errors, 'No browser runtime errors on normal path')
            print('PASS: complete normal mobile path, eight controls, drafts, gated views, ending and case file.')

            # Interrupt the *initial* download in a later unvisited resource.
            c2 = context(); assisted = page_for(c2, False)
            if not args.live_url:
                host.failure = 'content/solutions/p08.json'
                click(assisted, 'Download complete adventure')
                expect(assisted.locator('#offline-status')).to_contain_text('Download incomplete', timeout=60000)
                need(assisted.get_by_role('button', name='Start the investigation', exact=True).count() == 0, 'Incomplete package cannot start')
                host.failure = None
            click(assisted, 'Download complete adventure')
            expect(assisted.get_by_role('heading', name='Ready offline', exact=True)).to_be_visible(timeout=60000)
            begin(assisted); c2.set_offline(True)
            for i in range(8):
                old = saved(assisted)
                click(assisted, 'Can’t access this clue')
                expect(assisted.get_by_role('heading', name='Unsolved reference evidence', exact=True)).to_be_visible()
                new = saved(assisted)
                need(new['completedPuzzleIds'] == old['completedPuzzleIds'] and new['evidenceIds'] == old['evidenceIds'], 'Reference cannot complete or grant rewards')
                need(new['workingAidDraftByPuzzle'] == old['workingAidDraftByPuzzle'], 'Reference cannot fill a board')
                assisted.locator('#dialog > form button').click()
                for h in range(3): click(assisted, f'Show hint {h+1} of 3')
                if i in (0, 3, 6):
                    assisted.close(); assisted = page_for(c2, False)
                    expect(assisted.locator('#shown-hints li')).to_have_count(3)
                click(assisted, 'Reveal answer')
                if i == 0:
                    assisted.locator('#dialog > form button').click()
                    need(saved(assisted)['completedPuzzleIds'] == [], 'Reveal cancellation preserves progress')
                    click(assisted, 'Reveal answer')
                click(assisted, 'Reveal answer and continue')
                if i < 7: advance(assisted, True)
            expect(assisted.get_by_role('heading', name='Investigation complete', exact=True)).to_be_visible()
            need(len(saved(assisted)['revealedPuzzleIds']) == 8 and len(saved(assisted)['evidenceIds']) == 18, 'Full offline assisted case completes')
            assisted.close(); assisted = page_for(c2, False)
            expect(assisted.get_by_role('heading', name='Investigation complete', exact=True)).to_be_visible()
            need(not errors, 'No browser runtime errors on offline assisted path')
            print('PASS: all hints/references/reveals, offline page closure/relaunch/completion.' if args.live_url else
                  'PASS: interrupted initial download/retry, all hints/references/reveals, offline page closure/relaunch/completion.')

            if args.live_url:
                # Exercise actual-origin update checks without altering production files.
                probe_context = context(); probe = page_for(probe_context); begin(probe)
                probe.locator('#answer-reference').fill('deployment-resume')
                click(probe, 'Show hint 1 of 3')
                expect(probe.locator('#shown-hints li')).to_have_count(1)
                original = saved(probe)
                click(probe, 'Offline & install'); probe_context.set_offline(True)
                click(probe, 'Check for a complete update')
                expect(probe.locator('#offline-status')).to_contain_text('Download incomplete', timeout=60000)
                need(saved(probe) == original, 'Failed live-origin update retains the exact save')
                probe_context.set_offline(False)
                click(probe, 'Check for a complete update')
                expect(probe.locator('#offline-status')).to_contain_text('up to date and verified', timeout=60000)
                probe.reload()
                expect(probe.locator('#answer-reference')).to_have_value('deployment-resume')
                expect(probe.locator('#shown-hints li')).to_have_count(1)
                need(saved(probe) == original, 'Verified live package check preserves the exact save')
                probe.evaluate('localStorage.setItem("deployment-unrelated","keep")')
                click(probe, 'Offline & install')
                click(probe, 'Restart investigation'); probe.locator('#dialog > form button').click()
                need(saved(probe) == original, 'Live restart cancellation preserves progress')
                click(probe, 'Restart investigation'); click(probe, 'Erase progress and restart')
                need(saved(probe)['completedPuzzleIds'] == [], 'Live confirmed restart clears case progress')
                need(probe.evaluate('localStorage.getItem("deployment-unrelated")') == 'keep', 'Restart preserves unrelated browser storage')
                print('PASS: live-origin failed/same-version verified package checks, draft/hint preservation and scoped restart.')

                # A full process shutdown and fresh offline launch at the real HTTPS origin.
                profile = directory / 'live-persistent-profile'
                persistent = browser_type.launch_persistent_context(str(profile), **launch, viewport={'width':390,'height':844})
                try:
                    durable = page_for(persistent); begin(durable)
                    durable.locator('#answer-reference').fill('process-resume')
                    click(durable, 'Show hint 1 of 3'); expect(durable.locator('#shown-hints li')).to_have_count(1)
                    persistent.close()
                    persistent = browser_type.launch_persistent_context(str(profile), **launch, viewport={'width':390,'height':844})
                    persistent.set_offline(True)
                    durable = page_for(persistent, False)
                    expect(durable.locator('#answer-reference')).to_have_value('process-resume')
                    expect(durable.locator('#shown-hints li')).to_have_count(1)
                    for i in range(8):
                        click(durable, 'Reveal answer'); click(durable, 'Reveal answer and continue')
                        if i < 7: advance(durable, True)
                    expect(durable.get_by_role('heading', name='Investigation complete', exact=True)).to_be_visible()
                finally:
                    persistent.close()
                need(not errors, 'No uncaught errors during actual-origin browser smoke')
                print(f'PASS: live Pages browser-process offline relaunch through ending; {args.engine} {browser.version}. No physical iPhone or field test claimed.')
                return 0

            # Active clients retain a package pin; failed and compatible updates retain saves.
            c3 = context(); update = page_for(c3); begin(update)
            update.locator('#answer-reference').fill('preserved draft'); click(update, 'Show hint 1 of 3')
            expect(update.locator('#shown-hints li')).to_have_count(1)
            original = saved(update)
            click(update, 'Offline & install')
            host.update(); host.failure = 'content/solutions/p08.json'
            click(update, 'Check for a complete update')
            expect(update.locator('#offline-status')).to_contain_text('Download incomplete', timeout=60000)
            need(saved(update) == original, 'Failed update retains exact save')
            c3.set_offline(True); update.close(); update = page_for(c3, False)
            expect(update.locator('#answer-reference')).to_have_value('preserved draft')
            expect(update.locator('#shown-hints li')).to_have_count(1)
            c3.set_offline(False); host.failure = None; click(update, 'Offline & install')
            click(update, 'Check for a complete update')
            expect(update.get_by_role('button', name='Use verified update', exact=True)).to_be_visible(timeout=60000)
            need(update.evaluate("fetch('./content/adventure.json').then(r=>r.json()).then(v=>v.contentVersion)") == '1.0.0', 'Open client stays pinned to old complete package')
            click(update, 'Use verified update')
            expect(update.locator('#answer-reference')).to_have_value('preserved draft')
            expect(update.locator('#shown-hints li')).to_have_count(1)
            need(update.evaluate("fetch('./content/adventure.json').then(r=>r.json()).then(v=>v.contentVersion)") == '1.0.1', 'Reopened client uses complete compatible update')
            click(update, 'Offline & install'); host.update(compatibility=2)
            click(update, 'Check for a complete update')
            expect(update.locator('#offline-status')).to_contain_text('different state version', timeout=60000)
            host.update(compatibility=1)
            # Delete a later cached document, verify false, offline recovery, then repair.
            update.evaluate("""async () => {for(const name of await caches.keys()) if(name.includes('package:')) {const cache=await caches.open(name); for(const key of await cache.keys()) if(new URL(key.url).pathname.endsWith('content/evidence/e16.json')) await cache.delete(key)}}""")
            click(update, 'Check offline readiness')
            expect(update.get_by_role('heading', name='Preparation incomplete', exact=True)).to_be_visible(timeout=60000)
            c3.set_offline(True); update.reload()
            expect(update.get_by_role('heading', name='Preparation needs repair', exact=True)).to_be_visible()
            need(saved(update)['workingAidDraftByPuzzle']['P01']['values']['reference'] == 'preserved draft', 'Eviction leaves saved progress intact')
            c3.set_offline(False); click(update, 'Retry complete download')
            expect(update.locator('#answer-reference')).to_have_value('preserved draft', timeout=60000)
            need(not errors, 'No browser runtime errors on update/recovery path')
            print('PASS: failed/incompatible/compatible updates, durable client pin, offline reopen, eviction detection and repair preserve progress.')

            # Corrupt and incompatible saves are retained until confirmed reset.
            update.evaluate('(key)=>{localStorage.setItem(key,"{broken");localStorage.setItem("unrelated","keep")}', SAVE)
            update.reload(); expect(update.locator('#storage-notice')).to_contain_text('could not be read')
            click(update, 'Restart investigation'); update.locator('#dialog > form button').click()
            need(update.evaluate('(key)=>localStorage.getItem(key)', SAVE) == '{broken', 'Cancel keeps corrupt save bytes')
            click(update, 'Restart investigation'); click(update, 'Erase progress and restart')
            need(saved(update)['completedPuzzleIds'] == [] and update.evaluate('localStorage.getItem("unrelated")') == 'keep', 'Restart touches only the intended save')
            begin(update)
            update.evaluate('(key)=>{const v=JSON.parse(localStorage.getItem(key));v.schemaVersion=99;localStorage.setItem(key,JSON.stringify(v))}', SAVE)
            update.reload(); expect(update.locator('#storage-notice')).to_contain_text('needs a compatible version')
            need(saved(update)['schemaVersion'] == 99, 'Incompatible save is retained')
            print('PASS: corrupt/incompatible recovery, cancelled/confirmed restart, unrelated storage preserved.')

            # Browser-level unavailable storage and write failure, followed by a retry.
            c4 = context("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")
            unavailable = page_for(c4); begin(unavailable)
            expect(unavailable.locator('#storage-notice')).to_contain_text('could not be saved')
            unavailable.locator('#answer-reference').fill(solutions['P01']['canonical']); click(unavailable, 'Check answer')
            expect(unavailable.get_by_role('heading', name='Finding recorded', exact=True)).to_be_visible()
            c5 = context("window.rejectSave=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='berea-case-01:investigation'&&window.rejectSave)throw new DOMException('Full','QuotaExceededError');return original.call(this,k,v)}")
            quota = page_for(c5); begin(quota)
            expect(quota.locator('#storage-notice')).to_contain_text('could not be saved')
            quota.evaluate('window.rejectSave=false'); click(quota, 'Retry saving')
            expect(quota.locator('#save-status')).to_have_text('Saved on this device')
            need(saved(quota)['started'], 'Retry saves the actual in-memory progress')
            need(not errors, 'No uncaught browser runtime errors')
            print('PASS: unavailable/quota storage truthfully reported; in-memory play and save retry work.')
            # A real browser-process shutdown/reopen, not only a new tab.
            profile = directory / 'persistent-profile'
            persistent = browser_type.launch_persistent_context(str(profile), **launch, viewport={'width':390,'height':844})
            durable = page_for(persistent); begin(durable)
            durable.locator('#answer-reference').fill('process-resume')
            click(durable, 'Show hint 1 of 3'); expect(durable.locator('#shown-hints li')).to_have_count(1)
            persistent.close()
            persistent = browser_type.launch_persistent_context(str(profile), **launch, viewport={'width':390,'height':844})
            persistent.set_offline(True)
            durable = page_for(persistent, False)
            expect(durable.locator('#answer-reference')).to_have_value('process-resume')
            expect(durable.locator('#shown-hints li')).to_have_count(1)
            for i in range(8):
                click(durable, 'Reveal answer'); click(durable, 'Reveal answer and continue')
                if i < 7: advance(durable, True)
            expect(durable.get_by_role('heading', name='Investigation complete', exact=True)).to_be_visible()
            persistent.close()
            need(not errors, 'No uncaught browser runtime errors after process restart')
            print('PASS: complete offline relaunch after browser-process shutdown; saved draft/hint and full ending survive.')
            print(f'PASS: {args.engine} {browser.version}; project subpath; 390×844 touch/reduced-motion viewport. No actual iPhone, field or live-host test claimed.')
        finally:
            for c in contexts: c.close()
            browser.close()
            if not args.live_url: host.server.shutdown()
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (AssertionError, BrowserError) as error:
        # Do not print Playwright's case-bearing accessibility snapshot.
        print(f'FAIL: browser regression: {str(error).splitlines()[0]}')
        print('Check locations:', ', '.join(str(frame.lineno) for frame in
              traceback.extract_tb(error.__traceback__) if frame.filename == __file__))
        raise SystemExit(1) from None
