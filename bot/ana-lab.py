#!/usr/bin/env python3
# ana-lab.py <lab.jsonl>... -- the probe lab's read (lab-probe.js v1.0.0, 17 Oct 2026): per arm, over the tables where the probe
# order fired (the same tables in every arm -- the order is decided before any action), what the actor's turn did to its prey.
#   preyLoss  = pool my prey lost this turn (what landed on it); bounced = pool a bounce sent on to the third seat
#   heavy     = the turn's biggest announced bleed (>= 2): through to my prey / bounced on / blocked
#   blocks    = my actions blocked this turn; holds = the reservation's own rows (a prober kept off the heavy card)
import json, sys, collections, math

def mean(xs): return sum(xs) / len(xs) if xs else float('nan')
def se(xs):
    if len(xs) < 2: return float('nan')
    m = mean(xs); return math.sqrt(sum((x - m) ** 2 for x in xs) / (len(xs) - 1) / len(xs))

rows = []
for f in sys.argv[1:]:
    for l in open(f):
        l = l.strip()
        if l.startswith('{'): rows.append(json.loads(l))
by = collections.defaultdict(dict)
for r in rows: by[r['i']][r['arm']] = r
arms = sorted({r['arm'] for r in rows})
fired = [i for i, d in by.items() if all(a in d for a in arms) and d[arms[0]]['fired']]
errs = sum(1 for r in rows if r.get('err'))
print('tables %d, the probe order fired on %d (%.0f %%), errors %d' % (len(by), len(fired), 100.0 * len(fired) / max(1, len(by)), errs))

def heavy_of(r):
    bl = [a for a in r['acts'] if (a.get('n') or 0) >= 2 and a.get('kind') in (None, 'bleed')]
    if not bl: return 'none'
    a = max(bl, key=lambda a: a['n'])
    return 'bounced' if a.get('bounced') else ('through' if a['end'] == 'through' else 'blocked')

def table(sel, label):
    if not sel: return
    print('\n## %s -- %d tables' % (label, len(sel)))
    print('  %-4s %-16s %-14s %-9s %-9s %-26s %s' % ('arm', 'prey loss', 'bounced on', 'blocks', 'holds', 'heavy: through/bounced/blocked', 'differs from arm 0'))
    for a in arms:
        rs = [by[i][a] for i in sel]
        pl = [r['preyLoss'] for r in rs]; tl = [r['thirdLoss'] for r in rs]; bk = [r['blocks'] for r in rs]; hd = [r['holds'] for r in rs]
        hv = collections.Counter(heavy_of(r) for r in rs)
        diff = sum(1 for i in sel if json.dumps(by[i][a]['acts']) != json.dumps(by[i][arms[0]]['acts']))
        print('  %-4s %5.2f +- %-7.2f %5.2f        %5.2f     %5.2f     %3d / %3d / %3d (none %d)     %d' % (a, mean(pl), se(pl), mean(tl), mean(bk), mean(hd), hv['through'], hv['bounced'], hv['blocked'], hv['none'], diff))
    if len(arms) > 1:
        for a in arms[1:]:
            d = [by[i][a]['preyLoss'] - by[i][arms[0]]['preyLoss'] for i in sel]
            print('  paired, arm %s - arm %s: prey loss %+.2f +- %.2f per turn (better %d, worse %d, equal %d)' % (a, arms[0], mean(d), se(d), sum(1 for x in d if x > 0), sum(1 for x in d if x < 0), sum(1 for x in d if x == 0)))

table(fired, 'every table where the probe order fired')
out = [i for i in fired if by[i][arms[0]].get('outnumber')]
nout = [i for i in fired if by[i][arms[0]].get('outnumber') is False]
table(out, 'my actors out-number my prey\'s unlocked bodies')
table(nout, 'they do not')
for pd in sorted({by[i][arms[0]]['pd'] for i in fired}):
    table([i for i in fired if by[i][arms[0]]['pd'] == pd], 'prey deck ' + pd)
