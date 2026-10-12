# Persistent / Active / Lock / Timing / Cost — designdiskussionen (14 juli 2026)

> Syfte med detta dokument: Johan bad explicit om att få hans ursprungliga plan och den
> reviderade planen vi faktiskt körde på dokumenterade tillsammans med avvägningarna,
> "bara ifall vi vill utvärdera i efterhand eller återbesöka någon del i min ursprungliga
> tankegång". Det här är alltså INTE en ren facit-lista — det är en ärlig logg över vad
> som föreslogs, vad som ändrades, och VARFÖR, inklusive den plats där min egen första
> tolkning av planen missade något Johan redan hade sagt rätt från början (se §4). Följe-
> slagardokument: `elysium-cardfx-design.md` (det levande schemat, det här dokumentet
> ändras inte om schemat ändras senare — det är ett ögonblicksbevis av resonemanget),
> `cardfx-sweep-audit.md` (de faktiska sweep-resultaten).

## 1. Kontext

Bottspåret behövde Master-korts-beteende, med Parthenon som första konkreta avstamp.
Johan ville dels landa i generella taggnings-principer för hela kortbiblioteket, dels
ett specifikt bot-beteende för de aktuella korten. Det här dokumentet täcker bara
tagg-principerna (Persistent/Active/Passive/Lock/Timing/Cost) — bot-besluts-logiken
(hur/när botten väljer att låsa Parthenon) är fortfarande odesignad, se §6.

## 2. Johans ursprungliga förslag

Definitioner, som Johan formulerade dem:

- **Persistent** — kortet stannar i spel. Vissa korttyper har detta IMPLICIT: Equipment,
  Allies, Retainers, Events. För Masters är nyckelordet "Location" per definition
  Persistent. Text som "Stays in play" och "Put this card into play" signalerar samma
  sak, antingen permanent eller tills ett event triggas. Andra korttyper (Actions, Action
  Modifiers, Reactions) kan också bli Persistent via sin effekt, men mer sällsynt än hos
  Masters (exempel: Enkil Cog, en Action Modifier som stannar i spel).
- **Active** — ett Persistent-kort har en aktiv handling man kan trigga, ofta styrd av
  rekvisit (t.ex. Lock, eller "en gång per runda", "en gång per handling"). Ett Persistent-
  kort som INTE är Active är Passive (effekten gäller kontinuerligt medan kortet är kvar
  i spel). Johans eget förslag till minimal tagging: om genomlysningen visar FLER Active
  än Passive, tagga Passive istället och defaulta till Active — jobba så lite som möjligt
  med taggarna.
- **Lock** — exempel på rekvisit för att utföra kortets aktiva handling: man låser kortet.
  Andra rekvisit kan vara att spendera en token kortet har, en gång per runda, en gång
  per specifik handlingstyp osv (Johan flaggade själv att detta behöver en vidare
  gruppering av minsta gemensamma nämnare). Rekvisit kan kombineras med en kostnad
  (betala pool, bränna blod från en minion).
- **Timing** — ett rekvisit som styr NÄR under en runda effekten får triggas, t.ex.
  endast under Master phase.
- **Cost** — ett rekvisit som styr OM effekten har en betalning (bränna pool, bränna
  blod, bränna en token från kortet självt). Parthenon har ingen kostnad — om inte Lock
  ska räknas som en kostnad. Flera kostnader kan förekomma samtidigt.
- Sedan följer kortets faktiska **Effect**.

**Parthenons rad, som Johan satte upp den:** Type: Master (redan datapunkt) · Cost: 2
pool (redan datapunkt, "kolla på Vessel") · Persistent: Active (från "Location"-texten) ·
Cost: Lock · Timing: Master phase · Effect: +1 temporary Master phase action · Unique:
Yes (redan taggat + redan bot-beteende, enligt Johans egen bedömning).

**Det generella svepet Johan föreslog (sex regler):**
1. Kort med korttexten "Location" (fetstil om urskiljbart) ELLER som datapunkt i KRCG-
   filen → Persistent.
2. Kort med korttexten "Lock this card"/"Lock this" eller liknande → Lock som Cost-
   rekvisit.
3. Kort med rekvisit → Active som komplement till Persistent. Övriga → Passive default.
4. Kort med "During" i korttext → Timing-tagg.
5. Det som följer "During" → egen komplementtagg till Timing (t.ex. "your master phase"
   → "Master").
6. Effekter av typen "get an additional master phase action"/"+2 master phase actions" →
   effekten blir +additional master phase action + antal. Permanent om kopplat till ett
   Persistent:Passive-kort, annars temporärt (rinner av vid turns slut).
- Exempel Johan gav: Information Highway skulle via svepet få Persistent (Location) +
  Passive (inget rekvisit).

## 3. Min granskning och reviderade förslag (innan kod skrevs)

Läste `elysium-cardfx-design.md`, `cardfx-compile.js`, `cardfx-curated.json`,
`elysium-cardfx.json` och verkliga `vtes.json`-texter innan jag svarade. Bekräftade att
Type/Cost redan var datapunkter och att Unique redan hade både tagg och bot-konsekvens
(`_mayPlay` + `_inPlayNorms`, table-wide). Reviderade sedan fem punkter:

- **Persistent → entry-level, inte per-mode** (till skillnad från `dir`) — ett kort
  antingen stannar i spel eller inte, oavsett vilken disciplinnivå som spelade det.
  Kvantifierat mot `vtes.json`: 162/525 Masters med "location" förankrat till FÖRSTA
  raden (0 falska positiva), mot 165 om man sökte var som helst i texten (3 falska
  positiva — Aye/Unnatural Disaster/Zoning Board, där "location" syftar på ett ANNAT
  kort). Totalt 421/525 (80%) Masters persistenta när put-in-play/on räknades in.
  **Avvägning:** 80% är en majoritet — motsatt `dir` (28% riktade, så frånvaro=default
  fungerade där). Rekommenderade ändå explicit `persistent:true`-tagg snarare än att
  vända på det, eftersom regelverkets DEFAULT för ett Master-kort är icke-persistent
  (resolvar en gång, ash heap) — det är bara det här kortpoolets sammansättning som
  råkar skeva åt persistent, inte regelverket självt.
- **Active/Passive → ingen egen tagg alls.** Föreslog att helt slopa den separata taggen
  Johan bad om, och istället härleda Active ur om ett mode bär `lock` ELLER `phase`
  (redan existerande fält för Blood Doll/Vessels återkommande inkomst). **Avvägning:**
  Blood Doll/Vessel är enligt Johans EGEN definition Active (en handling spelaren
  aktivt väljer, fasbunden) trots att de inte har någon Lock-kostnad alls — så Active
  är bredare än bara Lock, och att härleda den ur `lock`-ELLER-`phase`-närvaro täcker
  båda formerna utan att lägga till någon ny bokföring. Detta gick längre än Johans
  egen "minimal tagging"-tanke (tagga det ovanligare) — istället: tagga det INTE alls,
  låt det falla ut ur befintliga fält.
- **Lock → per-mode, inte entry-level.** Motargument mot att göra den entry-level: den
  redan curerade Dreams of the Sphinx-posten hade EXAKT samma öppna fråga redan
  flaggad i sin egen kod-kommentar (tre olika lock-effekter i ett mode, olika timing).
  Enkil Cog (Johans eget exempel) visade samma sak: ett kort kan vara Passive i EN
  del av sin text och Active i en annan, samtidigt. En entry-level Persistent:Active/
  Passive-binär hade inte kunnat beskriva ett sådant kort korrekt. Kvantifierat: 145
  kort totalt matchade "lock this X" (bredare än bara "lock this card" — även "lock
  this vampire" 16, "lock this location" 17, "lock this reacting..." 14 osv), 89 av
  dem Masters, 56 överlappande med location-mönstret, 33 persistenta via put-in-play
  istället.
- **Timing → återanvänd `phase`-fältet, ingen ny nyckel.** Blood Doll/Vessels
  existerande `phase`-fält svarar redan på "vilken fas gäller det här" — samma fråga
  Johans Timing-förslag ställer, bara för en annan triggerform (automatisk vs.
  låsbar). Kvantifierat: av 89 lock-Masters hade 39 (den STÖRSTA enskilda gruppen)
  INGEN "During"-sats alls — "fri timing" är plurality, inte undantag. Namngivna
  faser bland resten: unlock (9), master (6), discard (4), resten spridda/unika
  formuleringar. Flaggade en mindre, ej akut nyans: en "vems fas"-dimension (Enkil
  Cogs "any Methuselah's minion phase", 14 kort totalt i biblioteket) — bedömdes
  inte behövas för dagens fyra kort.
- **Cost → kollapsar i praktiken till Lock för dessa fyra kort**, men riktiga
  lock+bränn-kombinationer finns (Joseph Pander: "lock this card AND burn 1 pool";
  Insurance Scam liknande) — rekommenderade strukturerad representation (inte en
  platt enum) DEN DAG det blir relevant, byggde inget nu.
- **Effekt-parsing (master-phase-action-texten) → stannar curated-only, ingen
  auto-regex.** 47 kort i hela biblioteket nämner "master phase action(s)", men de
  flesta är KRYPT-korts inneboende förmågor med olika kostnadsformer (gratis-om-redo,
  bränn-pool, lås-vampyren, bränn-Edge) — för spretigt för tillförlitlig regex,
  samma bedömning som redan gällde Blood Doll/Vessel/Dreams of the Sphinx.

**Parthenon-specifikt:** Flaggade att `actGrant{phase:'master',amount:1,persist:'turn'}`
redan fanns designat i schemat men saknade läsare (bara `persist:'inplay'` var byggd),
och att sjävla BESLUTET ("ska botten låsa Parthenon?") var odesignat. Föreslog Parthenon
som ett bra PILOTFALL för att lösa läsar-frågan: ingen värd-vampyr att konkurrera om,
ingen verklig kostnad (texten säger inte "as a master phase action", så låsningen
kostar ingen egen handlingsplats), fast belopp (+1, inget val mellan flera effekter
som Dreams of the Sphinx har).

## 4. Var min första tolkning missade något Johan redan hade sagt rätt

**Det här är den viktigaste posten i dokumentet, ärlighetsmässigt.** Johans ALLRA
FÖRSTA meddelande (§2 ovan) sa uttryckligen: *"Vissa korttyper har detta implicit så
som Equipment, Allies, Retainers och Events."* Det är korrekt, komplett, och krävde
ingen ändring.

Men när jag i §3 skrev om till konkreta detektionsregler för compilern, adresserade
jag ALDRIG den biten som sin egen signal — jag fokuserade uteslutande på de två
textmönstren (location-nyckelordet + put-in-play-frasen), eftersom det var vad min
egen datainsamling (körd mot Masters specifikt) hade byggts kring. Jag varken
bekräftade eller motsade Johans typ-baserade punkt uttryckligen — den bara föll bort
mellan analysen och den konkreta regex-designen.

Resultatet: när koden väl kördes på riktigt visade sweep-rapportens typfördelning att
Equipment fick 18/164, Ally 0/119, Retainer 0/54, Event 1/40 — de här korttyperna
skriver nästan ALDRIG "put this card in play" eftersom persistens är en regelverks-
konsekvens av TYPEN, inte något som behöver upprepas i varje korts text. Detta syntes
INTE vid granskning av enskilda korthits (varje enskilt kort såg "korrekt" ut i
isolering — inget i DESS text hade missats) — det krävdes en sammanställning per typ
för att avslöja en systematisk lucka, inte en spridd handfull missar.

Fixat under implementationen (inte i designfasen): en typ-check FÖRST i `libEntry()` —
om korttypen innehåller `equip`/`ally`/`retainer`/`event`, sätt `persistent:true`
ovillkorligt, textmönstren blir fallback för övriga typer. Power/Conviction lästes
igenom (Donate, Second Sight m.fl.) och avfärdades EXPLICIT — båda är bränns-för-
effekt-resurser, inte stannar-i-spel, trots att de tillhör samma Imbued-sida av
kortfamiljen. Johans ursprungliga lista (Equipment/Ally/Retainer/Event, INTE Power/
Conviction) var alltså exakt rätt hela tiden — det var min översättning av den till
konkret kod som först var ofullständig, inte hans instruktion.

**Lärdomen, om ni vill återbesöka liknande arbete:** när en persons instruktion nämner
FLERA olika sorters signaler för samma tagg (här: typ-baserad OCH text-baserad), se
till att VARJE signal får sin egen rad i den tekniska designen innan kod skrivs — annars
riskerar den som råkar vara lättast att kvantifiera (text, eftersom jag redan körde
statistik på det) att skugga undan den som inte kräver kvantifiering alls (typ, som
bara behöver en lista).

## 5. Vad Johan godkände och vad som byggdes

Johan svarade "Vi kör på compiler-taggarna och sweep-rapporten först" — dvs. godkände
del av planen (de två nya auto-taggarna + en granskningsbar sweep-rapport), medan
curering av de fyra korten och bot-besluts-logiken för Parthenon medvetet sparades
till senare.

Byggt (cardfx v1.3.0 → v1.4.0, gate 46/0 → 65/0, riktig `vtes.json`):
- `persistent` — entry-level, tre signaler i prioritetsordning: (1) typ-implicit
  (§4 ovan), (2) "location" förankrat till första raden, (3) put-in-play/on-frasen.
- `lock` — per-mode (bredvid `dir`, inte i `fx`), regex breddad till `lock (this|that)
  \w+` (inte bara "this"/"card") efter att ha hittat 11 till kort via "that".

**Fyra riktiga buggar till, hittade genom att köra koden — inte del av NÅGON av
planerna ovan, rena implementationsfynd:**
1. Mode-emission-gaten var fx-only — ett segment utan KÄND fx-nyckel blev aldrig ett
   mode, så Parthenons hela lock-text (ingen fx-motsvarighet finns för "master phase
   action"-bonusar) gav noll modes. Fix: gaten vidgad till fx-OR-dir-OR-lock.
2. "unlock"/"block" innehåller substrängen "lock this" — en oförankrad regex gav 125
   falska positiva (As the Crow: "**Unlock this** minion" felaktigt taggad). Fix:
   ledande `\b`.
3. Deflections `[DOM]`: "As above, but do NOT lock this vampire" — en naiv as-above-
   ärvning hade kopierat `[dom]`s lock rakt av. Fix: tre-tillstånd (true/false/
   undefined), en negation blockerar aktivt arvet. Känd kvarvarande brist: Gift of
   Sleep har en genuin "Lock that ally" bredvid en orelaterad negation i SAMMA
   segment — negationen vinner i if/else-if-strukturen, ally-låsningen missas (en
   miss, inte en felaktig tagg, medvetet inte fixat — se `elysium-cardfx-design.md` §6).
4. Equipment/Ally/Retainer/Event — se §4 ovan.

Slutsiffror: `persistent` 1194/2364 lib-entries (836 text + 358 typ-implicit), `lock`
149. Masters specifikt: 418/525 (80%) persistent, 90 lock-gated, 330 persistent-utan-
lock. Full radvis genomgång i `cardfx-sweep-audit.md`.

## 6. Öppna trådar — medvetet inte byggda, och varför

- **Timings "vems fas"-dimension** (Enkil Cogs "any Methuselah's X phase") — 14 kort
  i hela biblioteket, ingen av dagens fyra fokuskort. Ingen brådska; skulle behöva ett
  andra fält vid sidan av `phase` (t.ex. `phaseScope:'self'|'any'`) den dag ett kort
  som faktiskt behöver det curas.
- **Cost som strukturerat fält** (lock + annan resurs samtidigt) — inte byggt, bara
  identifierat som en verklig framtida form (Joseph Pander, Insurance Scam).
- **Effekt-parsing av "master phase action"-texten** — ett MEDVETET NEJ, inte bara
  uppskjutet. För spretigt (krypt vs bibliotek, olika kostnadsformer) för att vara en
  bra auto-regex-kandidat; stannar curated-only permanent, inte "tills vidare".
- **De fyra redan curerade korten** (Blood Doll, Vessel, Dreams of the Sphinx, Inside
  Dirt) ärver INTE de nya taggarna — curated skriver över hela auto-entryn. Enkelt att
  fixa för hand när som helst, bara inte gjort än.
- **Gift of Sleeps miss** (se §5, punkt 3) — skulle kräva en per-förekomst-skanner
  istället för dagens if/else-if. Låg prioritet: påverkar exakt ett kort.
- **Parthenons faktiska bot-beslut** ("ska den låsas den här master-fasen?") och
  `persist:'turn'`-läsaren — nästa planerade steg, inte påbörjat. Se
  `elysium-cardfx-design.md` §4 och `elysium-backlog.md`.
- **Ashur Tablets egen tröskel-mekanik** (räkna EGNA kopior i spel, utlös vid 3) —
  hör inte till persistent/lock-arbetet alls, men ligger i samma kö.

## 7. Om ni vill återbesöka något specifikt

> **Uppdaterad 14 juli 2026:** den här sektionen skrevs innan NÅGOT av Ashur
> Tablets-arbetet (§8–§12) hände, så den nämnde det inte alls fram tills nu —
> hittat genom att faktiskt leta, inte antaget. Ashur-specifika punkter tillagda
> nedan i samma två kategorier som redan fanns.

De beslut som är LÄTTAST att ångra/justera senare utan att rubba något annat:
- Slå ihop Active/Passive till en riktig egen tagg igen — trivialt, `!!(lock||phase)`
  finns redan överallt det skulle behövas.
- Lägga till de fyra curerade kortens taggar för hand — fem minuters jobb.
- **`_ashScoreFor`s tre poängvikter (Master +2, knapphet upp till +2, mix +1)** —
  detta är INTE kalibrerade siffror, bara rimliga startgissningar valda för att
  komma igång (§11). En isolerad, ren funktion — att justera vikterna eller lägga
  till fler faktorer kräver ingen omstrukturering, bara nya tal eller en till
  `if`-sats i samma funktion.
- **Persona-viktning av `_ashScoreFor`** — medvetet sparad till speltestning
  (Johans egen instruktion, §11). Samma anledning som ovan: funktionen tar redan
  `this` (hela bot-instansen, alltså även `this.o.persona`), så en persona-gren
  är en lokal ändring i EN funktion, ingen ny arkitektur.
- **"Välj topp-13 efter poäng" när askhögen har fler än 13 kort** — en
  implementationsdetalj jag valde tyst under bygget (samma sortering återanvänds
  för både "vilka 13 stannar i spel/blandas tillbaka" och "vilket 1 kort går till
  handen"), aldrig uttryckligt dokumenterad som ett eget beslut förrän nu. Lätt
  att byta ut mot en annan urvalsprincip om det visar sig fel i speltestning.

De beslut som skulle kräva mer eftertanke om de ändras:
- Att flytta Cost till ett strukturerat fält påverkar hur ALLA framtida curated-
  poster med kombinerade kostnader skrivs — värt att bestämma en gång, inte ad hoc
  per kort.
- Att bygga Timings "vems fas"-dimension påverkar `_recomputePhaseActs`/
  `_applyPhaseIncome` i boten också, inte bara cardfx-schemat.
- **En riktig notis-UI för en människa** (§12) — kräver arbete i klienten
  (`elysium-vtes-bord.html`, 15 000 rader, egen bygg-pipeline) som ingen del av
  den här sessionen har rört. Inte en liten ändring.
- **Att ta bort ANDRA Methuselahers Ashur Tablets-kopior** (§8/§11/§12) — kräver
  ett nytt protokollverb (`ctrl` är ägargrindat idag) plus en genomtänkt
  server-routing, i samma klass som notis-UI:n ovan, inte en snabb uppföljning.

## 8. Uppföljning, samma dag: de tre återstående Masters (Effective Management, Information Highway, Ashur Tablets)

Johan gick igenom de tre kvarvarande korten från den ursprungliga fyra-korts-listan och
bad om verifiering + en analys av om något MER generellt kunde extraheras ur Ashur
Tablets specifikt.

**Effective Management** — Johans hypotes (inget kvarstår utöver själva kort-effekten)
bekräftad mot kompilerad data: `{"t":["master"],"src":"auto"}`. Varken `unique`,
`limited`, `persistent` eller `cost` slår till — korrekt, texten ("Move the top card
from your crypt to your uncontrolled region") saknar location/put-in-play/kostnads-
signaler helt.

**Information Highway** — Johans hypotes (persistent + passive redan täckt) bekräftad:
`{"t":["master"],"unique":true,"persistent":true,"src":"auto"}`. Ingen lock → Passive
via härledningsregeln i §3. Kvar: bara "+2 transfers"-effekten, redan kartlagd mot
`actGrant:{phase:'influence',amount:2,persist:'inplay'}`.

**Ashur Tablets** — persistens-utökningen (put-in-play-signalen, byggd förra sessionen)
bekräftad som redan korrekt applicerad. Johans specifika fråga: är "kontrollera N
kopior av sig själv i spel"-rekvisitet, eller "ta bort alla kopior från spelet"-
kostnaden, generella mönster värda en tagg?

Sökte igenom hela biblioteket efter självrefererande kopie-räkning. Fyra kort totalt
(av 2364): Ashur Tablets (tröskel 3, räknas hos spelaren, konsumerar ALLA kopior i
spel — även andra Methuselahers, obligatoriskt-klingande trigger), Shatter the Gate
(tröskel 3, men räknas hos den SPECIFIKA vampyren kortet sitter på, konsumerar bara
de 3, obligatoriskt-klingande), Spell of Life (tröskel 5, räknas hos spelaren,
konsumerar bara egna 5, UTTRYCKLIGEN valfritt — "You can burn"), Creeping Sabotage
(kopieantalet används som X i kortets EGEN spelkostnad, ingen tröskel-konsumtion alls
— en helt annan mekanik). En separat sökning på "remove...copies...from the game"
oberoende av tröskel-kontext gav noll träffar utanför Ashur Tablets — kostnadsformen
(alla kopior, även andras) är unik för just det kortet.

**Slutsats: inget nytt generellt tagg.** Fyra kort delar knappt konceptet, och skiljer
sig åt på tre oberoende axlar (tröskelvärde, omfattning spelare-vs-vampire, obligatoriskt-
vs-valfritt) plus att Ashur Tablets ensamt drabbar andra spelares kopior. En tagg som
skulle fånga alla fyra vore antingen för generisk för att vara användbar, eller lika
strukturerad som att bara skriva en `note` per kort — samma bedömning som redan gjordes
för "master phase action"-textparsingen i §3 (för spretigt för regex, curated vinner).
Ashur Tablets rekvisit + kostnad blir alltså en rik `note` när kortet curereras, inte
ny schema. Med detta är alla fyra ursprungliga Masters genomlysta; inga fler generella
taggar identifierade ur den här omgången — bara curering av de fyra effekterna
kvarstår, redan i kön (§6).

## 9. Uppföljning, samma dag: curering + bot-läsare + lås-beslutet ("Yes vi kör!")

Johan godkände att gå vidare med hela återstoden av planen från §6/§7.6-FOLLOWUP i
ett svep: curera de fyra korten, bygga `persist:'turn'`-läsaren, bygga lås-beslutet.

**Curerat:** alla fyra kort fick riktiga poster i `cardfx-curated.json` — Parthenon
och Information Highway med `actGrant`, Ashur Tablets och Effective Management med
enbart en förklarande `note` (ingen ny mekanik för dem, matchar §8:s slutsats). Som
bonus: backfillade de FYRA REDAN curerade korten (Blood Doll/Vessel/Dreams of the
Sphinx/Inside Dirt) med `persistent`/`lock` — den uppföljning §6 flaggade som "enkelt
att fixa för hand när som helst" — eftersom filen ändå var öppen.

**Ett genuint dokumentationsfel hittades under arbetet, inte bara ett kodfel den här
gången:** `elysium-cardfx-design.md` beskrev `actGrant` som per-mode sedan fältet
skapades (§4 i det dokumentet, 14 juli tidigare samma dag). Men den enda kod som
någonsin läste fältet — `_recomputePhaseActs()` — hade HELA TIDEN läst det entry-
level (`h.e.actGrant`, aldrig nästlat i `modes`), bekräftat mot det befintliga,
redan gröna testet. Ingen hade märkt diskrepansen eftersom INGEN curated-post
använde fältet förrän idag — ett dokumentationspåstående utan verkliga konsumenter
kan vara fel hur länge som helst utan att något test fallerar. Om jag hade skrivit
Parthenons `actGrant` på den (dokumenterade men fel) per-mode-nivån hade det
kompilerat rent, validerat som JSON, och sedan gjort ABSOLUT INGENTING vid körning
— ett tyst fel, inte ett högljutt. Rättat i `elysium-cardfx-design.md` att spegla
den testade koden, inte tvärtom. Ny lärdom tillagd i `elysium-learnings.md` om att
just "infrastruktur ingen ännu använder" är den kod som är mest sannolik att ha
den här sortens glapp, eftersom inget någonsin övat glappet mellan prosan och koden.

**Byggt i `elysium-bot.js` (v0.5.2 → v0.5.3):** `_bestMasterFor` fick `persistent`/
`curated`-fält (separata frågor från `known`). Master-spelloopen grenar nu på
`persistent`: ett icke-persistent kort (Effective Management) resolvar till den
publika ash heap:en istället för att parkeras på brädet för evigt — den konkreta
bugg hela taggningsomgången motiverades av. `decide('master-play')`s och chattens
"(uncurated — adjust if needed)"-meddelande bytte gate från `known` till `curated`.
Ny `_considerTurnActGrants(phaseKey)` + `decide('lock-actgrant')` läser
`persist:'turn'` — Parthenons eget svar är ovillkorligt ja (genuint ingen nackdel
för just det kortet: ingen värd, ingen handlings-kostnad att låsa den, fast belopp),
men som en egen `decide()`-gren, inte hårdkodad, så ett framtida flervalskort får
en naturlig plats för riktig vägning senare.

**Testat:** 7 nya cardfx-asserts + 19 nya bot-asserts (8 offline-enheter, 2 HELT NYA
live-integrationstest över riktiga bot-vändor — en tvåvändors-kedja som bevisar att
Parthenons lås verkligen låter BÅDA Effective Management och Information Highway
spelas samma fas: bas 1 handling + bonus 1 = 2, inte 1). Uppdaterade även det
befintliga Ashur Tablets-livetestet vars kommentarer/meddelanden fortfarande sa
"uncurated" — nu korrekt "curated, men ingen igenkänd inkomst-fx", plus en ny
explicit persistent/zone-assertion. Gate: cardfx 65/0 → 72/0, bot 135/0 → 154/0
(körd 3× stabilt, ingen flakiness). Klient/server/protokoll helt orörda.

**Kvarstår, medvetet inte byggt:** Ashur Tablets egen tröskel-mekanism (se §8) —
en helt separat, bespoke bot-utökning den dag Johan vill ha den, ingen generell
tagg. Ett framtida flervals-`persist:'turn'`-kort (Dreams-of-the-Sphinx-stil)
behöver en egen vägd `decide('lock-actgrant')`-gren — dagens ovillkorliga ja är
korrekt bara för Parthenons eget, avvägningsfria specialfall.

## 10. Uppföljning: Effective Managements egen effekt + en ny arkitekturfråga ("Vad tror du är bäst?")

Johan konstaterade att Ashur Tablets/Effective Management/Information Highway/
Parthenon inte längre var likvärdiga: de tre andra fungerade fullt ut (verifierat
i föregående runda), men Effective Management gjorde bara sin PLACERING rätt
(ash istället för brädet) — själva korteffekten ("Move the top card from your
crypt to your uncontrolled region") var fortfarande omodellerad, en `note` för
en människa att utföra via ctrl.

**Frågan Johan ställde:** ska den här typen av icke-generiska effekter som
manipulerar spelarstyrda spelelement (crypt, hand, ash heap, library) hellre
fungera som INSTRUKTIONER till botten, snarare än att jag försöker hitta en
generisk `fx`-vokabulär för dem? Och: går det att hålla det öppet för en
framtida mänsklig auto-hjälpare också, utan extra kostnad idag?

**Research innan svar (inte bara resonemang):** kollade hur crypt faktiskt
representeras i klienten. Den är en riktig stack (`PILES` inkluderar 'crypt',
`zones.crypt.at(-1)` = "toppen") — INTE ett spelarval vilket kort som är överst,
till skillnad från vad Johans "spelarstyrda"-formulering först lät antyda.
Viktigare fynd: protokollet har redan verbet **`drawCrypt`** ("Draw the top
crypt card (influence)"), och boten ANVÄNDER det redan för sin egen betalda
Influence-fas-vampyrhämtning (`elysium-bot.js`, den befintliga `cheapest`-
grenen). Effective Managements effekt är bokstavligen samma operation, bara
gratis. Ingen ny crypt-spårning behövdes alltså — bara återanvändning.

**Svaret:** ja till instruktion-inte-vokabulär (samma bedömning som redan
gjordes för Ashur Tablets tröskel, §8) — men eftersom `drawCrypt` redan fanns
blev det billigare än väntat. Och ja, öppet för en framtida mänsklig hjälpare
"gratis": handlern skickar bara samma wire-verb en klientknapp också skulle
skicka, ingen delad maskin att komma överens om.

**Byggt:** nytt curated-fält `handler` (entry-level, sträng) + ett litet
register `CARD_HANDLERS` i `elysium-bot.js`, dispatchat från master-spelloopen
efter att kortet redan är loggat/synkat. Effective Managements handler: om
`cryptN > 0`, skicka `drawCrypt` (samma skydd den betalda vägen redan
använder), annars logga att crypten är tom. Generisk spelloop frågar bara "har
den här posten en handler", aldrig ett kortnamn — samma "data styr, inte
hårdkodning"-princip som `persistent`/`lock`/`actGrant`.

**Ett testfel, inte ett kodfel:** ett första livetest asserterade på
`bot.unc.length` och föll. Felsökning (ett fristående diagnostikskript med
full loggning) visade att `cryptN` gick 8→7 korrekt — draget hände — men den
nydragna vampyren sopades in i `ready` av SAMMA korts egen, redan befintliga
Influence-fas-logik senare samma vändning (den här testleken har 4 billiga
Zip redan i `unc` plus 5 pool, så "hämta en billig vampyr in i spel" utlöste
naturligt), innan pollingen hann observera den i `unc`. Fixat genom att
assertera på `cryptN` (stabil, monoton) istället för `unc` (transient array
som annan obesläktad bot-logik kan tömma senare samma vändning). Ny lärdom
sparad i `elysium-learnings.md` om just den distinktionen.

**Testat:** 2 nya cardfx-asserts (curated-datans `handler`-fält), 6 nya
bot-asserts (2 offline för `_bestMasterFor`s `handler`-fält, 2 offline direkt
mot `CARD_HANDLERS['effective-management']`, 1 utökat livetest som verifierar
hela kedjan över den riktiga servern). Gate: cardfx 72/0 → 73/0, bot 154/0 →
159/0 (3× stabilt).

**Kvarstår:** inget för Effective Management specifikt — alla fyra ursprungliga
Masters fungerar nu fullt ut (Ashur Tablets undantaget, dess egen tröskel-
mekanism medvetet ännu obyggd, se §8/§9). Mönstret (`handler` + registret)
är redo för nästa bespoke-kort utan ytterligare arkitekturarbete.

## 11. Uppföljning: Ashur Tablets egen tröskel-mekanism ("Men oj även Ashur Tablets alltså?")

Efter Effective Management frågade Johan om även Ashur Tablets egen sida (allt
utom att ta bort ANDRA spelares kopior, som redan var konstaterat kräva
protokollarbete) kunde byggas nu, givet hur billigt Effective Management visade
sig bli. Han föreslog också själv rekvisit för VILKET askhögs-kort som ska
hämtas: en bra mix av korttyper, och kort där leken har många kopior totalt men
få kvar (knapphet).

**Rättning innan bygge:** Johans egen minnesbild av regeln ("resten på toppen
av biblioteket") stämde inte — korttexten säger uttryckligen "**shuffle** the
others into your library", inte "på toppen". Verifierat mot `vtes.json` på
nytt innan något byggdes.

**Protokollresearch, mer blandad än Effective Managements:** `browse`/
`pileTake` visade sig vara specifikt för crypt/library-högarna (serverns
`p.game.crypt`/`p.game.lib`, de oöppnade korten) — INTE för askhögen, som
redan är botens egen, redan spårade brädstate. Så "flytta 1 askhögs-kort till
handen" är bara en lokal mutation, ingen serverrundtur behövs. Men "blanda in
resten i biblioteket" behöver `pileBulk{lib,shuffle}` — ett verb som FINNS och
passar perfekt, men som botten aldrig använt förut (till skillnad från
`drawCrypt`, som redan hade ett fungerande föregångare från förra rundan).

**Egen research (webbsökning) på VTES-strategilitteratur innan poängsättningen
skrevs:** Ashur Tablets kallas genomgående "recursion", värderat för att kunna
ANPASSA SIG efter bordssituationen snarare än en fast prioritering. Retrieval
av Master-kort ("essential master cards") är ett namngivet, verkligt mönster —
bekräftar Master-bonusen i poängsättningen. Ingen strategiguide gav en fast
algoritm (mänskligt "läs bordet"-beslut), vilket bekräftar Johans egen
inramning: landa en allmän grund nu, tuna med speltestning senare.

**Byggt:** `handler:'ashur-tablets'` (samma mönster som Effective Management).
Vid 3 egna kopior i spel: alla tas bort till `'burned'`-zonen (inte `'ash'` —
"remove from the game" är en annan zon, en lokal mutation precis som
`_toAsh`s mönster), +3 pool, och en ny `_ashScoreFor(namn)`-metod poängsätter
varje askhögs-kort på tre faktorer: Master-bonus (+2), knapphet (`1 -
kvar/total` från decklistan, upp till +2), mix (+1 om handen saknar typen
helt) — Johans två egna idéer plus master-mönstret från researchen. Högst
poäng går till handen (via `decide('ashur-retrieve')`, samma
gather-utanför/välj-inuti-uppdelning som `master-play` redan använder), resten
(upp till 12) bulk-returneras via `pileBulk`.

**En genuin testbugg hittad genom en live-körning, inte en kodbugg:** det
första livetestet antog att Ashur Tablets kostar 2 pool att spela (blandade
ihop det med Parthenon). Byggde ett instrumenterat diagnostikskript som
loggade pool/edge vid varje fas-gräns — visade att den RIKTIGA siffran var
start+3 (ingen kostnadsavdragning alls), eftersom Ashur Tablets är helt GRATIS
att spela — bekräftat mot den kompilerade cardfx-posten (inget `cost`-fält
alls). Fixade testets förväntade värde, inte koden. Ny lärdom sparad om att
verifiera antagna siffror (kostnader, belopp) mot den faktiska datan även
mitt under test-skrivandet, inte bara när själva handlern skrivs.

**Testat:** 2 nya cardfx-asserts, 13 nya bot-asserts (9 offline — tre för
`_ashScoreFor`s faktorer var för sig, fyra för handlern vid olika
tröskelscenarier, två för `decide('ashur-retrieve')` — plus 5 i ett nytt
livetest som verifierar hela kedjan mot en riktig server, inklusive botens
FÖRSTA `pileBulk`-rundtur någonsin). Gate: cardfx 73/0 → 74/0, bot 159/0 →
175/0 (4× stabilt).

**Kvarstår:** att ta bort ANDRA Methuselahers kopior — `ctrl` är
ägargrindat, inget i protokollet når över bordet. Ett separat, större
protokoll-samtal om och när Johan vill ha det, inte en snabb uppföljning.
Persona-viktning av `_ashScoreFor` — medvetet sparad till speltestning, som
Johan själv föreslog.

## 12. Uppföljning: bordsövergripande observation ("kan vi trigga bottens beteende när en MÄNSKLIG spelare spelar sin 3e?")

Johan bekräftade bot-mot-bot + en notis (inte en tvingad ändring) som väg
framåt, och ställde en uppföljningsfråga: fungerar det även när en MÄNNISKA
(inte en annan bot) når sina 3 kopior? Annars måste en människa manuellt
rensa botens kort — snyggare om botten känner av det själv.

**Insikten som förenklade allt:** frågan visade att den ursprungliga
"notis"-idén (ett nytt wire-meddelande den triggande spelaren skickar) inte
ens behövdes. Eftersom regeln drabbar VEM SOM HELST vid bordet symmetriskt
("remove all copies... even controlled by other Methuselahs"), räcker det
att VARJE spelare (bot eller människa) ansvarar för att observera bordet och
städa sina EGNA kopior när TRÖSKELN nås NÅGONSTANS — inget särskilt
meddelande måste skickas AV den som triggar. Ren observation av data servern
redan relayerar (`this.table[seat].pub.cards`) räcker.

**Ett designfel jag hittade genom eget resonemang, inte genom test:** mitt
första förslag ("kolla om NÅGON just nu visar ≥3 i ready") fungerar inte —
den triggande spelarens EGEN hanterare hinner rensa bort de 3 kopiorna i
exakt samma ögonblick tröskeln nås, så när det blir NÅGON ANNANS tur att
kolla är signalen redan borta. Löste det genom att istället spåra varje
sätes `'burned'`-antal ÖVER TID (`_ashurSeenBurned`) — burned är en
enkelriktad, permanent zon, så en ÖKNING i det antalet är en pålitlig
signal som fortfarande går att observera senare, även på någons allra
första tur.

**Ett genuint miljöavbrott mitt i arbetet:** verktygen slutade svara helt
under implementationen. Kod som redan var skriven och testad (den delade
`_ashurResolve` + `_checkAshurTableWide`, 7 offline-tester) gick FÖRLORAD,
inte bara pausad — bekräftat genom att faktiskt diffa mot vad som låg kvar
på disk snarare än att anta att de senast skickade ändringarna hade sparats.
Byggde om från den redan genomtänkta designen (samma diff-baserade lösning
som ovan), inte från grunden.

**Byggt:** delad `_ashurResolve(iTriggered)` — egna kopior tas bort OAVSETT
vem som triggade, men bara den som faktiskt nådde tröskeln får +3 pool +
askhögs-grävningen (en kollateral förlust får ingenting, exakt enligt
korttexten). `_checkAshurTableWide()` körs en gång per egen tur.

**Det nya livetestet — botens FÖRSTA test med TVÅ riktiga bot-instanser
samtidigt:** ett 3-sätes-spel (en lätt värd + Bot A + Bot B). Ett tidigt
utkast asserterade på rå pool och föll — inte ett Ashur Tablets-fel utan en
obesläktad, väntad mekanik: Bot A:s byte i den här 3-sätes-cirkeln råkade
vara Bot B, så Bot A:s helt vanliga blöd-handling drog 1 pool från Bot B,
oberoende av Ashur Tablets. Fixade genom att istället kontrollera FRÅNVARON
av trigger-specifika signaler (loggraden "removes 3 copies...to gain 3
pool", `pileBulk`-anrop) — samma princip som `cryptN`-vs-`unc`-lärdomen
tidigare i sessionen: välj den mest direkta, minst störningskänsliga
signalen för det du faktiskt vill bevisa.

**Testat:** 7 nya offline-asserts (`_checkAshurTableWide`/`_ashurResolve
(false)` var för sig) + 4 nya live-asserts (det nya 2-bot-testet). Gate:
cardfx 74/0 oförändrad, bot 175/0 → 186/0. Märk: livesviten har en redan
tidigare noterad bakgrundsflakiness (miljö-/tajmningsrelaterad, inte
kodrelaterad) — observerade fel har varje gång legat i OBESLÄKTADE delar av
sviten, aldrig i den här specifika funktionen.

**Kvarstår:** en riktig mänsklig-hjälpare-notis i klienten (`elysium-vtes-
bord.html`, 15 000 rader, en helt egen bygg-pipeline) — medvetet parkerad,
ett separat samtal. Att ta bort ANDRA Methuselahers kopior (även bortom
egna botar) — samma protokoll-lucka som §11 redan flaggade.

## 13. Bounce-fix + arkitekturskiss för den generaliserade action-resolution-loopen

### Bakgrunden

Johan ville bygga Leverage (en bleed-modifier som kräver Edge, spelbar
EFTER No block). Vid analys av anfallssidans blödningsflöde visade det sig
att det inte finns NÅGON mekanism alls idag för att lägga en modifier
ovanpå en redan vald blödning — `_askBlock` frågar en gång, får
block/no, och färdigställer direkt. Och en fullständig lösning krävde
inte bara ett modifier-fönster, utan en hel action-resolution-loop
(modifier → reaction → bounce → ny Block-fråga → …) per VTES-regelboken.

### Steg 1 (byggt): bounce-fixen

Diagnostiken avslöjade att den BEFINTLIGA försvarssidans bounce-mekanism
hade en grundläggande brist: `_commitBounce` skickade en oparsningsbar
fritext-rad ("the bleed is redirected to X") som inget nytt mål kunde
arma sitt pending från. Tre patchar:
1. `_armPending` fick en `owner`-parameter (den RIKTIGA ägaren, inte
   meddelandets avsändare) — behövdes eftersom serverns `log`-hanterare
   konstruerar ett helt nytt objekt och KASTAR BORT extra fält.
2. `_onLog` härleder ägaren vid en Target-baserad arming genom att slå
   upp vampyrnamnet i alla spelares publicerade bräden.
3. `_commitBounce` skickar nu en riktig L12.bleed-matchbar ommannonsering
   med Target-suffix, plus lock-hantering per mode (Deflection [dom] vs [DOM]).

### Steg 2 (arkitekturskiss, inte byggt än): anfallssidans loop

**Johans regelöversikt, verifierad mot den officiella regelboken:**
1. Handling annonseras (grund eller via kort)
2. "When announced"-modifiers (pre-block)
3. Motståndare ges möjlighet att blocka klockvis
4. Block → stealth vs intercept
5. Misslyckad block → samma spelare försöker med annan minion, eller nekar
   (irreversibelt)
6. Alla nekat → modifier-fönster öppnas (botens Leverage-plats)
7. Reaktionsfönster: motståndare spelar/utför reactions (Deflection etc.)
   eller passar — efter varje reaction har agerande spelaren ett nytt fönster
   att spela modifiers, tills alla passat i följd
8. Alla passat → handlingen resolvar

**Det löpande tillståndet som behöver spåras:**
```
{
  actingVamp, actingOwner,    // fast under hela handlingen
  amount,                     // kan öka via +X
  target,                     // kan bytas via bounce
  card,                       // handlingskort (fast, för ash heap)
  played: Set,                // same-name once per action
  declined: Set,              // irreversibelt per regelboken
  edgeBurned: boolean         // Leverage-specifikt
}
```

**Johans svar på tre osäkerheter:**
1. **Hur en bounce syns:** "man sätter target på den man vill bounca
   till och spelar kortet, som då genom klonamination och logg visar vem
   som är target" — bekräftar att Target-suffixen på nästa rad ÄR signalen.
2. **"Alla har passat" på anfallssidan:** man inväntar inte alla explicit,
   men om någon skickar Hold on... signalerar det att denne vill göra
   något — varpå denne passar när klar. **Den befintliga `pausedBy`-
   mekaniken löser redan detta utan ny kod.**
3. **_actingVamp livstid:** "Resolve som slutlig markör att handlingen
   är stängd" — dvs. `_actingVamp` lever hela vägen tills "It resolves"
   sägs, inte bara tills "No block".

