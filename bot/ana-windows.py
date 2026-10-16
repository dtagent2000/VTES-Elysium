#!/usr/bin/env python3
# ana-windows.py <serie>... -- the actor's reactions-only windows (bot v0.6.206): after a bleed modifier (play window bleed-mod) and on
# the bleed total (bleed-total row), the time to that bleed's resolution (the actor's next through / blocked row). An answered window
# resolves in well under a second at pace 0. Slow ones (> 2.5 s) are split:
#   RAN OUT, THROUGH -- the window ran out its clock and the bleed went through: an answer was lost (v0.6.206 found two causes: the
#                       stale guard's first anchor, and a 150 ms sleep before the window opened). The gate is 0.
#   blocked at the clock -- a block attempt was taken up and the contest's verdict came at the actor's clock (between bots nobody
#                       declares it sooner): by design, counted for the record.
# Also: stale-answer rows (v0.6.206's guard: a bot's answer that arrived while the line opening my window was still in my queue).
# Run per match directory or on a directory of match-*.jsonl files.
import json, glob, sys, collections

for S in sys.argv[1:]:
    C = collections.Counter(); stale = collections.Counter(); slow = []
    files = sorted(glob.glob(S + '/match-*.jsonl')) or sorted(glob.glob(S + '/**/match-*.jsonl', recursive=True))
    for f in files:
        rows = [json.loads(l) for l in open(f)]; rows = [r for r in rows if 'bot' in r]; rows.sort(key=lambda r: r['t'])
        for i, r in enumerate(rows):
            if r['type'] == 'stale-answer': stale[(r['data'].get('phrase'), r['data'].get('via'))] += 1
            kind = 'modifier' if (r['type'] == 'play' and r['data'].get('window') == 'bleed-mod') else ('total' if r['type'] == 'bleed-total' else None)
            if not kind: continue
            nx = [x for x in rows[i + 1:] if x['bot'] == r['bot'] and x['type'] in ('through', 'blocked')][:1]
            if not nx: continue
            gap = nx[0]['t'] - r['t']; C[kind] += 1
            if gap > 2500:
                tag = 'RAN OUT, THROUGH' if nx[0]['type'] == 'through' else 'blocked at the clock'
                C[kind + ' ' + tag] += 1; slow.append((f.split('/')[-1], kind, tag, gap))
    print('## %s -- %d matches' % (S, len(files)))
    for k in ('modifier', 'total'):
        print('  %-9s windows %3d | RAN OUT, THROUGH %3d | blocked at the clock %3d' % (k, C[k], C[k + ' RAN OUT, THROUGH'], C[k + ' blocked at the clock']))
    print('  stale-answer rows %d %s' % (sum(stale.values()), dict(stale) if stale else ''))
    for s in slow: print('    %s %s %s %d ms' % s)
