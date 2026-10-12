#!/usr/bin/env python3
# ana-combat.py <serie> -- per deck combat read: rounds, windows, Grapple pairing, Taste pairing, press, dodge, prevent, blood deltas.
import json,glob,sys,collections
S=sys.argv[1]
W=('combat-grapple','combat-strike','combat-steal','combat-press','combat-dodge','combat-prevent','combat-env','combat-end','combat-after','combat-maneuver')
per=collections.defaultdict(lambda: collections.defaultdict(int)); cards=collections.defaultdict(collections.Counter)
grap=collections.defaultdict(collections.Counter); taste=collections.defaultdict(collections.Counter); press=collections.defaultdict(collections.Counter)
dodgeQ=collections.defaultdict(collections.Counter); ceQ=collections.defaultdict(collections.Counter); torp=collections.Counter(); rounds_per_combat=collections.defaultdict(collections.Counter)
strikeBlood=collections.defaultdict(list); res=collections.Counter(); vp=collections.Counter(); n=0
for f in sorted(glob.glob(S+'/match-*.jsonl')):
    rows=[json.loads(l) for l in open(f)]; n+=1
    deck={r['bot']:r['data']['deck'] for r in rows if r['type']=='manifest'}
    R=[r for r in rows if r['type']=='result'][0]['data']
    if R.get('winner') in deck: res[deck[R['winner']]]+=1
    for b in deck: vp[deck[b]]+=R['vp'].get(b,0)
    # group combat events per (bot,vamp), gap>8s = new combat
    ev=collections.defaultdict(list)
    for r in rows:
        b=r.get('bot'); d=r.get('data') or {}
        if b not in deck: continue
        if r['type']=='play' and d.get('window') in W: ev[(b,d.get('vamp'))].append((r['t'],'play',d['window'],d['card'],None))
        if r['type']=='decide' and d.get('q')=='combat-strike': ev[(b,d['ctx']['vamp']['name'])].append((r['t'],'round',None,None,d))
        if r['type']=='decide' and d.get('q')=='combat-end': ev[(b,d['ctx']['vamp']['name'])].append((r['t'],'ce',None,None,d))
        if r['type']=='torpor': torp[deck[b]]+=1
    for (b,v),L in ev.items():
        dk=deck[b]; L.sort(); combats=[]; cur=[]
        for e in L:
            if cur and e[0]-cur[-1][0]>8000: combats.append(cur); cur=[]
            cur.append(e)
        if cur: combats.append(cur)
        per[dk]['combats']+=len(combats)
        for c in combats:
            rnds=[e for e in c if e[1]=='round']; per[dk]['rounds']+=len(rnds); rounds_per_combat[dk][len(rnds)]+=1
            plays=[e for e in c if e[1]=='play']
            for e in plays: cards[dk][(e[2],e[3])]+=1
            for e in c:
                if e[1]=='round':
                    o=e[4]['out']; dodgeQ[dk]['dodge' if o.get('dodge') else ('strike(dodge avail)' if e[4]['ctx'].get('dodge') else 'strike')]+=1
                    strikeBlood[dk].append(e[4]['ctx']['vamp']['blood'])
                if e[1]=='ce': ceQ[dk]['end' if e[4]['out'].get('end') else 'fight']+=1
            # Grapple pairing: a strike-card play by same vamp within 1500ms after
            for i,e in enumerate(c):
                if e[1]=='play' and e[2]=='combat-grapple':
                    nxt=[x for x in c if x[1]=='play' and x[0]-e[0]<=1500 and x[0]>=e[0] and x[2] in('combat-strike','combat-steal')]
                    grap[dk]['+'+nxt[0][3] if nxt else 'bare hands']+=1
                if e[1]=='play' and e[2]=='combat-after':
                    prev=[x for x in c if x[1]=='play' and 0<=e[0]-x[0]<=1500 and x[2] in('combat-strike','combat-steal','combat-env','combat-grapple')]
                    taste[dk]['after '+'+'.join(sorted(set(x[3] for x in prev))) if prev else 'after bare hands']+=1
                if e[1]=='play' and e[2]=='combat-press': press[dk][e[3]]+=1
print('matches',n,'| wins',dict(res),'| VP',dict(vp))
for dk in sorted(per):
    print('\n==',dk,'| combats',per[dk]['combats'],'| rounds',per[dk]['rounds'],'| rounds/combat',dict(sorted(rounds_per_combat[dk].items())),'| torpor',torp[dk])
    print('  plays:',', '.join('%s %s ×%d'%(w.replace('combat-',''),c,k) for (w,c),k in cards[dk].most_common()))
    print('  strike decision:',dict(dodgeQ[dk]),'| blood at strike (avg %.1f, <=1: %d)'%(sum(strikeBlood[dk])/max(1,len(strikeBlood[dk])), sum(1 for x in strikeBlood[dk] if x<=1)))
    if grap[dk]: print('  Grapple paired with:',dict(grap[dk]))
    if taste[dk]: print('  Taste of Vitae:',dict(taste[dk]))
    if press[dk]: print('  press cards:',dict(press[dk]))
    if ceQ[dk]: print('  combat-end decision:',dict(ceQ[dk]))
