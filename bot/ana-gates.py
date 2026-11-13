#!/usr/bin/env python3
# ana-gates.py v1.1.0 <dir>... -- the series audits as gates: one PASS / FAIL line each, exit 1 when any fails (round C2, 11 Nov 2026;
#   spec-cleanup-2026-10-20.md T10). The release gate on the 240-match client design (CLAUDE.md "Gates"): run it on the new bytes'
#   sim directory beside `ana-sim-diff.py OLD NEW`. It imports the audits -- ana-block.py, ana-ledger.py, ana-inv.py, ana-windows.py,
#   ana-combat2.py, each one's audit(S) -- so every count has one source. What fails:
#     matches     a match file without a result row, or one that ended stuck / timeout / crashed; on the sim also a design.json spec
#                 with no match file (a child that dies writes none) and any summary.json problem
#     zeroPool    a bot that decided at pool <= 0 before its own oust (the sim's rule, recounted from the rows on either table); on the
#                 sim also a recount that disagrees with the result rows' own list
#     block       any ana-block row but its four counts (BLOCK_COUNTS): the R-rows are the violations, the gate is 0
#     ledger      any ana-ledger row that is neither a balanced or explained count (LEDGER_COUNTS) nor a known lead (LEDGER_LEADS):
#                 VANISHED, UNEXPLAINED, no actor row, names NULL / WRONG, RANGE DISAGREES, VICTIM LOST > STOLE, a bleed through that
#                 no seat took before the game's end. Default deny: a row a later audit adds is a gate until it is classed here.
#     handshake   ana-combat2's integrity under 100 % as it prints it (rounded): a broken combat line (CLAUDE.md, the combat handshake
#                 rule; the stray combat row -- BOARD, a rushed bot that meant to block -- is the known few that rounding absorbs)
#     invariants  a flag kind outside INV_KNOWN, or more flags than 1 in 20 matches on the sim (its series since v0.6.213 measured 1 in
#                 27 to 1 in 150) / 1 in 3 on the arena (v0.6.180's arena baseline, HOWTO) -- and never fewer than one: a series under
#                 20 matches (the V5 smoke's 12) may carry one known flag (v1.1.0, Johan 12 Nov; v1.0.0 allowed none there, so a single
#                 stray row failed a series). Wider View's burn-for-pool left INV_KNOWN with v1.1.0: bot v0.6.219's checker books the
#                 blood a burn's note already shows (the pool-print + pool-drift +N pair was that double count), so such a flag is new.
#     windows     the arena: an actor's window that ran out and went through (v0.6.206's gate of 0); the sim table: information only --
#                 most bot windows run out there (BOARD, a measurement debt)
#   Information lines: the ledger's leads and its explained differences, the step handshake's safety net, the post-game ousts.
#   --self-test: a clean synthetic series PASSes every gate; each planted fault turns its own line FAIL (the game's end included).
import collections, glob, importlib.util, json, os, re, shutil, sys, tempfile

VERSION = '1.1.0'
HERE = os.path.dirname(os.path.abspath(__file__))

def _load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(HERE, name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod

BLOCK, LEDGER, INV, WINDOWS, COMBAT = (_load(n) for n in ('ana-block', 'ana-ledger', 'ana-inv', 'ana-windows', 'ana-combat2'))

BLOCK_COUNTS = {'actions', 'blocked', 'attempted but through', 'blocked with no intercept card'}
LEDGER_COUNTS = {'1 bleed: equal', '1 bleed: more, actor modifiers', '1 bleed: less, target reduced', '1 bleed: through, reduced to nothing',
                 '1 bleed: through after game ended', '2 names: right', '3 combat: dealt==taken', '3 combat: taken<dealt',
                 '3 combat: taken>dealt', '4 steal: stole', '4 steal: stolenFromMe', '4 steal pairs: equal', '5 creep: placed',
                 '5 creep: victim burns'}   # the dealt / taken differences: prevent, Crows, a combat that ends (the ledger's header)
LEDGER_LEADS = {'4 steal pairs: STOLE > VICTIM LOST': 'BOARD: steal pair under a combat ends, O-12',
                '4 steal pairs: no victim row': 'the stray combat row: BOARD, a rushed bot that meant to block',
                '2 names: no reciprocal row': 'the stray combat row: BOARD, a rushed bot that meant to block'}
INV_KNOWN = {'strike-taken': 'the stray combat row: BOARD, a rushed bot that meant to block'}   # v1.1.0: Wider View's two kinds fixed at their cause (bot v0.6.219)
INV_CAP = {'sim': 20, 'arena': 3}   # at most one flag in N matches, and at least one (v1.1.0)
FAILED_END = ('stuck', 'timeout')

def _rows(f):
    return [json.loads(line) for line in open(f) if line.strip()]

def _zero_pool(rows):   # elysium-bot-sim.js v1.0.1's rule, in trace order: a decide at pool <= 0 before the bot's own `ousted` row
    gone, out = set(), []
    for x in rows:
        if x.get('type') == 'ousted': gone.add(x.get('bot')); continue
        d = x.get('data') if isinstance(x.get('data'), dict) else {}
        p = d.get('pool')
        if (x.get('type') == 'decide' and isinstance(p, (int, float)) and not isinstance(p, bool) and p <= 0 and x.get('bot') not in gone
                and all(b != x.get('bot') for b, _ in out)):
            out.append((x.get('bot'), x.get('round')))
    return out

def _list(counter, keys):
    return ', '.join('%s %d' % (k, counter[k]) for k in keys)

def gates(S):
    """-> (lines, title): lines are (verdict, name, text); verdict PASS / FAIL / info."""
    files = sorted(glob.glob(S + '/match-*.jsonl')); n = len(files); L = []
    per = []   # (file, result, zeroPool recount)
    for f in files:
        rows = _rows(f)
        res = next((r.get('data') or {} for r in rows if r.get('type') == 'result'), None)
        per.append((os.path.basename(f), res, _zero_pool(rows)))
    have = [r for _, r, _ in per if r is not None]
    sim = next((r.get('sim') for r in have if r.get('sim')), None)
    bots = sorted({str(r.get('bot')) for r in have if r.get('bot')})
    title = '%s: %d matches, %s%s' % (S, n, ('the sim table (sim %s)' % sim) if sim else 'no sim marker (an arena series)',
                                     (', bot ' + '/'.join(bots)) if bots else '')
    # matches
    missing = [f for f, r, _ in per if r is None]
    failed = [f for f, r, _ in per if r is not None and (r.get('reason') in FAILED_END or r.get('crash'))]
    reasons = collections.Counter(str(r.get('reason')) for r in have)
    absent, problems = [], []
    try: specs = json.load(open(os.path.join(S, 'design.json'))).get('specs') or []
    except (OSError, ValueError, AttributeError): specs = []
    if specs:
        present = {int(m.group(1)) for f, _, _ in per for m in [re.match(r'match-(\d+)\.jsonl$', f)] if m}
        absent = sorted({int(s.get('idx')) for s in specs if isinstance(s, dict) and s.get('idx') is not None} - present)
    try: problems = json.load(open(os.path.join(S, 'summary.json'))).get('problems') or []
    except (OSError, ValueError, AttributeError): problems = []
    ok = n > 0 and not missing and not failed and not absent and not problems
    L.append(('PASS' if ok else 'FAIL', 'matches', '%d of %d files ended (%s)%s%s%s%s' % (n - len(missing) - len(failed), n,
             ', '.join('%s %d' % kv for kv in sorted(reasons.items())) or 'no match files',
             ('; ' + str(len(specs)) + ' in design.json') if specs else '',
             ('; no file for spec ' + ' '.join(map(str, absent[:12]))) if absent else '',
             ('; no result row: ' + ' '.join(missing[:8])) if missing else '',
             ('; failed: ' + ' '.join(failed[:8])) if failed else '') + (('; summary.json problems: %d' % len(problems)) if problems else '')))
    # zeroPool
    zp = [(f, b, rd) for f, _, z in per for b, rd in z]
    disagree = [f for f, r, z in per if r is not None and isinstance(r.get('zeroPool'), list) and len(r['zeroPool']) != len(z)]
    L.append(('PASS' if not zp and not disagree else 'FAIL', 'zeroPool', '%d bots decided at pool <= 0 before their own oust%s%s' % (len(zp),
             (': ' + ', '.join('%s %s r%s' % x for x in zp[:6])) if zp else '',
             ('; the result rows say otherwise in ' + ' '.join(disagree[:6])) if disagree else '')))
    # block
    R, _ex = BLOCK.audit(S)
    bad = sorted(k for k in R if k not in BLOCK_COUNTS and R[k])
    L.append(('PASS' if not bad else 'FAIL', 'block', ('%d violations in %d actions' % (sum(R[k] for k in bad), R['actions'])) +
             ((': ' + _list(R, bad)) if bad else '')))
    # ledger
    G = LEDGER.audit(S)
    bad = sorted(k for k in G if k not in LEDGER_COUNTS and k not in LEDGER_LEADS and G[k])
    L.append(('PASS' if not bad else 'FAIL', 'ledger', ('%d faults' % sum(G[k] for k in bad)) + ((': ' + _list(G, bad)) if bad else
             ' (VANISHED, UNEXPLAINED, unpaired before the end, names, range, victim lost > stole); balanced: bleeds %d, combat names %d' %
             (G['1 bleed: equal'], G['2 names: right']))))
    leads = [k for k in sorted(LEDGER_LEADS) if G[k]]
    L.append(('info', 'ledger', 'leads, not gates: %s; explained: through after the game ended %d, combat taken < dealt %d, taken > dealt %d' % (
        ', '.join('%s %d (%s)' % (k, G[k], LEDGER_LEADS[k]) for k in leads) or 'none', G['1 bleed: through after game ended'],
        G['3 combat: taken<dealt'], G['3 combat: taken>dealt'])))
    # handshake
    A = COMBAT.audit(S); tot = A['matched'] + A['unmatched']; pct = round(100 * A['matched'] / max(1, tot))
    if not tot: L.append(('PASS', 'handshake', 'no combat rounds to pair'))
    else: L.append(('PASS' if pct == 100 else 'FAIL', 'handshake', '%d of %d combat rounds paired with the opponent\'s row (%d %%, rounded as '
                    'ana-combat2 prints it); %d without' % (A['matched'], tot, pct, A['unmatched'])))
    L.append(('info', 'handshake', 'step rows with hs %d; waits that ran into the safety net: %s' % (A['hsrows'],
             ', '.join('%s %d' % kv for kv in sorted(A['hsmiss'].items())) or 'none')))
    # invariants
    c, _ex, m = INV.audit(S)
    flags = sum(c.values()); every = INV_CAP['sim' if sim else 'arena']; cap = max(1, m // every)
    unknown = sorted(k for k in c if k not in INV_KNOWN)
    L.append(('PASS' if flags <= cap and not unknown else 'FAIL', 'invariants', '%d flags in %d matches (at most %d, 1 in %d on the %s)%s%s' % (
        flags, m, cap, every, 'sim' if sim else 'arena', (': ' + ', '.join('%s %d' % (k, v) for k, v in c.most_common())) if flags else '',
        ('; not a known kind: ' + ', '.join(unknown)) if unknown else '')))
    # windows
    C, stale, _slow, _files = WINDOWS.audit(S)
    ran = C['modifier RAN OUT, THROUGH'] + C['total RAN OUT, THROUGH']
    text = 'ran out and went through: modifier %d of %d, total %d of %d; stale-answer rows %d' % (
        C['modifier RAN OUT, THROUGH'], C['modifier'], C['total RAN OUT, THROUGH'], C['total'], sum(stale.values()))
    if sim: L.append(('info', 'windows', 'the sim table, not a gate (BOARD): ' + text))
    else: L.append(('PASS' if not ran else 'FAIL', 'windows', text))
    post = sum(len(r.get('postGameOusts') or []) for r in have)
    L.append(('info', 'post-game', '%d ousts after the game ended (the winner on its own last action)' % post))
    return L, title

def report(S):
    L, title = gates(S)
    print('ana-gates.py v%s -- %s' % (VERSION, title))
    for v, name, text in L: print('%-5s %-11s %s' % (v, name, text))
    g = [v for v, _, _ in L if v != 'info']; f = g.count('FAIL')
    print('gates: %s (%d of %d)' % ('PASS' if not f else 'FAIL', len(g) - f, len(g)))
    return f == 0

# ---------- the self-test: a synthetic series, then one planted fault at a time ----------
N_SELF = 20   # matches per synthetic series: the sim's invariant cap allows exactly one flag (and a 12-match one, its floor of one)

def _match(k, plant=None, sim=True):
    rows = []
    def row(t, bot, ty, data): rows.append({'t': t, 'match': k, 'bot': bot, 'type': ty, 'data': data})
    def bleed(t, n): row(t, 'B1', 'through', {'vamp': 'X', 'n': n, 'final': n, 'card': None})
    for i, b in enumerate(('B1', 'B2', 'B3')): row(0, b, 'manifest', {'deck': 'malkavian', 'seat': i + 1})
    bleed(1000, 2)
    row(1500, 'B2', 'took-bleed', {'n': {'more': 3, 'less': 1}.get(plant, 2)})
    if plant == 'stealth': row(900, 'B1', 'play', {'window': 'stealth', 'card': 'Lost in Crowds', 'vamp': 'X'})
    if plant in ('unpaired', 'vanished'): bleed(2000, 1)
    if plant == 'vanished': row(2500, 'B2', 'block-made', {'vamp': 'Y'})
    if plant == 'window': row(3000, 'B1', 'bleed-total', {'n': 1}); bleed(6000, 1); row(6500, 'B3', 'took-bleed', {'n': 1})
    if plant in ('flag', 'flags'): row(2600, 'B1', 'inv-flag', {'inv': 'strike-taken', 'taken': 2, 'myStrike': 1})
    if plant == 'wv': row(2600, 'B1', 'inv-flag', {'inv': 'pool-drift', 'diff': 1})   # v1.1.0: Wider View's two kinds are no known kinds now --
    if plant == 'wvp': row(2600, 'B1', 'inv-flag', {'inv': 'pool-print', 'via': 'burn-for-pool'})   # both were in v1.0.0's INV_KNOWN (it passes them)
    if plant == 'kind': row(2600, 'B1', 'inv-flag', {'inv': 'blood-vanished'})
    x1 = {'round': 1, 'vamp': 'X', 'opp': None if plant == 'names' else 'Y', 'range': 'close', 'dealt': 1, 'taken': 1, 'stole': 1 if plant == 'victimlost' else 0}
    x2 = {'round': 1, 'vamp': 'Y', 'opp': 'X', 'range': 'long' if plant == 'range' else 'close', 'dealt': 1, 'taken': 1, 'stolenFromMe': 2 if plant == 'victimlost' else 0}
    row(10000, 'B1', 'combat-round', x1); row(10100, 'B2', 'combat-round', x2)
    if plant == 'stray': row(10200, 'B3', 'combat-round', {'round': 1, 'vamp': 'Z', 'opp': 'Q', 'range': 'close', 'dealt': 0, 'taken': 0})
    row(12000, 'B2', 'decide', {'q': 'action', 'pool': 0 if plant == 'zeroPool' else 5})
    if plant == 'noactor': row(15000, 'B3', 'took-bleed', {'n': 1})
    row(20000, 'B2', 'ousted', {})
    if plant == 'between': bleed(21000, 1)      # unpaired, after the first oust and before the game's end: a fault
    if plant != 'turncap': row(30000, 'B3', 'ousted', {})
    bleed(40000, 1)                              # the survivor's turn at an empty table: after the end, explained (a fault in a turn-cap game)
    res = {'match': k, 'reason': {'stuck': 'stuck', 'timeout': 'timeout', 'turncap': 'turn-cap'}.get(plant, 'last-standing'), 'postGameOusts': [], 'bot': '0.0.0'}
    if sim:
        res['sim'] = '0.0.0'; res['zeroPool'] = [{'bot': 'B2', 'round': 3}] if plant in ('zeroPool', 'zpdisagree') else []   # an arena row has neither
    rows.sort(key=lambda r: r['t'])
    lines = [json.dumps(r) for r in rows]
    if plant != 'noresult': lines.append(json.dumps({'t': 50000, 'match': k, 'type': 'result', 'data': res}))
    return '\n'.join(lines) + '\n'

def _series(d, plant, sim, n=N_SELF):
    os.makedirs(d)
    for k in range(1, n + 1):
        p = plant if (k == 1 or (plant == 'flags' and k == 2)) else None
        with open(os.path.join(d, 'match-%04d.jsonl' % k), 'w') as fh: fh.write(_match(k, p, sim))
    if sim:
        with open(os.path.join(d, 'design.json'), 'w') as fh: json.dump({'meta': {}, 'specs': [{'idx': k} for k in range(1, n + 1)]}, fh)
        with open(os.path.join(d, 'summary.json'), 'w') as fh: json.dump({'problems': [{'match': 2, 'crash': True}] if plant == 'problem' else []}, fh)
    if plant == 'missing': os.remove(os.path.join(d, 'match-0003.jsonl'))

def self_test():
    S, A = True, False
    cases = [(None, S, set()), ('stealth', S, {'block'}), ('more', S, {'ledger'}), ('less', S, {'ledger'}), ('noactor', S, {'ledger'}),
             ('unpaired', S, {'ledger'}), ('vanished', S, {'ledger'}), ('between', S, {'ledger'}), ('turncap', S, {'ledger'}),
             ('names', S, {'ledger'}), ('range', S, {'ledger'}), ('victimlost', S, {'ledger'}), ('stray', S, {'handshake'}),
             ('zeroPool', S, {'zeroPool'}), ('zpdisagree', S, {'zeroPool'}), ('stuck', S, {'matches'}), ('noresult', S, {'matches'}),
             ('missing', S, {'matches'}), ('problem', S, {'matches'}), ('flag', S, set()), ('flags', S, {'invariants'}),
             ('kind', S, {'invariants'}), ('wv', S, {'invariants'}), ('wvp', S, {'invariants'}), ('window', S, set()),
             ('flag', S, set(), 12), ('flags', S, {'invariants'}, 12),   # v1.1.0: a 12-match series carries one known flag, not two
             (None, A, set()), ('window', A, {'windows'}), ('timeout', A, {'matches'}), ('zeroPool', A, {'zeroPool'})]
    fails = 0; tmp = tempfile.mkdtemp(prefix='ana-gates-')
    try:
        for idx, (plant, sim, want, *n) in enumerate(cases):
            d = os.path.join(tmp, 'c%02d' % idx); _series(d, plant, sim, *n)
            L, _ = gates(d)
            failed = {name for v, name, _ in L if v == 'FAIL'}
            win = next(v for v, name, _ in L if name == 'windows')
            good = failed == want and (win == 'info') == sim
            fails += not good
            print('  %s %-10s %-5s -> FAIL %s%s' % ('ok ' if good else 'BAD', (plant or 'clean') + (' /%d' % n[0] if n else ''), 'sim' if sim else 'arena',
                  sorted(failed) or '-', '' if good else '   (want %s)' % sorted(want)))
    finally:
        shutil.rmtree(tmp)
    print('ana-gates.py v%s --self-test: %d checks, %d failed' % (VERSION, len(cases), fails))
    return fails == 0

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or args[0] in ('-h', '--help'):
        print('usage: ana-gates.py DIR... | --self-test'); sys.exit(2)
    if args[0] == '--self-test': sys.exit(0 if self_test() else 1)
    sys.exit(0 if all([report(S) for S in args]) else 1)
