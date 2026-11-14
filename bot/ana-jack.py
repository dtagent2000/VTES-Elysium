#!/usr/bin/env python3
# ana-jack.py DIR... -- Smiling Jack's life in a series of traces (13 Nov 2026, round B, RULINGS D-114 and its spec's section 9). Read-only.
#   Per directory: how many times a bot played Jack (a `master-play` decision that picks it), how each one left play -- burned (a
#   `through` row of kind burnCard on Jack: who burned it), with its owner (the owner's `ousted` row), or still in play when the match
#   ended -- and the rounds it stood (median and mean; a Jack still standing at the end is counted to the match's last round). Then the
#   knob's proof of firing: the action decisions whose pick is a burn of Jack (by deck), and the burns of Jack that were blocked
#   (the actor's `blocked` row of kind burnCard).
#   Usage: python3 ana-jack.py DIR [DIR ...]   (each DIR holds match-*.jsonl, the sim's or the arena's)
import glob, json, os, statistics, sys

JACK = 'Smiling Jack, The Anarch'

def deck(bot):
    return bot.split('-', 1)[1] if bot and '-' in bot else (bot or '?')

def audit(d):
    plays, ended, life, burners, picks, blocked = 0, {'burned': 0, 'with its owner': 0, 'at the match end': 0}, [], {}, {}, 0
    for f in sorted(glob.glob(os.path.join(d, 'match-*.jsonl'))):
        rows = []
        for line in open(f, encoding='utf-8'):
            line = line.strip()
            if line:
                try: rows.append(json.loads(line))
                except ValueError: pass
        last = max([r.get('round') or 0 for r in rows] or [0])
        live = []                                     # (owner, round played) of the Jacks standing now
        for r in rows:
            t, b, rd, x = r.get('type'), r.get('bot'), r.get('round') or 0, r.get('data') or {}
            if t == 'decide' and x.get('q') == 'master-play':
                p = (x.get('out') or {}).get('pick')
                if isinstance(p, dict) and p.get('name') == JACK:
                    plays += 1; live.append((b, rd))
            elif t == 'decide' and x.get('q') == 'action':
                p = (x.get('out') or {}).get('pick')
                if isinstance(p, dict) and p.get('kind') == 'burnCard' and ((p.get('target') or {}).get('card') == JACK):
                    picks[deck(b)] = picks.get(deck(b), 0) + 1
            elif t == 'blocked' and x.get('kind') == 'burnCard' and x.get('card') == JACK:
                blocked += 1
            elif t == 'through' and x.get('kind') == 'burnCard' and x.get('card') == JACK:
                own = x.get('owner')
                for i, (o, r0) in enumerate(live):
                    if o == own:
                        ended['burned'] += 1; life.append(rd - r0); burners[deck(b)] = burners.get(deck(b), 0) + 1; live.pop(i); break
            elif t == 'ousted':
                for i in [i for i, (o, r0) in enumerate(live) if o == b][::-1]:
                    ended['with its owner'] += 1; life.append(rd - live[i][1]); live.pop(i)
        for (o, r0) in live:
            ended['at the match end'] += 1; life.append(last - r0)
    return plays, ended, life, burners, picks, blocked

def main(dirs):
    for d in dirs:
        plays, ended, life, burners, picks, blocked = audit(d)
        n = len(glob.glob(os.path.join(d, 'match-*.jsonl')))
        print('## %s -- %d matches (ana-jack 1.0.0)' % (d, n))
        print('  Jack played                 %d' % plays)
        for k, v in ended.items(): print('    left play %-17s %d' % (k, v))
        if life:
            print('  rounds in play              median %.1f · mean %.2f · max %d' % (statistics.median(life), statistics.mean(life), max(life)))
        print('  burned by                   %s' % (', '.join('%s %d' % kv for kv in sorted(burners.items())) or '-'))
        print('  Jack-burn picks (the knob)  %d%s · blocked %d' % (sum(picks.values()), (' (' + ', '.join('%s %d' % kv for kv in sorted(picks.items())) + ')') if picks else '', blocked))

if __name__ == '__main__':
    if len(sys.argv) < 2: print(__doc__ or 'usage: ana-jack.py DIR...'); sys.exit(2)
    main(sys.argv[1:])
