#!/usr/bin/env python3
# sweep-pilot.py -- cardfx vs KRCG card text vs vtes-rulings, for the cards the bots actually play (the six deck lists).
import json,re,yaml,collections,sys
fx=json.load(open('elysium-cardfx.json'))['lib']
cards=json.load(open('vtes.json'))
byname={}
for c in cards:
    for n in [c.get('_name'),c.get('name')]+list(c.get('name_variants') or []):
        if n: byname.setdefault(n,c)
rul=yaml.safe_load(open('src/vtes-rulings-main/rulings/rulings.yaml'))
rbyid={}
for k,v in rul.items():
    i=k.split('|')[0]; rbyid[i]=v if isinstance(v,list) else [v]
decks=json.load(open('/tmp/decks.json'))
pool=sorted({n for v in decks.values() for n in v})
TOK=re.compile(r'\[([a-zA-Z]{3})\]')
def segments(text):
    segs=collections.OrderedDict(); shared=[]
    for line in (text or '').split('\n'):
        toks=TOK.findall(line[:12]) if line.startswith('[') else []
        body=TOK.sub('',line).strip()
        if toks:
            for t in toks: segs.setdefault(t,[]).append(body)
        else: shared.append(body)
    return segs,' '.join(shared)
def nums(pat,s):
    m=re.search(pat,s,re.I); return int(m.group(1)) if m else None
rows=[]; stats=collections.Counter(); ranged=[]
for name in pool:
    c=byname.get(name); e=fx.get(name)
    if not c: rows.append((name,'-','card','not found in vtes.json','','')); stats['not in KRCG']+=1; continue
    if not e: rows.append((name,'-','cardfx','no cardfx entry','','')); stats['no cardfx']+=1; continue
    types=c.get('types',[]); text=c.get('card_text','')
    segs,shared=segments(text)
    modes={ (m.get('at') or '-'):(m.get('fx') or {}) for m in (e.get('modes') or []) }
    isAction='Action' in types
    directed='\u24b9' in text   # KRCG marks directed actions with the circled D
    levels=list(segs.keys()) or ['-']
    stats['cards']+=1
    # level coverage
    fxLevels=set(modes.keys())
    txtLevels=set(segs.keys())
    for L in sorted(txtLevels-fxLevels):
        if modes: rows.append((name,L,'modes','level in text, no cardfx mode',', '.join(sorted(fxLevels)),'')); stats['level missing']+=1
    for L in levels:
        s=' '.join(segs.get(L,[]))+' '+shared if L!='-' else shared
        f=modes.get(L) or (modes.get('-') if len(modes)==1 else None) or {}
        if not f and not modes: continue
        def cmp(field,expect,note=''):
            have=f.get(field)
            if expect is None and have is None: return
            if expect is not None and have is None: rows.append((name,L,field,'text has it, cardfx missing',str(have),f'{expect} {note}'.strip())); stats['missing '+field]+=1
            elif expect is None and have is not None and field not in('actStealth',): rows.append((name,L,field,'cardfx has it, text does not',str(have),'')); stats['extra '+field]+=1
            elif expect is not None and str(have)!=str(expect) and not (isinstance(have,bool) or isinstance(expect,bool)): rows.append((name,L,field,'value differs',str(have),f'{expect} {note}'.strip())); stats['differs '+field]+=1
        # stealth
        pst=nums(r'\+(\d+) stealth',s)
        if isAction:
            exp=(pst or 0)   # rulebook (Action cards): 'Unless otherwise noted on the card, these actions are at 0 stealth' -- the printed stealth IS the total; the undirected +1 belongs to the BASIC actions (hunt, equip, employ, recruit, political, rescue own, leave torpor)
            have=f.get('actStealth')
            if have is None and exp>0: rows.append((name,L,'actStealth','missing',str(have),f'{exp} (printed)')); stats['missing actStealth']+=1
            elif have is not None and int(have)!=exp: rows.append((name,L,'actStealth','value differs',str(have),f'{exp} (printed)')); stats['differs actStealth']+=1
            else: stats['actStealth ok']+=1
        elif pst is not None: cmp('stealth',pst)
        cmp('intercept',nums(r'\+(\d+) intercept',s))
        cmp('bleed',nums(r'\+(\d+) bleed',s))
        cmp('prevent',nums(r'prevent (?:up to )?(\d+) damage',s))
        cmp('stealBlood',nums(r'steal (\d+) blood',s))
        sd=nums(r'strike:? (\d+)R? (?:aggravated )?damage',s)
        if sd is not None: cmp('strike',sd)
        if re.search(r'\bpress\b',s,re.I) and not f.get('press'): rows.append((name,L,'press','text mentions a press, cardfx none','','')); stats['missing press']+=1
        if re.search(r'maneuver',s,re.I) and not f.get('maneuver') and 'Combat' in types: rows.append((name,L,'maneuver','text mentions a maneuver, cardfx none','','')); stats['missing maneuver']+=1
        if re.search(r'strike.{0,12}ranged|\d+R damage|ranged strike',s,re.I):
            ranged.append((name,L,'strike' if f.get('strike') is not None else ('steal' if f.get('stealBlood') else '?')))
    # entry-level range requirements
    req=e.get('req') or {}
    for k in ('rangeLong','rangeClose','beforeRangeDetermined'):
        if req.get(k) and len(segs)>1:
            which=[L for L,b in segs.items() if re.search({'rangeLong':'long range','rangeClose':'close range','beforeRangeDetermined':'before range'}[k],' '.join(b),re.I)]
            if which and len(which)<len(segs): rows.append((name,','.join(which),'req.'+k,'entry-level requirement, text limits it to these levels','entry',','.join(which))); stats['req on entry, text per level']+=1
rows.sort()
out=['# Cardfx sweep — pilot report (the bots\' six deck lists)','',f'Cards checked: {stats["cards"]} (library cards in the six decks; not in KRCG: {stats["not in KRCG"]}, no cardfx entry: {stats["no cardfx"]}).','', '## Findings by type','','| Finding | Count |','| --- | --- |']
for k,v in sorted(stats.items()):
    if k not in ('cards',): out.append(f'| {k} | {v} |')
out+=['','## Ranged strikes by the text (cardfx has no `ranged` flag yet)','','| Card | Level | Kind |','| --- | --- | --- |']+[f'| {a} | {b} | {c} |' for a,b,c in ranged]
out+=['','## Rows','','| Card | Level | Field | Finding | cardfx now | Text says |','| --- | --- | --- | --- | --- | --- |']+[f'| {a} | {b} | {c} | {d} | {e} | {f} |' for a,b,c,d,e,f in rows]
flag={r[0] for r in rows}
out+=['','## Rulings on the flagged cards (vtes-rulings, MIT)','']
for n in sorted(flag):
    c=byname.get(n)
    if not c: continue
    rs=rbyid.get(str(c['id']),[])
    if rs:
        out.append(f'**{n}**'); out+= [f'- {str(r)[:220]}' for r in rs[:4]]; out.append('')
open('REPORT-cardfx-sweep-pilot.md','w').write('\n'.join(out)+'\n')
print('\n'.join(out[:40]))
print('rows',len(rows))
