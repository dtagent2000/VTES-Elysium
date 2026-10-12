# Elysium – Kodarkivering (parked code)

> Code that has been intentionally retired from `elysium-vtes-bord.html` but kept here in case we ever want to revisit it. Each entry records **what it did**, **why it was parked**, and the **verbatim source** as it stood at the moment of removal (client v1.99.26, the last version before this archive was created). The live file marks every removal site with a `// PARKED -> kodarkivering.md` breadcrumb.
>
> Parked on the way into the **v1.99.27** cleanup (pre-2.0). Nothing here is wired into the running client. If anything is ever restored, re-check it against the then-current code first — surrounding functions and conventions will have moved on.

## Why these were parked

- **L1 / Simplified as a *chosen* home view** — the "Default table view" Normal/Simplified setting was removed and the home view is forced to **Normal**. L1 (your own board, no `l2mode`/`l3mode`) is **not** gone — it is still the base layer the view system builds on, and `baseView()` still falls back to it for a one-player table — but it is no longer something you pick on purpose. (Full L1 retirement would mean routing one-player tables through `l2solo`; that is a behaviour change saved for the 2.0 refactor.)
- **The Alt views (Reaction window + Quick React strip)** — both reaction surfaces, plus the `⚔` header button, are replaced by the **Played** and **Ready** tabs, which show the same information without taking over the screen.
- **The L3 circle / round table** — the square (Lackey-style) helicopter layout is the only one now; the circle layout and its setting are parked.
- **`renderOval()`** — a pre-L3 oval overview that was already dead code (never called); superseded by the L3 helicopter.

---

## Markup: #altview (Reaction window) + #qrbar (Quick React strip)

Two reaction surfaces bound to the Alt key (and the #btnReact button). #altview is the full-screen 'Reaction window' tray (Acting / In play / Reacting slots + your hand/minions/perms). #qrbar is the non-blocking bottom 'Quick React' strip (this-phase plays + a library pile + your hand + your minions). conv.qrView chose which one Alt opened. Both are superseded by the Played tab (everything played since the last clear/phase) and the Ready tab (your minions, tap-to-select / lock / act). NOTE: the .qr* CSS class rules and the qrCard/qrTap/qrHandDown/qrDragGive renderers are NOT archived here -- they are shared with the dock and the Ready/Hand tabs and remain live.

```html
    <div id="altview">
      <div class="avhead"><span class="avtitle">⚔ Reaction window</span><span class="avhint">Click to select · double-click a minion or a card in play to lock · double-click a hand card to play · deck draws a card · Alt or ⚔ closes</span></div>
      <div class="avstage">
        <div class="avslot avleft"><div class="avslotlab">Acting</div><div class="avslotcards" id="avLeft"></div></div>
        <div class="avtray"><div class="avslotlab">In play<button class="pcbtn avclear" id="avClear" title="Clear the played-cards display — cards stay · also clears on a phase change">Clear</button></div><div class="avtraycards" id="avMid"></div></div>
        <div class="avslot avright"><div class="avslotlab">Reacting</div><div class="avslotcards" id="avRight"></div></div>
      </div>
      <div class="avhand">
        <div class="avhandside">
          <div class="avlib" id="avLib" title="Draw a card · Ctrl-click to undo" style="background-image:url('https://static.krcg.org/card/cardbacklibrary.jpg')"><span class="avlibcount" id="avLibCount">0</span></div>
          <div class="avhandgroup" id="avHand"></div>
        </div>
        <div class="avhandside">
          <div class="avhandgroup" id="avMinions"></div>
          <div class="avhandgroup" id="avPerms"></div>
        </div>
      </div>
    </div>

    <div id="qrbar">
      <div class="qrphase empty" id="qrPhase"></div>
      <div class="qrrow">
        <div class="qrlib" id="qrLib" title="Draw a card &middot; Ctrl-click to undo" style="background-image:url('https://static.krcg.org/card/cardbacklibrary.jpg')"><span id="qrLibCount">0</span></div>
        <div class="qrgroup" id="qrHand"></div>
        <div class="qrsep"></div>
        <div class="qrgroup" id="qrMin"></div>
        <button class="pcbtn qrclear" id="qrClear" title="Clear the played-cards display — cards stay on the board · also clears on a phase change">Clear</button>
      </div>
    </div>
```

---

## CSS: #altview (Reaction window)

All #altview-scoped styling for the full-screen reaction tray. (#playedRow .avc -- the Played tab card outline -- is a separate rule and stays.)

```css
/* Reaction window (Alt-view): a focused combat/reaction spotlight, blue felt */
#altview{position:absolute; inset:0; z-index:6200; display:none; flex-direction:column;
  background:radial-gradient(130% 90% at 50% 34%, #2c3c52 0%, #18233a 46%, #0a1018 100%);
  box-shadow:inset 0 0 90px 16px rgba(0,0,0,.5)}
#altview.show{display:flex}
#altview .avhead{display:flex; align-items:baseline; gap:14px; padding:10px 18px; border-bottom:1px solid rgba(120,150,200,.18)}
#altview .avtitle{font:600 13px "Cinzel",serif; letter-spacing:.22em; text-transform:uppercase; color:#bcd0ec}
#altview .avhint{font:600 11px "Spectral",Georgia,serif; color:rgba(188,208,236,.6)}
#altview .avstage{flex:1; display:flex; align-items:stretch; gap:18px; padding:16px 22px; min-height:0}
#altview .avslot{width:210px; flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:10px;
  border:1px solid rgba(120,150,200,.16); border-radius:14px; padding:14px 10px; background:rgba(10,16,26,.32)}
#altview .avslot .avslotcards{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px}
#altview .avleft{border-color:rgba(200,96,96,.32)}
#altview .avright{border-color:rgba(120,170,235,.3)}
#altview .avtray{flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; gap:10px;
  border:1px solid rgba(176,141,79,.22); border-radius:14px; padding:14px;
  background:
    repeating-linear-gradient(112deg, transparent 0 16px, rgba(255,255,255,.025) 16px 17px),
    repeating-linear-gradient(23deg, transparent 0 26px, rgba(0,0,0,.13) 26px 28px),
    radial-gradient(130% 90% at 50% 36%, #33455e 0%, #1f2c41 52%, #131c2c 100%);
  box-shadow:inset 0 0 40px 8px rgba(0,0,0,.4)}
#altview .avtraycards{flex:1; display:flex; flex-wrap:wrap; gap:12px; align-content:center; justify-content:center; width:100%; overflow:auto}
#altview .avslotlab{font:600 10px "Cinzel",serif; letter-spacing:.28em; text-transform:uppercase; color:rgba(188,208,236,.5)}
#altview .avkids{display:flex; gap:6px; margin-top:2px}
#altview .avhand{display:flex; align-items:flex-end; gap:56px; padding:12px 22px 16px; border-top:1px solid rgba(120,150,200,.18); overflow-x:auto}
#altview .avhandside{display:flex; gap:20px; align-items:flex-end; flex:0 0 auto}
#altview .avhandgroup{display:flex; gap:10px; align-items:flex-end; flex:0 0 auto}
#altview .avhandgroup:empty{display:none}
#altview .avlib{flex:0 0 auto; width:54px; height:76px; border-radius:7px; overflow:hidden; position:relative; cursor:pointer; border:1px solid #4a3b22; box-shadow:0 4px 14px rgba(0,0,0,.55); background-size:cover; background-position:center; transition:transform .12s, border-color .12s}
#altview .avlib:hover{border-color:rgba(176,141,79,.8); transform:translateY(-4px)}
#altview .avlibcount{position:absolute; left:0; right:0; bottom:0; text-align:center; font:700 15px "Cinzel",serif; color:#f1ead9; background:linear-gradient(transparent, rgba(0,0,0,.82)); padding:9px 0 2px}
#altview .avc{position:relative; flex:0 0 auto}
#altview .avc.act{cursor:pointer; transition:transform .12s}
#altview .avc.act:hover{transform:translateY(-7px)}
#altview .avc.avsel{outline:2px solid #dcb872; outline-offset:3px; border-radius:9px}
#altview .avempty{font:italic 12px "Spectral",Georgia,serif; color:rgba(188,208,236,.4)}
```

---

## CSS: #qrbar container (Quick React strip surface)

Only the #qrbar container rules (fixed bottom bar, gradient backdrop, show/pointer-events). The .qrphase/.qrrow/.qrgroup/.qrsep/.qrlib/.qrc class rules were intentionally LEFT in the file because they are shared with the dock piles and the Ready/Hand tab cards (rendered by qrCard).

```css
/* ===== Quick React strip: the new non-blocking reaction view (bottom) ===== */
#qrbar{position:absolute; left:0; right:0; bottom:0; z-index:6100; display:none; flex-direction:column; gap:9px;
  padding:30px 18px 12px; background:linear-gradient(transparent, rgba(8,6,4,.5) 26%, rgba(8,6,4,.93) 62%); pointer-events:none}
#qrbar.show{display:flex}
#qrbar > *{pointer-events:auto}
```

---

## Header button #btnReact (the ⚔ 'Reaction window')

The header button that toggled the Alt view. Click -> toggleAlt(). Replaced by the Played + Ready tabs, which surface the same information non-modally.

```html
  <button class="btn" id="btnReact" title="Reaction window — focused combat / reaction view (Alt)">⚔</button>
```

---

## JS: avTap() + avFocus() (Reaction-window tray)

avTap = single-click select / double-click play-or-lock for tray cards. avFocus = render the Acting/Reacting focus slot (card + attachment fan). Only the Alt tray used these (the Played tab binds its own click/contextmenu handlers; avRenderCard/avLoose stay -- they are shared with the Played tab).

```javascript
function avTap(c){                                          // single = select (skip if already selected — avoids flicker) · double = hand→play / in-play→lock
  const now=Date.now();
  if(now-(c._avtap||0)<380){                                // double
    c._avtap=0;
    if(c.zone==='hand'){ pushUndo(); playFromHand(c,false); }
    else { pushUndo(); setLocked(c, !c.locked); log(cardRefCap(c)+' '+(c.locked?'locked.':'unlocked.')); selectOnly(c); }   // keep selected so a locked minion stays in the Reacting slot
    renderAlt();
  } else {                                                  // single
    c._avtap=now;
    if(c.zone==='hand' || PILES.includes(c.zone)) return;
    if(state.anchor===c.id && state.selected.size===1 && state.selected.has(c.id)) return;   // already the sole selection → no re-render (kills the In-play flicker)
    selectOnly(c); avRefreshSelection();
  }
}
function avFocus(host, card, getKid, colHex, hoverName){
  host.innerHTML='';
  if(!card){ const d=document.createElement('div'); d.className='avempty'; d.textContent='—'; host.appendChild(d); return; }
  avRenderCard(host, card, 0.82, colHex, null, hoverName);
  const kids=(card.attached||[]).map(getKid).filter(Boolean);
  if(kids.length){
    const strip=document.createElement('div'); strip.className='avkids';
    kids.forEach(k=>avRenderCard(strip, k, 0.42, colHex, null, hoverName));
    host.appendChild(strip);
  }
}
```

---

## JS: renderAlt() and the rest of the Reaction-window tray (avFitScale, avRenderSlots, avRefreshSelection, openAlt, closeAlt, toggleAlt)

The full-screen tray's layout + open/close logic. renderAlt() filled the Acting/In-play/Reacting slots and the bottom hand/minions/perms rows. toggleAlt() dispatched the Alt key to either the strip (openQR/closeQR, when conv.qrView) or the tray (openAlt/closeAlt). renderAltIfOpen() was kept as a slim tab-refresh shim (renderPlayed/renderReady/renderHand).

```javascript
function avFitScale(n){                                      // largest card scale (capped at home size) that fits n cards in the In-play tray
  const box=$('#avMid'); if(!box) return 1;
  const W=box.clientWidth-6, H=box.clientHeight-6, gap=12, aspect=CW/CH;
  if(W<=0 || H<=0 || n<=0) return 1;
  let best=0;
  for(let cols=1; cols<=n; cols++){
    const rows=Math.ceil(n/cols);
    const w=Math.min((W-(cols-1)*gap)/cols, ((H-(rows-1)*gap)/rows)*aspect);
    if(w>best) best=w;
  }
  return Math.max(0.2, Math.min(1, best/CW));
}
function avRenderSlots(){
  const myCol=avMyColor(), tSeat=net.turnSeat;
  const an=state.anchor && state.cards.get(state.anchor);
  const anMin=(an && an.kind==='crypt') ? an : null;          // only a minion belongs in the Acting/Reacting slots
  const rp=(net.roster||[]).find(p=>p.seat===tSeat), actNm=rp?rp.name:'';
  const left=$('#avLeft');
  if(tSeat && tSeat===mySeat()){
    avFocus(left, anMin, id=>state.cards.get(id), myCol);
  } else if(tSeat && net.boards && net.boards[tSeat] && net.boards[tSeat].pub){
    const pub=net.boards[tSeat].pub, by=new Map((pub.cards||[]).map(c=>[c.id,c]));
    avFocus(left, pub.anchor?by.get(pub.anchor):null, id=>by.get(id), avColorHex(tSeat), actNm);
  } else avFocus(left, null);
  const right=$('#avRight');
  if(tSeat!==mySeat()) avFocus(right, anMin, id=>state.cards.get(id), myCol);
  else avFocus(right, null);
}
function renderAlt(){
  if(!altOpen) return;
  const myCol=avMyColor();
  avRenderSlots();
  const _lc=$('#avLibCount'); if(_lc) _lc.textContent=netGame()?net.libN:state.zones.library.length;
  const myLoose=avLoose(state.zones.ready.map(id=>state.cards.get(id)));
  // MIDDLE — the contested cards this window (fresh plays + the action card), action card first, sized to fill the tray (home size, shrinking to fit)
  const midList=collectPlayed().map(it=>({c:it.c, col:it.col, act:(it.who===''), hover:it.who||undefined}));
  const avRank=it=>isAction(it.c)?2:(it.c.actSt==='played'?1:0);
  midList.sort((a,b)=>avRank(b)-avRank(a));   // action first, then modifiers/reactions, then the rest
  const mid=$('#avMid'); mid.innerHTML='';
  if(!midList.length){ const d=document.createElement('div'); d.className='avempty'; d.textContent='No cards played yet'; mid.appendChild(d); }
  else { const s=avFitScale(midList.length); midList.forEach(it=>avRenderCard(mid, it.c, s, it.col, it.act, it.hover)); }
  // BOTTOM — your hand (double-click to play) · your ready minions · your cards already in play (masters/permanents) — all selectable
  const hand=$('#avHand'); hand.innerHTML='';
  state.zones.hand.map(id=>state.cards.get(id)).filter(Boolean).forEach(c=>avRenderCard(hand,c,0.6,myCol,true));
  const mins=$('#avMinions'); mins.innerHTML='';
  state.zones.ready.map(id=>state.cards.get(id)).filter(c=>c&&c.kind==='crypt'&&!c.host).forEach(c=>avRenderCard(mins,c,0.55,myCol,true));
  const perms=$('#avPerms'); perms.innerHTML='';
  myLoose.filter(c=>avBaseline.has(c.id)).forEach(c=>avRenderCard(perms,c,0.55,myCol,true));
}
function avRefreshSelection(){                              // selection-only update — toggle the rings + re-render the slots, no list rebuild (no flicker)
  if(!altOpen) return;
  document.querySelectorAll('#altview .avc.act').forEach(w=>{ w.classList.toggle('avsel', state.selected.has(w.dataset.cid)); });
  avRenderSlots();
}
function openAlt(){
  if(altOpen) return;
  closeReady(); closeHand();
  altOpen=true;
  $('#altview').classList.add('show'); renderAlt();           // played-cards baseline persists across open/close now — cleared only on a phase change or Clear
}
function closeAlt(){
  if(!altOpen) return;
  altOpen=false; $('#altview').classList.remove('show');      // no auto-discard / auto-clear — played cards stay; use Discard mine, or a phase change, to clear them
}
function toggleAlt(){ if(conv.qrView){ qrOpen?closeQR():openQR(); } else { altOpen?closeAlt():openAlt(); } }
```

---

## JS: renderQR()/openQR()/closeQR() (Quick React strip) + its listeners + the Alt/Escape keydown handler

The non-blocking bottom strip's render + open/close, the #qrLib draw listeners, the #btnReact click->toggleAlt binding, and the global keydown that opened the Alt surface (Alt) / closed it (Escape). qrCard/qrTap/qrHandDown/qrDragGive (the shared card renderer + interactions used by the dock and the Ready/Hand tabs) are NOT here -- they stay live.

```javascript
function renderQR(){
  if(!qrOpen) return;
  const lc=$('#qrLibCount'); if(lc) lc.textContent=netGame()?net.libN:state.zones.library.length;
  const hand=$('#qrHand'); if(hand){ hand.innerHTML=''; state.zones.hand.map(id=>state.cards.get(id)).filter(Boolean).forEach(c=>qrCard(hand,c,0.62,'hand')); }
  const mins=$('#qrMin'); if(mins){ mins.innerHTML=''; state.zones.ready.map(id=>state.cards.get(id)).filter(c=>c&&!c.host).forEach(c=>qrCard(mins,c,0.55,'min')); }
  const ph=$('#qrPhase'); if(ph){ ph.innerHTML=''; const ids=[...qrPhasePlayed].filter(id=>state.cards.has(id));
    if(!ids.length){ ph.classList.add('empty'); } else { ph.classList.remove('empty'); ids.forEach(id=>qrCard(ph, state.cards.get(id), 0.4, 'phase')); } }
}
function openQR(){
  if(qrOpen) return;
  closeReady(); closeHand();                          // the strip shows your ready + hand itself -> fold both menus to avoid overlap
  qrOpen=true; qrBaseline=new Set();
  state.zones.ready.map(id=>state.cards.get(id)).filter(c=>c&&c.kind!=='crypt'&&!c.host).forEach(c=>qrBaseline.add(c.id));
  $('#qrbar').classList.add('show'); renderQR();
}
function closeQR(){
  if(!qrOpen) return;
  qrOpen=false; $('#qrbar').classList.remove('show');         // no auto-discard / auto-clear — played cards stay; use Discard mine, or a phase change, to clear them
}
$('#qrLib')?.addEventListener('click',e=>{ if(e.ctrlKey||e.metaKey){ undoDraw(); renderQR(); } else if(conv.drawClick!=='double'){ drawCard(); renderQR(); } });
$('#qrLib')?.addEventListener('dblclick',()=>{ if(conv.drawClick==='double'){ drawCard(); renderQR(); } });
$('#btnReact')?.addEventListener('click', toggleAlt);
document.addEventListener('keydown',e=>{
  if(e.key==='Alt' && !e.repeat && !isTyping() && !$('#overlay').classList.contains('show')){ e.preventDefault(); toggleAlt(); }
  else if(e.key==='Escape' && (altOpen||qrOpen) && !$('#overlay').classList.contains('show')){ e.preventDefault(); if(altOpen) closeAlt(); else closeQR(); }
});
```

---

## JS: l3slots() circle/round-table layout branch

The fall-through branch of l3slots() that seated every board around a round table (uniform mat scale, centre radius geometry, far-side card flip). Square (the Lackey-style rectangular table) is now the only layout. renderL3() keeps a couple of harmless `G.shape==='square'?...:...` ternaries whose circle sides are never evaluated.

```javascript
  // circle: every mat keeps its FIXED design aspect and all scale UNIFORMLY to the largest size that still
  // touches neither the rim nor a neighbour — they grow & stop together (never stretched into wide/flat shapes)
  const R=Math.min(g.aw, g.ah)/2*0.995;
  const mk=(phi)=>{ let rot=phi*180/Math.PI-90; rot=((rot+180)%360+360)%360-180;   // normalise to [-180,180]
    return { rot, flip:Math.abs(rot)>90, phi };                                     // far side of the table -> flip card images so they read upright for you
  };
  const A=0.62;                                             // fixed mat aspect (height/width) — internal proportions never change with player count
  if(N<=1){ const mw=Math.min(R*1.4, g.aw*0.64), mh=A*mw; slots[me]=Object.assign({x:cx-mw/2, y:cy-mh/2, w:mw, h:mh}, mk(Math.PI/2)); return {shape:'circle', cx, cy, R, slots}; }
  const ang=Math.PI/N, cot=Math.cos(ang)/Math.sin(ang);
  // largest uniform width where INNER corners just meet the neighbour sector AND OUTER corners just meet the rim, at once
  let mw=(2*R/Math.sqrt((cot+2*A)*(cot+2*A)+1))*0.98;       // *0.98 = a hair of breathing room off the rim
  let mh=A*mw;
  const Rp=(mw/2)*(cot+A);                                  // centre radius: inner corners shy of neighbours, outer corners shy of the rim
  const at=(phi)=>Object.assign({x:cx+Rp*Math.cos(phi)-mw/2, y:cy+Rp*Math.sin(phi)-mh/2, w:mw, h:mh}, mk(phi));
  slots[me]=at(Math.PI/2);                                  // you at the bottom (upright)
  opp.forEach((seat,i)=>{ const k=i+1; slots[seat]=at(Math.PI/2 + k*2*Math.PI/N); });
  return {shape:'circle', cx, cy, R, Rp, mw, mh, innerR:Rp-mh/2, slots};
```

---

## JS: renderOval() (pre-L3 oval overview)

An older whole-table overview that arranged every seat's board around an ellipse (.ovalfelt) inside the #rview overlay. It was already dead code (defined but never called) -- the L3 helicopter (renderL3) replaced it. Archived for reference.

```javascript
function renderOval(){
  $('#rvTitle').textContent='⌂ Table — '+(net.room||'');
  $('#rvStats').textContent='Hover a card to inspect · click a board to visit · scroll zooms · § cycles';
  const host=$('#rvCards'); host.innerHTML='';
  const W=board.clientWidth, H=board.clientHeight;
  const seats=[...net.roster].sort((a,b)=>a.seat-b.seat);
  const N=Math.max(1,seats.length);
  const MATW=760, MATH=470;
  const fit=Math.min(0.5,(W*0.40)/MATW,(H*0.40)/MATH);
  const s=fit*(N<=2?1.05:(N<=4?0.92:0.78));
  const rx=W*0.335, ry=H*0.315, cx=W/2, cy=H/2+8;
  const felt=document.createElement('div'); felt.className='ovalfelt';
  felt.style.left=(cx-rx*1.18)+'px'; felt.style.top=(cy-ry*1.22)+'px';
  felt.style.width=(rx*2.36)+'px'; felt.style.height=(ry*2.44)+'px';
  host.appendChild(felt);
  seats.forEach(pp=>{
    const k=((pp.seat-mySeat())%N+N)%N;
    const phi=(90+k*360/N)*Math.PI/180;
    const x=cx+rx*Math.cos(phi), y=cy+ry*Math.sin(phi);
    const rot=phi*180/Math.PI-90;
    const mat=renderBoard(pp, {w:MATW, h:MATH, rot});
    mat.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%) rotate('+rot+'deg) scale('+s+')';
    host.appendChild(mat);
  });
}
```

---

## Inline removals (replaced by breadcrumbs, not block-archived)

These were one- or few-line edits; the originals are recoverable from version control / the v1.99.26 project snapshot, and each site carries a `PARKED` breadcrumb:

- **Start screen** – the "Play solo" button (`#btnEmptyImport`) and its click listener; the intro copy reworded. Single players now enter via **Offline**. (`openImport` itself stays – the Decks menu's "Load deck" and the lobby import use it.)
- **Menu** – the "Solo" item removed; "Offline — hotseat" renamed to **"Offline"**.
- **`openOffline()`** – the `mode==='solo'` branch removed; offline now always seeds *You + one opponent* (shrink to one seat in the modal to goldfish alone).
- **Settings** – the "Default table view" row, the "Level 3 table shape" row, and the "Quick React strip" row removed, with their `$('#conv...')` DOM reads/writes and change listeners. `conv.defaultView` is forced `'normal'`; `effectiveL3Shape()` returns `'square'`.
- **Online create dialog** – the "Helicopter shape" (`#mpShape`) field removed and the "Simplified (all)" option dropped from "Table view" (`#mpView`); the create message now sends `l3shape:null`.
- **`cardFx()`** – the `if(altOpen) return;` tray render-guard removed.

> Harmless leftovers intentionally kept live: the `conv.qrView` / `conv.l3shape` localStorage **load guards** (they only assign now-ignored fields), the null-guarded `#qrClear` / `#avClear` listeners, and the `G.shape==='square'?...:...` ternaries in `renderL3()`.

---

## The legacy "visit another board" hand dock (#handTab / #handPeek / #dockBody)

Parked on the way into **client v2.5.11**. A second, separate bottom dock that predated the current `.l2dockopen` dock. It was meant to surface your hand + pile buttons (crypt/library/ash) as a screen-bottom menu while *visiting another board* or in the Helicopter, mirroring the Ready tab. It was retired when the visit/Helicopter views started surfacing the **real** L2 dock instead (`.l2dockopen` → `#z-crypt`/`#z-library`/`#z-ash`/`#z-hand`), at which point `handGate()` was hardcoded to `return false` so this copy never showed. It sat dormant (and was even accidentally "fixed" once — its `--dock-s` scaling — before we realised it was dead) until this cleanup lifted it out.

**Removed from the monolith; what stayed live in the same code region** (do NOT confuse these for parked code if restoring):
- `renderHand()` is kept as a **no-op stub** — live refresh paths (`renderAltIfOpen`, `switchView`, the move handler) still call it. Its original body is archived below.
- The hand-card **type-sort helpers** `HAND_TYPE_ORDER` / `handTypeWords` / `handTypeTuple` / `handTupleCmp` / `handSortCmp` stayed — they're used by the live hand sort (`state.zones.hand.sort`) and deck grouping.
- `updateDockScale()` stayed — it drives `--dock-s` for the **real** `.l2dockopen` dock and is called from `layout()`.
- A few **guarded** references to the removed fns/elements remain harmlessly (`typeof handGate==='function'` in `placeReady`; `typeof handIsOpen==='function'` in the drag handler; `if(ht)` in `enterL3`/`exitL3`; `_visibleEl('handTab')` in `pileAnchorEl`). They evaluate false/null now. The `'dockCrypt'`/`'dockLib'` entries in the pile-flash/drag arrays were trimmed.

### CSS

```css
#handTab{ display:none; position:absolute; left:1.6%; right:1.6%; bottom:6px; height:26px; z-index:4616; box-sizing:border-box;
  align-items:center; justify-content:center; gap:10px;
  border:1px dashed rgba(176,141,79,.32); border-radius:9px 9px 0 0;
  background:linear-gradient(to top, rgba(20,15,10,.55), rgba(20,15,10,.12));
  cursor:pointer; transition:border-color .12s, background .12s, opacity .12s; }
#handTab.show{ display:flex; }
#handTab[data-l3]{ display:none !important; }   /* hidden in L3 helicopter view; enterL3/exitL3 set/remove data-l3 */
#handTab:hover{ border-color:var(--brass); background:linear-gradient(to top, rgba(30,22,14,.7), rgba(30,22,14,.2)); }
#handTab.on{ opacity:0; pointer-events:none; }                 /* dock open -> the handle hides, exactly like L2 Home */
#handTab .dockdlabel{ font:600 10px "Cinzel",serif; letter-spacing:.18em; color:rgba(176,141,79,.72); text-transform:uppercase; pointer-events:none; }
#handTab .dockdarrow{ font-size:11px; line-height:1; color:rgba(176,141,79,.72); pointer-events:none; }
#handPeek{ display:none; position:absolute; left:0; right:0; bottom:0; height:32%; z-index:4615; box-sizing:border-box;
  background:linear-gradient(to top, rgba(12,9,6,.97) 62%, rgba(12,9,6,.72)); border-top:1px solid rgba(176,141,79,.4);
  padding:10px 1.6% 8px; overflow-x:auto; overflow-y:hidden; }
#handPeek.show{ display:flex; align-items:center; }
#dockBody{ display:flex; align-items:flex-end; gap:10px; flex-wrap:nowrap; }
#dockBody .qrlib{ width:calc(var(--cw) * var(--dock-s)); height:calc(var(--ch) * var(--dock-s)); border-radius:7px; }   /* full card size, like the L2 Home dock piles (strip's own .qrlib stays small) -- scaled by --dock-s so it fills the dock as the window grows */
#dockBody .qrlib span{ right:3px; bottom:2px; font-size:11px; }
.dockash{ background:linear-gradient(135deg,#1a1209,#2a1c10); }
.dockash::before{ content:"ASH"; position:absolute; left:0; right:0; top:46%; transform:translateY(-50%); text-align:center; font:600 9px "Cinzel",serif; letter-spacing:.14em; color:#9a8358; }
#handRow{ min-height:42px; }
#handRow .pcempty{ color:#6a5d44; font:italic 12px "Cinzel",serif; padding:9px 2px; }
```

### Markup

```html
<div id="handTab" title="Your hand &middot; hover to peek &middot; double-tap a card to play / react (or drag onto a target) &middot; shown while you're viewing another board or the Helicopter"><span class="dockdlabel">Crypt &middot; Library &middot; Ash heap &middot; Hand</span><span class="dockdarrow">&#9650;</span></div>
<div id="handPeek">
  <div id="dockBody">
    <div class="qrlib" id="dockCrypt" title="Influence a vampire out of your crypt" style="background-image:url('https://static.krcg.org/card/cardbackcrypt.jpg')"><span id="dockCryptN">0</span></div>
    <div class="qrlib" id="dockLib" title="Draw a card &middot; Ctrl-click to undo" style="background-image:url('https://static.krcg.org/card/cardbacklibrary.jpg')"><span id="dockLibN">0</span></div>
    <div class="qrlib dockash" id="dockAsh" title="View your ash heap"><span id="dockAshN">0</span></div>
    <div class="qrsep"></div>
    <div id="handRow" class="qrgroup"></div>
  </div>
</div>
```

### JS: gate + control fns + the original renderHand body + the event-wiring IIFE

```javascript
let handPinned=false, handShowT=null, handHideT=null, handHover=false;
function handGate(){ return false; }   // RETIRED: the visit now surfaces the REAL L2 dock (L2 mode is kept during a visit), so this rendered-copy dock stays disabled.
function handIsOpen(){ const o=$('#handPeek'); return !!(o && o.classList.contains('show')); }

// --- original renderHand() body (now a no-op stub in the live file) ---
function renderHand(){
  const tab=$('#handTab'); if(!tab) return;
  if(!handGate()){ tab.classList.remove('show','on','has'); if(handIsOpen()) closeHand(); return; }
  tab.classList.add('show'); placeHand();
  const cards=state.zones.hand.map(id=>state.cards.get(id)).filter(c=>c);   // your hand
  cards.sort(handSortCmp);   // left-to-right: type order, then alpha within type
  const badge=$('#handTabN'); if(badge) badge.textContent=cards.length;
  tab.classList.toggle('has', cards.length>0);
  if(!handIsOpen()) return;
  const cn=$('#dockCryptN'); if(cn) cn.textContent=state.zones.crypt.length;     // your real pile counts; the dock buttons fire the real actions (influence / draw / browse ash)
  const ln=$('#dockLibN'); if(ln) ln.textContent=state.zones.library.length;
  const an=$('#dockAshN'); if(an) an.textContent=state.zones.ash.length;
  const row=$('#handRow'); if(!row) return;
  row.innerHTML='';
  if(!cards.length){ const d=document.createElement('div'); d.className='pcempty'; d.textContent='Your hand is empty.'; row.appendChild(d); return; }
  cards.forEach(c=>qrCard(row, c, dockS, 'hand'));     // qrCard 'hand' = pointerdown -> qrHandDown (drag) ; double-tap -> playFromHand / give-to-target (qrTap)
}

function placeHand(){ updateDockScale(); /* the Dock is otherwise CSS-positioned (running panel + handle, exactly like L2 Home) -> no other dynamic placement needed */ }
function showHand(){ if(!handGate()) return; clearTimeout(handHideT); const o=$('#handPeek'); if(o) o.classList.add('show'); const t=$('#handTab'); if(t) t.classList.add('on'); renderHand(); if(typeof placeReady==='function') placeReady(); }
function hideHandSoon(){ if(handPinned) return; clearTimeout(handHideT); handHideT=setTimeout(()=>{ if(!handPinned){ const o=$('#handPeek'); if(o) o.classList.remove('show'); const t=$('#handTab'); if(t) t.classList.remove('on'); if(typeof placeReady==='function') placeReady(); } }, 140); }
function pinHand(){ if(!handGate()) return; handPinned=true; clearTimeout(handShowT); showHand(); }
function closeHand(){ handPinned=false; clearTimeout(handShowT); clearTimeout(handHideT); const o=$('#handPeek'); if(o) o.classList.remove('show'); const t=$('#handTab'); if(t) t.classList.remove('on'); if(typeof placeReady==='function') placeReady(); }
function toggleHand(){ handPinned ? closeHand() : pinHand(); }
(function(){
  const t=$('#handTab'), o=$('#handPeek');
  if(t){
    t.addEventListener('mouseenter', ()=>{ handHover=true; clearTimeout(handHideT); clearTimeout(handShowT); handShowT=setTimeout(showHand, 95); });
    t.addEventListener('mouseleave', ()=>{ handHover=false; clearTimeout(handShowT); hideHandSoon(); });
    t.addEventListener('click', e=>{ e.stopPropagation(); clearTimeout(handShowT); toggleHand(); });
  }
  if(o){
    o.addEventListener('mouseenter', ()=>{ handHover=true; clearTimeout(handHideT); });
    o.addEventListener('mouseleave', ()=>{ handHover=false; hideHandSoon(); });
  }
  const hc=$('#handClose'); if(hc) hc.addEventListener('click', closeHand);
  const dl=$('#dockLib'); if(dl){ dl.addEventListener('click', async e=>{ e.stopPropagation(); if(e.ctrlKey||e.metaKey){ undoDraw(); } else if(conv.drawClick!=='double') await drawCard(); renderAltIfOpen(); }); dl.addEventListener('dblclick', async e=>{ e.stopPropagation(); if(conv.drawClick==='double'){ await drawCard(); renderAltIfOpen(); } }); }   // dock piles fire the real pile actions on YOUR piles
  const dc=$('#dockCrypt'); if(dc){ dc.addEventListener('click', e=>{ e.stopPropagation(); if(conv.drawClick!=='double'){ influence(); renderAltIfOpen(); } }); dc.addEventListener('dblclick', e=>{ e.stopPropagation(); if(conv.drawClick==='double'){ influence(); renderAltIfOpen(); } }); }
  const da=$('#dockAsh'); if(da) da.addEventListener('click', e=>{ e.stopPropagation(); showMenu([{label:'View only',fn:()=>browse('ash','view')},{label:'Pick card(s)',fn:()=>browse('ash')},{label:'Burn card(s)',fn:()=>browse('ash','burn')}],e.clientX,e.clientY); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && handIsOpen() && !$('#overlay').classList.contains('show')){ e.preventDefault(); closeHand(); } });
  const _ta=$('#tableArea'); if(_ta){ const _o=$('#handPeek'), _t=$('#handTab'); if(_o) _ta.appendChild(_o); if(_t) _ta.appendChild(_t); }   // live INSIDE the board area so the running panel matches the L2 Home dock bounds and never covers the log / left aside
  window.addEventListener('resize', ()=>{ placeHand(); if(handIsOpen()) renderHand(); });
  setTimeout(placeHand, 420);
})();
```

> **If restoring:** re-add the CSS + markup, replace the `renderHand()` stub with the body above, and undo the `'dockCrypt'`/`'dockLib'` array trims in `pileAnchorEl` / the crypt+library drag/menu wiring. But first ask whether you actually want this second dock back at all — the live `.l2dockopen` dock already covers visit/Helicopter, which is why this was retired. `handGate()` would need a real condition (not `return false`) to ever show it.


---

## "Hide my name" (#mpAnon) — the public-room-list privacy switch (parked v2.6.80, 11 Sep 2026)

A checkbox in the Play online dialog that kept the player's name out of the server's PUBLIC room list (`roomList.names`
omits `anon` players); in-room and in-game the name showed as usual. Nobody had asked for it and its purpose was unclear
in the dialog, so it was parked when Play online became Create game / Join game. The **server still honours `anon`** on
`create`/`join` (untouched), so restoring is client-only: the label below, back under Your name in both halves, and
`anon:$('#mpAnon').checked||undefined` on the `create` and `join` sends (mpCreate / mpJoin) plus `$('#mpAnon').checked=false`
in mpLiteDefaults(). Suggested label if it returns: "Keep my name out of the public room list".

```html
<label class="mpcheck mpFull"><input type="checkbox" id="mpAnon"> Don't list my name in the server's room list</label>
```
