import { checkAnswer } from './answers.js';
import { validDraft } from './aids.js';
export const SAVE_SCHEMA = 1;
const unique = values => [...new Set(values)];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function createState(model) {
  return refresh(model, {
    schemaVersion: SAVE_SCHEMA, adventureId: model.adventure.id,
    contentVersion: model.adventure.contentVersion, stateCompatibility: model.adventure.stateCompatibility,
    started: false, mode: 'preparation', completedPuzzleIds: [], confirmedTravelLegIds: [], arrivedTravelLegIds: [],
    hintLevelByPuzzle: {}, referenceUsedPuzzleIds: [], revealedPuzzleIds: [], workingAidDraftByPuzzle: {},
    endingViewed: false, fullExplanationViewed: false, revision: 0, updatedAt: null,
  });
}
export const orderOf = model => model.adventure.puzzleRefs.map(ref => model.puzzlesByRef[ref].id);
export function currentPuzzle(model, state) {
  const order = orderOf(model), n = state.completedPuzzleIds.length;
  return model.puzzles[order[state.mode === 'finding' || state.mode === 'ending' ? n - 1 : n]] || null;
}
export function pendingTravel(model, state) {
  const last = state.completedPuzzleIds.at(-1);
  return model.adventure.travelLegs.find(t => t.afterPuzzleId === last && !state.arrivedTravelLegIds.includes(t.id)) || null;
}
export function enteredIds(model, state) {
  if (!state.started) return [];
  return unique([...state.completedPuzzleIds, ...(state.mode === 'objective' ? [currentPuzzle(model, state).id] : [])]);
}
export function refresh(model, state) {
  const entered = enteredIds(model, state);
  state.evidenceIds = unique(entered.flatMap(id => model.puzzles[id].entryEvidenceIds)
    .concat(state.completedPuzzleIds.flatMap(id => model.puzzles[id].rewardEvidenceIds)));
  state.currentPuzzleId = currentPuzzle(model, state)?.id || model.adventure.initialPuzzleId;
  state.currentChapterId = model.puzzles[state.currentPuzzleId].chapterId;
  return state;
}
export function transition(model, original, event, solution = null) {
  const s = structuredClone(original), p = currentPuzzle(model, s), leg = pendingTravel(model, s);
  switch (event.type) {
    case 'begin':
      if (s.started) return original;
      s.started = true; s.mode = 'objective'; break;
    case 'draft':
      if (s.mode !== 'objective') throw Error('LOCKED');
      if (!validDraft(p, event.draft)) throw Error('INVALID_DRAFT');
      s.workingAidDraftByPuzzle[p.id] = structuredClone(event.draft); break;
    case 'hint':
      if (s.mode !== 'objective') throw Error('LOCKED');
      s.hintLevelByPuzzle[p.id] = Math.min(3, (s.hintLevelByPuzzle[p.id] || 0) + 1); break;
    case 'reference':
      if (s.mode !== 'objective') throw Error('LOCKED');
      s.referenceUsedPuzzleIds = unique([...s.referenceUsedPuzzleIds, p.id]); break;
    case 'submit':
    case 'reveal':
      if (s.mode !== 'objective' || solution?.puzzleId !== p.id) throw Error('LOCKED');
      if (event.type === 'reveal' && event.confirmed !== true) throw Error('CONFIRM_REQUIRED');
      if (event.type === 'submit' && !checkAnswer(solution, event.payload)) return original;
      s.completedPuzzleIds.push(p.id);
      if (event.type === 'reveal') s.revealedPuzzleIds = unique([...s.revealedPuzzleIds, p.id]);
      s.mode = p.nextPuzzleId ? 'finding' : 'ending';
      s.endingViewed = s.mode === 'ending'; break;
    case 'continue':
      if (s.mode !== 'finding') throw Error('LOCKED');
      s.mode = leg ? 'destination' : 'objective'; break;
    case 'confirmDestination':
      if (s.mode !== 'destination' || !leg) throw Error('LOCKED');
      s.confirmedTravelLegIds = unique([...s.confirmedTravelLegIds, leg.id]); s.mode = 'travel'; break;
    case 'arrive':
    case 'referenceTravel':
      if (!['destination', 'travel'].includes(s.mode) || !leg || event.safelyStopped !== true) throw Error('STOP_REQUIRED');
      if (event.type === 'arrive' && s.mode !== 'travel') throw Error('LOCKED');
      s.confirmedTravelLegIds = unique([...s.confirmedTravelLegIds, leg.id]);
      s.arrivedTravelLegIds = unique([...s.arrivedTravelLegIds, leg.id]); s.mode = 'objective';
      if (event.type === 'referenceTravel') s.referenceUsedPuzzleIds = unique([...s.referenceUsedPuzzleIds, currentPuzzle(model, s).id]);
      break;
    case 'fullExplanation':
      if (s.mode !== 'ending') throw Error('LOCKED');
      s.fullExplanationViewed = true; break;
    default: throw Error('UNKNOWN_EVENT');
  }
  s.revision += 1; s.updatedAt = new Date().toISOString();
  return refresh(model, s);
}
// Strict restore: completion prefixes and legal travel gates are the authority,
// never a URL, supplied chapter, or independently supplied evidence collection.
export function restoreState(model, value) {
  const fail = () => { throw Error('INVALID_SAVE'); };
  if (!value || typeof value !== 'object') fail();
  if (value.schemaVersion !== SAVE_SCHEMA || value.adventureId !== model.adventure.id || value.stateCompatibility !== model.adventure.stateCompatibility) throw Error('INCOMPATIBLE_SAVE');
  const order = orderOf(model), n = value.completedPuzzleIds?.length;
  if (!Array.isArray(value.completedPuzzleIds) || n > order.length || !same(value.completedPuzzleIds, order.slice(0, n))) fail();
  if (typeof value.started !== 'boolean' || !['preparation', 'objective', 'finding', 'destination', 'travel', 'ending'].includes(value.mode)) fail();
  if (!value.started && (n !== 0 || value.mode !== 'preparation')) fail();
  if (value.started && (value.mode === 'preparation' || (n === 0 && value.mode !== 'objective'))) fail();
  if ((value.mode === 'ending') !== (n === order.length) || (value.endingViewed !== (value.mode === 'ending'))) fail();
  if (typeof value.fullExplanationViewed !== 'boolean' || (value.fullExplanationViewed && !value.endingViewed)) fail();
  if (!Number.isSafeInteger(value.revision) || value.revision < 0 || typeof value.contentVersion !== 'string') fail();
  for (const field of ['confirmedTravelLegIds', 'arrivedTravelLegIds']) {
    if (!Array.isArray(value[field]) || unique(value[field]).length !== value[field].length ||
        value[field].some(id => !model.adventure.travelLegs.some(t => t.id === id && value.completedPuzzleIds.includes(t.afterPuzzleId)))) fail();
  }
  if (value.arrivedTravelLegIds.some(id => !value.confirmedTravelLegIds.includes(id))) fail();
  for (const t of model.adventure.travelLegs) {
    const after = order.indexOf(t.afterPuzzleId);
    if (n > after + 1 && !value.arrivedTravelLegIds.includes(t.id)) fail();
  }
  const leg = pendingTravel(model, value);
  if (['destination', 'travel'].includes(value.mode) && !leg) fail();
  if (value.mode === 'travel' && !value.confirmedTravelLegIds.includes(leg.id)) fail();
  if (value.mode === 'objective' && leg) fail();
  const entered = enteredIds(model, value);
  for (const field of ['referenceUsedPuzzleIds', 'revealedPuzzleIds']) {
    if (!Array.isArray(value[field]) || unique(value[field]).length !== value[field].length || value[field].some(id => !(field === 'revealedPuzzleIds' ? value.completedPuzzleIds : entered).includes(id))) fail();
  }
  if (!value.hintLevelByPuzzle || typeof value.hintLevelByPuzzle !== 'object' || Array.isArray(value.hintLevelByPuzzle) ||
      Object.entries(value.hintLevelByPuzzle).some(([id, level]) => !entered.includes(id) || !Number.isInteger(level) || level < 0 || level > 3)) fail();
  if (!value.workingAidDraftByPuzzle || Array.isArray(value.workingAidDraftByPuzzle) || typeof value.workingAidDraftByPuzzle !== 'object' ||
      Object.entries(value.workingAidDraftByPuzzle).some(([id, draft]) => !entered.includes(id) || !validDraft(model.puzzles[id], draft)) || JSON.stringify(value.workingAidDraftByPuzzle).length > 100000) fail();
  const restored = refresh(model, structuredClone(value));
  if (!same(value.evidenceIds, restored.evidenceIds) || value.currentPuzzleId !== restored.currentPuzzleId || value.currentChapterId !== restored.currentChapterId) fail();
  restored.contentVersion = model.adventure.contentVersion; // compatible IDs retain all progress
  return restored;
}
export function citationAllowed(record, state) {
  return !record.displayAfterPuzzleId || state.completedPuzzleIds.includes(record.displayAfterPuzzleId);
}
