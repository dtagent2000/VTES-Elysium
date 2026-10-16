#!/usr/bin/env python3
# ana-combat2.py <serie> -- reads the v0.6.156 combat-round rows: per deck range/dealt/taken/press/continuation, plus handshake integrity (do both sides log the same round?)
# v0.6.202 (R2): + agreement -- of the matched round pairs, do both sides see the same range and the same press outcome; + the step handshake (rows with hs, waits that ran into the safety net)
import json,glob,sys,collections
S=sys.argv[1]; per=collections.defaultdict(lambda: collections.defaultdict(float)); press=collections.defaultdict(collections.Counter); ends=collections.defaultdict(collections.Counter)
strikes=collections.defaultdict(collections.Counter); n=0; matched=0; unmatched=0; res=collections.Counter(); vp=collections.Counter(); torp=collections.Counter()
agree=collections.Counter(); hsrows=0; hsmiss=collections.Counter()
for f in sorted(glob.glob(S+'/match-*.jsonl')):
    rows=[json.loads(l) for l in open(f)]; n+=1
    deck={r['bot']:r['data']['deck'] for r in rows if r['type']=='manifest'}
    R=[r for r in rows if r['type']=='result'][0]['data']
    if R.get('winner') in deck: res[deck[R['winner']]]+=1
    for b in deck: vp[deck[b]]+=R['vp'].get(b,0)
    cr=[r for r in rows if r['type']=='combat-round']
    for r in rows:
        if r['type']=='torpor': torp[deck.get(r['bot'],'?')]+=1
    for r in cr:
        d=r['data']; dk=deck[r['bot']]; p=per[dk]; p['rounds']+=1
        if d.get('range')=='long': p['long']+=1
        if isinstance(d.get('dealt'),(int,float)): p['dealt']+=d['dealt']
        if isinstance(d.get('taken'),(int,float)): p['taken']+=d['taken']
        if d.get('grapple'): p['grapple']+=1
        if d.get('continuing'): p['continued']+=1
        if d.get('round')==1: p['combats']+=1
        press[dk][d.get('press') or '-']+=1; ends[dk][d.get('end') or ('continue' if d.get('continuing') else 'separate')]+=1; strikes[dk][d.get('strike')]+=1
        # integrity: opponent's row for the same round, crossed names, within 4 s
        m=[x for x in cr if x['bot']!=r['bot'] and x['data'].get('round')==d.get('round') and abs(x["t"]-r["t"])<9000 and (x['data'].get('opp')==d.get('vamp') or x['data'].get('vamp')==d.get('opp'))]
        if m: matched+=1
        else: unmatched+=1
        if d.get('hs'): hsrows+=1
        for k in (d.get('hsMiss') or []): hsmiss[k]+=1
        if m:
            o=m[0]['data']
            agree['range-same' if (d.get('range')==o.get('range')) else 'range-differs']+=1
            if 'continuing' in d and 'continuing' in o and not d.get('end') and not o.get('end'): agree['press-same' if bool(d.get('continuing'))==bool(o.get('continuing')) else 'press-differs']+=1
print('matches',n,'| wins',dict(res),'| VP',dict(vp),'| torpor',dict(torp))
print('handshake integrity: rounds with a matching opponent row',matched,'/ without',unmatched,'(%d %%)'%round(100*matched/max(1,matched+unmatched)))
rs=agree['range-same']+agree['range-differs']; ps=agree['press-same']+agree['press-differs']
print('agreement (matched pairs, counted from each side): range same %d / differs %d (%d %%) | press outcome same %d / differs %d (%d %%)'%(agree['range-same'],agree['range-differs'],round(100*agree['range-same']/max(1,rs)),agree['press-same'],agree['press-differs'],round(100*agree['press-same']/max(1,ps))))
print('step handshake (v0.6.202): rows with hs',hsrows,'| waits that ran into the safety net',dict(hsmiss) if hsmiss else 0)
for dk in sorted(per):
    p=per[dk]; r=max(1,p['rounds'])
    print('\n==',dk,'| combats %d rounds %d (%.2f/combat) | long %d %% | dealt/round %.2f taken/round %.2f | grapple %d | continued %d'%(p['combats'],p['rounds'],p['rounds']/max(1,p['combats']),100*p['long']/r,p['dealt']/r,p['taken']/r,p['grapple'],p['continued']))
    print('  strikes:',dict(strikes[dk].most_common()))
    print('  press:',dict(press[dk].most_common()))
    print('  round end:',dict(ends[dk].most_common()))
