#!/usr/bin/env python3
# ana-rush.py <serie> -- per deck: rush decisions (kit, reach, target blood), rush outcomes, Deep Song as rush vs bleed, torpors dealt after a rush
import json,glob,sys,collections
S=sys.argv[1]; pick=collections.defaultdict(collections.Counter); out=collections.defaultdict(collections.Counter); kits=collections.defaultdict(collections.Counter); n=0; res=collections.Counter(); vp=collections.Counter()
for f in sorted(glob.glob(S+'/match-*.jsonl')):
    rows=[json.loads(l) for l in open(f)]; n+=1
    deck={r['bot']:r['data']['deck'] for r in rows if r['type']=='manifest'}
    R=[r for r in rows if r['type']=='result'][0]['data']
    if R.get('winner') in deck: res[deck[R['winner']]]+=1
    for b in deck: vp[deck[b]]+=R['vp'].get(b,0)
    for r in rows:
        b=r.get('bot'); d=r.get('data') or {}
        if b not in deck: continue
        dk=deck[b]
        if r['type']=='decide' and d.get('q')=='action':
            p=(d.get('out') or {}).get('pick') or {}
            sc=(d.get('out') or {}).get('scores') or {}
            if 'rush' in sc:
                pick[dk]['rush chosen' if p.get('kind')=='rush' else 'rush offered, not chosen']+=1
                rp=sc.get('rushParts') or {}
                if p.get('kind')=='rush': kits[dk]['kit %s'%rp.get('kit','?')]+=1
            if p.get('name')=='Deep Song' and p.get('kind')!='rush': pick[dk]['Deep Song as bleed']+=1
        if r['type'] in('through','blocked') and d.get('kind')=='rush': out[dk]['rush '+r['type']]+=1
        if r['type']=='torpor': out[dk]['own torpor']+=1
print('matches',n,'| wins',dict(res),'| VP',dict(vp))
for dk in sorted(pick):
    print('==',dk, dict(pick[dk]), '| kits when rushing', dict(kits[dk]), '|', dict(out[dk]))
