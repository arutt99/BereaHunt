#!/usr/bin/env python3
"""Phase-7 fault, disclosure and usability regressions; output is spoiler-free.

Runs against temporary static copies at the Pages project subpath. Requires
Python Playwright and the selected browser. Never requests an external service.
This does not simulate an actual iPhone installation or measure player solve time.
"""
import argparse
import json
from pathlib import Path
import shutil
import tempfile
from time import monotonic
import traceback

from playwright.sync_api import sync_playwright, expect, Error as BrowserError
from test_browser import Host, ROOT, SAVE, need


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine', choices=('chromium', 'webkit'), default='chromium')
    parser.add_argument('--chromium', default=shutil.which('chromium') or shutil.which('chromium-browser'))
    args = parser.parse_args()
    started = monotonic()
    read = lambda path: json.loads((ROOT/'site/content'/path).read_text())
    puzzles = [read(f'puzzles/p{i:02}.json') for i in range(1, 9)]
    solutions = [read(p['solutionRef']) for p in puzzles]
    locations = read('locations.json')['locations']
    chapters = [read(ref) for ref in read('adventure.json')['chapterRefs']]
    errors, external = [], []

    with tempfile.TemporaryDirectory(prefix='berea-release-') as temp, sync_playwright() as pw:
        directory = Path(temp)
        shutil.copytree(ROOT/'site', directory/'BereaHunt')
        host = Host(directory)
        launch = dict(headless=True)
        if args.engine == 'chromium':
            launch.update(executable_path=args.chromium, args=['--no-sandbox'])
        browser = getattr(pw, args.engine).launch(**launch)
        contexts = []

        def context():
            c = browser.new_context(viewport={'width':390, 'height':844}, is_mobile=True,
                                    has_touch=True, reduced_motion='reduce')
            # Optional external actions may open a window; never contact Google or a source.
            c.route('https://**/*', lambda route: route.abort())
            c.on('request', lambda req: external.append(req.url) if not req.url.startswith(host.url) else None)
            contexts.append(c)
            return c

        def page_for(c, viewport=None):
            page = c.new_page()
            if viewport:
                page.set_viewport_size(viewport)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(host.url)
            return page

        def click(page, label):
            try:
                page.get_by_role('button', name=label, exact=True).click()
            except BrowserError as error:
                print(f'Action: {label}')
                print(page.get_by_role('button', name=label, exact=True).evaluate("""n=>{
                    const r=n.getBoundingClientRect();return {rect:r.toJSON(),x:scrollX,y:scrollY,
                    viewport:[innerWidth,innerHeight,visualViewport.width,visualViewport.height,visualViewport.scale,visualViewport.offsetTop],
                    hitTag:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.tagName}}"""))
                raise

        def saved(page):
            return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))', SAVE)

        def prepare(page):
            click(page, 'Download complete adventure')
            expect(page.get_by_role('heading', name='Ready offline', exact=True)).to_be_visible(timeout=60000)

        def begin(page):
            click(page, 'Start the investigation'); click(page, 'Start in this browser')
            expect(page.locator('#answer-form')).to_be_visible()

        def layout(current):
            snapshot = saved(current)
            for width, height in ((320,844), (390,844), (844,390)):
                # Size a fresh page before navigation. Resizing an interacting mobile
                # page in Chromium can retain auto-zoom and distort subsequent hit tests.
                # This measures layout sizes, not a physical orientation lifecycle.
                page = page_for(current.context, {'width':width, 'height':height})
                try:
                    if snapshot and snapshot['started']:
                        expect(page.locator('#answer-form')).to_be_visible()
                    else:
                        expect(page.get_by_role('heading', name='Ready offline', exact=True)).to_be_visible(timeout=60000)
                    for font_size in ('18px', '36px'):
                        page.locator('html').evaluate('(n,size)=>n.style.fontSize=size', font_size)
                        need(page.evaluate('document.documentElement.scrollWidth <= innerWidth'),
                             f'Layout fits viewport at {width}px with {font_size} text')
                    need(page.evaluate("""[...document.querySelectorAll('button,input,select,summary')]
                        .filter(n=>n.getBoundingClientRect().width && n.type!=='checkbox')
                        .every(n=>n.getBoundingClientRect().height>=47)"""), 'Comfortable visible targets')
                    need(page.evaluate("""[...document.querySelectorAll('button')].every(n=>
                        getComputedStyle(n).transitionDuration==='0s')"""), 'Reduced-motion transitions disabled')
                    need(page.evaluate("""[...document.querySelectorAll('input,select')].every(n=>
                        n.labels?.length || n.getAttribute('aria-label'))"""), 'All form controls named')
                    need(page.evaluate("""(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);
                        return ids.length===new Set(ids).size})()"""), 'No duplicate control IDs')
                finally:
                    page.close()
            need(saved(current)==snapshot, 'Read-only layout probes preserve progress')

        def wrong_answer(page, i):
            if i == 0: page.locator('#answer-reference').fill('incorrect')
            elif i == 1:
                options = puzzles[i]['workingAid']['mechanismOptions']
                page.locator('#answer-mechanism').select_option(next(x for x in options if x != solutions[i]['canonical']['mechanism']))
            elif i in (2,4): page.locator('#answer-answer').fill('incorrect')
            elif i == 3:
                page.get_by_role('checkbox').first.check()
            elif i == 5:
                lower, upper = solutions[i]['canonical']
                page.locator('#answer-lower').fill(upper); page.locator('#answer-upper').fill(lower)
            elif i == 6:
                for select in page.locator('#answer-form select').all():
                    select.select_option(puzzles[i]['workingAid']['badgeOptions'][0])
            else:
                page.locator('#answer-actor').fill('incorrect'); page.locator('#answer-order').fill('incorrect')
            before = saved(page)
            click(page, 'Record finding' if i == 7 else 'Check answer')
            expect(page.locator('#answer-feedback')).not_to_be_empty()
            expect(page.locator('#answer-feedback')).to_be_focused()
            need(saved(page) == before, f'Wrong P{i+1:02} response changes no progress or draft')

        try:
            c = context(); page = page_for(c)
            expect(page.get_by_role('heading', name='Prepare the investigation', exact=True)).to_be_visible()
            prepare(page)
            for location in locations[1:]:
                need(location['name'] not in page.locator('body').inner_text(), 'Preparation conceals destinations')
            layout(page); begin(page)
            # Complete offline relaunch before exercising unvisited chapters, rather than a loaded tab.
            c.set_offline(True); page.close(); page = page_for(c)
            expect(page.locator('#answer-form')).to_be_visible()
            for i, puzzle in enumerate(puzzles):
                print(f'Checking {puzzle["id"]}: layout, disclosure, controls and recovery.', flush=True)
                expect(page.locator('#answer-form')).to_be_visible()
                need(saved(page)['currentPuzzleId'] == puzzle['id'], 'Sequential current objective')
                for eid in puzzle['surfacedEvidenceIds']:
                    expect(page.locator(f'#main [data-evidence="{eid}"]')).to_be_visible()
                layout(page)
                # Every locked evidence/finding URL is checked against the current grant set.
                before = saved(page)
                locked = [f'#evidence/E{n:02}' for n in range(18) if f'E{n:02}' not in before['evidenceIds']]
                locked += [f'#puzzle/P{n:02}' for n in range(i+2,9)]
                for fragment in locked:
                    page.evaluate("""f=>{document.querySelectorAll('#answer-feedback,#page-feedback')
                        .forEach(n=>n.textContent='');location.hash=f}""", fragment)
                    expect(page.locator('#answer-feedback, #page-feedback')).to_contain_text('locked')
                    need(saved(page) == before and not page.locator('#dialog').evaluate('n=>n.open'), 'Locked URLs do not grant or open records')
                page.evaluate("history.replaceState(null,'',location.pathname)")
                text = page.locator('#main').inner_text()
                for chapter in chapters:
                    if not any(pid in before['completedPuzzleIds']+[puzzle['id']] for pid in chapter['puzzleIds']):
                        need(chapter['unlockedTitle'] not in text, 'Future chapter title concealed')
                empty = saved(page)
                click(page, 'Record finding' if i == 7 else 'Check answer')
                expect(page.locator('#answer-feedback')).to_have_text(puzzle['feedback']['empty'])
                need(saved(page)==empty, 'Empty answer preserves progress')
                wrong_answer(page, i)
                draft = saved(page)['workingAidDraftByPuzzle']
                click(page, 'Compare relevant evidence')
                expect(page.get_by_role('button', name='Use single-column evidence', exact=True)).to_be_focused()
                need(saved(page)['workingAidDraftByPuzzle'] == draft, 'Compare preserves working values')
                click(page, 'Use single-column evidence')
                if i == 2:
                    page.locator('#answer-keyword').fill('example')
                    click(page, 'Build grid from my keyword')
                    expect(page.get_by_role('button', name='Build grid from my keyword', exact=True)).to_be_focused()
                    click(page, 'Reset working area')
                    expect(page.get_by_role('button', name='Reset working area', exact=True)).to_be_focused()
                    click(page, 'Undo')
                    expect(page.get_by_role('button', name='Undo', exact=True)).to_be_focused()
                # Hide failed images without losing their complete textual documentary inputs.
                for image in page.locator('#main figure img').all():
                    need(bool(image.get_attribute('alt')), 'Reference image has a readable equivalent')
                    image.locator('..').click()
                    expect(page.get_by_role('heading', name='Inspect reference image', exact=True)).to_be_focused()
                    page.wait_for_function("document.querySelector('#dialog .inspection img').naturalWidth>0")
                    page.locator('#image-zoom').focus(); page.keyboard.press('ArrowRight')
                    need(page.locator('#dialog .inspection img').evaluate('n=>parseInt(n.style.width)')>960, 'Image keyboard zoom works offline')
                    page.keyboard.press('Escape')
                    image.evaluate("n=>n.src='./assets/references/missing.svg'")
                    expect(image).to_be_hidden()
                click(page, 'Show hint 1 of 3')
                expect(page.locator('#shown-hints li').last).to_be_focused()
                click(page, 'Can’t access this clue')
                expect(page.get_by_role('heading', name='Unsolved reference evidence', exact=True)).to_be_focused()
                page.keyboard.press('Escape'); expect(page.locator('#dialog')).not_to_be_visible()
                click(page, 'Case file')
                need(page.locator('.case-list button').count() >= len(saved(page)['evidenceIds']), 'Collected evidence accessible')
                click(page, 'Return to current task')
                click(page, 'Reveal answer'); page.keyboard.press('Escape')
                need(len(saved(page)['completedPuzzleIds']) == i, 'Escape cancels reveal')
                click(page, 'Reveal answer'); click(page, 'Reveal answer and continue')
                if i == 7: break
                expect(page.get_by_role('heading', name='Finding recorded', exact=True)).to_be_visible()
                # Restore mid-finding, mid-destination and mid-travel, not only during an objective.
                page.reload(); expect(page.get_by_role('heading', name='Finding recorded', exact=True)).to_be_visible()
                travel = page.get_by_role('button', name='Review confirmed destination', exact=True)
                if travel.count():
                    travel.click(); page.reload()
                    expect(page.get_by_role('button', name='Confirm destination', exact=True)).to_be_visible()
                    need(not page.locator('#answer-form').count(), 'Destination has no puzzle form')
                    link = page.get_by_role('link', name='Open optional external map', exact=True)
                    need(link.get_attribute('href') == locations[1 if i==0 else 2]['optionalMapUrl'], 'Map matches unlocked written destination')
                    need(link.get_attribute('target') == '_blank', 'Map cannot replace the case')
                    # Opening the optional map offline does not change the saved case.
                    snapshot = saved(page)
                    with page.expect_popup() as popup:
                        link.click()
                    popup.value.close()
                    need(saved(page) == snapshot, 'Unavailable external map preserves progress')
                    click(page, 'Confirm destination'); page.reload()
                    expect(page.get_by_role('heading', name='Stop safely before investigating', exact=True)).to_be_visible()
                    click(page, 'Can’t visit — continue with references from a safe place')
                    page.keyboard.press('Escape')
                    need(saved(page)['mode'] == 'travel', 'Cancellation preserves safe travel gate')
                    click(page, 'Can’t visit — continue with references from a safe place')
                    click(page, 'I’m safely stopped — use references')
                else: click(page, 'Continue the case')
                # Both the case and assistance are restored when closing at a new stage.
                page.close(); page = page_for(c)
            expect(page.get_by_role('heading', name='Investigation complete', exact=True)).to_be_visible()
            need(len(saved(page)['completedPuzzleIds'])==8 and len(saved(page)['evidenceIds'])==18, 'All fallbacks end in the complete case')
            need(len(external)<=2 and set(external).issubset({x['optionalMapUrl'] for x in locations[1:]}),
                 'Only explicitly opened external maps were requested')
            print('PASS: every objective at three sizes/200% text; controls, focus, reduced motion, image failure and prior evidence.')
            print('PASS: all locked view URLs, wrong answer types, map failures, cancelled actions and multi-stage offline closure recovery.')

            # Two live windows: storage events must block the stale window before it can overwrite.
            c2 = context(); first = page_for(c2); prepare(first); begin(first)
            # A delivered body that differs from its manifest must fail, not go live.
            snapshot = saved(first); host.update()
            changed = directory/'BereaHunt/content/solutions/p08.json'
            original = changed.read_bytes(); changed.write_bytes(original[:-1]+b' ')
            click(first, 'Offline & install'); click(first, 'Check for a complete update')
            expect(first.locator('#offline-status')).to_contain_text('Download incomplete', timeout=60000)
            need(saved(first)==snapshot, 'Hash/length-mismatched update preserves exact save')
            changed.write_bytes(original)
            click(first, 'Resume investigation')
            stale = page_for(c2); expect(stale.locator('#answer-form')).to_be_visible()
            first.locator('#answer-reference').fill('first window')
            expect(stale.locator('#storage-notice')).to_contain_text('another window')
            need(not stale.locator('#answer-form').count(), 'Stale window cannot submit')
            click(stale, 'Retry reading saved progress')
            expect(stale.locator('#answer-reference')).to_have_value('first window')
            first.close()
            # A real changed worker installs but must wait while the case is open.
            worker = directory/'BereaHunt/service-worker.js'
            worker.write_text(worker.read_text()+"\nself.addEventListener('activate',e=>e.waitUntil(caches.open('phase7-probe').then(c=>c.put(new URL('__probe__',self.location.href),new Response('activated')))));\n")
            host.update()
            stale.evaluate('async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()}')
            stale.wait_for_function('async()=>!!(await navigator.serviceWorker.getRegistration()).waiting')
            need(not stale.evaluate("()=>caches.has('phase7-probe')"), 'New worker waits for existing clients')
            draft = saved(stale)
            click(stale, 'Offline & install'); click(stale, 'Check for a complete update')
            expect(stale.get_by_role('button', name='Use verified update', exact=True)).to_be_visible(timeout=60000)
            need(saved(stale)==draft, 'Worker and package update preserve exact progress')
            stale.close(); stale = page_for(c2)
            stale.wait_for_function("()=>caches.has('phase7-probe')")
            expect(stale.locator('#answer-reference')).to_have_value('first window')
            need(stale.evaluate("()=>fetch('./content/adventure.json').then(r=>r.json()).then(v=>v.contentVersion)")=='1.0.1', 'Reopen adopts full compatible package with new worker')
            c2.set_offline(True); stale.close(); stale=page_for(c2)
            expect(stale.locator('#answer-reference')).to_have_value('first window')
            need(not errors, 'No uncaught page errors')
            print('PASS: live concurrent windows; waiting worker upgrade, compatible package adoption and offline reopen retain saves.')
            print(f'PASS: {args.engine} {browser.version}; automated execution {monotonic()-started:.1f}s (not player timing).')
        finally:
            for c in contexts: c.close()
            browser.close(); host.server.shutdown(); host.server.server_close()
    return 0


if __name__=='__main__':
    try:
        raise SystemExit(main())
    except (AssertionError, BrowserError) as error:
        # Playwright may append an entire case-bearing accessibility snapshot.
        # Keep routine output neutral; detailed findings belong in concealed docs.
        print(f'FAIL: release regression: {str(error).splitlines()[0]}')
        print('Check locations:', ', '.join(str(frame.lineno) for frame in
              traceback.extract_tb(error.__traceback__) if frame.filename == __file__))
        raise SystemExit(1) from None
