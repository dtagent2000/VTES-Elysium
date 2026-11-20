#!/usr/bin/env node
'use strict';
/* ============================================================================
   cardfx-compile.js — the Elysium card-effect library compiler (v1.4.0)

   Compiles KRCG's vtes.json into `elysium-cardfx.json`: a small, structured
   index of WHAT each card does (facts), consumed by bots for threat
   assessment (defense), own-hand play (offense) and influence math.
   Strategy — WHEN to play a card — never lives here; that is playbook/
   personality territory (see elysium-cardfx-design.md).

   THREE QUALITY TIERS
     auto     — heuristic extraction from card_text (this file's patterns).
                Best-effort by design: conditions are ignored, costs written
                in rules text are not modelled, combat is coarse.
     hand     — `cardfx-curated.json` overlays whole entries verbatim
                (src:'hand'). The spearhead tier: bot decks + the cards that
                actually show up at real tables get hand-verified facts.
                Since v1.10.0 a library entry with `"merge": true` is laid
                over the compiled entry instead (the remainder only; see
                mergeHand below, spec-card-sweep-2026-11-18.md §4.4).
     playbook — per-bot deck lists + policy knobs, OUTSIDE this library.

   USAGE
     node cardfx-compile.js [--vtes vtes.json] [--curated cardfx-curated.json]
                            [--out elysium-cardfx.json] [--report]

   OUTPUT SHAPE (fxv 1)
     { fxv, generated, source, counts,
       crypt: { "<canonical name>": { cap, clan, sect?, group, disc:{all,sup},
                                      title?, votes?, banned? } },
       lib:   { "<canonical name>": { t:[...], cost?, req?, unique?, limited?,
                                      persistent?,
                                      modes?:[{at, use?, dir?, lock?, fx}],
                                      ref?:{ tags?:[...], pool?:[term...], fx? }, src } },
       alias: { "<lowercased variant>": "<canonical name>" } }

     modes[].at : null = base text · 'dom' = inferior · 'DOM' = superior ·
                  'aus+dom' = multi-requirement line (adjacent brackets).
     modes[].use: which face of a multi-type card the mode belongs to
                  ('mod'/'combat'/…), from KRCG's [ACTION MODIFIER]-style
                  type brackets.
     modes[].dir : PER-MODE (v1.3.0) — a directed action (Ⓓ), blockable only
                  by its named target(s). Absent = undirected default.
     modes[].lock: PER-MODE (v1.4.0) — this mode's effect costs LOCKING the
                  card ("lock this card/vampire/location/... to <effect>").
                  Absent = free to trigger (or, for a Passive entry, no
                  trigger at all — see `persistent` below).
     persistent  : ENTRY-LEVEL (v1.4.0, not per-mode — a card either stays in
                  play or it doesn't, regardless of which mode played it) —
                  this card remains in play after resolving instead of going
                  to the ash heap. THREE signals: TYPE-implicit (Equipment/
                  Ally/Retainer/Event stay in play by rule, usually with no
                  supporting prose at all), the "Location" keyword, or prose
                  like "put this card in(to) play"/"put this card on" on a
                  non-Location Master/Action/etc. See libEntry() for the
                  exact patterns and the false-positive/false-negative audit
                  behind each one. A persistent entry with no `lock`-tagged
                  mode is Passive (its fx, if any, just applies continuously
                  while in play — Information Highway); one WITH a lock-
                  tagged mode is Active for that effect specifically (a card
                  can be both at once — Enkil Cog's flat bleed bonus is
                  Passive, its separate lockable action is Active).
     fx values  : number, 'X' (variable), 'all', or true. Consumers MUST
                  ignore fx keys they don't know (forward compatibility —
                  curated entries may carry richer vocabulary early).

   CONVENTIONS THE CONSUMER MUST KNOW
     - `bleed: N` on an ACTION means +N over the base bleed of 1
       (Computer Hacking = bleedAct + bleed:1 → bleeds for 2).
     - `disc.all` on crypt = every discipline the vampire has (at least
       inferior); `disc.sup` = the superior subset.
     - Vampire names carry group suffixes in this vtes.json generation
       ("Zip (G3)"); resolve plain names through `alias` (lowercase key).
     - KRCG's "As above" idiom (372 cards) is resolved at compile time:
       a superior line inherits the nearest matching earlier line's fx,
       then its own extracted fx overrides.

   FORMAT COMPATIBILITY (v1.1.0): vtes.json exists in two generations —
   the "v3" shape (card_text/name/_name/clans/pool_cost…) and KRCG's
   krcg-api-v4 "v5" shape (kind/text/printed_name+suffix/clan/cost…).
   normalizeCard() detects per record (the v5-only `kind` field). Since
   v1.9.7 (bot v0.6.216, RULINGS D-105) a v5 record goes through
   krcg-v5.js's toV3 — the ONE v5 -> v3 map, which also writes the
   v3-shaped vtes.json the other tools read — so compiling the dump directly
   and compiling the converted file give the same cardfx. A cost shape
   neither known ({type: 'Pool' | 'Blood' | 'Conviction', value}) nor free
   ({}) is still COUNTED in the report, never mislabelled.

   Zero dependencies. Dark Pack note: the output carries card NAMES and
   derived gameplay tags only — no rules text, no images. Source data is
   KRCG's vtes.json under Paradox Interactive's Dark Pack terms.
   ========================================================================= */

const fs = require('fs');

const FXC_VERSION = '1.10.0';   // 20 Nov 2026 (bot v0.6.235, no bot change; spec-card-sweep §4.4, RULINGS D-127): the merge of hand entries -- a curated library entry with "merge": true is laid over the compiled entry (mergeHand); every other entry compiles byte for byte as in v1.9.12
// const FXC_VERSION_1912 = '1.9.12';   // 19 Nov 2026 (bot v0.6.235, the finished decks' round): the condition sentences -- onlyBleed, notBleed, onlyPredatorActs, oncePerUnlock, pressDir (entry or mode) and noReplace (entry)
// const FXC_VERSION_1911 = '1.9.11';   // 18 Nov 2026 (bot v0.6.233, V5 wave 6a): `onlyDirected` -- 'during an action directed at you (or a card you control)' on the entry (a line with no discipline) or on the modes of its discipline line
// const FXC_VERSION_1910 = '1.9.10';   // 18 Nov 2026 (bot v0.6.232, V5 wave 5b): `frenzy` -- 'opp' / 'self' on a card with a bare 'Frenzy.' segment, and on the modes of a '[abo] Frenzy.' line (Meditative Grove's cancel reads it, [LSJ 20051113])
// const FXC_VERSION_199 = '1.9.9';   // 17 Nov 2026 (bot v0.6.230, V5 wave 5): the markers anarchReq ('Requires an Anarch / a baron') and zombie (an ally or retainer named a zombie)
// const FXC_VERSION_198 = '1.9.8';   // 3 Nov 2026 (bot v0.6.217, V5 wave 4): 'Unique archetype.' is the archetype keyword too (Saulot's three masters were untagged: the one-archetype-per-vampire gate never saw them)
// const FXC_VERSION_197 = '1.9.7';   // 2 Nov 2026 (bot v0.6.216, KRCG's v5 dump as the source, krcg-v5.js): the v5 cost shape ({type: 'Pool', value}) read; the v5 wording 'this card is put in play / on' is persistent; a 'Requires …' sentence is found mid-line ('Title. Requires a Sabbat vampire.').
// const FXC_VERSION_196 = '1.9.6';   // 2 Nov 2026 (bot v0.6.215, V5 wave 3): `oot` -- an out-of-turn master (keyword segment, 36 entries) the master-phase finder never offers; curated masters inherit the data's clan requirement (R-42: a clan icon on a master IS a requirement) and its out-of-turn keyword.
// const FXC_VERSION_195 = '1.9.5';   // 29 Oct 2026 (bot v0.6.214, V5 wave 2): req.notFirstRound also reads 'Not usable the first round' / 'Not usable first round' (Eruption of Vitae, Growing Fury, Well-Aimed Car: 9 -> 12 entries; wave 1's re-review found them untagged). The curated tier's wave-2 readings (Flash, Resist Earth's Grasp, Slam, Hunger of Marduk, Rage of Apedemak, Torn Signpost, Form of the Wolf, Monstrous Form, Soul Burn) need no compiler change.
// const FXC_VERSION_194 = '1.9.4';   // 29 Oct 2026 (bot v0.6.213, V5 wave 1, the egress review): req.notFirstRound also reads a sentence 'Not usable during the first round' -- Walk of Flame (banuhaqim's, played in round 1 since its aggravated strike was preferred), Ahriman's Demesne, Blood Agony, Blood to Water, Torment the Soul: 4 -> 9 entries; a text that LIFTS the restriction (Shotgun Ritual, Al-Ashrad, Hector Trelane) is not tagged.
// const FXC_VERSION_193 = '1.9.3';   // 19 Oct 2026 (bot v0.6.211, the stable's cards): a curated entry keyed by a printed name VARIANT (Pentex(TM) Subversion) is written under the printed name too -- a list typed with the printed name (KRCG's precons, the V5 generator) got the empty auto entry; each spelling now resolves exactly to itself, so fxLookup(name).name keeps equalling the hand's own name (the master loop re-anchors by name)
// const FXC_VERSION_192 = '1.9.2';   // 16 Oct 2026 (bot v0.6.202, the 14 Oct play-test's point 18): `handBonus` -- 'hand strike at +N damage' / 'this strike is at +N damage' are a bonus on the hand strike, no longer the absolute `strike` (35 cards; Roundhouse). v1.9.1 (25 Sep, the sweep's pass 2: curated entries inherit requirements and costs) never bumped this constant.
// const FXC_VERSION_190 = '1.9.0';   // 18 Sep 2026 (late): THE BLOCK BAR + SELF DAMAGE sweep -- `blockBar` ('vampires'|'allies'|'all'|'chosen'|'titled'|'cond') on the 'cannot block THIS ACTION' / 'unblockable' family, `selfDmg` (+ `selfAggr`) on 'this vampire takes N unpreventable ... damage', `selfTorpor` on 'the acting vampire goes to torpor after'; the self-inflicted sentence no longer leaks `aggr` / `torpor` (Daring the Dawn read as an aggravated STRIKER, Day Operation as a torpor SENDER). Before it: 1.8.0 // 18 Sep 2026: the act-again rider (`when: actSuccess|actBlocked|actFailed`) on unlocking action modifiers + `oncePerTurn`. Before it:
// const FXC_VERSION_170 = '1.7.0';   // 18 Sep 2026 (Johan, the politics leg's first brick): REFERENDUM TERMS -- `ref` on political entries; outcome fx keys leave modes[].fx (the structural gate for bot debt 14). Previous: 1.6.14 (16 Sep, inherited costs).
// 1.6.14:   // 16 Sep 2026 (Johan's Academic Hunting Ground report): curated entries INHERIT the data's numeric cost when they do not restate it (see overlay); the report lists inherited / mismatched / X costs.
// FXC_VERSION history: '1.6.13';   // 8 Aug (HB2c-file): every compile now ALSO emits elysium-cardfx.js (globalThis.ELYSIUM_CARDFX = <same object>) beside the json -- the file:// vehicle for double-click hotseat bots; kept in lockstep by construction (one serialize, two writes).   // 17 July: fas B/C mechanism sweep -- OR-mode split (22 cards), As-[ref]-above resolution (89), attach-burn->stealthLater (5), action-type actStealth (176+), keyword-token trifle/archetype (Master:-colon + combination forms), imperative costEdge. v1.4.2 (16 July): wake-sweep.

/* ---------------- vocabulary tables ---------------- */

const TYPE_MAP = {
  'Master': 'master', 'Action': 'action', 'Action Modifier': 'mod',
  'Reaction': 'react', 'Combat': 'combat', 'Political Action': 'political',
  'Equipment': 'equip', 'Ally': 'ally', 'Retainer': 'retainer',
  'Event': 'event', 'Power': 'power', 'Conviction': 'conviction'
};

const TYPE_BRACKET = {
  'ACTION MODIFIER': 'mod', 'REACTION': 'react', 'COMBAT': 'combat',
  'ACTION': 'action', 'POLITICAL ACTION': 'political'
};

/* Title → votes (VEKN rulebook values). Unknown titles keep `title` only. */
const TITLE_VOTES = {
  'Primogen': 1, 'Prince': 2, 'Justicar': 3, 'Inner Circle': 4,
  'Bishop': 1, 'Archbishop': 2, 'Priscus': 3, 'Cardinal': 3, 'Regent': 4,
  'Baron': 2, 'Magaji': 2, '1 vote': 1, '2 votes': 2
};

const isCryptCard = c => (c.types || []).some(t => t === 'Vampire' || t === 'Imbued');

/* v3 dumps have shipped SOME disciplines as full names ('oblivion', 'FLIGHT')
   instead of trigrams — the client's DISC_NAMES/DISC_ABBR pair, mirrored here,
   folds them back so req.disc / disc.all speak ONE vocabulary (trigrams;
   'flight' has no trigram and stays as-is). Case is preserved by the CALLER
   where it is a signal (crypt superior detection).                          */
const DISC_NAMES = { abo:'abombwe', ani:'animalism', aus:'auspex', cel:'celerity', chi:'chimerstry',
  dai:'daimoinon', dem:'dementation', dom:'dominate', for:'fortitude', mel:'melpominee',
  myt:'mytherceria', nec:'necromancy', obe:'obeah', obf:'obfuscate', obl:'oblivion',
  obt:'obtenebration', pot:'potence', pre:'presence', pro:'protean', qui:'quietus',
  san:'sanguinus', ser:'serpentis', spi:'spiritus', tem:'temporis', tha:'thaumaturgy',
  thn:'thanatosis', val:'valeren', vic:'vicissitude', vis:'visceratika', vin:'vision',
  def:'defense', inn:'innocence', jud:'judgment', mar:'martyrdom', red:'redemption', ven:'vengeance' };
const DISC_ABBR = Object.fromEntries(Object.entries(DISC_NAMES).map(([k, v]) => [v, k]));
const discTri = d => { const l = String(d || '').toLowerCase(); return l.length === 3 ? l : (DISC_ABBR[l] || l); };

/* ---------------- v3/v5 record normalization ----------------
   Returns a v3-SHAPED record {name,_name,name_variants,types,card_text,
   capacity,disciplines,clans,pool_cost,blood_cost,group,title,banned,_crypt}
   plus which format it was. A v5 record is mapped by krcg-v5.js's toV3 (its
   header has the field map); this function adds only `_crypt` and the
   unknown-cost count.                                                      */
function normalizeCard(card){
  if(typeof card.kind !== 'string'){
    return { fmt: 'v3', rec: Object.assign({ _crypt: isCryptCard(card) }, card) };
  }
  /* v1.9.7 (bot v0.6.216, RULINGS D-105; the egress review): a v5 record goes through krcg-v5.js's toV3, the ONE v5 -> v3 map, so
     compiling the dump directly gives the same cardfx as compiling the vtes.json built from it (this reader had its own map, and
     it disagreed: no '(ANY)', 'fli' not 'flight', the vote title's case). The sets are not needed here (an empty map). */
  const rec = require('./krcg-v5.js').toV3(card, new Map());
  { const c = card.cost, known = c === undefined || c === null || (typeof c === 'object' && (!Object.keys(c).length || (/^(?:pool|blood|conviction)$/i.test(String(c.type || '')) && (c.value !== undefined || c.amount !== undefined))));
    if(!known) rec._costUnknown = true; }   // an unknown cost shape ({type: 'Pool', value} known, {} free): degrade + count, never mislabel
  return { fmt: 'v5', rec: Object.assign({ _crypt: isCryptCard(rec) }, rec) };
}

const num = v => /^x$/i.test(v) ? 'X' : parseInt(v, 10);

/* ---------------- per-segment effect extraction ---------------- */
/* One segment = one requirement context (see segment()). Patterns are
   deliberately conservative: a missed tag is a curation task; a WRONG tag
   silently misleads a bot. Directed pool damage in particular requires the
   "from your prey / of their pool / they burn" shapes so that self-costs
   ("burn 1 pool to …") never read as threats.                              */
function extractFx(t0){
  const fx = {};
  let t = t0;
  const put = (k, v) => {
    if(fx[k] === undefined) fx[k] = v;
    else if(typeof fx[k] === 'number' && typeof v === 'number' && v > fx[k]) fx[k] = v;
  };
  let m;
  /* v1.9.0 -- THE BLOCK BAR + SELF DAMAGE (Johan's sweep rule: one tag per shared attribute, the differences are fields).
     Read FIRST and STRIPPED, so the self-inflicted sentence cannot leak into the offensive keys below
     ('aggravated' -> aggr, 'goes to torpor' -> torpor). Scope: THIS ACTION only -- a standing bar on a
     minion ('cannot block this minion', Pentex's noBlockMinion) is a different, persistent thing. */
  { const BAR = [
      [/(?:this action is (?:not blocked, and it is )?(?:now )?unblockable\b(?! by)|make (?:that|the|this) action unblockable(?! by))/i, 'all'],
      [/(?:^|[.\]]\s*|\band\s+)titled vampires cannot block this action|unblockable by titled/i, 'titled'],
      [/(?:^|[.\]]\s*)vampires cannot block this action|unblockable by vampires/i, 'vampires'],
      [/(?:^|[.\]]\s*)allies cannot block this action|cannot be blocked by allies (?:this action|until the end of this action)/i, 'allies'],
      [/(?:the chosen|that) (?:vampire|minion|minions) cannot block this action/i, 'chosen'],
      [/cannot block this action/i, 'cond'] ];
    for(const [re, who] of BAR){ if(re.test(t)){ fx.blockBar = who; break; } }
    const SD = /(?:this (?:acting )?(?:vampire|minion) takes|the acting vampire takes only) ([0-9]+|X) unpreventable (?:environmental )?(aggravated )?damage[^.]*/i;   // 'the acting minion takes ...' on a REACTION is the opponent's minion (Sound of a Breaking Oath) -- only the 'takes only' superior-mode echo (Force of Will) is self
    if((m = t.match(SD)) && !/(?:^|[.\]]\s*)If [^.]*$/.test(t.slice(0, m.index))){ /* a conditional self-hit (Rant!: 'If the referendum fails, ...') is not a price the play finder can read yet */ fx.selfDmg = num(m[1]); if(m[2]) fx.selfAggr = true; t = t.replace(SD, ''); }
    const ST = /(?:this|the) acting (?:vampire|minion) goes (?:in)?to torpor after[^.]*/i;
    if(ST.test(t)){ fx.selfTorpor = true; t = t.replace(ST, ''); } }
  /* offense */
  if(/\u24b9\s*bleed/i.test(t)) put('bleedAct', true);
  if((m = t.match(/\+([0-9]+|X) bleed/i))) put('bleed', num(m[1]));
  /* v1.5.0 (17 July, fas B/C sweep): the Marked Path template class -- "put this card
     on X … burn this card to get +N stealth" is DELAYED stealth (attach now, burn on a
     later action), never instant. Tag stealthLater and strip the burn clause so the
     generic matcher below cannot re-read it as playable-now stealth: the exact misplay
     Marked Path's own curation removed, still handed out by the auto tier to its four
     template siblings (Shadow Cast, Zip Line, Pass Through Shadow, Under My Skin --
     full-db verified exact set of 5). The fas-A misplay guard, now structural.       */
  if((m = t.match(/burn this card to get \+([0-9]+|X) stealth/i)) && /put this card on/i.test(t)){
    put('stealthLater', num(m[1]));
    t = t.replace(m[0], '');
  }
  { const ts = t.replace(/\+(?:[0-9]+|X) stealth during [^.]{0,30}next/gi, '');   // v1.5.5: FUTURE stealth ("+1 stealth during their next action", Tangle Atropos' Hand -- 1-card class) is not instant stealth; stripping keeps the scanned, playable key honest
    if((m = ts.match(/\+([0-9]+|X) stealth/i))) put('stealth', num(m[1])); }
  /* defense */
  if((m = t.match(/\+([0-9]+|X) intercept/i))) put('intercept', num(m[1]));
  if(/\bwakes\b/i.test(t) || /attempt to block[^.]{0,40}\bas (?:if|though) unlocked/i.test(t)) put('wake', true);   // v1.4.1 (16 July, wake-sweep with Johan): the modern keyword form ("This vampire wakes (…)") AND the pre-keyword templating ("can play reaction cards and attempt to block as if/though unlocked" -- Fillip, Aye, No Secrets From the Magaji, all confirmed against the rulebook glossary's wake definition). The "attempt to" anchor is load-bearing: Burden the Mind's "to allow this minion to block as if unlocked costs an additional pool" REFERENCES wake effects (taxes them) without granting one -- it lacks "attempt", so it stays untagged, verified in the sweep. Rulebook (vekn.net glossary): wake ≠ unlock -- a woken minion STAYS locked, acts "as though unlocked" for the current action only; cards punishing unlock (Sleeping Mind) never touch wake, so the two tags must never blur.
  if(/change the target of the bleed/i.test(t)) put('bounce', true);
  if((m = t.match(/reduce (?:a|the|that) bleed[^.]{0,30}? by ([0-9]+|X)/i))) put('reduce', num(m[1]));
  else if(/reduce (?:a|the|that) bleed[^.]{0,25} to 0/i.test(t)) put('reduce', 'all');
  if(/unlocks? (?!phase)(?:this|that|a |an |all |target|them|him|her)/i.test(t)) put('unlock', true);
  if(/\breduce the acting minion's stealth to 0\b/i.test(t)) put('stealthToZero', true);   // v1.9.11 (bot v0.6.233, V5 wave 6a, D-123): Night Terrors (its superior's 'As above' inherits it), Veiled Sight [chi], Draba [CHI] -- a blocking bot plays it when the actor's stealth beats its intercept (_nightTerrorsFor); 'Effectively gives a -X stealth modifier to the action' [RTR 20030519]
  /* threats (as seen by the card's target) */
  /* v1.5.2 (18 July, Johan's sweep-uncertainty question): ONGOING pool drains ("During
     each other Methuselah's unlock phase, they burn 1 pool" -- Contagion, Fame, Smiling
     Jack, 7 cards measured) are NOT immediate pool damage: the bot's play path resolves
     poolDmg as an instant burn, and coverage v1.1 classes the key as playable -- so the
     tag would certify a card the bot would then MIS-resolve. The Burden the Mind lesson
     (negative examples define patterns): strip unlock-phase drain sentences before the
     immediate-burn matchers run. A missed tag is a curation task; a wrong tag misleads. */
  const tp = t.replace(/[^.\n]*unlock phase[^.\n]*burns? (?:[0-9]+|X) pool[^.\n]*(?:\.|$)/gi, '');
  if((m = tp.match(/burn ([0-9]+|X) (?:of (?:their|your prey'?s?|that Methuselah'?s?) )?pool from (?:your prey|a Methuselah|that Methuselah|another Methuselah|the acting)/i))) put('poolDmg', num(m[1]));
  if((m = tp.match(/burn ([0-9]+|X) of (?:their|your prey'?s?|that Methuselah'?s?) pool/i))) put('poolDmg', num(m[1]));
  if((m = tp.match(/(?:they|your prey|that Methuselah|each other Methuselah|each Methuselah|the target) burns? ([0-9]+|X) pool/i))) put('poolDmg', num(m[1]));
  if((m = t.match(/burn ([0-9]+|X) blood from/i))) put('bloodBurn', num(m[1]));
  if((m = t.match(/steal ([0-9]+|X) blood/i))) put('stealBlood', num(m[1]));
  if(/(?:send|sends|goes|put|puts)[^.]{0,50}(?:in)?to torpor/i.test(t)) put('torpor', true);
  /* economy */
  if((m = t.match(/gain ([0-9]+|X) pool/i))) put('poolGain', num(m[1]));
  /* v1.6.6 (Johan's "sweep it while it's fresh" GO, hand size family): measured 85
     cards mentioning "hand size" across 10 types before tagging anything. Most are
     OUT of scope for this fx key entirely, not just unconsumed:
       - "discard down to/draw up to your hand size" (Fortschritt Library, Secret
         Library of Alexandria, Watchtower, Distraction, Hourglass of the Mind,
         Lupine Assault) is a DRAW-THEN-CYCLE mechanic that merely uses hand size as
         a discard reference point -- it is not a hand-size INCREASE at all, and
         tagging it here would be a category error, not just an unbuilt consumer.
       - Reductions/attacks on an opponent's or one's own hand size (Aggressive
         Tactics, The Meddling of Semsith) are a different mechanic (a hostile or
         self-sacrificing effect), not this bot's own resource gain.
       - Vote-scoped (Hand Intervention, Year of Fortune), combat-scoped (Nar-
         Sheptha, Rumble, Relentless Pursuit, Gift of Bellona, Aura Reading-class),
         counter-scaling (Visit from the Capuchin), and victory-point-scaled (The
         Bitter and Sweet Story) are all genuinely distinct shapes needing their own
         architecture (a vote engine, a combat-round hook, dynamic counters, VP
         tracking respectively) -- measured and left untagged, not guessed at.
     Two shapes ARE this session's own established family and get tagged:
       (a) LOCK-based, "until end of turn" (Dreams of the Sphinx's own shape, now
           also Ennoia's Theater) -- reuses handSize+lock+phase:'master' exactly,
           so _considerLockIncome needs zero new code for this second card.
       (b) PASSIVE PERMANENT, "+N hand size" with no lock and no combat/turn/vote
           scoping (Elder Library, British Museum London, Monastery of Shadows,
           Tabriz Assembly, Weeping Stone, Shaal Fragment, and the host-attached
           Trophy: Library/Reliquary: Trinket, though those two still need a
           host-aware consumer this round doesn't build -- tagged accurately
           regardless, an honest PARTIAL is not a wrong tag). New handSizePermanent
           flag distinguishes this shape from (a) at the consumer.                */
  /* v1.6.6 note: the LOCK-based "until end of turn" shape (Dreams of the Sphinx,
     Ennoia's Theater) still needs CURATION for its mode-level lock/phase fields --
     unlike fx keys (via put() above), lock/phase have never been auto-settable by
     this compiler (checked directly: no `mode.phase =` assignment exists anywhere
     in this file; Vessel/Blood Doll's phase tags are curated, not detected). The
     amount is still auto-extracted correctly by the pattern below; curation adds
     lock:true + phase:'master' on top, same as Dreams of the Sphinx's own entry. */
  else if((m = t.match(/\+([0-9]+) hand size\b/i))
      && !/discard (?:down|up) to (?:your )?hand size/i.test(t)
      && !/for each counter/i.test(t)                                  // Visit from the Capuchin / Hourglass of the Mind [TEM]: DYNAMIC amount, not a fixed N -- a genuinely different (counter-scaling) shape
      && !/in combat|for the remainder of (?:this )?combat|this combat,/i.test(t)   // Nar-Sheptha / Relentless Pursuit / Aura Reading / Rage of Apedemak: COMBAT-scoped, not "always on while in play" -- a third duration category this sweep doesn't build yet
      && !/until the end of the turn|this turn\b/i.test(t)             // Reliquary: Shango Remains / Ennoia's Theater: TURN-scoped (until-end-of-turn or "this turn"), like Dreams of the Sphinx -- but Ennoia's Theater is lock-triggered (needs curation for its mode-level lock/phase, same as Dreams of the Sphinx) and Shango Remains is burn-blood-triggered (a different activation this sweep doesn't build); neither should be mis-labelled permanent
      && !/chosen Methuselah|successful referendum/i.test(t)){          // Year of Fortune / Hand Intervention-class: vote-scoped, needs the whole politics engine (Q1-Q6, elysium-bot-politics-theory.md) -- explicitly out of scope for this sweep
    put('handSize', num(m[1])); put('handSizePermanent', true);
  }
  /* v1.5.6 (Johan's blood-placement family, superior-Govern pin): the TARGETED form.
     "Add/Put/Move N blood (from the blood bank) on/to a (younger) vampire in your
     uncontrolled region" -- 38 cards measured; ONLY the clean phrase gets the target
     tag (clan/title/infernal/imbued/capacity-filtered targets stay bloodAdd-without-
     bloodAddTo = honestly unconsumable until curated, the Magnetic Authority class).
     The negative lookahead rejects trailing conditions; the unlock-phase test keeps
     the hunting-ground income family (a later phase-income pin) out of the ACTION
     vocabulary. 'younger' compares CAPACITY per the rulebook's age rule.            */
  if((m = t.match(/(?:add|put|move) ([0-9]+|X)(?: or more)? blood (?:from the blood bank )?(?:on|to|onto) (?:a|an|each) (younger )?vampires? in your uncontrolled region(?![^.]{0,50}(?:with |who |that |capacity))/i))
     && !/(?:unlock|influence|master|discard) phase[^.\n]{0,140}uncontrolled/i.test(t)){   // phase-context = income family (Powerbase: Montreal is INFLUENCE-phase), not an action; Zürich/Kaymakli (granted actions) and Street Cred (combat-timed) keep their TRUE tags, unconsumable via the action-typed finder until a grant/combat consumer exists
    put('bloodAdd', num(m[1])); put('bloodAddTo', 'unc'); if(m[2]) put('bloodAddYounger', true);
  }
  if((m = t.match(/add ([0-9]+|X) blood/i))) put('bloodAdd', num(m[1]));
  /* v1.6.3 (Johan's "push Inside Dirt to 100%" GO, Life in the City): a THIRD
     bloodAddTo target class -- 'own-ready' (a ready vampire the CONTROLLING player
     owns), distinct from 'unc' (superior-Govern's uncontrolled-region target).
     Measured first: 5 cards share "add N blood to a ready vampire" wording, but only
     Life in the City is this clean ONE-SHOT shape -- The Coven uses the SAME phrase
     as a LOCK-based recurring choice ("you can lock this card to add..."), Leonardo
     is an Ally's own action, Transfusion is an action-modifier rider, Carver's is a
     different torpor-triggered mechanic entirely. The negative lookahead keeps this
     pattern narrow to the one-shot shape; The Coven's lock-based version is its own,
     separate future pin (same shape as Dreams of the Sphinx's own lock-choices).    */
  if((m = t.match(/add ([0-9]+|X) blood to a ready vampire/i)) && !/lock this card to add/i.test(t)){
    put('bloodAdd', num(m[1])); put('bloodAddTo', 'own-ready');
  }
  /* politics */
  if((m = t.match(/\+([0-9]+|X) votes?/i))) put('votes', num(m[1]));
  /* combat (coarse in v1 — the M2 combat module will grow this block) */
  if(/\bmaneuvers?\b/i.test(t)) put('maneuver', true);
  if(/\bpress(?:es)?\b/i.test(t)) put('press', true);
  if(/\bdodges?\b/i.test(t)) put('dodge', true);
  if(/additional strike/i.test(t)) put('addStrike', true);
  if(/aggravated/i.test(t)) put('aggr', true);
  if(!/prevents? (?:half|up to)\b/i.test(t) &&   // v1.5.5 (restlist read): "Prevent HALF the damage" (Rockheart) fell through the optional quantifier group as prevent:'all' -- the one WRONG VALUE on a scanned, playable, combat-typed key. 3-card class measured; only Rockheart was tagged. A missed tag is a curation task; a wrong tag mis-resolves.
     (m = t.match(/prevents? ([0-9]+|X|all|that)?\s*(?:of the )?damage/i)))
    put('prevent', m[1] ? (/^(all|that)$/i.test(m[1]) ? 'all' : num(m[1])) : 'all');
  if((m = t.match(/[Ss]trike:?\s*([0-9]+|X)R?\s*damage/))) put('strike', num(m[1]));
  /* v1.5.9 (Johan's combat GO, Roundhouse quick-win that turned into a 33-card family):
     two more strike-damage-bonus phrasings the original pattern's tight "number right
     after Strike:" shape missed. Measured against the full Combat pool before writing:
     22 "hand strike at +N damage" (Roundhouse, Burning Wrath, Cauldron of Blood, ...),
     11 "This strike is at +N damage" (used after a "hand strike or use a melee weapon
     strike" choice sentence -- Anticipation, Lucky Blow, ...). Deliberately excludes
     the "strength+N damage" sibling family (Argent Baton, Meat Hook, melee weapons,
     54-card superset minus these 33): the bot tracks no vampire "strength" stat at all,
     so that family stays honestly untagged rather than guessing a wrong number.
     num('X') returns the STRING 'X' (see num()), so a variable bonus tied to another
     counter (Invoke Poison Glands' superior "+X damage, where X is the number of
     Orun") fails the finder's typeof==='number' check automatically -- no extra guard
     needed here, the type mismatch IS the guard.                                     */
  /* v1.9.2 (16 Oct 2026, bot v0.6.202 -- the 14 Oct play-test, point 18): these two phrasings are a BONUS on the hand strike, not
     absolute damage -- "hand strike at +2 damage" deals the minion's strength (1 by default) + 2, so Roundhouse with a plain vampire
     is 3, and 4 with Preternatural Strength [pot]. They wrote `strike: N`, the field "Strike: N damage" uses for ABSOLUTE damage, and
     every Roundhouse landed one short. Now `handBonus: N` (handStrike is still tagged below); the bot adds it to the vampire's own hand
     damage. 36 library cards share the two patterns (25 + 11, vtes.json 14 Oct); in our six decks only Roundhouse. */
  if((m = t.match(/hand strike at \+([0-9]+|X) damage/i))) put('handBonus', num(m[1]));
  if((m = t.match(/this strike is at \+([0-9]+|X) damage/i))) put('handBonus', num(m[1]));
  /* v1.6.0 (Johan's standing question, checking the strike-bonus family for
     uncertainty): a THIRD phrasing found by chance while reading Compress -- "Strike:
     N aggravated damage" (aggravated sitting BETWEEN the number and "damage" breaks
     both the original tight pattern and the two v1.5.9 additions). 6 cards measured:
     Body Flare, Compress, Breath of Thanatos, Flames of the Netherworld(dai/DAI only
     -- its [tha] mode is separately excluded by req.rangeLong), Song in the Dark(ANI
     only, [ani]'s "Strike: 2 damage" already matched the original pattern). Body of
     Sun EXCLUDED by the negative lookahead: its bonus is range-CONDITIONAL ("3 ...if
     at close range or 1R ...if at long range") -- a single number would be a GUESS,
     not a fact, since the bot tracks no range state at all.                        */
  if((m = t.match(/strike:?\s*([0-9]+|X)R?\s*aggravated\s+damage(?!\s+if at)/i))) put('strike', num(m[1]));
  if(/combat ends/i.test(t)) put('combatEnds', true);
  if(/strike:\s*combat ends/i.test(t)) put('strikeCE', true);
  /* v1.9.0 (25 Sep 2026, the cardfx sweep): `ranged` -- a strike or steal that can be used at LONG range. VTES marks it with the
     R suffix on the damage ("Strike: 2R damage", "1R environmental") or the word itself ("Strike, ranged:"). Positive evidence only,
     like handStrike: a non-hand strike WITHOUT it is melee and cannot be used at long range (rulebook, combat range). The sweep pilot
     found the bot treating all 9 melee cards (Talbot's Chainsaw, Burning Touch, Putrefaction ...) as usable at long. */
  if(/strike[^.:]{0,20}\branged\b|\b[0-9X]+R\s*(?:aggravated\s+)?damage|\branged strike/i.test(t)) put('ranged', true);   // v1.8.0: the PLAYABLE shape of combatEnds -- a strike that ends combat (Majesty & 44 siblings). combatEnds alone also covers conditional and press-step endings the bot cannot play as a strike.
  /* v1.6.2 (Johan's combat GO, Immortal Grapple -- the strike-type restriction
     concept): source-verified vekn.net + official FAQ first -- "Immortal Grapple
     restricts both minions in the combat to only using 'hand strikes'" (3.16). This
     means retroactively classifying the 87 already-shipped strike/stealBlood cards:
     measured that the "R" suffix (already tolerated in the strike/stealBlood regexes
     without being separately recorded) is VTES's own marker for a RANGED strike --
     36 of the "unclear" cards had it. `handStrike` is a POSITIVE-evidence-only tag
     (explicit "hand strike" wording): the alternative (treating ABSENCE of "ranged"/
     "R" as proof of hand-strike-ness) would have silently trusted 12 genuinely
     ambiguous cards (Bonecraft, Putrefaction, Song in the Dark's base mode, etc.) --
     a WRONG "allowed" classification is a misplay (illegal state), not just a missed
     tag, so this fails closed: only explicit "hand strike" text counts. */
  if(/hand strike/i.test(t) && !/strikes that are not hand strikes/i.test(t)) put('handStrike', true);
  if(/strikes that are not hand strikes cannot be used this round/i.test(t)) put('restrictHandStrike', true);
  /* v1.6.1 (Johan's combat GO, Carrion Crows -- the persistent-this-combat modifier
     concept): source-verified vekn.net first -- environmental damage is any damage
     NOT from a strike or an explicit "this minion inflicts" effect; it cannot be
     dodged (official 2024 rulebook clarification), and is skipped entirely for a
     round where either combatant already went down from the round's regular damage
     first. Measured the whole "environmental damage" family before tagging (9 combat
     cards) -- most have their OWN distinct shape (Blood of Acid mirrors damage taken,
     Groaning Corpse counts copies played, Weather Control hits BOTH sides with
     retainers, Dagon's Call/Necrosis are one-strike-bundled bonuses, not persistent).
     This pattern targets ONLY Carrion Crows' specific, clean phrasing -- deliberately
     narrow, not a general "environmental damage" family tag; the other 8 stay
     untagged (documented in the combat plan, not guessed at with a broader regex). */
  if((m = t.match(/this combat, the opposing minion takes ([0-9]+|X)R environmental damage each round during normal strike resolution/i)))
    put('envDmgPerRound', num(m[1]));
  if((m = t.match(/as above, but for ([0-9]+|X)R environmental damage/i))) put('envDmgPerRound', num(m[1]));   // R MANDATORY, not optional -- Dark Steel/Groaning Corpse use the SAME "as above, but for N environmental damage" shorthand but WITHOUT the R (verified: only Carrion Crows writes "2R"); an earlier optional-R version matched both by accident
  if(fx.ranged && fx.strike === undefined && fx.stealBlood === undefined && !fx.strikeCE && fx.envDmgPerRound === undefined) delete fx.ranged;   // v1.9.0: `ranged` qualifies a strike / steal / env damage in the SAME segment -- never a mode on its own
  return fx;
}

/* ---------------- card_text segmentation ---------------- */
/* Splits rules text into requirement-scoped segments. A segment starts at a
   newline OR at any bracket token (mid-line brackets exist in ~126 lines).
   Leading tokens are consumed: 3-letter tokens are discipline/virtue
   requirements ('dom' inferior / 'DOM' superior; adjacent tokens join with
   '+'); longer ALL-CAPS tokens are TYPE brackets on multi-type cards.       */
function segment(text){
  const out = [];
  String(text || '').split('\n').forEach(line => {
    /* v1.5.0 (17 July, fas B/C sweep): protect "As [thn] above" MODE REFERENCES from the
       bracket-splitter (they are citations, not new mode headers -- 89 cards; Under My
       Skin's [THN]-collapsed-into-[thn] was the discovered instance: the splitter severed
       "As" from "[thn] above", the reference lost its "as", and the +2 override merged
       into the wrong mode). Rewritten to non-bracket delimiters; libModes' as-above
       resolver reads the reference back and pins inheritance to that exact mode.       */
    line = line.replace(/\bAs ((?:\[[A-Za-z]{3}\]){1,3}) above/g,
      (mm, g) => 'As ' + g.replace(/\[([A-Za-z]{3})\]/g, '\u2039$1\u203a') + ' above');   // v1.5.4: COMBO references too ("As [aus][qui] above" -- 9 cards; Draught of the Soul's superior-combo bleed had leaked into the inferior combo mode, found by the restlist machine-read)
    const parts = line.split(/(?=\[[A-Za-z][A-Za-z ]{1,20}\])/);
    /* the lookahead split can strand consecutive tokens in their own chunks
       ("[obf] " | "[ACTION MODIFIER] +1 stealth.") — carry tokens forward
       within the line so a segment keeps its full requirement context.     */
    let carryAt = [], carryUse = null, carryOr = false;
    parts.forEach(p => {
      let rest = p.trim();
      if(!rest) return;
      const at = carryAt;
      let use = carryUse, m;
      let orNext = carryOr;   /* v1.5.0 (17 July, fas B/C sweep): "[cel] or [for]" header
        alternatives -- the lookahead splitter strands the "or" connector at the TAIL of
        the part before the next bracket ("[cel] or " | "[for] +1 stealth."), so the
        first token used to become a dead at:'cel' text:'or' segment (no fx -> dropped)
        while all the fx went to the LAST token only: Relentlessness kept just [for],
        Fever Pitch just [pre] -- 22 library cards. The connector is now carried across
        parts (carryOr, alongside carryAt/carryUse) and joins alternatives into one
        at-element with '|', fanned out to one mode per alternative at assembly, so
        _modeUsableBy needs no schema change.                                          */
      carryAt = []; carryUse = null; carryOr = false;
      while((m = rest.match(/^\[([A-Za-z][A-Za-z ]{1,20})\]\s*/))){
        const tok = m[1];
        if(/^[A-Za-z]{3}$/.test(tok)){ if(orNext && at.length) at[at.length - 1] += '|' + tok; else at.push(tok); }
        else if(TYPE_BRACKET[tok.toUpperCase()]) use = TYPE_BRACKET[tok.toUpperCase()];
        rest = rest.slice(m[0].length);
        orNext = false;
        const om = rest.match(/^or\s+(?=\[[A-Za-z]{3}\])/i);   // same-part form, kept for robustness
        if(om){ orNext = true; rest = rest.slice(om[0].length); }
      }
      if(!rest){ carryAt = at; carryUse = use; carryOr = orNext; return; }
      if(/^or$/i.test(rest)){ carryAt = at; carryUse = use; carryOr = true; return; }   // the stranded-connector part itself
      out.push({ at: at.length ? at.join('+') : null, use, text: rest });
    });
  });
  return out;
}

/* ---------------- mode assembly (with "As above" resolution) ------------- */
/* v1.8.0 (18 Sep 2026, the act-again family -- Johan's sweep rule again): an action modifier that UNLOCKS its
   vampire after the action is over. The denominator across Freak Drive, Forced March, Instantaneous
   Transformation, Domain of Evernight, Truth of a Thousand Lies, Zephyr, As the Crow is WHEN it may be played:
   after a successful action, after a blocked one, after an unsuccessful one. That is a mode RIDER (`when`), the
   same slot the curated reaction riders use (bleedAtMe / postBlock) -- a bare fx.unlock cannot tell them apart,
   and the bot's one unlock consumer refuses a mode without it. Negative examples define the pattern: anything
   conditional on the KIND of action (equip, recruit, diablerie, "requiring an Anarch"), on another minion, on a
   payment ("burn 1 blood to unlock", "lock three Aye") or deferred ("at the end of the turn") gets no rider. */
function actWhen(segText, headText){
  const t = segText || '', hd = headText || '';
  if(!/unlock (?:this|the acting) (?:vampire|minion)/i.test(t)) return null;
  if(/weapon|equip|recruit|employ|wraith|diablerie|requiring|another|other than|at the end of the turn|burn \d+ blood to unlock|lock (?:three|two|\w+) Aye|can burn|you may unlock/i.test(t + ' ' + hd)) return null;
  const both = t + ' | ' + hd;
  if(/only usable if the action was blocked/i.test(t)) return /after action resolution|after resolution/i.test(both) ? 'actBlocked' : null;
  if(/only usable if the action was successful/i.test(t)) return /after action resolution|after resolution/i.test(both) ? 'actSuccess' : null;
  if(/after resolution of an unsuccessful action/i.test(both)) return 'actFailed';
  if(/after resolution of a successful action/i.test(both)) return 'actSuccess';
  return null;
}
function libModes(text){
  const segs = segment(text);
  const done = [];
  const headText = segs.filter(s => !s.at).map(s => s.text).join(' ');
  segs.forEach(s => {
    let fx = extractFx(s.text);
    const when = (fx.unlock && s.at) || (fx.unlock && segs.length === 1) ? actWhen(s.text, s.at ? headText : '') : null;
    let dir = /\u24b9/.test(s.text) || undefined;   // v1.3.0: PER-SEGMENT, not whole-card -- a split-mode action (Govern the Unaligned: directed bleed / undirected special) needs a per-mode answer, not one flag lying for half the card
    /* v1.4.0 (14 July 2026): same per-segment shape as dir. LEADING \b is load-bearing --
       without it "un-LOCK THIS-minion" and "b-LOCK THIS-action" both match as substrings
       of "unlock"/"block" (verified: 125 false positives on a run without it, incl. As the
       Crow's "Unlock this minion" -- the exact opposite concept). "that" alongside "this"
       catches locking a DIFFERENT named target (Gift of Sleep: "Lock that ally"; Tragic
       Love Affair, Threading the Path of Orpheus, ... -- 11 more library cards than "this"
       alone; a few more such hits are on CRYPT cards -- e.g. Gracis Nostinus's own "lock
       that vampire" -- out of scope here, cryptEntry() never reads this field).
       Checked SECOND: a real negation -- "As above, but do not lock this vampire"
       (Deflection's [DOM], the superior mode that trades away [dom]'s lock cost) -- found
       via the sweep-audit review, 11 cards use this exact "do/does not lock this/that X"
       shape. A negated segment is lock:FALSE, not merely absent: false blocks "as above"
       inheritance below (undefined would have let [DOM] silently re-inherit [dom]'s
       lock:true, the opposite of what the card says), and false is falsy at the entry-
       assembly step so it never marks the mode. Honest limit: if/else-if means a negation
       ANYWHERE in a segment suppresses a genuine positive elsewhere in that SAME segment
       too -- affects exactly one known card (Gift of Sleep's own "Lock that ally" sits
       beside an unrelated "do not lock this vampire" reminder in the same segment, so the
       real ally-lock is currently a miss, not a wrong tag -- consistent with the auto
       tier's stated tolerance, curation queue candidate rather than a compiler fix).       */
    let lock;
    if(/\bdo(?:es)? not lock (?:this|that) \w+/i.test(s.text)) lock = false;
    else if(/\block (?:this|that) \w+/i.test(s.text)) lock = true;
    const abm = s.text.match(/as\s+((?:\u2039[A-Za-z]{3}\u203a)+)\s+above/i);
    const abRef = abm ? [abm[0], [...abm[1].matchAll(/\u2039([A-Za-z]{3})\u203a/g)].map(x => x[1]).join('+')] : null;   // v1.5.4: combo refs resolve to the '+'-joined at ('aus+qui'), matching how segment() stores multi-token headers
    if(abRef || /as above/i.test(s.text)){
      /* inherit the nearest earlier fx-OR-dir-OR-lock-bearing segment, preferring
         the same trigram (Deflection: [DOM] "As above, but…" inherits [dom]'s
         bounce); own extraction then overrides (Lost in Crowds: "but for +2
         stealth"). v1.4.0 widened the "has something worth inheriting" check
         from fx-only to fx-or-dir-or-lock, so a lock-only/dir-only segment can
         also be a valid inheritance source (mirrors the gate widening below --
         no shipped card needs this yet, kept consistent for the general sweep).
         v1.5.0 (17 July): a bracketed reference ("As [thn] above", protected as
         \u2039thn\u203a by segment()) PINS the source to that exact mode -- exact-case
         match first (thn and THN are different modes), case-insensitive fallback;
         only then the v1.4.0 nearest-source walk. Under My Skin's [THN] now
         inherits [thn]'s {stealth, stealthLater} and overrides stealth to 2.    */
      let src = null;
      const worth = d => Object.keys(d.fx).length || d.dir || d.lock;
      if(abRef){
        const ref = abRef[1];
        /* v1.5.3 (18 July, restlist machine-read): the pin MUST skip content-free done
           entries, exactly like the fallback walk below. Root cause: "[str] is not a
           Discipline."-style MID-TEXT brackets make the splitter emit an EMPTY segment
           with the same `at` as the real mode; the v1.5.0 pin took the nearest match
           regardless of content and inherited nothing (Cheat the Fates [TEM] lost
           bleedAct+dir; Fractura/Hexe/Greater Curse lost their [STR]/[MAL] modes
           entirely; Masca [STR] lost addStrike -- all five found by the inheritance-
           superset invariant, all sharing the one root cause).                       */
        /* v1.9.0: the pin inherits the WHOLE referenced mode -- every worthy same-at segment merged, the way the
           grouping below will merge them anyway. It took the NEAREST one; the block-bar sweep gave Cheat the Fates'
           mid-text '[tem] cannot block this action' segment content of its own, and [TEM] latched onto it and lost
           bleedAct + dir from the segment before. */
        const whole = pred => { const hit = done.filter(d => worth(d) && pred(d)); if(!hit.length) return null;
          const m = { at: hit[0].at, fx: {}, dir: undefined, lock: undefined }; hit.forEach(d => { Object.assign(m.fx, d.fx); if(d.dir) m.dir = d.dir; if(d.lock) m.lock = d.lock; }); return m; };
        src = whole(d => d.at === ref) || whole(d => (d.at || '').toLowerCase() === ref.toLowerCase());
        /* v1.5.5: a KNOWN-BUT-EMPTY source stops inheritance dead. If the referenced
           mode exists in done but every same-at entry is content-free, the card's
           reference is real and its content is simply outside the auto vocabulary --
           inheriting from an UNRELATED mode instead is how the whole B-class of wrong
           tags was born (Cleansing Ritual [OBE] got [dom]'s bloodAdd; Diabolic Lure
           [DAI] got [aus]'s reduce; Rockheart [VIS] got [tha]'s dodge the moment the
           half-guard emptied [vis]). Known-but-empty => inherit nothing.             */
        if(!src && done.some(d => (d.at || '').toLowerCase() === ref.toLowerCase())) src = 'STOP';
      }
      if(!src){
        const base = (s.at || '').toLowerCase();
        for(let i = done.length - 1; i >= 0 && !src; i--){
          const d = done[i];
          if(worth(d) && base && (d.at || '').toLowerCase() === base) src = d;
        }
        if(!src && base && done.some(d => (d.at || '').toLowerCase() === base)) src = 'STOP';   // v1.5.5: same stop rule for plain "As above"
        for(let i = done.length - 1; i >= 0 && !src; i--){ if(worth(done[i])) src = done[i]; }
      }
      if(src && src !== 'STOP'){ fx = Object.assign({}, src.fx, fx); if(dir === undefined) dir = src.dir; if(lock === undefined) lock = src.lock; }
    }
    done.push({ at: s.at, use: s.use, fx, dir, lock, when });
  });
  /* group by (at, use); numeric conflicts keep the max */
  const map = new Map();
  done.forEach(d => {
    /* v1.4.0: was fx-only ("if no fx, this segment isn't a mode at all"), which
       silently dropped every lock-only/dir-only segment -- Parthenon's entire
       rules text ("you can lock this card to get +1 master phase action") has
       NO fx pattern in the v1 vocabulary (no key for phase-action grants yet),
       so under the old gate it compiled to zero modes, discarding the lock fact
       Johan specifically wanted preserved. A segment now becomes a mode if it
       carries fx OR dir OR lock -- strictly more permissive, so no existing
       fx-bearing mode's output can change (this was already true before).    */
    if(!Object.keys(d.fx).length && !d.dir && !d.lock) return;
    const key = (d.at || '') + '|' + (d.use || '');
    if(!map.has(key)) map.set(key, { at: d.at, use: d.use, fx: {}, dir: undefined, lock: undefined });
    const entry = map.get(key);
    if(d.dir) entry.dir = true;    // any segment sharing this (at,use) key carrying Ⓓ marks the assembled mode directed
    if(d.lock) entry.lock = true;  // v1.4.0: same any-segment-sets-it-for-the-whole-mode shape as dir
    if(d.when) entry.when = d.when;   // v1.8.0: the act-again rider
    const tgt = entry.fx;
    for(const k in d.fx){
      const v = d.fx[k];
      if(tgt[k] === undefined) tgt[k] = v;
      else if(typeof tgt[k] === 'number' && typeof v === 'number' && v > tgt[k]) tgt[k] = v;
    }
  });
  const assembled = [...map.values()].map(mo => {
    const o = { at: mo.at };
    if(mo.use) o.use = mo.use;
    if(mo.dir) o.dir = true;    // v1.3.0: PER-MODE now (absent = undirected default, Johan's minimal-tagging call)
    if(mo.lock) o.lock = true;  // v1.4.0: PER-MODE, not entry-level -- Enkil Cog carries a flat +1 bleed (no lock) AND a separate lockable action in the SAME entry; Dreams of the Sphinx bundles three differently-timed lock effects into one mode today (an existing, already-flagged curated limit -- see cardfx-design.md §4's actGrant note), which this auto tag does not attempt to resolve
    o.fx = mo.fx;
    if(mo.when) o.when = mo.when;   // v1.8.0
    return o;
  });
  /* v1.5.0 (17 July, fas B/C sweep): fan OR-alternative headers out to one emitted mode
     per alternative -- '[cel] or [for]' arrives from segment() as at:'cel|for' and
     leaves here as two modes with identical fx, so _modeUsableBy and every downstream
     consumer keep their single-requirement view of `at` (no schema change). Cartesian
     over '+'-joined AND-parts for completeness; fx cloned per emitted mode so later
     per-mode rewrites (actStealth) can never alias across alternatives.              */
  const fanned = [];
  assembled.forEach(o => {
    if(!o.at || o.at.indexOf('|') < 0){ fanned.push(o); return; }
    let alts = [[]];
    o.at.split('+').forEach(part => {
      const opts = part.split('|');
      const next = [];
      alts.forEach(a => opts.forEach(p => next.push(a.concat(p))));
      alts = next;
    });
    alts.forEach(a => fanned.push(Object.assign({}, o, { at: a.join('+'), fx: Object.assign({}, o.fx) })));
  });
  return fanned;
}

/* ---------------- entry builders ---------------- */
/* ---------------- referendum terms (v1.7.0) ----------------
   Johan, 18 Sep 2026: look for the LEAST COMMON DENOMINATOR and tag in sweeps, not card by
   card. For political actions the denominator is: "a successful referendum changes each
   Methuselah's POOL by some amount" -- Kine Resources Contested, Parity Shift and Ancilla
   Empowerment differ only in HOW MUCH and BASED ON WHAT. So the outcome is data:

     ref.pool : [ term ]   term = { sign, scope, n, per?, min?, others?, from? }
       scope 'alloc'  : the caller splits n points among >= min Methuselahs (others = not self)
       scope 'each'   : every Methuselah, n (x the `per` counter on THEIR board when present)
       scope 'chosen' : one Methuselah the caller names
       scope 'self'   : the caller
       scope 'move'   : n pool leaves ONE Methuselah (from: 'richer' = more pool than the caller)
                        and is split among >= min others, the caller included (Parity Shift)
       sign  -1 burn / +1 gain / 0 for 'move' (both at once)
       n     a number, or 'players' (Conservative Agitation)
       per   a PUBLIC board counter: minion, lockedMinion, torporVamp, clanVamp, cap8Vamp,
             indieAnarchVamp
     ref.tags : 'poolDmg' and/or 'poolGain' -- the sweep handles. Parity Shift carries BOTH;
                Consanguineous Boon lands in poolGain without being asked for.
     ref.fx   : outcome keys the generic tier found on a political card (poolDmg, poolGain,
                torpor, ...). They used to sit in modes[].fx, where every play finder read
                them as "this happens when I play the card" -- KRC was a directed burn-1 with
                no referendum (bot debt 14). On a political card modes[].fx now describes the
                ACTION only (actStealth); what a PASSED referendum does lives here.

   One resolver on the bot side turns ref.pool + the table into a per-seat delta map, and
   everything reads that map: the terms line, the vote, the block stake, the action score.
   A missed term is a curation task; a wrong term misleads (the v1.5.2 rule) -- so cards with
   conditional extras, ongoing drains, discipline-split text or an unknown counter get NO
   ref.pool, only the tag.                                                                  */
const REF_PER = [
  [/^minions? (?:they|he or she) controls?$/i, 'minion'],
  [/^locked minions? (?:they|he or she) controls?$/i, 'lockedMinion'],
  [/^vampires? in torpor (?:they|he or she) controls?$/i, 'torporVamp'],
  [/^vampires? of the chosen clan (?:they|he or she) controls?$/i, 'clanVamp'],
  [/^vampires? (?:they|he or she) controls? with capacity 8 or more$/i, 'cap8Vamp'],
  [/^ready Independent or Anarch vampires? (?:they|he or she) controls?$/i, 'indieAnarchVamp']
];
function refTerms(text){
  const t = (text || '').replace(/\n/g, ' ');
  if(/plus \d+ additional|additional pool|unlock phase|put this card in play|is put in play|then burns|no more than|each of the other Methuselahs|\[[a-z]{3}\]/i.test(t)) return null;
  const pool = []; let m, bad = false;
  if((m = t.match(/allocate (\d+|X) points among (one|two) or more (other )?Methuselahs(?:, where X is the number of Methuselahs in the game)?\. Successful referendum means each Methuselah burns 1 pool for each point allocated/i))){
    const n = /number of Methuselahs in the game/i.test(m[0]) ? 'players' : num(m[1]);
    const term = { sign: -1, scope: 'alloc', n, min: m[2].toLowerCase() === 'two' ? 2 : 1 }; if(m[3]) term.others = true; pool.push(term);
  }
  if((m = t.match(/who has more pool than you(?: do)? and allocate (\d+) of their pool among (\d+) or more other Methuselahs \(including you\)/i)))
    pool.push({ sign: 0, scope: 'move', n: num(m[1]), from: 'richer', min: parseInt(m[2], 10) });
  const re = /each Methuselah (burns|gains) (\d+|X) pool(?: for each ([^.,]+?))?(?=[.,]| and )/gi;
  while((m = re.exec(t))){
    if(/point allocated/i.test(m[3] || '')) continue;
    const term = { sign: /burn/i.test(m[1]) ? -1 : 1, scope: 'each', n: num(m[2]) };
    if(m[3]){ const hit = REF_PER.find(p => p[0].test(m[3].trim())); if(!hit){ bad = true; continue; } term.per = hit[1]; }
    pool.push(term);
  }
  if((m = t.match(/(?:the |that )?chosen Methuselah (burns|gains) (\d+) pool/i))) pool.push({ sign: /burn/i.test(m[1]) ? -1 : 1, scope: 'chosen', n: num(m[2]) });
  if((m = t.match(/Successful referendum means you gain (\d+) pool\./i))) pool.push({ sign: 1, scope: 'self', n: num(m[1]) });
  if(bad || !pool.length || pool.some(p => p.n === 'X')) return null;
  return pool;
}

/* v1.9.10 (bot v0.6.232): a frenzy card played on a minion other than its player's own -- it names the opposing minion or vampire, or a
   target: 'against a vampire', 'Choose a vampire', 'on any vampire', 'Put this card on a vampire' not 'you control', 'Choose X
   minions', 'Choose an Osebo in combat', a minion 'controlled by another Methuselah' ([LSJ 20051113]: a frenzy card that targets, selects, chooses or affects a
   minion is played on it). One test for the entry-level tag and the mode-level one. */
const FRENZY_OPP = /opposing (?:minion|vampire)|against a vampire|choose a vampire|choose an? [\w'-]+ in combat|on any vampire|put this card on a vampire(?! you control)|choose x minions|controlled by another methuselah/i;   // 'Choose an Osebo in combat' (Battle Frenzy: any Osebo -- the graded readings)
function libEntry(c){
  const e = { t: (c.types || []).map(t => TYPE_MAP[t] || t.toLowerCase()) };
  const cost = {};
  if(c.pool_cost !== undefined) cost.pool = num(String(c.pool_cost));
  if(c.blood_cost !== undefined) cost.blood = num(String(c.blood_cost));
  if(Object.keys(cost).length) e.cost = cost;
  const req = {};
  if(c.disciplines && c.disciplines.length)
    req.disc = [...new Set(c.disciplines.map(d => discTri(d)))].sort();
  if(c.clans && c.clans.length) req.clan = c.clans;
  /* v1.5.7 (Johan's blood-placement family, round 2): a card-level TITLE precondition
     (Fourth Tradition: The Accounting -- "Requires a prince or justicar", the ONLY hit
     in the 38-card family + a full-db scan of common VTES title nouns) is tracked as
     req.title so a consumer can fail closed. The bot does not track vampire titles
     anywhere today (politics-engine scope, elysium-bot-politics-theory.md) -- so this
     key exists to be CHECKED-AND-SKIPPED, not resolved, until that support lands.    */
  if(/requires? an? (?:prince|justicar|primogen|bishop|archbishop|cardinal|inner circle|regent|seneschal|baron|imperator|magaji|prime minister)\b/i.test(c.card_text || '')) req.title = true;
  { const tm = (c.card_text || '').match(/requires? an? ((?:(?:prince|justicar|primogen|bishop|archbishop|cardinal|inner circle member|regent|seneschal|baron|imperator|magaji|prime minister)(?:, | or )?)+)/i);   // v1.7.0: WHICH titles (Parity Shift: prince or justicar) -- additive beside the boolean, so every existing fail-closed reader is untouched
    if(tm) req.titles = tm[1].toLowerCase().split(/, | or /).map(x => x.trim()).filter(Boolean); }
  /* v1.5.8 (Johan's combat GO, steal-blood family): four combat-timing preconditions
     the bot's v1 single-round, no-range architecture cannot verify -- fail closed,
     same shape as req.title. Measured against the full 410-card Combat pool before
     tagging (not guessed): beforeRangeDetermined 83, rangeClose 19, rangeLong 17,
     notFirstRound 4. All four are real, common vocabulary (beforeRangeDetermined
     especially -- a fifth of all combat cards) worth tagging NOW even before a
     consumer exists for the "true" case, mirroring bloodAddTo's Zurich/Kaymakli
     true-tagged-future precedent: the fact is correct today, a future M2 phase/range
     tracker only needs to start READING it, not re-deriving it.                     */
  if(/only usable before range is determined/i.test(c.card_text || '')) req.beforeRangeDetermined = true;
  if(/only usable at close range/i.test(c.card_text || '')) req.rangeClose = true;
  if(/only usable at long range/i.test(c.card_text || '')) req.rangeLong = true;
  if(/(?:^|[.\n]\s*)Not usable (?:(?:on|during) )?(?:the )?first round/.test(c.card_text || '')) req.notFirstRound = true;   // v1.9.5: + 'Not usable the first round' / 'Not usable first round' (Eruption of Vitae, Growing Fury, Well-Aimed Car). v1.9.4: + 'during the first round' (Walk of Flame); a SENTENCE that starts so -- 'strikes ... that are not usable during the first round' (Shotgun Ritual, Al-Ashrad, Hector Trelane) lifts it
  { const cm = (c.card_text || '').match(/(?:^|[.\n]\s*)Requires? a vampire with capacity (\d+) or more\./i);   // v1.9.11 (bot v0.6.233, V5 wave 6a): 'Requires a vampire with capacity 7 or more' as a sentence of its own (Sense the Savage Way and 4 more) -- the bot's _entryReqOk reads it against the vampire that would play the card. On a discipline line (Hall of Hades' Court [dom], The Missing Voice [cel]) it is that mode's, not the card's: not read
    if(cm) req.capMin = +cm[1]; }
  if(Object.keys(req).length) e.req = req;
  const txt = c.card_text || '';
  if(/^unique\b/i.test(txt.trim())) e.unique = true;   // rulebook: unique library cards follow vampire uniqueness (one in play; a second contests)
  /* v1.5.0 (17 July, fas B/C sweep): keyword-SENTENCE scan replaces v1.4.2's line-start
     regex. Two blind spots, both found the day after that sweep shipped: (1) the older
     "Master: trifle." templating puts the keyword after a COLON (Vessel and ~18 more --
     the very reason Vessel had needed hand-curation, misdiagnosed at the time), and
     (2) keyword COMBINATIONS ("Archetype. Trifle." on Dabbler/Rebel) defeat any
     line-start anchor. A keyword is now any period-or-colon-delimited segment equal to
     the bare word, on any line -- prose like "is a trifle" can never form a bare-word
     segment. The same mechanism tags the five Archetype masters (Perfectionist-class
     one-per-vampire attachments; the master-play loop hosts+gates them via e.archetype). */
  const kwHit = w => txt.split('\n').some(l => l.split(/[.:]/).some(sg => new RegExp('^\\s*' + w + '\\s*$', 'i').test(sg)));
  if(kwHit('trifle')) e.trifle = true;
  if(kwHit('archetype') || kwHit('unique archetype')) e.archetype = true;   // v1.9.8 (V5 wave 4): 'Unique archetype.' (Saulot's Healing Touch, Avenging Fist, Guiding Wisdom) -- the bare-word segment missed the three
  /* v1.9.10 (bot v0.6.232, V5 wave 5b, RULINGS D-122): FRENZY -- a 'Frenzy.' keyword segment: 'opp' by FRENZY_OPP, else 'self'.
     Meditative Grove's cancel reads it. A mode-prefixed 'Frenzy.' ('[abo] Frenzy.') is no bare segment: the mode tag below. */
  if(kwHit('frenzy')) e.frenzy = FRENZY_OPP.test(txt) ? 'opp' : 'self';
  if(kwHit('out-of-turn') && (e.t || []).includes('master')) e.oot = true;   // v1.9.6 (bot v0.6.215, V5 wave 3): an OUT-OF-TURN master ('Out-of-turn.' / 'Master: out-of-turn.' as a keyword segment) -- played only on another Methuselah's turn, at its own trigger (the rulebook: it uses the next master phase action). The master-phase finder never offers one; a dedicated consumer (Archon Investigation) plays it at its trigger.
  if(/\(limited\)/i.test(txt)) e.limited = true;       // rulebook reminder text: bleed-increase modifiers / additional-strike sources capped at one
  /* v1.5.0 (17 July, fas B/C sweep): the Inside Dirt / Leverage class made derivable.
     IMPERATIVE "Burn the Edge to …" at a sentence boundary (bracket tokens and the \u24b9
     glyph may precede -- Enticement opens "[ser] \u24b9 Burn the Edge to …") is the player's
     own play cost. "can/may burn the Edge" phrasings (419 Operation, Powerbase: Z\u00fcrich,
     Sabbat Threat, Extortion + 6 more) are someone ELSE's escape option and never match
     the capital-B boundary form -- the pattern is deliberately case-SENSITIVE. Patsy's
     "Only usable if you control the Edge" is the same requirement stated as usability.
     costEdge is RESTRICTIVE downstream (both consumers skip the card entry-level without
     the Edge), so a tag can only ever prevent misplays, never cause one -- full-db
     verified exact set: Inside Dirt, Enticement, Leverage, Patsy.                     */
  if(/(?:^|\.\s+|\n)\s*(?:\[[A-Za-z]{3}\]\s*)*\u24b9?\s*Burn the Edge to /.test(txt) ||
     /only usable if you control the edge/i.test(txt)) e.costEdge = true;
  /* persistent (v1.4.0, 14 July 2026, rulebook-verified): this card STAYS IN PLAY after
     resolving, rather than going to the ash heap like an ordinary Master/Action. THREE
     signals, checked in order: (1) TYPE-implicit — Equipment/Ally/Retainer/Event stay in
     play by RULE (Johan's own starting instruction), and typically never restate this in
     their own card_text at all (found via the sweep-audit's type breakdown: without this
     check, 119/119 Allies, 54/54 Retainers, 146/164 Equipment and 39/40 Events were ALL
     silently missed — a card being an Ally IS the persistence signal, no prose needed).
     Power/Conviction were considered and REJECTED after reading samples — both are burn-
     for-effect resources (Donate: "Burn this card to give..."; Second Sight: "Burn when
     a monster is acting to give..."), one-shot like an Action despite sitting in the
     imbued type family; Johan's original list (Equipment/Ally/Retainer/Event) was exactly
     right and is trusted as-is, not extrapolated to its Imbued-side siblings. (2) failing
     that, the "Location" keyword, templated into the LEADING line of card_text (before the
     first newline) alongside Unique/Master: — anchoring to the first line (not "anywhere
     in card_text") avoids the 3 false positives where "location" appears deeper in the
     rules text describing a DIFFERENT card (Aye, Unnatural Disaster, Zoning Board all
     mention burning/moving "a location" without being one themselves); (3) failing that,
     the "put this card in(to) play" / "put this card on" / "stays or remains in play"
     prose a non-Location Master/Action/etc. permanent uses instead (Ashur Tablets, Dreams
     of the Sphinx, Blood Doll, Enkil Cog, Anarch Secession's title-card side-effect, ...).
     Entry-level, not per-mode: a card either stays in play or it doesn't, regardless of
     which discipline level played it — unlike `dir`/`lock` below, there is no split-card
     case. Rulebook default for an untagged Master/Action is the OPPOSITE (resolve once,
     ash heap) — kept as an explicit tag rather than inverted to tag the minority, even
     though this sweep found persistent Masters to be the numeric majority (~80%): the
     rules-default is non-persistent, only this card pool's composition skews the count. */
  const IMPLICIT_PERSISTENT_TYPES = ['equip', 'ally', 'retainer', 'event'];
  if(e.t.some(t => IMPLICIT_PERSISTENT_TYPES.includes(t))) e.persistent = true;
  else {
    const firstLine = txt.split('\n')[0];
    if(/\blocation\b/i.test(firstLine)) e.persistent = true;
    else if(/put this card (?:in|into) play|put this card on|this card is put (?:in|into) play|this card is put on|stays? in play|remains? in play/i.test(txt)) e.persistent = true;   // v1.9.7: + the v5 wording 'Successful referendum means this card is put in play / on this vampire' (Dogs of War, Crusade: Rome)
  }
  const modes = libModes(c.card_text);
  if(modes.length) e.modes = modes;
  /* v1.9.10: a MODE-prefixed 'Frenzy.' ('[abo] Frenzy. ...': Whistling Up the Beast, Devil-Channel: Back and Hands; Deep Song's [ANI] is
     curated) tags the modes of that line's discipline, 'opp' / 'self' by the line's own text; a superior 'As above' line inherits the line
     before it. The [REFLEX] line of the same discipline shares that mode (one `at`, one mode), so a reflex play reads as the frenzy one --
     accepted: the Grove reads a combat card of my opponent's in our combat only. */
  if(e.modes && !e.frenzy){
    let last = null;
    txt.split('\n').forEach(l => {
      const h = l.match(/^\s*((?:\[[A-Za-z]+\]\s*(?:or\s*)?)+)(.*)$/); if(!h) return;
      const ats = (h[1].match(/\[[A-Za-z]+\]/g) || []).map(x => x.slice(1, -1)).filter(x => x !== 'REFLEX');
      const fr = /^\s*Frenzy\s*[.:]/i.test(h[2]) ? (FRENZY_OPP.test(h[2]) ? 'opp' : 'self') : /^\s*As above/i.test(h[2]) ? last : null;
      last = fr;
      if(fr) e.modes.forEach(mo => { if(ats.includes(mo.at)) mo.frenzy = fr; });
    });
  }
  /* v1.9.11 (18 Nov 2026, bot v0.6.233, V5 wave 6a, RULINGS D-123): ONLY DIRECTED -- 'Only usable during an action directed at you (or a
     card you control)' and its 'During an action directed at you ..., X can ...' form (12 library cards; 'during a BLEED action directed at
     you' -- Elder Intervention, Guard Dogs' curated bleedAtMe -- is not this class). On a discipline line it tags the modes of that line's
     requirement (a superior 'As above' line inherits the line before it, the frenzy tag's rule); on a line with no discipline it tags the
     entry -- except on an action card, whose sentence is a later ability of the card in play (Marked Territory), not a condition on the
     action. The reaction finders read it (bot: _dirOk). Found by the wave 6 analysis: Eyes of Argus and The Warrens spent their intercept at
     undirected actions 568 times in v0.6.232's 240. A curated entry carries its own (Underbridge Stray's burn: allyBurnUnlock 'directed'). */
  /* v1.9.11 (18 Nov 2026, bot v0.6.233, V5 wave 6a, RULINGS D-123): THE LOCKED ROUTE as a sweep (Johan's sweep rule; D-116 (4)'s route). A
     REACTION's line 'This vampire unlocks and attempts to block.' -- or 'This vampire burns N blood to unlock.' -- under 'Only usable by a
     locked vampire.' (on that line, or in the card's header) is Second Tradition's route: when 'lockedBlock', fx.unlock (+ payBlood N). The
     line may also carry 'Only usable during an action directed at you (or a card you control).' (the onlyDirected tag below) and one rider the
     bot reads: 'If they block, neither combatant can strike during the first round of the resulting combat.' (fx.noStrikeFirstRound). Any other
     sentence on the line, or a header sentence that is neither a requirement nor one of the two conditions, and the line gets no route
     mode: a curation case (Dogged Pursuit's relock, Speak with Spirits' paid +1, Read the Winds' +1, The Mole's 'when a non-anarch minion
     is acting'). Built: Sense the Savage Way [ANI], Sentry Signal [ani]/[tha], One With the Land [PRO], Deep Ecology [pro], Black Sunrise,
     Eluding the Arms of Morpheus. A line whose discipline already has an auto mode keeps it unless that mode is a bare unlock. */
  if(e.t.includes('react')){
    const SENT = x => String(x || '').split(/(?<=\.)\s+/).map(y => y.trim()).filter(Boolean);
    const LOCKC = /^Only usable by a locked vampire\.$/i, DIRC = /^Only usable during an action directed at you \(or a card you control\)\.$/i, REQ = /^Requires?\b/i;
    const DLINE = /^\s*((?:\[[A-Za-z]{3}\]\s*(?:or\s*)?)+)(.*)$/;
    const lines = txt.split('\n'), head = lines.filter(l => !DLINE.test(l)), disc = lines.filter(l => DLINE.test(l));
    const headS = head.flatMap(SENT), headLock = headS.some(x => LOCKC.test(x));
    const routeOf = body => { let lock = headLock; const rest = SENT(body).filter(x => { if(LOCKC.test(x)){ lock = true; return false; } return !DIRC.test(x) && !REQ.test(x); });
      if(!lock || !rest.length) return null;
      const fx = { unlock: true }; let m;
      if((m = rest[0].match(/^This vampire burns (\d+) blood to unlock\.$/i))) fx.payBlood = +m[1]; else if(!/^This vampire unlocks and attempts to block\.$/i.test(rest[0])) return null;
      for(const r of rest.slice(1)){ if(/^If they block, neither combatant can strike during the first round of the resulting combat\.$/i.test(r)) fx.noStrikeFirstRound = true; else return null; }
      return fx; };
    const put = (at, fx) => { e.modes = e.modes || []; const i = e.modes.findIndex(mo => (mo.at || null) === at);
      if(i >= 0){ const k = Object.keys(e.modes[i].fx || {}); if(k.some(x => x !== 'unlock') || e.modes[i].when) return; e.modes.splice(i, 1); }
      e.modes.push({ at, fx, when: 'lockedBlock' }); };
    if(!disc.length){ const fx = routeOf(head.join(' ')); if(fx) put(null, fx); }
    else if(!headS.some(x => !REQ.test(x) && !LOCKC.test(x) && !DIRC.test(x))){
      disc.forEach(l => { const h = l.match(DLINE), ats = (h[1].match(/\[[A-Za-z]{3}\]/g) || []).map(x => x.slice(1, -1));
        const keys = /\]\s*or\s*\[/i.test(h[1]) ? ats : [ats.join('+')], fx = routeOf(h[2]);
        if(fx) keys.forEach(k => put(k, Object.assign({}, fx))); });
    }
  }
  if(/\bduring an action directed at you\b/i.test(txt)){
    const DIR = /\bduring an action directed at you\b/i;
    let last = false;
    txt.split('\n').forEach(l => {
      const h = l.match(/^\s*((?:\[[A-Za-z ]+\]\s*(?:or\s*)?)+)(.*)$/);
      const ats = h ? (h[1].match(/\[[A-Za-z]{3}\]/g) || []).map(x => x.slice(1, -1)) : [];
      if(!ats.length){ last = false; if(DIR.test(l) && !e.t.includes('action')) e.onlyDirected = true; return; }
      const keys = /\]\s*or\s*\[/i.test(h[1]) ? ats : [ats.join('+')];
      const on = DIR.test(h[2]) || (/^\s*As above/i.test(h[2]) && last);
      last = on;
      if(on && e.modes) e.modes.forEach(mo => { if(keys.includes(mo.at)) mo.onlyDirected = true; });
    });
  }
  /* v1.9.12 (19 Nov 2026, bot v0.6.235, the finished decks' round: spec-card-sweep §4.3, RULINGS D-127): CONDITION SENTENCES the bot must
     ask before it plays a card, tagged as onlyDirected is (v1.9.11): on the entry for a line with no discipline, on the modes of a
     discipline line ('As above' inherits the line before it, 'As [x] above' the latest [x] line), on the modes of its type for a type
     segment's line ('[ACTION MODIFIER] ...': Donate). onlyBleed 'Only usable during a bleed action.' and its narrower forms ('against
     you', 'directed at you', 'by a ready vampire other than the acting minion'; not '... or during the polling step': 43 cards), notBleed
     'Not usable during a bleed action' (3), onlyPredatorActs 'Only usable if a minion controlled by your predator is acting' (1),
     oncePerUnlock '... can play only one X between their unlock phases' (2), pressDir 'Press, only usable to continue / end combat'
     ('continue' / 'end', 31). noReplace on the entry, from a line with no discipline only: 'Do not replace until after combat' ('combat'),
     '... after this action' ('action'), '... your (next) discard / unlock / influence phase' ('discard' / 'unlock' / 'influence'); the
     forms that wait on an event (an oust, a diablerie ...) and 'as long as this card is in play' are not tagged: the ledger shows them.
     Found by A2's readings of the seven finished decks: Bonding's [DOM] stealth spent off a bleed, a second On the Qui Vive by one
     minion between its unlock phases, Mirror Walk replaced at the action's end, Apportation's press spent to end, Instinctive Reaction
     against a minion that is not the predator's, Forgotten Labyrinth during a bleed. The bot's finders read them (cardfx's header). */
  {
    const CONDS = [
      ['onlyBleed', /\bonly usable during a bleed(?: action)?(?: against you| directed at you| by (?:(?! or )[^.])*)?\.(?=\s|$)/i, () => true],   // the sentence, or its narrower forms ('against you', 'directed at you', 'by a ready vampire other than the acting minion': a bleed is still necessary; the egress review); not '... or during the polling step' (Protected District: a bleed is not necessary)
      ['notBleed', /\bnot usable during a bleed action\b/i, () => true],
      ['onlyPredatorActs', /\bonly usable (?:if|when) a minion controlled by your predator is acting\b/i, () => true],
      ['oncePerUnlock', /\bcan play only one [^.]* between (?:their|his or her|its) unlock phases\b/i, () => true],
      ['pressDir', /\bpress,? only usable to (continue|end) combat\b/i, m => m[1].toLowerCase()] ];
    const NOREPL = [[/\bdo not replace (?:this card |these cards )?until after combat\b/i, 'combat'], [/\bdo not replace until after (?:this|the) action\b/i, 'action'],
      [/\bdo not replace until your (?:next )?discard phase\b/i, 'discard'], [/\bdo not replace until your (?:next )?unlock phase\b/i, 'unlock'],
      [/\bdo not replace until your (?:next )?influence phase\b/i, 'influence']];
    const DL = /^\s*((?:\[[A-Za-z ]+\]\s*(?:or\s*)?)+)(.*)$/;
    for (const [key, re, val] of CONDS){
      if(!re.test(txt)) continue;
      let last = null; const byKey = {};   // 'As [x] above' names its line: the latest line that carries [x] (the egress review: Predator's Mastery [ABO], Lead Fist [VIS])
      txt.split('\n').forEach(l => {
        const h = l.match(DL), ats = h ? (h[1].match(/\[[A-Za-z]{3}\]/g) || []).map(x => x.slice(1, -1)) : [];
        const m = l.match(re);
        if(!ats.length){ last = null; if(!m) return;
          const ty = l.match(/^\s*\[(ACTION MODIFIER|REACTION|COMBAT)\]/i), use = ty && ({ 'action modifier': 'mod', reaction: 'react', combat: 'combat' })[ty[1].toLowerCase()];   // a type segment's line ([ACTION MODIFIER] ... [REACTION] ...: Donate) conditions its own modes, not the card (the egress review)
          if(use && e.modes && e.modes.some(mo => mo.use === use)) e.modes.forEach(mo => { if(mo.use === use) mo[key] = val(m); }); else e[key] = val(m);
          return; }
        const keys = /\]\s*or\s*\[/i.test(h[1]) ? ats : [ats.join('+')];
        const asN = h[2].match(/^\s*As \[([A-Za-z]{3})\] above/i);
        const v = m ? val(m) : asN ? (byKey[asN[1]] !== undefined ? byKey[asN[1]] : null) : (/^\s*As above/i.test(h[2]) ? last : null);
        last = v; keys.forEach(k => { byKey[k] = v; }); ats.forEach(k => { if(byKey[k] === undefined || v != null) byKey[k] = v; });
        if(v != null && e.modes) e.modes.forEach(mo => { if(keys.includes(mo.at)) mo[key] = v; });
      });
    }
    txt.split('\n').forEach(l => { if(DL.test(l) && (l.match(DL)[1].match(/\[[A-Za-z]{3}\]/g) || []).length) return;
      for (const [re, v] of NOREPL) if(re.test(l)){ e.noReplace = v; break; } });
  }
  /* v1.5.0 (17 July, fas B/C sweep): BUILT-IN action stealth ("+2 stealth action."
     headers -- 176 pure-Action cards -- and Night Moves-style "bleed at +N stealth")
     is a property of PERFORMING the action, not a playable modifier: renamed actStealth
     so the mid-action stealth finder (_bestStealthFor) is structurally blind to it. It
     would otherwise offer an Action card from hand as a modifier the moment a deck
     holds two differently-named stealth actions (same-name once-per-action masks the
     single-name case, which is why no arena run had tripped it). The announce-side
     tally booking reads actStealth||stealth (bot v0.6.11); political actions are
     actions for this purpose (Patsy-class "+1 stealth action" headers).             */
  /* v1.5.1 (18 July): the '!includes("reaction")' guard here was DEAD CODE -- TYPE_MAP's vocabulary
     is 'react', so it never matched. Measured before removing: exactly 6 Action+Reaction hybrids exist
     (Consume the Dead & co), all are "+N stealth action" headers whose stealth belongs to the ACTION
     half -- so the dead guard's accidental behavior (actStealth) was CORRECT, and the guard is removed
     rather than "fixed": excluding react-hybrids would have re-opened the misplay for those 6.        */
  if((e.t.includes('action') || e.t.includes('political')) && !e.t.includes('mod')){
    (e.modes || []).forEach(mo => {
      if(mo.fx && typeof mo.fx.stealth === 'number'){ mo.fx.actStealth = mo.fx.stealth; delete mo.fx.stealth; }
    });
  }
  if(/(?:minion|vampire) can play only one [^.]{2,60} each turn/i.test(txt)) e.oncePerTurn = true;   // v1.8.0: "A vampire can play only one Forced March each turn" -- the act-again consumer must not chain the same card
  if(e.t.includes('political')){   // v1.7.0: see "referendum terms" above
    const ref = {}, moved = {}, tags = new Set();
    (e.modes || []).forEach(mo => { Object.keys(mo.fx || {}).forEach(k => { if(k === 'actStealth') return;
      const v = mo.fx[k]; if(!(k in moved) || (typeof v === 'number' && typeof moved[k] === 'number' && v > moved[k])) moved[k] = v; delete mo.fx[k]; }); });
    if(e.modes){ e.modes = e.modes.filter(mo => Object.keys(mo.fx || {}).length); if(!e.modes.length) delete e.modes; }
    const pool = refTerms(txt);
    if(pool){ ref.pool = pool; pool.forEach(p => { if(p.sign <= 0) tags.add('poolDmg'); if(p.sign >= 0) tags.add('poolGain'); }); }
    if('poolDmg' in moved) tags.add('poolDmg');
    if('poolGain' in moved) tags.add('poolGain');
    if(tags.size) ref.tags = [...tags].sort();
    if(Object.keys(moved).length) ref.fx = moved;
    /* fail closed: a "Requires ..." line the req object does not fully express (a titled Camarilla vampire, an Anarch, capacity 5+ ...) marks the entry, so a caller that cannot verify the precondition never calls the card. req.titles alone IS verifiable (crypt entries carry `title`). */
    const rq = (txt.match(/(?:^|[.:] +)(Requires? [^.\n]+\.)/im) || ['', ''])[1];   // v1.9.7: also mid-line -- the v5 text puts the keywords first ('Title. Requires a Sabbat vampire.': Crusade: Rome)
    if(rq && !(e.req && e.req.titles && /^Requires? an? (?:[a-z ]+?)(?:(?:, | or )[a-z ]+)*\.$/i.test(rq) && !/titled|vampire|anarch|sabbat|camarilla|laibon|independent|capacity/i.test(rq))){ e.req = e.req || {}; e.req.unmodelled = true; }
    if(Object.keys(ref).length) e.ref = ref;
  }
  /* v1.9.9 (17 Nov 2026, bot v0.6.230, V5 wave 5): two markers no finder gates on. anarchReq -- the text's 'Requires an Anarch' / 'a ready
     Anarch' / 'a baron' sentence (Garibaldi-Meucci Museum swaps a card 'requiring an Anarch' out of the ash heap, Powerbase: Los Angeles
     unlocks an Anarch for discarding one; a baron card counts [LSJ 20050128]). zombie -- an ally or a retainer whose first line names it a
     zombie (Cursed Abattoir's 'zombie (ally or retainer)'). */
  if(/(?:^|[.:] +)Requires? (?:an?|a ready) (?:Anarch|baron)\b/im.test(txt)) e.anarchReq = true;
  if((e.t.includes('ally') || e.t.includes('retainer')) && /\bzombie\b/i.test(String(txt).split('\n')[0] || '')) e.zombie = true;
  e.src = 'auto';
  return e;
}

function cryptEntry(c){
  const e = { cap: c.capacity };
  const ct = c.card_text || '';
  if(/non-unique/i.test(ct)) e.unique = false;          // vampires default UNIQUE; "Non-unique" text opts out (Anarch Convert & friends)
  if(/\(limited\)/i.test(ct)) e.limited = true;        // inherent crypt abilities can carry (limited) too (Juggler & co)
  if(c.clans && c.clans.length) e.clan = c.clans.join('/');
  const sm = (c.card_text || '').match(/^(Camarilla|Sabbat|Independent|Laibon|Anarch)\b/i);
  if(sm) e.sect = sm[1];
  if(c.group !== undefined) e.group = String(c.group);
  if(typeof c.path === 'string' && c.path) e.path = c.path;   // v1.9.6 (V5 wave 3): the Sabbat V5 vampires' Path ('Death and the Soul', 'Power and the Inner Voice', 'Caine', 'Cathari') -- Burial Site Hunting Ground feeds only a follower of its Path
  const all = [], sup = [];
  (c.disciplines || []).forEach(d => {
    const t = discTri(d);
    all.push(t);
    if(d === d.toUpperCase() && /[A-Z]/.test(d)) sup.push(t);
  });
  if(all.length) e.disc = { all: [...new Set(all)].sort(), sup: [...new Set(sup)].sort() };
  if(c.title){
    e.title = c.title;
    if(TITLE_VOTES[c.title] !== undefined) e.votes = TITLE_VOTES[c.title];
  }
  if(c.banned) e.banned = c.banned;
  return e;
}

/* ---------------- the merge of hand entries (v1.10.0) ----------------
   20 Nov 2026 (spec-card-sweep-2026-11-18.md §4.4, RULINGS D-127: designed in the sweep's step A2, built at the start of B). A
   curated LIBRARY entry with `"merge": true` is laid over a COPY of the compiled entry of the same card (a key that is a printed
   variant: the printed name's entry), so a hand entry can carry the remainder only. Without it the overlay is today's whole-entry
   replacement, byte for byte; the crypt keeps whole-entry replacement (D-108's waves), and `merge` on a crypt entry fails the compile.
   - MODES MEET BY LEVEL: a mode's level is its `at` and its `when` (absent reads null; compared exactly). A curated mode merges
     into the ONLY compiled mode at its level, or into the one `"nth": n` names among them (1 = the first, in the compiled order);
     `"add": true` adds it after the compiled modes; `"drop": true` deletes the compiled mode it names; a mode at an `at` the
     compiled entry lacks altogether is added. Added modes follow the compiled ones in the curated order (a finder's tie keeps the
     first) and carry their `at` (null: the base level). A `when` is changed or deleted by dropping the mode and adding it again.
   - VALUES: a merged mode's `fx` is the union, a key on both takes the curated value, `null` deletes; the mode's own fields the
     same; `req` (the entry's and a mode's) and `ref` merge key by key, `ref.fx` as a mode's `fx`; every other entry field takes
     the curated value whole (an array, an object), `null` deletes; an emptied `req`, `ref` or `ref.fx` is removed; the note is
     the curated one. A `null` that finds nothing to delete (on an added mode: every `null`) is never written; the report says so.
   - WHAT FAILS THE COMPILE (nothing is written; the CLI exits 1). A target that is not plain: a level with two or more compiled
     modes and no `nth`; two curated modes aimed at one compiled mode; an `nth` or a `drop` that names no compiled mode; a near
     miss -- a mode without `add` that meets no compiled mode by `at` and `when` while the compiled entry has a mode at its `at`
     (a forgotten, null or other `when`: name the `when`, or say add). The layer's shape: `add` or `drop` not `true`; `nth` not a
     whole number from 1; `add` with `nth` or `drop`; a dropped mode that carries more than `at`, `when`, `nth` and `drop`; a mode
     that is not an object, whose `fx` is not an object or whose `req` is neither an object nor null; a mode the layer adds without an `fx` object ("fx": {} for
     none); `modes` that are not a list; `req` or `ref` that is not an object (or null); a layer that writes `src`, `merged` or
     `handKeys`; a key `__proto__`. The entry: a merge with no compiled entry under its name or a printed variant's; `merge` on a
     crypt entry. And on an entry that does NOT opt in: a `merge` that is present and not `true`, or a mode's `nth`, `add` or
     `drop` (only a merge reads them). The egress review of 20 Nov added the near miss, the added mode's `fx` and the last two.
   - THE COST RULE is unchanged and lives in the overlay below: the compiled numeric cost unless the layer names `cost` (an
     explicit cost wins, `"cost": {}` insists a card is free); an X leaves the merge and is reported.
   - `src` stays 'hand' (five readers say curated by it: the bot, test-cardfx.js, gen-deck-coverage.js, gen-review-sheet.js,
     cardfx-sharing.js), and the compiler writes `merged: true` and `handKeys` beside it: the sorted fx keys the layer sets (a mode's
     `fx`, `ref.fx`), which the sharing register and the review sheet read as the hand's. The bot reads neither.
   Returns { e (without src, cost), changes (the report's words), errors, handKeys }. */
const MERGE_OWN = ['src', 'merged', 'handKeys'];   // the compiler's to write on a merged entry
const isPlainObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const jclone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function mergeKeys(dst, layer, what, changes, errors, onSet, nested){   // key by key: the curated value wins, null deletes; nested: { key: onSet } merged one level deeper
  for(const k of Object.keys(layer)){
    const v = layer[k];
    if(k === '__proto__'){ errors.push(what + '__proto__ is no key'); continue; }
    if(v === null){
      if(hasOwn(dst, k)){ delete dst[k]; changes.push(what + '-' + k); } else changes.push(what + k + ' null (nothing to delete)');
      continue;
    }
    if(nested && hasOwn(nested, k)){
      if(!isPlainObj(v)){ errors.push(what + k + ' is an object of keys'); continue; }
      if(!isPlainObj(dst[k])) dst[k] = {};
      mergeKeys(dst[k], v, what + k + '.', changes, errors, nested[k]);
      if(!Object.keys(dst[k]).length) delete dst[k];
      continue;
    }
    if(!hasOwn(dst, k)) changes.push(what + '+' + k + ' ' + JSON.stringify(v));
    else if(JSON.stringify(dst[k]) !== JSON.stringify(v)) changes.push(what + k + ' ' + JSON.stringify(dst[k]) + '→' + JSON.stringify(v));
    dst[k] = jclone(v);
    if(onSet) onSet(k);
  }
}
function mergeHand(base, layer, name){
  const changes = [], errors = [], hk = new Set(), addHk = k => hk.add(k);
  const fail = s => errors.push(name + ': ' + s);
  const e = jclone(base); delete e.src; delete e.note;
  MERGE_OWN.forEach(k => { if(hasOwn(layer, k)) fail('"' + k + '" is the compiler\'s to write on a merged entry'); });
  for(const k of Object.keys(layer)){
    if(k === 'merge' || k === 'cost' || k === 'note' || MERGE_OWN.includes(k)) continue;   // the cost rule is the overlay's; the note below
    const v = layer[k];
    if(k === '__proto__'){ fail('__proto__ is no key'); continue; }
    if(k === 'modes'){
      if(!Array.isArray(v)){ fail('"modes" is a list of modes (a compiled mode is deleted by a mode with "drop": true)'); continue; }
      const m = mergeModes(e.modes || [], v, changes, errors, name, addHk);
      if(m.length) e.modes = m; else delete e.modes;
      continue;
    }
    if((k === 'req' || k === 'ref') && v !== null){
      if(!isPlainObj(v)){ fail('"' + k + '" is an object of keys'); continue; }
      if(!isPlainObj(e[k])) e[k] = {};
      mergeKeys(e[k], v, k + '.', changes, errors, null, k === 'ref' ? { fx: addHk } : null);
      if(!Object.keys(e[k]).length) delete e[k];
      continue;
    }
    mergeKeys(e, { [k]: v }, '', changes, errors);   // any other entry field: the curated value whole, null deletes
  }
  if(layer.note !== undefined && layer.note !== null) e.note = layer.note;   // the note is the curated one
  return { e, changes, errors: errors.map(s => (s.startsWith(name + ': ') ? s : name + ': ' + s)), handKeys: [...hk].sort() };
}
function mergeModes(compiled, layerModes, changes, errors, name, addHk){
  const lvl = mo => JSON.stringify([mo.at === undefined ? null : mo.at, mo.when === undefined ? null : mo.when]);
  const label = mo => '[' + (mo.at === undefined || mo.at === null ? '—' : mo.at) + (mo.when ? ' when ' + mo.when : '') + ']';
  const aimed = new Map(), plan = [];   // aimed: compiled index -> curated index
  layerModes.forEach((cm, ci) => {
    const who = 'curated mode ' + (ci + 1);
    if(!isPlainObj(cm)){ errors.push(who + ' is not an object'); return; }
    const tag = who + ' ' + label(cm);
    let bad = false;
    ['add', 'drop'].forEach(d => { if(hasOwn(cm, d) && cm[d] !== true){ errors.push(tag + ': "' + d + '" is true or absent'); bad = true; } });
    if(hasOwn(cm, 'nth') && !(Number.isInteger(cm.nth) && cm.nth >= 1)){ errors.push(tag + ': "nth" is a whole number from 1'); bad = true; }
    if(cm.add === true && (hasOwn(cm, 'nth') || cm.drop === true)){ errors.push(tag + ': "add" names no compiled mode, so it takes no "nth" or "drop"'); bad = true; }
    if(hasOwn(cm, 'fx') && !isPlainObj(cm.fx)){ errors.push(tag + ': "fx" is an object of keys'); bad = true; }
    if(hasOwn(cm, 'req') && cm.req !== null && !isPlainObj(cm.req)){ errors.push(tag + ': "req" is an object of keys'); bad = true; }
    if(cm.drop === true){ const extra = Object.keys(cm).filter(k => !['at', 'when', 'nth', 'drop'].includes(k)); if(extra.length){ errors.push(tag + ': a dropped mode carries its level only (it has ' + extra.join(', ') + ')'); bad = true; } }
    if(bad) return;
    const addMode = () => {   // v1.10.0 (the egress review): a mode the layer adds is written whole, so it carries its fx ("fx": {} for none) -- every library mode has one
      if(!isPlainObj(cm.fx)){ errors.push(tag + ': a mode the layer adds carries an "fx" object (write "fx": {} for none)'); return; }
      plan.push({ cm, kind: 'add' });
    };
    if(cm.add === true){ addMode(); return; }
    const cands = []; compiled.forEach((mo, i) => { if(lvl(mo) === lvl(cm)) cands.push(i); });
    const atOf = mo => (mo.at === undefined ? null : mo.at), near = compiled.filter(mo => atOf(mo) === atOf(cm));
    if(!cands.length && near.length){   // v1.10.0 (the egress review): a near miss is no plain target -- the compiled entry has modes at this `at`, none with this `when`
      const ws = [...new Set(near.map(mo => (mo.when === undefined || mo.when === null ? 'none' : mo.when)))];
      errors.push(tag + ': no compiled mode at [' + (atOf(cm) === null ? '—' : atOf(cm)) + '] has ' + (cm.when === undefined || cm.when === null ? 'no "when"' : 'when ' + cm.when) + ' (the compiled when: ' + ws.join(', ') + ') -- name the "when", or say "add" (a "when" is changed by drop and add)');
      return;
    }
    let idx;
    if(hasOwn(cm, 'nth')){
      if(cm.nth > cands.length){ errors.push(tag + ': "nth": ' + cm.nth + ' names no compiled mode (' + cands.length + ' at that level)'); return; }
      idx = cands[cm.nth - 1];
    } else if(cands.length === 1) idx = cands[0];
    else if(cands.length > 1){ errors.push(tag + ': ' + cands.length + ' compiled modes at that level -- name one with "nth", or "add" the mode'); return; }
    else {
      if(cm.drop === true){ errors.push(tag + ': "drop" names no compiled mode (none at that level)'); return; }
      addMode(); return;   // an `at` the compiled entry lacks altogether: added
    }
    if(aimed.has(idx)){ errors.push(tag + ' and curated mode ' + (aimed.get(idx) + 1) + ' are aimed at one compiled mode (the ' + (cands.indexOf(idx) + 1) + ' of ' + cands.length + ' at that level): give each its own "nth", or "add" one'); return; }
    aimed.set(idx, ci);
    plan.push({ cm, kind: cm.drop === true ? 'drop' : 'merge', idx });
  });
  const out = compiled.map(jclone), dropped = new Set();
  for(const p of plan){
    if(p.kind === 'drop'){ dropped.add(p.idx); changes.push(label(compiled[p.idx]) + ' dropped'); continue; }
    if(p.kind !== 'merge') continue;
    const dst = out[p.idx], tag = label(compiled[p.idx]) + ' ';
    for(const k of Object.keys(p.cm)){
      if(['at', 'when', 'nth', 'add', 'drop'].includes(k)) continue;   // the level (equal by the match) and the directives
      const v = p.cm[k];
      if(k === 'fx'){ if(!isPlainObj(dst.fx)) dst.fx = {}; mergeKeys(dst.fx, v, tag + 'fx ', changes, errors, addHk); continue; }
      if(k === 'req' && v !== null){ if(!isPlainObj(dst.req)) dst.req = {}; mergeKeys(dst.req, v, tag + 'req ', changes, errors); if(!Object.keys(dst.req).length) delete dst.req; continue; }
      mergeKeys(dst, { [k]: v }, tag, changes, errors);
    }
  }
  const res = out.filter((mo, i) => !dropped.has(i));
  for(const p of plan){
    if(p.kind !== 'add') continue;
    const mo = { at: p.cm.at === undefined ? null : p.cm.at }, tag = label(p.cm) + ' ';   // the level first, as on a compiled mode: `at: null` is the base level, not a deletion
    for(const k of Object.keys(p.cm)){
      if(['at', 'nth', 'add', 'drop'].includes(k)) continue;
      const v = p.cm[k];
      if(v === null){ changes.push(tag + k + ' null (nothing to delete: an added mode)'); continue; }
      if(k === 'fx' || k === 'req'){ const o = {}; mergeKeys(o, v, tag + k + ' ', [], errors, k === 'fx' ? addHk : null); Object.keys(v).filter(x => v[x] === null).forEach(x => changes.push(tag + k + ' ' + x + ' null (nothing to delete: an added mode)')); if(k === 'fx' || Object.keys(o).length) mo[k] = o; continue; }
      mo[k] = jclone(v);
    }
    changes.push(tag + 'added (fx ' + (Object.keys(mo.fx).join(', ') || 'none') + ')');
    res.push(mo);
  }
  return res;
}

/* ---------------- compile ---------------- */
function compile(cards, curated){
  const crypt = {}, lib = {};
  /* aliases: gather every variant → all canonical candidates, then resolve
     deterministically. Collisions are real in the data (77 keys): base vs
     "(… ADV)" advanced vampires, and multi-group reprints ("(G3)" vs "(G6)").
     Ladder: non-ADV beats ADV, then the HIGHEST group (newest printing) —
     a plausible stat line beats a lookup miss for a seat-filler bot; decks
     that care use canonical names. Ambiguous keys are counted in the report. */
  const variants = new Map();
  const noteAlias = (key, canonical) => {
    const k = String(key || '').trim().toLowerCase();
    if(!k || k === canonical.toLowerCase()) return;
    if(!variants.has(k)) variants.set(k, new Set());
    variants.get(k).add(canonical);
  };

  const fmtN = { v3: 0, v5: 0 };
  let costUnknown = 0, v5Titles = 0;
  const normd = cards.map(c => c && normalizeCard(c)).filter(n => n && n.rec.name);
  normd.sort((a, b) => String(a.rec.name).localeCompare(String(b.rec.name)));
  normd.forEach(({ fmt, rec }) => {
    fmtN[fmt]++;
    if(rec._costUnknown) costUnknown++;
    if(fmt === 'v5' && rec.title) v5Titles++;
    if(rec._crypt) crypt[rec.name] = cryptEntry(rec);
    else lib[rec.name] = libEntry(rec);
    noteAlias(rec._name, rec.name);
    (rec.name_variants || []).forEach(v => noteAlias(v, rec.name));
    { const am = String(rec.name).match(/^(.*), (The|An|A)$/); if(am) noteAlias(am[2] + ' ' + am[1], rec.name); }   // v1.9.6 (main's KRCG v5 reply, 1 Nov 2026, item 5.2): the client now names library cards article-first from KRCG's v5 dump ('An Anarch Manifesto'); the v3 key is 'Anarch Manifesto, An' and its variants lacked that spelling (the one miss of 4,149, measured)
  });

  const alias = {}, collisions = [];
  const rank = n => {
    const adv = /ADV\)$/.test(n) ? 1 : 0;
    const gm = n.match(/\(G(\d+)/);
    const grp = gm ? parseInt(gm[1], 10) : 0;
    return { adv, grp };
  };
  /* v1.9.7 (the v5 dump): KRCG's v5 name_variants carry VERNACULAR short names ('Amelia' for 'Amelia, The Blood Red Tears (G3)',
     'Lucian' for 'Lucian, the Perfect (G4)'); the newest-group ladder then gave a card's own printed name to ANOTHER card. A name
     that is some card's own printed name (`_name`) belongs to that card: those candidates win before the ladder. */
  const ownsName = new Map();
  normd.forEach(({ rec }) => { const k = String(rec._name || '').trim().toLowerCase(); if(k){ if(!ownsName.has(k)) ownsName.set(k, new Set()); ownsName.get(k).add(rec.name); } });
  [...variants.keys()].sort().forEach(k => {
    let cands = [...variants.get(k)];
    { const own = ownsName.get(k); if(own){ const mine = cands.filter(c => own.has(c)); cands = mine.length ? mine : [...own]; } }   // the owner even when only OTHER cards list the name ('Distraction' is a card; Misdirection's variant is 'Distraction'): noteAlias never notes a card's own name, so the owner is no candidate (the egress review)
    if(cands.length > 1){
      collisions.push(k);
      cands.sort((a, b) => {
        const ra = rank(a), rb = rank(b);
        if(ra.adv !== rb.adv) return ra.adv - rb.adv;        // non-ADV first
        if(ra.grp !== rb.grp) return rb.grp - ra.grp;        // newest group first
        return a.localeCompare(b);
      });
    }
    if(/[\p{L}\p{N}]/u.test(k)) alias[k] = cands[0];   // v1.9.7: a key with no letter or digit is no name ('!', the v5 nickname of Behind You!): never an alias the log parser could meet
  });

  /* v1.9.7: five v3 spellings the v5 dump's name variants leave out -- main's reply of 1 Nov: the client adds them itself, so an old
     deck list still resolves; the bot does the same (the v3 file's targets, by name). */
  [['theo bell (adv)', 'Theo Bell (G2 ADV)'], ['tegyrius', 'Tegyrius, Vizier (G2)'], ['tegyrius (adv)', 'Tegyrius, Vizier (G2 ADV)'],
   ['tegyrius, vizier (adv)', 'Tegyrius, Vizier (G2 ADV)'], ['lucinde', 'Lucinde, Alastor (G3)']].forEach(([k, v]) => { if(!alias[k] && crypt[v]) alias[k] = v; });

  /* curated overlay — whole-entry replacement, keys should be canonical
     vtes.json names (new names are accepted for house content but flagged
     in the report as possible typos); src is forced to 'hand'. A library
     entry with "merge": true is laid over the compiled entry instead
     (v1.10.0, mergeHand above); every other entry as before, byte for byte. */
  const curApplied = [], curNew = [], curVariant = [], costInherited = [], costMismatch = [], costX = [], reqInherited = [];
  /* v1.6.14 (16 Sep 2026, Johan's Academic Hunting Ground report -- THE INHERITED COST):
     whole-entry replacement DROPPED the auto tier's `cost` on every curated entry that did
     not restate it. 23 hunting grounds (pool 2), Papillon (3), Meditative Grove (2),
     Revelations and Magic of the Smith (blood 1) had been free since their curation; the bot
     pays `d.pick.cost` faithfully, so it paid nothing. Rule from here: a curated entry
     WITHOUT a `cost` key inherits the auto tier's numeric cost (the printed price from
     vtes.json); an explicit curated `cost` always wins (write `cost: {}` to insist a card is
     free against the data); an `X` cost is never inherited (the consumers do arithmetic on
     cost.blood and `'X'` would poison it) and is reported instead, as is every explicit
     curated cost that disagrees with the data. Both lists print in the report.            */
  const numericCost = c => { if(!c) return null; const o = {};
    if(typeof c.pool === 'number' && Number.isFinite(c.pool)) o.pool = c.pool;
    if(typeof c.blood === 'number' && Number.isFinite(c.blood)) o.blood = c.blood;
    return Object.keys(o).length ? o : null; };
  const merged = [], mergeErrors = [];   // v1.10.0 (spec-card-sweep §4.4): the merged entries with what each layer changed; what fails the compile
  const overlay = (dst, entries) => {
    const compiled = Object.assign({}, dst);   // v1.10.0: the compiled entries as the overlay found them -- a merge lays over these, never over another hand entry
    Object.keys(entries || {}).forEach(name => {
      if(name.startsWith('_')) return;                     // _comment keys etc.
      const raw = entries[name];
      if(raw && raw.merge === true){   // v1.10.0: the merge of hand entries (mergeHand above)
        if(dst !== lib){ mergeErrors.push(name + ': "merge" is for library entries -- the crypt keeps whole-entry replacement (D-108)'); return; }
        const canon = hasOwn(compiled, name) || !hasOwn(alias, name.toLowerCase()) ? null : alias[name.toLowerCase()];   // a printed variant: the printed name's entry
        const base = canon ? compiled[canon] : compiled[name];
        if(!base){ mergeErrors.push(name + ': "merge" needs a compiled entry to lay over -- no library card and no printed variant of one has this name'); return; }
        const m = mergeHand(base, raw, name);
        if(m.errors.length){ m.errors.forEach(s => mergeErrors.push(s)); return; }
        const e = m.e, ac = base.cost;
        if(hasOwn(raw, 'cost')){   // the cost rule (v1.6.14), unchanged: an explicit curated cost wins ("cost": {} insists a card is free; null deletes it)
          if(raw.cost === null) delete e.cost; else e.cost = jclone(raw.cost);
          const cv = raw.cost === null ? {} : raw.cost;
          if(ac){ if(JSON.stringify(cv) !== JSON.stringify(ac)){ costMismatch.push(name + ' curated ' + JSON.stringify(cv) + ' vs data ' + JSON.stringify(ac)); m.changes.push('cost ' + JSON.stringify(ac) + '→' + JSON.stringify(cv)); } }
          else if(Object.keys(cv).length){ costMismatch.push(name + ' curated ' + JSON.stringify(cv) + ' vs data (free)'); m.changes.push('cost (free)→' + JSON.stringify(cv)); }
        } else if(ac){   // ... else the compiled numeric cost; an X leaves the merge and is reported
          const inh = numericCost(ac), hasX = ac.pool === 'X' || ac.blood === 'X';
          if(inh){ e.cost = inh; costInherited.push(name + ' ' + JSON.stringify(inh)); } else delete e.cost;
          if(hasX){ costX.push(name + ' ' + JSON.stringify(ac)); m.changes.push('cost ' + JSON.stringify(ac) + ': the X left the merge'); }
        }
        e.src = 'hand'; e.merged = true; e.handKeys = m.handKeys;
        dst[name] = e;
        curApplied.push(name);
        merged.push({ name, changes: m.changes });
        if(canon && canon !== name){ dst[canon] = Object.assign({}, e); curVariant.push(name + ' -> ' + canon); }   // v1.9.3's rule: written under the printed name too
        return;
      }
      if(raw && hasOwn(raw, 'merge')){ mergeErrors.push(name + ': "merge" is true or absent (it is ' + JSON.stringify(raw.merge) + ')'); return; }   // v1.10.0 (the egress review): no half opt-in
      if(raw && Array.isArray(raw.modes) && raw.modes.some(mo => mo && ['nth', 'add', 'drop'].some(d => hasOwn(mo, d)))){ mergeErrors.push(name + ': a mode carries "nth", "add" or "drop", which only a merge reads -- say "merge": true, or take them out'); return; }
      const e = Object.assign({}, entries[name]);
      e.src = 'hand';
      const auto = dst[name];
      if(!auto) curNew.push(name);
      else if(auto.cost){
        const ac = auto.cost, hasX = ac.pool === 'X' || ac.blood === 'X';
        if(e.cost === undefined){
          const inh = numericCost(ac);
          if(inh){ e.cost = inh; costInherited.push(name + ' ' + JSON.stringify(inh)); }
          if(hasX) costX.push(name + ' ' + JSON.stringify(ac));
        } else if(JSON.stringify(e.cost) !== JSON.stringify(ac)) costMismatch.push(name + ' curated ' + JSON.stringify(e.cost) + ' vs data ' + JSON.stringify(ac));
      } else if(e.cost !== undefined && Object.keys(e.cost).length) costMismatch.push(name + ' curated ' + JSON.stringify(e.cost) + ' vs data (free)');
      /* v1.9.1 (25 Sep 2026, cardfx sweep pass 2): curated LIBRARY entries also inherit the data's discipline and clan
         REQUIREMENTS when they do not restate them -- 11 curated cards had lost req.disc and Creeping Sabotage /
         Forced Confessional their clan. (v1.9.1 kept masters out -- 'a clan icon on a master is not a requirement'; v1.9.6
         reversed it, R-42: masters inherit the clan too.) */
      if(auto && auto.req && dst === lib){
        const r = Object.assign({}, e.req || {}), got = [];
        if(r.disc === undefined && auto.req.disc){ r.disc = auto.req.disc; got.push('disc'); }
        if(r.clan === undefined && auto.req.clan){ r.clan = auto.req.clan; got.push('clan'); }
        if(r.capMin === undefined && auto.req.capMin){ r.capMin = auto.req.capMin; got.push('capMin'); }   // v1.9.11: the capacity too   // v1.9.6 (V5 wave 3): masters inherit the clan too -- v1.9.1's 'a clan icon on a master is not a requirement' was wrong: 'only a Methuselah who controls a ready minion who meets the requirements of a master card can play it' (the rulebook, card types), and the clan icon is a requirement (RULINGS R-42)
        if(got.length){ e.req = r; reqInherited.push(name + ' ' + got.join('+')); }
      }
      if(auto && auto.oot && e.oot === undefined) e.oot = true;   // v1.9.6: a curated master keeps the data's out-of-turn keyword unless it restates it
      if(auto && auto.anarchReq && e.anarchReq === undefined) e.anarchReq = true;   // v1.9.9: the markers survive a curated entry
      if(auto && auto.zombie && e.zombie === undefined) e.zombie = true;
      if(auto && auto.onlyDirected && e.onlyDirected === undefined) e.onlyDirected = true;   // v1.9.11: the header's 'Only usable during an action directed at you' survives a curated entry (a line's own stays with the curated modes)
      if(auto && auto.frenzy && e.frenzy === undefined) e.frenzy = auto.frenzy;   // v1.9.10: the frenzy tag survives a curated entry (Rage of Apedemak's 'self')
      for(const k of ['onlyBleed', 'notBleed', 'onlyPredatorActs', 'oncePerUnlock', 'pressDir', 'noReplace']) if(auto && auto[k] !== undefined && e[k] === undefined) e[k] = auto[k];   // v1.9.12: the header's conditions survive a curated entry (a line's own stays with the curated modes, as onlyDirected's)
      dst[name] = e;
      curApplied.push(name);
      /* v1.9.3: a curated key that is not a printed name but a known VARIANT of one (the alias table) is ALSO written under the
         printed name. Pentex(TM) Subversion was the one case: a list typed Pentex\u2122 Subversion got the empty auto entry. Not a
         rename -- the variant key stays, so a list typed the old way still resolves exactly to itself. */
      const canon = !auto && alias[name.toLowerCase()];
      if(canon && canon !== name && dst[canon]){ dst[canon] = Object.assign({}, e); curVariant.push(name + ' -> ' + canon); curNew.splice(curNew.indexOf(name), 1); }
    });
  };
  if(curated){
    overlay(lib, curated.lib);
    overlay(crypt, curated.crypt);
  }
  if(mergeErrors.length){   // v1.10.0: a merge whose target is not plain fails the compile (spec-card-sweep §4.4); nothing is written
    const err = new Error('cardfx compile v' + FXC_VERSION + ': the merge of hand entries failed (spec-card-sweep-2026-11-18.md §4.4):\n  ' + mergeErrors.join('\n  '));
    err.mergeErrors = mergeErrors.slice();
    throw err;
  }

  const libModesN = Object.values(lib).filter(e => e.modes && e.modes.length).length;
  const libPersistentN = Object.values(lib).filter(e => e.persistent).length;   // v1.4.0
  const libLockN = Object.values(lib).filter(e => (e.modes || []).some(m => m.lock)).length;   // v1.4.0 -- entries with >=1 lock-tagged mode
  const out = {
    fxv: 1,
    generated: new Date().toISOString(),
    source: 'vtes.json — ' + cards.length + ' cards (KRCG, Dark Pack)',
    counts: {
      crypt: Object.keys(crypt).length,
      lib: Object.keys(lib).length,
      libWithFx: libModesN,
      libPersistent: libPersistentN,
      libLock: libLockN,
      curated: curApplied.length,
      alias: Object.keys(alias).length,
      formats: fmtN
    },
    crypt, lib, alias
  };
  return { out, collisions, curApplied, curNew, curVariant, costUnknown, v5Titles, costInherited, costMismatch, costX, reqInherited, merged };
}

/* ---------------- diff-friendly serializer ----------------
   Header pretty, then ONE line per card entry (sorted upstream) so that a
   regeneration diff reads as changed cards, not a reflowed blob.           */
function serialize(out){
  const L = [];
  L.push('{');
  L.push(' "fxv": ' + JSON.stringify(out.fxv) + ',');
  L.push(' "generated": ' + JSON.stringify(out.generated) + ',');
  L.push(' "source": ' + JSON.stringify(out.source) + ',');
  L.push(' "counts": ' + JSON.stringify(out.counts) + ',');
  const block = (name, obj, last) => {
    L.push(' ' + JSON.stringify(name) + ': {');
    const keys = Object.keys(obj);
    keys.forEach((k, i) => {
      L.push('  ' + JSON.stringify(k) + ': ' + JSON.stringify(obj[k]) + (i < keys.length - 1 ? ',' : ''));
    });
    L.push(' }' + (last ? '' : ','));
  };
  block('crypt', out.crypt);
  block('lib', out.lib);
  block('alias', out.alias, true);
  L.push('}');
  return L.join('\n') + '\n';
}

/* ---------------- report ---------------- */
function report(res, verbose){
  const { out, collisions, curNew } = res;
  const c = out.counts;
  const lines = [];
  lines.push('cardfx compile v' + FXC_VERSION + ' — ' + out.source);
  lines.push('  formats: v3 ' + c.formats.v3 + ' · v5 ' + c.formats.v5 +
             (c.formats.v5 ? ' — v5 defensive reads: unknown cost shapes ' + res.costUnknown + ', titles seen ' + res.v5Titles : ''));
  lines.push('  crypt ' + c.crypt + ' · lib ' + c.lib + ' (' + c.libWithFx + ' with fx, ' +
             Math.round(100 * c.libWithFx / Math.max(1, c.lib)) + '%) · curated ' + c.curated +
             ' · aliases ' + c.alias + (collisions.length ? ' (' + collisions.length + ' ambiguous, ladder-resolved)' : ''));
  lines.push('  persistent ' + c.libPersistent + ' · lock ' + c.libLock + ' (rulebook tags, v1.4.0)');
  if(curNew.length) lines.push('  ⚠ curated names NOT in vtes.json (house content or typo): ' + curNew.join(', '));
  if((res.curVariant || []).length) lines.push('  curated entries keyed by a printed variant, also written under the printed name (v1.9.3): ' + res.curVariant.join(', '));
  if((res.reqInherited || []).length) lines.push('  requirements inherited from the data by ' + res.reqInherited.length + ' curated entries (v1.9.1): ' + res.reqInherited.join(', '));
  if((res.costInherited || []).length) lines.push('  cost inherited from the data by ' + res.costInherited.length + ' curated entries (v1.6.14): ' + res.costInherited.join(', '));
  if((res.costMismatch || []).length) lines.push('  ⚠ curated cost DISAGREES with the data (curated wins -- verify against the card): ' + res.costMismatch.join('; '));
  if((res.costX || []).length) lines.push('  ⚠ X-cost cards curated without a cost (not inherited -- model the X in the entry or accept free): ' + res.costX.join(', '));
  if((res.merged || []).length){   // v1.10.0 (spec-card-sweep §4.4): each merged entry with what its curated layer changed
    lines.push('  merged entries (v1.10.0: the curated layer over the compiled entry; src hand, merged, handKeys): ' + res.merged.length);
    res.merged.forEach(m => lines.push('    · ' + m.name + ': ' + (m.changes.join(' · ') || 'no change')));
  }
  if(verbose){
    const freq = {};
    Object.values(out.lib).forEach(e => (e.modes || []).forEach(m => Object.keys((m && m.fx) || {}).forEach(k => freq[k] = (freq[k] || 0) + 1)));   // v1.10.0: a mode without fx (test-cardfx.js forbids it) never throws here
    lines.push('  fx key frequency:');
    Object.entries(freq).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => lines.push('    ' + k.padEnd(11) + v));
    const bare = Object.entries(out.lib).filter(([n, e]) => e.t.includes('action') && !e.modes).slice(0, 8);
    lines.push('  sample fx-less Actions (curation queue candidates):');
    bare.forEach(([n]) => lines.push('    · ' + n));
    /* persistent/lock breakdown — Masters only (today's sweep focus); see the
       standalone sweep-audit file for the full cross-type list to eyeball.    */
    const masters = Object.entries(out.lib).filter(([n, e]) => e.t.includes('master'));
    const persMasters = masters.filter(([n, e]) => e.persistent);
    const lockMasters = masters.filter(([n, e]) => (e.modes || []).some(m => m.lock));
    const passivePersist = persMasters.filter(([n, e]) => !(e.modes || []).some(m => m.lock));
    lines.push('  Masters: ' + masters.length + ' total · ' + persMasters.length + ' persistent · ' +
               lockMasters.length + ' lock-gated · ' + passivePersist.length + ' persistent-but-no-lock (curation queue for phase/actGrant:inplay):');
    passivePersist.slice(0, 10).forEach(([n]) => lines.push('    · ' + n));
    if(passivePersist.length > 10) lines.push('    … + ' + (passivePersist.length - 10) + ' more (see sweep-audit file)');
  }
  return lines.join('\n');
}

/* ---------------- CLI ---------------- */
function parseArgs(argv){
  const o = { vtes: 'vtes.json', curated: 'cardfx-curated.json', out: 'elysium-cardfx.json', report: false };
  for(let i = 0; i < argv.length; i++){
    const a = argv[i], next = () => argv[++i];
    if(a === '--vtes') o.vtes = next();
    else if(a === '--curated') o.curated = next();
    else if(a === '--out') o.out = next();
    else if(a === '--report') o.report = true;
    else if(a === '--help' || a === '-h') o.help = true;
  }
  return o;
}

if(require.main === module){
  const o = parseArgs(process.argv.slice(2));
  if(o.help){
    console.log('usage: node cardfx-compile.js [--vtes vtes.json] [--curated cardfx-curated.json] [--out elysium-cardfx.json] [--report]');
    process.exit(0);
  }
  let cards;
  try{ cards = JSON.parse(fs.readFileSync(o.vtes, 'utf8')); }
  catch(e){ console.error('cannot read ' + o.vtes + ': ' + e.message); process.exit(1); }
  let curated = null;
  try{ curated = JSON.parse(fs.readFileSync(o.curated, 'utf8')); }
  catch(e){ /* overlay is optional */ }
  let res;
  try{ res = compile(cards, curated); }
  catch(e){ if(!e.mergeErrors) throw e; console.error(e.message); console.error('  ✗ nothing written'); process.exit(1); }   // v1.10.0: a merge that fails the compile
  if(res.out.counts.lib > 0 && res.out.counts.libWithFx === 0){
    console.error(report(res, true));
    console.error('  ✗ ZERO library cards got fx — this smells like a data-format change.');
    console.error('    See elysium-cardfx-design.md (Format compatibility) and the client parser field map in SKILLS.md.');
    process.exit(1);
  }
  const text = serialize(res.out), rep = report(res, o.report);   // v1.10.0 (the egress review): everything that can throw comes before the first write -- a failed run leaves no half-written library
  fs.writeFileSync(o.out, text);
  fs.writeFileSync(o.out.replace(/\.json$/, '.js'),                       // v1.6.13 (HB2c-file, 8 Aug): the file:// sibling --
    'globalThis.ELYSIUM_CARDFX = ' + text + ';\n');          // a classic <script> is CORS-exempt on file:// where fetch() is not, so double-click hotseat bots get the full database with zero friction
  console.log(rep);
  console.log('  → ' + o.out + ' (' + fs.statSync(o.out).size + ' bytes)');
}

module.exports = { compile, mergeHand, refTerms, extractFx, segment, libModes, libEntry, cryptEntry, normalizeCard,
                   serialize, report, TITLE_VOTES, TYPE_MAP, DISC_ABBR, discTri, FXC_VERSION };
