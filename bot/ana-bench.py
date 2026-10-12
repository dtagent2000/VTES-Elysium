#!/usr/bin/env python3
# ana-bench.py ARM... -- per match: the variant seat's VP minus a quarter of the table's VP; mean and 95 % interval over matches.
import json,glob,sys,math,os
for arm in sys.argv[1:]:
    diffs=[]; wins=0
    for d in sorted(glob.glob(f'bench-{arm}/m*')):
        vs=os.path.join(d,'variant-seat'); tr=glob.glob(os.path.join(d,'match-*.jsonl'))
        if not (os.path.exists(vs) and tr): continue
        P=int(open(vs).read().strip()); res=None
        for l in open(tr[0]):
            r=json.loads(l)
            if r.get('type')=='result': res=r['data']
        if not res: continue
        names=[b['name'] for b in res['bots']]; vp=res['vp']; tot=sum(vp.values())
        if len(names)<P: continue
        v=vp.get(names[P-1],0); diffs.append(v - tot/4.0)
        if res.get('winner')==names[P-1]: wins+=1
    n=len(diffs)
    if n<2: print(f'{arm}: {n} matches'); continue
    m=sum(diffs)/n; sd=math.sqrt(sum((x-m)**2 for x in diffs)/(n-1)); ci=1.96*sd/math.sqrt(n)
    print(f'{arm}: {n} matches  variant VP − table/4 = {m:+.2f}  (95 % ±{ci:.2f}, [{m-ci:+.2f}, {m+ci:+.2f}])  variant wins {wins}/{n} (expected {n/4:.1f})')
