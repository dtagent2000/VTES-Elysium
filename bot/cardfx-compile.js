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
   normalizeCard() detects per record (the v5-only `kind` field) and maps
   v5 into the v3-shaped record the pipeline reads — MIRRORING the client's
   parseV3Card/parseV5Card field map (SKILLS.md → "Work with KRCG card
   data"), so client and compiler stay in lockstep on one contract. The two
   v5 unknowns that map noted (cost shape unconfirmed, title unobserved)
   are read defensively and COUNTED in the report so a real v5 file run
   surfaces gaps immediately instead of silently dropping facts.

   Zero dependencies. Dark Pack note: the output carries card NAMES and
   derived gameplay tags only — no rules text, no images. Source data is
   KRCG's vtes.json under Paradox Interactive's Dark Pack terms.
   ========================================================================= */

const fs = require('fs');

const FXC_VERSION = '1.9.0';   // 18 Sep 2026 (late): THE BLOCK BAR + SELF DAMAGE sweep -- `blockBar` ('vampires'|'allies'|'all'|'chosen'|'titled'|'cond') on the 'cannot block THIS ACTION' / 'unblockable' family, `selfDmg` (+ `selfAggr`) on 'this vampire takes N unpreventable ... damage', `selfTorpor` on 'the acting vampire goes to torpor after'; the self-inflicted sentence no longer leaks `aggr` / `torpor` (Daring the Dawn read as an aggravated STRIKER, Day Operation as a torpor SENDER). Before it: 1.8.0 // 18 Sep 2026: the act-again rider (`when: actSuccess|actBlocked|actFailed`) on unlocking action modifiers + `oncePerTurn`. Before it:
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
   plus which format it was. v5 field map per the client's verified parser:
   printed_name+suffix is the identity ("Gratiano"+"G2" → "Gratiano (G2)"),
   card_text→text, crypt clan is singular, library disciplines live in
   discipline_requirement, cost is a defensive {type,amount} read.          */
function normalizeCard(card){
  if(typeof card.kind !== 'string'){
    return { fmt: 'v3', rec: Object.assign({ _crypt: isCryptCard(card) }, card) };
  }
  const crypt = card.kind === 'Crypt';
  const rec = { _crypt: crypt, types: card.types || [] };
  rec._name = card.printed_name || '';
  rec.name = rec._name + (card.suffix ? ' (' + card.suffix + ')' : '');
  rec.name_variants = (card.name_variants || [])
    .map(v => typeof v === 'string' ? v : (v && v.name))
    .filter(v => typeof v === 'string' && v);
  rec.card_text = typeof card.text === 'string' ? card.text : '';
  if(card.capacity !== undefined) rec.capacity = card.capacity;
  rec.disciplines = crypt
    ? (Array.isArray(card.disciplines) ? card.disciplines : [])
    : (card.discipline_requirement && Array.isArray(card.discipline_requirement.disciplines)
        ? card.discipline_requirement.disciplines : []);
  rec.clans = crypt ? (card.clan ? [card.clan] : [])
                    : (Array.isArray(card.clan_requirement) ? card.clan_requirement : []);
  if(card.cost !== undefined && card.cost !== null){
    if(typeof card.cost === 'object' && card.cost.type && card.cost.amount !== undefined){
      if(card.cost.type === 'pool') rec.pool_cost = String(card.cost.amount);
      else if(card.cost.type === 'blood') rec.blood_cost = String(card.cost.amount);
      else rec._costUnknown = true;
    } else rec._costUnknown = true;      // unconfirmed shape — degrade + count, never mislabel
  }
  if(card.group !== undefined) rec.group = String(card.group).replace(/^G/, '');
  if(typeof card.title === 'string' && card.title) rec.title = card.title;
  if(card.banned) rec.banned = card.banned;
  return { fmt: 'v5', rec };
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
  if((m = t.match(/hand strike at \+([0-9]+|X) damage/i))) put('strike', num(m[1]));
  if((m = t.match(/this strike is at \+([0-9]+|X) damage/i))) put('strike', num(m[1]));
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
  if(/not usable on the first round of combat/i.test(c.card_text || '')) req.notFirstRound = true;
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
  if(kwHit('archetype')) e.archetype = true;
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
    else if(/put this card (?:in|into) play|put this card on|stays? in play|remains? in play/i.test(txt)) e.persistent = true;
  }
  const modes = libModes(c.card_text);
  if(modes.length) e.modes = modes;
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
    const rq = (txt.match(/^Requires? [^.\n]+\./im) || [''])[0];
    if(rq && !(e.req && e.req.titles && /^Requires? an? (?:[a-z ]+?)(?:(?:, | or )[a-z ]+)*\.$/i.test(rq) && !/titled|vampire|anarch|sabbat|camarilla|laibon|independent|capacity/i.test(rq))){ e.req = e.req || {}; e.req.unmodelled = true; }
    if(Object.keys(ref).length) e.ref = ref;
  }
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
  });

  const alias = {}, collisions = [];
  const rank = n => {
    const adv = /ADV\)$/.test(n) ? 1 : 0;
    const gm = n.match(/\(G(\d+)/);
    const grp = gm ? parseInt(gm[1], 10) : 0;
    return { adv, grp };
  };
  [...variants.keys()].sort().forEach(k => {
    const cands = [...variants.get(k)];
    if(cands.length > 1){
      collisions.push(k);
      cands.sort((a, b) => {
        const ra = rank(a), rb = rank(b);
        if(ra.adv !== rb.adv) return ra.adv - rb.adv;        // non-ADV first
        if(ra.grp !== rb.grp) return rb.grp - ra.grp;        // newest group first
        return a.localeCompare(b);
      });
    }
    alias[k] = cands[0];
  });

  /* curated overlay — whole-entry replacement, keys should be canonical
     vtes.json names (new names are accepted for house content but flagged
     in the report as possible typos); src is forced to 'hand'.             */
  const curApplied = [], curNew = [], costInherited = [], costMismatch = [], costX = [], reqInherited = [];
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
  const overlay = (dst, entries) => {
    Object.keys(entries || {}).forEach(name => {
      if(name.startsWith('_')) return;                     // _comment keys etc.
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
         Forced Confessional their clan. A clan icon on a MASTER is not a requirement (Hunting Grounds, Warsaw Station),
         so masters never inherit req.clan. */
      if(auto && auto.req && dst === lib){
        const isMaster = (auto.t || []).includes('master'), r = Object.assign({}, e.req || {}), got = [];
        if(r.disc === undefined && auto.req.disc){ r.disc = auto.req.disc; got.push('disc'); }
        if(r.clan === undefined && auto.req.clan && !isMaster){ r.clan = auto.req.clan; got.push('clan'); }
        if(got.length){ e.req = r; reqInherited.push(name + ' ' + got.join('+')); }
      }
      dst[name] = e;
      curApplied.push(name);
    });
  };
  if(curated){
    overlay(lib, curated.lib);
    overlay(crypt, curated.crypt);
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
  return { out, collisions, curApplied, curNew, costUnknown, v5Titles, costInherited, costMismatch, costX, reqInherited };
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
  if((res.reqInherited || []).length) lines.push('  requirements inherited from the data by ' + res.reqInherited.length + ' curated entries (v1.9.1): ' + res.reqInherited.join(', '));
  if((res.costInherited || []).length) lines.push('  cost inherited from the data by ' + res.costInherited.length + ' curated entries (v1.6.14): ' + res.costInherited.join(', '));
  if((res.costMismatch || []).length) lines.push('  ⚠ curated cost DISAGREES with the data (curated wins -- verify against the card): ' + res.costMismatch.join('; '));
  if((res.costX || []).length) lines.push('  ⚠ X-cost cards curated without a cost (not inherited -- model the X in the entry or accept free): ' + res.costX.join(', '));
  if(verbose){
    const freq = {};
    Object.values(out.lib).forEach(e => (e.modes || []).forEach(m => Object.keys(m.fx).forEach(k => freq[k] = (freq[k] || 0) + 1)));
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
  const res = compile(cards, curated);
  if(res.out.counts.lib > 0 && res.out.counts.libWithFx === 0){
    console.error(report(res, true));
    console.error('  ✗ ZERO library cards got fx — this smells like a data-format change.');
    console.error('    See elysium-cardfx-design.md (Format compatibility) and the client parser field map in SKILLS.md.');
    process.exit(1);
  }
  fs.writeFileSync(o.out, serialize(res.out));
  fs.writeFileSync(o.out.replace(/\.json$/, '.js'),                       // v1.6.13 (HB2c-file, 8 Aug): the file:// sibling --
    'globalThis.ELYSIUM_CARDFX = ' + serialize(res.out) + ';\n');          // a classic <script> is CORS-exempt on file:// where fetch() is not, so double-click hotseat bots get the full database with zero friction
  console.log(report(res, o.report));
  console.log('  → ' + o.out + ' (' + fs.statSync(o.out).size + ' bytes)');
}

module.exports = { compile, refTerms, extractFx, segment, libModes, libEntry, cryptEntry, normalizeCard,
                   serialize, report, TITLE_VOTES, TYPE_MAP, DISC_ABBR, discTri, FXC_VERSION };
