#!/usr/bin/env python3
# ana-lab.py <lab.jsonl>... -- the probe lab's read (lab-probe.js v1.0.0, 17 Oct 2026): per arm, over the tables where the probe
# order fired (the same tables in every arm -- the order is decided before any action), what the actor's turn did to its prey.
#   preyLoss  = pool my prey lost this turn (what landed on it); bounced = pool a bounce sent on to the third seat
#   heavy     = the turn's biggest announced bleed (>= 2): through to my prey / bounced on / blocked
#   blocks    = my actions blocked this turn; holds = the reservation's own rows (a prober kept off the heavy card)
# A table is keyed on (seed, i): several lab processes with different seeds can be read together. Arm 2 (the reservation only when my
# actors out-number my prey's unlocked bodies) is arm 1 where they do and arm 0 where they do not -- derived ('2*') when a table has
# arms 0 and 1 only; where arm 2 was run, the derivation is checked against it.
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
for r in rows: by[(r.get('seed', 1), r['i'])][r['arm']] = r
errs = sum(1 for r in rows if r.get('err'))

# the derivation of arm 2, and its check where arm 2 was run
chk = collections.Counter()
for k, d in by.items():
    if 0 in d and 1 in d:
        der = d[1] if d[0].get('outnumber') else d[0]
        if 2 in d:
            chk['same' if json.dumps(d[2]['acts']) == json.dumps(der['acts']) and d[2]['preyLoss'] == der['preyLoss'] else 'DIFFERENT'] += 1
        else:
            d['2*'] = dict(der, arm='2*')
arms = []
for a in (0, 1, 2, '2*'):
    if any(a in d for d in by.values()): arms.append(a)
if 2 in arms and '2*' in arms:   # both: read the run arm where it exists, the derived one elsewhere
    for d in by.values():
        if 2 not in d and '2*' in d: d[2] = d.pop('2*')
    arms.remove('2*')
base = arms[0]
fired = [k for k, d in by.items() if all(a in d for a in arms) and d[base]['fired']]
print('tables %d, the probe order fired on %d (%.0f %%), errors %d' % (len(by), len(fired), 100.0 * len(fired) / max(1, len(by)), errs))
if chk: print('arm 2 run on %d tables: the derivation from arms 0 / 1 matches %d, differs %d' % (sum(chk.values()), chk['same'], chk['DIFFERENT']))

def heavy_of(r):
    bl = [a for a in r['acts'] if (a.get('n') or 0) >= 2 and a.get('kind') in (None, 'bleed')]
    if not bl: return 'none'
    a = max(bl, key=lambda a: a['n'])
    return 'bounced' if a.get('bounced') else ('through' if a['end'] == 'through' else 'blocked')

def table(sel, label):
    if not sel: return
    print('\n## %s -- %d tables' % (label, len(sel)))
    print('  %-4s %-16s %-11s %-8s %-8s %-9s %-34s %s' % ('arm', 'prey loss', 'bounced on', 'blocks', 'holds', 'reserved', 'heavy: through / bounced / blocked', 'differs from arm %s' % base))
    for a in arms:
        rs = [by[k][a] for k in sel]
        pl = [r['preyLoss'] for r in rs]; tl = [r['thirdLoss'] for r in rs]; bk = [r['blocks'] for r in rs]; hd = [r['holds'] for r in rs]
        hv = collections.Counter(heavy_of(r) for r in rs)
        diff = sum(1 for k in sel if json.dumps(by[k][a]['acts']) != json.dumps(by[k][base]['acts']))
        print('  %-4s %5.2f +- %-7.2f %5.2f       %5.2f    %5.2f    %3d       %3d / %3d / %3d (none %d)          %d' % (a, mean(pl), se(pl), mean(tl), mean(bk), mean(hd), sum(1 for r in rs if r.get('reserved')), hv['through'], hv['bounced'], hv['blocked'], hv['none'], diff))
    for a in arms[1:]:
        d = [by[k][a]['preyLoss'] - by[k][base]['preyLoss'] for k in sel]
        print('  paired, arm %s - arm %s: prey loss %+.2f +- %.2f per turn (better %d, worse %d, equal %d)' % (a, base, mean(d), se(d), sum(1 for x in d if x > 0), sum(1 for x in d if x < 0), sum(1 for x in d if x == 0)))

table(fired, 'every table where the probe order fired')
table([k for k in fired if by[k][base].get('outnumber')], 'my actors out-number my prey\'s unlocked bodies')
table([k for k in fired if by[k][base].get('outnumber') is False], 'they do not')
for pu in sorted({by[k][base].get('preyUp') for k in fired}):
    table([k for k in fired if by[k][base].get('preyUp') == pu], 'my prey has %s unlocked %s' % (pu, 'body' if pu == 1 else 'bodies'))
for pd in sorted({by[k][base]['pd'] for k in fired}):
    table([k for k in fired if by[k][base]['pd'] == pd], 'prey deck ' + pd)
