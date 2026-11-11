// Consequential runtime regressions. Output uses neutral objective IDs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createState, transition, restoreState, currentPuzzle, pendingTravel, citationAllowed } from '../site/scripts/engine.js';
import { checkAnswer, parseTime } from '../site/scripts/answers.js';
import { initialValues } from '../site/scripts/aids.js';
import { Persistence, SAVE_KEY } from '../site/scripts/persistence.js';
const read = p => JSON.parse(fs.readFileSync(new URL(`../site/content/${p}`, import.meta.url)));
const adventure = read('adventure.json');
const puzzlesByRef = Object.fromEntries(adventure.puzzleRefs.map(ref => [ref, read(ref)]));
const puzzles = Object.fromEntries(Object.values(puzzlesByRef).map(p => [p.id, p]));
const solutions = Object.fromEntries(Object.values(puzzles).map(p => [p.id, read(p.solutionRef)]));
const model = { adventure, puzzles, puzzlesByRef };
const begin = () => transition(model, createState(model), { type: 'begin' });
const step = (s, e) => transition(model, s, e, solutions[currentPuzzle(model, s)?.id]);
function advance(s, reference = false) {
  s = step(s, { type: 'continue' });
  if (pendingTravel(model, s)) {
    if (reference) return step(s, { type: 'referenceTravel', safelyStopped: true });
    s = step(s, { type: 'confirmDestination' });
    s = step(s, { type: 'arrive', safelyStopped: true });
  }
  return s;
}
const memory = () => {
  const data = new Map();
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};
function cases(pid, yes, no) {
  yes.forEach((v, i) => assert.equal(checkAnswer(solutions[pid], v), true, `${pid} accepted variant ${i}`));
  no.forEach((v, i) => assert.equal(checkAnswer(solutions[pid], v), false, `${pid} rejected variant ${i}`));
}
test('runtime typed answer contracts match authored variants without fuzzy acceptance', () => {
  cases('P01', ['R1', 'r-1', ' R 1 ', 'reference 1', 'REFERENCE-1', 'Ｒ１'], ['K8', 'R9', 'not R1', 'R1 R9', 'R11', 'R1 / R9', '1', null, false, []]);
  const answer = solutions.P02.canonical;
  cases('P02', ['support withdrawal', 'Support-withdrawal!', 'support removal', 'cradle removal', 'removed support'].map(mechanism => ({ sequence: answer.sequence, mechanism })), [
    { sequence: [...answer.sequence].reverse(), mechanism: answer.mechanism }, { ...answer, mechanism: 'impact' }, { ...answer, mechanism: 'not support withdrawal' }, { ...answer, sequence: answer.sequence.slice(0, 2) }, { ...answer, extra: 'yes' }, answer.mechanism, null]);
  cases('P03', ['SHALLOW', ' shallow! ', 'ＳＨＡＬＬＯＷ'], ['not shallow', 'shallower', 'shallow water', 's.h.a.l.l.o.w', 'REF-B', '', null]);
  cases('P04', [['K4', 'M7'], ['m-7', 'k 4'], ['Ｍ７', 'Ｋ４']], [['K4'], ['K4', 'K4'], ['K4', 'M7', 'T9'], ['K4', 'T9'], ['M7', 'R2'], ['K4', 'not M7'], 'K4 M7', null]);
  cases('P05', ['modern commission', ' Modern-commission! ', 'new commission', 'contemporary commission', 'newly commissioned panels'], ['not modern commission', 'historic civic salvage', 'unknown', 'old modern commission', 'modern', null]);
  cases('P06', [['15:02', '15:10'], '15:02–15:10', '3:02–3:10 PM', '3:02 pm to 3:10 pm', { lower: '3:02', upper: '3:10 p.m.' }, { lower: '15:02', upper: '15:10' }], ['15:06–15:14', '15:10–15:02', '3:02–3:10', '15:02–15:11', '3:02 AM–3:10 PM', '15:62–15:10', '25:02–15:10', '15:02 PM–15:10 PM', '15:02–15:10 or 15:11', ['15:02'], ['15:02', '15:10', '15:12'], null, { lower: '15:02', upper: '15:10', inclusive: true }]);
  for (const invalid of ['0:10 AM', '13:02 PM', '12:60', '24:00', '15.02', '15:02 nonsense', '15:2']) assert.throws(() => parseTime(invalid));
  const c = solutions.P07.canonical, keys = Object.keys(c);
  cases('P07', [c, Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.toLowerCase()]))], [{ ...c, [keys[0]]: c[keys[1]], [keys[1]]: c[keys[0]] }, Object.fromEntries(Object.entries(c).slice(1)), { ...c, [keys[0]]: c[keys[1]] }, { ...c, extra: 'A7' }, null]);
  cases('P08', [{ actor: 'Quinn Arden', order: 'O43' }, { actor: 'quinn', order: 'O-43' }, { actor: ' QUINN ARDEN! ', order: 'order 43' }, { actor: 'Ｑｕｉｎｎ', order: '43' }], [{ actor: 'Quinn', order: 'O26' }, { actor: 'Samir Cole', order: 'O43' }, { actor: 'not Quinn', order: 'O43' }, { actor: 'Quinn', order: '043' }, { actor: 'Quinn', order: 'stop O43' }, { actor: 'Quinn', order: 'O43 and O26' }, { actor: 'Quinn', order: 'O43', reason: 'extra' }, { actor: 'Quinn' }, null]);
});
test('all 256 normal/reveal progressions grant the same complete case and restore every stage', () => {
  for (let route = 0; route < 256; route++) {
    let s = begin();
    for (let i = 0; i < 8; i++) {
      assert.equal(s.evidenceIds.includes('E17'), false);
      const p = currentPuzzle(model, s), solution = solutions[p.id];
      const before = structuredClone(s);
      s = step(s, { type: 'reference' });
      assert.deepEqual(s.evidenceIds, before.evidenceIds);
      assert.deepEqual(s.completedPuzzleIds, before.completedPuzzleIds);
      for (let h = 0; h < 4; h++) s = step(s, { type: 'hint' });
      assert.equal(s.hintLevelByPuzzle[p.id], 3);
      const wrong = step(s, { type: 'submit', payload: 'incorrect' }); assert.equal(wrong, s);
      s = route & (1 << i) ? step(s, { type: 'reveal', confirmed: true }) : step(s, { type: 'submit', payload: solution.canonical });
      assert.equal(s.completedPuzzleIds.length, i + 1);
      s = restoreState(model, JSON.parse(JSON.stringify(s)));
      if (i < 7) s = advance(s, route % 2 === 0);
      s = restoreState(model, JSON.parse(JSON.stringify(s)));
    }
    assert.equal(s.mode, 'ending'); assert.equal(s.evidenceIds.length, 18);
    assert.equal(new Set(s.evidenceIds).size, 18);
    assert.equal(s.endingViewed, true);
    s = step(s, { type: 'fullExplanation' }); assert.equal(s.fullExplanationViewed, true);
  }
});
test('travel and deliberate reveal gates cannot be bypassed by ordinary events', () => {
  let s = begin();
  assert.throws(() => step(s, { type: 'reveal' }));
  assert.throws(() => step(s, { type: 'arrive', safelyStopped: true }));
  s = step(s, { type: 'submit', payload: solutions.P01.canonical });
  assert.throws(() => step(s, { type: 'submit', payload: solutions.P01.canonical }));
  s = step(s, { type: 'continue' });
  assert.equal(s.evidenceIds.includes('E03'), false);
  assert.throws(() => step(s, { type: 'arrive', safelyStopped: true }));
  assert.throws(() => step(s, { type: 'referenceTravel' }));
  s = step(s, { type: 'confirmDestination' });
  assert.equal(s.mode, 'travel');
  assert.throws(() => step(s, { type: 'arrive' }));
  s = step(s, { type: 'arrive', safelyStopped: true }); assert.equal(s.evidenceIds.includes('E03'), true);
});
test('restore rejects corrupted, incompatible and arbitrary unlock saves without changing their input', () => {
  const s = begin(), mutations = [
    v => v.completedPuzzleIds.push('P08'), v => v.completedPuzzleIds.push('P01', 'P03'),
    v => v.evidenceIds.push('E17'), v => v.currentChapterId = 'CH04', v => v.currentPuzzleId = 'P08',
    v => v.schemaVersion = 9, v => v.stateCompatibility = 3, v => v.adventureId = 'other',
    v => v.hintLevelByPuzzle.P08 = 3, v => v.hintLevelByPuzzle.P01 = 8,
    v => v.referenceUsedPuzzleIds.push('P08'), v => v.revealedPuzzleIds.push('P01'),
    v => v.confirmedTravelLegIds.push('TR02'), v => v.arrivedTravelLegIds.push('TR01'),
    v => v.mode = 'ending', v => v.endingViewed = true, v => v.fullExplanationViewed = true,
    v => v.revision = -1, v => v.workingAidDraftByPuzzle.P01 = { values: {}, history: [] },
  ];
  for (const mutate of mutations) { const changed = structuredClone(s); mutate(changed); const snapshot = JSON.stringify(changed); assert.throws(() => restoreState(model, changed)); assert.equal(JSON.stringify(changed), snapshot); }
  let later = s;
  for (let i = 0; i < 4; i++) { later = step(later, { type: 'reveal', confirmed: true }); later = advance(later); }
  later.arrivedTravelLegIds = []; assert.throws(() => restoreState(model, later));
});
test('drafts are immutable and survive every working aid with compatible content updates', () => {
  let s = begin();
  for (let i = 0; i < 8; i++) {
    const p = currentPuzzle(model, s), draft = { values: initialValues(p), history: [] }, old = JSON.stringify(s);
    s = step(s, { type: 'draft', draft }); assert.notEqual(JSON.stringify(s), old);
    const restored = restoreState({ ...model, adventure: { ...adventure, contentVersion: '1.0.1' } }, s);
    assert.equal(restored.contentVersion, '1.0.1'); assert.deepEqual(restored.workingAidDraftByPuzzle[p.id], draft);
    s = step(s, { type: 'reveal', confirmed: true }); if (i < 7) s = advance(s, true);
  }
});
test('persistence retains corrupt bytes, reports quota/unavailable storage, and resets only its key', () => {
  const storage = memory(), s = begin(); storage.setItem('unrelated', 'preserve');
  const p = new Persistence(storage); assert.equal(p.read(v => restoreState(model, v)), null);
  assert.equal(p.save(s), true); assert.equal(p.status, 'saved');
  const reopened = new Persistence(storage); assert.deepEqual(reopened.read(v => restoreState(model, v)), s);
  storage.setItem(SAVE_KEY, '{broken');
  const corrupt = new Persistence(storage); assert.equal(corrupt.read(v => restoreState(model, v)), null);
  assert.equal(corrupt.status, 'corrupt'); assert.equal(corrupt.save(s), false); assert.equal(storage.getItem(SAVE_KEY), '{broken');
  assert.equal(corrupt.restart(createState(model)), true); assert.equal(storage.getItem('unrelated'), 'preserve');
  const bad = new Persistence({ getItem() { throw Error(); }, setItem() { throw Error(); } });
  assert.equal(bad.read(v => v), null); assert.equal(bad.status, 'unavailable'); assert.equal(bad.save(s), false); assert.equal(bad.status, 'writeFailed');
  const quota = new Persistence({ getItem: () => null, setItem() { throw Error(); } }); quota.read(v => v); assert.equal(quota.save(s), false);
});
test('concurrent windows do not overwrite newer progress and incompatible saves remain untouched', () => {
  const storage = memory(), s = begin(), first = new Persistence(storage), second = new Persistence(storage);
  first.read(v => v); second.read(v => v); first.save(s);
  assert.equal(second.save(createState(model)), false); assert.equal(second.status, 'conflict');
  const incompatible = { ...s, stateCompatibility: 8 }; storage.setItem(SAVE_KEY, JSON.stringify(incompatible));
  const reopened = new Persistence(storage); assert.equal(reopened.read(v => restoreState(model, v)), null);
  assert.equal(reopened.status, 'incompatible'); assert.equal(reopened.save(s), false);
  assert.equal(storage.getItem(SAVE_KEY), JSON.stringify(incompatible));
});
test('citation naming gates are independent of document visibility', () => {
  const source = read('sources.json').facts.find(f => f.displayAfterPuzzleId);
  let s = begin(); assert.equal(citationAllowed(source, s), false);
  for (let i = 0; i < 3; i++) { s = step(s, { type: 'reveal', confirmed: true }); if (i < 2) s = advance(s, true); }
  assert.equal(citationAllowed(source, s), true);
});
