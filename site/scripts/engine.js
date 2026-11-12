// Game rules: progression, answer checking and unlocked evidence. No DOM access.
export const STATE_VERSION = 2;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function normalizeText(value) {
  let s = String(value).normalize('NFKC').toLowerCase();
  s = s.replace(/&/g, ' and ').replace(/[’‘'`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  return s.replace(/^the /, '');
}
export const normalizeKeyword = value => String(value).normalize('NFKC').toLowerCase().replace(/[^a-z]/g, '');

export function normalizeFor(kind, value) {
  if (kind === 'keyword') return normalizeKeyword(value);
  if (['choice', 'final', 'multi', 'order', 'strips', 'classify'].includes(kind)) return String(value).trim().toLowerCase();
  return normalizeText(value);
}

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
}

export async function checkAnswer(puzzleId, puzzle, raw) {
  const normalized = normalizeFor(puzzle.input.type, raw);
  if (!normalized) return { empty: true };
  const hash = await sha256(`berea|${puzzleId}|${normalized}`);
  if (puzzle.answers.includes(hash)) return { correct: true };
  return { correct: false, near: puzzle.near?.[hash] || null };
}

export function keyedAlphabet(keyword) {
  const out = [];
  for (const ch of (String(keyword).toUpperCase() + ALPHABET)) if (ALPHABET.includes(ch) && !out.includes(ch)) out.push(ch);
  return out.join('');
}
export function decipher(cipher, keyword) {
  const key = keyedAlphabet(keyword);
  return [...cipher].map(c => { const i = key.indexOf(c); return i < 0 ? c : ALPHABET[i]; }).join('');
}

export function puzzleOrder(model) { return model.chapters.flatMap(c => c.puzzles); }
export function chapterOf(model, puzzleId) { return model.chapters.find(c => c.puzzles.includes(puzzleId)); }

export function newState() {
  return { v: STATE_VERSION, started: false, index: 0, done: {}, hints: {}, refs: {}, seen: {}, outro: {}, finished: false };
}

export function restoreState(model, raw) {
  if (!raw || raw.v !== STATE_VERSION) throw Error('INCOMPATIBLE_SAVE');
  const order = puzzleOrder(model);
  const s = { ...newState(), ...raw };
  if (!Number.isInteger(s.index) || s.index < 0 || s.index > order.length) throw Error('CORRUPT_SAVE');
  for (const key of ['done', 'hints', 'refs', 'seen', 'outro']) if (typeof s[key] !== 'object' || !s[key]) throw Error('CORRUPT_SAVE');
  return s;
}

/** Where the players are: a chapter intro, a puzzle, a chapter outro, or the ending. */
export function position(model, state) {
  const order = puzzleOrder(model);
  if (state.finished || state.index >= order.length) return { kind: 'ending' };
  const puzzleId = order[state.index];
  const chapter = chapterOf(model, puzzleId);
  if (!state.seen[chapter.id]) return { kind: 'intro', chapter };
  return { kind: 'puzzle', chapter, puzzleId, last: chapter.puzzles.at(-1) === puzzleId };
}

export function unlockedEvidence(model, state) {
  const order = puzzleOrder(model);
  const ids = [];
  const add = id => { if (model.evidence[id] && !ids.includes(id)) ids.push(id); };
  for (let i = 0; i <= Math.min(state.index, order.length - 1); i++) {
    const pid = order[i];
    const chapter = chapterOf(model, pid);
    if (!state.seen[chapter.id]) break;
    const p = model.puzzles[pid];
    p.evidence.forEach(add);
    if (state.refs[pid] || state.done[pid]) (p.fallback || []).forEach(add);
    if (state.done[pid]) p.grants.forEach(add);
  }
  return ids;
}

export function visitedLocations(model, state) {
  return model.chapters.filter(c => c.location && state.seen[c.id]).map(c => c.location);
}

// Pure transitions. Each returns a new state.
export const actions = {
  start: s => ({ ...s, started: true }),
  openChapter: (s, chapterId) => ({ ...s, seen: { ...s.seen, [chapterId]: true } }),
  hint: (s, pid, total) => ({ ...s, hints: { ...s.hints, [pid]: Math.min(total, (s.hints[pid] || 0) + 1) } }),
  reference: (s, pid) => ({ ...s, refs: { ...s.refs, [pid]: true } }),
  solve: (s, pid, how) => s.done[pid] ? s : ({ ...s, done: { ...s.done, [pid]: how } }),
  advance(model, s) {
    const order = puzzleOrder(model);
    const pid = order[s.index];
    if (!s.done[pid]) return s;
    const chapter = chapterOf(model, pid);
    const next = { ...s, index: s.index + 1, outro: chapter.puzzles.at(-1) === pid ? { ...s.outro, [chapter.id]: true } : s.outro };
    if (next.index >= order.length) next.finished = true;
    return next;
  },
};
