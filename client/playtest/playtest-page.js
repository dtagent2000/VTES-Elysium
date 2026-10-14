/* playtest-page.js v1.0.0 (14 Oct 2026, client v2.6.158) -- the page side of the play-test rig.
   playtest-rig.js evaluates this file in the human's tab after load; it defines window.PT. Every helper
   calls the client's OWN functions (the closures its menus run, its phase bar, its drop path's line), so a
   play-test exercises the same code a player's clicks do -- only the pointer is skipped. Dialogs the client
   opens (confirmations, prompts, the level chooser) are answered by the rig's job loop, not here. */
(() => { if (window.PT) return 'already';
  const PT = {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // ---- menus: capture what a right-click would show and walk it by labels (exact first, then prefix) ----
  PT.capture = fn => { let got = null; const orig = showMenu; showMenu = items => { got = items; }; try { fn(); } finally { showMenu = orig; } return got; };
  PT.walk = async (items, labels) => { let cur = items, seen = [];
    for (let k = 0; k < labels.length; k++) { const lab = String(labels[k]).toLowerCase(); const vis = (cur || []).filter(x => x && x !== '-' && x.label);
      seen = vis.map(x => x.label); const hit = vis.find(x => String(x.label).toLowerCase() === lab) || vis.find(x => String(x.label).toLowerCase().startsWith(lab));
      if (!hit) return { ok: false, missing: labels[k], seen };
      if (hit.disabled) return { ok: false, disabled: hit.label, seen };
      if (k < labels.length - 1) { cur = hit.sub; continue; }
      if (typeof hit.fn !== 'function') return { ok: false, nofn: hit.label, seen };
      const r = hit.fn(); if (r && typeof r.then === 'function') await r; return { ok: true, did: hit.label }; }
    return { ok: false }; };
  PT.menu = async (id, labels) => { const c = state.cards.get(id); if (!c) return { ok: false, err: 'no card ' + id }; return PT.walk(PT.capture(() => cardMenu(c, 0, 0)), labels); };
  PT.menuSeen = (id, labels) => { const c = state.cards.get(id); if (!c) return null; let items = PT.capture(() => cardMenu(c, 0, 0));
    for (const l of (labels || [])) { const hit = (items || []).find(x => x && x.label && String(x.label).toLowerCase().startsWith(String(l).toLowerCase())); if (!hit) return null; items = hit.sub; }
    return (items || []).filter(x => x && x.label).map(x => x.label + (x.sub ? ' >' : '') + (x.disabled ? ' (disabled)' : '')); };
  PT.seatMenu = async (seat, labels) => PT.walk(oppPoolMenuItems(seat), labels);   // a seat's pool menu (pool target, the referee rows)
  // ---- reading ----
  PT.find = (name, zone) => { const out = []; state.cards.forEach(c => { if ((!zone || c.zone === zone) && String(c.name).toLowerCase().startsWith(String(name).toLowerCase())) out.push(c.id); }); return out; };
  PT.id = (x, zone) => (state.cards.has(x) ? x : (PT.find(x, zone)[0] || null));   // a card id, or the first card whose name starts so
  PT.info = nm => { try { const i = cardInfo && cardInfo.get(norm(nm)); return i ? { cap: i.cap, disc: i.disc, types: i.types, text: String(i.text || '').slice(0, 300) } : null; } catch (e) { return null; } };
  PT.card = id => { const c = state.cards.get(id); if (!c) return null; const i = PT.info(c.name) || {};
    return { id: c.id, name: c.name, z: c.zone, blood: c.blood | 0, locked: !!c.locked, fd: !!c.faceDown, cap: i.cap, disc: i.disc, host: c.host || undefined, att: (c.attached || []).map(a => { const k = state.cards.get(a); return k && k.name; }) }; };
  PT.state = () => { const me = mySeat();
    const seats = (net.roster || []).map(p => { const b = (net.boards[p.seat] || {}).pub || {}; const cs = b.cards || [];
      return { seat: p.seat, name: p.name, bot: !!p.bot, out: !!p.out, vp: p.vp, pool: p.seat === me ? state.pool : b.pool, phase: b.phase, edge: p.seat === me ? !!state.edge : !!b.edge, hand: (b.counts || {}).hand,
        live: p.seat === me ? undefined : cs.filter(c => c.zone === 'ready' || c.zone === 'torpor').map(c => ({ id: c.id, name: c.faceDown ? '(face down)' : c.name, z: c.zone, blood: c.blood | 0, locked: !!c.locked, host: c.host || undefined })),
        unc: p.seat === me ? undefined : cs.filter(c => c.zone === 'uncontrolled').map(c => c.blood | 0) }; });
    let tl = null; try { tl = phaseMax(3) - state.phaseUsed.influence; } catch (e) {}
    return { version: VERSION, you: net.you, seat: me, turnSeat: net.turnSeat, turnNo: net.turnNo, round: net.roundNo, phase: state.phase, phaseName: PHASES[state.phase] || '-', pool: state.pool, edge: !!state.edge,
      transfersLeft: tl, masters: state.phaseActs ? (state.phaseActs.master + (state.masterBonus || 0)) - state.phaseUsed.master : null,
      hand: state.zones.hand.map(PT.card), ready: state.zones.ready.map(PT.card).filter(c => !c.host), unc: state.zones.uncontrolled.map(PT.card), torpor: state.zones.torpor.map(PT.card),
      ash: state.zones.ash.length, lib: net.libN, crypt: net.cryptN, seats,
      avr: (typeof avr !== 'undefined') ? { mode: avr.mode, a: avr.a, b: avr.b, ph: avr.ph, rd: avr.rd, rng: avr.rng, duel: avr.duel } : null,
      target: net.rtarget || state.target || null, modal: shownModal(), tempo: (typeof botCfgNow === 'function') ? botCfgNow() : null,
      bots: (typeof botPanelSeats === 'function') ? botPanelSeats().map(r => { const s = botPanelRead(r.bot); return { name: s.name, state: s.state, waitingFor: s.waitingFor, step: s.step }; }) : [] }; };
  PT.log = n => [...document.querySelectorAll('#log li')].slice(0, n || 30).map(li => li.textContent).reverse();   // the newest n, oldest first
  // ---- a turn, the way a player does it ----
  PT.phase = async i => { await activatePhase(typeof i === 'number' ? i : PHASES.findIndex(p => p.toLowerCase().startsWith(String(i).toLowerCase()))); await sleep(500); return PHASES[state.phase]; };
  PT.influence = async (x, n) => { const c = state.cards.get(PT.id(x, 'uncontrolled')); if (!c) return { ok: false, err: 'no uncontrolled ' + x };
    for (let k = 0; k < (n || 1); k++) { await bumpCounter(c, 1, 'blood'); await sleep(250); } return { ok: true, blood: c.blood, left: phaseMax(3) - state.phaseUsed.influence }; };
  PT.bringOut = async x => { const c = state.cards.get(PT.id(x, 'uncontrolled')); if (!c) return { ok: false, err: 'no uncontrolled ' + x };   // the drop path's own move + line, at a free spot in the row
    const r = zoneRect('ready'), mine = state.zones.ready.map(id => state.cards.get(id)).filter(k => k && k.kind === 'crypt' && !k.host).length;
    move(c, 'ready', { x: r.x + 24 + mine * (CW + 22), y: r.y + 24, faceDown: false }); log(cardRef(c) + ' moved to the ready region.'); await sleep(400); return { ok: true, name: c.name, blood: c.blood }; };
  PT.play = async (x, o) => { o = o || {}; const c = state.cards.get(PT.id(x, 'hand')); if (!c) return { ok: false, err: 'not in hand: ' + x };   // o.by = the vampire playing it (the anchor); o.on = play it ON that vampire (masters, equipment)
    const by = (o.by || o.on) ? state.cards.get(PT.id(o.by || o.on, 'ready')) : null; if (by) selectOnly(by); else { state.selected.clear(); state.anchor = null; updateSelVisual(); }
    if (o.on) await playOnActive(c, !!o.faceDown); else await playFromHand(c, !!o.faceDown);
    await sleep(400); if (!o.noDraw && c.zone !== 'hand' && state.zones.hand.length < state.maxHand) { await drawCard(); await sleep(400); }
    return { ok: c.zone !== 'hand', name: c.name, zone: c.zone, mode: c._modeTxt || null, host: c.host || null }; };
  PT.discard = async x => { const c = state.cards.get(PT.id(x, 'hand')); if (!c) return { ok: false }; const r = await PT.menu(c.id, ['Discard (ash heap)']); await sleep(300); if (state.zones.hand.length < state.maxHand) await drawCard(); return r; };
  PT.clearPlayed = () => {   // what a player does once an action is over: the played action / modifier / reaction / combat cards go to the ash heap (masters, equipment, allies and anything on a vampire stay)
    const gone = []; state.zones.ready.slice().forEach(id => { const c = state.cards.get(id); if (!c || c.kind === 'crypt' || c.host) return;
      const t = (cardTypes && cardTypes.get(norm(c.name))) || []; if (t.some(x => /^(action|action modifier|reaction|combat|political action)$/i.test(x)) && move(c, 'ash')) { log('<b>' + escapeHtml(c.name) + '</b> → the ash heap.'); gone.push(c.name); } });
    return gone; };
  PT.burnPool = (n, why) => { bumpPool(-n); log((why ? esc(why) + ': ' : '') + esc(net.you || '') + ' burns ' + n + ' pool (pool → ' + state.pool + ').'); return state.pool; };
  PT.takeEdge = () => { if (!state.edge) toggleEdge(); return state.edge; };
  PT.target = (seat, cid) => { const b = (net.boards[seat] || {}).pub || {}; const c = (b.cards || []).find(k => k.id === cid); const who = ((net.roster || []).find(q => q.seat === seat) || {}).name;
    if (!c) return { ok: false }; setRTarget({ seat, cid, who, name: c.faceDown ? null : (c.name || ''), faceDown: !!c.faceDown }); return { ok: true, name: c.name }; };
  PT.giveWord = () => (typeof botGiveWord === 'function' ? botGiveWord() : 0);   // Turn-based: the play button beside the bot badge
  PT.tempo = (tempo, waitSecs) => botCfgSet(Object.assign({}, tempo ? { tempo } : {}, waitSecs ? { waitSecs } : {}));
  window.PT = PT; return 'ok'; })()
