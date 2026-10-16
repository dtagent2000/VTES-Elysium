#!/usr/bin/env python3
# ana-ledger.py <serie>... -- the two-sided ledger audit (v0.6.163 bug sweep): every effect that moves something between two bots must balance.
#  1 bleed: each took-bleed pairs with an actor 'through' within 6 s (victim > actor only with the actor's modifier plays; victim < actor only with the victim's own reduction -- v0.6.200)
#  2 combat names: round-1 rows whose opponent is null / not the vampire that names me back
#  3 combat numbers: my dealt vs the opponent's taken on reciprocal rows (prevent / Crows / combat ends explain the differences)
#  4 steal: stole (stealer) vs stolenFromMe (victim) totals; v0.6.196: and PER ROUND -- each stealer row paired with its victim's row (a total can hide two errors behind one excuse: 'capping' hid the stealer gaining from an empty vampire)
#  5 creep: Creeping Sabotage placements vs victim took-pooldmg via creep
import json,glob,sys,collections
for S in sys.argv[1:]:
    R=collections.Counter()
    for f in sorted(glob.glob(S+'/match-*.jsonl')):
        rows=[json.loads(l) for l in open(f)]; rows=[r for r in rows if 'bot' in r]; rows.sort(key=lambda r:r['t'])
        plays=[r for r in rows if r['type']=='play']
        for i,r in enumerate(rows):
            if r['type']=='took-bleed':
                prev=[x for x in rows[max(0,i-60):i] if x['type']=='through' and x['bot']!=r['bot'] and x['data'].get('kind') in (None,'bleed') and r['t']-x['t']<6000]
                if not prev: R['1 bleed: no actor row']+=1; continue
                a=prev[-1]; diff=r['data']['n']-a['data'].get('n',0)
                mods=[p for p in plays if p['bot']==a['bot'] and a['t']-3000<=p['t']<=r['t']]
                red=[p for p in plays if p['bot']==r['bot'] and p['data'].get('window')=='react-reduce' and a['t']-8000<=p['t']<=r['t']]   # v0.6.200: the target's own reduction (Protected District / Telepathic Misdirection class) -- honoured since R1, so a smaller hit is the rule working
                R['1 bleed: equal' if diff==0 else ('1 bleed: more, actor modifiers' if diff>0 and mods else ('1 bleed: MORE, UNEXPLAINED' if diff>0 else ('1 bleed: less, target reduced' if red else '1 bleed: LESS, UNEXPLAINED')))]+=1
        cr=[r for r in rows if r['type']=='combat-round']
        for r in cr:
            d=r['data']
            R['4 steal: stole']+=d.get('stole') or 0; R['4 steal: stolenFromMe']+=d.get('stolenFromMe') or 0
            if d.get('stole'):
                vic=[x for x in cr if x['bot']!=r['bot'] and x['data'].get('round')==d.get('round') and abs(x['t']-r['t'])<4000 and x['data'].get('vamp')==d.get('opp') and x['data'].get('opp')==d.get('vamp')]
                if not vic: R['4 steal pairs: no victim row']+=1
                else:
                    sv=vic[0]['data'].get('stolenFromMe') or 0
                    R['4 steal pairs: equal' if sv==d['stole'] else ('4 steal pairs: STOLE > VICTIM LOST' if d['stole']>sv else '4 steal pairs: VICTIM LOST > STOLE')]+=1
            if d.get('round')!=1: continue
            back=[x for x in cr if x['bot']!=r['bot'] and x['data'].get('round')==1 and abs(x['t']-r['t'])<4000 and x['data'].get('opp')==d.get('vamp')]
            mutual=[x for x in back if x['data'].get('vamp')==d.get('opp')]   # v0.6.172: back-to-back combats within 4 s made one-sided pairs look like a wrong name
            if mutual: back=mutual
            if d.get('opp') is None: R['2 names: opp NULL']+=1
            elif back and d.get('opp')!=back[0]['data'].get('vamp') and not [x for x in cr if x['bot']!=r['bot'] and x['data'].get('round')==1 and abs(x['t']-r['t'])<9000 and x['data'].get('vamp')==d.get('opp') and x['data'].get('opp')==d.get('vamp')]: R['2 names: opp WRONG']+=1
            elif back: R['2 names: right']+=1
            else: R['2 names: no reciprocal row']+=1
            if back:
                o=back[0]['data']
                if d.get('range')!=o.get('range'): R['3 combat: RANGE DISAGREES']+=1
                if isinstance(d.get('dealt'),(int,float)) and isinstance(o.get('taken'),(int,float)):
                    df=o['taken']-d['dealt']
                    R['3 combat: dealt==taken' if df==0 else ('3 combat: taken<dealt' if df<0 else '3 combat: taken>dealt')]+=1
        R['5 creep: placed']+=sum(1 for r in rows if r['type']=='through' and r['data'].get('card')=='Creeping Sabotage')
        R['5 creep: victim burns']+=sum(1 for r in rows if r['type']=='took-pooldmg' and r['data'].get('via')=='creep')
    print('##',S)
    for k in sorted(R): print('  %-36s %s'%(k,R[k]))
