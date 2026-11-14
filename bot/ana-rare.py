#!/usr/bin/env python3
# ana-rare.py v1.0.0 <dir>... -- the rare paths a section test proves and a series seldom reaches (round A, 13 Nov 2026: bot v0.6.222's
#   unsure list, counted at the real clock). Per series directory: each count and the matches it came from. Read-only; information,
#   not a gate (ana-gates.py stays the gate).
#     superseded     combat-superseded rows (a later combat of mine began while this one waited: v0.6.221-222), and the cot-cancelled
#                    rows of the same bot within 30 s after one (a Change of Target record ending a superseded combat: v0.6.222's path)
#     held turns     game-over rows of phase 'turn' (a turn begun after the game ended is held) and game-resumed rows (released when the
#                    game came back: v0.6.222); a game-over row of another phase is a turn cut short at the last oust, counted apart
#     rush comply    rushed rows, by the rushed bot's last block-as-target decision on a rush within 60 s: "on my Pass" (it did not
#                    mean to block), "on the actor's word" (it meant to block and the rush resolved: the v0.6.222 fix), "no rush
#                    decision" (no unlocked blocker, or a line-read rush)
#     fizzle         fizzled rows by kind (a bleed or a pool damage at a seat ousted in its window: v0.6.222)
#     ousted target  a resolution that still names a seat ousted before it: a rush or a card burn whose `through` names an owner
#                    with an earlier ousted row, a referendum whose deltas name an ousted seat, a peek whose actor's prey changed
#                    between the actor's announce decision and its through (BOARD: only a bleed and a pool damage fizzle)
#   Seats: manifest.seat where the table writes it (the arena), else the sim's B<seat>- name prefix.
import collections, glob, json, re, sys

VERSION = '1.0.0'

def _seat_map(rows):
    m = {}
    for r in rows:
        if r.get('type') != 'manifest': continue
        s = (r.get('data') or {}).get('seat')
        if s is None:
            g = re.match(r'B(\d+)-', r.get('bot') or '')
            s = int(g.group(1)) if g else None
        if s is not None: m[int(s)] = r['bot']
    return m

def _live_prey(order, gone, actor):   # the next live seat after the actor in seat order
    if actor not in order: return None
    i = order.index(actor)
    for k in range(1, len(order)):
        b = order[(i + k) % len(order)]
        if b not in gone and b != actor: return b
    return None

def audit(S):
    C = collections.Counter(); where = collections.defaultdict(list)
    files = sorted(glob.glob(S + '/match-*.jsonl')) or sorted(glob.glob(S + '/**/match-*.jsonl', recursive=True))
    for f in files:
        name = f.split('/')[-1]
        rows = [json.loads(l) for l in open(f) if l.strip()]; rows = [r for r in rows if 'bot' in r]; rows.sort(key=lambda r: r['t'])
        seats = _seat_map(rows); order = [seats[k] for k in sorted(seats)]
        oust_t = {}
        for r in rows:
            if r['type'] == 'ousted' and r['bot'] not in oust_t: oust_t[r['bot']] = r['t']
        def gone_at(t): return {b for b, ot in oust_t.items() if ot < t}
        def note(k): C[k] += 1; where[k].append(name)
        for i, r in enumerate(rows):
            t, d, ty = r['t'], (r.get('data') if isinstance(r.get('data'), dict) else {}), r['type']
            if ty == 'combat-superseded':
                note('superseded combats')
                if any(x['type'] == 'cot-cancelled' and x['bot'] == r['bot'] and 0 <= x['t'] - t <= 30000 for x in rows[i + 1:i + 400]):
                    note('superseded, then a CoT record ended it')
            elif ty == 'game-over':   # phase 'turn': a turn begun after the game ended is held (v0.6.222); any other phase: a turn cut short at the oust
                note('held turns (a turn begun after the game ended)' if d.get('phase') == 'turn' else 'turns ended at the game\'s end (' + str(d.get('phase')) + ')')
            elif ty == 'game-resumed': note('held turns released (game-resumed)')
            elif ty == 'fizzled': note('fizzled: ' + str(d.get('kind')))
            elif ty == 'rushed':
                prev = [x for x in rows[max(0, i - 600):i] if x['bot'] == r['bot'] and x['type'] == 'decide' and t - x['t'] < 60000
                        and (x.get('data') or {}).get('q') == 'block-as-target' and ((x['data'].get('ctx') or {}).get('sub') == 'rush')]
                if not prev: note('rush comply: no rush decision')
                elif (prev[-1]['data'].get('out') or {}).get('block'): note("rush comply: on the actor's word (meant to block)")
                else: note('rush comply: on my Pass')
            elif ty == 'through' and d.get('kind') in ('rush', 'burnCard'):
                if d.get('owner') in gone_at(t): note('ousted target: ' + d['kind'] + ' through')
            elif ty == 'through' and d.get('kind') == 'peek':
                ann = [x for x in rows[max(0, i - 600):i] if x['bot'] == r['bot'] and x['type'] == 'decide' and t - x['t'] < 120000]
                t0 = ann[-1]['t'] if ann else t
                if _live_prey(order, gone_at(t0), r['bot']) != _live_prey(order, gone_at(t), r['bot']): note('ousted target: peek through')
            elif ty == 'referendum' and d.get('passed'):
                g = gone_at(t)
                if any(seats.get(int(s)) in g for s in (d.get('deltas') or {}) if str(s).isdigit()): note('ousted target: referendum deltas')
    return C, where, files

if __name__ == '__main__':
    for S in sys.argv[1:]:
        C, where, files = audit(S)
        print('## %s -- %d matches (ana-rare %s)' % (S, len(files), VERSION))
        if not C: print('  none of the rare paths occurred'); continue
        for k in sorted(C):
            w = where[k]; tail = ', '.join(sorted(set(w))[:6]) + (' ...' if len(set(w)) > 6 else '')
            print('  %-48s %4d   %s' % (k, C[k], tail))
