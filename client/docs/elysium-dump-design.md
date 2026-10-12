# Elysium — Diagnostic Dump ("support bundle") Design Spec
**B-63 · DRAFT v0.1 · 8 Aug 2026 · client v2.6.56 + srv-2.6.28 (planned)**

This document is the complete hand-off for implementing the full diagnostic dump. It is written
to be self-contained for a fresh session: context, locked decisions, data inventory, wire
format, caps, consent language, test plan, gates, and implementation order. Read the session
ritual docs first as always; then this file carries everything B-63-specific.

---

## 0. Session-start checklist for the implementing chat

1. Run the standard ritual (latest `elysium-session-journal.md`, `elysium-project-context.md`,
   `elysium-learnings.md`; prefer the newest delivered outputs over `/mnt/project` snapshots).
2. **Ask Johan whether the parallel bot session is still active.** If yes: living docs ship as
   patch files (the v2.6.55 round's pattern); if no: edit living docs directly.
3. Verify deployed state (it moved fast in the prior session): client **v2.6.55** and server
   **srv-2.6.27** are LIVE on elysium.cards; the digest timer is live and heartbeat-verified;
   digest **v1.1** (report detail blocks) was delivered — confirm whether Johan scp:ed it.
4. Confirm the version plan below is still current (nothing else shipped in between).

## 1. Context — why this exists

The B-54 telemetry loop is live end to end: client crash hook + "Report a problem" →
`POST /client-error` → JSONL log → daily Discord digest + admin pull route
(`GET /client-errors.txt?key=…`). It has already paid off (the ver-fallback bug was found by
Johan's first real report). The first real morning exposed the next friction: reports carry a
40-line ring + a small summary, which answers *what happened just before* but not *what the
table actually looked like*. B-53 was solved from a screenshot decode of exactly the numbers a
dump would carry machine-readably. Johan asked for "ALL data points the player can see,
formatted optimally for Claude review" — this spec is that feature.

## 2. Locked decisions (Johan approved, 8 Aug)

- **D1 — The dump always rides reports.** No extra "include snapshot?" question; one consent
  dialog covers everything. Crash pings stay lightweight (no dump) — crashes are volume.
- **D2 — Own hand is INCLUDED.** It is the reporter's information to share and was the
  decisive evidence in B-53. The consent text is updated honestly (see §6).
- **D3 — Opponents' hidden information is NEVER included.** Face-down cards not owned by the
  reporter appear as position-only stubs without names. Chat is never included (the ring is
  chat-free by construction via `log()`'s `noRing` opt — do NOT dump `turnLogs`, which
  contains chat; this trap is pre-identified, see §9 T1).
- **D4 — Format optimized for Claude review:** the dump is one field on the existing report
  record → one JSONL row, stable short field names, max nesting depth 3, jq-friendly.
- **D5 — Versions:** client **v2.6.56** (requires Cloudflare purge) + server **srv-2.6.28**.
  Zero WebSocket change: the dump rides the existing HTTP POST. Protocol doc §6.2 gets a
  sentence; the WS handler tables are untouched (protocol gate must pass unchanged).

## 3. Data inventory — what the dump captures

All of it is information the reporting player can already see on their own screen.

### 3.1 `dump.game` — the table snapshot
- `turn`, `phase`, `activeSeat`, `mySeat`, `seats`: per-seat `{ name, pool, alive? }` from the
  roster/state (exact field names read from `state`/`net.roster` at implementation time).
- `deckName`, `libN`, `cryptN` (remaining pile counts), `handN`.
- `hand`: array of the reporter's OWN hand card names (≤120 entries).
- `board`: array over `state.cards` (≤600 entries), each card compact:
  - Own or face-up card: `{ id, n(ame), z(one), s(eat/owner), x, y, l(ocked), fd?, c(ounters)?,
    att(achments)? }` — exact available fields (counters model, token model, attach/order
    fields) MUST be read from the real card object structure before encoding; the spec fixes
    the *intent*, not the field list.
  - **Opponent face-down card: `{ id, z, s, x, y, fd:1 }` — no name, no counters detail.**
    This filter is CLIENT-side and is the enforcement point; the server cannot verify it
    (state it honestly in the security manifest section).
- Spectator reports include the board they watch (it is visible to them — same rule).

### 3.2 `dump.env` — client vitals ("the background processes")
- `ua`, `screen:"WxH"`, `dpr`, `lang`, `uptimeMs` (since page load).
- `ws`: `{ connected, reconnects, lastMsgAgoMs }` (add a reconnect counter + last-message
  timestamp to the net layer if absent — check first; may partially exist).
- `db`: `{ loaded, cards: cardTypes.size, source }` (local / IDB cache / KRCG fetch — the
  loader chain knows; expose the source it used).
- `storage`: `{ usedKB, quotaKB }` via `navigator.storage.estimate()` — **async**; await it in
  `openErrReport` before composing (B-53's suspected quota factor becomes measurable).
- `decks`: saved-deck census `[{ name, crypt, library, era?, warn:0|1 }]` from
  `loadDecks() × deckTotals × deckLegalText` — ≤30 entries, names ≤40 chars. This is the
  poisoning visibility: a corrupted save shows itself in every report.
- `flags`: non-sensitive booleans only — `{ tournament, errPing }`. Nothing else from conv.

### 3.3 `log` — the extended ring (top-level, shared with crash records)
- Raise the client ring cap **40 → 200** (`RING_MAX` const). Chat still opts out via
  `noRing`; private lines still never enter — both invariants already tested.
- **Stop stripping timestamps:** ring entries become `{ t, m }` on the wire (the previously
  deferred upgrade lands here). Crash pings keep sending the last 10; reports send up to 200.
- Server-side ring cap moves 30 → 200 accordingly (see §5).

## 4. Wire format

Extend the existing report payload — no new kind:

```json
{ "kind":"report", "ver":"2.6.56", "note":"…", "ua":"…",
  "ring":[{"t":1723100000000,"m":"Stolas dealt 7 cards …"}, …],
  "summary":{ …unchanged… },
  "dump":{ "game":{…}, "env":{…} } }
```

Budget: board ≈6–10 kB, ring 200×~90 avg ≈18 kB, env ≈2 kB → ~30 kB typical.
**Client-side degrade ladder** (enforced before POST): serialize; if >48 kB drop ring to 120,
then 80, then drop `dump.game.board` counters detail, then send without `dump` + set
`dumpTrunc:1`. Never fail the report because the dump was fat.

## 5. Server changes (srv-2.6.28)

- `ERR_BODY_MAX` **32 kB → 64 kB** (the only body-reading route; still tiny and paranoid).
- Ring cap const **30 → 200**; ring elements accept `{t,m}` objects OR bare strings
  (two-shape discipline — apply the ver/ua/mode fallback lesson from day one: scrub `m`,
  coerce `t|0`).
- `errRecord` gains: `if(m.dump && typeof m.dump==='object') rec.dump = dumpRecord(m.dump);`
- **`dumpRecord(d)` — a pure, unit-testable picker** (the errRecord pattern):
  - `game`: whitelisted scalars; `hand` ≤120 × scrub 60; `board` ≤600 entries, each entry
    picked field-by-field (`n` scrub 60, numerics `|0`, unknown keys dropped); `seats` ≤8.
  - `env`: every field individually capped (`ua` 120, `screen` 12, `decks` ≤30 × {name 40,
    crypt|0, library|0, era 8, warn|0}, etc.).
  - Unknown top-level dump keys never reach disk. No IP anywhere, as always.
- Digest: **no inline dump rendering** — the report block gains a `+ snapshot` tag when
  `rec.dump` exists; details live behind the pull route. (Digest bump to v1.2, one line.)

## 6. Consent text (client, replaces the current uiConfirm string)

> "Send this report to the game server? It includes your note, your full visible table AND
> your own hand, the last N public game-log lines, your saved-deck names with card counts,
> and technical state (version, screen, storage, connection) — never chat, never your
> opponents' hidden cards."

The file:// fallback (console print) and the truthful toast stay as-is.

## 7. Reading ergonomics (document in CLAUDE.md §, and in the ops runbook)

- Whole-row to Claude: `jq -c 'select(.dump)' elysium-errors.log | tail -1` → paste.
- Quick looks: `jq '.dump.game | {deckName, libN, cryptN, handN}'`,
  `jq '.dump.game.board | length'`, `jq -r '.ring[-15:][] | .m? // .'` (two-shape tolerant),
  `jq '.dump.env.decks[] | select(.warn==1)'` (the poisoning census).
- Field-name conventions are stable API from v2.6.56 on: renames require a docpatch note.

## 8. Version, deploy, docs

- Client v2.6.56: capture + consent + ring 200 + degrade ladder. **Cloudflare purge required.**
- Server srv-2.6.28: caps + dumpRecord. Restart required. Digest v1.2 (`+ snapshot` tag),
  script-only deploy (no restart — the timer spawns fresh).
- Protocol doc: header stamp + one §6.2 sentence ("report payloads MAY carry a `dump` object;
  HTTP-only, no WS impact"). Handler tables untouched → protocol gate passes unchanged.
- Docpatch/living docs: journal narrative, context version + feature line, learnings (whatever
  the implementation teaches), CLAUDE.md §7 recipes, SKILLS (if a new diag pattern emerges),
  security manifest (§: the dump widens the WRITE surface's payload, same whitelist
  philosophy; name the client-side hidden-card filter as the enforcement point), backlog
  (B-63 → shipped; note follow-ups), ops runbook (§7 recipes).

## 9. Pre-identified traps (do not rediscover these)

- **T1 — `turnLogs` contains chat.** Never dump it. The ring is the chat-free source
  (`noRing` at the push site). The existing ring tests assert the exclusions — extend, don't
  replace.
- **T2 — The ring cap test asserts 40.** It must be UPDATED to 200 in the same patch as the
  cap (destructive-test discipline: confirm it fails against the old cap first).
- **T3 — `navigator.storage.estimate()` is async** and may be absent (older browsers/file://):
  `try { await } catch → nulls`, and the harness navigator stub lacks it — guard with typeof.
- **T4 — Hidden-card filtering is capture-side.** The server cannot distinguish a leaked name
  from a legit one. The filter must be in `buildDump()`, tested against a seeded state with an
  opponent face-down card (assert the entry has no `n` field).
- **T5 — Two-shape ring on the server** (strings from old clients ≤2.6.55, `{t,m}` from
  2.6.56+): the fallback discipline from day one, with a test.
- **T6 — Body-cap boundary:** the live smoke's oversize test uses 40 kB — after the 64 kB cap
  it would PASS as valid; bump the smoke's oversize payload to >64 kB in the same patch.
- **T7 — `buildDump` runs inside `openErrReport`** (already async ✓) but must never throw the
  report away: wrap in try/catch; on failure send the report with `dumpErr:1` instead.

## 10. Test plan (extends the existing suites)

- **Client (`test-client-logic.js`):** ring cap 200 + `{t,m}` shape; buildDump against a
  seeded state (own face-up card carries name, opponent face-down does not; hand names
  present; decks census includes warn for a poisoned save); degrade ladder unit (feed an
  oversized fake dump, assert ring trimming order); consent-string content sanity.
- **Server (`test-server-dispatch.js`):** dumpRecord whitelist (unknown keys dropped at every
  level, board cap 600, hand cap 120, deck census caps, numeric coercion); ring two-shape;
  errRecord passes dump through; body over 64 kB destroyed.
- **Live smoke (`test-error-endpoint.js`):** post a report WITH dump → the row round-trips
  with `dump.game.deckName`; oversize bumped per T6.
- **Full gate sequence** incl. B1 byte-identical (client changes!), bot gates, check-versions.

## 11. Implementation order

1. Ritual + §0 checklist. 2. Read the REAL `state.cards` card-object fields + token/counter
model + net-layer reconnect state (read-before-encode). 3. Client: RING_MAX 200 + `{t,m}` +
`buildDump()` + degrade ladder + consent text + version. 4. Server: caps + `dumpRecord` +
version. 5. Tests per §10 (destructive-verify T2). 6. Gates. 7. Digest v1.2 tag. 8. Protocol
stamp + docs. 9. Deliver; deploy = client (purge!) + server (restart) + digest script.

## 12. Deliberately open (resolve during implementation)

- Exact card-object field names and the counter/token encoding (read the source first).
- Whether `ws.reconnects` needs a new counter or exists in the net layer already.
- Whether the board array should carry z-order/attachment grouping (encode only if the state
  model makes it cheap; otherwise note as v2).
- L4/free-board coordinate semantics in the dump (canonical coords as stored — do NOT convert;
  note the B-62 aspect caveat in the field docs so a reader knows what x/y mean).
