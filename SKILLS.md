# SKILLS.md — Elysium Development Recipes

> Step-by-step patterns for recurring development tasks, distilled from ~25 sessions of implementation. Each recipe lists the exact touch-points in the codebase and the order they must be done in. Read `CLAUDE.md` for the project overview and constraints. **Reflects Elysium v2.5.34 (client v2.5.34 / server v2.5.2).**

---

## Skill: Add a new `conv` setting (local convenience toggle)

A setting that lives in the player's browser and controls a client-side behaviour.

### Steps

1. **Default value** — add the field to the `let conv={...}` object (line ~1805). Pick a sensible default (bool, string, or number).

2. **Load from localStorage** — add a type-checked line in the `try{ const s=JSON.parse(...)` loader block (line ~1828). Follow the existing pattern:
   - Boolean: `if(typeof s.myField==='boolean') conv.myField=s.myField;`
   - String enum: `if(s.myField==='a'||s.myField==='b') conv.myField=s.myField;`
   - Number range: `if(typeof s.myField==='number' && s.myField>=0 && s.myField<=100) conv.myField=s.myField;`

3. **Migration** (if replacing an old field) — add a migration line in the same loader block. Example: `if(s.oldField && conv.newField==='default') conv.newField='migrated';`

4. **UI element** — add a `<label>` / `<select>` / `<input>` row in the Settings modal HTML (inside the appropriate `<div class="set-section">`). Use a unique `id` with the `conv` prefix for **all** Settings elements — both checkboxes and dropdowns: `convMyField`. Examples from the codebase: `convCardDB`, `convAutoLock`, `convPco`, `convAnim`, `convHoverPreview`.

5. **Sync on open** — in `openSettings()` (~line 10681), add `$('#convMyField').checked=conv.myField;` (or `.value=conv.myField` for selects).

6. **Change listener** — after the Settings block (near line ~11085), add:
   ```js
   // For a checkbox:
   $('#convMyField').addEventListener('change', e=>{
     conv.myField = e.target.checked;
     saveConv();
     // Optional: trigger a visual refresh (applyPco(), renderL3(), etc.)
   });
   // For a dropdown (<select>):
   $('#convMyField').addEventListener('change', e=>{
     conv.myField = e.target.value;
     saveConv();
   });
   ```

7. **Use the setting** — gate your feature on `conv.myField` at its call sites.

8. **Verify** — syntax check + `node test-client-logic.js` (16/16).

### If the setting should be host-lockable (room-wide)

Add these extra steps after step 6:

- **Server `create` handler** — in `elysium-server.js`, the `create` case (~line 888) already validates known fields from `m`. Add your field with strict validation (e.g. `myField: m.myField === 'a' ? 'a' : 'default'`).
- **Server room storage** — store it on the `room` object.
- **`joined` message** — include it in the `msg` object built inline in the join path (~line 218, where `msg.boardMode` / `msg.reactSecs` are assigned). There is no named `joined()` function — it's inline message-building.
- **`started` broadcast** — include it in the `bcast` at game start (~line 467).
- **`lobby` snapshot** — include it in `bcastLobby` / the lobby render data.
- **Client `joined` handler** — in the `MP_HANDLERS.joined` function (~line 6644), read it: `net.myField = m.myField || 'default';`
- **Client `create` verb** — add it to the `mpSend({t:'create', ...})` call (~line 6599).
- **Client `took` handler** — read it in `MP_HANDLERS.took` (~line 6705).
- **Named saves** — include it where the match is persisted/restored (`saveMatch` handler ~line 784; the saved-match data shape `loadMatch` reads ~line 1145).
- **Bump the server VERSION** — this is a wire protocol change.

---

## Skill: Add a new helper (phase-helper toggle)

A toggleable convenience that assists with turn structure, gated by tournament mode and host policy.

### Steps

1. **`HELPER_DEFS` entry** — add a row to the `HELPER_DEFS` array (~line 6007):
   ```js
   { key:'myHelper', el:'helperMyHelper' },
   // or { key:'myHelper', el:'helperMyHelper', def:false } for default-off
   ```
   This single entry auto-generates: the default value, the localStorage round-trip, the Settings checkbox sync, and the change-handler wiring.

2. **HTML label** — add a `<label id="helperMyHelper">` row in the Settings modal's helper section.

3. **Server `HELPER_KEYS`** — add `'myHelper'` to the `HELPER_KEYS` array in `elysium-server.js` (~line 144). This makes it host-lockable.

4. **Gate your feature** — use `hx('myHelper')` at the call site. This function handles: tournament mode (forces off), host lock (uses host settings), and local toggle.

5. **Disabled menu items** — if the helper gates a menu action, use `disabled: !someCondition` in the menu item object. `renderItems()` handles the CSS (`.mi.disabled`: opacity 0.4, `pointer-events:none`) and skips the click handler.

6. **Verify** — syntax check + client logic suite + server syntax check.

---

## Skill: Add a new server verb (online action)

A new client→server→client message for an online feature.

### Steps

1. **Choose the verb name** — short, lowercase, camelCase. Examples: `edgePass`, `edgeTake`, `shufPile`, `pileReturn`, `recall`/`recalled`/`ctrl` (v2.5.25–2.5.26 cross-board — pure routing: validate the seat, forward to the holder, echo back; the holder validates `owner === from` before acting).

2. **Server handler** — add a function to `GAME_HANDLERS` in `elysium-server.js` (~line 329):
   ```js
   myVerb(conn, room, p, m){
     // p = the sending player object (has p.name, p.game, p.out, etc.)
     // m = the parsed message from the client
     // NEVER trust client-sent seat numbers — derive from:
     const seat = room.players.indexOf(p) + 1;
     // Validate all input, sanitise strings with cleanCard() / String().slice()
     // Respond: wsSend(conn.sock, {...}) for the sender only
     // Broadcast: bcast(room, {...}) for everyone (optionally exclude sender)
   }
   ```

3. **Client send** — call `mpSend({t:'myVerb', ...data})` at the action site. Remember: `mpSend` is a no-op in hotseat (`net.ws` is null).

4. **Client handler** — add a handler to `MP_HANDLERS` (~line 6643):
   ```js
   myVerbResponse(m){
     // process the server's response/broadcast
   }
   ```
   The dispatch is automatic — `mpOnMsg` looks up `MP_HANDLERS[m.t]`.

5. **Hotseat equivalent** — if the feature should work offline, write a local function (e.g. `myVerbHot(...)`) that applies the same mutation directly to `net.hot.boards[seat]` and/or `net.boards[seat].pub`. Gate the dispatch:
   ```js
   if(net.hot && !inRoom()) myVerbHot(...);
   else mpSend({t:'myVerb', ...});
   ```

6. **Error handling** — server errors: `return wsSend(conn.sock, {t:'err', msg:'...'});`. Client: errors propagate to `ws.onmessage`'s try/catch → `dbg('mpOnMsg')`.

7. **Sanitisation** — never relay raw HTML or user text. Card names: `cleanCard()`. Strings: `String(x).slice(0, limit)`. Numbers: `Math.max/min` clamping.

8. **Update protocol docs** — add the verb to the "Protocol reference" tables in the Technical Documentation.

9. **Bump the server VERSION** if this is a new protocol verb.

10. **Test** — server syntax check. If networking is available, add a test in the appropriate `test-2*.js` suite. If not, say so explicitly.

---

## Skill: Add a new token type

A non-card object on the board (like the Edge).

### Steps

1. **`TOKEN_DEFS` entry** — add to the registry (~line 5271):
   ```js
   myToken: {
     label: 'My Token',
     size: 80,          // pixel size at scale 1
     svg(sz){           // returns an SVG string
       return '<svg viewBox="0 0 100 100" width="'+sz+'" height="'+sz+'">...</svg>';
     },
     menu(tok){          // right-click menu items (or null)
       return [{ label:'Do thing', fn:()=>doThing(tok) }];
     }
   }
   ```

2. **Create/remove** — use the generic engine: `makeToken('myToken')`, `removeToken('myToken')`. `makeToken` handles DOM creation, `bindTokenDrag`, and `board.appendChild`.

3. **Placement** — `placeToken(tok)` handles `pubXform` + `cardTransform` + L4 scaling automatically. Set `tok.x`, `tok.y` (canonical coordinates), then call `placeToken(tok)`.

4. **Serialization** — `buildPub()` already exports `tokens: [...]` from the `tokens` Map. `buildMat()` already renders them from `pub.tokens`. No changes needed for the generic case.

5. **Online verbs** — if the token can be passed between players (like the Edge), add verb(s) following the "Add a new server verb" skill.

6. **Hotseat** — if the token transfers between seats, write into all three state layers (see CLAUDE.md "Hotseat state layers").

### Critical rule

**Never put tokens into `state.cards` or `state.zones`.** Tokens use a parallel `tokens` Map with their own placement/drag pipeline. Mixing them breaks clone animations, drag behaviour, and zone snapping.

---

## Skill: Add a sound effect (SFX)

Web-Audio synth sounds (no audio files — keeps the zero-dependency, single-file promise). All SFX live in the `sfx-audio` fragment and are gated on `conv.sfxVol`.

### Steps

1. **Write the sound** — add a function in the `sfx-audio` section that builds oscillators/gains off the shared `actx` AudioContext. Bail out immediately when muted:
   ```js
   function sfxMyCue(){
     if((conv.sfxVol==null?0:conv.sfxVol)===0) return;   // master mute → no AudioContext work at all
     actx = actx || new (window.AudioContext||window.webkitAudioContext)();
     if(actx.state==='suspended') actx.resume();
     const t = actx.currentTime;
     // build osc + gain, schedule the envelope relative to t, scale peak gain by conv.sfxVol/100
   }
   ```

2. **Scale by master volume** — multiply your peak gain by `(conv.sfxVol/100)` so the Settings slider (0–200%) works. If the cue is one of the per-event sounds, respect its level in `conv.sfxIndiv`.

3. **Fire it** — call `sfxMyCue()` at the game event (played card, lock/unlock, pass bell, oust, your-turn). Cooldown-guard high-frequency events so sounds don't stack (see the logged-event cue's cooldown pattern).

4. **Tune in isolation first** — `vtes-sfx-demo.html` is a standalone Web-Audio playground with no game state; prototype the timbre there before wiring it in.

5. **Verify** — syntax check + client logic suite. (Sound itself is unverifiable in the sandbox — say so; Johan listens live.)

---

## Skill: Add a keyboard shortcut / action

A bindable action that appears in Settings → Shortcuts.

### Steps

1. **`ACTIONS` entry** — add to the array (~line 10449):
   ```js
   {id:'myAction', grp:'adv', def:'', label:'My action description', fn:myFunction},
   ```
   - `grp`: `'basic'` (always shown) or `'adv'` (behind "Show advanced")
   - `def`: default keybind (single key, e.g. `'M'`, `'F6'`) or `''` for unbound
   - `fn`: the function to call (must exist at this point in the script)

2. **The function** — write it anywhere before the `ACTIONS` declaration. It receives no arguments (the keymap calls it bare).

3. **Automatic wiring** — the keybind system, Settings UI rows, and the keydown dispatcher all read `ACTIONS` — no manual wiring needed.

---

## Skill: Feature with dual transport (hotseat + online)

The canonical pattern for any table feature that works both locally and over the network.

### Design principle

Write the feature once against the shared board model. Branch **only** at the commit point:

```js
function myFeature(targetSeat, data) {
  // Shared: validation, UI update, logging

  if (net.hot && !inRoom()) {
    // HOTSEAT: apply locally to stored boards
    myFeatureHot(targetSeat, data);
  } else {
    // ONLINE: send to server, let the echo apply it
    mpSend({t:'myFeature', seat:targetSeat, ...data});
  }
}
```

### Hotseat commit pattern

```js
function myFeatureHot(seat, data) {
  if (seat === mySeat()) {
    // Active seat: mutate state directly
    state.myThing = data;
  } else {
    // Stored seat: parse JSON → mutate → stringify
    const b = JSON.parse(net.hot.boards[seat]);
    b.myThing = data;
    net.hot.boards[seat] = JSON.stringify(b);
  }
  // Also update the pub view (for overview rendering)
  if (net.boards[seat]) {
    net.boards[seat].pub.myThing = data;
  }
  // Refresh the current view
  if (typeof net.view === 'number') renderRemote(net.view);
  else if (net.view === 'ov') renderL3();
}
```

### Common mistakes

- Forgetting the third state layer (active seat is live `state`, not `net.hot.boards[mySeat()]`).
- Treating `net.hot.boards[seat]` as an object (it's a JSON **string**).
- Only updating pub but not the stored board (changes vanish on seat switch).
- Adding a new persistent field without putting it in **both** `serializeGame`/`restoreGame` (hand-off + save) **and** `snapshot`/`restoreSnap` (undo) — it is then silently wiped on the next seat swap or undo. (v2.5.3: `state.target`, the play-FX aim, was lost on every hotseat hand-off this way; v2.5.10: `net.rtarget`, the *cross-board* target, had the identical bug — and a leaked stale target even mis-routed the next hand-play through `qrGiveToTarget` into a self-give.) Restore it guarded by `state.cards.has(id)` if it points at a *local* card; `net.rtarget` points at another seat's board, so it is NOT validated against `state.cards` (the existing snapshot/roster pruning nulls it if stale). Then repaint (`updateSelVisual()` / `updateTargetBtn()`).
- Testing only in hotseat and not exercising the online path (bugs rot silently — see learnings).
- **Using a locally-minted incrementing counter as a sort key that has to merge across seats.** Fine in hotseat (one counter, shared via serialize/restore) but WRONG online — each client's counter starts at 0 independently, so the seats interleave by incomparable numbers. Use `Date.now()` (globally comparable, no coordination) + a stable id tiebreaker instead. (v2.5.19: `_avSeq`, the Played-tab play-order key, started as `++_avSeq` per client and interleaved wrongly online until it became a timestamp.)

---

## Skill: Add Played-tab info (ordering, sort modes, batch highlight)

The Played-cards tab/overlay (`#playedTab` / `#playedOverlay` / `#playedRow`) is a window-fixed, local, glanceable view of every loose card played since the last clear / phase change. It is **view-independent by design**: `position:fixed` (window-anchored, not board-anchored) and `renderPlayed()` has **zero L2/L3/L4 branches** — one code path. So new behaviour added here lights up in every view by construction; you do NOT add per-view handling.

### Key functions

- `collectPlayed()` — gathers own loose-ready cards (`state.zones.ready`) + every opponent's `pub.cards`, each tagged with owner colour + name. Sorts by `c._avSeq` ascending (play order). Reads opponent data from `net.boards[seat].pub` — populated by `buildPub()` in hotseat AND by the online `board(m)` handler (which stores `m.pub` verbatim), so the same code covers both transports.
- `renderPlayed()` — reads `conv.playedSort`: `'new'` calls `list.reverse()` (newest at top); `'action'` sorts by `avRank` desc (`isAction`=2, `actSt==='played'`=1, else 0) with `_avSeq` desc as tiebreaker, and tags `avc-batch` on `actSt==='played'` cards.
- `renderAltIfOpen()` → `renderPlayed()` — the universal refresh entry point; call it after any state change that should re-render the overlay.

### Ordering field (`_avSeq`)

Cards carry `c._avSeq = Date.now()`, stamped in `tagPlayed()`. **A timestamp, not a counter** — it must be comparable across independent online clients (a per-client counter only works in hotseat). It rides through **all four card-reconstruction paths**: `snapshot`/`restoreSnap` (undo), `serializeGame`/`restoreGame` (autosave + hotseat hand-off), `buildPub` (opponent pub), and `restoreFromPub` (online host snapshot-restore). Card id is the same-millisecond tiebreaker. **When adding any sortable per-card field, wire all four paths** or it silently sorts as 0 somewhere.

### Batch highlight (`avc-batch`)

A CSS `box-shadow` ring (NOT `outline` — that's used by `avsel` for selection; `box-shadow` composes with it). Applied to cards whose `actSt==='played'` (the current unresolved action + its modifiers) only in `'action'` sort mode. It clears when `resolvePlayedActions()` fires (which ends with `renderAltIfOpen()`). `actSt` is in `buildPub`, so the ring shows for opponents online and in hotseat.

### Resolve triggers (what closes the batch)

`resolvePlayedActions()` is called from: `tagPlayed()` when a new action-TYPE card is played (DB on); `activatePhase()` (phase advance, all batches); the basic minion `act()` lambda for Bleed/Hunt/Rescue/Diablerie/Card action (via a `resolve=true` default param — **Block passes `false`**, it's a reaction); and `saySend()` on the "It resolves" quick phrase (string-checked, not index). To add a new resolve trigger, call `resolvePlayedActions()` at the action's commit point.

---

## Skill: Add a Classic-tutorial step

Steps live in `TUT_SECTIONS` (an `app-*` fragment), keyed by section (`introduction`, `classic-crypt`, `classic-play`, …) ordered by `TUT_ORDER`. Each step is an object in that section's `steps` array.

### Step object fields
- `id` — unique kebab id (e.g. `cp-undo`).
- `target:()=>Element|null` — the element to spotlight; `()=>null` + `place:'center'` centres the box.
- `place` — `'top'|'bottom'|'left'|'right'|'center'` (box position relative to target).
- `freeInteract:true` — coach-mark mode (board stays interactive); most gameplay steps use this.
- `onEnter:function(){…}` — record a baseline here (e.g. `tut._fooBase = <counter>`); runs when the step activates.
- `text` — HTML; use `&mdash;`/`&rarr;`/`&rsquo;` entities and `<b>` for emphasis.
- `gate:function(){ return <bool> }` — completion predicate, polled each frame; Continue arms when it returns true.
- `gateHint` — the nudge shown until the gate passes.
- `advance:{on:'manual'}` — the standard pattern (gate arms Continue, the user clicks it).
- `skip:()=>bool` — omit the step when true (branching, e.g. vampire vs methuselah via `tut._playWithVamp`). Steps with **no** `skip` are where branches converge — put shared lessons there.

### Robust completion gates (important)
Gate on a **monotonic signal that only the target action moves**, not a visible side-effect several actions share. For "press Undo", gating on `hand.length >= base` is wrong — a *draw* also grows the hand. `undoStack` only *shrinks* on an Undo (every other undoable action grows it), so `undoStack.length < tut._base` (baseline set in `onEnter`, after the card is played) detects exactly an Undo. (v2.5.27: `cp-undo-play` + `cp-undo`.)

### Where to insert
Add the new object(s) before/after the anchor step in the target section, then run the client gate (syntax + `test-client-logic.js` + byte-roundtrip). No version is hardcoded in the tests.

## Skill: Park (retire) code

Move removed code to `kodarkivering.md` for potential future use.

### Steps

1. **Archive** — copy the removed code verbatim into `kodarkivering.md` with:
   - **What it did** — a short description
   - **Why it was parked** — the reasoning
   - **Where it lived** — file + approximate location
   - The **verbatim source** in a fenced code block

2. **Breadcrumb** — at each removal site in the live code, leave a comment:
   ```js
   // PARKED: description -> kodarkivering.md
   ```

3. **Assert safety** — breadcrumb text must **not** contain the exact identifier strings being asserted absent in any Python patch scripts. This causes self-inflicted assert failures.

4. **Clean up** — remove all references to the parked code: defaults, loaders, Settings UI, event listeners, CSS rules. Grep for the function/variable name to catch stragglers.

> **When "dead" code is interleaved with live code** (it happens — utility helpers get parked next to the feature that first used them, and a function can be a no-op *in effect* yet still be a live call target): do NOT force a wholesale delete. Grep each symbol's *call sites* first. Keep live callees in place (e.g. the hand-card type-sort helpers nested inside a retired dock's region); reduce a load-bearing-but-dead function to a **documented no-op stub** rather than deleting it (deleting throws at its live call sites); and leave already-`typeof`-/`if(el)`-guarded references — those guards were written precisely so the thing could be removed. (v2.5.11: archiving the legacy hand dock kept `handSortCmp`/`updateDockScale()` live and stubbed `renderHand()`.) Apply the removals as one atomic Python patch (`assert s.count(old)==1` per edit), then sanity-grep that dead defs are gone (count 0) and live helpers/callers remain, before the syntax / test / byte-roundtrip gates.

---

## Skill: Patch the client (atomic edit)

The safe way to edit the monolith.

### Steps

1. **Find unique anchors** — `grep -n 'your search' elysium-vtes-bord.html`. Verify the anchor appears exactly once.

2. **Write the Python heredoc**:
   ```bash
   python3 << 'PYEOF'
   with open('elysium-vtes-bord.html') as f: s = f.read()

   # Assert ALL anchors first (nothing written if any fails)
   assert s.count('ANCHOR_1') == 1, 'ANCHOR_1 not unique'
   assert s.count('ANCHOR_2') == 1, 'ANCHOR_2 not unique'

   # Apply ALL replacements
   s = s.replace('ANCHOR_1', 'REPLACEMENT_1')
   s = s.replace('ANCHOR_2', 'REPLACEMENT_2')

   with open('elysium-vtes-bord.html', 'w') as f: f.write(s)
   print('Patched OK')
   PYEOF
   ```

3. **Verify**:
   ```bash
   sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -
   node test-client-logic.js
   ```

4. **Deliver**:
   ```bash
   cp elysium-vtes-bord.html /mnt/user-data/outputs/
   # then call present_files
   ```

### Rules

- **Plain ASCII anchors only.** No smart quotes, em-dashes, or arrows in find-strings.
- **Single `\u` in `'PYEOF'` heredocs** produces the character. Double `\\u` produces literal text.
- **Chain from the latest output.** Never patch from the original project source — intermediate changes are lost.
- **Re-grep between edits.** Line numbers shift after every replacement.

---

## Skill: Re-sync the fragment build (split → build → cmp)

After editing the monolith, re-derive the `elysium-src/` fragments and prove they still reconstruct the file byte-for-byte. The monolith stays the source of truth — this keeps the B1 fragment mirror honest.

### Steps

1. **Snapshot the pristine monolith** — the splitter reads from `/tmp/original.html`:
   ```bash
   cp elysium-vtes-bord.html /tmp/original.html
   ```

2. **Split** — carve the `<script>` body into ordered fragments under `elysium-src/`:
   ```bash
   python3 split_client.py
   ```
   It asserts every anchor is unique and in source order, and verifies reassembly internally. If an anchor moved (you edited near a `*_START` / `*_END` boundary), fix the anchor in `split_client.py` first.

3. **Build** — reassemble `shell.html` + `manifest.txt` + fragments back into the monolith:
   ```bash
   node elysium-build.js                       # writes elysium-vtes-bord.html
   # or: node elysium-build.js /tmp/rebuilt.html   to compare without overwriting
   ```

4. **Prove byte-identity** — the gate that matters:
   ```bash
   cmp /tmp/original.html elysium-vtes-bord.html && echo "byte-identical"
   ```

5. **Re-check syntax on the rebuilt file** (the build shouldn't change it, but verify):
   ```bash
   sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -
   ```

### Rules

- **The monolith is upstream, not the fragments.** Edit `elysium-vtes-bord.html`; let the split re-derive the pieces. Don't hand-edit a fragment and rebuild — drift creeps in and `cmp` is the only thing that catches it.
- **"(N bytes)" in the build log counts characters, not bytes.** Trust `cmp` / `wc -c` for byte-identity, not the printed count.
- **Em-dash anchors must match exactly.** Some splitter anchors carry `—`; a typed hyphen fails the assert. Copy them verbatim.
- **If you move a fragment boundary**, update the matching anchor in `split_client.py` in the same pass. **v2.5.0 re-anchoring (done):** `buildPub()` had drifted below the hotseat block, breaking the source-order assert — and it broke on the *pristine* monolith too, so always test a failing build gate on unedited source first to separate a real regression from pre-existing drift. `net` now ends at `HS_START`; the post-hotseat chunk (incl. `buildPub`) is one app fragment; `buildPub` is no longer a cut anchor. The splitter now produces **12 fragments** (was 13).

---

## Skill: Regenerate the Word documentation

> **Note:** the generators (`build-docs-en.js` / `build-docs.js`) may be local-only — they aren't always in the project snapshot. If they're missing, ask Johan rather than hand-editing the `.docx` (the content lives in the generator; the `.docx` is build output). Read the `docx` skill first regardless.

### Steps

1. **Read the docx skill** — `view /mnt/skills/public/docx/SKILL.md` (mandatory before any doc work).

2. **Edit the generator** — modify `build-docs-en.js` (English) or `build-docs.js` (Swedish). The content lives in the generator, not in the .docx files.

3. **Build**:
   ```bash
   node build-docs-en.js
   ```

4. **Validate**:
   ```bash
   python3 /mnt/skills/public/docx/scripts/office/validate.py "Elysium - Player Manual.docx"
   python3 /mnt/skills/public/docx/scripts/office/validate.py "Elysium - Host Guide.docx"
   python3 /mnt/skills/public/docx/scripts/office/validate.py "Elysium - Technical Documentation & Roadmap.docx"
   ```

5. **Content check**:
   ```bash
   extract-text "Elysium - Player Manual.docx"
   ```
   Confirm content rendered and no `\u` / `\U` escapes leaked through.

6. **Deliver** — `cp` all three .docx files to outputs + `present_files`.

---

## Skill: Add a card menu action

A new right-click option on a card.

### Steps

1. **Find the menu builder** — card context menus are built in `cardMenu(c, x, y)` or the relevant zone handler. Items are objects:
   ```js
   { label: 'My action', fn: () => { pushUndo(); doSomething(c); } }
   ```

2. **Disabled state** — use `disabled: !condition` to grey out without removing:
   ```js
   { label: 'Phase-gated action', fn: () => {...}, disabled: !_phaseOK }
   ```

3. **Submenus** — use `sub: [...]` for a submenu. Ellipsis (`…`) in the parent label signals "opens submenu". Leaf items never have ellipsis.

4. **Undo** — always `pushUndo()` before the first mutation. For bulk operations, call it once before the loop (one undo step for the whole batch).

5. **Logging** — use `cardRef(c)` for card names in log entries. This function respects the anonymity rule: a card's name only appears in the log when the card is publicly visible.

6. **Special submenu** — crypt-specific or library-specific actions go under the "Special…" submenu at the bottom of the card menu.

---

## Skill: Add a room-wide setting (lobby / create dialog)

A setting chosen by the host that applies to all players.

### Pattern (follow an existing setting like `reactSecs` or `boardMode`)

1. **Client create dialog** — add a UI element in the create/lobby modal HTML. Read its value in the `mpSend({t:'create', ...})` call (~line 6599).

2. **Server `create`** — validate strictly in the create handler (~line 888). Example: `myField: m.myField === 'a' ? 'a' : 'default'`. Store on `room.myField`.

3. **Server `joined`** — include in the `msg` built inline in the join path (~line 218, alongside `msg.boardMode` / `msg.reactSecs`). It's inline, not a named function.

4. **Server `started`** — include in the `bcast` at game start (~line 467).

5. **Server lobby snapshot** — include in the lobby data.

6. **Server save/load** — include the field where the match is persisted: the `saveMatch` handler is at ~line 784, and the saved-match data shape that `loadMatch` restores is at ~line 1145.

7. **Client handlers** — read in `MP_HANDLERS.joined` (~line 6644) and `MP_HANDLERS.took` (~line 6705): `net.myField = m.myField || 'default';`

8. **Client lobby render** — display the setting in the lobby UI if players should see it.

9. **Bump server VERSION** — this changes the wire protocol.

---

## Skill: Add a tutorial step or section

The guided tutorial (offline onboarding) is a self-contained `tut*` block in `app-5.js`. Steps are data, so most additions are a single object in a section's `steps[]`. Architecture: `CLAUDE.md` → "Tutorial" and `elysium-project-context.md` → "v2.5.2".

### Add a step to an existing section
1. Find the section in `TUT_SECTIONS` (`introduction`, `decklab`, `lobby`, `classic-intro`, `classic-crypt`, `classic-play`, `classic-interact` — all seven are full sections with their own `steps[]`, none are stubs as of v2.5.0's slice-3 completion). Add a step to its `steps:[]`:
   ```js
   { id:'lob-foo', target:()=>$('#someEl'), place:'top', scroll:()=>$('#someEl'),
     text:'What this control does.', advance:{on:'manual'} }
   ```
2. Choose the mechanic:
   - **Read + Continue** → `advance:{on:'manual'}`.
   - **Click the highlight to advance** → `advance:{on:'click'}` (the real handler still fires; a capture-phase listener advances).
   - **Let the real control work, advance on Continue** → add `clickThrough:true` (hole left open; a native `<select>` works regardless).
   - **Grey Continue until a condition holds** → `gate:()=>bool` + `gateHint:'…'` (polled every frame in `tutTick`).
   - **Grey Continue until the user clicks a real control** → `clickArm:()=>el` + `gate:()=>tut._click`.
   - **Bring a tall-modal element into view** → `scroll:()=>el`.
   - **A step on the L4 free board (cards placed anywhere)** -> `freeInteract:true` (coach-mark: no dim/block, ring only) — the hard spotlight can't be aimed at a free surface. Add `orContinue:true` to an event/predicate step to also show a Continue escape hatch.
   - **Highlight several elements at once** (e.g. all face-down vampires) -> `ringRect:()=>({left,top,right,bottom,width,height})` (ring + bubble bound the rect, overriding `target`; recomputed each frame so it tracks as cards move).
3. A full-dim explanatory step (no highlight) = `target:()=>null` + `place:'center'`.
4. Branch-only step: give it `allowSkip:true` and a `target()` that returns `null` in the other branch — it auto-skips and `tutVisibleInfo` keeps "Step X / N" gapless (this is how precon-vs-file steps are gated via `tut._dlMode`).

### Add a whole section
1. Add `{ name, desc, steps:[…] }` to `TUT_SECTIONS` and its id to `TUT_ORDER` (sets sequence + the next-section prompt).
2. If it needs a modal open / data loaded first, add a branch to `tutLaunch(secId)` that resolves the prerequisite **before** `tutStart` — open the modal / prompt / load, *then* start. Never show the layer then resolve (blank-overlay flash, `idx=-1` gap). (`decklab` prompts via `tutEnsureDecks`; `lobby` does `offlineCfg=[]; openOffline();`.)
3. Targeting dynamically-rendered rows that have no IDs: use a structural query, e.g. `#offlineSeats > div:nth-child(N) select`.
4. "Do X *again*" gating (a state predicate is already true after the first time): bump a counter from a `tutNotify('your-event')` breadcrumb in the relevant app function and gate on `count > base`, capturing `base` in `onEnter`. Template: `loadPrecon` → `tutNotify('deck-loaded')` → `tut._loadSeq`.
5. Completion is automatic: the last step's advance → `tutFinishSection` records `conv.tutDone` (`tutMarkDone`), offers the next *ready* section (`tutNextReady`, skips stubs), else `closeOverlay()` back to the welcome screen.

### Classic gameplay sections (3a/3b) — L4 facts
These run on a **live L4 free-board** Classic table (`tutQuickClassic` auto-seats one if none is up). Targeting facts that bite:
- **The dock handle in L4 is `#l2dock`** (the old `#handTab` was archived to `kodarkivering.md` in v2.5.11; `enterL4()` adds `l2mode+l3mode+l4mode+l2cols`). Ring `#l2dock` while closed → `#z-crypt` once the dock is open (the **live** dock's crypt pile — *not* `#dockCrypt`, which was the dead dock's and is also archived).
- **`#statsTab` is `translateY(-80px)` off its layout box** — target its *visual* `getBoundingClientRect`, not `#statsDock`; grow the rect to include `#statsPanel` when `#statsDock.open`.
- **A dragged crypt card → `ready` face-down; a double-click (`influence()`) → `uncontrolled`** (free placement). Gate on the *actual* landing zone for the view (helpers: `tutCryptOnBoard()`, `tutVampsOnFelt()`, `tutFaceUpVamp()`, `tutFaceDownVampRect()`), and gate a "move it" step on the card's `{x,y}` having moved (recorded in `onEnter`), not just `faceDown===false`.
- The whole Classic tutorial table **persists** on two layers: a shared "latest mid-step" mirror (`elysium.tut.game`, flag `tutGameLive` set in `tutStart` / cleared in `startHotseat`, mirrored via `scheduleSave` independent of the autosave mode), AND a **per-chapter entry snapshot** (`tutChapKey(secId)='elysium.tut.game.'+secId`, captured once in `tutStart()` the first time a `classic-*` chapter is reached, never overwritten) that the tutorial picker resumes from when you relaunch an already-completed chapter — see `tutGameSnapshot()`/`tutGameResume()`. `tutEnd`/`tutCancel` (End tutorial / Esc) clears **only** the shared mirror, deliberately keeping the per-chapter snapshots; only `tutResetProgress` clears both (v2.5.31 added the per-chapter layer on top of the pre-existing single-key mirror — see `elysium-learnings.md`). Boards restore exactly; the turn counter resets to turn 1 / VP to 0 on resume (documented trade-off, not yet fixed).
- **L4-specific bug classes to check first if a new L4 step looks broken:** (1) any one-shot UI flag zeroed by `clearTable()` leaks back on every hotseat seat-swap unless it's also round-tripped through `serializeGame()`/`restoreGame()` (see `l4hintDone`; the same per-seat round-trip fixed `net.rtarget`, the cross-board target, in v2.5.10); (2) `net.view`-keyed dispatch chains often omit a `'l4'` branch, since L4 renders opponents into `#l4oppWrap`, not `#rvCards` — this recurred in FOUR functions (`refreshRTargetView` / `roster` / `applyPco` / `giveHot`, all fixed v2.5.9); a ring/visual that updates fine in L2/L3 may silently never repaint in L4 even though the underlying state is correct. The sibling `refreshRTargetMarks()` scanned only `#rvCards` while L2/L3 cards live in `.l2pane2` / `#l3stage` — fixed to a document-wide `.card.rc` query.

### Simulating an opponent via a real hotseat seat-swap (mid-tutorial)
For a step that needs an "opponent" to actually react (not just be described), swap real control to their seat rather than scripting a fake reaction:
1. **Hand control over:** target `#statsTab` with `ringRect:tutTableRect` (reused from the onboarding `ci-table` step); in `onEnter` capture `tut._handoffSeat=mySeat()`; gate on `mySeat() !== tut._handoffSeat` — the player must actually click the other seat's row in the Table panel (`#statsBody .srow.click` → `setActivePlayer`, pre-existing hotseat machinery, no new code needed). State `text` that this is **hotseat-only**.
2. **Steps while "as" the other seat** work unmodified — `tutVampSelected()`, `qrPhasePlayed.size` baseline-diffs, etc. all read the now-active seat's live `state` correctly (no extra plumbing; `qrPhasePlayed` in particular is a single un-seat-scoped `Set`, only cleared on phase change, so it correctly accumulates across the swap).
3. **Hand control back silently before the section ends:** in the final step's `onEnter`, `if(mySeat()!==tut._handoffSeat) setActivePlayer(tut._handoffSeat, {quiet:true});`. **Surface this in the step's own text** ("you're back in your own seat now…") — a silent hand-back with no on-screen cue reads as a bug to the player even though it's working as designed.
4. **Detecting an action with no existing `gate`-friendly state** (e.g. "did the player click this specific button / pick this specific menu item"): add a one-line breadcrumb flag at the real call site (`tut._reactClicked=true` in the `#btnDecide` handler; `tut._lastSaidIdx=i` in `saySend(i)`) and gate on the flag with `advance:{on:'manual'}`. Prefer this over `advance:{on:'event', name:…}` + `orContinue:true` when the step must genuinely block Continue — event-only steps never grey the Continue button (`next.disabled` is only ever set when `s.gate` exists), `orContinue` just adds a skip-escape-hatch on top.

### Rules
- Stay `tut*`-prefixed; never inject into `state.cards`/`state.zones`.
- The step-aside hides the layer only over `#dialogModal` (alerts/confirms). Content modals you highlight inside (Deck Lab, lobby) must stay visible — don't gate it on `#overlay`.
- **Side effects that should fire only on *advance* (open a view, start something) go on the NEXT step's `onEnter`, not the current step's `onExit`** — `tutEnd()` (End/Esc) fires the *current* step's `onExit`, so it would also run on End. To begin a section on the welcome screen, highlight the entry button, then open the view from the following step's `onEnter`. `tutShowWelcome()` routes back to the welcome screen and is what **End/Esc** use (`tutCancel`).
- Same gates as any client change (syntax · 16/16 · byte-identical round-trip). The tutorial has **zero** sandbox coverage for render/interaction — Johan's live test is the only gate there.

### v2 additions (engine pass — slice 3c, Crypt rework)
- **Branching** is now `skip:()=>bool` (cleanly skips the step in `tutGo`), replacing the old `allowSkip:true` + null-target trick. E.g. `skip:()=>!tut._playWithVamp`.
- **`gateHint` may be a function** — re-evaluated every frame in `tutTick` for live text (e.g. `()=>'Dragged out '+n+' of 4'`).
- **All gated steps must be `freeInteract`** so the click that satisfies the gate reaches the board (a centre/dim step blocks "click the felt").
- **Highlight a right-click path:** `menuHi:['Actions','Bleed']` glows the matching `.mi` rows (exact textContent). **Highlight the nav buttons:** `hiNav:true` (pulses `#tutEnd`/`#tutNext`).
- **Keep the box off an element** (beyond the highlighted hole): `avoidRect:()=>rect` — added to `tutPlaceBubble`'s collision-avoidance (used so the Crypt panel box dodges the dragged-out vampires).
- **The bubble is draggable**, and its arrow auto-aims at the target from wherever it ends up (`tutArrow`) — no extra step config as long as the step has a `target`/`ringRect`.
- New helpers: `tutFaceUpVampObj()` (the face-up vampire OBJECT, vs the boolean `tutFaceUpVamp`), `tutVampSelected()`, `tutDockRect()` (open-dock union rect). Clones during the tutorial render via top-level `#cardFxTop`.
- **Before changing any z-index** see `elysium-learnings.md` -> "Z-index / stacking layer map".

## Skill: Verify a change (the full gate sequence)

The reliable sequence after any edit:

```bash
# 1. Client syntax
sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -

# 2. (Optional) Re-derive fragments and prove byte-identity (see "Re-sync the fragment build")
cp elysium-vtes-bord.html /tmp/original.html && python3 split_client.py && node elysium-build.js && cmp /tmp/original.html elysium-vtes-bord.html && echo byte-identical

# 3. Client logic suite — loads the REAL client via elysium-test-harness.js, so this is also the load gate
node test-client-logic.js
# Expect: 16 passed, 0 failed (as of v2.5.30: 15 passed, 1 failed — a pre-existing MP_HANDLERS
# count assertion drifted stale (expects 39, actual handler table has grown to 42); confirmed
# unrelated to any change in v2.5.31/2.5.33 by running it against the untouched base file first)

# 4. Server syntax (if server was changed)
node --check elysium-server.js

# 5. Server dispatch (if server was changed)
node test-server-dispatch.js
# Expect: 5 passed

# 6. Bump VERSION in the client (and server if protocol changed)

# 7. Deliver
cp elysium-vtes-bord.html /mnt/user-data/outputs/
# present_files call
```

### What the sandbox CANNOT verify

- Any visual/rendered behaviour (animations, layout, views)
- Any runtime interaction (drag, menus, hover)
- Hotseat switching and turn flow
- Online multiplayer (WebSocket paths)
- The L3/L4 helicopter and free-board views

**Always say explicitly** what needs live testing.

---

## Skill: Debug an online / tunnel connection problem

The server hosts the page AND the WebSocket on one origin (default port 8123). Most "can't connect" reports are a mismatch between how the page was *served* and how the client *builds its socket URL*.

### Decision tree

1. **Page loads but joining fails?** The static leg (HTTP → tunnel/LAN → 8123) works and the **WebSocket leg** is broken. Don't try more addresses — reason about scheme + port.
2. **Over a Cloudflare tunnel (`https://...trycloudflare.com`)?** The address must be **portless** → `wss://host` on 443. Cloudflare never exposes 8123 publicly, so `cleanAddr()` must NOT append `:8123` over https (and strips a stray one). The friend opens the tunnel link and clicks Join with the pre-filled address — never types a port.
3. **Same-LAN, no tunnel (`http://192.168.x.x:8123`)?** Here `:8123` is correct and `cleanAddr` appends it; the socket is `ws://host:8123`.
4. **"Mixed content" / socket blocked in the console?** An https page can only open `wss://`. `mpConnect()` picks the scheme from `location.protocol` — verify it resolves to `wss://` on the tunnel.
5. **Second+ player rejected as "too many connections"?** A per-IP limit isn't exempting/repointing loopback. Behind a tunnel every player is `127.0.0.1`. The connection cap and create cap exempt loopback; the password-fail throttle uses `failKey = loopback ? 'room:'+room.name : conn.ip`.
6. **Connection drops after ~100s idle?** Cloudflare's idle timeout. The 30s server WS ping should prevent it — check the keepalive interval is alive (and the 75s reaper isn't firing early).
7. **Spurious "version mismatch" on connect?** Client and server are on different major.minor. `verMM` compares major.minor only — bring them into lockstep.

### Key facts

- `cleanAddr` port logic is **scheme-driven**, not address-driven: the page's own scheme tells you the transport.
- The address field defaults to the live `location.host` over https (tunnel URLs change every restart); stored addresses are kept only on http.
- `copyInvite` is scheme-aware: an https invite is shareable as-is; an http invite is LAN-only and says so.
- None of this is verifiable in the sandbox (no network) — it's guarded only by Johan's live two-client test. Say so.

---

## Skill: Debug a problem in the sandbox

Elysium's error handling routes through a 64-entry ring buffer. Use these tools to see what went wrong.

### In the browser (Johan's machine)

Open DevTools console and call `elysiumDbg()`. It prints all buffered entries (newest last) with timestamp, tag, and message. Each entry looks like:

```
HH:MM:SS  mpOnMsg  -  Cannot read properties of null
```

Enable live output: open Settings → Convenience → Debug mode (`conv.debug = true`) — then every `dbg(tag, e)` call also `console.warn`s in real time.

### In the sandbox (Node / test harness)

`dbg()` doesn't throw — it's a pure ring-buffer push. The test harness stubs it (`global.dbg = () => {}`). If you need to inspect calls during a test, replace the stub temporarily:

```js
const calls = [];
global.dbg = (tag, e) => calls.push({tag, msg: String(e)});
// run the code under test…
console.log(calls);
```

### Common tags

| Tag | Set by |
|-----|--------|
| `'mpOnMsg'` | WebSocket message handler (all online paths) |
| `'restoreGame'` | `restoreGame()` on corrupt save data |
| `'warmImgCache'` | IndexedDB iteration errors at startup |
| `'imgDownload'` | Download errors in `downloadImages()` |

---

## Skill: Work with KRCG card data

The card database is loaded on demand from `https://static.krcg.org/data/vtes.json` and optionally cached in IndexedDB.

### Key structures

| Variable | Type | Holds |
|----------|------|-------|
| `cardInfo` | Map | name → card record (all three name variants as keys) |
| `cardImageNames` | Set | primary `norm(card.name)` values only — use for downloads/sync |
| `cardTypes` | Map | `norm(name)` → card type string (`'Vampire'`, `'Action'`, …) |
| `precons` | array | preconstructed decks (Deck Lab catalog source) |

### Call graph

```
loadCardDB()              ← UI entry point (Settings toggle / welcome button)
  fetchVtesJson()         ← handles cache-vs-network; reads/writes IndexedDB `_vtesJson`
    processCardData(data, src)  ← parses JSON, populates cardInfo/cardImageNames/cardTypes/precons
      imgSyncCheck()      ← downloads missing images if conv.imgSync is on
```

### Guard before using

```js
if (!cardInfo) {
  log('Card database not loaded — enable it in Settings → Files → Card database.');
  return;
}
```

### Lookup pattern

```js
const meta = cardInfo.get(norm(name));      // handles aliases + printed_name
if (meta) { /* meta.type, meta.disciplines, meta.clan, meta.capacity, etc. */ }
```

### Adding to the sync pipeline

`imgSyncCheck()` compares `cardImageNames` against `imgBlobCache`. If you add a new download category (e.g. token art), add it to `collectSvgNames()` or create a parallel set — never add non-primary card names to `cardImageNames`.

### Discipline index quirk

`vtes.json` has two formats for `card.disciplines`: trigrams (`"dom"`, `"aus"`) for older disciplines, full names (`"oblivion"`) for newer ones. `cardTags(c)` indexes both forms. `DISC_NAMES` maps trigram → full name; `DISC_ABBR` maps full name → trigram.

### Printed (KRCG) vs chosen (state) field — don't let a new KRCG field go half-wired

When a KRCG field represents something the player could *also* set manually in-game (v2.5.31: `card.path`, printed on some V5 Sabbat vampires but otherwise player-chosen via "Follow Path…"), don't write the KRCG value into the mutable per-card state field (`c.path`) — that conflates "printed, permanent" with "chosen, undo-able" and both `serializeGame`/`restoreGame` round-trip semantics start caring which one it is. Instead add a non-mutating computed helper that checks both:
```js
function krcgX(c){ const info=cardInfo && cardInfo.get(norm(c.name)); return (info && info.x)||null; }
function effX(c){ return c.x || krcgX(c); }   // chosen OR printed
```
Then **grep every reader of `c.x`** and switch it to `effX(c)` — detection functions, menu-population loops, badges/icons — not just the one call site a bug report points at. A menu-gating check and a detection function can silently drift apart when only one of them gets updated to read the new source.

---

## Skill: Dock (`.l2dockopen`) proportional scaling — keep sibling zones in ratio as the window grows

The bottom dock (`#z-crypt`/`#z-library`/`#z-ash`/`#z-pool`/`#z-hand`/`#dockLog`) sits in a row and must grow with the window without any element hogging all the extra space or the row overflowing off-screen (v2.5.27, v2.5.33).

### The trap

Scaling *some* siblings by `--dock-s` (piles, pool) while leaving another **fixed px** (v2.5.27's original Hand: `width:440px`) and letting a third **fill whatever's left** (Log, via `left:calc(...)` + `right:10px`, capped by `max-width`) guarantees 100% of any extra width lands on the filler. Nothing is individually "wrong" — each rule is locally reasonable — but the fixed sibling never grows and the filler absorbs everything, breaking the ratio that looked right at the design size.

### The fix pattern (`updateDockScale()`)

1. Give every sibling that should hold a ratio **the same scale factor** (here, `dockS`) — `handW=440*dockS, logW=520*dockS` (the ratio at `dockS=1`, the laptop-calibrated size).
2. Measure the board's **real remaining width** (not a height-derived proxy like `dockS` alone) for that group: `avail = W - leading - trailing`, where `leading`/`trailing` are the other dock elements' actual current offsets (also `dockS`-scaled where they are).
3. If the scaled siblings' combined width would exceed `avail`, scale **both down together** by the same factor `k=avail/total` — ratio preserved, overflow impossible, no-op at the size where they already fit.
4. Write results to new `:root` custom properties set via JS (`--dock-hand-w`, `--dock-log-w`), same pattern as `--dock-s` itself — **not a class rule**, since `position:absolute` descendants across stacking contexts don't reliably see vars set that way.
5. In CSS, swap the old fixed/max-width declarations for the new vars. An element with `left`+`right` both set can also take an explicit `width` — per spec, `right` is simply ignored once `left`+`width` are both present, so no conflict.

### Rule of thumb

If two-or-more dock/layout siblings need to hold a visual ratio under scaling: scale them all by the same factor, then clamp the *group* against a real measured bound — never "some scale, one fixed, one fills the rest."

When a card element (not a ghost) is dragged from the open dock onto the board in L3 or L4, five interlocking mechanisms must all be correct or the card will appear to jump or land at the wrong position.

### The five components

#### 1. `wasLifted` flag — corrects for `.handhover` CSS translate at pointerdown

`.handhover` adds `translate: 0 -26px` (card lifts visually). A **capture-phase** `pointerdown` listener on `#board` removes `.handhover` BEFORE `bindCard`'s bubbling handler runs, so the class is already gone when grab offset is computed. The capture listener sets `el.dataset.wasLifted = '1'` to preserve this fact.

In `bindCard`'s `pointerdown`:
```js
const wasLifted = c.el.dataset.wasLifted === '1';
delete c.el.dataset.wasLifted;
if (c.el.classList.contains('handhover') || wasLifted) drag.oy += 26;
```
This adds 26 board-px to the grab offset, counteracting the -26px the user's cursor was on when they clicked the lifted card.

#### 2. `el.style.translate = 'none'` — clears frozen CSS translate at drag start

When `.handhover` is removed, the CSS `translate` starts **transitioning** from -26px → 0 (`.card` has `transition: translate .14s ease-out`). When `el.classList.add('dragging')` fires in the first `pointermove` (`transition:none`), this transition **freezes mid-way** (e.g. at -13px). The card is now 13px above its transform position. `drag.oy` was computed based on transforms, so the cursor appears wrong.

**Fix**: immediately after `el.classList.add('dragging')`:
```js
el.style.translate = 'none';   // clear frozen residual translate; instant with transition:none active
```

#### 3. 50% centre-pin — replaces `regrabAtScale` for dock exits

`regrabAtScale` preserves grab fraction (e.g. 70% of 118px card = 82px → 70% of 24px scaled card = 17px = near bottom). At small L4 scales this makes the cursor visually drift to the card bottom.

For L3 (inside `if(!drag.moved)` dock-exit block):
```js
const s = (l2pub.on ? l2pub.s : 1);
drag.ox = s * CW * 0.5;
drag.oy = s * CH * 0.5;   // cursor always at card centre through drag and placement
```

For L4 (inside `if(drag.l4DockDefer && yd < H*0.66)` block):
```js
const bs = (l2pub.on ? l2pub.s : 1) * L4_CARD_S;
drag.ox = bs * CW * 0.5;
drag.oy = bs * CH * 0.5;
```

These are set AFTER `setCenterFrameA` has run so `l2pub.s` is current.

#### 4. Guard against `.handhover` re-addition during drag

The board's `pointerover` listener adds `.handhover` to hand cards. During L4 dock-defer (dock still open), the condition triggers and re-adds it to the dragging card. Pointer capture prevents `pointerout` from removing it. This causes a 26px visual lift during drag, removed by `place()` at drop = 26px "card drops" illusion.

**Fix**: add `!el.classList.contains('dragging')` to the pointerover condition:
```js
if (c && c.zone === 'hand' && !el.classList.contains('dragging') && !(l3on() && !l3handOpen && !board.classList.contains('l2dockopen'))) {
  el.classList.add('handhover');
```

#### 5. `async pointerup` — `.dragging` removed AFTER `place()` runs

The `pointerup` handler previously removed `.dragging` (which has `transition:none`) synchronously BEFORE calling `dropCard()`. Since `dropCard` is `async` (hits `await masterPlayGate`), this meant `place()` ran with transitions ACTIVE. The box-shadow transition (`0 16px 30px → 0 2px 6px`) created a perceptual "card sinks 14-16px" landing illusion.

**Fix**: make `pointerup` async and move the class removal to after `await dropCard`:
```js
el.addEventListener('pointerup', async e => {
  if (!drag || drag.c !== c) return;
  // group members still get .dragging removed immediately (they're already positioned)
  if (drag.group) drag.group.forEach(m => m.c.el.classList.remove('dragging'));
  const d = drag; drag = null;
  if (!d.moved) { el.classList.remove('dragging'); tap(c, d); return; }
  if (c.zone === 'hand' && !d.group) {
    const surf = opponentSurfaceAt(e.clientX, e.clientY);
    if (surf && surf.seat !== mySeat()) { el.classList.remove('dragging'); giveTo(...); layout(); return; }
  }
  await dropCard(c, d);          // place() runs inside with transition:none still active
  el.classList.remove('dragging');  // NOW restore transitions — only shadow fades, transform already final
});
```

### Ghost card pile drags (Crypt / Library)

Pile drags use a ghost element (not the real card). The ghost transform positions it relative to the cursor. **Use `translate(-50%,-50%)` not `translate(-50%,-60%)`.**

The `-Y%` percentage is relative to the element's **CSS box** (CW×CH), not the visual scaled size. The cursor's position fraction = `|Y%|/100/_s + 0.5`, where `_s` is the display scale. With `-60%`: at _s=0.2, fraction = 0.6/0.2 + 0.5 ≈ 3.5 → cursor far below ghost. With `-50%`: fraction = 0.5/_s + 0.5... wait, actually with the compose of `translate(-50%,-50%) scale(_s)` around transform-origin center:

Visual top = `cursor_y - _s*CH/2`. Cursor at 50% of visual height. This matches the drop calc `by = (cursor_y - br.top)*f - CH*_s/2`.

### Verification checklist for dock drag changes

After any change to dock-drag logic:
1. Syntax check + `node test-client-logic.js` (16/16)
2. Live test: hover a hand card → grab it in the middle → drag to board → card should centre on cursor and land there
3. Live test: drag crypt/library ghost → card should land centred on cursor at release
4. Check both L3 (structured) and L4 (classic) views
5. Check re-entering dock (cursor back below threshold) — card should scale back up and dock should reopen

---

## Skill: Integrate a dock drag with the dock lifecycle

When adding a new drag mechanism that starts inside the dock (like pile drags for crypt/library), it must participate in the full dock open/close cycle.

### Steps

1. **Close on drag start** — when the drag's `started` flag becomes true (after the 5px threshold), call `setL2Dock(false)`. This clears the board for drop targets.

2. **Set visual scale AFTER dock close** — `setL2Dock(false)` triggers `layout()` → `setCenterFrameA()` → `l2pub` update. Any ghost/card scale must be computed after this, using `l2pub.s * (l4on()?L4_CARD_S:1)`.

3. **Reopen on hover** — in the drag's `onMove` handler, check cursor Y:
   ```js
   const br=board.getBoundingClientRect(), f=board.clientWidth/br.width, yd=(e.clientY-br.top)*f, H=board.clientHeight||616;
   if(!board.classList.contains('l2dockopen') && yd >= H-36) setL2Dock(true, true);
   else if(board.classList.contains('l2dockopen') && yd < H*0.66) setL2Dock(false);
   ```

4. **Dock-area guard in target function** — the target function (e.g. `cryptDragTarget`) must return `'cancel'` when the dock is open and the cursor is in the dock overlay area (≥66% height). Otherwise, zones hidden underneath the dock (like `#z-uncontrolled`) produce false hits. Check the dock guard **after** any valid dock-zone checks (e.g. `#z-hand` for library drags) but **before** board-zone checks.

5. **L4: check L4 before zone hit-testing** — in L4, the board is free-placement. Zone elements retain valid bounding rects despite being invisible. Early-return `'ready'` for any board position in L4 before checking specific zones.

6. **Use scaled card dimensions for drop position** — the `onUp` handler computes drop position as `cursor - halfCardWidth`. Use `_s = l2pub.on ? l2pub.s*(l4on()?L4_CARD_S:1) : 1` for both the offset (`CW*_s/2`) and clamping bounds (`CW*_s`).

### Why separate from card drag

Pile-zone cards are `.inert` in the dock — the regular card drag `pointerdown` handler returns early for them. The card drag's dock-close logic (in the first-motion block) never fires for pile cards. Each pile drag IIFE needs its own independent dock lifecycle.

---

## Skill: Tune the L3 helicopter layout

The L3 layout has many interacting parameters. Iterative pixel-level tuning with live visual feedback converges faster than algebraic optimisation.

### Key parameters (5-player pentagon)

| Parameter | Current | What it controls |
|-----------|---------|------------------|
| `Bw3 + N` | +50 | Board width expansion beyond the 3-band base limit |
| `yM offset` | +15 | Prey/pred vertical shift below even distribution |
| `dockShift` | `Bh*0.02+16` | Bottom board lift for dock clearance |
| `clockCy` | `cy` | Timer/Edge vertical position (decoupled from prey/pred) |
| `mX/mY` | 0.5% | Table-edge margins |
| `gx` | 0.8% | Column gap |
| `PAD` | 2 (L3) / 12 (L2/L4) | Zone border padding within each slot |
| `flip` | true for top-row | Zone inversion (Ready faces down) |

### Tuning workflow

1. Start with the current values. Load a 5-player hotseat game in L3.
2. Adjust one parameter at a time (e.g. `Bw3 + 50` → `Bw3 + 55`).
3. Syntax check + deliver → Johan tests live.
4. Iterate based on visual feedback. Always offer revert.

### Key insight

The rigid 3-band vertical limit (`A.ah/3/AR`) is suboptimal for odd player counts because prey/pred sit on the flanks and don't horizontally conflict with centred boards. The +50px expansion fills pentagonal gaps safely. The horizontal limits (`A.aw/2`) provide the real ceiling.

---

## Skill: Update the living documents

After every implementation, update all three docs:

### `elysium-project-context.md`

- Bump the version in the header
- Update any changed architecture descriptions
- Add/update function references if new key functions were created
- Update the `conv` table if a setting was added/changed
- Update the file table if a file was added

### `elysium-learnings.md`

- Bump the version in the header
- Add a new version section with learnings from this implementation
- Focus on: things that broke, things that almost broke, patterns that should be reused, pitfalls to avoid

### `elysium-session-journal.md`

- Add a session entry documenting: what was built, design decisions made, any trade-offs or alternatives considered
- Include "Verifierat: syntaxrent, N/N klienttester" status
- Note what awaits live testing

### Delivery

All three docs should be delivered alongside the code changes in the same `present_files` call.
