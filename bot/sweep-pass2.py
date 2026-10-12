#!/usr/bin/env python3
# sweep-pass2.py -- costs, discipline / clan requirements (library) and the crypt's basics (capacity, clan, disciplines, title) against KRCG.
import json,collections,csv,re
fx=json.load(open('elysium-cardfx.json'))
kr={}
for c in json.load(open('vtes.json')):
    for n in [c.get('_name'),c.get('name')]+list(c.get('name_variants') or []):
        if n: kr.setdefault(n,c)
rows=[]; S=collections.Counter()
def num(x):
    if x is None: return None
    return x if x=='X' else int(x)
# --- library: cost, disciplines, clans
for n,e in fx['lib'].items():
    c=kr.get(n)
    if not c: continue
    S['lib']+=1
    cost=e.get('cost') or {}
    for k,f in (('pool','pool_cost'),('blood','blood_cost')):
        want=num(c.get(f)); have=cost.get(k)
        if want is None and have is None: continue
        if want is not None and have is None: rows.append(('lib',n,'cost.'+k,'missing',None,want)); S['cost missing']+=1
        elif want is None and have is not None: rows.append(('lib',n,'cost.'+k,'extra',have,None)); S['cost extra']+=1
        elif str(want)!=str(have): rows.append(('lib',n,'cost.'+k,'differs',have,want)); S['cost differs']+=1
        else: S['cost ok']+=1
    kd=sorted({d.lower() for d in (c.get('disciplines') or [])})
    rd=sorted({d.lower() for d in ((e.get('req') or {}).get('disc') or [])})
    if kd or rd:
        if kd!=rd: rows.append(('lib',n,'req.disc','differs' if rd else 'missing',','.join(rd),','.join(kd))); S['disc '+('differs' if rd else 'missing')]+=1
        else: S['disc ok']+=1
    kc=sorted(c.get('clans') or []); rc=(e.get('req') or {}).get('clan'); rc=sorted(rc if isinstance(rc,list) else ([rc] if rc else []))
    if kc or rc:
        if kc!=rc: rows.append(('lib',n,'req.clan','differs' if rc else 'missing',','.join(rc),','.join(kc))); S['clan '+('differs' if rc else 'missing')]+=1
        else: S['clan ok']+=1
# --- crypt: capacity, clan, disciplines (inferior / superior), group
for n,e in fx['crypt'].items():
    c=kr.get(n)
    if not c: S['crypt no match']+=1; continue
    S['crypt']+=1
    if e.get('cap')!=c.get('capacity'): rows.append(('crypt',n,'cap','differs',e.get('cap'),c.get('capacity'))); S['crypt cap differs']+=1
    kcl=(c.get('clans') or [None])[0]
    if e.get('clan')!=kcl: rows.append(('crypt',n,'clan','differs',e.get('clan'),kcl)); S['crypt clan differs']+=1
    kd=c.get('disciplines') or []; kall=sorted({d.lower() for d in kd}); ksup=sorted({d.lower() for d in kd if d.isupper()})
    d=e.get('disc') or {}; hall=sorted(d.get('all') or []); hsup=sorted(d.get('sup') or [])
    if hall!=kall: rows.append(('crypt',n,'disc.all','differs',','.join(hall),','.join(kall))); S['crypt disc differs']+=1
    elif hsup!=ksup: rows.append(('crypt',n,'disc.sup','differs',','.join(hsup),','.join(ksup))); S['crypt sup differs']+=1
    else: S['crypt disc ok']+=1
    if str(e.get('group'))!=str(c.get('group')): rows.append(('crypt',n,'group','differs',e.get('group'),c.get('group'))); S['crypt group differs']+=1
    kt=(c.get('title') or '').lower() or None; ht=(e.get('title') or '').lower() or None
    if kt!=ht: rows.append(('crypt',n,'title','differs',ht,kt)); S['crypt title differs']+=1
csv.writer(open('sweep-pass2-rows.csv','w',newline='')).writerows([('kind','card','field','finding','cardfx','KRCG')]+rows)
for k,v in sorted(S.items()): print(f'{k}: {v}')
print('rows',len(rows))
for r in rows[:25]: print(r)
