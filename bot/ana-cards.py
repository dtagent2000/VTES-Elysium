#!/usr/bin/env python3
# ana-cards.py <serie> -- per deck: every library card's uses (play / through / blocked / referendum-called / master-play), per match; the never-played list; untitled plays of titled cards.
# 6 Nov 2026 (the Toreador read): the untitled check resolves a vampire as the bot's fxLookup does (exact, then the lowercase alias) -- a precon from
# gen-precon.js names its crypt bare ('Mkhokheli'), cardfx keys it 'Mkhokheli (G6)', and every play by a printed Prince was listed -- and a vampire
# that took a title card earlier in the match (a `title` row, R-43) is titled. Limits: only Toreador Justicar's referendum writes a `title` row, so
# a Regent or a Saulot's Guiding Wisdom the master loop put on a vampire leaves none (a play by that holder is still listed); the (bot, name) key
# outlives a burned holder (its twin would pass); it checks 'has a title', not which title (`req.titles`).
# 13 Nov 2026 (bot v0.6.221, the BOARD's measurement debt): a master-play pick counts only when it was played -- gen-card-ledger.js's
# masterPlayed rule (the card left the hand by that bot's next decide row, Villein's own decide skipped, or a `play` / Grand Ball row of
# that bot names it first); a replacement of the same name drawn before that row hides a play.
import json,glob,sys,collections
S=sys.argv[1]; fx=json.load(open('elysium-cardfx.json'))
def master_played(rows, i, name):   # gen-card-ledger.js's masterPlayed, the same rule
    r=rows[i]; h0=(r.get('data') or {}).get('hand',[]).count(name)
    for x in rows[i+1:]:
        if x.get('bot')!=r.get('bot'): continue
        if x.get('type')!='decide':
            if (x.get('type')=='play' and (x.get('data') or {}).get('card')==name) or (x.get('type')=='grand-ball' and name=='Toreador Grand Ball'): return True
            continue
        if (x.get('data') or {}).get('q')=='villein': continue
        return ((x.get('data') or {}).get('hand') or []).count(name) < h0
    return False
def crypt(name): return fx['crypt'].get(name) or fx['crypt'].get(fx.get('alias',{}).get(str(name).strip().lower(),''),None) or {}
used=collections.defaultdict(collections.Counter); wins=collections.defaultdict(collections.Counter); bad=[]; n=0; res=collections.Counter(); vp=collections.Counter(); reasons=collections.Counter(); errs=0; aa=collections.Counter(); stealthQ=collections.defaultdict(lambda:[0,0]); blocked=collections.defaultdict(lambda:[0,0])
for f in sorted(glob.glob(S+'/match-*.jsonl')):
    rows=[json.loads(l) for l in open(f)]; n+=1
    deck={r['bot']:r['data']['deck'] for r in rows if r['type']=='manifest'}
    R=[r for r in rows if r['type']=='result'][0]['data']; reasons[R.get('reason')]+=1
    if R.get('winner') in deck: res[deck[R['winner']]]+=1
    for b in deck: vp[deck[b]]+=R['vp'].get(b,0)
    titled=set()
    for i,r in enumerate(rows):
        if r['type']=='server-err': errs+=1
        b=r.get('bot'); d=r.get('data') or {}
        if b not in deck: continue
        dk=deck[b]
        if r['type']=='title': titled.add((b,d.get('vamp')))
        if r['type']=='play': used[dk][d['card']]+=1; wins[dk][d.get('window')]+=1
        if r['type']=='play' and d.get('vamp'):
            e=fx['lib'].get(d['card']) or {}
            if (e.get('req') or {}).get('title'):
                t=crypt(d['vamp']).get('title')
                if not t and (b,d['vamp']) not in titled: bad.append((dk,d['card'],d['vamp']))
        if r['type'] in('through','blocked') and d.get('card') and d['card']!='hunt': used[dk][d['card']]+=1
        if r['type'] in('through','blocked'): blocked[dk][1]+=1; blocked[dk][0]+=1 if r['type']=='blocked' else 0
        if r['type']=='decide' and d.get('q')=='master-play' and (d['out'].get('pick') or {}).get('name') and master_played(rows, i, d['out']['pick']['name']): used[dk][d['out']['pick']['name']]+=1
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
