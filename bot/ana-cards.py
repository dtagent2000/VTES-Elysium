#!/usr/bin/env python3
# ana-cards.py <serie> -- per deck: every library card's uses (play / through / blocked / referendum-called / master-play), per match; the never-played list; untitled plays of titled cards.
import json,glob,sys,collections
S=sys.argv[1]; fx=json.load(open('elysium-cardfx.json'))
used=collections.defaultdict(collections.Counter); wins=collections.defaultdict(collections.Counter); bad=[]; n=0; res=collections.Counter(); vp=collections.Counter(); reasons=collections.Counter(); errs=0; aa=collections.Counter(); stealthQ=collections.defaultdict(lambda:[0,0]); blocked=collections.defaultdict(lambda:[0,0])
for f in sorted(glob.glob(S+'/match-*.jsonl')):
    rows=[json.loads(l) for l in open(f)]; n+=1
    deck={r['bot']:r['data']['deck'] for r in rows if r['type']=='manifest'}
    R=[r for r in rows if r['type']=='result'][0]['data']; reasons[R.get('reason')]+=1
    if R.get('winner') in deck: res[deck[R['winner']]]+=1
    for b in deck: vp[deck[b]]+=R['vp'].get(b,0)
    for r in rows:
        if r['type']=='server-err': errs+=1
        b=r.get('bot'); d=r.get('data') or {}
        if b not in deck: continue
        dk=deck[b]
        if r['type']=='play': used[dk][d['card']]+=1; wins[dk][d.get('window')]+=1
        if r['type']=='play' and d.get('vamp'):
            e=fx['lib'].get(d['card']) or {}
            if (e.get('req') or {}).get('title'):
                t=(fx['crypt'].get(d['vamp']) or {}).get('title')
                if not t: bad.append((dk,d['card'],d['vamp']))
        if r['type'] in('through','blocked') and d.get('card') and d['card']!='hunt': used[dk][d['card']]+=1
        if r['type'] in('through','blocked'): blocked[dk][1]+=1; blocked[dk][0]+=1 if r['type']=='blocked' else 0
        if r['type']=='decide' and d.get('q')=='master-play' and (d['out'].get('pick') or {}).get('name'): used[dk][d['out']['pick']['name']]+=1
        if r['type']=='decide' and d.get('q')=='spend-stealth': stealthQ[dk][1]+=1; stealthQ[dk][0]+=1 if (d['out'].get('play') or d['out'].get('spend')) else 0
        if r['type']=='decide' and d.get('q')=='act-again': aa[d['out'].get('tag') or ('play' if d['out'].get('play') else 'hold')]+=1
print('matches',n,'| reasons',dict(reasons),'| server-err',errs); print('wins',dict(res),'| VP',dict(vp)); print('act-again',dict(aa))
for dk in sorted(used):
    lib={x['name']:x['qty'] for x in json.load(open('deck-%s.json'%dk))['library']}
    print('\n==',dk,'| blocked',blocked[dk][0],'of',blocked[dk][1],'actions (%d %%)'%round(100*blocked[dk][0]/max(1,blocked[dk][1])),'| answered a block with stealth',stealthQ[dk][0],'of',stealthQ[dk][1])
    print('  per match:',', '.join('%s %.1f'%(c,k/n) for c,k in used[dk].most_common()))
    print('  NEVER:',[ '%d× %s'%(q,c) for c,q in lib.items() if c not in used[dk]])
    print('  windows:',dict(wins[dk].most_common()))
print('\nuntitled plays of title-gated cards:',bad)
