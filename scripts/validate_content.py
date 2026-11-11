#!/usr/bin/env python3
"""Validate the actual phase-5 corpus. Output counts/record IDs, never answers."""

import argparse
from copy import deepcopy
from itertools import permutations, product
import json
from pathlib import Path, PurePosixPath
import re
import sys
import xml.etree.ElementTree as ET

from build_content_inventory import inventory_outputs
from content_answers import check_answer, parse_time
from validate_design import need, indexed

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'site/content'


def read(path):
    return json.loads(path.read_text())


def records(folder, id_key='id'):
    values = []
    for path in sorted((CONTENT / folder).glob('*.json')):
        value = read(path)
        need(path.name == f'{value[id_key].lower()}.json', 'Record ID does not match its referenced filename')
        values.append(value)
    need(len({value[id_key] for value in values}) == len(values), 'Duplicate record ID')
    return values


def load_corpus():
    return dict(adventure=read(CONTENT / 'adventure.json'),
                chapters=indexed(records('chapters'), 'chapters'),
                puzzles=indexed(records('puzzles'), 'puzzles'),
                evidence=indexed(records('evidence'), 'evidence'),
                solutions={d['puzzleId']: d for d in records('solutions','puzzleId')},
                locations=indexed(read(CONTENT / 'locations.json')['locations'], 'locations'),
                assets=indexed(read(CONTENT / 'assets.json')['assets'], 'assets'),
                preparation=read(CONTENT / 'preparation.json'), sources=read(CONTENT / 'sources.json'))


def text(value):
    need(isinstance(value, str) and bool(value.strip()), 'Missing player-facing text')
    need(not re.search(r'\b(?:TODO|TBD|FIXME|lorem ipsum|placeholder)\b', value, re.I), 'Unfinished player-facing text')


def required(record, fields, label):
    need(all(f in record for f in fields.split()), f'{label}: missing required field')


def local_path(value):
    need(isinstance(value, str) and value and not re.search(r'[\\?#:]', value), 'Invalid local resource path')
    path = PurePosixPath(value)
    need(not path.is_absolute() and '..' not in path.parts and str(path) == value, 'Unsafe relative resource path')
    return value


def block(corpus, ref):
    eid, bid = ref.split('#')
    matches = [b for b in corpus['evidence'][eid]['bodyBlocks'] if b['id'] == bid]
    need(len(matches) == 1, 'Unknown/duplicate working reference')
    return matches[0]


def cell(value):
    if isinstance(value, list):
        return ', '.join(cell(v) for v in value)
    if isinstance(value, dict):
        return '; '.join(f'{k}: {cell(v)}' for k, v in value.items())
    return str(value)


def equivalent(blocks):
    out = []
    for b in blocks:
        if 'title' in b:
            out.append(b['title'])
        if b['type'] == 'paragraph':
            out.append(b['text'])
        elif b['type'] == 'table':
            out.extend('; '.join(c['label'] + ': ' + cell(row[c['key']]) for c in b['columns']) for row in b['rows'])
        elif b['type'] == 'instructions':
            out.extend(b['steps'])
        elif b['type'] == 'figure':
            out.append(b['caption'])
        elif b['type'] == 'optional_section':
            out.extend(b['paragraphs'])
    return '\n\n'.join(out)


def validate(corpus, research, design):
    a = corpus['adventure']
    chapters, puzzles, evidence = (corpus[k] for k in ('chapters', 'puzzles', 'evidence'))
    solutions, locations, assets = (corpus[k] for k in ('solutions', 'locations', 'assets'))
    facts = indexed(research['facts'], 'facts')
    required(a, 'id schemaVersion contentVersion stateCompatibility initialPuzzleId chapterIds chapterRefs evidenceRefs puzzleRefs locationRef sourcesRef assetRegistry assetManifest preparationRef travelLegs contracts publicLabel staticHostingNotice pacing', 'adventure')
    need(a['id'] == design['adventure_id'] and a['schemaVersion'] == a['stateCompatibility'] == 1, 'Unexpected content identity/version')
    need(re.fullmatch(r'\d+\.\d+\.\d+', a['contentVersion']) is not None, 'Invalid content version')
    need(a['chapterIds'] == list(chapters) and len(chapters) == 5 and len(puzzles) == len(solutions) == 8 and len(evidence) == 18, 'Incomplete adventure corpus')
    for field, collection, folder in [('chapterRefs', chapters, 'chapters'), ('puzzleRefs', puzzles, 'puzzles'), ('evidenceRefs', evidence, 'evidence')]:
        need(a[field] == [f'{folder}/{id.lower()}.json' for id in collection], 'Missing index references')
    for field in ('locationRef', 'sourcesRef', 'assetRegistry', 'assetManifest', 'preparationRef'):
        need((CONTENT / local_path(a[field])).is_file(), 'Missing package index')
    need(a['initialPuzzleId'] == next(iter(puzzles)), 'Wrong starting objective')
    contract = a['contracts']
    need(all(contract[k] is False for k in ['audioAllowed','paperRequired','arrivalProofRequired','coreNetworkRequired','hintsDelayed','assistanceBlocksCompletion','referenceRevealsAnswer']), 'Unsupported play dependency')
    need(contract['singlePhone'] is True and contract['revealConfirmationRequired'] is True, 'Missing interaction contract')
    need(a['pacing'] == design['pacing'], 'Pacing drift from approved design')
    need(sum(p['targetMinutes'] for p in puzzles.values()) == a['pacing']['puzzle_minutes'], 'Solving budget mismatch')
    need(sum(p['manipulationMinutes'] for p in puzzles.values()) == a['pacing']['manipulation_minutes'], 'Manipulation budget mismatch')

    used, grants, available = [], {}, set()
    design_puzzles = {p['id']: p for p in design['puzzles']}
    for order, chapter in enumerate(chapters.values()):
        required(chapter, 'id order publicLabel unlockedTitle locationId puzzleIds prerequisitePuzzleIds introduction transition', chapter['id'])
        need(chapter['order'] == order and chapter['publicLabel'] == f'Chapter {order+1}', 'Chapter order/locked label invalid')
        need(chapter['locationId'] in locations, 'Unknown chapter setting')
        expected_gate = [] if not used else [used[-1]]
        need(chapter['prerequisitePuzzleIds'] == expected_gate, 'Invalid chapter prerequisite')
        for key in ('unlockedTitle','introduction','transition'):
            text(chapter[key])
        for pid in chapter['puzzleIds']:
            need(pid in puzzles and pid not in used, 'Duplicate/unknown chapter objective')
            p, s, d = puzzles[pid], solutions[pid], design_puzzles[pid]
            required(p, 'id chapterId locationId prerequisitePuzzleIds entryEvidenceIds requiredEvidenceIds surfacedEvidenceIds prompt answerType answerFields solutionRef workingAid hintIds referenceEvidenceIds revealId rewardEvidenceIds completionRoutes nextPuzzleId targetMinutes manipulationMinutes testingStatus feedback assistance essentialFactIds requiredPhysicalFactIds requiredAssetIds', pid)
            need(p['chapterId'] == chapter['id'] and p['locationId'] == chapter['locationId'], 'Chapter membership mismatch')
            need(p['prerequisitePuzzleIds'] == ([] if not used else [used[-1]]), 'Broken/cyclic prerequisite')
            # Deliberate amendments to architecture belong in its separate record.
            for key, source_key in [('entryEvidenceIds','entry_evidence_ids'),('requiredEvidenceIds','required_evidence_ids'),('surfacedEvidenceIds','surfaced_evidence_ids'),('rewardEvidenceIds','completion_routes'),('essentialFactIds','essential_fact_ids'),('requiredAssetIds','required_asset_ids')]:
                expected = d[source_key]['correct'] if key == 'rewardEvidenceIds' else d[source_key]
                need(p[key] == expected, f'{pid}: design contract drift')
            for eid in p['entryEvidenceIds']:
                need(eid in evidence and eid not in grants, 'Unknown/duplicate entry grant')
                grants[eid] = dict(type='enterPuzzle', puzzleId=pid)
                available.add(eid)
            need(set(p['requiredEvidenceIds']) <= set(p['surfacedEvidenceIds']) <= available, 'Future input or unsurfaced required evidence')
            need(p['referenceEvidenceIds'] == list(dict.fromkeys(p['requiredEvidenceIds'] + d['reference_route']['evidence_ids'])), 'Incomplete or leaking reference pack')
            need(set(p['referenceEvidenceIds']) <= available, 'Reference reveals future evidence')
            need(p['requiredPhysicalFactIds'] == [], 'Unapproved physical clue required')
            for fid in p['essentialFactIds']:
                need(fid in facts and facts[fid]['verification_status'] == 'Verified' and facts[fid]['eligible_as_essential_reference'], 'Ineligible essential factual input')
                # Essential factual inputs must be supplied in the surfaced input pack.
                need(any(fid in evidence[eid]['factIds'] for eid in p['surfacedEvidenceIds']), 'Missing factual input at point of use')
            need(set(p['requiredAssetIds']) <= assets.keys(), 'Unknown required asset')
            need(set(p['requiredAssetIds']) <= {aid for eid in p['surfacedEvidenceIds'] for aid in evidence[eid]['assetIds']}, 'Required asset not surfaced')
            need(p['completionRoutes'] == {'correct':p['rewardEvidenceIds'], 'reveal':p['rewardEvidenceIds']}, 'Assisted completion loses rewards')
            for eid in p['rewardEvidenceIds']:
                need(eid in evidence and eid not in grants, 'Unknown/duplicate reward')
                need(set(evidence[eid]['supportsFrom']) <= available, 'Conclusion before supporting evidence')
                grants[eid] = dict(type='completePuzzle', puzzleId=pid)
                available.add(eid)
            text(p['prompt'])
            need(5 <= p['targetMinutes'] <= 10 and p['manipulationMinutes'] <= p['targetMinutes'], 'Invalid puzzle duration estimate')
            need('canonical' not in p and 'acceptedAliases' not in p and 'reasoningSteps' not in p, 'Solution mixed into presentation')
            need(p['solutionRef'] == f'solutions/{pid.lower()}.json', 'Solution reference mismatch')
            need(len(p['answerFields']) == (2 if pid in ('P02','P06','P08') else 1), 'Missing/overlong answer form')
            for field in p['answerFields']:
                required(field, 'name label type', 'answer field')
                text(field['label'])
            for feedback in ('empty','incorrect','correct'):
                text(p['feedback'][feedback])
            assist = p['assistance']
            for flag in ('requiresVisit','requiresNetwork','requiresImage','completesPuzzle','revealsAnswer'):
                need(assist[flag] is False, 'Reference checks arrival or answers puzzle')
            need(assist['hintDelaySeconds'] == 0 and assist['revealConfirmationRequired'] is True, 'Hint delay or unconfirmed reveal')
            for key in ('referenceLabel','referenceIntroduction','revealConfirmation'):
                text(assist[key])
            aid = p['workingAid']
            required(aid, 'kind inputRefs instructions controls', 'working aid')
            text(aid['instructions'])
            need(aid['controls'], 'No phone working controls')
            for ref in aid['inputRefs']:
                block(corpus, ref)
                need(ref.split('#')[0] in p['surfacedEvidenceIds'], 'Working aid depends on hidden evidence')
            required(s, 'puzzleId answerType canonical acceptedAliases normalizationProfile reasoningSteps alternativeEliminations hints reveal completionEvidenceIds', 'solution')
            need(s['puzzleId'] == pid and s['answerType'] == p['answerType'] == d['answer_type'], 'Typed solution mismatch')
            need(s['normalizationProfile'] == p['answerType'], 'Missing normalization contract')
            need(check_answer(s,s['canonical']), 'Canonical answer fails declared contract')
            need(s['canonical'] == d['canonical_answer'], 'Solution changed from approved architecture')
            need(len(s['hints']) == 3 and [h['id'] for h in s['hints']] == p['hintIds'] == [f'{pid}-H{i}' for i in range(1,4)], 'Missing/duplicate hints')
            for hint in s['hints']:
                text(hint['text'])
            need(s['reasoningSteps'] and s['alternativeEliminations'], 'Unjustified solution')
            for line in s['reasoningSteps'] + s['alternativeEliminations']:
                text(line)
            need(s['reveal']['id'] == p['revealId'] and s['completionEvidenceIds'] == p['rewardEvidenceIds'], 'Reveal cannot continue equivalently')
            text(s['reveal']['explanation'])
            text(s['reveal']['continueLabel'])
            used.append(pid)
    need(used == list(puzzles) and set(grants) == set(evidence), 'Unreachable content or orphan record')
    for i, pid in enumerate(used):
        need(puzzles[pid]['nextPuzzleId'] == (used[i+1] if i+1 < len(used) else None), 'Broken successor')

    for e in evidence.values():
        required(e, 'id kind title classification bodyBlocks factIds assetIds textEquivalent grantEvent supportsFrom', e['id'])
        need(e['grantEvent'] == grants[e['id']], 'Incorrect evidence grant event')
        need(set(e['supportsFrom']) <= set(evidence), 'Unknown conclusion support')
        text(e['title'])
        need(e['bodyBlocks'] and len({b['id'] for b in e['bodyBlocks']}) == len(e['bodyBlocks']), 'Empty/duplicate document block')
        need(e['classification'] in ('fictional','authored_reference','mixed_separated'), 'Missing fiction/fact distinction')
        need(set(e['factIds']) <= facts.keys(), 'Unknown evidence fact')
        need(set(e['assetIds']) <= assets.keys(), 'Unknown evidence art')
        referenced_facts, referenced_assets = set(), set()
        classes = set()
        for b in e['bodyBlocks']:
            required(b, 'id type classification factIds', 'evidence block')
            need(b['classification'] in ('fictional','authored_reference'), 'Unseparated fact/fiction block')
            classes.add(b['classification'])
            referenced_facts.update(b['factIds'])
            if b['factIds']:
                need(b['classification'] == 'authored_reference', 'Factual block labeled fiction')
            if b['type'] == 'paragraph':
                text(b['text'])
                need(len(b['text'].split()) <= 100, 'Overlong core paragraph')
            elif b['type'] == 'table':
                text(b['title'])
                keys = [c['key'] for c in b['columns']]
                need(b['rows'] and len(keys) == len(set(keys)), 'Invalid table')
                for row in b['rows']:
                    need(set(keys) <= row.keys(), 'Missing displayed table cell')
                    for key in keys:
                        text(cell(row[key]))
            elif b['type'] == 'instructions':
                need(b['steps'], 'Missing working instructions')
                for line in b['steps']:
                    text(line)
            elif b['type'] == 'figure':
                referenced_assets.add(b['assetId'])
                need(b['assetId'] in assets, 'Figure asset missing')
                text(b['caption'])
            elif b['type'] == 'optional_section':
                need(e['id'] == 'E17' and b['paragraphs'], 'Unexpected hidden essential text')
                for line in b['paragraphs']:
                    text(line)
            else:
                need(False, 'Unsupported content block')
        need(referenced_facts == set(e['factIds']) and referenced_assets == set(e['assetIds']), 'Evidence fact/asset inventory mismatch')
        need(e['classification'] == ('mixed_separated' if len(classes)>1 else next(iter(classes))), 'Document classification mismatch')
        need(e['textEquivalent'] == equivalent(e['bodyBlocks']), 'Incomplete accessible text equivalent')
        for fid in referenced_facts:
            need(facts[fid]['verification_status'] == 'Verified', 'Unverified player factual claim')
    for aid, asset in assets.items():
        required(asset, 'id relativePath mimeType byteLength sha256 classification factIds sourceCredit permittedUse textEquivalentRef requiredOffline imageEssential', aid)
        local_path(asset['relativePath'])
        need(asset['classification'] == 'authored_reference' and asset['imageEssential'] is False and asset['requiredOffline'] is True, 'Unsupported asset requirement')
        need(asset['mimeType'] == 'image/svg+xml', 'Unexpected asset media')
        need(block(corpus,asset['textEquivalentRef'])['assetId'] == aid, 'Wrong asset text equivalent')
        for fid in asset['factIds']:
            need(facts[fid]['eligible_as_essential_reference'] and facts[fid]['verification_status'] == 'Verified', 'Unverified asset input')
        text(asset['sourceCredit']); text(asset['permittedUse'])
    need(set(locations) == set(design['route']['location_ids']), 'Unexpected route destination')
    for loc in locations.values():
        required(loc, 'id name addressOrOperatorDescription navigationFactIds arrivalInstructions optionalMapUrl walkingPlan restrictions referenceActionLabel unlockAfterPuzzleId reviewedOn', loc['id'])
        for fid in loc['navigationFactIds']:
            need(fid in facts and facts[fid]['verification_status'] == 'Verified', 'Unverified navigation')
        for key in ('name','addressOrOperatorDescription','arrivalInstructions','walkingPlan'):
            text(loc[key])
        need(loc['restrictions'] and loc['optionalMapUrl'].startswith('https://maps.google.com/'), 'Missing safe travel instructions')
        need(loc['unlockAfterPuzzleId'] == ({'L00':None,'L01':'P01','L05':'P03'}[loc['id']]), 'Premature destination unlock')
    need(len(a['travelLegs']) == 2, 'Unexpected travel scope')
    for leg in a['travelLegs']:
        need(leg['requiresConfirmation'] and locations[leg['toLocationId']]['unlockAfterPuzzleId'] == leg['afterPuzzleId'], 'Travel before confirmation')
        need(set(leg['confirmationEvidenceIds']) <= set(puzzles[leg['afterPuzzleId']]['rewardEvidenceIds']), 'Travel confirmation unavailable')
    # Preparation must be independently loadable without a dossier or route leak.
    prep = corpus['preparation']
    required(prep, 'publicLabel introduction installInstructions practicalGuidance labels restartConfirmation storageNotices referenceNotice mapNotice sourceReviewDate dateNotice', 'preparation')
    preparation_text = json.dumps(prep, ensure_ascii=False).casefold()
    for secret in [locations['L01']['name'], locations['L05']['name'], 'The Hollow Register', 'Quinn', 'O43', 'SHALLOW']:
        need(secret.casefold() not in preparation_text, 'Preparation spoiler')
    for s in solutions.values():
        need(s['reveal']['explanation'] not in preparation_text, 'Preparation solution leak')
    for value in prep['installInstructions'] + prep['practicalGuidance']:
        text(value)
    need(set(puzzles['P08']['workingAid']['controls']) == {'actor_text','order_text','deliberate_submit'}, 'Final answer form scope changed')
    need(puzzles['P08']['workingAid']['atomicValidation'] is True and puzzles['P08']['workingAid']['perFieldCorrectness'] is False and puzzles['P08']['workingAid']['externalSubmission'] is False, 'Final correctness oracle/external submission')
    need(puzzles['P03']['workingAid']['initialKeyword'] == '' and not any(puzzles['P03']['workingAid']['initialCells']), 'Cipher aid prefilled')
    need(puzzles['P04']['workingAid']['initialSelection'] == [] and not any(puzzles['P07']['workingAid']['initialMapping'].values()), 'Reference board solved in advance')
    sources = corpus['sources']
    need(sources['citationPolicy']['onlyGrantedFactIds'] is True and sources['citationPolicy']['enforceDisplayGates'] is True, 'Source registry shown without gates')
    text(sources['citationPolicy']['lockedCitationLabel'])
    public_facts = indexed(sources['facts'], 'public facts')
    public_sources = indexed(sources['sources'], 'public sources')
    used_facts = {f for e in evidence.values() for f in e['factIds']} | {f for loc in locations.values() for f in loc['navigationFactIds'] if f not in ('F003','F004')}
    need(set(public_facts) == used_facts, 'Missing/extraneous deployed fact citation')
    original_sources = indexed(research['sources'], 'research sources')
    for fid, fact in public_facts.items():
        need(fact['displayAfterPuzzleId'] == ('P03' if fid == 'F021' else None), 'Source claim discloses an unconfirmed destination')
        need(fact['claim'] == facts[fid]['claim'] and fact['classification'] == facts[fid]['verification_status'], 'Citation misrepresents research')
        need(set(fact['sourceIds']) == {s['source_id'] for s in facts[fid]['evidence']}, 'Incomplete citation sources')
        need(set(fact['sourceIds']) <= public_sources.keys(), 'Unknown public citation')
    for sid, source in public_sources.items():
        need(source['displayAfterPuzzleId'] == ('P03' if sid == 'S08' else None), 'Citation title/URL discloses an unconfirmed destination')
        need(source['url'] == original_sources[sid]['url'] and source['reviewedOn'] == original_sources[sid]['reviewed_on'], 'Citation date or URL changed')
    return grants


def solve_authored_inputs(c):
    """Derive results from the tables/protocol actually delivered to players."""
    s = c['solutions']
    def rows(ref): return block(c, ref)['rows']
    receipts = rows('E01#receipts')
    brief = block(c,'E00#commission')['text']
    job = re.search(r'job (\w+)', brief)[1].rstrip('.')
    current = re.search(r'Begin at seal (\w+)', brief)[1]
    seen = set()
    while True:
        need(current not in seen, 'Authored receipt cycle')
        seen.add(current)
        links = [r for r in receipts if r['job']==job and r['from']==current]
        need(len(links)<=1, 'Ambiguous authored receipt chain')
        if not links: break
        current = links[0]['to']
    need(check_answer(s['P01'],current), 'Authored receipt solution inconsistent')
    observations = rows('E03#observations')[0]
    matching = [p['mechanism'] for p in rows('E03#profiles') if all(p[k]==v for k,v in observations.items())]
    need(len(matching)==1 and check_answer(s['P02'],dict(sequence=['shale_erodes','support_lost','sandstone_breaks'],mechanism=matching[0])), 'Bench profiles ambiguous/inconsistent')
    # The causal reference itself is prose; its exact causal claims receive desk
    # review, not a claim of general natural-language theorem proving.
    need('shale beneath sandstone' in block(c,'E03#process')['text'], 'Causal reference incomplete')
    protocol = block(c,'E05#protocol')['data']
    keyword = re.search(r'note: ([A-Z]+)',block(c,'E04#keyword')['text'])[1]
    need(protocol['coordinateOrder']=='row_column' and protocol['alphabet']=='ABCDEFGHIKLMNOPQRSTUVWXYZ', 'Cipher protocol drift')
    grid = ''.join(dict.fromkeys(keyword+protocol['alphabet']))
    need(len(grid)==25, 'Invalid authored cipher alphabet')
    decoded = ''.join(grid[(int(p[0])-1)*5+int(p[1])-1] for p in protocol['pairs'])
    need(check_answer(s['P03'],decoded), 'Cipher plaintext inconsistent with authored protocol')
    selectors = rows('E05#selectors')
    need(len([r for r in selectors if decoded.lower() in r['description'].lower()])==1, 'Reference selection ambiguous')
    inventory = rows('E08#before')
    pair = [r['serial'] for r in inventory if r['owner']=='Lark Workshop' and r['kind']=='relief' and r['batch']=='B17']
    need(check_answer(s['P04'],pair) and len(pair)==len(set(pair)), 'Inventory solution ambiguous/inconsistent')
    commission = rows('E10#commission')[0]
    need(set(commission['serials'])==set(pair) and commission['manufacture']=='new' and commission['owner']=='Lark Workshop', 'Commission fails to establish particular identity')
    need(check_answer(s['P05'],'modern commission'), 'Classification inconsistent')
    raw_log = rows('E12#log')
    need('exactly four minutes fast' in block(c,'E12#calibration')['text'], 'Clock calibration changed without review')
    bounds = [parse_time(r['serviceTime'])-4 for r in raw_log]
    need(bounds==[parse_time(t) for t in s['P06']['canonical']], 'Clock correction inconsistent')
    need(s['P06']['timeBounds']==dict(lowerInclusive=False,upperInclusive=True), 'Interval endpoint error')
    statements = [r['text'] for r in rows('E14#constraints')]
    need(statements == ['Nadia Hart checked out C4 and was the conservator.', 'Samir Cole was the courier; the courier checked out D9.', 'The cataloguer checked out A7.', 'Luca Bellamy was neither courier nor dispatcher.'], 'Roster statements changed; update finite solver with prose review')
    people=[r['name'] for r in rows('E14#people')]
    role_names=[r['role'] for r in rows('E14#roles')]
    badges=c['puzzles']['P07']['workingAid']['badgeOptions']
    roster_results=[]
    for role_order,badge_order in product(permutations(role_names), permutations(badges)):
        roles=dict(zip(people,role_order)); mapping=dict(zip(people,badge_order))
        if (mapping['Nadia Hart']=='C4' and roles['Nadia Hart']=='conservator' and roles['Samir Cole']=='courier' and
            mapping['Samir Cole']=='D9' and mapping[next(n for n in people if roles[n]=='cataloguer')]=='A7' and roles['Luca Bellamy'] not in ['courier','dispatcher']):
            roster_results.append(mapping)
    need(len(roster_results)==1 and check_answer(s['P07'],roster_results[0]), 'Roster not uniquely supported')
    roster=roster_results[0]
    need({r['name']:r['badge'] for r in rows('E15#roster')} == roster, 'Reward roster inconsistent')
    need(all(token in block(c,'E16#scope')['text'] for token in ['complete relevant records','unshared','no delegation','impersonation','collusion','queued delay','offline substitution','immediately','untampered']), 'Final rules insufficient')
    candidates=[]
    for order in rows('E16#orders'):
        when=parse_time(order['time'])
        permitted=any(a['badge']==order['badge'] and set(a['permissions'])>={'repack','redirect'} and parse_time(a['from'])<=when<parse_time(a['until']) for a in rows('E16#authority'))
        if set(order['serials'])==set(pair) and order['receiver']!=commission['owner'] and bounds[0]<when<=bounds[1] and permitted:
            candidates.append(dict(actor=next(n for n in roster if roster[n]==order['badge']),order=order['id']))
    need(len(candidates)==1 and check_answer(s['P08'],candidates[0]), 'Final record does not uniquely support solution')
    need(candidates[0]['actor'] in block(c,'E17#ending')['text'] and candidates[0]['order'] in block(c,'E17#ending')['text'], 'Ending contradicts finding')


def validate_paths(corpus):
    count = 0
    # Every objective can be solved/revealed with/without opening references.
    for modes in product(('correct','reveal','reference_correct','reference_reveal'), repeat=len(corpus['puzzles'])):
        evidence, done = set(), set()
        for p, mode in zip(corpus['puzzles'].values(), modes):
            need(set(p['prerequisitePuzzleIds']) <= done, 'Path blocked by prerequisite')
            evidence.update(p['entryEvidenceIds'])
            if mode.startswith('reference_'):
                need(set(p['referenceEvidenceIds']) <= evidence, 'Reference path leaks future content')
                mode = mode.removeprefix('reference_')
            need(set(p['requiredEvidenceIds']) <= evidence, 'Path lacks required evidence')
            evidence.update(p['completionRoutes'][mode])
            once=evidence.copy(); evidence.update(p['completionRoutes'][mode])
            need(evidence==once, 'Repeated grant changes case')
            done.add(p['id'])
        need(done == set(corpus['puzzles']) and evidence==set(corpus['evidence']), 'Incomplete assisted ending')
        count += 1
    return count


def validate_files(c):
    for path, output in inventory_outputs().items():
        need(path.read_text() == output, 'Stale/missing resource inventory or asset hash')
    for asset in c['assets'].values():
        path=ROOT/'site'/local_path(asset['relativePath'])
        root=ET.fromstring(path.read_text())
        ns={'s':'http://www.w3.org/2000/svg'}
        need(root.tag=='{http://www.w3.org/2000/svg}svg' and root.find('s:title',ns) is not None and root.find('s:desc',ns) is not None, 'Inaccessible SVG')
        need(not any(node.tag.split('}')[-1] in ('script','image','foreignObject','audio') for node in root.iter()), 'Asset has remote/executable content')
        need(not any(k.split('}')[-1] in ('href','src') or k.startswith('on') for node in root.iter() for k in node.attrib), 'External/executable asset attribute')
    paths=[p for p in (ROOT/'site').rglob('*') if p.is_file()]
    need(all(p.suffix in ('.json','.svg') for p in paths), 'Unexpected phase-5 deployment file')
    need(not any(p.is_symlink() for p in (ROOT/'site').rglob('*')), 'Symlink in content package')
    for p in paths:
        data=p.read_text()
        need(not re.search(r'\b(?:TODO|TBD|FIXME|lorem ipsum|placeholder)\b',data,re.I), 'Unfinished content file')


def negative_checks(corpus, research, design):
    mutations=[
        lambda c: c['puzzles']['P01']['requiredEvidenceIds'].append('E17'),
        lambda c: c['puzzles']['P02'].__setitem__('essentialFactIds',['F012']),
        lambda c: c['puzzles']['P02'].__setitem__('requiredPhysicalFactIds',['F016']),
        lambda c: c['puzzles']['P04']['completionRoutes'].__setitem__('reveal',[]),
        lambda c: c['puzzles']['P06']['referenceEvidenceIds'].append('E13'),
        lambda c: c['puzzles']['P03']['workingAid'].__setitem__('initialKeyword','SHALE'),
        lambda c: c['puzzles']['P07']['workingAid']['initialMapping'].__setitem__('Quinn Arden','B2'),
        lambda c: c['puzzles']['P08']['workingAid'].__setitem__('perFieldCorrectness',True),
        lambda c: c['puzzles']['P08']['answerFields'].append(dict(name='essay',label='Defense',type='text')),
        lambda c: c['puzzles']['P04']['assistance'].__setitem__('requiresVisit',True),
        lambda c: c['puzzles']['P04']['assistance'].__setitem__('revealsAnswer',True),
        lambda c: c['puzzles']['P05']['assistance'].__setitem__('hintDelaySeconds',60),
        lambda c: c['puzzles']['P02'].__setitem__('nextPuzzleId','P04'),
        lambda c: c['puzzles']['P03']['workingAid']['inputRefs'].append('E17#ending'),
        lambda c: c['solutions']['P05']['hints'].pop(),
        lambda c: c['solutions']['P04'].__setitem__('reasoningSteps',[]),
        lambda c: c['chapters']['CH02'].__setitem__('prerequisitePuzzleIds',[]),
        lambda c: c['locations']['L05'].__setitem__('unlockAfterPuzzleId','P01'),
        lambda c: c['adventure']['travelLegs'][0].__setitem__('requiresConfirmation',False),
        lambda c: c['evidence']['E03'].__setitem__('textEquivalent','Missing full text'),
        lambda c: c['evidence']['E08'].__setitem__('assetIds',[]),
        lambda c: c['preparation'].__setitem__('introduction','Next go to North Quarry Picnic Area.'),
        lambda c: c['sources']['facts'][0].__setitem__('claim','New unsupported claim'),
        lambda c: block(c,'E16#orders')['rows'].append(dict(block(c,'E16#orders')['rows'][2],id='O99')),
        lambda c: block(c,'E03#profiles')['rows'].append(dict(block(c,'E03#profiles')['rows'][2],mechanism='another mechanism')),
        lambda c: block(c,'E08#before')['rows'].append(dict(group='B',serial='Z1',owner='Lark Workshop',kind='relief',batch='B17')),
        lambda c: block(c,'E12#log')['rows'][1].__setitem__('serviceTime','15:15'),
        lambda c: c['assets']['A02'].__setitem__('relativePath','../secret.svg'),
        lambda c: next(f for f in c['sources']['facts'] if f['id']=='F021').__setitem__('displayAfterPuzzleId',None),
        lambda c: next(s for s in c['sources']['sources'] if s['id']=='S08').__setitem__('displayAfterPuzzleId',None),
    ]
    for mutate in mutations:
        changed=deepcopy(corpus); mutate(changed)
        try:
            # Refresh equivalent text for table mutations to test the reasoning
            # model too, rather than merely detecting a stale text equivalent.
            for e in changed['evidence'].values():
                if e['id'] in ('E16','E08','E12'):
                    e['textEquivalent']=equivalent(e['bodyBlocks'])
            validate(changed,research,design)
            solve_authored_inputs(changed)
        except (ValueError,KeyError,IndexError,TypeError):
            continue
        raise ValueError('A deliberate invalid corpus mutation was accepted')
    return len(mutations)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test',action='store_true')
    args=parser.parse_args()
    try:
        c=load_corpus()
        research=read(ROOT/'docs/development-spoilers/research/facts.json')
        design=read(ROOT/'docs/development-spoilers/design/blueprint.json')
        validate(c,research,design); solve_authored_inputs(c); validate_files(c)
        paths=validate_paths(c)
        print('PASS: 5 authored chapters, 8 puzzles/solutions, 18 documents; facts, references, grants and working aids.')
        print('PASS: all eight authored input models, including unique roster and final finding.')
        print(f'PASS: {paths:,} modeled normal/reveal/reference paths retain all case evidence and finish.')
        if args.self_test:
            count=negative_checks(c,research,design)
            print(f'PASS: {count} invalid corpus mutations rejected.')
        print('PASS: original local assets and complete content inventory; sizes/hashes match.')
        print('Scope: content/answer contracts and desk models, not app, device, cache, field or measured timing tests.')
        return 0
    except (ValueError,KeyError,TypeError,IndexError,OSError,ET.ParseError) as exc:
        # Our ValueError messages contain only fixed diagnostics/neutral IDs.
        # Never echo arbitrary malformed records, JSON, answer values or OS paths.
        detail = str(exc) if type(exc) is ValueError else f'{type(exc).__name__}: malformed or missing content record'
        print(f'FAIL: {detail}',file=sys.stderr)
        return 1


if __name__=='__main__':
    sys.exit(main())
