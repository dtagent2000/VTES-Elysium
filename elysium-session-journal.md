# Elysium – Sessionsjournaler

> Bakgrundsdokument som ger kontext till varför Elysium ser ut som det gör: designbeslut, teknisk evolution, och vad vi lärt oss längs vägen. Läs detta som komplement till `elysium-project-context.md` och `elysium-learnings.md`.

---

## Session 1 – Idé & Proof of Concept (11 juni)

### Bakgrund och målbild
Johan ville ha ett bättre alternativ till **Lackey CCG** och **Tabletop Simulator** för att spela *Vampire: The Eternal Struggle* (VTES) online. Båda alternativen hade nackdelar: Lackey är ful och klumpig, TTS är för avancerat för att komma igång med. Önskemålet var en **enkel webbapp** med lösenordsrum, VDB-lekimport, och hyfsad visuell känsla (mjuka animationer, rätt zoner), men **ingen regelmotor** – spelarna styr reglerna precis som vid ett fysiskt bord.

### Teknikval och motivering
Tre gratis byggstenar identifierades:
- **Kortbilder + data:** `static.krcg.org` serverar alla VTES-kortbilder som JPG/WEBP (filnamn = normaliserat kortnamn) + fullständig `vtes.json` med all kortdata. Ingen Lackey-bildlicens behövs.
- **Lekimport:** VDB (`vdb.im`) exporterar Lackey/text-format – trivialt att parsa.
- **Server:** Liten Node + WebSocket (~200 rader) för rum och state-filtrering per spelare.

**Arkitekturprincip från dag ett:** Allt i én självständig HTML-fil (vanilla JS, noll beroenden). Servern som separat Node-fil (noll npm-paket). Denna princip har hållit hela projektet igenom.

### Dark Pack & Licensing
VTES-fan-projektet täcks av Paradox Interactives **Dark Pack**-avtal:
- Gratis, icke-kommersiellt
- Tre krav: Dark Pack-loggan + exakt juridisk text ("Portions of the materials are the copyrights and trademarks of Paradox Interactive AB...") + inofficiell-notis
- Donationer (Ko-fi etc.) är OK
- Avtalet lyder under svensk lag

En About-vy med Dark Pack-korrekt text bakades in i klienten.

### Vad som levererades (v0.1)
Första prototypen: ett fullt fungerande **solo-sandlådebord** med zoner (uncontrolled/ready/torpor/hand/crypt/library/ash heap), kortdrag, face-up/down, counter-scroll med seghet, kortdatabas opt-in (KRCG `vtes.json`), importstöd, och Dark Pack-attribution. **Web Audio**-synthljud för Pass-klockan (inga externa ljudfiler).

---

## Session 2 – Solo-fasen byggs ut (12–13 juni)

### Gameplay-features
- **Counter/token-system:** Scrollhjul på kortets olika zoner för blod (droppe, nedre vänster), blå generiska tokens (övre vänster), gröna generiska tokens (övre höger). Rotationsmedvetna scrollzoner (koordinatsystem transformeras med kortets rotation). Custom token-stöd med initialer + hover-tooltip. Smart collapse till siffra+lista vid fler än en custom token.
- **Uncontrolled-förenkling:** Hela kortets yta ger blodscroll när vampyren ligger nedvänd (influence-blod är det enda relevanta).
- **Markering & stackar:** Enkelklick markerar minion. Drag-ruta markerar/adderar kort. Kort snappar till aktiv minion vid överlapp-drop (spelade PÅ minionen). Stack byggs uppåt-höger (kortnamnen syns). Fri placering annars. Gruppdrag bevarar stackordning.
- **Bibliotek och zoner:** Return to library/crypt med undermeny Top/Bottom/Shuffle in. Burn vs Discard (Burn = burned-zon utanför spel; Discard = ash heap). Random discard, reveal top X, browse-funktioner.
- **Owner + controller:** Korten har separata `owner`- och `controller`-fält. Ousted-flödet hanterar alla tre regelfall korrekt (andras kort i dina zoner → deras ash heap; dina kort kontrollerade av andra → stannar i spel; resten → home).
- **Actions-menyn:** Grundhandlingar (Bleed, Block, Hunt, Rescue, Diablerie, Card action) gated till minions via KRCG-typdatabasen. Opt-in i Convenience-inställningarna.
- **Targeting/Reticle:** Target-knapp + högerklicksmeny. Krimson ring + symbol. Loggsuffix "Target: X" på handlingar och spelade kort. Anonymitetsregel respekteras.
- **Loggprincip:** Ett korts namn får bara förekomma i loggen när kortet är publikt synligt. `cardRef()`-helper säkrar detta genomgående.

### UI-konsolidering
- Fasknapparna (Unlock → Discard → Draw → Pass) flyttades upp till headern.
- ☰ Menu-knapp samlade alla globala val (Demo deck, Import, New deal, Reset, Rulebook, Settings, About).
- Pool-menyn bantades ned (Set pool + Burned cards).
- Controls-panel kollapsades till expanderbar flik.
- Spelarnamn ovanför pool (editerbara, sparas i localStorage).

### Settings-arkitektur
Tre sektioner: **Convenience** (opt-in-hjälpmedel), **Shortcuts** (Basic + Advanced, redigerbara), **Brightness**.

Convenience-toggles:
- Card database (KRCG vtes.json – styr Actions-gating)
- Auto-lock on action
- On oust: award 6 pool bounty to predator

### Persistens & versionshantering (v0.3)
- **Auto-save** till localStorage med 800 ms debounce. Resume-fråga vid uppstart.
- **Export/Import** som `.json`-fil (inkl. loggarkiv per tur).
- **Deck library** – sparade lekar med dropdown i importdialogen (max 24 st).
- **Versionsmarkering** i About och logg (v0.3).
- Sparformatet designades medvetet som blivande **nätverksprotokoll**: `{v, zones, cards[], pool, turn, turnLogs}`.

### Loggarkivering per tur
Pass arkiverar aktuell tur → loggen töms → ny tur börjar. Game log-meny med dropdown per tur + Download .txt.

### Undo-system
Snapshot-baserat. 60 nivåer. Debounce på scroll-bursar (räknas som ett steg). Ctrl+Z. Undantar Reset/Import.

---

## Session 3 – Nätverket & Servern (13–14 juni)

### Serverarkitektur
Node.js med hand-rullad WebSocket (noll npm-paket). Serverfilen (`elysium-server.js`) håller:
- **Rum** med lösenord och hostnamn
- **Dolda zoner** per spelare (hand, face-down) – klienter får aldrig motspelares hemliga kortdata
- **State-relay:** publika board-blobbar (`pub`) synkas till alla i rummet
- **Named saves** – sparade spel med namn (JSON-filer)

### Krypto-lager (escrow)
Handens dolda data skyddas med ett AEAD-kryptoschema baserat på Web Crypto API (SHA-256/HMAC/PBKDF2). Klienten escrowar sin hand till servern krypterat – servern kan inte läsa innehållet. Standalone-referenskopia i `escrow-crypto.js`. Testad via `test-crypto.js`.

### Protokoll
Verbs klient→server: `create`, `join`, `pub`, `give`, `pass`, `draw`, `target` m.fl.
Meddelanden server→klient: `joined`, `lobby`, `started`, `pub`, `gave`, `given`, `passed` m.fl.
Fullständig protokolldokumentation i Technical Documentation.

### Hotseat-läge
Separatspår utan server: `net.hot.boards[seat]` håller per-spelare-state lokalt. `giveHot()` injicerar kort direkt i target-seatets lagrade bräde + pub-snapshot. `mySeat()` returnerar den aktiva spelaren. `setActivePlayer(seat)` växlar styrning.

**Viktigaste insikt:** `mpSend` är WebSocket-only – en no-op i hotseat. Alla features måste frågas: "fungerar den här vägen utan socket?" Hotseat-pattern: tillämpa lokalt + uppdatera pub-snapshot, online: servern round-tripar och echon `gave`/`given` hanterar flytten.

### Testsvit
`test-2a` → `test-2g`: ~195 assertions för server (rum, auth, state-sync, krypto, saves). Körs med loopback-WebSocket. `test-crypto.js` är standalone. `harness_faithful.js` för klient-syntaxkontroll headless.

---

## Session 4 – Bordsvyer & Views-arkitektur (14–16 juni)

### Tre vyer
Elysium fick ett tre-nivå vysystem:
- **Simplified / L1** (`net.view === null`) – eget bräde, fullstorlek, fullt interaktivt
- **Normal / L2 / Kolumnvy** (`net.view === 'l2'`) – eget bräde i centrum, prey/predator som stående kolumner på vardera sida. Byggd av `enterL2()` / `renderL2()`
- **Helicopter / L3 / Overview** (`net.view === 'ov'`) – hela bordet som runt bord (eller Lackey-fyrkant via `conv.l3shape`), alla stående, du i botten. Byggd av `enterL3()` / `renderL3()`
- **Visit** (`net.view === <seat number>`) – ensam motspelares bräde

**`switchView(target)`** är enda entrypunkten. **`baseView()`** returnerar home-vyn (Normal om motspelare finns, Simplified annars; respekterar `conv.skipL2` och `net.tableViewLock`). **`goHome()` = `switchView(baseView())`** kopplad till alla "gå hem"-vägar.

**§-tangenten** cyklar L3 ↔ home.

### Cross-table play
`opponentSurfaceAt(cx,cy)` geometrisk hit-test mot `.l2pane2[data-seat]` / `.mat[data-seat]`. `giveTo(seat, surfaceEl, targetEl, x, y, c)` är enda give-punkten. Hotseat: `giveHot()`; online: `mpSend({t:'give'})` + `gave`/`given`-ekons.

### Host-locked table view
Host kan låsa Normal/Simplified för alla. Server lagrar `room.tableView`, forwards i join/state/lobby/started. Client skickar i `create`, läser till `net.tableViewLock`.

### VIEW GLOSSARY
Kodblock precis före `switchView` med inline alias-taggar i hela koden. Synkroniserat med dokumentation.

### Besök-vyn (Visit)
L2-läget aktiv under besök. `#rview`-overlay ovanpå. Dock hover-reveal via `pointermove`. `body.invisit` döljer Prey/Predator-flikarna.

### L3-vyn
Real L2-dock i L3 (ingen kopia). `place()`/`layoutZone()`-guards. L3 fallthrough till `l2geo` i `pubCanon`/`pubBox`. `body.inov`-flagga för CSS-gating av Prey/Predator.

### Template exceptions
Principen: alla menyer och UI-element är identiska i alla vyer. Undantag dokumenteras explicit med `TEMPLATE EXCEPTIONS`-block + inline-kommentarer:
- Ready-tab dold i L2 Home (ready-regionen är ju synlig)
- Prey/Predator dold i L3 och Visit
- `.matlab` (namn+stats-ikoner) dold när `noLabel:true` är satt (Visit + L2-kolumner har egen header)

---

## Session 5 – v1.5: Interaktiva vyer, hotseat-polish (17–18 juni)

### Drag-offset-bug i fan-roterade handkort
Handkort roteras med `rotate((i-mid)*2.2deg)` runt centrum. Grab-offsets beräknas mot oroterat top-left. Fix: centrera det krympta kortet under cursorn vid drag-ut (`drag.ox=CW*s/2; drag.oy=CH*s/2`).

### Z-coverage-bug → Quick phrase-menyn
L2-dock-bakgrunden (z:4400+) täckte pool-globen (ingen z). Högerklick träffade overlay utan meny → global fallback (quick-phrase-menyn). Fix: höj pool-wrap till z:4700 när docken är öppen.

### Bekräftad live: v1.5

---

## Session 6 – v1.6: Played cards, Left panel, Cross-table polish (19–20 juni)

### Played-cards tab
Window-fixed tab centrerad under toppmenyn, synlig i alla vyer. Visar allt spelat "denna fas" – egna och motspelares – som thumbnails med ägarfärg-outline, livebadge. Hover-peek + click-pin.

**Datamodell:** `collectPlayed()` diff:ar lösa ready-kort mot `avBaseline` (persistent Set av **card ids**). ID-only-nycklar är stabila över hotseat take-control (composite nycklar `me:id` / `s+seat:id` bröt vid spelarbyte). `snapshotPlayed()` baslinear om vid fasbyte/game start/Clear. `tagPlayed(c)` = universal play-to-ready-hook som trigger refresh.

**Overlay-actions:** Clear (re-baseline) + Discard mine (sveper egna ready-kort till ash).

### Left panel (card viewer) – sex punkter
- Ctrl-hover lupp: tracker på `pointermove` (`lastCardEl`), aktiveras vid Ctrl-keydown
- Name-tooltip suppressas under Ctrl-hover
- "Card text"-sektionen CSS-hidden (inte DOM-removed – event handler lever kvar)
- Bildladdningsfel → `cardFallbackHTML()` (namn + KRCG-text in-frame)
- Controls-lista → `?` help overlay
- Log card-links → aside viewer (hover) + pinnad detaljvy (klick). Shift/Panel-tab pekar log, kortlänkar floatar vid pekaren.

### Cross-table give från Quick-React – tre bugorsaker fixade
1. Felt-marqueen exkluderar nu `.qrc / #qrbar / #altview`
2. `qrHandDown` saknade `preventDefault()` → native select-drag stoppade custom drag
3. `giveHot()` fick `renderRemote`-armen för numerisk `net.view` + `renderAltIfOpen()`

### Opponent card log links
`sanRemote` strippade `clog`-taggar från reläd HTML. Fix: placeholder-protect `<b class="clog" data-cid=...>` med sentinel-tecken (U+0001/U+0002), sanera id:t, strippa allt annat, återställ.

### Bekräftad live: v1.6

---

---

## Session 7 – v1.7: Played-tab polish & tab-centering (21 juni)

### Rename: "Played cards" → "Played"
Tab-labeln och overlay-rubriken uppdaterade på två ställen i DOM (`<span class="lbl">` resp. `<span class="ttl">`). Enkel sökning-och-ersätt; inga JS-konsekvenser.

### Tab-centrering följer vänsterpanelen
**Problem:** `#playedTab`, `#playedOverlay`, `#readyTab` och `#readyPeek` låg hårdkodade på `left:50%` (mitten av hela viewporten). Med vänsterpanelen (aside, 268 px) utfälld hamnade de för långt till vänster — visuellt inte centrerade mot det synliga brädets yta.

**Lösning:** CSS-variabel `--aside-w: 268px` i `:root`, plus en härledd `--tab-mid: calc(var(--aside-w)/2 + 50%)`. `body.aside-collapsed` sätter `--aside-w: 0px`, vilket drar tillbaka `--tab-mid` till ren `50%`. Alla fyra element pekar på `left: var(--tab-mid)` och behåller `transform: translateX(-50%)`. Övergången är instant (CSS-variabeln bär ingen transition), men aside-elementet har redan `transition: width .14s ease` — recentreringen synkroniseras visuellt med panelglidningen.

**Gäller:** L2 Home, L2 Visit, L3 Overview — alla vyer.

### Per-kort-interaktion i Played-overlayens rad
**Vänsterklick:** `renderPlayed()` lägger nu en `click`-listener på varje `.avc`-wrapper. Anropar `selectOnly(c)` + `layout()` (markerar kortet på brädet) + `renderPlayed()` (uppdaterar `.avsel`-ringen i trayens rad). Klick på motspelarkort (`!state.cards.get(c.id)`) ignoreras tyst — de är inte selekterbara.

**Högerklick:** `contextmenu`-listener per wrapper, öppnar `showMenu()` med:
- **Clear this card** — `avBaseline.add(c.id)` → kortet försvinner ur Played-listan utan att röras på brädet. Fungerar för alla kort (egna och motspelares).
- **Discard this card** — visas bara om kortet finns i `state.cards` (mitt aktiva state, dvs. min lott). Gör `pushUndo()` + `move(live, 'ash', {})` med live-zonkontroll (`c.zone==='ready'` re-kollas vid movetilfällett — idempotent).

**"Clear all"-knapp:** Overlay-knappen "Clear" döptes om till "Clear all" (inkl. uppdaterad title-text), för att särskilja från per-kort Clear i högerklicksmenyn.

### Overflow-beteende bekräftat (ingen fix behövdes)
Undersökte hur `#playedOverlay` och `#readyPeek` hanterar många kort:
- `#playedRow` har `display:flex; flex-wrap:wrap` → radbryts automatiskt
- `#playedOverlay` har `max-height:64vh; overflow:auto` → scrollar om det verkligen överflödar
- `#readyRow` har klassen `qrgroup` (`display:flex; flex-wrap:wrap`) + `#readyPeek` har `max-height:44vh; overflow:auto`
- `#readyPeek` är bottom-anchrat (position:fixed; bottom:0) och flödar uppåt → `placeReady()` hanterar korrekt

Inga fixar behövdes. Båda overlayerna hanterar många kort via wrap + scroll.

### Kodarkitektur lärd (för snabb orientering nästa gång)

**Played-tabben:** `renderPlayed()` → `collectPlayed()` diff:ar mot `avBaseline` → `avRenderCard()` renderar varje kort som `.avc`-wrapper med absolut positionerat `.card` inuti. `#playedRow .avc { position:relative }` är kritisk — utan den escaper korten till overlay-hörnet (scoped CSS-fälla).

**avRenderCard(host, c, scale, colHex, interactive, hoverName):** Returnerar nu wrappern (`.avc`-elementet) — det är vad per-kort-listeners hänger på. `interactive`-parametern styr om `avTap`-click sätts (Quick-React-mönster); Played-trayens korts egna listeners är *separata* från `interactive`.

**Ägarbestämning i Played-overlay:** `state.cards.get(c.id)` — om det returnerar ett levande kortobjekt äger den aktiva spelaren kortet. Motspelarkort lever bara i `net.boards[seat].pub` och syns aldrig i `state.cards`.

**`showMenu(items, x, y)`:** Standard context menu. `items = [{label:str, fn:()=>{}}]`. Kräver inget utöver en array — enklast möjliga API.

**`selectOnly(c)`** sätter `state.selected` + `state.anchor` + anropar `updateSelVisual()`. Brädet uppdateras via `layout()`. Alt/Quick-React-overlayens selektion uppdateras via `avRefreshSelection()` (kräver `altOpen===true`); Played-overlayens egna `.avsel`-rings uppdateras via `renderPlayed()`.

### Bekräftad: v1.7 (syntax OK; runtime-test kvar hos Johan)

---


## Session 8 – v1.8–v1.10: Spelstart, disciplinsökning, animationshastighet, draw-klick (21 juni)

### v1.8 – Auto shuffle+deal vid spelstart (hotseat)

**Problem:** `startHotseat()` byggde varje spelares board via `buildDeck` → `resetForDeal` (shuffle), men kallade aldrig `dealOpening`. Korten var shufflade men ingen hand deades — spelarna fick göra New deal manuellt.

**Lösning:** Lade till `dealOpeningSync()` (identisk kropp som `dealOpening` men utan `setTimeout` — synkront för att fungera inne i seats-loopen). I `startHotseat()`, branchen `else if(p.deckText)`, anropas nu `dealOpeningSync()` direkt efter `buildDeck(parseDeck(p.deckText))` och innan `serializeGame()` snappar boardet.

- `boardJson`-branchen (resumed save) dealar inte om — korrekt.
- `clearTable`-branchen (tom board) — inget att deala.
- **Online:** orörd — servern anropar `dealNow(q)` per spelare vid `start`-meddelandet, klienten tar emot `dealt` med hand + uncontrolled.

**Arkitektur att känna till (startHotseat):**
```
players.forEach((p,i)=>{
  if(p.boardJson) restoreGame(...)        // resumed save — hoppa över deal
  else if(p.deckText) { buildDeck(...); dealOpeningSync(); }  // nytt deck → auto-deal
  else clearTable(...)                    // inget deck — tom board
  net.hot.boards[seat] = serializeGame(); // snapshot med handen redan dealt
})
restoreGame(net.hot.boards[1], ...)       // aktivera seat 1
```

---

### v1.9 – Oblivion (obl) som sökbar disciplin i deck lab

**Problem:** Sökning på `obl` eller `oblivion:` i kortbyggarens filterfält gav inga träffar, trots att `DISC_NAMES` har `obl:'oblivion'`.

**Rotorsaken (KRCG-format):** `DISC_NAMES` är en enriktad map `trigram → fullname` (t.ex. `'obl' → 'oblivion'`, `'dom' → 'dominate'`). Äldre discipliner skickas av KRCG som trigram i `card.disciplines`-arrayen (`["dom"]`) — uppslaget `DISC_NAMES['dom']` ger `'dominate'` och båda hamnar som tags. Men Oblivion (och troligen andra nyare discipliner) skickas som fullständigt namn: `["oblivion"]`. Då läggs `'oblivion'` in som tag, men `DISC_NAMES['oblivion']` är undefined — trigamet `'obl'` läggs aldrig in.

**Fix:** Lade till `DISC_ABBR` — en inverterad map byggd från `DISC_NAMES`: `fullname → trigram` (`'oblivion' → 'obl'`, `'dominate' → 'dom'` osv). I `cardTags()` läggs nu även `DISC_ABBR[w]` in om det finns, så att varje disciplin-ord bidrar med *båda* formaten oavsett vad KRCG råkar skicka.

**Vad som nu fungerar:** sökning på `obl:`, `oblivion:`, `dom:`, `dominate:` — alla kombinationer.

**Kodpunkter:**
- `DISC_NAMES` — rad ~3752, `obl:'oblivion'` etc.
- `DISC_ABBR` — rad ~3753, ny inverterad map
- `cardTags(c)` — `info.disc`-raden splittar på whitespace, lägger in `w` + `DISC_NAMES[w]` + `DISC_ABBR[w]`
- `catMatch(c, pq)` — filter-mode kräver att *varje* filter-ord matchar en tag från `cardTags()`; free-mode söker i hela blob-strängen (namn + typ + disc + clans + text)

---

### v1.10 – Två lokala inställningar: animationshastighet och draw-klick

#### Animationshastighet (`conv.animSpeed`, 0.5–2.0, default 1.0)

**Vad som animeras (cfx-systemet):** När ett kort spelas, låses eller låses upp skapas ett `.cfx`-element centre-screen — en förstorad klon av kortet med caption. Fyra animation-kinds med hårdkodade CSS-durationer:
- `play` → `cfxPlay` 1.74s
- `lock`/`unlock` → `cfxLk` 1.05s
- `rise` (uncontrolled/torpor→ready) → `cfxRiseEnv` + `cfxRiseImg` 1.5s
- `flip` (reveal/conceal) → `cfxFlipEnv` + `cfxFlipImg` 1.15s

Rise med flip har dessutom `_swapAt` — en JS-timeout som byter kortbild (back→front) mitt i animationen: 450ms för rise, 575ms för flip.

**Fix:** Skalning via inline `style.animationDuration` på `wrap` (`.cfx`) och alla `.cfximg`-barn (dessa har egna animationer i CSS). `_swapAt` multipliceras med `conv.animSpeed`. Vid 100% (1.0) sker ingenting — no-op-check undviker onödiga inline-stilar.

**UI:** +/−-knappar i Settings → Convenience, ±10% per klick. `updateAnimSpeedLabel()` synkar visningen.

#### Draw-klick (`conv.drawClick`, `'single'`|`'double'`, default `'double'`)

**Fem element hanterar draw-clicks:**
1. `#z-library` (huvud-brädet) — `click` → `drawCard()`
2. `#z-crypt` (huvud-brädet) — `click` → `influence()`
3. `#dockLib` (L2/L3-dock) — `click` → `drawCard()` + `renderAltIfOpen()`
4. `#dockCrypt` (L2/L3-dock) — `click` → `influence()` + `renderAltIfOpen()`
5. `#avLib` (Alt-tray) — `click` → `drawCard()` + `renderAltIfOpen()`
6. `#qrLib` (Quick-React) — `click` → `drawCard()` + `renderQR()`

(Crypt-draw = `influence()`, inte `drawCard()` — influence-funktionen hanterar pool-kostnaden och prompt.)

**Fix-pattern:** Varje element fick en `click`- och en `dblclick`-listener. Click-handlern gör draw bara om `conv.drawClick !== 'double'`; undantag: Ctrl+click undo körs alltid på click. Dblclick-handlern gör draw bara om `conv.drawClick === 'double'`.

Browser skickar click→click→dblclick vid dubbelklick — de två click-eventen ignoreras tyst i double-mode, dblclick-handlern drar kortet.

**Notera:** `#avLib` och `#qrLib` är i Alt/Quick-React-vyerna. `#dockCrypt` saknade Ctrl+click undo (crypt-undo är `undoCryptDraw`, sker via högerklicksmenyn).

---

### Owner vs Controller — VTES-semantik i Elysium

Klargjort i konversation (ingen kodändring):

- **`c.owner`** — vems kortlek kortet kom ifrån. Styr oust-logiken: andras kort i dina zoner → deras ash heap vid oust; dina kort kontrollerade av andra → stannar i spel. Sätts normalt vid import/deal; *Set owner* i högerklicksmenyn rättar till om det sattes fel.
- **`c.controller`** — vem som styr kortet just nu. Kan bytas via korteffekter under spelet (*Give control*).
- Båda är runtime-fält på kortobjektet (`c.owner`, `c.controller`). Sparas i autosave-snapshot som en del av brädet. Påverkar **inte** kortleken i deck library.

---

### Bekräftad: v1.8–v1.10 (syntax OK; runtime-test kvar hos Johan)

## Tekniska designprinciper (framkokade ur projektet)

### Serialiseringsformatet är dubbelt
Det är både lokal autosave och (publik-filtrerat) nätverksprotokoll. Designat så från dag ett.

### Hotseat och online är samma spel
Board-modell, serialisering, turn-struktur, VP och oust-regler är delad kod. Skilda bara vid transport.

### "Verify not guess"
VTES-regler och spelmekanik kollas upp (vekn.net/rulebook, KRCG) – ingen gissning.

### Scoped CSS är en layout-fälla
`avRenderCard` byggdes för `#altview .avc {position:relative}`. Renderas det utanför den containern escaper allt till overlay-övre-vänster. Lösning: spegla regeln för nya hosts.

### ID-only composite keys
Composite nycklar (`me:id`, `s+seat:id`) spricker vid hotseat take-control. Card id är stabilt.

### Den universella mutationspunkten
Hook refresh på choke-punkten (t.ex. `tagPlayed`, `move`, `layout`) – inte per call-site.

### Sanitisera med placeholder-protect
Att sanera HTML medan en säker tagg bevaras = byt ut önskad tagg mot sentinel → sanera → återställ. Ren funktion, unit-testbar.

### "Refresh current view" har tre armar
```
if(typeof net.view==='number') renderRemote(net.view);
else if(net.view==='ov') renderL3();
else if(net.view==='l2') renderL2();
```
+ `renderAltIfOpen()` för strippen/Played-tab.

---

## Versionsöversikt

| Version | Datum | Innehåll |
|---------|-------|---------|
| v0.1 | 11 jun | Solo-sandlåda, kortimport, KRCG-bilder, Dark Pack |
| v0.2 | 12 jun | Counters/tokens, markering/stack, undo, actions-meny |
| v0.3 | 12 jun | Spara/återuppta, deck library, versionsmarkering |
| v1.0 | 13 jun | Multiplayer-server, WebSocket, escrow-krypto |
| v1.1 | 14 jun | Hotseat-läge, pass-and-play |
| v1.2–1.4 | 15–17 jun | Alt/Quick-React-strip, bordsvyer påbörjas |
| v1.5 | 18 jun | Interaktiva vyer (L2/L3/Visit), cross-table give, host-lock |
| v1.6 | 20 jun | Played-cards tab, left panel-pass, sanRemote-fix |
| v1.7 | 21 jun | Played rename, tab-centering follows panel, per-card click+contextmenu |
| v1.8 | 21 jun | Auto shuffle+deal vid hotseat-start |
| v1.9 | 21 jun | Oblivion (obl) sökbar i deck lab — KRCG disciplin-format fix |
| v1.10 | 21 jun | Animationshastighet + draw-klick (single/double) som lokala inställningar |

---

## Aktuell status och nästa steg (per v1.12)

**Bekräftat fungerande (hotseat-testat):**
- Alla tre vyer + Visit
- Cross-table give i alla vyer
- Played-cards tab (v1.7: rename, tab-centering, per-kort click/högerklick)
- Left panel med lupp, log-links, fallback
- Auto shuffle+deal vid hotseat-start (v1.8)
- Oblivion och alla discipliner sökbara i deck lab oavsett KRCG-format (v1.9)
- Animationshastighet + draw-klick som lokala inställningar (v1.10)
- v1.11: click-cancel, actor FX, shuffle riffle

**Syntax-verifierat, runtime-test pending (Johan):**
- v1.12: SFX-bibliotek kopplat till 8 spelhändelser
- v1.13: Ljudinställningar i Settings (master + per-kanal)

**Parkat / planerat:**
- L3-layoutoptimering (dimensions/placering)
- Dead code cleanup: `l3canon`, `l3box`, `thump()` (nu ej använd)
- Online-validering efter hotseat-bekräftelse
- Audio: reverb jitter-parameter, EBM + gothic rock BGM-spår

---

## Session 10 – v1.12: SFX-bibliotek kopplat till spelhändelser (21 juni)

### Bakgrund
`vtes-sfx-demo.html` innehöll ett komplett bibliotek av procedurellt syntetiserade Web Audio-effekter. Målet var att koppla dem till riktiga spelhändelser i klienten med rätt hookpunkter och minimal kod.

### Hookpunkter och val

| Händelse | Ljud | Hookpunkt |
|----------|------|-----------|
| Spela kort | Blood Slap | `tagPlayed()` — universell choke point |
| Lås upp kort | Discipline | `setLocked(c, false)` |
| Lås kort | Conclave | `setLocked(c, true)` |
| Pass | Bell Moll (E) | `bell()` ersatt med FM-klocka |
| Oust | Final Death | `ousted()` innan log-raden |
| Allmänt logghändelse | Warded | `log()` med 320ms cooldown |
| "Hold on…" fras | Bell Pitch-drop (C) | `showSay()` när `i===4` |
| Din tur! | Vessel | `heartbeat()` ersatt med 3-lagers version |

### Teknisk arkitektur
Delade primitiver (`sfxMakeReverb`, `sfxThud`, `sfxNoise`, `sfxOsc`) lagda direkt efter `sfxPlay` i SFX-sektionen. Alla namngivna SFX-funktioner (`sfxPlayCard`, `sfxDiscipline`, `sfxConclave`, `sfxFinalDeath`, `sfxWarded`, `sfxHoldOn`) följer efter primitiverna. Alla använder samma `actx` och återanvänder reverb-nodens mönster.

### Cooldown i log()
`log._sfxCool` — en boolean med `setTimeout(320ms)` reset — förhindrar att Warded-ljudet staplas vid händelser som genererar flera log-rader i snabb följd (oust, pass). De "dominanta" ljuden (oust, pass) fyrar innan log-raden, så de vinner uppmärksamheten.

### v1.11-avsnittet (Session 9) kvar nedan

### v1.11a – Vänsterklick avbryter klonanimation

**Problem:** Klonanimationer (`.cfx`-element) för play/lock/unlock/rise/flip kör i ~0.7–1.74s utan möjlighet att avbryta. Spelaren måste se hela sekvensen.

**Fix:** En rad tillagd direkt efter `animationend`-listenern i `cardFx()`:
```js
wrap.addEventListener('click', ()=>wrap.remove(), { once: true });
```
`{ once: true }` städar automatiskt upp om animationen hinner köra klart. `#cardFx` har `pointer-events:none` normalt — den flaggan sitter på *hosten*, inte på `wrap` som appendas inuti, så klicket träffar wrappern korrekt.

---

### v1.11b – Actor-kort i klonanimationens play-FX

**Bakgrund: cardFx-systemet**

`cardFx(c, kind, opts)` bygger ett `.cfx`-element som appendas i `#cardFx` (absolut, inset:0, z:5900, pointer-events:none på host-divven). Animationskindsen är:
- `play` → 1.74s `cfxPlay`
- `lock`/`unlock` → 1.05s `cfxLk` + `cfxImgLock`/`cfxImgUnlock`
- `rise` → 1.5s `cfxRiseEnv` + `cfxRiseImg` (± `cfxRiseFlip` om reveal)
- `flip` → 1.15s `cfxFlipEnv` + `cfxFlipImg`

Row-strukturen för `play` med target: `[.cfximg(main)] [.cfxarrow] [.cfximg.tgt(target)]`. `.cfximg` är 180×251px, `.cfximg.tgt` är 122×170px.

**Nya opts-fält:** `opts.actor` — ett card-objekt (den spelande minionens state-objekt, hämtat via `activeAnchor()`). Om `actor` finns renderas dess kortbild (`.cfximg.tgt.actor`, 122×170px) *till vänster* om huvudkortet via `row.insertBefore()`. Captionen ersätter seat·who med `opts.actor.name`.

**`curTargetCard(c)`** (rad ~7215): returnerar `state.cards.get(state.target)` om det inte är samma kort som `c` självt, annars `net.rtarget`-objektet, annars `null`.

**`activeAnchor()`** (rad ~2296): returnerar `topHost(c)` om `state.anchor` finns i `state.selected` och kortet är i `ready`-zonen. Annars `null`. `topHost(c)` ger host-kortet om `c` är ett attached-kort (returnerar hostens kortobjekt), annars `c` självt.

**Tre play-callsites och vad de nu gör:**

| Callsite | Funktion | actor | target |
|---|---|---|---|
| rad ~4491 | `tagPlayed` (universal hook) | `activeAnchor()` | `curTargetCard(c)` |
| rad ~2446 | drag-attach till kort | `activeAnchor()` | det droppade-på kortet |
| rad ~2860 | `playOnActive` (dblclick på handkort) | ankarminionens objekt `a` | `curTargetCard(c)` |

**Felet i `playOnActive` (viktigt att minnas):** Ursprungligen skickades `{ target: a }` — ankarminionens objekt hamnade som *target-bild till höger* och caption visade "You plays". Men Nergal är aktören, inte målet. Fixades till `{ actor: a, target: curTargetCard(c)||undefined }`.

**Cross-table gives** (`qrGiveToTarget`, `giveTo`, `giveHot`) skickar *inte* `actor` — korrekt, de har inget lokalt markeringskort som spelar.

---

### v1.11c – Shuffle FX: riffle-animation på högar

**Effekten:** Tre kortsilhuetter (med rätt kortbaksida, crypt eller library) spirar upp ur högen i en fan-formation och sjunker tillbaka. Goldglimmer-overlay (`sfx-sheen`). Total varaktighet ~0.82s.

**DOM-struktur:** `.sfx-wrap` (absolut, inset:0, z:20, overflow:visible) appendas direkt i pile-elementet. Inuti: tre `.sfx-card`-divvar med `background-image` satt till `BACKS.crypt`/`BACKS.lib`, plus ett `.sfx-sheen`-div. `.sfx-wrap` tar bort sig själv när `.sfx-sheen` (sista barnet) får `animationend`.

**CSS-animation:** `sfxRiffle 0.7s` med `cubic-bezier(.22,.68,.38,1.2)`. Varje `.sfx-card` har CSS-custom-properties `--sfx-tx` (horisontell offset) och `--sfx-r` (rotation). Nth-child-regler sätter stagger (0 / 60 / 120ms delay) + unika offsets/vinklar (−18°/0°/+16°).

**`shuffleFx(zone)`-funktionen** (infogad precis före `shuffleZone`):
- Mappar `zone` → `['z-crypt','dockCrypt']` eller `['z-library','dockLib']`
- Guard: `el.querySelector('.sfx-wrap')` — kör inte om redan aktiv
- Animationen körs på *båda* elementen parallellt (board-pile + dock-pile) — webbläsaren renderar bara det som faktiskt är synligt

**Pile-element-ID:n att känna till:**
- Board (L1/Simplified): `#z-crypt`, `#z-library`
- Dock (L2/L3): `#dockCrypt`, `#dockLib` (klassen `.qrlib` i `#dockBody`)
- L2-docken är dold i L2 när `l2dockopen` inte är satt; L3-docken dold när `!l2dockopen`. `overflow:visible` på `.sfx-wrap` gör att korten kan sticker upp utanför pile-elementets yta utan clipping.

**Alla wiring-punkter:**
```
shuffleZone(z)    — lokal:  shuffle + layout + shuffleFx(z)
                  — online: mpSend + shuffleFx(z) (lokalt omedelbart, servern shufflar sin sida)
groupShuffleIn()  — piles.forEach(p=>{ shuffle + shuffleFx(p) })
deal/import ×2    — shuffleFx('library') + shuffleFx('crypt') efter shuffle()
```

---

### Versionsöversikt tillägg

| Version | Datum | Innehåll |
|---------|-------|---------|
| v1.11 | 21 jun | Klick-cancel på klonanimation; actor-kort i play-FX; shuffle riffle-animation |
| v1.12 | 21 jun | SFX-bibliotek kopplat till spelhändelser (8 ljud) |
| v1.13 | 21 jun | Ljudinställningar i Settings (master + per-kanal) |


---

## Session 11 – v1.14–v1.15: Huvudmenyrenovering + Skift-logg-förbättringar (22 juni)

### Bakgrund
M�let var att städa upp och strukturera om huvudmenyn (☰) till en tydligare hierarki, ta bort brus och flytta verktyg dit de passar bättre. Parallellt förbättrades Skift-loggens interaktivitet.

---

### v1.14 – Huvudmenyns nya struktur

#### Ny hierarki

| Menyval | Visas när | Funktion |
|---------|-----------|---------|
| Game log | `localTable \|\| inRoom()` | `openLog()` |
| Leave seat | `localTable \|\| inRoom()` | `stopDemoTable()` / `mpLeave()` + `confirm()` |
| — | alltid | separator |
| **Host…** (sub) | `localTable \|\| (inRoom() && net.isHost)` | undermeny |
| → New deal | | `deal()` |
| → Reset table | | `resetTable()` |
| → Randomize seating | | `randomSeating()` |
| → Save game to file | | `exportGame()` |
| → Load game from file | | `$('#gameFile').click()` |
| **Play…** (sub) | alltid | undermeny |
| → Online | | `openMP()` |
| → Offline — hotseat | | `localTable ? stopDemoTable : openOffline` |
| → Solo | | `openImport()` |
| **Decks…** (sub) | alltid | undermeny |
| → Load deck | | `openImport()` |
| → Deck lab | | `openDeckLab(false)` |
| — | alltid | separator |
| Rulebook | alltid | öppnar vekn.net/rulebook |
| Settings | alltid | `openSettings()` |
| About | alltid | öppnar `aboutModal` |

**Ellipsis-konvention (viktig):** `…` sätts **bara** på föräldrar som öppnar undermenyer (`Host…`, `Play…`, `Decks…`). Inte på löv-val, inte på Rulebook/Settings/About.

#### Borttagna från menyn
- **Take priority** — låg kvar i PRIORITY-baren; ingen anledning att duplicera. Spliced in via `_menuItems.splice(2,0,...)` — hela det blocket raderat.
- **Tools (coin/dice)** — flyttat till högerklicksmenyn (se nedan).
- **Game log** — föll bort av misstag i omstruktureringen, återinförd under Game log + Leave seat-blocket.
- **Save/Load game** — flyttades till Host-undermenyn (bara relevant som host).

#### Solo-knappen
"Solo" i Play-undermenyn = `openImport()` — exakt samma som startskärmens "Play solo"-knapp (`#btnEmptyImport`). **Inte** `openOffline('solo')`. `openOffline` öppnar hotseat-konfigurationsmodalen; `openImport` är rätt väg för solo-sandlåda.

#### Leave seat — bekräftelsedialog
```js
fn:()=>{ if(confirm('Leave the current game?')) (localTable ? stopDemoTable : mpLeave)(); }
```
Skyddar mot att råka klicka Leave när man siktar på Game log ovanför.

#### Konditionell logik
```js
const _isHost = localTable || (inRoom() && net.isHost);
if(localTable || inRoom()){ /* Game log + Leave seat */ }
if(_isHost){ /* Host-undermeny */ }
```
`net.isHost` sätts i `mpUI()` via `net.isHost=!!(me&&me.host)` när joined-meddelandet kommer.

---

### v1.14b – Tools i högerklicksmenyn

**`openSayMenu(x,y)`** (rad ~7651) byggs om från:
```js
showMenu(SAY.map((p,i)=>({label:'💬 '+p, fn:()=>saySend(i)})), x, y);
```
till att lägga till separator + `🎲 Dice & coin`-undermeny sist:
```js
showMenu([
  ...SAY.map((p,i)=>({label:'💬 '+p, fn:()=>saySend(i)})),
  '-',
  {label:'🎲 Dice & coin', sub:[
    {label:'🪙 Flip a coin', fn:flipCoin},
    '-',
    {label:'Roll a D4', fn:()=>rollDie(4)},
    ...
  ]}
], x, y);
```

`openSayMenu` triggas av:
- `board.addEventListener('contextmenu')` — högerklick på filten (exkluderar kort, mat, piles etc.)
- `document.addEventListener('contextmenu')` — global fallback för allt utan egen meny

---

### v1.14c – Hold on… högst upp i fraslistan

`SAY`-arrayen ändrad från:
```js
['No block','Block!','No reaction','It resolves','Hold on…','Yes','No','Pass']
```
till:
```js
['Hold on…','No block','Block!','No reaction','It resolves','Yes','No','Pass']
```
`sfxHoldOn`-indexkontrollen uppdaterad: `if((i|0)===4)` → `if((i|0)===0)`.

---

### v1.14d – About-modal: Buy me a coffee

Länk tillagd längst ner i `#aboutModal .mbody`, efter KRCG/VDB-stycket:
```html
<p class="note" style="margin-top:14px">If you enjoy Elysium, you can
<a href="https://buymeacoffee.com/Theradon" target="_blank" rel="noopener"
   style="color:var(--brass);text-decoration:underline">buy me a coffee</a>
— it's always appreciated!</p>
```

---

### v1.14e – Master SFX volume default 0%

`conv.sfxVol` defaultvärde ändrat från `100` till `0` på tre ställen:
- `conv`-objektet (rad ~8064): `sfxVol:0`
- Slider HTML `value="0"` + `<span>0%</span>`
- `sfxGain`-fallback och `openSettings`-fallback: `conv.sfxVol!=null?conv.sfxVol:0`

Befintliga användare med sparat `conv`-värde i localStorage påverkas inte.

---

### v1.15 – Skift-loggförbättringar

#### v1.15a – Kortvisning vid hover i Skift-loggen

**Problem:** `.clog[data-cid]`-länkarna i logPeek-klonerna var klickbara i tab-läget men visade inte kortbilder i Shift-läget — `pointer-events:none` blockerade all interaktion.

**Fix:** CSS `.show.peeking { pointer-events:auto }` + `pk.classList.toggle('peeking', peeking)` i `syncLogPeek`. Lyssnarna `mouseover`/`mouseout` på `#logPeek` för `.clog`-hover → `logInspectShow`/`logInspectHide` fanns redan.

**Kortvisningens storlek:** `logInspectRender` använder `addRCard` med skala `s`. Ursprunglig `s=1.25` gav ~105×147px. Uppgraderad till `s=2.619` → ~220×309px, matchande `#hoverCard`-bredden (220px, `aspect-ratio:84/118`). **Försökte dela `#hoverCard` direkt** men `pointermove`-lyssnaren anropar `hideHoverCard()` vid `!e.ctrlKey` och dödade visningen omedelbart. Slutlösning: behåll `#logInspect`, öka skalan.

**`#logInspect` vs `#hoverCard` — skillnader:**
- `#hoverCard`: 220px bred, `aspect-ratio:84/118`, CSS-definierad. Hanteras av `showHoverFor(el, x, y)` som kräver ett `.card[data-card-name]`-element. Döljs av `pointermove` när `!ctrlKey`.
- `#logInspect`: dynamisk storlek via `addRCard` + scale. Positioneras av `logInspectShow`. Oberoende av `pointermove`. Rätt val för loggkortvisning.

#### v1.15b – Scroll i Skift-loggen

**Problem:** Shift+scroll tolkas av webbläsaren som horisontell scroll — `overflow-y:auto` på `ul` hjälper inte.

**Fix:** `wheel`-lyssnare på `#logPeekList` med `passive:false`:
```js
ul.addEventListener('wheel', e=>{
  e.preventDefault(); e.stopPropagation();
  ul.scrollTop += e.deltaY || (-e.deltaX);
}, {passive:false});
```
Fångar eventet innan webbläsarens default och scrollar vertikalt manuellt.

#### v1.15c – Tab-hover parkerad

Hover-över-Panel-tab → visa logg borttagen (kommenterad ut). Shift-to-peek räcker. `tabPeek`-variabeln och CSS-klassen `.show.tab` finns kvar i koden (kan återinföras). `mouseover`/`mouseout` för `.clog`-hover på `#logPeek` behölls (fungerar i båda lägena).

---

### Kodpunkter att hitta snabbt (v1.14–v1.15)

| Vad | Var |
|-----|-----|
| Huvudmeny-handler | `$('#btnMenu').addEventListener('click'` |
| `openSayMenu` (högerklicksmeny + Tools) | `function openSayMenu(x,y)` |
| `SAY`-arrayen + `sfxHoldOn`-index | `const SAY=[...` rad ~7595 |
| `logInspectRender` (kortvisnings-scale) | `function logInspectRender` |
| `logInspectShow` (positionering) | `function logInspectShow` |
| `syncLogPeek` + `.peeking`-klassen | `function syncLogPeek` |
| `#logPeekList` wheel-lyssnare | IIFE direkt efter `fillLogPeek` |
| Tab-hover (parkerad) | kommenterad IIFE efter `syncLogPeek` |
| `conv.sfxVol` default | `let conv={...sfxVol:0,...}` rad ~8064 |
| About-modal coffee-länk | `#aboutModal .mbody` sist före `</div>` |

---

### v1.16 – Hand zone högerklicksmeny

**`#z-hand` contextmenu** (högerklick på handzonen, inte på ett specifikt kort) ersatt med hierarkisk undermenystruktur.

**Ny menystruktur:**
```
Play card…
  ├─ Face-up          (_requireSelected)
  └─ Face-down        (_requireSelected)
Discard card…
  ├─ Random X…        (prompt → discardRandomHandN)
  └─ Selected         (_requireSelected → move(c,'ash'))
Return card to library…
  ├─ Random X…
  │   ├─ Top / Bottom / Shuffle in  (returnRandomHandN)
  └─ Selected…
      ├─ Top / Bottom / Shuffle in  (_requireSelected → returnToPile)
Burn card…
  ├─ Random X…        (prompt → burnRandomHandN)
  └─ Selected         (_requireSelected → burnCard)
─────────────────
Shuffle library
─────────────────  (om hx('hand'))
➕ Max hand size +1 / ➖ -1 / ↺ Reset
```

**Nya funktioner** (direkt efter `discardRandomHand`, rad ~3216):
`_promptN`, `_randomSubset`, `discardRandomHandN`, `burnRandomHandN`, `returnRandomHandN(pos)`, `_requireSelected(fn)`

**`_lastHandHover`** — modul-global, rad ~1983 (precis innan pointerover-lyssnare). Kvarstår efter hover-out.

**Kodpunkter:**

| Vad | Var |
|-----|-----|
| `_lastHandHover` deklaration | rad ~1983 |
| Hjälpfunktioner | direkt efter `function discardRandomHand` rad ~3216 |
| `#z-hand` contextmenu | `$('#z-hand').addEventListener('contextmenu'` rad ~3317 |

**Ej implementerade (återkommer):** Reveal…, Browse (Search/Show & shuffle), Play with open hand.

---

### v1.17 – Hand zone contextmenu: djupare fix + polish

Tre iterationer efter v1.16 för att lösa DOM-strukturproblem, event-propagationslogik och visuell feedback.

#### Rotorsaken: kort ligger i `#board`, inte `#z-hand`

Alla kortelement skapas med `board.appendChild(el)` i `makeCard()` (rad ~1761). De *positioneras* visuellt över `#z-hand` via CSS transform men är DOM-barn till `#board`. Konsekvens:
- `e.target.closest('#z-hand')` returnerar alltid `null` för ett högerklickat kort
- Capture-lyssnaren returnerade tidigt → sayMenu öppnades istället

**Fix:** Capture-lyssnaren hanterar nu två fall:
```js
// Fall 1: högerklick på ett kortlement
const cardEl = e.target.closest('.card[data-cid]');
if(cardEl){ const hc = state.cards.get(cardEl.dataset.cid); if(!hc || hc.zone!=='hand') return; _lastHandHover=hc; }
// Fall 2: högerklick på #z-hand-bakgrunden
else { const hz = e.target.closest('#z-hand'); if(!hz) return; }
```

#### Event-propagationsordning

- Capture-lyssnare på `document` körs *nedåt* (före bubble) — men stoppar inte andra capture-lyssnare på samma nod
- Kortets bubble-lyssnare (rad ~2463) anropade `stopPropagation` + öppnade `cardMenu` *efter* att capture redan öppnat zone-menyn → dubbla menyer
- **Fix:** Kortets lyssnare för `c.zone==='hand'`: `e.preventDefault(); e.stopPropagation(); return;` — hindrar `cardMenu`, låter capture äga handkort helt

#### `_menuPinnedHover` — mutex för "meny öppen på handkort"

Deklarerad i `hideMenu`-blocket (rad ~2762):
```js
let _menuPinnedHover = null;
```
Sätts i capture-lyssnaren när zone-menyn öppnas, rensas + återställer `handhover` i `hideMenu()`.

**Skyddar tre ställen:**

| Ställe | Rad | Skydd |
|--------|-----|-------|
| `pointerout` på board | ~1990 | `if(_menuPinnedHover && el===_menuPinnedHover.el) return;` |
| `pointermove` board → `setL2Dock(false)` | ~6919 | `&& !_menuPinnedHover` |
| `pointermove` rview → `setL2Dock(false)` | ~6927 | `&& !_menuPinnedHover` |

#### Kortnamn i Selected-labels

Byggs dynamiskt när menyn öppnas:
```js
const _sel = _lastHandHover && _lastHandHover.zone==='hand' ? _lastHandHover : null;
const _sn  = _sel ? ' ('+_sel.name+')' : '';
// → "Selected (Govern the Unaligned)", "Face-up (Deflection)" etc.
```

#### Hand size undermeny

Max hand size-valen grupperade i `Hand size…`-undermeny (sist, villkorad av `hx('hand')`):
```
Hand size…
  ├─ ➕ +1
  ├─ ➖ −1
  └─ ↺ Reset to 7
```

#### Kodpunkter att hitta snabbt (v1.16–v1.17)

| Vad | Var |
|-----|-----|
| `_lastHandHover` deklaration | `let _lastHandHover=null` rad ~1983 |
| `pointerout` handhover-skydd | `board.addEventListener('pointerout'` rad ~1990 |
| Kortets contextmenu (hand-return) | `el.addEventListener('contextmenu'` rad ~2463 |
| `makeCard` + `board.appendChild` | `function makeCard` rad ~1740 |
| `hideMenu` + `_menuPinnedHover` | `function hideMenu` rad ~2762 |
| Hjälpfunktioner (`_promptN` etc.) | direkt efter `function discardRandomHand` rad ~3216 |
| `_requireSelected` | rad ~3250 |
| Document capture-lyssnare (zone-meny) | `document.addEventListener('contextmenu'` rad ~3318 |
| `pointermove` dock-stängningsskydd | `board.addEventListener('pointermove'` rad ~6914 |
| `rview` pointermove-skydd | IIFE `_rv.addEventListener('pointermove'` rad ~6923 |

---

### v1.18 – Lokal tournament mode

`conv.tournament` (bool, default `true`) — lokal inställning som ger samma effekt som online tournament mode utan att kräva ett rum.

**Prioritetsordning i `hx(key)` (rad ~4557):**
```js
if(p){
  if(p.tournament) return false;          // 1. online tournament — alltid
  if(!p.allowLocal) return host settings; // 2. online locked
}
if(!p && conv.tournament) return false;   // 3. lokal tournament (ingen online-policy)
return !!helper[key];                     // 4. lokala helper-inställningar
```

**Nya/ändrade kodpunkter:**

| Vad | Var |
|-----|-----|
| `conv.tournament` default | `let conv={...tournament:true}` |
| `conv.tournament` localStorage-läsning | i conv-parse-blocket efter `sfxIndiv` |
| `hx()` lokal tournament-guard | `function hx` rad ~4557 |
| `#convTournament` HTML | överst i Phase helper-sektionen, före `#helperOn` |
| `syncHelperUI` lokal tournament-logik | `const localTournament=!inRoom()&&conv.tournament` |
| `#convTournament` event-lyssnare | före `#helperTournament`-lyssnaren rad ~8381 |

**`syncHelperUI`-logik:**
- `localTournament = !inRoom() && conv.tournament` — gäller bara utan online-policy
- `tournament = onlineTournament || localTournament` — styr disabled på individuella helpers
- `#convTournament` gråas ut när `inRoom()` (online policy tar över)
- Banner: lokalt → "Tournament mode is on — all helpers are off."

---

### Versionsöversikt tillägg

| Version | Datum | Innehåll |
|---------|-------|---------|
| v1.14 | 22 jun | Huvudmeny omstrukturerad; Tools till högerklick; Hold on… överst; Buy me a coffee i About; SFX default 0% |
| v1.15 | 22 jun | Skift-logg: kortvisning vid hover (s=2.619), scroll-fix (wheel override), tab-hover parkerad |
| v1.16 | 22 jun | Hand zone högerklicksmeny: hierarkisk struktur med Play/Discard/Return/Burn + Random X + Selected; `_lastHandHover`-tracking |
| v1.17 | 22 jun | Hand zone contextmenu: DOM-fix (kort i #board ej #z-hand), capture-logik, `_menuPinnedHover`, kortnamn i labels, Hand size undermeny |
| v1.18 | 22 jun | Lokal tournament mode: `conv.tournament` (default true), `hx()`-guard, `#convTournament` i Settings, online policy trumfar |


---

### v1.19 – Bugfix: conv temporal dead zone-krasch (22 juni)

**Symptom:** Nästan inga knappar klickbara (menu, startskärm etc.). Target-knappen och asideTab verkade fungera. `localStorage.clear()` hjälpte inte. Browser console: `ReferenceError: conv is not defined`.

**Rotorsak:** I v1.18 lade vi till `if(!p && conv.tournament) return false;` i `hx()`. `hx()` anropas av `applyHelper()` som ett **top-level statement** (rad ~4884 HTML) vid fas-bar-bygget. `conv` deklarerades med `let` på rad ~8283 HTML — långt senare. `let`/`const` i temporal dead zone kastar `ReferenceError` även med `typeof`-skydd.

**Fix:** Hela conv-blocket (`CONV_KEY` + `let conv={}` + localStorage-parsning) flyttades till direkt efter `net`-deklarationen tidigt i scriptet. `animMode=conv.anim; applyPco();` lämnades kvar (de beror på `animMode` som deklareras sent).

**Verifiering:** Syntax OK. Node VM-test: SCRIPT RAN TO COMPLETION.

**Kodpunkter:**

| Vad | Var |
|-----|-----|
| `net`-deklaration (tidig anchor) | rad ~1582 HTML |
| conv-blocket (nu tidigt) | direkt efter net, rad ~1583 HTML |
| `applyHelper()` top-level | rad ~4884 HTML |
| `hx()` med `conv.tournament` | rad ~4654 HTML |

**Versionsöversikt tillägg:**

| Version | Datum | Innehåll |
|---------|-------|---------|
| v1.19 | 22 jun | Bugfix: conv TDZ-krasch — conv-blocket flyttat tidigt i scriptet |

---

## Session 6 – Reveal-funktionen + menyhierarki-fix (22 juni)

### v1.19 → v1.20: Hand reveal till motspelare

Ny feature: visa upp kort i handen för motståndare (mekanik för en del VTES-kort). Plus en rad följdfixar på menysystemet och loggens kortvisning som upptäcktes på vägen.

#### Menyn (hand zone högerklick)

```
Reveal…
  ├─ Hand…        → All players / [per spelare i roster]
  ├─ Random X…    → (antal-prompt, sedan) All players / [per spelare]
  └─ Selected (kortnamn) → All players / [per spelare]
```

`_revealToMenu(cards)` bygger "till vem"-undermenyn dynamiskt: "All players" överst, sedan varje `net.roster`-spelare utom avsändaren och utspelade. Random X använder `_promptN` + `_randomSubset`, sedan `showMenu(_revealToMenu(picked), mitten)` (prompt är blockerande → muspos förlorad → centrerad meny).

#### `revealHandTo(cards, toSeat)` — kärnan

`toSeat` = sätesnummer eller `'all'`. Tre transport-grenar:

| Läge | Avsändaren ser | Mottagare ser | Tredje part ser |
|------|----------------|---------------|-----------------|
| **Solo** | "You revealed to …: [kort]" | — | — |
| **Online, en spelare** | "You revealed to Anne: [kort]" (privat) + "X revealed a card to Anne" (publik, arkiverad lokalt) + animation | "X revealed to you: [kort]" + animation | "X revealed a card to Anne" (publik) |
| **Online, alla** | "You revealed to everyone: [kort]" (privat) + animation | "X revealed to you: [kort]" + animation | (alla är mottagare) |
| **Hotseat (en/alla)** | "You revealed to Anne/everyone: [kort]" + **en** animation | — (delad logg, se nedan) | — |

#### Loggrad-orientering (viktigt designbeslut)

- **Avsändaren** loggar sin rad med `data-cid`-länkar (äger korten → full inspect lokalt). Raden är `log(msg, true, true)` = localOnly + privateLine.
- **Mottagaren** får `data-name`-länkar (äger inte korten).
- **Publik rad** (utan kortnamn) visas bara för icke-mottagare. Online: servern distribuerar den till tredje part (ej mottagaren, ej avsändaren). Vid reveal-till-alla finns ingen publik rad (alla är mottagare).

#### `log()` fick tredje parameter: `privateLine`

```js
function log(msg, localOnly, privateLine){
  if(!privateLine) curLines.push(msg);   // private rader: live men aldrig arkiverade
  ...
  if(!privateLine) scheduleSave();
  if(!localOnly) mpRelay(msg);
}
```
Privata rader (alla reveal-rader) visas live men hamnar aldrig i `curLines` → aldrig i `turnLogs`-arkivet, `.txt`-nedladdningen eller autosave. Den delade/sparade loggen innehåller bara publika rader.

#### `cardFx` kind='handreveal'

Ny animationsvariant, taggad separat från `play` så framtida justeringar inte påverkar kortspelningsanimationen:
- CSS `.cfx.handreveal` (rad ~951): fade-in/scale 2.2s, kort sida vid sida i `.cfxrow` med `flex-wrap:wrap; max-width:92vw` (komprimeras vid många kort), varje kort flippar rygg→front via `cfxFlipImg 0.72s`
- `cardFx`-branch (sök `kind==='handreveal'`): rensar `row.innerHTML`, bygger N kort med var sin flip
- **Skickar INTE `t:'fx'` över nätet** (guard `kind!=='handreveal'` i cardFx-broadcasten) — reveal routas via `t:'revealHand'` istället
- Verb i caption: 'revealed'

#### Protokoll: `t:'revealHand'`

Klient→server: `{ t:'revealHand', cards:[{name,kind}], to: seat|'all', pub: '<publik HTML-rad>' }`

Server (handler efter `t:'fx'`, rad ~616):
- `to:'all'` → `bcast(payload, conn.sock)` (privat lista till alla utom avsändaren; ingen publik)
- `to:<seat>` → `wsSend(q.sock, payload)` (privat lista till mottagaren) + publik rad via `t:'log'` till alla **utom** avsändaren och mottagaren

Mottagar-handler (klient, efter `t:'fx'`, rad ~5600): loggar `data-name`-rad privat + kör `handreveal`-animation.

### Loggens kortvisning vid hover — `data-name`-stöd

**Problem:** Reveal-loggrader använder `data-name` (mottagaren har inte kortet i sitt `state.cards`), men hover-systemet slog bara upp på `data-cid`. Kortbilden visades inte.

**Rotorsak:** `findInspect(cid, name)` (rad ~2706) gjorde `state.cards.get(cid)` — rent ID-uppslag. Inget kort → ingen preview.

**Fix:**
- `findInspect` faller tillbaka på ett **syntetiskt kort** `{name, kind:'lib', faceDown:false, ...}` med flaggan `synthetic:true` när `cid` saknas men `name` finns
- `logInspectRender` (rad ~2716) renderar syntetiska kort som **ren bild** (inga tokens/staplar — det är inte ett live-kort)
- Ny `previewName(name)` (efter `preview()`) — vänsterpanelens kortvisare för namn-bara kort
- Alla tre hover-lyssnare matchar nu `.clog[data-cid],.clog[data-name]`: `#log` (ctrl/panel, rad ~2753), outside-click-guard (rad ~2763), `#logPeek` Shift-logg (rad ~4538)
- `clogPreview` använder `b.getAttribute('data-name')||b.textContent`

### Menysystemet: från 2 till 3 nivåer (stor fix)

**Problem:** `Reveal…` och `Return card to library…` är tre nivåer djupa (`Reveal… → Hand… → All players`). Menyerna stängdes/fastnade när man navigerade ut i tredje nivån. `Play card…`/`Discard card…` (två nivåer) fungerade.

**Rotorsak:** Det ursprungliga systemet hade **bara en** `#submenu`-panel. Tredje nivån skrev om **samma** panel och flyttade den → andra nivåns innehåll försvann, och musen hamnade utanför alla paneler → `pointerdown`-lyssnaren stängde allt.

**Fix (ren, speglar originalets 2-panelslogik):**
- Tredje panel `#submenu2` skapad och appendad till body
- `_childOf(el)` returnerar nästa panel nedåt (menu→submenu→submenu2)
- `renderItems` generaliserad: hovra sub-val → öppna barnpanelen; hovra löv-val → stäng barnpanelen (så den inte ligger kvar)
- `openSub(anchor, items, parentEl)` väljer target-panel via `_childOf(parentEl)`
- `menuPanel()`, `menuEnterSub()`, `menuLeaveSub()`, `pointerdown`-guard utökade för tre paneler

**Z-index-fällan (två iterationer fel innan rätt):**
- Originalmenyer låg på 700/710. Men `.card.handhover` = **4800 !important** och `#poolWrap` i L2 dock = **4700**. När en undermeny nådde in över handkorten dränktes den.
- **Fix:** alla tre menypaneler till **8000/8010/8020** (ovan kort + pool, under `#logInspect` 8600 / `#hoverCard` 9000 / `#cardTip` 9999)
- VIKTIGT: timers och `pointer-events`-manipulation som mellansteg skapade NYA buggar (menyn fastnade, nivå 3 släcktes). Den rena lösningen var bara: extra panel + rätt z-index. Inga hacks behövdes.

### Hotseat ↔ online divergens (medvetet)

Hotseat använder **EN delad bordslogg** över alla seats — `setActivePlayer` (rad ~6145) anropar `restoreGame(stored, {keepLog:true})`, och `restoreGame` med `keepLog:true` (rad ~3718) rör INTE `curLines`/synlig logg. Det finns alltså ingen separat logg per spelare i hotseat.

**Konsekvens för reveal:** En online-mottagare får sin egen privata "X revealed to you"-rad på sin egen skärm. Hotseats delade-logg-modell kan inte reproducera det utan en större arkitekturändring (per-seat-loggar). Beslut: **lämna hotseat med bara avsändarens rad + animation**; verifiera mottagarvyn online när det verkligen behövs.

Ett försök att injicera rader i andra seats sparade board (`_hotLogTo` via JSON-manipulation, likt `giveHot`/`awardBountyHot`) togs bort eftersom `keepLog:true` ändå aldrig läser in dem — det blev en no-op.

### Kodpunkter (för snabb framtida navigering)

| Vad | Var (ca) |
|-----|----------|
| `.cfx.handreveal` CSS | rad ~951 |
| `#menu,#submenu,#submenu2` CSS (z 8000-familjen) | rad ~556 |
| `findInspect` + syntetiskt kort | rad ~2706 |
| `logInspectRender` + synthetic-gren | rad ~2716 |
| `previewName` | direkt efter `preview()`, rad ~2705 |
| `clogPreview` + #log hover-lyssnare (data-name) | rad ~2746 |
| Menysystem (3 paneler, `_childOf`, `openSub`) | rad ~2767 |
| `log(msg, localOnly, privateLine)` | rad ~1709 |
| `revealHandTo` | rad ~3346 |
| `_revealToMenu` | direkt efter `revealHandTo` |
| `Reveal…` i hand zone-meny | sök `Reveal…` (ellipsis-tecknet) |
| `t:'revealHand'` mottagar-handler | rad ~5600 (efter `t:'fx'`) |
| `cardFx` + handreveal-branch + broadcast-guard | rad ~7700+ |
| `#logPeek` Shift-logg hover (data-name) | rad ~4538 |
| Server `t:'revealHand'` | server rad ~616 (efter `t:'fx'`) |

### Versionsöversikt tillägg

| Version | Datum | Innehåll |
|---------|-------|---------|
| v1.19 | 22 jun | Reveal-funktionen: meny, `revealHandTo`, `handreveal`-animation, `t:'revealHand'`-protokoll, `data-name`-hover, `privateLine`-arkivlogik |
| v1.20 | 22 jun | Menyhierarki 2→3 nivåer (`#submenu2`, z-index 8000), reveal-loggtext omvänd (You/avsändarnamn), dubblettborttagning mottagare, hotseat reveal=en rad+en animation, hotseat↔online-divergens dokumenterad |
| v1.21 | 22 jun | Bugfix: poolglobens högerklicksmeny + /-/scroll funkar nu med docken nedfälld (L2 Home + L3). `#poolWrap` z-index lyfts oavsett `.l2dockopen`; L3 från 40→4500 |

---

## Session 12 – v1.21: Poolglob interaktiv med nedfälld dock (22 juni)

### Problemet (Johan)
I L2 Home (och L3 Overview) gick poolgloben i poolzonen inte att interagera med förrän man fällde upp bottenpanelen (Crypt/Library/Ash heap/Hand). Med panelen nedfälld gav högerklick på globen bara den generiska snabbfras-menyn, och +/-/scroll fungerade inte. Johan misstänkte en "ritad" dubblettglob i panelen som la sig ovanpå poolzonens glob.

### Diagnos
- `#poolWrap` har ingen egen z-index. Lyftet till 4700 var scopat till `.l2dockopen` (rad ~476) — alltså bara när panelen var **uppe**.
- Med docken **stängd** föll `#poolWrap` tillbaka till auto-z, *under* det kollapsade dock-handtaget `#l2dock` (z-4410), som ligger över bottenremsan och överlappar poolzonen.
- `#l2dock` står inte i `board`-contextmenu-lyssnarens bail-lista (rad ~7944), så högerklicket landade på handtaget, bubblade till `board` → `openSayMenu`. `document`-fallbacken (rad ~7948) avbryter på `e.defaultPrevented`, men eftersom poolWrap-lyssnaren aldrig kördes fanns inget preventDefault.
- **Ingen dubblettglob:** det finns bara ett `#poolWrap`. Den svaga visuella skillnaden när panelen är uppe är `#l2dockbg` (mörk gradient, z-4400, nedre 32%) som syns genom poolboxens genomskinliga delar.

### Fix (endast CSS)
- Rad ~476: släppte `.l2dockopen` → `#board.l2mode:not(.l3mode) #poolWrap{ z-index:4700 }` gäller i båda docklägena. Rent additivt för stängt läge (dock-korten är `display:none` då), identiskt för öppet → noll regressionsrisk.
- Rad ~803: `#board.l3mode #poolWrap` 40 → **4500**. Över handtaget (4410) och dockbg (4400), men under dock-korten (4600) så poolen aldrig skymmer ett kort när docken är öppen.

### Kvar att verifiera (Johan, live)
CSS-only, klient-JS-syntax verifierad. Testa live: poolens högerklicksmeny + /-/scroll med docken nedfälld i **både** L2 Home och L3 Helicopter, samt att inget stackar konstigt över L3-poolen när docken är uppe.
| v1.22 | 22 jun | Visit-finess: egen poolglob döljs vid besök när docken är nedfälld (ser motståndarens), visas när docken är uppfälld (kan spendera egen pool på plats). En CSS-regel: `body.invisit #board:not(.l2dockopen) #poolWrap{display:none}` |

### Tillagt i Session 12 – v1.22: egen poolglob villkorad i Visit (22 juni)

**Johans förfining:** under L2 Visit (besöker motståndare) ska egen poolglob döljas när bottenpanelen är *nedfälld* (så man ser motståndarens glob), men visas när panelen är *uppfälld* (så man kan dra ner egen pool på plats under en handling som kostar pool, utan att gå hem).

**Insikt:** en Visit behåller L2-mode (`switchView(seat)` kallar inte `exitL2()`), så v1.21:s z-4700-lyft gällde även i visit och lyfte egen glob över `#rview`-overlayn (3500) — därför syntes den plötsligt över motståndarbordet efter v1.21. Rätt åtgärd: en visit-specifik regel, inte att backa lyftet.

**Fix (CSS, en rad, ~rad 491):** `body.invisit #board:not(.l2dockopen) #poolWrap{ display:none; }`. Påverkar bara motståndarbesök (`body.invisit` sätts bara när `typeof net.view==='number'`). L2 Home och L3 orörda.

**Kvar att verifiera (Johan, live):** i L2 Visit — egen glob döljs med nedfälld panel (motståndarens syns), och dyker upp + är högerklick-/+-/scroll-bar med uppfälld panel.
| v1.23 | 22 jun | Motståndarens poolglob matchar nu din egen exakt: diametern uttryckt som samma andel av poolzonen som din 96px live-glob (`96/(L2GEO.pool.w*1004)` etc.) -> `96*s` för riktig motståndare, i st f `99.8*s` (gamla 0.86/0.60 -> ~4% för stor) |

### Tillagt i Session 12 – v1.23: motståndarglob = din egen exakt (22 juni)

**Johans observation:** motståndarens poolglob ser aaaningens större ut än din egen i Visit.

**Räkning:** din live `#pool` är fast 96px → visas som `96*l2pub.s`. Motståndarens (rad ~6938) härleddes från poolzonens rektangel: `min(s*135.54*0.86, s*166.32*0.60) = 99.8*s`. Kvot 99.8/96 = 1.04 → ~4% större när skalorna sammanfaller (hemram + besöksmatt fyller samma yta).

**Fix:** uttryck globen som samma *andel av poolzonen* som live-globen: `GW=96/(L2GEO.pool.w*1004)`, `GH=96/(L2GEO.pool.h*616)`, `gd=min(s*cz.pl.w*GW, s*cz.pl.h*GH)`. För riktig motståndare (`buildPub` skickar alltid `bw:1004,bh:616`) blir båda produkterna `96*s` → pixel-för-pixel lika med din egen. `k=gd/96` blir `s` (skuggor skalar nu med matten). Fontkvoten `gd*0.333` oförändrad.

**Kvar att verifiera (Johan, live):** L2 Visit, panel uppfälld — jämför din glob mot motståndarens, ska nu vara identiska. (Lokala demo-motståndare skickar `bw:W,bh:H` → deras glob följer proportionen, inte en bokstavlig 96px; väntat.)
| v1.24 | 22 jun | Motståndarpoolens högerklicksmeny: publika högar — `🜂 ash heap (n)` + `🔥 burned cards (n)`, läsbar på hela globen/zonen (data-seat+matpool på globe/zonbox/L3-värde, `!me`). `viewOppBurned` speglar `viewOppAsh`. Host-kontroll (set pool/oust) DESIGNAD men ej byggd — kräver serververb + designbeslut |

### Tillagt i Session 12 – v1.24: motståndarpoolens publika högar + host-design (22 juni)

**Johans önskemål:** högerklick på motståndarens poolglob/zon (visit + L3) → se deras **ash heap** OCH **burned cards** (båda publika). Plus: **host** ska få **Set pool** + **Ousted** där, för att hantera AFK-på-förlust.

**Byggt nu (publik del, båda transporter):** `viewOppBurned(seat)` (speglar `viewOppAsh`, filtrerar `pub.cards` zone==='burned'). Menyn visar båda högarna med live-antal. Hela globen/zonen taggad med `data-seat`+`matpool` (`!me`), inte bara "Pool N"-texten. `zbox` returnerar nu sitt element. `.matpool` har ingen CSS → inga visuella sidoeffekter.

**Pool-auktoritetsmodellen (nyckelinsikt):** pool är 100% klient-ägd; servern lagrar bara VP + `out`. Oust-bountyns +6 appliceras av *predatorns* klient på `{t:'bounty'}`. Därför: host-**oust** är rent server-auktoritativt (funkar även mot frånkopplad), men host-**set-pool** online måste reläas till målets klient (funkar bara om uppkopplad).

**Uppskjutet (design klar, ej byggt):** host set-pool/oust — kräver nya host-checkade serververb (`hostOust`, ev. `hostSetPool`→`forceSetPool`) + hotseat-lokala vägar + ett rättvisebeslut (ska host få sätta en *uppkopplad* motståndares pool?). Väntar på Johans grönt ljus om angreppssätt.
| v1.25 | 22 jun | Full host-kontroll på motståndarpoolens meny (visit + L3): ⚙ Set their pool, 💀 Oust / ↩ Return. Serververb `hostSetPool`/`hostOust`/`hostUnoust` (host-token-kollade) + klient `forceSetPool`/`forceOust`. `ousted(opts.forced)`, `awardBountyHot(seat)`. Oust server-auktoritativt (funkar mot frånkopplad); set-pool reläas (bara om uppkopplad) |

### Tillagt i Session 12 – v1.25: full host-kontroll (22 juni)

**Johan valde oinskränkt host-kontroll.** Menyn (host = `localTable || (inRoom()&&net.isHost)`) får under de publika högarna: **⚙ Set their pool…**, och **💀 Oust this player…** / **↩ Return them to the game**.

**Auktoritetsdelning** (pool är klient-ägd, out/VP server-ägt):
- **Oust online:** `{t:'hostOust', seat}` speglar `bounty` — sätter `out`, belönar predator (+1 VP server + reläar +6 till predatorns klient), `sys`-loggar, `rosterUpd`. Funkar även mot **frånkopplad** spelare. Reläar `{t:'forceOust'}` till målet (om uppkopplat) → `ousted({forced:true})` återlämnar kort.
- **Set pool online:** `{t:'hostSetPool', seat, val}` → reläar `{t:'forceSetPool', val}` → målet sätter pool + `schedulePush`. **Bara om uppkopplad.**
- **Un-oust:** `{t:'hostUnoust', seat}`.
- **Hotseat:** allt lokalt — `hostSetPoolHot`/`hostOustHot`/`hostUnoustHot` editar stored blob + roster, refreshar matten.

**`ousted(opts.forced)`:** hoppar confirm + self-bounty, gör oust-loggraderna localOnly (servern sys-loggar). `awardBountyHot(oustSeat)` generaliserad.

**Protokoll:** nya verb är wire-kompatibla tillägg; serverns verb-kedja slutar i benignt `else` → ny klient mot gammal server no-op:ar host-åtgärden. `VERSION` orörd.

**EJ runtime-testat (sandlådan kör ej server/multiplayer).** Johan verifierar live: host sätter uppkopplad motståndares pool; host oustar uppkopplad (kort återlämnas, predator +6/+1) OCH frånkopplad (server markerar out + belönar utan klientsvar); un-oust; samt set pool/oust på stored seat i hotseat. Kör gärna serverns testsvit.
| v1.26 | 22 jun | Table-panelens rader öppnar poolmenyn vid högerklick: motståndarrad -> ash/burned (+ host-kontroller som host), egen rad -> ash/burned + set pool + ousted. Motståndarmenyn utbruten till delad `oppPoolMenuItems(seat)` (globen + raden = samma källa); ny `selfPoolMenuItems()`. Funkar i solo/hotseat/online |

### Tillagt i Session 12 – v1.26: Table-radernas högerklicksmeny (22 juni)

**Johans önskemål:** högerklicksmenyerna för poolzonen (ash heap + burned, host-kontroller) ska gå att nå även genom att högerklicka på en spelare i den utfällda **Table**-panelen till höger — både online och offline — och de ska följa *vad man faktiskt får se* hos den man klickar på (motståndare: bara ash heap + burned; sig själv: även set pool + ousted; host: allt, oavsett egen eller motståndare).

**Byggt (klient, båda transporter):**
- **`oppPoolMenuItems(seat)`** — motståndarmenyns items utbrutna ur den globala `.matpool`-capture-lyssnaren till en delad funktion. Lyssnaren anropar den nu, och Table-raden anropar samma → globmenyn och panelmenyn kan aldrig glida isär (inkl. host-grenen `localTable || (inRoom() && net.isHost)`).
- **`selfPoolMenuItems()`** — egen rad: 🜂 din ash heap + 🔥 burned (interaktiv `browse`, du kan hämta tillbaka kort), ⚙ Set pool…, 💀 Ousted… / ↩ Return to the game. Dessa är alltid dina, host eller ej. Rör **inte** den befintliga `#poolWrap`-globmenyn (som fortsatt saknar ash heap — panelraden är den rikare ingången).
- **`statRow`** fick en `contextmenu`-lyssnare: hoppar över vakanta platser, hoppar över host-modknappar (`.smbtn`), kräver seat för motståndarrad, kollar `o.me` först (egen online-rad bär också `seat`). `showMenu(o.me ? selfPoolMenuItems() : oppPoolMenuItems(o.seat), x, y)`.

**Nyckelinsikt:** "vad man får se" mappar rent på me/opponent/host utan extra grenar — motståndarbyggaren gatar host-extras internt, egen rad ger alltid set pool/ousted, host-grenen tänds automatiskt. Egna högar via `browse` (lokala `state.zones`, relär bara för library/crypt); motståndarhögar via read-only `viewOppAsh/Burned` (`net.boards[seat].pub`). Spektatorrader byggs via `insertAdjacentHTML` (ej `statRow`) → får ingen lyssnare, vilket är rätt (ingen pool).

**EJ runtime-testat** (sandlådan kör ej server/multiplayer, och load-harness saknas i denna projektsnapshot — endast JS-syntaxgaten kördes). Johan verifierar live: högerklick på rader i Table-panelen i solo, hotseat och online — motståndarrad visar ash/burned (+ host-kontroller som host), egen rad visar ash/burned + set pool + ousted.
| v1.27 | 22 jun | Table-panelen: grid-layout (7 kolumner: lead/namn/pool/lib/minions/vp/mod). Namnkolumnen 1fr+ellipsis, stats i fasta kolumner, kolumnrubrik-rad med Cinzel-labels. Panelen breddat 284->310px |

### Tillagt i Session 12 – v1.27: Table-panel grid-layout (22 juni)

**Johans önskemål:** Table-panelens spelarrader ska ha ett tabellformat som håller stats-kolumnerna i linje oavsett namnlängd. Långa namn ska inte knuffa ut pool/lib/VP på ny rad.

**Byggt:**
- Varje `.srow` är nu `display:grid` med `grid-template-columns: 14px 1fr 30px 34px 34px 30px auto` — [lead | namn | pool | 📚 | 🧛 | 🏆 | mod-knappar]. Namnkolumnen är enda `1fr`, övriga fasta.
- `.sncell` har `min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis` → långa namn kapas med ellipsis istället för att radbryta.
- `.slead` (col 1): inline-flex med turnindikatorn ▶ + färgprick. Fallback till `.sseat` (seatnumret i muted mässing) när ingen prick finns.
- Pool-kolumnen: `.spool` (normal) eller `.sedge` (röd, med poolsiffra, när spelaren håller EDGE) — återanvänder pool-kolumnen, undviker extra kolumn.
- `.srow-hdr`: matchande `grid-template-columns`, Cinzel-labels (Pool / 📚 / 🧛 / 🏆), läggs in av `renderStats` som första element i `#statsBody`.
- `#statsPanel` breddad 284 → 310px.
- `.smod` och `.smbtn` orörda — bor i `auto`-kolumnen, ser likadana ut.
- `hover`-bakgrund funkar kvar eftersom `.srow` behåller sin box (ej `display:contents`).

**EJ runtime-testat.** Johan verifierar live: öppna Table-panelen i solo, hotseat och online — kolumnerna ska linja upp oavsett namnlängd; långa namn truncas med `…`; host-modknappar syns korrekt; EDGE-markering syns i poolkolumnen.
| v1.28 | 22 jun | Buggfix: turnindikatorn visas nu ensam i col 1 (inte bredvid pricken). Buggfix: högerklick på Table-rad öppnar nu pool-menyn (v1.26-lyssnaren återapplicerad). v1.26+v1.27+v1.28 levererade i ett genomlopp från v1.25-basen. |
| v1.29 | 22 jun | Play with open hand: stående reveal-grant. Handmenyn får `Play with open hand…` (→ `Open hand (on)…` när aktiv) med Selected player / All players + stopp-rader. `state.openHand` (seats + `'all'`-sentinel) sparas i serializeGame/restoreGame (överlever save/load + hotseat), nollställs i clearTable, EJ i undo-snapshot. Live re-push via `refreshOpenHands()` i `schedulePush()`. Mottagaren: `net.openHandFrom`, `openHandCardsFor()` (online = pushad lista, hotseat = parsar granterns lagrade blob), `viewOppHand()` read-only-overlay. 👁 Inspect their hand `unshift`as i `oppPoolMenuItems` → syns i både poolzon-menyn och Table-raden. Publik loggrad vid grant/revoke. Nya verb: client→server `openHand {to,cards}` / `{to,revoke}`; server→client `openHandGrant`/`openHandRevoke`. VERSION kvar 1.6 (additivt save-fält, wire-kompatibelt). Syntax-verifierat (client+server), EJ runtime-testat. |
| v1.30 | 22 jun | Ctrl+hover-lupp i browse-modalen: `data-card-name` stämplas på `.bcard` i alla fem byggarfunktionerna (face-down hoppas över). `lastCardEl`-selektorn utökad med `.bcard[data-card-name]`. Gate-villkoret i `pointermove`/`keydown(Control)` utökat: aktiveras också när ett `.bcard`-element är under pekaren, oavsett om panelen är infälld. Gäller ash heap, burned, open hand och online pile browse. Ingen serverändring. Syntax-verifierat, EJ runtime-testat. |
| v1.31 | 22 jun | Handmeny-städning: "Play with open hand…" flyttad in i Reveal…-undermenyn (sist, efter separator). "Shuffle library" borttagen från handmenyn. Syntax-verifierat. |
| v1.32 | 22 jun | Scroll på #z-hand justerar maxHand (adjustMaxHand ±1, 200ms cooldown, hx('hand')-gatad). cnt-hand visar nu n/maxHand. Tokens (blood/blue/green) bekräftade permanenta — överlever pass-skifte (serialiseras i serializeGame/snapshot, rensas ej i pass()). Syntax-verifierat, EJ runtime-testat. |
| v1.33 | 22 jun | Library browse: dubbelklick för att hämta kort (ej enkelvänsterklick). Vid dubbelklick öppnas omedelbart en reveal-meny ("Keep secret" / "All players" / namngivna spelare) — samma `_revealToMenu`-flöde som handmenyns Reveal. Library shufflas alltid vid stängning av browse-modalen (oavsett om kort hämtades). Crypt och ash heap-beteende oförändrat. |
| v1.34 | 22 jun | Library högerklicksmeny: "Discard top card" → "Discard top X…" och "Burn top card" → "Burn top X…". Nya funktioner `discardTopLibraryN`/`burnTopLibraryN` med `_promptN`-dialog. Offline: loop + en loggrad per kort + summaringsrad för n>1. Online: `{t:'pileTop', action, n}` → servern loopar `sendDrew` internt. Gamla enkelfunktioner bevarade för shortcuts. Wire-kompatibelt (gammal klient utan n-fält → count=1). Server+klient syntax-verifierade. |
| v1.35 | 22 jun | Library drag-to-draw / drag-to-park: dra från `#z-library` eller `#dockLib` till handen (draw) eller till ready-regionen (park face-down vid drop-positionen). Ghost-kort följer pekaren med guldring för handen och grön ring för ready. 5px-tröskel skiljer drag från klick. Online: `pendingRevealDrop`-koordinat konsumeras av `revealed`-handlern. Klient-only (ingen serverändring). Syntax-verifierat. |
| v1.36 | 22 jun | Fly-to-pile-animation: när ett kort returneras till library/crypt på annat sätt än musdrag flyger en klon från kortets position till den synliga pile-representationen (krymper + tonar ut, ~300ms × animSpeed). `flyToPile(c)` + `pileAnchorEl(pile)` (väljer synlig av z-library/dockLib/avLib/qrLib resp z-crypt/dockCrypt via offsetParent). Anropas i `returnToPile` (opts.noFly opt-out) + undoDraw/undoDrawStep/undoCryptDraw, alltid FÖRE move(). Drag-vägar (dropCard/groupDrop) orörda. Respekterar animMode. Klient-only. Syntax-verifierat. |
| v1.43 | 22 jun | Attachade kort följer vampyr till uncontrolled/torpor: `move()` ändrad från `zone!=='ready'` till `!COUNTER_ZONES.includes(zone)` som guard för releaseChildren. `layoutZone` torpor/uncontrolled-gren: `if(c.host) return`-guard + child-rendering med samma CX/CY stack-offset som ready (`hx+CX*(k+1), hy-CY*(k+1)`, stkk-klass). Barn stannar i `state.zones.ready` med host-referens intakt; uncontrolled-layouten renderar dem. Undo/serialisering/online oförändrade — host+attached sparas redan korrekt. Syntax-verifierat. | i `dropCard()`: pile-drop använder nu `dest=c.kind==='crypt'?'crypt':'library'` (som groupDrop redan gjorde); hand-drop blockerar `c.kind==='crypt'` tyst; uncontrolled-drop blockerar `c.kind!=='crypt'` tyst. `move()` och `groupDrop()` oförändrade. Syntax-verifierat. | dblclick + alltid-shuffle. Offline `browse()`: krypt-gren bruten ur `else` till eget `else if(z==='crypt')`, listener `click`→`dblclick`, nottext uppdaterad. `#browseClose`: `browseDirty &&`-guard borttagen för krypt. Online `netBrowseOpen()`: `click`→`dblclick` för pileTake (fixar även library online som missades i v1.33); nottext gjort pile-specifik för crypt resp library. Syntax-verifierat. | `#cryptDragGhost` (CSS + HTML div, krypt-baksida, lila ring för uncontrolled / grön för ready). IIFE med `cryptDragStart/cryptDragCleanup/cryptDragTarget/onMove/onUp`. Drop på `#z-uncontrolled` → `influence()`; drop på ready → park face-down vid drop-koordinater (offline direkt, online `pendingRevealDrop + reveal kind:'crypt' n:1`). Docken stänger explicit vid drag-start: `setL2Dock(false)` + `closeHand()`. Wired till `['#z-crypt','#dockCrypt']` forEach. Syntax-verifierat. | (park face down): `revealTopCrypt()` — prompt + loop som poppar `state.zones.crypt.at(-1)` → `move(c,'ready',{faceDown:true})` med staggerad X-offset. Online: `{t:'reveal', kind:'crypt', n}`. Server: `reveal`-handlern utökad med `isCrypt=m.kind==='crypt'` → väljer `p.game.crypt`, svarar med `{t:'revealed', names, kind:'crypt'|'lib'}`. Klient `revealed`: `makeCard(nm,'lib')` → `makeCard(nm, m.kind==='crypt'?'crypt':'lib')`; loggrad tar `m.kind`. Crypt-menyn: "Reveal top X… (park face down)" insatt mellan "Burn top X…" och separator. Syntax-verifierat. | `burnTopCryptN()` — prompt + loop som poppar `state.zones.crypt.at(-1)` → `move(c,'burned')`, logg per kort + summary. Online: `{t:'pileTop', action:'burn', kind:'crypt', n}`. Server: `pileTop`-handlern utökad med `isCrypt=m.kind==='crypt'` → väljer `p.game.crypt` vs `p.game.lib`, skickar rätt `kind` i `sendDrew`. Crypt-menyn refaktorerad till `forEach(['#z-crypt','#dockCrypt'])` — samma meny på båda elementen. Ny menystruktur: Draw 1 / Influence / Undo — separator — Burn top X… — separator — Shuffle / Browse. Klient `drew`-handler: loggraden för burn läser nu `m.kind==='crypt'?'crypt':'library'`. Syntax-verifierat. | (alla pile-element är då display:none). `pileAnchorEl` faller tillbaka på synligt `#l2dock` (L2/L3-folded) eller `#handTab` (vid besök). Visibilitetstest utbrutet till `_visibleEl(id)`. Kortet krymper in i den låga handtagsraden via befintlig uniform-scale. Syntax-verifierat. |

### Tillagt i Session 12 – v1.33: Library browse dubbelklick + alltid-shuffle (22 juni)

**Johans önskemål:** Library browse ska kräva **dubbelklick** för att hämta ett kort (inte enkelvänsterklick). Vid hämtning ska en **reveal-prompt** dyka upp direkt med valet att antingen hålla kortet sekretessbelagt ("Keep secret") eller reveala det till en eller flera spelare — samma logik som handmenyns `Reveal…` → `_revealToMenu`. Library ska dessutom **alltid shufflas** när man stänger browse-modalen, oavsett om ett kort hämtades eller inte.

**Byggt (klient, `browse()` + `$('#browseClose')`):**
- **`dblclick` ersätter `click`** för library-fallet i `.bcard`-loopen. Burn-mode (ash heap) behåller `click`; crypt, ash heap och burned pile behåller `click` (oförändrade).
- **Reveal-meny efter hämtning:** direkt efter `move(c,'hand')` och `d.remove()` öppnas `showMenu([{label:'Keep secret', fn:()=>{}}, '-', ..._revealToMenu([c])], centX, centY)`. Samma `revealHandTo`-flöde som handmenyn — fungerar i solo (loggad, ingen publik linje), hotseat och online.
- **Alltid shuffle:** `$('#browseClose')` ändrad från `if(browseDirty && (browseZone==='library'||browseZone==='crypt'))` till `if(browseZone==='library') shuffleZone('library'); else if(browseDirty && browseZone==='crypt') shuffleZone('crypt');` — library shufflas ovillkorligt, krypt bara om `browseDirty`.
- **Note-texten** uppdaterad: library visar "Double-click a card to fetch it. The library is always reshuffled when you close."

**EJ runtime-testat.** Johan verifierar live: (1) öppna library browse — enkelvänsterklick ska INTE hämta kortet; (2) dubbelklick hämtar kortet + reveal-menyn dyker upp centrerat; (3) välj "Keep secret" → inget händer, kortet är i handen och hemligt; (4) välj en spelare → normal reveal-animation + logg; (5) stäng browse utan att ta något kort → library shufflas ändå (logg + riffle-animation); (6) kontrollera att ash heap, burned pile och crypt fortfarande beter sig med enkelvänsterklick.

### Tillagt i Session 12 – v1.34: Discard/Burn top X (22 juni)

**Johans önskemål:** Library-menyns "Discard top card" och "Burn top card" ska ersättas med X-varianter som frågar hur många man vill göra.

**Byggt (klient + server):**
- `discardTopLibraryN()` / `burnTopLibraryN()` — kör `_promptN`, sedan offline: `pushUndo()` + loop som poppar `state.zones.library.at(-1)`, en loggrad per kort + sammanfattning om n>1. Online: skickar `{t:'pileTop', action, n}` en gång.
- Gamla `discardTopLibrary` / `burnTopLibrary` bevaras oförändrade (target för shortcuts `id:'discardTop'/'burnTop'`); fick bara `pushUndo()` tillagt för konsekvens.
- Server: `pileTop`-handlern beräknar `count = Math.min(Math.max(parseInt(m.n,10)||1, 1), lib.length)` och kör en loop av `sendDrew`-anrop. Wire-kompatibelt — gammal klient utan `n` → count=1.

**EJ runtime-testat.** Johan verifierar live: högerklick på library → "Discard top X…" → ange t.ex. 3 → tre kort discastas (logg per kort + summary); samma för Burn. Online: rätt antal `drew`-meddelanden med zone=ash/burned. Gamla shortcuts (om satta) pekar fortfarande på enkelvarianten.

### Tillagt i Session 12 – v1.35: Library drag-to-draw / drag-to-park (22 juni)

**Johans önskemål:** Drag från biblioteket till handen (draw) eller till ready-regionen (park face-down vid drop-positionen).

**Byggt (klient, ingen serverändring):**
- `#libDragGhost` — `position:fixed` div med kortbaksbilden (84×118 px, opacity 0.78), `transform:translate(-50%,-60%)` håller bilden lite ovan pekaren. CSS-klasserna `ghost-hand`/`ghost-ready` adderar guldring respektive grönring via `box-shadow`.
- IIFE efter library-lyssnarblocket: `libDragStart` på `pointerdown` (button=0, bibliotek ej tomt) sätter `setPointerCapture` + globala `pointermove`/`pointerup`-lyssnare. 5px-tröskel i `onMove` innan ghosten visas.
- `onUp` kontrollerar `libDragTarget` → `'hand'` → `drawCard()`, `'ready'` → park face-down vid drop-koordinater (offline direkt, online via `pendingRevealDrop + mpSend({t:'reveal',n:1})`), `'cancel'` → ingenting.
- **`pendingRevealDrop`** — modul-level variabel som sätts precis innan `reveal`-skicket online; `revealed`-handlern konsumerar den för att placera det första kortet på rätt position. Nollsätts direkt efter läsning.
- Befintliga `click`/`dblclick`-lyssnare på `#z-library` är bevarade (de kallas inte längre via events pga `preventDefault`, men `drawCard()` anropas explicit i `onUp` för hand-drop).

**Känd begränsning:** Sub-threshold tap (ingen rörelse) på biblioteket resulterar i `cancel` — ingenting händer. För mus är detta osynligt; på touch kan det kännas träigt. Framtida fix: om `!ld.started` i `onUp` och kortet inte är tomt, kalla `drawCard()` direkt.

**EJ runtime-testat.** Johan verifierar live: (1) dra från library till handen → draw + logg; (2) dra till ready-regionen → face-down-kort placerat ungefär där pekaren landade + selekterat; (3) dra till ash/crypt/elsewhere → ingenting händer, ghost försvinner; (4) online: park-drag landar på ungefär rätt position; (5) dockLib-panelen fungerar på samma sätt; (6) vanlig klick/dblclick på library fortfarande fungerar.

### Tillagt i Session 12 – v1.36: Fly-to-pile-animation (22 juni)

**Johans önskemål:** När ett kort skickas tillbaka till biblioteket (eller crypt) från brädet, handen osv — utom genom musdrag — vore det snyggt med en snabb animation där kortet flyttas från sin position till pile/panelen.

**Designdiskussion:** Föreslog en "fly-to-pile"-klon (oberoende av `cardFx`, som är en centrerad presentationsoverlay utan A→B-geometri). En fixed-position div skapas på kortets nuvarande skärmposition och CSS-transitionas till den synliga pile-representationen.

**Byggt (klient, ingen serverändring):**
- **`pileAnchorEl(pile)`** — returnerar första *synliga* DOM-representationen av pile via `offsetParent!==null` + non-zero rect. Library-prioritet: `z-library` → `dockLib` → `avLib` → `qrLib`; crypt: `z-crypt` → `dockCrypt`. Träffar rätt representation oavsett vy utan att spåra view-state.
- **`flyToPile(c)`** — fångar `c.el.getBoundingClientRect()`, skapar `.flycard`-div med kortets bild (framsida om känd, annars baksida), transitionar translate+scale+opacity över ~300ms × `conv.animSpeed`. Double-rAF så startframen målas innan transitionen. `transitionend` + `setTimeout`-safety-net med `done`-guard. Respekterar `animMode==='all'` (av → ingen klon).
- **Anropas FÖRE `move()`** i: `returnToPile(c,pos,opts)` (ny `opts.noFly` opt-out; täcker högerklicksmeny Top/Bottom/Shuffle in, handmenyns Selected-retur, och `returnRandomHandN` som loopar → varje slumpkort flyger individuellt), samt `undoDraw`/`undoDrawStep`/`undoCryptDraw`.
- **Orörda (drag-vägar):** `dropCard` + `groupDrop` — kort/grupp som släpps på library/crypt flyttas under pekaren utan klon, enligt önskemål.

**Nyckelinsikt:** källrect MÅSTE fångas före `move()` eftersom `layout()` döljer/flyttar kortets element direkt vid zonbyte. Klonen är en fristående `document.body`-child som överlever originalets relayout.

**EJ runtime-testat.** Johan verifierar live: (1) högerklicka kort på brädet → Return to library → Top/Bottom/Shuffle in → klon flyger till biblioteket; (2) handmenyns Return → Selected; (3) Return random X → flera kort flyger; (4) Undo draw (Ctrl-klick library) → kortet flyger tillbaka; (5) i L2-dock/L3 → siktar på rätt synlig pile; (6) drag ett kort till library → INGEN klon (oförändrat); (7) animationshastighet-inställningen skalar farten; (8) animationer av → ingen klon.

### Tillagt i Session 12 – v1.37: Fly-to-pile mot infällt dock-handtag (22 juni)

**Johans observation:** Fly-to-pile-animationen (v1.36) spelade inte när panelen för crypt/library/ash heap/hand var infälld. Önskemål: spela den ändå, men mot panelen, så kortet försvinner in i den.

**Orsak:** I L2/L3 med kollapsad dock är alla fyra pile-representationer (`z-library`/`dockLib`/`z-crypt`/`dockCrypt`) `display:none`. `pileAnchorEl` hittade inget synligt element → returnerade null → `flyToPile` hoppade tyst över.

**Byggt:**
- `pileAnchorEl(pile)` fick en fallback-kedja efter den vanliga pile-listan: synligt `#l2dock` (det infällda dock-handtaget i L2/L3) → `#handTab` (handfliken som syns vid besök på annat bräde) → null.
- Visibilitetstestet (offsetParent + non-zero rect) utbrutet till hjälparen `_visibleEl(id)`, återanvänd av både pile-listan och handtags-fallbacken.

**Visuellt:** handtaget är en bred, ~26px-hög rad. Den befintliga uniform-scale-formeln `min(1, tw/from.width, th/from.height)` styrs av höjdkvoten (~22%), så klonen krymper tydligt ner i den tunna raden — "sugs in i panelen". Ingen ändring i `flyToPile`-geometrin behövdes; bara ankaret ändras.

**EJ runtime-testat.** Johan verifierar live: (1) fäll in docken i L2/L3, returnera ett kort från brädet → klonen ska flyga ner i handtagsraden och krympa in i den; (2) samma vid besök på annat bräde (`#handTab`); (3) med docken uppfälld → siktar fortfarande på den faktiska pile (oförändrat v1.36-beteende); (4) animationshastighet skalar farten.

### Tillagt i Session 12 – v1.44: Ash heap browse dubbelklick + hovrbar logg (22 juni)

**Johans önskemål:** Ash heap Browse ska kräva **dubbelklick** för att plocka upp ett kort till handen, precis som Library och Crypt. Kortnamnet ska loggas öppet (det är en publik zon) med hover-stöd.

**Byggt (klient, `browse()`):**
- `else`-blocket (som täckte både ash och burned) delat i `else if(z==='ash')` (dblclick) och `else` (click, burned pile). Matchar mönstret från v1.33 (library) och v1.41 (crypt).
- Ash-loggen ändrad från `'<b>'+escapeHtml(c.name)+'</b> was fetched from the ash heap.'` till `cardRefCap(c)+' was fetched from the ash heap.'` — ger `data-cid`-attribut som möjliggör hover-preview i loggen (vänsterpanel eller Ctrl+hover när infällt).
- Burned pile-logg fic samma fix: `cardRefCap(c)+' was retrieved from the burned pile.'`.
- `browseNote` för ash: `'Double-click a card to return it to your hand. The ash heap is public — the card name is logged openly.'` (var tom sträng tidigare).
- Ingen reveal-meny — ash heap är publik, kortnamnet loggas öppet, ingen hemlighet att hantera.
- Ingen serverändring — `browse('ash')` är alltid offline (early-return gäller bara library/crypt online).

**EJ runtime-testat.** Johan verifierar live: (1) öppna ash heap Browse → enkelvänsterklick ska EJ ta kortet; (2) dubbelklick tar kortet + loggas med kortnamnslänk (hovrbar); (3) Ctrl+hover i loggen visar kortbilden i vänsterpanelen; (4) stäng Browse utan att ta något → ingen shuffle (ash heap blandas aldrig); (5) burned pile behåller enkelvänsterklick; (6) "Burn a card (choose)" via ash heap-kontextmenyn är opåverkat (mode==='burn', använder click-lyssnaren).

### Tillagt i Session 12 – v1.45: Ash heap Browse konsoliderat till undermeny (22 juni)

**Johans önskemål:** Slå ihop "Browse…" och "Burn a card… (choose)" till ett enda "Browse…" med tre undermenyer: *View only*, *Pick card(s)*, *Burn card(s)*.

**Byggt (klient, `browse()` + fyra entrypunkter):**
- **`browse('ash','view')`** — nytt mode: titel "View: ash heap", note "Public pile — view only. Ctrl+hover for card preview.", inget event-lyssnare på `.bcard`-element (men `data-card-name` sitter kvar så Ctrl+hover fungerar).
- **`browse('ash','burn')`** — dubbelklick ändrat från `click` till `dblclick` (konsekvent med pick; undviker olycksbränning).
- **`browse('ash')`** (pick mode) — oförändrat i beteende, nu nåbart via submenyval "Pick card(s)".
- **`_titlePfx`-lokal:** `'Burn — '` / `'View: '` / `'Browse: '` beroende på mode.
- **`#z-ash` click:** ersätter `browse('ash')` direkt med `showMenu([View only, Pick card(s), Burn card(s)])`.
- **`#z-ash` contextmenu:** "Browse…" + "Burn a card… (choose)" → ett `{label:'Browse…', sub:[...]}` + "Undo last discard" + separator + "Burn random card".
- **`#dockAsh` click:** samma submeny som `#z-ash` click.
- **`selfPoolMenuItems()`:** "View your ash heap" → "Browse ash heap (N)…" med sub.
- **Shortcut `browseAsh`:** oförändrad — anropar `browse('ash')` (pick) direkt, shortcuts hoppar över undermeny.

**EJ runtime-testat.** Johan verifierar live: (1) klick på ash heap-pile → submeny med tre val; (2) "View only" → modal öppnas utan interaktion, Ctrl+hover på kort visar preview; (3) "Pick card(s)" → dubbelklick tar kort, modal stannar öppen för fler; (4) "Burn card(s)" → dubbelklick bränner kort, modal stannar öppen; (5) högerklick ash heap → "Browse…" ▸ submeny; (6) dockAsh-knappen → submeny; (7) pool-högerklick → "Browse ash heap (N)…" ▸ submeny; (8) shortcut B (om satt till browseAsh) → öppnar pick direkt.

### Tillagt i Session 12 – v1.46: Burn X random från ash heap (22 juni)

**Johans önskemål:** "Burn random card" → "Burn X random…" med prompt för antal.

**Byggt:** `burnRandomAshN()` — `_promptN` för antal, `_randomSubset` för urval, loop med `move(c,'burned')` + `cardRef(c)` per kort + summering om n>1. Menyetiketten uppdaterad; shortcut `burnRndAsh` pekar nu också på N-varianten. `burnRandomAsh` (enkort) bevarad i koden men ej längre uppkopplad.

**EJ runtime-testat.** Johan verifierar: högerklick ash heap → "Burn X random…" → ange antal → rätt antal bränns med individuella loggrader + summering.

### Tillagt i Session 12 – v1.47: Target från motståndarens ash heap browse (22 juni)

**Johans önskemål:** Dubbelklick på kort i motståndares ash heap browse sätter/rensar Target — samma logg och outline som Target annars.

**Byggt (klient, `viewOppAsh` + CSS):**
- `dblclick`-lyssnare per `.bcard`: rensar `.btarget` från hela griden, kollar `net.rtarget` — om kortet redan är target → `setRTarget(null)` (clear); annars → `d.classList.add('btarget')` + `setRTarget({seat, cid, who, name, faceDown})`.
- Befintligt target markeras med `.btarget` direkt när modalen öppnas.
- Note-text: `'Public pile — double-click a card to set/clear target.'`
- CSS `.bcard.btarget`: krimson ring på `.bimg`, röd `.bname`, `⌖`-symbol via `::before` på `.bcard.btarget` (position:relative; top:-2px; left:50%) — på `.bcard` inte `.bimg` för att undvika overflow:hidden-klippning.
- Använder `setRTarget` (inte lokal flag) → loggas + target-knappen tänds + synkar online.

**EJ runtime-testat.** Johan verifierar: (1) högerklick motståndarens pool → visa ash heap → dubbelklick kort → krimson ring + ⌖ + logg "⌖ Target: Kortnamn." + target-knapp tänds; (2) dubbelklick igen → clear; (3) öppna modalen igen med befintligt target → kortet redan markerat; (4) hotseat: fungerar utan nätverk.

### Session 14 – v1.55: Hand panel sorted by type + alpha (23 juni 2026)

**Johans önskemål:** Korten i hand-panelen (synlig i L2 Home, L2 Visit och L3 Overview) ska sorteras från vänster till höger efter korttyp i VTES-ordning, sedan bokstavsordning inom varje typ.

**Typordning:** master → action → political → ally → retainer → equipment → modifier → reaction → combat → other (event, conviction, power, okänd).

**Byggt (klient, `renderHand`-sektionen, rad ~7206):**

- `HAND_TYPE_ORDER` (konstant): `{ master:0, action:1, political:2, ally:3, retainer:4, equipment:5, modifier:6, reaction:7, combat:8 }`.
- `handTypePri(c)`: returnerar ett tal 0–8 (eller 99 för "other", -1 för crypt-kort i hand). Slår upp `cardTypes.get(norm(c.name))` och väljer den lägsta (bästa) ranken om kortet har flera typer (t.ex. "Action / Reaction"). Fallback 99 om DB inte är laddad.
- `handSortCmp(a, b)`: comparator — primär nyckel = typrank, sekundär nyckel = `localeCompare(a.name, b.name)`.
- `renderHand()`: en ny rad `cards.sort(handSortCmp)` direkt efter att `cards`-arrayen byggts, innan rendering.

**Viktigt:** `state.zones.hand`-arrayen muteras INTE — sorteringen sker på den härledda `cards`-kopian. Drawordning och serialisering påverkas inte.

**Fallback:** Om kortdatabasen inte är laddad sorteras handen enbart alfabetiskt (inga typgrupper, men ingen krasch).

**EJ runtime-testat.** Johan verifierar: (1) öppna docken med en blandad hand → korten syns sorterade master-first, sedan actions, political etc.; (2) inom varje typ är korten i bokstavsordning; (3) fungerar med DB avaktiverad (enbart alpha).



**Johans önskemål:** Slå ihop de lösa flytt-alternativen i högerklicksmenyn för kort i play till en samlad `Send card…`-undermeny. Dessutom: ta bort `Set owner…` ur menyn (owner-fältet behövs i modellen men behöver aldrig redigeras manuellt i normalt spel).

**Diskussion:** Genomgång av skillnaden mellan `owner` och `controller`: `owner` styr vart andras kort går vid oust (till ägarens ash heap); `controller` styr att ett kort *stannar kvar i spel* när den ursprunglige ägaren oustar. Slutsats: `Give control…` täcker det praktiska behovet; `Set owner…` är ett obskyrt nödverktyg som tas bort från menyn men lämnas kvar i koden.

**Byggt (klient, `cardMenu()`, ingen serverändring):**

- Ny lokal `sendSub`-array byggs dynamiskt:
  - Crypt-kort: `To torpor` (om ej i torpor) *eller* `Leave torpor` (om i torpor) + `To burned`.
  - Library-kort: `To hand` + `To ash heap` + `To burned` + `pileSub(c)` (→ Top/Bottom/Shuffle in).
- `items.push({label:'Send card…', sub:sendSub})` ersätter de fyra/fem platta items som låg löst.
- `Set owner…`-blocket kommenterat bort med förklaring; `owner`-fältet och all oust-logik orörda.
- `Give control…` kvar oförändrat direkt under `Send card…`.

**EJ runtime-testat.** Johan verifierar live: (1) högerklick crypt-kort i ready → `Send card… ▸ To torpor / To burned`; (2) högerklick crypt-kort i torpor → `Send card… ▸ Leave torpor / To burned`; (3) högerklick library-kort → `Send card… ▸ To hand / To ash heap / To burned / Return to library ▸ Top…`; (4) `Give control…` syns och fungerar; (5) `Set owner…` är borta.

### Session 13 fortsättning – v1.49: Flip face up selected + face-down log inspect (23 juni)

**Tre fixar i ett batch:**

**`groupFlipUp()`** — ny funktion precis före `flipSelected()`. Itererar `state.selected`, flippar bara kort där `c.faceDown===true`, kör `ensureImg`, `animCard('flipup')`, `cardFx('flip',{reveal:true})`, loggar varje kort individuellt med `cardRefCap(c)+' flipped face up.'`. `layout()` efter loopen. Wires till `{label:'Flip face up selected', fn:groupFlipUp}` i `groupMenu()` mellan Unlock selected och Stack selected.

**`cardRef`/`cardRefCap` (rad 1719–1720)** — face-down-arm ändrad från plain-text till `<b class="clog" data-cid="...">a/A face-down card</b>`. Alla loggposter för face-down-kort är nu klickbara/hoverbara.

**`findInspect` (rad 2791)** — guard `!lc.faceDown` borttagen; face-down-kort matchas alltid på `cid`. Samma fix i `net.boards`-loopen. `addRCard` renderar redan korrekt baksida för `faceDown:true` så inspektvyn visar kortbaksidan automatiskt.

**EJ runtime-testat.** Johan verifierar: (1) markera flera face-down kort → högerklick → "Flip face up selected" → varje kort loggas separat med klickbar länk; (2) hover/klick på "a face-down card" i loggen → visar kortbaksidan i preview/logInspect.

**Förtydligande efter implementation (diskussion):** Face-down-kort är fortfarande helt hemliga — loggposten säger "a face-down card", klick/hover visar kortbaksidan (inte framsidan), och Ctrl+hover på brädet triggar ingen preview alls (ingen `dataset.cardName` sätts för face-down). När kortet flippas visas kortnamnet i loggen direkt (loggposten skrivs efter `faceDown=false` satts) och är sedan fullt klickbart/hoverbart med framsida och tokens.

### Session 13 fortsättning – v1.50: cardFx actor-mode (vampyr spelar kort) (23 juni)

**Johans önskemål:** När man drar ett kort från handen till ready-regionen med en markerad vampyr, ska klonanimationen visa vampyren (liten bild, vänster) med pil mot det spelade kortet (stor bild, höger). Texten: `"<vampyrens namn> plays <kortets namn>"` + spelarnamn inom parentes på egen rad under. Referens: dubbelklick-play (playOnActive) visar omvänt — kort ➤ pil ➤ vampyr.

**Vad som fattades:** Drag-till-ready-grenen i `dropCard` (rad ~2641) hade loggen `"<vampyr> plays <kort>"` men **ingen** `cardFx`-anrop. `playOnActive` (dubbelklick) hade `cardFx(c, 'play', { target: a })` — kort(stor) ➤ vampyr(liten).

**Byggt (klient, 5 editeringar + 1 CSS-tillägg):**

1. **Broadcast (`mpSend` i `cardFx`):** `actor`-fält tillagt bredvid befintliga `target`- och `onto`-fält — `actor: (kind==='play' && opts.actor) ? fxCardInfo(opts.actor) : null`.

2. **`cardFx` renderings-gren:** Ny `if(kind==='play' && opts.actor)`-arm _innan_ den befintliga `opts.target`-armen. Bygger vampyrbilden som `.cfximg.tgt`, skapar pil-div, insätter båda med `row.insertBefore(..., row.firstChild)` i omvänd ordning → vampyr(vänster) ➤ pil ➤ spelat kort(höger).

3. **Caption i actor-mode:** Om `actor.name` och `c.name` är kända: `<vampyrnamn> plays <kortnamn>` i `cfxwho`/`cfxact`/`cfxwho`-spans, plus ett nytt `.cfxsub`-element `"(seat · spelarnämn)"` i wrappen. Fallback till standard-caption om något namn saknas (face-down).

4. **CSS `.cfx .cfxsub`:** 15px Cinzel, 70% opacity, under caption-raden.

5. **Call-site `dropCard` (rad ~2645):** `if(a){ qrPhasePlayed.add(c.id); cardFx(c, 'play', { actor: a }); }` — anropas bara när vampyr-anchor finns, efter befintlig logg.

6. **Remote handler:** `actor: m.actor||null` tillagt i `t:'fx'`-hanteraren så online-spelare ser actor-mode-animationen.

**EJ runtime-testat.** Johan verifierar: (1) markera en vampyr, dra ett kort från handen till ready → klonanimationen visar vampyr(liten) ➤ pil ➤ kort(stor), text "VampyrNamn plays KortNamn" + "(Seat · Spelarnämn)" under; (2) dra utan markerad vampyr → ingen animation (oförändrat); (3) dubbelklick-play (playOnActive) → fort(stor) ➤ pil ➤ vampyr(liten) — OFÖRÄNDRAT; (4) online: motspelarna ser samma actor-mode animation; (5) face-down-kortsplay → fallback till standard-caption (inget namn → generisk text).

### Session 13 fortsättning – v1.51: Dubbelklick + hand-meny konsistens (23 juni)

**Johans önskemål:** Dubbelklick ska spela till brädet (inte fästa på vampyr). "Play on vampyr" ska vara ett explicit val i högerklicksmenyn för handen, tillgängligt i alla vyer.

**Byggt:**
- `tap()` rad ~2592: `playOnActive(c,false)` → `playFromHand(c,false)`.
- Hand zone högerklicksmenyn `Play card…`-submeny (rad ~3954): byggs nu via IIFE som kollar `activeAnchor()` — om vampyr markerad läggs `{label:'Play on <vampyr> (<kort>)', fn:()=>_requireSelected(c=>{ pushUndo(); playOnActive(c,false); })}` till som tredje val.
- `playFromHand`: `tagPlayed(c)` → `tagPlayed(c, a || undefined)` — actor-mode-animationen triggas nu även vid dubbelklick och "Face-up" från hand-meny.

**EJ runtime-testat.** Johan verifierar: (1) dubbelklick handkort utan vampyr → spelar fritt till brädet; (2) dubbelklick med vampyr markerad → spelar fritt till brädet (INTE på vampyren); (3) högerklick hand → "Play card…" → tre val syns när vampyr är markerad; (4) "Play on X" → spelar på vampyren med actor-mode-animation.

### Session 13 fortsättning – v1.52–v1.53: cardFx caption-system omskrivet (23 juni)

**Johans önskemål:** Animationernas caption ska spegla loggtexten — kortnamn synligt, spelarnamn som kontext. T.ex. "Blood Doll was played on Dominique (Johan)", "Johan plays Dreams of the Sphinx", "Johan locked Dominique".

**Byggt:** Caption-blocket i `cardFx` (rad ~8529–8546) fullständigt omskrivet. Hjälpvariabler `_dot`, `_who`, `_playerLabel`, `_cname()`, `_sub()` definierade lokalt. Separata grenar för varje situation: actor-mode, target (ingen onto), play utan kontext, onto (cross-table), rise, flip, handreveal, lock/unlock fallback. Lock/unlock fick kortnamn i v1.53 (glömdes i v1.52-batchen). `toName` skickas nu i `mpSend` för `t:'revealHand'` och `t:'fx'` så online-motspelares animation visar rätt namn.

**EJ runtime-testat.** Johan verifierar alla animationstyper: play utan/med vampyr, attach, cross-table give, rise, flip, handreveal, lock/unlock — alla ska visa kortnamn + rätt kontext.

### Session 13 fortsättning – v1.54: Klick på animation avbryter den (23 juni)

**Johans önskemål:** Klick på klonanimationen ska avbryta den direkt.

**Byggt:** `wrap.style.pointerEvents='auto'`, `wrap.style.cursor='pointer'`, `wrap.addEventListener('click', ()=>wrap.remove(), { once:true })` tillagt direkt efter `animationend`-lyssnaren. `#cardFx` behåller `pointer-events:none` på containernivå — wrappens egna `auto` override:ar det lokalt utan att blockera brädet när ingen animation spelas.

**EJ runtime-testat.** Johan verifierar: klick mitt i en animation → försvinner direkt; klick på brädet utan aktiv animation → fungerar normalt.

### Session 14 fortsättning – v1.56: Settings KRCG-beskrivning utökad (23 juni)

**Johans önskemål:** Beskrivningen för Card Database (KRCG) i Settings ska förklara vad databasen faktiskt gör, så spelarna förstår värdet.

**Byggt:** `<span class="sl">`-texten ersatt med en fyra-punktsbeskrivning: (1) minion detection, (2) korttext och statistik i preview-panelen, (3) typordnad handsortering, (4) Deck Lab med katalog och starterlekar. Avslutas med "Without it everything still works, but these features degrade gracefully."

---

### Session 14 fortsättning – v1.57: The Edge tooltip (23 juni)

**Johans önskemål:** Edge-knappen ska ha en snabb Windows-stil tooltip (samma som korttips) när man hovrar.

**Byggt (tre steg):**

1. `data-tip="The Edge — grants +1 pool at Unlock"` tillagt på `#edge`. `title`-attributet borttaget (det gamla `title`-värdet med lång text ersattes av `data-tip`, sedan togs `title` bort helt för att undvika dubbla tooltips).

2. **`cardTip`-systemet utökat** med `[data-tip]`-stöd: `mouseover`-lyssnaren kollar nu `t.closest('[data-tip]')` som ett alternativt spår bredvid `.card`-spåret. Om ett `data-tip`-element träffas (och inget `.card` också träffas) visas `tipEl.dataset.tip` i `#cardTip`. `mouseout`-armen återställer inte `title` för `data-tip`-element (de har aldrig ett `dataset.cardName`).

3. `data-tip`-mekanismen är nu generell — kan läggas på vilket UI-element som helst för att få samma snabba tooltip-stil.

**EJ runtime-testat.** Johan verifierar: hovra över Edge-knappen → `#cardTip` med "The Edge — grants +1 pool at Unlock" dyker upp; inget native browser-tooltip syns.

---

### Session 14 fortsättning – v1.58: nudgeFree — kort staplas aldrig helt (23 juni)

**Johans önskemål:** Kort som spelas direkt från handen eller revealas från lekarna ska aldrig landa helt ovanpå ett befintligt kort — alltid lite off så man ser om det finns kort under.

**Byggt:** Ny hjälpfunktion `nudgeFree(wx, wy)` placerad precis före `playFromHand`:

- Samlar display-positioner för alla befintliga ready-kort via `pubXform(oc.x, oc.y)`.
- Definierar överlapp som `dx < (CW-20) && dy < (CH-20)` — minst 20px ("peek margin") av undre kortet måste sticka ut.
- Provar 9 positioner i expanderande spiral (0°, ±offset i x/y, ±CW×0.6 etc.). Returnerar första icke-överlappande position, clampat inuti ready-zonen.
- Fallback: slumpmässig vinkel med garanterat 30px offset om alla försök misslyckas.

**Tre call-sites patchade:** `playFromHand`, `revealTop` (bibliotek), `revealTopCrypt` (crypt).

**Koordinatsystem-notering:** `nudgeFree` arbetar i display-koordinater (samma som `zoneRect`). `pubXform` konverterar kanoniska `c.x/c.y` → display; `move()` konverterar sedan tillbaka via `readyToCanon`. I L1 är kanoniska = display, så ingen dubbel-konvertering.

---

### Session 14 fortsättning – v1.59: Deck Lab — Load saved deck (23 juni)

**Johans önskemål:** Deck Lab ska ha en "Load saved deck"-lista ovanför "Load starter deck" så man kan redigera sina sparade lekar direkt.

**Byggt:**

**HTML:** Ny `deckrow`-div med `#savedDeckSel` (select) + `#labDelSaved` (Delete-knapp) tillagd ovanför befintlig `preconSel`-rad. En `<span style="min-width:130px">` spacer i precon-raden håller `preconSel` kolumnriktad under `savedDeckSel`.

**CSS:** `#savedDeckSel` tillagd i styled-selects-regeln (`#logTurnSel, #deckSel, #savedDeckSel`). Ny `.deckrow #savedDeckSel{flex:1; min-width:0}`.

**JS:**
- `refreshLabDeckSel()` — ny funktion precis före `refreshPreconSel()`. Fyller `#savedDeckSel` med sparade lekar via `loadDecks()` + `deckLabel()`. Platshållartext: `"— My saved decks (N) —"` / `"— No saved decks yet —"`.
- `#savedDeckSel` change-listener: `loadParsedIntoEditor(parseDeck(d.text))`, sätter `editDeck.name = d.name`, `editOrig = snapDeck(editDeck)`. Select återställs till `''` efteråt så samma lek kan väljas igen.
- `#labDelSaved` click-listener: bekräftelsedialog → `saveDecks` → `refreshLabDeckSel()` + `refreshDeckSel()` (synkar båda listor).
- `newEmptyDeck()`: nollställer `#savedDeckSel` tillsammans med `#preconSel`.
- `openDeckLab` + `openDeckLabBeside`: kallar `refreshLabDeckSel()` vid öppning.
- `labSaveLib`: kallar `refreshLabDeckSel()` direkt efter `storeDeck` — listan uppdateras utan att stänga laben.

---

### Session 14 fortsättning – v1.60: Torpor-buggar fixade (23 juni)

**Bugg 1 — bibliotekskort "rinner av" vid drag till torpor/uncontrolled:**

`dropCard` saknade `c.kind==='crypt'`-guard för torpor-grenen, trots att uncontrolled redan hade det. Bibliotekskort kunde dras till torpor och hamnade i ett odefinerat tillstånd (räknades som torpor-kort men renderades inte korrekt).

Fix: `if(c.kind!=='crypt'){ layout(); return; }` tillagt i torpor-grenen i `dropCard` — exakt samma mönster som uncontrolled. Samma guard tillagd i `groupDrop`'s else-gren för både torpor och uncontrolled.

**Bugg 2 — vampyr med fästa kort studsar till ready vid hover i torpor:**

`restack(c)` anropas vid hover-expand av en stack och placerar med `place(c, c.x, c.y, ...)`. Men `c.x/c.y` är **kanoniska ready-koordinater** — uppdateras bara när ett kort placeras i ready via `readyToCanon`. När vampyren sänds till torpor via menyn uppdateras aldrig `c.x/c.y`; de behåller old ready-positionen. `layoutZone('torpor')` sätter korrekt position via `place(c, hx, hy, ...)` och sparar i `c.tx/c.ty`, men `restack` ignorerade dessa.

Fix: `restack` väljer nu koordinater beroende på zon:
```js
const inReady = (c.zone === 'ready');
const bx = inReady ? c.x : c.tx, by = inReady ? c.y : c.ty;
```

**Notering:** Fästa bibliotekskort i torpor/uncontrolled är alltid indirekta — de följer sin host passivt och befinner sig tekniskt i `state.zones.ready` med `c.host` satt. `layoutZone('torpor')` renderar dem via `c.attached.forEach`. Dragar av fästa libkort till torpor är (korrekt) blockerade av guarden.

---

### Session 14 fortsättning – v1.61: Edge-knapp klickbar i L2/L3 (23 juni)

**Bugg:** Edge-knappen gick inte att klicka i L2-läge. Hovring över edge gav pool-globens interaktivitet istället.

**Rotorsak:** `#poolWrap` placeras i L2 via `pubXform(L2GEO.pool.x * bw2, ...)` och är 135×166px. `#edge` placeras vid `pubXform(0.94*bw2, 0.668*bh2)` — mitt inne i poolWraps area. `#edge` hade `z-index:5` medan poolWrap hade `z-index:4700`, men z-index hjälper inte när poolWrap absorberar alla pointer events geometriskt.

**Missvisande mellansteg:** Första försöket höjde `#edge` z-index till 4700 i L2/L3 — verkningslöst eftersom z-index inte spelar roll när ett syskon-element täcker positionen och tar events. Andra försöket flyttade edge-positionen till vänster om pool — visade sig vara fel UX-val.

**Rätt fix (tre ändringar):**
1. `#poolWrap` i L2: `pointer-events:none` — wrappern är transparent för musklick.
2. `#poolWrap #pool` och `#poolWrap #pname` i L2: `pointer-events:auto` — pool-globen och spelarnamnet behåller full interaktivitet.
3. `wheel`- och `contextmenu`-lyssnare flyttade från `$('#poolWrap')` till `$('#pool')` — scroll och högerklick på pool-globen fungerar som förut (de registrerades på wrappern men behövde följas med till den interaktiva barnen).

Edge-position i designspace (`0.94*bw2, 0.668*bh2`) oförändrad. `z-index:4700` för `#edge` i L2/L3 behålls som extra säkerhet (förhindrar eventuella framtida täckande element).

---

### Session 14 fortsättning – v1.62: Torpor/uncontrolled hover-bounce fix (lx/ly) (23 juni)

**Bugg:** Vampyr med fästa kort i torpor skiftade position vid hover (bounce-effekt).

**Rotorsak:** `restack(c)` anropades vid hover-expand och körde `place(c, c.tx, c.ty, ...)` — men `c.tx/c.ty` är **post-transform display-koordinater** (efter `pubXform`). `place()` applicerar `pubXform` igen → dubbel-transform → vampyren hoppade.

Föregående fix (v1.60) bytte från `c.x/c.y` till `c.tx/c.ty` vilket löste ready→ready-bounce men introducerade dubbel-transform-buggen för torpor i L2-läge.

**Fix:** `layoutZone('torpor/uncontrolled')` sparar nu `hx/hy` (pre-transform koordinater) i `c.lx/c.ly` direkt innan `place()`-anropet. `restack` använder `c.lx/c.ly` för icke-ready-zoner — samma pre-transform-koordinater som `layoutZone` skickade till `place()`, så `pubXform` appliceras exakt en gång.

```js
// I layoutZone:
c.lx=hx; c.ly=hy;   // pre-transform layout coords
place(c, hx, hy, ...);

// I restack:
const inReady = (c.zone === 'ready');
const bx = inReady ? c.x : (c.lx !== undefined ? c.lx : c.tx);
const by = inReady ? c.y : (c.ly !== undefined ? c.ly : c.ty);
```

Fallback `c.lx!==undefined ? c.lx : c.tx` skyddar mot gamla kort (laddade från autosave) som saknar `lx/ly`.

---

### Session 14 fortsättning – v1.63: Deck Lab bibliotekskort sorterade per typ (23 juni)

**Johans önskemål:** Bibliotekskortslistan i Deck Lab ska delas in per korttyp i VTES-ordning, med rubrik per sektion.

**Byggt:**

- **`.esubhead`** — ny CSS-klass: 9px Cinzel, `color:var(--bone2)`, subtil `border-bottom`, marginaler. Används som sektionsrubrik per typ.

- **`elistLibrarySections(m, bucket)`** — ny funktion som ersätter `elistSection('Library', ...)` i `renderEditor`. Grupperar med `handTypeTuple` (återanvänder exakt samma tupellogik som handsorteringen). Rubrik visar typnamn + antal aktiva kort `(N)`. Inom varje grupp: aktiva kort alfabetiskt, zeroed-kort alfabetiskt efter. Fallback till platt alfabetisk lista om `cardTypes===null`.

- `renderEditor` uppdaterad: `elistSection('Library',...)` → `elistLibrarySections(...)`.

---

### Session 14 fortsättning – v1.64: KRCG-typnamn korrigerade (23 juni)

**Diskussion:** Johan klargör att "Modifiers" och "Political" i Elysiums UI egentligen heter **"Action Modifier"** resp. **"Political Action"** i KRCG — de är enkla korttyper, inte kombinationer.

**Korrigerat:**

- `HAND_TYPE_ORDER` använder nu exakta KRCG-strängar som nycklar: `'political action':2`, `'action modifier':6`. Även `'conviction':99`, `'power':99`, `'event':99` tillagda explicit.

- `handTypeWords` förenklat till enkelt direktuppslag (ingen ord-splittning): `HAND_TYPE_ORDER[typeStr.toLowerCase().trim()]`.

- `TYPE_LABELS` i Deck Lab: `'Political'` → `'Political Action'`, `'Modifier'` → `'Action Modifier'`.

Sorteringsordning: Master → Action → Political Action → Ally → Retainer → Equipment → Action Modifier → Reaction → Combat → Other.

**Bakgrund om KRCG-typformatet:** KRCG:s officiella typlista (från OpenAPI-spec) är: `Action`, `Action Modifier`, `Ally`, `Combat`, `Conviction`, `Equipment`, `Event`, `Master`, `Political Action`, `Power`, `Reaction`, `Retainer`. Inga sammansatta typer via slash — multi-typ-kort har flera element i `card.types`-arrayen (`["Action", "Reaction"]`). `handTypeTuple` hanterar dessa som kombinationstuplar `[1,7]` och bildar egna kategorier.

---

### Session 14 fortsättning – v1.65: Hand-panelsortering fixad (23 juni)

**Bugg:** Sorteringen gällde bara `#handRow` (den öppna dock-panelen) men inte kortens fysiska placering i L2/L3.

**Rotorsak:** Två separata renderingsvägar: `renderHand()` sorterade en lokal `cards`-kopia → korrekt i `#handRow`. Men `layoutZone('hand')` itererade `state.zones.hand` direkt i insättningsordning → fel ordning på brädet.

**Fix:** En rad i `move()` direkt efter `state.zones[zone].push(c.id)`:
```js
if(zone==='hand') state.zones.hand.sort((a,b) =>
  handSortCmp(state.cards.get(a)||{name:'',kind:'lib'},
              state.cards.get(b)||{name:'',kind:'lib'}));
```
Arrayen sorteras in-place vid varje move till hand — täcker alla vägar: draw, fetch, "To hand" via meny, drag, återlämnat kort.

---

### Session 14 fortsättning – v1.66: Stack drag-and-drop (23 juni)

**Johans önskemål:** När baskortet dras ska fästa barn följa med som en enhet.

**Rotorsak:** `bindCard` pointermove-hanteraren hade explicit kommentar: `// Single-card drag is the unstack gesture` — drag av ensamt kort lossade alltid stacken via `releaseChildren(c)`.

**Byggt (tre delar):**

1. **`move()` fick `keepChildren`-flagga** — hoppar över `releaseChildren` om `opts.keepChildren` är satt.

2. **`dropCard` patchad** för alla COUNTER_ZONES-destinationer:
   - Ready: `keepChildren:true` + barnens kanoniska `x/y` uppdateras till `readyToCanon(X + CX*(k+1), Y - CY*(k+1))` relativt ny hostposition.
   - Torpor + uncontrolled: `keepChildren:true` — `layoutZone` renderar barnen ändå via `c.attached.forEach`.

3. **`bindCard` pointermove** — single-drag-grenen: om `c.attached.length > 0`, bygg `drag.group` med barnen (offset `k.tx-c.tx, k.ty-c.ty`) och sätt `drag.hostGroup=true` istället för `releaseChildren`. Barn i `drag.group` får `zi:4900+i`.

4. **`dropCard` "Send card" menyval** — nytt val "Detach all attached cards" i `cardMenu` för baskortet (`c.attached.length>0`). Kör `releaseChildren(c)` + sprider barnen (`+18px/+14px` per barn).

**EJ runtime-testat fullt.** Johan verifierar: (1) drag host med barn i ready → hela stacken följer; (2) drag till torpor → stacken med; (3) högerklick host → "Detach all attached cards" → alla barn lossnar och sprids.

---

### Session 14 fortsättning – v1.67: Baskortet överst vid stack-drag (23 juni)

**Bugg:** Vid drag av baskortet med fästa kort lade sig första barnet visuellt ovanpå baskortet.

**Rotorsak:** `.card.dragging { z-index: 5000 !important }` — `!important` i CSS-regeln slog igenom oavsett inline `style.zIndex`. Barnen fick `.dragging`-klassen via `m.c.el.classList.add('dragging')` i `pointermove`-loopen och hamnade på z-index 5000, över hosten.

**Fix:** `drag.hostGroup=true`-flaggan används nu i `pointermove`-loopen för att skippa `classList.add('dragging')` för barn i en host-drag. Hosten behåller `.dragging` och z-index 5000 exklusivt — garanterat överst. Barnens `m.zi=4900+i` appliceras fortfarande för intern ordning.

---

### Session 14 fortsättning – v1.68: #poolHelp återinförd vid pool-cirkeln (23 juni)

**Johans önskemål:** Frågetecken-ikonen som ska öppna controls-overlaten och kort hjälp — den har försvunnit från pool-zonen. Sätt tillbaka den på spegelvänd position mot Edge, vid pool-cirkelns nedre del.

**Undersökning:** `#helpToggle` (frågetecken-knapp) finns fortfarande men sitter i `#l1zoomWrap` uppe i hörnet (bredvid zoom-kontrollen) — inte vid pool. Den har alltså förflyttats dit någon gång under utbyggnaden. Nytt element `#poolHelp` skapas som ett parallellt pool-specifikt frågetecken-ankar som delar samma `#helpOverlay`.

**Implementerat:**

- **`#poolHelp` CSS** — 26×26px cirkulär knapp, `position:absolute; right:124px; bottom:26px` (speglar Edge som är `right:124px; bottom:122px` — samma hörisontella linje som pool-globens underkant, samma horisontella avstånd som Edge). `opacity:.7` i vila, full vid hover. Egna L2/L3-varianter (`z-index:4700`; L3: 22×22px).

- **HTML** — `<div id="poolHelp">?</div>` placerad omedelbart efter `#edge` i DOM-ordning. `data-tip="Controls & help"` ger tooltip via `cardTip`-systemet.

- **L2 columns-positionering** (`setCenterFrameA`, else-gren) — `pubXform(0.845*bw2, 0.915*bh2)` = nedre vänstra av pool-boxen, spegelvänd mot Edge i övre högra (`pubXform(0.94*bw2, 0.668*bh2)`). Skalas med `l2pub.s`.

- **L3-positionering** (`setCenterFrameA`, if-gren) — sitter 6px + 26px till höger om Edge i den smala strip ovanför spelplatsen (`pwRight+4+(26+6)` px).

- **clearL2-reset** — `poolHelp` tillagd i alla tre `['poolWrap','edge','poolHelp'].forEach(...)` reset-arrayer.

- **Click-handler** — separat IIFE efter helpToggle-IIFE. Klick på `#poolHelp` togglar `#helpOverlay` och synkar `.on`-klasserna på både `#helpToggle` och `#poolHelp`.

**EJ runtime-testat.** Kontrollera: (1) L1 — hjälpknappen syns nedre vänster om pool-globen, klick öppnar controls-overlaten; (2) L2 — knappen sitter vid pool-boxens nedre vänstra hörn, klick fungerar; (3) L3 — liten knapp till höger om Edge i stripsen; (4) `#helpToggle` i zoom-raden fungerar fortfarande oberoende.

---

### Session 14 fortsättning – v1.68: #poolHelp återinförd vid pool-globen (23 juni)

**Johans önskemål:** Frågetecken-ikonen som öppnar controls-overlaten hade försvunnit från pool-zonen. Sätt tillbaka den spegelvänd mot Edge i L2/L3-vyerna.

**Undersökning:** `#helpToggle` finns kvar men sitter i `#l1zoomWrap` (zoom-raden). Nytt element `#poolHelp` skapas som ett pool-specifikt ankar som delar samma `#helpOverlay`.

**Iterationer (4 finjusteringar):**
1. Första version: placerad nedre vänster i L2 — fel, Edge sitter höger.
2. Korrigerad: nedre höger, men fel y och x.
3. Spegelvänd vertikalt runt pool-boxens horisontella mittpunkt: `x=0.94*bw2`, `y=0.892*bh2`.
4. Flytt uppåt 60% av knappdiametern (19px): `y=0.861*bh2`. Tooltip döpt om till "Help".
5. Flytt 6px åt höger (kompenserar breddskillnad 32px Edge vs 26px poolHelp): `6/l2pub.s` offset i designrymden.

**Slutlig position L2 columns:** `pubXform(0.94*bw2 + 6/l2pub.s, 0.861*bh2)` — samma vertikala linje som Edge (`0.94*bw2`), 6px-kompensation för breddskillnad, y spegelvänd under pool-globens mitt med samma avstånd som Edge har ovanför.

**Implementerat:**
- `#poolHelp` CSS: `display:none` default, `display:grid` i `.l2mode` och `.l3mode`, `z-index:4700`, L3: 22×22px.
- HTML: `<div id="poolHelp" title="Help" data-tip="Help">?</div>` efter `#edge`.
- L1: dold.
- L2 columns: position via `pubXform`, skalas med `l2pub.s`.
- L3: 4px till vänster om pool-name-clustret (spegelvänd mot Edge till höger).
- clearL2-reset: `poolHelp` med i alla tre reset-arrayer.
- Click-IIFE: togglar `#helpOverlay`, synkar `.on` på både `#helpToggle` och `#poolHelp`.

---

### Session 14 fortsättning – v1.69: sfxSilent() — ljudtriggers stängs av vid vol=0 (23 juni)

**Johans önskemål:** När master volume eller en kanals individuella volym är 0, ska ljud-triggern hoppas över helt (ingen Web Audio-graph skapas) som prestandaoptimering.

**Implementerat:**

- **`sfxSilent(ch)`** — ny helper efter `sfxGain`. Returnerar `true` om `conv.sfxVol===0` (master) eller om kanalens individuella volym är `0`. Kollar `sfxIndiv[ch]` med samma fallback-logik som `sfxGain` (använder `chDef` från `SFX_CHANNELS` om inget individuellt värde finns).

- **Guards** lagda som första rad i alla 10 ljud-triggerfunktioner:
  - `bell()` → `sfxSilent('pass')`
  - `heartbeat()` → `sfxSilent('yourTurn')`
  - `sfxPlayCard()` → `sfxSilent('playCard')`
  - `sfxDiscipline()` → `sfxSilent('unlock')`
  - `sfxConclave()` → `sfxSilent('lock')`
  - `sfxFinalDeath()` → `sfxSilent('oust')`
  - `sfxWarded()` → `sfxSilent('logEvent')`
  - `sfxHoldOn()` → `sfxSilent('holdOn')`
  - `sfxSweep()` → master-only guard (ingen kanal; anropas av `sfxUnlock/Lock/Play` som inte har egna kanaler i SFX_CHANNELS)

Vid vol=0 returnerar funktionen innan `actx` skapas, `sfxMakeReverb` anropas, eller någon Web Audio-nod skapas.

---

### Session 14 fortsättning – v1.68–v1.71: Pool-zonen, Visit-overlay, Table-tabb, ljud och animationer (23 juni)

#### v1.68 – #poolHelp återinförd vid pool-globen
Frågetecken-knapp (26×26px cirkel) återinförd som syskon till `#edge`. Dold i L1 (`display:none`), visas i L2/L3. Positioneras via `setCenterFrameA`: L2 columns `pubXform(0.94*bw2 + 6/l2pub.s, 0.861*bh2)` (samma x-linje som Edge + 6px breddkompensation, y spegelvänd under pool-globens mitt). L3: 4px till vänster om pool-clustret. Delar `#helpOverlay` med `#helpToggle`. `data-tip="Help"`, inget `title`-attribut. Inkluderad i clearL2-reset-arrayer.

**Shuffle-animation stängd av:** `shuffleFx()` gjord till no-op med kommentaren "Animation disabled — pending redesign". CSS-klasserna kvar för framtida redesign.

#### v1.69 – sfxSilent(): ljudtriggers stängs av vid vol=0
Ny `sfxSilent(ch)` helper efter `sfxGain`: returnerar `true` om `conv.sfxVol===0` (master) eller kanalens individuella volym är 0. Guards lagda som första rad i alla 10 sfx-triggerfunktioner (`bell`, `heartbeat`, `sfxSweep`, `sfxPlayCard`, `sfxDiscipline`, `sfxConclave`, `sfxFinalDeath`, `sfxWarded`, `sfxHoldOn`). Stoppar `actx`-skapande och hela Web Audio-grafen vid vol=0.

#### v1.70 – Unlock-knappen pulserar med "Your turn!"
`.phase.yt-pulse` kör `ytPulse` + `ytPulseOutline` (0.9s, synkat med texten). `startYourTurn` lägger `.yt-pulse` på `document.querySelector('#phases .phase:not(.pass)')` om `hx('on')`. `endYourTurn` tar bort den. Outline: `box-shadow: 0 0 0 2px #dcb872` i peaken — samma neutrala vitguldiga färg som kortmarkeringen.

#### v1.70 – Home-knappen i L2 Visit till höger
`#rvBack { position:absolute; right:16px; top:50%; transform:translateY(-50%) }` — tas ur flexflödet, klistras alltid till höger kant oavsett Played-tabb.

#### v1.70 – rvTitle: spelarnamn i färg + stolsikon
`renderRemote` byter från `textContent` till `innerHTML`: spelarnamnet i `seatColor(seat).hex`, stolsikon 🪑 i samma färg, sätesnummer i fetstil. Offline-text nedtonad med `opacity:.6`. Unicode-fälla: 🪑 = `\U0001FA91` (inte `\U0001F6CB` = 🛋️ soffa).

#### v1.70 – Hand-zon fast bredd i L2/L3-dock
`#board.l2mode #z-hand, #board.l3mode #z-hand { right:auto; width:440px }` — hand-zonen expanderar inte längre när vänsterpanelen fälls in/ut.

#### v1.71 – #pseat: stolsikon + sätesnummer vid pool-globen
`#pseat` placerat som syskon till `#edge`/`#poolHelp` (utanför `#poolWrap`). Döljs med `body.invisit #pseat { display:none !important }` vid besök. Positioneras i `setCenterFrameA` L2 columns: `pubXform(0.845*bw2, 0.668*bh2)` med offset `+40px` höger och `+6px` ned (empiriskt finjusterat). `transformOrigin:'100% 0'` så elementet ankras i högra kanten och växer vänsterut. `setPname()` sätter `ps.textContent = '🪑'+sx` (inget mellanslag) i spelarfärg. Font: 15px Cinzel.

**Edge dold vid besök:** `body.invisit #edge { display:none !important }`.

#### v1.71 – Table-tabb: stol+sätesnummer ny kolumn
Grid utökad från 7 till 8 kolumner: `14px 1fr 28px 30px 34px 34px 30px auto`. Ny kolumn efter namn: `.sseatcol` med `🪑N` i `seatColor(o.seat).hex`. Header: `🪑`-ikon som kolumnetikett. Rader utan seat får `<span></span>` som platshållare.

---

### Session 15 – v1.72: Clan symbol system (23 juni)

**Johans önskemål:** Klansymboler från KRCG. Auto-detektera klan baserat på majoriteten av vampyrer i Ready. Manuellt val via pool-högerklicksmenyn (Choose clan…). Klansymbol visas i pool-globen (under siffran), prefix till spelarnamn i ALLA vyer, ny kolumn i Table-tabben.

**KRCG-URL-format:** `https://static.krcg.org/clan/<klannamn_lowercase_bokstäver>.svg` — t.ex. `ventrue.svg`, `tremere.svg`. Normalisering via `normClan()`: lowercase, strip icke-bokstäver.

**Implementerat:**

**Helperfunktioner (efter imgUrl):**
- `normClan(clan)` — normaliserar klannamn för URL
- `clanSymUrl(clan)` — returnerar KRCG SVG-URL
- `clanSymEl(clan, size)` — skapar `<img class="clansym">` med error-handler (`display:none` vid 404)
- `activeClan()` — returnerar `chosenClan || myClan || null`
- `detectClan()` — räknar majoritetsklanen bland ready crypt-kort via `cardInfo.clans` (split på mellanslag, tar första klanen per vampyr). Tie-break: lexikografisk ordning.
- `updateMyClan()` — kör `detectClan()`, uppdaterar `state.myClan`, kallar `refreshClanDisplay()`, returnerar om klanen ändrades.
- `refreshClanDisplay()` — uppdaterar pool-glob `.clansym-pool` + `#pname`-prefix + `renderStats()`.

**State:** `state.myClan` (auto-detekterad) + `state.chosenClan` (manuellt). Båda serialiserade i `serializeGame`/`restoreGame`. `clearTable` nollställer båda.

**Hooks:**
- `tagPlayed()` — om `c.kind==='crypt'`: kör `updateMyClan()`, loggar klanändring.
- `move()` — om `from==='ready' || zone==='ready'` och `c.kind==='crypt'`: samma.

**buildPub:** `clan: activeClan()||undefined` — motståndarnas klan propagerar via nätverket.

**pool-högerklick:** `clanChoiceItems()` bygger submeny dynamiskt (läser `seen`-map från ready-vampyrer). Markerar aktiv klan med ✓. "Auto-detect" längst ned. Lagd i `selfPoolMenuItems()` som `⚝ Choose clan…` med `sub:clanChoiceItems()`. Ikon: ☽ (U+269D, femspetsig stjärna).

**Render-ställen:**
1. **Pool-glob:** `.clansym-pool` absolutpositionerad (bottom:10%, left:50%, translateX(-50%), width:28%, opacity:.55) — under siffran, centrerad, halvtransparent.
2. **#pname:** `renderName()` omskriven för att återinjicera `<img class="clansym" size=14>` som `firstChild` efter `textContent`-wipe. `refreshClanDisplay()` gör samma sak.
3. **rvTitle (Visit-vy):** `renderRemote()` prefixar med `<img>` 16×16px, placerad före 👁-ikonen.
4. **L2 collapsed panels:** `buildL2mat` collapsed-gren — 13×13px `<img>` före `.l2cap`-texten.
5. **L2 expanded header:** `buildL2mat` expanded `hd.innerHTML` — 13×13px `<img>` mellan `l2role`-span och `pp.name`.
6. **L3 mname-div:** 12×12px `<img>` före `pp.name`.
7. **Turn notice (#deckName):** `updateTurnText()` — 13×13px `<img>` (`_tpub.clan` → opponent's pub) före `nm`'s turn.
8. **Table-tabb:** Ny kolumn (`.sclancel`, 18px) med 16×16px `<img>`. Grid utökad från `14px 1fr 28px 30px 34px 34px 30px auto` till `14px 1fr 28px 18px 30px 34px 34px 30px auto`. Header: ☽. Eget grid-template-columns per rad och header (inline style).

**cardFx 'rise':** Om !remote och vampyrens klan är känd via `activeClan()`, läggs en `.cfxsub`-div till med 22×22px klansymbol + klannamn som text.

**CSS:** `.clansym` (inline-block, 1em×1em, vertical-align:middle, margin-right:0.18em, opacity:.82). `#pool .clansym-pool` (absolute, bottom:10%, left:50%, translateX(-50%), 28%×28%, opacity:.55, pointer-events:none). `#pname .clansym` (14px×14px, margin-right:0).

**Fallback:** Alla `<img onerror>`-handlers sätter `display:none` vid 404 — vet ännu inte exakt vilka klan-slugs KRCG exponerar (t.ex. "Assamite" vs "Banu Haqim" eller liknande). Inget kraschar.

**EJ runtime-testat.** Testa:
1. Spelaren utan kort → ingen klansymbol.
2. Spela ut Tremere-vampyr → klansymbol Tremere dyker upp i pool-globen och #pname + logg "Clan affiliation: Tremere".
3. Spela ut Ventrue-vampyr med Tremere kvar → om Ventrue nu är i majoritet → symbol byter, ny loggad.
4. Högerklick på pool → "⚝ Choose clan…" → undermeny med klaner + Auto-detect.
5. Välj klan manuellt → ✓ markeras, pool-glob uppdateras, logg.
6. Välj Auto-detect → manuellt val rensas.
7. Table-tabben: ny ☽-kolumn, symbol visas för alla spelare med känd klan.
8. L2-kolumnvy: prey/predator header visar symbol.
9. Visit-vy: rvTitle visar symbol för besökt spelare.
10. L3: mname-div visar symbol.
11. Turn notice: symbol vid motståndarens tur.
12. cardFx rise: `.cfxsub` med klansymbol + klannamn.
13. Spara/ladda game → klan-state bevaras.

---

### Session 15 fortsättning – v1.73: KRCG SVG-sökväg korrigerad (23 juni)

**Faktum från KRCG:** Korrekt basväg är `/svg/clan/<slug>.svg` och `/svg/path/<slug>.svg` (inte `/clan/`). Paths-filer: `caine.svg`, `cathari.svg`, `death.svg`, `power.svg`.

**Namnformat bekräftat:** Allt lowercase, strip icke-bokstäver — matchar `normClan()` exakt. Ex: "Banu Haqim" → `banuhaqim`, "Daughters of Cacophony" → `daughtersofcacophony`, "Blood Brother" → `bloodbrother` (singular).

**Implementerat:** `CLAN_PATH_SLUGS = new Set(['caine','cathari','death','power'])`. `clanSymUrl()` kollar setet och väljer rätt subkatalog. VERSION → 1.73.

---

### Session 15 fortsättning – v1.74: KRCG clan-data djupgranskad och fixad (23 juni)

**Bakgrund:** Johan bad om en djupdykning i KRCG-integrationen. Hämtade KRCG:s OpenAPI-spec (`api.krcg.org/openapi.yaml`) och verifierade mot deras egen deck-export. Två allvarliga buggar hittades.

**Verifierat faktum (KRCG `clans`-fält):** Fältet är en array av strängar med **gamla VEKN-namn**, inte V5-namn. Bevis: KRCG:s egen convert-output i OpenAPI-specen visar `Badr al-Budur 5 OBF cel dom qui Assamite:2`, `Count Ormonde 5 ... Follower of Set:2`, `Samson 2 dom Ventrue antitribu:2`. DriveThruCards (officiell säljare) listar Nakhthorheb som "Follower of Set". Så clans = `["Assamite"]`, `["Follower of Set"]`, `["Tremere antitribu"]` osv.

**Bugg 1 — split-på-whitespace förstörde flerordsklaner:** `detectClan` och `clanChoiceItems` gjorde `info.clans.trim().split(/\s+/)[0]`, vilket bara tog första ordet:
- "Follower of Set" → "Follower" (404)
- "Tremere antitribu" → "Tremere" (fel symbol — tappar antitribu-distinktionen)
- "True Brujah" → "True" (404)
- Drabbar ALLA antitribu-klaner + alla flerordsnamn.

**Fix bugg 1:** Bevara arrayen. `loadCardDB` lagrar nu `clansArr: card.clans.slice()` i meta (utöver `clans`-strängen som behålls för `cardTags`-bakåtkompatibilitet). `detectClan` och `clanChoiceItems` använder `info.clansArr[0]`.

**Bugg 2 — 7 klaner har SVG-filnamn som inte matchar normaliserade VEKN-namn:** KRCG:s clans-fält och SVG-mapp är inte synkade:
| clans-värde | rätt SVG |
|---|---|
| Assamite | banuhaqim (V5) |
| Follower of Set | ministry (V5) |
| Abomination | abominations (plural) |
| Ahrimane | ahrimanes (plural) |
| Gargoyle | gargoyles (plural) |
| Daughter of Cacophony | daughtersofcacophony (plural) |
| Harbinger of Skulls | harbingersofskulls (plural) |

**Fix bugg 2:** `CLAN_SVG_MAP` lookup-tabell (normaliserat VEKN-namn → SVG-slug) i `clanSymUrl`. De ~40 andra klanerna matchar `normClan()` direkt. `onerror→display:none` kvar som sista skyddsnät.

**Verifiering:** Isolerat Node-test (`test_clan.js`) testade alla 46 KRCG-klaner mot den faktiska SVG-fillistan Johan tillhandahöll → **46/46 matchar, 0 missar**. Majoritetsräkning testad: `[Tremere,Tremere,Ventrue]`→Tremere, `[Ventrue,Tremere,Tremere,Ventrue,Ventrue]`→Ventrue, tie→lexikografiskt först, `[]`→null. Alla korrekta.

**Bekräftade URL-strukturen:** `https://static.krcg.org/svg/clan/<slug>.svg` (rätt basväg är `/svg/clan/`, fixades i v1.73).

**Paths-noten:** KRCG:s `clans`-fält innehåller ALDRIG paths (Caine/Cathari/Death/Power) — endast klaner och Imbued-creeds (Avenger, Defender, Innocent, Judge, Martyr, Redeemer, Visionary, som alla finns i clan-enumen och har SVG:er). `CLAN_PATH_SLUGS` är därför vilande död kod (ofarlig). Imbued-spelare får dock korrekt creed-symbol. Detta innebär att "Choose clan…"-menyn i praktiken bara visar klaner/creeds, aldrig paths — vilket är korrekt givet KRCG:s datamodell.

**EJ runtime-testat live.** Logiken är dock enhetstestad isolerat. Testa: spela ut en Banu Haqim/Assamite-vampyr → ska visa banuhaqim-symbolen (inte 404). Spela Tzimisce antitribu → tremereantitribu... nej, Tzimisce har ingen antitribu; testa Brujah antitribu → brujahantitribu-symbolen. Setite → ministry-symbolen.

---

### Session 15 fortsättning – v1.75: Pool-glob klansymbol som vattenstämpel (23 juni)

**Johans önskemål:** Klansymbolen i pool-globen ska fylla globen som en bakgrundseffekt ovanpå det röda lagret, med poolsiffran ovanpå symbolen (inte en liten ikon under siffran som i v1.72).

**Implementerat (ren CSS, ingen JS-ändring):**
- `.clansym-pool`: från `bottom:10%; width:28%; opacity:.55` (liten ikon) till `top:50%; left:50%; translate(-50%,-50%); width:90%; height:90%; opacity:.5; z-index:1; clip-path:circle(50%)` (stor centrerad vattenstämpel).
- `.poolnum`: `position:relative; z-index:2` så siffran ligger ovanpå symbolen (annars hamnar den bakom — `.clansym-pool` appendas sist i DOM).
- `.pbtn`: `z-index:4` så +/−-knapparna garanterat ligger överst och klickbara.

**Lagerordning:** röd radial-gradient (bas) → klansymbol (z1) → poolsiffra (z2) → +/−-knappar (z4).

**`clip-path:circle(50%)` istället för `overflow:hidden`:** +/−-knapparna sitter på `left:-8px`/`right:-8px` (utanför 96px-globen), så `overflow:hidden` på `#pool` skulle klippa dem. Symbolen klipps istället till en cirkel på elementnivå — fyrkantiga SVG-hörn sticker inte ut över globkanten, knapparna påverkas inte.

**Gäller `#pool` (din egen live-glob i L1/L2/L3).** Motståndarnas glober (renderBoard, rad ~8050) har inte vattenstämpeln — de har klansymbol vid namnet istället (mname/l2hd/rvTitle). Kan läggas till på motståndarglober om Johan vill ha det konsekvent.

**EJ runtime-testat live.** Möjliga justeringar efter hur det ser ut: `opacity` (.5 nu), symbolstorlek (90% nu), och ev. färgfilter om mörk linjekonst försvinner mot den mörkröda globen (t.ex. `filter:brightness(0) invert(1)` för vit vattenstämpel, men det raderar flerfärgade symbolers detaljer — avvaktar Johans bedömning).

---

### Session 15 fortsättning – v1.76: Klansymbol-vattenstämpel på motståndarnas pool-glober (23 juni)

**Johans önskemål:** Samma vattenstämpel-effekt som på egen glob (v1.75), men på motståndarnas pool-glober i Visit-vyn och L3 Overview.

**Källa:** `pub.clan` (serialiseras i `buildPub` sedan v1.72) — fungerar både online och hotseat.

**Implementerat i den delade mat-renderaren (`renderBoard`):**
- **`.clansym-pool` CSS generaliserad** från `#pool .clansym-pool` till `.clansym-pool` (gäller nu både egen #pool och motståndarglober). Oförändrade egenskaper.
- **L2-kolumner + Visit (`g`-globen, rad ~8051):** `g.innerHTML` byggs nu med poolnum-span + (om `pub.clan`) `<img class="clansym-pool">`. Samma clip-path:circle + z-index-lager som egen glob. Siffran ovanpå, symbolen som vattenstämpel.
- **L3 Overview (`pv`, rad ~8045):** L3 har ingen röd motståndarglob — bara en siffra. Klansymbolen placeras därför i pool-zonen (`cz.pl`) bakom siffran: centrerad, `min(zonW,zonH)*0.8`, `opacity:.4`, `pointer-events:none`. `pv` fick `z-index:1` så siffran ligger ovanpå symbolen.

**Designnot:** I L2/Visit fyller symbolen den röda globen (samma look som egen). I L3 finns ingen röd motståndarglob i nuvarande design, så symbolen ligger på felten i pool-zonen istället — närmaste motsvarighet. Att ge L3-motståndare en riktig röd glob vore en separat, större L3-designändring.

**renderFull (L1-base Visit) berörs inte** — den visar motståndarpool som text (rvStats), inte som glob.

**EJ runtime-testat live.** Testa: (1) Visit en motståndare i Normal/L2-spel → deras glob ska ha klan-vattenstämpel. (2) L2-kolumnvy (prey/predator utfällda) → deras glober ska ha vattenstämpel. (3) L3 Overview → klansymbol i motståndarnas pool-zon bakom siffran. Kontrast i L3 (.4 opacity mot felt) kan behöva justeras — säg till.

---

### Session 15 fortsättning – v1.77: Publik klan-loggning med spelarnamn (23 juni)

**Johans önskemål:** Klan-loggen ska vara publik med spelarnamn: "Clan affiliation for <player> changed to <clan/path>".

**Insikt om loggsystemet:** `log(msg)` utan `localOnly`-flaggan relär redan via `mpRelay` (`{t:'log', html}`) i online och syns i den delade hotseat-loggen. Så klan-loggen var redan publik — den saknade bara spelarnamnet. Vid mottagning i online prefixar servern med `[avsändarnamn]` (m.who) + `localOnly:true` (ingen loop).

**Namnkälla:** `clanLogName()` = `net.you || state.playerName || 'Player'`. `net.you` täcker online (ditt namn) och hotseat (aktivt säte, sätts i `setActivePlayer`); `state.playerName` täcker solo (`net.you` är null där). Viktigt: `state.playerName` uppdateras INTE vid hotseat-byte, så `net.you` måste komma först.

**Implementerat:**
- `clanLogName()` helper efter `activeClan()`.
- Fyra loggställen uppdaterade till "Clan affiliation for <b>name</b> changed to <b>clan</b>.":
  - `move()` (vampyr in/ur ready)
  - `tagPlayed()` (vampyr spelas ut)
  - `clanChoiceItems` manuellt val
  - `clanChoiceItems` auto-detect ("set to auto-detect — now <clan>" om en klan detekteras)
- **`scheduleSave()` tillagd i de två manuella val-handlers:** manuellt klanval anropade bara `refreshClanDisplay()` (ingen board-push), så i online uppdaterades inte motståndarnas klansymbol förrän nästa board-ändring. `scheduleSave()` triggar både lokal save (chosenClan serialiseras) och `schedulePush()`. Auto-detektion via spel/flytt triggar redan push.

**Känd liten redundans:** I online ser mottagaren serverns `[namn]`-prefix PLUS "for <namn>" i meddelandet (t.ex. "[Anna] Clan affiliation for Anna changed to Tremere"). Acceptabelt och extra tydligt; händelsen är sällsynt. Kan justeras om det stör.

**EJ runtime-testat live.** Testa: (1) hotseat — spela vampyr, loggen ska visa aktivt sätes namn; (2) online — motspelare ska se loggen + symbol uppdateras vid både auto-detektion och manuellt val.

---

### Paths — TODO-notering (för framtida path-stöd)

**Johans instruktion:** När vi hanterar paths ska vi läsa Path-fältet utöver Clans-fältet från KRCG.

**Ärlig flagga från KRCG-granskningen:** I KRCG:s OpenAPI card-schema (api.krcg.org, v3.4) finns INGET separat path-fält på kort, och `card_search` har ingen "path"-dimension (bara clan, discipline, sect, title, trait, etc.). Paths i VTES-kortspelet är egna **library master-kort** ("The Path of Caine", "The Path of Cathari", "The Path of Death and the Soul", "The Path of Power and the Inner Voice") — de fyra som har SVG:er under `/svg/path/`. En vampyr har alltså ingen path-attribut i KRCG-datan; paths representeras av master-kort i spel.

**Konsekvens:** Path-"tillhörighet" kan inte auto-detekteras från vampyrernas clans-fält (som klan görs). Om path ska bli en spelartillhörighet behöver vi en annan källa — t.ex. detektera om ett path-master-kort ligger i spel, eller låta spelaren välja path manuellt. **Att reda ut när vi faktiskt bygger path-stöd.** `CLAN_PATH_SLUGS` + `/svg/path/`-routningen i `clanSymUrl` finns redan på plats för att rendera path-symbolen när källan är bestämd.

---

### Session 15 fortsättning – v1.78: Klansymbol-badge (mall + Table-tabb + animationer) (23 juni)

Klansymbolerna låg mörka mot mörk bakgrund i Table-tabben och syntes inte. Lösning: en benvit fylld cirkel bakom ikonen. Detta växte till en återanvändbar badge-mall.

**Återanvändbar mall (det viktiga):**
- **CSS-klass `.clanbadge`** (definierad nära `.srow`-reglerna): skalbar via CSS-variabeln `--cb-size` (default 20px). Cirkel: `width/height:var(--cb-size)`, `border-radius:50%`, `background:#d9cfb6` (= `--bone`), `box-shadow:0 1px 3px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,0,0,.15)` (yttre droppskugga + subtil inre kantlinje för djup). Ikonen (`.clanbadge img`) är `calc(var(--cb-size)*0.80)` stor.
- **JS-funktion `clanSymBadge(clan, sizePx)`** (efter `clanSymEl`): returnerar ett `<span class="clanbadge">` med klanikon inuti. `size` sätter `--cb-size` via inline-style. `clan=null` → osynlig platshållare (`visibility:hidden`) som behåller bredden. Serialiseras med `.outerHTML` när det ska in i en innerHTML-sträng.
- **Användning på nya ställen:** anropa `clanSymBadge(clan, size)`, eller override per kontext i CSS: `.minkontext .clanbadge { --cb-size: 28px }`.

**Tillämpningar denna session:**
- **Table-tabben (`statRow`):** ersatte den tidigare hårdkodade `.sclancel`-spanen med `clanSymBadge(_clanForCol, 20)` via `.outerHTML` i `d.innerHTML`-strängen (behåller grid-kolumnordningen). `.sclancel`-CSS-regeln borttagen (redundant).
- **cardFx-captions (alla klonanimationer):** ny `_whoB` = `_who` + `clanSymBadge(activeClan(),16).outerHTML` (16px, `margin-left:2px`, ingen space). Bytte `_who` → `_whoB` i alla sex `cap.innerHTML`-rader: plays (utan vampyr-subjekt), plays (cLabel-fallback), brings into play (rise), reveals/conceals (flip), revealed to, och lock/unlock/move-verb. Badgen sitter direkt efter spelarnamnet. Den separata klan-flash-raden (`cfxsub`) under rise använder nu också `clanSymBadge(_riClan,22)`.

**Offset-lärdom (viktig för mallen):** Första versionen hade proportionell ikon-offset (`margin-left:calc(var(--cb-size)*0.05)`). Det blev för litet vid mindre storlekar (5% av 16px = 0.8px) och symbolen drogs åt vänster. Fix: **absolut offset `margin-left:2px; margin-top:1px`** som fungerar lika bra för alla badge-storlekar (16/20/22px).

**Version:** Klient `VERSION` → **1.78**. Rent klientsidigt (CSS/JS); servern orörd. OBS: server-VERSION är `1.6` och frikopplad från klient-VERSION — klienten skickar `v:VERSION` vid join och servern jämför mot sin egen 1.6, men online testas sällan (hotseat är primär). Klientsidiga bumpar kräver ingen server-bump.

**EJ runtime-testat live** (men syntax-OK). Testa: badge syns benvit i Table-tabben och efter spelarnamn i play/rise/flip/lock-animationer, korrekt centrerad i cirkeln.

---

### Paths-utredning – SLUTFÖRD (var TODO ovan) (23 juni)

Grävde till botten i KRCG:s datamodell för att avgöra om path kan knytas till kortdata. **Slutsats: nej.**

**Metod:** Hämtade faktisk `static.krcg.org/data/vtes.json` (102 vampyrobjekt granskade) + verifierade kortet **Aaradhya, The Callous Tyrant** (id 201733) specifikt fält för fält.

**Aaradhya som dokumenterat exempel — alla fält:** `id`, `_name`, `name`, `printed_name`, `url`, `types:["Vampire"]`, `clans:["Ventrue"]`, `capacity:10`, `disciplines:["ANI","DOM","FOR","POT","PRE"]`, `card_text` (börjar "Sabbat cardinal:"), `title:"Cardinal"`, `group:"6"`, `_set`, `sets`, `ordered_sets`, `scans`, `artists`, `legality`, `name_variants`, `rulings`. **Inget `path`-fält.**

**Var "Path" faktiskt finns:** Endast i `sets["Sabbat V5"][0].precon` = `"Path of Power and the Inner Voice"` — alltså namnet på den **förbyggda SV5-leken** vampyren trycktes i, inte ett attribut på vampyren. De fyra SV5-path-deckarna heter "Path of Caine/Cathari/Death/Power and the Inner Voice" och motsvarar exakt path-SVG:erna (caine/cathari/death/power). Detta var vad Johan mindes från en tidigare genomgång — korrekt observation, men det är ett utgåve-/deck-attribut, inte ett kortattribut.

**Bonus-fynd:** Även **sect** (Camarilla/Sabbat/Independent/Anarch/Laibon) är INTE strukturerad data i KRCG — den står inbakad i `card_text`. De enda strukturerade identitetsfälten är `clans`, `title`, `disciplines`, `capacity`, `group`.

**Konsekvens (bekräftad):** Path-tillhörighet kan inte auto-detekteras från kortdata som klan görs (majoritet av `clansArr[0]`). `precon`-strängen är opålitlig som källa (reprints utan path-namn; bara SV5 har det). **Om path-stöd ska byggas är den rena vägen manuellt path-val i `⚝ Choose clan…`-menyn, sida vid sida med de fyra paths** — symbol-routningen (`/svg/path/` i `clanSymUrl` + `CLAN_PATH_SLUGS`) finns redan. Johan klurar vidare på om/hur han vill ha det; ingen implementation gjord.


---

### Session 15 fortsättning – v1.79: VTES-grundsymbolen vektoriserad inline (23 juni)

Johan laddade upp `vtessymbol.png` (2400×2400, svart triskelion på transparent bakgrund). Vektoriserad i sandlådan med cv2: `findContours(RETR_CCOMP)` (ytter- + innerkonturer) + `approxPolyDP(eps 0.0015)` + `fill-rule="evenodd"`. Raka linjer valdes framför Bézier-kurvor eftersom kurvanpassning rundade av de skarpa spetsarna. Resultat: 97.4% IoU mot originalet, ~3KB path.

- **`VTES_SYMBOL_PATH`** — konstant med path-datan (viewBox `0 0 1000 1000`), rad ~1795.
- **`vtesSymbol(opts)`** — helper efter `clanSymBadge`. `opts`: `size` (default 24), `fill` (default `currentColor`), `opacity`, `cls`, `title`. Returnerar en `<svg class="vtesmark">`-sträng med `fill-rule="evenodd"`. CSS `.vtesmark{display:inline-block; vertical-align:middle; flex:0 0 auto}`.
- Täcks av Dark Pack-licensen. Renderar fint i guld/ben/vattenstämpel mot felt. Återanvänds som hjärtat i Edge-token (v1.82).

**Version:** Klient → **1.79**. Rent klientsidigt; servern orörd.

---

### Session 15 fortsättning – v1.80→v1.81: Edge-token, två övergivna ansatser (23 juni)

Målet: visa The Edge som en visuell token i Ready-zonen. Två ansatser testades och **revererades båda** — dokumenterade här som lärdom.

**v1.80 – fast element.** En `#edgeToken`-div fäst mot brädet med `right%/bottom%`. Johan testade och påpekade korrekt att en fäst token "vandrar" med brädkanten när paneler fälls in/ut — den sitter inte på mattan som ett kort. Övergiven.

**v1.81 – Edge som riktigt kort (`kind:'edge'`).** Gjorde Edge till ett `state.cards`-objekt för att ärva drag/`place`/skalning gratis (gren i `makeCard`, CSS `.card.kedge`, exkluderad från serialisering/`buildPub`, `ensureEdge`/`dropEdge`). Detta **bröt hela korthanteringen**: inga klonanimationer vid kortspel, dragna kort hoppade långt under muspekaren, och kort kunde placeras var som helst (zon-snäpp borta). Edge själv gick dessutom "segt" att dra (ärvde kortens transform-`transition`).

**Revert.** Johan ville revertera och bygga Edge som egen typ. Hela Edge-token-arbetet (v1.80 + v1.81) revererades till rena v1.79 via ett 17-stegs revert-skript (alla med `assert count==1`). Lärdom: patch-skriptens write-after-loop gör att en assert-fail lämnar filen orörd → säker revert.

---

### Session 15 fortsättning – v1.82: Token-familj med Edge som första medlem (23 juni)

Edge byggdes om som en **fristående Token-familj** som aldrig rör kort-modellen. Detta löste både placerings-/skalningskravet (samma som kort i alla vyer) och höll kort-pipelinen orörd.

**Token-systemet (det viktiga, placerat efter Edge-funktionerna ~rad 5343):**
- **`TOKEN_DEFS`** — registry; varje typ deklarerar `label`, `size`, `svg(sz)`, `menu(tok)`. Edge är första medlemmen.
- **`tokens`** — `Map` (`id → {id,type,x,y,z,tx,ty,el}`), **skild från `state.cards`/`state.zones`**. `x/y` kanoniska brädkoordinater som ready-kort.
- **`makeToken(type,id)` / `removeToken(id)`** — skapa/ta bort token-element (`<div class="token tok-TYPE">`).
- **`placeToken(tok)`** — positionerar; lånar `place()`s skalmatematik (`if(l2pub.on){ pubXform }` + `cardTransform(x,y,0,s)`). rot=0 → translate+scale från origin, så token skalas rätt i L2/L3 trots egen (icke-CW) storlek.
- **`layoutTokens()`** — placerar om alla tokens; **anropas i `layout()`** efter `renderPhaseCounts`.
- **`bindTokenDrag(el,tok)`** — egen drag som kopierar `bindCard`s pointermove-matematik (`f`-skalfaktor, `ox/oy`) men HOPPAR ÖVER zon-/`move`/`dropCard`-logiken (kräver `state.zones`). Drop lagrar kanoniskt via `pubInv` + **anropar `placeToken(tok)`** (fixar drag-hopp).
- **`tokenMenu(tok,x,y)`** → `showMenu(def.menu(tok), x, y)` (befintligt menysystem, items `{label, fn}`).

**Edge-medlemmen:** `ensureEdgeToken()` (skapar `edge`-token i Ready nedre höger via `zoneRect('ready')`→`pubInv`, guard `conv.edgeToken`), `removeEdgeToken()`, `burnEdge()` (sätter `state.edge=false`, tar bort token, loggar "<namn> burned the Edge."). Hookad i `toggleEdge` (skapa/ta bort), `restoreGame` (återskapa från `state.edge`), `clearTable` (rensas med korten), och `convEdgeToken`-settingen.

**Utseende (efter Johans finjustering):** uppåtpekande **fylld triangel** — sten-gradient (`#54545c→#3c3c43→#29292f`), **mörk fasad-skuggad kant** (`#1f1f26`, ingen guldram), ljusgrå inre bevel-highlight-polygon, två svaga koncentriska mönstertrianglar, och **benvit VTES-symbol** centrerad över den inre mönstertriangeln (`translate(30,40) scale(0.04)`). `size:100` (~dubbelt). CSS `.token`: `will-change:transform` + drop-shadow, **ingen transition** (omedelbart drag).

**Drag-bugg fixad:** muspekaren "flög iväg" vid upprepade Edge-drag (men inte vid växling kort↔Edge). Orsak: `tok.tx/ty` (display-pos som greppet räknas mot) fräschades bara av `layout`, inte av dragget; pointerup satte bara `tok.x/y`. Fix: `placeToken(tok)` i pointerup.

**Setting:** "Show The Edge as a felt token" (`conv.edgeToken`, default på).

**Version:** Klient → **1.82**. Rent klientsidigt; servern orörd.

**Status:** Johan runtime-testade i hotseat L2 Home — token syns, dras omedelbart, högerklick → Burn the Edge fungerar, och korthanteringen är helt opåverkad. Godkänt ("Chef's kiss").

**Kvar (nästa steg):** (a) rendering på motståndarbräden (L2 Visit/L2-kolumner/L3 via pub — token är lokal nu), (b) position-persistens (token återskapas på default-hörn vid hotseat-byte/load), (c) exklusivitet + online-relä av burn/release (att ta Edge får andra att tappa den).
---

### Session 15 fortsättning – v1.83: Give control… → spelarlista-submeny (23 juni)

`Give control…` på brädes-kort använde `prompt()` för textinmatning. Ersatt med dynamisk undermeny.

**Implementation (rad ~3489, `cardMenu`):**
- `_gcOthers` = `net.roster` filtrerat på `q.name !== net.you && !q.out && !q.vacant`.
- Om `c.controller` satt: `↩ Return control to me`-post överst + separator (om det finns andra spelare).
- En menypost per spelare ur `_gcOthers`; klick sätter `c.controller = q.name`, anropar `scheduleSave()` + loggar.
- Return-grenen loggar med `net.you || state.playerName` (korrekt i alla transport-lägen).
- Om `_gcSub` är tom (solo, ingen roster): leaf-item med `toast('No other players at the table.')`.
- `c.el.title = cardTitle(c)` anropas i båda grenarna (uppdaterar hover-tooltip).

**Version:** Klient → **1.83**. Rent klientsidigt; servern orörd.

**EJ runtime-testat.** Testa: hotseat med 2+ spelare → högerklicka brädes-kort → `Give control…` visar submeny med andra spelares namn; klicka ett namn → loggas + controller sätts. Om controller redan finns → `↩ Return control` syns överst. Solo-läge → `Give control…` visar toast.
---

### Session 15 fortsättning – v1.84: "On other boards"-sektionen borttagen (23 juni)

Table-tabben (högerpanelen i L2 Home/Visit och L3) hade ett nedre avsnitt "On other boards" med en textlista över kort i ready-zonen på varje motståndarbrädé (rad för rad med ägarprick). Avsnittet fyllde ingen funktion i nuläget och togs bort.

**Borttaget:**
- Funktionen `renderOtherBoards(host)` (~23 rader, rad ~2573) — hela blocket raderat.
- Anropet `renderOtherBoards(host)` i `renderStats()` (rad ~5811) — raderat.
- CSS-reglerna `.obsec`, `.obhead`, `.obrow`, `.obdot`, `.obatt` (5 rader, rad 433–437) — raderade.

**Version:** Klient → **1.84**. Rent klientsidigt; servern orörd.

**Inget att testa** — borttaget element, inget nytt att verifiera.
---

### Session 15 fortsättning – v1.85: Settings Save/Load (.txt) (23 juni)

Två knappar i Settings-modalens footer: **💾 Save settings** och **📂 Load settings**.

**`exportSettings()`** (rad ~9571):
- Bygger ett objekt `{_elysium:'settings', _v:VERSION, conv, brightness:brightVal, keys:keyBinds}`.
- `JSON.stringify(payload, null, 2)` → `Blob('text/plain')` → syntetisk `<a download="elysium-settings.txt">`.

**`importSettings()`** (rad ~9586):
- Öppnar `<input type=file accept=".txt">`.
- Validerar `d._elysium === 'settings'` — annars `toast('Not an Elysium settings file')`.
- Applicerar varje känt conv-fält med typ/range-skydd (okända fält ignoreras).
- `sfxIndiv`-nycklar (`unlock/lock/logEvent`) klamrade 0–200.
- Anropar `saveConv()`, `localStorage.setItem(BRIGHT_KEY)`, `applyBrightness()`, `saveKeys()`, `rebuildKeymap()`.
- Avslutar med `openSettings()` → re-syncar hela settings-UI:t synkront.

**HTML (rad ~1533):** `mfoot` fick `style="gap:8px"` + de två knapparna före Close.

**Listeners (rad ~9775–9776):** placerade direkt före `#keysReset`-lyssnaren.

**Version:** Klient → **1.85**. Rent klientsidigt; servern orörd.

**EJ runtime-testat.** Testa: öppna Settings → klicka 💾 Save settings → fil laddas ner. Ändra någon inställning, ladda filen med 📂 Load settings → inställningen återgår. Ogiltig fil → toast-felmeddelande.
---

### Session 15 fortsättning – v1.86: Search for first… i Library browse (23 juni)

Library högerklick → Browse… (nu submeny) → Search for first… → Equipment / Weapon.

- `SEARCH_CATEGORIES` — registry `{label, dbRequired, match(c)}`. Equipment: typ "Equipment". Weapon: Equipment-typ + `/[weapon]|weapon/i` i `cardInfo.text`.
- `searchForFirst(cat)` — itererar library från toppen. Träff: modal med kort 0..foundIdx (ovan dimmas, träff `.bfound`), sätter `browseSearchFetch`. Ingen träff: allt dimmat.
- `_makeBrowseCard(c)` — read-only `.bcard` utan dblclick.
- `browseSearchFetch` — konsumeras i `browseClose`: hämtar kort till hand, sedan blandning.
- Library-menyn: `Browse…` → submeny `View all` + `Search for first… ▸`.
- CSS `.bcard.bfound`: guldram, "FOUND"-badge, mässingsfärgat namn.

**Version:** Klient → **1.86**. Servern orörd.

**EJ runtime-testat.** Testa med Card DB on: Library högerklick → Browse… → Search for first… → Equipment → träffkort highlightat i guld, kort ovan dimmas, stäng → kort i handen + lek blandad. Utan DB → toast.
---

### Session 15 fortsättning – v1.87: Target från logg-kortlänkar + open hand-overlay (23 juni)

**Högerklick på `.clog` i loggen → "⋖ Target this card"-meny:**

Tre fall i contextmenu-lyssnaren (tillagd i log-IIFE, efter click-lyssnaren):
1. `data-cid` + eget kort → `setTarget(cid)` (lokal target, outline)
2. `data-cid` + motståndares kort i `net.boards[seat].pub` → `setRTarget({seat,cid,...})` (remote outline, bara om COUNTER_ZONE)
3. Bara `data-name` (reveal-mottagarrad) → `setNameTarget({name, seat:fromSeat, who, visibility:'private'})` (inget cid = ingen outline)

**`setNameTarget(r)` (ny funktion, rad ~3226):**
- Sätter `net.rtarget = {name, seat, who, faceDown:false, cid:null}`
- `visibility:'hand'` → privat loggrad + publik "X targets a card in Y's hand."
- `visibility:'private'` → privat loggrad + publik "X targets a revealed card."
- Anropas också av `clearAnyTarget()` när `!net.rtarget.cid`

**`data-from-seat` på reveal-mottagarraderna (rad ~6966):**
- `mpOnMsg t:'revealHand'`: `_fromSeat=m.seat|0` → `data-from-seat="N"` på varje `.clog` i privat loggrad
- Används av contextmenu-lyssnaren för att koppla namnbaserat target till rätt seat

**`viewOppHand` dblclick (rad ~4585):**
- Samma mönster som `viewOppAsh`: dblclick togglar `.btarget` + `setNameTarget`/`null`
- Kollar befintligt namnbaserat target vid modal-öppning (`_ohTgt`)
- Note-text uppdaterad: "double-click a card to set/clear target."

**`clearAnyTarget` utökad:** `if(!net.rtarget.cid) setNameTarget(null)` istället för `setRTarget(null)` för namnbaserade targets (annars logs "⌖ Target cleared." offentligt av `setRTarget`).

**Version:** Klient → **1.87**. Servern orörd.

**EJ runtime-testat.** Testa: (1) Högerklicka ett face-up kort-länk i loggen → meny med "⋖ Target: [namn]" → klicka → target-knapp tänds, outline på kortet. (2) Högerklicka en reveal-rad (`data-name`) → "⋖ Target: [namn]" → publik "X targets a revealed card." i loggen. (3) Open hand overlay → dblclick ett kort → .btarget-markering + target-knapp tänds + "X targets a card in Y's hand." loggas.
---

### Session 15 fortsättning – v1.88 / server v1.7: logTo-verb för privat target-notis (23 juni)

**Bakgrund:** v1.87 lämnade avsändaren av en reveal utan privat notis om att mottagaren targetas kortet — kommenterad som kompromiss. Nu åtgärdat med ett nytt server-verb.

**Server `elysium-server.js` — nytt verb `logTo` (rad ~651):**
```
{ t:'logTo', toSeat: N, html: '...' }   →   server routar till room.players[N-1]
→   { t:'logTo', from: p.name, html }   (privat till mottagaren)
```
Samma unicast-mönster som `revealHand`. `html` klamrad till 2000 tecken. Avsändaren exkluderas (`q !== p`).

**Klient `mpOnMsg` — hantera `t:'logTo'` (rad ~6965):**
- `log('[from] html', true, true)` — localOnly + privateLine (aldrig arkiverad)

**`setNameTarget` — båda visibility-fallen skickar nu `mpSend({t:'logTo',...})` till `r.seat`:**
- `'hand'`: "⋖ X targets Y in your hand."
- `'private'`: "⋖ X targets Y (revealed to you — they are targeting it)."

**Server VERSION:** `'1.6'` → `'1.7'`. Gammal klient mot ny server → versionsvarnng; gammal server mot ny klient → `logTo` ignoreras tyst (safe degradation).

**Version:** Klient → **1.88**, Server → **1.7**.

**EJ runtime-testat.** Testa online: (1) Anna revealar Govern till dig → du högerklickar länken i loggen → targets → Anna ser privat "[Du] targets Govern the Unaligned (revealed to you — they are targeting it)." + alla andra ser "X targets a revealed card."; (2) open hand → dblclick → Anna ser "X targets Y in your hand."; (3) testa med gammal server (1.6) → ingen krasch, bara ingen notis.
---

### Session 15 fortsättning – v1.89: "Target cleared" tystnad (23 juni)

Tog bort `log('⌖ Target cleared.')` från `setTarget`, `setRTarget` och `setNameTarget`. Target-knappens visuella state (lit/inte lit) ger tillräcklig feedback. **Version:** Klient → **1.89**. Servern orörd.

---

### Session 16 – v1.90–v1.99.26: L3 Overview-utbyggnad + Edge-token-handoff (24 juni)

En lång iterativ session. Radnummer nedan är mot levererad **v1.99.26** (`elysium-vtes-bord.html`) — använd dem som startpunkt men re-grepa (line-drift). Server på **v1.99.18**.

> **Versionspann:** vi körde v1.99.1, v1.99.2 … v1.99.26 (inkrementella fixar). **2.0 är medvetet reserverat** för en framtida refaktorering — fortsätt på 1.99.x.

#### L3-pool-zonen (delen som föregick Edge-sagan)
Målet: din egen pool-zon i L3 ska se ut som motståndarnas (L2 Visit-stil), och dockpanelen ska ha en egen pool-glob.
- **`pubCanon('pool')`** lades till (rad ~2018) — föll tidigare tillbaka till ready-zonen. Din pool-zon (`#poolWrap`) renderas nu i `setCenterFrameA` (rad ~8893) som de andra zonerna: `pubXform`-position + `l2pub.s`-storlek, globen skalad med samma fraction-of-zone-formel som mat-globerna.
- **Separat dock-pool:** `#z-pool` + `#dockPool` (egna `#dpplus/#dpminus`/wheel/högerklick → `bumpPool()`, rad ~5565). `updatePool()` syncar båda globerna. Roten till de tidiga pool-buggarna: **ett `#poolWrap` kan inte vara både slot-zon och dock-widget** — två skrivare slogs om samma element.
- Zon-labeln skalas som `.matzlab` (`l2pub.s*15`). Gammal regel `#board.l3mode #poolWrap .plabel{display:none}` dolde "Pool"-texten tyst tills vi ändrade till `display:block`.

#### Edge-token: ~10 iterationer, buggen flyttade mellan lager
Detta tog längst tid. Symptomet "token försvinner vid handoff" hade **fyra distinkta rotorsaker** i följd:
1. **`elementsFromPoint` såg inte mat:en** genom `#l3stage` (annan stacking-kontext, `pointer-events:none` på containern) → handoff triggades aldrig. **Fix:** `opponentSurfaceAt`/`readyZoneAt` (geometrisk rect-test, rad ~9030/9042) — samma som kort-give.
2. **`dropPos` lästes efter `removeEdgeToken`** → null.
3. **`tok.x` var stale under drag** → fel sparad position. **Fix:** härled från drag-koordinaterna `d.x/d.y`.
4. **Token renderades inte alls på motståndarnas mattor** — den var live DOM på `#board` bara för aktiv spelare, inte i `pub`. **Detta var den djupaste**, och Johan hittade den genom att passa turen och se ingenting. **Fix:** `buildPub().tokens` (rad ~7358) + `buildMat` ritar `pub.tokens` (rad ~8510, read-only, samma X/Y/s som korten).

**Meta-lärdom:** när en fix "inte ändrar något", sluta patcha samma ställe — instrumentera dataflödet (några `console.log` per lager hade hittat #4 direkt).

#### Token-i-stage: fel väg, reverterad
v1.99.9 flyttade token *in* i `#l3stage` för gratis pan/zoom → kaskad (pointer-events ärvdes, drag-matte dubblerades, koordinater behövde un-foldas två gånger). **v1.99.11 reverterade allt:** token stannar på `#board`, `applyL3Transform` (rad ~8728) anropar `placeToken` via `pubXform` (3 rader). Ren lösning enklare än workaround. Verifierat: `pubInv(pubXform(x))===x` (exakta inverser, rad ~2018) → inget snäpp.

#### Koordinatfix: mat-relativ dropPos
Token hamnade "långt utanför bordet" vid handoff. **Roten:** `dropPos = pubInv(d.x,d.y)` tolkade släpp-punkten i MIN slot-rymd, men motståndarens mat är en annan skärmregion. **Fix (v1.99.16):** fraktion av målmat-rect → gemensam canonical-box (`box.x + rx*box.w`), exakt som `giveTo` placerar kort. Hela kedjan nu i box-canonical.

#### Ready-zon-begränsning (v1.99.17)
`readyZoneAt(cx,cy)` (rad ~9030): egen `#z-ready` + motståndares `.matzone-r`. Tre utfall: motståndares Ready → handoff; egen Ready → flytta (behåll Edge); annars → snäpp tillbaka (`placeToken(tok)` med oförändrad pos).

#### Knappen auktoritativ (v1.99.18, klient + server)
`edgeTakeover()` (rad ~5591): tar Edge → rensar edge+token överallt (hotseat JSON + pub, online via `edgeTake`), re-seatar en token i min Ready. `toggleEdge` (rad ~5582) anropar den. **Server (rad ~882):** `edgeTake`-broadcast (`bcast`). `edgePass` (rad ~878, drag-handoff) fanns sedan v1.99.2.
- **Hotseat tre-lager (rad ~5719 `edgeHandoffHotseat`):** `net.hot.boards[seat]` är JSON-strängar (parse/stringify), `net.boards[seat].pub` är mat-vyn, aktiv spelare är live `state` (hoppa dess stale JSON). Alla tre måste uppdateras.

#### Knappen följer bordet + inverterad-zoom (v1.99.19, v1.99.25)
- **v1.99.19:** `#edge` CSS-transition begränsad till `background/border-color/box-shadow` (ej `left/top`) — `transition:all` fick position att glida varje pan-frame.
- **v1.99.25:** `#edge` fick `transform:scale(Z)` + `origin:0 0` i setCenterFrameA (rad ~8928). Tidigare skalade bara POSITION (`Px+Z*…`), storlek var fast 32px → inverterad-zoom. Nu skalar både. **Detta förklarade varför en tidigare `+42→+32`-nudge "inte syntes"** — knappen var redan zoom-fel.
- **v1.99.26:** Edge-knappen `l3clockCy+12` (20px upp från +32).

#### Persistens
`serializeGame` sparar `edgeTok:{x,y}`; `restoreGame` re-seatar token där (handed-off Edge behåller drop-position när mottagaren blir aktiv).

#### L3-chrome-polish (v1.99.20–v1.99.24)
- Zoom/help-knappar vertikalt staplade (`#l1zoomWrap` `flex-direction:column`, zoom överst), bottom:38px/right:19px.
- Zoom-slider-panel (`#l3zoomCtl`) flyttad till `#tableArea` (samma koordinatsystem som knappen) → botten-mot-botten till vänster om zoom-knappen. Toggle via `body.l3zoomopen`.
- Knappar ~5% mindre i L3 (`:has(#board.l3mode)`, 26→24.7px).

**EJ runtime-testat** (sandbox kan ej rendera/köra). Allt ovan verifierat live av Johan under sessionen — Edge-token + handoff + knapp-takeover fungerar i hotseat. Online-vägarna (`edgePass`/`edgeTake`) är kodade men Johan testade primärt hotseat.

**Versioner:** Klient → **1.99.26**, Server → **1.99.18**.


### Session 17 – v1.99.27: pre-2.0 dead-code sweep (24 juni)

En fokuserad uppstädning inför 2.0-refaktoreringen. Klient → **1.99.27**, server oförändrad (1.99.18). All borttagen källkod arkiverad verbatim i nya **kodarkivering.md**; varje borttaget ställe bär en `// PARKED -> kodarkivering.md`-brödsmula. Gjort som **en atomisk assert-ankrad Python-patch** (kedjad från v1.99.26-snapshotten, det senaste levererade läget). JS-syntax verifierad (`node --check`) + statisk pass utan döda anrop; **EJ runtime-testat** (sandbox kan ej rendera) — Johan verifierar live.

**Tre saker pensionerade:**
1. **L1/Simplified som *vald* vy** — "Default table view"-inställningen borttagen, hemvyn tvingad till **Normal** (`conv.defaultView` hårt 'normal'; online-låset `mpView` tappade Simplified-optionen). Solo-ingångarna borta (startknapp + menyval); "Offline — hotseat" → **"Offline"**; `openOffline()`-solo-grenen borta (sådd alltid You + en motståndare). **L1 lever kvar** som baslager (L2/L3 = klasser ovanpå; `exitL2`/`exitL3` återlämnar dit) + enpelars-fallback i `baseView()` (`opp ? 'l2' : null`). Full pensionering via `l2solo` är medvetet 2.0-arbete (Johans beslut: "Tvinga Normal").
2. **Alt-vyerna** — `#altview` (Reaction window) + `#qrbar` (Quick React-remsan) + `#btnReact` + Alt/Escape-keydown + Quick React-inställningen, allt parkerat. Played + Ready-tabbarna ersätter dem. `renderAltIfOpen()` behållen som tab-refresh-skal.
3. **L3 cirkelbord** — `effectiveL3Shape()` square-only; `l3slots()`-cirkelgrenen + shape-inställningen + `mpShape`-online-låset parkerade; den redan döda `renderOval()` + `.ovalfelt` arkiverade.

**Viktig gotcha (nu i learnings):** kortrenderarna `avRenderCard` / `qrCard` / `qrTap` / `qrHandDown` / `qrDragGive` och `.qr*`-CSS:en är **delade** med Played/Ready-tabbarna + docken — bara tray/remsa-*containrarna* var feature-specifika. Att klippa per namn hade krossat tabbarna. Dessutom: en kvarvarande `avTap`-bindning inuti den behållna `avRenderCard` (i `if(interactive)`, alltid falsy från Played) klipptes bort — död referens till raderad funktion är en latent fälla.

**Versioner:** Klient → **1.99.27**, Server → 1.99.18 (oförändrad).

**Tillägg (samma version):** Navigationsblockad — Johan påpekade att det viktigaste var att L1 inte ska vara nåbar inifrån en match. Tre funktioner patchades: `baseView()` returnerar alltid `'l2'` (var `null` vid ensamt bord), `levelOrder()` → `['l2','ov']` (var `[null,'l2','ov']`), `stepLevel(-1)` från Visit → `'l2'` (var `null`). De fyra `switchView(null)` som finns kvar är alla rivningsscenarier (leave/disconnect/stop-hotseat) — inte navigation. `renderL2`s solo-gren (brädet centrerat med dock) hanterar enpelarbord i L2 bra.

### Session 18 – Fas 0: edge-fixar, dödkodssvep #2, klientlogiksvit, debug-ringbuffert (24 juni)

Grundarbete inför 2.0-refaktoreringen. En full kodaudit + refaktoreringsplan levererades som **elysium-refactor-analysis.md**, och enfils-frågan avgjordes där som **fork B1**: behåll *artefakten* som en dubbelklickbar `file://`-HTML, men låt *källan* bli platta script-fragment i en delad scope, dumt konkatenerade till HTML:en med en **byte-identisk diff** som grind (inget byggsteg, ingen import/export). Inget strukturellt flyttades än — Fas 0 är fixar + skyddsnät först.

Allt levererat som atomiska assert-ankrade Python-patchar (kedjade från senaste levererade output, inte källan). **EJ runtime/online-testat** (sandbox kan ej rendera/nätverka) — Johan verifierar live.

**1. Edge-verb serverfixar (server 1.7 → 1.8).** `edgePass`/`edgeTake` var *wirade men aldrig live-testade* (hotseat är primär, online-handoffen hade tyst ruttnat). Fyra latenta buggar:
- `edgePass` slog upp målet via `room.players.find(x=>x.seat===toSeat)` — men spelarobjekt har **inget `.seat`-fält** (säten beräknas bara i `roster()`). Fix: indexera `room.players[toSeat-1]`.
- `edgePass`-relän tappade `pos`-fältet klienten skickar (`pos:dropPos`) och mottagaren läser → en överlämnad Edge ignorerade sina droppkoordinater. Nu vidarebefordrat. (Koordinatmodellen är mat-relativ → delad canonical box, så `pos` är portabel.)
- `edgeTake` skickade klientens `bySeat` rått; servern **härleder** nu identiteten (`room.players.indexOf(p)+1`) och litar aldrig på ett klient-skickat säte.
- båda verben saknade `if(!room.started) return;` — tillagt.

Server-only — klient-HTML:en rördes inte för dessa.

**2. Dödkodssvep #2 (klient).** Skilt från v1.99.27-svepet (som *parkerade* återupplivningsbara features). Detta tog bort genuint död utvecklarställning — `demoBoard`, `fillTableDecks`, `startDemoTable`, `promptDemoTable`, `applyL2Experiment`, `thump` (+ utkommenterade `thump`-anrop, en stale `.l2pane` i contextmenu-allowlistan + dess CSS). Eftersom det var aldrig-nåbar cruft (inte parkerade features) **raderades det rakt av, inte arkiverat** till kodarkivering.md (som håller parkerad-men-återupplivningsbar kod). **`stopDemoTable` döptes om till `leaveHotseat`** (definition + båda anropsställen). Behållet (verifierat live): `DEMO_NAMES` (används i Offline-sådden), `startHotseat`, `fillOfflineTable`, `.l2pane2` (12 live-användningar).

**3. Klientlogiksvit + delad harness.** Ny `test-client-logic.js` laddar klientens riktiga `<script>` i Node under en kompakt Proxy-DOM-stub (`elysium-test-harness.js`) och asserterar de kontrakt som är mest utsatta vid refaktoreringen: `pubXform`/`pubInv` round-trip till identitet; `serialize → restore → serialize` idempotent (utom `t`-tidsstämpeln); `restore` bevarar pool/zoner/kortfält; `buildPub` utelämnar handen och rapporterar bara dess antal (klientens secrecy-garanti — face-down-*namn*-strippning är serverns `sanitizePub`-jobb); `restoreGame` avvisar skräp utan att kasta; `baseView()==='l2'`; och ringbufferten fångar + dumpar. **8 assertions, alla gröna mot 1.99.28.** Kör `node test-client-logic.js`. Eftersom den driver *levande* funktioner är den en äkta regressionsgrind för modulutbrytning. (Att skriva den avslöjade att `baseView` redan reducerats till en enradare i v1.99.27 — ett config-matristest hade testat ett stale kontrakt. Läs koden, lita inte på planen.)

Stub-laddaren bröts ut till en delad modul (`elysium-test-harness.js`) så framtida testfiler delar en stub. Full sammanslagning med `harness_faithful.js` (load-checkaren) återstår — kräver den filen, som inte finns i projektkopian.

**4. Debug-ringbuffert (`conv.debug`).** Klienten hade noll `console.*` och ingen diagnostikkanal — online-desynkar var osynliga. La en kapad (200-poster) ringbuffert matad av `dbg(tag, e)`, inkopplad i de tysta `catch` där desynkar göms (`mpOnMsg`-nätverksdispatchen, escrow-derivering, hand-blob-dekryptering, escrow-kryptering) + globala `error`/`unhandledrejection`-fångare. Bufferten fångar **alltid** (oberoende av flaggan); `conv.debug:true` speglar dessutom varje ny post till `console.warn` live. Dumpa från konsolen med **`elysiumDbg()`**. Den ofarliga `c.el.remove()`-catchen lämnades tyst. MVP: konsol-accessor, ingen About-panel-knapp än.

**Versioner — två saker att stämma av (ditt beslut):** Klient **1.99.27 → 1.99.28** (denna sessions klientändringar). Server: källan är `const VERSION='1.7'` (egen frikopplad 1.x-linje: 1.6 → 1.7 → **1.8**); levererad server är **1.8**. (a) v1.90–v1.99.26-noterna *och Session 16/17* kallar servern "1.99.18" — det är en numreringsslip; edge-verben bor i 1.x-servern, så behandla kodens `VERSION` som auktoritativ. (b) Eftersom klienten är 1.99.28 och servern 1.8 fyrar join-kontrollen sin **icke-blockerande** "version mismatch"-varning online — ett känt, accepterat läge (journalen noterar online som sekundärt till hotseat). Vill du tysta den: synka serverns `VERSION` till klientens nummer; annars är 1.x-linjen fin.

**Verifierat:** klient-JS-syntax ren (`node --check` på extraherad script); `node test-client-logic.js` 8/8 (inkl. mot den patchade klienten — bekräftar att svepet + ringbufferten inte rörde kärnlogiken); serverns edge-fixar byte-bekräftade i levererad fil. **EJ** runtime/online-testat. Live att verifiera (Johan): Edge-handoff med 2 klienter — dra Edge till motståndarens Ready → landar på droppplatsen; ta Edge via knappen → försvinner hos föregående hållare + rätt namn i loggen.

**Levererade filer:** `elysium-server.js` (1.8), `elysium-vtes-bord.html` (1.99.28), `test-client-logic.js`, `elysium-test-harness.js`, `elysium-refactor-analysis.md`.

**Nästa (Fas 1):** handler-map för `mpOnMsg` (376-radig if/else) + serverns `handle()`; ersätt 49 `prompt`/`alert`/`confirm` med riktiga modaler (touch-prereq); etablera B1-konkatenatorn på en första löv-modul.

### Session 19 – Fas 1: handler-maps, modaler, B1-konkatenator + Fas 1-buggfixar (24–25 juni)

Den strukturella, låg-risk-fasen (analysens Phase 1). Allt levererat som atomiska assert-ankrade Python-patchar (kedjade från senaste levererade output). **EJ runtime/online-testat** — Johan verifierar live. Modal-arbetet är dock mest klient-sidigt och testbart i hotseat. Radnummer nedan är mot **1.99.34** — re-grepa (line-drift).

**1. Handler-maps (klient `mpOnMsg` + server `handle()`).** Klientens 39-grenade if/else-dispatch (`mpOnMsg`) ersattes av `const MP_HANDLERS = { joined(m){…}, … }` (39 funktionshandlare) + en tunn `mpOnMsg(raw)` som parsar och slår upp `const h=MP_HANDLERS[m.t]; if(h) h(m);`. Else-löst (okänt verb ignoreras tyst, som förr). Serverns `handle()` fick samma behandling men **stegningen bevarades medvetet**: `create`/`join` (innan ett rum finns), spectator-fasen och `const room=conn.room, p=conn.player`-kontexten ligger kvar som pre-dispatch; bara in-game-kedjan (45 grenar `log`→`leave`) extraherades till `const GAME_HANDLERS = { log(conn,room,p,m){…}, … }` placerad FÖRE `handle()`. Att platta hela `handle()` till en enda map hade brutit pre-rum/spectator-logiken. Yttre try/catch omsluter dispatchen. `chat` finns i två faser (spectator vs in-game) — ingen kollision. Klient-VERSION → **1.99.29**; server oförändrad (refaktor ≠ protokoll).
- **Testharness utökad:** `elysium-test-harness.js` fick `loadServer(path)` (strippar hashbang via regex, stubbar `http`/`fs` så servern laddar utan portbindning/disk, exponerar `handle`/`rooms`/`GAME_HANDLERS`). Ny `test-server-dispatch.js` (3 tester: `GAME_HANDLERS` = 45 funktioner; `handle()` routar `create` end-to-end med fakeSock; okänt verb sväljs).

**2. B1-konkatenatorn etablerad (enfils-forken från Session 18).** `split_client.py` delar single-filen i en shell + ordnade JS-fragment; `elysium-build.js` (~50 rader, zero-dep) konkatenerar dem tillbaka via en `/*@@ELYSIUM_APP_JS@@*/`-platshållare i shell.html. Fragmenten delar ETT scope (ingen import/export, ingen byggkedja). **Byte-identisk `cmp` mot senaste levererade fil är grinden.** Första riktiga löv-modulen: **`esc-crypto.js`** (ESC hand-escrow-IIFE, rad ~6502, returnerar `{deriveKeys,encrypt,decrypt,sha256hex,hmachex,pbkdf2hex,ITER}`). Single-filen `elysium-vtes-bord.html` förblir source-of-truth; `elysium-src/` är bevisad ställning. **Disciplin: re-splitta (splitter läser `/tmp/original.html`) + bygg + `cmp` efter varje klient-patch** så fragmenten hålls aktuella + byte-identiska. (Teckenantal i splitter-rapporten ≠ byte i `ls` pga multibyte-UTF-8 — `cmp` är grinden, inte längd.)

**3. Modal-system + alla 49 native dialoger → async modaler.** Nytt `uiDialog(opts)` + `uiAlert`/`uiConfirm`/`uiPrompt` (Promise-baserade, rad ~4676) ovanpå det befintliga `#overlay`-systemet (`openOverlay`/`closeOverlay`/`shownModal`). Nytt `#dialogModal` insatt först i `#overlay`. Nyckeldesign: **kommer ihåg + återställer modalen under via `shownModal()`** (en confirm inifrån deck-labbet stänger inte labbet); Esc/Enter/backdrop hanteras med capture + `stopPropagation` (pre-emptar global backdrop-close). Konverteringen i tre batchar:
- **Patch A (1.99.30):** 10 `alert(` → `uiAlert(` (alla fire-and-forget `alert();return`).
- **Patch B (1.99.31):** 18 trygga löv-`confirm`/`prompt` → `await uiConfirm`/`uiPrompt`; omslutande funktion/arrow blir `async`. Init-resume-confirm (top-level) → `.then()`-form (await otillåtet på toppnivå).
- **Patch C (1.99.32):** kärnlogik-kedjan, 19 funktioner blev `async` (`pass`, `playFromHand`, `drawCard`, `activatePhase`, `dropCard`, `masterPlayGate`, `phaseLeaveOK`, `_promptN`, `bumpCounter`, `ousted`, reveal/burn/discard-N m.fl.). **Async-ripple spårad:** predikat (`_promptN`/8 anropare, `masterPlayGate`/2, `phaseLeaveOK`/2) måste awaitas av ALLA returkonsumerande anropare (annars är `if(fn())` ett truthy Promise). `joined`-restore-confirm → `.then()` (håller meddelandehandlern synkron). `move`:s discard-`confirm` lämnades native här (hetaste funktionen, brett returkonsumerad) — se punkt 5.

**4. Hotseat turn-logg-fix (1.99.33).** Pre-existerande bugg (inte från async-refaktorn): i Offline Hotseat ackumulerade game-loggen inte över turer/säten — bara skaparens (säte 1) tur sparades, syntes efter ett varv runt bordet. **Rot:** loggen är tvålagrad — `curLines` (live, rad ~1882/1914) + `state.turnLogs` (historik, arkiverad av `archiveTurn` vid pass). `clearTable` (rad ~4945) OCH `restoreGame` (rad ~4815) nollställde/skrev över `state.turnLogs` **ogated**, medan `curLines` redan var `keepLog`-gated. Vid varje säte-byte (`pass`→`archiveTurn`→`setActivePlayer`→`restoreGame({keepLog:true})`) klobbrades den delade historiken med nästa sätes (tomma) blob → turn 1 förlorades direkt, varje sätes blob behöll bara sin egen tur. **Fix:** gate BÅDA `turnLogs`-skrivningarna med `keepLog` (`clearTable` flyttade in i befintligt `if(!opts.keepLog)`-block; `restoreGame` fick `if(!opts.keepLog) state.turnLogs=…`). Nytt test i `test-client-logic.js` vaktar det (keepLog bevarar delad historik; utan keepLog laddas blobbens). Live-`#log` = nuvarande tur (rensas vid pass — avsiktligt); turn-dropdownen = delad historik över alla säten. Online var redan rätt (inget säte-byte på samma maskin).

**5. Discard-varningen lyft till UI-lagret (1.99.34).** Sista native-dialogen. `move`:s over-the-limit discard-`confirm` (rad ~2326; fyrar bara vid `c.zone==='hand' && zone==='ash' && state.phase===4 && rem<=0`) lyftes UT ur den rena, synkrona `move()` till en async `discardGateOK(c)` (rad ~2324) i UI-lagret, applicerad på de tre **diskretionära** enstaka-kort-entrypunkterna: `dropCard`-drag till ash (rad ~2772, redan async) + två `cardMenu`-val ("Discard (ash heap)" ~3495, "To ash heap" ~3558 — arrows blev `async`). Att göra `move` async hade rippllat genom 7 returkonsumerande `if(move(…))`-anropare + ~25 fire-and-forget i drag-drop-hetbanan — oproportionerlig risk. Multi-flyttar (`groupMove`, grupp-drop) och slumpdiscards (`discardRandomHandN`) slipper nu varningen (per-kort-prompt vore dålig UX; "förbi din discard-gräns" är meningslöst för en tvingad slumpdiscard). `move` förblir ren synkron data. **Hela klienten är nu fri från native dialoger** (`confirm`/`prompt`/`alert` = 0).

**Versioner:** Klient **1.99.28 → 1.99.34** (1.99.29 handler-maps · 1.99.30–32 modaler · 1.99.33 loggfix · 1.99.34 discard). Server **1.8** oförändrad (refaktor ≠ protokoll; inga nya verb). **Server-versionssynken (för att tysta den icke-blockerande online-mismatch-notisen, klient 1.99.x ≠ server 1.x) är medvetet uppskjuten tills allt är klart — Johans beslut.**

**Verifierat:** klient-JS-syntax ren (`node --check` på extraherad script); `node test-client-logic.js` **12/12** (inkl. nya mpOnMsg-routing-tester + keepLog-vakten) + `node test-server-dispatch.js` (3); B1-bygget byte-identiskt mot levererad klient i varje runda. **EJ** runtime/online-testat. Live att verifiera (Johan): fasbyten (5 `phaseLeaveOK`-varningar) + spela kort (master-gate + hand-påminnelse) + "hur många"-prompter + räknare förbi influence-gräns + passa + bli oustad + resume-on-join (`.then()`-dialogen); hotseat-loggen över ett varv (turn-dropdownen ska ha alla spelares turer); online rök-test efter dispatch-refaktorn (logik identisk, väg ny).

**Levererade filer:** `elysium-vtes-bord.html` (1.99.34), `test-client-logic.js`, `test-server-dispatch.js`, `elysium-test-harness.js`, `split_client.py`, `elysium-build.js`, `elysium-src/` (shell.html, app-pre.js, esc-crypto.js, app-post.js, manifest.txt).

**Nästa (Fas 2):** löv-modulerna per analysen — `sfx.js`, `fx.js`, `tokens.js`, `decklab.js`, sedan `helpers.js` som registry, core-sömmarna (`state`/`render`/`net`/`input`) sist. *(Fas 2 är påbörjad: `sfx`- och `fx`-löven redan utkarvade byte-identiskt, splitter:n hanterar flera löv med glue-fragment; full Fas 2-dokumentation när fasen är klar.)*

### Session 20 – Fas 2: löv- + feature-extraktion, helpers-registry, net/hotseat-sömmar (25 juni)

Refaktorns Phase 2 (modul-dekomposition via B1). Mest **byte-identiska extraktioner** (HTML oförändrad, bara `elysium-src/`-fragmenten växte) plus ett **riktigt refaktor** (helpers-registret, 1.99.37) och en **server-buggfix** (1.9). Radnummer mot 1.99.37 — re-grepa.

**1. Steg 8 — löv-modulerna (byte-identiskt).** Fyra löv utkarvade utöver Fas 1:s esc-crypto: `decklab-editor`, `tokens-engine`, `sfx-audio`, `fx-anim`. Splitter:n (`split_client.py`) byggdes ut till flera löv med numrerad glue (`app-1..app-N`) mellan namngivna fragment; `elysium-build.js` är manifest-driven så ny ordning kräver bara manifest-uppdatering. Grinden: `cmp` mot `/tmp/original.html` = noll diff. Löv-gränser ankras på plain-ASCII sektionskommentarer + öppnande `function`/`const`.

**2. Steg 9 — helpers-registret (1.99.37, riktigt refaktor).** De 8 helper-nycklarna (`on, unlockPrompt, counts, passConfirm, warn, edge, hand, handReminder`) räknades upp på **fyra** ställen i JS: `helper`-objektets defaults (6142), loadHelper-listan (6145), `syncHelperUI`:s id-map (10109), och 8 identiska checkbox-handlare (10133-40). Införde `HELPER_DEFS = [{key, el}]` (en array, ~6150) som GENERERAR alla fyra: defaults via `for(const d of HELPER_DEFS) helper[d.key]=d.def!==false`, load-loopen itererar den, `syncHelperUI` itererar den, och de 8 handlarna kollapsade till en loop (`for(const d of HELPER_DEFS){ … addEventListener … helper[d.key]=… }`). **`hx()` + hela policy-gatingen orörd** — den läser fortfarande bara `helper[key]`; registret driver bara data + wiring. De rika HTML-etiketterna (`<b>`, exempel) bor kvar i markupen. Lägg-till-en-helper = en registry-rad + en `<label>`-rad. Verifierat: node-check + 12/12 + byte-identisk split/build-round-trip (HTML ändras nu, så cmp mot nya originalet).

**3. Server-fix (1.9) — `HELPER_KEYS`-drift.** Upptäckt under steg 9: servern hade `HELPER_KEYS = ['on','unlockPrompt','counts','passConfirm','warn','edge']` — bara **6 nycklar**, `hand`+`handReminder` saknades. `cleanHelperPolicy` (rad 147-149) strippar därför dem ur policyn → på ett **låst online-bord** propagerades inte de två helpers (klienter får `undefined` → av, oavsett värdens inställning). Glömt ställe när hand/handReminder lades till klienten — exakt den drift registret ska förhindra. **Fix:** lade till båda nycklarna + en spegel-kommentar (`mirror the client's HELPER_DEFS`). Server-VERSION bumpad 1.8 → 1.9 (beteendeändring). Johans beslut: håll det konsekvent (alla 8 host-låsbara nu); *principen* om vad som BÖR vara låsbart kontra lokalstyrt (spelar-beslut) tas senare — uppskjuten designfråga.

**4. Steg 10 — core-sömmarna: fyndet.** Kartläggning visade att planens "the function clusters already imply clean boundaries" är **optimistiskt**. Koden skrevs i **användnings-ordning**, inte modul-ordning: `state` (makeCard 1986, place 2286, move 2331, serializeGame 4765, restoreGame 4790, buildPub 7355) och `input` (bindCard 2627, dropCard 2759 + drag/tap) är **utspridda genom hela filen**; `render` ligger i två kluster (layout 2112/2131, sen 8054-8671). En byte-identisk fyrvägs-split är **inte möjlig utan att flytta funktioner** (bryter källordning → TDZ-risk, ej byte-identiskt). Flaggades som designgaffel till Johan; beslut: ta de rena sömmarna byte-identiskt nu, **skjut omflyttningen till ett dedikerat slutpass** (med testnätet på plats) — kan köras i ny chatt, se `elysium-relocation-brief.md`.

**5. Steg 10 — `net.js` (byte-identisk core seam).** Den enda rent sammanhängande kärn-sömmen: `inRoom` (6683, direkt efter esc-crypto-lövet) → `schedulePush`, slut precis före `buildPub`. ~650 rader: session/token, `mpConnect`/`mpSend`, `MP_HANDLERS`+`mpOnMsg`, lobby-UI, online-pile-sync, push-debounce. **Bisekterad** av esc-crypto-lövet — net-headern (`MP_KEY`) sitter kvar i app-3 före esc (oundvikligt; fragment är linjära). Splitter fick `NET_END = "function buildPub(){"`, net infogad mellan esc och app-4. cmp grön.

**6. Steg 10 — `hotseat.js` (byte-identisk feature).** Renare än väntat: hela offline-koden är ETT sammanhängande block (7554-7707, ~153 rader) — `DEMO_NAMES`, `startHotseat`, `leaveHotseat`, `setActivePlayer`, `updateHotHud`, + setup-fönstret (`openOffline`/`renderOfflineSeats`/`fillOfflineTable`/`startOfflineFromCfg`) med knapp-wiring. Ankras på `/* Placeholder opponent names… */` → `/* Reaction window (Alt-view)… */`. `giveHot` (8852) ligger separat i render-glue (stannar). app-4 delades i två runt hotseat, gamla app-5 (fx-svans) renumrerades → app-6. cmp grön. menus (showMenu 3129, cardMenu 3486, openSayMenu 9458) + settings (conv 1656, saveConv 5496, openSettings 9899) är för utspridda → ej byte-identiskt extraherbara; net+hotseat är det realistiska taket för byte-identisk kärn-extraktion.

**Fragment-landskap nu (13):** `app-1 · decklab-editor · app-2 · tokens-engine · app-3 · esc-crypto · net · app-4 · hotseat · app-5 · sfx-audio · fx-anim · app-6`. 5 löv + 1 core seam (net) + 1 feature (hotseat) + 6 glue.

**Versioner:** Klient **1.99.34 → 1.99.37** (1.99.35-36 outline-färgfixar i föregående pass; 1.99.37 helpers-registret). Löv-/net-/hotseat-extraktionerna bumpade INTE (byte-identiska). Server **1.8 → 1.9** (HELPER_KEYS-fix). Full klient/server-versionssynk fortfarande uppskjuten tills allt klart.

**Verifierat:** node-check rent; 12/12 klient + 3 server; alla extraktioner byte-identiska (cmp) i varje runda. **EJ** runtime/online-testat. Live att verifiera (Johan): helper-UI:t i Settings (av/på varje toggle, ladda om = persistens, Tournament gråar ut allt) — ska bete sig exakt som före registret; online låst-bord-test (hand/handReminder ska nu propagera från värd) med server 1.9 + klient 1.99.37 tillsammans.

**Levererade filer:** `elysium-vtes-bord.html` (1.99.37), `elysium-server.js` (1.9), `split_client.py` (13 fragment), `elysium-build.js`, `elysium-src/` (13 fragment + shell + manifest), `patch_helper_registry.py`, `elysium-relocation-brief.md` (ny — självständig brief för slutpasset), `test-client-logic.js`, `test-server-dispatch.js`, tre docs.
**7. State-kontraktets djuptester (12→16, steg 3).** Sviten hade redan `pubXform`/`pubInv`-inversen + `serialize→restore`-idempotens + fält-bevarande + `keepLog` + `buildPub`-hemlighet. Fyllde luckorna relokeringen stressar med fyra djuptester: **single-zone-invarianten** (`move` tar bort kortet ur gamla zonen *och* lägger det i nya; ett kort i exakt en zon), **attachment round-trip** (`host.attached` + `child.host` överlever serialize→restore — attachment-state är komplext), **id + x/y överlever round-trip**, och **buildPub-renhet** (stabil över anrop, muterar inte brädet). Harness:en (`elysium-test-harness.js`) har en *curated* expose-lista; la till `attach` + `place`. `attach()` kördes rent under DOM-stubben (faithful path — ingen manuell state-wiring behövdes). 16/16.

**8. Död-kod-svep slutfört (steg 2).** Analysens §2-inventering var **redan helt rensad** (alla 7 spårade symboler — `demoBoard`, `promptDemoTable`, `startDemoTable`, `fillTableDecks`, `applyL2Experiment`, `thump`, no-digit `.l2pane` — 0 förekomster; tidigare sveps (Session 17/18) + Fas 2-städning tog dem). En **färsk scan** (funktioner som bara förekommer 1 gång = definition utan anrop) hittade 7 till, bekräftade döda + borttagna: `cardColor` (superseded av owner-color-systemet 1.99.35/36), `burnRandomAsh` (ersatt av live `burnRandomAshN`), `strike` (föräldralöst audio, som `thump`), `giveCardTo` (ersatt av give-control; set-owner slopades), och de tre tidiga ljuden `sfxLock`/`sfxUnlock`/`sfxPlay` (gjordes före det dedikerade sfx-systemet; alla andra sfx-funktioner är wirade). **Ingen versionsbump** — de anropades aldrig (noll beteendeändring); HTML byte-mindre, 1.99.37 kvar. split→build→cmp byte-identisk, 16/16 + 3/3.

**Milstolpe — allt före relokeringen klart:** säkra extraktioner (net + hotseat), död-kod-svep, `state`-kontraktet (16). Det enda kvarvarande test-gapet är render/interaktion (inga ännu). Återstår av refaktorn: relokeringen som dedikerat slutpass.

**Nästa:** **relokeringen** (steg 4) — det dedikerade slutpasset, körbart i ny chatt per `elysium-relocation-brief.md` (disciplin-regeln: flytta bara funktions-deklarationer, aldrig top-level-satser; verifiera syntax + svit + live, inte cmp).

### Session 21 – Relokeringen: concern-gruppering av monoliten (25 juni)

Det sista steget i Fas 2: fysisk omordning av 42 funktioner i monoliten (`elysium-vtes-bord.html`) så att `state`, `render`, `input`, `escrow` och `navigation` grupperas i sammanhängande, markerade sektioner. Ingen versionsbump (beteende-neutral; function-deklarationer hissas). Klient **1.99.37** / server **1.9** oförändrade.

**Uppdatering:** efter att relokeringen verifierats bumpades båda till **2.0 / 2.0** — den strukturella refaktorn (Fas 1 + Fas 2) är komplett och förtjänar major-versionen. Den uppskjutna klient/server-synken är därmed löst.

**1. Utvärdering och planering.** Tre oberoende utvärderingar granskade `elysium-relocation-brief.md` mot den faktiska koden. Samtliga nådde samma slutsats: briefens disciplinregel är korrekt och tillräcklig, testnätet (16/16 + 3/3) räcker, render-piloten är rätt start. Utvärderingarna avslöjade fem konkreta fynd som briefen inte täckte:

- `let boardZoom=1` (rad 2104) och `let _lastHandHover=null` (rad 2247) sitter mitt i render-pilotens flytt-zon — frusna, måste stanna som glue.
- NET_END-ankaret i `split_client.py` (`function buildPub(){`) bryts när `buildPub` relokeras.
- `drag`/`giveDrag`/`tdrag` är `let`-satser (rad 2621/5605/8776), inte funktioner — briefens prose var missvisande.
- Input-concernen är ihålig: ~10 flyttbara namngivna funktioner men 24+ frusna inline `addEventListener`-callbacks utgör den faktiska input-logiken.
- Touch-roadmapen kan inte uppfyllas av relokeringen ensam — rörelsetrösklar sitter i inline-handlers som kräver ett separat handler-extraktionssteg.

**2. Beslut (Johans riktning).**

| Fråga | Beslut |
|-------|--------|
| Input-steget | Alternativ C: tunn gruppering i glue med sektionskommentar, inget eget fragment |
| Touch-roadmap | Frikopplad — separat arbetsström |
| View-switching | Eget nav-block i glue med sektionskommentar (för tunnt för eget fragment, konceptuellt navigation inte render) |
| Gränsfunktioner | `ensureImg`/`renderCounters`/`fitBoard`/`restack`/`cardTransform` → render; `regrabAtScale` → input; `expandStack`/`collapseStack` → glue |
| Escrow | → net.js; `let escrowTimer` kvar som glue |
| Splitter-ankare | Atomiskt per steg; NET_END → `let escrowTimer=null, lastHandSig='';` |

**3. Relokeringen (alla fyra steg i en körning).**

Ett Python-skript (`relocate.py`) med brace-counting-parser (strängmedveten, kommentarmedveten, hanterar `async function` och default-param-braces som `opts={}`) identifierade och flyttade 42 funktioner:

| Concern | Funktioner | Från → Till |
|---------|-----------|-------------|
| **State** (14) | `pubXform`, `pubInv`, `readyToCanon`, `makeCard`, `topHost`, `isInStackOf`, `detachFromHost`, `releaseChildren`, `dropLocal`, `attach`, `move`, `serializeGame`, `restoreGame`, `buildPub` | Utspridda (rad 1975–7324) → samlat kluster (rad ~7332) |
| **Render** (10) | `ensureImg`, `renderCounters`, `fitBoard`, `layout`, `layoutZone`, `restack`, `cardTransform`, `place`, `updateBadges`, `animCard` | Tidig region (rad 2011–2309) → före render-tail (rad ~7589) |
| **Input** (13) | `regrabAtScale`, `clearSel`, `deselect`, `selectOnly`, `addSel`, `activeAnchor`, `bindCard`, `tap`, `dropCard`, `groupDrop`, `dropZone`, `attachTargetAt`, `qrDragGive` | Utspridda → samlad grupp (rad ~7788) |
| **Escrow** (5) | `ensureEscrowKey`, `serializeHand`, `restoreHand`, `tryRestoreHandBlob`, `pushEscrow` | app-4 glue → net.js body (rad ~6669) |

Disciplinregeln följdes strikt: **bara `function`/`async function`-deklarationer flyttades**. Alla 116 `const`/`let` och 33 top-level `addEventListener`-satser stannade på plats. Sektionskommentarer infogades vid varje concern-grupp + nav-blocket.

**4. Splitter-uppdatering.** NET_END-ankaret ändrades från `function buildPub(){` till `let escrowTimer=null, lastHandSig='';` — den frusna `let`-deklarationen strax efter escrow-funktionernas nya position i net-kroppen. Net-fragmentet växte till ~40 KB (nu inkl. escrow). `const PUBZ`, `netGame`, `setPileN`, `schedulePush` ingår nu i net-kroppen (de sitter före `let escrowTimer`). Alla 13 fragment bibehålls; strukturen ändras men fragmentnamnen är stabila.

**5. Verifiering.**

| Gate | Resultat |
|------|----------|
| `node --check` (JS-syntax) | ✓ Ren |
| `test-client-logic.js` | **16/16** |
| `test-server-dispatch.js` | **3/3** |
| `split_client.py` | 13 fragment, split OK |
| `elysium-build.js` → `cmp` | Split→build = **byte-identisk round-trip** |
| Live-test (Johan) | **Väntar** — render/interaktion har 0 testsvit-täckning |

**6. Reflektiv analys — kodmognad efter refaktorn.**

| Område | Bedömning | Mest värdefullt härnäst |
|--------|-----------|------------------------|
| Best practice | **Starkt** — handler-maps, Promise-modaler, HELPER_DEFS, B1 med 13 fragment, concern-grupperad | Handler-body-extraktion (inline callbacks → namngivna fn) |
| Funktionalitet | **Komplett** för kärnspelet (solo + hotseat + online) | Touch-stöd (separat arbetsström) |
| Prestanda | **Mer än tillräckligt** — noll-beroendefilosofi, VTES-skalor (5–25 kort i play) gör JS-logik försumbar | Inget akut |
| Driftsäkerhet | **Bra** state-kontrakt (16), **svagt** render/input (0) | Render/interaction-tester |

Tre specifika skulder noterades: (1) render/interaktion har noll tester (Johans live-test är den enda grinden); (2) serverns `writeFileSync` blockerar event-loopen vid rum-snapshots; (3) ingen rate-limiting klient→server (acceptabelt i "vänner runt ett bord"-modellen men en risk vid bredare användning).

**Fragment-landskap (oförändrat antal, reorganiserat innehåll):** `app-1 · decklab-editor · app-2 · tokens-engine · app-3 · esc-crypto · net(+escrow) · app-4 · hotseat · app-5(state+render+input) · sfx-audio · fx-anim · app-6`.

**Levererade filer:** `elysium-vtes-bord.html` (1.99.37, relokerad), `split_client.py` (uppdaterat NET_END), `elysium-build.js`, `elysium-relocation-plan.md` (konsoliderad plan), `relocate.py` (relokeringsskriptet), `elysium-src/` (13 fragment), testfiler + server.

**Milstolpe — Fas 2 klar.** Refaktorns alla steg slutförda: handler-maps, modaler, B1-konkatenator, löv-extraktion, helpers-registret, net + hotseat core seams, dead-code-svep, state-kontrakttester, och relokeringen. Koden är concern-grupperad, testskyddad, och redo för nya features.

**Nästa (framtida arbetsströmmar):** touch-stöd (separat: kräver handler-body-extraktion först), render/interaktionstester (det största driftsäkerhetsgapet), vote/referendum-helper, L3-polish, leading-edge push.

### Session 22 – L4 "Classic" Free Board: infrastruktur (25 juni)

Ny feature: **Board Mode** — ett exklusivt val mellan **Structured** (L2+L3, befintligt beteende) och **Classic** (L4, fritt bord utan zoner, Lackey-stil). Valet görs vid spelstart i lobbyn (online) eller hotseat-setup, och styr vilka vyer som finns. I Classic finns bara L4 (en enda vy, ingen stepping/cycling); i Structured finns L2+L3 som tidigare.

**Namngivningen:** "Classic" = fritt bord (vad Lackey-spelare är vana vid), "Structured" = Elysiums guidade upplevelse med zoner och helpers.

**1. S1 — net.boardMode infrastruktur (detta steg).**

Klient (17 edits) + server (5 edits). Alla assert-skyddade, syntax OK, 16/16 + 3/3 tester gröna.

| Komponent | Vad |
|-----------|-----|
| `net.boardMode` | Nytt fält: `'structured'` (default) eller `'classic'`. Initialiserat, reset i `leaveHotseat()`/`mpLeave()` |
| Lobby HTML | Ny "Board style" `<select id="mpBoard">` i `#mpModal` (Create Room) med Structured/Classic |
| Hotseat HTML | Ny "Board style" `<select id="offBoard">` i `#offlineModal` |
| `mpCreate()` | Skickar `boardMode` till servern |
| Server | Lagrar `room.boardMode`, validerar (`'classic'` eller default `'structured'`), relayar i `joinReply`/`started`/`took`/spectator-join |
| `joined`/`started`/`took` | Alla tre mottar `m.boardMode` → `net.boardMode` |
| `startHotseat(players, boardMode)` | Nytt `boardMode`-argument; `startOfflineFromCfg()` läser `$('#offBoard').value` |
| `freeBoard()` | Gate-helper: `return net.boardMode==='classic'` |
| `l4on()` | Gate-helper: `return board.classList.contains('l4mode')` |
| `baseView()` | `freeBoard() ? 'l4' : 'l2'` |
| `levelOrder()` | `freeBoard() ? ['l4'] : ['l2','ov']` |
| `cycleView()` | `if(freeBoard()) return;` — no-op i Classic |
| `stepLevel()` | Clampad till single-element `['l4']` i Classic |
| `switchView()` | Hanterar `'l4'` target: exit/enter-path, `body.inl4` CSS-class |
| `enterL4()`/`exitL4()` | Stubs: `board.classList.add/remove('l4mode')` + `fitBoard()` + `layout()` |

**EJ ändrat:** Ingen versionsbump (S1 är infrastruktur, inget synligt beteende ännu). Splitter-ankare oförändrade (enterL4/exitL4 sitter tryggt i app-5-glue).

**Nästa:** S2 — L4 board rendering (filt, mittsektionen med timer/round/edge, zoom+help-knappar, gömda zoner, fri kortplacering).

**2. S2 — L4 board rendering.**

Fullständig `enterL4()`/`exitL4()`/`renderL4()` som ersätter S1:s stubs.

**Arkitektonisk insikt:** L4 bygger PÅ L3:s infrastruktur (`l3mode` + `l4mode` på board). Alla L3-mekanismer — zoom/pan (`l3zoom`/`l3pan`/`applyL3Transform`), dock-panelen (`#l2dock`/`l2dockopen`), hand-hovring (`positionL3Hand`), scroll-to-zoom, drag-to-pan — återanvänds rakt av via `l3on() === true`. Skillnaden: L4 har inga motståndare-mattor och sätter `l3myslot` till hela filtets yta istället för en slot.

| Komponent | Vad |
|-----------|-----|
| **CSS** (6 regler) | `#board.l4mode` gömmer zon-ramar (transparent border), zon-labels, poolWrap; `body.inl4` styr zoom-panelen |
| **`enterL4()`** | Speglar `enterL3()`: sätter `l2mode`+`l3mode`+`l4mode`, visar zoom+help-knappar (samma position), gömmer hand/ready-tabs, nollställer zoom/pan, anropar `renderL4()` |
| **`exitL4()`** | Speglar `exitL3()`: tar bort alla tre board-klasser, återställer tabs + knappar, anropar `clearL3()` (samma cleanup — reset l2pub, radera stage/timer) |
| **`renderL4()`** | Skapar `#l3stage` med bordsbakgrund + center-timer. Sätter `l3myslot = {hela filtets yta}` + `l3clockCy = H*0.45`. Anropar `setCenterFrameA()` som sätter upp `l2pub` korrekt (kort i `ready` renderas via `pubXform` precis som i L3). Edge-knappen positionerad under timern. |

**Zoom/pan/dock-pipeline i L4:**
`scrollhjul` → `l3zoomTo()` → `applyL3Transform()` → `l3applyStageTransform()` (stage-element) + `setCenterFrameA(l3myslot)` (l2pub + kort) + `placeToken(edge)` + `layout()`. Exakt samma flow som L3 — gate-funktionen `l3on()` returnerar `true` i båda.

**Verifierat:** syntax OK, 16/16 + 3/3. **Live-test väntar:** bordsytan med filt, center-timer, edge-knapp, zoom/pan, dock-panel (crypt/library/ash/hand/pool).

**3. S3 — L4 pool-glober.**

Per-spelare dragbara pool-glober på det fria bordet. Eget system (`l4Globes` Map) parallellt med token-familjen — pool-glober har egen rendering, drag-binding och interaktionsmönster men samma placeringspipeline (`pubXform`/`pubInv` för zoom/pan).

| Komponent | Vad |
|-----------|-----|
| **CSS** (7 regler) | `.l4globe` visuell design: Cinzel-etikett med spelardot + 🪑-nummer, 64px röd radiell-gradient glob med pool-siffra, drag-state shadow |
| `l4Globes` Map | `seat → {seat, el, x, y, z, mine}` — registrerar alla aktiva glober |
| `createL4Globe(seat, name, pool, mine)` | Skapar glob-element, binder drag (egen glob) + scroll-wheel (`bumpPool`) + högerklick (`selfPoolMenuItems` / `oppPoolMenuItems`) |
| `placeL4Globe(glob)` | Placerar via `pubXform` (zoom/pan-medveten, precis som tokens) |
| `layoutL4Globes()` | Anropas från `layout()` efter `layoutTokens()` — re-placerar alla glober vid zoom/pan |
| `renderL4Globes()` | Anropas från `renderL4()` — skapar en glob per icke-vakant spelare, placerar i cirkel runt center (cx=502, cy=250, R skalas med spelarantal) |
| `updateL4GlobePool(seat, pool)` | Uppdaterar pool-siffran i en specifik glob — anropas från `updatePool()` för egen glob |
| `clearL4Globes()` | Rensar alla glober — anropas från `exitL4()` |
| `bindL4GlobeDrag(glob)` | Drag-binding: pointerdown/move/up med `pubInv` för kanonisk position, pointer capture, grab-cursor |

**Integration i befintlig kod:**
- `renderL4()` → `renderL4Globes()` sist
- `layout()` → `layoutL4Globes()` efter `layoutTokens()`
- `updatePool()` → `updateL4GlobePool(mySeat(), state.pool)` (gated `l4on()`)
- `exitL4()` → `clearL4Globes()` före `clearL3()`

**Verifierat:** syntax OK, 16/16 + 3/3. **Live-test väntar:** globerna synliga, dragbara, scroll-pool, högerklicksmeny, korrekt zoom/pan-beteende.

**4. S4 — Kort i L4: ingen auto-deal, fri placering.**

Klient (5 edits) + server (4 edits). Alla assert-skyddade, syntax OK, 16/16 + 3/3.

| Komponent | Vad |
|-----------|-----|
| **Crypt auto-deal gate** | `dealOpeningSync()` + `dealOpening()`: `if(!freeBoard())` runt crypt-loopen. Library-kort delas fortfarande ut till hand (7 kort). |
| **Server `dealNow(p, room)`** | Ny `room`-parameter. `if(!room \|\| room.boardMode !== 'classic')` runt crypt-loopen. Alla 3 callers uppdaterade. |
| **`dealt` handler** | Klient-side: `if(!freeBoard())` runt `m.unc`-placeringen (redo för när servern skickar tom unc i Classic). |
| **Deal-loggar** | Konditionella logmeddelanden: Classic → "draw crypt cards manually from the dock"; Structured → befintligt meddelande. |
| **`layoutZone` torpor/unc i L4** | Ny `if(l4on())` gren: fri placering som ready-zonen — använder `c.x, c.y` direkt. Nydragda kort (x=0, y=0) får slumpmässig startposition nära center (320–680, 180–420 i kanoniska koordinater). Stöd för attached-kort-stacking. |

**Spelflöde i Classic/L4:**
1. `startHotseat(players, 'classic')` → deck byggs, INGEN crypt-deal, 7 library → hand
2. Spelaren öppnar docken → ser crypt-högen → klickar/drar för att dra crypt-kort → kortet hamnar i `uncontrolled` (logisk zon, renderas fritt på brädet)
3. Spelaren drar kortet till önskad plats → `dropCard` sparar kanonisk position → kort stannar där

**Verifierat:** syntax OK (klient + server), 16/16 + 3/3. **Live-test väntar:** starta Classic hotseat, verifiera att bara 7 library-kort delas ut (inga 4 crypt på brädet), dra crypt-kort manuellt, verifiera att de placeras fritt.

**5. S5 — Pool-globfärg + L4 outline-gate.**

10 edits, syntax OK, 16/16 + 3/3.

| Komponent | Vad |
|-----------|-----|
| `conv.poolPlayerColor` | Ny boolean (default `false`). Laddas/sparas i `loadConv`/`saveConv`. |
| Settings UI | Ny checkbox "Pool globe in player colour" under pcoNeutral |
| `poolGradient(hex)` | Beräknar sfärisk `radial-gradient` från vilken hex-färg som helst: `hi()` (30% ljusare), bas, `lo()` (65% mörkare) |
| `refreshPoolColor()` | Sätter/rensar inline `background` på `#pool` + `#dockPool`. Anropas vid setting-ändring. |
| L4 globes | `updateL4GlobeHTML`: inline `background:poolGradient(colHex)` när inställningen är på |
| buildMat globes | L3/L2 opponent-mattor: `_matPoolBg` variabel med konditionell gradient |
| Outline gate | `showOwnerOutline`: `!freeBoard()` runt `pcoHome`-villkoret — i L4 gäller bara `conv.pco` (on/mine/all) |

**Milstolpe — S1–S5 klara.** L4 Classic Free Board är funktionellt spelbart i hotseat med pool-glober, fri kortplacering, ingen auto-deal, zoom/pan, dock-panel, spelarfärgade glober (valfritt), och korrekt outline-beteende. S6 (online glob-positioner i buildPub) kvarstår.

**6. S6 — Online glob-sync + renderL3-guards.**

5 edits, syntax OK, 16/16 + 3/3.

| Komponent | Vad |
|-----------|-----|
| **buildPub tokens** | Exporterar egen pool-globs kanoniska position: `{type:'pool', x, y}` i tokens-arrayen. Opponents ser var du placerat din glob. |
| **`updateL4Opponents()`** | Ny funktion: itererar `l4Globes`, uppdaterar motståndares pool-värde från `net.boards[seat].pub.pool` + position från `pub.tokens` pool-entry. Anropas vid board-uppdateringar i L4. |
| **Board handler** | Ny L4-gren: `else if(net.view==='l4') updateL4Opponents()` — uppdaterar glob-displayen utan att bygga om hela bordet. |
| **renderL3-guards (3 ställen)** | `edgeTakeover`: `if(l3on()&&!l4on())`. `hostSetPoolHot` + `hostOustHot`: `if(l4on()) updateL4Opponents(); else if(l3on()) renderL3()`. Förhindrar att L3-mattor skapas på L4-bordet. |

**Online-flöde i L4 Classic:**
1. Spelare A drar sin pool-glob → `placeL4Globe` uppdaterar kanonisk position → `schedulePush` → `buildPub` inkluderar `{type:'pool', x, y}` i tokens
2. Server relayar A:s board till spelare B → `board(m)` handler → `updateL4Opponents()` → B:s kopia av A:s glob flyttar till den nya positionen
3. Pool-ändringar: A scrollar → `bumpPool` → `updatePool` → `schedulePush` → B:s board handler → `updateL4GlobePool` uppdaterar siffran

**Milstolpe — S1–S6 komplett.** L4 Classic Free Board är funktionellt komplett: spelbart i hotseat OCH online, med pool-glober, fri kortplacering, zoom/pan, spelarfärger, och korrekt outline-beteende.

---

## Session 22b – L4 Classic: Polish, Buggfixar & Features (25 juni, forts.)

Efter S1–S6 (grundimplementeringen) följde en intensiv polish- och buggfixrunda baserad på Johans live-testning i hotseat. Alla ändringar nedan är verifierade (syntax OK, 16/16 + 3/3) men online-test saknas.

### Defaults
- **Classic + Tournament Mode som default** vid spelstart (dropdown-ordningen flippade i lobby + hotseat-setup). Tournament Mode var redan default `true` sedan v1.99.37.

### Interaktions-modell
- **Dubbelklick face-down = flip** (alla vyer). Face-down kort kan aldrig ta actions så lock/unlock är meningslöst. Lock/unlock via högerklicksmeny för de sällsynta undantagen.
- **Dubbelklick+hold = pan** i L4 (enkelklick+drag = markeringsrektangel/lasso). Första klicken registreras, andra inom 380ms aktiverar pan. Eventuell markering från första klicken avbryts. L3 Structured oförändrat (bar felt pannar, zoner lassomar).
- **Dock stängs inte tvångsmässigt vid drag** — borttagen `setL2Dock(false)` vid drag-start. Hover-logiken (öppna vid ≥H-36px, stänga vid <66%) hanterar dock-state under drag. Kortet stannar i docken tills det dras ut.

### Skalning & element-storlek
- **`L4_CARD_S = 0.5`, `L4_TOKEN_S = 0.7`** — centrala konstanter för L4-elementskalning. Kort vid 50%, tokens/glober vid 70%. Appliceras i `place()`, `placeToken()`, `placeL4Globe()`, `regrabAtScale`, drag-move (`sc`), gruppdrag (`ms`). En rad att ändra för att justera proportioner.
- **Zoom-min sänkt till 0.2** (slider + `l3zoomTo` clamp). Förut 0.6 → vår `l3zoom=0.45` ignorerades tyst. L4 startar nu vid zoom 1.0 med elementmultiplikatorer istället.
- **Ghost-skalning** för crypt/library-drag: ghost-elementet skalas till `fitScale × l2pub.s × L4_CARD_S` i L4. Transform resettas vid cleanup.
- **Drop-offset** korrigerad: `CW/2` → `CW × l2pub.s × L4_CARD_S / 2` i L4 så kortet centreras under pekaren.
- **Regrab-fix** (`regrabAtScale`): L4-multiplikatorn inkluderad så kortet inte hoppar vid drag-start från docken.

### Drop & Clamp
- **`dropZone()` i L4**: bara dock-zoner (crypt/lib/ash/hand) hit-testar; allt annat → `ready`. Förhindrar att osynliga torpor/uncontrolled-zonboxar fångar drops.
- **Ready-clamp i L4**: hela bordet `{x:0, y:0, w:boardW, h:boardH}` med PAD=2, istället för pubBox (som hade L2GEO-marginaler).
- **`ecw/ech` fix** i `dropCard` + `groupDrop`: inkluderar `L4_CARD_S` i effektiv kortstorlek. Utan fixet trodde clampen att kort var dubbelt så breda → snappade mot kanten. 
- **Edge-token fri placering**: `!l4on()` guard på ready-zone-checken. I L3 måste Edge landa i en Ready-zon; i L4 faller den igenom till fri placering via `pubInv`.
- **Token/glob edge-clamp**: display-koordinater clampas till `[0, boardW - elementSize]` innan `pubInv` vid drop.
- **Crypt/library drop-clamp**: samma fullboard-mönster med skalad kortstorlek.

### Pool-glober
- **+/- knappar** på egen glob (hover-reveal, vänster/höger). Event-delegation på glob-elementet (överlever innerHTML-uppdateringar). Drag-handler guardar mot knappklick.
- **Scroll stopPropagation** — förhindrar att board-zoom triggas vid pool-scroll.
- **Motståndarglober passiva**: `cursor:default` (ej grab), inga +/- knappar renderas, `.l4globe-mine`-specifik CSS för drag/hover-effekter.
- **Klansymbol i L4-glober**: `updateL4GlobeHTML` inkluderar `.clansym-pool` overlay. Egen glob: `activeClan()`, motståndare: `pub.clan`. `refreshClanDisplay()` uppdaterar L4-globen.
- **Drag-lyft borttagen**: glob: subtil mässingsoutline (1.5px, outline-offset 2px). Edge-token: oförändrad skugga vid drag.

### Opponent-kort på bordet
- **`renderL4OppCards()`**: ny funktion som itererar `net.boards[seat].pub.cards` och renderar motståndarkort direkt på L4-bordet via `addRCard`. Wrapper `#l4oppWrap` (pointer-events:none, kort auto). Inkluderar spelarfärg-outline, blood/blue/green-tokens, attached kort, target-markering, hover-preview, action FX.
- **Uppdateras vid**: `board(m)` handler, zoom/pan (`layout()`), hotseat sätesbyte.

### Nya features
- **Align side by side** (`groupAlign(base)` + menyval + hotkey `A`): markerade kort i en rak linje, ankrat från högerklickat kort. Spacing = `CW × L4_CARD_S` (noll gap).
- **Convert to vampire** (`convertCardKind(c, toCrypt)`): library-kort i spel kan konverteras till vampyrer. Får vampyr-meny (torpor, burned), crypt-baksida, uppdaterad klan-detektion. Reversibelt ("Revert to library card"). `c.converted` flag persisteras i snapshot + serializeGame + buildPub.
- **Pulsande hint vid spelstart**: "Drag your <span style='color:hex'>pool globe</span> to your seat position" — Cinzel-font, spelarfärg-glow, försvinner vid första glob-drag, gömmer sig vid "Your turn!".

### Dock & Zoner
- **Zonlabels i docken synliga** — CSS-regeln begränsad till `#z-ready`/`#z-uncontrolled`/`#z-torpor` (boardytans zoner), inte dock-zonerna.

### Övrigt
- **Flip-animation oförändrad** — experimenterade med förlängd duration och justerade keyframes, men reverterade till original (1.15s, 76%, 50% rotation).
- **KRCG Path-fält**: PR #830 (öppnad 25 juni 2026 av Spigushe) lägger till `Card.path` för V5 Sabbat crypt-kort. Ej mergad än. Elysium-stöd planerat (Path-ikon på glober, Choose Path-meny på Sabbat-vampyrer, auto-detektion).

---

## Planerad feature: Path of Enlightenment (V5 Sabbat)

> **Status: designad, ej implementerad.** KRCG PR #830 (öppnad 25 juni 2026 av Spigushe) lägger till `Card.path` i vtes.json. PR:n är OPEN — fältet finns inte i produktionsdata än. Elysium kan preppa all UI/logik redan nu; KRCG-integrationen aktiveras när PR:n mergas.

### Bakgrund — VTES-regler

I Sabbat V5-expansionen (BCP, release 2025-10-26) introducerades fyra **Paths of Enlightenment** som nytt spelkoncept:

| Path | Precon-deck |
|------|-------------|
| Path of Caine | Path of Caine |
| Path of Cathari | Path of Cathari |
| Path of Death and the Soul | Path of Death |
| Path of Power and the Inner Voice | Path of Power |

**Regelmekanism:** Alla Sabbat-vampyrer (inklusive äldre pre-V5 kort med "Sabbat" i card_text) kan **välja en Path** genom att bränna 1 blod under influence phase. De nya V5 Sabbat-korten har en tryckt path (i VEKN CSV:s "Path"-kolumn). Path ger vampyren tillgång till path-specifika kort och effekter.

### KRCG-data (PR #830)

**PR:** `github.com/lionel-panhaleux/krcg/pull/830`
**Författare:** Spigushe (gurchon-hall/krcg-fork)
**Datum:** 25 juni 2026
**Status:** OPEN (ej mergad)

**Vad PR:n gör:**
- Läser VEKN CSV:s "Path"-kolumn
- Exponerar `Card.path` på crypt-kort (`None` för library/icke-Sabbat)
- Serialiserar fältet i `to_json()` → dyker upp i `vtes.json` som `"path": "Path of Caine"` etc.
- Test: `pytest tests/test_vtes.py::test_path`

**Konsekvens för Elysium:** När PR:n mergas och `static.krcg.org/data/vtes.json` uppdateras kommer Elysium att kunna läsa `path` från kortdata vid deck-import och card-info-laddning. Kort med tryckt path får automatisk default.

### Teknisk design för Elysium

#### Steg 1 — Data & konstanter

```javascript
const PATHS = {
  'Path of Caine':                    { short: 'Caine',  icon: '☽' },
  'Path of Cathari':                  { short: 'Cathari', icon: '♱' },
  'Path of Death and the Soul':       { short: 'Death',  icon: '☠' },
  'Path of Power and the Inner Voice':{ short: 'Power',  icon: '⚜' }
};
```

**Ikonkällor att undersöka:**
- KRCG kan ha path-ikoner under `static.krcg.org/svg/` eller i vtes-clans.otf (Sabbat V5-uppdateringen kan ha lagt till path-glyphs)
- Fallback: text-badges med `PATHS[name].short` + CSS-styling liknande klanbadgen
- Om KRCG har SVG:er → `pathSymUrl(path)` analogt med `clanSymUrl(clan)`

**Ny card property:** `c.path` — sätts vid:
1. Kortdata från KRCG (`cardInfo.get(name).path`) vid deal/import (automatisk)
2. Manuell konvertering via högerklicksmeny ("Choose Path →")
3. Deserialisering (snapshot/serializeGame/restoreGame)

**Serialisering — alla ställen som behöver `path`:**
- `serializeGame()` → `path: c.path || undefined`
- `snapshot()` → `path: c.path || undefined`
- `restoreSnap()` → `c.path = sc.path || null`
- `restoreGame()` → läser `path` från sparad data
- `buildPub()` → `path: c.path || undefined` (motståndare ser pathen)
- `serializeHand()` → `path: c.path || undefined`

#### Steg 2 — Högerklick på Sabbat-vampyrer: "Choose Path →"

**Gate-villkor:** `c.kind === 'crypt'` OCH (kortets card_text innehåller "Sabbat" ELLER `c.path` redan satt) OCH kortet är i spel (`COUNTER_ZONES.includes(c.zone)`).

**Meny-struktur:**
```
Choose Path → [submeny]
  ├ Path of Caine
  ├ Path of Cathari  
  ├ Path of Death and the Soul
  └ Path of Power and the Inner Voice
```
Om `c.path` redan är satt → visa istället:
```
Path: [nuvarande path]  (grå, informativ)
Remove Path             (rensa c.path)
Change Path →           [samma submeny]
```

**Implementering:**
```javascript
function setCardPath(c, pathName){
  pushUndo();
  c.path = pathName || null;
  // Uppdatera visuell path-ikon på kortet (se Steg 2b)
  updateClan(); // path kan påverka glob-ikon
  layout();
  schedulePush();
  log(cardRefCap(c) + (pathName ? ' chose ' + pathName + '.' : ': path removed.'));
}
```

**Visuell path-ikon på kortet:** En liten path-badge centrerad på kortets yta (liknande `.cchip` men med path-ikon). CSS-klass `.pathbadge` med `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)`. Renderas i `addCard()`/`updateBadges()` eller som separat overlay. Ska vara synlig men inte blockera kortbilden — halvtransparent bakgrund.

#### Steg 3 — Auto-detektion: `detectPath()` / `activePath()`

Samma mönster som `detectClan()` / `activeClan()`:

```javascript
function detectPath(){
  // Räkna paths på ready-vampyrer (c.kind==='crypt' && c.zone==='ready' && !c.faceDown && c.path)
  const counts = new Map();
  state.zones.ready.forEach(id => {
    const c = state.cards.get(id);
    if(c && c.kind==='crypt' && !c.faceDown && c.path){
      counts.set(c.path, (counts.get(c.path)||0) + 1);
    }
  });
  if(!counts.size) return null;
  // Returnera path med flest vampyrer
  let best=null, bestN=0;
  counts.forEach((n, p) => { if(n > bestN){ best=p; bestN=n; } });
  return best;
}

state.myPath = null;     // auto-detected
state.chosenPath = null;  // manual override

function activePath(){
  return state.chosenPath || state.myPath || null;
}
```

**Glob-ikon prioritet:**
1. Om `activePath()` har fler vampyrer än `activeClan()` → visa path-ikon på pool-globen
2. Vid lika antal → klan vinner (default)
3. Manuell override (`chosenClan`/`chosenPath`) trumfar alltid auto-detektion
4. `refreshClanDisplay()` uppdateras att hantera path-vs-klan logiken

#### Steg 4 — Pool-glob högerklicksmeny

Utöka `selfPoolMenuItems()`:
```
Choose Clan → [befintlig submeny]
Choose Path → [submeny med 4 paths + "Clear"]
```

`state.chosenPath` sparas i `serializeGame` + `conv` (persistent val).

#### Steg 5 — KRCG-integration (aktiveras när PR #830 mergas)

**I `loadCardInfo()` (vtes.json-parsern):**
```javascript
// Befintlig: ri.types, ri.cap, ri.disc, ri.text
// Ny:
ri.path = card.path || null;  // "Path of Caine" etc., null för icke-Sabbat
```

**I `dealOpening` / import-flow:**
```javascript
// När ett kort skapas med känd KRCG-data:
if(cardInfo && cardInfo.get(norm(c.name))?.path){
  c.path = cardInfo.get(norm(c.name)).path;
}
```

**I card preview-panelen:**
```javascript
// Visa path i ri-meta om den finns:
meta = ri.types + (ri.cap ? ' · cap ' + ri.cap : '') 
     + (ri.disc ? ' · ' + ri.disc : '')
     + (ri.path ? ' · ' + ri.path : '');
```

### Verifieringsplan

1. **Utan KRCG-data:** Skapa spel, dra Sabbat-vampyr → högerklick → "Choose Path" → välj path → path-ikon visas på kortet + glob uppdateras
2. **Med KRCG-data (efter PR merge):** Importera Sabbat V5-deck → kort med tryckt path har path-ikon automatiskt
3. **Auto-detektion:** Spela 3 vampyrer med samma path → glob-ikon byter till path
4. **Serialisering:** Spara → ladda → path-ikonerna kvarstår
5. **Online:** Motståndare ser path-ikonen på kortet + globen
6. **Undo:** Ctrl+Z efter "Choose Path" → pathen försvinner
7. **Convert to vampire + Path:** Konvertera library → vampire → Choose Path → båda flaggor persisterar

### Öppna designfrågor

1. **Path-ikonkälla:** SVG från KRCG, Unicode-symboler, eller egengjorda? Behöver undersökas om KRCG:s vtes-clans.otf uppdaterats med path-glyphs.
2. **Path-ikon på kortet:** Vilken storlek/position? Centrerat? Nedre kant? Ska den synas genom kortbilden (overlay) eller bara på face-down-kort?
3. **Sabbat-detektion:** Hur avgör vi om en vampyr är Sabbat? `card_text.includes('Sabbat')` funkar för de flesta, men edge cases (kort med "Sabbat" i regeltext som inte är Sabbat-vampyrer) behöver granskas. KRCG:s `sect` fält (om det finns) vore bättre.
4. **Path-val persistens:** Ska `chosenPath` vara `conv` (lokal preference, överlever spel) eller `state` (per-spel)? Klan-valet (`chosenClan`) sitter i `state` → path bör matcha.

### Session 23 – v2.1: L2-tabbar + L4 token drag-fix (26 juni)

**L2 Prey/Predator-tabbar persisterar vid utfällning.**
I L2 Home försvann Prey/Predator-tabbarna när deras kolumner fälldes ut. Spelarna tvingades byta mental modell: "klicka tabben → öppna" vs "klicka remsan uppe i kolumnen → stänga". Fix: i `l2syncTabs()` ändrades `tab.classList.toggle('l2tabhide', !pp || shown)` till `!pp`. Tabben sitter `position:fixed` z:630 ovanpå kolumnens z:60, `toggleL2Fold` flippar redan åt båda hållen, `l2tabon`-klassen ger öppen-feedback. Kolumnhuvud-remsan funkar fortfarande parallellt.

**L4 token/globe drag: skalbugg + drag-skugga.**
Edge-token och pool-globen hoppade till ~43% större vid drag-start i L4 — `pointermove` använde `l2pub.s` men `placeToken`/`placeL4Globe` multiplicerar med `L4_TOKEN_S` (0.7). Fix: `*(l4on()?L4_TOKEN_S:1)` i båda drag-handlerna. Lade även till `filter:drop-shadow(0 12px 20px rgba(0,0,0,.8))` på `.token.dragging` och `.l4globe-mine.dragging` för samma visuella "lyft"-skugga som kort har.

**L4 kort-attachment hit-box: skalbugg.**
`attachTargetAt` beräknade hit-boxen med `l2pub.s` men kort renderas vid `l2pub.s * L4_CARD_S` (0.5). Hitboxen var 2× den visuella kortstorleken → kort fäste sig vid målkort som syntes långt bort, och "snappade tillbaka" när de hoppade till den falska värdens position. Fix: `*(l4on()?L4_CARD_S:1)` — samma mönster som token-fixen och den befintliga card-drag-skalan.

**L4 kantmarginal borttagen.**
`PAD` i `dropCard` och `groupDrop` sänkt från 2 till 0 för L4, så kort kan läggas kant-i-kant med bordskanten för att maximera spelyta.

**Dock pool-glob klansymbol.**
`refreshClanDisplay()` injicerade bara klansymbolen (`.clansym-pool`) i `#pool` (huvudgloben), inte i `#dockPool` (docken i L2/L3/L4). CSS:en fanns redan — bara JS-injektionen saknades. Lade till samma logik för `#dockPool`.

**L4 dock: fördröjd stängning + skalövergång vid hand-drag + drag-to-reopen.**
Docken stängdes direkt och kortet skalades till bords-storlek vid hand-drag start (L3-beteende). I L4 förblir nu BÅDE docken öppen OCH kortet vid dockskala (s=1) — ingen `regrabAtScale` vid start, bara `drag.l4DockDefer=true`. Skalövergången sker först när markören lämnar dockområdet (ovanför `H*0.66`): `regrabAtScale(c, drag, boardScale)` körs, docken stängs, kortet krymper. Övergångarna körs FÖRE x,y-beräkningen i pointermove så att `regrabAtScale`-offseten matar samma frames koordinater. Drag-to-reopen (`yd >= H-36`) öppnar docken igen med `setL2Dock(true,true)` + `regrabAtScale(c, drag, 1)` (tillbaka till dockskala). L2 columns behåller sin befintliga drag-to-reopen. L3 oförändrat (direkt stängning + skalning).

**Verifierat:** syntaxrent, 16/16 klienttester, 3/3 servertester. Live-test väntar.

**Handkort hover-flyt i L4-docken.**
`.handhover` (float up 26px + z:4800) blockerades i L4 av guarden `!(l3on() && !l3handOpen)` — `l3handOpen` (den parkerade L3-overlayen) är alltid false, docken använder `l2dockopen`. Lade till `&& !board.classList.contains('l2dockopen')` så att hovern funkar när docken är öppen.

**Pile-kort (crypt/library/ash) dock-drag skalfixar (L2/L3/L4).**
Bara hand-kort hanterades vid drag från docken — pile-kort stannade vid s=1 under hela drag och hoppade till bordskala vid drop. Tre ändringar: (1) first-motion utökad från `c.zone==='hand'` till `|| PILES.includes(c.zone)` — L4 sätter `l4DockDefer`, L3/L2-columns kör `regrabAtScale` direkt (dockstängning villkorad till hand). (2) Drag `sc` inkluderar nu `drag.moved && PILES.includes(c.zone)`. (3) L4 dock-exit stänger inte docken för pile-kort; dock-enter hanterar redan-öppen dock.

**Edge-knapp z-index under öppen dock.**
`#edge` satt på z:4700, ovanför dock-bakgrunden (z:4400) och dockzonerna (z:4600) → flöt ovanpå den öppna docken i L3/L4. Lade till `#board.l3mode.l2dockopen #edge{ z-index:4300 }` för att sänka den under dock-bakgrunden.

**Stackade barn osynliga för placeringssystem.**
Attached kort (barn som rider på en värd) påverkar inte längre andra korts placering: (1) `attachTargetAt` filtrerar `!t.host` → barn kan inte vara falska fästningsmål, bara värdar/fristående. (2) `nudgeFree` hoppar över `oc.host` → barn knuffar inte nyplacerade kort. Barn förblir hoverbara och previewbara — bara deras kollisionsfotavtryck undertrycks. Gäller alla vyer.

**Enhetligt dödutrymme i L3/L4 — brädet fyller `#tableArea` via `l2cols`.**
L3/L4 använde fast 1004×616 + CSS-skalning → två separata dödutrymmen (brädets filt inuti, `#tableArea`-bakgrund utanför). Nu lägger `enterL3`/`enterL4` till `l2cols`-klassen → `#board` fyller hela `#tableArea` via `inset:0; width:auto; height:auto; transform:none`. Allt dödutrymme är inuti brädet (filtbakgrund). `fitBoard` uppdaterad att returnera tidigt för alla `l2cols`-fall. `exitL3`/`exitL4` tar nu bort `l2cols`. Resize-hanteraren anropar `renderL4()` för `net.view==='l4'` (saknades). `l3geom()` returnerar nu faktiska dimensioner → all L3/L4-layout anpassar sig automatiskt till paneländringar.

**L4 pool-glob position bevaras vid re-render.**
`renderL4Globes()` körde `clearL4Globes()` + skapade nya glober med standardpositioner (cirkelformation) vid varje resize/paneltoggel. Nu sparas varje globs kanoniska position (`savedPos`) före clear och återställs efter re-create. Bara nya glober (första render, ny spelare) får standardpositioner.

**Marquee-selektion: överlapp istället för mittpunkt.**
Markeringsrutan kollade om kortets mittpunkt (`c.tx+CW/2`) var inuti rektangeln → man behövde täcka minst halva kortet. Nu kollas rektangel-överlapp med 8px marginal via `Math.min(c.tx+cw, X)-Math.max(c.tx, x) > M`. Använder `c.cs` (kortets visuella skala) för korrekt storlek i L2/L3/L4. Fixar även en latent bugg: den gamla koden använde oskalerat `CW/2` för centerberäkningen.

### Session 24 – v2.2: Path of Enlightenment (26 juni)

**Path of Enlightenment — V5 Sabbat-mekaniken implementerad.**
Fyra Paths (`Path of Caine`, `Path of Cathari`, `Path of Death and the Soul`, `Path of Power and the Inner Voice`) som Sabbat-vampyrer kan välja, med full integration i klan/path-displaysystemet, serialisering, och online-sync.

**Konstanter & ikoner.** `PATHS` med short/slug-data, `PATH_NAMES` array, `PATH_SVG_SLUGS` mappning (normClan → slug) så `clanSymUrl()` hanterar path-namn automatiskt. `pathSymUrl(pathName)` returnerar `static.krcg.org/svg/path/<slug>.svg`. Ikonerna (caine/cathari/death/power) finns sedan 25 juni 2026 på KRCG.

**Card-modell.** `c.path` (null eller path-namn) och `c.noPath` (boolean, "No path"-valet). Serialiserade i alla 6 ställen: snapshot, restoreSnap, serializeGame, restoreGame, buildPub, serializeHand/restoreHand.

**Högerklicksmeny: "Follow Path →".** Längst ner i vampyrens meny (efter Convert/Give control) med separator. Utan KRCG: visas på alla vampyrer i COUNTER_ZONES, med femte val "No path" som gömmer menyn. Med KRCG: visas bara för Sabbat-vampyrer (via `\bSabbat\b` i card_text) utan befintlig KRCG path-datapunkt. Engångsval — menyn försvinner efter valet. Om `c.path` redan satt: visar nuvarande path (grå/disabled) + "Remove Path" för att fixa misstag. `setCardPath(c, pathName, burnBlood)` hanterar undo, path-flagga, blod-deduktion (helper), uppdaterar detektionen, pushar state.

**Helper: pathBlood.** Ny HELPER_DEFS-rad `{ key:'pathBlood', el:'helperPathBlood', def:false }`. När ON: menytext ändras till "Burn a blood to follow a Path", 1 blod dras automatiskt, menyval är utgråade utanför Influence-fasen (phase 3). Server `HELPER_KEYS` uppdaterad. Checkbox i Settings under Phase helper-sektionen.

**Path-badge på kort.** `.pathbadge` div i card HTML — positionerad top-center (6px top, centered), 26×26px, z:5, `opacity:.88` med `.on`-klass, `drop-shadow` för kontrast. SVG-ikon från KRCG. Dold på face-down kort (`.card.down .pathbadge{opacity:0}`). `updateBadges()` uppdaterar badgen vid varje `place()`-anrop: skapar `<img>` vid behov, uppdaterar src om path ändras, rensar om path tas bort.

**Detektion: detectPath/activePath/displaySymbol.** Samma mönster som `detectClan`/`activeClan`. `detectPath()` räknar paths bland ready face-up vampyrer, returnerar majoritetens path. `activePath()` = chosenPath || myPath || null. `displaySymbol()` bestämmer vad pool-globen visar: manuell override trumfar alltid; annars vinner path OM path-count strikt överstiger klan-count (lika → klan vinner). `refreshClanDisplay()` använder nu `displaySymbol()` istället för `activeClan()`. Alla renderers oförändrade — `clanSymUrl()` hanterar path-namn via `PATH_SVG_SLUGS`.

**Pool-glob meny: "✠ Choose path…".** `pathChoiceItems()` — submeny med paths bland ready-vampyrer (antal i parentes) + alla paths om inga vampyrer har path + Auto-detect. `state.chosenPath` serialiseras i serializeGame/restoreGame.

**KRCG-integration.** `loadCardDB()` parsern läser `card.path||null` till meta-objektet och deriverar `ri.sect` från card_text vid parsning (Sabbat/Camarilla/Anarch/Laibon/Independent via `\bX\b` regex, med `card.sect` som override om KRCG lägger till fältet). Card preview visar path i meta-raden (`ri.path` efter disc). Sabbat-detektion i menygaten är nu en enkel `ri.sect==='Sabbat'`-jämförelse — inga regex vid runtime. `_krcgPath` blockerar "Follow Path" för vampyrer med tryckt path från KRCG (aktiveras när PR #830 mergas).

**Bugfix: updateClan() → updateMyClan().** `convertCardKind()` anropade `updateClan()` som inte existerade — tyst ReferenceError. Fixat till `updateMyClan()`.

**Disabled-stöd i menysystemet.** `renderItems()` hanterar nu `it.disabled` — menyalternativ med `disabled:true` renderas med `.mi.disabled` (opacity .4, `pointer-events:none`) och hoppar över click-handler-wiring. Behövs för path-helperns fas-gating (greyed out utanför Influence).

**Verifierat:** syntaxrent, 16/16 klienttester, 3/3 servertester. Live-test väntar.

**Klan/Path-menyn sammanslagen.** "Choose clan…" och "Choose path…" i pool-globens högerklicksmeny är nu EN submeny. `state.chosenPath` borttagen — `state.chosenClan` håller det manuella valet (kan vara klan eller path). Logg ändrad till "Globe icon".

**Sect deriverad vid parsning.** `loadCardDB()` deriverar `ri.sect` från `card_text` vid laddning (Sabbat/Camarilla/Anarch/Laibon/Independent via `\bX\b` regex). `card.sect` från KRCG trumfar om det läggs till. Menykoden kollar `ri.sect==='Sabbat'` — inga regex vid runtime. Kort okända för KRCG faller igenom som "visa menyn" (defensivt).

**"Special…" submeny.** Path-valen (crypt) och Convert to vampire (library) flyttade till en gemensam "Special…" submeny längst ner i högerklicksmenyn. Visas bara om det finns items.

**Path-badge styling.** Benvit cirkel (`var(--bone)`, `border-radius:50%`, `padding:2px`, `box-shadow`), 23px, position `left:58%`, `top:6px`. Dold på face-down kort.

**L3/L4 kanoniskt AR.** `l3canonAR` lagras vid enter (collapsed-panel proportioner). `l3geom()` letterboxar AR:et: panel infälld → fyller kant-till-kant, panel utfälld → dödutrymme top/bottom. `_asideResize`-flagga skiljer paneltoggel från fönster-resize.

**Edge-knapp + timer centrerad.** `l3clockCy` ändrad till `g.ay+g.ah*0.45` (letterboxad slot). Edge-knappens X ändrad från `1004/2` till `fx+fw/2`.

**Reset view-knapp.** `#l3resetBtn` ovanför zoom-togglen i L3/L4. Återställer zoom+pan utan att öppna zoompanelen.

**Click-outside-to-close.** Klick utanför zoompanelen stänger den automatiskt.

**faceDown-filter.** `detectClan()` och path-menyn filtrerar nu face-down kort. Klanikon på globen avslöjar inte hemliga kort längre.

**Pile drag fix.** `libDragTarget()`/`cryptDragTarget()` hit-testade mot `#z-ready` (för liten i L4). Nu: hela `board` räknas som "ready" i L4.

**Pool-glob hint fix.** `l4hintDone`-flagga förhindrar att "Drag your pool globe" återuppstår efter paneltoggel.

**Bugfixar.** `updateClan()` → `updateMyClan()`. Sect-regex hade Python backspace (0x08) istället för JS word boundary `\b`. Path-meny dold för KRCG-okända kort — fixat med defensiv fallback.

**Verifierat:** syntaxrent, 16/16 klienttester, 3/3 servertester. Live-testat och itererat.
### Session 25 – v2.3: Files, Caching & UX Polish (26 June)

**Hover preview setting (panel collapsed).**
New `conv.hoverPreview` with values `'key'` (default, Ctrl+hover) and `'always'` (always show card image on hover when panel collapsed). Five code points touched: pointermove guard, keyup guard, cardTip tooltip suppression, Settings UI dropdown, asideToggle tooltip. Pure local `conv` setting — no serialization or server changes.

**Dock log zone.**
`#dockLog` — a scrollable copy of the game log shown in the bottom dock when the aside panel is collapsed. Positioned to the right of the hand zone (L2) or pool zone (L3/L4), fills remaining horizontal space. Synced incrementally in `log()` (clones each new entry) and fully on dock open / panel collapse. Hover-to-inspect wiring (same `logInspectShow` as the main log). Wheel capture prevents board-zoom interference. Cleared in sync with all `$('#log').innerHTML=''` sites (archiveTurn, resetForDeal, hotseat swap, restoreGame).

**Played/Ready tab centering.**
`--tab-mid` override for `body.aside-collapsed`: `calc(50% - 20px)`. Compensates header flex asymmetry (h1 ELYSIUM ~130px left vs 4 buttons ~200px right) so tabs center under the Pass button in Tournament mode. Constant offset regardless of phase button visibility (flex spacers divide remaining space equally).

**Files section — local image cache (IndexedDB).**
Major new feature: download and cache card images from KRCG for offline play and faster loading.

*IndexedDB layer* (`elysium-images` db, `cards` store): `openImgDB`, `imgDbPut`, `imgDbClear`, `imgDbStats` (cursor-based, skips `_`-prefixed meta entries). Special key `_vtesJson` stores the cached card database JSON.

*Cache-first `imgUrl()`*: `imgBlobCache` Map (normName → blobUrl) checked first when `conv.imgCache` is on — zero overhead when off (boolean guard skips the Map lookup entirely). Blob URLs created from IndexedDB at startup via `warmImgCache()` (cursor iteration, only runs when `conv.imgCache` is true).

*Download manager*: `downloadImages(names)` — 6 parallel fetches, AbortController for cancel, 30ms inter-batch delay, progress bar + cancel button. Handles both card images (`https://static.krcg.org/card/name.fmt`) and SVG icons (`svg:` prefix → `https://static.krcg.org/svg/type/name.svg`). Three collection sources: `collectAllNames` (requires cardInfo), `collectDeckNames` (parses saved decks), `collectGameNames` (cards on table). All three include SVG clan/path icons via `collectSvgNames`.

*SVG icon caching*: `clanSymUrl()` and `pathSymUrl()` check `imgBlobCache` with `svg:clan/slug` / `svg:path/slug` keys. ~50 icons, ~150 KB total.

*Settings UI (Files section — moved to top of Settings)*:
- Card database (KRCG) toggle — moved from Convenience
- Download/Refresh button for vtes.json with cache date display
- Auto-sync on startup toggle (`conv.jsonSync`, default on)
- Use cached images toggle (`conv.imgCache`, auto-enabled after download, auto-disabled after clear)
- Auto-download new images toggle (`conv.imgSync`, syncs missing images after card DB loads)
- Image format dropdown (WebP/JPEG)
- Download buttons: All cards / My decks / This game
- Progress bar + Cancel (hidden until active; fixed `.set-row[hidden]` CSS override bug)
- Cache stats: count, size, format
- Persist button (`navigator.storage.persist()`)
- Clear all button (revokes blob URLs, clears IndexedDB + Map)

*Storage sub-section*:
- Saved game: size display + Clear button (removes autosave + room-specific saves)
- Deck library: count + size + Clear button
- Settings: Reset button (convenience, helpers, shortcuts, brightness)
- Total estimate: localStorage + IndexedDB breakdown
- Clear everything: nuclear option (imgClearAll first → localStorage wipe, avoiding saveConv leak)

*`loadCardDB()` refactored* into `processCardData(data, src)` + `fetchVtesJson()` + `loadCardDB()`. Cache-first when `conv.jsonSync` is off (reads from IndexedDB `_vtesJson`). Network-first when on (fetches KRCG, caches in IndexedDB). Graceful fallback: network failure → tries cache even when sync is on, logs "(cached/offline)".

*`imgSyncCheck()`*: runs after every `processCardData` call. Compares `cardInfo.keys()` + `collectSvgNames()` against `imgBlobCache` — downloads only missing entries. Lightweight (Map key comparison = milliseconds).

**Silent autosave restore.**
Removed the `uiConfirm('Resume your saved game?')` popup at startup. The autosaved game now restores silently via `restoreGame(sg)`. Fresh start via Reset (☰ menu) or Clear saved game (Settings → Files → Storage).

**Welcome dialog redesign.**
`#empty` now has the board's felt gradient background (covers zones cleanly). Dialog content:
- Quick buttons: ⚙ Settings, Deck Lab (always shown)
- KRCG recommendation block (hidden when `conv.cardDB && conv.imgCache`)
- Quick-enable buttons: Enable card database, Download images
- Play online / Play offline buttons
- "Do not show again" checkbox (`conv.showWelcome`, synced with Settings → Convenience toggle)

**Discard-hover keybinding.**
`_lastBoardHover` tracker in existing `pointerover`/`pointerout` handlers — tracks the card object under the pointer (any card, not just hand). `discardHover()` function: if hovered card is in a COUNTER_ZONE (ready/uncontrolled/torpor), pushUndo + move to ash. Added as `ashHover` in ACTIONS (Advanced shortcuts, no default key). Works in L1–L4 (all views use `#board` DOM, pointer events respect CSS transforms).

**pcoHome merged into pco dropdown.**
Separate `conv.pcoHome` checkbox retired. New `pco='home'` value in the dropdown (On / Hide home / Mine hidden / All hidden). Same logic in `showOwnerOutline`: `conv.pco==='home' && boardSeat===mySeat() && os===mySeat()`. Default changed from `pco:'on', pcoHome:true` to `pco:'home'`. Migration line preserved for old saved settings. Host policy updated to accept `'home'`.

**Oust helper text updated.**
Removed outdated "(Logged now — the actual pool transfer arrives with multiplayer.)" caveat. The bounty (+6 pool + 1 VP to predator) has been fully functional in solo, hotseat, and online play since the server's `bounty` handler was implemented.

**Verifierat:** syntaxrent, 16/16 klienttester. Live-test väntar.

**Settings cleanup.**
Four UI changes to the Settings modal:
- **Removed "Skip table-band view (Level 2)"** — option was already a no-op since v1.99.27 (L2 is now mandatory). Removed: HTML, `conv.skipL2` default + import loader + UI sync + change listener + `levelOrder` comment. Zero remaining references.
- **Autosave moved under Storage** — the standalone Autosave section removed; the dropdown now sits right after "Saved game (autosave)" in the Storage sub-section of Files. Description shortened to fit the row format.
- **"Animation speed" → "Animation length"** — relabeled to match what the control actually does (scales duration, not velocity).
- **Brightness above SFX volume** — standalone Brightness section removed; brightness is now an inline slider row (matching the SFX volume row style) placed just above it in Convenience. CSS updated: `#brightness` lost `width:100%` and `margin`, gained `cursor:pointer`.

**Bugfix: welcome dialog flash.**
`#empty` started with `display:grid` in CSS, causing the browser to render the welcome dialog during HTML parsing *before* the script's `restoreGame()` (at the very end of `<script>`) could hide it. Fix: CSS default changed to `display:none`; explicit `$('#empty').style.display = state.cards.size ? 'none' : 'grid'` added after the startup restore attempt. Now the dialog never appears until the script has decided whether to show it.

**Manual Resume replaces silent autosave restore.**
Removed the silent `restoreGame(sg)` at startup. The welcome dialog now shows a **Resume** button (`#emptyResume`, hidden by default) when localStorage contains a saved game. Click handler re-reads from localStorage at click time (stale-proof). `syncWelcome()` now forces the dialog visible when a save exists (even if "Do not show again" is checked) — the Resume button is always reachable. Clearing the save from Settings → Storage hides the Resume button and re-runs `syncWelcome()`. Online rejoin is unaffected (server messages handle board restoration separately).

**Bugfix: L4 pool-globe hint leaking into L2/L3.**
`clearL4Globes()` removed globe elements and `#l4oppWrap` but left `#l4hint` ("Drag your pool globe") in the DOM. When exiting L4 to Structured mode, the hint stayed visible on the board (absolutely positioned inside `#board`, z:80). Fix: `clearL4Globes()` now also removes `#l4hint`. Called from both `exitL4()` and `renderL4Globes()` (re-render path).

**L0 idle-board view.**
New "level 0": a clean felt surface with no game UI. CSS: `#board.l0mode{ position:absolute; inset:0; width:auto; height:auto; transform:none !important }` fills the viewport like L3/L4. `#board.l0mode > :not(#empty):not(#toast){ display:none !important }` hides all game elements. `#board.l0mode > #empty{ background:none }` makes the welcome overlay transparent so the board's felt pattern (diagonal repeating-linear-gradients) shows through. `#tableArea:has(#board.l0mode) #l1zoomWrap{ display:none !important }` hides the zoom controls. `enterL0()` strips L2/L3/L4/l2cols classes, adds `l0mode`, clears inline transform. Entered at startup, after Reset table, after leaving an online room (with game), and after leaving hotseat. Exited in `enterL2/L3/L4`, `buildDeck` (solo), `startHotseat`, and the Resume click handler. L0 does not participate in the Tab view-step cycle — it lives outside the game loop.

**Automatic retry for failed image downloads.**
`downloadImages()` now collects failed names in a `failed[]` array (both `!resp.ok` and `catch` paths push the name). After the main batch loop, if there are failures and the user hasn't cancelled, a 2-second pause runs followed by a single retry pass over the failed subset (same batch-of-6 pattern). Recovered images are logged ("N images recovered on retry"). The final summary still reports the remaining failures. This catches transient network errors (timeouts, rate limits, DNS hiccups) without requiring the user to manually re-trigger a download. Permanent 404s fail on retry too and are reported in the final count. The existing "Download all/decks/game" buttons already skip cached images (`imgBlobCache.has` guard), so they remain a manual fallback for anything the retry didn't recover.

**Background download UX notes.**
Added "(Downloads run in the background — you can keep playing.)" to the welcome dialog's KRCG recommendation text, and "Downloads run in the background — you can close Settings and keep playing." to the Settings download row. `downloadImages` is never `await`-ed at any call site — it fires as a background async operation. Cards on screen keep their current `img.src`; the cache is a pre-cache for future renders.

**cardImageNames: primary-only download set.**
`processCardData` stores three name variants per card (`card.name`, `card._name`, `card.printed_name`) in `cardInfo` for lookup flexibility, but KRCG only hosts images for `norm(card.name)`. This inflated `collectAllNames()` from ~4500 to ~6000 entries, with the extra ~1500 producing 404s. Fix: new `cardImageNames` Set (populated from `card.name` only in `processCardData`). `collectAllNames()` and `imgSyncCheck()` now iterate `cardImageNames` instead of `cardInfo.keys()`. Cleared alongside `cardInfo` on disable/reload.

**leaveHotseat enters L0.**
`leaveHotseat()` was missing `clearTable()` and `enterL0()` — cards stayed on the board in a raw L1-like view. Now calls `clearTable()` + `enterL0()` after `switchView(null)`, matching the `mpLeave()` pattern.

**Verifierat:** syntaxrent, 16/16 klienttester. Live-testat och itererat.
