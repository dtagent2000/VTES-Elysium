#!/usr/bin/env python3
"""ana-wait.py -- how long did the bots wait on the humans? (v0.6.194, the tempo)

Reads the `wait` rows a bot writes for every wait on a human -- from an arena trace
(*.jsonl, rows of type 'wait') or from a process / console log (lines ending in
`wait {...}`, which elysium-bot-table.js and the browser console both carry).

    python3 ana-wait.py <trace.jsonl | log.txt | dir> [...]

Prints, per bot and in total: waits, seconds waited, by kind (block / react / pq /
vote / phase / damage) and by how they ended (answer / clock / button / skip), and
the mean wait per kind -- the numbers the tempo spec asks for (seconds per turn
spent waiting, by step)."""
import sys, os, json, re, collections

ROW_RE = re.compile(r'wait (\{.*\})\s*$')

def rows_from(path):
    out = []
    if os.path.isdir(path):
        for f in sorted(os.listdir(path)):
            if f.endswith('.jsonl') or f.endswith('.log') or f.endswith('.txt'):
                out += rows_from(os.path.join(path, f))
        return out
    with open(path, encoding='utf-8', errors='replace') as fh:
        for line in fh:
            line = line.rstrip('\n')
            if not line: continue
            if line.startswith('{'):
                try: j = json.loads(line)
                except Exception: continue
                t = j.get('type') or j.get('t') or j.get('ev')
                if t in ('wait', 'bot:wait'):
                    d = j.get('d') or j.get('data') or j
                    out.append((j.get('who') or j.get('bot') or j.get('name') or '?', d))
                continue
            m = ROW_RE.search(line)
            if m:
                try: d = json.loads(m.group(1))
                except Exception: continue
                who = '?'
                mm = re.match(r'\s*\[([^\]]+)\]', line)
                if mm: who = mm.group(1)
                out.append((who, d))
    return out

def main(argv):
    if len(argv) < 2:
        print(__doc__); return 1
    rows = []
    for p in argv[1:]: rows += rows_from(p)
    if not rows:
        print('no wait rows found'); return 1
    by_bot = collections.defaultdict(list)
    for who, d in rows: by_bot[who].append(d)
    def report(name, ds):
        tot = sum(d.get('ms', 0) for d in ds) / 1000.0
        print('%s: %d waits, %.1f s waited' % (name, len(ds), tot))
        kinds = collections.defaultdict(list)
        for d in ds: kinds[d.get('kind', '?')].append(d)
        for k in sorted(kinds):
            ks = kinds[k]; secs = sum(d.get('ms', 0) for d in ks) / 1000.0
            ends = collections.Counter(d.get('end', '?') for d in ks)
            modes = collections.Counter(d.get('mode', '?') for d in ks)
            print('  %-7s %3d waits  %6.1f s  mean %5.2f s  ends %s  modes %s' % (k, len(ks), secs, secs / len(ks), dict(ends), dict(modes)))
    for who in sorted(by_bot): report(who, by_bot[who])
    if len(by_bot) > 1: report('TOTAL', [d for ds in by_bot.values() for d in ds])
    return 0

if __name__ == '__main__': sys.exit(main(sys.argv))
