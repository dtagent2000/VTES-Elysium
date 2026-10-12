#!/usr/bin/env python3
# ana-block.py <serie>... -- the stealth / intercept / block audit against the base rules (VEKN 6.x):
#  directed actions 0 stealth, undirected +1; a block succeeds when intercept >= stealth (raw, may go below 0);
#  after a block attempt the acting minion plays stealth, the blocker answers with intercept, alternating.
import json,glob,sys,collections
for S in sys.argv[1:]:
    R=collections.Counter(); ex=collections.defaultdict(list)
    for f in sorted(glob.glob(S+'/match-*.jsonl')):
        rows=[json.loads(l) for l in open(f)]; rows=[r for r in rows if 'bot' in r]; rows.sort(key=lambda r:r['t'])
        deck={r['bot']:r['data']['deck'] for r in rows if r['type']=='manifest'}
        seat={r['bot']:r['data'].get('seat') for r in rows if r['type']=='manifest'}
        ends=[i for i,r in enumerate(rows) if r['type'] in ('through','blocked')]
        prev=-1
        for i in ends:
            end=rows[i]; A=end['bot']; win=rows[prev+1:i+1]; prev=i
            kind=end['data'].get('kind') or ('bleed' if end['data'].get('card') in (None,) else 'card')
            st=[r for r in win if r['bot']==A and r['type']=='play' and r['data'].get('window')=='stealth']
            ic=[r for r in win if r['bot']!=A and r['type']=='play' and r['data'].get('window')=='react-intercept']
            bm=[r for r in win if r['bot']!=A and r['type']=='block-made']
            R['actions']+=1
            if st and not bm: R['R1 stealth played, NO block attempt']+=1; ex['R1'].append((deck[A], [r['data'].get('card') for r in st], end['type'], kind))
            if ic and not bm: R['R2 intercept played, no block attempt']+=1
            # R6: the same vampire attempting twice in one action
            names=[r['data'].get('vamp') for r in bm]
            for n,k in collections.Counter(names).items():
                if n and k>1: R['R6 same vampire attempted twice in one action']+=1; ex['R6'].append((deck[A], n, k, end['type']))
            # R7: the same reaction card twice by the same minion in one action
            pairs=collections.Counter((r['bot'], r['data'].get('vamp'), r['data'].get('card')) for r in ic)
            for (b,v,c),k in pairs.items():
                if k>1: R['R7 same intercept card twice by one minion']+=1; ex['R7'].append((deck[b], v, c, k))
            for r in win:
                d=r['data']
                if r['type']=='stealth-stack' and r['bot']==A and d.get('answer', d.get('contest')) and (d.get('tally') or {}).get('a',0) > (d.get('tally') or {}).get('b',0): R['R3 stealth look while stealth ALREADY beats intercept']+=1
                if r['type']=='intercept-stack' and d.get('answer') and (d.get('tally') or {}).get('b',0) >= (d.get('tally') or {}).get('a',0): R['R3b intercept look answering while intercept ALREADY blocks']+=1
            if bm and not ic and end['type']=='blocked':
                R['blocked with no intercept card']+=1
            if end['type']=='blocked': R['blocked']+=1
            if bm and end['type']=='through': R['attempted but through']+=1
    print('##',S)
    for k in sorted(R): print('  %-58s %s'%(k,R[k]))
    for k in ex: print('  ex',k, ex[k][:5])
