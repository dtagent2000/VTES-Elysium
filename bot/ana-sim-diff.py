#!/usr/bin/env python3
# ana-sim-diff.py A B -- two runs of the same design, match by match (19 Oct 2026, with elysium-bot-sim.js v1.0.0).
#   A and B are trace directories (match-NNNN.jsonl) or two single match files. Same spec + same bytes = the same match: the sim's
#   virtual clock and fixed epoch make a trace repeat byte for byte, so ANY difference is a change in the code or the settings.
#   Per match it prints: IDENTICAL (every row, minus timestamps and the result's wall/cpu timing), SAME-PLAY (every decision and every card play the same,
#   some payload differs -- a statistic, a time), SAME-PLAY* (every bot made the same decisions, two bots' rows interleaved in another
#   order), or DIVERGED with the first decision that differs for some bot (its n-th decision: round, bot, question, A vs B),
#   and the outcome on both sides (winner, VP, rounds).
#   Use: golden-run regression (the reference table before/after a change), sim vs real clock (--real), version vs version.
#   Generated card ids are blinded (bot<seat>_xxxx -> ID). Decisions = `decide` rows (q + the deciding fields of out) and `play` rows.
#   --vp (3 Nov 2026, round C3, with sim v1.1.0): the PAIRED read of two arms of one design (T6) -- per deck the VP per match in A and B,
#   B - A as the mean of per-match differences with its paired SE and 95 % interval, wins A -> B; for a --bench design also the variant
#   seat (VP, B - A, wins, and each arm's edge = the seat's VP minus the table's mean). The per-match lines are left out; the verdict
#   tally stays (how many matches the variant changed at all). Usage: ana-sim-diff.py --vp CONTROL ARM.
import json, os, re, sys

ID = re.compile(r'bot\d+_[a-z0-9]{4,}')
KEYS = ('pick', 'block', 'bounce', 'play', 'seat', 'hunt', 'dodge', 'drain', 'toBlood', 'dir', 'tag', 'press', 'end', 'strike', 'name', 'n', 'ms')

def load(path):
    rows = []
    for line in open(path):
        line = line.strip()
        if not line:
            continue
        r = json.loads(ID.sub('ID', line))
        r.pop('t', None)
        if r.get('type') == 'result':
            for k in ('wallMs', 'cpuMs', 'clockStats', 'clock', 'sim'):
                r['data'].pop(k, None)
        rows.append(r)
    return rows

def decisions(rows):
    out = []
    for r in rows:
        if r.get('type') == 'decide':
            o = (r.get('data') or {}).get('out') or {}
            key = {k: (o[k].get('name') if isinstance(o.get(k), dict) else o.get(k)) for k in KEYS if k in o and k != 'ms'}
            if isinstance(o.get('pick'), dict) and o['pick'].get('deltas'):
                key['terms'] = o['pick']['deltas']   # a referendum's terms are part of the decision (who loses what)
            out.append((r.get('round'), r.get('bot'), 'decide', r['data'].get('q'), json.dumps(key, sort_keys=True)))
        elif r.get('type') == 'play':
            d = r.get('data') or {}
            out.append((r.get('round'), r.get('bot'), 'play', d.get('window'), json.dumps({'card': d.get('card'), 'vamp': d.get('vamp')}, sort_keys=True)))
    return out

def outcome(rows):
    res = next((r['data'] for r in reversed(rows) if r.get('type') == 'result'), {})
    vp = res.get('vp') or {}
    return '%s (%s) r%s %s' % (res.get('winner'), res.get('reason'), res.get('rounds'), '/'.join(str(vp[k]) for k in sorted(vp)))

def compare(fa, fb):
    A, B = load(fa), load(fb)
    if A == B:
        return 'IDENTICAL', None, outcome(A), outcome(B)
    da, db = decisions(A), decisions(B)
    if da == db:
        return 'SAME-PLAY', None, outcome(A), outcome(B)
    # the same decisions per bot, interleaved differently (two bots acting at the same instant) is still the same play
    per = lambda d: {b: [(g, x) for g, x in enumerate(d) if x[1] == b] for b in sorted(set(x[1] for x in d))}
    pa, pb = per(da), per(db)
    strip = lambda p: {b: [x for g, x in v] for b, v in p.items()}
    if strip(pa) == strip(pb):
        return 'SAME-PLAY*', None, outcome(A), outcome(B)
    first = None   # the bot whose first different decision comes EARLIEST in the trace (its position in A, else in B)
    for b in sorted(set(pa) | set(pb)):
        xa, xb = pa.get(b, []), pb.get(b, [])
        i = next((k for k, (x, y) in enumerate(zip(xa, xb)) if x[1] != y[1]), min(len(xa), len(xb)))
        if i < max(len(xa), len(xb)):
            x = xa[i] if i < len(xa) else None
            y = xb[i] if i < len(xb) else None
            g = min(v[0] for v in (x, y) if v is not None)
            if first is None or g < first[0]:
                first = (g, i, x and x[1], y and y[1])
    g, i, x, y = first
    return 'DIVERGED', (i, x, y), outcome(A), outcome(B)

def result_of(path):
    res = None
    for line in open(path):
        line = line.strip()
        if line:
            r = json.loads(line)
            if r.get('type') == 'result':
                res = r['data']
    return res

def stat(d):
    n = len(d)
    if not n:
        return 0.0, 0.0
    m = sum(d) / n
    if n < 2:
        return m, 0.0
    sd = (sum((x - m) ** 2 for x in d) / (n - 1)) ** 0.5
    return m, sd / n ** 0.5

def paired_vp(pairs):
    per, var, skipped, specs = {}, [], 0, set()
    for name, fa, fb in pairs:
        A, B = result_of(fa), result_of(fb)
        bad = lambda R: (not R) or R.get('crash') or R.get('reason') == 'stuck'
        if bad(A) or bad(B) or [x['deck'] for x in A['bots']] != [x['deck'] for x in B['bots']]:
            skipped += 1
            continue
        decks = [x['deck'] for x in A['bots']]
        uniq = len(set(decks)) == len(decks)
        for i, (ba, bb) in enumerate(zip(A['bots'], B['bots'])):
            k = ba['deck'] if uniq else '%s (seat %d)' % (ba['deck'], i + 1)
            per.setdefault(k, []).append((A['vp'].get(ba['name'], 0), B['vp'].get(bb['name'], 0), A.get('winner') == ba['name'], B.get('winner') == bb['name']))
        P = A.get('variantSeat')
        if P and P == B.get('variantSeat'):
            na, nb, n = A['bots'][P - 1]['name'], B['bots'][P - 1]['name'], len(A['bots'])
            va, vb = A['vp'].get(na, 0), B['vp'].get(nb, 0)
            var.append((va, vb, A.get('winner') == na, B.get('winner') == nb, va - sum(A['vp'].values()) / n, vb - sum(B['vp'].values()) / n))
            specs.add((A.get('bench'), B.get('bench')))
    return per, var, skipped, specs

def print_vp(pairs, tally):
    per, var, skipped, specs = paired_vp(pairs)
    n = len(next(iter(per.values()))) if per else 0
    print('## Paired VP, B - A (per-match differences on the same design): %d matches (%s)%s' % (n, ', '.join('%s %d' % kv for kv in sorted(tally.items())), ', %d skipped (crash, stuck or another design)' % skipped if skipped else ''))
    print()
    print('| deck | A VP/match | B VP/match | B - A | paired SE | 95 % | wins A -> B |')
    print('|---|---:|---:|---:|---:|---|---:|')
    for k in sorted(per):
        rows = per[k]
        m, se = stat([b - a for a, b, _, _ in rows])
        print('| %s | %.2f | %.2f | %+.2f | %.2f | [%+.2f, %+.2f] | %d -> %d |' % (k, sum(a for a, _, _, _ in rows) / len(rows), sum(b for _, b, _, _ in rows) / len(rows), m, se, m - 1.96 * se, m + 1.96 * se,
              sum(1 for r in rows if r[2]), sum(1 for r in rows if r[3])))
    if var:
        m, se = stat([b - a for a, b, _, _, _, _ in var])
        ea, sa = stat([x[4] for x in var]); eb, sb = stat([x[5] for x in var])
        sp = ' / '.join(sorted({'A: %s, B: %s' % (x or '?', y or '?') for x, y in specs}))
        print()
        print('**Variant seat** (%s, %d matches): VP %.2f -> %.2f, B - A %+.2f (paired SE %.2f; 95 %% [%+.2f, %+.2f]) · wins %d -> %d · edge (VP - the table mean) A %+.2f (95 %% +-%.2f), B %+.2f (95 %% +-%.2f)' % (
            sp, len(var), sum(x[0] for x in var) / len(var), sum(x[1] for x in var) / len(var), m, se, m - 1.96 * se, m + 1.96 * se,
            sum(1 for x in var if x[2]), sum(1 for x in var if x[3]), ea, 1.96 * sa, eb, 1.96 * sb))

def main():
    vp = '--vp' in sys.argv[1:]
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 2:
        print(__doc__ if __doc__ else 'usage: ana-sim-diff.py A B'); sys.exit(2)
    a, b = args
    if os.path.isdir(a):
        names = sorted(f for f in os.listdir(a) if f.startswith('match-') and f.endswith('.jsonl') and os.path.exists(os.path.join(b, f)))
        pairs = [(f, os.path.join(a, f), os.path.join(b, f)) for f in names]
    else:
        pairs = [(os.path.basename(a), a, b)]
    tally = {}
    for name, fa, fb in pairs:
        verdict, div, oa, ob = compare(fa, fb)
        tally[verdict] = tally.get(verdict, 0) + 1
        if vp:
            continue
        line = '%-16s %-10s A: %s' % (name, verdict, oa)
        if oa != ob:
            line += '  |  B: %s' % ob
        print(line)
        if div:
            i, x, y = div
            fmt = lambda d: '—' if d is None else 'r%s %s %s %s %s' % d
            print('    first different decision (that bot\'s #%d):  A %s' % (i, fmt(x)))
            print('    %s  B %s' % (' ' * len('first different decision (that bot\'s #%d):' % i), fmt(y)))
    if vp:
        print_vp(pairs, tally)
        return
    print('\n%d matches: %s' % (len(pairs), ', '.join('%s %d' % kv for kv in sorted(tally.items()))))

if __name__ == '__main__':
    main()
