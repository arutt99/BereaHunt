async function json(path) {
  const response = await fetch(new URL(`../content/${path}`, import.meta.url));
  if (!response.ok) throw Error('CONTENT_UNAVAILABLE');
  return response.json();
}
export const loadPreparation = () => json('preparation.json');
export async function loadAdventure() {
  try {
    const adventure = await json('adventure.json');
    if (adventure.schemaVersion !== 1 || adventure.stateCompatibility !== 1) throw Error();
    const lists = await Promise.all([adventure.chapterRefs, adventure.puzzleRefs, adventure.evidenceRefs].map(refs => Promise.all(refs.map(json))));
    const [chaptersList, puzzlesList, evidenceList] = lists;
    const [locations, sources, assets] = await Promise.all([adventure.locationRef, adventure.sourcesRef, adventure.assetRegistry].map(json));
    const byId = records => Object.fromEntries(records.map(r => [r.id, r]));
    const model = { adventure, chapters: byId(chaptersList), puzzles: byId(puzzlesList), evidence: byId(evidenceList),
      puzzlesByRef: Object.fromEntries(adventure.puzzleRefs.map((ref, i) => [ref, puzzlesList[i]])),
      locations: byId(locations.locations), sources, assets: byId(assets.assets) };
    if (!model.puzzles[adventure.initialPuzzleId] || puzzlesList.length !== 8) throw Error();
    return model;
  } catch { throw Error('CONTENT_UNAVAILABLE'); }
}
const solutions = new Map();
export async function loadSolution(model, state, id) {
  if (!state.started || !(state.completedPuzzleIds.includes(id) || (state.mode === 'objective' && state.currentPuzzleId === id))) throw Error('LOCKED');
  if (!solutions.has(id)) solutions.set(id, await json(model.puzzles[id].solutionRef));
  return solutions.get(id);
}
