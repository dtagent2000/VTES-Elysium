#!/usr/bin/env python3
# ana-probe.py <serie>... -- the probe reservation in arena traces (bot v0.6.206+, knob probeHold): per series, how often the probe
# order fired, how often the reservation was on (reserved) and how often it took the heavy card from a prober (probe-hold rows),
# and what the turn did: the actor's bleeds after the order until its influence phase, the pool they landed on its prey (a
# bounced bleed lands elsewhere), and the fate of the turn's biggest bleed (through / bounced / blocked).
import json, glob, sys, collections

def turns(S):
    out = []
    for f in sorted(glob.glob(S + '/**/match-*.jsonl', recursive=True)):
        rows = [json.loads(l) for l in open(f)]; rows = [r for r in rows if 'bot' in r]; rows.sort(key=lambda r: r['t'])
        deck = {r['bot']: r['data'].get('deck') for r in rows if r['type'] == 'manifest'}
        for i, r in enumerate(rows):
            if r['type'] != 'probe-order': continue
            B, t0 = r['bot'], r['t']; acts = []; holds = 0
            for x in rows[i + 1:]:
                if x['bot'] != B: continue
                if x['type'] in ('influence-plan', 'raise') or x['t'] - t0 > 120000: break
                if x['type'] == 'probe-hold': holds += 1
                if x['type'] in ('through', 'blocked'): acts.append((x['type'], x['data']))
            bleeds = [(k, d) for k, d in acts if d.get('kind') in (None, 'bleed') and d.get('card') != 'hunt' and (d.get('n') or 0) >= 1]
            landed = sum((d.get('final') if d.get('final') is not None else d.get('n') or 0) for k, d in bleeds if k == 'through' and not d.get('bounced'))
            hv = max(bleeds, key=lambda kd: kd[1].get('n') or 0) if bleeds else None
            fate = 'none' if not hv or (hv[1].get('n') or 0) < 2 else ('bounced' if hv[1].get('bounced') else ('through' if hv[0] == 'through' else 'blocked'))
            d = r['data']
            out.append({ 'deck': deck.get(B), 'reserved': bool(d.get('reserved')), 'outnumber': d.get('outnumber'), 'hold': d.get('hold'), 'holds': holds,
                         'landed': landed, 'fate': fate, 'nb': len(bleeds), 'blocked': sum(1 for k, _ in bleeds if k == 'blocked') })
    return out

for S in sys.argv[1:]:
    T = turns(S)
    n = len(glob.glob(S + '/**/match-*.jsonl', recursive=True))
    print('## %s -- %d matches, the probe order fired %d times (%.2f a match)' % (S, n, len(T), len(T) / max(1, n)))
    if not T: continue
    print('   reserved %d, probe-hold rows %d (turns with one: %d), out-numbering %d' % (sum(t['reserved'] for t in T), sum(t['holds'] for t in T), sum(1 for t in T if t['holds']), sum(1 for t in T if t['outnumber'])))
    print('   per probe turn: bleeds %.2f, blocked %.2f, pool landed on the prey %.2f' % (sum(t['nb'] for t in T) / len(T), sum(t['blocked'] for t in T) / len(T), sum(t['landed'] for t in T) / len(T)))
    fc = collections.Counter(t['fate'] for t in T)
    print('   the biggest bleed: through %d, bounced %d, blocked %d, none %d' % (fc['through'], fc['bounced'], fc['blocked'], fc['none']))
    print('   by deck: ' + ', '.join('%s %d' % kv for kv in collections.Counter(t['deck'] for t in T).most_common()))
