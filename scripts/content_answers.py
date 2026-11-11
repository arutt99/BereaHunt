"""Development-time typed answer contract; phase 6 must test its runtime port.

This module has no UI, state, I/O or fuzzy matching. Public validation output must
never print payloads or canonical answers. Explicit aliases live in solution JSON.
"""

import re
import unicodedata


def normalize_text(value):
    if not isinstance(value, str):
        return None
    value = unicodedata.normalize('NFKC', value).casefold()
    value = ''.join(' ' if unicodedata.category(c).startswith('P') else c for c in value)
    return ' '.join(value.split())


def normalize_id(value):
    if not isinstance(value, str):
        return None
    value = unicodedata.normalize('NFKC', value).casefold().strip()
    # Internal whitespace/dashes in a literal identifier only; no surrounding prose.
    if not re.fullmatch(r'[a-z0-9]+(?:[\s\-\u2010-\u2015]*[a-z0-9]+)*', value):
        return None
    return re.sub(r'[\s\-\u2010-\u2015]+', '', value)


def matches_text(value, canonical, aliases):
    normalized = normalize_text(value)
    return normalized is not None and normalized in {normalize_text(v) for v in [canonical] + aliases}


def matches_id(value, canonical, aliases=None):
    return (normalize_id(value) is not None and normalize_id(value) == normalize_id(canonical)) or (
        bool(aliases) and matches_text(value, canonical, aliases))


def parse_time(value, shared_period=None):
    if not isinstance(value, str):
        raise ValueError('Time must be text')
    value = unicodedata.normalize('NFKC', value).strip().lower()
    match = re.fullmatch(r'(\d{1,2}):(\d{2})\s*([ap])\.?m\.?', value)
    if match:
        hour, minute, period = match.groups()
    else:
        match = re.fullmatch(r'(\d{1,2}):(\d{2})', value)
        if not match:
            raise ValueError('Use hour:minute with optional AM or PM')
        hour, minute = match.groups()
        period = shared_period
    hour, minute = int(hour), int(minute)
    if not 0 <= minute < 60:
        raise ValueError('Invalid minute')
    if period:
        if not 1 <= hour <= 12:
            raise ValueError('Invalid 12-hour time')
        hour = hour % 12 + (12 if period == 'p' else 0)
    elif not 0 <= hour <= 23:
        raise ValueError('Invalid 24-hour time')
    return hour * 60 + minute


def parse_bounds(payload):
    if isinstance(payload, str):
        parts = re.split(r'\s*(?:[\-\u2010-\u2015]|\bto\b)\s*', payload.strip(), flags=re.I)
    elif isinstance(payload, dict) and set(payload) == {'lower', 'upper'}:
        parts = [payload['lower'], payload['upper']]
    elif isinstance(payload, list):
        parts = payload
    else:
        raise ValueError('Two time bounds required')
    if len(parts) != 2 or not all(isinstance(v, str) for v in parts):
        raise ValueError('Two time bounds required')
    trailing = re.search(r'([ap])\.?m\.?\s*$', parts[1], re.I)
    shared = trailing[1].lower() if trailing else None
    # A shared trailing period applies to both 12-hour fields, never a 24-hour field.
    return [parse_time(parts[0], shared), parse_time(parts[1])]


def check_answer(solution, payload):
    kind, answer, aliases = solution['answerType'], solution['canonical'], solution['acceptedAliases']
    try:
        if kind == 'reference_id':
            return matches_id(payload, answer, aliases)
        if kind == 'text':
            return matches_text(payload, answer, aliases)
        if kind == 'sequence_and_text':
            return (isinstance(payload, dict) and set(payload) == {'sequence', 'mechanism'} and
                    payload['sequence'] == answer['sequence'] and
                    matches_text(payload['mechanism'], answer['mechanism'], aliases))
        if kind == 'unordered_id_pair':
            return (isinstance(payload, list) and len(payload) == 2 and
                    len({normalize_id(v) for v in payload}) == 2 and
                    {normalize_id(v) for v in payload} == {normalize_id(v) for v in answer})
        if kind == 'time_bounds':
            return parse_bounds(payload) == [parse_time(v) for v in answer]
        if kind == 'bijection':
            return (isinstance(payload, dict) and set(payload) == set(answer) and
                    all(matches_id(payload[k], v) for k, v in answer.items()))
        if kind == 'final_pair':
            return (isinstance(payload, dict) and set(payload) == {'actor', 'order'} and
                    matches_text(payload['actor'], answer['actor'], aliases['actor']) and
                    matches_id(payload['order'], answer['order'], aliases['order']))
    except (ValueError, TypeError, KeyError):
        return False
    return False
