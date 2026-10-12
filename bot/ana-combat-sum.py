#!/usr/bin/env python3
# ana-combat-sum.py <serie>... -- one line per deck per series: W/VP, torpors, rounds, long %, dealt/taken, Grapple (fist share), Taste after a card round, presses, rushes (through), handshake
import json,glob,sys,collections
def one(S):
    out=collections.defaultdict(lambda: collections.defaultdict(float)); hs=[0,0]
    for f in sorted(glob.glob(S+'/match-*.jsonl')):
        rows=[json.loads(l) for l in open(f)]
        deck={r['bot']:r['data']['deck'] for r in rows if r['type']=='manifest'}
        R=[r for r in rows if r['type']=='result'][0]['data']
        for b,dk in deck.items(): out[dk]['vp']+=R['vp'].get(b,0); out[dk]['win']+= (R.get('winner')==b)
        cr=[r for r in rows if r['type']=='combat-round']
        plays=[(r['t'],deck.get(r.get('bot')),r['data']) for r in rows if r['type']=='play' and (r['data'].get('window') or '').startswith('combat')]
        for r in rows:
            b=r.get('bot'); d=r.get('data') or {}
            if b not in deck: continue
            dk=deck[b]; o=out[dk]
            if r['type']=='torpor': o['torpor']+=1
            if r['type']=='through' and d.get('kind')=='rush': o['rushT']+=1
            if r['type']=='blocked' and d.get('kind')=='rush': o['rushB']+=1
            if r['type']=='decide' and d.get('q')=='combat-strike': o['rounds']+=1
            if r['type']=='play' and d.get('window')=='combat-press': o['press']+=1
            if r['type']=='play' and d.get('window')=='combat-grapple':
                o['grapple']+=1
                nxt=[p for p in plays if p[1]==dk and 0<=p[0]-r['t']<=1500 and p[2]['window'] in('combat-strike','combat-steal','combat-env')]
                crows=any(p[1]==dk and p[2].get('card')=='Carrion Crows' and 0<=r['t']-p[0]<=30000 for p in plays)
                if not nxt and not crows: o['grapFist']+=1
            if r['type']=='play' and d.get('card')=='Taste of Vitae':
                o['taste']+=1
                prev=[p for p in plays if p[1]==dk and 0<=r['t']-p[0]<=1500 and p[2]['window'] in('combat-strike','combat-steal','combat-env','combat-grapple')]
                if prev: o['tasteCard']+=1
            if r['type']=='play' and d.get('card') in('Apportation','Swallowed by the Night') and d.get('window')=='combat-maneuver': o['maneuver']+=1
            if r['type']=='combat-round':
                o['cr']+=1; o['long']+= d.get('range')=='long'; o['dealt']+= d.get('dealt') or 0; o['taken']+= d.get('taken') or 0
                if d.get('press'): o['pressTag']+=1
                o['stole']+= d.get('stole') or 0; o['stolen']+= d.get('stolenFromMe') or 0
                m=[x for x in cr if x['bot']!=r['bot'] and x['data'].get('round')==d.get('round') and abs(x['t']-r['t'])<9000 and (x['data'].get('opp')==d.get('vamp') or x['data'].get('vamp')==d.get('opp'))]
                hs[0 if m else 1]+=1
    return out,hs
for S in sys.argv[1:]:
    out,hs=one(S)
    print('##',S,'| handshake %s'%('%d/%d'%(hs[0],hs[0]+hs[1]) if hs[0]+hs[1] else 'n/a (no rows)'))
    for dk in ('nosferatu','tremere','malkavian','ventrue'):
        o=out[dk]; cr=o['cr'] or 1
        print('  %-9s W%d VP%4.1f torp%2d | rounds%4d long%3d%% d/t %.2f/%.2f | grap%2d (fist %d) taste%2d (card %d) press%2d man%2d | steal %d lost %d | rush %d/%d'%(dk,o['win'],o['vp'],o['torpor'],o['rounds'],100*o['long']/cr if o['cr'] else 0,o['dealt']/cr if o['cr'] else 0,o['taken']/cr if o['cr'] else 0,o['grapple'],o['grapFist'],o['taste'],o['tasteCard'],o['press']+o['pressTag']*0,o['maneuver'],o['stole'],o['stolen'],o['rushT'],o['rushT']+o['rushB']))
