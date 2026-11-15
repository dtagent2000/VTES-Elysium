#!/usr/bin/env python3
# ana-guide-check.py DIR [DECK] -- a deck's guide-check situations on a sim trace dir (15 Nov 2026, bot v0.6.229, the bench round;
#   specs/spec-bench-round-2026-11-15.md). Read-only, one-off class (HOWTO): it reproduces the counts the bench round's spec and PR cite,
#   which the 13 Nov guide check (reports/REPORT-toreador-guide-check-2026-11-13.md) counted with a scratch script. The deck's seat comes
#   from the result row's `bots` (LESSONS L-79), never from a name. DECK defaults to toreador.
#   Sections: the Grand Ball (its turn, its bars, its burns), the referendums (their place in the turn, blocked by place), the first
#   influence (the biggest uncontrolled superior-stock vampire first), the first offensive action, Scalpel Tongue (the count-turning
#   abstain and the lock), the first block window at another deck's bleed (calm / the edge, read as a stealth bleeder, attempts), Villein
#   (the host's blood left), and the bench round's own rows (key-order, pol-hold, ball-wait, the planner's engine term). The first
#   influence reads the deck's superior-stock table (stock_sup: malkavian, tremere, ventrue, toreador; nosferatu has none, so it prints
#   no first-influence rows). The lock turns count the turns where no act of mine followed the lock (its cost bought nothing).
#   --json prints the counts as one JSON object (for a paired read of two arms).
import json, glob, os, sys, collections

def base(n):
    return (n or '').split(' (G')[0]

def stock_sup(deck):
    # the deck's superior-stock vampires by name -> capacity: the crypt cards bot v0.6.229's _engineY reads above 0 (a superior blood-stock
    # action the library holds 4+ of: Enchant Kindred [PRE], Govern the Unaligned [DOM] ...; the youngest of them reads 0 and is not listed)
    return {
        'malkavian': {'Alexander Silverson': 8, 'Andi Liu': 6, 'Gelasia Fotiou': 6},
        'tremere': {'Ayelech': 7, 'Lloyd Brooks': 6, 'Trevon Parker': 6},
        'ventrue': {'Alexa Draper': 8, 'Alice Chen': 7, 'Madison': 6, 'Naomi Stewart': 5, 'Sybren van Oosten': 7},
        'toreador': {'Bret Stryker': 4, 'Catalina Vega': 8, 'Flávio Gonçalves': 7, 'Kathy Glens': 5, 'Mkhokheli': 6, 'Tamoszius': 5},
    }.get(deck, {})

def scan(D, DECK):
    C = collections.Counter()
    L = collections.defaultdict(list)
    SUP = stock_sup(DECK)
    for f in sorted(glob.glob(os.path.join(D, 'match-*.jsonl'))):
        rows = [json.loads(l) for l in open(f) if l.strip()]
        res = next((r['data'] for r in rows if r['type'] == 'result'), None)
        if not res or res.get('crash') or not res.get('bots'):
            C['skipped'] += 1
            continue
        bots = {b['name']: b for b in res['bots']}
        me = next((n for n, b in bots.items() if b['deck'] == DECK), None)
        if not me:
            continue
        N = len(bots); seat = bots[me]['seat']
        deck_of_seat = {b['seat']: b['deck'] for b in res['bots']}
        name_of_seat = {b['seat']: b['name'] for b in res['bots']}
        prey = name_of_seat.get(seat % N + 1)
        C['matches'] += 1
        L['vp'].append(res['vp'].get(me, 0))
        mine = [r for r in rows if r.get('bot') == me]
        # the turn's acts in order, by round (my own turn's acts only: through / blocked / referendum-called are the actor's rows)
        acts = collections.defaultdict(list)
        pend = None; hand = []
        for r in mine:
            t, d, rd = r['type'], r.get('data') or {}, r.get('round')
            if t == 'decide':
                if 'hand' in d: hand = d['hand']
                if d.get('q') == 'action':
                    pk = (d.get('out') or {}).get('pick') or {}
                    pend = pk.get('kind') or 'bleed'
                elif d.get('q') == 'hunt-or-bleed' and (d.get('out') or {}).get('hunt'):
                    pend = 'hunt'
            elif t == 'referendum-called':
                acts[rd].append({'k': 'pol', 'v': d.get('vamp'), 'card': d.get('card'), 'hand': list(hand), 'res': None}); pend = None
            elif t == 'referendum':
                for a in reversed(acts[rd]):
                    if a['k'] == 'pol' and a['v'] == d.get('vamp') and a['res'] is None:
                        a['res'] = 'pass' if d.get('passed') else 'fail'; break
            elif t == 'blocked' and d.get('kind') == 'political':
                for a in reversed(acts[rd]):
                    if a['k'] == 'pol' and a['v'] == d.get('vamp') and a['res'] is None:
                        a['res'] = 'blocked'; break
            elif t in ('through', 'blocked'):
                if d.get('kind') == 'political':
                    continue
                k = d.get('kind') or ('hunt' if d.get('card') == 'hunt' else pend or 'bleed')
                acts[rd].append({'k': k, 'v': d.get('vamp'), 'res': t, 'by': d.get('by')}); pend = None
            elif t == 'keep-blocker':
                acts[rd].append({'k': 'home', 'v': d.get('vamp'), 'res': None})
            elif t == 'key-order':
                C['key-order ' + str(d.get('rule'))] += 1
            elif t == 'pol-hold':
                C['pol-hold ' + str(d.get('key'))] += 1
            elif t == 'ball-wait':
                C['ball-wait'] += 1
        # the referendum's place among the turn's acts (home bodies are not acts)
        for rd, a in acts.items():
            real = [x for x in a if x['k'] != 'home']
            pol = [i for i, x in enumerate(real) if x['k'] == 'pol']
            for i in pol:
                C['ref ' + str(real[i]['res'])] += 1
            if not pol:
                continue
            C['turns with a referendum'] += 1
            if len(real) >= 2:
                C['turns with a referendum and another act'] += 1
                i = pol[0]
                pos = 'first' if i == 0 else 'last' if i == len(real) - 1 else 'middle'
                C['ref ' + pos] += 1
                C['ref ' + pos + ' ' + str(real[i]['res'])] += 1
            for x in real:
                if x['k'] == 'bleed':
                    C['bleed ' + x['res']] += 1
        for rd, a in acts.items():
            for x in a:
                if x['k'] == 'bleed' and not any(y['k'] == 'pol' for y in a):
                    C['bleed (no referendum that turn) ' + x['res']] += 1
        # the Grand Ball
        balls = [r for r in mine if r['type'] == 'grand-ball']
        burned = [r for r in mine if r['type'] == 'card-burned' and (r.get('data') or {}).get('card') == 'Toreador Grand Ball']
        bars = [r for r in mine if r['type'] == 'grand-ball-bar']
        for b in balls:
            C['balls'] += 1
            rd, free = b['round'], b['data']['free']
            a = acts.get(rd, [])
            seen_free = False; earlier = False; kept = False; acted = False
            for x in a:
                if x['v'] == free:
                    if x['k'] == 'home':
                        kept = True
                    else:
                        acted = True; seen_free = True
                elif x['k'] == 'pol' and not seen_free:
                    earlier = True
            if any(x['k'] == 'pol' and x['v'] == free for x in a):
                C['ball turn: the free one calls'] += 1
            elif kept:
                C['ball turn: the free one kept home'] += 1
            elif earlier:
                C['ball turn: an earlier caller'] += 1
            elif acted:
                C['ball turn: the free one does else'] += 1
            else:
                C['ball turn: the free one idle'] += 1
            end = next((r['round'] for r in burned if r['round'] >= rd), None)
            if end is not None:
                C['balls burned'] += 1; L['ball life'].append(end - rd)
            nb = sum(1 for r in bars if r['round'] >= rd and (end is None or r['round'] <= end))
            L['bars per ball'].append(nb)
            if nb:
                C['balls with a bar'] += 1
        # the first influence
        dealt = next((r['data'] for r in mine if r['type'] == 'dealt'), {})
        unc = [base(n) for n in dealt.get('unc', [])]
        raises = [r['data'] for r in mine if r['type'] == 'raise']
        if raises and SUP:
            first = base(raises[0]['name'])
            cand = [n for n in unc if n in SUP]
            if cand:
                guide = max(cand, key=lambda n: SUP[n])
                C['first influence: guide pick available'] += 1
                C['first influence: ' + ('the guide pick' if first == guide else 'a smaller superior' if first in SUP else 'another')] += 1
            L['first raise turn'].append(raises[0].get('turn'))
            if len(raises) >= 3:
                L['third raise turn'].append(raises[2].get('turn'))
        ip = next((r['data'] for r in mine if r['type'] == 'influence-plan'), None)
        if ip and 'engScore' in (ip.get('parts') or {}):
            C['influence-plan with the engine term'] += 1
        L['stocks'].append(sum(1 for r in mine if r['type'] == 'through' and (r.get('data') or {}).get('kind') == 'stock'))
        # the first offensive action (a bleed or a referendum): my ready vampires at that round's unlock snapshot
        ready_at = {}
        for r in mine:
            d = r.get('data') or {}
            if r['type'] == 'snapshot' and d.get('tag') == 'unlock' and r.get('round') not in ready_at:
                ready_at[r.get('round')] = len(d.get('ready') or [])
        first_off = next(((rd, x['k']) for rd in sorted(acts) for x in acts[rd] if x['k'] in ('pol', 'bleed')), None)
        if first_off:
            C['first offence at ready %s' % ready_at.get(first_off[0], '?')] += 1
            C['first offence a ' + ('referendum' if first_off[1] == 'pol' else 'bleed')] += 1
        # Scalpel Tongue
        for r in mine:
            if r['type'] == 'abstain':
                C['abstain ' + str((r.get('data') or {}).get('use', 'count'))] += 1
        for rd, a in acts.items():
            for i, x in enumerate(a):
                if x['k'] != 'pol' or x['res'] != 'pass' or 'Scalpel Tongue' not in x.get('hand', []):
                    continue
                pv = [r2 for r2 in rows if r2.get('bot') == prey and r2['type'] == 'ref-vote' and r2.get('round') == rd
                      and (r2.get('data') or {}).get('card') == x['card'] and (r2.get('data') or {}).get('dir') == 'against' and ((r2.get('data') or {}).get('n') or 0) > 0]
                later = [y for y in a[i + 1:] if y['k'] == 'bleed']
                if pv and later:
                    C['passed referendum, Scalpel in hand, prey against, a later bleed'] += 1
                    C['  its later bleeds'] += len(later)
                    C['  its later bleeds blocked'] += sum(1 for y in later if y['res'] == 'blocked')
        locks = [r for r in mine if r['type'] == 'abstain' and (r.get('data') or {}).get('use') == 'lock']
        for lk in locks:
            a = acts.get(lk['round'], [])
            i = next((j for j, x in enumerate(a) if x['k'] == 'pol' and x['v'] == lk['data'].get('by')), None)
            if i is None:
                continue
            later = [y for y in a[i + 1:] if y['k'] == 'bleed']
            C['lock turns'] += 1
            if not any(y['k'] != 'home' for y in a[i + 1:]):
                C['  lock turns: no later act'] += 1
            C['  lock turns: later bleeds'] += len(later)
            C['  lock turns: later bleeds blocked'] += sum(1 for y in later if y['res'] == 'blocked')
        # the pool my predator's bleeds took (a bleed at me is my predator's unless bounced), by the predator's deck
        pred = deck_of_seat.get((seat - 2) % N + 1)
        L['pool lost to bleeds, predator ' + str(pred)].append(sum((r.get('data') or {}).get('n', 0) for r in mine if r['type'] == 'took-bleed'))
        # the blood-cost cards played (Toreador's: Majesty, Aire of Elation, Perfect Paragon, Resist Earth's Grasp, Scalpel Tongue)
        for r in mine:
            if r['type'] == 'play' and (r.get('data') or {}).get('card') in ('Majesty', 'Aire of Elation', 'Perfect Paragon', "Resist Earth's Grasp", 'Scalpel Tongue'):
                C['play ' + r['data']['card']] += 1
        # my first block window at another deck's bleed (T1)
        for r in mine:
            if r['type'] != 'decide' or (r.get('data') or {}).get('q') != 'block-as-target':
                continue
            cx = r['data'].get('ctx') or {}; out = r['data'].get('out') or {}
            if cx.get('T') != 'T1' or not cx.get('isBleed') or cx.get('blockAllowed') is False:
                continue
            dk = deck_of_seat.get(cx.get('actorSeat'), '?')
            zone = 'edge' if cx.get('edge') else 'calm'
            sb = 'read' if cx.get('stealthBleeder') else 'unread'
            C['bleed window %s %s %s' % (dk, zone, sb)] += 1
            if out.get('block'):
                C['bleed attempt %s %s %s' % (dk, zone, sb)] += 1
            if out.get('tag') == 'clog':
                C['clog %s' % dk] += 1
        # Villein
        dng = None
        for r in mine:
            d = r.get('data') or {}
            if r['type'] == 'decide' and d.get('q') == 'villein':
                dng = bool((d.get('ctx') or {}).get('danger')) if (d.get('out') or {}).get('play') else None
                if any('reserve2' in c for c in ((d.get('ctx') or {}).get('cands') or [])):
                    C['villein with the two-card reserve'] += 1
            if r['type'] == 'villein' and dng is not None:
                z = 'edge' if dng else 'calm'
                C['villein %s left %s' % (z, min(3, d.get('blood', 0)))] += 1
                L['villein %s moved' % z].append(d.get('moved', 0))
                dng = None
    return C, L

def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if not a:
        print('usage: ana-guide-check.py DIR [DECK] [--json]'); sys.exit(2)
    D = a[0]; DECK = a[1] if len(a) > 1 else 'toreador'
    C, L = scan(D, DECK)
    mean = lambda x: (sum(x) / len(x)) if x else 0
    if '--json' in sys.argv:
        out = dict(C); out.update({k: round(mean(v), 3) for k, v in L.items()})
        print(json.dumps(out, sort_keys=True)); return
    print('%s · %s · %d matches · VP/match %.3f' % (D, DECK, C['matches'], mean(L['vp'])))
    for k in sorted(C):
        print('  %-62s %d' % (k, C[k]))
    for k in sorted(L):
        if k != 'vp':
            print('  %-62s mean %.2f (n %d)' % (k, mean(L[k]), len(L[k])))

if __name__ == '__main__':
    main()
