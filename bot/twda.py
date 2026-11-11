#!/usr/bin/env python3
# twda.py v1.0.0 (10 Nov 2026) -- the TWDA reader twd-profile.py and twd-archetypes.py share.
#
# The input is KRCG's v5 TWDA, fetched into bot/ as twda.json (third-party data, never committed; root CLAUDE.md):
#     curl -fL -o twda.json https://static.krcg.org/data/v5/twda.json
# A dict of decks keyed by the TWDA id (the ids vtes-skill's classification names), each with its event (date, ...), player,
# name and ONE card list: {id, count, kind: 'Crypt' | 'Library', printed_name, ...}. Since 8 Nov 2026 KRCG serves the same
# file at data/twda.json; its old list-shaped export (library.cards[].cards, crypt.cards) is frozen at data/v4/twda.json and
# is refused here, so no profile is built from it unnoticed (LESSONS L-75: a data file's name is a contract with its reader).
#
# load(kr) -> {deck id: {'id', 'date', 'lib': [(name, count)], 'crypt': [(card id, count)]}}. One source keyed by id, so no
# deck is counted twice (the old list + dict merge matched decks by date + player + name, and the archive's corrected names
# made the same deck look new: 69 decks twice on the 8 Nov files). A library card's name is vtes.json's `name` for its KRCG id,
# the compiler's key for the card -- never its `_name` (the old merge took the article-last `_name`, 'Barrens, The', which no
# cardfx key matches: the shipped profile's 14 dead keys) and never the archive's spelling. A card can still have other cardfx
# names the bot records ('Pentex(TM) Subversion'); reading the profile by KRCG id is the rebuild's (BOARD). An id vtes.json
# lacks keeps its printed name and is reported.
#
#     python3 twda.py --self-test        # the reader on fixtures (temporary files only); CI runs it
#     python3 twda.py --check FILE       # FILE read against vtes.json beside it: decks, unknown ids (CI, on KRCG's file)
import json, os, sys

VERSION = '1.0.0'
FETCH = 'curl -fL -o twda.json https://static.krcg.org/data/v5/twda.json'


class TwdaError(Exception):
    pass


def parse(raw, kr):
    """raw: twda.json parsed; kr: {KRCG card id: vtes.json card}. Returns (decks, unknown ids) or raises TwdaError."""
    if isinstance(raw, list):
        raise TwdaError("a JSON list, not a dict of decks -- KRCG's old list-shaped TWDA (data/v4/twda.json, frozen since 8 Nov "
                        "2026) has that shape -- " + FETCH)
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


def _fail(msg):
    print('twda: ' + msg, file=sys.stderr)
    sys.exit(2)


def read(kr, path):
    """(decks, unknown) from the file at path; a missing, non-JSON or wrong file stops the tool with the fetch command (exit 2)."""
    try:
        with open(path, encoding='utf-8') as f:
            raw = json.load(f)
    except FileNotFoundError:
        _fail('%s is missing -- %s (root CLAUDE.md, "Data that is not in git")' % (path, FETCH))
    except ValueError as e:   # JSONDecodeError and UnicodeDecodeError: a failed download (an HTML error page), a cut-off file
        _fail('%s is not JSON (%s) -- a failed or cut-off download? %s' % (path, type(e).__name__, FETCH))
    try:
        return parse(raw, kr)
    except TwdaError as e:
        _fail('%s: %s' % (path, e))


def load(kr, path='twda.json'):
    """The decks of twda.json beside the tools; ids vtes.json lacks are reported (their library cards keep their printed name)."""
    decks, unknown = read(kr, path)
    if unknown:
        print('twda: %d card ids are not in vtes.json (library cards keep their printed name): %s'
              % (len(unknown), sorted(unknown, key=str)[:8]))
    return decks


def check(path):
    """CI's drift check on KRCG's current file: it reads, it holds decks, and every card id is in vtes.json. Exit 0 / 1 / 2."""
    try:
        with open('vtes.json', encoding='utf-8') as f:
            kr = {c['id']: c for c in json.load(f)}
    except (FileNotFoundError, ValueError) as e:
        _fail('vtes.json beside twda.py is missing or unreadable (%s) -- node krcg-v5.js builds it' % type(e).__name__)
    decks, unknown = read(kr, path)
    newest = max((d['date'] for d in decks.values()), default='')
    print('twda.py v%s --check %s: %d decks (the newest %s), %d card ids not in vtes.json %s'
          % (VERSION, path, len(decks), newest or '-', len(unknown), sorted(unknown, key=str)[:8] if unknown else ''))
    return 0 if decks and not unknown else 1


def self_test():
    import contextlib, io, tempfile
    kr = {100001: {'name': 'The Barrens', '_name': 'Barrens, The'}, 100002: {'name': 'Anarch Manifesto, An', '_name': 'Anarch Manifesto, An'},
          200001: {'name': 'Aabbt Kindred (G2)', '_name': 'Aabbt Kindred', 'clans': ['Ministry']}}
    fails, n = [], [0]

    def ok(cond, what):
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
        'd2': {'id': 'd2', 'event': {'date': '2026-10-25'}, 'player': 'A', 'name': 'Deck', 'cards': []},   # d1's date, player, name
        'd3': {'id': 'd3', 'event': None, 'player': 'B', 'name': 'Other', 'cards': []},
    }
    decks, unknown = parse(raw, kr)
    ok(sorted(decks) == ['d1', 'd2', 'd3'], 'one deck per id: two decks with the same date, player and name stay two')
    ok(decks['d1']['lib'] == [('The Barrens', 2), ('Anarch Manifesto, An', 1), ('Not In Vtes', 1)],
       "library names are vtes.json's name by id (not its _name, not the archive's spelling); an unknown id keeps its printed name")
    ok(decks['d1']['crypt'] == [(200001, 3), (200999, 1)], 'the crypt is (card id, count), unknown ids kept')
    ok(decks['d1']['date'] == '2026-10-25' and decks['d3']['date'] == '', 'the date is the event date, empty without one')
    ok(unknown == {100999, 200999}, 'every id vtes.json lacks is reported')
    v4 = [{'id': 'd1', 'date': '2026-10-25', 'library': {'count': 0, 'cards': []}, 'crypt': {'count': 0, 'cards': []}}]
    for bad, what, says in ((v4, "KRCG's list-shaped v4 TWDA", "old list-shaped TWDA (data/v4"), ({}, 'an empty dict', 'expected a dict'),
                            ({'d1': {'id': 'd1'}}, 'a deck without a card list', "deck 'd1' has no card list"), ('twda', 'a string', 'expected a dict')):
        try:
            parse(bad, kr)
            ok(False, 'refuses ' + what)
        except TwdaError as e:
            ok(says in str(e) and FETCH in str(e), 'the refusal of ' + what + ' says what the file is and names the fetch command')
    # load() on real files: a missing file, a failed download, a cut-off file, the v4 list (exit 2, the fetch command, on stderr);
    # a good file with an unknown id (the report on stdout, the decks returned)
    with tempfile.TemporaryDirectory() as tmp:
        files = {'html.json': '<!DOCTYPE html><title>404 Not Found</title>', 'cut.json': json.dumps(raw)[:60],
                 'v4.json': json.dumps(v4), 'good.json': json.dumps(raw)}
        for nm, body in files.items():
            with open(os.path.join(tmp, nm), 'w', encoding='utf-8') as f:
                f.write(body)
        for nm, what in (('missing.json', 'a missing file'), ('html.json', 'an HTML error page'), ('cut.json', 'a cut-off file'),
                         ('v4.json', 'the v4 list')):
            err = io.StringIO()
            try:
                with contextlib.redirect_stderr(err):
                    load(kr, os.path.join(tmp, nm))
                ok(False, 'load() stops on ' + what)
            except SystemExit as e:
                ok(e.code == 2 and FETCH in err.getvalue(), 'load() stops on %s with exit 2 and the fetch command' % what)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            got = load(kr, os.path.join(tmp, 'good.json'))
        ok(sorted(got) == ['d1', 'd2', 'd3'] and '2 card ids are not in vtes.json' in out.getvalue(), 'load() returns the decks and reports unknown ids')
    print('twda.py v%s --self-test: %d checks, %d failed' % (VERSION, n[0], len(fails)))
    for f in fails:
        print('  FAIL ' + f)
    return 1 if fails else 0


if __name__ == '__main__':
    if sys.argv[1:] == ['--self-test']:
        sys.exit(self_test())
    if len(sys.argv) == 3 and sys.argv[1] == '--check':
        sys.exit(check(sys.argv[2]))
    print('usage: python3 twda.py --self-test | --check FILE   (the TWD tools import this file; see its header)')
    sys.exit(2)
