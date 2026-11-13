#!/usr/bin/env python3
# ana-windows.py <serie>... -- the actor's reactions-only windows (bot v0.6.206): after a bleed modifier (play window bleed-mod) and on
# the bleed total (bleed-total row), the time to that bleed's resolution (the actor's next through / blocked row). An answered window
# resolves in well under a second at pace 0. Slow ones (> 2.5 s) are split:
#   RAN OUT, THROUGH -- no block attempt in the window, it ran out its clock and the bleed went through: an answer was lost (v0.6.206
#                       found two causes: the stale guard's first anchor, and a 150 ms sleep before the window opened). The gate is 0.
#   contest at the clock -- a block attempt was taken up (a block-made row of another bot in the window) and the contest's verdict came at
#                       the actor's clock (between bots nobody declares it sooner): by design, counted for the record -- split by outcome
#                       (blocked, or the block failed against my stealth and the bleed went through).
# Also: stale-answer rows (v0.6.206's guard: a bot's answer that arrived while the line opening my window was still in my queue).
# v1.1 (13 Nov 2026, round A's online table): the limit is 2.5 s PLUS the bots' pace (the manifests' paceMs): at the client pace a
#   bot answers after its react delay (= paceMs), so a window answered by a chain of bots (a bounce, then the new target's answer)
#   resolves 3.2-10.5 s after it opened with no answer lost. A slow window is RAN OUT only when the table went QUIET longer than the
#   limit inside it (the largest gap between two consecutive rows, any bot); a slow window with no such gap is 'answered at the pace'
#   (counted for the record). At pace 0 the limit and the verdicts are those of v1.0.
# Run per match directory or on a directory of match-*.jsonl files.
import json, glob, sys, collections

def audit(S):   # one series directory -> its counts (C2: importable, ana-gates.py reads it)
    C = collections.Counter(); stale = collections.Counter(); slow = []
    files = sorted(glob.glob(S + '/match-*.jsonl')) or sorted(glob.glob(S + '/**/match-*.jsonl', recursive=True))
    for f in files:
        rows = [json.loads(l) for l in open(f)]; rows = [r for r in rows if 'bot' in r]; rows.sort(key=lambda r: r['t'])
        paces = [((r.get('data') or {}).get('knobs') or {}).get('paceMs') for r in rows if r['type'] == 'manifest']
        lim = 2500 + max([p for p in paces if isinstance(p, (int, float))] or [0])   # v1.1: the pace is part of an answered window
        for i, r in enumerate(rows):
            if r['type'] == 'stale-answer': stale[(r['data'].get('phrase'), r['data'].get('via'))] += 1
            kind = 'modifier' if (r['type'] == 'play' and r['data'].get('window') == 'bleed-mod') else ('total' if r['type'] == 'bleed-total' else None)
            if not kind: continue
            nx = [x for x in rows[i + 1:] if x['bot'] == r['bot'] and x['type'] in ('through', 'blocked')][:1]
            if not nx: continue
            gap = nx[0]['t'] - r['t']; C[kind] += 1
            if gap > lim:
                contest = any(x['type'] == 'block-made' and x['bot'] != r['bot'] and r['t'] <= x['t'] <= nx[0]['t'] for x in rows[i + 1:])
                inside = [r['t']] + [x['t'] for x in rows[i + 1:] if x['t'] <= nx[0]['t']]
                quiet = max(b - a for a, b in zip(inside, inside[1:])) if len(inside) > 1 else gap
                if not contest and quiet <= lim: C[kind + ' answered at the pace'] += 1; continue   # v1.1: a chain of paced answers, none lost
                tag = ('contest at the clock, ' + ('blocked' if nx[0]['type'] == 'blocked' else 'failed')) if contest else ('RAN OUT, THROUGH' if nx[0]['type'] == 'through' else 'blocked at the clock')
                C[kind + ' ' + tag] += 1; slow.append((f.split('/')[-1], kind, tag, gap))
    return C, stale, slow, files

if __name__ == '__main__':
  for S in sys.argv[1:]:
    C, stale, slow, files = audit(S)
    print('## %s -- %d matches' % (S, len(files)))
    for k in ('modifier', 'total'):
        print('  %-9s windows %3d | RAN OUT, THROUGH %3d | contest at the clock: blocked %3d, failed %3d | answered at the pace %3d%s' % (k, C[k], C[k + ' RAN OUT, THROUGH'], C[k + ' contest at the clock, blocked'], C[k + ' contest at the clock, failed'], C[k + ' answered at the pace'],
              (' | blocked at the clock with no attempt row %d' % C[k + ' blocked at the clock']) if C[k + ' blocked at the clock'] else ''))
    print('  stale-answer rows %d %s' % (sum(stale.values()), dict(stale) if stale else ''))
    for s in slow: print('    %s %s %s %d ms' % s)
