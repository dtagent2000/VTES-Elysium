#!/usr/bin/env python3
# ana-bench.py DIR... -- the mirror bench's UNPAIRED read (3 Nov 2026, round C3, with sim v1.1.0; it read bench.sh's bench-ARM/m*/ before).
#   A DIR is a sim trace directory run with --bench (the result row's variantSeat). Per match: the variant seat's VP minus the table's mean
#   (a quarter of the table's VP at four seats); its mean and 95 % interval over the matches, the variant's wins against the expected
#   share, and the edge by variant seat. The negative control (--bench none) must hold 0 inside its interval: A vs A is level.
#   Two arms of one design are read PAIRED by `ana-sim-diff.py --vp CONTROL ARM` (per-match differences, a paired SE): the read a claim needs.
import json, glob, sys, os, math

def results(d):
    out = []
    for f in sorted(glob.glob(os.path.join(d, 'match-*.jsonl'))):
        res = None
        for line in open(f):
            line = line.strip()
            if line:
                r = json.loads(line)
                if r.get('type') == 'result':
                    res = r['data']
        if res and not res.get('crash') and res.get('reason') != 'stuck' and res.get('variantSeat'):
            out.append(res)
    return out

def main():
    dirs = sys.argv[1:]
    if not dirs:
        print('usage: ana-bench.py DIR...   (sim --bench trace directories)'); sys.exit(2)
    for d in dirs:
        rs = results(d)
        if len(rs) < 2:
            print('%s: %d bench matches (a --bench trace directory?)' % (d, len(rs))); continue
        e, wins, exp, by = [], 0, 0.0, {}
        for r in rs:
            P = r['variantSeat']; nm = r['bots'][P - 1]['name']; n = len(r['bots'])
            x = r['vp'].get(nm, 0) - sum(r['vp'].values()) / n
            e.append(x); by.setdefault(P, []).append(x); exp += 1.0 / n
            if r.get('winner') == nm:
                wins += 1
        m = sum(e) / len(e); sd = math.sqrt(sum((x - m) ** 2 for x in e) / (len(e) - 1)); ci = 1.96 * sd / math.sqrt(len(e))
        spec = rs[0].get('bench')
        print('%s (--bench %s): %d matches  variant VP - table mean = %+.2f  (95 %% +-%.2f, [%+.2f, %+.2f])  variant wins %d (expected %.1f)  by seat %s' % (
            os.path.basename(os.path.normpath(d)), spec, len(e), m, ci, m - ci, m + ci, wins, exp, ', '.join('%d: %+.2f' % (k, sum(v) / len(v)) for k, v in sorted(by.items()))))

if __name__ == '__main__':
    main()
