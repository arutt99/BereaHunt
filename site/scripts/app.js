import { createState, transition, restoreState, currentPuzzle, pendingTravel, enteredIds, citationAllowed } from './engine.js';
import { loadPreparation, loadAdventure, loadSolution } from './content.js';
import { connectOffline, workerRequest } from './offline.js';
import { Persistence, SAVE_KEY } from './persistence.js';
import { renderAid, payloadFor, incomplete } from './aids.js';
import { parseBounds } from './answers.js';
import { el, button, paragraph, table } from './dom.js';

const main = document.querySelector('#main'), dialog = document.querySelector('#dialog');
let prep, model, state, store, ready = false, offlineSupported = false, packageId = null, version = null;
let view = 'preparation', offlineMessage = 'Preparation incomplete', downloading = false, progress = null, updateReady = false, busy = false;
let feedback = '', compare = false;
const opened = new Map();
const base = new URL('../', import.meta.url);
const localURL = path => new URL(path, base).href;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const storageMessages = {
  unavailable: 'Local saving is unavailable. Progress can continue in this open session; closing it may lose changes.',
  writeFailed: 'The latest progress could not be saved. Keep the app open and retry saving before closing it.',
  corrupt: 'The saved investigation could not be read. Its original data is still stored. Retry reading it or deliberately restart; nothing has been reset.',
  incompatible: 'The saved investigation needs a compatible version. Its original data is still stored. Reopen the compatible app, or deliberately restart.',
  conflict: 'Progress changed in another window. This window will not overwrite it. Close this window and reopen the investigation to use the latest save.',
};
function updateSaveNotice() {
  const status = store?.status;
  document.querySelector('#save-status').textContent = status === 'saved' ? 'Saved on this device' : status && storageMessages[status] ? 'Saving needs attention' : 'Local preparation';
  const notice = document.querySelector('#storage-notice');
  notice.replaceChildren(); notice.hidden = !storageMessages[status];
  if (notice.hidden) return;
  notice.append(paragraph(storageMessages[status]));
  if (['unavailable', 'writeFailed'].includes(status)) notice.append(button('Retry saving', () => { store.save(state); updateSaveNotice(); }));
  if (['corrupt', 'incompatible', 'conflict'].includes(status)) notice.append(button('Retry reading saved progress', () => location.reload()));
}
function commit(event, solution = null) {
  if (store?.blocked) return false;
  const next = transition(model, state, event, solution);
  if (next === state) return false;
  state = next; store.save(state); updateSaveNotice(); return true;
}
function showDialog(title, children, closeLabel = 'Close') {
  document.querySelector('#dialog-body').replaceChildren(el('h2', { id: 'dialog-title', tabindex: '-1' }, title), ...children);
  dialog.querySelector('form button').textContent = closeLabel;
  if (!dialog.open) dialog.showModal();
  document.querySelector('#dialog-title').focus();
}
function confirmAction(title, text, label, action) {
  showDialog(title, [paragraph(text), button(label, () => { dialog.close(); run(action); }, '')], 'Cancel');
}
async function run(action) {
  if (busy) return;
  busy = true;
  try { await action(); }
  catch { feedback = 'This action could not finish. Your saved progress has not been reset. Reopen preparation to check the local package, then retry.'; await render(); }
  finally { busy = false; }
}
async function navigate(next, focus = true) {
  feedback = ''; view = next; await render();
  if (focus) { main.focus(); window.scrollTo(0, 0); }
}
async function redrawPreservingPosition() {
  const scroll = window.scrollY, focus = document.activeElement?.id;
  await render();
  if (focus) {
    let target = document.getElementById(focus);
    if (target?.disabled) target = target.parentElement.querySelector('button:not(:disabled)');
    target?.focus({ preventScroll: true });
  }
  window.scrollTo(0, scroll);
}
function renderNavigation() {
  const nav = document.querySelector('#navigation');
  nav.replaceChildren();
  if (ready && state?.started && !store.blocked) {
    for (const [id, label] of [['objective', 'Current task'], ['case', 'Case file']]) nav.append(button(label, () => run(() => navigate(id)), 'quiet', { 'aria-current': view === id ? 'page' : null }));
  }
  nav.append(button('Offline & install', () => run(() => navigate('preparation')), 'quiet', { 'aria-current': view === 'preparation' ? 'page' : null }));
}
async function render() {
  renderNavigation(); updateSaveNotice();
  main.classList.toggle('compare', compare);
  main.replaceChildren();
  if (view === 'preparation' || !model || !state || store.blocked) renderPreparation();
  else if (view === 'case') await renderCaseFile();
  else await renderCurrent();
  if (feedback && !document.querySelector('#answer-feedback')) main.append(el('p', { className: 'feedback', role: 'status', id: 'page-feedback', tabindex: '-1' }, feedback));
}
function renderPreparation() {
  main.append(el('p', { className: 'eyebrow' }, 'A case for two'), el('h1', {}, 'Prepare the investigation'), paragraph(prep?.introduction || 'One shared phone. Begin together during your planned customer drink visit at Fat Head’s in Middleburg Heights.'));
  const card = el('section', { className: 'card', 'aria-label': 'Complete offline preparation' },
    el('h2', {}, ready ? 'Ready offline' : 'Preparation incomplete'), el('p', { role: 'status', id: 'offline-status' }, offlineMessage));
  card.append(el('small', {}, `${standalone() ? 'Home Screen app' : 'Browser context'}${version ? ` · version ${version}` : ''}. Readiness and progress belong to this context.`));
  if (progress) card.append(el('progress', { max: progress.total, value: progress.done, 'aria-label': 'Complete package progress' }), paragraph(`${progress.done} / ${progress.total} resources${progress.totalBytes ? ` · ${Math.ceil(progress.totalBytes / 1024)} KB total` : ''}`));
  if (offlineSupported) {
    card.append(el('div', { className: 'actions' },
      button(ready ? 'Check for a complete update' : 'Download complete adventure', () => run(downloadPackage), '', { disabled: downloading }),
      button('Check offline readiness', () => run(checkPackage), 'secondary', { disabled: downloading })));
  } else card.append(paragraph('Complete offline play needs service workers, local cache storage and a secure connection (HTTPS, or localhost for development). Reopen in a supported browser with connectivity and retry.'), button('Retry preparation', () => location.reload()));
  if (updateReady) card.append(button('Use verified update', () => location.reload(), ''));
  if (ready) card.append(paragraph('Every required resource was checked locally. Before the outing, close and relaunch this app offline in this same context. Device data removal or eviction can remove the download and progress.'));
  main.append(card);
  if (ready && model && !store.blocked) main.append(button(state.started ? prep.labels.resume : prep.labels.begin, () => run(async () => {
    if (state.started) { await navigate('objective'); return; }
    const start = async () => { commit({ type: 'begin' }); await navigate('objective'); };
    if (!standalone()) confirmAction('Start in this browser?', 'For iPhone play, add this app to your Home Screen and prepare there first. Safari and the installed app may keep separate progress. Continue here only if you want this browser context to hold the case.', 'Start in this browser', start);
    else await start();
  }), ''));
  main.append(el('h2', {}, 'Install, then download'), el('ol', {}, (prep?.installInstructions || []).map(text => el('li', {}, text))),
    el('details', { className: 'document' }, el('summary', {}, 'Before you go'), el('div', { className: 'document-body' }, (prep?.practicalGuidance || []).map(paragraph))));
  main.append(paragraph('Core play uses no external service. Maps and source links are optional and may need connectivity. All answers and content are inspectable in a static download; normal play conceals future records.'));
  if (state && (state.started || store.blocked)) main.append(button('Restart investigation', restart, 'secondary danger'));
}
async function checkPackage() {
  downloading = true; progress = null; offlineMessage = 'Checking every required local resource…'; await render();
  try {
    const result = await workerRequest('CHECK', p => { progress = p; updateProgress(); });
    ready = result.ready; packageId = result.id; version = result.version;
    offlineMessage = ready ? 'Complete adventure verified locally. Ready for an offline relaunch in this context.' : 'The complete local package is unavailable. Connect and retry the full download. Saved progress has not been reset.';
    if (ready && !model) await initializeCase();
  } catch { ready = false; offlineMessage = 'Local readiness could not be verified. Connect, reopen and retry; saved progress has not been reset.'; }
  downloading = false; progress = null; await render();
}
function updateProgress() {
  const bar = document.querySelector('progress');
  if (bar && progress) { bar.max = progress.total; bar.value = progress.done; }
  const status = document.querySelector('#offline-status');
  if (status && progress) status.textContent = `${progress.phase === 'download' ? 'Downloading' : 'Checking local package'}: ${progress.done} / ${progress.total} resources${progress.totalBytes ? ` · ${Math.ceil(progress.totalBytes / 1024)} KB` : ''}.`;
}
async function downloadPackage() {
  const oldReady = ready;
  downloading = true; progress = { done: 0, total: 1 }; offlineMessage = 'Preparing a complete verified package…'; await render();
  try {
    const result = await workerRequest('DOWNLOAD', p => { progress = p; updateProgress(); });
    if (!oldReady) { location.reload(); return; }
    updateReady = result.id !== packageId;
    offlineMessage = updateReady ? 'A complete compatible update is verified. Use verified update to reopen it with your saved progress. This open case still uses its current complete version.' : 'Your complete local package is up to date and verified.';
  } catch (error) {
    offlineMessage = error.message === 'INCOMPATIBLE_PACKAGE' ? 'This update needs a different state version. The current compatible download and save are retained.' : `Download incomplete. Check connectivity and available device storage, then retry.${oldReady ? ' Your previous complete version and progress are retained.' : ' No complete package is confirmed yet.'}`;
  }
  downloading = false; progress = null; await render();
}
function restart() {
  confirmAction('Restart investigation?', prep.restartConfirmation, 'Erase progress and restart', async () => {
    state = createState(model); store.restart(state); opened.clear(); compare = false; view = 'preparation'; await render(); main.focus();
  });
}
function sourcesFor(factIds) {
  if (!factIds.length) return null;
  const details = el('details', {}, el('summary', {}, 'Documentary sources'));
  for (const id of [...new Set(factIds)]) {
    const fact = model.sources.facts.find(f => f.id === id);
    if (!fact) continue;
    if (!citationAllowed(fact, state)) { details.append(paragraph(model.sources.citationPolicy.lockedCitationLabel)); continue; }
    details.append(paragraph(fact.claim), el('small', {}, `${fact.classification} · reviewed ${fact.reviewedOn} · ${fact.scope}`));
    for (const sid of fact.sourceIds) {
      const source = model.sources.sources.find(s => s.id === sid);
      if (!source || !citationAllowed(source, state)) { details.append(paragraph(model.sources.citationPolicy.lockedCitationLabel)); continue; }
      details.append(paragraph(`${source.publisher} · ${source.title} · reviewed ${source.reviewedOn}`), el('a', { href: source.url, target: '_blank', rel: 'noopener noreferrer' }, 'Open optional external source'));
    }
  }
  details.append(el('small', {}, model.sources.notice));
  return details;
}
function imageView(asset, caption) {
  const viewport = el('div', { className: 'inspection', tabindex: '0', 'aria-label': 'Scrollable enlarged image' });
  const image = el('img', { src: localURL(asset.relativePath), alt: caption, style: 'width:960px' });
  viewport.append(image);
  const zoom = el('input', { type: 'range', id: 'image-zoom', min: 320, max: 1920, step: 160, value: 960, oninput: event => { image.style.width = `${event.target.value}px`; } });
  showDialog('Inspect reference image', [el('label', { for: 'image-zoom' }, 'Image width / zoom'), zoom, viewport, paragraph(caption)]);
}
function renderBlock(block) {
  const out = el('section');
  if (block.type === 'optional_section') {
    const details = el('details', { className: 'document', open: state.fullExplanationViewed, ontoggle: event => {
      if (event.target.open && !state.fullExplanationViewed) commit({ type: 'fullExplanation' });
    } }, el('summary', {}, block.title), el('div', { className: 'document-body' }, block.paragraphs.map(paragraph)));
    return details;
  }
  out.append(el('span', { className: 'classification' }, block.classification === 'fictional' ? 'Fictional case record' : 'Documentary reference · original paraphrase'));
  if (block.title && block.type !== 'table') out.append(el('h3', {}, block.title));
  if (block.type === 'paragraph') out.append(paragraph(block.text));
  if (block.type === 'table') out.append(table(block));
  if (block.type === 'instructions') out.append(el('ol', {}, block.steps.map(text => el('li', {}, text))));
  if (block.type === 'figure') {
    const asset = model.assets[block.assetId];
    const image = el('img', { src: localURL(asset.relativePath), alt: block.caption, loading: 'lazy', onerror: event => { event.target.hidden = true; } });
    out.append(el('figure', {}, button([image, el('span', { className: 'quiet' }, 'Enlarge reference')], () => imageView(asset, block.caption), 'secondary', { 'aria-label': 'Enlarge reference image' }), el('figcaption', {}, block.caption)));
  }
  return out;
}
function documentBody(id) {
  if (!state.evidenceIds.includes(id)) return paragraph('This record is locked. Return to the current task.');
  const evidence = model.evidence[id];
  const body = el('div', { className: 'document-body' }, evidence.bodyBlocks.map(renderBlock));
  const sources = sourcesFor(evidence.factIds); if (sources) body.append(sources);
  return body;
}
function evidenceCard(id, defaultOpen = true) {
  if (!state.evidenceIds.includes(id)) return null;
  return el('details', { className: 'document', open: opened.has(id) ? opened.get(id) : defaultOpen, 'data-evidence': id, ontoggle: event => opened.set(id, event.target.open) },
    el('summary', {}, el('span', { className: 'badge' }, `${id} / `), model.evidence[id].title), documentBody(id));
}
function showEvidence(id) {
  if (!state.evidenceIds.includes(id)) { feedback = 'This record is locked. Continue the current task to collect it.'; return render(); }
  showDialog(model.evidence[id].title, [documentBody(id)]);
}
function locationCard(location) {
  // This caller must have passed either the start or completed destination gate.
  return el('section', { className: 'card' }, el('h2', {}, location.name), paragraph(location.addressOrOperatorDescription), paragraph(location.arrivalInstructions),
    paragraph(location.walkingPlan), el('ul', {}, location.restrictions.map(text => el('li', {}, text))), el('small', {}, `Documentary review: ${location.reviewedOn}. Posted conditions take priority.`),
    paragraph(prep.mapNotice), el('a', { href: location.optionalMapUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Open optional external map'), sourcesFor(location.navigationFactIds));
}
function progressHeader(p) {
  const chapter = model.chapters[p.chapterId];
  main.append(el('p', { className: 'eyebrow' }, `${chapter.publicLabel} of ${model.adventure.chapterIds.length} · ${state.completedPuzzleIds.length} / 8 findings`),
    el('div', { className: 'progress-track', role: 'progressbar', 'aria-label': 'Findings recorded', 'aria-valuemin': 0, 'aria-valuemax': 8, 'aria-valuenow': state.completedPuzzleIds.length }, el('span', { style: `width:${state.completedPuzzleIds.length / 8 * 100}%` })));
}
async function explanation(id) {
  const solution = await loadSolution(model, state, id);
  return el('section', { className: 'card' }, el('h2', {}, 'Answer and reasoning'),
    paragraph(solution.reveal.explanation), el('ol', {}, solution.reasoningSteps.map(text => el('li', {}, text))),
    el('details', {}, el('summary', {}, 'Why the alternatives do not fit'), solution.alternativeEliminations.map(paragraph)));
}
async function renderCurrent() {
  const p = currentPuzzle(model, state);
  if (!state.started) { view = 'preparation'; renderPreparation(); return; }
  if (['destination', 'travel'].includes(state.mode)) { renderTravel(); return; }
  progressHeader(p);
  if (state.mode === 'ending') {
    main.append(el('h1', {}, 'Investigation complete'), documentBody('E17'),
      button('Review the case file', () => run(() => navigate('case')), ''));
    return;
  }
  const chapter = model.chapters[p.chapterId];
  if (state.mode === 'finding') {
    main.append(el('h1', {}, 'Finding recorded'), paragraph(p.feedback.correct), await explanation(p.id));
    for (const id of p.rewardEvidenceIds) main.append(evidenceCard(id));
    if (chapter.puzzleIds.at(-1) === p.id) main.append(paragraph(chapter.transition));
    main.append(button(pendingTravel(model, state) ? 'Review confirmed destination' : 'Continue the case', () => run(async () => { commit({ type: 'continue' }); await navigate('objective'); }), ''));
    return;
  }
  main.append(el('h1', {}, chapter.unlockedTitle), paragraph(chapter.introduction), el('section', { className: 'objective' }, el('h2', {}, 'Current objective'), paragraph(p.prompt)));
  const place = model.locations[p.locationId];
  main.append(el('details', { className: 'document' }, el('summary', {}, 'Current visit & safe access'), locationCard(place)));
  main.append(el('h2', {}, 'Relevant evidence'), button(compare ? 'Use single-column evidence' : 'Compare relevant evidence', () => run(async () => { compare = !compare; p.surfacedEvidenceIds.forEach(id => opened.set(id, true)); await redrawPreservingPosition(); }), 'quiet', { id: 'compare-evidence' }));
  main.append(el('div', { className: 'evidence-grid' }, p.surfacedEvidenceIds.map(id => evidenceCard(id))));
  const form = el('form', { id: 'answer-form', onsubmit: event => { event.preventDefault(); run(submitAnswer); } });
  form.append(renderAid(model, state, p, draft => commit({ type: 'draft', draft }), () => run(redrawPreservingPosition)),
    el('button', { type: 'submit' }, p.answerType === 'final_pair' ? prep.labels.finalSubmit : 'Check answer'),
    el('p', { id: 'answer-feedback', className: 'feedback', role: 'status', tabindex: '-1' }, feedback));
  main.append(form);
  const hints = state.hintLevelByPuzzle[p.id] || 0;
  const help = el('section', { className: 'card', 'aria-label': 'Assistance' }, el('h2', {}, 'Keep investigating'), paragraph('Help is available whenever you want it. No delays or penalties.'));
  if (hints) {
    const solution = await loadSolution(model, state, p.id);
    help.append(el('ol', { id: 'shown-hints' }, solution.hints.slice(0, hints).map(hint => el('li', { tabindex: '-1' }, hint.text))));
  }
  help.append(el('div', { className: 'actions' },
    button(hints < 3 ? `Show hint ${hints + 1} of 3` : 'All three hints shown', () => run(async () => {
      await loadSolution(model, state, p.id); commit({ type: 'hint' }); await redrawPreservingPosition();
      const hint = document.querySelector('#shown-hints li:last-child');
      hint?.focus({ preventScroll: true }); hint?.scrollIntoView({ block: 'nearest' });
    }), 'secondary', { disabled: hints === 3 }),
    button('Can’t access this clue', () => run(async () => {
      commit({ type: 'reference' }); showDialog('Unsolved reference evidence', [paragraph(p.assistance.referenceIntroduction), ...p.referenceEvidenceIds.map(id => evidenceCard(id, true))]);
    })),
    button('Reveal answer', () => confirmAction('Reveal answer?', p.assistance.revealConfirmation, 'Reveal answer and continue', async () => {
      const solution = await loadSolution(model, state, p.id); commit({ type: 'reveal', confirmed: true }, solution); await navigate('objective');
    }))));
  main.append(help);
}
async function submitAnswer() {
  const p = currentPuzzle(model, state), payload = payloadFor(p, state);
  if (incomplete(payload)) feedback = p.feedback.empty;
  else {
    let validFormat = true;
    if (p.answerType === 'time_bounds') {
      try { parseBounds(payload); } catch { validFormat = false; }
    }
    if (!validFormat) feedback = 'Use hour:minute in both fields, as 24-hour time or with AM/PM. A trailing PM may apply to both fields.';
    else {
      const solution = await loadSolution(model, state, p.id);
      if (commit({ type: 'submit', payload }, solution)) { await navigate('objective'); return; }
      feedback = p.feedback.incorrect;
    }
  }
  const node = document.querySelector('#answer-feedback'); node.textContent = feedback; node.focus({ preventScroll: false });
}
function renderTravel() {
  const leg = pendingTravel(model, state), location = model.locations[leg.toLocationId];
  main.append(el('p', { className: 'eyebrow' }, 'Destination confirmed by your finding'), el('h1', {}, state.mode === 'travel' ? 'Stop safely before investigating' : 'Your next public approach'), locationCard(location));
  for (const id of leg.confirmationEvidenceIds) main.append(evidenceCard(id));
  if (state.mode === 'destination') main.append(button('Confirm destination', () => run(async () => { commit({ type: 'confirmDestination' }); await navigate('objective'); }), ''));
  else main.append(paragraph('Put the phone away during travel. The next objective opens only when you choose to continue from a lawful safe stationary position.'), button('I’m safely stopped — continue', () => run(async () => { commit({ type: 'arrive', safelyStopped: true }); await navigate('objective'); }), ''));
  main.append(button('Can’t visit — continue with references from a safe place', () => confirmAction('Continue without visiting?', 'Stay legally and safely stopped. The full unsolved inputs are available without a visit, GPS or network. This does not reveal an answer.', 'I’m safely stopped — use references', async () => { commit({ type: 'referenceTravel', safelyStopped: true }); await navigate('objective'); })));
}
async function renderCaseFile() {
  main.append(el('p', { className: 'eyebrow' }, 'Collected locally'), el('h1', {}, 'Your case file'), paragraph('Revisit collected documents and completed explanations. Future records stay locked.'));
  const entered = enteredIds(model, state);
  const chapters = el('ol', { className: 'case-list' });
  for (const id of model.adventure.chapterIds) {
    const chapter = model.chapters[id], unlocked = chapter.puzzleIds.some(pid => entered.includes(pid));
    chapters.append(el('li', { className: unlocked ? '' : 'locked' }, `${chapter.publicLabel} · ${unlocked ? chapter.unlockedTitle : 'Locked'}`));
  }
  main.append(chapters, el('h2', {}, 'Evidence'), el('ul', { className: 'case-list' }, state.evidenceIds.map(id => el('li', {}, button(`${id} · ${model.evidence[id].title}`, () => showEvidence(id))))));
  if (state.completedPuzzleIds.length) main.append(el('h2', {}, 'Completed findings'), el('ul', { className: 'case-list' }, state.completedPuzzleIds.map((id, i) => el('li', {}, button(`Finding ${i + 1} · answer and reasoning`, () => run(async () => showDialog(`Finding ${i + 1}`, [await explanation(id)])))))));
  main.append(button('Return to current task', () => run(() => navigate('objective')), ''));
}
async function followHash() {
  if (!state || !model || !state.started || store.blocked) return;
  const match = /^#(evidence|puzzle)\/([A-Z][0-9]{2})$/.exec(location.hash);
  if (!match) return;
  if (match[1] === 'evidence') await showEvidence(match[2]);
  else if (state.completedPuzzleIds.includes(match[2])) showDialog('Completed finding', [await explanation(match[2])]);
  else if (state.mode === 'objective' && state.currentPuzzleId === match[2]) await navigate('objective');
  else { feedback = 'This finding is locked. Continue the current task.'; await render(); }
}
async function initializeCase() {
  model = await loadAdventure();
  let storage;
  try { storage = window.localStorage; } catch { storage = { getItem() { throw Error(); }, setItem() { throw Error(); } }; }
  store = new Persistence(storage);
  const restored = store.read(value => restoreState(model, value));
  state = restored || createState(model);
  if (restored && JSON.parse(store.lastRaw).contentVersion !== state.contentVersion) store.save(state);
  if (state.started && !store.blocked) view = 'objective';
}
async function boot() {
  try { prep = await loadPreparation(); } catch { /* neutral shell still explains repair */ }
  await render();
  try {
    await connectOffline(); offlineSupported = true;
    const status = await workerRequest('STATUS'); packageId = status.id; version = status.version;
    if (status.hasPackage) await checkPackage();
    else { offlineMessage = 'Download and verify the whole adventure before starting. Later chapters, tools, hints and references are included.'; await render(); }
    await followHash();
  } catch { offlineMessage = 'Offline preparation is unavailable in this context. Check browser support, connectivity and storage, then reopen to retry.'; await render(); }
}
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); run(() => navigate(state?.started ? 'objective' : 'preparation')); });
window.addEventListener('hashchange', () => run(followHash));
window.addEventListener('storage', () => {
  if (store && state && store.status === 'saved') {
    try { if (store.storage.getItem(SAVE_KEY) !== store.lastRaw) { store.blocked = true; store.status = 'conflict'; render(); } } catch { /* next write gives a truthful notice */ }
  }
});
boot();
