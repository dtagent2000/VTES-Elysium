#!/usr/bin/env python3
# ana-sim-diff.py A B [--full] -- two runs of the same design, match by match (19 Oct 2026, with elysium-bot-sim.js v1.0.0).
#   A and B are trace directories (match-NNNN.jsonl) or two single match files. Same spec + same bytes = the same match: the sim's
#   virtual clock and fixed epoch make a trace repeat byte for byte, so ANY difference is a change in the code or the settings.
#   Per match it prints: IDENTICAL (every row, minus wall/cpu timing), SAME-PLAY (every decision and every card play the same,
#   some payload differs -- a statistic, a time), or DIVERGED with the first decision that differs (round, bot, question, A vs B),
#   and the outcome on both sides (winner, VP, rounds).
#   Use: golden-run regression (the reference table before/after a change), sim vs real clock (--real), version vs version.
#   Generated card ids are blinded (bot<seat>_xxxx -> ID). Decisions = `decide` rows (q + the deciding fields of out) and `play` rows.
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
    i = next((k for k, (x, y) in enumerate(zip(da, db)) if x != y), min(len(da), len(db)))
    x = da[i] if i < len(da) else None
    y = db[i] if i < len(db) else None
    return 'DIVERGED', (i, x, y), outcome(A), outcome(B)

def main():
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
        line = '%-16s %-10s A: %s' % (name, verdict, oa)
        if oa != ob:
            line += '  |  B: %s' % ob
        print(line)
        if div:
            i, x, y = div
            fmt = lambda d: '—' if d is None else 'r%s %s %s %s %s' % d
            print('    first different decision #%d:  A %s' % (i, fmt(x)))
            print('    %s  B %s' % (' ' * len('first different decision #%d:' % i), fmt(y)))
    print('\n%d matches: %s' % (len(pairs), ', '.join('%s %d' % kv for kv in sorted(tally.items()))))

if __name__ == '__main__':
    main()
