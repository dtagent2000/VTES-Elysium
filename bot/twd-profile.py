#!/usr/bin/env python3
# twd-profile.py -- the knowledge layer's first brick: from the TWDA (KRCG export) and cardfx, what a deck that shows card X
# tends to be. Per deck: four shares of the library -- combat (Combat cards + rush actions), stealth (modifiers with stealth),
# intercept (reactions with intercept), bounce (reactions that redirect a bleed) -- and since 11 Oct 2026 press (cards with a press mode, or an
# ally that grants one: the Malkavian guide's wave is worth a card only against a seat that cannot press). Per card: the mean deck shares over the
# decks that hold it (recency-weighted, 2015+ counts double), with the number of decks as its confidence. Per clan: the same
# over decks whose crypt is mostly that clan -- the prior before a seat has shown a library card.
import json,collections,sys
fx=json.load(open('elysium-cardfx.json'))['lib']
kr={c['id']:c for c in json.load(open('vtes.json'))}
byname={}
for c in kr.values():
    for n in [c.get('_name'),c.get('name')]+list(c.get('name_variants') or []):
        if n: byname.setdefault(n,c)
def feats(name):
    e=fx.get(name); c=byname.get(name); types=(c or {}).get('types',[])
    modes=(e or {}).get('modes') or []
    has=lambda k: any((m.get('fx') or {}).get(k) for m in modes)
    combat = ('Combat' in types) or has('rush') or has('strike') or has('maneuver') or has('prevent')
    stealth = ('Action Modifier' in types and has('stealth')) or has('stealthLater')
    intercept = ('Reaction' in types and (has('intercept') or has('interceptPaid'))) or ('Equipment' in types and has('intercept'))
    bounce = has('bounce')
    press = has('press') or has('allyPressLife')   # 11 Oct 2026: Immortal Grapple [POT], Apportation [tha], Hidden Strength [FOR], Underbridge Stray ...
    return combat, stealth, intercept, bounce, press
decks=json.load(open('twda.json'))
# 28 Sep: the larger VDB-style export (twda-vdb.json) holds the same decks plus 134 newer ones (82 from 2026) -- merged by
# date + player + name; its cards carry KRCG ids, so names come from vtes.json. The KRCG export stays the base (its numeric
# ids are what vtes-skill's classification refers to).
try:
    vdb=json.load(open('twda-vdb.json'))
    have={((x.get('date') or ''),(x.get('player') or '').strip().lower(),(x.get('name') or '').strip().lower()) for x in decks}
    added=0
    for k,v in vdb.items():
        e=v.get('event') or {}; key=(e.get('date') or '',(v.get('player') or '').strip().lower(),(v.get('name') or '').strip().lower())
        if key in have: continue
        lib=[]; cry=[]
        for c in v.get('cards') or []:
            kc=kr.get(c.get('id')); nm=(kc or {}).get('_name') or c.get('printed_name')
            if not nm: continue
            (cry if c.get('kind')=='Crypt' else lib).append({'name':nm,'count':c.get('count',1),'id':c.get('id')})
        decks.append({'id':k,'date':e.get('date') or '','library':{'cards':[{'cards':lib}]},'crypt':{'cards':cry,'count':sum(c['count'] for c in cry)}})
        added+=1
    print('vdb decks added', added)
except FileNotFoundError: pass
NF=5   # combat, stealth, intercept, bounce, press -- press APPENDED (11 Oct 2026) so readers of f[0..3] are untouched
cardStat=collections.defaultdict(lambda:[0.0]*(NF+1))   # w, then the NF weighted sums
clanStat=collections.defaultdict(lambda:[0.0]*(NF+1))
fcache={}
n_used=0
for d in decks:
    y=int((d.get('date') or '2000')[:4]); w=2.0 if y>=2015 else 1.0
    lib=[(c['name'],c['count']) for t in d['library']['cards'] for c in t['cards']]
    total=sum(n for _,n in lib) or 1
    s=[0]*NF
    for name,n in lib:
        if name not in fcache: fcache[name]=feats(name)
        f=fcache[name]
        for i in range(NF): s[i]+=n if f[i] else 0
    share=[x/total for x in s]
    n_used+=1
    for name,n in lib:
        st=cardStat[name]; st[0]+=w
        for i in range(NF): st[i+1]+=w*share[i]
    clans=collections.Counter()
    for c in d['crypt']['cards']:
        k=kr.get(c['id']); cl=(k or {}).get('clans') or []
        if cl: clans[cl[0]]+=c['count']
    if clans:
        top,cnt=clans.most_common(1)[0]
        if cnt>=d['crypt']['count']*0.5:
            st=clanStat[top]; st[0]+=w
            for i in range(NF): st[i+1]+=w*share[i]
out={'generated':'2026-10-11','source':'twda.json (KRCG, %d decks)'%n_used,'features':['combat','stealth','intercept','bounce','press'],
     'cards':{n:{'n':round(s[0],1),'f':[round(s[i]/s[0],3) for i in range(1,NF+1)]} for n,s in cardStat.items() if s[0]>=6},
     'clans':{n:{'n':round(s[0],1),'f':[round(s[i]/s[0],3) for i in range(1,NF+1)]} for n,s in clanStat.items() if s[0]>=6},
     'all':{'n':n_used}}
allf=[0,0,0,0]
for n,s in cardStat.items(): pass
ser=json.dumps(out,separators=(',',':'))   # 9 Oct 2026 (main's ask): ONE serialize, two writes -- the .js sibling is the file:// vehicle
open('elysium-twd-profile.json','w').write(ser)
open('elysium-twd-profile.js','w').write('globalThis.ELYSIUM_TWD_PROFILE = '+ser+';\n')   # a classic <script> is CORS-exempt on file:// where fetch() is not (the cardfx compiler's elysium-cardfx.js, v1.6.13)
print('decks',n_used,'cards kept',len(out['cards']),'clans',len(out['clans']))
for n in ['Theft of Vitae','Immortal Grapple','Deflection','Lost in Crowds','Govern the Unaligned','Eyes of Argus','Deep Song','Kine Resources Contested','Bum\'s Rush','Wake with Evening\'s Freshness','Swallowed by the Night','Roundhouse','Taste of Vitae','Majesty']:
    print(n, out['cards'].get(n))
for n in ['Tremere','Nosferatu','Malkavian','Ventrue','Brujah','Toreador','Gangrel']:
    print(n, out['clans'].get(n))
import os; print(os.path.getsize('elysium-twd-profile.json'))
