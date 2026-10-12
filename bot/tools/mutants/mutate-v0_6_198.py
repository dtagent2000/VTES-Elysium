#!/usr/bin/env python3
# mutate-v0_6_198.py <scratch-dir> -- the mutant-isolation check for v0.6.198's hold gate (12 Oct 2026).
# Builds 18 one-line mutants of bot/elysium-bot.js, runs run137.js (suite section 137 standalone) against each,
# and prints what each mutant did: every mutant must FAIL or HANG, or the section does not pin that line.
# Run from bot/:  python3 tools/mutants/mutate-v0_6_198.py /tmp/mut   (BOTDIR is set per mutant)
import sys, os, subprocess
S=sys.argv[1]; BOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); src=os.path.join(BOT,'elysium-bot.js')
base=open(src,encoding='utf-8').read()
muts = {
 'M1-no-freeze': [("      this._holdFreeze(who);                                   // v0.6.198: and every clock of mine that waits on a human stops\n", "")],
 'M2-no-thaw':   [("  _holdThaw(){                       // the hold is released", "  _holdThaw(){ return;                // MUTANT\n  }\n  _holdThawX(){                       // the hold is released")],
 'M3-old-steal': [("    const fresh = lt && lt.now != null", "    const fresh = false && lt && lt.now != null")],
 'M4-plain-grace': [("p.lateTimer = this._heldTimeout(", "p.lateTimer = setTimeout(")],
 'M5-no-rc-departed': [("      if(rel3 && !thaw) rc.arm();\n", "      if(rel3 && !thaw) rc.arm();\n      rc.paused.add('Anna');\n")],
 'M6-ask-not-held': [("    if(this._held()){ a.timer = null; a.plan = this._askPlan(a);", "    if(false){ a.timer = null; a.plan = this._askPlan(a);")],
 'M7-poll-not-held': [("        if(this._held()){ rc.plan = this._waitPlan('vote'", "        if(false){ rc.plan = this._waitPlan('vote'")],
 'M8-pq-not-held': [("    if(this._held()){ q.timer = null; this._freezeWait(q); return; }", "    if(false){ q.timer = null; this._freezeWait(q); return; }")],
 'M9-phase-not-held': [("if(this._held()){ pw.timer = null; this._freezeWait(pw); this._holdAnnounce(); return; }   /* v0.6.198 (main 12 Oct): the step", "if(false){ pw.timer = null; this._freezeWait(pw); this._holdAnnounce(); return; }   /* v0.6.198 (main 12 Oct): the step")],
 'M10-no-announce': [("    if(speak) this._holdAnnounce();", "    if(false) this._holdAnnounce();")],
 'M11-typed-resolves': [("|not? this time|it resolves|carry on|resume)\\b", "|not? this time)\\b")],
 'M12-no-release-pauses': [("    (names || []).forEach(n => { if(a && a.pausedBy) a.pausedBy.delete(n); if(rc && !rc.closed && rc.paused) rc.paused.delete(n); });", "    return;")],
 'M13-releaser-only': [("      this._releasePauses(was.concat([who]));", "      this._releasePauses([who]);")],
 'M14-paused-poll-unsteppable': [("    if(rc && !rc.closed) return mk('asking', 'votes ('", "    if(rc && !rc.closed && !rc.paused.size) return mk('asking', 'votes ('")],
 'M15-tail-promises-clock': [("  _waitTail(plan, done){ if(this._held()) return", "  _waitTail(plan, done){ if(false) return")],
 'M16-started-no-thaw': [("        this._holdThaw();   // v0.6.198: a wait frozen by the old game's hold runs again, as it would have unheld\n", "")],
 'M17-timers-not-frozen': [("    (this._heldTimers ? [...this._heldTimers] : []).forEach(h => h.freeze());", "    0;")],
 'M18-held-mark-carried': [("rc._heardAt = Object.create(null); rc._held = false;", "rc._heardAt = Object.create(null);")],
}
for name, edits in muts.items():
    s = base
    for old, new in edits:
        assert s.count(old)==1, (name, s.count(old), old[:60])
        s = s.replace(old, new)
    d = os.path.join(S,'mut2',name); os.makedirs(d, exist_ok=True)
    open(os.path.join(d,'elysium-bot.js'),'w',encoding='utf-8').write(s)
    for f in ['elysium-cardfx.json','elysium-twd-profile.json','elysium-twd-archetypes.json']:
        p=os.path.join(BOT,f)
        if not os.path.exists(os.path.join(d,f)): os.symlink(p, os.path.join(d,f))
    try:
        r = subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)),'run137.js')], env=dict(os.environ, BOTDIR=d), capture_output=True, text=True, timeout=60)
        out = (r.stdout + r.stderr).strip().splitlines()
    except subprocess.TimeoutExpired as e:
        out = ['HANG (timeout 60 s)']
    fails = [l for l in out if 'FAIL' in l or 'ABORT' in l or 'HANG' in l]
    print(name, '->', out[-1][:60] if out else '(no output)', '|', len(fails), 'fail lines')
