#!/usr/bin/env python3
# twda.py v1.0.0 (10 Nov 2026) -- the TWDA reader twd-profile.py and twd-archetypes.py share.
#
# The input is KRCG's v5 TWDA, fetched into bot/ as twda.json (third-party data, never committed; root CLAUDE.md):
#     curl -o twda.json https://static.krcg.org/data/v5/twda.json
# A dict of decks keyed by the TWDA id (the ids vtes-skill's classification names), each with its event (date, ...), player,
# name and ONE card list: {id, count, kind: 'Crypt' | 'Library', printed_name, ...}. Since 8 Nov 2026 KRCG serves the same
# file at data/twda.json; its old list-shaped export (library.cards[].cards, crypt.cards) is frozen at data/v4/twda.json and
# is refused here, so no profile is built from it unnoticed (LESSONS L-75: a data file's name is a contract with its reader).
#
# load(kr) -> {deck id: {'id', 'date', 'lib': [(name, count)], 'crypt': [(card id, count)]}}. One source keyed by id, so no
# deck is counted twice (the old list + dict merge matched decks by date + player + name, and the archive's corrected names
# made the same deck look new: 69 decks twice on the 8 Nov files). A library card's name is vtes.json's `name` for its KRCG id
# -- the compiler's cardfx key, the name the bot looks up -- never the archive's spelling (the v4 export wrote 'Barrens, The',
# which no cardfx key matches: 14 dead keys in the shipped profile). An id vtes.json lacks keeps its printed name and is reported.
#
#     python3 twda.py --self-test    # the reader on in-memory fixtures (no files needed); CI runs it
import json, sys

VERSION = '1.0.0'
FETCH = 'curl -o twda.json https://static.krcg.org/data/v5/twda.json'


class TwdaError(Exception):
    pass


def parse(raw, kr):
    """raw: twda.json parsed; kr: {KRCG card id: vtes.json card}. Returns (decks, unknown ids) or raises TwdaError."""
    if isinstance(raw, list):
        raise TwdaError("this is KRCG's old list-shaped TWDA (data/v4/twda.json, frozen since 8 Nov 2026), not the v5 one -- " + FETCH)
    if not isinstance(raw, dict) or not raw:
        raise TwdaError('not a TWDA: expected a dict of decks keyed by id -- ' + FETCH)
    decks, unknown = {}, set()
    for k, v in raw.items():
        if not isinstance(v, dict) or not isinstance(v.get('cards'), list):
            raise TwdaError('deck %r has no card list, so this is not KRCG\'s v5 TWDA -- %s' % (k, FETCH))
        lib, cry = [], []
        for c in v['cards']:
            cid, n = c.get('id'), c.get('count', 1)
            kc = kr.get(cid)
            if kc is None:
                unknown.add(cid)
            if c.get('kind') == 'Crypt':
                cry.append((cid, n))
                continue
            name = kc.get('name') if kc is not None else c.get('printed_name')
            if name:
                lib.append((name, n))
        decks[k] = {'id': k, 'date': (v.get('event') or {}).get('date') or '', 'lib': lib, 'crypt': cry}
    return decks, unknown


def load(kr, path='twda.json'):
    """twda.json beside the tools, parsed; a missing or wrong file stops the tool with the fetch command (exit 2)."""
    try:
        with open(path, encoding='utf-8') as f:
            raw = json.load(f)
    except FileNotFoundError:
        print('twda: %s is missing -- %s (root CLAUDE.md, "Data that is not in git")' % (path, FETCH), file=sys.stderr)
        sys.exit(2)
    try:
        decks, unknown = parse(raw, kr)
    except TwdaError as e:
        print('twda: %s: %s' % (path, e), file=sys.stderr)
        sys.exit(2)
    if unknown:
        print('twda: %d card ids are not in vtes.json (library cards keep their printed name): %s'
              % (len(unknown), sorted(unknown, key=str)[:8]))
    return decks


def self_test():
    kr = {100001: {'name': 'The Barrens'}, 100002: {'name': 'Anarch Manifesto, An'}, 200001: {'name': 'Aabbt Kindred (G2)', 'clans': ['Ministry']}}
    fails, n = [], [0]

    def check(cond, what):
        n[0] += 1
        if not cond:
            fails.append(what)

    raw = {
        'd1': {'id': 'd1', 'event': {'date': '2026-10-25'}, 'player': 'A', 'name': 'Deck', 'cards': [
            {'id': 100001, 'count': 2, 'kind': 'Library', 'printed_name': 'The Barrens'},
            {'id': 100002, 'count': 1, 'kind': 'Library', 'printed_name': 'An Anarch Manifesto'},
            {'id': 100999, 'count': 1, 'kind': 'Library', 'printed_name': 'Not In Vtes'},
            {'id': 200001, 'count': 3, 'kind': 'Crypt', 'printed_name': 'Aabbt Kindred'},
            {'id': 200999, 'count': 1, 'kind': 'Crypt', 'printed_name': 'Nobody'}]},
        'd2': {'id': 'd2', 'event': None, 'player': 'A', 'name': 'Deck', 'cards': []},
    }
    decks, unknown = parse(raw, kr)
    check(sorted(decks) == ['d1', 'd2'], 'one deck per id, even when two share date, player and name')
    check(decks['d1']['lib'] == [('The Barrens', 2), ('Anarch Manifesto, An', 1), ('Not In Vtes', 1)],
          "library names come from vtes.json by id (the compiler's key), an unknown id keeps its printed name")
    check(decks['d1']['crypt'] == [(200001, 3), (200999, 1)], 'the crypt is (card id, count), unknown ids kept')
    check(decks['d1']['date'] == '2026-10-25' and decks['d2']['date'] == '', 'the date is the event date, empty without one')
    check(unknown == {100999, 200999}, 'every id vtes.json lacks is reported')
    v4 = [{'id': 'd1', 'date': '2026-10-25', 'library': {'count': 0, 'cards': []}, 'crypt': {'count': 0, 'cards': []}}]
    for bad, what, says in ((v4, "KRCG's list-shaped v4 TWDA", "old list-shaped TWDA (data/v4"), ({}, 'an empty dict', 'expected a dict'),
                            ({'d1': {'id': 'd1'}}, 'a deck without a card list', "deck 'd1' has no card list"), ('twda', 'a string', 'expected a dict')):
        try:
            parse(bad, kr)
            check(False, 'refuses ' + what)
        except TwdaError as e:
            check(says in str(e) and FETCH in str(e), 'the refusal of ' + what + ' says what the file is and names the fetch command')
    print('twda.py v%s --self-test: %d checks, %d failed' % (VERSION, n[0], len(fails)))
    for f in fails:
        print('  FAIL ' + f)
    return 1 if fails else 0


if __name__ == '__main__':
    if sys.argv[1:] == ['--self-test']:
        sys.exit(self_test())
    print('usage: python3 twda.py --self-test   (the TWD tools import this file; see its header)')
    sys.exit(2)
