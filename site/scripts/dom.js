// Content is always text, never interpreted HTML.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'className') node.className = value;
    else if (['value', 'checked', 'disabled', 'open', 'hidden'].includes(key)) node[key] = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) if (child !== undefined && child !== null && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
export const button = (label, action, className = 'secondary', attrs = {}) => el('button', { type: 'button', className, onclick: action, ...attrs }, label);
export const paragraph = text => el('p', {}, text);
export function cellText(value) {
  if (Array.isArray(value)) return value.map(cellText).join(', ');
  if (value && typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}: ${cellText(v)}`).join('; ');
  return String(value);
}
export function table(block) {
  return el('div', { className: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': block.title },
    el('table', {}, el('caption', {}, block.title),
      el('thead', {}, el('tr', {}, block.columns.map(c => el('th', { scope: 'col' }, c.label)))),
      el('tbody', {}, block.rows.map(row => el('tr', {}, block.columns.map(c => el('td', {}, cellText(row[c.key]))))))));
}
export function labeledInput(id, label, value, onInput, attrs = {}) {
  return el('div', {}, el('label', { for: id }, label), el('input', { id, name: id, value, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', oninput: event => onInput(event.target.value), ...attrs }));
}
export function labeledSelect(id, label, value, options, onChange) {
  return el('div', {}, el('label', { for: id }, label), el('select', { id, name: id, onchange: event => onChange(event.target.value) },
    el('option', { value: '' }, 'Choose…'), options.map(option => el('option', { value: option, ...(value === option ? { selected: true } : {}) }, option))));
}
