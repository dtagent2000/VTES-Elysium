#!/usr/bin/env python3
# sweep-full.py -- every cardfx library entry against KRCG card text (with "As above" resolved) and the rulings count.
import json,re,yaml,collections,csv
fx=json.load(open('elysium-cardfx.json'))['lib']
cards={}
for c in json.load(open('vtes.json')):
    for n in [c.get('_name'),c.get('name')]+list(c.get('name_variants') or []):
        if n: cards.setdefault(n,c)
rul=yaml.safe_load(open('src/vtes-rulings-main/rulings/rulings.yaml')); rcount={k.split('|')[0]:len(v if isinstance(v,list) else [v]) for k,v in rul.items()}
TOK=re.compile(r'^((?:\[[a-zA-Z]{3}\])+)\s*')
def segs(text):
    seg=collections.OrderedDict(); header=[]; prev=None
    for ln in (text or '').split('\n'):
        m=TOK.match(ln)
        if m:
            toks=re.findall(r'\[([a-zA-Z]{3})\]',m.group(1)); body=ln[m.end():].strip()
            if re.match(r'as above',body,re.I) and prev: body=seg[prev]+' '+body
            for t in toks: seg[t]=body
            prev=toks[0]
        else: header.append(ln)
    return seg,' '.join(header)
def n1(p,s):
    m=re.search(p,s,re.I); return int(m.group(1)) if m and m.group(1).isdigit() else (m.group(1) if m else None)
rows=[]; S=collections.Counter()
for name,e in sorted(fx.items()):
    c=cards.get(name)
    if not c: S['no KRCG match']+=1; continue
    modes=e.get('modes') or []
    if not modes: continue
    S['entries']+=1
    seg,head=segs(c.get('card_text'))
    isAction='Action' in (c.get('types') or [])
    hdr={k:v for m in modes if not m.get('at') for k,v in (m.get('fx') or {}).items()}
    for m in modes:
        L=m.get('at'); f=dict(hdr); f.update(m.get('fx') or {})
        if not L and seg: continue
        s=head+' '+(seg.get(L,'') if L else '')
        S['modes']+=1
        def row(field,kind,have,want): rows.append((name,L or '-',field,kind,have,want,rcount.get(str(c['id']),0))); S[kind+' '+field]+=1
        # stealth
        pst=n1(r'\+(\d+) stealth',s)
        if isAction and 'stealth action' in s.lower():
            want=n1(r'\+(\d+) stealth action',s) or 0
            if L and re.search(r'this is a \+(\d+) stealth action',seg.get(L,''),re.I): want=n1(r'this is a \+(\d+) stealth action',seg.get(L,''))
            if f.get('actStealth') is None: row('actStealth','missing',None,want)
            elif f.get('actStealth')!=want: row('actStealth','differs',f.get('actStealth'),want)
        elif pst is not None and not isAction and f.get('stealth') is None and f.get('stealthLater') is None: row('stealth','missing',None,pst)
        for field,pat in (('intercept',r'\+(\d+) intercept'),('bleed',r'\+(\d+) bleed'),('stealBlood',r'steal (\d+) blood')):
            want=n1(pat,s)
            if want is not None and f.get(field) is None and not (field=='bleed' and (f.get('bleedBank') or f.get('bleedAct') is not None)): row(field,'missing',None,want)
            elif want is not None and isinstance(f.get(field),int) and isinstance(want,int) and f.get(field)<want: row(field,'lower',f.get(field),want)
        # ranged
        if f.get('strike') is not None or f.get('stealBlood') is not None:
            txtR=bool(re.search(r'strike[^.:]{0,20}\branged\b|\b[0-9X]+R\s*(?:aggravated\s+)?damage|\branged strike',s,re.I))
            if txtR and not f.get('ranged'): row('ranged','missing',None,True)
            if f.get('ranged') and not txtR: row('ranged','extra',True,None)
            S['strike modes ranged' if f.get('ranged') else 'strike modes melee/hand']+=1
out=['# Cardfx sweep — full library (25 Sep 2026)','',f"Entries with modes: {S['entries']} · modes checked: {S['modes']} · entries without a KRCG match: {S['no KRCG match']}.",'','| Finding | Count |','| --- | --- |']
out+=[f'| {k} | {v} |' for k,v in sorted(S.items()) if k not in ('entries','modes','no KRCG match')]
w=csv.writer(open('sweep-full-rows.csv','w',newline='')); w.writerow(['card','level','field','finding','cardfx','text','rulings']); w.writerows(rows)
out+=['','Full rows: `sweep-full-rows.csv` (card, level, field, finding, cardfx, text, number of rulings on the card).']
open('REPORT-cardfx-sweep-full.md','w').write('\n'.join(out)+'\n'); print('\n'.join(out)); print(len(rows),'rows')
