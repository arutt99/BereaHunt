// Exact typed contracts. No fuzzy matching, substring checks or field oracle.
export const normalizeText = value => typeof value === 'string'
  ? value.normalize('NFKC').toLowerCase().replace(/\p{P}/gu, ' ').trim().replace(/\s+/gu, ' ') : null;
export function normalizeId(value) {
  if (typeof value !== 'string') return null;
  const id = value.normalize('NFKC').toLowerCase().trim();
  return /^[a-z0-9]+(?:[\s\-\u2010-\u2015]*[a-z0-9]+)*$/u.test(id) ? id.replace(/[\s\-\u2010-\u2015]+/gu, '') : null;
}
const textMatch = (v, c, aliases = []) => normalizeText(v) !== null && [c, ...aliases].some(a => normalizeText(a) === normalizeText(v));
const idMatch = (v, c, aliases = []) => (normalizeId(v) !== null && normalizeId(v) === normalizeId(c)) || (aliases.length > 0 && textMatch(v, c, aliases));
const keysAre = (v, keys) => !!v && !Array.isArray(v) && typeof v === 'object' && Object.keys(v).sort().join('|') === [...keys].sort().join('|');
export function parseTime(value, sharedPeriod = null) {
  if (typeof value !== 'string') throw Error('TIME_FORMAT');
  const v = value.normalize('NFKC').trim().toLowerCase();
  const explicit = /^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/.exec(v);
  const match = explicit || /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!match) throw Error('TIME_FORMAT');
  let hour = Number(match[1]);
  const minute = Number(match[2]), period = explicit ? explicit[3] : sharedPeriod;
  if (minute > 59 || (period ? hour < 1 || hour > 12 : hour > 23)) throw Error('TIME_FORMAT');
  if (period) hour = hour % 12 + (period === 'p' ? 12 : 0);
  return hour * 60 + minute;
}
export function parseBounds(payload) {
  let parts;
  if (typeof payload === 'string') parts = payload.trim().split(/\s*(?:[\-\u2010-\u2015]|\bto\b)\s*/iu);
  else if (Array.isArray(payload)) parts = payload;
  else if (keysAre(payload, ['lower', 'upper'])) parts = [payload.lower, payload.upper];
  if (!parts || parts.length !== 2 || parts.some(p => typeof p !== 'string')) throw Error('TIME_FORMAT');
  const period = /([ap])\.?m\.?\s*$/i.exec(parts[1])?.[1].toLowerCase();
  return [parseTime(parts[0], period), parseTime(parts[1])];
}
export function checkAnswer(solution, payload) {
  const { answerType: type, canonical: c, acceptedAliases: a } = solution;
  try {
    switch (type) {
      case 'reference_id': return idMatch(payload, c, a);
      case 'text': return textMatch(payload, c, a);
      case 'sequence_and_text': return keysAre(payload, ['sequence', 'mechanism']) &&
        Array.isArray(payload.sequence) && JSON.stringify(payload.sequence) === JSON.stringify(c.sequence) && textMatch(payload.mechanism, c.mechanism, a);
      case 'unordered_id_pair': return Array.isArray(payload) && payload.length === 2 &&
        new Set(payload.map(normalizeId)).size === 2 && payload.every(v => c.some(id => normalizeId(v) !== null && normalizeId(v) === normalizeId(id)));
      case 'time_bounds': return JSON.stringify(parseBounds(payload)) === JSON.stringify(c.map(v => parseTime(v)));
      case 'bijection': return keysAre(payload, Object.keys(c)) && Object.entries(c).every(([k, v]) => idMatch(payload[k], v));
      case 'final_pair': return keysAre(payload, ['actor', 'order']) && textMatch(payload.actor, c.actor, a.actor) && idMatch(payload.order, c.order, a.order);
      default: return false;
    }
  } catch { return false; }
}
