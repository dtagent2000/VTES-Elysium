#!/usr/bin/env python3
# ana-gates.py v1.0.0 <dir>... -- the series audits as gates: one PASS / FAIL line each, exit 1 when any fails (round C2, 11 Nov 2026;
#   spec-cleanup-2026-10-20.md T10). The release gate on the 240-match client design (CLAUDE.md "Gates"): run it on the new bytes'
#   sim directory beside `ana-sim-diff.py OLD NEW`. It imports the audits -- ana-block.py, ana-ledger.py, ana-inv.py, ana-windows.py,
#   each one's audit(S) -- so every count has one source, and reads the result rows the sim writes. The policy (what fails):
#     matches     a match file without a result row, or one that ended 'stuck' (the sim) / 'timeout' (the arena)
#     zeroPool    a bot that decided at pool <= 0 before its own oust (the sim's result rows; n/a on traces without the field)
#     block       any ana-block row but its four counts (BLOCK_COUNTS): the R-rows are the violations, the gate is 0
#     ledger      any ana-ledger row that is not a balanced or explained count (LEDGER_COUNTS) or a known lead (LEDGER_LEADS):
#                 VANISHED, UNEXPLAINED, no actor row, names NULL / WRONG, RANGE DISAGREES, a bleed through that no seat took before the
#                 game's end. Default deny: a row a later audit adds is a gate until it is classed here.
#     invariants  more than 1 flag in 3 matches (HOWTO: the baseline); the kinds are listed either way
#     windows     the arena: an actor's window that ran out and went through (v0.6.206's gate of 0); the sim table: info only -- most
#                 bot windows run out there (BOARD, a measurement debt), so the line reports and does not judge
#   The info lines carry the ledger's leads (BOARD), the post-game ousts and the sim's windows.
#   --self-test: a clean synthetic series PASSes every gate, and each planted fault turns its own line (and only it) FAIL.
import collections, glob, importlib.util, json, os, shutil, sys, tempfile

VERSION = '1.0.0'
HERE = os.path.dirname(os.path.abspath(__file__))

def _load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(HERE, name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod

BLOCK, LEDGER, INV, WINDOWS = (_load(n) for n in ('ana-block', 'ana-ledger', 'ana-inv', 'ana-windows'))

BLOCK_COUNTS = {'actions', 'blocked', 'attempted but through', 'blocked with no intercept card'}
LEDGER_COUNTS = {'1 bleed: equal', '1 bleed: more, actor modifiers', '1 bleed: less, target reduced', '1 bleed: through, reduced to nothing',
                 '1 bleed: through after game ended', '2 names: right', '3 combat: dealt==taken', '3 combat: taken<dealt',
                 '3 combat: taken>dealt', '4 steal: stole', '4 steal: stolenFromMe', '4 steal pairs: equal', '5 creep: placed',
                 '5 creep: victim burns'}
LEDGER_LEADS = {'4 steal pairs: STOLE > VICTIM LOST': 'BOARD: steal pair under a combat ends, O-12',
                '4 steal pairs: VICTIM LOST > STOLE': 'a lead',
                '4 steal pairs: no victim row': 'the stray combat row, STATUS',
                '2 names: no reciprocal row': 'a lead'}
FAILED_END = ('stuck', 'timeout')

def _results(S):
    out = []
    for f in sorted(glob.glob(S + '/match-*.jsonl')):
        res = None
        for line in open(f):
            if '"result"' in line:
                r = json.loads(line)
                if r.get('type') == 'result': res = r.get('data') or {}
        out.append((os.path.basename(f), res))
    return out

def _list(counter, keys):
    return ', '.join('%s %d' % (k, counter[k]) for k in keys)

def gates(S):
    """-> (lines, title): lines are (verdict, name, text); verdict PASS / FAIL / info."""
    res = _results(S); n = len(res); L = []
    sim = next((r.get('sim') for _, r in res if r and r.get('sim')), None)
    bots = sorted({r.get('bot') for _, r in res if r and r.get('bot')})
    title = '%s: %d matches, %s%s' % (S, n, ('the sim table (sim %s)' % sim) if sim else 'no sim marker (an arena series)',
                                     (', bot ' + '/'.join(bots)) if bots else '')
    # matches
    missing = [f for f, r in res if r is None]
    failed = [f for f, r in res if r is not None and (r.get('reason') in FAILED_END or r.get('crash'))]
    reasons = collections.Counter(r.get('reason') for _, r in res if r is not None)
    ok = n > 0 and not missing and not failed
    L.append(('PASS' if ok else 'FAIL', 'matches', '%d of %d ended (%s)%s%s' % (n - len(missing) - len(failed), n,
             ', '.join('%s %d' % (k, v) for k, v in sorted(reasons.items(), key=lambda kv: str(kv[0]))) or 'no match files',
             ('; no result row: ' + ' '.join(missing[:8])) if missing else '', ('; ' + ' '.join(failed[:8]) + ' failed') if failed else '')))
    # zeroPool
    have = [r for _, r in res if r is not None]
    if have and all(isinstance(r.get('zeroPool'), list) for r in have):
        zp = [(f, z) for f, r in res if r is not None for z in r['zeroPool']]
        L.append(('PASS' if not zp else 'FAIL', 'zeroPool', '%d bots decided at pool <= 0 before their own oust%s' % (len(zp),
                 (': ' + ', '.join('%s %s r%s' % (f, z.get('bot'), z.get('round')) for f, z in zp[:6])) if zp else '')))
    else:
        L.append(('info', 'zeroPool', 'n/a: these result rows carry no zeroPool (the sim writes it since v1.0.1)'))
    # block
    R, _ex = BLOCK.audit(S)
    bad = sorted(k for k in R if k not in BLOCK_COUNTS and R[k])
    L.append(('PASS' if not bad else 'FAIL', 'block', ('%d violations in %d actions' % (sum(R[k] for k in bad), R['actions'])) +
             ((': ' + _list(R, bad)) if bad else '')))
    # ledger
    G = LEDGER.audit(S)
    bad = sorted(k for k in G if k not in LEDGER_COUNTS and k not in LEDGER_LEADS and G[k])
    L.append(('PASS' if not bad else 'FAIL', 'ledger', ('%d faults' % sum(G[k] for k in bad)) + ((': ' + _list(G, bad)) if bad else
             ' (VANISHED, UNEXPLAINED, unpaired before the end, names, range); balanced: bleeds %d, combat names %d' %
             (G['1 bleed: equal'], G['2 names: right']))))
    leads = [k for k in sorted(LEDGER_LEADS) if G[k]]
    L.append(('info', 'ledger', 'leads, not gates: %s; through after the game ended %d' % (
        ', '.join('%s %d (%s)' % (k, G[k], LEDGER_LEADS[k]) for k in leads) or 'none', G['1 bleed: through after game ended'])))
    # invariants
    c, _ex, m = INV.audit(S)
    flags = sum(c.values()); cap = m // 3
    L.append(('PASS' if flags <= cap else 'FAIL', 'invariants', '%d flags in %d matches (at most %d, 1 in 3)%s' % (flags, m, cap,
             (': ' + ', '.join('%s %d' % (k, v) for k, v in c.most_common())) if flags else '')))
    # windows
    C, stale, _slow, _files = WINDOWS.audit(S)
    ran = C['modifier RAN OUT, THROUGH'] + C['total RAN OUT, THROUGH']
    text = 'ran out and went through: modifier %d of %d, total %d of %d; stale-answer rows %d' % (
        C['modifier RAN OUT, THROUGH'], C['modifier'], C['total RAN OUT, THROUGH'], C['total'], sum(stale.values()))
    if sim:
        L.append(('info', 'windows', 'the sim table, not a gate (BOARD): ' + text))
    else:
        L.append(('PASS' if not ran else 'FAIL', 'windows', text))
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
def _match(k, plant=None, sim=True):
    rows = []
    def row(t, bot, ty, data): rows.append({'t': t, 'match': k, 'bot': bot, 'type': ty, 'data': data})
    for i, b in enumerate(('B1', 'B2', 'B3')): row(0, b, 'manifest', {'deck': 'malkavian', 'seat': i + 1})
    row(1000, 'B1', 'through', {'vamp': 'X', 'n': 2, 'final': 2, 'card': None})
    row(1500, 'B2', 'took-bleed', {'n': 3 if plant == 'more' else 2})
    if plant == 'stealth': row(900, 'B1', 'play', {'window': 'stealth', 'card': 'Lost in Crowds', 'vamp': 'X'})
    if plant == 'unpaired': row(2000, 'B1', 'through', {'vamp': 'X', 'n': 1, 'final': 1, 'card': None})
    if plant == 'window':
        row(3000, 'B1', 'bleed-total', {'n': 1}); row(6000, 'B1', 'through', {'vamp': 'X', 'n': 1, 'final': 1, 'card': None})
        row(6500, 'B3', 'took-bleed', {'n': 1})
    if plant in ('flag', 'flags'): row(2500, 'B1', 'inv-flag', {'inv': 'pool-drift', 'diff': 1})
    row(20000, 'B2', 'ousted', {}); row(30000, 'B3', 'ousted', {})
    row(40000, 'B1', 'through', {'vamp': 'X', 'n': 1, 'final': 1, 'card': None})   # the survivor's turn at an empty table
    res = {'match': k, 'reason': 'stuck' if plant == 'stuck' else 'last-standing', 'postGameOusts': [], 'bot': '0.0.0'}
    if sim: res['sim'] = '0.0.0'; res['zeroPool'] = [{'bot': 'B2', 'round': 3}] if plant == 'zeroPool' else []   # an arena row has neither
    rows.sort(key=lambda r: r['t'])
    lines = [json.dumps(r) for r in rows]
    if plant != 'noresult': lines.append(json.dumps({'t': 50000, 'match': k, 'type': 'result', 'data': res}))
    return '\n'.join(lines) + '\n'

def self_test():
    cases = [(None, True, set()), ('stealth', True, {'block'}), ('more', True, {'ledger'}), ('unpaired', True, {'ledger'}),
             ('zeroPool', True, {'zeroPool'}), ('stuck', True, {'matches'}), ('noresult', True, {'matches'}), ('flags', True, {'invariants'}),
             ('flag', True, set()), ('window', True, set()), ('window', False, {'windows'}), (None, False, set())]
    fails = 0; tmp = tempfile.mkdtemp(prefix='ana-gates-')
    try:
        for idx, (plant, sim, want) in enumerate(cases):
            d = os.path.join(tmp, 'c%02d' % idx); os.makedirs(d)
            for k in (1, 2, 3):   # three matches: the invariant cap is one flag ('flag' plants one, 'flags' one in two matches)
                p = plant if (k == 1 or (plant == 'flags' and k == 2)) else None
                with open(os.path.join(d, 'match-%04d.jsonl' % k), 'w') as fh: fh.write(_match(k, p, sim))
            L, _ = gates(d)
            failed = {name for v, name, _ in L if v == 'FAIL'}
            sim_ok = (dict((name, v) for v, name, _ in L if name == 'windows').get('windows') == 'info') == sim
            good = failed == want and sim_ok
            fails += not good
            print('  %s %-9s %-5s -> FAIL %s%s' % ('ok ' if good else 'BAD', plant or 'clean', 'sim' if sim else 'arena',
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
