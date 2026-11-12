import { actions, checkAnswer, decipher, keyedAlphabet, newState, position, puzzleOrder, restoreState, unlockedEvidence, visitedLocations, chapterOf } from './engine.js';
import { connectOffline, workerRequest } from './offline.js';
import { Persistence } from './persistence.js';

// ---------- tiny DOM helper ----------
function h(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid !== null && kid !== undefined && kid !== false) node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return node;
}
const btn = (label, onclick, cls = 'btn', attrs = {}) => h('button', { type: 'button', class: cls, onclick, ...attrs }, label);
const svg = markup => { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstChild; };

// ---------- app state ----------
const main = document.querySelector('#main');
const tabs = document.querySelector('#tabs');
const dialog = document.querySelector('#dialog');
const saveStatus = document.querySelector('#save-status');
let prep, model, state, store;
let view = 'prep', fileTab = 'evidence';
let offline = { supported: false, ready: false, busy: false, message: 'Checking…' };
const drafts = {}; // per-puzzle unsent input
const feedback = {};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function save() {
  store.save(state);
  saveStatus.textContent = store.status === 'saved' ? 'Saved' : store.status === 'unavailable' || store.status === 'writeFailed' ? 'Not saving!' : '';
  saveStatus.classList.toggle('warn', store.status !== 'saved');
}
function commit(next) { if (next === state) return; state = next; save(); }

function showDialog(title, body, buttons) {
  const box = document.querySelector('#dialog-body');
  box.replaceChildren(h('h2', { id: 'dialog-title' }, title), ...[].concat(body), h('div', { class: 'dialog-actions' }, ...buttons.map(([label, fn, cls]) => btn(label, () => { dialog.close(); fn?.(); }, cls || 'btn'))));
  dialog.showModal();
}

function go(next, opts = {}) {
  view = next;
  render();
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  if (!opts.noFocus) main.focus({ preventScroll: true });
}

// ---------- evidence rendering ----------
function sourceLine(src) {
  if (!src) return null;
  return h('p', { class: 'source' }, 'Source: ', h('a', { href: src.url, target: '_blank', rel: 'noopener' }, src.label));
}
function fictionTag(ev) { return h('span', { class: `tag ${ev.fictional ? 'tag-fiction' : 'tag-real'}` }, ev.fictional ? 'Case document' : 'Real history'); }

function renderBlock(b) {
  switch (b.t) {
    case 'p': return h('p', {}, b.x);
    case 'sig': return h('p', { class: 'sig' }, b.x);
    case 'head': return h('h4', {}, b.x);
    case 'sub': return h('h5', {}, b.x);
    case 'quote': return h('blockquote', {}, b.x);
    case 'hand': return h('p', { class: 'hand' }, b.x);
    case 'cipher': return h('p', { class: 'cipher', 'aria-label': 'Coded line' }, b.x);
    case 'date': return h('p', { class: 'l-date' }, b.x);
    case 'salute': return h('p', { class: 'l-salute' }, b.x);
    case 'line': return h('span', { class: 'l-line' }, b.x + ' ');
    case 'close': return h('p', { class: 'l-close' }, b.x);
    case 'sign': return h('p', { class: 'l-sign' }, b.x);
    case 'form': return h('div', { class: 'form' }, h('div', { class: 'form-head' }, b.head), h('dl', {}, ...b.rows.map(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])));
    case 'pin': return h('div', { class: 'pin' }, h('div', { class: 'pin-head' }, svg('<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>'), b.head), h('p', {}, b.x), h('p', { class: 'pin-src' }, b.source));
    case 'sketch': return fallsSketch();
    default: return h('p', {}, b.x || '');
  }
}
function fallsSketch() {
  return h('figure', { class: 'sketch' }, svg(`<svg viewBox="0 0 320 170" role="img" aria-label="Helen's sketch: a hard layer of sandstone on top, a softer layer of shale beneath it, water pouring over the edge, and broken blocks below.">
    <defs><pattern id="sh" width="8" height="5" patternUnits="userSpaceOnUse"><path d="M0 4.5h8" stroke="currentColor" stroke-width=".7" opacity=".55"/></pattern>
    <pattern id="ss" width="14" height="10" patternUnits="userSpaceOnUse"><path d="M0 9.5h14M7 0v10" stroke="currentColor" stroke-width=".8" opacity=".5"/></pattern></defs>
    <path d="M8 40 H196 V72 H8Z" fill="url(#ss)" stroke="currentColor" stroke-width="1.6"/>
    <path d="M8 72 H170 Q160 98 172 128 H8Z" fill="url(#sh)" stroke="currentColor" stroke-width="1.6"/>
    <path d="M196 44 C214 60 214 110 220 150" fill="none" stroke="#3d78a8" stroke-width="5" stroke-linecap="round" opacity=".75"/>
    <path d="M8 34 H196" stroke="#3d78a8" stroke-width="5" stroke-linecap="round" opacity=".75"/>
    <path d="M226 150 l14 -10 l12 8 l-8 10z M250 156 l12 -8 l10 6 l-10 7z" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <text x="16" y="62" class="sk">A — hard</text><text x="16" y="104" class="sk">B — soft</text>
    <text x="228" y="40" class="sk">river</text><text x="236" y="136" class="sk">fallen</text>
    <path d="M178 86 l-14 0" stroke="currentColor" stroke-width="1.2" marker-end=""/><text x="182" y="90" class="sk sm">hollow?</text>
  </svg>`), h('figcaption', {}, 'Helen’s sketch (not to scale)'));
}

function noteSheet(ev) { return h('div', { class: 'letter-sheet note' }, ...(ev.blocks || []).map(renderBlock)); }
function storyParas(text) { return String(text).split(/\n\n+/).map(t => h('p', {}, t)); }

function renderEvidence(id, { open = false, fresh = false } = {}) {
  const ev = model.evidence[id];
  if (!ev) return null;
  const body = h('div', { class: 'doc-body' });
  if (ev.caption) body.append(h('p', { class: 'caption' }, ev.caption));
  if (ev.kind === 'note') {
    body.append(noteSheet(ev));
  } else if (ev.kind === 'letter') {
    const lines = ev.blocks.filter(b => b.t === 'line');
    body.append(h('div', { class: 'letter-sheet' }, ...ev.blocks.filter(b => ['date', 'salute'].includes(b.t)).map(renderBlock), h('p', { class: 'l-body' }, lines.map(renderBlock)), ...ev.blocks.filter(b => ['close', 'sign'].includes(b.t)).map(renderBlock)));
  } else if (ev.kind === 'strips') {
    body.append(h('p', { class: 'muted' }, 'Use the puzzle board below to arrange the scraps.'));
  } else {
    (ev.blocks || []).forEach(b => body.append(renderBlock(b)));
  }
  if (ev.source) body.append(sourceLine(ev.source));
  return h('details', { class: `doc doc-${ev.kind}${fresh ? ' fresh' : ''}`, open: open || null, id: `ev-${id}` },
    h('summary', {}, h('span', { class: 'doc-title' }, ev.title), fictionTag(ev)),
    body);
}

// ---------- puzzle inputs ----------
function draft(pid, init) { if (!(pid in drafts)) drafts[pid] = init; return drafts[pid]; }

function keywordInput(pid, p) {
  const d = draft(pid, { key: '' });
  const out = h('p', { class: 'decoded', 'aria-live': 'polite' });
  const strip = h('div', { class: 'alpha', 'aria-hidden': 'true' });
  const update = () => {
    const key = d.key.toUpperCase().replace(/[^A-Z]/g, '');
    const alpha = keyedAlphabet(key);
    strip.replaceChildren(h('div', { class: 'alpha-row' }, ...[...alpha].map((c, i) => h('span', { class: i < new Set(key).size ? 'k' : '' }, c))),
      h('div', { class: 'alpha-row' }, ...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(c => h('span', {}, c))),
      h('p', { class: 'alpha-cap' }, 'Top row: Helen’s alphabet. Bottom row: what each letter means.'));
    out.textContent = key.length >= 2 ? decipher(p.input.cipher, key) : 'Type a key word to decode the line.';
  };
  const input = h('input', { id: `in-${pid}`, class: 'field mono', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', value: d.key, oninput: e => { d.key = e.target.value; update(); } });
  update();
  return {
    node: h('div', { class: 'tool tool-keyword' }, h('p', { class: 'cipher big' }, p.input.cipher), h('label', { for: `in-${pid}`, class: 'label' }, p.input.label), input, h('p', { class: 'help' }, p.input.help), strip, h('div', { class: 'decoded-wrap' }, h('span', { class: 'label' }, 'Decoded'), out)),
    value: () => d.key,
  };
}

function textInput(pid, p) {
  const d = draft(pid, { v: '' });
  const input = h('input', { id: `in-${pid}`, class: 'field', autocomplete: 'off', inputmode: p.input.inputmode || 'text', placeholder: p.input.placeholder || '', value: d.v, oninput: e => { d.v = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') submit(pid); } });
  return { node: h('div', { class: 'tool' }, h('label', { for: `in-${pid}`, class: 'label' }, p.input.label || 'Answer'), input), value: () => d.v };
}

function choiceInput(pid, p, multi = false) {
  const d = draft(pid, { sel: [] });
  const wrap = h('div', { class: 'choices', role: multi ? 'group' : 'radiogroup', 'aria-label': p.objective });
  const paint = () => wrap.querySelectorAll('button').forEach(b => { const on = d.sel.includes(b.dataset.id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  for (const o of p.input.options) {
    wrap.append(h('button', { type: 'button', class: 'choice', 'data-id': o.id, onclick: () => {
      if (multi) d.sel = d.sel.includes(o.id) ? d.sel.filter(x => x !== o.id) : [...d.sel, o.id];
      else d.sel = [o.id];
      paint();
    } }, h('span', { class: 'tick', 'aria-hidden': 'true' }), o.label));
  }
  paint();
  return { node: h('div', { class: 'tool' }, multi ? h('p', { class: 'help' }, 'Select all that apply.') : null, wrap), value: () => [...d.sel].sort().join(',') };
}

function sequenceInput(pid, p, strips = false) {
  const items = p.input.items;
  const need = p.input.use || items.length;
  const d = draft(pid, { seq: [] });
  const wrap = h('div', { class: `tool tool-seq${strips ? ' strips' : ''}` });
  const render = () => {
    const placed = h('ol', { class: 'slots', 'aria-label': 'Your order' });
    for (let i = 0; i < need; i++) {
      const id = d.seq[i];
      const it = items.find(x => x.id === id);
      placed.append(h('li', { class: `slot${it ? ' filled' : ''}` }, it ? (strips ? stripNode(it, () => { d.seq.splice(i, 1); render(); }) : btn([h('span', { class: 'n' }, i + 1), it.x], () => { d.seq.splice(i, 1); render(); }, 'card-btn placed', { 'aria-label': `Remove step ${i + 1}: ${it.x}` })) : h('span', { class: 'empty' }, `${strips ? 'Scrap' : 'Step'} ${i + 1}`)));
    }
    const pool = h('div', { class: 'pool', 'aria-label': 'Unplaced' });
    for (const it of items) if (!d.seq.includes(it.id)) pool.append(strips ? stripNode(it, () => { if (d.seq.length < need) { d.seq.push(it.id); render(); } }) : btn(it.x, () => { if (d.seq.length < need) { d.seq.push(it.id); render(); } }, 'card-btn'));
    wrap.replaceChildren(...[
      h('p', { class: 'help' }, strips ? `Tap scraps to lay them down from top to bottom (${need} of ${items.length}). Tap a placed scrap to take it back.` : 'Tap the cards in order. Tap a placed card to take it back.'),
      placed,
      pool.childNodes.length ? h('div', {}, h('p', { class: 'label' }, strips ? 'Loose scraps' : 'Cards'), pool) : null,
      d.seq.length ? btn('Clear', () => { d.seq = []; render(); }, 'btn ghost small') : null,
    ].filter(Boolean));
  };
  render();
  return { node: wrap, value: () => d.seq.join(',') };
}
function edge(profile, side) {
  if (!profile) return side === 'top' ? '0% 0px, 100% 0px' : '100% 100%, 0% 100%';
  const pts = [];
  let seed = profile * 9301 + 49297;
  for (let x = 0; x <= 100; x += 5) { seed = (seed * 9301 + 49297) % 233280; pts.push([x, 2 + Math.round((seed / 233280) * 14)]); }
  if (side === 'top') return pts.map(([x, y]) => `${x}% ${y}px`).join(', ');
  return pts.reverse().map(([x, y]) => `${x}% calc(100% - ${16 - y}px)`).join(', ');
}
function stripNode(it, onclick) {
  return h('span', { class: 'strip-wrap' }, h('button', { type: 'button', class: `strip paper-${it.paper}`, onclick, style: `clip-path: polygon(${edge(it.top, 'top')}, ${edge(it.bottom, 'bottom')})`, 'aria-label': `Scrap: ${it.x}${it.paper === 'b' ? ' (yellow paper)' : ''}` }, h('span', {}, it.x)));
}

function classifyInput(pid, p) {
  const d = draft(pid, { pick: {} });
  const wrap = h('div', { class: 'tool classify' });
  const render = () => {
    wrap.replaceChildren(...p.input.items.map(it => h('div', { class: 'cl-row' },
      h('p', { class: 'cl-text' }, h('span', { class: 'cl-id' }, it.id.toUpperCase()), it.x),
      h('div', { class: 'seg', role: 'radiogroup', 'aria-label': `Line ${it.id.toUpperCase()}` }, ...p.input.options.map(o => h('button', { type: 'button', role: 'radio', 'aria-checked': String(d.pick[it.id] === o.id), class: `seg-btn${d.pick[it.id] === o.id ? ' on' : ''} seg-${o.id}`, onclick: () => { d.pick[it.id] = o.id; render(); } }, o.label))))));
  };
  render();
  return { node: wrap, value: () => p.input.items.every(it => d.pick[it.id]) ? p.input.items.map(it => `${it.id}:${d.pick[it.id]}`).sort().join(',') : '' };
}

function makeInput(pid, p) {
  switch (p.input.type) {
    case 'keyword': return keywordInput(pid, p);
    case 'choice': case 'final': return choiceInput(pid, p);
    case 'multi': return choiceInput(pid, p, true);
    case 'order': return sequenceInput(pid, p);
    case 'strips': return sequenceInput(pid, p, true);
    case 'classify': return classifyInput(pid, p);
    default: return textInput(pid, p);
  }
}

let currentInput = null;
async function submit(pid) {
  const p = model.puzzles[pid];
  const value = currentInput?.value() ?? '';
  const run = async () => {
    const result = await checkAnswer(pid, p, value);
    if (result.empty) feedback[pid] = { kind: 'info', text: p.input.type === 'classify' ? 'Choose an answer for every line first.' : p.input.type === 'strips' || p.input.type === 'order' ? 'Place every piece first.' : 'Enter an answer first.' };
    else if (result.correct) { feedback[pid] = null; commit(actions.solve(state, pid, 'solved')); celebrate(); }
    else feedback[pid] = { kind: 'miss', text: result.near || 'Not quite. Nothing is lost, so try again or take a hint.' };
    render({ keepFocus: true });
    if (!result.correct) document.querySelector('.feedback')?.focus();
  };
  if (p.input.type === 'final' && value) {
    const name = p.input.options.find(o => o.id === value)?.label;
    showDialog('Submit your finding?', [h('p', {}, `You are naming ${name}. You can’t change it after this.`)], [['Not yet', null, 'btn ghost'], ['Submit finding', run, 'btn primary']]);
  } else await run();
}

function celebrate() {
  if (reduceMotion) return;
  document.body.classList.remove('flash'); void document.body.offsetWidth; document.body.classList.add('flash');
}

// ---------- views ----------
function locationCard(loc, mode) {
  const L = model.locations[loc];
  return h('section', { class: 'place' },
    h('div', { class: 'place-head' }, h('span', { class: 'eyebrow' }, mode), h('h3', {}, L.name), h('p', { class: 'addr' }, L.address)),
    h('p', {}, L.arrival),
    h('p', {}, h('strong', {}, 'Walking: '), L.walk),
    L.notes?.length ? h('ul', { class: 'notes' }, L.notes.map(n => h('li', {}, n))) : null,
    h('a', { class: 'btn ghost map', href: L.mapUrl, target: '_blank', rel: 'noopener' }, 'Open in Maps ↗'));
}

function renderIntro(chapter) {
  const first = chapter.number === 1;
  return h('div', { class: 'intro' },
    h('div', { class: 'chapter-stamp', 'aria-hidden': 'true' }, h('span', {}, 'Chapter'), h('b', {}, chapter.number)),
    h('p', { class: 'eyebrow' }, `Chapter ${chapter.number} of ${model.chapters.length}`),
    h('h1', { class: 'chapter-title' }, chapter.title),
    chapter.intro ? h('div', { class: 'scene' }, storyParas(chapter.intro)) : null,
    chapter.letter && model.evidence[chapter.letter] ? noteSheet(model.evidence[chapter.letter]) : null,
    chapter.aside ? h('p', { class: 'muted aside' }, chapter.aside) : null,
    chapter.location ? locationCard(chapter.location, first ? 'You are at' : 'Go to') : h('section', { class: 'place' }, h('p', {}, 'No travel needed. Anywhere comfortable and safely stopped will do: a bench, a café, home. If you’re in the city lot, drive off first.')),
    !first && chapter.location ? h('p', { class: 'safety' }, 'Read the directions now, before you drive. Don’t use the game while moving.') : null,
    h('div', { class: 'actions' },
      btn(first ? 'Open the envelope' : chapter.location ? 'We’re here — open the chapter' : 'Open the last folder', () => { commit(actions.openChapter(state, chapter.id)); go('play'); }, 'btn primary big')),
    !first && chapter.location ? h('p', { class: 'muted center' }, 'Can’t get there, or it’s closed? Open the chapter anyway. Every clue here has a backup.') : null);
}

function renderPuzzle(pos) {
  const { chapter, puzzleId: pid, last } = pos;
  const p = model.puzzles[pid];
  const order = puzzleOrder(model);
  const n = order.indexOf(pid) + 1;
  const done = state.done[pid];
  const hintsShown = state.hints[pid] || 0;
  const evidence = unlockedEvidence(model, state);
  const relevant = [...new Set([...p.evidence, ...(state.refs[pid] || done ? (p.fallback || []) : [])])].filter(id => evidence.includes(id));
  const wrap = h('div', { class: 'puzzle' });

  wrap.append(
    h('div', { class: 'progress', 'aria-label': `Puzzle ${n} of ${order.length}` }, order.map((id, i) => h('span', { class: `dot${state.done[id] ? ' done' : ''}${i === n - 1 ? ' now' : ''}` }))),
    h('p', { class: 'eyebrow' }, `Chapter ${chapter.number} · ${chapter.title}`),
    h('h1', {}, p.title),
    h('div', { class: 'objective', role: 'note' }, h('span', { class: 'obj-label' }, 'Objective'), h('p', {}, p.objective)));
  if (p.onSite && !done) wrap.append(h('div', { class: 'onsite' }, h('span', { class: 'obj-label' }, 'On site'), h('p', {}, p.onSite)));

  wrap.append(h('section', { class: 'evidence', 'aria-label': 'Relevant evidence' }, h('h2', { class: 'sect' }, 'Evidence on the table'),
    relevant.map((id, i) => renderEvidence(id, { open: i === 0 || (p.fallback || []).includes(id) && state.refs[pid] && !done }))));

  if (!done) {
    currentInput = makeInput(pid, p);
    const fb = feedback[pid];
    wrap.append(h('section', { class: 'work', 'aria-label': 'Your answer' }, h('h2', { class: 'sect' }, p.input.type === 'final' ? 'Your finding' : 'Work it out'), currentInput.node,
      fb ? h('p', { class: `feedback ${fb.kind}`, tabindex: '-1', role: 'status' }, fb.text) : h('p', { class: 'feedback', role: 'status' }),
      btn(p.input.type === 'final' ? 'Submit finding…' : 'Check answer', () => submit(pid), 'btn primary big')));

    const help = h('section', { class: 'help-box', 'aria-label': 'Help' }, h('h2', { class: 'sect' }, 'Help'),
      h('p', { class: 'muted' }, 'Help is free and never timed.'));
    p.hints.slice(0, hintsShown).forEach((t, i) => help.append(h('div', { class: 'hint' }, h('span', { class: 'hint-n' }, `Hint ${i + 1}`), h('p', {}, t))));
    const row = h('div', { class: 'help-row' });
    if (hintsShown < p.hints.length) row.append(btn(`Show hint ${hintsShown + 1} of ${p.hints.length}`, () => { commit(actions.hint(state, pid, p.hints.length)); render({ keepScroll: true }); }, 'btn ghost'));
    if (p.fallback && !state.refs[pid]) row.append(btn('Can’t access this clue', () => { commit(actions.reference(state, pid)); render({ keepScroll: true }); document.querySelector(`#ev-${p.fallback[0]}`)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }, 'btn ghost'));
    row.append(btn('Reveal answer…', () => showDialog('Reveal the answer?', [h('p', {}, 'You’ll see the answer and the full reasoning, then carry on. The story continues exactly the same.')], [['Keep trying', null, 'btn ghost'], ['Reveal', () => { commit(actions.solve(state, pid, 'revealed')); render(); }, 'btn danger']]), 'btn ghost'));
    help.append(row);
    if (p.fallback && state.refs[pid]) help.append(h('p', { class: 'muted' }, 'The backup reference is in the evidence above. It gives you everything the place would have. You still solve it yourselves.'));
    wrap.append(help);
  } else {
    const granted = p.grants.filter(id => model.evidence[id]);
    wrap.append(h('section', { class: `solved ${done}` },
      h('div', { class: 'stamp', 'aria-hidden': 'true' }, done === 'solved' ? 'Solved' : 'Revealed'),
      h('p', { class: 'answer' }, h('span', { class: 'label' }, 'Answer'), p.reveal.answer),
      h('details', { class: 'why', open: done === 'revealed' || null }, h('summary', {}, 'How it works'), h('p', {}, p.reveal.why)),
      p.story ? h('div', { class: 'scene beat' }, storyParas(p.story)) : null,
      granted.length ? h('div', { class: 'new-ev' }, h('h2', { class: 'sect' }, 'New evidence'), granted.map(id => renderEvidence(id, { open: true, fresh: true }))) : null,
      last && chapter.outro ? h('div', { class: 'outro' }, h('p', { class: 'eyebrow' }, `Chapter ${chapter.number} complete`), h('p', {}, chapter.outro)) : null,
      btn(n === order.length ? 'Open the verdict' : last ? 'Next chapter →' : 'Continue →', () => { commit(actions.advance(model, state)); go('play'); }, 'btn primary big')));
  }
  return wrap;
}

function renderEnding() {
  const e = model.ending;
  const used = Object.values(state.hints).reduce((a, b) => a + b, 0);
  const revealed = Object.values(state.done).filter(v => v === 'revealed').length;
  return h('div', { class: 'ending' },
    h('div', { class: 'stamp big-stamp', 'aria-hidden': 'true' }, 'Case closed'),
    h('h1', {}, e.headline),
    e.short.map((t, i) => h('p', { class: i === e.short.length - 1 ? 'kicker' : '' }, t)),
    h('details', { class: 'full' }, h('summary', {}, 'Read the full case explanation'), e.full.map(s => h('section', {}, h('h3', {}, s.head), h('p', {}, s.x)))),
    h('p', { class: 'muted center' }, `Hints opened: ${used}. Answers revealed: ${revealed}. No score — just for your curiosity.`),
    h('div', { class: 'actions' }, btn('Browse the case file', () => go('file'), 'btn ghost')));
}

function renderFile() {
  const ids = unlockedEvidence(model, state);
  const tabsRow = h('div', { class: 'seg file-tabs', role: 'tablist' }, [['evidence', 'Evidence'], ['people', 'People'], ['places', 'Places']].map(([id, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(fileTab === id), class: `seg-btn${fileTab === id ? ' on' : ''}`, onclick: () => { fileTab = id; render({ keepScroll: true }); } }, label)));
  let body;
  if (!state.started || !ids.length) body = h('p', { class: 'muted' }, 'The case file is sealed until you open the case.');
  else if (fileTab === 'people') body = h('div', { class: 'people' }, model.cast.map(c => h('div', { class: 'person' }, h('div', { class: 'avatar', 'aria-hidden': 'true' }, c.name.split(' ').filter(w => !w.endsWith('.')).map(w => w[0]).join('').slice(0, 2)), h('div', {}, h('h3', {}, c.name), h('p', {}, c.role)))), h('p', { class: 'muted' }, 'Everyone here is fictional.'));
  else if (fileTab === 'places') body = h('div', {}, visitedLocations(model, state).map(l => locationCard(l, 'Visited')), h('p', { class: 'muted' }, 'Places appear here once their chapter opens.'));
  else body = h('div', { class: 'evidence' }, ids.slice().reverse().map(id => renderEvidence(id)));
  return h('div', { class: 'file' }, h('p', { class: 'eyebrow' }, 'Everything you’ve collected'), h('h1', {}, 'Case file'), tabsRow, body);
}

function renderPrep() {
  const started = state.started;
  const offlineBox = h('section', { class: `offline ${offline.ready ? 'ok' : ''}` },
    h('div', { class: 'offline-head' }, h('span', { class: 'light', 'aria-hidden': 'true' }), h('h2', {}, offline.ready ? 'Ready offline' : 'Not ready offline yet')),
    h('p', { role: 'status' }, offline.message),
    offline.supported ? h('div', { class: 'help-row' },
      btn(offline.ready ? 'Check again for updates' : 'Download for offline play', () => doDownload(), 'btn primary', { disabled: offline.busy || null }),
      btn('Check this phone', () => doCheck(), 'btn ghost', { disabled: offline.busy || null })) : null);
  const cover = h('div', { class: 'cover' },
    h('div', { class: 'folder-tab' }, 'Case No. 06-12'),
    h('div', { class: 'cover-stamp', 'aria-hidden': 'true' }, started ? 'Open' : 'Sealed'),
    h('p', { class: 'eyebrow' }, 'Confidential · for two'),
    h('h1', { class: 'cover-title' }, prep.coverTitle),
    h('p', { class: 'cover-line' }, prep.coverLine),
    h('p', {}, prep.intro));
  return h('div', { class: 'prep' }, cover,
    h('dl', { class: 'facts' }, prep.facts.map(f => [h('dt', {}, f.label), h('dd', {}, f.value)])),
    h('div', { class: 'actions' }, started
      ? btn('Return to the case', () => go(state.finished ? 'play' : 'play'), 'btn primary big')
      : btn('Open the case', startCase, 'btn primary big'),
      !started ? h('p', { class: 'muted center' }, 'Only when you’re both at the start, drinks ordered.') : null),
    offlineBox,
    h('details', { class: 'panel', open: !offline.ready || null }, h('summary', {}, 'Install on the iPhone'), h('ol', {}, prep.install.map(t => h('li', {}, t))), h('p', { class: 'muted' }, prep.contextNote)),
    h('details', { class: 'panel' }, h('summary', {}, 'What to bring'), h('ul', {}, prep.bring.map(t => h('li', {}, t)))),
    h('details', { class: 'panel' }, h('summary', {}, 'Daylight & conditions'), h('p', {}, prep.daylight)),
    h('details', { class: 'panel' }, h('summary', {}, 'How it works'), h('ul', {}, prep.rules.map(t => h('li', {}, t)))),
    started ? h('details', { class: 'panel' }, h('summary', {}, 'Restart'), h('p', {}, 'Erase this phone’s progress and start the case from the beginning.'), btn('Restart the investigation…', () => showDialog('Erase all progress?', [h('p', {}, 'This deletes your saved investigation on this phone. It can’t be undone.')], [['Cancel', null, 'btn ghost'], ['Erase and restart', () => { state = newState(); store.restart(state); save(); go('prep'); }, 'btn danger']]), 'btn danger')) : null);
}

function startCase() {
  const begin = () => { commit(actions.start(state)); go('play'); };
  if (!offline.ready) showDialog('Not downloaded for offline play', [h('p', {}, 'Parts of the route may have weak signal. Download for offline play first, from the Home Screen app.')], [['Go back', null, 'btn ghost'], ['Start anyway', begin, 'btn primary']]);
  else begin();
}

function renderTabs() {
  tabs.replaceChildren();
  const items = state.started ? [['play', 'Case', '<path d="M4 5h16v14H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h5" stroke="currentColor" stroke-width="2"/>'], ['file', 'File', '<path d="M3 7h7l2 2h9v10H3z" fill="none" stroke="currentColor" stroke-width="2"/>'], ['prep', 'Setup', '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="2"/>']] : [];
  tabs.hidden = !items.length;
  for (const [id, label, icon] of items) tabs.append(h('button', { type: 'button', class: `tab${view === id ? ' on' : ''}`, 'aria-current': view === id ? 'page' : null, onclick: () => go(id) }, svg(`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${icon}</svg>`), h('span', {}, label)));
}

function render(opts = {}) {
  const y = window.scrollY;
  renderTabs();
  let node;
  if (view === 'file') node = renderFile();
  else if (view === 'play' && state.started) {
    const pos = position(model, state);
    node = pos.kind === 'ending' ? renderEnding() : pos.kind === 'intro' ? renderIntro(pos.chapter) : renderPuzzle(pos);
    document.body.dataset.chapter = pos.chapter?.number || 'end';
  } else { view = 'prep'; node = renderPrep(); document.body.dataset.chapter = 'prep'; }
  main.replaceChildren(node);
  if (opts.keepScroll || opts.keepFocus) window.scrollTo(0, y);
}

// ---------- offline ----------
async function doCheck() {
  offline.busy = true; offline.message = 'Checking every file on this phone…'; render({ keepScroll: true });
  try {
    const r = await workerRequest('CHECK', d => { offline.message = `Checking… ${d.done} / ${d.total}`; render({ keepScroll: true }); });
    offline.ready = !!r.ready;
    offline.message = r.ready ? 'Every chapter, clue, hint and backup is saved on this phone. You can play with no signal.' : 'Not everything is saved yet. Connect to the internet and tap Download for offline play.';
  } catch { offline.message = 'Couldn’t check. Open the app with a connection and try again.'; }
  offline.busy = false; render({ keepScroll: true });
}
async function doDownload() {
  offline.busy = true; offline.message = 'Downloading…'; render({ keepScroll: true });
  try {
    await workerRequest('DOWNLOAD', d => { offline.message = d.phase === 'download' ? `Downloading… ${d.done} / ${d.total} files` : `Checking… ${d.done} / ${d.total}`; render({ keepScroll: true }); });
    offline.busy = false; await doCheck(); return;
  } catch { offline.message = 'The download didn’t finish. Your progress is safe. Check your connection and try again.'; }
  offline.busy = false; render({ keepScroll: true });
}

// ---------- boot ----------
async function boot() {
  const base = new URL('../', import.meta.url);
  [prep, model] = await Promise.all(['content/preparation.json', 'content/adventure.json'].map(p => fetch(new URL(p, base)).then(r => { if (!r.ok) throw Error(p); return r.json(); })));
  store = new Persistence(localStorage);
  state = store.read(raw => restoreState(model, raw)) || newState();
  if (store.blocked) {
    main.replaceChildren(h('div', { class: 'prep' }, h('h1', {}, 'Saved progress can’t be read'), h('p', {}, 'This phone has a saved investigation from a different version. Nothing has been deleted.'), btn('Start fresh (erases the old save)', () => { state = newState(); store.restart(state); save(); go('prep'); }, 'btn danger')));
    return;
  }
  view = state.started ? 'play' : 'prep';
  render();
  saveStatus.textContent = state.started ? 'Saved' : '';
  try {
    await connectOffline();
    offline.supported = true;
    const s = await workerRequest('STATUS');
    if (s.hasPackage) await doCheck(); else { offline.message = 'Download once, with a good connection, then the whole case works without signal.'; render({ keepScroll: true }); }
  } catch {
    offline.message = 'Offline download isn’t available in this browser. Open the game from the Home Screen app on the iPhone.';
    render({ keepScroll: true });
  }
}
boot().catch(() => { main.replaceChildren(h('div', { class: 'prep' }, h('h1', {}, 'The case file didn’t load'), h('p', {}, 'Check your connection and reopen. Saved progress is untouched.'))); });
