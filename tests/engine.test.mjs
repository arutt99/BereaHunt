// DEVELOPMENT SPOILERS: checks every authored answer against the built content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkAnswer, decipher, newState, actions, position, unlockedEvidence, puzzleOrder, normalizeText, restoreState } from '../site/scripts/engine.js';

const source = JSON.parse(readFileSync(new URL('../docs/development-spoilers/v2/case-source.json', import.meta.url)));
const model = JSON.parse(readFileSync(new URL('../site/content/adventure.json', import.meta.url)));

test('every authored answer is accepted', async () => {
  for (const [pid, p] of Object.entries(source.puzzles)) {
    for (const a of p.answers) assert.equal((await checkAnswer(pid, model.puzzles[pid], a)).correct, true, `${pid}: ${a}`);
  }
});

test('near-miss feedback fires and is never accepted', async () => {
  for (const [pid, p] of Object.entries(source.puzzles)) {
    for (const n of p.near || []) {
      const r = await checkAnswer(pid, model.puzzles[pid], n.a);
      assert.equal(r.correct, false, `${pid} near ${n.a}`);
      assert.equal(r.near, n.m);
    }
  }
});

test('text answers tolerate case, spacing and punctuation', async () => {
  assert.equal((await checkAnswer('P5', model.puzzles.P5, ' 1895. ')).correct, true);
  assert.equal((await checkAnswer('P1', model.puzzles.P1, 'T-a-b-o-r')).correct, true);
  assert.equal((await checkAnswer('P1', model.puzzles.P1, 'Berea')).correct, false);
  assert.equal(normalizeText('The  Quiet, Blue!'), 'quiet blue');
});

test('keyword cipher decodes only with the right key', () => {
  const cipher = model.puzzles.P1.input.cipher;
  assert.match(decipher(cipher, 'TABOR'), /^THE LETTER IS A LIE/);
  assert.doesNotMatch(decipher(cipher, 'MOUNTTABOR'), /LETTER/);
});

test('progression, evidence gating and ending', () => {
  let s = actions.start(newState());
  const order = puzzleOrder(model);
  assert.equal(position(model, s).kind, 'intro');
  assert.deepEqual(unlockedEvidence(model, s), []);
  for (const pid of order) {
    const pos = position(model, s);
    if (pos.kind === 'intro') s = actions.openChapter(s, pos.chapter.id);
    assert.equal(position(model, s).puzzleId, pid);
    const ev = unlockedEvidence(model, s);
    // nothing granted by a later puzzle is visible yet
    for (const later of order.slice(order.indexOf(pid))) for (const g of model.puzzles[later].grants) assert(!ev.includes(g), `${pid} leaks ${g}`);
    // fallbacks hidden until requested
    for (const f of model.puzzles[pid].fallback || []) if (!model.puzzles[pid].evidence.includes(f) && !order.slice(0, order.indexOf(pid)).some(q => (model.puzzles[q].fallback || []).includes(f) || model.puzzles[q].evidence.includes(f))) assert(!ev.includes(f), `${pid} shows fallback ${f}`);
    assert.equal(actions.advance(model, s), s, 'cannot skip unsolved');
    s = actions.solve(s, pid, pid === 'P4' ? 'revealed' : 'solved');
    s = actions.advance(model, s);
  }
  assert.equal(position(model, s).kind, 'ending');
  assert.equal(restoreState(model, JSON.parse(JSON.stringify(s))).finished, true);
});

test('every referenced evidence id exists, and each puzzle has three hints and a reveal', () => {
  for (const [pid, p] of Object.entries(model.puzzles)) {
    for (const id of [...p.evidence, ...(p.fallback || []), ...p.grants]) assert(model.evidence[id], `${pid} -> ${id}`);
    assert.equal(p.hints.length, 3, pid);
    assert(p.reveal.answer && p.reveal.why, pid);
  }
  for (const c of model.chapters) if (c.location) assert(model.locations[c.location], c.id);
  assert.throws(() => restoreState(model, { v: 1 }), /INCOMPATIBLE_SAVE/);
});
