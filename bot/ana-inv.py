#!/usr/bin/env python3
# ana-inv.py <serie>... -- the real-time invariant flags (v0.6.179) per kind, with examples
import json,glob,sys,collections
for S in sys.argv[1:]:
    c=collections.Counter(); ex=collections.defaultdict(list); m=0
    for f in sorted(glob.glob(S+'/match-*.jsonl')):
        m+=1; deck={}
        for l in open(f):
            r=json.loads(l)
            if r.get('type')=='manifest': deck[r['bot']]=r['data']['deck']
            if r.get('type')=='inv-flag':
                d=r['data']; k=d.get('inv'); key=k
                if k=='pool-drift': key=f"pool-drift {'+' if d.get('diff',0)>0 else ''}{d.get('diff')}"
                if k=='pool-print': key=f"pool-print via {d.get('via')}"
                c[key]+=1
                if len(ex[key])<3: ex[key].append((deck.get(r['bot'],'?')[:4], {x:d[x] for x in d if x!='inv'}))
    print('##',S,m,'matches, flags',sum(c.values()))
    for k,v in c.most_common(): print(f'  {v:4d}  {k}   e.g. {ex[k][:2]}')
