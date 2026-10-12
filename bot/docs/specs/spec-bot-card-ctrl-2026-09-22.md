# Handover to main — bot-card controls at a hotseat, and a Burn item (22 September 2026)

**From:** Elysium Bots (bot v0.6.153) · **To:** the client project (client v2.6.125 / srv-2.6.38)
**Bot changes needed:** none. Both receivers exist bot-side since v0.4.4 (`ctrl`) and v0.6.129 (`burn`).
**Why now:** found while writing the new `START-HERE-BOTS.html` — the guide currently marks the card menu on a bot's board "online only". Closing this lets the guide say "both modes", and gives diablerie of a bot's vampire a verb at all.

---

## 1. The gap, measured in the source (client v2.6.125)

**Where the menu comes from.** `avRenderCard`'s contextmenu handler, line ~12150:

```js
const _botSeat=!!(net.roster||[]).find(q=>q.seat===ctx.seat && q.bot);
if((_mine||_botSeat) && (_hs||_on)){
  items.push({label:'Blood +1', fn:()=> _hs ? hotCtrl(ctx.seat, c.id, 'blood+') : ctrlOnline(ctx.seat, c.id, 'blood+')});
  ...  // Blood −1, Lock/Unlock, Flip, Blue ±1, Green ±1, Send to torpor / Leave torpor
}
```

So at a hotseat (`_hs`) every item on a **bot's** card calls `hotCtrl`.

**Where it dies.** `hotCtrl(seat, cid, act)`, line ~13350:

```js
if(!net.hot || !net.hot.boards || net.hot.boards[seat]==null) return;
...
const o=JSON.parse(net.hot.boards[seat]); const k=(o.cards||[]).find(x=>x.id===cid);
if(!k || (k.owner||null)!==(net.you||'')) return;   // only your own card
```

Two independent reasons it returns silently for a bot seat:

1. `net.hot.boards[seat]` for a bot seat is the placeholder blob nobody reads (your own v2.6.122 note in `giveHot`: *"a bot seat's blob is a placeholder — the injected card vanished at the bot's next publish"*). The bot's cards are not in it, so `!k`.
2. Even when a card is found, the bot's pubs carry **no `owner` field** (bot `push()`/pub builder, line ~854: `id, name, kind, zone, x, y, locked, faceDown, blood, host, attached` — nothing else), so `(k.owner||null)!==(net.you||'')` is always true.

**Nothing else carries it.** `hotBridge._fromBot` / `toBot` has no `ctrl` case; grep for `t:'ctrl'` in the client finds only `ctrlOnline` (`mpSend`). Online the server's `ctrl` handler (srv 927) forwards `{ t:'ctrl', cid, act, from }` to the holder — the bot — and everything works.

**Net effect offline today:** the menu opens, the click does nothing, no toast, no log line, the bot is never told. The seat-level verbs are fine — v2.6.97 already routes `forceSetPool` / `forceOust` through `hotBridge.toBot`, and `hotForcePass` covers Pass their turn.

---

## 2. Fix A — route card `ctrl` to the bot at a hotseat

Same pattern as v2.6.97 for the seat verbs: when the seat is a bot, send the verb and let the bot's push be the truth.

```js
function hotCtrl(seat, cid, act){
  if(hotBotSeat(seat)){                                   // v2.6.126: a bot owns its own cards -- the verb goes to the bot, its next publish is the authority (the v2.6.97 pattern for forceSetPool / forceOust)
    try{ hotBridge.toBot(seat, { t:'ctrl', cid:String(cid), act:String(act||'').slice(0,16), from:(net.you||state.playerName||'You') }); }catch(_e){}
    return;
  }
  // ...existing human-seat body unchanged...
}
```

Notes for the implementer:

- **Shape:** identical to what the server sends (srv 927): `{ t:'ctrl', cid, act, from }`. The bot logs `ctrl from <from>: <act> on <card>`, applies, clamps, and `push()`es. `from` is only for its log; leaving it out is harmless.
- **Feedback:** no optimistic local write is needed — the bot's `board` push arrives over the bridge within its send drain and repaints through the normal `board` path. If you want instant feedback, the optimistic `ctrlApply` on `net.boards[seat].pub` that `ctrlOnline` already does is safe here too (the push overwrites it).
- **Verbs the bot accepts:** `blood+ blood- blue+ blue- green+ green- lock unlock flip torpor untorpor burn`. Unknown verbs are ignored without a push. `torpor` repositions the card into the torpor row and fires the bot's Fame hook; `untorpor` returns it to the ready row.
- **Gating:** keep the existing `_botSeat` gate on the menu; the bot does no owner check by design ("reaching the handler at all means the table opted in").
- **Do not** route human seats through the bridge — `hotCtrl`'s existing body is right for them.

## 3. Fix B — a Burn item on the bot-card menu (both modes)

Bot-side `ctrl 'burn'` exists since v0.6.129 (CLAUDE.md debt 26h): it moves the card to `burned`, drops anything attached to it, notes *"<vamp> is burned (diablerie or final death in torpor)"* when the card was in torpor, and pushes. There is no client item that sends it, so a human who diablerises a bot's torpored vampire has no verb, online or offline.

Suggested addition inside the `(_mine||_botSeat) && (_hs||_on)` block, bot seats only (a human's own card already has *Burn to my ash* / *Take back* above it):

```js
if(_botSeat) items.push({label:'🔥 Burn (remove from game)', noUndo:true,
  fn:()=>{ const _go=()=>_do('burn');
           if(typeof uiConfirm==='function') uiConfirm('Burn '+(c.faceDown?'this card':c.name)+' from '+esc(ctx.who)+'’s board? (diablerie / final death)').then(ok=>{ if(ok) _go(); });
           else _go(); } });
```

`_do` is the existing `a=> _hs ? hotCtrl(ctx.seat, c.id, a) : ctrlOnline(ctx.seat, c.id, a)` — so with Fix A in place the same item works in both modes. A confirm is worth it: burn is the one verb here that cannot be undone from the menu. Server-side nothing changes: srv 927 already forwards any 16-char `act`.

Rules note for the label/tooltip: burning a bot's vampire in torpor is the human's **diablerie** (or a Fame/final-death situation the bot could not see); the human handles their own blood-hunt referendum as usual — the bot does not call one.

## 4. Tests on your side

The client suite already drives a real `Bot` through `hotBridge` (HB2b `testA`). Two small additions:

- **ctrl reaches the bot:** seat a bot, deal, take a vampire `cid` from its first pub, call `hotCtrl(seat, cid, 'blood-')`, await the next `board` from that seat, assert blood dropped by 1. Repeat for `torpor` (zone `torpor`) and `untorpor`.
- **burn removes the card:** `hotCtrl(seat, cid, 'burn')` → next pub has no card with that `cid`, and a `chat` line from the bot contains "is burned".
- **human seats unchanged:** the existing `hotCtrl` assertions for a human's own card on another human's board still pass (no bridge call for a non-bot seat).

## 5. What we do when you ship

- Re-run `test-bot-hotseat.js` (gate H1–H9) and the canary against the new client file.
- Add a hotseat-gate assertion for `ctrl` + `burn` through the real bridge (our side).
- Update `START-HERE-BOTS.html`: the card menu becomes "both modes", the Burn item is documented under *Adjusting a bot's board*, and the two "known gap" boxes go away.
- Mark CLAUDE.md debt **26h** closed.

## 6. Version floor

No new bot floor. `ctrl` verbs (incl. `burn`) are accepted by every bot ≥ v0.6.129; the client's existing `HOT_BOT_MIN` (v0.6.147) already covers it.
