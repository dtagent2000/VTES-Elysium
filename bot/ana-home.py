#!/usr/bin/env python3
# ana-home.py <serieA> <serieB> -- the paired read for spec-home-pricing: per deck plan.home, 'no unlocked body' windows, blocks made, pool damage dealt,
# median oust turn, VP; act-again branches; match length / timeouts; Johan's J1 (edge raises before an oust). Deck and seat from the manifest only.
import json,glob,sys,collections,statistics as st
def read(S):
    R=dict(home=collections.defaultdict(lambda:[0,0]),nobody=collections.Counter(),blocks=collections.Counter(),dealt=collections.Counter(),oust=collections.defaultdict(list),
           vp=collections.Counter(),wins=collections.Counter(),aa=collections.Counter(),rounds=[],timeouts=0,turns=collections.Counter(),j1=[],ousts=0,hold=collections.defaultdict(lambda:[0,0]))
    for f in sorted(glob.glob(S+'/match-*.jsonl')):
        rows=[json.loads(l) for l in open(f)]
        deck={r['bot']:r['data']['deck'] for r in rows if r['type']=='manifest'}
        res=[r for r in rows if r['type']=='result'][0]['data']; R['rounds'].append(res.get('rounds')); R['timeouts']+=1 if res.get('reason')=='timeout' else 0
        for b in deck: R['vp'][deck[b]]+=res['vp'].get(b,0)
        if res.get('winner') in deck: R['wins'][deck[res['winner']]]+=1
        turn=collections.Counter(); plans=collections.defaultdict(dict); raises=collections.defaultdict(list); dmg=collections.defaultdict(list)
        for r in rows:
            b=r.get('bot')
            if not b or b not in deck: continue
            d=r['data']; dk=deck[b]; t=r['type']
            if t=='plan' and d.get('tag')=='unlock':
                turn[b]=d['turn']; plans[b][d['turn']]=d; R['turns'][dk]+=1
                if d['turn']>=3: R['home'][dk][1]+=1; R['home'][dk][0]+=1 if (d.get('home') or 0)>=1 else 0; R['hold'][dk][1]+=1; R['hold'][dk][0]+=1 if d.get('posture')=='hold' else 0
            if t=='decide' and d['q']=='block-as-target' and 'no unlocked body' in (d['out'].get('why') or ''): R['nobody'][dk]+=1
            if t=='block-made': R['blocks'][dk]+=1
            if t=='through' and (d.get('n') or 0)>0 and d.get('card')!='hunt' and d.get('kind') not in('stock','rush','equip','strength','recruit','ownRescue','enemyRescue','leaveTorpor'): R['dealt'][dk]+=d['n']
            if t=='decide' and d['q']=='act-again' and d['out'].get('play') is not None: R['aa'][d['out'].get('tag') or ('play' if d['out'].get('play') else 'hold')]+=1
            if t=='raise': raises[b].append((turn[b],d.get('need') or 0,d.get('poolAfter')))
            if t in('took-bleed','took-pooldmg'): dmg[b].append((turn[b],d.get('n',0),d.get('pool')))
            if t=='ousted':
                R['oust'][dk].append(turn[b]); R['ousts']+=1; T=turn[b]
                edge=[]
                for (rt,need,pa) in raises[b]:
                    if rt>=T-2 and pa is not None:
                        p=plans[b].get(rt) or {}; rd=p.get('reads') or {}; crit=(rd.get('crit') or {}).get('crit',6)
                        if pa<=crit: edge.append(dict(turn=rt,need=need,poolAfter=pa,crit=crit,obvious=(rd.get('predFc') or 0)>=pa,statsOK=((rd.get('myFc') or 0)*(rd.get('myTto') or 0))>=(rd.get('preyPool') or 99)))
                if edge:
                    last=[x for x in dmg[b] if x[0]==T]; overkill=-(last[-1][2]) if last and last[-1][2] is not None else 0
                    spent=sum(e['need'] for e in edge)
                    R['j1'].append(dict(deck=dk,oustTurn=T,spent=spent,overkill=overkill,wouldHaveLived=spent>overkill,obvious=any(e['obvious'] for e in edge),statsOK=any(e['statsOK'] for e in edge)))
    return R
A,B=read(sys.argv[1]),read(sys.argv[2]); decks=sorted(A['turns'])
pc=lambda x:('%d %%'%round(100*x[0]/x[1])) if x[1] else '–'; md=lambda v:st.median(v) if v else '–'
print('| deck | home>=1 at unlock (turn 3+) A → B | hold posture A → B | no-unlocked-body windows | blocks made | POOL DAMAGE DEALT | per own turn | median oust turn | VP | wins |'); print('|---|---|---|---|---|---|---|---|---|---|')
for k in decks:
    da,db=A['dealt'][k],B['dealt'][k]
    print('| %s | %s → %s | %s → %s | %d → %d | %d → %d | %d → %d (%+d %%) | %.2f → %.2f | %s → %s | %s → %s | %d → %d |'%(k,pc(A['home'][k]),pc(B['home'][k]),pc(A['hold'][k]),pc(B['hold'][k]),A['nobody'][k],B['nobody'][k],A['blocks'][k],B['blocks'][k],da,db,round(100*(db-da)/max(1,da)),da/max(1,A['turns'][k]),db/max(1,B['turns'][k]),md(A['oust'][k]),md(B['oust'][k]),A['vp'][k],B['vp'][k],A['wins'][k],B['wins'][k]))
print('\nrounds A',A['rounds'],'median',md(A['rounds']),'timeouts',A['timeouts']); print('rounds B',B['rounds'],'median',md(B['rounds']),'timeouts',B['timeouts'])
print('act-again A',dict(A['aa'])); print('act-again B',dict(B['aa']))
for nm,R in (('A',A),('B',B)):
    j=R['j1']; print('\nJ1 %s: ousts %d · preceded by an edge raise %d · would have lived without it %d · obvious %d · statistics on its side %d'%(nm,R['ousts'],len(j),sum(1 for x in j if x['wouldHaveLived']),sum(1 for x in j if x['obvious']),sum(1 for x in j if x['statsOK'])))
    print('   by deck:',dict(collections.Counter(x['deck'] for x in j)))
