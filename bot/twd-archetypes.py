#!/usr/bin/env python3
# twd-archetypes.py -- the archetype labels, offline: a naive-Bayes signature per vtes-skill archetype (its TWDA decks), then a
# 5-fold test: from k random "shown" library cards + the crypt's clan, how often is the label right?
import json,random,math,collections
random.seed(7)
kr={c['id']:c for c in json.load(open('vtes.json'))}
decks={x['id']:x for x in json.load(open('twda.json'))}
cls=json.load(open('src/vtes-skill-main/references/strategy/classification.json'))
groups=[(g['name'],[d['id'] for d in g['decks'] if d['id'] in decks]) for g in cls['groups']]
groups=[(n,ids) for n,ids in groups if len(ids)>=10]
def lib(d): return [(c['name'],c['count']) for t in d['library']['cards'] for c in t['cards']]
def clan(d):
    cc=collections.Counter()
    for c in d['crypt']['cards']:
        k=kr.get(c['id']); cl=(k or {}).get('clans') or []
        if cl: cc[cl[0]]+=c['count']
    return cc.most_common(1)[0][0] if cc else None
def train(items):   # items: [(group, deck)]
    cardf=collections.defaultdict(collections.Counter); clanf=collections.defaultdict(collections.Counter); n=collections.Counter(); vocab=set()
    for g,d in items:
        n[g]+=1
        for name,cnt in lib(d): cardf[g][name]+=1; vocab.add(name)
        clanf[g][clan(d)]+=1
    return cardf,clanf,n,vocab
def predict(model, shown, cl, topn=3):
    cardf,clanf,n,vocab=model; V=len(vocab)+1; tot=sum(n.values()); out=[]
    for g in n:
        s=math.log(n[g]/tot)
        for c in shown: s+=math.log((cardf[g][c]+0.5)/(n[g]+0.5*V)*n[g]/max(1,n[g]) ) if False else math.log((cardf[g][c]+0.5)/(n[g]+1.0))
        if cl: s+=math.log((clanf[g][cl]+0.5)/(n[g]+2.0))
        out.append((s,g))
    out.sort(reverse=True); return out[:topn]
items=[(g,decks[i]) for g,ids in groups for i in ids]
random.shuffle(items)
folds=5; res={k:collections.Counter() for k in (3,5,8,12)}
for f in range(folds):
    test=[it for i,it in enumerate(items) if i%folds==f]; trainset=[it for i,it in enumerate(items) if i%folds!=f]
    model=train(trainset)
    for g,d in test:
        pool=[]; 
        for name,cnt in lib(d): pool+= [name]*cnt
        for k in res:
            shown=random.sample(pool, min(k,len(pool))); top=predict(model, set(shown), clan(d))
            res[k]['n']+=1; res[k]['top1']+= top[0][1]==g; res[k]['top3']+= g in [x[1] for x in top]
            marg=top[0][0]-top[1][0] if len(top)>1 else 9
            if marg>=2.0: res[k]['confident']+=1; res[k]['confident_right']+= top[0][1]==g
print('archetypes with >=10 decks:', len(groups), '| decks:', len(items), '| of all TWDA decks:', round(100*len(items)/len(decks),1), '%')
for k,c in res.items():
    n=c['n']; print(f"shown {k:2d} cards + clan: top-1 {100*c['top1']/n:5.1f} %  top-3 {100*c['top3']/n:5.1f} %  | confident (margin>=2): {100*c['confident']/n:4.1f} % of cases, of which right {100*c['confident_right']/max(1,c['confident']):5.1f} %")

# --- the open world: decks OUTSIDE every archetype -- how often does the classifier claim confidence anyway?
model=train(items)
allg={i for _,ids in groups for i in ids}
noise=[d for i,d in decks.items() if i not in allg]; random.shuffle(noise); noise=noise[:600]
for k in (3,5,8,12):
    conf=0; n=0
    for d in noise:
        pool=[]
        for name,cnt in lib(d): pool+=[name]*cnt
        if len(pool)<k: continue
        top=predict(model, set(random.sample(pool,k)), clan(d)); n+=1
        if len(top)>1 and top[0][0]-top[1][0]>=2.0: conf+=1
    print(f"noise decks, shown {k:2d}: confident (margin>=2) {100*conf/n:5.1f} % -- these would be FALSE labels")
# --- our four starters
import glob
for f in sorted(glob.glob('/mnt/project/deck-*.json')):
    j=json.load(open(f)); nm=f.split('deck-')[1][:-5]
    pool=[x['name'] for x in j.get('library',[]) for _ in range(x.get('qty',1))]
    cc=collections.Counter()
    for x in j.get('crypt',[]):
        e=next((c for c in kr.values() if c.get('name')==x['name'] or c.get('_name')==x['name'].split(' (G')[0]),None)
        if e and e.get('clans'): cc[e['clans'][0]]+=x.get('qty',1)
    cl=cc.most_common(1)[0][0] if cc else None
    top=predict(model, set(random.sample(pool,min(8,len(pool)))), cl)
    print(nm, '->', [(g, round(s,1)) for s,g in top])

# --- an OPEN-WORLD gate: the best archetype must beat the TWDA background (all decks) by a margin, else 'unknown'
bgc=collections.Counter(); bgcl=collections.Counter(); NB=0
for d in decks.values():
    NB+=1
    for name,cnt in lib(d): bgc[name]+=1
    bgcl[clan(d)]+=1
def bgscore(shown, cl):
    s=0.0
    for c in shown: s+=math.log((bgc[c]+0.5)/(NB+1.0))
    if cl: s+=math.log((bgcl[cl]+0.5)/(NB+2.0))
    return s
print('\nopen-world gate (label only if best archetype beats the background by T):')
for T in (1.0, 2.0, 3.0):
    for k in (5,8):
        # in-archetype decks (5-fold as before)
        lab=0;right=0;n=0
        for f in range(folds):
            test=[it for i,it in enumerate(items) if i%folds==f]; m=train([it for i,it in enumerate(items) if i%folds!=f])
            for g,d in test:
                pool=[]
                for name,cnt in lib(d): pool+=[name]*cnt
                shown=set(random.sample(pool,min(k,len(pool)))); cl=clan(d); top=predict(m,shown,cl,1)[0]; n+=1
                if top[0]-bgscore(shown,cl)>=T: lab+=1; right+= top[1]==g
        fl=0;nn=0
        for d in noise:
            pool=[]
            for name,cnt in lib(d): pool+=[name]*cnt
            if len(pool)<k: continue
            shown=set(random.sample(pool,k)); cl=clan(d); top=predict(model,shown,cl,1)[0]; nn+=1
            if top[0]-bgscore(shown,cl)>=T: fl+=1
        print(f"  T={T} shown {k}: archetype decks labelled {100*lab/n:5.1f} % (right {100*right/max(1,lab):5.1f} % of those) | noise decks falsely labelled {100*fl/nn:5.1f} %")

# --- a COVERAGE gate: how many of the shown cards are typical (in >=20 % of the archetype's decks)? label only above C
print('\ncoverage gate (share of shown cards typical of the best archetype):')
cardf,clanf,ncount,vocab=model
def coverage(g, shown, m):
    cf,_,nn,_=m; return sum(1 for c in shown if cf[g][c]/max(1,nn[g])>=0.2)/max(1,len(shown))
for C in (0.5, 0.7, 0.85):
    for k in (5,8):
        lab=0;right=0;n=0
        for f in range(folds):
            test=[it for i,it in enumerate(items) if i%folds==f]; m=train([it for i,it in enumerate(items) if i%folds!=f])
            for g,d in test:
                pool=[]
                for name,cnt in lib(d): pool+=[name]*cnt
                shown=set(random.sample(pool,min(k,len(pool)))); cl=clan(d); top=predict(m,shown,cl,2); n+=1
                marg=top[0][0]-top[1][0] if len(top)>1 else 9
                if marg>=2 and coverage(top[0][1],shown,m)>=C: lab+=1; right+= top[0][1]==g
        fl=0;nn=0
        for d in noise:
            pool=[]
            for name,cnt in lib(d): pool+=[name]*cnt
            if len(pool)<k: continue
            shown=set(random.sample(pool,k)); cl=clan(d); top=predict(model,shown,cl,2); nn+=1
            marg=top[0][0]-top[1][0] if len(top)>1 else 9
            if marg>=2 and coverage(top[0][1],shown,model)>=C: fl+=1
        print(f"  C={C} shown {k}: archetype decks labelled {100*lab/n:5.1f} % (right {100*right/max(1,lab):5.1f} %) | noise falsely labelled {100*fl/nn:5.1f} %")

# --- the data file the bot loads: one signature per archetype (cards held by >=2 of its decks), the clan counts, the vocab size
sig={}
cardf,clanf,ncount,vocab=model
for g in ncount:
    sig[g]={'n':ncount[g],'cards':{c:k for c,k in cardf[g].items() if k>=2},'clans':dict(clanf[g])}
out={'generated':'2026-09-28','source':'vtes-skill classification (reviewed, 2021+) x KRCG TWDA','archetypes':sig,'vocab':len(vocab),
     'gate':{'margin':2.0,'coverage':0.85,'typical':0.2,'minShown':5}}
ser=json.dumps(out,separators=(',',':'))   # 9 Oct 2026 (main's ask): ONE serialize, two writes -- the .js sibling is the file:// vehicle
open('elysium-twd-archetypes.json','w').write(ser)
open('elysium-twd-archetypes.js','w').write('globalThis.ELYSIUM_TWD_ARCHETYPES = '+ser+';\n')   # a classic <script> is CORS-exempt on file:// where fetch() is not (the cardfx compiler's elysium-cardfx.js, v1.6.13)
import os; print('archetypes file', len(sig), 'archetypes,', os.path.getsize('elysium-twd-archetypes.json'), 'bytes')
