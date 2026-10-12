## [GRUPPEN KAN ZONERNA] — v2.6.145: vampyrer i handen, bibliotekskort i torpor (12 oktober 2026, sen natt)

Johan: "vi kör dem absolut" om granskningens två fynd. `zoneRefuses(c, zone)` — torpor och uncontrolled tar bara
kryptkort, handen bara bibliotekskort — anropas nu av enkeldraget, gruppdraget och gruppkommandot. Gruppdraget
hade en egen lista med två av de tre zonerna; handen saknades, så en markering med vampyrer som släpptes på
handen hamnade där med blod och lås nollade. "Send to torpor" (menyn och G) saknade spärren helt.
Matrisen (60 celler, riktiga musdrag, båda bordstyperna): **0 skillnader** mellan ensamt och grupp.

**Spelarens följdfråga (Kalesoner, via Johan): platser på fria bordet.** "Eftersom det inte verkar finnas ytor för
spelarna började alla flytta globerna direkt, samma med kryptkorten" — han visade Lackeys upplägg (1:a uppe till
vänster, 2:a uppe i mitten, 3:a uppe till höger, 4:a nere till höger, 5:a nere till vänster). Tittat i en
femspelarstart i webbläsaren: globerna ligger i en liten ring mitt på bordet, platsnumret är en liten stolsymbol,
och ett kryptkort som dras med dubbelklick hamnar på SAMMA mittpunkt för alla platser. Johan har svarat honom
att numret och standardpositioner kommer. **Förslag, inte byggt:** (1) standardposition längs bordskanten i
platsordning medurs, fortfarande flyttbar; (2) ordningstal på globen ("1st"); (3) dragna kryptkort landar bredvid
ägarens glob. Frågor till Johan står i chatten (uppställning för 2/3/4/6 spelare, och dockan som täcker
nederkanten).

**Verifierat:** syntaxrent, 256/256 klienttester med bot v0.6.198 bredvid (destruktivt mot v2.6.144: 1 röd = den
nya), canary 57/0, dispatch 60/0, protokoll 6/0, endpoint 24/0, soak-kontroll exit 0, B1 byte-identisk 1 496 824,
embed --check, check-versions grön.
**Väntar på live-test:** att korten som vägras i ett gruppdrag glider tillbaka snyggt (tillståndet är mätt,
rörelsen inte sedd), online och pekskärm.

## [EN REGEL FÖR ETT OCH FÖR MÅNGA] — v2.6.144: gruppdraget vände upp kryptkort på fria bordet (12 oktober 2026, sen natt)

Johan undrade hur spelarna lyckats vända sina fyra kryptkort av misstag, när det alltid fungerat för honom. Svaret
låg i *hur korten kom ut*: Johan klickdrar dem från leken (de hamnar i `ready`), spelaren dubbelklickade på leken
(de hamnar i `uncontrolled`, som på fria bordet saknar ram och alltså inte syns). Ett ensamt drag därifrån behåller
baksidan — den regeln har ett undantag för fria bordet — men gruppdraget hade en egen kopia av regeln utan
undantaget. Återskapat med riktiga musdrag i headless Chromium: fyra dubbelklickade kort, ett flyttat ensamt
(baksidan kvar), sedan alla fyra markerade och dragna (de tre som låg kvar i uncontrolled vändes upp).

**Byggt:** `readyDropFace(c, from)` — regeln har fått ett namn och båda vägarna anropar den.

**Johans följdfråga: finns det fler sådana?** Matris i webbläsaren: fem sorters kort × alla släppmål × ensamt och i
grupp, på båda bordstyperna (60 celler). Efter fixen skiljer sig grupp från ensamt bara i de 8 cellerna "släpp på
handen". Två fynd, **inte fixade** (Johans beslut):
- Ett gruppdrag till handen lägger kryptkort I handen och nollar blod och lås. Ensamt vägrar draget.
- "Send to torpor" för en markering (menyn och G) skickar bibliotekskort till torpor. Ensamt erbjuds det bara
  kryptkort, och dragen vägrar.
Samma klass alla tre: en gruppväg med en egen, tunnare kopia av enkelkortets regel.

**Fälla i verktyget:** första matriskörningen sa att två kortsorter inte gick att dra på fria bordet. Muspekaren
vilade uppe i mitten och öppnade Played-fliken över korten. Parkera pekaren på tom filt.

**Verifierat:** syntaxrent, 255/255 klienttester med bot v0.6.198 bredvid (destruktivt mot v2.6.143: 1 röd = den
nya), canary 57/0, dispatch 60/0, protokoll 6/0, endpoint 24/0, soak-kontroll exit 0, B1 byte-identisk 1 496 059,
embed --check, check-versions grön. Musdragen omkörda på den fixade klienten: baksidan kvar i båda fallen.
**Väntar på live-test:** samma drag online med en motspelare som tittar (vad de ser av korten), och på pekskärm.

## [BORDET LYSSNAR] — v2.6.143: advanced-korten, D20 i lobbyn, en pin-knapp man ser (12 oktober 2026, natt)

En spelare skrev efter sin första kväll: importen vägrade advanced-kort, lobbytärningen är en D6, platsvalet var
oklart, handen fälldes ihop och ingen såg någon pin, poolmarkören flyttade sig, tre av fyra Condemnation i
öppningshanden, och fyra kryptkort som vändes av misstag. Johan: dekonstruera och se vad som går att laga.

**Först mätt, sedan byggt.** v2.6.142 kördes först (248/0). Varje punkt lästes i koden och de som gick att
återskapa återskapades:
- *Advanced-korten:* alla exporter skriver "Kemintiri (ADV)"; KRCG:s namn är "Kemintiri (G2 ADV)" och
  exportformen står bara i `name_variants`, som v3-parsern aldrig läste (den levande filen är fortfarande v3).
  65 av 65 okända, och "Legal cards only" är på från start → tvärstopp. Återskapat i headless Chromium genom den
  riktiga importrutan med KRCG:s fil: v2.6.142 vägrar, v2.6.143 sätter 72 kort på bordet.
- *Fel text på rätt kort (ingen hade rapporterat det):* `_name` delas av basvampyren och dess advanced-version, och
  av gamla vampyrer och deras nytryck i ny grupp. Sist-vinner gav det nakna namnet till advanced-kortet för 63 av
  65 par och till nytrycket för ett dussin (Theo Bell, Mithras, Queen Anne…).
- *Tärningen:* knappen skickade aldrig `sides`, serverns reserv är 6. Fyra spelare slår lika i 72 % av fallen med
  D6, 27 % med D20.
- *Slumpen:* frisk. Fisher–Yates över kryptoslump med omdragning (ingen modulo-skevhet), samma i klient och
  server. 900 000 blandningar med produktionsfunktionen och 3 miljoner servergivar följer den exakta
  hypergeometriska fördelningen. 3 av 4 kopior i öppningshanden ur 90 kort: 1 på 870. En första körning på
  120 000 givar visade 27 % för få sådana händer (3σ) — större stickprov rättade det; värt att minnas åt båda håll.

**Byggt (Johan: "kör på 1"):**
- `buildCardIndex(list)` — utbruten ur `processCardData`, ren. Regel: kortets eget namn och dess `name_variants`
  är starka anspråk och vinner alltid; `_name`/`printed_name` fyller bara ett namn ingen gjort anspråk på, baskort
  före advanced. Oberoende av filordning (mätt framlänges och baklänges på riktiga filen: 0 fel av 6 551 nycklar).
  `buildPrecons` listar advanced-kortet som egen rad ("Namn (ADV)").
- `LOBBY_DIE=20`, `rollLine` (tärningen nämns alltid), `lobbyRollPush` — högerklicksmenyns tärning hamnar nu också
  i lobbyns lista. Ingen server- eller protokolländring.
- `#l2dockPin` — en riktig knapp bredvid Hand-etiketten när dockan är öppen; `setDockPin` är enda stället flaggan
  sätts. Att lossa via knappen stänger inte dockan, den lämnas åt hover-regeln; bakgrundsklicket fungerar som förr.
  Körd med riktig mus i Chromium på båda bordstyperna och granskad på skärmbild.

**Designval:** bildnamnen rördes inte — KRCG verkar servera alias-filer för varianterna (`…adv.webp` svarar som en
känd bild, ett påhittat namn som 404), men det är en slutsats av svarsklasser, inte en sedd bild. Ägarregeln gjordes
generell (starkt/svagt anspråk) i stället för ett specialfall för ADV, eftersom nytrycken hade samma fel.

**Inte byggt, Johans beslut (runda 2):** på fria bordet vänder ett GRUPPdrag av uncontrolled-kort upp dem
(`groupDrop`), medan ett enkeldrag behåller baksidan — troligen så de fyra kryptkorten avslöjades (läst, inte
kört); handen öppen som standard; en hostknapp "Slumpa platser" (kräver servern). Poolgloben: inte utredd.

**Verifierat:** syntaxrent, 254/254 klienttester med bot v0.6.198 bredvid (destruktivt mot v2.6.142: 6 röda = de
6 nya), canary 57/0, dispatch 60/0, protokoll 6/0, endpoint 24/0, soak-kontroll exit 0, B1 byte-identisk
1 496 021, embed --check båda sidorna, check-versions grön inkl. rotgrinden.
**Väntar på live-test:** pin-knappen på pekskärm; att advanced-bilderna faktiskt laddas från KRCG; lobbylistan med
flera riktiga klienter.

## [INGET AV ANDRAS I REPOT] — vtes.json ut, START-HERE v1.9 (12 oktober 2026, ingen kod)

Inventeringen av roten efter mergen: bara våra egna filer hostas (24 st), och allt guiderna namnger finns där.
Enda tredjepartsfilen i repot var `bot/vtes.json` (KRCG:s kortdatabas, 7 MB); Johan tog bort den — det är
skillnad på att *hosta* den synligt och på att klienten hämtar den från KRCG under körning, vilket är det den
är till för. Nu: `vtes.json` gitignorerad (som `twd_decks.json` redan var), root-`CLAUDE.md` säger hur den
hämtas (`curl -o bot/vtes.json https://static.krcg.org/data/vtes.json`) och att tredjepartsdata aldrig commitas
eller hostas. `START-HERE.html` v1.9: bottlistan nämner twd-filerna (saknades — den som följde sidan fick bottar
utan deckkunskap; hjälpsidan i klienten sa rätt) och en rad om att kortdatabas och bilder hämtas från KRCG.
Botsidans egna dokument säger fortfarande "vtes.json is in bot/" — deras att rätta (svar skrivet). Kvar som
Johans fråga, inte repots: lådan servar sedan D5 (27 juli) KRCG:s bildarkiv + en vtes.json-cache under
`/images/` — tredjepartsfiler hostade av oss, om det ska vara konsekvent.

## [REPOT ÄR SANNINGEN] — klientsidan in i monorepot (12 oktober 2026, ingen kod; klient v2.6.142 / srv-2.6.43 / bot v0.6.198)

Johan kopplade GitHub och lät botsidan lägga upp sin halva av `dtagent2000/VTES-Elysium` först; deras handoff
(`HANDOFF-to-main-2026-10-12-monorepo.md`) bad oss göra samma sak. Layouten är deras förslag och Johans tre beslut:
roten är nedladdningen och blir **senaste release** (v2.6.142 + srv-2.6.43 ersatte v2.6.128 / srv-2.6.38 som låg
där), koden och gaterna i `client/`, de levande dokumenten i `client/docs/` med våra svar i `client/docs/handoffs/`,
och juli-arkivet `Documentation/` kastades (Johan har det lokalt). **Det som fick byggas:** `check-versions.js`
läser dokumenthuvuden ur `docs/` också, och i ett monorepo får den en sista rad — *repo root (the download)* — som
kräver att varje rotfil är en byte-kopia av `client/<namn>` eller, för de åtta bundle-filerna, `bot/<namn>`. Första
versionen av gaten lät en gammal rotserver passera för att den råkade matcha `bot/`:s skrivskyddade kopia av
srv-2.6.38; gaten vet nu vilken halva som äger vilken fil. **Bundlen bredvid sviten:** sviterna, kanariefågeln,
soaken och help-embedden läser bottfilerna ur `__dirname`, så en session kopierar rotens bundle in i `client/` före
gaterna (`client/.gitignore` håller den ute — repot får aldrig en tredje kopia). Gater från repots `client/` med
v0.6.198 bredvid: klient 248/0 utan skip, canary 57/0, dispatch 60/0, protocol 6/0, endpoint 24/0, soak --control
exit 0, embed --check båda sidorna, check-versions grön med rotraden (21 filer). **Nya filer:** `client/README.md`
(layouttabellen), `docs/START-HERE-CLIENT-CHAT.md` (versioner, första kommandon, vad som är öppet) och
`docs/PROJECT-INSTRUCTIONS.md` (den korta projektinstruktionen enligt handoffens §8 — projektet bantas till de
två filerna efter merge, Johans steg). **Svaret till botsidan** (`REPLY-to-bot-2026-10-12-monorepo.md`) rättar tre
saker i deras text: servern servar FYRA bottfiler, inte sex (`.js`-tvillingarna är file://-fordon i nedladdningen);
`bot/docs/START-HERE-BOTS-CHAT.md` saknades när jag läste — den kom med deras PR #2 tjugo minuter senare (rebasat,
rättat); och `bot/`:s
kopior av vår server/klient/protokoll är gamla (srv-2.6.38 / v2.6.141 / v2.6.138) — deras att fräscha från roten.
**Kvar sedan tidigare:** `build-host-guide.js` säger v1.8 medan docx:en är v1.9 (3 aug-ändringen nådde aldrig
projektets .js). Commit-identitet: Claude som author med sessionslänk som trailer, Johans konto på merge-commiten
— samma som botsidan.

## [BADGEN KÄNNER HOLDEN] — bot v0.6.198 konsumerad (12 oktober 2026, klient v2.6.142)

Botprojektet byggde principen samma förmiddag (v0.6.198): en människas Hold on fryser varje väntan en bott har på en människa — block- och reaktionsfrågan, poolfrågan, röstningen, varje stridssteg och skadesteget, Turn-baseds påminnelse och give-up — och en release från VILKEN människa som helst släpper hela bordet; varje klocka börjar om från början. En chattrad håller och släpper också, och bottens egen "Hold on…" (tänkar-annonsen innan den svarar) håller ingenting. Hashar enligt deras §6, och innan vi rörde något körde v2.6.141 241/0 med v0.6.198 bredvid, inga skips. **Sedan läste jag deras guide mot vår klient** ("holden syns på varje stols badge och vem som helst kan släppa den") och mätte genom bryggan: badgen följde fortfarande bottens regel från v0.6.107. (1) Bottens egen Hold on visades som "Bots held by <bott>" fast botten inte höll något. (2) En release rensade bara talarens egen hold, medan botten släpper hela bordet sedan v0.6.108 — efter Bobs Pass visade badgen Alices hold medan bottarna körde. (3) Ett skrivet "hold on" höll bottarna medan badgen var tom (`_holdBy` ['You'], badge []). (4) En holder som lämnat bordet släpptes aldrig. Spökholden höll dessutom hotseatens tomgångsklocka (`hotAwaitPass`) stilla. **v2.6.142 följer deras regel:** en bott håller och släpper aldrig (rosterns `bot`-flagga); say 0 eller en chattrad som börjar med "hold on" håller; say 1/2/3/4/7 eller "carry on" / "resume" / "it resolves" från vem som helst rensar allt; en holder som är out, vacant eller offline släpps; panelens Release hold rensar badgen när ingen bott i fliken längre rapporterar `held`. Chattradens sändväg är nu en egen funktion (`chatSendLine`, utbruten ur keydown-lyssnaren) så att testet kör samma väg som Enter. Ett LIVE-test kör den riktiga botten och badgen genom samma inmatningar och jämför dem. **Också:** tooltipen online sa "only they can resume the bots", vilket är osant sedan v0.6.108; nu säger den att vem som helst kan säga It resolves. Bot settings fick en rad om holden (dold när den laddade bottfilen är äldre än v0.6.198). PROTOCOL §12.1 beskriver regeln och §8 `botcfg` pekar dit. Hjälp → Bots bäddar in deras guide från 12 okt. Alla tre .js-tvillingar finns nu i hand; vårt svar 11 okt påstod att cardfx-tvillingen låg i deras 10 okt-zip, och det gjorde den inte. Svar: `REPLY-to-bot-2026-10-12-v0.6.198.md`, med en not till deras guide: panelens Release hold släpper EN bott, bordets It resolves släpper alla. Klient 248/0 med v0.6.198 bredvid (inga skips; destruktivt mot v2.6.141: 8 röda = de 7 nya testerna + inbäddningsdriften), canary 57/0, soak-kontroll exit 0, endpoint 24/0, dispatch 60/0, protokoll 6/0, B1 byte-identisk 1 489 816, embed --check båda, check-versions grön. **Kvar hos Johan:** skicka svaret; deploya v2.6.142 (purge) och bot v0.6.198 (purga `/elysium-bot.js`; JSON-filerna är oförändrade); de tre .js-tvillingarna till nedladdningspaketet; och ett val: ska vem som helst online få badgens Resume-knapp? I dag har bara den som håller den.

## [VÄNTA PÅ MIG ÖVERALLT] — Hold on-principen och ▶-notisen (12 oktober 2026, ingen kod; klient v2.6.141)

Johan godkände principen från igår kväll: **en Hold on stoppar varje bottklocka som väntar på en människa, och klockan börjar om från början när holden släpps.** Den står nu i svaret till botprojektet (`REPLY-to-bot-2026-10-11-v0.6.197.md`, reviderat 12 okt, §3.1) i stället för den smalare punkten om stridssteget, med en inventering av v0.6.197, läst i koden och inte körd: blockfönstret, röstningen och bottens nästa drag stannar; poolfrågan (`_pqArm`) och stridsstegen inklusive skadesteget (`_phaseWait`) gör det inte. Snabbfrasen når aldrig `_phaseNudge`, och ett skrivet "hold on" startar bara om klockan en gång. Förslaget till dem: frys i `_holdHook`, starta om där `_holdBy` töms (även `_releaseDeparted`); `_tempoRearm` passar, men dess poolgren kräver `_pq.timer`; Turn-baseds fyraminutersgräns följer med; de korta handskakningarna (0,3–1,5 s) behöver inget. **Rättelse till mitt eget svar igår:** jag sa att botten påminner var 90:e sekund under en hold. I v0.6.197 startar hold-raden och påminnelsen bara när en bott når `_holdGate`, och en bott som står fryst inne i ett steg kommer aldrig dit. Svaret ber dem annonsera även från frysningen. Samma genomgång visade att Turn-baseds tvåminuterspåminnelse (`_remT`) fortsätter under en paus i blockfönstret och röstningen. **▶-notisen:** botprojektet skrev att ▶ bara stegar block- och poolfrågan tills main gör knappen till ett filter (begärt 9 okt, påmint 11 okt). Den har varit ett filter sedan v2.6.139; vår dåvarande tooltip, "a window or question", lät som en lista. Svaret §1 säger det, och att ▶ mot en riktig bott hittills bara stegat ett blockfönster. Klienten behöver inget för principen. **Kvar hos Johan:** skicka svaret, deploya v2.6.141. Ingen kodändring; check-versions grön.

## [GUIDEN HINNER IKAPP] — botprojektets zip kom samma kväll (11 oktober 2026, klient v2.6.141)

Tjugo minuter efter v2.6.140 kom botprojektets release-zip, så kvällens öppna halva är stängd. **Kört med bot v0.6.197 bredvid:** LIVE-testet för tempot körde för första gången och gick igenom — med seedad Standard 3 s höll botten blockfönstret på ungefär 3000 ms i stället för 20 s, och i Turn-based väntade den utan klocka tills ▶ gav den ordet. Tvillingtestet jämförde den ombyggda profilen med sin .js-tvilling (1 av 3 par: zippen innehåller bara det som ändrats sedan 10 okt). **Hjälp → Bots** visar nu botprojektets guide från 11 okt, och våra tre tempotexter säger samma sak som den. **Läst i koden i stället för frågat:** det symmetriska steal-fallet är hanterat sedan v0.6.172, så den frågan stryks ur svaret; Hold on fryser fortfarande inte ett stridsstegs klocka i v0.6.197, så den frågan står kvar. Klient 241/0 med v0.6.197 bredvid, canary 57/0, soak-kontrollen exit 0, endpoint 24/0, B1 byte-identisk, check-versions grön. **Deploya v2.6.141 i stället för v2.6.140** (purge) + bot v0.6.197 med den ombyggda `elysium-twd-profile.json` (purga `/elysium-bot.js` och `/elysium-twd-profile.json`).

## [BOTTARNA HÅLLER TIDEN] — botprojektets handoffs v0.6.195–197 (11 oktober 2026, klient v2.6.140)

Botprojektet har byggt sin halva av tempot (v0.6.194–195), kortat skadesteget och rättat två steal-regler (v0.6.196) och sist lagt till en pratad rad när bottens egen referendum flyttar dess pool (v0.6.197). Tre handoffs kom fram, filerna inte. **Klienten:** panelen visar **Close step** för ett öppet stridssteg och **Close poll** för en röstning; ▶ var redan ett filter (allt utom hold) och är nu fastnålat med ett test som matar ett påhittat framtida steg. Bot settings säger vad botten faktiskt gör: Standard = väntetiden, en fråga i strid dubbelt (skadesteget väntar bara en gång, och inte alls när ingen skada når din vampyr), Adaptive = lite längre än du brukar ta, Turn-based = påminnelse efter 2 min, Pass efter 4. **Botprojektets kontroll till oss stämde:** stridspanelens 'Stolen: N blood — move it' visades även när offrets sida avslutat striden i första paret — bara en dodge dolde den. Nu en enda regel (`cmbStolen`): dodge eller combat ends i första paret stoppar stölden, precis som skadan. .js-tvillingarna finns (v0.6.195) och hjälpsidan för egen server säger det. Nya tester: tvillingarna bär samma data som JSON, laddningen från lokal fil testad hela vägen, och ett LIVE-test för tempot som hoppas över tills en bot som läser `botcfg` ligger bredvid. **Mina rekommendationer till Johan** (skadesteget 1× och hoppa när inget når fram; en rad för poolrörelserna; Majesty sparad för farliga slag efter bänk) är byggda på botsidan i v0.6.196–197. **Öppet:** sviten och kanarien med v0.6.197 bredvid, och inbäddningen av nya START-HERE-BOTS.html — båda väntar på zippen. Två frågor till botprojektet i svaret: Hold on bör frysa stridsstegets klocka (i v0.6.193 gör den inte det), och taken-radens 'now M' är färskare än brädet inom en strid. Klient 240/0 med v0.6.193 bredvid, dispatch 60/0, protokoll 6/0, canary 57/0, endpoint 24/0, B1 byte-identisk, check-versions grön. **Deploya v2.6.140 (purge) + bot v0.6.197 med den ombyggda `elysium-twd-profile.json` bredvid servern (purga `/elysium-bot.js` och `/elysium-twd-profile.json`); .js-tvillingarna hör till nedladdningspaketet.**

## [BOTTARNAS TEMPO + KUNSKAPSLAGRET] — botprojektets handoff 28 sep (9 oktober 2026, klient v2.6.139 / srv-2.6.43)

Botprojektets handoff (v0.6.193) bad om tre saker. **(1) Kunskapslagret i webbläsaren:** boten läser
TWDA-profilen och arketypsignaturerna ur filer bredvid sig i node, men i en webbläsare bara det den FÅR.
Båda spawn-vägarna (hotseat och onlinelobbyn) lämnar nu `twdProfile` + `twdArchetypes`; laddaren hämtar
de två JSON-filerna bredvid cardfx (formkontrollerade, saknade = av, aldrig fel), och srv-2.6.43 servar
dem på exakt-match-routen. På file:// behövs .js-syskon som botprojektet ombeds bygga. **(2) Tempot:**
kugghjulet i Bot-knappen öppnar Bot settings — Standard / Adaptive / Turn-based och väntetid 1–8 s. Vem
som helst vid bordet får ändra, det gäller alla bottar, varje ändring ger EN loggrad (`Johan set bot
tempo: Adaptive, 3 s.`). Ett verb, `botcfg`, med partiella skrivningar; servern lagrar, sänder hela
tillståndet och spelar upp det för sena anslutare; bryggan gör samma sak offline. Johans tre beslut är
byggda enligt specens förslag (alla vid bordet / ▶ ger bottarna ordet i Turn-based / Standard 3 s som
start, seedat tyst). Boten v0.6.193 läser inte `botcfg` än — panelen säger det ärligt. **(3) De fyra
tysta poolförändringarna** är Johans beslut (botsidan). **Längs vägen:** rumssnapshoten hade aldrig sparat
boardMode, referee-lösenordet, matchlängden, everPop eller bot-flaggan — efter en omstart sopades varje
återställt bord bort inom tio minuter om ingen hunnit tillbaka, och ett Classic-bord kom tillbaka som
Structured. Nu ett rent funktionspar med rundturstest. Dessutom var LIVE-testet för stridshjälpen
handberoende (Majesty ×6 i Ventrue-leken): botten avslutade striden i ungefär hälften av körningarna.
Testet tömmer nu bottens hand och läser rundhistoriken. Klient 236/0, dispatch 60/0, protokoll 6/0,
canary 57/0, endpoint 24/0, B1 byte-identisk, check-versions grön. **Deploya v2.6.139 (purge) +
srv-2.6.43 (restart) + bot v0.6.193 med cardfx och de två twd-filerna bredvid servern (purga alla fyra).**

## [RESCUE HAR TVÅ RIKTNINGAR] — och granskning av v2.6.137 (24 september 2026, klient v2.6.138 / srv-2.6.42)

Johan: rescue är directed mot motståndaren vars vampyr det gäller, och undirected mot ens egen. Nu är det en undermeny:
`Rescue from torpor ▸ Opponent's vampire / My vampire`, med en ny rad för den egna. Botprojektets canary (57/0) finns nu
i projektet och är grön. Johans "något annat?" hittade två fel i gårdagens kod. **(1)** Undirected-flaggan levde vidare
till nästa action om den deklarerades genom att spela ett kort, eftersom flaggan bara nollades vid nästa menyval. Nu
dör den med sin action (`resolvePlayedActions`); mutantkontrollerat. **(2)** Online, när turen gick till en BOT, stängde
ingen resolvern, eftersom bara den nya turens klient skickade stängningen. Servern äger turen, så **srv-2.6.42** nollar
talliet och sänder stängningen före varje turannons (sex vägar). Protokollet kallade dessutom `takes a card action.` för
undirected, vilket nu är rättat. Svaret till botprojektet fick ett tillägg. Klient 229/0, dispatch 54/0, protokoll 6/0,
canary 57/0, B1 byte-identisk, check-versions grön. **Deploya v2.6.138 (purge) + srv-2.6.42 (restart) + bot v0.6.171.**

## [INGET ÖVERLEVER SIN ACTION] — bottens v0.6.171 besvarad (24 september 2026, klient v2.6.137)

Botprojektet levererade v0.6.171. Den parsar alla effektrader, och båda Combat ends-buggarna är fixade. Dodge, agg,
wounded och Crows räknas som hos oss. Strike-steget, som alltid väntade ut klockan, är fixat, och "tell me if your
side differs" är borta. De ställde tre frågor, och svaren fann jag genom att läsa klienten.
**(1) Block-räknaren nollades bara LOKALT** när en action löstes (sedan v2.6.28). Servern och hotseat-bordet behöll den
gamla stealthen, och boten läste den som nästa actions. Nu skickar den agerandes klient `mode: null`. **(2) Inget
överlever ett turbyte:** varje skärm rensar Block, Vote och Combat, och den nya turens klient skickar det (i hotseat
också vid varje bottur). **(3) En ny action** löser en FÄRDIG strid som står kvar på End of round; en pågående rörs
inte. Svaret på bottens "återanvänds combat-läget?" var alltså ja. **(4) Undirected:** Hunt och Political är flaggade, och
en ny rad "Undirected card action" tillkommer. Blockeraren öppnar Block-räknaren, så det är den AGERANDE som skriver
stealth 1 när räknaren dyker upp. Min första version satte det när den agerande själv öppnade, vilket aldrig händer.
Testet gick ändå grönt eftersom harnessen startar i `free`, tills jag kollade varför. **(5) Steal:** offrets panel visar
"Stolen: N blood — move it", och helpern flyttar fortfarande aldrig blod. Svar: `REPLY-to-bot-2026-09-24-v0.6.171.md`.
Deras canary (57/0) kom inte med, så jag bad om den. Klient 228/0 med v0.6.171, dispatch 53/0, protokoll 6/0,
canary 37/0 (vår kopia), B1 byte-identisk, check-versions grön. **Deploya v2.6.137 (purge) + srv-2.6.41 + bot v0.6.171.**

## [KRÅKORNA BEHÖVER EN STRIKE-RESOLUTION] — granskning av v2.6.135 före handovern (23 september 2026, klient v2.6.136)

Johan frågade om något behövde fixas innan handovern. **(1)** Skada varje runda, som Carrion Crows, delas ut under den
vanliga strike-resolutionen. Combat ends avslutar striden före den (VEKN-forumrulingar), medan dodge inte stoppar den.
v2.6.135 räknade den ändå efter Combat ends, både i taken-raden och i slutsumman. Nu gäller: Combat ends i första paret
stryker rundans kråkskada, medan den står kvar om Combat ends kommer i ett senare par. **(2) Det nya testet hittade en
lucka till:** dodge räknades bara om motståndaren valde efter mig via klienten. Boten skriver sin skada efter en
människas dodge (den agerande väljer först), och då kom skadan igenom. Nu är dodge en regel som tillämpas när skadan
räknas, inte vid klicket. **(3)** Taken-raden, avläsningen, historiken och summan läser nu samma skadefunktion.
**(4)** Etiketten i mittfältet visar namn ("Each round: Lisa 1 · Two 0"). Johan: Combat-menyn (13 rader) bantas senare om
den känns lång. Bott-tillägg §6. Klient 227/0, dispatch 53/0, protokoll 6/0, canary 37/0, B1 byte-identisk,
check-versions grön. **Deploya v2.6.136 (purge) + srv-2.6.41 (restart).**

## [AGG, WOUNDED OCH VARJE RUNDA] — Johans val ur combat-granskningen (23 september 2026, klient v2.6.135 / srv-2.6.41)

Johan valde punkt 2–4 ur "vad mer skulle hjälpa?". Punkt 1 (klar per steg) löses med det som redan finns: Pass-knappen i
resolver-raden sänder snabbfrasen `Pass`, och boten tar den som "inget mer i steget". **Agg:** `Combat ▸ Aggravated ▸`,
nya fält `ga`/`gb`, och skadeberäkningen följer regelboken (VEKN 4). Prevention går på agg först. Vanlig skada mend:as
med blod, och det som inte kan mend:as ger wounded. Första agg-poängen ger wounded utan blodkostnad, varje ytterligare
poäng kostar 1 blod, annars BURNED. Kontrollerat mot regeltexten och en forumruling: Crows 2 på 1 blod + 1 agg = burned.
**Wounded avslutar striden:** Press hoppas över och End of round avslutar, även efter press to continue. Din wounded
vampyr får en "→ Torpor"-knapp; du bestämmer själv. **Varje runda:** `Combat ▸ Damage each round ▸` (Carrion Crows, `ea`/`eb`)
följer med över rundbyten och kan inte dodge:as. Rundhistorik visas i mittfältet, och slutraden summerar hela striden.
**Tre buggar på vägen:** (a) en vampyr som skärmen inte ser fick blod 0, blev "wounded" och avslutade striden; okänt blod
är nu null. (b) Ett steg tillbaka in i Damage tog ny ögonblicksbild av det redan brända blodet; nu tas den en gång per
runda. (c) Klientens egen "Round 2 ▸" hade en egen kopia av rundregeln som glömde Crows; nu anropar den tvillingregeln.
Bott-tillägg: §5 i `HANDOFF-to-bot-2026-09-23-v2.6.134.md`. Klient 226/0, dispatch 53/0, protokoll 6/0, canary 37/0, B1
byte-identisk, check-versions grön. **Deploya v2.6.135 (purge) + srv-2.6.41 (restart).**

## [EFFEKTER, INTE KORTNAMN] — Johans första hotseat-test av combat-helpern (23 september 2026, klient v2.6.134)

Johan testade mot bot v0.6.166 i hotseat. **(1)** Menyn ska inte fråga efter kortnamn: man ser korten när de spelas, och
Combat ends gav tre nästan likadana rader. Nu blir det en rad per val, med bara effekten. Weapon står för sig
(kort triggar på vapen) och "Strike" tar allt annat. Johan ville ha Hand strike N och sedan en Bleed-liknande
sifferlista, 1 2 3 4 N…, och det blev så. **(2)** Menyn: `Combat ▸ Range ▸ Maneuver / Set range: close / long`
(efter att rangen är bestämd gäller den nästa runda), sedan strike-raderna direkt under Combat med sifferlista.
Menysystemet klarar bara tre nivåer, och en fjärde skulle röra alla menyer. **(3)** Strike ▾ finns nu i Strike-stegets
mittfält. Den gamla fanns bara på den egna panelen, som inte finns förrän man anmält sig; efter att boten öppnat syntes
bara "Join as blocking". **(4)** Deltagare: den minion som agerade (din tur) eller blockerade (deras tur) anmäls av sig
själv när striden öppnas, även när boten öppnar den. Klick på ditt fält ger en lista över dina redo minions (✓ på den
nuvarande, plus Leave). **(5) Combat ends mot den riktiga boten**, testat åt båda håll. Boten berättar att den "dealt"
skada fast Combat ends löser först, och den skriver ph 4/5 efter `ce`. När människan agerar slår boten ändå, och då
skrev klienten `Lisa takes 1`. Klientdelen är fixad: efter Combat ends räknas rundans skada som hanterad. Bottens del
ligger i `HANDOFF-to-bot-2026-09-23-v2.6.134.md`, ihop med de tre nya raderna att parsa. Klient 224/0 med v0.6.166
(sju nya eller omskrivna combat-tester, alla röda mot v2.6.133), dispatch 52/0, protokoll 6/0, canary 37/0, B1
byte-identisk, check-versions grön. **Deploya v2.6.134 (purge) + srv-2.6.40 (restart).**

## [EN NY RUNDA NOLLAR SKADAN] — bottens v0.6.166 kontrollerad mot klienten (23 september 2026, klient v2.6.133 / srv-2.6.40)

Botprojektet lämnade v0.6.166, som själv skriver `ph`, och bad main bekräfta tre saker. Jag skriptade bottens skrivningar
exakt som handoffen beskrev dem och körde sedan den RIKTIGA boten. **(1)** Bottens ph 4 → 5 skriver människans taken-rad ✓.
**(3)** Announcen varje runda utan a/b är ofarlig ✓. **(2)** Rundbytet re-firar inget ✓, MEN `a`/`b` från runda 1 följde
med in i runda 2. Regeln för ny runda från v2.6.129 nollade bara de tolv combat-fälten, fast a/b blev per runda samtidigt;
bara klientens egen "Round 2 ▸" nollade dem. **Fix:** srv-2.6.40 och hotseat-bryggan nollar ett frånvarande a/b vid
rundbyte. **Snubbling:** det nya hela-tally-tvillingtestet gick grönt mot en mutant. `seed % n` på en LCG:s låga bitar har
period 4, så fallet träffades EN gång på 400. Nu används de höga bitarna, och testet kräver minst 10 träffar; då föll
mutanten på skrivning #2. **Nytt LIVE-test:** en skriptad människa (Lisa) blockerar den riktiga boten och slåss två
rundor via helpern. Boten driver stegen och fyller i `a`, Lisas taken-rad skrivs varje runda, press to continue ger
runda 2, och runda 2 börjar på 0 mot 0 (v2.6.132 gav `2:0:1:1`). Rättelse till bottens handoff: hotseat bundlar inte
boten, den laddar `elysium-bot.js` från filen bredvid klienten. Svar: `REPLY-to-bot-2026-09-23-v0.6.166.md`, med två
iakttagelser: boten säger fortfarande "tell me if your side differs", och människan stänger striden med End combat.
Klient 223/0 med bot v0.6.166, dispatch 52/0, protokoll 6/0, canary 37/0, B1 byte-identisk, check-versions grön.
**Deploya v2.6.133 (purge) + srv-2.6.40 (restart) + bot v0.6.166 bredvid klienten och på bottprocesserna.**

## [FÖNSTRET SOM MENYN GLÖMDE] — andra granskningen före test (23 september 2026, klient v2.6.132)

Johan: "något som behöver fixas innan test?" Jag läste hela combat-blocket och dess skarvar mot resten av klienten.
**(1)** En strid som startas från högerklicksmenyn visade aldrig sin panel. `avrOpen` har aldrig behövt pinna
Played-fönstret, eftersom Combat-knappen sitter INUTI det. En fjärröppning pinnar via MP-handlern, men en lokal
menyöppning gjorde det inte, så man såg bara loggrader. Nu pinnar `cmbEnsure` fönstret när den öppnar en strid.
**(2)** Tutorialens Combat-steg beskrev den gamla stepparen ("räknarna alltid på, ▸ wrappar alltid, siffrorna nollställs
manuellt"). Texten är omskriven för railen, stegpanelen, press-styrd Next och högerklicksmenyn. De andra
tutorialstegen pekar på element som finns kvar. **(3)** "Weapon or card…" med bara en siffra gjorde tyst ingenting;
nu förklarar en toast. Kontrollerat och okej: menyer och dialoger ligger över Played-overlayn, och en öppen
resolver håller peeken öppen. Kvar som kända småsaker: Press erbjuder "to end" efter egen press to continue, en
range som rättas efter en strike räknar inte om skadan (±), och Resolve och Next gör samma sak vid End of round.
+1 test (rött mot v2.6.131). Klient 220/0, dispatch 51/0, protokoll 6/0, canary 37/0, B1 byte-identisk,
check-versions grön. **Deploya v2.6.132 (purge) + srv-2.6.39 (restart).**

## [RADEN UTAN HELPERN] — bottar på Classic utan helpers, handovern omprövad (23 september 2026, klient v2.6.131)

Johan: "var handovern komplett?" Målet är bottar som också spelar bra på ett **Classic-bord utan helpers**, efter att
de är felfria på Structured + All helpers, och Combat-menyn på minions finns delvis för det. Svaret: specen var
komplett för dagens läge, där klienten tvingar alla helpers på när en bot sitter vid bordet (v2.6.93 / `netBotHelperLock`),
men inte för det målet. **(1) Vår lucka:** taken-raden byggde på helperns combat-läge, så utan helper skrevs den
aldrig och boten gissade igen. Nu finns `Combat ▸ Damage taken…`, som syns BARA när combat-helpern är av (med helpern
på är raden automatisk, så "inga extra knappar" gäller fortfarande där). Den frågar efter skadan efter prevention,
läser vampyrens blod och skriver samma frusna rad. Brädet rörs inte. Alla andra Combat-rader fungerade redan utan
helper (bara loggrader). **(2) Specen vände på kontraktet.** Raderna är kontraktet, med eller utan helpers. Fälten och
`ph` är en accelerator som bara finns när den som skriver har helpern på. Boten ska klara en hel strid på bara rader,
inte bygga `combatPhases` på `ph`, behandla en tyst människa som okänd (inte noll), själv skriva `sets range to` och
`gets an additional strike`, och START-HERE-BOTS ska beskriva Combat-menyn. Helper-låset för bottar släpps först när
boten bevisat det, med ett hotseat-test där helpern är av (vår sida, senare). +1 test (rött mot v2.6.130). Klient
219/0, dispatch 51/0, protokoll 6/0, canary 37/0, B1 byte-identisk, check-versions grön. **Deploya v2.6.131 (purge) +
srv-2.6.39 (restart).**

## [RUNDAN SOM HOPPADE ÖVER MIN RAD] — granskning före deploy (23 september 2026, klient v2.6.130)

Johan: "är det något i koden du är osäker på?" Jag läste om min egen v2.6.129 och hittade två riktiga fel. **(1)** Steg-klick
går genom `avrPush`-debouncen (120 ms), men "Round 2 ▸" skickas direkt och rensar den. Klickar en annan spelare snabbt
Damage → Press → End → Round 2 ser de andra skärmarna `ph 4` och sedan `rd 2`, och `cmbWatch` räknade bara ett steg förbi
Damage inom SAMMA runda. Taken-raden skrevs aldrig; reproducerat med noll rader. Nu räknas ett rundbyte direkt från
Strike/Damage som att bordet passerat Damage. **(2)** En åskådares rail och ◂▸ flyttade hens egen vy (skrivningen
stoppades redan). Nu returnerar de för `net.spect`. **(3) Bottsidan:** den releasade boten skriver combat-talliet bara vid
sin anmälan (`a:0, b:0`), så mot en bot visar Damage "Incoming 0" och ingen taken-rad skrivs. Vi parsar INTE bottens
strike-rader in i räknaren, eftersom det blir en andra sanning som dubbelräknar senare. I stället blev det punkt 0 i
bott-specen, ihop med att sluta skicka `a:0, b:0` i anmälan.

**Johans beslut:** (a) utan combat-helper skriver menyn bara loggrader, och koordinationen sker via chatt och snabbfraser;
ingen ändring. (b) Combat ends i ett senare par, t.ex. Majesty i par 2: par 1:s skada står kvar. Regeltexten säger att
Combat ends avslutar före andra strikes och resolution-effekter, men regelbokens "no longer ready … combat ends
immediately" och VEKN-forumtråd 82464 visar att skada i praktiken hanteras per par. Helpern summerar paren i ett
Damage-steg, och det är en dokumenterad förenkling. +1 test (rött mot v2.6.129). Klient 218/0, dispatch 51/0, protokoll
6/0, canary 37/0, B1 byte-identisk, check-versions grön. **Deploya v2.6.130 (purge) + srv-2.6.39 (restart), inte
v2.6.129.** Webbläsarkollen återstår.

## [STRIDEN FÖLJER STEGEN] — combat-helpern styrd av regelbokens steg (23 september 2026, klient v2.6.129 / srv-2.6.39)

Johan: combat-räknaren är konstant och spelar egentligen bara roll i skadesteget — låt innehållet följa stegen, och
ge vampyrens högerklicksmeny en `Combat`-undermeny. Botprojektets `spec-client-combat-controls-2026-09-23.md` var
underlaget; Johan gav fri lejd att forma UI:t. **Två mockups i chatten först.** Den första slog ihop Damage resolution
med Strike och gjorde Additional strikes till eget steg, efter Johans lista. **Regelboken (VEKN 4. Detailed Turn
Sequence) vände på det:** de sju stegen är Before range, Determine range, Before strikes, Strike, Damage resolution,
Press, End of round — additional strikes är extra choose/resolve-par INNE i Strike, skadan hanteras en gång efter alla
par. Klientens `AVR_PHASES` hade varit exakt rätt sedan v2.6.17, så `ph` behåller sin betydelse på tråden. Övrigt
bekräftat: den agerande minionen får alltid första chansen (vi låser det inte — Johan: effekter kan ändra ordningen),
close är default varje runda, man får inte spela två maneuvers/presses i rad, en effekt som SÄTTER rangen hoppar över
maneuver-steget och kan inte ändras (general rulings), End of round sker även när striden slutar i förtid, och Combat
ends löser först och hoppar över resten. **Johans två beslut:** skadan läggs aldrig på brädet ("det får spelarna
hålla koll på") — panelen visar bara vad man förlorar; och taken-raden som boten behöver skrivs automatiskt vid
"Resolve", inga extra knappar.

**Byggt.** Railen (R#, sju steg-chips, range-pill) ersätter `R1 · Strike`; a/b-räknarna lämnar raden i combat. Mellan
combatants en stage per steg: Set range (this round i Before range, next round i Before strikes), Close/Long-switch
(låst med 🔒 när rangen är satt), skada a vs b med ±, Next strike pair, Ends/Continues-switch, utfallet. Varje sida
får stegets knappar: Maneuver, Strike ▾ / + Additional, i Damage "Incoming 3 · prevent − 1 + · Burns 2 blood → 1
left" eller rött "wounded → torpor", Press. Next i End of round blir "Round 2 ▸" eller "End combat". Högerklick:
`Combat ▸` Maneuver · Set range ▸ · Strike ▸ (sex) · Additional strike… · Prevent damage… · Press — samma funktioner
som panelen. Hand strike ger 0 på long (regelboken: bara close-range), dodge nollar motståndarens par, ett
additional-par adderar. **Taken-raden:** varje klient skriver sin EGEN vampyrs `takes N (loses P blood, now M)` en
gång per runda när bordet passerar Damage (eller löser direkt ur Strike/Damage), räknat på blodet när Damage BÖRJADE
— spelaren bränner blod mitt i steget utan att raden blir fel. × (withdraw) skriver inget. **Tråden:** tolv
combat-fält i talliet som partiella skrivningar; srv-2.6.39 mergar dem och ett ändrat `rd` ger en fräsch runda (en
next-round-range följer med och låses). Klientens tvilling kör samma regel; ett test kör 400 slumpade skrivningar
genom båda (mutanten 8-i-stället-för-9 föll direkt).

**Snubblingar:** (1) B1 såg byte-identisk ut fast bygget hade dött (`shell.html` saknades, inget skrevs, `cmp`
jämförde filen med sig själv) — splittern skriver till `/home/claude/elysium-src`; byggt om till `/tmp/rebuilt.html`,
äkta identisk 1 438 501. (2) Protokoll-lintern ser bara `m.fält` — fick lära sig följa `tallyCombat(m` till
nyckellistan i källan istället för att koden skulle skrivas om för testets skull. (3) Baslinjen var röd: v2.6.126:s
LIVE-test lyssnade på `chat`, men boten skriver notes på `log` sedan v0.6.114 — vår testbugg, rättad.

Grindar: klient 217/0 med bot v0.6.162 bredvid (+8, de sju combat-testerna röda mot v2.6.128), dispatch 51/0 (+1, röd
mot srv-2.6.38), protokoll 6/0 (röd med gamla docen), canary 37/0, error-endpoint 21/1 (cardfx.json saknas bredvid),
B1 byte-identisk, check-versions grön. **Deploya klient v2.6.129 (purge) + srv-2.6.39 (restart) efter webbläsarkoll**
(stagebredden 190 px, railen i en smal overlay). **Tillbaka till botprojektet:** `spec-bot-combat-fields-2026-09-23.md`.

## [CLOSE SOM STÄNGDE NÅGOT ANNAT] — Johans första klick i Help-modalen (22 september 2026, klient v2.6.128)

Johan: "Close stänger inte rutan." Knappen hette `id="helpClose"` — och ett `#helpClose` fanns redan: kortkommando-
overlayens ✕ inne i `#tableArea`, 800 rader tidigare i dokumentet. `$()` returnerar FÖRSTA träffen, så `closeOverlay`
bands till en dold knapp på filten och modalens Close var död. Inget kastade; bara en census hittar det. Jag hade
kollat mina sid-ankare (`about`, `setup`…) mot krockar men inte modalens fyra egna id:n — de som faktiskt frågas
med `$()`. Fix: hela familjen heter `helpDoc*` (Title/Tab/Close/Body) och sviten förbjuder nu dubblett-id i den
statiska markupen (destruktivt: röd på v2.6.127 med `helpClose` utpekat). v2.6.127 var levererad men aldrig
deployad → version = bytes → v2.6.128, noten flyttad till CHANGELOG. Klient 199/0 (+10 skip), B1 byte-identisk,
check-versions grön. **Deploya v2.6.128 (purge), inte v2.6.127.**

## [HJÄLPEN IN I KLIENTEN] — Help-undermeny med Bots + Local server som inbäddade sidor (22 september 2026, klient v2.6.127)

Johan: dra in START-HERE-sidorna i klienten så man slipper sidodokument. Huvudmenyn får `Help…` = Rulebook / Bots /
Local server / Report a problem… (de två yttre flyttade in från toppnivån, i Johans ordning). **Kärnbeslutet** —
sidorna bäddas IN som `<template>`-block i klienten (utanför `<script>`, så B1 är oberörd), renderas i `#helpModal`
(1000 px / 92 vh) med START-HERE-BOTS egen design scopad under `.helpDoc`, och en `↗ New tab`-knapp bygger ett
komplett fristående dokument (samma template + samma `#helpCss`-block → Blob-URL → `window.open`, med
write-into-blank-tab som fallback och ärlig toast om pop-up-blockeraren tar båda) — funkar på `file://` och lever kvar
bredvid bordet medan man spelar. Alternativet (iframe mot filen bredvid) föll: kräver deploy av sidofilen och dör på
den dubbelklickade klienten. **Ägandet hålls:** START-HERE-BOTS.html är botprojektets release och bäddas in
ORÖRD av det nya verktyget `embed-help.js` (lyfter `<body>` minus deras `<script>`, prefixar id/#href/`url(#)` med
`hb-`, skriver mellan `<!-- @@HELP:bots -->`-markörerna; `--check` = drift-läge som sviten kör). "Local server" är en
NY konvergerad sida vi äger (`help-local-server.html`, ids `hs-`): START-HERE + Host Guide masserade till en
genomgång i bot-sidans form — Do you need this? / Setting up / Beyond the LAN / Running a table / Reference — utan
hänvisning till de gamla dokumenten, med GitHub-länk för filerna. **Kontrollerat mot källan när den skrevs:**
srv-2.6.38:s konstanter (5 fel/10 min, 80 msg/10 s, 4 rum/IP/h, 16 sockets/IP + 400 totalt, 50 rum med 10 reserverade,
6 säten, 10 åskådare, 60/10/10-min-reapern, 24 h-snapshot, 3 sparningar per lösenordsgrupp, 90 dagar), CLI-flaggorna
(`--bind`/`--data-dir`/`--origin` fanns inte i Host Guide), värdarv (`hostToken` → players[0]), domare PER RUM vs
serverns referee key (Host Guide blandade dem), Create/Join-namnen, `📋 Invite`, `💾 matches`, felrapporterna som
landar i `elysium-errors.log`. Host Guide-generatorn i projektet är v1.8 medan journalen säger v1.9 — kopian är efter;
rörs inte (GitHub-dokumenten står kvar för den som inte har klienten). **CSS-krockar hittade och neutraliserade:**
klientens globala `main{display:flex}`, `header{…}`/`header h1`, `.modal h3` (uppercase Cinzel) och `.modal .note` nådde
sidan — alla omskrivna i `.helpDoc`-blocket (ett test kräver att varje regel är scopad). `<script>`-taggen skrivs
`'<scr'+'ipt>'` i byggaren så klientens egen script aldrig kan avslutas där (harnessen/splittern nycklar på den enda
nakna taggen). Ankare i modalen scrollar modalkroppen och öppnar sina `<details>`, aldrig `location.hash` (klientens URL
bär `?server=`/`?mode=`). **Svitfynd:** v2.6.122-pinnen "no grinder/shark outside comments" föll på botprojektets
prosa ("a grinder keeps its design home quota" — en arketyp där, inte en persona-nyckel); pinnen undantar nu
`<template id="helpDoc…">`-blocken. Nya tester: menystrukturen + templates + scopad CSS (källpinnar), `helpStandalone`
+ `openHelp` via injicerade `_ids` i harnessen, och drift-testet (server-sidan KRÄVER `help-local-server.html`
bredvid, bot-sidan hoppar högljutt utan START-HERE-BOTS.html). Destruktivt mot LEVERERAD v2.6.126: 3/3 faller.
Grindar: klient 198/0 (+10 skip), dispatch 50/0, protokoll 6/0, error-endpoint 20/2 (botstatics saknas bredvid, som
förut), canary skip, B1 byte-identisk 1409453 (+98 kB — de två sidorna), check-versions grön. **Deploya klient
v2.6.127 (purge); server/bot orörda.** Kvar för webbläsaren: modalens utseende på laptop, `↗`-knappen i Safari
(Blob-URL i ny flik), ankarhopp in i stängda `<details>`, den sticky nav-raden i modalkroppen. Backlog: launchers
säger fortfarande "Admin password" — byt till "Server referee key" vid nästa launcher-runda; START-HERE-BOTS sidfot
säger bot v0.6.155 medan vi konsumerar v0.6.151 (deras siffra, inbäddad orörd).

## [BOT-KORTENS MENY VID HOTSEAT + BURN] — botprojektets handover implementerad (22 september 2026, klient v2.6.126)

Johan: vi kan inte låsa en bots vampyr offline (kortet som låste den känner boten inte igen). Botprojektets
`spec-bot-card-ctrl-2026-09-22.md` hade redan mätt hålet i källan: menyn på en bots kort går till `hotCtrl`, som
returnerar tyst av TVÅ oberoende skäl — botsätets blob är v2.6.122-platshållaren (inga kort) och en bots pub bär
inget `owner`. Sätesverben gick sedan v2.6.97, kortverben aldrig. **Fix A:** `hotCtrl` börjar med `hotBotSeat` →
`hotBridge.toBot(seat,{t:'ctrl',cid,act,from})` — serverns exakta form — och bottens push är sanningen. **Fix B:**
`🔥 Burn (remove from game)` på en bots kort i båda lägena, bakom confirm — bottens `burn`-mottagare (v0.6.129) hade
aldrig haft en avsändare; diablerie av en bots torpor-vampyr har ett verb. `ctrlOptimistic` delad optimistisk
skrivning (burn inkl.). Människosäten orörda. **Egna snubblingar i testet:** `hotReRender` skriver om den aktiva
människans blob (fixturen måste ligga på ett ANNAT människosäte) och `renderStats` kräver `pub.counts`. Destruktivt
mot levererad v2.6.125: faller på första assertionen (bryggan hör inget). **EJ KÖRT:** LIVE-testet med riktig bot —
ingen `elysium-bot.js` i sessionen. Grindar: klient 195/0 (+10 skip), dispatch 50/0, protokoll 6/0, error-endpoint
20/2 (botfilerna saknas bredvid servern, samma mot orörd källa), canary skip, B1 byte-identisk 1311830, versions grön.
**Deploya klient v2.6.126 (purge) EFTER att LIVE-testet + canary körts med bot v0.6.151.** Tillbaka till botprojektet:
H1–H9 + canary på v2.6.126, Burn i START-HERE-BOTS, skuld 26h stängs.

## [SOAKEN MED DATABASEN] — första hela spelen genom riktiga svepet (21 september 2026, ingen kodändring)

Johan laddade upp `elysium-cardfx.json`. Kontroll exit 0 med `cardfx database: yes`. Hela batteriet på ~7 min:
**7 bord · 91 turer · 213 Hold-ons · 9 ousts · 0 fast.** Alla 2-bot-bord till last-standing; 4-bot-bordet oustade tre
säten på 9 rundor i 30 turer (< 36 → svepet hoppade över fallna säten, spec-punkt 1, med databasen på). Första
end-to-end-beviset för oust-vägen (bounty → roster → överhoppat säte) i hela spel på vår sida. Databasen ligger
kvar i botprojektet och går inte med i leveransen.

## [EN SOAK SOM KAN MISSLYCKAS] — `elysium-soak-hotseat.js` v1.0.0 blir projektverktyg (21 september 2026, ingen deploy)

Johan: "mer verktyg som underlättar är ju bra". Engångsskriptet som motiverade att ta bort Hold-on-filtret är nu ett
riktigt verktyg: riktiga bottar på RIKTIGA bryggan, drivna av RIKTIGA `hotRunBotTurns`. Frågan sviten inte kan
ställa: fortsätter ett helbot-bord att RÖRA sig? **Två saker gör att grönt betyder något**, båda byggda för att jag
själv pekat ut dem som luckor en timme tidigare: (1) `--control` sätter en bot som aldrig hör sin tur och KRÄVER att
snubbeltråden löser ut — också som `testB` i sviten. (2) **En oberoende vakthund.** Soaken upptäckte parkerade
säten via `hotAwaitPass` — just den mekanism som granskas; med den trasig HÄNGDE första versionen bara.
Vakthunden har egen klocka (INTE `rec.lastAt`) och tävlar mot svepet. Bevisat med MUTERAD klient: kontrollen ger
exit 2 på sekunder med "CLIENT FAULT" i stället för att hänga. Tre utslag: löste ut / klientfel / inget löste ut.
**Egna missar på vägen:** två av mina "exit=0" mätte `tail` (pipe); första felmeddelandet sa "verktyget kan inte
upptäcka" medan det upptäckte. Verktyget skriver själv ut sina blinda fläckar (ingen cardfx → ingen oust →
oust-vägen EJ övad). Registrerat i check-versions + manifestet. Klient/server/bot orörda.

## [SISTA SKILLNADEN] — botprojektets svar granskat genom att köra det (21 september 2026, klient v2.6.125, bot v0.6.151)

Deras svar: acceptansen uppfylld (`droppedVerbs {}`, `tallyNet 0`, H1–H10 10/0), båda våra fynd var riktiga och
är fixade i v0.6.151. **B1 verifierat live genom VÅR väg:** en riktig bots publicerade vampyr-id → `given` med det
cid:t → 150 armerar inget, 151 armerar `_famedMine` (fx-uppslaget stubbat, sandlådan saknar cardfx). Deras egen
fixture hade fel trådform inbakad — därför var den grön. **§D: brygg-filtret är borta.** En bots "Hold on…" reläas
nu till andra bottar precis som servern alltid gjort. Bevis: deras 9 bord med raden bortklippt ur vår källa, plus
vår egen soak genom riktiga `hotRunBotTurns`: 7 bord, 695 levererade, 0 fast, alla förbi runda 3. (Vår soaks
gräns: ingen cardfx här → bottarna spelar plain, ingen oustades. Deras körde med databasen. Kompletterande.)
**Två saker blev bärande och är pinnade:** `rosterMsg()` måste behålla `bot`-flaggan (bottens filter läser den, och
en roster-push ERSÄTTER dess players) och botfilens golv är nu på riktigt (`hotBotVersionOk`, v0.6.147, vid varje
laddning). **Kontrakt noterade:** deras verktyg IMITERAR svepets vem-är-ute-regel — ändras den, säg till dem;
boten är aldrig legitimt tyst > 3 min utan hold (30 s-heartbeat som chat, `rec.lastAt` räknar alla verb); C5
(Pool to predator av) accepterad; self-passen behålls; un-oust öppen enligt Johans beslut; `wall` förblir dold.

Grindar: klient 202/0 med v0.6.151 (destruktivt 2/2 mot LEVERERAD v2.6.124), dispatch 50/0, protokoll 6/0, canary
37/0, B1 byte-identisk, check-versions grön. **Deploya: klient v2.6.125 + srv-2.6.38 + bot v0.6.151.**

## [HANDOVER TILL BOTPROJEKTET] — paritetsrundan stängd från vår sida (21 september 2026, inga kodändringar)

`handover-to-bots-parity-2026-09-21.md`: status per spec-punkt, tre saker att köra om hos dem (`--arm asis`,
H1–H9, lyftet), fem fynd i bot v0.6.150 (`_onGiven` matchar `attachTo` mot NAMN men tråden bär CID; `_oust`
publicerar pool-0 före `bounty`; self-pass överflödig mot srv ≥ 2.6.38; ingen un-oust- eller recall-mottagare) och
EN öppen fråga. **Fyndet när jag skrev den:** jag tänkte påstå att bottens ask-paus fortfarande saknar
bot-filter (skälet till vår v2.6.95-workaround som inte reläar en bots "Hold on…" till andra bottar). Raden jag
greppade såg oförändrad ut — filtret står två rader OVANFÖR (`if(hp && hp.bot) return;`). Samma läxa som 15 sep:
läs blocket, inte raden. **Nästa runda (väntar på deras svar):** ta bort brygg-filtret — det är sista medvetna
skillnaden mot serverns relä — och kör om 2-bot-soaken som hittade deadlocken i runda 3.

## [PRELOADEN VÄNTAR PÅ AVSIKT] — sista titten före deploy (21 september 2026, klient v2.6.124)

Johans sista "något du vill justera?". Jag bytte FRÅGA i stället för att läsa samma diff en gång till: vad kostar
det här i drift, och vad ser den som aldrig rör bottarna? **Fyndet var mitt eget, två timmar gammalt:** den tysta
preloaden i v2.6.123 kördes från lobbyns RENDER. Varje Full-host som öppnade vilken lobby som helst laddade
ner boten (697 kB) + cardfx-databasen — för att utöka en meny som idag inte har någon okänd nyckel att visa. Och
där botfilen saknas glömmer laddaren ett misslyckat försök (med flit, för Start), så varje lobby-push gav en ny
`<script>` och en ny 404. Johans egen regel från v2.6.76 — "lasten hamnar alltid på någon" — bruten av en
bekvämlighet. Nu: bara på AVSIKT (säte togglas till bot offline; hosten rör bot-lek-menyn online), en gång per
sidladdning. Manifestets §A/§B (kvar på v2.6.102 / srv-2.6.35) uppfräschat. Kollat och lämnat: inga
grinder/shark i START-HERE, host-guiden, runboken; klientens `turn`-handler klarar redan en tur som tas ifrån en.

Grindar: klient 201/0 (destruktivt 1/1 mot LEVERERAD v2.6.123), dispatch 50/0, protokoll 6/0, canary 37/0, B1
byte-identisk, check-versions grön. **Deploya: klient v2.6.124 + srv-2.6.38 + bot v0.6.150.**

## [EN OUST BETALAR DE LEVANDE OCH FLYTTAR TUREN] — serverhalvan av paritetsrundan (21 september 2026, server srv-2.6.38)

Johan: "vill du passa på att fixa servern också?" — ja, så stängs sista riktiga skillnaden i samma deploy.
**Predatorn:** `bounty`/`hostOust` tog ringföregångaren utan att fråga om den levde. Visat LIVE före fixen
(riktig server, tre riktiga bottar): säte 2 ute, säte 3 faller → det DÖDA sätet fick bountyn och VP:n, den riktiga
predatorn +0. Efter: +6 och vp2 till rätt säte. `prevLiveSeat()` hoppar över `out` men medvetet INTE `vacant`.
**Turen:** oustas turhållaren lämnas turen vidare (efter rostern), precis som `vacateSeat` alltid gjort — och
som protokolldokumentet hade LOVAT för `bounty` hela tiden utan att servern gjorde det. **Hittat genom att köra:**
bottens egen sena `pass` (v0.6.140+) fick nu `err` i varje trace → en pass från ett oustat säte som inte har
turen ignoreras tyst; ett levande säte som passar ur tur får fortfarande err. **Egen läxa:** servern sparar
`elysium-rooms.json` bredvid SIG SJÄLV, så andra live-körningen dog på 'That room name is taken'; och
`pkill -f <port>` dödade mitt eget skal. Städa json-filerna mellan körningar, leverera dem aldrig.

Grindar: dispatch 50/0 (+3; destruktivt 3/3 mot srv-2.6.37), klient 201/0, protokoll 6/0, canary 37/0,
check-versions grön. Deploy: restart → purge klient + bot + cardfx ihop.

## [ORDNINGEN VAR TUR] — självgranskning av v2.6.122 på Johans stående grind (21 september 2026, klient v2.6.123)

Johan: "är det något du är osäker på eller som ser konstigt ut?" Jag läste om diffen och KÖRDE den enda väg
sviten bara drivit med låtsassäten. **Fyndet:** `hostOustHot` sa till boten först, och bottens `send()` dränerar
SYNKRONT så länge token-hinken räcker — predatorn såg `board > oust-inferred > bounty > roster`. +6 blev rätt
enbart tack vare botprojektets dedupe, under en kommentar (och tre doc-poster) som påstod att VI ordnat det. Nu
går bounty + roster FÖRE `forceOust`; mätt live: `bounty > roster > board`, nätet utlöser aldrig. Tre till:
give till en OUSTAD bot förstörde kortet (bottens mottagare returnerar tidigt) — vägras nu med en toast;
gid klipptes vid 16 (duel-cid:ets tak på fel verb) — serverns `cleanId` är strip + 32; och botfilen laddades
bara vid Start/Add bot, så en ny registerlek kunde inte synas i menyn före första spawn — tyst preload nu.
**Lämnat medvetet:** idle-dialogen ligger kvar om boten hinner passa (knapparna är då no-ops).
v2.6.122 var levererad → version = bytes → v2.6.123; deploya den här, inte 122.

Grindar: klient 201/0 (+2; destruktivt 2/2 mot LEVERERAD v2.6.122), canary 37/0, dispatch 47/0, protokoll 6/0,
B1 byte-identisk, check-versions grön.

## [PARITETSRUNDAN] — hotseat-bottarna får samma bord som online (21 september 2026, klient v2.6.122)

Botprojektets handover (`spec-hotseat-parity-2026-09-21.md`), mätt GENOM vår brygga: 4 av 4 bord frös på en
oustad bot, 0 stealth-kort på 35 blockförsök, ingen bot fick någonsin veta att någon lämnat spelet. Johan
laddade upp bot v0.6.150 bredvid sviten. **Designbeslutet:** bryggan spelar serverns roll och måste därför ÄGA
serverns state — `tally`, `_out`, `_vp` — i stället för fyra lösa reläer. Självförsörjande med flit: deras
harness lyfter `hotBridge`-literalen + `hotFanOut` ordagrant, så allt klientformat är `typeof`-vaktat (lyft och
kört i en bar `new Function`: tally/bounty/roster/openHand/give går fram utan klient bakom).

**Sweepen:** hoppar över `out`-bottar (även de som oustas UNDER svepet). Väntan på pass fick INTE en timer som
går vidare själv — en bot är legitimt tyst i minuter medan en människa löser en combat för hand, och Hold on
har ingen timer by design. `hotAwaitPass()` är en IDLE-klocka (3 min från bottens senaste meddelande, står
still under hold) som FRÅGAR; Cancel armerar om. Samma utgång finns som `⏭ Pass their turn…` i sätesmenyn
offline — hostPass tvilling. **Tally:** serverns handler fält för fält, till varje botsäte INKL. avsändaren
och in i människans `avr`; människans räknare går samma väg via `hotTallySend`. **Bounty/roster:**
bryggan markerar out, betalar LEVANDE predator, pushar serverns roster-form; `hotRosterPush()` på alla fem
out-ställen, synkront FÖRE pool-0-brädet så bottens no-server-nät inte dubbelräknar (andra ordningen täcks av
bottens egen dedupe — LIVE-testet pinnar +6 exakt en gång). **Fyndet på vägen:** `awardBountyHot` skrev +6 i
en blob även när predatorn är den AKTIVA människan — stale medan sätet är live, borta vid nästa handoff; med
en människa + bottar är det normalfallet. Nu: verb till bot, live state till aktiv människa, blob till lagrad.
**Lekar:** bottens `ARCHETYPES` per NYCKEL, `deckName` på båda spawn-vägarna, + Ventrue, de tre inbäddade
V5-listorna borta (list-identiska, kollat), `wall` dold. **Nivåer:** Novice / Experienced / Expert, Expert
default på alla fyra ställen, första klicket på 🤖 landar på Expert. **Reläer:** openHand, give→given+gave,
människa→bot via `giveHotToBot`.

**Beslut:** servern (bounty-predatorn hoppar inte över oustade; turen lämnas inte vidare när turhållaren
oustas) togs INTE med — kräver restart, blir srv-2.6.38 i egen runda. **Till botprojektet:** `_onGiven`
matchar `attachTo` mot NAMN, tråden bär ett CID (läst, ej kört). **Egen läxa:** första destruktiva körningen
hängde sig i 300 s och tappade all output — för att sweep-testet mot v2.6.121 ÅTERSKAPAR frysningen. Timeout +
fil, och hängningen är beviset.

Grindar: klient 199/0 med boten (+9 tester; destruktivt 9/9 mot v2.6.121, varav ett är frysningen själv),
canary 37/0, dispatch 47/0, protokoll 6/0, B1 byte-identisk 1 305 927, check-versions grön. Webbläsarkoll före purge:
1 människa + 2 bottar till en oust, Debug-handen offline, sex lekar och tre nivåer i båda lobbyerna.

## [RECEPTET SLÅR ORDNINGEN] — självgranskning av v2.6.120, ren CSS (17 september 2026, klient v2.6.121)

Johans stående grind. De tre textrecepten vann över `.sayb.chatb .saytxt` bara
för att de stod SENARE med samma specificitet — ett flyttat `.chatb`-block hade
tyst tagit chattens crisp-default, och det enda som fallit var en
ordningsassertion. Recepten ankras nu på `#sayFx`, bubblornas enda värd
(`sayBubble`: `const host=$('#sayFx')`), så id:t slår klassregeln var reglerna
än står; testet pinnar ankaret, monteringspunkten och att inget oankrat recept
finns kvar. Inget annat ändrat.

Grindar: klient 185/0 + 5 skip (destruktivt 2/2 mot v2.6.120), dispatch 47/0,
protokoll 6/0, B1 byte-identisk 1 288 666, check-versions grön.

## [BUBBLAN ÄR DIN ATT STÄLLA IN] — tid och textskärpa per tier (17 september 2026, klient v2.6.120)

Johans idé efter chattextfixen: bubblans tid och text blir INSTÄLLNINGAR per
tier, med dagens utseende som default. Table › Advanced får fyra rader bredvid
Animation length: **Quick-phrase bubble time** och **Chat bubble time** (−/+ i
25 %-steg, 50–200 %, `conv.sayDur`/`conv.chatDur`; 100 % = v2.6.96:s tal exakt,
multiplikatorn läggs EFTER 9 s-taket), **Quick-phrase text** och **Chat bubble
text** (Soft/Normal/Crisp; snabbfras default normal = originalet, chatt default
crisp = v2.6.118). `sayBubbleMs(text, variant)` tar tierns multiplikator,
`sayTextClass(variant)` sätter `.txt-<mode>` på det ENDA bubbelelementet; de tre
CSS-recepten sätter bara vikt/färg/skugga och ligger efter `.chatb`-reglerna
(samma specificitet, senare vinner) — ett test går igenom varje recepts body
efter `font:`/`clamp(`, så storleksklämmorna och medaljong + klanmärke är
orörda. Snabbfraser och verdicts delar bubblan (v2.6.114) och därmed
snabbfrasinställningen; tooltipen säger det. **Fyndet på vägen:**
`convChatBubbles`-tooltipen påstod att snabbfrasen "has its own setting above"
— v2.6.114:s felpåstående, rättat i docsen men kvar i HTML:en. Nu är det sant,
och tooltipen pekar dit. Alla fyra i `SETTINGS_CONV_KEYS`; loadern klämmer
talen och behåller default för okänt textläge (v2.6.113-regeln). Lokalt, inget
på tråden.

Grindar: klient 185/0 + 5 skip (+3 tester; destruktivt 6/6 mot v2.6.119 — tre
nya, tre pinnar uppdaterade: v2.6.96-anropet, v2.6.107-className, v2.6.118:s
crisp-regel som flyttade till `.txt-crisp`), dispatch 47/0, protokoll 6/0, B1
byte-identisk 1 289 321, check-versions grön. Webbläsarkoll före purge: de fyra
raderna, snabbfras + chattrad på 50 %/200 %, tre recept på båda tiers, Reset.

## [ENTER STANNAR HOS DEN FOKUSERADE KONTROLLEN] — självgranskning av v2.6.118 före deploy (17 september 2026, klient v2.6.119)

Johans stående "något konstigt?"-grind. `chatFocus` (Enter) var grindad bara på
att chattraden syns — så en spelare som tabbat till eller klickat på en knapp
(Menu, Pass, ▶) och tryckt Enter för att aktivera den hade fått tangenten
preventad och caret i chatten i stället. `chatFocusWanted()` är grinden nu:
chattrad synlig OCH ingen knapp/länk/select/summary/label har fokus; bar fokus
(body/filten) ger fortfarande Enter till chatten. Testet kör båda fallen via
`__doc.activeElement`. Lämnat medvetet: `phaseNext` dubbel-pushar undo (dispatch
+ `activatePhase`), samma mönster som F1–F5 alltid haft. Kollat och ok:
öppningssvepet i `hotSpawnBots` återställer `turnSeat` till 1 innan `_firstHuman`
skrivs. v2.6.118 var redan levererad → version = bytes → v2.6.119, noten
flyttad till CHANGELOG. Egen läxa på vägen: mitt första test räknade
`prevented` fel (BODY-fallet tar Enter) — sviten fångade det, inte jag.

Grindar: klient 182/0 + 5 skip (destruktivt 2/2 mot v2.6.118), dispatch 47/0,
protokoll 6/0, B1 byte-identisk 1 282 093, check-versions grön.

## [FEM UR FEEDBACKRUNDAN] — Enter, bubbeltexten, fascykeln, Tab och Esc (17 september 2026, klient v2.6.118)

Spelarnas feedback på klienterna, fem punkter, alla rena klientändringar.
**(1) Enter fokuserar chatten** när fältet inte redan är aktivt: ny ombindbar
action `chatFocus` (Shortcuts › Advanced, default Enter), grindad på
`chatVisible()` — solo finns ingen chattrad och då lämnas tangenten åt
webbläsaren utan preventDefault. **(2) Chattbubblans text** blev skarp: weight
700, ljusare ben (#f4ecdc), tät mörk kant i stället för den breda röda dimman;
medaljong och klanmärke behåller sin transparens (testpinnat). Hela bubblans
keyframe-opacitet är orörd — text och medaljong delar element, så glyferna
skärptes, inte "av-tonades". **(3) Fascykeln** `phaseNext` (default §) går
Unlock → … → Discard → Unlock via `activatePhase`, så leave-phase-kollen och
Unlock-prompterna gäller precis som för F1–F5. § var den FASTA vy-cykeltangenten
(med `, död på svenskt tangentbord). Johans val, alt. A: vy-cykeln (`cycleView`,
default V) och Tab-växlingen (`activeHome`, default Tab) är nu ombindbara ACTIONS
med `when()`-grind (`tableView`) och `nav:true` (inga undo-punkter för
vyflyttar). `keyBindsReconcile`: en nykomling vars default spelaren redan bundit
till något annat startar obunden — spelarens bindning vinner. Den globala
handlern är utbrutna `keyDispatch(e)`, som sviten kör med ett rent
`{key,target}`-event. **(4) Tab nådde aldrig en bot offline** — orsaken sitter i
`pass()`: människans säte ligger kvar i `net.turnSeat` genom hela botsvepet, så
`toggleActiveHome` läste "aktiv = jag" och gick hem. Svepet sätter nu den
agerande boten som `turnSeat` medan den spelar och återställer i `finally`.
Konsekvens: fasraden är read-only och PREY/PREDATOR räknas från boten under dess
tur — bot-turer ÄR turer (v2.6.67). Online täcker serverns `turn{seat}` redan
bottsäten; läst som fungerande, ej webbläsarverifierat. **(5) Esc på startrutan**
målade filt + poolglob: Esc-rungen körde `goHome()` villkorslöst → `enterL2()`
släppte `l0mode`. Hoppas över när `tableIdle()`; overlays och menyer stängs
fortfarande. Esc-handlern är en document-listener harnessen inte kan avfyra —
den punkten är en källpinne, ärligt sagt.

Grindar: klient 182/0 + 5 skip (187 med boten; +6 tester, destruktivt 6/6 mot
v2.6.117; v2.6.107-pinnen på weight 600 uppdaterad till 700 — den pinnar
STORLEKEN), dispatch 47/0, protokoll 6/0, endpoint 20/0, canary skip utan boten,
B1 byte-identisk 1 282 724, check-versions grön. Webbläsarkoll före purge: Enter
vid hotseat med bottar + online, § genom en tur, V/Tab i rum, Esc på startkortet.

## [DEN PERMANENTA RESUME-KNAPPEN] — introducerad i v2.6.105, hittad av Johan (16 september 2026, klient v2.6.117)

Johan: en Resume på startkortet som varken webbläsarstängning eller cache-purge
rubbar, och som öppnar en trasig vy utan rum bakom. **Kedjan:** `closed`-
hanteraren (v2.6.105) sätter `net.status='off'` FÖRE `mpLeave` — medvetet, för
socketen — men `mpLeave` avgjorde om bordet skulle rensas med `netGame()` =
`inRoom() && deckUp`, och `inRoom()` är just status. Varje bord som slutade via
Close table (eller srv-2.6.36:s botrumsstängning) tog därför else-grenen: korten
låg kvar, `net.room` blev null, och nästa minut-autosave skrev onlinebordet till
`saveKey()` utan rum = det BARA `elysium.game`, solosparningen som inget tar
bort. localStorage överlever en purge. **Fixen:** `hadGame=!!net.deckUp` (frågan
är om en online-deal lade korten där, inte vad anslutningen säger just nu),
rensa+glöm i en `mpTableGone(roomKey)`, och den misslyckade återanslutningens
`err`-gren — samma hål, äldre och sällsyntare — anropar den också. Två
beteendetester kör `closed`/`err` genom MP_HANDLERS på ett delat bord och läser
storage-stubben (`__ls`, ny i harnessen); destruktivt 2/2 mot v2.6.116.
För Johans fastnade knapp: Settings › Files & storage › Delete the autosaved
game, en gång. Läxan inskriven: en anropare som muterar state för att styra en
delegat måste granska varje fråga delegaten ställer till det statet.

Grindar: klient 181/0, dispatch 47/0, protokoll 6/0, canary 37/0, B1
byte-identisk, check-versions grön. Deploy: purge.

## [LÅSET ÄR DEFAULT] — toggeln bort, låset kvar, och en självgranskning före deploy (16 september 2026, klient v2.6.116)

Johan efter v2.6.115:s genomgång av vad Tournament lock faktiskt styr: ta bort
den visuella toggeln, låt låset vara på, lägg tillbaka valet om feedbacken ber
om det. `#mpTournLock` borta ur Create game, `mpCreate` skickar `tournLock:true`
för varje rum; `mpLiteDefaults` tvingar inte längre en kryssruta som inte finns.
Låsets innehåll oförändrat och helt serverburet (leklegalitet 12+/60–90,
inga lekbyten/redeal/egen-VP/egen-un-oust efter start, 🏆 i listan) och
oberoende av helper-policyns "Tournament mode" — de delar ett ord, inget mer.
Tutorialstoppet `oh-tournlock` borttaget, förklaringen flyttad in i Helpers-
stoppet. Återställningsreceptet står i HTML-kommentaren där etiketten satt.

**Självgranskning av v2.6.115 (Johans fråga):** ett fynd — stoppursavbrottet
på verbbärande låskloner träffade även controller-relayens `by <namn>` (8757);
att någon annan låser ditt kort är ingen reaktion, exkluderat. Kontrollerat
och lämnat: botens reconnect kan inte återplacera en bot vi låtit lämna
(kräver `started`, och krysset finns bara i lobbyn); `send` köar på botens egen
socket; 2 s-taket faller tillbaka på värdens kick.

Grindar: klient 179/0, dispatch 47/0, protokoll 6/0, canary 37/0, B1
byte-identisk, check-versions grön. Deploy: purge, ingen omstart.

## [EKOT, STOPPURET OCH KRYSSET] — tre fynd ur Johans testrunda (16 september 2026, klient v2.6.115)

**(1) Krysset i lobbyn.** `netBotRemove` skickade `kick` på VÅR socket och
stängde BOTENS i samma andetag — och de två racear över tråden. En socket
som bara stängs är en FRÅNKOPPLING, inte ett avsked: `dropPlayer(conn,false)`
(srv 1536) behåller sätet i rostret med `p.off` satt, för återanslutnings-
fönstret en människa har rätt till — och `kick` vägrar just det sätet
("still reconnecting", srv 1027). Botten både försvann och satt kvar; Johans
formulering var en exakt läsning av tillståndet. Nu LÄMNAR botten själv, på
sin egen socket (`leave` = `dropPlayer(conn,true)`, sätet klipps ut direkt),
och vi stänger först när lobby-pushen bekräftar att det är borta. Värdens
kick finns kvar som fallback för en bot vars socket redan är död. Ingen
serverförändring.

**(2) Egen chatt dubblerades vid "Visa alla".** Raden har TVÅ källor: send-
vägen målar den direkt, servern ekar tillbaka den till alla inklusive dig.
v2.6.50 gömde ekot som en SIDOEFFEKT av att gömma din egen rad överhuvudtaget;
v2.6.113 gjorde testet till ett LÄGE, och då släppte "Visa alla" fram ekot
också. `chatBubbleWanted(who, src)` vet nu vilken av de två den tittar på —
ett eko av din egen rad målas aldrig, i något läge. Johans känsla att "vi
hade ett liknande problem med snabbfraserna" stämde: samma form som v2.6.55,
via en annan väg. Inskrivet i learnings.

**(3) Stoppuret.** Exakt EN händelse hade någonsin stoppat reaktionsfönstret
(snabbfras, via `showSay`, v2.6.33). `dfxCancel()` är nu den enda vägen och
anropas från `showSay`, från `cardFx` vid spelat kort och vid en anmäld
handlings låsklon (endast med verb — ett rent Lås är inget svar), OVANFÖR
animMode-returerna så att den håller även med animationer av och för fjärr-fx,
samt lokalt från `act`/`actBleed`/kortordningens card action för autoLock-av-
fallet. MEDVETET INTE `tally`: enligt bot-överlämningen skriver botten sin
stealth till den delade räknaren vid VARJE announce, så en tally bevisar inte
längre att någon reagerade. Kvarstående och namngivet: autoLock av + redan
låst minion ger fjärrskärmarna bara en relayad loggrad, och där tickar klockan
vidare.

Grindar: klient 179/0, dispatch 47/0, protokoll 6/0, canary 37/0, B1
byte-identisk 1 277 347, check-versions grön. Öppet till Johan: ta bort
Tournament lock som val och ha det på som default (analys levererad, väntar
på "kör").

## [NIVÅERNA KORSAR ALDRIG VARANDRA] — och en rättelse jag är skyldig (15 september 2026, klient v2.6.114)

Johan frågade om en snabbfras också kan trigga den nya
chattanimationen. Den kan inte det — verifierat, och nu PINNAT
istället för att lämnas att läsas om.

Exakt EN anropsplats ber `sayBubble` om `.chatb`-varianten
(`chatBubble`, 13748). Snabbfrasen (13821) och resolverns
verdict (13723) går båda till den höga bubblan. `showSay`
nämner aldrig `chatBubble`, och chatt-hanteraren känner inte
till `showSay` eller `SAY`.

**Rättelsen.** I v2.6.113:s versionsnot upprepade jag Johans
formulering om att snabbfraserna "har sin egen inställning" —
utan att kontrollera. De har INGEN inställning. `showSay()` går
rakt till `sayBubble` utan helper, utan `conv`-värde, inte ens
`animMode`. Trevägsvalet han tänkte på är `conv.anim`
(`animMode`: on / mine / all), som styr KORTanimationerna. Rätt
mönster, fel lager.

Johans egen läsning är att frånvaron är avsiktlig: tar man en
snabbfras vill man att den syns. Rimligt — men det var en
slutsats jag skrev ned som fakta innan någon hade dragit den.

**Värt att spara för den som bygger den saknade kontrollen:**
den höga nivån har TVÅ källor, `say{i}` och resolverns
verdict-rader, som delar en bubbla. "Dölj snabbfraser" och
"dölj verdicts" är alltså inte samma strömbrytare, och den som
lägger en grind måste välja vilken.

§12.0 bär nu en tabell över vad som styr respektive nivå,
bredvid den som säger vad nivåerna betyder.

Gates: klient 174/0 · dispatch 47/0 · protokoll 6/0 · canary
37/0 · B1 byte-identisk · check-versions grönt. Purge.

## [VEMS BUBBLA] — chattbubblorna blir ett val (15 september 2026, klient v2.6.113)

Johan ville ha ett trevägsval över chattnivån, i Advanced-
fliken, likt dropdownarna som redan finns där.
`conv.chatBubbles`: **Hide mine** (default), **Show all**,
**Hide all**.

**Det som gjorde det till en liten ändring:** "inte min"-testet
har suttit i chatt-HANTERAREN sedan v2.6.50
(`if(m.who !== net.you) chatBubble(…)`). Det är precis därför
det aldrig kunde bli en inställning — ett policybeslut inbakat
i en dispatcher. Det flyttade till `chatBubbleWanted()`, en ren
funktion sviten kan köra direkt, och hanteraren kallar
`chatBubble` villkorslöst nu.

**Två grindar, medvetet ordnade.** `hx('chatFx')` frågas FÖRST
och är bordets: värden kan låsa animationen av, tournament
dödar den. `conv.chatBubbles` frågas sedan och är din, och den
kan bara SUBTRAHERA — en lokal preferens kan aldrig visa en
bubbla värden låst bort, och tournament får inget hål. Ett
okänt sparat värde faller tillbaka på defaulten och inte på
"visa allt", av samma skäl.

Snabbfraserna är orörda, och sviten pinnar att `sayBubble`
aldrig frågar chattfiltret.

Gates: klient 173/0 · destruktivt 2/2 vs v2.6.112 · dispatch
47/0 · protokoll 6/0 · canary 37/0 · B1 byte-identisk ·
check-versions grönt. Purge.

## [FRÅNVARANDE ÄR INTE AV] — chattanimationen dog på en nyckel servern aldrig hört talas om (15 september 2026, klient v2.6.112)

Chattanimationen utlöstes aldrig, varken för Johans egen text
eller botens. Tre fynd.

**`hx()` läste FRÅNVARANDE som AV.** Servern bygger en låst
policys settings-map ur SIN EGEN `HELPER_KEYS` (srv 291). Alltså
finns `chatFx` — tillagd i klienten v2.6.107 och i servern
srv-2.6.37 — helt enkelt inte i någon policy som den srv-2.6.35
Johan kör stämplar. `hx()` gjorde
`!!(p.settings && p.settings[key])`, så frånvarande blev false
och `chatBubble` returnerade innan den ritade något.

En nyckel policyn inte NÄMNER styrs inte av den. Den faller nu
igenom till den lokala inställningen, och `key in p.settings`
håller "bordet säger av" skilt från "bordet har aldrig hört
talas om det här". Tournament går fortfarande först, så en
okänd nyckel kan inte bli ett hål i det.

**Buggen var maskerad av en annan bugg.** Så länge v2.6.111:s
nollande broadcast levde försvann policyn hela tiden och `hx()`
föll igenom till det lokala värdet — `chatFx` fungerade av
misstag. Att laga den riktiga buggen är vad som blottade den
här. Värt att minnas: en fix kan avslöja en andra defekt som
den första höll dold, och det ser ut som en regression.

**Egen chatt har aldrig bubblat, med flit.** v2.6.50:
`if(m.who !== net.you) chatBubble(...)` — bubblan är
mottagarsidig. Testar man ensam med en bot ska bara botens
rader poppa.

**Panelen flyttad** från `bottom:64px` till `top:74px`. På en
laptop-viewport täckte poolgloben den.

Metodnot: för TREDJE gången den här sessionen utlöste en
proskommentar sitt eget källpåstående — den nya kommentaren
säger "was bottom:64px". Testet skivar cssText-literalen nu
istället för regionen.

Gates: klient 171/0 · destruktivt 2/2 vs v2.6.111 · dispatch
47/0 · protokoll 6/0 · canary 37/0 · B1 byte-identisk ·
check-versions grönt. Purge.

## [TVÅ NAMN PÅ SAMMA SAK] — All helpers on har aldrig hållit (15 september 2026, klient v2.6.111)

Johan skapade ett rum med **All helpers on** och satt vid ett
bord med bara en Pass-knapp. Konsolen avgjorde det på en rad:
`net.helperPolicy` **null**, `hx('on')` false, `#phases` bar
`helperoff`.

**Servern har två namn på samma objekt.** `joined` stämplar
`msg.helperPolicy` (srv 411). Den dedikerade broadcasten
skickar `{ t:'helperPolicy', policy }` (srv 957). S2c-hanteraren
läste bara `m.helperPolicy`.

Alltså: den FÖRSTA policyn landade rätt — och första gången
något BEKRÄFTADE den nollades den på varje klient i rummet. Att
lägga till en bot (`netBotHelperLock`), en värdändring, vad som
helst som kallar `setHelperPolicy`. Med policyn null faller
`hx()` till sin lokala gren och spelarens egen
`conv.tournament` avgör. Ett bord som uttryckligen skapats som
låst-allt-på kördes med allt AV. Exakt den invertering Johan
beskrev.

Hanteraren läser `m.policy || m.helperPolicy` nu. Det fungerar
mot **varje redan deployad server** — ingen omstart, hans
srv-2.6.35 blir hel av klienten ensam.

**Varför ingen gate fångade det, och det här är delen värd att
behålla:** protokoll-linten diffar DOKUMENTET mot KLIENTENS
hanterare, aldrig mot vad SERVERN faktiskt skickar. En
fältnamnsmiss mellan de två sidorna är osynlig för linten,
dispatch-sviten, klientsviten och canaryn lika.

Jag prototypade en generell diff: varje serverutskick mot varje
`m.FÄLT` en hanterare läser. Den flaggade det här korrekt — och
28 falska positiva därtill, eftersom servern relayar `say`,
`fx`, `decide` och `tally` ordagrant utan att någonsin namnge
deras fält. En generell gate är alltså möjlig men kräver riktig
relay-medvetenhet. Tills vidare pinnas det specifika kontraktet
av ett test som påstår BÅDA serverns utskicksplatser ordagrant
och kör den levande broadcastformen genom hanteraren.

**Sidoeffekt:** v2.6.103:s bottlås har skickat en korrekt policy
hela tiden och sett bekräftelsen radera den.

Metodnot: jag kunde inte hitta det här genom att läsa
klientkoden — kedjan ser korrekt ut hela vägen, och jag
simulerade till och med round-tripen och fick rätt svar. Det var
tre rader i konsolen som avgjorde. När koden säger att något
borde fungera och användaren säger att det inte gör det, är det
observationen som vinner och instrumenteringen som saknas.

Gates: klient 169/0 · destruktivt vs v2.6.110 · dispatch 47/0 ·
protokoll 6/0 · canary 37/0 · B1 byte-identisk · check-versions
grönt. Purge.

## [FEEDBACKRUNDAN STÄNGD] — alla tretton punkter klara (15 september 2026)

Johans feedbackrunda efter de första onlinepassen med bottar är
helt avbetad. Klienten gick v2.6.102 → **v2.6.109**, servern
srv-2.6.35 → **srv-2.6.37**, botprojektet v0.6.108 →
**v0.6.112**.

Vår sida: #9 scrollhjulet, #6 helper-låset, #2 Close table,
#11a snabbfraserna, #10a Vote-menyn, #12a den frusna
blockgrammatiken, #7a chattanimationen, #1 botpanelen — plus
v2.6.104 (policyn tillbaka före dörren) och v2.6.109
(granskningens tre kopplingsluckor), som båda var följdfynd,
inte punkter på listan.

Deras sida: #3a, #4, #5, #7b, #8, #10b, #11b, #12b, #13.

**Två rättelser från Johan värda att bevara:**

*#3a var aldrig halvklar.* Jag läste punkten som "dölj vilken
vampyr boten influerar" och rapporterade botens val att
fortsätta namnge vampyren vid RESNINGEN som ett delvis
avböjande. Johan menade placeringen, inte resningen — kortet
blir de facto publikt när det reser sig. Botprojektet läste
avsikten rätt från början.

*#5 var inte ett datafel.* Jag drog slutsatsen att cardfx
saknade `cost.pool`. Johan kollade datan: den var korrekt hela
tiden, kostnaden drogs hela tiden, och problemet var att ingen
kunde SE det — Vessel är en trifle, så bonushandlingen köper
ofta en andra master vars inkomst lämnar tillbaka poolen inom
samma fas. Synligt netto noll. Redan löst i v0.6.109 med en
additiv statusrad (bot 5031), vilket jag missade genom att
grep:a efter den rad jag förväntade mig och stanna där.

Båda metodfelen ligger i learnings.

**Ingenting av v2.6.103–109 eller srv-2.6.36–37 är kört i en
webbläsare eller mot en riktig server.** Sju klientversioner
och två serverversioner staplade. Nästa steg är kollen och
deployen, inte mer kod.

## [PANELEN, GRANSKAD] — tre kopplingsluckor som en webbläsare hade visat på en minut (15 september 2026, klient v2.6.109)

Johans grind före test, och den betalade sig tre gånger på en
version som levererats en timme tidigare.

**Online visades panelen aldrig.** `hotBotBtnShow(true)`
anropades bara från offline-spawnen. Varje onlinesession hade
lagt till en bot och sett ingenting. `netBotAdd` monterar den
nu efter helper-låset, `netBotRemove`/`netBotsTeardown` ber den
fällas ihop — vilket den bara gör när `botPanelSeats()` är tom,
så att ta bort en av tre bottar behåller panelen.

**Offline väntade debugraden på en dropdown-ändring.**
`renderOfflineSeats` togglade `#offAlphaNote` när en sits blev
bot men synkade aldrig sitt nya syskon. Den kallar
`botDebugSync()` nu.

**Klickracet.** 4 Hz-loopen gjorde `el.innerHTML=h` varje tick,
och en knapp som byts ut mellan mousedown och mouseup tappar
klicket — knapparna hade varit slumpmässigt oklickbara i exakt
det ögonblick de behövs. Ombyggnaden ligger nu bakom en
formsignatur (öppet läge, rader, namn, anledningar, steg,
stegbarhet och OM en deadline finns — medvetet inte dess värde)
och ett vanligt tick skriver bara om nedräkningstexten på plats.

**Det som kunde testas testades.** Ett nytt LIVE-test seatar en
riktig bot över hotBridge, sätter den i ett hold från
människositsen och läser den genom panelens egen
`botPanelRead()`: `held` / `hold: You` / `until:null` /
`release-hold` / `canStep:true`. `b.step()` ger
`did:'release-hold'`, boten spelar sedan turen och passar, och
ett andra tryck är no-op med förklaring. Renderingsloopen
hamrades 60 tick genom sex `status()`-former inklusive kast,
null och `{}` med nio toggles: noll kast.

**Det som inte kunde:** harnessens DOM är en Proxy-stubb. Den
bevisar att kodvägen inte kastar, inte hur panelen ser ut.
Layout, storlekar och knappkänslan behöver fortfarande en
webbläsare.

Lärdomen är obekväm och viktig: en källtestsvit på 164/0 hade
inte en enda assertion om att panelen faktiskt monterades
online. Testerna bevisade att funktionerna var korrekta, inte
att någon anropade dem. Källpåståenden fångar formen, inte
kopplingen.

Gates: klient 167/0 · dispatch 47/0 · protokoll 6/0 · canary
37/0 · B1 byte-identisk · check-versions grönt. Purge.

## [BOTPANELEN] — feedbackrundans sista klientbitar (15 september 2026, klient v2.6.108)

Botprojektet levererade R1–R4 (v0.6.109–v0.6.112) och skickade
tillbaka en handover. Deras `status()` är exakt den seam vi bad
om den 14 september, och `step()` är bättre byggd än jag vågade
hoppas: den drar en REDAN EXISTERANDE väntan framåt genom samma
metod klockan hade kallat, så en knapptryckning kan aldrig nå
ett utfall boten inte kunnat nå själv — och deras svit förblir
ett sant påstående om boten med knappen också.

**Widgeten.** Hopfällbar robot i hörnet, öppet läge sparat i
localStorage, ihopfälld som default (Johans val: den ska inte
clogga UI:t). En rad per bot: namn, vad den väntar på i
bordsspråk, nedräkning mot `until`, och en stegknapp som märker
sig själv ur `status().step`. Allt i processen — bottarna bor i
DENNA flik i båda lägena — så ingen wire-ändring, och online
blir den host-only, vilket är rätt: bara värden håller
socketarna.

Ett hold visar tankstreck istället för siffra, för bot 615 ger
det `until:null` med flit — det tar slut när en människa säger
till. `botPanelRead()` behandlar `status()` som någon annans
kontrakt: ett kast, en null, en saknad metod eller en orimlig
deadline degraderar alla till en läsbar rad istället för att
döda en renderingsloop som går fyra gånger i sekunden.

**▶ försvann inte, den flyttade in.** `step()` drar en väntan
framåt, den spelar ingen tur — så sveparen behövs fortfarande
och är nu en rad i panelen istället för en andra flytande knapp
i samma hörn.

Panelen gick in i `BOARD_CHROME`. En rad, båda gesterna. Det
var precis vad konstanten byggdes för i v2.6.103.

**Debug bot.** Spawn-option på båda Add-bot-vägarna, som de
specade — boten läser `o.debug` vid konstruktion och armerar på
given, så den läses när en bot läggs till, aldrig petas in i en
levande instans. De bad oss tvinga av den i tournament eftersom
boten inte kan se bordets läge. `botDebugAllowed()` vägrar om
NÅGON auktoritet säger tournament, medvetet ogrenad och
felande STÄNGT: att vägra fel kostar ett debughjälpmedel, att
tillåta fel öppnar en hand för bordet.

Första utkastet hade `conv.tournament && !off` — och den
villkoret föll öppet i sviten, eftersom en stubbad dropdown
svalde konventionskollen. Det är precis den sortens smarta
villkor som felar åt fel håll.

**Trainbot-regressionen når oss inte.** Kollat: varje
botkonstruktion på vår sida passerar ett namn, och enda
förekomsten av literalen är en däcketikett. Inga fixturer,
inga arenakörningar.

**Inte taget:** deras fyra nya rattar stannar på defaults. Fyra
sifferfält i botraden är brus innan någon vet vilket värde som
faktiskt skaver.

Gates: klient 164/0 · destruktivt 5/5 vs v2.6.107 · dispatch
47/0 · protokoll 6/0 · canary 37/0 · B1 byte-identisk ·
check-versions grönt. Purge.

Webbläsarkollen: sätt en bot, fäll ut roboten, låt den fastna i
en Block?-fråga och se nedräkningen. Tryck stegknappen. Offline:
kolla att "Run bot turns" gör samma sak som gamla ▶.

## [TRE RÖSTER] — chatten får en egen, lugnare stämma (14 september 2026, klient v2.6.107 / server srv-2.6.37)

Klagomålet: en lång botchatt landar i en font så stor och så
utdragen över skärmen att ögat inte hinner parsa den innan den
tonar bort — medan snabbfraserna faktiskt tjänar på storleken.

**De tre nivåerna fanns redan.** `log` (status), `chat` och
`say{i}` har varit tre kanaler på tråden hela tiden. Det som
saknades var att `chat` och `say` delade ett enda visuellt
recept, så en 110-teckensinstruktion renderades i 58px-fonten
som skrevs för "Block!".

**Lösningen är en variant, inte en andra funktion.**
`sayBubble(role, who, seat, text, variant)` lägger till klassen
`chatb`. `.chatb` skriver över exakt tre saker: typografin
(`clamp(15px, 1.6vw, 24px)` mot frasfontens `clamp(22px, 4.5vw,
58px)`), radmåttet (`min(46ch, 70vw)` — det klassiska läsbara
måttet, så texten BRYTS i en osynlig kolumn istället för att
dras ut) och medaljongen (190px bakom en 16px-rad hade svalt
den; 110px nu). En monteringsväg, en delad tre-bubblors budget.
En parallell `chatBubble()`-montering hade varit en andra väg
att glida ifrån.

Centrerat är Johans val framför vänsterställt, att bedömas i
webbläsaren.

**En ny Helper är inte en ren klientändring.** `HELPER_DEFS`
har en handskriven spegel i serverns `HELPER_KEYS` (srv 286),
och `cleanHelperPolicy` bygger sin settings-map ur DEN listan
ensam. `chatFx` i klienten utan `chatFx` i servern hade tyst
fallit bort ur varje host-låst policy. Därav srv-2.6.37 och
restart. Ett test diffar nu listorna åt båda hållen.

Chattklippet gick 120 → 180 tecken, och grinden sitter i
`chatBubble`, aldrig i `chat`-hanteraren: att stänga av
animationen får inte kosta dig meddelandet.

**Protokollet:** nya §12.0 skriver ner vad de tre kanalerna
BETYDER — status / tal / ett rop — med annonsera-sen-fråga
namngivet som den kända dubbelbubblan. Det är överlämningen för
botprojektets halva (#7b): flytta kortspelsannonsen från `chat`
till `log`.

**Parkerat (Johan, 14 sep):** röster kan vara neutrala, och
Vote-submenyn skulle kunna mata Played-fönstrets egna
For/Against-räknare så neutrala röster kan ökas manuellt.
Additivt — minionens `casts N votes for.` och resolverns
`Vote: A for vs B against — vote passes.` är separat frusna, så
att koppla menyn till räknaren bryter ingendera.

Gates: klient 159/0 · destruktivt 4/4 vs v2.6.106 · dispatch
47/0 · protokoll 6/0 · canary 37/0 · B1 byte-identisk ·
check-versions grönt.

**Deploy: serveromstart + Cloudflare-purge.**

Webbläsarkollen: skriv en lång rad i chatten och jämför med en
snabbfras — chatten ska vara läsbar och brytas i en kolumn,
frasen ska fortfarande vara stor. Stäng av Chat text animation
i Settings: raden ska finnas kvar i loggen utan bubbla.

## [KONTRAKTSRUNDAN] — vi fryser vad vi faktiskt säger, innan någon skriver beteende mot det (14 september 2026, klient v2.6.106)

Överlämningsrundan. Allt systerprojektet behöver från oss för
politik och för att blocka handlingar boten inte känner igen,
levererat som kontrakt INNAN någondera sidan skriver beteende.

**SAY +2, adderade sist.** 8 `Any blocks?`, 9 `Any reaction?` —
frågesidan av två fraser som hittills bara fanns som svar, så
en människa kan prompta en bot på samma sätt som boten redan
promptar en människa. Adderade sist och aldrig omordnade:
`say` bär ett INDEX på tråden och boten speglar arrayen
(bot 390). En insättning någon annanstans döper om varje fras
för varje peer på en äldre build — tyst, utan fel i någon ände.

**Vote-submeny under Actions.** `Political action` går genom
`act()`: den låser, stänger spelbatchen och bär target-suffixet
— alltså når den botens blocksteg på exakt samma väg som en
bleed. Det är hela poängen: boten har ingen politikmodell, men
den kan fortfarande bli tillfrågad om block. `Cast votes → For…
/ Against…` frågar efter antal (klämt 1–99 som Bleed X) och
annonserar UTAN att låsa eller stänga batchen, eftersom en
minion med titel behåller sina röster medan den är låst.

**§12 fryser vad klienten faktiskt säger.** Botens egen
grammatiktabell har burit människoklientens formuleringar som
*"unverified (main-project ask)"* ända sedan THE SPLIT. Nu står
de: `blocks.`, `hunts.`, `attempts to rescue a vampire from
torpor.`, `commits diablerie!` (den enda handlingsraden utan
punkt), `takes a card action.`, `NAME's card action is used.`
för ett icke-minion-kort i en counter-zon, plus de två nya
röstformerna med sin singular/plural-regel.

Nya §12.1 fryser själva `say{i}`-tabellen och skriver ut de två
regler som gör ett blandversionsrum säkert: bara addera sist,
och tolerera okänt index istället för att fela. Ett test
parsar §12.1:s tabell UR dokumentet och jämför rad för rad mot
den levande `SAY` — de kan inte glida isär.

**Vad det låser upp i botprojektet:** reaktionskroken på
`Any blocks?` / `Any reaction?`, politikfrågan "Will this action
cause me to lose pool?" med pool-bokföringen som hålls till
Resolved, och blockdoktrinens regel att en människa som
högerklickar Block innan hen tar snabbfrasen REDAN har
annonserat blocken.

Gates: klient 156/0 · destruktivt 3/3 vs v2.6.105 · dispatch
47/0 · protokoll 6/0 · canary 37/0 · B1 byte-identisk ·
check-versions grönt. Purge.

Webbläsarkollen: högerklicka en ready minion → Actions → Vote.
Political action ska låsa minionen och synas i loggen; Cast
votes ska INTE låsa. Snabbfrasmenyn ska ha tio rader.

## [BORDET STÄNGS SOM EN AVSIKT] — closeRoom, människoräkningen och bottarnas korta nåd (14 september 2026, klient v2.6.105 / server srv-2.6.36)

Johans rapport var att rummet stod kvar i listan när han
lämnade som värd, "eftersom botten finns kvar". Det visade sig
vara tre separata saker i samma rock.

**Att stänga hade inget verb.** `kick` finns men tar en spelare
i taget. Att loopa den från klienten hade varit en kedja av
sidoeffekter istället för en avsikt — och sista kicken hade
lämnat värden ensam i ett rum som sedan raderades av
tomhetsregeln. Nytt REF_VERB `closeRoom` → `closeRoomNow(room,
msg)`: broadcasta `closed{msg}` FÖRST så alla vet varför,
radera rummet, stäng sedan varje socket. Idempotent
(`rooms.has`-vakt), för nu kan två vägar kapplöpa om att stänga
samma rum.

**Servern kunde inte skilja en människa från en bot.** `p.bot`
har funnits sedan 13 juli men har bara matat rostern med
styr-mina-element-undantaget — ingenting har någonsin räknat
den. `humansLeft(room)` är den räkningen, och den räknar
medvetet SÄTEN I ROSTERN, inte sockets: en människa som tappar
uppkopplingen är fortfarande en spelare och behåller sitt rum
(det är vad reconnect-fönstret är till för), medan en människa
som verkligen lämnar är borta. Ett riktigt `leave` som tar
sista icke-botspelaren stänger nu rummet direkt.

**60-minutersregeln var skriven för ett riktigt bord.** Ett rum
med bottar och ingen människa ONLINE får `BOT_ROOM_GRACE_MS`
(10 min) istället — onlinebottarna bor i värdens flik, så när
människan är borta är de också det. Det ramar dessutom in det
enda fall v2.6.104 inte kunde nå: en värd som stänger fliken
skickar ingen policyåterställning, och nu dör den låsta policyn
med rummet på tio minuter istället för att överleva sessionen
med en timme.

**Klienten.** `Host…` får `Close table…` (bara online — ett
hotseat har inget rum att stänga), och `Leave seat` frågar en
värd med sällskap vad hen menar via den befintliga
tre-vägsdialogen: Leave only / Close the table / Cancel, där
cancel gör ingetdera. `mpCanCloseRoom()` är grinden, och bottar
räknas INTE som sällskap — med den nya serverregeln får en värd
som sitter ensam med bottar samma utfall oavsett, och då vore
frågan en fråga med ett enda riktigt svar.

`closed`-hanteraren sätter `net.status='off'` FÖRE `mpLeave`.
Det hoppar över det meningslösa `leave`-utskicket och hindrar
`ws.onclose` från att starta sin 2,5-sekunders rejoin-loop mot
ett rum servern redan raderat. Ordningen är hela poängen och
pinnas av ett test.

Processnot: hjälmenyns patch föll först på en dubblerad
backslash — `Host\\u2026` i heredoc:en blev literalen istället
för tecknet. Write-after-loop räddade filen: assert föll före
skrivningen, ingenting rördes. Exakt den regel learnings redan
bär, nu bekräftad en gång till.

Gates: klient 153/0 · dispatch 47/0 · destruktivt 4/4 vs
srv-2.6.35 · protokoll 6/0 · canary 37/0 · B1 byte-identisk ·
check-versions grönt.

**Deploy: serveromstart + Cloudflare-purge.**

**Tre kantfall, granskade och medvetet lämnade (Johans
osäkerhetsgrind efter leverans):**

1. *En frånkopplad spelare hör aldrig varför bordet stängdes.*
   `closeRoomNow` broadcastar `closed{msg}`, men `bcast` hoppar
   över spelare med `p.sock === null` — alltså alla i
   reconnect-fönstret. De återansluter, skickar `join{token}`
   och får det generiska "No such room" istället för "Alice
   closed the table." Fixen vore att spara anledningen per
   rumsnamn och servera den vid ett misslyckat join; det kostar
   ett nytt tillstånd med egen livslängd för ett sällsynt fall.
   Medvetet ogjort.

2. *Socket-kaskaden i `closeRoomNow` är brusig men ofarlig.*
   Varje `wsClose` triggar så småningom `dropPlayer(conn,false)`,
   som kallar `sys(room, '… disconnected.')` och broadcastar
   till sockets som redan stänger. Rummet är borta ur `rooms`,
   varje klient har redan rivit ner sig på `closed`, och ingen
   logik hänger på meddelandena — men serverloggen får N rader
   "disconnected" efter en stängning. En `_closing`-flagga på
   rummet som `sys` läser hade tystat det på tre rader, till
   noll funktionell skillnad. Medvetet ogjort.

3. *`mpCanCloseRoom` kan se noll åskådare strax efter connect.*
   Grinden läser `net.watcherList` och faller tillbaka på
   `net.watchers`; båda fylls först av `roster`. En värd som
   öppnar menyn under samma sekund som en åskådare ansluter kan
   därför få fel fråga. Kantfall utan känd väg att träffa i
   praktiken.



Webbläsarkollen: värd + en människa + en bot. (1) Host… → Close
table — alla ska kastas ut med meddelandet, ingen ska försöka
återansluta. (2) Leave seat som värd — tre val ska visas. (3)
Lämna som sista människa med bara bottar kvar — rummet ska
försvinna ur listan direkt, inte om en timme.

## [POLICYN LÄMNAS TILLBAKA FÖRE DÖRREN] — en dörr som redan stängts kan inte tala (14 september 2026, klient v2.6.104)

Johans stående "något du är osäker på?"-grind, en leverans
senare, och svaret var ja.

v2.6.103 gjorde bottlåset till ett riktigt lås
(`allowLocal:false`) — och därmed befordrades en vilande
asymmetri till en verklig bugg. Att ta bort sista boten
återställer policyn. Att LÄMNA rummet gjorde det inte. En värd
som gick medan bottarna satt kvar lämnade alltså kvarvarande
spelare på ett helper-låst bord med ingenting som höll låset.
Före v2.6.103 spelade det ingen roll: "låset" som lämnades
kvar var den vanliga `allowLocal:true`-standarden.

**Den uppenbara platsen var fel plats.** `netBotsTeardown` ser
ut som hemmet för återställningen. Hade jag lagt den där hade
den misslyckats tyst: `mpLeave` skickar `leave` på rad 8334,
servern kör `dropPlayer(conn, true)` (srv 1261) och rensar
`conn.room`/`conn.player` — så vid teardown-anropet på 8340
svarar varje GAME_HANDLER "Join a room first". Pushen hade
studsat och ingenting hade synts.

`mpLeave` kallar `netBotHelperUnlock(true)` FÖRE leave-verbet
istället. Unlock fick en quiet-flagga så en nedmontering inte
toastar, och teardownens kommentar säger rakt ut varför
återställningen medvetet inte bor där. Två tester pinnar
ORDNINGEN på tråden, inte bara att meddelandet finns.

**Kvarstår, medvetet:** en värd som stänger FLIKEN skickar
ingenting alls, så rummet behåller den låsta policyn. Samma
rot som ditt rum-kvarstår-fall, och den varaktiga lösningen är
serversidig — den hör hemma i Close table-rundan.

Sidonot om metod: för andra gången samma session lurades ett
källpåstående av en kommentar. Hjulcensusen räknade ordet
"stopPropagation" inne i en kommentar OM stopPropagation, och
teardown-censusen matchade `netBotHelperUnlock` inne i
kommentaren som förklarar varför `netBotHelperUnlock` saknas
där. Censusen strippar `//`-rader nu. Ju noggrannare en ändring
kommenteras, desto större chans att dess egen förklaring
utlöser dess egen kontroll.

Gates: klient 150/0 · destruktivt 2/2 vs v2.6.103 · canary 37/0
· dispatch 44/0 · protokoll 6/0 · B1 byte-identisk · check-
versions grönt. Purge.

Webbläsarkollen: värd + bot + en andra människa. Lämna som värd
utan att ta bort boten — den andra spelaren ska se
helper-banderollen släckas, inte bli kvar låst.

## [EN REGEL FÖR FILTEN] — brädets två gester läser äntligen samma lista (14 september 2026, klient v2.6.103)

Två fynd ur Johans första onlinepass med bottar. Båda visade
sig sitta djupare än symptomen.

**Hjulet.** Rapporten var "scrollhjulet zoomar när man ändrar
pool", och den uppenbara fixen — `stopPropagation` på `#pool`
och `#dockPool`, de enda två av sex hjulkonsumenter inuti
`#board` som saknade den — hade varit en plåstring. Riktiga
orsaken: `#board` bär TVÅ gesthanterare med olika uppfattning
om vad bar filt är. Pan-handlern (12260) har alltid haft en
exkluderingslista; wheel-handlern (12249) hade ingen alls. Om
ett hjul nådde zoomen avgjordes alltså helt av om barnet under
pekaren råkade stoppa det. Båda läser nu EN konstant,
`BOARD_CHROME`, genom `isBoardChrome()`, och pan-handlerns
handskrivna kopia av listan är borta.

Johans regel: chrome och kort sväljer hjulet — med eller utan
egen effekt — och öppet bräde zoomar. Ytorna står medvetet
INTE i listan (`#z-ready`, `#z-uncontrolled`, `#z-torpor`,
motståndarnas mattor): i L3 är de det mesta av skärmen, och
blockar man dem finns ingenstans kvar att zooma. Två
konsekvenser, båda godkända av Johan i förväg: kort i
crypt/library/ash och handfanen slutar zooma (kort i
ready/uncontrolled/torpor svalde redan hjulet för blodmarkörer,
så det gör de sista korten konsekventa), och ett drag på
loggen, zoom-reglaget, en hög eller hold-badgen startar inte
längre en L4-pan. De två saknade `stopPropagation` sitter där
ändå, som livrem — inte som mekanism. `#phases` och resolverns
räknare följer samma regel fast de ligger utanför `#board` och
aldrig nådde zoomen.

**Bottlåset har aldrig låst något.** `netBotHelperLock` från
v2.6.99 byggde sitt objekt för hand: `{settings: allt true,
allowLocal: true, tournament: false}`. Men `allowLocal:true`
ÄR 'local'-läget — `hx()` (7543) faller rakt igenom till varje
spelares egna Settings när den är satt, och serverns
`helperMode()` (srv 248) läser tillbaka rummet som 'local', så
rumslistan taggade det inte ens. Varje helper slogs på i ett
fält ingen läser. Nu kallas `helperPolicyFor('all')` — create-
vägens egen funktion, en källa för formen — vilket ger
`allowLocal:false` och tänder den befintliga lobbybanderollen,
så låset syns istället för att ske tyst. Toast vid lås och vid
återställning.

Johans alternativ, ett krav i Create game som Structured-
grinden, valdes medvetet bort: `boardMode` behöver create-
grinden eftersom inget verb ändrar den, medan `setHelperPolicy`
ÄR ett lobbyverb — ett create-krav hade låst ute rum som lika
gärna kunde rättas på plats.

**Sidofynd.** Sviten pinnade ett botgap som känt fel ("ett håll
som läggs när ingen bot är relevant annonseras aldrig"). Bot
**v0.6.108** stängde det, så pinnen var inaktuell åt rätt håll
och påstår nu annonseringen. Verifierat mot orörd v2.6.102:
samma fel där, alltså botens förtjänst och inte min. PROJECT-
MANIFEST §E2 låg två releaser efter (v0.6.102) och står nu på
v0.6.108.

Lärdomen: när två handlers på samma element båda ska svara på
"är det här bar yta?", är en delad konstant inte städning —
det är själva buggfixen.

Gates: klient 148/0 · destruktivt 4/4 · canary 37/0 · dispatch
44/0 · protokoll 6/0 · endpoint 21/1 (cardfx-staticen, ingen
`elysium-cardfx.json` bredvid servern här) · B1 byte-identisk
1 247 018 · check-versions grönt. Purge.

Webbläsarkollen: i L3/L4, scrolla över poolgloben (ska bara
ändra pool), över en motståndarglob (ska inte hända något
alls), över matta och bar filt (ska zooma). Online: skapa ett
Structured-rum, lägg till en bot — banderollen "Helpers locked
to the host's settings" ska tändas, och försvinna när boten
tas bort.

## [BORDET VAR ALDRIG FULLT] — Add bot vägrade för en ensam värd (13 september 2026, klient v2.6.102)

Johans första fynd i webbläsarpasset, och en ren bugg av mig.
`netBotWhy` jämförde spelarantalet mot lobby-snapshotens `seats` —
som INTE är en kapacitet. Servern sätter `seats: room.players.length`
(srv 318) som sätesväljarens INTERVALL. En ensam värd läste alltså
1 >= 1 och grinden stängde.

Riktiga taket är `MAX_PLAYERS` (srv 56), kontrollerat vid join som
`room.players.length >= MAX_PLAYERS` (srv 1072), utan filtrering.
Klienten speglar nu det som `MP_MAX_PLAYERS` och kollar på exakt
samma sätt. Gick igenom 1→7 spelare: tillåtet t.o.m. 5, vägrat vid
6 med serverns egen formulering.

Lärdomen som gör ont: v2.6.99-testet PASSERADE medan grinden var
trasig, för det matade `seats: 3` med en spelare — en kombination
servern aldrig producerar. Ett test som bygger sin egen fixture kan
bara kontrollera koden mot författarens förståelse, aldrig mot
verkligheten. Webbläsarpasset fångade på ett klick vad sviten inte
kunde.

Gates: klient 145/0 · destruktivt 1/1 · canary 37/0 · dispatch 44/0
· protokoll 6/0 · B1 byte-identisk 1 243 921 · check-versions
grönt. Purge.

## [BADGEN FÖLJER BORDET] — hållet blev synligt online också (13 september 2026, klient v2.6.101)

Hål jag infört genom förbiseende. v2.6.99 släppte in bottar i
onlinerum, men hold-badgen var gate:ad på `localTable` — så ett
glömt "Hold on…" frös dem utan något på skärmen, exakt den tystnad
v2.6.96 stängde offline. Inget gick sönder, inget varnade;
skyddet fanns bara inte där.

Badgen följer nu bordet: bryggsäten offline, serverns egen
roster-`bot`-flagga online (sant för ALLA spelare, inte bara värden
som lade till dem). Online löser sig namnnyckeln av sig själv —
varje människa har sin egen klient och talar i eget namn — så
regeln är: du släpper ditt EGET håll med en riktig "It
resolves"-broadcast (en badge som bara rensat lokalt tillstånd hade
lämnat bottarna hållna), och någon annans håll visas UTAN
Resume-knapp, så ett fruset bord förklarar sig självt istället för
att erbjuda en kontroll som inte kan fungera. Inkommande `say`
matar badgen; att lämna ett rum rensar den.

En avsiktlig skärpning: spårning kräver nu att bordet HAR bottar,
inte bara att det är lokalt. Ett håll utan något att hålla är inte
tillstånd värt att spara. Två v2.6.96-tester uppdaterade till den
semantiken — de föll, och det var rätt att de föll.

Överlämningsdokumentets punkt 4 var rättad innan detta (den
påstod att klienten ägde människosidans svar, vilket bara gällde
offline). Den rättelsen står kvar och är nu åtgärdad i koden.

Gates: klient 145/0 · destruktivt 4/4 · canary 37/0 · dispatch 44/0
· protokoll 6/0 · B1 byte-identisk 1 243 412 · check-versions
grönt. Purge.

Webbläsarkollen: online-rum med en bot, säg "Hold on…" → badgen ska
synas, klicka Resume → bottarna spelar vidare. Med två människor:
den andres håll ska visas med namn men utan Resume-knapp.

## [SNAPSHOTEN LÄSER RUMMET] — policyminnet läste kryssrutor, inte rummet (13 september 2026, klient v2.6.100)

Fångat i Johans "något du är osäker på?"-pass efter leveransen. Två
saker verifierades: (1) `bot.close()` sätter `_closing` och rensar
reconnect-timers, så en kickad bot med `reconnect:true` joinar INTE
om — lugnt. (2) `netBotHelperLock` mindes policyn genom att läsa
Settings-kryssrutorna (`#helperAllowLocal`, `#helperTournament`) —
en VY som bara fylls när dialogen öppnas. Har värden aldrig öppnat
Settings håller rutorna HTML-defaults, och sista borttagna boten
skulle återställa en policy rummet aldrig haft. Rummets levande
policy bor i `net.helperPolicy` (server-satt, 8362/8581). Nu läses
den, med kryssrutorna kvar bara som fallback för fallet ingen policy
pushats än (ska inte hända för en värd efter första lobby-rendern,
8347).

Lärdom: minns tillståndet därifrån systemet själv håller det, aldrig
från en widget som speglar det på begäran.

Gates: klient 141/0 · destruktivt 1/1 · canary 37/0 · dispatch 44/0
· protokoll 6/0 · B1 byte-identisk 1 241 263 · check-versions grönt.
Purge.

Kvar som osäkerhet, ej fixat: väntloopen i `netBotAdd` pollar
`net.lobbyData` efter att boten dykt upp MED lek. Det förutsätter
att servern pushar en ny lobby-snapshot till värdens socket när
boten joinar och laddar upp — det skarpa provet läste botens eget
tillstånd, inte värdens `lobbyData`, så just den vägen är inte
mätt live. Timeout 8 s och tydliga felmeddelanden finns; om det
faller ser du "deck never arrived" fast boten är fin.

## [BOTTAR ONLINE] — värden lägger till dem från lobbyn (13 september 2026, klient v2.6.99)

Johans ask: kunna testa bottar online och jämföra med hotseat.

**Serverfrågan först:** hosting-planen (rad 114, 124) säger att
elysium.cards kör med ÖPPEN dörr, `--server-pass` osatt — "that IS
the product". Sekretess är per-rumslösenord + anon. Botens join bär
redan rumslösenordet, så frågan var moot. Ingen serverändring alls.

**Bygget:** `netBotDial()` öppnar en andra browser-WebSocket mot
`net.addr` (respekterar `net.sec`), boten joinar `net.room` med
`net.pass`. Helt skild från `net.ws`. INGEN bryggkod är inblandad —
online ÄR servern bussen, så hållet, domarverben, board-pubs och
fan-outen är alla nativa. Det är precis det som gör detta till
fidelitetstestet för bryggan: spelar ett bord annorlunda offline är
det bryggan som avviker, inte boten.

Reaktivt i lobbyn, som Johan ville: knapp + namn/lek/persona, en
sätes-dropdown per bot (skickas på BOTENS egen socket med samma
`seat`-verb en människa använder), kick stänger även socketen
(annars joinar den bara om), nedmontering vid leave.

**Structured-only, med skäl på knappen:** `boardMode` sätts vid
create (srv 1327) och inget verb ändrar den. Helpers DÄREMOT går att
ändra i lobbyn (`setHelperPolicy` är REF_VERB), så första boten
låser policyn till alla helpers på + ingen tournament mode, som
v2.6.93 offline; sista borttagna återställer. Två begränsningar som
ser lika ut men beter sig olika.

**Bevisat skarpt mot riktig server** (localhost, riktig bot
v0.6.107): två bottar joinade, tog säten via `seat`-verbet, värdens
`start` startade spelet, och `this.table` läste ["1","3"] respektive
["1","2"]. Det avgör dessutom — genom att KÖRA det — påståendet som
överlämningsdokumentet den 12 sep tvingades märka som läst-inte-kört.
Dokumentet är uppdaterat.

Sidovinst: på LOKAL server fanns tidigare ingen väg alls att sätta en
bot utan att köra botens CLI för hand, en process per bot.

Gates: klient 140/0 · destruktivt 5/5 · canary 37/0 · dispatch 44/0
· protokoll 6/0 · B1 byte-identisk 1 241 213 · check-versions grönt.
Purge.

Webbläsarkollen: skapa ett Structured-rum, lägg till 2 bottar, ge dem
säten, starta. Jämför med samma uppsättning offline. I ett
Classic-rum ska knappen vara gråad med skälet i tooltipen.

## [BOTTARNA SER BORDET] — board-pubs rider bussen (12 september 2026, klient v2.6.98)

Johans bedömning, och den var rätt: blinda bottar gör att testet
mäter deras kortspel istället för deras beslutslogik, och då vet man
inte vad man tittar på.

**Mätt före:** efter ett helt 2-bottspel i hotseat var varje bots
`this.table` TOM — inte ett enda säte. Online broadcastar servern
varje board-push (rad 1134) och ger den som joinar alla befintliga
pubs (398/1412). Det är indatan bakom `_tableThreat` (vem är bordets
hot), `_rushCandidates` (vad finns att rusha) och
`_checkAshurTableWide` — Johans egen beställning från juli, att
trigga botens beteende när en MÄNSKLIG spelare gör något. Offline
fanns ingen källa: `schedulePush`/`pushNow` returnerar tidigt när
`!inRoom()`, och v2.6.95:s buss bar log/say/chat/fx men medvetet
inte board.

**v2.6.98:** board på bussen. Varje bots pub fannas ut till de andra
bottarna, och den aktiva människans board pushas till varje botsäte
på samma 600 ms-debounce som online, seedat vid `startHotseat` precis
som servern seedar en joiner.

**Mätt efter:** Bot1 ser säte [1, 3], Bot2 ser [1, 2], med riktiga
pooler och kortantal, och `_tableThreat(3)` returnerar 4.45 istället
för att köra på ingenting.

Sidonot: jag försökte bevisa online-sidan skarpt — startade riktiga
`elysium-server.js` på localhost och kopplade två bottar mot den. De
kom in och fick säten, men lobby-handskakningen (sätesval + start)
som en människa normalt driver från klienten fick jag aldrig till, så
spelet startade aldrig. Online-sidan vilar därför på kodläsning, inte
mätning. Offline-sidan är mätt i båda riktningarna.

Gates: klient 135/0 utan skips · destruktivt 3/3 · canary 37/0 ·
dispatch 44/0 · protokoll 6/0 · B1 byte-identisk 1 230 537 ·
check-versions grönt. Purge.

Webbläsarkollen: med 2 bottar — se om de börjar rusha och rikta mot
det som faktiskt står på bordet, inte bara spela sin egen hand. Det
är den enda skillnaden som går att se med ögonen.

Kvar av upplevelseskillnaderna mot server: omröstningar (avrPush är
`inRoom()`-gatad, så tally delas aldrig och botens `_onVoteOpen`
löser aldrig ut) och oust-bokföringen (bryggans default sväljer
`bounty`, HB2d).

## [DOMARVERBEN NÅR BOTEN] — pool och oust på ett botsäte tar sig hela vägen (12 september 2026, klient v2.6.97)

Johan frågade om hans gamla regel fortfarande gäller: alla spelare
ska kunna styra ett botsätes element, eftersom en headless bot inte
kan modellera varje triggad förmåga (v0.4.4, 13 juli).

**Svaret var delvis.** KORT-nivån höll: blod ±1, lås, vänd, blå/
gröna markörer och torpor rider `hotCtrl` på ett botsäte, gate:at på
roster-flaggan `bot` som `startHotseat` sätter rätt. SÄTES-nivån
höll inte. `hostSetPoolHot` skrev den lagrade pub:en medan boten
äger sin egen `this.pool` — mätt mot v0.6.107: pool satt till 5,
boten stod kvar på 30, skärmen tillbaka på 28 i samma ögonblick den
agerade. `hostOustHot` markerade rostern medan boten spelade vidare.
Båda mottagarna (`forceSetPool`, `forceOust`) fanns redan på boten;
bara avsändaren saknades — exakt samma form som log-fan-outen en
version tidigare, andra gången samma dag.

**Fixen:** `hotBotSeat(seat)` (roster-bot OCH uppkopplad på bryggan
OCH lokalt bord) och båda verben routas genom den. En dränering till
noll går via hela oust-vägen istället för `forceSetPool(0)`, för
botens egen clamp-and-oust skulle annars hoppa över predatorns bounty
och roster-flaggan och lämna ett halvt tillstånd. Snabbstegen
Pool ± — byggda för politiska aktioner, alltså precis när en bot
räknar fel — är inte längre online-only.

Gates: klient 132/0 utan skips · destruktivt 4/4 · canary 37/0 ·
dispatch 44/0 · protokoll 6/0 · B1 byte-identisk 1 228 304 ·
check-versions grönt. Purge.

Webbläsarkollen: högerklicka botens pool → "⚙ Set their pool…",
sätt ett värde, låt boten spela en tur — värdet ska stå kvar (den
ska spendera FRÅN det, inte från 30). Snabbstegen ⚖ Pool −1/−2 ska
finnas i menyn offline. Sätt poolen till 0 → boten ska annonsera
sin oust i chatten och sluta ta turer.

## [BUSSEN + DET SYNLIGA HÅLLET] — hotseat-bryggan fick fan-out, hållet blev synligt (12 september 2026, klient v2.6.95 + v2.6.96)

Johan laddade upp bot v0.6.107 och bad om klientsidan inför skarp
testning (1 människa + 2 bottar, sedan 2 + 2). Mätt mot riktig bot.

**Fyndet:** `hotBridge` var en STJÄRNA utan fan-out. Människans
loggrader nådde ingen bot (så en bleed registrerades aldrig —
botens L12-grammatik läser just de frysta raderna), och bottarna
var ömsesidigt döva, så v0.6.107:s undirected reaction window
kunde aldrig lösa ut. Reservkanalen var också stängd: `#chatRow`
göms när `net.status==='off'`, så gränssnittet bottarna
annonserar i sin första rad ("bleed N", "@Name bleed N") hade
ingen inmatning offline — och send-handlern tömde fältet och
kastade texten. Grammatiken matchade redan exakt
(`cardRefCap+' bleeds for '+n+'.'` mot
`/^(.+?) bleeds for (\d+)\./`), så det saknades bara relayen.

**v2.6.95:** `hotFanOut()`. Människans rader rider `mpRelay`,
varje bots log/say/chat/fx fannas ut till ÖVRIGA bottar, alltid
exklusive avsändaren. Ekoskyddet är gratis ur `log()`:s eget
kontrakt (botinjicerade rader loggas `localOnly=true` och når
aldrig `mpRelay`). Chattraden finns offline och talar på bussen.
EN medveten filtrering, hittad genom att soaka ett 2-bottspel till
deadlock i runda 3: en BOTS "Hold on…" relayas inte till andra
bottar — boten filtrerar `players[].bot` i `_holdHook` men INTE i
ask-fönstrets paus (`a.pausedBy`), så en bot kunde parkera en
annans undirected window utan timer och utan något som släpper.
Rapporterat till botprojektet; bussen filtrerar tills vidare.

**v2.6.96:** hållet är synligt och släppbart. Badge som namnger
hållaren, ett klick återupptar, och releasen relayas PER
HÅLLARNAMN — mätt: Bobs vanliga "It resolves" lämnade bottarnas
hållarset på ["Alice"] för alltid, och både `_pace()` och
`hotRunBotTurns` väntar obegränsat, så ett glömt håll frös bordet
utan något på skärmen. Dessutom: bubbeltiden 3 s för quick phrase
upp till 9 s för lång rad (`sayBubbleMs`), och PREY/PREDATOR
fungerar i hotseat (`sayLabel`: `inRoom` → `tableView`).

**Lärdom om metoden:** en soak stallade i runda 5 på BÅDE nya och
gamla klienten — samma signatur. Det var harnesset: riktiga
`hotRunBotTurns` väntar 900 ms efter varje pass, och utan den
kommer `turn` medan boten är `_acting`, där botens egen guard
tappar den utan omtriggning. Att reproducera mot FÖRRA bygget är
billigaste sättet att skilja "jag råkade" från "det var redan så".
Den tappade turen är dock verklig, bara maskerad av pausen.

Gates: klient 128/0 UTAN skips (botfilen finns — canary 37/0) ·
destruktivt 9/9 · dispatch 44/0 · protokoll 6/0 · B1 byte-identisk
1 226 382 · check-versions grönt. Purge.

Webbläsarkollen: starta hotseat med 2 bottar → blöd en bot och se
att dess pool faktiskt sjunker; skriv "@Namn bleed 2" i chattraden;
säg "Hold on…" under din egen tur → badgen ska synas överst, klicka
Resume → bordet rör sig igen. Öppet: den tappade `turn` när boten
är `_acting` (watchdog i sweepen vore billig), och botens
`a.pausedBy` saknar bot-filtret.

## [SAY BUBBLE CLAMP] — Chattbubblorna skalar med viewporten (12 september 2026, klient v2.6.94)

Johans rapport: bottarnas initiala chattmeddelande spillde utanför
bordsytan på en laptop. Roten: `.sayb` hade `white-space:nowrap`
och `.saytxt` var 58px Cinzel fast — designat för korta
quick-phrases ("Block!", "Pass") som aldrig radbryter. När
chattbubblor (v2.6.50) och bottchatt (v2.6.60+) landade ärvde de
samma CSS. 120 tecken i 58px Cinzel på en 1366px viewport = spill.

Fix (ren CSS, ingen JS):
* `.sayb`: tappade `nowrap`, fick `max-width:min(92vw,92%)` +
  `overflow-wrap:break-word` — långa rader radbryter nu.
* `.saytxt`: `font:700 clamp(22px, 4.5vw, 58px) "Cinzel"` —
  skalbar: 58px cap vid ~1290px viewport, 22px golv för telefoner.
* `.saywho`: `clamp(12px, 1.4vw, 18px)` — följer samma princip.
* `chatBubble`s 120-teckens-klipp i JS ligger kvar som säkerhet.

Gates: klient 115/0 (+2) · dispatch 44/0 · protokoll 6/0 · B1
byte-identisk 1 217 279 · check-versions grönt. Purge.
Webbläsarkollen: starta en hotseat med en bot → den initiala
chattbubblan ska radbryta och vara läsbar oavsett fönsterstorlek;
korta quick-phrases ("Block!", "Pass") ska fortfarande vara stora
på en desktop.

## [BOT LOCK] — Bottarna låser Structured + All helpers on (12 september 2026, klient v2.6.93)

Johans beslut: bottarna är alpha-optimerade för Structured + alla
helpers, så lobbyn låser det tills de klarar mer. `syncOffBotLock()`
körs i varje `renderOfflineSeats()` + vid `openOffline()`:
* har det en bot? → Board style=structured, Helpers=all, båda
  greyed-out (`.disabled=true`); spelarens val sparas i en
  `_preBotVal` på elementen (idempotent — en andra bot
  skriver inte över originalet med det tvingade värdet).
* ingen bot? → återställ valen, enable båda.
`startOfflineFromCfg` läser selects-värdena som vanligt, så de
tvingade värdena ÄR det bordet startar med — inget extra grepp.
Change-lyssnarna sitter kvar (`.disabled` hindrar dem), och de
behöver inte tas bort.

Gates: klient 113/0 (+3; destruktivt mot v2.6.90) · dispatch 44/0
· protokoll 6/0 · endpoint-smoke 20/0 · B1 byte-identisk 1 216 834
· check-versions grönt. Purge. Webbläsarkollen: lägg till bot →
Board+Helpers greyed-out på Structured+All; ta bort alla bottar →
spelarens val tillbaka, selects klickbara igen.

Öppna punkter (v2.6.91–93, att göra vid tillfälle):
- `settingsHeadSync` körs på varje slider-frame (delegerad `input`
  på `#settingsModal`): ~200–300 property-reads per event vid
  60 fps. Osynligt på snabb maskin, men kan hacka brightness-
  slidern på en långsam laptop. Fix: en `requestAnimationFrame`-
  gate som droppar om det redan finns en köad. Testa draget
  på den långsammaste enheten först.
- `openOffline` med bottar kvar kör `syncOffTournament()` mellan
  de två `syncOffBotLock()`-anropen — meningslöst arbete (skriver
  över det låsta Helpers-värdet, som sedan låses igen). Ingen ser
  det (allt innan overlayens `show`), men `syncOffTournament` kan
  hoppas över när bottar finns. Kosmetiskt.
- `importSettings` kör bara halva apply-kedjan (förbestående,
  noterat sedan v2.6.91) — den kan återanvända
  `settingsApplyProfile` nu.

## [SESSIONEN SOM LÄCKTE] — Tournament-overriden i hotseat/tutorial är en session på riktigt (12 september 2026, klient v2.6.92)

Johans "intet annat som verkar konstigt?" fångade det via den nya
headern. `startOfflineFromCfg` skrev `conv.tournament` rakt av från
Helpers-dropdownen, tutorialens Classic-kapitel skrev `true`, och
`leaveHotseat` skrev aldrig tillbaka — "session-only, no saveConv"
från v2.6.51 höll bara till NÄSTA `saveConv()` (vilken inställning
som helst, ett Lite|Full-byte, välkomstbubblan), som sparade hela
`conv` med bordets värde som spelarens preferens. Tournament-rutan
flippade tyst, och v2.6.91-headern visade "(custom)" efter en
Structured hotseat. Nu: `hotTournSession(val)` ögonblicksbild en
gång (`hotTournBefore`) + override; `hotTournRestore()` i
`leaveHotseat` bredvid `helperAllOn=false`; en medveten ändring av
rutan UNDER ett bord uppdaterar bilden så återställningen inte
ångrar den; det återupptagna Classic-tutorial-bordet
(`tutGameResume`) följer regeln också — det levde på läckan
tidigare (syskondrift). Sviten räknar de kvarvarande bara skriv-
ställena (5: loader, import, rutan, paret). Ett test (+1).

Gates: klient 110/0 (destruktivt mot v2.6.90) · dispatch 44/0 ·
protokoll 6/0 · endpoint-smoke 20/0 (+2 botstatics utan botfilerna)
· canary hoppar · B1 byte-identisk 1 215 743 · check-versions
grönt. Purge. Webbläsarkollen: Structured hotseat med "Your local
settings" → lämna bordet → Settings-headern säger "Full mode" utan
(custom) och Tournament-rutan är kvar som den var.

## [HEADERN + 1v1] — Settings-headern säger Lite/Full (custom) med Reset till lägets defaults; leken syncar Start (11 september 2026, klient v2.6.91)

Johans två fynd, bot vs bot parkerat på hans ord. (1) Headern:
`<h3 class="set-h3">` är en flex-rad — SETTINGS · "Lite mode" /
"Full mode", "(custom)" så fort något i dialogen avviker från
lägets defaults · Reset längst till höger. Profilen
(`settingsProfile` / `settingsDefaults(mode)` / `settingsDiff`) är
allt dialogen redigerar och inget annat: 29 conv-nycklar
(`SETTINGS_CONV_KEYS`), ljudkanalerna som EFFEKTIVA värden ({} och
literalens {unlock:150,…} är samma profil), 13 helpers, alla
genvägar, båda ljusstyrkorna, autosave. Lägena skiljer sig bara i
`UI_PRESET`:s trio (anim/pco; sfxVol är 0 i båda). Utanför: uiMode,
det andra lägets uiProf-minne, modeHintDone, tutDone, dbDefault,
värdens policy-box och all DATA — det här är inte fabriks-reseten
under Files & storage. Reset är LIVE (`settingsApplyProfile`
speglar varje kontrolls change-handler: saveConv/saveHelper/
saveKeys + de tre localStorage-nycklarna, sedan animMode, applyPco,
refreshPoolColor, applyTouchUI, applyHelper/syncHelperUI,
rebuildKeymap, applyBrightness/applyUiBrightness, applyAutosaveMode,
edge-token, loadCardDB om databasen var av; sedan `openSettings()`),
bekräftas först, och vägras med skäl under ett levande bord/lobby
(`settingsResetWhy`: "Leave the game or lobby first" — en hotseat
skriver över conv.tournament för sessionen) eller tutorialen.
Reset är gråad när inget avviker ("Already at the Lite mode
defaults"); tooltipen på taggen säger hur många som avviker.
"(custom)" följer via delegerad input/change/click på
#settingsModal (kontrollens egen handler kör först) + en hook i
`saveKeys()` (omknytning sker via document-keydown). (2) 1v1-
buggen: lek-dropdownen skrev `offlineCfg[i].deckIdx` men synkade
aldrig Start — "bot först, sedan din lek" lämnade knappen inaktiv
och hinten "Pick a deck for: You" stale tills något re-renderade
säten (en bot till gjorde det). Nu går alla tre radlyssnare (namn,
lek, botlek) via `offlineSeatSet(i,key,val)` → `offlineSyncStart()`
(som nu returnerar readiness). Gate 2 i offlineReady (all-bot
vägras) står kvar.

Gates: klient 109/0 (+5; destruktivt 5/5 mot v2.6.90) · dispatch
44/0 · protokoll 6/0 · endpoint-smoke 20/0 (+2 botstatics faller
utan botfilerna bredvid — servern orörd) · canary hoppar utan
boten · B1 byte-identisk 1 214 195 · check-versions grönt. Purge.
Webbläsarkollen: headern i båda lägena; ändra något → "(custom)"
+ Reset tänds; Reset → bekräfta → allt tillbaka (trion på Lite-
presetet i Lite); Offline: toggla bot på seat 2, VÄLJ SEDAN lek på
seat 1 → Start tänds direkt. Öppet: importSettings kör bara halva
apply-kedjan (förbestående) — den kan nu återanvända
settingsApplyProfile.

## [BUBBLAN] — tillbaka som bubbla, men klämd inom webbläsarfönstret (11 september 2026, klient v2.6.90)

Missförstånd i v2.6.89: Johan menade webbläsarfönstret, inte kortet
— bannern expanderade hela startrutan. Nu är `#modeHint` en
`position:fixed`-bubbla, flyttad ut ur kortet till `#empty` (kortets
backdrop-filter gör en fixed-ättling till absolut) och placerad av
`modeHintPlace()` från pillens rect: under pillen med max-height
till fönstrets botten, eller ovanför (klass `up`, pilen vänd) när
utrymmet under är mindre än 150px; overflow:auto inuti; ompositioneras
vid resize. v2.6.89:s dialogfix (`.mbody min-height:0`) står kvar.
Tekniskt snubbel på vägen: sökningen efter en 8-blankstegs `</div>`
träffade inuti en 10-blankstegsrad, blocket hamnade utanför #empty —
fångat av assert-före-skrivning, filen rördes aldrig. Sviten 108/0,
destruktivt 1/1 mot v2.6.89, B1 byte-identisk 1 203 784. Purge.

## [FÖNSTRET] — dialogerna håller sig inom skärmen (11 september 2026, klient v2.6.89)

Johan på laptop: ?-rutan försvann ur bild, och dialogerna blöder
utanför fönstret generellt. Rotorsaken för dialogerna: `.modal` är
en flex-kolumn med max-height 84vh, men `.mbody` saknade
`min-height:0` — ett flex-barn krymper inte under sitt innehåll av
sig självt, så en hög body (Settings, Create game) tryckte foten ut
ur skärmen. Nu `flex:1 1 auto; min-height:0` och varje dialog rullar
sin body under taket. Välkomstkortet: `#empty` och `.inner` rullar
om de måste, och ?-förklaringen är en banner i flödet överst i
kortet i stället för en absolut positionerad bubbla. Bara CSS.
Sviten 108/0, destruktivt 1/1 mot v2.6.88, B1 byte-identisk
1 202 231. Purge. Lärdomen "testa på laptop" står nu i learnings.

## [GENVÄGAR + ?-TEXTEN] — tre genvägar blir basic, förklaringen i Johans ord (11 september 2026, klient v2.6.88)

Cache-vajsingen var cachen (v2.6.86 kvar i webbläsaren); v2.6.87
fungerade. Sedan: Target (T), Lock/unlock selected (L) och Discard
hovered card (X) flyttade till basic-listan i ACTIONS (samma
standardtangenter; basic-blocket renderas i tabellordning, så de
ligger efter Pool +1). Lite|Full-förklaringen bakom ? bär nu Johans
formulering. Sviten 107/0 (ACTIONS exponerad), destruktivt 1/1 mot
v2.6.87, B1 byte-identisk 1 201 711. Purge.

## [FIXED CONTROLS] — musens fasta kontroller som egen fäll längst ned (11 september 2026, klient v2.6.87)

Johan: "Show fixed controls" som en egen fällbar sektion sist.
Sjätte sektionen Fixed controls avslutar modalen, fälld bakom "Show
fixed controls ▸" (#setMouse + Shift-to-peek i en .set-adv-box;
setAdvToggle läser data-label). Sviten 106/0, destruktivt 1/1 mot
v2.6.86, B1 byte-identisk 1 201 469. Purge.

## [SETTINGS] — fem sektioner, en rad per beskrivning, Advanced-fäll per sektion (11 september 2026, klient v2.6.86)

Johans idé: pricksäkra men korta beskrivningar och en Advanced-fäll
per sektion för det sällsynta. Nio sektioner blev fem — Table
(utseende & känsla), Play helpers (gamla Phase helper + spel-
bekvämligheter + Legal deck; värdens policy-box kvar inuti), Files &
storage (Files + Storage + Legal cards), Sound, Shortcuts — med en
rad överst som säger det "Local only" sade i varje rad. Alla 56
beskrivningar är ≤ 100 tecken; förklaringarna flyttade till tooltips
på raden, versionshistoriken bort. Fyra `.set-advbtn`-knappar följda
direkt av sina `.set-adv`-boxar (`setAdvToggle` läser
nextElementSibling). Det viktiga: inte ett enda id ändrades, så
inte en rad wiring rördes — testet pinnar alla 92 id:n exakt en
gång vardera och maxlängden på texten.

Gates: klient 106/0 (boten bredvid; destruktivt 1/1 mot v2.6.85) ·
B1 byte-identisk 1 201 247 · check-versions grönt. Purge. Webb-
läsarkollen är den som avgör: känns sorteringen vanlig/sällsynt
rätt, och är tooltipsen tillräckliga där texten kortades?

## [CREATE + JOIN] — Lite-startkortet utan Settings (11 september 2026, klient v2.6.85)

Johan: inga Settings på Lite-startkortet, menyn räcker. Verktygs-
raden fick ett id (`#emptyToolRow`) och Lite döljer hela raden i
stället för två av dess knappar. Bara CSS. Sviten 105/0, B1 byte-
identisk 1 204 726. Purge. Nästa: Settings-översynen (beskrivningar
+ Advanced-fällar per sektion) — förslag lämnat, väntar på kör.

## [TABLE-TABBEN] — den sista spelgrejen på L0 (11 september 2026, klient v2.6.84)

Johans webbläsarkoll av lobby-regeln: allt borta utom Table-tabben
till höger. Det är `#statsTab` inne i `#statsDock` (med panelen och
matchklockan); `body.idle` döljer nu även docken. Intro-kapitlets
audit-test har statsTab på aldrig-listan. Johan laddade också upp den
släppta boten (v0.6.102 + cardfx.json): klientsviten 105/0 med boten
bredvid, canaryn 37/0, endpoint-smoke 22/0 — botfilerna kräver ingen
versionsöverensstämmelse, bryggan och fxv är kontraktet. B1 byte-
identisk 1 204 657. Purge.

## [DOMAREN] — domarlösen per rum, domaren är en åskådare med värdens verb (11 september 2026, klient v2.6.83 + srv-2.6.35)

Johan trodde att "Referee password" i Create game satte rummets
domare — det var serverns operatörsnyckel. Hans läsning var den
bättre modellen: värden sätter ett domarlösen när bordet skapas,
domaren joinar med det, befogenheterna gäller det bordet, och flera
bord kan dela lösen om en domare täcker dem. Operatörsnyckeln
(--referee-pass, hello{admin}) finns kvar bara för --create-policy
admin, döpt "Server referee key" djupt i Local server-fällen.

Servern: create{refPass} → room.refHash; join{refPass} prövas mot
rummet (fel = err + rumslösenets strike; rum utan = "This room has
no referee password"); den som joinar blir watcher med conn.ref,
joined{ref}, ref på watchers/watcherList. Den avgörande biten: "Spec-
tators may only chat" var en vägg i dispatchen, inte en grind — att
lägga conn.ref i de 15 värdgrindarna hade gjort ingenting. Watcher-
grenen har nu en vitlista (REF_VERBS) som skickar domarens verb till
GAME_HANDLERS med en pseudo-p, och alla grindar är hostOrRef(conn,
room, p), scopad till rummet. roomList rooms[].ref ersätter gårdagens
servernivå-flagga (aldrig deployad, så bara bort). Sviten bevisar
båda sidorna: domaren mutar, en vanlig åskådare hör "only chat",
domarens draw vägras.

Klienten: "Referee password" under Game settings (Full) → refPass på
create; Join as referee skickar nyckeln på själva join:en (inget
hello, ingen nyckel på listanropet alls); joined.ref → net.isRef och
klientens värdgrindar läser isHost||isRef (Host-menyn, Start,
kick/promote/mute, 💾 matches, helper-policy); ⚖ i rumslistan och i
åskådarlistorna; tutorialen: oh-admin bort, oh-referee (Game
settings) in, oj-spect och os-dialog omskrivna.

Gates: dispatch 44/0 (destruktivt 1/1 mot srv-2.6.34) · klient 101/0
(+4; destruktivt 2/2 mot v2.6.82) · protokoll 6/0 · smoke 20/0 (+2)
· B1 byte-identisk 1 204 907 · check-versions grönt. Restart + purge.
Webbläsarkollen: skapa med domarlösen → ⚖ i listan → Join as referee
→ Host-menyn och Start som åskådare; vanlig åskådare fortfarande bara
chat; fel lösen → "Wrong referee password".

## [NYCKELN] — list-anropet bär bara Join-halvans domarnyckel (11 september 2026, klient v2.6.82)

Johan frågade "inget annat du är osäker på?" och självgranskningen
hittade en riktig sak: v2.6.80 listar rum automatiskt när Join
öppnas, och hello-anropet skickade fortfarande `#mpAdmin` — Create-
sidans domarfält för --create-policy admin, numera i en fäll där ett
gammalt felskrivet värde inte syns. Varje fel nyckel är en strike
på IP:n hos servern; en oskyldig spelare hade kunnat throttlas av
att bara öppna Join några gånger. Nu skickar mpBrowse nyckeln bara
från Join-halvan (Join as referee ikryssad → #mpRefPass). Dessutom:
referee ikryssad med tomt lösen toastar "Enter the referee password"
i stället för att tyst joina som vanlig spectator, och statusraden
säger (referee). Sviten 101/0 (v2.6.80-testet pinnar båda),
destruktivt 1/1 mot v2.6.81, B1 byte-identisk 1 203 579. Purge.

## [PILLEN] — 30 % mindre Lite|Full-pill och frågetecken (11 september 2026, klient v2.6.81)

Johan tyckte hörnet blev trångt. Pillen (7px Cinzel, padding 3/7)
och `?` (16px) är ~30 % mindre, gap 4px, hörnoffset 8px, bubblan
förankrad under. Bara CSS. Sviten 101/0, B1 byte-identisk. Purge.
Om det fortfarande känns trångt är nästa steg att flytta paret ur
kortet — t.ex. till en rad under "Do not show again".

## [CREATE / JOIN] — Play online delas i två även i Full, referee i stället för admin, Hide my name parkerad (11 september 2026, klient v2.6.80 + srv-2.6.34)

Johans andra justering: Lite blev så strukturerat att Full skulle få
samma uppdelning. Play online är borta; EN dialog, två halvor i BÅDA
lägena (`data-mp`, `.mpCreateOnly/.mpJoinOnly` utan body.lite-prefix
nu), två fällar. Create: namn/rum/lösen + "Game settings ▸" (Match
length, Reaction timer, Board style·Helpers·Tournament lock bara i
Full, chat, spectator chat). Join: namn/rum/lösen, Join as spectator,
Join as referee (bara Full; fäller ut Referee password, tvingar
spectator, mpJoin skickar hello{admin} + spect:true), rumslistan
direkt i båda lägena med "🔍 Refresh". "Local server ▸" (bara Full,
båda halvorna): Server address, Server password, och på Create ett
Referee password för --create-policy admin. `mpFold`/`mpFoldSync`/
`mpRefSync`; srv-2.6.34 skickar additivt `ref` i roomList så
kryssrutan gråas med tooltip där servern saknar domarlösenord;
--referee-pass accepteras som alias, wire-nyckeln `admin` orörd.
"Admin" heter "Referee" överallt i UI:t. Hide my name (anon) parkerad
i kodarkivering.md — servern stöder den fortfarande, återställning är
klientsidan. Startkortets rad 2 i Full: Create game · Join game ·
Play offline (Lite döljer Play offline + raden ovanför); Full-menyn
Play… = Create/Join/Offline/Tutorial; djuplänkar landar på Join-
halvan.

Tutorialen: intro-online siktar på Create game; online-join öppnar
Join-halvan och öppnar/stänger Local server-fällen runt Server
address/Server password, list-steget beskriver auto-listning +
taggarna; online-hosting öppnar Create-halvan, fällar via mpFold i
onEnter, oh-browse struken, oh-checks → chat, oh-join byter till
Join-halvan före #mpJoin; selfhost-texten uppdaterad; kapitlen heter
"Online — …". Lärdomen: ett fällt fält är dolt för tutorialen fast
audit-testet ser elementet — ett nytt test pinnar att kapitlen öppnar
sina fällar och bara siktar på fält i den halva de öppnat.

Gates: klient 101/0 (+4; destruktivt 4/4 mot v2.6.79) · dispatch
44/0 (destruktivt 1/1 mot srv-2.6.33) · protokoll 6/0 · endpoint-
smoke 20/0 (+2 botstatics) · B1 byte-identisk 1 203 599 ·
check-versions grönt. Deploy: restart + purge. Webbläsarkollen: båda
halvorna i båda lägena, fällarna, Join as referee på elysium.cards
(domarlösen satt?) och på en server utan (gråad), tutorialens tre
online-kapitel från början till slut.

## [LOBBYN] — L0 är en lobby: spelverktygen gömmer sig på ett tomt bord (11 september 2026, klient v2.6.79)

Johans första justering efter Lite: startrutan är en lobby utanför
spelet, så vänsterpanelen, Played/Ready-tabbarna, fasremsan och
toppknapparna (allt utom ☰ Menu) hör inte hemma där. `tableIdle()` =
tomt bord + inget hotseat + inget rum; `syncIdleUI()` körs i
`layout()` (varje state-ändring) och `syncWelcome()` (varje återkomst
till L0), speglas i `_idleUI` (harnessens classList är skrivbar men
inte läsbar) och sätter `body.idle` + en resize. En solo-laddad lek,
ett hotseat-bord eller ett rum (även i lobbystadiet) tar tillbaka
allt. Tutorial-audit: toppverktygen spotlightas bara i kapitel som
går på ett levande bord; ett test pinnar att intro-kapitlet aldrig
siktar på dem.

Gates: destruktivt 1/1 mot v2.6.78 · klient 99/0 (+4) · dispatch
43/0 · protokoll 6/0 · B1 byte-identisk · check-versions grönt.
Ren klient — purge. Webbläsarkollen: startrutan utan panel/knappar;
Load deck solo → allt tillbaka; Play offline → tillbaka; Leave seat
→ borta igen.

Nästa (väntar på beslut om "Hide my name"): Create game / Join game
även i Full med fällarna Game settings + Local server, Join as
referee (spectator only, "Referee" ersätter "Admin" i UI:t) och
tutorialens online-kapitel anpassade.

## [FULL-TAGGAR] — Full-bord i Lite-listan: taggade och sorterade, aldrig dolda (10 september 2026, klient v2.6.78 + srv-2.6.33)

Johans fråga: hur ska Lite visa rum som Full-spelare skapat med
Structured board eller hjälpare på, utan "mental krock" — utgå från
att Lite-spelaren vill ha Classic + tournament. Svaret blev tagga och
sortera, aldrig filtrera: en bortfiltrerad lista hade visat Lite-
spelaren en tom server medan det spelas, och delat spelarbasen.

Servern (srv-2.6.33) lägger `board` och `helpers` i varje roomList-
post (`helperMode(policy)` läser tillbaka create-läget ur den
sparade policyn; additivt, gamla klienter struntar i nycklarna).
Klienten har fem rena funktioner bredvid mpBrowse: roomIsLiteShaped,
roomTags, roomTagsHtml, roomFullNote, roomListOrder. Taggar
("Structured", "Helpers on") visas i BÅDA lägena; i Lite sorteras
Lite-formade bord först inom lobby-/spelas-grupperna (stabil
partition, Full behåller serverns ordning) och en join av ett taggat
bord toastar en rad — inget bekräftelsesteg. Viktig nyans: en
'local'-policy räknas som Lite-formad i EFFEKT — Lite-spelarens egen
tournament-inställning gäller — bara 'all' tvingar hjälpare på alla.
En gammal server (inga nycklar) taggar ingenting.

Gates: dispatch 43/0 (destruktivt 1/1 mot srv-2.6.32) · klient 98/0
(+4; destruktivt 2/2 mot v2.6.77) · protokoll 6/0 · endpoint-smoke
20/0 (+2 botstatics) · B1 byte-identisk · check-versions grönt.
Deploy: restart + purge. Webbläsarkollen: skapa ett Structured-rum i
Full på en flik, se taggen och sorteringen i Lite på en annan, joina
och se toasten.

## [?] — frågetecknet bredvid pillen, och en kortare välkomstbubbla (10 september 2026, klient v2.6.77)

Johans idé: ett frågetecken bredvid Lite|Full-pillen som förklarar
skillnaden och hur bytet beter sig, på begäran. Bubblan från första
besöket var redan den texten, så `?` (`#modeHelp`, i wrappern
`#modeCtl` ihop med pillen) öppnar samma `#modeHint` i en fylligare
variant (`.mhLong`): vad Lite respektive Full har, att animationer/
färger/ljud minns sig per läge, att tutorialen byter till Full, att
man byter från startrutan eller menyn men inte i lobby/spel, och att
läget man lämnar i är det man landar i. Fungerar när som helst, i
båda lägena; Esc, Got it, pillen och startrutans knappar stänger.
Välkomstbubblan (`.mhShort`) krympte till Johans formulering —
"Welcome to Elysium! You are in Lite mode — perfect for getting a
game going right away in a basic environment. Switch to Full to
play the tutorial and unlock more features and options." — med en
"What is the difference?"-länk in i förklaringen; att öppna
förklaringen räknas som att ha sett välkomsten.

Gates: destruktivt 1/1 mot v2.6.76 · klient 96/0 (+4) · dispatch
42/0 · protokoll 6/0 · B1 byte-identisk 1 196 197 · check-versions
grönt. Ren klient — purge. Webbläsarkollen: `?` i både Lite och
Full, Esc stänger, första besöket visar den korta bubblan och länken
byter till den långa.

## [CACHE-FIRST] — en katalog-hämtning i veckan, inte en per start; reconnect-vakten (9 september 2026, klient v2.6.76)

Två av osäkerheterna efter v2.6.75 var riktiga, och Johan satte ord
på varför den andra spelar roll: "vi kör ju alla ideellt så
belastningen straffar väl alltid någon." Med databasen på som default
(v2.6.74) och Auto-sync på som default hade VARJE klient hämtat 3 MB
från KRCG vid VARJE start — IndexedDB-kopian användes bara som
fallback. Nu är loadCardDB cache-först: `vtesCached()` läser
`{json, ts}` (avvisar aldrig), processCardData körs direkt på kopian,
och hämtkedjan (`_loadCardDBFetch`: lokal mapp/hostad edge först,
sedan KRCG; gamla `_loadCardDBNet` är borta) körs bara utan cache,
med trasig cache, eller när sync är på OCH kopian är äldre än en
vecka (`VTES_MAX_AGE_MS`, `vtesStale`). Refresh-knappen i Settings
tvingar fortfarande en hämtning; sync-radens text säger "veckovis".

Reconnect-vakten: Join game i Lite auto-listar inte medan
`net.status==='re'` — mpBrowse hade ersatt den halvöppna rejoin-
socketen och mpRejoin hade aldrig avfyrats. Samma hål finns bakom
List rooms i Full, men ingen klickar den i tvåsekundersfönstret.

Gates: destruktivt exakt 3/3 mot v2.6.75 · klient 95/0 (+4) ·
dispatch 42/0 · protokoll 6/0 · B1 byte-identisk · check-versions
grönt. Ren klient — purge. Webbläsarkollen: andra starten ska säga
"Card database loaded (cached)" utan nätverksanrop mot KRCG i
Network-fliken; Settings → Refresh hämtar ändå.

## [TUTORIAL = FULL] — lyftet bort, tutorialen byter läge på riktigt (9 september 2026, klient v2.6.75)

Johan såg det jag flaggade: v2.6.74:s "lyft" visade Full-knapparna
under tutorialen men lät Lite-trion (inga animationer, inga
spelarfärger) ligga kvar — tutorialen pratade om klonen som pulsar
mitt på skärmen medan Lite-spelaren såg ingenting. "Tutorialen
behöver vara i original och utgå från Full, så den skiftar tillbaka
till det även från mainmenyn." Vi valde A: att öppna tutorialen från
Lite gör ett RIKTIGT byte, `uiSetMode('full',{force:true,quiet:true})`
i openTutorial + en toast som säger var pillen finns, trion inklusive,
och man stannar i Full efteråt. `_uiLift`/`uiLift` och de tre
insticksställena i tutLaunch/tutStart/tutEnd är borta; `uiMode()` läser
bara `conv.uiMode`. `uiSetMode` fick `opts.force` (hoppar över
lobby/spel-spärren — ett kedjat kapitel på ett levande tutorialbord
är en legitim anropare) och `opts.quiet`.

Lärdomen (i learnings): ett "bara presentation"-override är en halv-
åtgärd som skapar ett tredje tillstånd ingen ritat — hör en funktion
hemma i ett läge, byt läge.

Gates: destruktivt exakt 2/2 mot v2.6.74 (det omskrivna bytestestet
+ källkontrollen `uiLift(` = 0) · klient 92/0 (+4) · dispatch 42/0
· protokoll 6/0 · B1 byte-identisk 1 191 848 · check-versions grönt.
Ren klient — purge. Webbläsarkollen: Lite → Menu → Play… → Tutorial
→ toasten, Full-startrutan under pickern, animationer på i kapitlen,
Full kvar efter End; pillen tar tillbaka till Lite.

## [LITE] — ett läge, en fil: Lite/Full-växeln, databasen på som default, alpha-pillen på bottarna (9 september 2026, klient v2.6.74)

Johan kom tillbaka efter splitten med tre saker: en synlig "Alpha"-
markering när man lägger till bottar, frågan om bottarna funkar via
en privat server, och feedbacken att klienten "känns lite för mycket"
— han ville ha en Lite-variant, "så enkel och direktjämförbar med
Lackey som det går" men med det verkligt värdefulla kvar.

**Privat server + bottar, av kodläsning:** klienten laddar
elysium-bot.js och elysium-cardfx.json med RELATIVA URL:er, och
servern har sedan srv-2.6.28 en exakt route för just de två namnen
ur sin egen mapp — så en privat värd behöver bara filerna bredvid
elysium-server.js (paketet har dem); LAN, Tailscale och tunnel är
samma origin. Inte nätverkstestat här.

**Syster-html eller läge?** Läge, utan tvekan: en linje (mergen var
en vecka gammal), all tooling (split/build/B1, harness, check-versions,
deploy = en fil) förutsätter EN klient. Så: `conv.uiMode` → `body.lite`
+ ett tiotal CSS-regler som DÖLJER ingångarna, och `uiLite()`-grindar
i JS som hängslen bakom dem (openDeckLab/openOffline vägrar med toast).
Fulls beteende är oförändrat by construction — varje Lite-regel är
scopad till body.lite.

**Det Johan bad om, och hur det landade:** Startrutan i Lite =
Settings / Create game / Join game + pillen "Lite | Full" uppe till
höger (textpill, inte ikon — ingen vet vad ikonen betyder än). Menyn:
Play… → Create game / Join game / Offline utgråad / Tutorial, Decks… →
Load deck / Deck lab utgråad, båda med tooltip "available in Full
mode" (renderItems fick `title`, `.mi.disabled` behåller pointer-
events för att tooltipen ska visas), plus "Switch to Lite/Full mode"
som är spärrad i lobby/spel. Samma mpModal bär båda halvorna:
`openMP('create'|'join')` sätter `data-mp` och titeln; klasserna
.mpFull/.mpCreateOnly/.mpJoinOnly/.mpGs gör resten. Create döljer
adress, server-/adminlösen, Board style, Helpers, lock och anon, och
fäller Match length/Reaction timer/chat/spectator chat bakom "Game
settings ▸"; de gömda fälten fylls av mpLiteDefaults() (Classic,
Tournament-helpers, låset PÅ, adress = sidans host, elysium.cards
bara för en adresslös file://-klient). Join visar namn, rum, lösen,
Join as spectator och listar rummen direkt. Lobbyn och Import deck
saknar Deck lab-knapparna; sparade lekar dyker upp som vanligt.

**Beslut i rundan:** (1) KRCG-databasen PÅ som default i BÅDA lägena
("3 MB är ju ingenting") med bara bilderna valbara — hela KRCG-blocket
på startsidan är borta, en engångsmigrering (`dbDefault`) slår på den
för befintliga installationer, Settings-rutan kan stänga av den efteråt;
de två tutorialstegen intro-db/intro-img är borta (svitens "varje
$('#id')-mål finns"-test hade fångat dem). (2) Tournament lock
ikryssad som default i Full också — konsekvensen är sagd rakt ut:
varje default-rum kräver nu legal leksstorlek på servern (12+/60–90)
och vägrar New deal efter start; klientens "Legal deck only" är redan
på så de flesta märker inget. (3) Första besöket på en SERVERAD sida
(webben, tunnel, LAN-värd) startar i Lite med pillen pulsande och en
förklarande bubbla ("Got it"); file:// och localhost startar i Full
(pysslarens kontexter, och harnessen håller sig i Full utan special-
kod); sedan är läget det man hade sist. Befintliga spelare (något
sparat, inget uiMode) landar i Full — ingen ser en förändring.
(4) Per-läges-minne för trion anim/pco/sfx (`conv.uiProf`,
uiProfileSwap): Lite börjar på All hidden/All hidden/0, kommer ihåg
sina egna ändringar, och Full får tillbaka exakt sina värden.

**Tutorialen** spotlightar precis det Lite döljer (Deck Lab, Play
offline, hela Play online-dialogen), så den kör LYFT till Full:
uiLift(true) överst i tutLaunch OCH tutStart, uiLift(false) i tutEnd
— noll kapitelkirurgi, och v2.6.72-lärdomen "en UI-grind behöver sin
tutorial-audit" hålls med ett test som asserterar att lyftet sitter
på båda startpunkterna och i nedmonteringen. Lyftet är bara
presentation: Lite-trion (inga animationer) gäller under tutorialen.

**Alpha:** en liten brass-pill "alpha" efter 🤖 på varje bot-säte
(tooltip: enkelt, ärligt spel, kan missbedöma — Report a problem),
och en notis under sätena när minst ett säte är bot. Inget i spelet.

**Harnessen** fick två saker på köpet: `fetch` shadowas med en
avvisande stub — med databasen på hade VARJE loadClient annars
hämtat 3 MB från KRCG på Johans maskin mitt i sviten (en race mot
mini-DB-testerna) — och `loadClient(path, {storage, location})` så
first-run-regeln och migreringen testas mot sparade objekt.

Gates: destruktivt exakt 9/9 mot levererad v2.6.73 · klient 92/0
(+4 hoppade utan boten) · dispatch 42/0 · endpoint-smoke 20/0 (+2
som behöver botstatics bredvid servern) · protokoll 6/0 · canary
hoppar utan boten · B1 byte-identisk 1 192 329 · check-versions
grönt. Ren klient — purge. Webbläsarkollen, i ordning: hintbubblan
över rubriken tills Got it; Game settings-fällen (gridordning);
Create i Lite → rummet föds Classic + Tournament + lock (🏆 i
listan); Join i Lite → listan direkt, Watch på ett startat rum;
pillen och menyraden spärrade i lobby; tutorial från Lite → Full-
kort under, Lite tillbaka efter End; Offline-modalen med 🤖 →
alpha-pill + notisen; ?mode=lite. Inte gjort: START-HERE/Host Guide
nämner inte Lite (faller in i B-52b).

## [SPLITTEN] — Elysium Bots blir systerprojekt: ägande i stället för delade filer (9 september 2026, dokument + svit; ingen versionsbump)

Johan: "bottprojektet går ur kostymen". Mätt: 45 av 85 filer bot-
ägda, 3,0 av 5,5 MB. Kopplingen tunn — botsviten behöver varken klient
eller harness; huvudprojektets enda beroende är fyra klientsvit-tester
(HB2b/HB2c/hold/range) som nu är `testB` och hoppar högljutt utan
elysium-bot.js (83/0 + 4 hoppade; 87/0 med den releasade boten bredvid).
Boten, arenan, table, gen-verktygen, cardfx-pipelinen, decks, bot-
sviterna, bot-designkanon och START-HERE-BOTS flyttade till Elysium
Bots, som fick CLAUDE-arena→CLAUDE.md, SKILLS-arena→SKILLS.md och nya
journal/context/learnings/changelog (seedade med index + pekare hit).
Botprojektet håller READ-ONLY-kopior av server, protokoll och hotseat-
bots-planen (arenan spawnar servern; kontraktet). REGELN i båda
bootstrap-filerna: konsumera releaser, redigera aldrig det andra
projektets filer; tvärgående = två sessioner, kontrakt först. Huvud-
projektet efter splitten: 40 filer, ~2,5 MB. Manifestet fick E2
"consumed releases", changeloggens bot-sektion blev en pekare,
runboken pekar på botprojektets releaser. PROJECT-INSTRUCTIONS.md
bär de instruktionstexter Johan klistrar in i respektive projekt.

## [HISTORIKUTDRAGET] — projektet nära fullt: releasekedjorna flyttas ut ur koden, in i arkiv + CHANGELOG (9 september 2026, klient v2.6.73 / server srv-2.6.32 / bot v0.6.102, kommentar-only)

Johan fick plats med EN av de komprimerade docsen och behövde 160–180
kB till. Mätningen visade var bytesen satt: bottens BOT_VERSION-rad
var 88 kB (18 % av filen, skeppad till varje spelare), protokollhuvudet
33 kB av dokumentets 69, klientens VERSION-rad 28 kB, SKILLS-intron 18,
CLAUDE:s poster före lanseringsveckan 42. Journalen var nästan helt
färsk (14 kB gammalt) och lämnades. Allt flyttades ORDAGRANT till
elysium-history-2026-09-09.md i arkiv-zip:en (inte projektet); kodraderna
fick en enrads-not; ~213 kB frigjort utöver context/learnings-kompakt-
eringen. NY KONVENTION: VERSION-raden bär bara den aktuella release-
noten; vid varje bump flyttas föregående not till elysium-CHANGELOG.md
(nu i projektet, en post per release) — raderna växer aldrig igen.
Tre kommentar-only-bumpar (klient v2.6.73, srv-2.6.32, bot v0.6.102)
för att hålla "samma version = samma bytes". Gates: klient 87/0 ·
dispatch 42/0 · canary 37/0 · bot ×3 · HB1-smoke 11/11 · endpoint-
smoke 22/0 · protokoll 6/0 · B1 byte-identisk · check-versions grönt.

## [MERGENS SISTA TRE FILER] — bot-chattens protokoll, SKILLS och dispatch-svit anlände; mergens största osäkerhet stängd (9 september 2026, dokument, ingen versionsbump)

Johan laddade upp de tre filer som saknades. Diffat mot det mergade:
**dispatch-sviten** = min minus B-63-testerna (deras 39 = snapshotens;
ingenting att merga). **Protokollet** = identiskt utom headern — inget
eget §6.3, statics-routen stod bara i headerkedjan; deras kedja
(cli-2.6.59–70 + srv-2.6.28) är nu invävd i det mergade huvudet efter
telemetri-posterna och före den gemensamma cli-2.6.58-svansen, som
en märkt [hotseat-bot lineage]-sektion; mitt §6.3 står kvar som den
enda sektionen för routen. **SKILLS** = identiskt utom Reflects-
klausulen i intro-raden — deras HB-kedja invävd på samma sätt.
Protokollint 6/0 · check-versions grönt. Inga recept saknades: bot-
spårets recept bor i SKILLS-arena.md, som inte ingår här.

ÄRLIG NOT: den här journalen trunkerades av ett misslyckat skriv i
v2.6.72-rundan (ett surrogatpar i en Python-sträng — open('w') hade
redan tömt filen när kodningen small) och den tomma kopian hann ut i
outputs innan jag såg det. Återuppbyggd exakt ur de två intakta
källorna (telemetri-journalen + bot-journalen) plus mergeposten.
Lärdom loggad: skriv till en tempfil och byt namn, aldrig open('w')
direkt på ett levande dokument.

## [START-GRINDEN + BOTEN PÅ SÄTE 1] — två offline-fynd direkt efter mergen (9 september 2026, klient v2.6.72)

Johan: (1) "Start hotseat" gick att trycka utan valda lekar och
'startade' ett tomt bord (poolglobs-välkomsten); (2) första spelaren
borde kunna vara en bot i offline — man väljer ju inte bordsplacering
som online utan skriver vilket namn som sitter var.

**Start-grinden:** offlineReady() — två spelare, minst ETT mänskligt
säte (ett helbot-bord är arenan), lek på varje mänskligt säte (bottar
bär alltid en). Knappen utgråas med skälet i hint och title, synkas
vid varje lekval/toggle/lägg till/ta bort, hängslen inne i
startOfflineFromCfg. De tre tutorialkapitlen som spotlightar Start
går alla via "Fill the table" först — ingen strandar.

**Boten på säte 1 — varför det inte gick:** startHotseat aktiverade
ALLTID säte 1 (net.you, live state, första-turs-cue), och svepet
körde ALLA bot-säten i stigande ordning efter varje mänskligt pass —
rätt bara när enda människan sitter på säte 1; med bot på 1 hade den
spelat på fel plats i varvet, och med flera människor spelade varje
bot om efter varje pass. Nu: togglen på alla säten; startHotseat
aktiverar första MÄNNISKAN (tur 1 tillhör fortfarande säte 1);
hotRunBotTurns är INTERVALL-baserad (bot-sätena strikt efter fromSeat
runt cirkeln fram till nästa människa — en ensam människa på säte 1
får 2..N exakt som förr); pass() och ▶ kör intervallet till
hotNextHuman(); och hotSpawnBots spelar ÖPPNINGEN (0 → första
människan, säte 1:s räknare redan hållen av {first:true}) innan
människan får sin tur med vanlig cue. Ingen-arg-svepet behåller HB2c-
kontraktet (sviten).

Sviten: readiness-batteri, första-människa-aktivering (harnessens
classList-stub gjordes itererbar), och ett riktigt tresätestest med
bottar: [1] öppning, [3,1] varv, [1,3] legacy. Destruktivt: exakt de
tre nya faller mot levererad v2.6.71. Gates: klient 87/0 · canary
37/0 · B1 byte-identisk 1 205 262 · check-versions grönt. Ren klient
— purge. Webbläsarkollen: ett bord med 🤖 på säte 1 — boten ska
spela först, sedan din tur med cue.

## [MERGEN] — två linjer blir en: bot-spåret + telemetri-spåret, hotseat-Hold-on härdad, planen för nästa kapitel i eget dokument (9 september 2026, klient v2.6.71 / server srv-2.6.31 / bot v0.6.101 / digest v1.4)

Johan: "jag måste sluta jobba i parallella versioner — det blir så
stökigt." Bot/hotseat-chattens filer laddades upp (klient v2.6.70,
srv-2.6.28, bot v0.6.101, journal t.o.m. 9 aug) och mergades HÄR,
med telemetri-linjens delta (levererat som v2.6.60–64 / srv-2.6.29–30,
11 aug–8 sep) rebasat ovanpå DERAS bas — deras arbete är det jag
saknar kontext för, så det fick vara grunden.

**Mätt, inte gissat:** torrkörning av mina 45 kodeditar mot deras
filer gav 34 automatiska träffar — varenda B-63-, polish-, settings-,
pinch-, shim- och vaktedit i klienten landade rent på v2.6.70.
Handmergat: tre VERSION-rader (båda historikerna sammanflätade,
telemetri-posterna ovanför bot-posterna enligt 27 juli-precedensen),
svitsvansen (mina asynktester rider nu deras testA-runner — snyggare
än min ad hoc-IIFE), protokollhuvudet (+ §6.3 för srv-2.6.28:s
statics-route, dokumenterad från serverkoden). Digesten (v1.4) och
dispatch-sviten var orörda av bot-spåret och gick in som de är.
Numrering: klient v2.6.71, server srv-2.6.31, bot orörd.

**Hold on-rapporten, utredd före mergen:** botsidan BEVISAD i
harnessen (riktig bot över hotBridge: ⏸ → turen stannar → "It
resolves" → ▶ → spelar → passar) — v0.6.101:s svansvakt gör sitt
jobb; Johans minne är sannolikt från före den sista rundan. Två
klientsidiga fynd härdade: (1) hotSpawnBots askSecs 2 → 20 — bottens
Block?-fönster stängde innan en människa hann reagera (online-default
25); (2) saySend relayar till bryggan FÖRE bubbelmålningen, var för
sig i try/catch — tråden före bilden, en DOM-miss i botens kameravy
kan aldrig äta pausen. Chat-släpp ("carry on") är INTE relayat:
chatraden är dold i hotseat (net.status 'off'), så det är en riktig
HB2d-skiva med UI, inte en mergehärdning. Nytt end-to-end-test i
sviten: human say → pacad bot pausar vid bryggan → It resolves
släpper → turen fullbordas.

**Utvärderingen av bot-spåret** (journalens egen dom): arkitekturen
rätt (bot = remote player utan blob, env-agnostisk bot, IIFE-pansar),
disciplinen höll (753/0, destruktiv verifiering, mekanismexakta
poster, egna felutsagor rättade). Risker: tolv klientversioner på två
dagar, alltihop odeployat alfa i produktionsfilen; delade vägar
ändrade (pass(), fasgrindarna) med only-Unlock-roten ÖPPEN — måste
verifieras i webbläsaren före purge. Den djupare diagnosen: bordet
har TRE hjärnor (servern, hotseat-blobbarna, hotBridge) — varje
spegelbugg i spåret var samma bugg. Planen för EN hjärna (spelkärnan
delad server↔klient via byggfragment, sedan hotseat som lokal
serverinstans med virtuella klienter, principen omformulerad till "en
nedladdning, noll terminal") bor i elysium-core-plan.md — skriven för
att starta en ny chatt kall.

Gates på mergen: klient 84/0 (71 deras + 13 mina/nya) · dispatch
42/0 · canary 37/0 · bot 753/0 · HB1-smoke 11/11 · endpoint-smoke
22/0 · protokoll 6/0 · B1 byte-identisk 1 199 794 · check-versions
grönt. Inga patchskript den här gången — det finns bara en linje nu.
FÖRE deploy: Johans webbläsarlista i svaret (only-Unlock överst).

## [DEPLOYAD + DIGEST v1.4] — live kör hela paketet; främmande skript viks ihop (9 september 2026, digest v1.4)

Johan deployade 8–9 sep: klient v2.6.64 (kumulativ sedan 11 aug),
server srv-2.6.30, digest v1.3 — iPad-pincharna är äntligen lagade
i skarpt läge. På hans "det låter väl bra att fixa": **digest v1.4**
viker ihop kraschrader från FRÄMMANDE skript — src under /cdn-cgi/
(Cloudflares beacon/challenge/Rocket Loader) eller det detaljlösa
"Script error." — till en rad: kinds visar dem som 'foreign', de
tar aldrig en kraschrad, och en summeringsrad säger hur många.
Samma två tester som klientens crashNotice() (v2.6.64), så spelare
och ops ser en regel. Raderna ligger kvar i loggen (jq: .src).
Torrkörd mot främmande + riktig + rapport + serverrad. Skriptbyte,
ingen omstart.

**Nästa steg är MERGEN:** Johan vill sluta jobba i parallella linjer
— bot/hotseat-chattens klient ska få allt härifrån (v2.6.60–64)
och sedan bli DEN enda linjen. Plan: han laddar upp bot-spårets
senaste filer här; jag rebasear mitt delta ovanpå deras bas (mina
patchar är ankarbaserade — orörda regioner går automatiskt, VERSION-
raden och berörda regioner löses för hand), omnumrerar enligt
27 juli-precedensen, kör hela gate-sekvensen inkl. bot ×3, och
mergar journal/context/learnings kronologiskt. Inga patchskript för
digest-rundan — digesten är fristående och docsen mergas ändå.

## [ANDRA-SKÖRDEN] — gamla webbläsare, vaktskriptet och kraschnotisen (8 september 2026, klient v2.6.64)

Tre veckor senare, inget deployat än (live kör v2.6.61), två nya
digests. Chrome-paret "reading 'x'" ×2 är pinchbuggen i V8-
frasering — dist()-raden, sedan mid()-raden, ett cykelvarv —
bekräftar v2.6.63 utan att tillföra något. Det intressanta var
".at is not a function" ×2: minifierade namn (t.entries.at,
this.i.at), NOLL träffar i vår ominifierade källa → Cloudflares
egna same-origin-injicerade skript (/cdn-cgi/) som kraschar i en
webbläsare utan Array.prototype.at (Safari <15.4 / Chrome <92).
Inte vår bugg — men vårt hål: klienten läser zoner med .at(-1)
på 17 ställen, så den spelaren hade kraschat hos oss vid första
kortdraget. API-inventering: .at är det ENDA hålet (inget
structuredClone/randomUUID/replaceAll/hasOwn/findLast).

Tre saker skeppade, varav två på Johans "fritt fram för
användarmeddelanden när vi förväntar oss krascher":
**(1) _atPolyfill** på Array+String när den saknas, namngiven så
sviten testar den mot native på tolv kantfall. **(2) Vaktskriptet:**
en webbläsare som inte kan PARSA huvudskriptet kör inget alls —
inte ens kraschkrokarna — och spelaren ser en död sida. Ett rent
ES5-skript i head väntar 6 s på window.__elysiumBooted (huvud-
skriptets SISTA sats); uteblir den visas en enkel notis som nämner
webbläsargolvet. Två hårt förvärvade detaljer: taggen MÅSTE bära
ett attribut (id="legacyGuard") — split_client.py, elysium-build.js
och harnessen nycklar alla på den ENDA attributlösa script-taggen —
och harness-regexen matchade gladeligen taggen när jag stavade ut
den i en KOMMENTAR. **(3) Kraschnotisen:** EN lågmäld 9 s-toast per
session vid första kraschpingen, filtrerad till VÅRA fel ('Script
error.' och /cdn-cgi/ hoppas över), ärlig om huruvida en rapport
gick iväg (errPosts returvärde), omladdningstips, och en pekare
till Report a problem — kraschpingen blir tratten in till fulla
B-63-rapporter. toast() fick valfri varaktighet.

Harnessen: window-proxyns set-trap svalde alla skrivningar, så
boot-flaggan lästes tillbaka som stub — nu består skrivningar som
i ett riktigt fönster (alla sex befintliga window.x= i klienten
trivdes med det). Erbjudet men inte byggt: digestfilter som viker
ihop /cdn-cgi/-rader till en "Cloudflare-script noise ×N"-rad.

Gates: destruktivt 3 mot levererad v2.6.63 · klient 76→79/0 ·
dispatch 42/0 · canary 37/0 · bot 721/0 · B1 byte-identisk ·
check-versions grönt. Ren klient — purge. Och: DEPLOYA — allt
sedan 11 augusti väntar.

## [FÖRSTA-SKÖRDEN] — live-telemetrin betalar sig: pinchkraschen och Firefox-nullen (19 augusti 2026, klient v2.6.63)

Johan klistrade in tre digests (15–17 aug): 18 kraschrader, tre
webbläsarfamiljer, noll användarrapporter behövda — B-54/B-63-
röret gjorde sitt jobb redan första veckan.

**Pinchkraschen (10 av 14, WebKit/iPad) — rotorsakad hela vägen:**
cancelSingles() skickar syntetiska pointercancel per finger FÖR
felt-pan-spegeln och pile-drag-städarna (v2.5.39-lärdomen) — men
pinch-trackerns EGEN document-capture-end() hörde dem också och
tömde pts i själva aktiveringen. d0=dist() läste a[0].x på TOM
array (×5), pinch förblev true över tom karta, och nästa
enfingerrörelse läste a[1].x på EN-postig array (×5) innan
fingersläpp läkte tillståndet — en perfekt alternerande 1:1-cykel.
Själva 5+5-symmetrin i digesten VAR diagnostiken: kraschpar i
jämn takt är en tillståndsmaskinscykels signatur. Latent sedan
v2.5.41 — bara L3-på-touch träffar vägen, och Pixel-testningen
körde duellvyn; riktiga iPad-spelare hittade den på dagar. Fix:
_synth=1 på de syntetiska eventen + end() ignorerar dem (de finns
FÖR de andra lyssnarna), plus tre hängslen: självläkning av
förgiftad pinch-flagga, ren bail om någon framtida lyssnarkedja
äter punkterna igen, och mid()/dist() vägras under 2 levande
punkter.

**Firefox-nullen:** "can't access property replace, s is null" —
escapeHtml med null. Ett dussin anropare, EN förekomst: sink-fixen
(String(s==null?'':s)) dödar klassen på en rad där anropar-
gissning vore grep-and-patch. Uppströmsfrågan (VAR kom nullen
ifrån?) står öppen tills råraderna läses.

**Kluster B/C väntar på råraderna:** faceDown-läsningen (×1) och
tx-sättningen (×2, en sync + en async väg) har MÅNGA kandidatsajter
— men src/line/col/stack whitelistas på disken och pekar exakt mot
v2.6.61-radnumren. 'Script error.' ×4 är cross-origin/tilläggsbrus
utan detalj per CORS-design — ignoreras.

Gates: klient 76/0 · canary 37/0 · B1 byte-identisk ·
check-versions grönt. Ren klient — bara Cloudflare-purge.

## [SETTINGS-I-DUMPEN] — hela inställningsytan rider varje rapport (11 augusti 2026, senast, klient v2.6.62 / server srv-2.6.30)

Johans tredje före-deploy-tanke: "är användarens settings med i
loggfilen?" — självklart rätt, hälften av alla renderingsbuggar
hänger på defaultView/anim/hoverPreview/touchUI. dump.env.settings
bär nu HELA conv-ytan som skalärer (booleans/tal som de är, strängar
kapade 32; sfxIndiv hoppas över som objekt, tutDone rider som
tutDoneN) plus härledda localImgAuto — varje bildgrind läser
conv.localImg||localImgAuto, så en dump utan den ljuger om vilken
bildtier som faktiskt kör. ERSÄTTER fyrflaggskvartetten helt:
tournament/legalDeck/legalCards/errPing var ju conv-nycklar hela
tiden — en källa nu. Samtyckestexten nämner inställningarna.

Serversidan (srv-2.6.30) fick en designfråga på köpet: conv växer
med nästan varje version — en NAMNLISTA på servern hade tyst
tappat varje ny inställning tills någon mindes att synka
(serialize/restore-driftklassen, fast på tråden). Så settings är
dumpens enda FORMVITLISTADE medlem: nyckelmönster
/^[A-Za-z0-9_]{1,24}$/, värden boolean | ändligt tal (3 dec) |
skrubbad sträng ≤32, max 48 poster; objekt/arrayer/allt annat
släpps. Samma inget-ovetterat-når-disken-garanti, noll synkbörda.
Namnlistor förblir rätt där servern ÄGER schemat — lärdomen
loggad.

Gates: destruktivt 9+4 mot orört · klient 76/0 · dispatch 42/0 ·
smoke 18/0 (settings-roundtrip med objektvärdet släppt) · canary
37/0 · bot 721/0 · B1 byte-identisk · check-versions grönt.
Server-omstart + Cloudflare-purge — samma deploy som resten.

## [FÖRE-DEPLOY-PUTSEN] — mojibaket i kapitelväljaren + Settings-guiden bakom ett frågetecken (11 augusti 2026, senare, klient v2.6.61)

Johans två irritationer inför deployen, båda ren klient.

**Mojibaket:** inte trasiga bytes — källfilen var ren UTF-8 med korrekt
charset i båda ändar. Jakten gick genom fyra hypoteser (â€-mönster,
meta charset, serverns Content-Type, textContent-ytor) innan roten
föll: tutorialens KAPITELVÄLJARE renderar name/desc genom esc() —
helt rätt, det är författad data — men TRE desc-fält bar HTML-
entiteter ('host&rsquo;s' i Host a table, 'else&rsquo;s' i Join a
table, 'Advanced &mdash;' i Run your own server). esc() dubbel-
escapade dem och spelaren läste råtexten — "en massa andra tecken",
precis som Johan sa. Stegtexterna (innerHTML) var aldrig drabbade,
därför syntes felet BARA i beskrivningarna. Fixen: äkta tecken i
datan, som syskonfälten alltid haft. Sibling-auditen betalade sig
igen: den första manuella greppen hittade två av tre bärare — den
formmatchande svepregexen ((?:name|desc):'[^']*&[a-z]+;) hittade den
tredje. Lärdom loggad: entiteter hör bara hemma i rå statisk HTML;
författade JS-strängar bär äkta tecken, för konsumenten avgör och
konsumenter byts.

**Settings-guiden:** "Check a local images folder"-raden kapad till
första meningen ("...this browser's cache."); hela mappguiden
flyttad byte-identisk till ett hopfällbart .slHelp-block bakom en ny
rund ?-knapp (.slq) bredvid bockrutan. preventDefault/stopPropagation
som hängslen (interaktiva barn till en label aktiverar den inte
enligt spec, men det kostar inget), aria-expanded underhålls, och
.slHelp[hidden] bär den stående klass-slår-[hidden]-vakten
(#avrLive-familjen).

Gates: klient 76/0 · dispatch 42/0 · canary 37/0 · bot 721/0 ·
B1 byte-identisk · check-versions grönt. Ingen serverbump, ingen
omstart — men klienten kräver Cloudflare-purge som vanligt.



## [B-63-DUMPEN] — supportpaketet: varje rapport bär hela det spelarsynliga bordet (11 augusti 2026, klient v2.6.60 / server srv-2.6.29 / digest v1.3)

Designspecen från 8 augusti (elysium-dump-design.md) sa allt om VAD;
den här sessionen var VERKSTADEN. Grundidén oförändrad: när en spelare
trycker "Report a problem" ska Claude kunna felsöka från rapporten
ENSAM — utan att be Johan återskapa läget. Så nu rider dump:{game,env}
på varje rapport: hela den publika bordsbilden (egna PUBZ-kort plus
varje sätes publicerade pub-kort), rapportörens EGEN hand med namn
(D2 — det är deras information att dela, samtyckestexten säger det
rakt ut), plus klientvitalia: ws-hälsa (connected/reconnects/
lastMsgAgoMs), kortdatabasens tier (cardDBSrc — ny variabel som
processCardData stämplar), storage.estimate, lekcensus med
legalitetsvarningar (B-53-förgiftningen syns nu i VARJE rapport) och
de fyra ofarliga flaggorna.

**T4-filtret är kärnan och det sitter på KLIENTSIDAN.** En motståndares
nedvända kort blir en positionsstubb {id,z,s,x,y,fd:1} — inget namn,
inga räknare, inte ens kind. Skälet är hotseat: buildPub publicerar
namn mellan lokala säten (samma maskin, samma minne), så servern KAN
inte filtrera — den som fångar måste. Servern uppfinner aldrig ett
n-fält men kan inte verifiera en modifierad klients ärlighet;
manifestet säger det ärligt.

**Degraderingsstegen (fitReport) garanterar att rapporten ALDRIG
faller på att dumpen är fet:** ring 200→120→80, sedan strippas
bordets räknardetalj (positionerna berättar fortfarande historien),
sist släpps hela dumpen med dumpTrunc:1. Kastar buildDump på
klientsidan skickas rapporten ändå, med dumpErr:1 (T7). errRing
växte 40→200 (RING_MAX) och ringposterna rider nu som {t,m} på
tråden — servern tar BÅDA skepnaderna (äldre klienter skickar
strängar), tvåskepnadsdisciplinen från dag ett.

**Serverns dumpRecord() är en ren picker:** whitelist på VARJE nivå
(bord ≤600 fältplockade poster, hand ≤120, säten ≤8, census ≤30,
allt skrubbat), okända nycklar når aldrig disken. **Specbugg
hittad och rättad:** specen sa "coerce t|0" — men |0 int32-kraschar
ms-epoker (1.7e12 blir negativt) och fleradygns-uptimes; dInt()
(Math.floor + Number.isFinite) i stället. ERR_BODY_MAX 32→64 kB.
Noll trådförändring — allt rider befintliga POST /client-error.

**Äkta fynd på vägen:** projektsnapshotens elysium-test-harness.js
var FÖRÅLDRAD — orörd svit kraschade mot orörd klient (v2.6.57-
rundans deckUnknownNames/deckUnknownText-exposes saknades; svitens
egen rad-717-vakt fångade det). Reparerad, lärdom loggad: snapshot-
drift gäller även harnessen, inte bara huvudfilerna.

**Versionshoppet:** v2.6.59 + srv-2.6.28 är medvetet ÖVERHOPPADE —
parallella bot/hotseat-chatten bär de strängarna i flykt, mergen
omnumrerar enligt 27 juli-precedensen. **Digest v1.3 — och ett löst
mysterium:** v1.2 byggdes först på v1.0-basen med en ärlig not om
att v1.1 ("report detail blocks", 8 aug) saknades i snapshoten.
Johan kollade: hans senaste digestfil är från 6 aug — v1.1 nådde
aldrig boxen. Sökning i 8 aug-chatten visade varför: v1.1 byggdes
och levererades som direkt svar på hans egen morgonfråga ("inga
detaljerade rapporter med loggar?") — och hans NÄSTA meddelande i
samma chatt var idén som blev B-63; scp-steget hamnade i skuggan av
den större tanken. v1.3 = v1.1:s detaljblock (ordagrant återhämtade
ur leveranstranskriptet: rapporter inline med not + deck/räkningar +
läge + sista ringraderna, nyast först, max 3 per digest, krascher
förblir aggregerade, ringelement 110 tecken) + v1.2:s
[+snapshot]-tagg flyttad till detaljraden (histogramraden den satt
på finns inte i v1.1-världen) + tvåskepnadsläsning av ringen
({t,m} från v2.6.60+, strängar före — utan den hade v1.1 renderat
"[object Object]"). Torrkörd mot båda skepnaderna, dump-taggen,
old-shape-rader och överflödesraden. Payloaden renderas aldrig
inline i Discord — pull-routen + jq är detaljen.

Gates: destruktivt verifierat (9 nya klienttester + 4 servertester
föll mot orörda filer) · klient 76/0 · dispatch 42/0 · live-smoke
17/0 (inkl. dump-roundtrip + 80 kB-prob) · protokoll 6/0 · canary
37/0 · bot 721/0 ×3 ensam · B1 byte-identisk 1 150 657 ·
check-versions grönt. Leverans: uppdaterade filer + kodpatch +
docpatch (parallellspårssäkra, ASCII-escapade). Klienten kräver
Cloudflare-purge, servern omstart, digesten är bara skriptbyte.

## [SLUTSVEPET — GRANSKNING + TVÅ TÄTNINGAR] — klock-ordningen friad, Hold on lufttät i svansen, fx-kinden namngiven som vilande (9 augusti 2026, bot v0.6.101 amend)

Johans avslutande fullgranskningsfråga gav: (1) KLOCK-ORDNINGEN FRIAD —
annonsens fx/chat köas FÖRE ask-armeringen, så _chatSettleMs ser
deklarationerna vid beräkning (källäst ovanför 3925-sajten); den
contested-grenens _restartAskTimer lämnas orörd (mitt-i-fönstret-omstart
ska INTE återlägga settle). (2) HOLD ON LUFTTÄT — pausgaten kollades
bara i _pace-toppen medan sömnarna nu är ~5 s: en hold mitt i sömnen
släpptes igenom akten; svansvakt tillagd (topp + svans = tät; arenan
paceMs 0 orörd). (3) NAMNGIVET VILANDE: 'fx'-kinden är definierad
vokabulär utan anropssajter — dränagets 200 ms sköter fx-avståndet;
kinden aktiveras om del 2-retaggen någonsin behöver finare korn. (4)
12000-fönstret i pacade sektionen höll under nya rytmen (verifierat av
körningsordningen); bevakas. Svit #2 på slutkoden 753/0 (#3 = nästa
passets ritual, grindnoterat); canary 37/0 · smoke 11/11. Slutversioner:
klient v2.6.70 · bot v0.6.101 · srv-2.6.28 · cardfx-compile v1.6.13.

## [SEN-BUBBLANS EFTERKONTROLL — TVÅ VAMPYRER I EN DIFF] — chat-gapets interaktion med __board-dedupen löst i primitiven; det pacade flerturstestet vidgas ärligt (9 augusti 2026, bot v0.6.101)

Johans rapport: tur 2:s influence tog upp TVÅ vampyrer som flög
SAMTIDIGT. Mekanismen var en interaktion mellan gårdagens delar: raisen
HAR _pace() emellan (rad 1218) och chattar — men v0.6.100:s chat-gap
(~5 s) överstiger nu steget (3,1 s), så raise 1:s __board låg gap-hållen
i kön när raise 2 körde; dess push() fann sentineln redan satt, EN
tvåvampyrs-diff animerade båda. FIXEN bor i primitiven och gynnar alla
sajter: _pace gör en EFTERKONTROLL efter sin sömn — en bubbla som
dränerade MEDAN vi sov (försömns-chatHold läste en gammal stämpel)
håller nästa akt tills den spelat klart; boards dränerar mellan akter,
diffar separerar, korten reser sig ETT I TAGET. 78f bevakar (stämpel
som landar mitt i pace förlänger väntan; kedjat, renfallar på förfix-
boten — 78e fick sin typeof-vakt FÖRE anropet efter en abort-läxa:
destruktiva fel ska falla rent, aldrig krascha sektionen; 6/6 78:or
faller rent mot baslinjen). FÖLJDÄRLIGHET: det pacade flerturstestet
('turn back after bot turn 4') vidgades 11→18 s — den nya rytmen gör att
fyra fulla turer ÄRLIGT tar längre (chattar håller nästa akt per
designen); fönstret vidgas hellre än rytmen tunnas. Grindar: bot 753/0 ·
canary 37/0 · smoke 11/11 · klient 71/0 · destruktivt 6 rena 78-fall ·
check-versions grön. Johan: byt elysium-bot.js — vampyrerna ska nu resa
sig i tur och ordning, varje med sin bubbla.

## [INFLUENCE-DOMEN — EKONOMIN FRIAD, SPENDERLUCKAN DÖMD, EGEN UTSAGA RÄTTAD] — boten HAR säteskodad ramp (rad 4622); det som saknas är partial fills (9 augusti 2026, diagnos; implementation = bot-rundan)

Johans fråga om bottens första-turs-influence gav tre lager: (1) RÄTTELSE
av mitt tidigare filade fynd — boten SAKNAR INTE ramp: rad 4622 kör
this.inf += (ownTurns===1) ? min(availInf, this.seat) : availInf — den
SÄTESKODADE öppningsrampen (mina grep-mönster 'this.inf =' och
'Math.min(4' missade inf += och min(availInf,...); läxa: negativa
kodpåståenden kräver mönsterbreddning). (2) EKONOMIN FRIAD för Johans
bord: säte 2, tur 1 → 2 transfers ✓ — och i 2-spelar sammanfaller
sätes- och spelturs-regeln för bot-sätet (2, sen 4). Spelturs-omskriv-
ningen (min(4, gameTurn), speglande klientens v2.6.67) behövs ändå för
3+-sätesbord — kvarstår i bot-rundan. (3) SPENDERLUCKAN DÖMD:
_influenceLoop (4622-området) har grenarna komplettera-vampyr /
transferSwap / fetch — men INGEN partial fill: med 1 transfer kvar och
ingen kompletterbar vampyr bryter loopen och transfern BRINNER INNE i
stället för att bankas som blod på billigaste ofärdiga uncontrolled
(blodet ligger kvar mellan turer — en weenie avstår ALDRIG). Fixen är
TAKTISK och kräver sannolikt unc-blodmodell (bär _addUnc-posterna
blodräknare? verifieras först) + pub-representation + sviter + ARENA-
UTVÄRDERING per doktrinen (change · prediction · observed) — bot-rundans
huvudnummer ihop med spelturs-rampen. Prediktion att registrera: partial
fills ger weenie-lekar snabbare bord tur 2-3 och mätbart högre
tidiga-bleed-tempo i batch-reviews.

## [ÖPPEN DESIGNTRÅD — CHATT-TAXONOMIN + TTS] — vad är röst, vad är protokoll? (9 augusti 2026, Johans fundering, obeslutad)

Johans tanke efter beat-modellen: alla led i bottens aktivitetskedjor
behöver inte bubblor — bordet SÅG redan Effective Management spelas, så
chatt-ekot är redundant. Och TTS ska kopplas till CHATTEN, vilket gör
systematiken viktig. PRINCIPKANDIDAT (Claudes läsning, Johan avgör):
fx = det ögonen ser · log = det protokollföraren skriver (§12-raderna,
redan maskinläsbara) · chat = det en spelare skulle SÄGA HÖGT — och
skrivs då som TAL, inte loggpost. Bieffekter: varje bubbla kostar ~5 s
pacing ⇒ trimning = snabbare turer gratis, och kvarvarande röst bär
tyngd (TTS-närvaro, inte brus). Ask-ytan (Block?, deklarationer mot
spelare) förblir röst — HB2d:s kontrakt. NÄSTA STEG när Johan funderat
klart: inventeringspasset — varje this.chat(-sajt i boten klassas
RÖST/PROTOKOLL/redan-täckt-av-fx, protokollposterna flyttar till log,
röstraderna skrivs om som tal. Obeslutad tills Johan säger kör.

## [BEAT-MODELLEN DEL 2 — JOHANS TRE LIVE-FYND STÄNGER LOOPEN] — bubbel-avlösning på wire-nivå, chat-hold i _pace, klockan efter deklarationerna; 78d-grinden fångade min nivåmiss FÖRE leverans (9 augusti 2026, bot v0.6.100)

Johans tre fynd (staplade bubblor vid Effective Management, kedjan som
rusar efter Computer Hacking, klockan som inte startar efter handlingen)
implementerades HELT på primitiv/dränage-nivå — noll sajt-retaggar: (1)
BUBBEL-AVLÖSNING: efter en CHAT väntar nästa wire-meddelande hela
chat-beaten (max(200, chatPaceMs||paceMs×1.6)) — och 78d-grinden fångade
att v0.6.100:s första försök la vakten i finally som bara ser KÖAD
backlog: tre separata send() i samma tick dränerade var för sig direkt
(gaps 0/0 — EXAKT Johans stackning, reproducerad i grindform före
leverans). Vakten bor nu i dränagets TOPP (_lastSendAt/_lastSentT håller
sedan förra wire-sändningen oavsett köläge). (2) CHAT-HOLD: _pace väntar
max(steg-debounce, senaste-bubblans-hold) — bottens nästa synliga
handling respekterar deklarationen, 'chat trumfar default' vid
primitiven. (3) KLOCKAN: aktions-fönstrets timer (post-stealth-tystnads-
sajten, rad ~3925) armeras vid askSecs×1000 + _chatSettleMs() (pågående
hold + köade bubblors beats + 200/övrigt) — animation → deklaration →
stoppur, i avlösning. paceMs 0 nollar allt (arenan/sviten opåverkade —
h6-bottarna är paceMs 0, källverifierat). Sviten 750→752/0; 78d
destruktivt 0/0-bevis mot gamla; falsklarm på vägen ärligt bokfört (en
60s-timeout dödade en frisk 210s-svit; föräldralösa arenabarn från
destruktiva körningen städades med pkill). Grindar: bot 752/0 · canary
37/0 · smoke 11/11 · klient 71/0 · check-versions grön. Johan: byt
elysium-bot.js — Effective Managements två bubblor ska nu AVLÖSA
varandra, kedjan andas efter varje deklaration, och klockan väntar in
bubblan.

## [FASKNAPPS-EPILOG — MAP-TEORIN VAR RÄTT; FALSIFIERINGEN VAR FÖRORENAD] — rad 2266: cards: new Map() — destruktiva passet lurades av svit-tillståndsmutation (9 augusti 2026, samma v2.6.70)

Sanningens tredje vändning, allt inom EN runda: (1) Map-hypotesen ställd,
(2) 'falsifierad' av destruktiva körningen, (3) ÅTERUPPRÄTTAD av källan —
state-definitionen rad 2266 är new Map(). Falsifieringen var en
ARTEFAKT: async-regressionstestet kör EFTER 68 sync-tester som muterar
state (någon array-ifierar cards på vägen), så orörda 2.6.69 passerade
på förorenad state — medan Johans riktiga browser bär Map:en och
v2.6.66:s .some() kastade precis som först diagnostiserat. v2.6.70:s
forEach-scan ÄR rotfixen (redan skeppad, strukturagnostisk = immun åt
båda hållen). LÄXA: en destruktiv körning som MOTSÄGER en källäsning
kräver att man läser källan IGEN innan hypotesen begravs — och
async-tester ärver sync-batteriets muterade värld, så deras
förutsättningar måste sättas explicit (regressionsvaktens
state-härdning: nästa pass). Johan: byt klienten till v2.6.70 —
fasknapparna lever igen.

## [FASKNAPPS-JAKTEN — HYPOTES FALSIFIERAD AV EGEN GRIND, ROT ÖPPEN] — gaterna strukturagnostiskt härdade + första fasgrind-testet; Johans F12-konsol avgör (9 augusti 2026, klient v2.6.70)

Johans rapport: bara Unlock klickbar. Hypotes 1 (state.cards är en Map;
v2.6.66-gaternas .some/.filter kastade) var ELEGANT och FEL — den
destruktiva körningen mot orörda 2.6.69 passerade (71/0): phaseLeaveOK(0)
löser rent under harnessen, .some existerar där. Grinden gjorde exakt sitt
jobb: stoppade en falsk berättelse FÖRE leverans. Skeppat ändå, för det
är strikt bättre: båda gaterna omskrivna i strukturagnostisk
forEach-scan (funkar på Array-likes OCH Maps), master-gaten hoppar nu
FAKTISKT på tom hand (inga kort = inga Masters, Johans bokstavliga
önskan) i stället för att fail-öppna, och phaseLeaveOK är exponerad med
svitens FÖRSTA fasgrind-test någonsin (71:a) — ytan är aldrig otestad
igen. ROTEN ÖPPEN: nästa steg är Johans browserkonsol (F12) vid
Master-klicket — felraden namnger den verkliga kastaren. Kandidater
kvar: uiConfirm-interaktion i spelläget, en async-rejection i
activatePhase-kedjan utanför gaten, eller något i 2.6.68-69-deltat som
harnessen inte når. Grindar: klient 71/0 · destruktivt 71/0 (falsifierande
— journalfört som sådant) · B1 byte-identisk · check-versions grön.

## [BEAT-MODELLEN DEL 1 — SKEPPAD SAMMA KVÄLL] — primitiven + intra-stegs-gapet: stackningen dör, sekvensretaggen är del 2 (8 augusti 2026, bot v0.6.99)

Johans "kör på med implementationen också" fick designen ur journalen
och in i koden samma kväll. DEL 1 (skeppad): _pace(kind) gör flata
gaten multidimensionell — inget arg = 'step' (paceMs; alla ~10
legacy-sajter byteorörda), 'chat' = chatPaceMs eller paceMs×1.6, 'fx' =
fxBeatMs eller paceMs×0.4; paceMs 0 nollar VARJE kind så sviten förblir
snabb PER KONSTRUKTION; _beat(kind) är designens vokabulär-alias och
HB2e:s closed-loop-söm. INTRA-STEGS-GAPET: token-bucketens
inter-frame-gap blir 200 ms i pacat läge (30 i arena) — fx+logg+chat
från ETT steg landar aldrig samma frame; stackningen Johan rapporterade
dör HÄR. ÄRLIG SCOPE-GRÄNS: annons-sekvensretaggen (fx-beat →
deklaration → chat-beat → FÖRST DÅ ask-fönstret + klockan) är DEL 2 —
nästa passets första drag med ordentliga läsningar av de 11
_announceTallyA-sajterna (synkron helper, 11 anropare; blind
asyncifiering vägrad). Sektion 78 (3 asserts, ALLA kedjade till
mekanismen — 76-lektionens femte tillämpning); destruktivt 744/6 mot
baslinjen där 78c:s siffror VISAR flata beteendet (fx 101 ≈ chat 100).
Grindar: bot 750/0 · canary 37/0 · HB1-smoke 11/11 · klient 70/0 ·
check-versions grön. Deploy när Johan vill: bot v0.6.99 ersätter 0.6.98
i checklistan.

## [BEAT-MODELLEN — DESIGNBESLUT LÅST] — bottens meddelandeflöde blir multidimensionellt: fx-beat → chat-beat → klocka, i avlösning i stället för stack (8 augusti 2026, beslutat; implementeras som bot v0.6.99 i nästa pass)

Johans UX-observation: bottens meddelanden KROCKAR — paceMs väntar mellan
STEG men ett steg kan spotta fx + logg + chat i samma frame, och askSecs
tickar SAMTIDIGT som animationerna spelar. BESLUTAD DESIGN (Johans
multidimensionella idé): (1) platta _pace() ersätts med _beat(kind) —
'step' = paceMs 3100 (default), 'chat' = chatPaceMs ~5000 (bubblan
spelar klart innan nästa deklaration; chat TRUMFAR default), 'fx' =
fxBeatMs ~1200 (händelseanimationens stund); beaten avgörs av vad steget
just emitterade. Bot-side ⇒ SYMMETRISKT: online-bord får samma kadens
gratis, noll klient/serverändring. Öppen loop (boten gissar
animationslängd) — closed-loop-kvitto via bryggan är HB2e-idé, overkill
nu. (2) ASK-SEKVENSEN i exakt avlösning: aktion → fx → fx-beat →
deklarationschat ("I bleed you for 2") → chat-beat → FÖRST DÅ öppnas
reaktionsfönstret och klockan startar (nedräkningsraden efter beaten,
krockar aldrig med deklarationen). (3) Småsaker på köpet: ~200 ms
mini-gap i token-bucketen mellan meddelanden INOM samma steg; alla
beats SKALAR från paceMs (paceMs 0 ⇒ allt 0 — 747-sviten förblir
blixtsnabb, suite-säkrad). (4) askSecs omkalibreras troligen 2→4-5 när
klockan börjar EFTER beatsen (Johans kalibrering live). NÄSTA PASS
EXEKVERAR: beat-modellen (v0.6.99, sektion 78) + HB2d ask-relayn
(chat-relay + block-svar — say-relayn är redan live) + botens
transfer-ramp (filad) + ▶-beslutet (fotgun: göm eller recovery) +
svep-abort i hotBotsTeardown. Sessionritualen bootstrappar allt.

## [CLASSIC-ÖPPNINGEN — JOHANS FRÅGA AVSLÖJADE EKONOMIBUGGEN] — boten betalade för sina fyra setup-vampyrer; nu gratis som människans (8 augusti 2026, bot v0.6.98)

"Så botten drar 4 cryptkort i classic nu?" — ärliga svaret var NEJ, och
det VAR buggen: caps.classic gatade bara pub-tokens, en artighets-chat
och slot-geometri; ingen gratis öppning fanns, så classic-botens enda
vampyrväg var influence-fetchen à 4 transfers + 1 pool — medan människan
placerar sina 4 setup-unc GRATIS. Förexisterande ONLINE också (servern
delar 0 i classic; bryggan speglade troget quirken). Fixen vid dealt-
handlern: classic + tom unc + crypt tillgänglig => min(4, cryptN)
KOSTNADSFRIA drawCrypt-verb (priset tillhör fetchens bokföring, aldrig
wire-verbet) + ärlig loggrad. Sektion 77 (3 asserts) med 76-lektionens
FJÄRDE tillämpning: negativen (structured skickar 0) KEDJAS till
mekanismbeviset (77a===4) så orörd kod aldrig kan gröna den — destruktivt
744/3 exakt. Grindar: bot 747/0 · canary 37/0 · HB1-smoke 11/11 mot
v0.6.98 · klient 70/0 · check-versions grön. Deploy-notis: fixen når
online-classic först med bot-uppladdning + purge (checklistan).

## [SYSKONSVEPET — HELA BUGKLASSEN JAGAD] — fullt fältaudit brygga↔bot↔server; EN syskon dömd: joined.boardMode + classic-given (8 augusti 2026, klient v2.6.69)

Johans fråga gjorde unc/uncontrolled-buggen till en KLASSINSTRUKTION:
varje brygg-syntetiserat meddelandes fält auditerades mot bottens
handler-läsningar (regex per handler-kropp) OCH serverns faktiska
emissionssajter. FRIKÄNDA: drew ('uncontrolled' är server-exakt —
sendDrew(p,'uncontrolled','crypt',...) läst ordagrant), dealt/lobby/
turn/deckok, och startPool (ingen hotseat-pool-option finns; båda sidor
default 30). DÖMD, exakt en syskon: joined.boardMode — boten LÄSER den
(classic flippar caps.classic: ingen öppnings-unc, drawCrypt vid behov)
men bryggan skickade den aldrig OCH startFor delade alltid 4 — ett
Classic-hotseatbord gav sina bottar en Structured-giv. Fixat:
boardMode flödar startOfflineFromCfg→hotSpawnBots→bryggan→joined, och
startFor delar uncN = classic ? 0 : 4 (serverns dealNow-gren speglad).
Droppade verb (tally/forceSetPool/bounty/…) förblir dokumenterade
HB2d-ytan — annan klass. Lärdom i learnings: en brygga som spelar
serverroll FÖRTJÄNAR varje shape genom att LÄSA serverns send-sajt, och
en funnen fältbugg är en klassinstruktion, inte en incident. Grindar:
klient 70/0 · B1 byte-identisk · check-versions grön.

## [TEARDOWNEN — ROND-3-FÅNGSTEN ÄNTLIGEN HEDRAD] — leave seat dödar bottarna: instanser, timers, brygga och ▶-knapp (8 augusti 2026, klient v2.6.68)

Johan frågade rakt: hade jag fixat att robotknappen försvinner vid leave
seat? Ärliga svaret var NEJ — hans rond-3-observation triagerades bort
bakom Pass-haveriet och glömdes. Och det var värre än kosmetik:
Bot-INSTANSERNA levde kvar efter leave (pace-timers, hold-reminders,
tillstånd) — riktigt läckage. hotBotsTeardown() stänger varje bot,
nollställer bryggan och gömmer ▶-knappen; anropas från leaveHotseat OCH
i toppen av varje hotSpawnBots så varken lämning eller nystart ärver
gamla bottar. Grindar: klient 70/0 · B1 byte-identisk · check-versions
grön. Processläxa: en användarrapport med FLERA fynd behöver en
uttrycklig triagelista i journalposten — det bortprioriterade fyndet
ska stå som ÖPPET, inte försvinna.

## [RAMPEN — JOHANS REGELKORRIGERING STÅR] — transfers räknar SPELETS turer, inte säten; svepet gör turräknaren bot-ärlig (8 augusti 2026, klient v2.6.67)

Johan stod på sig och hade rätt: rampen är min(4, spelets tur) — 1/2/3
på spelets tre första turer, 4 därefter, oavsett säten. Den säteskodade
v2.5.56-formen sammanfaller BARA vid 4+ spelare; vid 2-3 divergerar den
exakt som hans bord visade (hans tur 2 = spelets tredje tur = 3
transfers). openingXfMalus omskriven till spelturformeln (net.turnNo i
flersätesbord — tickad av pass() i hotseat och online-turhandlern ~8238
— solo faller till state.turn: en goldfish's egna turer ÄR spelets), och
svepet anropar nu advanceTurnCounter per bot-tur så räknaren blir
BOT-ÄRLIG (samma fix löser den kända Round/Turn-label-kosmetiken).
VEKN-verifiering vid tillfälle (nätet av här) — men mekaniken Johan
beskrev är entydig och formeln subsumerar den gamla vid fulla bord.
BOTUPPFÖLJNING FILAD: boten själv saknar öppningsramp helt (flat
transfers) — arena-symmetriskt ofarligt, liten botfördel tur 1-2 mot
människor; kreditsajten verifieras och rampas nästa pass (bot-svit
krävs). Grindar: klient 70/0 · B1 byte-identisk · check-versions grön.

## [RUNDA 4 — FYRA UR JOHANS SVEP] — hemresan på riktigt, EM löst med ETT ord, regeldomen om transfers, promptlugn (8 augusti 2026, klient v2.6.66)

(1) HEMRESAN: switchView(mySeat()) självkonverterar till baseView (rad
~8789) — det VAR hemvägen hela tiden; min fallback uppdaterade bara
stats och lämnade kameran parkerad hos botten. Nu återvänder svepet på
riktigt. (2) EFFECTIVE MANAGEMENT LÖST: bryggan skickade drew-zonen
'unc' — DEALT-FÄLTNAMNET — men bottens handler matchar zonVÄRDET
'uncontrolled' (rad ~782). Ett ord, en tyst no-op; crypt=12 så guarden
var aldrig problemet, och fixen bor i bryggan (ingen botändring, ingen
botsvit). Läxa: spegla ALDRIG halva ett kontrakt — dealt-fält och
drew-zoner är olika vokabulär hos servern. (3) TRANSFERS — REGELDOMEN:
hjälparen implementerar OFFICIELLA regeln (rad 2969, v2.5.56: bara de
tre första spelarnas FÖRSTA tur reduceras 1/2/3, därefter 4 för alla) —
Johans 1,2,3,4-över-globala-turer är den vanliga variantminnesbilden.
Ingen kodändring; regelboksreferens given och Johan verifierar gärna
mot VEKN. (4) PROMPTLUGN: unlock-triggered-bekräftelsen hoppar när
brädet är tomt (inga kort utanför handen), och master-fas-lämna-
bekräftelsen hoppar när handen BEVISLIGEN saknar Masters
(isMasterPlay över handen; DB av eller okänt = fail-open, prompten
visas). Grindar: klient 70/0 · B1 byte-identisk · check-versions grön.

## [ÖVERLÄMNINGEN — BUGGEN ETT LAGER DJUPARE] — Pass var hotseatens riktiga turväxling: rotationen hoppar nu bot-säten, svepet kör där, och say-relayn ger Hold on liv (8 augusti 2026, klient v2.6.65)

Johan hade rätt i att buggen satt djupare: hotseatens RIKTIGA turväxling
är PASS-KNAPPEN, vars överlämning (setActivePlayer) swappade människan IN
i bottens säte och ur sessionen — tomt-bord-välkomsten ("The table is
set") var symptomet, inte orsaken. pass():s hotseat-gren är nu
bot-medveten: rotationen HOPPAR bot-säten (kontrollen når aldrig ett),
svepet kör bottarnas turer på plats (kameran inkluderad), och
setActivePlayer fyrar bara människa→människa — med en människa lämnar
enheten aldrig hennes händer. Discard-wrap-hooken BORTTAGEN (Pass är
kanoniska triggern; ▶ kvarstår som manuell fallback). Dessutom HB2d
SKIVA 1 — SAY-RELAYN: hotseat-snabbfraser forwardas nu {t:'say', who,
seat, i} till varje bryggsäte, så Hold on… pausar bottarna (bottens
människo-filter via rostret gör resten — who=net.you som spårar aktiva
hotseat-spelaren, fail-safe för okända namn) och framtida ask-fönster
kan höra riktiga svar. KÄND KOSMETIK namngiven: net.turnNo räknar
överlämningar, inte bot-turer — Round-räknaren förblir ärlig. Grindar:
klient 70/0 · B1 byte-identisk · check-versions grön. Johans omtest:
Pass ska nu ge svep-med-kamera och HEM igen; Hold on mitt i ett
botsteg ska frysa (släpp med It resolves/Carry on); och Effective
Management-kvittot är unc-räknaren.

## [KAMERAN — BOTTEN LEVER PÅ JOHANS BORD] — "inget händer på brädet" var en VY-lucka, inte en tillståndslucka: svepet auto-besöker agerande boten och lämnar tillbaka kameran; paceMs 3100 (8 augusti 2026, klient v2.6.64)

BOTTEN SPELAR hos Johan (weenie bleed, shark, Structured+Helpers) — och
hans tre observationer gav rundans skörd. (1) VY-LUCKAN: pushar landade
bevisligen i net.boards[2], men board-handlern målar BARA när net.view
matchar (seat/'ov'/'l4'/'l2') och hotseatens default egen-board-vy
matchar ingenting — logg + fx-animationer målade oavsett, exakt det han
såg; ▶ kontra Unlock var aldrig skillnaden. FIXEN: hotRunBotTurns
AUTO-BESÖKER agerande boten (switchView(seat) — tableView() grindar
VIEW/NAV på inRoom()||localTable, så besök är hotseat-legalt per
design), toastar vem som spelar, håller 900 ms på slutbrädet och
ÅTERSTÄLLER föregående vy i finally (nummer→switchView, annars
fallback). Hans "aktiva kontrollen skiftar till säte 2" blir därmed den
AVSEDDA kamerarörelsen med automatisk hemresa. (2) TAKTEN: paceMs
1100→3100 — hans live-kalibrering (+2 s mellan synliga botsteg så en
människa hinner parsa och reagera). (3) EFFECTIVE MANAGEMENT frikänd av
källan: databasposten bär handler 'effective-management' vars
CARD_HANDLERS-implementation skickar EXAKT det drawCrypt-verb bryggan
servar (guard cryptN>0) — observationen gjordes genom den trasiga vyn;
omtest begärt, och unc-RÄKNAREN på bottens matta är kvittot (unc är
face-down, kortet självt ska inte synas). NAMNGIVEN SÖM till omtestet:
kamerans HEMRESA när föregående vy var basvyn (icke-nummer) går via
fallback (net.view-återställning + renderStats) — kan behöva ett klick
på egna boarden om den inte målar rent; enda sömmen som inte kunde
verifieras headless. Grindar: klient 70/0 · B1 byte-identisk ·
check-versions grön.

## [LEXIKALT PANSAR — KOLLISIONEN] — Johans egen fil obducerad (byte-identisk!), rökande pistolen: klientens `const net` möter bottens — hela boten bor nu i en IIFE (8 augusti 2026, bot v0.6.97; klienten orörd v2.6.63)

Andra spawn-failen kom MED hans faktiska mappfil bifogad — cmp visade
BYTE-IDENTISK med dagens leverans, och stale-fil-hypotesen dog i ett
kommando. Den verkliga klassen: klassiska scripts på samma sida DELAR
globalt lexikalt scope, och bottens toppnivå `const net` kolliderade med
klientens eget `const net` (rad 2151; `SAY` kolliderar också) —
SyntaxError FÖRE rad ett, onload fyrar ändå (load = hämtad), och file://
mutar felet ("Script error.", inget filnamn) förbi v2.6.63:s
filnamnsfiltrerade fångst. INGEN grind delade en sida: diag-sidan ren,
vm-sandlådan karg, sviten require:ar boten i modulscope — klassen var
strukturellt osynlig tills den riktiga sidan körde. FIXEN är
strukturell: HELA boten bor nu i en IIFE (två insatta rader, kroppen
byteorörd — canaryns grammatik-grepp opåverkade), enda namnet som lämnar
scriptet är globalThis.ElysiumBot; under Node når module/require genom
CJS-wrapperns closure oförändrat. 75d får KOLLISIONS-ASSERTEN (sandlåda
som fördeklarerar net/SAY/sleep) som destruktivt reproducerar Johans
exakta fel mot HANS EGEN fil (743/1: "Identifier 'net' has already been
declared" — obduktionsbeviset i grindform). PROCESSNOT: docs-heredocen
föll först på ett oescapat citattecken (parse-död = rent tillstånd,
write-after-loop höll) — omkörd. Grindar: bot 744/0 · canary 37/0 ·
HB1-smoke 11/11 · klient 70/0 (asynktesterna kör nya boten) · arena
require OK · destruktivt 743/1 mot Johans fil. Läxa i learnings: filer
som ska rida script-taggar in på delade sidor pansras i IIFE från
början, regressionsvakten måste ÅTERSKAPA kollisionen, och när
användarens fel trotsar primhypotesen — be om DERAS fil. Johan: byt BARA
elysium-bot.js mot v0.6.97 och kör igen.

## [LOADER-FORENSIK — JOHANS SPAWN-FAIL] — dialogen gjorde sitt jobb, roten jagad: exportvakt på IS_NODE + loader som verifierar och namnger kraschen (8 augusti 2026, klient v2.6.63, bot v0.6.96)

Johans live-runda gav "ElysiumBot is not defined" — observabilitets-
dialogen fungerade exakt som avsett. Hypotes 1 (klientsidan bär en
module-global som kapar UMD-vakten) FALSIFIERAD via grep (noll träffar);
prima kvarvarande misstänkt: en GAMMAL för-HB0-bot bredvid hans klient —
den parsar, kraschar vid require('net'), och script-elementets load
fyrar ändå (load = hämtad, inte felfri) så loadern löste sig glatt över
ett lik. TRIPPELFIX oavsett rot: (1) botens exportvakt diskriminerar nu
på IS_NODE i stället för module-existens (v0.6.96) — immun mot shim-
sidor; (2) 75d får module-shim-sandlåde-asserten (context MED
module:{exports:{}} men UTAN process måste exportera till globalThis och
lämna module.exports orört — destruktivt 742/1 mot v0.6.95); (3)
klientloadern VERIFIERAR exporten efter inject och fångar fönster-nivåns
exekverings-fel under laddningen — nästa fail-dialog namnger kraschen
ordagrant ("require is not defined" = gammal fil) och lär ut fixen
(v0.6.94+ krävs). Grindar: bot 743/0 · destruktivt 742/1 · klient 70/0 ·
B1 byte-identisk · HB1-smoke 11/11 · check-versions grön. Johan: byt ut
elysium-bot.js mot dagens leverans och kör igen — om dialogen ändå
kommer berättar den nu VAD som kraschade.

## [HB2c.1 — JOHANS FÖRSTA LIVE-RUNDA] — buggen rotorsaksfixad (auto-svep på fas-wrappen + spawn-observabilitet) och tre önskemål skeppade (8 augusti 2026, klient v2.6.62)

Johans rapport "passade min tur, ingenting hände" hade TVÅ möjliga rötter
och båda är stängda: (1) ▶-knappen var enda triggern — nu är Discard→
Unlock-wrappen (state.phase 4→0 i activatePhase) tursluts-signalen som
auto-kör hotRunBotTurns FÖRE människans nya tur, ▶ kvarstår som manuell
fallback; (2) hotSpawnBots kunde dö tyst (grindarna körde aldrig
spawnvägen — browser-only, exakt alpha-luckan) — hela spawnen är nu
try/caught in i en synlig "Bot spawn failed"-dialog, och den aldrig
verifierade loadDecks/parseDeck-vägen är HELT borttagen (bot-säten väljer
nu enbart ur registret, per Johans önskemål — vilket också råkade
eliminera den mest misstänkta tysta dödsorsaken: .t-fältet som inte
finns). TRE ÖNSKEMÅL: 🤖-togglen CYKLAR off→novice(grön)→grinder(gul)→
shark(röd)→off (cfg.botP skickas som o.persona — boten mappar strängen
via PERSONAS själv, verifierat rad 475); bot-sätets dropdown byter till
HOT_BOT_DECKS — Weenie Bleed + Inside Dirt löses ur den LADDADE botens
egna DEFAULT_DECK/SEWER_DECK (namnverifierade: "Leveraging my Hacking
Skills" resp. "Nosferatu Weenie Stealth (Johan)"), de tre V5-starterna
(Tremere/Nosferatu/Malkavian) inbäddade ordagrant från arenans
deck-*.json (samma objekt coverage-dokumenten mätte). cfg-nycklar: botP
(null=människa), botDeckIdx. Grindar: klient 70/0 · B1 byte-identisk ·
check-versions grön. Johan omtestar live-rundan — auto-svepet efter hans
Discard är det nya beteendet att verifiera.

## [HB2c-FILE — DUBBELKLICKSBOTTAR] — file://-vägran borta: fyra filer i en mapp = fulla hotseat-bottar, noll server (8 augusti 2026, klient v2.6.61, cardfx-compile v1.6.13)

Johans fråga träffade en onödig vägran: klassiska script-taggar är CORS-
undantagna på file:// (HB1-bevisat) — bara fetch() blockeras. Lösningen:
kompilatorn emitterar nu ETT .js-syskon (elysium-cardfx.js,
globalThis.ELYSIUM_CARDFX) ur SAMMA serialize som json:en — lockstep per
konstruktion, en write till (v1.6.13). hotLoadBotRes förgrenar: file://
script-injicerar syskonet, http fetchar json:en exakt som förr; saknad
databas förblir icke-fatal och saknad-bot-dialogen lär ut rätt filnamn
per protokoll. Artefakten genererad ur befintlig json + vm-verifierad
(fxv 1, 2365 lib i lockstep). START-HERE-BOTS uppdaterad (fyra filer
tillsammans); runbooken förtydligar att .js-syskonet hör till
NEDLADDNINGS-bundeln, inte hostade routen (servern orörd på srv-2.6.28).
Viktig modellrätning i svaret till Johan: hotseat-bottar krävde ALDRIG
serverprocess eller manuell population — CLI-helpern är online-flödet;
enda kravet var http-servering, och det kravet är nu borta för file://.
Grindar: syntax ×2 · klient 70/0 · B1 byte-identisk · vm-lockstep ·
check-versions grön. JOHANS FIL://-HALVA: dubbelklicka klienten med de
fyra filerna i mappen, toggla 🤖, starta.

## [HB2c-PAKETERING — SERVERROUTEN] — hostade miljön kan nu serva bottarna: srv-2.6.28, exakt-match-route + deploy-ritual (8 augusti 2026; omstart krävs)

Johans misstanke stämde och var värre än filer: servern servade BARA /,
vtes.json och bilder (HB1-fyndet) — uppladdning utan route = 404. srv-
2.6.28: GET /elysium-bot.js + /elysium-cardfx.json med EXAKT req.url-match
(ingen decode — traversal strukturellt omöjlig, vtes-whitelistens hårdare-
än-regex-garanti), servade från __dirname (deploy-artefakter; read-only är
fint under härdade uniten — srv-2.6.20-klassen var SKRIV-EACCES), js|json
+ nosniff, 300 s cache (boten itererar snabbt) med edge-purge i deploy-
ritualen (runbook-sektion tillagd). Endpoint 15→19/0; destruktivt 17/2 mot
srv-2.6.27 (exakt 200-testerna; 404-testerna delas korrekt av båda). Wire
orört. PROCESSLÄXA: docs-skriptet skrev sektionsvis i stället för
write-after-loop — ett assert-fall lämnade mixat tillstånd i två varv
innan idempotenta guards reparerade; regeln gäller ÄVEN dokumentpatchar.
DEPLOY-CHECKLISTA: ladda upp elysium-bot.js + elysium-cardfx.json bredvid
elysium-server.js, ladda upp v2.6.60-klienten, starta om, purga båda
URL:erna. Grindar: endpoint 19/0 · destruktivt 17/2 · dispatch 39/0 ·
protokoll 6/0 · check-versions grön.

## [HB2c — 🤖-TOGGLEN + RUNTIME-LADDNING + ▶-SVEPET] — hotseat-bottar når UI:t; alpha-luckorna namngivna för HB2d (8 augusti 2026, klient v2.6.60)

renderOfflineSeats får bot-togglen på säte 2+ (säte 1 förblir människan —
hotseat-värden); startOfflineFromCfg-preflighten vägrar ÄRLIGT på file://
(bottar laddas från servande hosten — aldrig buntade) och lär ut fixen när
filerna saknas; hotLoadBotRes cachar script-inject + cardfx-fetch (saknad
databas = icke-fatal, botens egen varning täcker); hotSpawnBots plumbar
sätets valda lek genom parseDeck (crypt/library är REDAN bottens
o.deck-shape — noll konvertering), kopplar (paceMs 1100/askSecs 6), väntar
in token-bucket-uppladdningen, ger via startFor och visar flytande 🤖 ▶;
hotRunBotTurns sveper varje bot-sätes tur en gång i sätesordning
(onPass-spara/återställ, resolvar med ordningen — svitens assert-yta).
Sviten 69→70/0 med TVÅ riktiga bottar sekvenserade [2,3] + återställd
onPass; destruktivt 69/1; B1 byte-identisk 1 155 366 efter
fragmentsvans-läxan från HB2b (bryggan+HB2c ligger FÖRE svansen nu). V1-
BESLUT namngivet: startHotseat-kirurgi undveks — bot-sätet får sin
placeholder-blob som vanligt och botens FÖRSTA pub-push skriver över
mattan till dess sanning (kort blink, alpha-ärligt); swap-in-i-bot-säte,
mutator-routning (pool/edge/oust petar fortfarande blobbar) och
ask-relayn (botens frågor timar ut på askSecs) är HB2d:s dokumenterade
jobb. START-HERE-BOTS fick Hold on- + hotseat-noten (två pass försenad,
nu levererad). Grindar: destruktivt 69/1 · klient 70/0 · B1 byte-identisk
· dispatch 39/0 · protokoll 6/0 · canary 37/0 · HB1-smoke 11/11 ·
check-versions grön (fyra headers + CLAUDE-block → 2.6.60). JOHANS HALVA:
servera mappen, toggla 🤖 på ett säte, starta — rapportera laddningen,
mattans blink→sanning, ▶-svepet och Hold on mot en spelande bot.

## [HB2b-AMEND — STÅENDE FRÅGAN FÅNGAR TVÅ] — caps-lögnen (500/60 → serverns lästa 250/64) + routing-bevisluckan stängd (8 augusti 2026, samma version v2.6.59)

Johans stående fråga bet igen, två gånger: (1) _expands "lockstep"-kommentar
LJÖG — servern har MAX_PILE=250/MAX_NAME=64 (lästa, inte gissade), bryggan
hade 500/60, så en 90×12-memelek trunkerades OLIKA i hotseat och online;
rättat till identisk trunkering. (2) HB2b-testet bevisade aldrig
log/say/chat/fx-routningen (try/catch kan falla tyst) — sonden visade att
handler-vägen KÖRS (errRing får who-attribuerade rader; net.boards[2].ts
finns, vilket bara MP_HANDLERS.board stämplar, aldrig fallbacken), och två
nya svit-asserts gör beviset permanent. say/chat/fx förblir shape-
verifierade men assert-lösa tills HB2d:s ask-relay ger naturliga punkter.
Grindar: klient 69/0 · B1 byte-identisk · check-versions grön. Amendet bor
även i versionsnoten (v2.6.55-mönstret).

## [HB2b — BRYGGKÄRNAN] — en RIKTIG bot korsar bryggan: join→deck→dealt(7/4)→tur-1→pass, pubben landar via remote-player-vägen (8 augusti 2026, klient v2.6.59; bot byteorörd v0.6.95)

hotBridge bor i hotseat-blocket (splittar till hotseat.js) och spelar
serverrollen för bot-säten exakt enligt planen: join/create→joined(lobby)+
roster med bot-flaggor, deck→expandDeck-speglad lagring+deckok, startFor→
dealNow-speglad giv (7 hand/4 unc, lib/crypt-räknare i lockstep med
serverns EXAKTA shapes — lästa, inte gissade), draw/drawCrypt→drew{zone,
kind,name,counts}, pass→onPass-hook (HB2c/d kopplar riktiga turväxlingen),
och REMOTE-PLAYER-ROUTNINGEN: botens board/log/say/chat/fx rider
MP_HANDLERS med vaktade fallbacks — en bots matta renderas exakt som en
online-spelares, ingen blob existerar någonsin för ett bot-säte. seat-
verbet är no-op-säkerhet (hotseat förtilldelar; lobby-pushen visar boten
redan sittande, så dess lobby-handler väljer aldrig). Klientsviten fick en
ADDITIV async-runner (testA-kö körs EFTER sync-batteriet, som är
beteende-orört) och HB2b-testet är slutet-till-slut på riktigt: en
require'ad Bot v0.6.95 med transport-injektion korsar bryggan hela vägen —
deck-uppladdningen dränerar genom token-bucketen, given ger 7/4, boten
SPELAR tur 1 (askSecs:1-tystnad → timeout-resolutioner, ärligt v1-läge
tills HB2d:s ask-relay) och passar, pubben landar i net.boards[2], och
serializeGame kör rent med bot-sätet närvarande (auditen; returnerar
STRÄNG — assertens första shape-antagande fixat). TVÅ GRINDFÅNGSTER på
vägen, båda B1:s förtjänst: fragmentsvans-fingeravtrycket (hotseat.js
MÅSTE sluta ");" — löst med ärlig load-time-init hotBridge.reset([]), inte
dekoration) och sub-läxan att en kommentar EFTER ");" blir svansens
faktiska slut (rstrip tar whitespace, inte kommentarer) — plus att en
misslyckad split redan tömt fragmentkatalogen så byte-diffen pekade FEL
(mot VERSION-raden). Grindar: syntax ×2 · destruktivt 68/1 (exakt HB2b-
testet mot orörd 2.6.58) · klient 69/0 · B1 byte-identisk 1 147 472 ·
dispatch 39/0 · protokoll 6/0 · canary 37/0 · HB1-smoke 11/11 ·
check-versions grön efter headerbumpar (context/learnings/SKILLS/PROTOKOLL
→ 2.6.59). Botsviten EJ omkörd detta pass — bot/test-bot-logic/server
byteorörda sedan HOLD-passets 742/0 ×2 samma dag, deterministiska
indata; namngivet i stället för tyst antaget. Nästa: HB2c — 🤖-toggle i
offline-modalen (alpha), runtime-laddning av bot+cardfx, ärlig
file://-vägran, deckIdx→o.deck-plumbing, START-HERE-BOTS-noten.

## [HOLD — "HOLD ON…" PAUSAR BOTTARNA] — Johans snabbfras-önskemål landar som den generella bordshållningen; människo-exklusiv, gaten i _pace (8 augusti 2026, bot v0.6.95)

Johans minnesbild verifierad mot källan innan något byggdes, och den var
HALVT rätt på ett upplysande sätt: frasen finns sedan länge (SAY[0] i både
klient och bot, egen ❗-knapp med SFX-klocka, knapptiteln lovar rentav "more
reaction tools will live here") OCH ask-fönster-halvan EXISTERAR — under
botens eget Block?-fönster fryser en Hold on… ask-timern via pausedBy tills
sägarens nästa beslutsfras släpper (självsläppande, därför deadlockar
bot-tänk-announces aldrig arenor). Det som saknades var den GENERELLA
halvan: Hold on… medan boten spelar sin tur. Designen speglar det
befintliga protokollet i stället för att uppfinna ett nytt: en MÄNNISKAS
Hold on… (say i=0, eller förankrad chat 'hold on') pausar botens synliga
spel vid _pace-gaten — placerad FÖRE paceMs-snabbfilen så paceMs:0-bottar
lyder — tills sägarens nästa flödesfras (No block/Block!/No reaction/It
resolves/Pass, index 1/2/3/4/7) eller chat 'carry on'/'resume'/'it
resolves'. MÄNNISKO-EXKLUSIVT via rostrets bot-flagga (kritiska insikten:
boten SÄGER själv Hold on… som tänker-announce — utan filtret pausar
arenabottar varandra i evighet; okänd avsändare räknas som människa,
fail-safe). Ack som chatrader (⏸ Holding/▶ Resuming — HB2-badgen ersätter
dem visuellt senare), 90 s-påminnelse endast på egen tur, lazy-init av
_holdBy (ingen konstruktor-jakt), reset vid started, close rensar timern.
Dokumenterade asymmetrier: chat-vägen fryser inte ask-timern (SAY-knappen
är stödda vägen där) och 'It resolves' släpper generella hållningen men
inte ask-pausedBy (fail-safe-riktning — mer tålamod, aldrig mindre).
DESTRUKTIVA ITERATIONEN ärligt: första körningen gav 733/4 med ABORT
(.size på undefined) och en trivialt grön negation — sektionen
defensiv-härdades i två varv (mekanismberoende via typeof _holdHook på
ALLA negationer, guardade .size-läsningar) till ren 732/10. TIMING: tagen
FÖRE HB2b med flit — bot-only (noll bryggkonflikt), onlinevärde direkt
(Trainbot lyder ikväll), och primitiven som HB2:s badge/visibility/toggle
konsumerar; offline rider gratis via bryggans say-relay (plan §2).
Uppföljning noterad: START-HERE-BOTS.html får en Hold on-rad i HB2c-passet.
Grindar: syntax ×2 · destruktivt 732/10 (exakt 76x, inga aborter) · bot
742/0 · klient 68/0 · dispatch 39/0 · protokoll 6/0 · canary 37/0 ·
HB1-smoke 11/11 mot v0.6.95 · B1 byte-identisk · check-versions grön ·
arena require OK. Ren bot — ingen wire-ändring, klient/server orörda.

## [HB2a — KONTRAKTET + ARKITEKTUREN] — Johans browser grön; analysrundan hittar __board-sentinelen och KORRIGERAR min egen enumeration: 19 ut / 24 in; planen skriven (8 augusti 2026; ren analys, ingen kod ändrad)

Johans riktiga browser gav grönt i båda serveringslägena — HB1 stängd. HB2a
= analys före kod, och den stående frågans disciplin bet MIG denna gång:
gårdagens "18 verb" var FEL. `_drain` (rad ~569) transformerar en köad
sentinel `{__board:true}` till `{t:'board', pub: buildPub()}` vid flush —
`push()` (rad ~632) är enqueue-hjälpen, `_pushQ` dedupar — så board-verbet
finns ALDRIG som literal vid någon anropssajt och båda mina grepp missade
det. Konsekvensen är arkitektoniskt avgörande: boten ÄR board-synlig (har
eget buildPub), så hotseat-bryggan behöver INTE spegla bot-tillstånd —
pubben kommer till klienten precis som från en online-spelare. DEFINITIVA
KONTRAKTET, enumererat vid stryppunkterna (den enda ws.send i _drain +
connects råsend) och runtime-verifierat: BOT→BRYGGA 19 verb (join create
board bounty chat decide deck draw drawCrypt fx log logTo openHand pass
pileBulk revealHand say seat tally); BRYGGA→BOT 24 typer via
Object.keys(b._handlers) (board bounty chat ctrl dealt deckok drew err
forceOust forceSetPool fx joined lobby log logTo openHandGrant
openHandRevoke revealHand roster say started sys tally turn — regexvägen
gav både falska positiver (library/crypt var fältnamn i deck-uploaden) och
missar (fx, forceOust)). SERVERFAKTA som formar bryggan: fx-handlern är ren
saniterande broadcast-relay (ingen board-mutation); board-handlern lagrar
p.pub, relayar och matar RESURSLEDGERN (ledgerDiff/ledgerLive) — framtida
ledger-paritet hookar samma punkt. KLIENTENS HOTSEAT läst: aktivt säte =
live state, icke-aktiva = JSON-blobbar i net.hot.boards (mutatorer petar
via parse→poke→re-stringify: edgeHandoffHotseat ~6756, pool ~6815, oust
~6836), net.boards[seat].pub = renderade mattan. ARKITEKTUREN (planen §2):
bot-sätet är en TREDJE sätessort — en REMOTE PLAYER utan blob; pubben går
befintliga mattvägen, aktionerna som §12-rader i delade loggen, klientens
strukturerade rader routas in i botens chat/log (samma parsers online
litar på), och mutatorerna ROUTAR wire-verb (forceSetPool/tally/forceOust/
bounty) i stället för att peta blob — remote-player-doktrinen konsekvent,
dual-source-driftklassen öppnas aldrig. elysium-hotseat-bots-plan.md v1.0
skriven: kontraktet, arkitekturen, bryggans serverroll-plikter, laddning/
paketering (runtime-fetch; file:// ärligt otillgängligt), skivningen
HB2b–e (bryggkärna harness-testbar → 🤖-UI → fulla loopen → visibility-
polish) och TRE designfrågor till Johan (announce-disciplin v1 = litar på
klientens strukturerade §12-rader; throttling = Page Visibility-paus med
synlig badge; sätesmodell = ingen blob). Kända risker §7 inkl. save/load-
begränsningen (Bot-instans serialiseras inte i v1 — laddad match omsätter
boten färskt, dokumenterad alpha-gräns) och serialize/undo-auditen som
HB2b äger (dual-transport-lärdomens syskon). Grindar: ren analysrunda —
ingen kodfil ändrad, runtime-enumerationen körd mot v0.6.94; sviterna
oförändrat gröna sedan HB1-passet. Leverans: planen + korrigerade docs
(CLAUDE-arena-notens 18-påstående rättat; HB1-journalposten står kvar som
historik, rättelsen bor HÄR).

## [HB1 — BROWSER-SPIKEN] — diag-sidan + smoken: batteriet 11/11 i sandlådan, browserhalvan är Johans (8 augusti 2026; nya filer v0.1.0, boten byteorörd på v0.6.94)

Hypotesen som HELA HB0 vilade på — att sömmarna räcker som de är — höll:
HB1 krävde NOLL ändringar i boten. elysium-bot-diag.html (v0.1.0) är en
fristående zero-dep-sida: ett DOM-fritt batteri om ELVA tester ligger mellan
/*HB1-BATTERY-START/END*/-markörer, DOM-limmet separat under typeof
document-vakt, och sidan fångar script-tag-haverier via window.onerror FÖRE
laddningen (en för-ES2023-browser utan hashbang-stöd får en läsbar rad, inte
blank sida). Batteriet: script-tag-load + BOT_VERSION, exportytan (19 namn
inkl. prepCardfx), prepCardfx-grinden + inline-fixtur, cardfx-anskaffning
(fetch, med filväljar-fallback för file:// där CORS blockerar fetch),
varningsvägen UTAN data (75d:s otestade gren — nu del av batteriet),
konstruktion MED cardfxData (6551 normnycklar, inget filsystem), transport-
handskakningen (join bot:true v:2.6.0 genom stubben), joined→deck-upload
(seat/token landar, DEFAULT_DECK 9 rader UT genom stubben), lobby→sätesval
({t:'seat',seat:1} — en ANDRA dispatchväg live), drain-burst ×12 (alla fram,
ordning bevarad — pacingen mätt live: ~660 ms, dvs _drains takthållning är
SYNLIG data nu) och timer-drift ×10·50 ms (medel +0/värst +1 ms fokuserat;
bakgrundsflikens throttling är HB2:s kända fråga, INTE ett spike-fel).
diag-hb1-smoke.js (v0.1.0) extraherar SAMMA batteri ur html-filen och kör
det i 75d-sandlådan (console + timers, inga Node-globals) med databasen
matad från disk — skips räknas som FEL i smoken eftersom inget ska saknas
där. Sidan levereras alltså förverifierad: en riktig browser kan bara vara
oense om genuint browserspecifika fakta (script-tag, fetch, riktiga
timers) — vilket är exakt vad spiken finns för att mäta. TVÅ ÖPPNA FRÅGOR
STÄNGDA PÅ VÄGEN: (e) bottens sända verbmängd enumererad = 18 verb (join,
create via råhandtaget vid connect + via send(): bounty, chat, decide,
deck, draw, drawCrypt, fx, log, logTo, openHand, pass, pileBulk,
revealHand, say, seat, tally) — detta ÄR HB2-bryggans inkommande kontrakt;
(f) servern servar bara /, vtes.json och bildkatalogen — syskonstatiska
filer (bot + diag-sida via elysium.cards) kräver EN route när paketeringen
kommer, dokumenterat inte byggt. Destruktivt: smoken mot orörd v0.6.93 ger
ärligt SMOKE ABORT ("require is not defined" — för-HB0-blockeraren
ordagrant) med exit 1. JOHANS HALVA: öppna sidan i riktig browser i BÅDA
serveringslägena (python3 -m http.server 8000 → localhost:8000/
elysium-bot-diag.html, respektive dubbelklick file:// + filväljaren för
databasen) och rapportera raderna — särskilt timer-driften och att
file://-vägen fungerar. Grindar: syntax ×3 (smoke + extraherat batteri +
hela inline-scriptet) · smoke 11/11 ×2 · destruktiv smoke-abort mot orörd ·
bot 732/0 (hygien, boten byteorörd) · check-versions grön. Två NYA filer,
noll ändringar i bot/klient/server — ingen wire-ändring, ingen omstart.

## [HB0 — BOTEN BLIR MILJÖAGNOSTISK] — hotseat-bots-spåret öppnar: samma fil laddar nu i webbläsaren, noll beteendeförändring under Node (8 augusti 2026, bot v0.6.94)

Johans idé: häkta på bottarna i KLIENTEN — valbara per säte när man skapar
spel, offline/hotseat först (med alpha-tagg) som konceptbevis innan online.
ANALYSRUNDAN före något löfte gav en gladare bild än filstorleken antydde:
transporten rör Bot-klassen på EXAKT tre punkter (connect→wsConnect,
_drain→ws.send, close), fs på exakt två (loadCardfx + CLI:ns --deck),
Buffer/process utanför transporten ENBART i CLI-main som aldrig körs vid
require — beslutsmotorn är ren JS. Servern bär redan bot-flaggan i rostret
(rad 309) och loadCardfx degraderar ärligt utan databas. EFFEKTINVERTERINGEN
namngiven ärligt åt Johan: online-bottar är tekniskt det MINDRE steget
(servern spawnar in-process över loopback — arenans stridsbeprövade mönster),
webbläsarporten det större; han valde offline-först ändå, med rätt UX-skäl
(snabbt solospel utan server) och öppna ögon. Färdplanen frusen: HB0
(sömmarna, detta pass) → HB1 (spike: fristående diag-sida) → HB2 (hotseat-UI
med 🤖-toggle + bryggan) → online senare. HB0:S FYRA SÖMMAR, kontraktet =
bytelik Node-drift: (1) IS_NODE-grinden — de fyra builtin-requires
(net/http/crypto/fs) vaktas med ternärer så samma fil LADDAR i browser utan
fork (enkälleregeln); (2) loadCardfx delas: prepCardfx(raw) är den
exporterade filfria indexbyggaren, nya o.cardfxData injicerar färdigparsad
JSON (slår sökvägsstegen — browserbryggans datakanal), loggarna oförändrade;
(3) o.transport injicerar uppringningen vid connects ENDA wsConnect-anrop —
exakt wsConnects kontrakt ((url,cb)→{send,close}), frånvarande = trådvägen
byteorörd; (4) typeof-vakter på CLI-main + module.exports, browserexporten
landar på globalThis.ElysiumBot (UMD-lite), Nodes require-yta oförändrad
(+prepCardfx). SEKTION 75 (11 asserts) inkluderar BROWSERGRINDEN: råkällan
körs i en vm-sandlåda UTAN require/module/process/Buffer (bara console +
timers, som en <script>), exporterna landar på globalThis, en Bot
KONSTRUERAR + genomför hela connect-handskakningen + bygger cardfx-indexet
INNE i sandlådan. Destruktivt verifierat: exakt 75x-mängden faller mot orörd
v0.6.93 (721/11), med ärliga fel ("require is not defined" = precis
blockeraren grinden tar bort). SNAPSHOT-DRIFT FÅNGAD PÅ VÄGEN: projektets
elysium-test-harness.js missade v2.6.57-leveransen — klientsvitens EGEN
rad-715-vakt ("harness needs updating") namngav driften på en rad;
deckUnknownNames/deckUnknownText-exponeringarna återställda (två rader,
deckLegalText-mönstret), sviten tillbaka på dokumenterade 68/0. ÖPPNA
DESIGNFRÅGOR deklarerade för HB1/HB2: människosidans announce-disciplin
(bot-bord behöver §12-rader — bleed mot boten utan rad = blind bot),
hotseat-tally↔bot-tally är en omätt yta, browserns timer-throttling i
bakgrundsflikar, human-backup-svaret för bot-säten (swap-in med pausad
bot?). CLAUDE.md/SKILLS.md medvetet orörda (klient/server byteorörda,
arbetsflödet oförändrat); CLAUDE-arena.md får HB-notens bootstrap-rader.
Grindar: syntax ×3 (bot/svit/harness) · klient 68/0 (efter
harness-restaurering) · dispatch 39/0 · protokoll 6/0 · canary 37/0 · bot
721→732/0 ×2 · B1 byte-identisk 1 140 696 · check-versions grön. Ren bot +
harness-restaurering — ingen wire-ändring, ingen omstart, klient/server
orörda.

## [LEGAL-SWITCHARNA] — lekgrindarna lämnar Tournament mode: döpta efter vad de GÖR, migrerade så ingens beteende ändras (7 augusti 2026, klient v2.6.58)

Johans nästa tanke efter spökkortsrundan: döp om till "Legal deck only"
och "Legal cards only" i stället för tournament, så man inte blandar
ihop det med Tournament mode. Kartläggningen gav honom mer rätt än
frågan lät: Settings-hintens HELA självbeskrivning är "Tournament mode
— turn all helpers off" — lekgrindarna som v2.6.55/57 hängde på samma
toggle nämns inte med ett ord. Namnet ljög alltså redan. LÖSNINGEN är
en split, inte ett namnbyte: två nya switchar under en egen "Deck
import"-sektion — Legal deck only (storlek, 12+/60–90) och Legal cards
only (namn databasen känner) — och Tournament mode återgår till att
vara exakt vad dess hint alltid påstått: helpers. Ett turneringsBORD i
hotseat-dropdownen kräver fortsatt bägge BY DEFINITION
(turneringsvillkor inkluderar lagliga lekar), och tournLock online är
orört. MIGRERINGEN är rundans kärna: loadConv sår båda switcharna ur
det sparade tournament-värdet när fälten saknas (samma form som
fx/pcoHome-migreringarna längre upp i samma funktion), så en veteran
med tournament av behåller sina mjuka confirms och en turneringsspelare
sina hårda refuser — INGEN får ändrat beteende vid uppgraderingen;
färska installationer får true/true (= gamla tournament:true-
defaulten). Alla refuseringsdialoger omskrivna att lära ut RÄTT
strömbrytare — den som faktiskt orsakade stoppet, med en rider när ett
turneringsbord grindar på egen hand — och Deck Lab-mätarens
"tournament-legal sizes" blev "legal deck sizes". SVITFYND värt att
spara: den levande harness-conv:en MUTERAS av tidigare tester
(hx-testerna lämnar tournament=false), så defaulttestet läser en FÄRSK
loadClient — aldrig svitens slutstate. KODGRANSKNINGEN Johan bad om
samtidigt gav tre ärliga fynd: (1) deckLabels ⚠ i dropdownsen är
enbart storleksbaserad — en felstavad SPARAD lek visar sig ren tills
den laddas (billig kandidat: vika in deckUnknownNames i _bad,
parsningen görs redan; parkerad i väntan på kör); (2) migreringsraderna
går inte att svittesta — loadConv är inline modulladdningskod, inte en
exponerad funktion — verifierade genom läsning + husprecedensen,
ärligt flaggat; (3) online-rum med tournament-POLICY har aldrig
enforcerat lekgrindar (impOk läste alltid LOKAL conv; bara tournLock
enforcerar server-side, enbart storlek) — föregående semantik,
oförändrad, men nu tydligt namngiven. Grindar: klient 67→68/0 ·
dispatch 39/0 · protokoll 6/0 · canary 37/0 · bot 721/0 (ensam) · B1
byte-identisk 1 140 696 · check-versions grön. Ren klient, ingen
wire-ändring, ingen omstart.

## [SPÖKKORTET INNANFÖR LAGLIGT BAND] — Tims Hecata-fil: räknegrindar mättas av just den korruption de vaktar; två lager stänger klassen (7 augusti 2026, klient v2.6.57)

Johans rapport med Tim Karlssons turneringsexport: beskrivningsraden
"9 times out of 10 you want to pay the upkeep..." blev ett 9x spökkort
med 273 teckens namn. Repro med den RIKTIGA parsern (ordagrant extraherad,
formatbatteri-tekniken): raden ligger FÖRE Crypt-headern → unknown-hinken
→ DB-miss → library-fallback → 12/72 — INNANFÖR lagligt band, så både
sanity-confirmen och turneringsgrinden släppte igenom av just spökets
förtjänst; kvittots "1 unknown name" och Deck Labs ⚠ (vars tooltip
förutsåg exakt denna klass) är enbart informativa. Fixen är TVÅ lager
som täcker varandras blinda fläckar. (1) STRUKTURREGEL i parseDeck:
finns BÅDA sektionshuvudena är qty-rader före första headern
beskrivningsprosa → skipped-rader, synliga i kvittot. Batteriverifierad
mot TWD/VDB/Lackey/headerlös INNAN bygget: dödar Tims spöke (sant 12/63
+ prosaraden listad i skipped) OCH ur-spöket ur B-53-batteriet — "90
cards of pure aggro" parsas nu till SANNA 12/60 i stället för att
refuseras som 12/150 — och eftersom varje konsument omparsar lagrad TEXT
självläker redan sparade lekar vid nästa laddning. Lackey (bara
"Crypt:") och headerlösa listor orörda: deras pre-header-rader ÄR
korten. Ingen namnlängdsheuristik — vtes.json finns inte på disk att
verifiera en mot, och "a protective cap can fight the rules it protects"
har redan bitit en gång (30-qty-locket). (2) DB-GRINDEN, Johans eget
förslag: deckUnknownNames (kvittots egen koll, nu EN källa —
updateImpCount läser samma lista) + deckUnknownText vid impOk OCH
offline-starten. Turnering refuserar hårt med flyktvägen utlärd ("turn
off Tournament rules ... custom or house cards" — exakt den ventil för
egna kort Johan pekade på), casual confirmar, DB frånvarande ⇒ tyst
(wave 3-konventionen, inga falsklarm). Wave 3-matrisen uppgraderad:
felstavningar går från "syns men stoppas inte" till "stoppas i
turneringsläge". EFTERPATCH ur acceptanskörningen mot Tims RIKTIGA
fil (inte fixturen): prosaraden RÄKNADES men begravdes under
kvittolistans 12-radstak av 28 tidigare skips — preamble-rader, de som
SÅG UT som kort, prioriteras nu FÖRST i samplet. Lärdomen i miniatyr:
fixturen bevisar regeln, den riktiga filen bevisar upplevelsen.
NAMNGIVNA KONCESSIONER: servern är nollberoende utan
kortdatabas — tournLock-rum förblir storleks-enforcerade (en modifierad
klient kan smuggla textkort); prosa INNE i en sektion, eller under
ENSAMT huvud med DB:n av, når spel som textkort (kvittot visar den
ändå). Grindar: syntax · klient 61→67/0 (destruktivt verifierat: exakt
de 3 parserregeltesterna faller mot orörd klient, och guard-kastet
bevisar att helpers är genuint nya) · dispatch 39/0 · protokoll 6/0 ·
canary 37/0 · bot 721/0 (ensam) · B1 byte-identisk 1 137 329 ·
check-versions grön. Ren klient, ingen wire-ändring, ingen omstart —
patch-drift enligt lockstep (servern kvar på 2.6.27).

## [KLIBBIG LOBBY + INVITE-KNAPPEN] — råka-klicket utanför onlinelobbyn avväpnat; backdropen får äntligen Escapes stege (7 augusti 2026, klient v2.6.56)

Johans rapport: ett klick utanför lobbyfönstret släckte det, och vägen
tillbaka (Play online → Join) är inte upptäckbar. Grävningen visade en
syskondrift med 13 versioners livslängd: Esc fick sina lobbymedvetna
trappsteg redan i v2.5.73 (duo stänger bara labbet; lobbyfödd import
återvänder hem) men backdrop-klicket — samma semantiska gest — fick ALDRIG
dem: det stängde allt ovillkorligt, inklusive BÅDA fönstren i duo-läget.
Fixen är EN ren beslutsstege, dismissRoute(duoLab, shown, hasReturn,
inLobby) → 'lab'|'lobby'|'stay'|'close', som båda gesterna nu går genom;
nya trappsteget: en LEVANDE onlinelobby (net.lobby + lobbyModal) svarar
'stay' — bara Leave eller värdens Start stänger den; död rumsrest stänger
som förr. Explicita closeOverlay()-anrop (Leave, started(), tutorialens
egna) rundar stegen — det täcker tutorialens demolobby (net.lobby=true
där; dess capture-Esc förträder ändå den globala och fences äter
backdrop-klick). MEDVETET OFÖRÄNDRAD: hotseat-dialogen (offlineModal) —
offlineCfg är modulnivå och överlever stängning, inget går förlorat,
Close-knappen är designen.

Följdfyndet som gjorde knappen obligatorisk: roomBarens 📋 invite ligger
UNDER backdropen (z 20000) — enda vägen till invitelänken medan lobbyn
visades var alltså EXAKT det råka-klick som nu tas bort; en dismiss-säker
lobby utan egen invite hade kapat hela invitationsflödet. Lobbyfoten får
därför 📋 Invite på befintliga copyInvite(); tutDemoLobby neutraliserar
den som syskonen. Stegen exponeras via harnessen och sviten går igenom
hela domtabellen (+3 test, destruktivt verifierade: exakt de tre faller
mot orörd klient). Grindar: syntax ×3 · klient 58→61/0 · dispatch 39/0 ·
protokoll 6/0 · canary 37/0 · bot 721/0 (ensam) · B1 byte-identisk
1 132 607 · check-versions grön. Ren klient, ingen wire-ändring, ingen
omstart — patch-drift enligt lockstep-policyn (servern kvar på 2.6.27).

## [FÖRSTA SKARPA RAPPORTEN] — loopen fångade sin egen bugg; errRecord lär sig läsa ver ur summary (7 augusti 2026, srv-2.6.27)

Johans första riktiga felrapport gick hela varvet (Report a problem → POST
/client-error → JSONL → digest) och digestens versionshistogram svarade
'?' — rapport-payloads bär ver i summaryn, inte på toppnivån, och errRecords
whitelist plockade bara toppnivån. Fixen är srv-2.6.27: en enradsfallback som
speglar ua-hanteringen. Server-only (klienten kvar på v2.6.55, patch-drift
enligt lockstep-policyn), noll wire-ändring. Poängen värd att rista: systemets
första skarpa användning hittade en bugg i systemet självt — exakt vad
telemetrin är till för, och beviset att B-54-loopen är LIVE end to end.

## [B-53 + B-54 + TELEMETRIN] — importvakterna landar, felrapporterna debuterar, servern får underhållsläge (5–7 augusti 2026, klientspåret)

*(Parallellspårets leverans — konsoliderad ordagrant ur `elysium-docpatch-v2_6_55.md` §A, därför på engelska:)*

The session ran in three phases. **Phase 1** closed the B-53 investigation: the server was
acquitted by code-reading plus an empirical five-scenario matrix against a live spawn (lobby
start, leave/recreate, token rejoin, mid-game reimport, SIGTERM restore — all 7/53/8 green), and
the Discord evidence (Stolas) pinned the mechanism as **silent same-name overwrite poisoning**:
`storeDeck` replaces by name, `impOk` auto-saves every import under the name from the text's
`Deck Name:` line (since v2.6.44), and the dropdown fills the textarea including that name line —
so a partial text + OK permanently poisons the saved deck. A format battery (the REAL `parseDeck`
× 7 wild formats × with/without card DB) proved the parser structurally robust and DB-independent;
the only input producing the poison shape (0 crypt / ~7 library, silently accepted) is a literal
short list of valid library cards. Two NEW silent-corruption classes fell out of the battery: a
VDB description line like "90 cards of pure aggro" parses as a 30-copy ghost card (qty cap!), and
TWD single-space crypt columns yield junk names with correct counts. Elysium's only clipboard
write is `copyInvite` — the poison text was born outside the app. The Stolas-vs-Johan same-precon
paradox dissolved: per-machine saved copies, not the same bytes (`labSaveLib` prefills the
precon's name — Enter = overwrite).

**Phase 2** delivered the telemetry design (`elysium-error-telemetry-design.md` v0.1) and the TTS
design/prototype (still awaiting go).

**Phase 3** implemented both feature sets. Johan confirmed the parallel track touches ONLY bots,
freeing client+server, with docs as patch files (this document).

**Client v2.6.55 (22 patches):** `parseDeck` counts skipped lines (`skipped` +
`skippedLines[≤12]`); pure verdict helpers `deckTotals` / `deckSanityText` (<12 crypt or <60
library → confirm text) / `deckOverwriteText` (same-name save shrinking >50% → confirm);
`impOk` fires both confirms BEFORE `buildDeck` and BEFORE the auto-save; live parse receipt
`updateImpCount` under the import textarea ("Reads: X crypt / Y library ⚠ — N lines skipped"
with an expander), re-triggered on input, dropdown select, file load and modal open (programmatic
`.value` never fires `input` — the three explicit call sites matter); `deckLabel` shows
`name · C/L ⚠ · era` in ALL THREE dropdowns (import, lab, offline seats — they share the
function); `loadDecks` backs up a corrupt list to `DECKS_KEY_bak` + one-time toast instead of
silently returning `[]`; the online dealt log line prints remaining pile counts; the lobby shows
YOUR OWN deck counts via `net.myDeckN` stashed in `buildDeck` (zero protocol change — other
players' rows keep the boolean). **B-54 half:** `errRing` (40 public log lines, HTML-stripped)
fed from `log()`'s new 4th param `opts` — chat opts out via `{noRing:true}`, private lines never
enter; window `error`/`unhandledrejection` hook → `onClientError` (session-deduped by
msg|src|line, max 5) → `errPost` (sendBeacon, fetch-keepalive fallback, gated on `conv.errPing`
default ON + a Settings row, `force` bypass for explicit reports); ☰ menu "Report a problem…" →
`openErrReport` (uiPrompt note → uiConfirm consent preview → `kind:'report'` with ring + state
summary; file:// clients print to console instead).

**Server srv-2.6.25 (4 patches):** `POST /client-error` — the server's first body-reading route.
Body hard-capped 32 kB (oversize → destroy, no response), `deriveIp`-keyed limiter (`ipErrs`, 10
per 10 min, pruned in the existing GC sweep; behind the tunnel every raw socket is loopback so
the limiter MUST key on deriveIp), pure `errRecord()` whitelist (kind coercion, per-field caps,
ring ≤30 × 200 chars scrubbed, summary is a pick not a passthrough, NO ip in the record), JSONL
append to `DATA_DIR/elysium-errors.log` with 1 MB → `.1` rotation and a 4 MB total disk guard,
**204 always** — accepted, limited and malformed alike give probes nothing to measure.

**Tests & gates:** harness exposes the new pure functions (+ `fsStub.appendFile`);
test-client-logic +6 (55/0), test-server-dispatch +5 (34/0, sync via EventEmitter fakes),
test-protocol-doc 6/0 UNCHANGED (zero WS changes; the header moved per the check-versions
convention + new §6.2 documents the HTTP route beside `/images/`), bot-canary 37/0, bot-logic
629/0 ×3 against snapshot bots, check-versions full output = 6 expected doc-consolidation
warnings only, B1 byte-identical (wc -c 1 121 850 = 1 121 850, cmp silent). **NEW gate:**
`test-error-endpoint.js` — live smoke, real spawn, random port, isolated tmp `--data-dir` (the
diag lesson), 7/0: boot, 204, one whitelisted JSONL row, no IP, oversize destroyed, flood frozen
at ERR_MAX.

**Deferred by design:** deck counts for OTHER players in the lobby (needs the `deckok` protocol
extension = seven-file chain), the hotseat start gate, the `net.srv` rider (joined carries no srv
field today — inventing one is a protocol change), the full corrupt-list recovery UI. All in §H.

**Post-delivery hardening (same session, four patches after Johan's standing question):**
(1) `errPost` now falls through to fetch when `sendBeacon` exists but throws/refuses (Safari's
application/json-Blob quirk) — previously both crash pings AND explicit reports could vanish
silently there; (2) the report toast is truthful (errPost's return decides the message);
(3) the LAB save (`labSaveLib`) gained the same overwrite guard as `impOk` — it was the OTHER
silent-poisoning vector (precon name prefilled, Enter = replace); deliberately no sanity confirm
there, a small WIP save from the lab is legitimate; (4) the Resume click restore is now
**caught-but-reported**: try/catch is dynamic, not lexical, so the callback registered inside the
guarded boot block ran unguarded — a corrupt autosave was a dead button; now an honest toast plus
a crash ping WITH the stack even though the exception is contained. A garbage-in audit of every
localStorage parse site found 13+ guarded, one false alarm (uiBright — guarded, the audit regex
cut the try off), and exactly these two real gaps. Gates rerun green after each pair;
B1 byte-identical at 1 122 768.

**Wave 2 (same session, Johan's kör + three reports):** (1) **Tournament hard gate** — new pure
`deckLegalText` (VEKN/Black Chantry: crypt ≥12, library 60–90 inclusive; source-verified — First
Blood is 6/49 and New Blood 6/48 BY DESIGN, so the refusal message teaches the escape hatch:
"Turn off Tournament rules… to play intro decks"). **Johan's clarification (6 Aug), source-
verified:** the precon dropdown ALREADY filters to legal-shaped products — `refreshPreconSel`
skips any entry failing `crypt===12 && library>=60`, so First Blood / New Blood never appear as
standalone picks; NB rides only as Deck Lab companions (`nbPoolFor`). The gate's ONLY sub-legal
ingress is therefore a deliberate .txt import — exactly where the teaching message sits. (Fun
corollary: BCP's own "combine two First Blood decks" recipe lands at 12/98, and the gate
correctly reports the 8-card trim needed for the 90 ceiling.) With `conv.tournament` ON
(default), `impOk` refuses outright via uiAlert; casual mode keeps the B-53 confirm. The offline start
(`startOfflineFromCfg`, now async) gates every seat BEFORE `closeOverlay`, reading the Helpers
dropdown (the table's actual mode per v2.6.51) — **B-56 closed** the same day it was filed.
Server-side: tournLock rooms refuse illegal sizes on the EXPANDED counts via the existing err
verb (zero wire change) — a modified client cannot smuggle an illegal deck past the UI. One
existing dispatch test failed honestly: its 1/1 fixture exploited the gate's absence — fixture
made legal-sized, gate untouched. (2) **Chat double-bubble fixed:** the send path bubbles
locally AND the server echo bubbled again for the sender (the echo excludes nobody, unlike the
log verb); own-who now skips the echo bubble while the echo still carries the sender's log line.
(3) **Base actions show their target:** `act()` already appended `targetSuffix()` to the LOG —
the hidden surface was the lock-clone's fx verb ("X rescues", no victim). New `targetShortRef()`
(reads without consuming the pool used-flag) rides the same free-text channel Bleed X uses:
lock verbs now read "rescues → Anson". Gates after wave 2: client 56/0, dispatch 35/0,
protocol 6/0 unchanged, canary 37/0, bot-logic 629/0, endpoint 7/0, B1 byte-identical 1 126 310.

**Wave 3 (6 Aug, Johan's format/misspelling question):** his exact Stolas-deck exposed a real
bug — parseDeck's per-line qty cap of 30 silently shrank "90x Computer Hacking" into a 12/30
deck that the new tournament gate would then REFUSE despite the player intending a fully legal
build (VTES has no per-card copy limit). Cap raised 30 → 90 in **lockstep** on both ends
(client parseDeck + server expandDeck; MAX_PILE 250 stays the total backstop) — and the
ghost-inflation the cap used to soften (VDB description lines) now lands at 90+ and is CAUGHT
by the >90 gate instead of hidden. The import receipt also gained **unknown-name surfacing**:
with the card DB loaded, entries missing the DB are counted and listed in the expander
("1 unknown name" → "Compter Hacking"), so misspellings show BEFORE play instead of as dead
text cards mid-game (DB off ⇒ the check stays quiet, no false alarms), and the ⚠ glyph now
also fires on >90 library for receipt/gate consistency. The answer matrix to Johan's question:
wrong format ⇒ blocked loudly (0/0 + skipped lines listed); illegal structure ⇒ hard-gated in
tournament mode; misspellings ⇒ not blockable (counts stay legal) but now visibly surfaced.
New tests both ends (meme deck 12/90 end-to-end). A second osaker-pa round then found
tutQuickClassic seating tutorial tables from BLIND-SHUFFLED saves -- a poisoned 7-card entry
could seat the lesson itself; fixed with tutDeckRank (legal-first, then size desc): a
preference, never a gate, so all-First-Blood collections still seat and the tutorial can never
dead-end. Two deliberate design points stand for Johan to overrule: the Helpers option local
gives the CONFIRM path even under tournament settings (only the explicit Tournament choice
hard-gates hotseat -- the seating window doubles as the tutorial path), and solo imports under
default settings DO hard-block intro products — and per the list-filter clarification above,
.txt import is the ONLY path intro decks enter by, so the block sits precisely on the active
choice (consistency: the toggle governs everywhere, the message teaches the escape). Gates: client 57/0, dispatch 36/0, protocol
6/0, canary 37/0, endpoint 7/0, B1 byte-identical 1 127 863; bot-logic 629/0 x3 -- with one honest anomaly: a single run aborted 13/1 at a sim test and three consecutive greens followed, the exact flake class the x3 ritual exists to catch.

Johan's promise to Stolas ("a bug report feature") — made publicly on 5 Aug — is hereby kept the
same day.

**Wave 4 (6 Aug, "does the system meet best practice?"):** the honest audit verdict was
"solid v1, but telemetry nobody reads is decoration" — two gaps closed the same hour.
**(1) The server now reports on itself:** the pre-existing uncaught/unhandled survival hooks
(log-and-live-on, lines 69–70 — semantics deliberately UNCHANGED: rooms outlive a stray
exception, snapshots + systemd remain the escalation path, a named deviation from Node's
exit-after-uncaught doctrine that this codebase chose long ago) now ALSO append
`kind:'server'` records through the extracted shared sink `errAppend()` (rotation + total
guard, reused by the client intake — dispatch 37/0, live smoke 7/0 prove the refactor on real
disk). Client and server errors share one log, one reading toolkit, one digest.
**(2) `elysium-error-digest.js`** — zero-dep Node ops companion (no jq/curl assumptions):
reads the JSONL (+ rotated `.1`), aggregates rows past a watermark state file, posts a compact
Discord digest (kinds, client-version histogram with a stale-cache hint — server rows
excluded from it, they carry srv-versions —, top crash messages, top report notes, log size
vs cap). Modes: default daily digest (silent when quiet), `--min N` threshold alarm for a
frequent timer with its OWN `--state` file, `--heartbeat` weekly proof-of-life, `--dry-run`
(prints, never writes state — the rehearsal AND the test), `--mark-only` (initialize the
watermark so the first digest never replays history). State advances ONLY on a successful
post, so a failed webhook retries the same rows naturally. Verified by a four-mode dry-run
matrix on synthetic data; the live POST path is code-read-only in the sandbox (no network) —
first VPS run is the real test, `--dry-run` is the safe rehearsal.

**Wave 4b (6 Aug, "I cannot make channels on the VTES server"):** two answers. The Discord
premise was corrected — the webhook never needed the VTES server, only A channel with webhook
rights, and a personal private Discord server (30 seconds, free, sole member) is the RIGHT
home for an ops feed anyway; guidance captured: template "For me and my friends" (never
Community mode), and the notification gotcha — Discord defaults to Only @mentions, so set the
server to All Messages or the digest lands silently. And Johan's copy/download instinct became
**the pull half of the loop**, doubly motivated: self-hosters (the B-52b audience) may not
have Discord at all. `GET /client-errors.txt?key=<admin-pass>` serves the concatenated
`.1`+`.log` as plain text from ANY browser (phones included — the tunnel carries it on the
same origin, so `https://elysium.cards/client-errors.txt?key=…` just works); `&dl=1` downloads
as a .txt. Gated on the EXISTING `--admin-pass` credential via the same timing-safe
`passMatch` as the hello door, throttled per derived IP (`ipLogAuth`, same window/max as the
intake), **404-uniform on every failure** — wrong key, locked out, or no admin pass configured
are indistinguishable, and without `--admin-pass` the route is OFF entirely. The lockout holds
even against the correct key (brute force buys nothing). The log contains no IPs by
construction, so the read surface leaks no identities. Deploy note: the VPS unit must ADD
`--admin-pass <secret>` to ExecStart at the same restart that ships srv-2.6.25, or the route
stays off. Proof: dispatch 38/0 (uniform-404 trio + lockout-beats-correct-key + dl header),
live smoke 12/0 (route OFF without the flag on spawn 1; spawn 2 posts a needle and pulls it
back out over real HTTP).

**Wave 5 (7 Aug, srv-2.6.26 — graceful drain):** Johan's maintenance-window idea landed as a
pure server feature with ZERO wire change: both carrier verbs (`err`, `sys`) pre-existed.
`GET /admin/maintenance?key=<admin-pass>&on=1&hours=H&msg=...` arms a window — state persisted
to `DATA_DIR/maintenance.json` (a crash-restart mid-window must not silently reopen creation)
and **auto-expiring** (the server reopens itself when the clock passes, no second admin visit
needed). While armed: room creation answers `err` with the notice (admin connections exempt —
the admin can test during the window), every room got a `t:'sys'` broadcast at arming
(**re-arming re-broadcasts** — that IS the manual reminder button), and late joiners plus
spectators receive a personal `t:'sys'` on join. `&off=1` clears; no action returns status
JSON. Same auth family as the log pull: `passMatch`, shared `ipLogAuth` throttle, 404-uniform,
OFF entirely without `--admin-pass`. The notice composes as `<custom msg> (New games are
paused; please finish ongoing games within N hour(s)/min.)`. The dedupe assert also caught a
latent duplicate `CFG:` line in the harness expose (added twice across rounds) — removed.
Proof: dispatch 39/0 (expiry, notice composition, arm-broadcast decoded through recSock,
status, clear, 404-uniform), live smoke 15/0 (arm→status→clear over real HTTP), protocol 6/0
with the 6.2 sibling documented, bot-logic 629/0. Server version 2.6.26 (2.6.25 was deployed
mid-session — the lockstep rule shares major.minor only). The osäker-på round then verified the two riskiest spots — the client sys handler DOES
esc() the admin free text (no XSS surface), and both programmatic joined-splices landed on the
right wsSend — and fixed two blemishes: `?on=0` would have ARMED the window (truthy-string
trap; now strict `=== '1'` on both on and off), and an expired maintenance.json lingered on
disk forever (boot now tidies it). Accepted leftovers, named: token-rejoins during the window
re-send the notice (informative; a dedupe is not worth per-conn state), and the arm URL is a
GET with side effects — impure REST, deliberately chosen for the phone-browser ergonomics.

## [STACK-KLARGÖRANDET] — Johans tredje designöga-fångst: Bowlen ekonomiserar, isoleras aldrig (5 augusti 2026, natt)

'Bowl får ju inte reducerat värde mot stealth 2–3 — leken innehåller
reaction-kort med +intercept också' — exakt, och det fällde min isolerings-
förenkling ('kosmetika vid hög stealth'). Rätt modell: utrustnings-icp och
handens reaktionsintercept STACKAR — mot stealth 2 gör Bowl(+1) att ETT
reaktionskort räcker där två krävts; den ekonomiserar reaktionskorten,
permanent och kortkostnadsfritt per block. Granne-hot-läsningen (när den
en dag byggs) ska därför jämföra a-fördelningen mot NÅBAR STACK, aldrig
utrustning ensam. Stackssemantiken ristad i källkommentaren (kommentars-
rent, 721/0 + canary). Nattens designöga-facit: sampling → signalför-
växling → stackning — tre fångster som alla gjorde framtida byggen rättare
INNAN de byggdes.

## [GATE-FYND ×2] — Brutto, inte netto; slutsnap, inte peaks (5 augusti 2026, natt)

Johans gate fällde TVÅ mätfel i h4-analysen, båda verifierade äkta innan
något skrevs om. (C1) through-eventen bär target 1/413 — slutmålet är
oobserverbart, och hacking spelade 8 bounces i just sewer→hacking-
matcherna: '100' är BRUTTO-utflöde varav ~10–15% vidarebefordrades till
hackings prey. Berättelsen överlever (85–90 netto = största kanten ändå;
absorb-and-win står), och asymmetrins andra sida STÄRKS: sewer spelar 0
bounces, så 15-kanten är ren — sewers seghet är struktur, inte redirect.
(C2) klimatpeakerna red på tidiga små nämnare (2/2 = 1.0!); slutsnapshot-
max ger det sundare bandet ~0.17–1.0, median ~0.45. Två metodristningar:
matrisen är en brutto-karta (netto = framtida bounce-parning) och
klimatband läses ur SLUT-snapshots, aldrig peaks. Gatens facit inatt:
sex frågor, sex fångster — muskeln håller.

## [SKÖRD 4 — NYA RINGAR] — Sewer-sensationen; järnlagen 38/38; instrumentet omkalibrerar sig självt (5 augusti 2026, natt)

Johans önskan om nya prey/predator-dynamiker löstes med NOLL kod: seeden är
matchindex, så omordnade par-listor (paren intakta!) ger samma seeds men
helt nya ringar — P1 GRÖN, alla sex unika. **P2: hacking förstaoffer-
predator i SAMTLIGA — 38/38.** P3 falsifierad-som-skriven: 5p30-klimatet
toppar 0.25–1.2 (treborsbandet 0.2–0.5 var underkalibrerat — fler grannar,
längre matcher) — instrumentet GRÖNT och omkalibreringen ÄR leveransen.
**P4-SENSATIONEN: sewer→hacking 100 pool-skada**, seriens största kant —
sewer gör tremere-mönstret i jätteformat (softener utan skörd, 1 vinst) —
och hacking vann ÄNDÅ 5/6 med 80% av VP:n: apex absorberar sin egen
predators fulla tryck. Asymmetrin är andrafyndet: hacking→sewer bara 15
— sewer är både bästa softenern och segaste bytet. Wall-designens tredje
datakrav föds: försvara som sewer, konvertera som hacking (100-vs-15-
asymmetrin är ritningens nordstjärna). h3 vs h4 lär: vinstfrekvens är
ring-beroende, predatoridentiteten ring-invariant.

## [JOHANS SIGNALKORRIGERING] — Två signaler, inte en; cirkuläriteten fångad (5 augusti 2026, sen natt)

Johan direkt på pucken: 'Tremeres avsikt att hämta Bowl är ju inte avhängd
andras block rate utan sin prey/predators handlingar och stealth?' — HELT
RÄTT, och det fällde ett konceptfel i min knoppskiss. tblk = bordets block-
UTBUD (offensivsidans signal: stealth-ekonomi, aggression). Bowl-värdet =
block-MÖJLIGHET FÖR MIG (grannarnas aktionsfrekvens mot mig + deras a-
fördelning mot min intercept-marginal) = en framtida granne-hot-läsning.
Cirkuläriteten var värst: en ensam blockares EGNA block matar tblk —
knoppen hade devalverat utrustningen som just konverterar. Källkommentarer
omklassade (kommentarsrent, 721/0 + canary); equip-decay bär nu FYRA
förbehåll (rätt signal = granne-hot). Disciplinen betalade sig: eftersom
klimatet skeppades konsumentfritt kostade korrigeringen noll kod.

## [TABLE BLOCK CLIMATE] — Johans mätpunkt skeppad som ren BASE-infrastruktur (5 augusti 2026, sen natt)

Johans design ordagrant sorterad per hans egen doktrin: LÄSNINGEN (alla
bottar mäter bordets blockklimat) är BASE; KONSUMTIONEN (sharkens fribiljett,
wallens identitet, grinderns poolkalkyl) är persona/deck-axel — och byggs
INTE nu: konsumenter förtjänar sig in via mätning, exakt som equip-decay-
kandidaten (parkerad, tre förbehåll). Implementationen är nästan gratis:
räknaren rider B-55e-b-parsern (som kör FÖRE own-echo-return — egna försök
räknas, bordsklimat är bordsklimat), _tableBlockRate() = attempts/ownTurns,
och snapshot.threat får tblk {a, r}. 73g ×3, svit 721/0 ×3. LIVE-PAR:
prediktionen GRÖN — fältet fylls, klimatet landar r=0.2–0.5 (förutsagt
band <~0.5) = framtida konsumenters kalibreringströskel levererad på
första försöket. Timing-nyans noterad: tidigt oustade bots sista snap
missar sena attempts — snapshot-timing, ej observationslucka.

## [SAMLAD DOM] — Bottarna agerar rimligt; nålen flyttas av en LEK, inte av kod (5 augusti 2026, sen natt)

Johans slutfråga besvarad med kvällens hela bevisläge: beslutslagret friat
vid varje borrhål, mönstren koherenta och seat-robusta, doktrinbevakningarna
konsistenta. INGA BASE-ändringar indikerade — otestade justeringar mot
friad logik vore brott mot vår egen doktrin. Hävstången ligger i stallet:
**wall-ersättningsleken**, vars kravlista kvällens data nu skrivit komplett
(interceptdensitet, bred disciplintäckning, Govern-klassmotor bevarad,
benchmark-överlevnad som gate) — den löser F2/F3/F4:s strukturella vakuum
i ett slag. Enda kodkandidaten (equip-score-decay) parkerad med dubbelt
förbehåll: mätning först, och överflödig om leken byggs. En dag som
började med skörd och slutade med frikännande — doktrinen höll hela vägen.

## [F4 — TREMERES SANNA ANSIKTE] — Johans följdfråga välte min förenkling (5 augusti 2026, natt)

'Fick de inte igenom någonting?' — jo, MASSOR: 19× Govern på n=3, 93
pool-skada, bäst dmg/through på bordet (1.58), noll blockade försök.
0 VP-gåtans lösning är grym klassik: i M2/M3/M5 dog tremere out#2 medan
preyn (sewer) dog out#3 — tremere mjukar upp till randen, dör före
skörden, grand-predatorn kasserar in. Rotorsak = F3:s försvarslöshet
vänd inåt. Ny kvantifierad nyans: 14/~55 actions på utrustning (Smith-
motorn: Bowl/Bike/Kevlar/.44) som gav 0 block i metan = ren offensiv
alternativkostnad (Governs som aldrig togs). Klassning: lek×meta-samspel,
ej beslutsbugg — möjlig deck-axel-knopp (equip-score-decay i blockfri
meta) kräver egen mätning först. Theft of Vitae: 1 spel. Läxan: en lek
kan göra ALLT rätt offensivt och ändå skörda noll — VP-tabellen mäter
överlevnad × timing, inte arbete.

## [TAKTIKGRÄVET] — Tre strukturella fynd; beslutslagret friat vid varje borrhål (5 augusti 2026, natt)

Johans fråga: avslöjar flödena brister utanför tremere? Fem linser, två
artefakter rensade (announce-stealth saknar play-emit — omätbar; Fame-
bilden nyanserad: 1 PICK fanns, läst ur out.pick per master-läxan). Tre
fynd, alla STRUKTURELLA: F1 Fame drog sällan + konverterade aldrig (1
tabling, 0 torpors). F2 malks 8 döds-Deflections — drillen friade
besluten (2/2 bounce när usable); korten dog för att dom-bäraren var
borta = kryptmix. F3 STORT: hackings fem fall är ALLA poolsvält (≤2),
aldrig strid — wakes dör i hand ty 'no usable intercept in hand'
genomsyrar bordet: försvar är interceptkorts-gated, metan saknar korten,
och med tremere på 0 VP är hela försvarssidan underutrustad. Wall-
ersättningens andra ansikte + svaret på balansfrågan: hacking är apex-
rovdjur vars enda död är svält. Domen: bottarna spelar sina händer rätt
— händerna är problemet.

## [SKÖRD 3 — SLUMPAD SEATING] — En falsifiering som är ett fynd; järnlagen 32/32 (5 augusti 2026, kväll)

Johans fråga: står sig beteendena när seatingen slumpas? Designbonus ur
seedens determinism: M1-4 REPLIKERAR h2:s exakta seatings (stabilitetslins),
M5-8 helt nya grannskap (variationslins). Fyra prediktioner före start.
**P1 FALSIFIERAD:** hacking 4/8 (prediktion ≥5) — de nya grannskapen gav
FYRA olika vinnarlekar (sewer ×2, malkavian, nosferatu). Nyansen är fyndet:
hacking tog 22/40 VP (55%) även när den föll — apex-ROVDJUR, inte kung;
rotations-erans 7/8 var delvis seating-artefakt. **P2: 8/8 — streaken
32/32** mot fyra byteslekar från fem säten: järnlag. P3 by 31/31. P4 Fame
0/16 naturligt. **Replikationen:** vinnardeck 3/4, förstaoffer-deck 4/4 —
seatingen bestämmer offret DETERMINISTISKT; M4-divergensen (sewer tog
kronan i omkörningen) markerar blandningsvariansens tak. **Tremere 0 VP/8**
— wall-ersättningen får urgency-evidens. Beteendedomen: de STÅR SIG —
seat-robusta mönster, matchup-känslig dominans, noll regressioner.

## [GATE-FYNDET] — Johans fråga fällde ett samplingfel; kedjan höll (5 augusti 2026, kväll)

Tre ärliga osäkerheter listade FÖRE koll. (1) inf-kedjans sista millimeter:
GRÖN — rad 4538 `this.inf += _phaseAvail('influence')`, och kommentaren
förutsåg Information Highway VID NAMN ('not a hardcoded 4... e.g. a curated
Information Highway'). P1-domen står till 100 %. (2) P2-formuleringen 'inga
n=1-hot existerar': **SAMPLINGFEL** — fulldata visade amount {2:27, 1:5, 0:1}
och through-n {2:33, 1:19}; småhot fanns. Kärnan står FÖRSTÄRKT: 0 intercept-
spel även mot dem, och no-urgency-grenens 'no usable intercept in hand'
avslöjar den sanna mekanismen — handen saknade ofta kort ALLS (lekmix, inte
utnötning). Korrigeringsnot i rapporten per fivedecks-prejudikatet. (3)
_liveCount null-säker ✓. Bonus-not: permutationens unequal-list-semantik
divergerar från rotate (par frysta vs lcm-cykling) — dokumenterad, ej bugg.
Gaten fångade ett faktafel som överlevt utan den — hall of fame-posten växer.

## [DUBBELDOMEN] — actGrant stängd utan patch; B-55f-b dödad av sin egen mätning (5 augusti 2026, eftermiddag)

En rigg, två förregistrerade prediktioner. **P1:** auditens 'TRUE GAP' visade
sig föregå taggen — _recomputePhaseActs (14 juli, 'documented no-op until
then') väntade på exakt den cardfx-curation som nu finns. Kedjan bevisad:
tag → spelad (master-play out.pick tur 1, varje match — min första mätning
grep:ade play-events som masters PER DESIGN aldrig emittar, 'decide covers
it': ristad läxa) → baseline (74b: riktiga kortet 4→6, bränd kopia →4).
Två asserts, 718/0 ×3, NOLL botkod. Ärlig not: live-transfersnivån är inte
separat observerbar (internt phaseActs, raises dålig proxy) — inget nytt
frö, behovet svagt. **P2:** falsifierad på PREMISSNIVÅ — benchmarken slår
homogent n=2 (inga småhot finns), tremeres block är KORTLÖSA på a=0-
certainty (icp 2 bär; interceptspel 0/4), urgency-rampen ensam avgör
(0.74→0.77→0.80 nej, 1.00×2 JA), och Lauren 4→4 blod visar att ens
combat-utnötningen saknas — Novices fall är rent poolrace. **B-55f-b
stängs utan en rad kod** — 'egen mätning först' dödade featuren före
bygget, doktrinens hela poäng. Diagnosresan: tomma mätningar → rådata →
fältformer (decide.q='master-play', ctx.icp/amount/urgency) → sanningen.

## [SKÖRD 2 — PERMUTERAD] — Båda fröna gröna; B-55b arkiveras hårt; benchmarkens sanna ansikte (5 augusti 2026)

Fröna på en förmiddag: revert-emiten (v0.6.92, {shed, alive, endgame} vid
varje shed) och --permute-decks (v1.2.7, seedad Fisher-Yates på PAR-index).
Patchresan: självmåls-assert EFTER egen injektion (write-after-all räddade),
arenaversionen bor ENBART i logsträngen, en launch dödtyst (returncode -1)
— verifiera-efter-launch fångade. 716/0 ×3. **Domarna:** permutationen
håller alla fem persona↔deck-par intakta (instansnamnen är SÄTESETIKETTER
— Grinder-2 ≠ samma stol mellan matcher!) och varierar grannskapen ✓.
Revert-emiten svarar: **0 tvångssheds på 8 matcher** ⇒ B-55b-prediktionen
ARKIVERAS (premiss ≈ 0; guarden unit-korrekt, vilande) och H1:s 54→98%
frias formellt — 62% i H2 ger 54→98→62 = brus; måttet pensioneras som
prediktionsgrund. **HACKING VANN ALLA FYRA** (M1: 5 VP-sopning från säte 5;
M2:s 'Grinder' VAR hacking-paret!) = 7/8 totalt, och **prey-first 24/24 mot
fyra olika byteslekar** — aldrig tremere-specifikt: benchmarken äter sitt
byte först oavsett vem som sitter där. by-fältet 30/30. Doktrinen visade
båda sina lägen på en dag: gröna frön OCH en hårt arkiverad prediktion.

## [SKÖRDESERIEN] — Doktrinens första fulla tabell: en grön, en falsifierad, en otillskrivbar vinst, en tom bevakning (5 augusti 2026, morgon)

Fyra naturliga 5p30 (152 s snitt). **by-fältet 12/12 GREEN.** **Posture-
prediktionen falsifierad som skriven** (0 emits) — och viktigare: reverts är
osynliga i traces utom via posture själv = instrumenteringslucka; 'revert'-
emit blir fröet som låser upp omformuleringen. **Försvarshållet 98–100 %
mot baslinjens 54 %** — stabilt över tre set-definitioner (mätresa: 'library'-
nyckeln fanns inte (lib!), strängmatch-setet läckte (Abbot!), strukturerad
fx-nyckelläsning landade) — men guarden avfyrades bevisligen aldrig, så
vinsten är OTILLSKRIVBAR och loggas som korrelation med litet baslinje-n.
Doktrinen gjorde exakt sitt jobb: falsifiering och otillskrivbarhet
rapporteras rakt. **Chain-pricing: noll naturliga tillfällen** (Fame aldrig
spelad på fyra matcher) — riggdomen står som verdiktkälla. **METODFYNDET:**
rotationen bevarar grannskap — hacking satt som tremeres predator i ALLA
fyra (prey-first nu 20/20, hacking vann 3/4, tremere/novice föll först ×4
från fyra olika säten); --permute-decks-flaggan blir frö nummer två.

## [CHAIN-PRICING + DOMARRIGGEN] — Yo-yon stängde: två fulla varv, nio pool (4 augusti 2026, natt)

Johans val (ii) implementerat som v0.6.91: sRes + 1.05 (re-torpor-burnen i
t-termens per-pool-valuta), ovillkorligt eftersom findern redan garanterar
_rushCapableNow; hans bar ordagrant i noten. Testresan lärde tre saker:
63-sektionen fanns inte (ankarjakt → 49b → mkC-scope → 73d), decide-wrappern
döljer pick (_decide direkt i tester), och flyttal äter exakta toFixed-
asserts (2.35×1.3 = 3.0549… → 3.05) — intervallform där baren ÄR testet.
En 13/1-abort inträffade under DUBBEL arena-last (stray + domarrigg — ps-
kollen gjordes men agerades inte på!); 713/0 ×3 på tyst maskin: sviten är
lastkänslig, kör den ensam. **DOMARRIGGEN överträffade prediktionen:** M1
TVÅ fulla yo-yo-varv (Fame → rush → torpor → enemyRescue → rush → torpor →
rescue → torpor #3 = NIO pool av Grinders 20), M2 halvt varv, M3 korrekt
tystnad (hacking saknar rush ⇒ kandidaten byggs aldrig — chain-pricingen
köper inte döda kedjor), M4 varians. 3 rescues mot 0/6 före. **SEAT-LÄXAN
ristad:** riggen är sätesindexerad, lekarna roterar — första mätningen
(deck-filtrerad) missade ALLT; mät per manifest.seat, cross-bot. Verdikt
KEEP under fortsatt aktiv utvärdering per Johans önskan.

## [B-55b + FAME-YO-YO-RIGGEN] — Endgame-posturen skeppad; yo-yons mode-krig avslöjat (4 augusti 2026, natt)

B-55b återfanns HALVFÄRDIG på disk (den avbrutna turen hann committa) —
inventerad självständigt per Grapple-läxan: version, prediktion, helpers,
vakt OCH 73e-tester fanns; enda som saknades var verifieringen. 710/0 ×3 +
canary + versions — komplett & korrekt denna gång. Scope per den skrivna
notens eget resonemang: ENDAST revert-fallbackens front-of-hand-läcka (dead-
card + starve-out redan korrekta); posture-emiten gör vakten mätbar; predik-
tionen registrerad för nästa 5p30. **Fame-riggen (rig-a1, ~6 matcher à 66s):**
Fame-halvan LIVE (famed torpor ×2) men **yo-yon 0/6** — decide-dumpen visar
enemyRescue SOM KANDIDAT som förlorar mode-kriget: sRes 2.2 (t=0) mot Deep
Song n=2 = 2.6. Scoren prisar steget, inte kedjans 3-pool-payoff — TUNE-
kandidat, tre alternativ formulerade för Johans beslut i fame-rig-report.md.
Två infra-läxor: en-körning-per-anrop bet igen (timeout på kedjade sviter);
timeout-blocket dubbellaunchade arenan (två körnings-suffix) — ps/ls före
relaunch. Utvärderingstabeller skrivna i båda rapporterna.

## [RIGG-PARET] — Larissa & Lubomira live-bevittnade; negativfallen på köpet; doktrinens första tabell (4 augusti 2026, natt)

Två scener via --rig-file på 3-botsbord (~50–95 s/match!). **Larissa ×4:**
`window:'larissa-boost'`-emits, Deep Song-bleed **n=3** (2+1) och plain **n=2**
— boosten komponerar med BÅDA bleedformerna; efter två offer sjunker ani-
surplus under 3 och thrift-gaten håller (n=1 igen). **Lubomira ×3 fulla
cykler:** Belinde (Prince, nosferatus egen krypta — helt legal rigg!) som
preys ready-vampyr; signaturen bleed→unlock-snap locked=True→nästa False,
exakt rad 3891:s kontrakt. **Riggens bonus — negativfallen gratis:** M1:s
bleeds 4–5 efter nos-ousten (titellös ny prey) ✓ tyst; M2:s Belinde ur ready
före första bleeden ✓ tyst — villkorsläsningen bevisad i ALLA fyra tillstånd.
Två inristade läxor bet igen (namnrotation → manifest-filter; snapshot-fälten
förkortade n/b/l) — båda nu dubbelt bevisade. Utvärderingsdoktrinens FÖRSTA
tabell skriven (båda KEEP). Alla kuraterade crypt-förmågor är nu konsumerade,
dokumenterade eller LIVE-BEVITTNADE — V-spårets sista vittnen stängda.

## [B-55e-b + UTVÄRDERINGSDOKTRINEN] — Blockarnamnet i emiten; ärligt krympt scope; Johans doktrin i arena-lagen (4 augusti 2026, natt)

Källläget hade ÄNDRATS sedan backloggen: (1) `by: ans.who` fanns redan på 6/13
sajter men who fylls aldrig live (b55e visade None) och är dessutom SPELAR-
namn — dossiern vill VAMPYRnamnet; (2) **Blythe-halvan var REDAN stängd**
(VB CODE FIND 3, _duelOppName) — min tvåfåglar-pitch korrigerad öppet, e-b
krympte till ren observability. **Fixen:** persistent _onChat-parser på båda
_commitBlock-chatformerna (bare + intercept-kort), senaste-attempt-vinner,
nollas per announce i _announceTallyA (mänsklig blockare ärver aldrig stale);
alla 13 sajter by = _lastBlockerName || ans.who || null. Patchläxa: plain-
sajterna var 5, inte 4 — write-after-all räddade filen, räkningen rättades
(5+8=13 ✓). 73d ×4, svit 701→705/0 ×3. **Johans UTVÄRDERINGSDOKTRIN inskriven**
i CLAUDE-arena steg 4 + SKILLS-arena: varje skeppad taktisk ändring får sitt
utfall utvärderat i efterföljande battle reports mot registrerad prediktion
(change · prediction · observed · verdict keep/tune/revert). Verifikationspar
×2 kört för by-fältets levande bevis.

## [BENCHMARK-DOKTRINEN + WALL-PENSIONEN] — Johans två beslut stänger dagens vägskäl (4 augusti 2026, kväll)

**(1) Balansfrågan bordlagd med elegant omramning:** hacking är en
TURNERINGSLEK och blir BENCHMARKEN — apex-rovdjuret som måttstock istället
för balansproblem. Övriga bottars strategi/taktik-arbete mäts hädanefter som
vinstchans/överlevnad MOT hacking; standardriggen 'valfri lek som hackings
prey' formaliserar B-55f-b:s mätning; prey-först 16/16 är baslinjen att slå.
**(2) Wall pensioneras fullt ut:** Johan tar bort deck-wall.json själv —
beroendekollen körd FÖRE beslutet verkställs: svit/canary/arena/versions
refererar INTE filen; enda spåret är DECK_STRATEGY['wall'] (rad 328) som
BEHÅLLS som den öppna pure-wall-arketypens SPEC — kravdokumentet för en
framtida riktig wall-lek (aspekttabellen som byggmaterial, benchmark-
överlevnad som gate). Tremere fyller wall-rollen tills vidare. Docs-only-
runda, noll kodrader rörda.

## [L-SVEPETS GATE] — Fem icke-literal-nycklar, konservativt säker riktning, actGrant står ensamt (4 augusti 2026)

Osäkerhetsfrågan på svepet: consumed-setet var fx.literal-grep — auditen fann
FEM nycklar utan literal (burnAtCounters, costEdge, actGrant,
attachAfterSuccess, edgeLock) varav FYRA konsumeras via entry-/mode-läsning
(Dreams-räknaren, Leverage-costEdge, Marked Path-attach, Misdirection-edge):
metoden UNDERSKATTAR konsumtion = konservativt säkert (alla LIVE stod på
andra nycklar), actGrant förblir enda äkta gapet. Övrigt friat: ingen
comment-only-nyckel; handSize kod-konsumerad (695-maskineriet); testerna
använder redan 'The Parthenon'; curated bakas in i kompilerade filen så
auditens lookup = botens fxLookup. Regel inskriven i rapporten: framtida
svep harvestar ALLA entry-nycklar och verifierar per-nyckel mot verkliga
läsuttrycket. Metodfotnot appendad till library-aspect-audit.md.

## [L-SVEPET] — Bibliotekets aspekt-audit: idén var redan ~95% byggd, nu synlig + sista gapen stängda (4 augusti 2026)

Johans fråga: tagga bibliotekskort som delar aspekter med de fixade vampyr-
förmågorna. Svepet (75 unika kort, 5 aktiva lekar) avslöjade att cardfx-
kompilatorn + familjebyggena 0.6.11–0.6.20 REDAN levererat arkitekturen:
**72/75 LIVE** via typade finders (intercept/stealth/bounce/wake/dodge/strike/
stealBlood/bloodAddTo/...), 2 handler-specialväg (Ashur, Eff Mgmt), 1 äkta
gap (Information Highway actGrant → L3-liten), 1 namnfix (Parthenon, The →
The Parthenon — gjord, handSize löser nu). Två mikromysterier lösta på vägen
(cardfx-json:ens lib-namespace; Dodge under topp-30-klippet). **Rapportens
kärna — crypt↔lib-aspektPAREN nedskrivna** (interceptMod↔intercept,
stealthMod↔stealth, bleedBonus↔bleed, Blythe↔Dodge = SAMMA fönster,
fetchNamed↔handler...) med designprincipen: crypt = persistenta traits, lib =
spelbara bidrag, medvetet olika namnrymder som konvergerar på EN konsument-
väg — därför fungerar nya lekar utan bot-ändringar när korten bär taggar.
Tabellen är nu taggningsreferensen för alla framtida lekar inkl. wall-
ersättaren. Svit 701/0 · canary 37/0. library-aspect-audit.md levererad.

## [ORDER-RACE-AUDITEN] — Johans gate fångade retro-skriptets säteskälla: 16/16 racear, vinnarna höll ändå, seat nu explicit (4 augusti 2026)

"Är det något i koden du är osäker på?" — ja: retro-relabel-skriptet byggde
seatOf ur manifest-EMISSIONSordningen. Auditen (alla lagrade matcher): **16/16
har trace-ordning ≠ namn-ordning** — emiten racear async connects, och namn-
sortering brister dessutom på mixade bord (Grinder-2 < Novice alfabetiskt ≠
säte 4 < 3). Källan fastställd: skapelse-loopen fyller state.per SYNKRONT i
säte-ordning → arenans egna VP:n alltid rätta; sann retro-ordning = --decks-
listans. **Relabel v2:** alla 16 omkörda med sann ordning — SAMTLIGA vinnare
identiska med v1 (arvskonvergensen gjorde domarna ordningsrobusta; tur, inte
kontrakt); VP-detaljerna ur v2 är kanoniska. **Härdningen:** arenan skickar
`seat: i+1` in i boten och manifestet bär det (bot v0.6.88, arena v1.2.6) —
sätet är självbeskrivande för evigt; pre-0.6.88-traces läses via --decks-
mappning. Svit 701/0 ×3 · canary · versions. Addendum 2 i t3-report.

## [ARENA-VEKN-FIXEN] — v1.2.5: flest VP vinner, survival-VP:n på plats, EN retro-relabel (4 augusti 2026)

Källverifierat vekn.net först: "most victory points wins, even if ousted";
sista överlevande +1 HEL VP; vid tidsgräns +0.5 per överlevande UTOM ensam
survivor. **Fyndet i koden:** v1.2.4:s VP-räknare var redan VEKN-medveten
(oust-VP + timeout-halvan) MEN survival-VP:n saknades för last-standing OCH
winner-fältet läste aldrig vp (sattes från alive[0] före finish). **Fixen:**
computeVp + deriveWinner utbrutna som RENA exporterade funktioner (tiebreak:
levande ledare → senast-oustad ledare, dokumenterad arena-konvention);
finish() läser dem; 74a ×4 (T3-M1-formen exakt: survivor 1+1=2 förlorar mot
3). Svit 697→701/0 ×3 · canary · versions. **Retro-relabeln (verifieringen):**
alla 16 lagrade matcher omkörda — exakt EN flippar (T3-shark M1, live-fallet
1-slår-3). Bonusgåva: relabeln avslöjade att fivedecks-prosans vinnarlekar
var NAMN-baserade (M3/M4 = malkavian, ej sewer) — korrigeringsnoter i båda
rapporterna; kärnfynden (prey-16/16, tremere-adaptivitet) manifest-lästa och
orörda. Namn-roterings-läxan bet TVÅ gånger samma dag — nu är den inristad.

## [T3 + T3b] — KONFUNDEN BRUTEN: rovdjuret är hacking-LEKEN, 16/16 (4 augusti 2026)

Tre uniforma bord (shark×5, grinder×5, novice×5, 2 matcher var, samma säten)
+ T3b (hacking flyttad till säte 3). **Elimineringskedjan:** (1) PERSONA FRIAD —
tremere/säte 3 föll först 6/6 under ALLA tre personas lika; (2) SÄTE FRIAT —
T3b flyttade hacking och döden FLYTTADE MED (nosferatu, hackings nya prey,
först 2/2); (3) TREMERE FRIAD — 3:a/sista i nya sätet. **Rovdjuret är
HACKING-LEKEN: dess prey först i 16/16** över fyra serier. Nyansen som gör
det vackert: rovdjursstyrka ≠ vinststyrka — hacking survivor bara 3/12;
grand-predator-dynamiken (döda din prey → din predator ärver dig billigt)
VÄXER UR MOTORN självmant, klassisk VTES. **Metodläxa på vägen:** bot-NAMN
roterar mellan matcher — mina två poll-felläsningar rättades av trace-
manifesten; läs ALLTID manifest, aldrig namn. **Sidofynd:** arena-vinnaren är
'last-standing' (rad 161), inte VEKN:s VP-max — 1 VP slog 3 live; VEKN-fix
backloggad. Konsekvenser: wall/tremere-svaghetsläsningar var till stor del
prey-sätet; wall-ersättaren MÅSTE överleva svärmpress (bounce = bevisat);
lekbalansfrågan (är hacking övertunad?) lyft till Johan. t3-report.md.

## [FEMLEKARSSERIEN] — Wall-konceptleken pensionerad, sätet avslöjat som boven, tremere-boten BEVISAT adaptiv (4 augusti 2026)

Johan syna­de wall-listan (7 unika kort; 14× Computer Hacking mot egen doktrin;
noll utrustning trots Bowl/Bike i strategitexten; noll strikes) och dömde:
ren konceptlek för basal blockhantering — **pensioneras**, ersätts senare;
läxan tas med (även wall-lekar måste vara hand-adaptiva). Frågan om tremere
(dom+aus) som adaptiv förebild källkollades först ärligt: leken ÄR rätt byggd
(24 unika, riktig arkitektur) men vseries-datan visade 1 raise/0.00 cycling —
"fick aldrig agera", obevisat. **Serien ×4 utan muren** (tremere i säte 3,
novice-persona): **(1) SÄTET, INTE LEKEN — Novice först 4/4 med tremere,
identiskt med muren.** Först-ut följer säte+persona (säte 3 = hacking-
grinderns prey); T3 duplicate seating nu obligatorisk. **(2) TREMERE-BOTEN
ÄR ADAPTIV:** 2 raises/match, Deflection 3/4, TM 3/4 (×2 i M1), Theft 3/4
(×3 i M4), block-made 1/match 4/4, bleed-through 4–8, noll torpors —
bounce+block+bleed+blodstöld i samma matcher; B-55a/e-stackens verk.
**(3)** M1 = 8 rundor/38 turer (projektlängsta); shark 3/8 (sewers bästa
serie); shark-torpors 4 (svärmen äter förluster, vinner ändå). Rapport +
batch-review i serie-5p30-fivedecks/.

## [B-55f BAS] — Blockarrotationen: frail-termen i _pickBlocker + JOHANS DOKTRIN etablerad (4 augusti 2026)

M4-dossierns obduktion gav rotmekaniken på första greppet: **Zöe blockade FYRA
raka** (+112→+179s: blod 1 redan vid andra, Dodge-räddning, 'no dodge' ×3,
TORPOR vid fjärde) medan **friska Casey (blod 3) stod overksam** efter sitt
enda block. `_pickBlocker` vägde bara intercept; lika föll på board-ordning.
**Fixen (BAS, kirurgisk):** frail-term (blood ≤ 1 ⇒ −0.4, tie-breaker-skala) —
kapacitet dominerar fortsatt (döende-med-kort slår frisk-utan), ensam döende
väljs ändå (block slår icke-block). 73c ×3 med testdesignprincipen (döende
FÖRST i board så gamla koden bevisligen valde fel). Svit 694→697/0 ×3.

**JOHANS DOKTRIN inskriven som styrprincip:** allmängiltigt strategi/taktik-
höjande → GRUNDBETEENDET (varje bot); arketypspecifikt → persona/deck-axeln.
Sorteringen tillämpad direkt: survivability = bas ✓; intercept-BANKNING (wall
sparar korten till stora bett) = deck-axel → B-55f-b med egen mätning först;
motpress = ofärdig kandidat. Verifikationspar ×2 kört för rotationsbeviset.

## [REN MÄTSERIE v0.6.86 ×4] — Muren blockar MEST och faller först ÄNDÅ: utnötningsekonomin är nästa lager (4 augusti 2026)

Skörden med lagat instrument. **Bekräftat i skala:** Novice 16 block-made
(5·2·4·5, ≥1/match i 4/4, MEST på bordet), tabellen 26 totalt (grundserien ~5),
alla personas lyfter, first-backrush 1/1 på script igen, FYRA olika vinnare på
fyra matcher (sewers andra livstidsvinst i M4), och **sexrundorsklockan BRUTEN**
— M4 gick 7 rundor/231s; klockan var stridslösa erans artefakt. **Ärliga
halvan:** Novice först ut 4/4 IGEN (b55a-seriens 3/4 var tärning; 7/8 totalt).
Stridsbilden förklarar: 22 stridsrundor (M4 ensam 10), 2 torpors (Tsigane,
Zöe), jämna 1-1-byten, blod 3→2→1, 'no dodge in hand' ×4 sent — **blockande
≠ överlevande: varje block kostar blod + låst blockare + interceptkort, och
swarmen ersätter billigare än muren läker.** B-55f öppnad (tänder / selektivitet
/ motpress — dossier-läs M4 först); B-55d:s blockShy-knäpp OBSOLET som designad;
prediktionsboken stängd (halva 1 SANN, halva 2 FALSK i skala med ny mekanism
identifierad). Rapport: clean-series-report.md.


---
*Äldre poster (V-track-epoken, 2–3 augusti 2026 — 15 poster) ligger i
`elysium-session-journal-arkiv-2.md`. Epoken dessförinnan bor i arkiv-1
från förra delningen. Tre dubblettposter från en avbruten tur (FAME-YO-YO
+ B-55b ×2, 4 aug) städades vid denna delning — innehållet täcks av
[B-55b + FAME-YO-YO-RIGGEN]- och [CHAIN-PRICING]-posterna ovan.*
