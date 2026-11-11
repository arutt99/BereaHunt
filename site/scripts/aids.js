import { el, button, paragraph, table, labeledInput, labeledSelect } from './dom.js';
export function initialValues(p) {
  switch (p.answerType) {
    case 'reference_id': return { reference: '' };
    case 'sequence_and_text': return { sequence: p.workingAid.initialCards.map(c => c.id), mechanism: '' };
    case 'unordered_id_pair': return { serials: [], tab: 'before' };
    case 'time_bounds': return { lower: '', upper: '' };
    case 'bijection': return { mapping: { ...p.workingAid.initialMapping } };
    case 'final_pair': return { actor: '', order: '' };
    default: return p.workingAid.kind === 'local_polybius_grid' ? { answer: '', keyword: '', cells: Array(25).fill('') } : { answer: '' };
  }
}
export function validDraft(p, draft) {
  if (!draft || typeof draft !== 'object' || !draft.values || !Array.isArray(draft.history) || draft.history.length > 20) return false;
  const validValues = values => {
    const initial = initialValues(p);
    if (!values || Object.keys(values).sort().join('|') !== Object.keys(initial).sort().join('|')) return false;
    for (const [key, value] of Object.entries(values)) {
      if (Array.isArray(initial[key])) {
        if (!Array.isArray(value) || value.some(v => typeof v !== 'string' || v.length > 100)) return false;
        if (key === 'sequence' && (value.length !== 3 || new Set(value).size !== 3 || value.some(v => !initial.sequence.includes(v)))) return false;
        if (key === 'cells' && (value.length !== 25 || value.some(v => v.length > 1))) return false;
        if (key === 'serials' && (value.length > 10 || new Set(value).size !== value.length)) return false;
      } else if (typeof initial[key] === 'object') {
        if (!value || Array.isArray(value) || Object.keys(value).sort().join('|') !== Object.keys(initial[key]).sort().join('|') || Object.values(value).some(v => typeof v !== 'string' || v.length > 100)) return false;
      } else if (typeof value !== 'string' || value.length > 500) return false;
    }
    return true;
  };
  return validValues(draft.values) && draft.history.every(validValues);
}
export const draftFor = (p, state) => state.workingAidDraftByPuzzle[p.id] || { values: initialValues(p), history: [] };
export function payloadFor(p, state) {
  const v = draftFor(p, state).values;
  switch (p.answerType) {
    case 'reference_id': return v.reference;
    case 'sequence_and_text': return { sequence: v.sequence, mechanism: v.mechanism };
    case 'unordered_id_pair': return v.serials;
    case 'time_bounds': return { lower: v.lower, upper: v.upper };
    case 'bijection': return v.mapping;
    case 'final_pair': return { actor: v.actor, order: v.order };
    default: return v.answer;
  }
}
export function incomplete(payload) {
  if (typeof payload === 'string') return !payload.trim();
  if (Array.isArray(payload)) return payload.length === 0;
  return !payload || Object.values(payload).some(incomplete);
}
export function renderAid(model, state, p, saveDraft, rerender) {
  const aid = p.workingAid;
  let draft = structuredClone(draftFor(p, state)), v = draft.values;
  const update = (changes, render = false) => {
    const next = { values: { ...v, ...changes }, history: [...draft.history, structuredClone(v)].slice(-20) };
    saveDraft(next); draft = next; v = draft.values; if (render) rerender();
  };
  const input = (name, label, attrs = {}) => labeledInput(`answer-${name}`, label, v[name], value => {
    update({ [name]: value });
  }, { maxlength: 500, ...attrs });
  const box = el('section', { className: 'aid', 'aria-label': 'Phone working aid' }, el('h2', {}, 'Working area'), paragraph(aid.instructions));
  const reset = () => { saveDraft({ values: initialValues(p), history: [...draft.history, structuredClone(v)].slice(-20) }); rerender(); };
  const undo = () => {
    if (!draft.history.length) return;
    saveDraft({ values: draft.history.at(-1), history: draft.history.slice(0, -1) }); rerender();
  };
  if (p.answerType === 'sequence_and_text') {
    box.append(el('ol', { className: 'movable', 'aria-label': 'Natural-process order' }, v.sequence.map((id, i) => el('li', {},
      el('span', {}, aid.initialCards.find(c => c.id === id).label),
      el('div', { className: 'move-actions' }, [-1, 1].map(direction => button(direction < 0 ? '↑ Up' : '↓ Down', () => {
        const sequence = [...v.sequence]; [sequence[i], sequence[i + direction]] = [sequence[i + direction], sequence[i]];
        update({ sequence }, true);
      }, 'secondary', { id: `move-${id}-${direction}`, disabled: direction < 0 ? i === 0 : i === v.sequence.length - 1, 'aria-label': `Move ${aid.initialCards.find(c => c.id === id).label} ${direction < 0 ? 'up' : 'down'}` })))))));
    box.append(labeledSelect('answer-mechanism', p.answerFields[1].label, v.mechanism, aid.mechanismOptions, mechanism => { update({ mechanism }, true); }));
  } else if (aid.kind === 'local_polybius_grid') {
    box.append(input('keyword', 'Your grid keyword'), button('Build grid from my keyword', () => {
      const chars = [...v.keyword.normalize('NFKC').toUpperCase()].filter(c => aid.alphabet.includes(c));
      update({ cells: [...new Set([...chars, ...aid.alphabet])] }, true);
    }));
    const grid = el('div', { className: 'grid', role: 'group', 'aria-label': 'Editable coordinate grid, row then column' }, el('span'), [1, 2, 3, 4, 5].map(i => el('span', {}, i)));
    for (let row = 0; row < 5; row++) {
      grid.append(el('span', {}, row + 1));
      for (let col = 0; col < 5; col++) {
        const i = row * 5 + col;
        grid.append(el('input', { id: `grid-${i}`, value: v.cells[i], maxlength: 1, 'aria-label': `Row ${row + 1}, column ${col + 1}`, autocomplete: 'off', autocapitalize: 'characters', oninput: event => {
          const cells = [...v.cells]; cells[i] = event.target.value.toUpperCase().slice(0, 1); update({ cells });
        } }));
      }
    }
    box.append(grid, input('answer', p.answerFields[0].label));
  } else if (p.answerType === 'unordered_id_pair') {
    const source = model.evidence.E08.bodyBlocks.find(b => b.id === 'before'), aliases = model.evidence.E08.bodyBlocks.find(b => b.id === 'merge').rows;
    const after = { title: 'After merge · original keys retained', columns: [...source.columns, { key: 'alias', label: 'Later alias' }], rows: source.rows.map(row => ({ ...row, alias: aliases.find(a => a.group === row.group).alias })) };
    box.append(el('div', { className: 'actions', role: 'group', 'aria-label': 'Inventory view' }, ['before', 'after'].map(tab => button(tab === 'before' ? 'Before merge' : 'After merge', () => update({ tab }, true), v.tab === tab ? '' : 'secondary', { id: `view-${tab}`, 'aria-pressed': String(v.tab === tab) }))), table(v.tab === 'after' ? after : source));
    box.append(el('fieldset', {}, el('legend', {}, p.answerFields[0].label), source.rows.map(row => el('label', { className: 'checkrow' }, el('input', {
      type: 'checkbox', id: `serial-${row.serial}`, name: 'serial', value: row.serial, checked: v.serials.includes(row.serial), onchange: event => {
        const serials = event.target.checked ? [...v.serials, row.serial] : v.serials.filter(id => id !== row.serial);
        update({ serials }, true);
      },
    }), row.serial))));
  } else if (p.answerType === 'bijection') {
    for (const person of aid.people) box.append(labeledSelect(`badge-${aid.people.indexOf(person)}`, person, v.mapping[person], aid.badgeOptions, badge => {
      const mapping = { ...v.mapping, [person]: badge }; update({ mapping }, true);
    }));
  } else if (p.answerType === 'time_bounds' || p.answerType === 'final_pair') {
    box.append(el('div', { className: 'row' }, p.answerFields.map(field => input(field.name, field.label, p.answerType === 'time_bounds' ? { placeholder: 'hh:mm or h:mm PM', inputmode: 'text' } : {}))));
  } else {
    if (aid.classificationOptions) box.append(labeledSelect('classification-choice', 'Choose a classification (or type below)', v.answer, aid.classificationOptions, answer => { update({ answer }, true); }));
    box.append(input(p.answerFields[0].name, p.answerFields[0].label));
  }
  if (['sequence_and_text', 'unordered_id_pair', 'bijection'].includes(p.answerType) || aid.kind === 'local_polybius_grid') {
    box.append(el('div', { className: 'actions' }, button('Undo', undo, 'secondary', { disabled: !draft.history.length }), button('Reset working area', reset)));
  }
  return box;
}
