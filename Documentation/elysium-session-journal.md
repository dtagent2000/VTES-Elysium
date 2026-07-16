

## Session [v2.6.19 klient / v2.6.14 server] – Duellvyn D1 (11 juli 2026)

**Johan godkände alla fem skissbeslut** ("kör på, vi testar"). Byggt enligt `elysium-duel-design.md`:

- **`#avrDuel`-strip** mellan resolverraden och kortraden, synlig endast i combat-läge. Paneler byggs om per render med färska lyssnare (createElement — aldrig bound-once innerHTML).
- **Anmälan:** avrOpen('combat') med ankrad ready-minion auto-anmäler; ghost-paneler har ⚔ Join (gated på activeAnchor med tooltip); egen panel har ⚔ Swap (när annan minion är markerad) + ✕ leave. Wire: tally `duelCid`/`duelName`, **server-mergad per seat** till `duel`-mappen (överlever räknar-pushar, droppas när mode lämnar combat; joinReply-replay gratis via Object.assign-spridningen). Hotseat: rent lokal map-skrivning.
- **Panelinnehåll:** kortbild via `avRenderCard` (hover-preview för både egna och remote följde med GRATIS), 🩸 blod (+blue/green när >0), tokens-lista, attached-lista, låsglyf. **Egen sida:** blodytan öppnar `openCtStepper` (den kanoniska mutationsvägen — ingen andra väg uppfanns) med självdödande 300ms-poll för live-siffror medan steppern är öppen; egna attached-namn öppnar vanliga `cardMenu` (unattach/flip/preview gratis). **Motståndare:** allt read-only från `net.boards[seat].pub` — sanitizePub bär blood/blue/green/counters/attached/locked per kort (verifierat i källan före bygget — skissens osäkerheter 1–3 avklarade).
- **Vänster/höger:** seat===net.turnSeat ⇒ ACTING vänster, andra BLOCKING höger; extra anmälningar lagras men visas ej.
- **Refresh-hooks:** renderAltIfOpen (board-pushar + Played-händelser) och schedulePush FÖRE inRoom-gaten (hotseat-mutationer täcks) — båda guardade på combat-läge.

**Incidenter:** dispatch-testankaret antog fel radordning (kastade på assert, protokoll-patchen kördes aldrig → lint 4/2 som följdfel) — rätt ankare via grep + cat -A; båda omkörda grönt. Syntax-checken direkt efter klientpatch (vanan från v2.6.18-incidenten) var grön första försöket.

**Gater:** dispatch **18/0** (1c: merge per seat, cid-cap 16, räknar-push bevarar, null-leave, mode-exit droppar) · lint **6/0** · client-logic **29/0** · B1-roundtrip **byte-identisk** · bot **17/0** · check-versions. Omstartshög: srv-2.6.8→14.

**EJ runtime-testat** (nya punkter): *(r)* auto-anmälan vid Combat-öppning med markerad minion; *(s)* Join/Swap/Leave båda sidor, två klienter; *(t)* motståndarens blod tickar live vid deras mutation (pub-push); *(u)* egen blod via steppern uppdaterar panelen live (pollen); *(v)* vänster/höger följer turnSeat; *(w)* reconnect mitt i duell återställer båda panelerna; *(x)* attached-klick: egna öppnar menyn, motståndarens är döda; *(y)* panelbredd vid 1280px (skissens osäkerhet 4 — endast ögonmätt).


## Session [v2.6.20 klient] – Ärlighetsgranskning av duellvyn: cid-kollisionsbugg fixad + TDZ-flytt (11 juli 2026)

Johans "något du är osäker på?" → källgranskning. **Avfärdat grönt:** collectPlayed matar avRenderCard med RÅA pub-objekt i produktion (duellpanelernas remote-rendering vilar på beprövad väg) och hotseat FYLLER net.boards (kommentaren i collectPlayed) — hotseat-duellen fungerar fullt ut, båda paneler. **ÄKTA BUGG hittad+fixad:** kort-id:er är per-klient-sekventiella (`'c'+(++state.seq)`) → motståndarens c12 kolliderar med eget c12; ownership-testet `state.cards.get(cid)` renderade då FEL kort med fulla hanterings-affordances. Fix: ownership är SEAT-baserad (`seat===mySeat()`), aldrig id-uppslag — samma mönster som pub-`target`s {seat,cid}-par. Ny learnings-post. **Förebyggande:** avr/_avrSendT/_avrLastBleed flyttade till tidig deklaration bredvid conv (TDZ-disciplinen — schedulePush/hidePlayedSoon/renderAltIfOpen läser avr.mode och är nåbara från load-restore-vägar). **Kvarstående kosmetiskt (oförändrat, prioriteras efter livetest):** 300ms-pollen bygger om panelen även utan ändring (möjlig bildflicker medan steppern är öppen — dirty-check om det syns); panelsidor kan byta plats om turnSeat ändras mitt i en duell; spectator-ghostknappens tooltip säger "select a minion" fast spectators aldrig kan. Gater: syntax ✓ · client-logic 29/0 · roundtrip byte-identisk · dispatch/lint/bot oförändrade (server orörd) · check-versions.


## Dokument [ingen kodändring] – elysium-bot-spec.md: handoff-spec för botspåret (11 juli 2026)

På Johans begäran: självbärande designspec + status + historik + plan för botarbetet, så en NY chatt
kan fortsätta med full kontext. Innehåll: statussnapshot (bot v0.1.0 / klient v2.6.20 / srv v2.6.14 +
omstartshögen), botens exakta förmågor + CLI (verifierat ur källan), versionsstegen v2.6.16→20 ur
bot-perspektiv med journallänkar, **datadieten** (§12-raderna, tally/say/board/turn-broadcasts med
SAY-listan), **announce≠resolve-tillståndsmaskinen** (bot v0.2:s kärna, pseudokod), v0.2-spec med
testplan, uppdaterad M-stege, och gotcha-listan för färska sessioner (sju-stegs-verbkedjan, pkill-
brackets, waitFor/waitAny, cid-seat-scoping, kommentars-fällan). Bot v0.2 kräver INGA nya verb —
v2.6.20-wiren räcker.


## Session [v2.6.21 klient] – Pool-globe-targeting + Johans beslut 2/4/torpor (11 juli 2026)

**Johans beslut:** damage-räknarna nollas MANUELLT tills vidare — auto-nollning vid rundwrap sparas till en
framtida **dedikerad combat helper** (dit även torpor-badgen och range/press/dodge-hjälpen flyttar; torpor
nås idag via högerklicksmenyn på vampyren). **Tutorialsvepet = nästa steg** ("vi är nog väldigt nära").

**Byggt — pool-globe-targeting (klient-only, NOLL serverändring):** sentinel-cid `'pool'` på befintliga
pub-target-kanalen (överlever sanitizePubs cleanCard+truthy; kan aldrig kollidera med `'c'+seq`).
`setPoolTarget(seat)` → `setRTarget({seat, cid:'pool', name:'pool', who})` — rtRef() ger "WHO's pool"
GRATIS, så loggraden och den frysta bleed-suffixen läser naturligt (`Target: Alice's pool.` — §12
uppdaterad med suffixvarianten). **Meny-raden lades i oppPoolMenuItems** som delas av L4-globen,
Table-panelen OCH L3-ytan → target-UI i alla vyer via EN funktion (toggle Target/Clear).
**Tvåsidiga markeringar** (`refreshPoolTargetMarks`): siktarens crimson-ring på den siktade globen
(samma språk som kort-retikeln) + amber-cue på ägarens egen globe och #dockPool med "targeted by"-title
— matad av targetersOf via pubs (funkar online OCH hotseat). Hooks: refreshRTargetView (siktesändringar,
alla vyer) + refreshOwnTargeted FÖRE early-return (amber-cuen måste även SLÄCKAS när sista siktaren
släpper). Bot-armningsregeln (spec §5): `Target: (.+?)'s pool\.` ⇒ namnmatch, annars prey-default.

**Gater:** syntax ✓ · client-logic 29/0 · roundtrip byte-identisk · lint 6/0 · dispatch/bot oförändrade
(server orörd) · check-versions. **EJ runtime-testat:** *(z)* Target/Clear från globe-menyn i L4 + Table-
panelen + L3; *(å)* crimson-ringen syns hos siktaren, amber hos ägaren, båda släcks vid clear;
*(ä)* bleed-raden får "Target: NAME's pool."-suffixet; *(ö)* hotseat-varianten.


## Session [v2.6.22 klient] – Ärlighetsgranskning av pool-targetingen: title-fixar (11 juli 2026)

Johans "osäker på något?" → tre verifieringar i källan. **Avfärdat:** (A) ingen auto-städning av rtargets
vid board-push existerar — pool-targets överlever pushar (alla rtarget-träffar är render-checks +
manuella clear-vägar); bonus: updateTargetBtn-infon blir "Target: Alice's pool — click to clear"
naturligt. (C) alla refreshOwnTargeted-anrop är runtime-inuti funktioner → ingen TDZ-risk för
l4Globes-referensen. **Äkta fynd (B), fixade:** `#dockPool` har originaltitle ("Scroll to adjust ·
click +/−") som v2.6.21 clobbrade med tom sträng för alltid efter första siktet — nu sparas originalet
i `dataset.t0` en gång och återställs vid clear; globe-tooltipen låg kvar stale efter clear — nu
`removeAttribute('title')` i else-grenen (globen bär ingen egen title, så removal = pristine).
**Känd scope-avgränsning (dokumenterad, ej bugg):** crimson-ringen renderas på L4-globerna + amber
på egen globe/dock — L2/L3 får meny + loggrad men ingen ring ännu (framtida vy-audit om behov uppstår
i livetest). Gater: syntax ✓ · client-logic 29/0 · roundtrip byte-identisk · lint 6/0 · check-versions.


## Session [v2.6.23 klient] – Pool-targets auto-rensas vid action-resolve (Johans beslut, 11 juli 2026)

**Johan valde förslaget:** pool-siktet är per-action och rensas när stacken resolvar (kort-targets förblir
sticky — pågående fiendskapsmarkörer). **Ordningsfälla fångad vid implementationen:** actBleed kör
resolvePlayedActions() FÖRE sin loggrad (stänger föregående batch) — en naiv ovillkorlig rensning där
hade ätit det färska siktet INNAN bleed-raden hann använda det. Lösning: **used-flaggan**
`_poolTargetUsed` — sätts av targetSuffix när en av MINA loggrader bär pool-suffixet, nollas av
setPoolTarget (färskt sikte = oanvänt), konsumeras i resolvePlayedActions (rensar siktet endast då).
Konsekvenser: (a) färskt sikte överlever ANDRAS resolves tills det använts; (b) deflection-flödet
påverkas inte (re-announce sker mitt i SAMMA action — batchen stängs inte av block); (c) boten kan
aldrig fel-arma på kvarglömda sikten över actions (bot-spec uppdaterad). Deklarationen ligger i det
tidiga avr-blocket (TDZ-disciplinen). Gater: syntax ✓ · client-logic 29/0 · roundtrip byte-identisk ·
lint 6/0 · check-versions. **EJ runtime-testat:** *(aa)* sikta→Bleed→suffix på raden→'It resolves'→
ring+sikte borta; *(ab)* färskt sikte överlever annans resolve; *(ac)* deflection-kedjan: re-announce
med nytt sikte mitt i actionen, rensas först vid slutresolven.


## Session [v2.6.24 klient / v2.6.15 server] – Resolvarna blir table-helpers (Johans förslag, 11 juli 2026)

**Johans design:** de tre räknarna är Helpers i Settings — enskilda toggles för Block/Vote/Combat som
stängs av i Tournament mode, host-låsbara online, och fungerar som PARAPLYER för framtida kopplade
hjälpare (combat helper-familjen samlas under resCombat). "Hålla L4 rent om spelarna vill."

**Implementation — husets helper-system rakt av:** tre nya nycklar i HELPER_DEFS (`resBlock`/`resVote`/
`resCombat`, default PÅ) + tre label-rader i Settings + spegling i serverns HELPER_KEYS-whitelist
(srv-2.6.15, en rad — utan den hade policy-låsta bord tvingat AV resolvarna även när hosten ville ha
dem på, eftersom hx() läser p.settings[key]→undefined vid !allowLocal). Därmed GRATIS: lokal toggle,
lokalt tournament-off, online-policyns tournament/lås/host-propagering, localStorage-persistens och
Settings-UI-sync — allt via befintliga hx()/applyHelper/syncHelperUI.

**Gates i resolver-koden:** knapparna döljs per helper; live-räknarna VISAS INTE för en spelare som
håller helpern av även om bordet kör läget (rent L4 — state trackas tyst i avr, på-slag visar direkt);
ingen auto-pin för avstängda; peek-hållningen släpper; duellvyn rider resCombat; avrOpen belt-gated.
⇄ Pass-knappen är MEDVETET kvar alltid — den är kommunikation (say-genväg, botens grammatik), ingen
hjälpare. **EN hook-punkt:** applyHelper() → avrRender() — alla vägar (toggle, policy-mottag,
tournament-växling, join/leave, Classic-lägets auto-tournament) går redan genom den; load-time-anropet
är säkert (avr deklareras före net, null-guards täcker).

**Gater:** syntax ✓ · client-logic 29/0 · dispatch 18/0 · lint 6/0 · B1-roundtrip byte-identisk ·
bot 17/0 · check-versions. Omstartshög: srv-2.6.8→15. **EJ runtime-testat:** *(ad)* toggla av Vote →
knappen borta, remote-öppnad vote osynlig + ingen pin, på-slag visar löpande ställning; *(ae)* lokal
tournament → alla tre borta men Pass kvar; *(af)* online: host låser policy med resolvers AV/PÅ →
följer hos alla; *(ag)* Classic-läget (auto-tournament) gömmer resolverraden.


## Session [v2.6.25 klient] – Structured II: Table helpers-tutorialen (Johans "del 2", 11 juli 2026)

**Ny sektion `structured-helpers`** — "Structured II — Table helpers", 20 steg (id-prefix sh-). Placering
enligt Johans beslut: del 2 i Structured-spåret, INTE basics (cp-bleeds submeny-uppdatering räckte där).
Registrerad i TUT_ORDER (efter structured-intro) + TUT_ADVANCED → launcher (prefix-matchen 'structured'),
kapitel-persistens (tutClassicKeys prefix-matchar redan) och picker-listning kom GRATIS; v2.5.91-principen
bevarad (aldrig auto-kedjning — del 1:s si-outro fick i stället en mjuk textpekare till del 2).

**Kapitelbågen:** komprimerad del-1-setup (lobby med förifyllt Structured + tournament-off, Fill, Start) →
helper-familjen (gate: hx ×3 — lär tournament/host-lås-konceptet genom att KRÄVA påslagna helpers) →
peeken + ⇄ Pass som reaktionsspråk → minion-steget (ärlig tutorial-genväg: dra crypt direkt till Ready) →
Block (selection-gate, idiom, resolve-raden + batch-ÖPPEN-poängen + Settings-frågan) → Vote (guld,
batch-STÄNGER + Resolver Resolve-settingen) → Combat (rött, 7-stegs-stepparen, R-räknaren, manuell
nollning) → duellvyn (Join-gate på avr.duel[mySeat()], own/opponent-auktoriteten) → pool-targeting
(hands-on: gate på rtarget.cid==='pool' — 5-spelarbordet ger riktiga motståndare!) → +X-idiomet (gate
_avrLastBleed≥2, auto-clear-poängen) → Pass-steget (predicate på tut._lastSaidIdx) → outro (tournament
gömmer allt — rent L4) → leave. **En motor-hook:** tutNotify('resolver-resolve', mode) i avrResolve —
tre steg advancar på eventet. **helpActionFlow-hjälptexten** uppdaterad: Vote/Combat Resolve är nya
batch-stängare (v2.6.17-beteendet stod odokumenterat där).

**Test:** tutNextReady-sviten utökad (structured-intro ↛ II, II ↛ online-join) — grön by design tack
vare TUT_ADVANCED. **Gater:** syntax ✓ · client-logic 29/0 · roundtrip byte-identisk · lint 6/0 ·
check-versions. **EJ runtime-testat:** *(ah)* hela kapitlet start-till-leave i webbläsare; *(ai)* gaterna
släpper i rätt ordning (särskilt sh-helpers om tournament råkar vara på); *(aj)* event-advancen på
resolver-resolve ×3; *(ak)* del 1:s outro-pekare + pickerns numrering. **Kvar av svepet:** host-guide/
README-omnämnanden (build-host-guide.js — egen yta, se backlog).


## Session [v2.6.26 klient] – Förtest-granskning av Structured II: predicate-fixen (11 juli 2026)

Johans "osäker innan jag testar?" → fyra verifieringar. **KRITISKT FEL FÅNGAT:** motorns predicate-fält
heter `test:` (dokumenterat i schemakommentaren ovanför TUT_SECTIONS + pollas på tutTick) — v2.6.25
gissade `check:` → fyra steg (sh-block-open/vote/combat/pass) hade FASTNAT för evigt (tut.pred=null,
tyst). Fixat ×4 + ny learnings-post (schemakommentarer läses FÖRE exempel-steg). **Verifierat grönt:**
saySend sätter `tut._lastSaidIdx` FÖRE tutNotify('said') → sh-pass-predicaten håller; event-match är en
valfri FUNKTION → mina name-only-events rätt; gates pollas på samma tick. **Två UX-fynd fixade:**
(a) hover-peeken kan stänga mellan steg → pinPlayed() i onEnter på sh-block-open + sh-pass (höjdpunkts-
ringen får aldrig peka på osynlig knapp); (b) sh-plusx-gaten var för lös (Bleed 3 ensam passerade utan
+X) → ny breadcrumb tutNotify('bleed-add') i actBleedAdd + event-advance på riktiga händelsen.
Gater: syntax ✓ · client-logic 29/0 · roundtrip byte-identisk · lint 6/0 · check-versions.


## Session [v2.6.27 klient] – Sista förtest-svepet: Structured-viabilitet verifierad + genvägstext (11 juli 2026)

Johans "något mer?" → två potentiella KAPITELDÖDARE verifierade gröna i källan: (A) playedTab har inga
per-vy/boardMode-toggles — global chrome, kapitlet lever i Structured ✓; (B) z-stacken är trygg —
#playedOverlay 759 mot tutoriallagrets 100000/100002, bubblan+highlighten svävar över resolverraden ✓.
**Äkta textdefekt fixad:** sh-minions genväg sa "drag a crypt card straight into your Ready zone" —
man drar inte från PILEN; nu: "click your crypt pile to draw, then drag the card from Uncontrolled into
your Ready zone". Gater: syntax ✓ · 29/0 · roundtrip byte-identisk · lint 6/0 · check-versions.
Designytan + koden är nu genomlyst från alla håll denna session — återstående risk är RUNTIME:
Johans genomspelning (ah–ak) + livetestet (a–ag) äger nästa ord.


## Session [bot-spår, ingen klient/serverändring] – Cardfx-biblioteket v1: den delade korteffekt-databasen (12 juli 2026)

**Johans beslut:** botspåret får ett DELAT, maskinläsbart korteffekt-bibliotek kompilerat ur hela
vtes.json — i stället för specens per-playbook-taggar. Fakta (vad ett kort GÖR) i biblioteket;
policy (NÄR en bot spelar det) i playbooks/personligheter. **Uttalat mål: FYRA väl spelande bottar
som fyller ett 5-mannabord** — olika lekar OCH temperament på samma bibliotek. Motiverande exempel:
Inside Dirt / superior Shroud of Decay gör pool-skada utan att vara bleeds — wiren bär bara kortNAMNET
(pubs/fx), så namn→fx-uppslag är det sandbox-nativa sättet att väga en block korrekt.

**Byggt (fyra nya artefakter + design-doc):** `cardfx-compile.js` v1.0.0 (zero-dep kompilator),
`cardfx-curated.json` (hand-tier-överlägg, frö: sampleleken masters + Inside Dirt — allt verifierat
mot tryckt card_text), `elysium-cardfx.json` (fxv 1: **2364 lib / 1785 crypt / 2422 alias, 62 % auto-fx**,
~630 KB, en rad per kort för diffbara regenereringar), `test-cardfx.js` (**31/0**, run-gate-familjen,
inkl. driftvakt: skeppad artefakt == färsk kompilering) och `elysium-cardfx-design.md` (schema,
tre kvalitetsnivåer auto/hand/playbook, konsumentkontrakt, ärliga gränser, TWDA-kurationskö).
`elysium-bot-spec.md` §1/§5/§6(h)/§7 uppdaterad — own-deck-only-beslutet SUPERSEDED med pekare hit.

**Datafynd som styrde designen:** (a) KRCG:s "As above"-idiom i **372 kort** — naiv per-rad-extraktion
svälter superior-lägen; löst med ärv-närmast-samma-trigram + egen-extraktion-skriver-över (Deflection
ärver bounce; Lost in Crowds "but for +2" överskriver). (b) Vampyrnamn bär gruppsuffix ("Zip (G3)");
77 äkta alias-kollisioner (ADV-versioner + multi-grupp-nytryck) — löst med deterministisk stege:
icke-ADV vinner, sedan HÖGSTA gruppen (nyaste trycket); rapporterat, inte tyst. (c) Typ-brackets
([ACTION MODIFIER]/[COMBAT]) på multityp-kort → `use`-fält per mode. (d) Riktad pool-skada kräver
"from your prey / of their pool / they burn"-formerna — självkostnader ("burn 1 pool to …") får ALDRIG
läsas som hot (gaten asserterar båda riktningarna: Emergency Preparations/Aversion NEJ, Enticement JA).
(e) Mid-line-brackets (~126 rader) + strandade token-chunks — token-carry-fix fångad under bygget
(Swallowed by the Night tappade sitt [obf] innan fixen).

**Gater:** cardfx **31/0** · bot-sviten **17/0 KÖRD I SANDBOXEN** (loopback fungerade!) · `node --check`
på båda nya JS-filerna · curated-JSON parsad. Klient/server ORÖRDA — ingen omstart, inga bumps;
omstartshögen srv-2.6.8→15 står kvar sedan tidigare.

**EJ verifierat / nästa:** auto-tierns brus utanför gate-korten är per definition ostickprovat i stort —
rapportens "fx-less Actions"-lista är stående kurationskö; TWDA-frekvenspasset (design-doc §8) är
nästa kurationssteg; bot v0.2 (spec §6) konsumerar biblioteket: (h) omskrivet till alias-uppslag för
egen hand + crypt-caps + hotläsning. Johans livetester a–ag (+ ah–ak) äger fortfarande nästa ord.


## Session [bot-spår, del 2] – Cardfx v1.1.0: v3/v5-formatnormaliseringen (12 juli 2026)

**Johans fråga** ("filen är nog KRCG V3, funkar den?") → utredning: klientens v2.5.87-parser är facit
(krcg-api v4 = "v5"-JSON, live på v4.api.krcg.org; detekteras per kort via `kind`-fältet), och
static.krcg.org:s egen dokumentation bekräftar att den skarpa filen fortfarande är V3 — **så ja, filen
är aktuell**. Men fältnamnen för exakt det vi behöver (text + discipliner) är det som byter namn i v5,
så kompilatorn fick `normalizeCard()` som SPEGLAR klientens parseV3Card/parseV5Card (ETT kontrakt,
två implementationer i lockstep; fältkartan i SKILLS.md är verifierad mot riktiga v4-svar).
printed_name+suffix → kanoniskt namn; card_text→text; crypt-clan singulär / lib clan_requirement;
lib-discipliner i discipline_requirement; group "G3"→"3". **De två v5-okända** (cost-formen, title):
defensiva läsningar + rapporträknare ("v5 defensive reads") — degradera och räkna, aldrig fel-etikettera.
CLI vägrar dessutom skriva en artefakt där NOLL bibliotekskort fick fx (format-flip-tellen).

**Sidofynd med fix:** v3:s disciplin-fullnamnsquirk är i DENNA filgeneration bara `FLIGHT` (9 lib-kort,
versal; `oblivion` redan lagat uppströms till 'obl') — men `discTri()` med klient-identiska DISC_ABBR
viker nu fullnamn → trigram så req.disc/disc.all talar ETT vokabulär (framtidssäkring; 'flight' saknar
trigram och består). **Gaten 31→39/0:** v5-fixtures = RIKTIGA v3-kort transformerade per den verifierade
fältkartan, asserterade entry-identiska mot sina v3-original; alias-rekonstruktion; mixed-list-fallet
(cache-vs-färskt); defensiv cost; quirk-vikningen åt båda håll. Artefakten omkompilerad (v1.1.0,
counts.formats i headern). **Ärlig etikett:** fixtures är syntetiska till FORMEN (verkligt innehåll) —
körningen mot en riktig v5-FIL återstår hos Johan den dag KRCG flippar; räknarna gör den körningen
självreviderande. Design-doc §10, learnings-post, SKILLS-recepttillägg.


## Beslut [inga kodändringar] – Botens bordskonfiguration: Structured + resolvers, degraderingsstege (12 juli 2026)

Johans fråga ("borde bottar bindas till L2+L3?") → källverifierad analys: boten har inga ögon —
vyerna är per-klient-rendering och rör aldrig wiren; den äkta axeln är HELPERS på/av. Kedjan som
gör Johans instinkt rätt i praktiken: `syncOffTournament()` (Classic → tournament PÅ) + lobbyn
hård-sätter tournament för Classic → `hx()` släcker resolvarna → tally-referendum, §12-resolve-
raderna och duellkartan (v0.2:s informerade diet) försvinner. Överlever överallt (o-gatade
menyvägar, verifierat): bleeds-for/+X-raderna, fx-verb-kloner, say-fraserna (⇄ Pass medvetet
alltid), chat-grammatiken, botens egna turer (drawCrypt-fallet sedan v0.1). **Beslut: supported
config = Structured + tournament av + resolvers på; ingen hårdlåsning — kapabilitetsdetektering
genom observation** (tally-trafik ⇒ informerat läge, tystnad ⇒ PJ-tröskelblocks; classic i
join-svaret ⇒ EN artig rekommendationsrad). Ett bygge, en degraderingsstege — Classic-dummy
gratis. Bot-spec §5 (nytt stycke) + §6(d) uppdaterade; implementeras i v0.2.

**Spatial uppföljning (Johans fråga om pool-glob + kortplacering, källverifierad):** människor KAN
inte flytta botens glob i L4 (motståndarglober är read-only; positionen är ägar-auktoritativ via
pub-tokenen `{type:'pool',x,y}` som `updateL4Opponents` läser; utan token gäller `renderL4Globes`
default-cirkel per seat-vinkel). Motståndarkort renderas på råa pub-koordinater på den delade filten
(`renderL4OppCards` → `pubXform`) — botens fasta GEO-grid sätter sig i vänsterbandet oavsett glob,
och FYRA bottar hade staplats på identiska koordinater. Fix: **seat-ankrat läger** helt i boten
(~20 rader, noll wire/klient/server): per-seat hemankare (globcirkelns vinkelmatte mot kanten),
exportera pool-tokenen där, offsetta GEO-gridet runt den. Spec §5-not + §6(i); verifiera att
buildMat ignorerar type:'pool' (TOKEN_DEFS-guarden) innan skepp. I Structured är allt en no-op —
pubben ÄR botens eget bräde där, ingen mänsklig kooperation behövs.


## Ärlighetsgranskning [inför v0.2] – Namnupplösningsluckan hittad + scoping-beslut (12 juli 2026)

Johans "redo / osäker på något?" → källgranskning. **ÄKTA LUCKA:** pub-kortnamn är RÅ decklist-text
— `parseDeck` kanoniserar aldrig ("Pentex(TM) Subversion", diakritik, skiljetecken; endast crypt-radens
kapacitetssiffra strippas) — medan cardfx-aliasen är lowercase-exakta. Klientens beprövade kontrakt är
`norm()` (™→'tm', NFD-diakritikstrip, gemener, strip icke-alfanumeriskt). **Fix (v0.2-leverabel, spec
§6(h) + design-doc §4):** tre-nivåstege exact → lowercase-alias → load-time norm-index med klient-
identisk norm() — ETT kontrakt i lockstep, samma disciplin som normalizeCard↔parseV5Card. **Bekräftat
grönt i samma svep:** perceptionstriggern för hotläsning = pub-diff (speglar collectPlayeds baseline-
idé; spelrader är INTE §12-frysta och parsas aldrig för semantik, fx-verb är berikning); testteatern
håller (harnesset kan skicka råa log/say/tally-verb — inga nya wire-behov); sampleleken har FULL
cardfx-täckning för egen hand (9/9 via auto+kurerat). **Scoping-beslut:** v0.2 = perception (a–g) +
cardfx-stegen (h) + bordsmodell + kapabilitetsdetektering + utvärderaren som REN SÖM med första enkla
scorern; fulla personlighetsvikterna + arketyp-playbooks = v0.3/M1.5 — hellre solid socket än forcerad
hjärna. Riskregister oförändrat: Johans livetester a–ag (frysta §12 skyddar botkontraktet), buildMat-
guarden före lägret, riktig v5-fil när KRCG flippar.


## Bot v0.2.0 [inga klient/server-ändringar] – Perception, pending-maskinen, multikanal, cardfx-stegen, lägret (12 juli 2026)

**Levererat (spec §6 a–i + decide()-sömmen), gate `test-bot-logic.js` 33/0 mot riktiga servern:**
pending-bleed-maskinen (announce ≠ resolve; apply ENDAST på aktörens 'It resolves'; +X öppnar
fönstret igen; block-succeeds avbryter; ny announce superseder; turbyte kasserar stale med artig
not — aldrig auto-apply av gammal skada); §12-radparsning (bleed/add/block/vote/combat över
strippad log-relä); symmetriska reaktionsfönstret ('Hold on…' → 'Pass'; som aktör besvaras
Block?-asken av chat OCH say-fraser OCH en live §12 Block-resolverad — 'Hold on…' pausar klockan
per tänkare, ⇄ Pass från prey stänger); §12-frysta announces på log-verbet; bordsmodell (per-seat
pubs, seat-scopade seen-sets, hotläsning via cardfx); READ-ONLY tally-spegel + kapabilitets-
detektering genom observation (classic i join ⇒ EN artig tipsrad); tre-nivåstegen (exact →
lowercase-alias → klient-identisk norm(), 6551 norm-nycklar; krypt-cap ur biblioteket, playbook-cap
= override — gatetestet: cap-lös 'zip' → Zip (G3) cap 2); seat-ankrade L4-lägret (pool-token-export
+ läger-relativa slots, endast classic — buildMat-guarden verifierad i källa innan skepp);
decide()-sömmen med persona-rattar (socket nu, hjärna v0.3); **pacad sändkö** (send() dränerar
genom rullande 10s-fönster, tak 70, 30ms-gap).

**Tre fynd på vägen:** (1) hårdkodade absoluta pool-asserts föll — influence SPENDERAR pool under
turerna, så resolutions-asserts måste vara relativa (regex-capture av ackens Pool-värde);
(2) servern **stänger anslutningen** vid RATE_N-överträdelse (80 msg/10s) — boten på paceMs 0
sprutade ~20 msg/s i burst och åkte ut ⇒ pacern är produktionsriktig, inte testfix; (3) cursor-
ordningsfälla i sviten: turn-broadcasten föregår botens stale-not i inkorgen — väntar man på noten
FÖRST konsumerar cursorn förbi turn-meddelandet (vänta i kausal ankomstordning). §5-förfining
dokumenterad i specen: say-'Block!' sätter contested-flagga i stället för clear (clear hade tyst
ätit failed-block-then-resolves-bleeds; contested auto-appliceras aldrig — grammatiken är
säkerhetsventilen). Övriga gater: test-cardfx 39/0, check-versions "everything agrees"
(klient v2.6.27 / server v2.6.15 ORÖRDA). Johans livetester äger fortfarande sista ordet.


## Designnot [inga kodändringar] – `insight`-ratten: handläsning, aldrig handkunskap (12 juli 2026)

Johans idé (bottar med 0–100% chans att "veta" motståndarhänder som svårighetsgrad) →
källverifierat: händer går ALDRIG över wiren (`sanitizePub` reläar bara `counts.hand`; även
leknamnet strippas mot motståndare), så bokstavlig kunskap kräver privilegierad bot-kanal =
arkitektoniskt fusk + "ibland synsk"-spel som människor genomskådar. **Omformulering inbakad i
spec §7:** ratten blir `persona.insight` (0.0–1.0) som skalar KVALITETEN på en ärlig LÄSNING —
inferens över lagliga signaler (kryptors discipliner via cardfx, spelade kort ur v0.2:s
bordsmodell, hand/hög-counts, §12-beteende: en `+2 bleed` BEVISAR Conditioning-klass; en sedd
Deflection säger "leken kör bounce") → sannolikhetsfördelning över beslutskategorier (bounce/
wake/intercept/stealth/prevent/vote) = cardfx fx-taggarna. Novice 0.1 / Grinder 0.5 / Shark 0.9.
Landar som input i decide()-sömmen = v0.3-material; TWDA-priors skärper läsningen långsiktigt.
Bokstavligt öppen info (tränings-/debugbord) = ev. framtida SYMMETRISK opt-in-rumspolicy för
alla, aldrig bot-bakdörr.


## Bot v0.3.0 [inga klient/server-ändringar] – Personas, insight-läsningen, kortspel, kö-koalescerad push (12 juli 2026)

**Levererat (gate 39/0 ×3 raka mot riktiga servern):** namngivna personas (`--persona
novice|grinder|shark`; aggression/blockShy/insight); **insight-handläsningen** per spec §7 —
kategorier (bounce/stealth/intercept/votes) ur cardfx fx-taggar, observationer från face-up
fx-play-kloner OCH pub-diff-hot, `readP(seat,cat)` = min(0.9, (0.15+0.25·sedda)·handskala);
**decide() v2** med riktig scoring: vanlig bleed vs bleed-ACTIONKORT ur handen (Computer Hacking
→ bleeds for 2, §12-fryst rad på valt belopp, drawback efter resolution) och `spend-stealth`
(aggr·(1−insight·P(int))≥0.5) när say-'Block!' möter botens aktion — stealthkortet spelas
(loggat, hand spenderas, dras tillbaka), asken hålls ÖPPEN och bordets §12 Block-rad / prey-Pass
avgör; chat-grammatikens 'block' förblir TRUBBIG alltid-combat-kanal by design; aktörssidans
'block fails' av-contestar + omstartar askklockan. Testsektioner 10 (offline-enheter: readP-matte
+ novice-spends/shark-saves-separationen) och 11 (wire: Basil obf-weenie, valt kort → for 2,
stealth mot Block!, hand tillbaka på 7).

**Debug-sagan (tre lärdomar):** (1) v0.3:s extra sändningar (kortspel+draws+drew-pushar) mättade
pacerns 70/10s-fönster på paceMs 0 → **flaky timeouts på OLIKA ställen varje körning** — den
signaturen är mättnadssymptom, inte logikfel; (2) första fixen (timer-debouncad push à la
schedulePush) OMORDNADE wiren (chat före board) → självförvållad cursor-fälla i sviten →
REVERTERAD; (3) rätt design: **kö-koalescerad push** — ordningsbevarande platshållare i den
pacade kön som materialiserar FÄRSKASTE pubben vid drain (burstar kollapsar, kausal ordning
håller) + paceMs 60 i huvudsvitens bot. Även: partiell patch-krasch fångad före skrivning →
byte-verifierade ankare per lärdomsregeln (8-space-indenterad pass-send; 6-space-substrängen
hade träffat fel). Gater: bot 39/0 ×3, cardfx 39/0, check-versions "everything agrees"
(klient v2.6.27 / server v2.6.15 ORÖRDA). Livetester: Johans lista äger sista ordet; M2
(försvarsblock/combat) och masters/attachments (v0.4) återstår.


## Bot-verktyg [inga klient/server-ändringar] – Bordslaunchern, START-HERE-BOTS, författarpipelinen (12 juli 2026)

**Johans slutmål journalfört (spec §7 "The authoring pipeline"):** en framtida modellsession ska
själv kunna SKAPA bottar, TESTA/UTVÄRDERA dem och underhålla både cardfx-taggning/terminologi och
botarnas egna regler — allt navigerbart från levande dokument + deterministiska gater. Statusen:
playbooks/personas KLART, cardfx-utbyggnad KLART (kompilator+kurerat+gate), botregler KLART
(spec+§12+39/0-nätet); NÄSTA PINNE: `elysium-bot-arena.js` — headless match-runner (server + N
bottar, spela till sist-stående, rapportera vinster/turer/poolskada per persona).

**Levererat:** `elysium-bot-table.js` v1.0.0 — bemannar ett helt bord i ETT kommando
(persona-rotation shark/grinder/novice, valfria namn, staggered joins 600ms, en process, SIGINT
städar; max 4). **Smoke-bevisat live: bot-mot-bot-loopen STÄNGER helt själv** — Shark valde
Computer Hacking, "bleeds Novice for 2." på frysta raden, Novices pending-maskin armade, Hold
on…/Pass, Sharks It resolves, "Novice takes the bleed for 2. Pool: 25." (27−2; influence hade
spenderat 3). Arena-förutsättningen är därmed verifierad — arenan blir orkestrering + statistik.
Smokens egen bugg var dagens lärdom i repris: cursor-lös waitFor matchade start-turnens seat-1
→ pass under fel tur → pass-guarden åt den; cursor in, grönt. **`START-HERE-BOTS.html`** —
spelarvänd guide i START-HERE-estetiken: quick start (en bot), launchern (helt bord),
persona-tabellen, bordskonfigen (Structured+resolvers; Classic degraderar artigt), chat-
grammatiken + say-fraserna, människor+bottar-mixen (tunnel-wss för människor, ws i "källaren"
för bottar — wsConnect är medvetet ws-only), not-yet-listan (M2/masters/votes) och **livetest-
checklistan 1–12 för detta stadium**. Backlog: arena-raden tillagd. Gater orörda gröna;
klient/server ORÖRDA.

**Ärlighetsgranskning inför livetest (v0.3.1):** Johans "osäker på?"-fråga fångade något verkligt
för femte gången — botens dispatch var O-skyddad (`if(h) h(m)`); ett kastat handlerfel hade dödat
launcher-processen med HELA bordet. Fix: try/catch + logg per meddelande (v0.3.1, 39/0 grönt).
Källverifierat grönt i samma svep: cardRefCap ger rent namn efter tagg-strip; pool-siktet sätter
`name:'pool'` (rad 3472) → §12-formen `Target: WHO's pool.` matchar botens poolTargetName exakt
(Deflection-armeringen håller mot riktiga klienten). Tre livespelsflaggor journalförda: (a)
stealth-svaret triggar endast på say-'Block!' — tyst resolveröppning ⇒ boten hör bara verdiktraden,
och den bumpar ALDRIG resolverns räknare (tally read-only by design; bordet speglar dess +1); (b)
ask-timeouten pausas bara av 'Hold on…' — rekommendera --ask-secs 45 för lugnt spel; (c) största
okända: inget är ännu sett med riktiga klientens ÖGON (pub-rendering, L4-lägret visuellt) — därav
checklistan. Backlog: Johans riktning "fyra fokuserade arketyper med olika utmaningar" noterad
(parkerad tills masters v0.4 + M2 breddar repertoaren).


## Strategisk granskning [bot v0.3.2] – Unikhetsregeln fixad + fyra blinda fläckar backloggade (12 juli 2026)

Johans "har jag missat något?" → **regelnivåfynd, fixat direkt (v0.3.2):** boten reste DUBBLETTER
av unika vampyrer (smoken visade tre Lisa Noble i spel — Anarch Convert är non-unique på riktigt,
Lisa/Zip är det inte). Influence filtrerar nu bort namn som redan är i spel (ready/torpor);
playbook-dubbletter förblir dragredundans; cross-player-kontester är bordets sak. Suite 39/0 +
multi-bot-smoke grönt (smokens egen version-pinnade greeting-regex fick också en läxa: \d+).
**Fyra strategiska luckor → backloggen:** (1) §12-kontraktcanary — bot↔klient-kopplingen är
disciplin, inte gate; en klientordalydelseändring bryter boten TYST; (2) arenans DATALAGER —
decide():s why-strängar måste persistera som JSONL-traces + givar/drag loggas för reproducerbarhet,
annars är persona-tuning vibbar och en framtida modell kan inte "utvärdera"; (3) vote-artighet —
en "abstains (0 votes)" per referendum så bordet aldrig väntar; (4) långspelsbågen — ingen
hunting/rescue/poolinkomst, handen ratchetar mot döda masters (spel tar icke-masters, drag ger 20%
masters som aldrig lämnar) → boten bleknar runt tur 8–10; medvetet OK för sparring men viktigt vid
arenastatistik-läsning; v0.4 är botemedlet. Rekommendation för människoläsbart livespel: --pace
1500–2500 (default 900 rattlar förbi).


## Regelefterlevnadslagret [cardfx v1.2.0 + bot v0.3.3] – Unique/Limited-taggar, per-action-ledger, Edgen + rooms-store-sagan (12 juli 2026)

**Regelboken källverifierad (vekn.net):** same-named action modifier/reaction max EN gång per
ACTION; same-named actionkort max en gång per minion och TUR ("even if they unlock"); bleed- och
politiska aktioner räknas som samma aktion (en/minion/tur); och **Limited är exakt definierad**:
en +bleed-modifierare får inte spelas om en annan redan ökar blödningen — korten bär "(limited)"-
påminnelsetexten ⇒ ren texttagg. **cardfx v1.2.0:** `unique` (lib: ledande "Unique"-templating,
352 kort; crypt: `unique:false` för de FEM äkta non-uniques — Aabbt Kindred, Fida'i, Grotesque,
The Horde, Valkyrie) + `limited` ("(limited)", 75 lib + 9 crypt inkl. Blur och kryptors inherenta
förmågor à la Juggler). Gate 45/0. **Självkorrigering på protokoll:** Anarch Convert är UNIK
(extrakopiorna är remove-from-game-bränsle för förmågan) — tidigare sessionpåstående var fel,
kortdatat avgjorde. **Bot v0.3.3 (gate 43/0 ×3):** tag-aware kryptunikhet, `_mayPlay`-vakten
(unika bibliotekskort startas aldrig när namnet är i spel någonstans — norm-jämfört över egen
bräda + alla pubs; boten SKAPAR aldrig en contest, att döma en förblir bordets sak), per-action
`played`-ledger för modifierare (stealth-vägen), **Edgen** (sätts på genomgången bleed i pubben,
lämnas när annan seat visar den / när bleed landar på boten). Once-per-turn-reglerna är
STRUKTURELLA idag (en aktion/minion/tur) — invariant dokumenterad inför framtida unlock-effekter.

**Felsökningssagan (två falska spår, en rotorsak):** (1) "dubbletter agerar!" var cross-turn-grep
— samma minion nästa tur, lagligt; (2) vandrande timeouts → paceMs 60→120; (3) SEDAN 0/1 tvärt
på ren processtabell: **serverns store är `__dirname`-förankrad** (`elysium-rooms.json`, snapshot
var 60s) — svitens mkdtemp-cwd-isolering besegrades tyst; dagens maraton nådde exakt MAX_ROOMS=50
⇒ varje create nekades bordsbrett ("The server is full"). Fix i grunden: **sviten (och smoken)
KOPIERAR servern in i tmp-katalogen och spawnar kopian** ⇒ __dirname = tmp; Johans riktiga
rumsfil rörs aldrig av tester igen. Städat + verifierat: 43/0 ×3, smoke OK, arbetskatalogens
store förblir orörd efter körning.


## Ärlighetsgranskning [bot v0.3.4] – Edge-flanken + kurerade fakta-fälten verifierade (12 juli 2026)

Sjätte "osäker på?"-rundan. **Avblåst fara:** kurerade poster BEHÅLLER faktafälten (t/unique/
limited) — kompilatorn mergar, och Dreams of the Sphinx fick korrekt `unique:true` genom kurerade
vägen (sampleleken med Dreams ×2 blir därmed rätt hanterad när masters landar i v0.4). **Två äkta
fynd, fixade (v0.3.4):** (B) Edge-yielden triggade på VARJE motståndar-pub som bar edge — även
stale pubbar där en människa glömt släppa token, så botens färska claim flimrade bort; nu yield
endast på STIGANDE flank (false→true-övergång per seat, jämförd mot föregående pub i
bordsmodellen innan överskrivning). (C) Oustad bot annonserade edge i sista pushen — nu släpps
den vid oust (regelboken: Edgen lämnar spel med sin innehavare). Kvarstående kända brus,
dokumenterat: unique-taggens ledande-regex kan missa enstaka udda templerade kort (auto-tier-brus;
bordet dömer en ev. contest); serverkopians banner pekar på en klient-html som inte finns i tmp
(irrelevant för ws-testerna). Gater: 43/0 ×2 + smoke grön.


## Arenan [elysium-bot-arena.js v1.0.0 + bot v0.3.5–0.3.6] – EVALUATE-pinnen skeppad, traces betalade sig dag ett (12 juli 2026)

**Arkitektur:** ingen domaranslutning — **bot #1 SKAPAR rummet** (ny `create`-opt, host-token) och
arenan (samma process) skickar start genom den; hela matchflödet läses via onEvent-kroken. Modul
(`runArena()`) + CLI; persona-rotation per match (säterättvisa), spel till sist-stående med
turn-cap/wall-timeout som backstops; statistik per persona (vinster/skada given-tagen/beslut);
**JSONL-trace-lagret** (varje decide med why, through/blocked/took-bleed, utdelade händer för
reproducerbarhet, resultatet) + summary.json. `startPool`-ratten (v0.3.5) ger sekundmatcher —
arenan är GATED i botsviten §12 (47/0). Telemetrin rider onEvent med 'bot:'-prefix (kolliderar
aldrig med wire-verb).

**Dag-ett-avkastningen:** demots match 3 frös (117s tystnad) — tracen + en frysfångare med
inre-dumpar ledde genom två falska spår (köstall; meddelandestorm som visade sig vara friskt
spel) till roten: **spöke-prey-släpet** — en OUSTAD prey armar aldrig (out-guarden) och säger
aldrig Pass, så varje kvarvarande ask väntade ut hela askSecs × antal aktörer i slutspelet.
**v0.3.6:** ask mot utslagen prey auto-resolvas 'no' direkt (vid öppning + mitt-i via roster-
hooken) + `_drain`-härdning (try/finally — omplaneringen överlever varje kast). Omkörning:
**5/5 matcher rena, noll timeouts.** Resultatvändningen (Shark 75% → 0% mellan körningar)
exponerade säte-1-nackdelen (stagger: 1 transfer tur 1) + n-brus — exakt analysloopen arenan
finns för; START-HERE varnar för små urval. Backlog: arena + datalager markerade SHIPPED.
Gater: bot 47/0 ×2, cardfx 45/0, check-versions, launcher-smoke. Klient/server ORÖRDA.


## Livetest-rundan [klient v2.6.28 + bot v0.3.7] – Block-frasen, referendum-livscykel, host-kit-UX, fx-kloner, discard, krypthämtning 4+1, token-bucket (12 juli 2026)

**Klient v2.6.28 (server ORÖRD 2.6.15):** Block-knappen i Played-peeken TALAR 'Block!' via
befintliga say-verbet (annonsen och referendumet är en gest — bottarna hör); ett levande
block-referendum **auto-stängs när dess AKTION dör** (batch-close/fasbyte, lokalt+symmetriskt
på alla klienter — Johans "räknarna syns hela tiden" var dinglande referendum över nästa
handlingar); motståndar-poolmenyn får **host-±snabbsteg** (KRC & co) som rider BEFINTLIGA
hostSetPool som absoluta värden ur publika poolen; **L4-globen taggas .matpool** så askhögen +
hela host-domarkittet (Set/±pool, oust, pass) sitter på själva globen. B1 SANN roundtrip
byte-identisk (till scratch-fil!), client-logic 29/0, protocol 6/0, dispatch 18/0.

**Bot v0.3.7 (gate 52/0 ×3):** verdikt-väntan ('Block!' + caps.tally ⇒ contested tills §12-
raden; timeout ⇒ combat, classic-betydelsen), fxClone (kortspel + bleeds ANIMERAR — metodnamnet
för att `this.fx` är BIBLIOTEKET, en namnkollision suiten fångade), discard-fasen (1/tur:
masters till v0.4 + oanvändbara moder, draw back), krypthämtning till regelbokspris (4
transfers + 1 pool, ersätter gratis-classic; täcker unikhet-blockerad uncontrolled), pacing-
defaults 2000/1600 med react-delay skalad till bordets pace. **Två arkeologifynd:** (1)
`forceSetPool` hade en TYST v0.1-handler — objektliteralens SENARE nyckel skuggade min nya
(dedupad + förstärkt: clamp, oust-on-zero); Johans KRC-friktion var alltså AFFORDANSEN, inte
mekaniken. (2) B1-kedjan gav en byte-identisk FALSK PASS mot stale fragment (split skriver
/home/claude/elysium-src, build läser ROOT/elysium-src) — receptet korrigerat i SKILLS.
**Pacern omskriven till TOKEN BUCKET** (burst 8, 1/140ms ≈ 7,1 msg/s): instrumentering visade
fönstret PINNAT på 70 exakt när pending-maskinens Pass skulle ut — två snabba turer fyllde
10s-fönstret och stallade kritiska says i sekunder; bucketen begränsar latens i stället för
att budget-klippa. Bekräftat på stegen: masters i master-fasen = v0.4, reactions = M2.


## Granskningsrundan på granskningen [klient v2.6.29 + bot v0.3.8] – debounce-återuppståndelsen, klick-läsning, upprepat Block!, publika askhögen, bucket-marginal (12 juli 2026)

Åttonde "osäker på?"-frågan, fem fynd i det EGNA nya: **(K1)** referendum-auto-stängningen
dödade inte `_avrSendT`-debouncen — en räknarjustering ≤120 ms före 'It resolves' fyrade EFTER
stängningen och återuppväckte räknarna bordsbrett (samma bugg-klass Johan rapporterade, i ny
skepnad); nu clearTimeout i båda stängningsvägarna, och eftersom varje klient dödar sin EGEN
debounce på samma triggers är symmetrin komplett utan broadcast. **(K2)** host-±stegen läste
poolen vid MENYBYGGET — två snabba −1 blev netto −1; läser nu pub vid KLICKET (KRC betalar per
referendumsteg). **(B1)** upprepat 'Block!' under levande resolvers föll förbi `!contested`-
guarden rakt in i instant combat — nu refreshar varje rop verdikt-väntan; timeout återställd
till alltid-'no' (post-stealth-tystnad = uppgiven block i classic; ett helt tyst fönster under
resolvers = ingen drev blocken — verdiktraden/prey-Pass förblir de riktiga avgörarna).
**(B2)** PUBLIK ASKHÖG: discards + resolverade actionkort landar i pub-zon 'ash' — hostens
"View their ash heap" på en bot visar nu verklig historik (id 'a'+seq, egen x/y-trave).
**(B3)** token-bucketens värsta 10s-fönster var 79,4/80 MED oräknad okö:ad join-handskakning —
refill 140→150 ms ger 74,7 med andrum. Gater: B1 byte-identisk (scratch-receptet), client-logic
29/0, protocol 6/0, bot 53/0 ×3, smoke grön, check-versions agrees. Levererat: klienten,
boten, sviten + hela dokumentsvepet.


## Andra livetest-batchen [klient v2.6.30 + bot v0.3.9] – verdiktpulser, Oblivion-ikonen, respons-klockan, uttalad Block-ångra (12 juli 2026)

**Klient v2.6.30 (server ORÖRD):** (1) **verdiktpulser** — de frysta §12-raderna (Block/Vote
succeeds/fails) dubblar som presentation via say-bubblornas exakta visuella väg (sayBubble-
refaktor: showSay:s kropp SKIVAD ur filens egna bytes efter att två ankarrekonstruktioner
föll — index-kirurgi mot repr-verifierade markörer är receptet för stora spann); avsändaren
pulsar vid resolve, mottagarna via log-reläet. (2) Block-räknarens Stealth-ikon: Obfuscate →
**Oblivion** (obf är i praktiken en svart ruta; obl bekräftad som KRCG-trigram via DISC_NAMES
+ kortdata, emoji-fallback täcker). (3) **respons-klockan** — fryst presentationsrad
`⏱ calls for a response (Ns).` renderas som namnad countdown-chip (VEM väntar + levande
sekunder, fixed top-center, l4pulse); ny ⏱-knapp bredvid ❗ (30 s) för människor; varje
snabbfras eller verdikt ställer ner chippen. (4) **×-ångran talar**: 'withdraws the block.'
på log-reläet — tally-null:en som avrClear redan sände berättar för bottarna, raden för
människorna. B1 byte-identisk, client-logic 29/0, protocol 6/0.

**Bot v0.3.9 (gate 55/0 ×3):** klock-triggern 5 s in i obesvarad ask (N = askSecs − 5 — chippen
visar botens SANNA återstående fönster; hoppas över när hela fönstret ≤ 8 s, dvs testsviter;
ställs ner i _answer); **tillbakadragen block** (tally mode:null utan verdiktrad) un-contestar,
startar om fönstret OCH beväpnar om klockan — en felklickad Block kostar bordet ingenting.
Ordningsresonemanget håller: verdiktraden processas före resolve-vägens null-tally, så bara
äkta ångra-null når den contested asken. askSecs-default är 25 (inte 30) — chip-raden gör den
synlig. Smoke grön, check-versions agrees.


## Korrigeringen [klient v2.6.31 + bot v0.3.10] – dubblett-stoppuret rivs, riktiga Reaction-timern får namn (12 juli 2026)

Johan: "vi hade ju redan ett stoppur med default 5 sekunder" — och det hade vi: **Reaction
timer** (rumsfältet `#mpReact` 3–30 s default 5, ⏱-knappen `#btnDecide`, wire-verbet `decide`
som redan broadcastar `who` + `secs`). Min v2.6.30-recon greppade begrepp ("clock") i stället
för UI-strängar och byggde en dubblett — chip, andra ⏱-knapp, påhittad fryst lograd — bredvid
originalet. **v2.6.31 river alltihop** (12 kirurgiska snitt, noll kvarlämningar) och ger det
RIKTIGA stoppuret Johans önskan: `dfxShow` fick who-param, `.dfxwho`-raden visar anroparens
namn ovanför räknesiffran (online via befintliga broadcasten; hotseat-vägen fick namnparitet —
den skickade null). **Bot v0.3.10:** `_armReactTimer` skickar `{t:'decide'}` 5 s in i obesvarad
ask — servern broadcastar rummets reactSecs, alla ser nedräkningen med botens namn — och
**askSecs (25 s) förblir orörd**: stoppuret är prompten, asken avgör. Suiten byter assert till
decide-broadcasten (who='Trainbot', secs=5). Gater: B1 byte-identisk, 29/0, 6/0, 55/0, smoke.
Lärdom journalförd i learnings: rekognoscera med ANVÄNDARENS vokabulär + UI-strängarna
(title/label), och "vi hade ju redan X" är ett stopp-kommando.


## M2-handoffen [spec §7.5] – full designspec skriven, dokumenten nya-chatt-redo (12 juli 2026)

Johans fråga "nästa steg + klarar Sonnet 5 det?" besvarad med en HANDOFF-beredning: spec-
rubrikstädning (§2 rullande version, §6 markerad HISTORICAL/SHIPPED), §7-stegen pekar på nya
**§7.5 M2 — THE DEFENSE PASS**: entry state, steg 0 = §12-kontraktcanaryn (backlog → främjad),
verifierad datainventering (25 fx-taggar — intercept 180, strike 83 MED skadevärden, bounce 9,
wake 6, dodge/prevent/maneuver/press/combatEnds + cost.blood/req.disc — combat-modulen är
DATAFÄRDIG), design A–D (informerat block-as-target med tally.b-skrivning, reaction-spel med
blodkostnad + wake + Deflection-bounce, combat v1 announce-only med cut-lines, vote-abstain
som rider), testplan (svit-sektion 14, 7 asserts) och tre öppna frågor till Johan. §8 fick
"freshest four"-gotchas (token bucket, copy-spawn, B1-scratch, greppa handler-tabell/UI-
strängar före nybygge). CLAUDE.md: bot-sessioner startar i specen. Rekommenderad ordning:
canary → M2 → v0.4 (masters/hunt/ekonomi — poolGain/bloodAdd-taggarna väntar redan).
Sonnet 5-läget källkollat: near-Opus agentisk kodning, längre fokus, självkontroll —
bedömning: JA för finjustering (gates+traces = mekaniskt skyddsnät), JA för M2 med §7.5 som
arbetsorder (implementera, inte arkitekta).


## Tutorial-svepet [klient v2.6.32] – Obfuscate-glyfen på Structured-genomgången rättad (12 juli 2026)

Johan frågade rakt: håller tutorials efter dagens resolver-arbete? Verifierade i stället för
att gissa: grep hela filen efter "Obfuscate" gav EN träff (sh-block-open, Structured-table-
genomgången) — texten sa fortfarande "the Obfuscate glyph" trots att v2.6.30 bytte
Stealth-ikonen till Oblivion. Samma träff bekräftad i projektets orörda kopia (samma rad,
äldre radnummer) — inget annat dokument (Host Guide-byggaren, START-HERE) berörs.
**Säkerhetskontroll före patch:** avrOpen('block') anropar nu saySend — kunde det krascha
tutorial-läget om det låg "i rum" utan riktig socket? Verifierat NEJ: `inRoom()` kollar
`net.status==='in'`; varken `startHotseat` (Structured-genomgången kör en RIKTIG hotseat-
femmanna-session) eller `tutDemoLobby()` (online-join/hosting; rör aldrig net.status) sätter
den någonsin till 'in' — saySend tar alltid den lokala showSay-vägen, aldrig mpSend, i alla
tutorial-lägen. Ingen krasch-risk, bara en textdrift. **Patch:** raden rättad till "the
Oblivion glyph" + en ny mening om att Block-knappen även annonserar frasen till bordet
(v2.6.28-beteendet, tidigare odokumenterat men naturligt att nämna precis där). Ren prosa —
ingen gate/predicate rörd. Gater: B1 byte-identisk, client-logic 29/0, protocol 6/0,
bot 55/0, cardfx 45/0. **Kvarstående (ej fix, bara luckor):** stoppurets nya
anropar-namn-visning, verdiktpulserna och den uttalade Block-ångran nämns inte i tutorial-
prosan (inget är FALSKT, bara oomnämnt); host-poolens ±snabbsteg och L4-globens
värdverktyg täcks inte av online-hosting-genomgången alls (den slutar redan vid
server/anslutning, före spelnivå-innehåll — en gräns som fanns före denna session).


## §12-kontraktcanaryn [test-bot-canary.js v1.0.0] – tre sanningskällor korskopplade, biten bevisad (13 juli 2026)

Johan: ska vi ta canary-steget enligt designspecen (§7.5 steg 0)? Byggd samma stund. **Tre
sanningskällor korskopplade mot VARANDRA**, aldrig efterhärmade: (1) PROTOCOL.md §12:s
prosa (backtick-mallarna, kontrollerad via substrängar som medvetet undviker em-dash-byten
i testfilens egna strängar — samma mojibake-disciplin som resten av projektet); (2) klientens
EGNA rad-byggare (`AVR_DEFS.block/vote/combat.line` — rena funktioner utan DOM-beroende,
alltså extraherbara via regex ur källkoden och FAKTISKT KÖRDA med `new Function(...)`, inte
handkopierade gissningar); (3) botens riktiga `L12`-regexobjekt (redan exporterat ur
`elysium-bot.js` — inga botändringar behövdes). Bleed-raderna är inte isolerbara rena
funktioner (cardRefCap/targetSuffix rör DOM), så de vaktas i stället via närvarokontroll av
de bärande bokstavliga fragmenten (`' bleeds for '` m.fl.) plus ett regex-accept-test mot
en rad byggd enligt PROTOCOL:s dokumenterade form.

**Biten bevisad, inte antagen:** innan 37/0 fick kallas trovärdigt körde jag två DESTRUKTIVA
test mot en muterad kopia i minnet (rörde ALDRIG den riktiga filen) — "succeeds"→"wins" fick
botens regex att korrekt returnera `null` (ingen match), och "bleeds for"→"bleeds at" fick
fragment-kontrollen att korrekt rapportera fragmentet saknat. Ett verktyg som alltid säger
"allt grönt" skyddar mot noll; nu finns kvitto på att det faktiskt bits. Gater: canary 37/0,
bot 55/0, cardfx 45/0, client-logic 29/0, dispatch 18/0, protocol-lint 6/0, check-versions
agrees, smoke grön — inga klient/server/bot-filer rörda denna omgång (L12 var redan
exporterat). Spec §7.5 steg 0 markerad SHIPPED, backloggposten strukna, CLAUDE.md fick en
ny Files-rad + changelog-post. M2 (§7.5 steg A–D) är nu den enda återstående punkten på
handoff-listan.


## M2 — THE DEFENSE PASS [bot v0.4.0] – informerat block, reaktioner, combat v1 (13 juli 2026)

Johans "kör vi nu": hela §7.5 A–D implementerat samma session, gate 62/0. **Design krävde
grundlig rekognosering FÖRE kod**: `interceptPotential()` fanns redan som platshållare,
`decide('block-as-target')` var redan en ROUTAD men obesvarad stub, `blockShy` hade legat
OANVÄND i PERSONAS sedan v0.1 — redo och väntande på precis denna dag. Kritisk verifiering
INNAN kodning: servern server-mergar `duel`-fältet ENDAST för `mode==='combat'` — mitt
första instinkt (visa "vem blockar" via block-side duel) hade tystnat dött vid servern;
läste handlern i källkod före design, inte efter.

**Två regelkorrigeringar under implementationen, källverifierade mot riktig korttext (inte
minne) EFTER att första försöket fick fel:** Deflection-textens EXAKTA lydelse är "change
the target... to ANOTHER METHUSELAH OTHER THAN THE ACTING MINION'S CONTROLLER" — fritt val
av försvararen, inte "aktörens prey" som jag först antog (vilket i ett tvåspelarbord
degenererar till att studsa TILLBAKA på aktören — orimligt). v1 riktar nu mot **botens EGET
prey** (konventionen: "skjut blödningen nedströms"), via befintliga `preySeat()`. Ett
2-spelartest av bounce är i sig meningslöst för att bevisa "annan spelare" (prey=predator
symmetriskt headsup) — accepterat medvetet snarare än att komplicera med en tredje klient;
regelkorrektheten är källverifierad i kod-kommentaren i stället.

**Vad skeppades:** (A) informerat block-as-target — läser levande `tally.a` när resolver är
öppen, formeln `(odds × urgency) ÷ blockShy ≥ 1`; `interceptPotential()` omskriven till
BÄSTA omedelbart tillgängliga kort (inte optimistisk summa — bara ett spelas per försök
ändå). (B) reaktioner: intercept (`_bestInterceptFor`, spegling av `_bestStealthFor`), wake
för låst reaktor (`_wakeCard`, On the Qui Vive), Deflection-bounce (korrigerad enligt ovan);
en gång-per-AKTION-reaktionsledger (`pending.reacted`) — regeltabellraden flippar till
ENFORCED. Bounce föredras rakt av framför en kontesterad block (billigt, avgörande, riskfritt).
(C) combat-modul v1 — triggas när ett block lyckas på ENTINGEN sida (target-hand-off via
`pending.blockerVamp`, kommen ihåg FÖRE `_clearPending` sudda; aktörsidan ersätter gamla
hårdkodade "hands for 1 each"-stubben), duel-annonsering (nu korrekt bara combat), datadriven
strike/prevent, skada på EGET blod, torpor vid 0 — samma sandlåde-konvention som bleeds. v1
cut-line (medveten, oförändrad): ETT varv, ingen press-jakt, rör aldrig delade ph/rd,
modellerar inte motståndarens eget slag. (D) röstnings-artighet (abstain 1×/referendum).

**Testbygget avslöjade tre riktiga fel till, alla i den NYA koden:** (1) svit-sektion 14:s
`poolFloor`-default är 6 ("never influence below this pool") — mitt `startPool:6` satt
EXAKT vid golvet, så Zip kunde aldrig komma i spel (ren testkonfig, poolFloor:0 override);
(2) cursor-fällan slog till IGEN, denna gång i MITT EGET test: `_commitBlock` skickar
'Block!' FÖRE wake-loggen, men testet väntade i fel ordning — cursorn skenade förbi 'Block!'
medan den letade wake-raden (exakt learnings-mönstret, nu självupplevt); (3) min ASSERTION
letade efter `m.duelCid` på broadcast-meddelandet — servern skickar `m.duel[seat]` (den
mergade kartan), `duelCid`/`duelName` är bara INPUT-fält på avsändarens meddelande. Extra
fynd utanför sviten: smoke-scriptets hälsnings-regex var hårdkodad `v0\.3\.\d+` — samma
klass av bugg som combat-textkrocken förra rundan, fixad + gjord version-agnostisk.
Gater: bot 62/0 ×3, canary 37/0, cardfx 45/0, client-logic 29/0, dispatch 18/0,
protocol-lint 6/0, check-versions agrees, smoke grön. Klient/server helt ORÖRDA.


## Johans fångst [bot v0.4.1] – Deflection är en luring i tvåspelarläge, och min kod hade inget skydd (13 juli 2026)

Johan, apropå gårdagens Deflection-korrigering: "den blir ju värdelös i 2-spelarsituation,
likt alla bounce-effekter, eftersom en grundregel är att man aldrig kan blöda sig själv."
Källverifierat direkt mot officiella regelboken (vekn.net): **"You can never bleed
yourself"** står där nästan ordagrant. Men insikten avslöjade mer än trivia — min v0.4.0-
kod hade INGET skydd mot detta: `preySeat()` i ett 2-spelarbord returnerar AKTÖRENS eget
säte (predator=prey symmetriskt headsup), så boten skulle bokstavligen ha "omdirigerat"
blödningen tillbaka till personen som redan blöder den — olagligt per korttexten ("another
Methuselah OTHER THAN the acting minion's controller"), bevisat med en isolerad
`preySeat()`-koll INNAN någon kod skrevs.

**Fix (v0.4.1):** `_reactWindow` kollar nu `this.preySeat() !== actorSeat` innan bounce
ens erbjuds som alternativ — kollapsar prey/predator till samma säte (2 levande spelare,
eller när som helst det händer) — bounce hålls tillbaka, faller igenom till det vanliga
informerade blockbeslutet. **En andra, angränsande lucka** dök upp UNDER testbygget av
fixen: `interceptPotential()` (som förser BESLUTET) respekterade inte gång-per-aktion-
ledgern som EXEKVERINGEN redan tvingade fram — med två likadant namngivna kort i hand
fortsatte beslutet att "se" den andra kopian som tillgänglig efter att den första
förbrukats, vilket band ett andra, obackat "nakent" blockförsök som aldrig fick sin
verdikt (fastnade i "contested, unresolved"). Fixad: `interceptPotential(p.reacted)`,
nu i samklang med vad `_commitBlock` faktiskt gör.

**Testbygget avslöjade också en pool-matematikfälla**: startPool 6 minus Zips cap-2-resa
= 4 pool kvar — en bleed-för-5 mot pool-4 OUSTAR boten i stället för att bara applicera
(negativt pool ⇒ `_oust`), vilket 14b–d behöver den vid liv för. Löst genom att INTE
skicka någon cleanup-verdikt alls efter 14a:s blockförsök — en ny `_armPending` (14b:s
färska bleed) SUPERSEDERAR den gamla pendingen automatiskt, redan dokumenterat beteende,
vilket också sparade Zips cap-2-blod från en onödig extra combat-omgång inför 14d:s wake-
test (som annars hade torporerat den för tidigt). Gater: bot 62/0 ×3, canary 37/0,
cardfx 45/0, client-logic 29/0, dispatch 18/0, protocol-lint 6/0, check-versions agrees,
smoke grön. Klient/server helt ORÖRDA — nionde "är du osäker på något?"-varianten, fast
denna gång utan att jag behövde frågas: Johans egen lekmannaobservation avslöjade en
riktig regelbugg i gårdagens färska kod.


## Dokumentstädning [spec + backlog] – M2-roadmapraden och v0.4→v0.5-numreringen (13 juli 2026)

Johans "är M2 + v0.4.x levererat, vad återstår?" avslöjade tre kvarglömda fläckar innan
svaret kunde ges ärligt: (1) §7-roadmappens M2-rad pekade fortfarande mot §7.5 som "nästa
sessions arbetsorder" trots att §7.5 självt redan var märkt SHIPPED — nu flippad med
strykning; (2) röstnings-artighet-backloggposten var aldrig struken trots att den skeppades
som del av M2 steg D; (3) TVÅ backloggposter + en spec-rad använde fortfarande "v0.4" för
masters/hunt/ekonomi-arbetet — exakt den numreringskrock jag själv flaggade när M2:s
designspec skrevs (M2 skulle ta v0.4, så det andra arbetet måste bli v0.5) men aldrig
genomförde. Alla fyra referenser omnumrerade till v0.5, konsekvent tvärs spec+backlog.
Gater: bot 62/0, canary 37/0, cardfx 45/0, client-logic 29/0, dispatch 18/0, protocol-lint
6/0, check-versions agrees, smoke grön — inga kodfiler rörda, ren dokumentation.


## Directed/Undirected-taggen flyttas till mod-nivå [cardfx v1.3.0] – Johans split-mode-fynd (13 juli 2026)

Johan frågade rakt: har vi taggat Directed/Undirected än, eller sparar vi till v0.5? Svaret
visade sig ha TVÅ lager. Fältet `dir` (Ⓓ-detektering) fanns redan sedan tidigare arbete
och matchade redan Johans föreslagna minimal-tagg-princip (tagga minoriteten, låt majoriteten
defaulta — exakt samma polaritetsmönster som `unique`s lib/crypt-asymmetri). Men Johan
lade själv till den avgörande observationen: samma kort kan ha OLIKA directedness per
LÄGE — Govern the Unaligned har directed bleed på inferior, undirected specialhandling
(blood-add) på superior. Verifierat: fältet satt på ENTRY-nivå, en enda flagga för hela
kortet — och Govern hade `dir:true` på HELA posten trots att bara halva kortet faktiskt är
directed. En genuin datakorrekthetsbugg, inte bara en framtida förbättring.

**Fixen (v1.3.0):** kompilatorns `segment()`-arkitektur delade redan upp korttext per
läge (för disciplinkrav) — Ⓓ-skanningen flyttades in i SAMMA segment-loop, med samma
"as above"-nedärvning som fx redan använder. Govern visar nu korrekt: `{at:'dom',
dir:true, fx:{bleed:2}}` + `{at:'DOM', fx:{stealth:1,bloodAdd:3}}` (inget dir-fält alls
på den superiora). **Sanningen om minoriteten:** mätt på rätt granularitet (per mod, inte
per post) blev fördelningen 180 directed mot 461 undirected bland actionkort — en tydlig
minoritet (~28%) som bekräftar Johans instinkt fullt ut. Den GAMLA entry-nivå-mätningen gav
en missvisande nästan-50/50 (247/469) eftersom split-mode-kort som Govern räknades som
"directed" i sin helhet trots att bara halva effekten är det — en artificiell uppblåsning
som doldes tills mätningen gjordes rätt.

**Boten läser INTE `.dir` någonstans** (verifierat via grep före några ändringar) — M2:s
block-as-target-logik täcker bara default-bleed-fallet (boten är alltid ensam laglig
blockerare där, per konstruktion, inget uppslag behövs). Att koppla in `dir` för bredare
block-behörighet (icke-bleed-actionkort, politiska handlingar, boten som prey-ELLER-predator-
blockerare på en undirected handling) kräver actionstyp-igenkänning bortom bleeds — parkerad
med v0.5. Gater: cardfx 46/0 (ny split-mode-assert), bot 62/0, canary 37/0, check-versions
agrees. Data korrigerad nu; botlogiken väntar, ärligt dokumenterad som sådan.


## Granskningsrundan på M2 självt [bot v0.4.2 rekonstruerad + v0.4.3] – lås-vid-lyckat-block, kapacitetsmedvetet blockerarval, och ett ritualbrott (13 juli 2026)

Johans "är det något du är osäker på?" — och JA, med kvitton. Men först granskningsfynd #1,
pinsamt nog om PROCESSEN: **koden stod på v0.4.2 med fem fix-kommentarer, men journalen,
specen, CLAUDE.md och context saknade varje spår av rundan** — sessionsritualens kärnkrav
(uppdatera ALLA levande dokument efter varje implementation) bröts helt för den passen.
Rekonstruerad retroaktivt ur kodkommentarerna: (1) combat-tallyn nollar a/b explicit —
block-referendumets kvarhängande stealth/intercept-siffror maskerade sig som skaderäknare
i varje klients resolver (synligt i vår EGEN 14c-debugdump: `mode:'combat', b:2`);
(2) wake SPENDERAS bara när en låst sovare faktiskt finns och kan betala — gamla formen
brände kortet rakt ut i luften; (3) bounce återankrar sitt handindex VID NAMN efter
think-fördröjningen — idx räknades före pausen och handen kan ha skiftat under den;
(4) bounce kräver en olåst redo minion (regelboken — wake-undantaget routade aldrig dit);
(5) oustade tiger på vote-abstain.

**v0.4.3, själva granskningen — två äkta luckor, bägge BEVISADE med isolerade test INNAN
fix:** (A) **Regelboken: "If a block attempt is successful, then the blocking minion LOCKS
and enters combat"** — target-sidans succé-väg stred combat och lämnade blockeraren REDO.
Ett gratis-block, tur efter tur, som aldrig kostade vampyren något. Nu låses den vid
verdikt-succé-överlämningen (wake-vägen anländer redan låst — idempotent). (B) **Beslut/
exekvering-drift, samma klass som interceptPotential-ledger-buggen:** beslutet summerar
kapacitet över ALLA vampyrer, exekveringen tog FÖRSTA olåsta — bevisat med tvåvampyrs-test:
fel-disciplin-vampyr först i board-ordning (Zip) + aus-gated intercept bara Abderrahim kan
använda → icp sa 2, valet sa Zip → nakent obackat block. Ny `_pickBlocker()` väljer den
olåsta vampyr vars bästa ANVÄNDBARA intercept är högst (lika/inga kort → board-ordning),
enhetstestad offline i sviten (sektion 13.5). Gate 62/0 → **65/0** ×3.

**Accepterade v1-förenklingar, nu DOKUMENTERADE i specen i stället för tysta:** bounce kan
erbjudas igen efter misslyckad block-verdikt (den riktiga "after blocks are declined"-
nyansen kring misslyckade försök är djupare än v1 modellerar — bordet dömer); combat-skada
på 0-blods-vampyr ger torpor (regelboken bränner en vampyr som inte kan betala — en
distinktion v1:s ettvarvs-announce-combat inte spårar). Gater: bot 65/0 ×3, canary 37/0,
cardfx 46/0, smoke grön, versions agrees. Klient/server orörda.


## SKILLS.md-svepet – bot-track fick sina första recept (13 juli 2026)

Johans "har vi inte uppdaterat Skills på ett tag?" — och nej, ALDRIG denna session, trots
att ritualen listar den som ett av "alla" levande dokument. Bekräftat via grep: hela
SKILLS.md var uteslutande klient-fokuserad (patcha klienten, lägga till server-verb,
tokens, SFX, tutorials) — noll bot-track-recept trots att större delen av sessionen (M1
slice 1 t.o.m. M2-granskningen) var just bot-arbete. Dessutom var "Verify a change"-receptet
självt föråldrat: hårdkodade "16 passed" (verkligheten: 29), nämnde varken bot-sviten,
canaryn eller cardfx alls.

**Fixat:** "Verify a change" delad i två spår — klient/server (räknefel rättade, siffror
avdramatiserade till "last known" i stället för hårdkodat kontrakt) och ett helt NYTT
"Verify a bot-track change"-recept (canary, cardfx-ombygge-före-drift-check, BOT_VERSION/
FXC_VERSION-bump som konvention inte gate, trestjärnig stabilitetskörning av bot-sviten,
tmp-server-spawn-påminnelsen). Plus fem nya recept destillerade ur sessionens läromoment:
**decide()-mönstret** (why-strängar, ctx-design); **cardfx-taggning** (entry- vs mod-nivå-
beslutet FÖRST, "as above"-nedärvning, mät minoritetssplitten på rätt granularitet — dir-
taggens 2×-felmätning som varnande exempel); **offline-enhet vs live-rum-testning** (poolFloor
6, cursor-ordningsfällan, supersede-inte-cleanup, den läckande send()-timern att undvika);
en **granskningschecklista** (beslut/exekvering samma tillstånd, regelboks-bokföring granskad
separat från utfall, källverifiera regler + testa 2-spelarbordet som gränsfall); och en
kort **canary-utökningsguide**. 1174→1344 rader (+170, ~15%), i linje med "docs diet"-
medvetenheten i backloggen. Gater oberörda (ren dokumentation): bot 65/0, canary 37/0,
cardfx 46/0, client-logic 29/0, check-versions agrees.


## v0.5-handoffen [spec §7.6] – masters/hunt/ekonomi fick sin arbetsorder, IMPLEMENTATION SPARAD (13 juli 2026)

Johans "vill du gå vidare med v0.5?" — svarade ärligt att jag hellre ser detta som ett bra
naturligt paus-läge (precis samma logik som M2:s handoff-mönster: skriv en riktig arbetsorder,
låt nästa session ta den med fräsch kontext, snarare än att klämma in en hel ny milstolpe i
en redan mycket lång chatt) än att köra igång implementationen här och nu. I stället
researchade jag grunden ordentligt och skrev **§7.6** i specen, samma kvalitet som §7.5 fick
för M2.

**Verifierad datainventering:** poolGain 42, bloodAdd 58, bloodBurn 17, poolDmg 41 fx-taggade
lägen; 525 masterkort, 119 allierade, 54 retainers, **0 taggade som equipment** (kompilatorn
skiljer inte ut den kategorin idag — värt att kolla innan v0.5 lutar sig mot den).
**Handkurerade tiern hade redan ett litet, medvetet försprång** (4 poster): Blood Doll +
Vessel med `note`-fält som BESKRIVER fastimingsskillnaden (Blood Doll triggar i egen
masterfas, Vessel i egen unlock-fas — en hel fas senare), Vessel bär redan `trifle:true`
(enda trifle-taggade posten i biblioteket), Dreams of the Sphinx (3-vägs enda-läge-val),
Inside Dirt (directed, ICKE-bleed pool-skada via Edge-kostnad — det kanoniska "block-
behörighet handlar inte bara om bleeds"-exemplet, kopplar rakt till gårdagens dir-arbete).
Boten läser INGET av `trifle`/`note`/`costEdge` än — data ligger före beteende, samma form
som blockShy innan M2.

**Källverifierat via vekn.net + community-guider:** masterfasen tillåter EN masterspelning
per tur som default (trifles ger EN bonus-MPA, taket på en bonus per fas); hunt är
undirected, default +1 stealth, ger 1 blod, och är OBLIGATORISKT för en redo olåst vampyr
med 0 blod före andra icke-obligatoriska handlingar denna tur — boten har NOLL hunt-kod
idag (grep-bekräftat). Skriv-tur-designen (A–D): masterspel en gång/tur, hunt-handlingen
+ dess obligatoriska trigger, en ÄRLIGT FLAGGAD v1-förenkling för inkomsttajming (Blood
Doll/Vessel-fasskillnaden approximeras till EN fast punkt i botens tur i stället för att
modellera den sanna master-vs-unlock-splitten — dokumenterad som medveten förenkling,
inte tyst genväg), och discard-fasens flip (sluta slänga masters när de blir spelbara).
Testplan skisserad, tre öppna frågor till Johan. Ladder + backlog länkade till §7.6.
Inga kodfiler rörda — ren research + designdokumentation.


## Johans "är dina noteringar noterade?" hittade ett riktigt fel (13 juli 2026)

En enkel uppföljningsfråga ("är hunt/master-noteringarna noterade också?") fick mig att
FAKTISKT kolla i stället för att svara ja på ren tillit — och det avslöjade ett genuint fel
i gårdagens §7.6: jag hade sökt `t.includes('equipment')` (0 träffar) när designdoktrinens
EGEN §4-typlista säger `'equip'` — den rätta strängen ger **164 träffar**, inte 0. Rättat i
specen med en ärlig korrigeringsnot (varför felet uppstod, hur det hittades). Samtidigt
täppte jag till en bredare lucka: `trifle`/`costEdge`/`bloodToPool`/`note` nämndes bara i
en lista i designdoktrinen (till skillnad från `dir` som fick en full förklarande rad) —
alla fyra fick nu egna beskrivande punkter (mekanik, räckvidd, om boten läser dem än).
Inga kodfiler rörda. Lärdom: även en enkel "är det noterat?"-fråga förtjänar en riktig
verifiering, inte ett artigt ja — precis samma disciplin som resten av sessionen.


## Torpor vs bränning omvärderad – M2 var faktiskt regelkorrekt hela tiden (13 juli 2026)

Johans "vad återstår från §7.5?" fick mig att läsa igenom mina egna "accepterade förenklingar"
en gång till — och den ena höll inte: jag hade skrivit att "combat-skada på 0-blods-vampyr
ger torpor — regelboken bränner en vampyr som inte kan betala." Källverifierat mot vekn.net:
det är precis TVÄRTOM. Torpor vid 0 blod från NORMAL skada är regelkorrekt — en vampyr
bränner blod 1-mot-1 för att läka, och går till torpor när blodet tar slut, exakt vad M2
redan gör. BRÄNNING är specifikt en AGGRAVATED-skademekanik mot en REDAN SÅRAD vampyr (en
som redan är på väg mot torpor och tar mer skada den inte kan betala) — M2:s combat v1
skiljer aldrig på aggravated och normal strikes alls, så ingen vampyr kan någonsin brännas
under den. Det är alltså en GENUINT SAKNAD mekanik (aggravated skada), inte en approximation
av en befintlig — hör hemma i en framtida combat-v2-runda, inte v0.5. Rättat i specen.
Samtidigt uppmärksammad: de tre "Open questions... now answered by what shipped"-punkterna
i §7.5 var egentligen BARA mina egna beslut under implementationen, aldrig genuint
förankrade hos Johan — ytligt presenterade som "confirmed as designed" utan att han
faktiskt tillfrågades. Flaggat som riktiga öppna frågor i svaret till honom i stället för
att låtsas de redan var avklarade.


## Fyra klientfixar i ett svep – ljusstyrka, handsortering, bottenpeek, snabbfras-avbrott (client v2.6.33, 13 juli 2026)

Johans lista på fyra små, orelaterade klientönskemål, alla levererade i samma svep. (1)
**Ljusstyrka** 130%→200% max: slider-attributet plus två separata `>=60&&<=130`-valideringar
(lokal init och import av sparade inställningar) — alla tre missade hade lämnat spöktak kvar.
(2) **Handsortering vid startgiven (online):** `dealt`-hanteraren (s2c) puttade korten rakt in
i `state.zones.hand` utan att gå via `move()`, som är den enda platsen `handSortCmp` faktiskt
kördes — därav att handen såg osorterad ut tills första dragna kortet (som GÅR via `move()`)
råkade sortera om hela arrayen i efterhand. Hotseat (`dealOpening`) kallar `move()` per kort
och var aldrig drabbad. Fix: en explicit sort direkt efter dealt-loopen. (3) **Bottenpeek-
dockan i L2:** en syskondrift-bugg (se ny learnings-post) — v2.5.76 gjorde L3/L4:s dock-stäng-
vid-utdrag `conv.dockDrag`/`dockPinned`-medveten, men den nästan identiska l2cols-grenen
några rader längre ner i SAMMA drag-hanterare fick aldrig samma behandling och stängde
dockan blint vid varje dragstart. Fix: samma defer-mönster (`drag.l2colsDockDefer`) speglat
från L3/L4-blocket, plus motsvarande per-move-övergång och skalberäkning. (4) **Snabbfras
avbryter stoppuret:** `showSay()` — den enda punkten både högerklicksmenyn, ❗-knappen OCH
varje nätverksklients `say`-relä till slut går via — nollställer nu `net.dfxT` och tömmer
`#decideFx` så fort en fras visas, oavsett vem som skickade den. Gater: client-logic 29/0,
dispatch 18/0, protocol-lint 6/0, B1-roundtrip byte-identical (×1), syntax ×2,
check-versions agrees efter dokumentstämpling. Server/protokoll orört, ingen wire-ändring.


## Bot-elements-undantaget: vem som helst får styra en bots kort [bot v0.4.4 / client v2.6.35 / server v2.6.16] (13 juli 2026)

Johan: bottens element hanteras read-only precis som en riktig spelares, men boten kan
inte modellera varenda triggad förmåga (en untap-fas-ping, torpor-läggning) — kan vi
göra ett undantag så VEM SOM HELST får styra en bots egna kort? Delade upp Johans
tvådelade förslag i två: **Hold on/Pass som en riktig paus av botens turmotor**
dokumenterad som ett framtida diskussionsämne (se backloggen); **kontroll över bot-
element** byggd denna session.

**Arkitekturen låg redan halvvägs där.** Cross-board-give-arbetet (v2.5.20–26) etablerade
tre-axel-modellen owner/controller/placement och ett generiskt `ctrl`-verb (blood/blue/
green ±1, lock/flip) för "ditt kort på någon annans bräde" — menyn gatade bara på
`c.owner===net.you`. Att öppna samma mekanism för ETT NAMNGIVET säte i stället för en
namngiven ägare är en ren utvidgning, inget nytt system.

**Skeppat:** (1) Boten flaggar sig själv `bot:true` vid `create`/`join`; servern sparar
`p.bot` och exponerar det i `roster`/`lobby` (`players[].bot`) — additivt fält, ingen ny
verb, protocol-lint 6/0 grön. (2) Klientens motståndarkort-meny delar nu upp Take
back/Burn (fortsatt ENDAST ägaren — de flyttar kortet helt av brädet) från
Blood/Blue/Green/Lock/Flip (nu `_mine || _botSeat`, där `_botSeat` slår upp
`net.roster[].bot`). (3) **Genuin lucka hittad:** `elysium-bot.js` hade INGEN `ctrl`-
hanterare alls — höger-klicksmenyn visade historiskt inga knappar mot en bot (owner-
gatet stängde ute alla utom boten självt), så mekanismen var aldrig testad mot en
headless mottagare. Ny handler i botens `_mkHandlers()`: applicerar `act` på
`this.board`-kortet via `id`, INGEN owner-koll (till skillnad från klientens egen
holder-mottagare vid rad ~7992, som kollar `c.owner===m.from`) — boten litar på VEM SOM
HELST, eftersom bara ett säte som självdeklarerat `bot:true` någonsin når hit. (4) **Ny
zon-flytt:** `torpor`/`untorpor`-verb (endast vampyrer) lades till i samma generiska
switch — både i `ctrlApply` (bara-pub-objekt-vägen, hotseat/optimism) och i klientens
riktiga holder-mottagare (via `move()`, så även en RIKTIG människo-kontrollant nu kan
skicka en kontrollerad vampyr till torpor — en generalisering utöver bot-fallet, samma
knapp).

**Skop medvetet avgränsat:** hotseat kan aldrig ha en headless bot-motståndare (boten
kräver en riktig WebSocket-server) — så `hotCtrl`/`net.hot`-vägarna rördes inte alls.
Testet byggdes medvetet FÖRE första `pass` (innan botens egen turmotor någonsin körs),
så inget i denna session racear botens `_playTurn()` — det är precis den paus/återuppta-
frågan som är parkerad till nästa session. Gater: bot **65/0 → 70/0** (5 nya test:
roster-flaggan syns, ctrl utan ägarkontroll landar, torpor/untorpor båda hållen,
ett okänt act-värde ignoreras snarare än att tvinga fram en no-op-zonändring),
dispatch 18/0, client-logic 29/0, canary 37/0, protocol-lint 6/0, B1-roundtrip
byte-identisk, syntax ×3. **Server restart required** (nytt fält i create/join +
roster/lobby).


## En andra, oberoende ljusstyrka för menyer/paneler (client v2.6.34, 13 juli 2026)

Direkt uppföljning på förra svepets ljusstyrke-tak (130%→200%): Johan märkte att menytexter
och paneler inte blev ljusare alls, och frågade om det var en bugg. Det var det inte —
`applyBrightness()` har alltid filtrerat ENDAST `#board` (en medveten kommentar: "applied to
the table only, so menus and panels stay readable"), men med det nya, högre taket blev
gapet mer påtagligt. Johans lösning: en egen, separat slider istället för att antingen
låsa menyerna helt eller riskera olässlig text vid extremvärden.

**Implementation:** en ny CSS-variabel `--ui-bright` (default 100%) på `:root`, och en
regel som filtrerar CHROME-ELEMENTEN DIREKT — `header, aside, #menu, .modal,
#playedOverlay, #readyPeek, #cardTip{ filter:brightness(var(--ui-bright)); }` — istället
för att filtrera en gemensam förälder till `#board` (vilket hade krävt kompensationsmatte
för att de två reglagen inte skulle multiplicera ihop sig på bordet). Eftersom `#board`
inte ingår i den listan påverkas det aldrig av den nya slidern, och vice versa. Ny
inställningsrad i Settings (`#uiBrightness`/`#uiBrightVal`, samma 60–200%-intervall och
localStorage-mönster som bordets egen slider men EGEN nyckel `UI_BRIGHT_KEY` — medvetet
inte återanvänd `BRIGHT_KEY` så de två förblir oberoende), trådad genom export/import av
inställningar (`uiBrightness`-fältet) och factory-reset-listan. Kontrollerade att inget av
chrome-elementen har `position:fixed`-BARN som skulle kunna få sitt containing block
kapat av det nya filtret (alla nuvarande fixed-positionerade element är antingen
elementen själva eller ligger utanför dessa containrar). Gater: client-logic 29/0,
B1-roundtrip byte-identical, syntax ×2, check-versions agrees.


## Session [v2.6.36 klient] – avrLive[hidden]-footgunen + fri räknare + sida-vid-sida-snabbfraser (13 juli 2026)

Johans tre önskemål: (1) med alla resolver-helpers avstängda (t.ex. L4 Tournament mode) syntes
räknarna i Played-peeken men gick inte att öka/minska, och Resolve/x kändes döda; (2) med Helpers
på ville han att bara Block/Vote/Combat-knapparna syns från start, som sedan fäller ut sin räknare;
(3) klonanimationerna för snabbfraser lägger sig ovanpå varandra i stället för sida vid sida.

**Grundorsak till (1)+(2), samma bugg:** `#avrLive` hade ALDRIG en `[hidden]`-motsvarighet i CSS —
samma id-selector-slår-`[hidden]`-fälla som redan är fixad för `#avrDuel`/`#edge`/`#helpOverlay`.
`avrRender()`s `live.hidden=true` gjordes alltså ingenting av; stripen (fast på "0 vs 0", döda
+/- eftersom `avr.mode` förblev `null`) syntes alltid. Fix: `#avrLive[hidden]{display:none}`.
Det ensamt löser (2) helt — knapparna själv-gatade redan korrekt per-helper sedan v2.6.24.

**(1) byggt som en riktig fallback, inte bara en bugfix:** nytt läge `free` i `AVR_DEFS` — en bar,
osemantisk A-vs-B-räknare (`Counter: A vs B.`-loggrad). `avrRender()` växlar automatiskt till
`avr.mode='free'` så fort `avrFreeAvailable()` (`!hx('resBlock') && !hx('resVote') && !hx('resCombat')`)
är sann OCH inget namngivet läge är öppet — alltid tillgänglig, inget att klicka för att öppna den.
**Medvetet HELT LOKAL:** `avrPush()` skippar nätverket när `avr.mode==='free'` — Johans egen formulering
("man får hålla reda på själv vad det avser") tolkad som att det är en privat anteckningsräknare, inte
en delad bordsräknare, så den kan aldrig kapa en bordskamrats Block/Vote/Combat-knapp bara för att
någon annan kör utan helpers. `avrResolve()` behandlar `free` som Block (ingen batch-close, samma
bekräfta-rensa-dialog, bara med "Counter resolved" i stället för "Block resolved").

**TDZ-fälla påträffad under bygget:** `avrRender()` anropas redan vid load (`applyHelper()`, rad
~7069) — före mitt patch maskerades detta eftersom `avr.mode` var `null` där och ternären aldrig
nådde `AVR_DEFS`. Så fort auto-fallbacken sätter `avr.mode='free'` VID DET ANROPET nås `AVR_DEFS`
innan dess `const`-rad någonsin körts. Fix: flyttade `AVR_DEFS`/`AVR_HKEYS`/`avrFreeAvailable`/
`AVR_PHASES` upp till den tidiga `avr`-deklarationen (samma TDZ-disciplin som v2.6.20).

**(3) sida-vid-sida:** `sayBubble()` satte alltid `left:50%` — nu 3 fasta kolumner (30/50/70%) via
en liten slot-tracker (`_sayFxSlots`), frigjord både vid naturlig `animationend` och vid den
befintliga 3-bubble-evictionen (som nu även städar den evictade bubblans slot).

**Gater:** client-logic 29/0 · dispatch 18/0 · protocol-lint 6/0 · canary 37/0 · bot-logic 70/0 ·
B1-roundtrip byte-identisk · syntax ×2 · check-versions agrees (alla fem dokument uppdaterade).
Server/protokoll orört, ingen wire-ändring. **EJ runtime-testat:** den fria räknaren i faktiskt
Tournament-läge och i Structured med alla tre resolver-helpers avstängda; att knapparna verkligen
visar sig cleant och fäller ut räknaren i Structured med helpers på; att tre snabbfraser i snabb
följd verkligen hamnar i tre separata kolumner utan att långa fraser (t.ex. "It resolves") ändå
överlappar vid smala skärmar.


## Uppföljning [v2.6.37 klient] – fri räknare gjord delad, inte lokal (13 juli 2026)

Johan direkt efter leverans: kändes ointuitivt att den fria räknaren skulle bete sig
annorlunda än Block/Vote/Combat — han tänkte sig att flera spelare ska kunna manipulera
den samtidigt, precis som de andra. Höll med. Tog bort local-only-specialfallet: `avrPush()`
skickar nu `free` precis som alla andra lägen, `tally()`-mottagaren accepterar `free` som
giltigt `mode`, och `avrResolve()`s clear-melding går över nätet för `free` exakt som för
Block. Ingen ny fältlista — `free` är bara ännu ett giltigt strängvärde på det redan
existerande `tally`-verbet. Gater: client-logic 29/0, dispatch 18/0, protocol-lint 6/0,
canary 37/0, bot-logic 70/0, B1-roundtrip byte-identisk, syntax ×2, check-versions agrees.


## Uppföljning [v2.6.38 klient] – snabbfrasbubblorna mittcentreras som grupp (13 juli 2026)

Johans följdönskemål på de fasta kolumnerna: att gruppen ska hålla sig mittcentrerad
medan bubblor kommer och går, och att flyttningen ska glida snyggt i stället för att
clippa. `sayBubble()` håller nu en ordnad lista (äldst→nyast) och räknar ut varje
bubblas `left%` från dess index OCH det aktuella antalet (`50+(i-(n-1)/2)*20` — som vid
n=3 exakt motsvarar de gamla fasta 30/50/70). Den nyaste bubblan sätts direkt på sin
slutgiltiga plats (ingen självglidning, bara dess vanliga pop/fade-animation spelas),
medan alla redan monterade bubblor glider till sin nya (förskjutna) plats via en ny
`.sayb{transition:left .45s}` — skopad till enbart `left` så den aldrig krockar med den
befintliga keyframe-animationens opacity/transform. Samma `sayFxRelayout()` körs både
vid naturligt bortfall (`animationend`) och vid cap-eviction, så kvarvarande bubblor
alltid glider tillbaka till en centrerad rad. Nettoeffekt: den äldsta bubblan glider
längre åt vänster ju fler nya som dyker upp, tills den försvinner eller trängs ut.
Gater: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, canary 37/0, bot-logic 70/0,
B1-roundtrip byte-identisk, syntax ×2, check-versions agrees.


## Uppföljning [v2.6.39 klient] – kvarliggande fri räknare dolde inte längre Block/Vote/Combat (13 juli 2026)

Johan hittade en riktig bugg direkt: med Helpers påslagna ersatte den fria räknaren
Block/Vote/Combat-knapparna helt. Orsak: `free` gjordes delad i v2.6.37, så när den väl
satts (t.ex. medan helpers var av) höll den `avr.mode` sant kvarliggande — och knapp-
döljningslogiken dolde ALLA namngivna knappar närhelst `avr.mode` var sant, utan
undantag för en spelare som sedan slagit på en helper igen. Fix: `avrRender()` räknar nu
ut `freeNeeded = avr.mode==='free' && avrFreeAvailable()` — knapparna och live-remsan
maskas av `free` bara för en spelare som FORTFARANDE saknar alla namngivna helpers.
`avr.mode` självt rörs INTE (så en bordskamrat som verkligen kör utan helpers och är
mitt i en räkning inte störs), och trycker någon på en riktig namngiven knapp skriver
`avrOpen()` ändå över `avr.mode` för hela bordet som vanligt — vilket städar upp eventuellt
kvarliggande tillstånd naturligt. Gater: client-logic 29/0, dispatch 18/0, protocol-lint
6/0, canary 37/0, bot-logic 70/0, B1-roundtrip byte-identisk, syntax ×2, check-versions
agrees.


## Session [bot v0.4.5] – Tre live-testfynd efter M2: slot-kollision, pacing-golv, rise-animation (13 juli 2026)

Johan testade M2-botten i Structured med helpers och rapporterade tre smågrejer efter
en kort speltest, alla i `elysium-bot.js`: (1) influerade vampyrer kan hamna ovanpå
varandra i Ready — "de behöver respektera det faktiska spelbrädet"; (2) 2 sekunder
mellan varje bot-kommando (handlingar/reaktioner) i RIKTIGT spel, men botten får köra
hur fort den vill i testmiljön/arenan; (3) klonanimationer syns inte när en vampyr
influeras upp i spel.

**(1) Rotorsak, källverifierad i `slot()`/`_openSlot`:** `slot(zone,idx)` är en ren
idx→{x,y}-formel utan minne av vem som redan står där. Ready-höjningen räknade
`this.board.filter(c=>c.zone==='ready').length-1` som index — korrekt SÅ LÄNGE zonen är
sammanhängande, men fel så fort en vampyr lämnar Ready UTANFÖR tur (combat-torpor, eller
ctrl-torpor/untorpor-undantaget från v0.4.4): den lediga MITT-platsen räknas aldrig om
till ett hål, och nästa höjning landar rakt på grannens redan upptagna plats. Exakt
samma buggklass satt i tre till ställen: `_resolveCombatRound`s torpor-placering
hårdkodade `slot('torpor',0)` — VARJE KO'd vampyr landade på SAMMA fläck oavsett hur
många som redan låg där; ctrl-togglen (`act:'torpor'`/`'untorpor'`) rörde aldrig x/y alls
vid zonbyte, så en "återuppväckt" vampyr behöll koordinaterna från sin FÖRRA zon; och
`_addUnc` använde `this.unc.length` (samma hål-risk när en uncontrolled-kort redan höjts
bort ur mitten av arrayen). **Fix:** ny `_openSlot(zone, exclude)` skannar
`slot(zone,0)`, `slot(zone,1)`, … och returnerar första platsen INGEN ANNAN karta i
zonen redan upptar — samma funktion på alla fyra ställen i stället för fyra separata
(och tre av dem felaktiga) räknesätt.

**(2) Pacing-golvet (`paceMs`, redan 2000 i riktigt spel / 0 i tester/arenan via
`elysium-bot-arena.js`/`-table.js`s egna `--pace`-flaggor, oförändrat) höll inte
överallt.** Den gamla `pace()` var en blind `sleep(paceMs)` anropad inkonsekvent:
minion→influence- och influence→discard-turfasövergångarna saknade paus HELT (en
obesvarad bleed som gick igenom direkt kunde följas av en influence-höjning i samma
ögonblick), och en wake+intercept- eller strike+prevent-dubbelkombo i en reaktion kunde
spela båda korten synkront utan mellanrum. Ny `_pace()`-gate ersätter den lokala
closuren: väntar ut ENDAST resten av `paceMs` sedan `this._lastActAt` (inte en blind ny
sleep varje gång) — en redan långsam `_askBlock`-väntan (upp till `askSecs`) får aldrig
en onödig extra paus ovanpå, men ett snabbt steg får alltid hela andrummet. Trädd genom
varje ny turfas-övergång, `_commitBlock`s wake→intercept-steg och
`_resolveCombatRound`s strike→prevent-steg — båda funktionerna är nu `async`; anropen
är fire-and-forget med `.catch()` där de körs från synkron kod (`_onLog`,
`_reactWindow`s `setTimeout`, samma mönster som `_playTurn().catch(...)`), direkt
`await` där de redan låg inne i `_playTurn`. `react-delay` (tänkepausen bakom "Hold
on…") golvade tidigare på `min(thinkMs, paceMs×2)` = 1.6s vid standardpersonan (under
2-sekundersönskemålet) — golvar nu på `max(paceMs, thinkMs)` i stället, så en persona
kan göra pausen LÄNGRE men aldrig kortare än bordets egen takt. **Medvetet avgränsat:**
`_onBlockAttempt` (botens EGEN stealth-kortsvar när NÅGON ANNAN ropar "Block!" på dess
bleed) fick ingen ny paus — den spelar bara ETT kort, och att tråda om den hade krävt
att göra `_onSay` async för en marginell vinst; flaggat här hellre än att tyst hoppa
över det.

**(3) Influence fick sin klon.** `fxClone()` skickade alltid hårdkodat `kind:'play'`
och `reveal:undefined` — ny valfri tredje `opts`-parameter (`kind`/`reveal`, utelämnad
= byte-identisk med den gamla tvåargumentsformen) låter höjningen skicka `kind:'rise'`,
`reveal:true`: exakt samma `cardFx(c,'rise',{reveal})` som klientens EGNA
uncontrolled/torpor→ready-`move()` redan avfyrar för en människas bring-into-play.
Protokollet (§8) och servern whitelistade redan `rise` sedan v2.5.63 — botten skickade
det bara aldrig. Noll server/klient-ändring, ingen wire-nyhet.

**Nya tester (8, mestadels offline enligt etablerat recept):** `_openSlot` mot en
simulerad "hål i mitten" för ready (+ en sanity-check att fyndet inte är grannens egen
plats), torpor och uncontrolled (3 asserts); en `fx kind:'rise'`-assertion i den
befintliga live influence-sektionen (sektion 4); tre offline-asserts på `_pace()` självt
(inget att vänta på vid första anropet, golvar korrekt vid andra, `paceMs:0` orörd).
Gater: bot **70/0 → 78/0** (körd 3× utan flakiness), canary 37/0, client-logic 29/0,
dispatch 18/0, protocol-lint 6/0, check-versions agrees, syntax ×2. Klient/server helt
ORÖRDA. **EJ runtime-testat:** den fulla 2-sekunderskänslan vid ett riktigt bord över en
hel match (gaten är enhetstestad isolerat och varje anropsplats källgranskad, men aldrig
känd "på riktigt" i en levande session); wake+intercept- och strike+prevent-komboerna i
faktiskt spel (ovanliga grenar — kräver en låst sovande vampyr med ett wake-kort
respektive både ett strike- och ett prevent-kort samtidigt i handen, ingen deck i sviten
framkallar dem naturligt).


## Uppföljning [bot v0.4.6] – torpid vampyrer unlockar nu också (13 juli 2026)

Johans direkta följdfynd: botten unlockade aldrig vampyrer i torpor. Källverifierat mot
vekn.net-regelboken: "A vampire in torpor is still considered controlled but is not
ready. They still unlock at the start of the unlock phase." — torpor och lock/unlock är
alltså två SKILDA flaggor; en torpid vampyr förblir inte redo, men dess lock-flagga
rensas ändå varje unlock-fas precis som en redo vampyrs. Den gamla koden rörde bara
`zone==='ready'`, så en torpid vampyr låg låst för evigt (fel både kosmetiskt — klienten
visar en kvarhängande lock-glyf — och mekaniskt, för kort som läser en torpid minions
lock-status). Fix: UNLOCK-blocket extraherat till en egen `_unlockPhase()` (samtidigt
direkt testbar offline) som rensar lock på BÅDE ready- och torpor-zonen. Städade även bort
en föräldralös `torporN`-variabel (kommentaren på dess enda referens sa redan "no longer
needed" — ett litet spår efter en tidigare refaktorering). Nytt test (offline): tre kort
(låst ready, låst torpor, redan-olåst ready) — `_unlockPhase()` rapporterar exakt 2
faktiskt påverkade, och verifierar att den redan-olåsta tredje inte felräknas. Gater: bot
**78/0 → 80/0** (körd 3× utan flakiness), canary 37/0, client-logic 29/0, dispatch 18/0,
protocol-lint 6/0, check-versions agrees, syntax ×2. Klient/server orörda.


## Session [bot v0.5.0] – §7.6 SHIPPED: masters, hunt och pool-ekonomi (13 juli 2026)

Johan gav klartecken på hela 7.6-paketet efter en design-runda med tre riktiga beslut,
inget gissat. **(1) Fas-exakt passiv inkomst, inte v1-croppen.** Blood Doll/Vessel-timingen
lever nu som DATA — ett nytt `phase`-fält per mode i `cardfx-curated.json`
(`phase:'master'` respektive `phase:'unlock'`) — inte hårdkodad bot-logik, exakt Johans
poäng om att bygga upp ett regeltekniskt kortbibliotek "pö om pö". Verifierade
`cardfx-compile.js`s overlay-funktion (`Object.assign` helentry-passthrough) innan jag rörde
något — noll ändringar behövdes där. `elysium-cardfx.json` (den kompilerade filen botten
faktiskt läser) fick samma fält handpatchat, eftersom miljön saknar `vtes.json` för en
riktig omkompilering — **`test-cardfx.js` gick alltså INTE att köra här**; Johan bör köra
den lokalt en gång som slutkontroll (overlay-mekanismen garanterar att den håller med).
Dreams of the Sphinx fick MEDVETET inget `phase`-fält (dess enda mode bär tre fx-nycklar
som troligen vill ha olika fas-semantik — flaggat i sin egen curated-not, inte tyst
struket). **(2) Frivillig jakt, persona-vägd** — `decide('hunt-or-bleed')` återanvänder
samma `score>=1`-konvention som block-as-target: `(urgency×1.5)÷aggression`. Ingen ny
persona-vred behövdes; aggression fångar redan rätt axel (novice toppar upp vid ~53% tomt,
grinder ~67%, shark ~80%) — en riktig gradient, inte av/på. **(3) Hunt-block PARKERAT, inte
byggt** — den generella förmågan (kan jag lagligt blocka DEN HÄR hunten) hör hemma i
grundlogiken den dagen den byggs, men om en persona VILL är policy, samma delning som
`blockShy` redan är för bleeds. Dokumenterat här så det inte ser bortglömt ut.

**Vad som faktiskt skeppades (A–D plus tre saker som dök upp organiskt under
designsamtalet):** **A** Master-fasen (tidigare en tom kommentar sedan v0.1) spelar nu
kända inkomsttillgångar (`_bestMasterFor`), trifle (Vessel) ger en bonusaktion som låter
Blood Doll hänga med samma fas (`decide('master-play')` — ordningen är den enda riktiga
frågan, inte persona-vägd eftersom mer inkomst är bra för alla). Permanenter fästs på en
vampyr via samma `host`/`attached`-konvention klienten redan har för utrustning — vilket
avslöjade att `buildPub()` aldrig skickade de fälten (inget hade någonsin fästs på något
tidigare), så andra spelare hade sett kortet flyta löst. **B** Hunt: tvång vid 0 blod
(källverifierat: odirigerad, +1 stealth, "must be announced and resolved before any other
actions"), frivilligt enligt formeln ovan — återanvänder EXAKT samma announce→`_askBlock`→
resolve-form som Bleed (en prey/predator kan fortfarande blocka den, källverifierat att
odirigerade actions blockas av just prey ELLER predator). Inget nytt wire-verb — Hunt var
redan bara klientens generiska `act('hunts.','hunts')`-loggrad. **C** `_applyPhaseIncome`
anropas från både `_unlockPhase` och nya Master-blocket, läser `phase`-fältet generiskt —
`bloodToPool` är en TRANSFER (aldrig en gåva ur intet, vaktad på att värden faktiskt har
blod). **D** Discard slutar kasta masters ovillkorligt (utbrutet till `_deadHandIndex` för
testbarhet, samma resonemang som `_unlockPhase`s egen v0.4.6-utbrytning) — **plus en
breddning Johan bad om**: en bounce-tagged mode (Deflection-klass) är nu död fodder i ett
2-levande-spelare-bord, inte via en parallell specialgren utan genom att bredda
`_modeUsableBy` självt (`predSeat()===preySeat()` — ny liten hjälpare, symmetrisk med
`preySeat()`, var alltid inlinead som `prevLive(this.seat)` förut) — samma bordsstrukturella
fakta M2:s `_reactWindow` redan räknar ut per motståndare, nu gratis för ALLA anrop av
`_modeUsable`. **E/F** Fasrad-parity: att klicka en människas fasknapp är bara
`log('Phase: <b>X</b>.')` utan `localOnly` (bekräftat i klientkällan — `activatePhase()` →
`log()` → `mpRelay()`), så en ny `_announcePhase()` skickar samma rad vid alla fem
fasövergångar, gated på `caps.tally` (samma signal som redan slår om botten till
informerat läge). Pass fick motsvarande `'<b>Turn passed.</b>'`-rad OVILLKORLIGT (Pass är
inte self helper-gated som de fem fasknapparna). **G** Edge-inlösen: källverifierat mot
vekn.net att Edge ger rätt till +1 pool i egen unlock-fas, frivilligt för en människa —
botten har spårat VEM som har Edge perfekt sedan M2 men aldrig löst in den, gratis pool
kvarlämnad varje match. Johans regel: botten tar den ALLTID, ingen persona-gate.

**En riktig bugg hittad UNDER testandet, inte innan:** master-play-loopens `_drawOwed`-
räknare förlitade sig på en delad dränering som satt i slutet av minion-loopens BLEED-gren.
Hunts `continue` hoppade rakt förbi den — ett master-fas-draw kunde bli hängande en hel tur
om varje agerande vampyr råkade hunt:a istället för att bleeda. Fångat av live-
integrationstestet, inte av granskning. Fixat genom att bryta ut `_flushDraws()` och
anropa den från alla tre ställen som kan lämna ett draw skuldsatt — samma "granska varje
syskon-kodväg när en buggklass dyker upp"-instinkt som `_openSlot`.

**Tester:** 29 nya offline-enheter + ett sammanhållet live-integrationstest över riktig
server (alla fem fasannonser + Pass, tvångsjakten lyckas obemött, master-play fäster
korrekt, `_flushDraws`-fixen bekräftad). Gater: bot **80/0 → 119/0** (körd 3× stabilt),
canary 37/0, client-logic 29/0, dispatch 18/0, protocol-lint 6/0, check-versions agrees,
syntax ×2. **`test-cardfx.js` ej körd** (ingen `vtes.json` i miljön) — `phase`-tillägget
verifierat säkert genom att läsa compilerns overlay-mekanism direkt istället. Klient/server
helt ORÖRDA — rent bot-fil- och cardfx-bibliotek-arbete. **EJ runtime-testat:** hela
paketet mot ett riktigt bord över flera turer i följd (gaten är enhetstestad + ett
sammanhållet live-test, men aldrig känt "på riktigt" i en levande session); Blood
Doll/Vessel-timingen specifikt över FLERA turer där båda faktiskt ackumulerar blod att
flytta (dagens test riggar startläget direkt, aldrig ett naturligt flöde över tid).


## Uppföljning [bot v0.5.0] – vtes.json, test-cardfx.js på riktigt + L2/L3/L4-frågan (13 juli 2026)

Johan bifogade `vtes.json` (KRCG v3-format — v5 kommer, inte tillgänglig ännu). Riktig
omkompilering + `test-cardfx.js` körd på riktigt: **46/0, drift-checken ren** —
`elysium-cardfx.json` är nu en genuin färsk kompilering (ersätter gårdagens handpatchade
fil; identiskt innehåll, bara annan whitespace). Bekräftar att handspegling var korrekt.

Johans fråga om L4 vs L2+L3 krävde riktig efterforskning, inte gissning — och gav ett
klart svar: L2/L3/L4 är INTE en responsiv brytpunktsstege utan bordsstil+zoomläge
(`net.view`: `'l2'`=Structured Normal, `'ov'`=L3 Helicopter — bara nåbar FRÅN L2,
`'l4'`=Classic Free Board). Fasraden (`#phases`) är ett DELAT element gated på den
generella `hx('on')`-helpern, inte bordsstil — bara DEFAULT skiljer sig
(`syncOffTournament()`: Classic defaultar turnering PÅ, Structured AV), och botten som
gatear på observerad `caps.tally` följer bordets FAKTISKA läge oavsett. Attached-kort-
rendering (host/attached för Blood Doll/Vessel) är redan speglad mellan alla vyer:
`buildMat()` (delad av L2/L3/besök) och `renderL4OppCards()` (L4:s egen parallella
implementation, med en kommentar som uttryckligen säger "exactly like L4" om buildMat —
avsiktligt hållna i synk) har IDENTISK host/attached-hantering, verifierat genom att läsa
båda. Den etablerade "L4 dispatch chain drift"-buggklassen gäller nya WIRE-VERB, inte nya
FÄLT på ett redan fullt kopplat verb — den här sessionens `host`/`attached`-tillägg red på
den befintliga `board`/pub-kopplingen, ingen ny dispatch-gren behövdes. Full detalj i
learnings.md.


## Session [bot v0.5.0 → v0.5.1] – Ny kortlek analyserad, Edge-rättelse, generaliserad fas-ekonomi (14 juli 2026)

Johan bifogade en ny, riktig kortlek — "Leveraging my Hacking Skills", en förenklad Weenie
Computer Hacking-arketyp (fann en väldigt närbesläktad TWDA-lista online). Källverifierade
VARJE korttext mot `vtes.json` istället för att lita på auto-fx-sammanfattningen ensam, och
det gav flera genuina fynd: **Leverage** bränner Edge för +1 bleed (ingen disciplin —
kryptans Dominate-tyngd är för Deflection-försvar, inte bleed-boost); **Ashur Tablets** är
en TRÖSKEL-mekanik (3 exemplar i spel hos VEM SOM HELST → bränn för +3 pool + ash-heap-
grävning), inte löpande inkomst; **Effective Management** flyttar översta kryptakortet till
okontrollerat (noll fx idag); **Information Highway** ger +2 transfers; **The Parthenon**
låter dig låsa den för +1 Master-handling; och bottens combat-modul läser bara
`fx.prevent` — `fx.dodge` (hela den här lekens combat-svit) är helt ohanterad.

**Rättelse från Johan, mitt i genomgången:** Edge-bonusen i unlock-fasen är PASSIV — att
hålla Edge ett helt varv ger bara ÄVEN +1 pool ur blodbanken, det är ingen växling och
förbrukar inte Edge. Att bränna Edge är ett separat aktivt val (Leverages bleed-boost,
eller en grundhandling för +1 röst). Koden var redan rätt (`_unlockPhase` rör aldrig
`this.edge`) — bara PROSAN som beskrev det ("kvitterar ut") var slarvig, rättad i kod och
dokument. Den tidigare flaggade "krocken" med Leverage drogs tillbaka — ingen konflikt
finns, båda kan fås samma match.

**Designsamtal → tre beslut, byggda samma session:**
1. **"Alltid spela ett masterkort om man har ett"** — biblioteket definierar vad kortet
   gör, personan avgör vilket vid flera val, ett OKURERAT kort spelas ändå (kostnad
   betalas, placeras som en egen fristående permanent, ingen host) — en människa rättar via
   ctrl om det behövs, samma anda som bot-elements-undantaget redan etablerat.
2. **Generaliserad fas-handlings-ekonomi** — kollade klientens EGNA `phaseActs`/
   `phaseUsed`/`masterBonus` direkt i källkoden innan något byggdes. `this.phaseActs`
   (permanent baslinje, omräknad varje egen tur av `_recomputePhaseActs()` från in-play-kort
   med det NYA `actGrant{persist:'inplay'}`) + `this.phaseBonus` (temporär, nollställs
   varje egen tur) + `this.phaseUsed` → `_phaseAvail(k)`, nu delad av Master/Influence/
   Discard. Hållen INLINE i botten, inte utbruten till en fil klienten också kunde
   importera — Johans beslut: aritmetiken är för liten för att vara ett underhållsproblem,
   och riktig delning blir bara relevant den dag hela cardfx är indexerat OCH klienten får
   egna auto-tolkande Helpers ("långt fram om ens alls").
3. **Trifle och bespoke-bonusar konkurrerar INTE** — Trifle är en universell nyckelordsregel
   (max +1/tur oavsett hur många trifles spelas, `_grantTrifleBonus()` med egen tur-flagga);
   ett framtida bespoke-kort (Parthenon) skulle bidra via det nya `actGrant`-fältet istället,
   till SAMMA `phaseBonus.master`-pott men från en oberoende källa, ocappad av Trifles eget
   tak. Konkreta regler för Parthenon/Information Highway/Effective Management/Ashur Tablets
   medvetet INTE skrivna än — Johan vill ha den generella mekaniken på plats först.

**Skeppat:** `_bestMasterFor` returnerar nu ALLA rådiga masterkort (taggade known/unknown),
`decide('master-play')` prioriterar trifle+känt-par, sen vilket känt kort som helst, sen —
den nya reträttvägen — det billigaste okurerade kortet, istället för att spela ingenting.
`_phaseAvail`/`_recomputePhaseActs`/`_grantTrifleBonus` (alla direkt enhetstestade, samma
utbrytningsdisciplin som `_flushDraws`/`_deadHandIndex`). `actGrant`-schemat dokumenterat i
`elysium-cardfx-design.md` §4 — ren infrastruktur, inget skeppat kort använder det än. 13
nya offline-enheter + ett nytt live-integrationstest (ett okurerat Ashur Tablets spelas
fristående, ingen host). Gate: **119/0 → 132/0** (körd 3× stabilt). Klient/server orörda.


## Uppföljning [bot v0.5.1 → v0.5.2] – stealth-mekanismen universell, riktig lek som standard (14 juli 2026)

Johan bekräftade phaseActs-planen och gav två till uppdrag. **(1) "Varje handling ska
behandlas i grund lika"** — grundmekanismen (kan svara på Block! med ett stealth-kort) ska
finnas för ALLA handlingar, personan avgör bara HUR VILLIG den är per handlingstyp. Hittade
den exakta luckan: `_actingVamp` (som `_onBlockAttempt` läser för att hitta ett stealth-kort)
sattes ALDRIG i hunt-grenen — bara i bleed-grenen. Fix: samma kabeldragning i hunt som bleed
(`_actingVamp` satt före asken, nollställd efter). La även till en `stakes`-vägning i
`decide('spend-stealth')` — en bleed på 2 (dagens baslinje, oförändrat beteende) väger 1.0,
hunts fasta 1-blods-pris väger 0.5 — så samma persona/läsning nu SVARAR på en vanlig bleed
men INTE bränner ett stealth-kort på en låg-värdes hunt. Ett befintligt offline-test behövde
uppdateras (skickade inget `stakes` alls förut, vilket nu default:ar till 1 och hade vänt
novice-resultatet) + ett nytt test som visar exakt den vägningen + ett nytt live-test som
verifierar hela kedjan på riktigt (shark-persona, uträknat för hand: 1.2×(1−0.9×0.15)×0.5 =
0.519 ≥ 0.5, alltså en riktig men smal marginal, inte gissad).

**(2) `DEFAULT_DECK` bytt till Johans riktiga "Leveraging my Hacking Skills"** (12/62,
alla namn verifierade mot fx). Det här avslöjade en genuin, om än flaktig, testbugg:
sektionerna 1–9 (den långa grundläggande anslutnings/tur/bleed/combat-svepet) hade ALDRIG
skickat en egen `deck`-option — de förlitade sig TYST på `DEFAULT_DECK`, inklusive §8:s
alias-stege-test (behöver "Zip" i kryptan) och §5b:s discard-test (behövde en Obfuscate-
gated stealth-kort som är dött mot en ren Animalism-krypta). Med den nya leken (ingen
Obfuscate i biblioteket alls, mest disciplinlösa kort) blev discard-testet flaxigt — ibland
fanns ett dött Deflection-kort (om ingen Dominate-vampyr råkade vara redo), ibland inte.
Fix: pinnade HELA det svepet till en explicit lek, identisk med den GAMLA `DEFAULT_DECK`,
frikopplad från vad standardleken råkar vara vid varje given tidpunkt — samma disciplin som
redan gällde alla ANDRA tester, bara missad för just detta första, äldsta test-flödet.

Gate: **132/0 → 135/0** (körd 4× stabilt, inklusive upprepade körningar av den fixade
sektionen specifikt). Klient/server orörda.

**Nästa session (Johans plan, uttryckt 14 juli):** taggning/indexering av bottens kort,
en sektion i taget, med Masters först (Ashur Tablets/Effective Management/Information
Highway/The Parthenon). Fullständig "börja här"-post i `elysium-backlog.md`, allra
högst upp i §4/kod-backlogen. **Viktigt att kolla direkt:** är `vtes.json` bifogad DEN
nya chatten? Uppladdade filer följer inte med mellan konversationer (bara projektfiler
gör det), och den kompilerade `elysium-cardfx.json` sparar INTE den råa korttexten för
auto-taggade kort — bara de extraherade fx-nycklarna. Utan `vtes.json` på nytt går det
inte att verifiera de fyra kortens exakta regeltext igen.


## Session [cardfx v1.4.0] – Persistent + Lock rulebook-taggar, compiler-svep (14 juli 2026)

**Analys/design-del (ingen kod):** Gick igenom Johans föreslagna tagg-taxonomi (Persistent/
Active/Passive/Lock/Timing/Cost) mot koden och `vtes.json` innan något byggdes. Bekräftade
Parthenons hela rad (type/cost redan datapunkter, unique redan kodad via `_mayPlay`/
`_inPlayNorms` table-wide). Rekommendationer som landade: **Persistent** entry-level (inte
per-mode, till skillnad från `dir`); **Active/Passive** ingen egen tagg — härleds ur
`lock`/`phase`-närvaro; **Lock** mode-level (mirror `dir`), bredare regex än bara "card";
**Timing** återanvänd befintliga `phase`-fältet istället för ny nyckel. Kvantifierat mot
verklig `vtes.json` innan kod skrevs (162/525 Masters "location"-förankrat, 421/525 (80%)
persistent totalt, 145 "lock this X" varav 89 Masters) — alla siffror bekräftades sedan
(med smärre justeringar, se nedan) av den riktiga kompilatorkörningen.

**Byggt:** `cardfx-compile.js` v1.3.0 → **v1.4.0**. Två nya rulebook-verifierade auto-taggar,
samma familj som v1.2.0:s `unique`/`limited`: **`persistent`** (entry-level på `lib`) och
**`lock`** (per-mode, sitter bredvid `dir` — inte i `fx`). `test-cardfx.js` fick 19 nya
asserts (46/0 → **65/0**, riktig `vtes.json`, drift guard grön). `elysium-cardfx.json`
omkompilerad på riktigt (inte handspeglad). Klient/server/bot orörda.

**Fyra RIKTIGA buggar hittade genom att faktiskt köra och läsa resultatet** (inte antagna
grönt bara för att koden såg rimlig ut — Johans "är det något du är osäker på?"-instinkt
tillämpad på min egen kod den här gången):

1. **Mode-emission-gaten var fx-only.** `libModes()`s gruppering körde
   `if(!Object.keys(d.fx).length) return` — ett segment utan KÄND fx blev aldrig ett mode
   alls. Parthenons hela text ("lock this card to get +1 master phase action") har ingen
   fx-nyckel i v1-vokabulären → **The Parthenon fick noll modes**, `lock`-taggen skulle
   aldrig synas trots att koden "fungerade". Fix: gaten vidgad till `fx OR dir OR lock`
   (strikt mer tillåtande — inget befintligt fx-bärande mode kan påverkas).
2. **"unlock"/"block" innehåller substrängen "lock this".** Ett första körning av
   `/lock this \w+/i` gav 270 träffar, inte de förväntade 145 — 125 falska positiva
   (As the Crow: "**Unlock this** minion", Anarch Secession: "cannot **block this**
   action"). Fix: ledande `\b` framför "lock". Verifierat genom att räkna om och jämföra
   mot en oberoende Python-körning från analys-delen.
3. **Deflections `[DOM]`: "As above, but do NOT lock this vampire."** En naiv as-above-
   ärvning hade kopierat `[dom]`s `lock:true` rakt av till den överlägsna nivån — precis
   motsatsen till vad kortet säger (den överlägsna nivån TAR BORT lock-kostnaden). Fix:
   tre-tillstånd (true/false/undefined) — en negation sätter `lock:false` EXPLICIT, vilket
   blockerar arvet (till skillnad från `undefined`, som hade ärvt). Devil-Channel: Throat
   är spegelbilden (inferior har ingen lock, superior LÄGGER TILL en) — verifierat att
   båda hanteras rätt. Känd, accepterad kvarvarande brist: Gift of Sleep har en genuin
   "Lock that ally" OCH en orelaterad negation i SAMMA segment — if/else-if låter
   negationen vinna, ally-låsningen missas helt (en miss, inte en felaktig tagg).
4. **Equipment/Ally/Retainer/Event missades näst intill helt.** Textmönstren (location/
   put-in-play) fångade bara 18/164 Equipment, 0/119 Allies, 0/54 Retainers, 1/40 Events —
   dessa korttyper skriver aldrig ut "put this card in play" eftersom persistens är
   IMPLICIT i typen (exakt vad Johan sa i sitt ursprungliga meddelande). Hittades av
   sweep-audit-rapportens typfördelningstabell, inte av någon enskild kortgranskning. Fix:
   typ-check FÖRST (`equip`/`ally`/`retainer`/`event` → `persistent:true` ovillkorligt),
   textmönstren blir en fallback för övriga typer. Power/Conviction övervägdes och
   AVFÄRDADES efter att ha läst exempel (Donate, Second Sight — båda bränns-för-effekt,
   inte stannar-i-spel) — Johans ursprungliga lista var exakt rätt, ingen anledning att
   utöka den.

**Siffror (riktig kompilering):** `persistent` 1194 av 2364 lib-entries (836 fx text-
mönster + 358 typ-implicit); `lock` 149 (145 "lock this X" + 11 "lock that X" − överlapp
− negationer − 1 curated-maskad). Bland Masters specifikt: 525 totalt, 418 persistent
(80%), 90 lock-gated, 330 persistent-men-ingen-lock (kurateringskö för `phase`/
`actGrant:inplay`).

**Levererat:** `cardfx-sweep-audit.md` — fristående granskningsfil (ej del av pipelinen)
med hela träffytan: alla 525 Masters rad för rad (persistent/grund/lock), alla 149
lock-taggade kort (alla typer) med matchad textsnutt, de 11 negationsfallen, typ-
fördelningen för icke-Masters, och en explicit lista över kända uppföljningar. Genererad
av `gen-sweep-audit.js` (körbar igen vid behov).

**Kända uppföljningar, inte byggda än:**
- De 4 curated-tier-korten (Blood Doll, Vessel, Dreams of the Sphinx, Inside Dirt) får INTE
  de nya taggarna automatiskt — curated skriver över hela auto-entryn. Behöver `persistent`/
  `lock` tillagt för hand om full konsekvens önskas (Dreams of the Sphinx skulle fått båda).
- Gift of Sleep-missen ovan (känd, dokumenterad i kod-kommentar, inte fixad).
- Nästa steg per tidigare plan: curera Parthenon/Information Highway/Ashur Tablets/
  Effective Management i `cardfx-curated.json` med `actGrant`, sedan bygga `persist:'turn'`-
  läsaren + besluts-logiken för att låsa Parthenon (fortfarande odesignad, se
  `elysium-cardfx-design.md` §4).

Gate: **46/0 → 65/0** (riktig `vtes.json`, drift guard grön, körd stabilt). `elysium-cardfx-
design.md` uppdaterad (§4 schema, §5 pipeline-invarianten "modes only where fx", §6 honest
limits). Klient/server/bot orörda.


## Uppföljning [ingen kodändring] – genomlysning av de tre återstående Masters (14 juli 2026)

Johan gick igenom Effective Management, Information Highway och Ashur Tablets mot den
nya `persistent`/`lock`-taggningen och bad om verifiering plus en analys av om något
mer generellt kunde extraheras ur Ashur Tablets specifikt (dess "kontrollera 3 kopior
i spel"-rekvisit och "ta bort alla kopior från spelet"-kostnad).

**Effective Management och Information Highway:** Johans hypoteser (inga fler taggar
respektive persistent+passive redan täckt) bekräftade rakt av mot kompilerad data —
inget att bygga, bara curering av de faktiska effekterna kvarstår.

**Ashur Tablets:** sökte igenom hela biblioteket (2364 lib-entries) efter kort som
räknar sina egna kopior i spel som villkor. Fyra kort totalt, inte bara Ashur Tablets:
Shatter the Gate (samma tröskel 3, men räknat hos den specifika vampyren kortet sitter
på, inte spelaren), Spell of Life (tröskel 5, uttryckligen valfritt — "You can burn" —
till skillnad från Ashur Tablets obligatoriskt-klingande fras), och Creeping Sabotage
(kopieantalet används som X i kortets EGEN spelkostnad, ingen tröskel-konsumtion alls —
en annan mekanik helt). En separat sökning bekräftade att "ta bort ALLA kopior, även
andra spelares" är unikt för just Ashur Tablets bland alla fyra. Slutsats: fyra kort
som knappt delar konceptet och skiljer sig åt på tre oberoende axlar bär inte en
generell tagg — blir en rik `note` vid curering istället, samma bedömning som redan
gjordes för "master phase action"-textparsingen förra sessionen. Inga fler generella
taggar identifierade; hela den ursprungliga fyra-korts-genomlysningen är nu klar.

Dokumenterat i `cardfx-persistent-lock-design-decisions.md` §8 (fullständig tabell +
resonemang) och en amendment till `elysium-backlog.md`s Ashur Tablets-punkt. Ingen
kod ändrad, gate oförändrad (65/0).


## Session [cardfx v1.4.0, bot v0.5.2 → v0.5.3] – Curering av de fyra Masters + persist:'turn'-läsaren + låsbeslutet (14 juli 2026)

Johan godkände ("Yes vi kör!") att gå vidare med hela nästa steg: curera de fyra
korten i `cardfx-curated.json`, bygga `persist:'turn'`-läsaren, och besluts-logiken
för att låsa Parthenon.

**Curerat (8 lib-poster totalt, 4 nya + 4 uppdaterade):** The Parthenon
(`actGrant:{phase:'master',amount:1,persist:'turn'}`, `lock:true`), Information
Highway (`actGrant:{phase:'influence',amount:2,persist:'inplay'}`), Ashur Tablets
(persistent, medvetet INGA modes/actGrant — se nedan), Effective Management (bara
en `note`, medvetet ingen persistent-tagg). Passade även på att backfilla de fyra
REDAN curerade korten (Blood Doll, Vessel, Dreams of the Sphinx, Inside Dirt) med
`persistent`/`lock` — den tidigare flaggade uppföljningen (design-decisions §6),
stängd samtidigt eftersom filen ändå var öppen.

**Genuint fynd under implementationen:** `_recomputePhaseActs()` läser
`h.e.actGrant` — ENTRY-LEVEL, inte per-mode som `elysium-cardfx-design.md` sa.
Bekräftat mot det befintliga, redan gröna testet (`test-bot-logic.js` rad ~917:
`e: { t: ['master'], actGrant: {...} }`, aldrig nästlat i `modes`). Designdokumentet
var alltså aspirations­mässigt fel sedan 14 juli tidigare samma dag — rättat till
att spegla koden (den fungerande, testade sanningen), inte tvärtom. Utan den här
verifieringen hade Parthenons curated-post tyst blivit overksam (skriven på fel
nivå, aldrig läst).

**Bot-sidan (elysium-bot.js v0.5.3):**
- `_bestMasterFor` fick två nya fält: `persistent` och `curated` (separata frågor
  från `known`, som bara någonsin betydde "har en igenkänd inkomst-fx" — sant för
  precis Blood Doll/Vessel, aldrig för en Location).
- Master-fas-spelloopen grenar nu på `persistent`: ett persistent kort placeras på
  brädet exakt som förut; ett ICKE-persistent kort (Effective Management) resolvar
  nu direkt till den publika ash heap:en (`_toAsh`) istället för att parkeras på
  brädet för evigt — den konkreta buggen som motiverade hela grenen.
- `decide('master-play')`s fallback-meddelande och chat-suffixet "(uncurated —
  adjust if needed)" bytte gate från `known` till `curated` — en curerad Location
  utan känd inkomst-fx (Parthenon m.fl.) ska inte längre säga att den kan behöva
  justeras för hand.
- Ny `_considerTurnActGrants(phaseKey)` — motsvarigheten till `_recomputePhaseActs`
  för `persist:'turn'`. Körs EFTER `_unlockPhase()` (ett kort låst förra turen
  måste låsas upp först) och FÖRE fasens egen spelloop (så en beviljad bonus syns
  av loopens allra första `_phaseAvail`-koll). Skannar brädet efter olåsta kort
  med matchande `actGrant`, frågar `decide('lock-actgrant')`.
- Ny `decide('lock-actgrant')`-gren: ovillkorligt ja för Parthenon specifikt (ingen
  värd att konkurrera om, ingen uttalad handlings-kostnad att låsa den, ett fast
  belopp — genuint ingen nackdel, inte en förenkling) men en egen `case` (inte
  hårdkodad i anroparen) så ett framtida flervals-kort (Dreams-of-the-Sphinx-stil)
  får en naturlig plats för persona-vägd logik senare.

**Tester:** 7 nya cardfx-asserts (curated overlay-precedence-sektionen, verifierar
alla åtta curated-posternas kompilerade form + actGrants entry-level-placering).
19 nya bot-asserts: fyra offline-enheter för `_bestMasterFor`s nya fält, fyra för
`_considerTurnActGrants` (lås, redan-låst-skip, fel-fas-skip, respekterar ett NEJ
från decide — inte hårdkodat ja), plus TVÅ nya LIVE-integrationstest över riktiga
bot-vändor: (23) Effective Management ashar korrekt istället för att parkeras: (24)
en fullständig två-vändors-kedja — vändning 1 spelar Parthenon, vändning 2 låser
den automatiskt och spelar BÅDA Effective Management och Information Highway samma
fas tack vare bonushandlingen (bas 1 + bonus 1 = 2). Uppdaterade även det
BEFINTLIGA Ashur Tablets-livetestet (sektion 21): var skrivet som "uncurated",
är nu curerat — meddelandetexten rättad, en explicit persistent/zone-assertion
tillagd, plus en ny assertion att chat-suffixet "adjust if needed" INTE längre
förekommer.

**Gate:** cardfx **65/0 → 72/0** (riktig `vtes.json`, drift guard grön). bot
**135/0 → 154/0** (körd 3× stabilt, inkl. båda de nya live-testerna varje gång,
ingen flakiness observerad). canary **37/0** oförändrad. check-versions: inga
riktiga drift-varningar (bara filer utanför scope för den här sessionen saknas
i arbetskatalogen, väntat). Klient/server/protokoll helt orörda.

**Kvarstår:** Ashur Tablets egen tröskel-mekanism (räkna EGNA kopior i spel,
utlös vid 3 — se `cardfx-persistent-lock-design-decisions.md` §8, medvetet inte
byggd, ingen generell tagg). Ett framtida flervals-`persist:'turn'`-kort behöver
en egen `decide('lock-actgrant')`-vägning (idag ovillkorligt ja, korrekt bara för
Parthenons specifika, avvägningsfria fall).


## Session [cardfx v1.4.1, bot v0.5.3 → v0.5.4] – Effective Managements effekt automatiserad: handler-fältet (14 juli 2026)

Efter att ha bekräftat att Parthenon/Information Highway fungerar fullt ut teoretiskt
(och verifierat två saker jag inte hade direkta test för: omlåsning över en tredje
vändning, och att `_recomputePhaseActs` faktiskt läser RIKTIG Information Highway-data
inte bara ett syntetiskt testkort — båda gröna) återstod Effective Management: bara
skalet (spelas/kostar/ashar rätt) fungerade, inte själva korteffekten.

Johan ställde en arkitekturfråga: ska den här sortens icke-generiska, spelarstyrda-
zon-manipulerande effekter (crypt/hand/ash/library) hellre vara INSTRUKTIONER till
botten än ett försök till generisk fx-vokabulär? Och går det att hålla öppet för en
framtida mänsklig auto-hjälpare utan extra kostnad?

**Research innan svar:** kollade hur crypt faktiskt representeras i klienten —
en riktig stack (`zones.crypt.at(-1)` = toppen), INTE ett spelarval. Och: protokollet
har redan verbet `drawCrypt` ("Draw the top crypt card"), som botten redan använder
för sin egen BETALDA Influence-fas-vampyrhämtning. Effective Managements effekt är
bokstavligen samma operation, bara gratis — ingen ny crypt-spårning behövdes.

**Svar:** ja till instruktion-inte-vokabulär (samma bedömning som Ashur Tablets
tröskel, §8 i design-decisions-dokumentet), och ja till öppet-för-mänsklig-hjälpare
"gratis" — handlern skickar bara samma wire-verb en klientknapp skulle skicka.

**Byggt:** nytt curated-fält `handler` (entry-level sträng) + `CARD_HANDLERS`-register
i `elysium-bot.js`, dispatchat från master-spelloopen efter att kortet är
loggat/synkat. Effective Managements handler: `cryptN > 0` → skicka `drawCrypt`,
annars logga att crypten är tom. Generisk spelloop frågar bara om en post namnger
en handler, aldrig ett kortnamn.

**Ett testfel under vägen, inte ett kodfel:** första livetestet asserterade på
`bot.unc.length` och föll. Ett fristående diagnostikskript med full loggning visade
att `cryptN` gick 8→7 korrekt (draget hände, verifierat mot den riktiga servern) —
men den nydragna vampyren sopades in i `ready` av SAMMA korts egen, obesläktade
Influence-fas-logik senare samma vändning (testleken hade redan 4 billiga Zip i
`unc` plus gott om pool). Fixat genom att assertera på `cryptN` (stabilt, monotont)
istället för `unc` (transient array annan bot-logik kan tömma). Ny lärdom sparad.

**Testat:** 2 nya cardfx-asserts, 6 nya bot-asserts (4 offline + 1 utökat livetest
som nu även verifierar hela drawCrypt-kedjan mot den riktiga servern). Gate: cardfx
72/0 → 73/0, bot 154/0 → 159/0 (3× stabilt). Klient/server/protokoll orörda (bara
det redan existerande `drawCrypt`-verbet återanvänt).

**Läget nu:** alla fyra ursprungliga Masters (Parthenon/Information Highway/Ashur
Tablets/Effective Management) fungerar fullt ut, utom Ashur Tablets egen
tröskel-mekanism (medvetet obyggd, se §8/§9 i design-decisions-dokumentet — kräver
protokollarbete för "ta bort andras kopior" som inte finns idag, `ctrl` är
ägargrindat). `handler`-mönstret är redo att återanvändas för nästa bespoke-kort.


## Session [cardfx v1.4.2, bot v0.5.4 → v0.5.5] – Ashur Tablets egen tröskel-mekanism (14 juli 2026)

Johan frågade om även Ashur Tablets egen sida (utom att ta bort andras kopior)
kunde byggas nu, givet hur billigt Effective Management visade sig bli, och
föreslog själv rekvisit för vilket askhögskort som ska hämtas: mix av
korttyper, och knapphet (många kopior totalt men få kvar).

**Rättning av mitt eget minne:** jag hade fel om regeln — "resten på toppen
av biblioteket" stämmer inte, korttexten säger "shuffle...into your library".
Bekräftade Johans egen efterföljande rättning mot källan igen innan bygge.

**Research (webbsökning) innan poängsättning:** Ashur Tablets kallas
"recursion" i strategilitteraturen, värderas för att ANPASSA SIG efter
bordssituationen snarare än en fast ordning. Master-kortsretrieval är ett
namngivet, verkligt mönster. Ingen guide ger en fast algoritm (mänskligt
"läs bordet"-beslut) — bekräftar Johans egen plan: allmän grund nu, tuna med
speltestning senare.

**Protokollresearch:** `browse`/`pileTake` gäller bara crypt/library-högarna
(serverns odragna kort), INTE askhögen (redan botens egen, spårade
brädstate) — så "flytta 1 kort till handen" är en ren lokal mutation. Men
"blanda resten in i biblioteket" behöver `pileBulk{lib,shuffle}` — finns,
passar perfekt, men aldrig använt av botten förut (till skillnad från
`drawCrypt` som redan hade ett fungerande föregångare).

**Byggt:** `handler:'ashur-tablets'`. Vid 3 egna kopior: alla till
`'burned'`-zonen (inte `'ash'` — "remove from the game"), +3 pool. Ny
`_ashScoreFor(namn)`: Master-bonus (+2) + knapphet (`1-kvar/total` från
decklistan, upp till +2) + mix (+1 om handen saknar typen). Högst poäng till
handen via `decide('ashur-retrieve')`, resten bulk-returneras med
`pileBulk`.

**En genuin testbugg, hittad genom en live-körning:** första livetestet
antog Ashur Tablets kostar 2 pool (blandade ihop med Parthenon). Ett
instrumenterat diagnostikskript (pool/edge loggat vid varje fasgräns) visade
den riktiga siffran: start+3, ingen kostnad alls — Ashur Tablets är helt
gratis, bekräftat mot compiled cardfx (inget cost-fält). Fixade testets
förväntade värde, inte koden. Ny lärdom sparad: verifiera antagna siffror
mot faktisk data även vid test-skrivande, inte bara vid handler-skrivande.

**Testat:** 2 nya cardfx-asserts, 13 nya bot-asserts (9 offline + ett nytt
livetest, 5 asserts, som verifierar hela kedjan inklusive botens FÖRSTA
`pileBulk`-rundtur någonsin mot en riktig server). Gate: cardfx 73/0 → 74/0,
bot 159/0 → 175/0 (4× stabilt, efter att ha eliminerat två separata
transienta/miljörelaterade flakiness-incidenter som inte hade med koden att
göra — verifierat genom omkörning).

**Läget nu:** alla fyra ursprungliga Masters fungerar fullt ut på botens
egen sida. Enda kvarvarande hålet: ta bort ANDRA Methuselahers Ashur
Tablets-kopior — kräver protokollarbete (`ctrl` är ägargrindat), ett
separat, större samtal, inte en snabb uppföljning. Persona-viktning av
`_ashScoreFor` medvetet sparad till speltestning.


## Session [cardfx v1.4.2 (oförändrad), bot v0.5.5 → v0.5.6] – Bordsövergripande observation för Ashur Tablets (14 juli 2026)

Johan bekräftade bot-mot-bot + notis (inte tvingad ändring) som väg framåt,
och frågade en uppföljning: fungerar det även när en MÄNNISKA når sina 3
kopior, inte bara en annan bot?

**Insikten som förenklade allt:** eftersom regeln drabbar vem som helst vid
bordet symmetriskt, behövs inget nytt wire-meddelande alls — varje spelare
(bot eller människa) kan bara observera bordet (data servern redan
relayerar, `this.table[seat].pub.cards`) och städa sina egna kopior när
tröskeln nås någonstans.

**Ett designfel hittat genom eget resonemang:** första förslaget ("kolla om
någon just nu visar ≥3 i ready") fungerar inte — den triggande spelarens
egen hanterare hinner rensa bort sina 3 kopior i exakt samma ögonblick, så
signalen är borta innan någon annan hinner titta. Löste med att spåra varje
sätes `'burned'`-antal ÖVER TID istället (`_ashurSeenBurned`) — en
permanent, enkelriktad zon vars ökning fortfarande går att observera senare.

**Ett genuint miljöavbrott mitt i arbetet:** verktygen slutade svara helt.
När de återhämtade sig fanns arbetskatalogen kvar, men den redan skrivna
och testade koden (`_ashurResolve`, `_checkAshurTableWide`, 7 offline-test)
var FÖRLORAD — bekräftat genom att faktiskt grep:a efter metodnamnen, inte
anta att filtidsstämplar betydde att allt sparats. Byggde om från den redan
genomtänkta designen.

**Byggt:** delad `_ashurResolve(iTriggered)` — egna kopior tas alltid bort,
men bara den faktiska triggern får +3 pool + askhögs-grävning (en
kollateral förlust får ingenting). `_checkAshurTableWide()` körs en gång
per egen tur.

**Botens första test med TVÅ riktiga bot-instanser samtidigt** (ett
3-sätes-spel: lätt värd + Bot A + Bot B). Ett tidigt testutkast
asserterade på rå pool och föll — inte ett Ashur Tablets-fel, utan en
obesläktad väntad mekanik: Bot A:s byte i den här sättningen råkade vara
Bot B, så Bot A:s vanliga blöd-handling drog 1 pool från Bot B, oberoende
av Ashur Tablets. Fixade genom att kontrollera frånvaron av trigger-
specifika signaler istället för den störda pool-siffran.

**Testat:** 7 nya offline-asserts + 4 nya live-asserts. Gate: cardfx 74/0
oförändrad, bot 175/0 → 186/0. Livesviten har en sedan tidigare känd
bakgrundsflakiness (miljörelaterad) — observerade fel har varje gång legat
i obesläktade delar, aldrig i den här funktionen specifikt.

**Läget nu:** Ashur Tablets fungerar fullt ut bot-mot-bot, inklusive
kollateral rensning när en ANNAN bot (eller, via samma mekanism, en
människa) når sin egen tröskel. Kvarstår: en riktig notis-UI i
människans klient (separat, större arbete i `elysium-vtes-bord.html`) och
att ta bort andras kopior via ett nytt protokollverb (samma lucka som
redan flaggades förra sessionen).


## Session [bot v0.5.6 → v0.5.7] – Bounce-fix steg 1: _commitBounce skickar nu en riktig L12.bleed-ommannonsering (14 juli 2026)

Johan föreslog att vi skulle bygga hela action-resolution-loopen (modifier-fönster
efter No block, reaktionskedja, bounce → ny Block-fråga) men vid närmare granskning
visade det sig att försvarssidans befintliga bounce-mekanism hade en grundläggande
brist som behövde fixas FÖRST: `_commitBounce` skickade en oparsningsbar fritext-rad
("the bleed is redirected to X") som inget nytt mål kunde arma sitt pending från.

**Diagnostik först, kod sedan (samma metod som tidigare):** ett 3-sätes-skript
(värd blöder → BotB bouncar → BotC ska arma pending) bekräftade att BotC:s pending
ALDRIG armades — `null` efter hela kedjan. Grundorsaken: serverns `log`-hanterare
konstruerar ett helt nytt `{t:'log', who: p.name, html}` — den vidarebefordrar
INGA extra fält, och `who` sätts alltid till meddelandets avsändare (bouncaren),
inte den ursprunglige ägaren.

**Tre patchar:**
1. `_armPending` fick en fjärde parameter `owner` — den RIKTIGA ägaren av den
   agerande minionen (= `who` vid direkt blödning, men kan skilja sig vid bounce).
   `pending.who` sätts nu alltid till `owner`, inte `who`.
2. `_onLog` L12.bleed-parsern härleder ägaren vid en Target-baserad arming genom
   att slå upp vampyrnamnet (m[1]) i alla spelares publicerade bräden
   (`this.table[seat].pub.cards`) — samma data `_inPlayNorms` redan läser.
3. `_commitBounce` skickar nu TWÅ rader: den befintliga informationsraden ("plays
   Deflection: the bleed is redirected to X") PLUS en riktig L12.bleed-matchbar
   ommannonsering ("VampX bleeds for N. Target: Y's pool.") — exakt samma format
   som en mänsklig klients pool-targeting + bleed-annons producerar. Det nya målets
   `_onLog`-parser armar nu pending korrekt via den redan befintliga L12.bleed-
   kodvägen — ingen ny parsning behövdes alls.

**Bevisat via diagnostik (inte bara testat):** `botC.pending.who = 'Johan'` (den
riktiga ägaren, inte 'BotB' bouncaren), `actingVampName = 'Lucinde, Alastor'`
bevarad genom hela kedjan. BotB:s vampyr korrekt låst (Deflection [dom]).

**Även fixat:** `_bestBounceFor` returnerar nu `mode.lock` (true/undefined) så
`_commitBounce` vet om den ska låsa den reagerande vampyren (Deflection [dom]: ja;
[DOM]: nej — samma tre-tillstånd som cardfx-compilerns egen negationshantering).
Och re-targeting-clearningen + L12.add-matchningen i `_onLog` jämför nu mot
vampyrnamnet (stabilt, identiskt genom hela kedjan) istället för `who` (instabilt
vid bounce).

**Kvar att bygga (steg 2):** anfallssidans modifier-fönster + hela action-
resolution-loopen (arkitekturskiss och regelverifiering redan klara, sparade
i design-decisions-dokumentet). Men GRUNDEN — att en bouncad blödning faktiskt
NÅR sitt nya mål — fungerar nu.

Gate: 186/0 oförändrad (inga nya tester i den här rundan — steg 1 var en ren
infrastrukturreparation bekräftad via diagnostik, inte ett nytt beteende). Nästa
steg lägger de riktiga testerna.

