## [SIM-BORDET: HOTSEATBORDET UNDER EN VIRTUELL KLOCKA, ALLA SITTORDNINGAR, TVÅ REFERENDUMFIXAR — bot v0.6.208 → v0.6.209] (19 oktober 2026, kväll)

Johan frågade på eftermiddagen om ett annat bottprojekt för kortkurering (det var vtes-skill / vtes-rulings, MIT, 25 sep — inte VTES-Player) och sedan hur vi bäst tar oss an V5-stocken. Jag föreslog att kurera brett i vågor och testa smalt (en ny lek mot de etablerade, i alla sittordningar). På frågan om optimeringar mätte jag arenan: en match 162–212 s väggklocka och ~3 s CPU — den väntar, den räknar inte. En spike i scratchpad körde det headless hotseatbordet under en virtuell klocka: en match på ~1 s, samma seed gav samma match. Johan 19:17: "kör på det absolut", och: "Behöver vi utgå från hotseatbordets fasta seating i tester? … testa alla möjliga seatings … eftersom det påverkar taktiska val?"

Byggt: `elysium-bot-sim.js` v1.0.0. Varje match i en egen process; setTimeout / clearTimeout / setInterval / Date byts ut innan botten laddas, och klockan hoppar till nästa timer när inget annat finns att köra. Fast epok + seedad giv = samma trace byte för byte. Standard är alla sittordningar (24 för fyra lekar, 120 för fem), `--seeds K` givar per sittordning; profilen `client` (paceMs 3100, askSecs 20, deckName — klientens hotseat-spawn) eller `arena` (0 / 3). Arenaformade traces så att ana-cards, ana-inv, dossiern, harvesten (pris-domaren: 0 mismatch) och batch-review läser dem som de är. `ana-sim-diff.py` jämför två körningar av samma design match för match. Hotseatbordet v1.3.0 tar valfria personas / seatKnobs / onEvent (utan dem: v1.2.0).

Ekvivalens: åtta matcher både på riktig och virtuell klocka (fyra 4-sits i en fast sittordning, seeds 9101–9104; fyra 5-sits slumpade med sewer, seed 77): varje bott fattade samma beslut och spelade samma kort, utfall och bordssekunder identiska (SAME-PLAY 7, SAME-PLAY* 1 — två botters rader i annan ordning). Riktig klocka 235–385 s per match, sim 1,0–1,4 s.

Två fynd, fixade här (Johans kombinationsregel från 16 okt): (1) KRC-överskottet — `_refDeltas` lade poängen utöver bytets pool på en sidoplats, och med två Methuselahs kvar är den enda sidoplatsen botten själv (byte −1, jag −3 vid byte-pool 1). Den första roterade omgången (24 matcher) hade två där ingen stod kvar: i den första oustade vinnaren sig själv efter att sista motståndaren var ute (KRC + Daring the Dawn + Fame), den andra var fynd (2). (2) Den självoustande referendumen — den andra av de två, och #175 i den första baslinjen (240 matcher): en 2-spelars Ancilla Empowerment på pool 4 med fyra minions (jag −4, byte −4) fick +3,8 och oustade båda. Nu kallar `_bestPoliticalFor` aldrig en referendum vars genomgång oustar mig. Fotavtryck med ana-sim-diff på samma 240-design, v0.6.208 mot v0.6.209: 16 matcher ändrade spel, alla vid en Ventrue-referendum (12 KRC-fördelningar, 4 Ancilla), 3 fick ett annat utfall; post-game-ousts 1 → 0. Sektion 155 (7; 3/4 på v0.6.208).

Baslinjen (fyra V5-startare, alla 24 sittordningar × 10 givar, klientprofil): malkavian 124 vinster (1,91 VP/match), ventrue 55 (1,05), tremere 40 (0,77), nosferatu 21 (0,27) — 135 timmars bordstid på 142 s. Arenaprofilen ger samma ordning. Sittordningen flyttar en lek upp till ~0,7 VP/match (Tremere 0,47 med Ventrue som predator, 1,14 med Nosferatu) — Johans poäng, nu i siffror.

Stallets kort som simmen visar (Johans "kvarvarande 3–4 kort", nästa runda): Kevlar Vest aldrig utrustad (på hand i 84 matcher), .44 Magnum sällan (7 equip-handlingar, 7 strikes, på hand i 102 matcher), Spying Missions [OBF]-bank aldrig (273 spel, alla +1 stealth), Pentex™ Subversion kurerad under det gamla namnet (TM) — det tryckta namnet träffar en tom auto-post (botternas egen lista och läsarna av en spelad eller given Pentex klarar båda stavningarna, så det biter bara på en lista skriven med ™: KRCG:s precon-listor och varje lek V5-planens precon-generator skulle skriva). Bowl of Convergence fungerar; coverage-verktygets klasskarta är gammal.

Grindar: suite 2217/0 ×3 (ensam, fryst kopia med rotens klient v2.6.167 en nivå upp; v0.6.208: 2210, +7 = sektion 155; releasebytes elysium-bot.js 35d23437…, test-bot-logic.js 24329b6b…, elysium-cardfx.json bea73088… oförändrad), canary 69/0 med bot/:s kopior och 69/0 med mains v2.6.167 + protokoll + srv-2.6.49, hotseat 11/0, HB1 11/11, check-versions överens (rotens 21 filer är bytekopior av client/ eller bot/); sektion 155 destruktivt 3/4 på v0.6.208; test-cardfx inte körd (cardfx oförändrad); simmens egna: riktig mot virtuell klocka 8/8, samma 24-design två gånger IDENTICAL 24, klientbaslinjen omkörd på slutbytena IDENTICAL 240.

Osäkert: (1) Ekvivalensen vilar på åtta matcher, alla med arenaprofilen och v0.6.208-bytena — klientprofilen (pace 3100, askSecs 20) är inte körd på riktig klocka (en sådan match tar en halvtimme); samma timers spelas upp, så jag väntar mig samma resultat, men det är inte mätt. (2) Bara offline-vägen: bridgen lyfts ur `bot/`:s läskopia (v2.6.162), inte rotens v2.6.167, och serverns väg simuleras inte. (3) Noll latens avgör ett race likadant varje gång — en av åtta matcher hade två botters rader i annan ordning; inget beslut ändrades, men det är där en skillnad först skulle synas. (4) En seedad Math.random driver både given och botternas val, och en plats kort beror på sittordningen — sittordningarna jämförs som design, inte som parade givar. (5) ana-sim-diff jämför ett urval avgörande fält; en ändring bara i ett score syns som SAME-PLAY (IDENTICAL är den stränga domen). (6) Självoust-spärren är strikt — jag har inte kollat regelboken om samtidiga ousts. (7) Coverage-siffrorna i eftermiddagens svar kom från verktygets gamla klasskarta; kortlistan här kommer från traces.

Nästa: stallets kort (Johans val), med sim-bordet som testbänk; sedan V5-planen (precon-generatorn — alla 18 V5-precons finns i vtes.json — coverage-verktygets karta, Toreador, vågorna).

## [FX_NORM KLIENTIDENTISK IGEN: BOKSTÄVER SOM NFD INTE DELAR — bot v0.6.207 → v0.6.208] (19 oktober 2026, förmiddag)

Main hittade att *Przemysław, War Beast* visades som ett tomt kort: klientens `norm()` vek accenter med NFD och strippade sedan `[^a-z0-9]`, men ł ø œ æ ß đ ð þ ı är egna bokstäver som NFD lämnar, så strippen raderade dem. Klient v2.6.167 translittererar dem först (KRCG:s sätt), och mains svar `client/docs/handoffs/REPLY-to-bot-2026-10-19-norm-letters.md` bad om samma tabell i `FX_NORM`. Johan bad mig titta 11:00; jag bekräftade felet mot koden och föreslog fixen utan profilpunkten; "kör" 11:01.

Felet hos oss: konsekvent inuti botten (`normIdx` och uppslaget tappade samma bokstav, så den tryckta stavningen träffade), men en lek som skriver den enkla stavningen — *Przemyslaw*, *Boleslaw*, *Hjortshoj*, *Sacre-Coeur* — missade alla tre stegen i `fxLookup`: kapacitet 3, ingen klan, ingen fx, kortet spelas aldrig. Klienten hittar dem sedan v2.6.167, så halvorna var oense om samma lek.

Fixen: `FX_NORM_LETTERS` (klientens `NORM_LETTERS`, 16 tecken) och en `replace` före `.normalize('NFD')`. cardfx.json är oförändrad (`prepCardfx` bygger om `normIdx` vid laddning). Profilens och arketypernas exakta nycklar (`P.cards[c]`, `s0.cards[c]`) är parkerade — mains valfria punkt, inte specifik för bokstäverna, inte mätt.

Sektion 154 (6): KRCG-nycklarna, de 16 bokstäverna, enkla stavningar träffar, tryckta träffar fortfarande, en enkelt skriven Przemyslaw får kapacitet 6, och 154f jämför `FX_NORM` med den släppta klientens egen `norm()` (lyft ur `../elysium-vtes-bord.html`) på alla 6 576 namn i cardfx — kommentaren "client-identical" är nu ett test. Destruktivt på v0.6.207:s `elysium-bot.js`: 1/5 (154d grön med avsikt).

Grindar: suite 2210/0 ×3 (alone, frozen snapshot with the root client one level up, so 154f ran each time; v0.6.207: 2204; release bytes `elysium-bot.js` 808d7091…, `test-bot-logic.js` c93902d0…, `elysium-cardfx.json` bea73088… unchanged), canary 69/0 with bot/'s own copies and 69/0 with main's v2.6.167 client + protocol and srv-2.6.49, hotseat 11/0, HB1 11/11, check-versions agrees (the root's 21 files byte copies); test-cardfx not run (cardfx unchanged); no arena smoke (a name-key change; no deck in the arena types these names)

Osäkert: (1) Hur ofta en riktig importerad lek har den enkla stavningen vet ingen — main tror att VDB och KRCG skriver de tryckta bokstäverna (inte verifierat), så det gäller nog mest handskrivna listor. (2) 154f hoppas över (räknas inte) om ingen v2.6.167+-klient ligger en nivå upp; i monorepot gör den alltid det, men en svit som körs i en fryst kopia utan roten får en assertion färre. (3) `bot/`:s egna read-only-kopior av klient/server/protokoll är fortfarande äldre (v2.6.160-tiden); jag rörde dem inte i den här rundan. (4) Profilpunkten är parkerad, inte bedömd.

## [JOHANS TVÅ SVAR: PROBE-DEFAULT 2 OCH CHATTSLAGET BYGGT — bot v0.6.206 → v0.6.207] (17 oktober 2026, natt)

Johan mergade PR #26 (v0.6.206) 00:28 och svarade på dess två förslag 00:54: "Vi kan gå på dina rekommendationer för 1 och 2". Jag skrev först att båda skulle in i #26 som dodgen i #25 — men #26 var redan mergad när han skrev, så de går som en egen release, v0.6.207, och jag rättade mig i chatten. v0.6.206 på main är som han mergade den (`probeHold` 0, chattslaget bara analyserat); dess READ-ME-FIRST, handoff och journalpost står kvar, med en räknerättelse (nedan).

(1) Probe-defaulten: `probeHold` 2 — probarna håller händerna borta från det tunga kortet bara när mina aktörer är fler än bytets olåsta kroppar vid minionfasens start (Johans baitläsning). Labbets siffror (v0.6.206): +0,80 ± 0,14 pool per probetur när jag är fler (Govern landar 56 gånger i stället för 8 på 91 bord), 0,00 annars. `--knob probeHold=0` är återställningen. Sektion 151: 151a kör 0 uttryckligen, 151d läser defaulten i manifestet, 151e spelar defaulten genom minionfasen (Gelasia probar för 1 med Govern reserverad, Colette slår för 3 med den). Guiden (START-HERE-BOTS.html, 'Posture') säger nu att en stealth-bleed-bott probar med småbleeds och sparar Govern till sist när den har fler vampyrer redo än du har blockerare uppe. Johans not om de fem sämre borden (ett byte med en kropp och en wake: det blockerar probaren med kroppen och väcker sig för slaget): att räkna bytets wakes som blockerare hör till kunskapslagret — dels om leken alls innehåller wakes, dels hur troligt det är att de har en på handen nu givet hur många kort som roterat och hur många wakes de spelat. Inskrivet i CLAUDE.md 65f och specen §2, inte byggt.

(2) Chattslaget enligt förslag A (mains första idé): en chatt väntar slaget sedan den senaste chatten PÅ TRÅDEN (`_lastChatWireAt`; `say()` stämplar fortfarande `_lastChatAt` vid köandet, för `_pace`), allt annat åker 200 ms-kaskaden, och en håll- eller fortsättrad hoppar över slaget. I klientens takt: verdikten 3,04 s (var 4,96 på en 3 s-klocka), knappens rad, ett skrivet `+1` och en snabbfras 0,20 s (4,96), hållraden 1,60 s (4,96) och fortsättraden 6,00 s; två chattbubblor fortfarande 4,96 s isär. Bottens egna handlingar väntar fortfarande ut bubblan i `_pace` (Johans v0.6.100-regel), en kö håller ordningen, och arenan (takt 0) är orörd. Sektion 153 (4) fäster det på bottens egen drain med en inspelande socket, sex bottar sida vid sida.

(3) Rättelse: v0.6.206:s `ana-windows.py` räknade en blockstrid som misslyckades vid klockan som ett tappat svar. Verktyget delar nu ett långsamt fönster med ett blockförsök (blockerat, eller misslyckat mot aktörens stealth) från ett som tappade sitt svar. R4:s smokar blir 245 av 379 totalfönster och 14 av 97 modifierarfönster (inte 253 och 22); rättat med en not i v0.6.206:s dokument. Fixen står sig: v0.6.206:s slutsmoke har fortfarande 0 av 80 tappade, 5 strider, alla blockerade.

Destruktivt på de mergade v0.6.206-bytena: 151d–e 0/2, 153 1/3 (den gröna är chatt-till-chatt-slaget, oförändrat med avsikt). Sviten har 2204 påståenden (v0.6.206: 2199).

Grindar på releasebytena (elysium-bot.js 4ba3a5cf…, test-bot-logic.js 67e13d9d…, elysium-cardfx.json bea73088…): node --check på varje ändrad fil, ana-windows.py kompilerar; sviten 2204/0 ×3 (ensam, i frysta kopior; v0.6.206: 2199; +5 = 151e och sektion 153); canary 69/0 (mains nuvarande klientkopior), HB1 11/11, hotseat 11/0; test-cardfx inte körd (cardfx oförändrad); check-versions överens efter rotkopian (21 filer, byte för byte). Bredvid mains klient v2.6.162: klientsviten 303/1 — inbäddningsdriften; alla 15 LIVE-tester med den riktiga botten gröna, bland dem de två v2.6.162-testerna om verdiktens timing som chattslaget rör; deras canary 69/0. Smoken (seed 9701, 9702, 9703 och 4003, V5-bordet, på v0.6.207-koden före versionsbytet — bytena skiljer sig bara i kommentarer och versionsraden): bleed 77/77 parade och VANISHED 0; reaktionsfönstren: inget av 82 tappade sitt svar, 8 var blockstrider vid klockan (5 blockerade, 3 misslyckade mot aktörens stealth); ingen `stale-answer`-rad; probe-ordningen fyrade 3 gånger och reserverades alla 3 (4 `probe-hold`-rader); handskakning, räckvidd och press 160/0, 160/0, 118/0, ingen väntan i skyddsnätet; invarianter 0 flaggor; blockrevisionen 0 brott; ingen sen studs på 77 bleeds; dealt ≠ taken i 19 rader, alla förklarade (8 Murder of Crows som Larissa Moreira bar, 7 hennes Guardian Angel, 3 Hidden Strength, 1 Carrion Crows); stöldparen 13 av 13 lika. Som jämförelse v0.6.206:s slutsmoke (samma seeds, `probeHold` 0): 0 av 80 fönster tappade (5 strider, alla blockerade), probe-ordningen 6 gånger och reserverad 0, en riktig `stale-answer`-rad. Bredvid mains öppna PR #27 (klient v2.6.163 + srv-2.6.47, deras säkerhetsrelease; ett scratch-träd av dess huvud b618adb med vår `bot/` och bunt ovanpå — en artighetskontroll, ingen grind): check-versions överens; deras klientsvit 307/1 — den röda är Bots-sidans inbäddningsdrift (de bäddar in v0.6.206:s guide); alla 16 LIVE-tester gröna; deras canary 69/0; vår canary 69/0 och hotseat 11/0 med deras v2.6.163-kopior; en arenamatch mot srv-2.6.47 (seed 4003): 10 rundor, ingen timeout, ingen tappad anslutning, bleed 20/20, 0 av 22 fönster tappade, 68/0, 68/0, 47/0, invarianter 0, blockrevisionen 0. De två PR:erna rör skilda filer.

Osäkert: (1) Probe-defaulten vid ett bord med människor: en stealth-bleed-bott bleedar nu ofta smått med sina första vampyrer och sparar Govern till sist — en människa som håller en wake för den stora stoppar den ändå; ingen har spelat mot det. (2) Hur ofta 2 verkar: 'fler än' var sant 17 gånger av 19 i arenan (v0.6.206:s probe-serie och rundans tre smokar), 4 av 9 på labbets slumpbord, så reservationen verkar på de flesta probeturer i riktigt spel; labbets +0,80 gäller per sådan tur. (3) Labbet mäter en tur — en Malkavian-aktör, bottförsvarare, händer byggda för att ordningen ska fyra; inte turen efter, stridernas följder eller en mänsklig försvarare. Dess fem förluster var alla ett byte med en wake, och den skarpare läsningen (65f) är inte byggd. (4) Chattslaget vid ett bord med människor: en statusrad eller en snabbfras når bordet ~0,2 s efter en fråga medan frågans bubbla fortfarande syns; klienten visar upp till tre bubblor sida vid sida, så de bör gå att läsa, men ingen människa har sett det — mains andra idé (fördröj panelen) är reserven. (5) Smoken kördes på koden före versionsbytet (bytena skiljer sig bara i kommentarer och versionsraden); sviten och varje grind kördes på releasebytena. (6) Mot mains srv-2.6.47 körde jag en arenamatch, ingen serie. Dess hastighetshink (80 meddelanden per 10 s och anslutning; över det stängs anslutningen) räknar nu även ping och pong; bottens egen sändhink toppar på ungefär 75 per 10 s (en skur på 8, sedan ett per 150 ms) plus en pong per 30 s — inom gränsen, som förut, men med en marginal på ungefär fem. (7) Kvar från v0.6.206: vakten mot inaktuella svar är en heuristik; varje arenasiffra sedan v0.6.144 bar den döda totalklockan; mellan bottar väntar ett omstritt blocks dom på aktörens klocka (3,4–4,4 s från raden till domen i slutsmoken).

Hittat bredvid deras PR, äldre än releasen: ett stöldpar mellan två bottar går isär — en Tremeres Theft of Vitae bokförd som stulen 2 medan Ventrue-offrets Majesty avslutade striden och offret bokförde inget (v0.6.196:s regel: en combat ends-strike stoppar stölden; stjälarens sida tillämpar den inte). Ingen blod flyttades (stjälarens vampyr var full), men böckerna är oense — nästa runda.

Nästa, i Johans ordning (READ-ME-FIRST-2026-10-16e, "After R4"): 14-oktober-scenariot i mains rigg, och den större ommätningen — mot en baslinje körd på v0.6.207 (den döda totalklockan, och probe-defaulten har ändrats). Konsumera mains v2.6.163 / srv-2.6.47 när PR #27 är mergad (läskopiorna, och deras REPLY-to-bot-2026-10-17-v0.6.206: negativ intercept är Johans beslut; kolla om någon bottlogik läser `name` på ett nedvänt kort vid hotseat), och stöldparet ovan. Kunskapslagret, när det är dags: bytets wakes som blockerare i probens 'fler än' (65f).

## [RUNDAN EFTER R4: DEN SENA STUDSEN, PROBE-RESERVATIONEN MÄTT, CHATTSLAGET ANALYSERAT, TVÅ FÖNSTERFEL — bot v0.6.205 → v0.6.206] (17 oktober 2026, natt)

Johan mergade PR #25 (v0.6.205) och sa "kör vidare med nästa steg": de tre punkterna vi kom överens om 16 okt 21:27 — probe-reservationen mätt före och efter (med hans baitläsning), chattslaget efter en fråga (mains fynd 1) analyserat ordentligt, och den sena studsen från R4:s slutsmoke. Analysen, mätningarna och förslagen står i `docs/specs/spec-next-2026-10-17.md`. Releasens egen smoke hittade dessutom två fel i aktörens blockfönster; båda är fixade här enligt kombinationsregeln.

Den sena studsen (R4:s slutsmoke, två gånger på ~470 bleeds, båda direkt efter en Magic of the Smith): fetchens notering `fetches X from the library and equips V (…).` matchade `L12.uEquip`. Aktörens prey och predator öppnade ett fönster för en equip som aldrig fanns och sa Pass, och det Pass:et nådde aktören medan nästa handling — en bleed — fortfarande låg i dess sändkö (tokenhinken håller en tät turs rader i ungefär en sekund). Det besvarade bleedens `Block?` innan bytet ens sett bleeden, och varje svar därefter kom ett fönster för sent: aktören avgjorde, bytets Deflection kom efteråt, och avgörandet namngav fel säte. Tre lager, vart och ett nog på egen hand (kontrollerat på kopior med ett lager i taget): noteringen lyder `X comes from the library onto V (…).`; `_parseUndirected` öppnar inget fönster för en BOTTS rad som inte namnger någon minion på den bottens publika bord (en människas rad orörd); och `_askSeen` / `_staleAnswer` ignorerar en botts svar som kommer medan raden som öppnade mitt fönster fortfarande ligger i min kö (`stale-answer`-rad; en människas svar ifrågasätts aldrig — fx-klonen kan visa handlingen före min rad). Hittat på vägen: arenans knappwhitelist fick aldrig v0.6.205:s `dodgeOut` (arena v1.4.8 tar den och `probeHold`).

Hittat av releasens egen smoke, fixat: (a) Mitt tredje lager var för grovt. Första snittet väntade på allt jag köat före frågan, men efter en modifierares add-rad pushar jag brädet — bytet svarade på add-raden (som det sett) medan brädet låg kvar i kön, och Pass:et kastades. 19 `stale-answer`-rader på probe-seriens sju matcher, alla i fönstret efter en bleedmodifierare, alla följda av att fönstret körde ut sin klocka (3,3 s); en av dem ett Block! från en studs nya mål (seed 9701: Nosferatu tog 2 pool som den hade blockerat). Nu ankrar vakten på raden som öppnar fönstret (`_openLine`, min senaste handlingsrad, aldrig en notering). På slutbytena slog den till en gång på fyra matcher, och rätt: en hunts rad som min kö höll i en sekund medan mitt byte blev utslaget av Creeping Sabotage nådde mitt NYA byte för sent, och dess Pass kom medan nästa bleeds annonsering ännu låg i kön — utan vakten hade det Pass:et besvarat bleeden. (b) Äldre, sedan v0.6.144:s bleedtotal: aktören sov 150 ms mellan `+0`-raden (och en modifierares add-rad) och att reaktionsfönstret öppnades. En bott svarar på ~50 ms i takt 0, så svaret hittade ingen öppen fråga och gick förlorat — fönstret körde ut sin klocka (R4:s smokar: 245 av 379 totalfönster, 14 av 97 modifierarfönster — först räknade som 253 och 22, med blockstrider som misslyckades vid klockan; rättat med v0.6.207), och ibland var det förlorade svaret en studs nya måls blockförsök: bleeden landade på blockeraren. Fönstren öppnas nu i samma tick som sin rad. Slutsmoken: 0 av 80 sådana fönster körde ut klockan; de fem långsamma var block som togs upp, med domen vid klockan. Båda felen kräver ett svar inom 150 ms — arenan, aldrig ett bord med människor (där svarar en bott efter sin reaktionstakt, sekunder). Men varje arenaserie sedan v0.6.144 bar ~3 s död klocka per bleedtotal.

Probe-reservationen (v0.6.143): minionfasen satte `this._probe` och nollade den två rader senare — ordningen fungerade, reservationen aldrig. `_probeOrder(actors)` äger nu båda; knappen `probeHold`: 0 = som det spelat (default), 1 = reservationen som den var tänkt, 2 = bara när mina aktörer är fler än bytets olåsta kroppar (Johans baitläsning). Spårraderna `probe-order` (med `hold`, `outnumber`, `reserved`) och nya `probe-hold`. Mätningen: i arenan fyrar ordningen ungefär en gång per match — sju matcher visar att knappen fungerar (reserverad 3 av 3 på 1, 2 av 2 på 2) men kan inte väga något, och serien gick på första snittets bytes, så jag stoppade den. Labbet (`lab-probe.js`): 360 slumpade bord, samma bord i varje arm, en hel minionfas mot riktiga bottar; ordningen fyrade på 207. När jag är fler än bytets olåsta kroppar (91 bord) går poolen som landar per tur från 1,92 till 2,73 (+0,80 ± 0,14; bättre på 43, sämre på 5), och Govern landar 56 gånger i stället för 8. När jag inte är det (116 bord) blockeras varje bleed i varje arm — 0,00 mot 0,00 — och arm 1 håller kortet i onödan. De fem sämre borden är ett byte med en kropp och en wake: det blockerar probaren med kroppen och väcker sig för slaget. Johans läsning håller exakt. Förslaget till Johan: `probeHold` 2 som default — nu, i nästa release, eller med den stora ommätningens bench.

Chattslaget (mains fynd 1, analys, inte byggt): efter en chattrad väntar `_drain` chattslaget (4,96 s i klientens takt) på nästa meddelande, vad det än är — verdiktraden, räknarskrivningen, brädet, snabbfraserna, håll- och fortsättraderna. Mätt på bottens egen drain med en inspelande socket: mains första idé (slaget skiljer två chattbubblor och inget annat; en håll- eller fortsättrad hoppar över det) tar verdikten till 3,04 s, knappen och ett skrivet `+1` till 0,20 s och hållraden till 1,60 s; två instruktionsrader i rad är oförändrade. Bottens egna handlingar väntar fortfarande ut bubblan i `_pace`, så Johans v0.6.100-regel står. Väntar på "kör".

Tester: sektion 150 (10: hela turen — ett fönster för fetchen och inget annat; parservakten och dess räckvidd; det inaktuella svaret och dess räckvidd; ankaret — ett Pass på en add-rad och ett Block! på en annonsering med mitt bräde köat bakom; hela fallet på bottarnas egna köer), 151 (5: reservationen genom hela minionfasen på 0, 1 och 2), 152 (2: en studs nya mål blockerar direkt och blocket tas upp; ett Pass på totalen avgör direkt, inte vid klockan). Destruktivt på v0.6.205: 150 5/5 (de fem gröna fäster räckvidden), 151 0/5, 152 0/2 (där blir Nosferatu på 1 pool utslagen av en bleed den blockerat); 150e 0/2 på första snittet, 152 0/2 på ankaret utan racefixen. Verktyg: `lab-probe.js` v1.0.0, `ana-lab.py`, `ana-probe.py`, `ana-windows.py` (fönster som körde ut klockan och gick igenom: grinden är 0).

Grindar på slutbytena (elysium-bot.js a9e38637…, test-bot-logic.js b6b35673…, elysium-cardfx.json bea73088…): node --check på varje ändrad fil; sviten 2199/0 ×3 (ensam, i frysta kopior; v0.6.205: 2182; +17 = sektionerna 150–152); canary 69/0 (mains nuvarande klientkopior), HB1 11/11, hotseat 11/0; test-cardfx inte körd (cardfx oförändrad); check-versions överens efter rotkopian (21 filer, byte för byte). Bredvid mains klient v2.6.162: klientsviten 303/1 — inbäddningsdriften (Help ▸ Bots bäddar in en äldre guide), alla deras LIVE-tester med den riktiga botten gröna; deras canary 69/0. Slutsmoken (seed 9701, 9702, 9703 och 4003, V5-bordet, slutkoden — bytena skiljer sig bara i versionskommentaren): bleed 77/77 parade och VANISHED 0; reaktionsfönstren 0 av 80 körde ut klockan och gick igenom (5 var block som togs upp, domen vid klockan); en `stale-answer`-rad, och en riktig (ovan); handskakning, räckvidd och press 188/0, 188/0, 150/0, ingen väntan i skyddsnätet; invarianter 0 flaggor; blockrevisionen 0 brott; ingen sen studs på 77 bleeds; 2 fetchar, inget fantomfönster; dealt ≠ taken i 24 rader, alla förklarade (18 Guardian Angel, 4 Murder of Crows som Larissa Moreira bar, 2 Carrion Crows). Probe-serien: sju matcher på första snittet, sedan stoppad — knappen fyrar, och dess revisioner hittade ankarfelet. Labbet: 360 bord (seed 1–3), ordningen fyrade på 207, 0 fel; arm 2:s härledning stämde på alla 120 bord där arm 2 kördes.

Osäkert: (1) Vakten mot inaktuella svar är fortfarande en heuristik om vem som svarar på vad: den håller bara tillbaka ett svar medan raden som öppnade mitt fönster ligger i kön. Ett sent svar som kommer efter att raden gått ut tas fortfarande — slutsmokens enda träff fångades bara för att nästa annonsering ännu låg i kön; hur ofta den formen slinker igenom vet jag inte (den kräver en oust mitt i min tur). (2) Racefixen flyttar reaktionsfrågan ~150 ms närmare sin rad; vid ett bord med människor pacar `_drain` dem ändå, och mains LIVE-tester gick gröna bredvid, men ingen människa har spelat på bytena. (3) Varje arenasiffra sedan v0.6.144 bar den döda klockan — nästa ommätning behöver en ny baslinje på v0.6.206. (4) Labbet mäter en tur: en Malkavian-aktör, bottförsvarare, händer byggda för att ordningen ska fyra; inte turen efter, stridernas följder eller en mänsklig försvarare. De fem bord där arm 2 förlorade var alla ett byte med en wake — att räkna bytets wakes som kroppar (kunskapslagret) vore skarpare, inte byggt. (5) Arm 2:s 'fler än' räknas vid minionfasens start; i arenan var det sant 7 gånger av 8, i labbet 4 av 9, så default 2 skulle hålla nästan alltid i riktigt spel — jag läser det som ett skäl för 2, men det är en läsning. (6) Mellan bottar väntar ett omstritt blocks dom på aktörens klocka (~3,3 s) — som alltid, inte ändrat här, men tid som en människa som tittar på ett bottblock också väntar.

Nästa: Johans besked om probe-defaulten och om chattslaget ("kör" bygger A). Sedan i Johans ordning (READ-ME-FIRST-2026-10-16e, "After R4"): 14-oktober-scenariot i mains rigg, och den större ommätningen — mot en baslinje körd på v0.6.206, eftersom varje arenasiffra sedan v0.6.144 bar den döda totalklockan.

## [R4 MED DODGEN: REVELATIONS MOT EN BOTT, DE SEX V5-MASTERNA, HAVEN UNCOVERED — bot v0.6.204 → v0.6.205] (16 oktober 2026, natt)

Johan mergade PR #22 (v0.6.204) och bad om R4 medan klienten kör sitt; på min analys och mitt förslag (`docs/specs/spec-r4-2026-10-16.md`, två frågor) svarade han "Kan vi ta detta tillsammans med R4 som en PR?" — allt i en PR som v0.6.205 (fråga B). Fråga A (dodgens golv vid lika) besvarade Johan efter att PR:en låg uppe (21:20 + 21:27): med två dodges i handen kan man offra en även mot 1 skada, Roundhouse först, utom när mitt slag tar ner motståndaren till 0 eller torpor — regeln nedan är hans, i samma PR. R4 är granskningens sista runda.

Dodgen (Johan 16 okt 17:47 + 18:06, fråga A 21:20 + 21:27): `decide('combat-strike')` vägde en dodge bara mot överlevnadsfallet. Nu svarar dodgen på vad deras slag gör mot mig (skada + stöld; deras kråkor landar ändå) mot vad MITT slag skulle göra den här rundan. Siffran kommer från `_strikePick(vamp, theirDodge)`, utskuren ur `_resolveCombatRound`s slagval och spelad av den — stölden, slagkortet eller vapnet, eller handen (1 + styrka + kryptmodifikator; 0 på långt håll) — utan sidoeffekter, så att dodgen vägs mot exakt det slag som annars hade slagits. Med EN dodge i handen dodgas ett känt slag på 2 eller mer som är större än mitt (`known-out`). Med TVÅ (`_dodgeCopies`; Johan: "man kan offra en Dodge om man har två på handen även vid 1 skada") ett slag på 1 eller mer som gör minst lika mycket som mitt (`known-two`); gör mitt mer — Roundhouse för 3 mot deras 1 — slår jag (Johan: "Roundhouse först"). Aggraverat och överlevnadsregeln som förr. UTOM när mitt slag avslutar deras vampyr och deras inte avslutar min (överlevnaden först): med två dodges ett slag som tar dem till 0 blod eller i torpor (Johans ord), med en bara i torpor — att tömma en vampyr som jagar tillbaka nästa tur är inte värt de 2–3 blod dodgen sparar (min rekommendation, som Johan tog "så länge", med en notering för metalagret: vad det är värt att tömma eller torpa en vampyr beror på bordspositionen, inte bara på utbytet). Taggarna `known-finisher` / `unknown-finisher`; deras blod är `_stealAvail()` (okänt → inget undantag), och min skada som landar ändå (kråkorna) räknas inte — slaget måste göra skillnaden. Och en dodge som deras kråkor gör meningslös sparas (`known-wasted`): sätter deras miljöskada mig i torpor ändå räddar dodgen ingenting — det hittade jag när jag skrev undantaget. Ett okänt slag (jag slår först) läses på det förväntade slag Majesty redan läser (`_expOppStrike`, delad med `_ceCtx`) med samma regel (`unknown-out` / `unknown-two` / `unknown-finisher`); med `combatEndStats` 0 finns inget förväntat tal och gamla blod ≤ 1 står. Knappen `dodgeOut` (1; 0 = v0.6.204 byte för byte). Kunskapslagrets steg (en lek som aldrig slår mer än 1: dodga 1 med en dodge också) är inte byggt.

F21 — Revelations mot en bott: människoraden armerade [aus] bara på `… Revelations [aus]. Target: <mig>'s pool.`; ett vampyrsikte, inget sikte och en bar `plays Revelations.` armerade ingenting, och efter visningen tappades människans val (klientens privata `⋖ NAMN targets KORT (revealed to you — they are targeting it).`). Revelations är bytesbunden av sin text, så den armeras nu när aktörens byte är jag, vad suffixet än säger. Efter visningen för en MÄNSKLIG aktör säger botten hur man väljer och läser valet ur aktörens targeting-logTo eller ett skrivet `discard KORT` (bart eller `@Namn discard KORT`, bleed-grammatikens adress), en gång, tills turen slutar (`_revPick`, `_revDiscard`, `_revCardByName`). Ingen väntan: människans egen handling går vidare.

F23 — de sex okuraterade V5-masterna, curated 99 → 105: Elder Library och Ventrue HQ som de var (de fungerade redan); The Labyrinth låses för +1 stealth åt en Nosferatu (`_lockStealthFor`, `X locks The Labyrinth: +1 stealth.`); Guardian Angel på min stadigaste redo vampyr (+1 intercept mot en bleed på mig, förhindra 1 en gång per strid, bränns när värden går i torpor); Wasserschloss Anif banken (`_considerBankIn`, `decide('bank-in')` på Blood Doll-dräneringens regel; utbetalningen i influensfasen till den okontrollerade Tremere som är närmast att resa sig och inte går ÖVER sin kapacitet — fylld exakt reser den sig gratis i samma fas, eftersom utbetalningen sker före influensloopen och loopens första blick är den fria resningen; första snittet krävde 'under kapaciteten', en rest av tiden innan den fria resningen fanns); Haven Uncovered efter Johans beslut 5 — spelas bara på den vampyr som en av mina rushare skulle rusha den här turen, och då kan vilken minion som helst gå i strid med värden som en +1 stealth riktad handling (ingen lås, rusharen agerar; två nya frusna rader, `L12.havenM` / `L12.havenRush`).

Hittat på vägen: Arcane Librarys lås i influensfasen hade aldrig avfyrats i spel — `_considerLockIncome` anropades bara för unlock och master; enhetstestet 19l-13 anropade den med 'influence' direkt. Och en vampyr som redan står på kapacitet i det okontrollerade området reste sig aldrig: loopen spenderade transfers bara på ett behov ≥ 1 och bröt vid behov 0. Värre än det lät — en sond på v0.6.204 (Lauren 4/4 okontrollerad, Chrysanthemum 0/5) visar att influensfasen STANNAR för resten av partiet: Chrysanthemum reser sig, sedan väljer planeraren Lauren (behov 0), loopen bryter, inga transfers spenderas och inga nya vampyrer dras. Grinderns stock fyller en vampyr exakt hela tiden — superior Govern the Unaligned (Tremere, Malkavian) och Enchant Kindred (Ventrue): smoken på PR:ens första huvud reste fyra så på tre matcher (Nassir, Dr. Stephen Norton, Oshri Dahan, Sully), slutsmokarna fyra till (Meaghan, Dr. Stephen Norton, Nassir; Patrik Söderberg), och på v0.6.204 hade var och en av de bottarna slutat influera därifrån. Äldre siffror för de tre lekarna kan bära stoppet. Nu reser hon sig gratis överst i loopen (`_riseFromUnc`, en kropp med transfer-resningen; influensmeningen säger `NAMN enters play at capacity`).

Hittat av releasens egen förhandssmoke (seed 4005), fixat: första snittet spelade Haven på rushväljarens mål enbart — Haven hamnade på Christine Boscacci, sedan utrustade rusharen Raven Spy (permanents first, 98), och en vanlig bleed slog rushen ändå (1,2 mot 1,1). Ett mål är ingen rush. Nu frågar spelet handlingsvalet självt: minionloopens egen ctx (`_actionCtxFor`, utbruten ur loopen — samma finders, samma nycklar) med Havens rush i, hold-the-Govern-vikten (`_actionCtxAdjust(…, ahead)`: ledgern och proben beskriver en minionfas som inte börjat, ledgern håller FÖRRA turens handlingar tills den börjar) och poängsättaren utan sin spårrad (`_decide`). Lärdom.

Hittat, INTE fixat (äldre, sedan v0.6.143): probe-then-punch-reservationen verkar aldrig — minionfasen sätter `this._probe` och nollar den två rader senare, före första aktören, så en probare hålls aldrig borta från det tunga kortet (117g sätter `_probe` för hand). Ordningen (punchern sist) fungerar. Att laga det ändrar stealth-bleed-spelet v0.6.143 mättes med — ett förslag till Johan, inte en passagerare. Johan (21:27): mät före och efter. Och hans läsning av när reservationen lönar sig: att leda med det tunga kortet kräver tur att dra in i stealth, men med fler minions än motståndaren finns det verkligt värde i att baita med 1-bleeds som hotar en Conditioning-uppföljning, så att Govern går sist med störst chans till en oblockad handling. Förslaget blir alltså villkorat — reservationen när mina redo minions är fler än bytets blockerare — och mäts med reservationen död och levande på samma seeds.

Hittat i slutsmoken, INTE fixat (äldre än releasen): en bott-target kan studsa en botts bleed EFTER att aktören avgjort den. Seed 4003, match 3: Lloyd Brooks (Tremere) bleedade Ventrue och pumpade till 2 med Bonding. Ventrue tittade två gånger på samma fönster — första läste 1 ("a stealth bleeder bleeds for 1: no attempt", ingen studs); den andra, 0,55 s efter att aktören skickat `through` och gått vidare till sin influensfas, läste totalen 2 och spelade Deflection. Bleeden landade på nya målet (Nosferatu tog 2; ledgern parar den, inget försvann), men nya målets blockförsök (Horace Radcliffe — lagligt: "that Methuselah can attempt to block") togs aldrig upp: aktören hade gått vidare. Samma form en gång i första förhandssmoken (en +0-total: Ventrue passade, studsade sedan 0,3 s efter Tremeres `through`). Två på ~470 bleeds igenom i rundans sju smokar; vägarna (en bott-targets blick på ett bleedfönster, aktörens fönster efter en modifierare och på totalen) är orörda av releasen. `ana-block.py` flaggade det andra som R6 (dess fönster höll båda handlingarna). Nästa runda: varför ett fönster får två blickar, och en studs efter aktörens avgörande vägrad (eller fönstret hållet till targets sista blick).

Täckningsverktyget v1.1.38: en master räknas konsumerad bara genom en nyckel med en bräd-/masterkonsument (`MASTER_KEYS`); handfinnarnas nycklar intygar aldrig en master. Dess andra versionsställe (rapporthuvudet) hade stått på v1.1.34 sedan v1.1.35 — omsynkat. De fyra V5-rapporterna i `docs/coverage/` omgenererade (de var från 18 sep).

Tester: sektionerna 146 (20, dodgen: en och två dodges, Roundhouse först, avslutarundantaget med kråkorna och ett okänt blod, en dodge som kråkorna gör meningslös, inkl. ett tvåbottsrelä där slaget som spelas är det som vägdes), 147 (13, Revelations), 148 (23, masterna, en hel `_playTurn` med Arcane Library, den fria resningen), 149 (14, Haven inkl. smokens fall och en hel tur mellan två bottar genom rushen). Destruktivt på v0.6.204: 146 4/16, 147 6/7, 148 4/19, 149 1/13 (ingen abort); de sena är röda på sina egna bytes före ändringen (149:s smokefall 13/1, 147:s adresserade discard 12/1, 148:s exakta fyllning 22/1, och nya 146 på PR:ens första huvud — golvet 2 vid lika — 13/7). 143d kör med `dodgeOut: 0`, 139c:s Revelations blev en Bum's Rush, 121f läser `locks`. test-cardfx 271/0 (265/6 på den gamla curated-filen).

Mains klient v2.6.162 (PR #23) och dess uppföljning (PR #24: dokument, rigg, tester — ingen klientändring) landade medan jag byggde: jag mergade origin/main in i grenen två gånger, de skrivskyddade kopiorna i `bot/` är dagens main (canary 69/0 mot dem), och deras svar på v0.6.204 (`REPLY-to-bot-2026-10-16-v0.6.204.md`) gav två guidefynd som är fixade (versionschipet sa v0.6.203; Controls-listan heter nu ▶ Declare verdict). Deras fynd 1 — efter en fråga väntar allt chattslaget, ~5 s, verdiktraden och bokningen av en skriven stealth inräknade — är en designfråga; Johan vill att den analyseras ordentligt, så den blir nästa rundas analys och förslag, inte byggd här.

Grindar på slutbytena, omkörda i sin helhet efter Johans svar på fråga A (elysium-bot.js bad643d0…, test-bot-logic.js 0dcdba3f…, elysium-cardfx.json bea73088…): node --check på varje ändrad fil; sviten 2182/0 ×3 (ensam, i frysta kopior; v0.6.204: 2112; +70 = sektionerna 146–149); canary 69/0 (mains nuvarande klientkopior), HB1 11/11, hotseat 11/0, test-cardfx 271/0; check-versions överens efter rotkopian. Bredvid mains klient v2.6.162: klientsviten 303/1 — inbäddningsdriften (Help ▸ Bots bäddar in v0.6.204:s guide), deras två LIVE-tester med den riktiga botten gröna; deras canary 69/0. Smoken på slutbytena, seed 4003 ×3 (V5-lekarna): bleed 64/64 parade och VANISHED 0; handskakning, räckvidd och press 74/0, 74/0, 62/0, ingen väntan i skyddsnätet; invarianter 0 flaggor; dealt ≠ taken i 11 rader, alla förklarade (3 Guardian Angel på Wauneka, 3 Hidden Strength, 1 Kevlar Vest; 3 Murder of Crows som Wauneka bar, 1 Carrion Crows); blockrevisionens enda R6 är den sena studsens två handlingar i ett fönster (ovan); Haven valdes fyra gånger och hölls varje gång (ingen rushare skulle rusha genom den den turen); tre fria resningar; Guardian Angel en gång; två Revelations-discards mellan bottar. Seed 4005 ×3 (hacking och sewer för dodgen): bleed 92/92, VANISHED 0, 78/0, 78/0, 70/0, invarianter 0, blockrevisionen ren; 16 dodges (15 överlevnad, 1 unknown-out på ett förväntat 2,84 mot händer för 1) och två sparade av avslutarundantaget — två dodges i handen, deras 1 mot mitt 1, och mitt slag tömde deras vampyr från 1 blod till 0 (kontrollerat på andra bottens sida); known-two, unknown-two och known-wasted kom inte upp. Wasserschloss bankade en gång och betalade ut en (1 → Ayelech), The Labyrinth låstes två gånger. De tidigare smokarna (PR:ens första huvud och före: seed 4003 ×3 tre gånger, seed 4005 ×2 två gånger) var rena; där körde Haven-kedjan live (hölls två gånger, spelades på predatorns Chelsea Blake, fyra rusher genom den, en blockerad), fyra fria resningar, fyra Arcane Library-lås; den första seed 4005-körningen hittade Haven utan rush.

## [R3: KLOCKORNA FRÅN TRÅDEN, HÅLLRADERNA, VERDIKTVÄNTAN, EN TALESBOT — bot v0.6.203 → v0.6.204] (16 oktober 2026, natt)

Johan mergade PR #21 (v0.6.203) medan jag byggde. Det här är andra halvan av hans "Kör på!" av 16 okt: R3 proper ur granskningen av mains speltest (`docs/reviews/REVIEW-playtest-2026-10-14.md`) — rundan om tid och ordning vid ett bord med en människa. Spak (e), Adaptives hopp under Standard, står utanför (hans beslut 3).

F3 / F11 — klockan startar när frågan är på tråden: varje väntan på en människa (block- och reaktionsfrågan, poolfrågan, röstningen, de sju stridsstegen, skadesteget, den sena studsens nåd och den nya verdiktväntan) armerades när frågan KÖADES. I klientens takt kostar varje chattrad före den ungefär 5 s (`_drain`s chattslag), så ett 6 s-steg nådde tråden med 1,5 s kvar, och blockfrågan lade kön på sin egen klocka som en "settle" — "3s" sagt, 8,2 s verkligt. En gissning om kön är fortfarande en gissning; nu hänger väntan på köposten själv: `_afterWire(fn)` kör fn när det sist köade meddelandet skickats, och `_drain` startar väntorna som hänger på en post direkt efter att den skickats (en släppt eller misslyckad ram också). `_wireWait(w, rearm)` är den första frågan varje arm-funktion ställer: medan en rad av mig står i kön har väntan ingen deadline (status() säger until: null, steget finns kvar, ett svar räknas ändå); när raden gått ut armeras den, och t0 — väntraden, Adaptives svarstid — startar där. En nyare armering ersätter en väntande (`_wireGen`). Ingen ws (en fixtur, före connect) = armera direkt, som förr. Settle är borta ur `_waitPlan`: siffran frågan säger ÄR klockan.

F4 — hållraderna: "⏸ Holding …" och "▶ Resuming." går först i kön (bakom tidigare hållrader, i ordning), taggade i en WeakMap med det hålltillstånd de beskriver (`chat(msg, { hold })` → `_sendHold`). `_drain` släpper en rad som bordet redan passerat: en resume under nästa hold, en hold efter sin release, en resume av en hold bordet aldrig såg (`_holdShown` = vad tråden senast bar). Första snittet skickade raderna genom en egen `_holdChat` och fyra äldre sektioner som stubbar `chat()` föll (76a/b, 82b, 137) — en ny väg för en gammal sorts utdata måste gå genom sömmen testerna stubbar. Lärdom.

F10 — verdiktväntan: efter "Trevon Parker attempts to block." hände ingenting — ingen klocka, inget steg, och aktörens Pass lästes inte; mains bord stod i fyra minuter. Nu säger `_vwArm`, i slutet av `_commitBlock` mot en mänsklig aktör: "X blocks (stealth A vs intercept B) — Anna, add stealth, or say Pass to resolve it (3s → the block succeeds)" och väntar på tempot (kind `verdict`, steget `resolve-verdict`; Turn-based: ingen klocka, påminnelse, give-up). Klockan, aktörens Pass / No / No reaction / It resolves (snabbfras eller skrivet) eller Bot-knappen → `_vwResolve` deklarerar verdiktet från räknaren med §12-raden (mina loggrader ekas inte tillbaka) och går vidare som bordet skulle: `_verdictAsTarget(ok)` är den gamla kroppen ur bordets verdiktgren, nu delad — strid när blocket lyckas, fönstret igen när det misslyckas. Aktörens räknardrag och mitt eget andra intercept startar om klockan; en hold fryser den; en räknare som stängs avslutar den, liksom `_clearPending` och bordets egen verdiktrad. En bott-aktör deklarerar varje verdikt själv, så mot en sådan armeras ingen väntan.

Självgranskningen före sviten gav två förfiningar, och en genomläsning av koden en tredje. (1) `_arkQuiet` såg varje räknarläge som levande — ett vilande `free` från en klient med hjälparen av hade hållit anmärkningen resten av partiet; nu bara block / vote / combat. (2) It resolves över en räknare som säger att blocket misslyckas landar handlingen direkt (`_applyPending`) i stället för att öppna mitt fönster igen — aktören har sagt sitt ord, samma regel som v0.6.203 gav en bott-aktörs It resolves; säger räknaren att blocket lyckas vinner räknaren, och finns ingen räknare tar de gamla vägarna frasen (`_vwResolve` returnerar false). (3) En stealth SKRIVEN i chatten (`+1`, `2`) startade inte om klockan: botten bokar den själv, och dess egen räknarskrivning hörs (med rätta) inte som aktörens. Nu armeras väntan om där. Lärdom: när botten skriver i någon annans namn är den skyldig deras sidoeffekter också.

F2 — en talesbot: `_isSpokesBot` hoppar över utslagna platser, och en utslagen bott är aldrig en. En säker arketypläsning går till `_arkTell` (bara talesbotten, knappen `arkChat` som förr); `_arkPump` skriver den som en not på loggnivå — "NAME (bot) reads X's deck as Y (n of m cards typical)." — när `_arkQuiet()` håller: ingen fråga, pending, poolfråga, stridssteg, strid, verdiktväntan, röstning eller levande räknare. Prövas om var 1,5 s; `close()` rensar timern. Varje bott spårar fortfarande `archetype`-raden. Tre aktörsnoter som upprepade aktörens egen Misdirection / Fame / Pentex-rad är borta. Poolfrågan stannar per bott (Johans beslut 4).

F6: i `_reactWindow`, mot en BOTT-aktör vid paceMs > 0, väntar målets "Hold on…" på aktörens fråga (`p._thinkQ`, sägs i `_onChat` när aktörens rad kommer) och släpps om mitt svar går ut först. Mot en människa, och vid paceMs 0, oförändrat.

Spakarna: (a) `_announcePhase('Unlock', 'none')` — inget andra slag vid turens start, bara hold-grinden; (b) varje annan fasrad rider fx-slaget (0,4 × paceMs) — raden skickas fortfarande, handlingen efter den tar sitt eget fulla slag; (c) i en fasad strid (mot en människa) blir rund-, dodge- och combat ends-sammanfattningarna noter på loggnivå utan "tell me if your side differs" — som chatt höll de nästa fråga i ~5 s (F3); mellan bottar oförändrat; (d) `_waitPlan(kind, who, step)`: stegen 0, 2 och 6 ("Anything before …?") väntar 1× reglaget, manöver, strike och press 2×.

Tester: sektion 145, 35 påståenden — 145a–e på en inspelad tråd (paceMs 300, en transport som stämplar varje ram: klockorna, poolfrågan, röstningen, ett tidigt svar, hållraderna), 145f verdiktväntan, 145g talesbotten, 145h F6, 145i spakarna. På v0.6.203: 4/31 (fyra vakter gröna på båda, ingen abort); de tre sena påståendena är röda på bytena före sina egna ändringar (32/2 och 34/1). Sex äldre sektioner (127n, 127z, 128e, 128i, 139g, 141g) band de gamla nivåerna och 2× för steg 0 och binder nu de nya reglerna.

Grindar på slutbytena (elysium-bot.js 4201f7f0…, test-bot-logic.js b590e7c9…): node --check på varje ändrad fil; sviten 2112/0 ×3 (ensam; v0.6.203: 2077); canary 69/0 (mains kopia), HB1 11/11, hotseat 11/0; test-cardfx inte körd (cardfx oförändrad); check-versions överens efter rotkopian. Destruktivt: 145 på v0.6.203 4/31 (fyra vakter, ingen abort), de tre sena på bytena före sina egna ändringar 32/2 och 34/1. Bredvid mains klient v2.6.161 (en scratch-worktree av origin/main = a714cb0 med vår bot/ och rotbunt ovanpå): klientsviten 299/2 — embed-driften och deras v2.6.140 LIVE-test, som läser första stegbara status och nu ofta får det köade ögonblicket (until null, granskningens F3-regel); med en rads ändring (vänta på en armerad klocka i Standard-halvan) i scratch-kopian 300/1; klientens canary 69/0. Deras test är inte vårt att ändra — handoffen ger raden. Röken (seed 4003 ×3, 4 Expert-bottar, pool 30): inga timeouts (9, 7 och 11 rundor); bleed 69/69 lika, VANISHED 0; namnen 94 rätt; dealt = taken i 89 rader, de 5 andra förklarade (4 Carrion Crows, 1 Hidden Strength); steal-par 10 av 10; handskakning 96/0, range 96/0, press 70/0, inga väntor i säkerhetsnätet; invarianterna 0 flaggor; blockgranskningen ren. `ana-wait.py` har inget att läsa i en arena utan människor (väntor på bottar skriver inga rader) — klockändringen syns vid ett bord med en människa: mains rigg, nästa steg.

Mitt i rundan (17:47) mergade Johan #21 och svarade om dodgen: spela den just nu mot allt som gör 2 eller mer i skada — när mitt eget slag inte längre ger lika eller bättre utdelning — och mer dynamiskt när kunskapslagret kan anta vad motståndaren gör: gör leken troligen aldrig mer än 1 kan dodgen spelas ändå (den får aldrig bättre utdelning), och man vill spela den om man har fler på handen. Inte byggt i v0.6.204 (R3 var redan grindat); idag dodgar botten ett känt slag bara om det skulle tömma eller sätta den i torpor (eller är aggraverat), och ett okänt bara vid blod ≤ 1. Mitt förslag står i svaret till honom. Johan (18:01): baka in dodgen i R4 — nästa runda, v0.6.205, i en ny chatt; förslaget står i READ-ME-FIRST-2026-10-16e, 'Next'. Johan (18:06): ja på båda öppna frågorna — dodge vid lika utdelning när botten har fler dodge på handen, och dodge när botten slår först om det förväntade slaget är 2 eller mer.

Handoff: `HANDOFF-to-main-2026-10-16-v0_6_204.md` — ingen ny wire-verb, ingen ny fryst loggrad; en ny frågerad, ett nytt steg (`resolve-verdict`: vi föreslår etiketten "Declare verdict"; deras panel visar "▶ Step" tills dess, och ▶ bredvid 🤖 i Turn-based är redan ett filter), raderna som flyttat till loggnivån; riggen: `QUESTION` matchar inte den nya frågan, så reflexen armeras från 6 s-reserven — lägg till `add stealth`; en mening i PLAYTEST.md ("waits for you without a clock") stämmer inte längre; och guiden att bädda in igen.

Osäkert (READ-ME-FIRST-2026-10-16e): klockan går medan frågans bubbla animeras (v0.6.100:s settle väntade in den); ett svar som kommer före frågan nått tråden stänger väntan men frågan skickas ändå efteråt; en omarmering väntar på allt som står i kön, inte bara frågan; verdiktraden kommer nu från blockerarens plats (klientens bubbla namnger blockeraren); It resolves över en räknare som säger att blocket lyckas startar striden (obokad stealth syns då inte); spak (b) gäller varje fasrad, och (c) tog även dodge- och combat ends-sammanfattningarna.

## [R3, FÖRSTA STEGET: DEN FÖRSVUNNA BLEEDEN, STRIKE-STEGET MELLAN BOTTAR — bot v0.6.202 → v0.6.203] (16 oktober 2026, sen kväll)

Johan mergade PR #19 (v0.6.202) och svarade på mina frågor inför nästa runda: (1) "botten ska svara på kända strikes absolut" — strike-steget i regelbokens ordning även mellan bottar; (2) fixa Deep Song mot människa; (3) tempospaken för en bevakad bot-mot-bot-strid väntar tills folk reagerar; (4) bara röken nu, ett gäng nya mätningar när alla fixar är på plats; (5) Jack-betalningen ligger kvar. "Kör på! :D" — ordningen: mains svar, bounce-fixen som R3:s första steg (egen commit, egen sektion, `VANISHED = 0`), sedan R3. Jag delade i två PR: PR A (v0.6.203) = konsumtionen + bounce-fixen + strike-steget + Deep Song + hygien; PR B (v0.6.204) = R3 proper.

Mains svar konsumerade (klient v2.6.159, v2.6.160; v2.6.161 kom utan svar): read-only-kopiorna av klienten och protokollet är v2.6.161:s; vår canary är deras (deras §5 kör klientens Reduce-rad genom vår `L12.reduceBy` och en levande `_onLog`) — 69/0. Hotseat-verktygets lyft (deras §6, som de hittade genom att KÖRA vårt verktyg): bryggans `tallyIn` anropar `tallyCombatMerge` / `AVR_CMB_KEYS`, och vår vm-kontext hade ingen av dem — en botts strids-tally kastade i lyftet (v2.6.129–158) eller reläade bara basfälten (v2.6.159+). `elysium-bot-hotseat.js` v1.2.0 klipper de tre definitionerna bredvid literalen; `bridgeIn(L)` är den enda kontexten; H11 i hotseat-grinden (11/0, gamla lyftet 10/1). Guiden: Reduce-raden (v2.6.159+) med mains hotseat-mening (⌂ Home först, en Hold on ger tiden), Edge offline, ögat i Structured, Debug-rutan, klient v2.6.161.

Den försvunna bleeden (READ-ME-FIRST-2026-10-16c §6): en bott-target håller sin bounce till bleed-totalen; aktörens total-fönster tar bara reaktioner, och v0.6.114 vägrade varje Block! där — även studsens nya mål, fast studskorten säger "(that Methuselah can attempt to block)". Det nya målets pending stod kvar som contested och släppte bleeden på aktörens It resolves. Nu öppnar `_bouncedTo(seat)` det nya målets blockeringssteg i vilket fönster studsen än landar; vägran står kvar för alla andra platser och efter en modifierare (`_blockStepFor`). Den öppna frågan följer bleeden (`a.target`: status, roster-kroken, tempots vem); det gamla målets intercept nollas, aktionens stealth står kvar; ett mänskligt nytt mål får en chattrad om att det får blockera. Och — det viktigaste fyndet under läsningen — blödningens `through`-emit flyttad från första frågans 'no' till upplösningen (med `final` och `bounced`): `_emit('through')` stänger också block-räknaren och binder den parkerade kostnaden, så allt som hände i de sena fönstren gick på en stängd räknare — ett nytt mål som blockerade där dömdes mot stealth 0 från en färsk räknare. Målsidan: en BOT-aktörs It resolves över mitt levande försök landar bleeden (en bott deklarerar varje verdikt den tar upp innan den löser — ett försök den aldrig tog upp blev vägrat eller kom för sent); en mänsklig aktör frågas som förut. En bot-aktörs modifierare stänger mitt blockeringssteg. Sektion 142 (16; ett levande bord på riktiga servern: Ann blöder Tor för 2 med Dominate Kine på stealth 1, Tor avböjer och studsar den till Ulla på totalen, Ulla blockerar med Enhanced Senses, Ann deklarerar "Block: Stealth 1 vs Intercept 1 — block succeeds."). På v0.6.202: 6/10.

Strike-steget (Johans svar 1, regelboken 6.4.3: "the acting minion first, then their opponent"): den agerande botten slår först; den svarande tittar på slaget (`_awaitOppStrikePeek` — raden står kvar som pending, så de befintliga läsningarna ser den och den konsumerande väntan efter mitt eget slag tar den direkt) och väljer med vetskap: inget strike-kort eller steal mot deras dodge (händerna, kortet stannar), en dodge mot det slag som skulle tömma eller sätta mig i torpor (det kända slaget i `decide('combat-strike')`, inte antagna 1; kråkor landar ändå och räknas inte i dodgens värde), ingen dodge mot ett slag för 0. Den agerande väntar minst handskakningens säkerhetsnät (`_strikeWaitHs`) och ingenting efter sin egen combat ends — 141m (ett äldre test) fångade att den agerande Ventrue väntade 2 s på ett slag som Tremeren inte längre skickar efter en Majesty. Lärdom. Sektion 143 (11; ett minnesrelä mellan två bottar: en dodge först behåller svararens Roundhouse, en Roundhouse för 4 först dodgas på blod 3 där antagna 1 slog och tog 4 till torpor, en näve för 0 på long behåller Dodge, beslutet självt, Deep Songs fasvandring). På bytena före: 1/10.

Deep Song mot människa (svar 2): en regel, `_combatIActing(myVamp)`, för handskakningen, `_phaseStep`, `_phaseDamage`s rad och press-svarsfönstret — efter en botts Deep Song-rush frågar botten människan först i varje steg. 143e.

Hygien (R1:s och R2:s spår): bottens egen prevent-rad (`X plays CARD: prevents N damage.`) typas med vampyrens namn — det generiska mönstret matchade den först och läste `X plays CARD:` som vampyr, så strike-vs-taken-invarianten drog aldrig av en motståndares Hidden Strength (alla 6 flaggor i R2:s rökar; v0.6.180 hade lagt det specifika mönstret UNDER det generiska); burn-for-pool- och rescue-noterna når poolbokföringen (`note()` skriver `NAME (bot)` sedan v0.6.108, mönstret väntade sig ett ord — Wider View-driften +2); en utrustnings poolkostnad skriver en pool-händelse; `_range` börjar på 'close'. Sektion 144.

Hittat av releasens egen rök (seed 4003 ×3, före sista fixen): invarianten flaggade 'taken 2, my strike 1, crows 2' — en buren Murder of Crows och en spelad Carrion Crows är två skadekällor som båda landar varje runda (kortens rulings), men offret behöll bara den senaste annonsen (`_oppCarrionCrows` är en `opp-env`-händelse som bara bar `n`). Händelsen bär beloppet per källa nu; en upprepad annons ersätter bara sin egen källa. 144e. Lärdom. Samma rök: bleed 68/68 lika (inga VANISHED, inga "more/less" tack vare `final`), handskakning 102/0, range 102/0, press 78/0, inga missar i säkerhetsnätet; dealt ≠ taken i 8 rader, alla förklarade (4 kråkor, 4 Hidden Strength).

Grindar på slutbytena (elysium-bot.js fd91bd13…, test-bot-logic.js 50a27299…): node --check på varje ändrad fil; sviten 2077/0 ×3 (ensam; v0.6.202: 2043); canary 69/0 (mains kopia), HB1 11/11, hotseat 11/0 (H11 ny, gamla lyftet 10/1); test-cardfx inte körd (cardfx oförändrad); check-versions överens efter rotkopian. Destruktivt: 142 på v0.6.202 6/10, 143 på bytena före 1/10, 144 1/5 före hygienen, 144e röd före kråkfixen. Bredvid mains klient v2.6.161 (en scratch-worktree av origin/main med vår bot/ och rotbunt ovanpå): klientsviten 300/1 (den röda = embed-driften: Help ▸ Bots bäddar fortfarande in v0.6.201:s guide; en re-embed stänger den), klientens canary 69/0, check-versions överens. Röken på slutbytena (seed 4003 ×3, fyra Expert-bottar): inga timeouts; bleed 55/55 parade, VANISHED 0; handskakning 112/0, range 112/0, press 86/0, inga väntor i säkerhetsnätet; invarianterna 0 flaggor (R2:s slutrök: 4); blockgranskningen ren; dealt ≠ taken i 5 rader, alla förklarade (4 Hidden Strength, 1 Carrion Crows).

Inte byggt (READ-ME-FIRST-2026-10-16d §6): en MÄNNISKAS bounce av en botts bleed läses fortfarande inte av den agerande botten (klienten skriver bounce-kortets spelrad med pool-mål; bottarna läser bara den bot-emitterade omannonseringen) — noterat i handoffen; en bott som är studsens nya mål kan inte studsa vidare (den håller sin bounce till en total som aldrig kommer efter en studs); en bott-targets reduce-kort spelas i första fönstret, före modifierarna. Tempospaken för bevakad bot-strid: Johans svar 3, vänta.

## [R2: STRIDEN MELLAN BOTTAR I REGELBOKENS ORDNING — bot v0.6.201 → v0.6.202] (16 oktober 2026, kväll)

Johan mergade PR #16 (v0.6.201) och frågade om jag ville köra vidare eller om han skulle ta ett varv med klientsidan först. Mitt svar: kör klientsidan parallellt — R2 är helt bot-sida. Enligt hans nya regel (fixar som hör ihop får kombineras) tog jag med resten av v0.6.140-granskningen (Smiling Jack och Fame).

Byggt som v0.6.202 (R2): (1) bot-mot-bot-handskakningen (punkt 16, 17a, 7): den agerande minionen talar först i manöver-, före-strikes- och press-steget — kortraden, eller en fryst "ingenting"-rad på loggnivå (`NAME does not maneuver.` / `NAME has nothing before strikes.` / `NAME does not press.`) — och den andra botten bestämmer med vetskap om den och svarar likadant; en press to continue besvaras med press to end eller "does not press", åt båda hållen. 200 ms-väntorna som förlorade loppet i klientens takt är borta mellan bottar, ett press-steg där ingen pressar tar millisekunder i stället för askSecs, en rad från en tidigare runda släpps när nästa runda börjar, och Grapple-stashen är en händelse som pressen och manövern. Säkerhetsnätet är askSecs och står still under en hold. (2) När en människa sitter vid bordet och pace > 0 får varje rad i en strid mellan bottar ett slag (ett kort hela steget, en "ingenting"-rad det korta fx-slaget) — en tyst runda i klientens 3,1 s tar ungefär 14 s, jämnt fördelat. Arenan är orörd. (3) En hold stoppar bottens egna stridsdrag (punkt 5, Johans beslut 7): nästa stegs fråga, strike och press. Test 137f (v0.6.198) låste att ett steg öppnas under en hold — det väntar nu framför holden, med beslutet i testnamnet. (4) Tallyns range, range-lås, combat ends och press bara från människan botten slåss mot (17b). (5) Roundhouse = styrka + 2 (18): kompilatorn v1.9.2 skriver `handBonus` (35 kort; `strike` är det ABSOLUTA fältet) och `_modeStrikeDmg` lägger på styrkan — Roundhouse [pot] 3, med Preternatural Strength 4. (6) Två steals samtidigt nettas (19, [ANK 20200123]). (7) v0.6.140-granskningen klar: Smiling Jack (egen tick, en annans Jack) och Fames dränering oustar vid 0 pool i egen unlock och turen stannar där; en Jack betalas med pool och blod över vampyrer, aldrig sista poolen när blod kan betala.

Hittat av releasens egen arenarök (seed 4002, 2 matcher, innan fixarna): 7 väntor i säkerhetsnätet — alla buggar. (a) En Deep Song-rushad bott utan annan olåst minion complyade tyst, så rusharens riktade fönster körde hela klockan (3 s) medan målet redan slogs; den säger Pass nu. (b) Deep Song gör målet till agerande minion ("The target vampire is considered the acting minion during that combat") — mellan bottar talar den rushade först nu (`_combatActing` / `targetActs`; räknarens sidor behåller mains mappning), och rusharen armeras vid sin annons för målets tidiga rader. (c) Majesty skickades som dodge-raden plus "Combat ends — Majesty.", och en bott som löste sin strike innan andra raden kom läste en dodge — nu protokollets enrads `NAME strikes: combat ends.` först. (d) Pressbeslutet läste förra rundans taken-rad, pressade (en Stray-liv) in i en vampyr som redan låg i torpor och slogs sedan en fantomrunda 3 — nu bara denna rundas rad (`_rndAt`), och en nere motståndare avslutar striden efter press-steget. Två "rangeoenigheter" var analysverktygets parning över två strider med samma Ventrue inom 9 s — `ana-combat2.py` parar nu på båda korsade namnen; invariantkollen räknar de burna kråkorna (Murder of Crows). Andra röken (seed 4002, 3 matcher, efter de fixarna): integritet 126/0, range lika 126/0, pressutfall lika 98/0, inga väntor i säkerhetsnätet. Tredje röken (seed 4003, 2 matcher, på den då slutliga koden) hittade en sista, gammal bugg: 3 väntor i säkerhetsnätet och ett par rader som var oense om range — alla från en enda superior Immortal Grapple i en strids SISTA runda. "Close nästa runda" gällde en runda som aldrig kom, och flaggan (`_forceCloseNextRound` hos spelaren sedan v0.6.28, `_nextRange` hos motståndaren sedan v0.6.164) följde med båda bottarna in i deras nästa strider, som hoppade över manöversteget: Horace sa aldrig sin manöverrad, Ayelech väntade ut säkerhetsnätet och manövrerade till long ensam, och Horace slog Roundhouse på close mot en Theft of Vitae på long. Mot en människa kostade det botten manövern i den rundan. Nu dör en range som satts för nästa runda med striden (`_resolveCombat`s finally och `_clearCombatStashes`); test 141o spelar upp det. Jag sopade klassen i samma release: rundans range och Immortal Grapples "bara handslag" (`_handStrikeOnly`, som bara nollställdes vid före-strikes-steget) överlevde också rundan och striden — nästa rundas (eller nästa strids) manöversteg läste begränsningen (en snipande Tremere hittade inget avståndskort under den och stannade på close, 141p), och det som planerar mellan striderna (ett blocks pris, en chump-bleeds skydd, en rushs räckvidd) såg "bara handslag" (ingen Majesty, ingen dodge) eller "long" (inga nävar) från förra striden; 16 strider i R2-rökarna började efter en Grapple i sista rundan. Begränsningen nollställs nu vid varje rundas början, och stridens slut lämnar `_handStrikeOnly` falsk och range close. Slutröken (seed 4003, 3 matcher, slutbytena): integritet 112/0, range lika 112/0, pressutfall lika 86/0, inga väntor i säkerhetsnätet; de 10 strider som följde på en Grapple i sista rundan var alla rena. Ledgern: 45 bleeds lika och 16 större genom aktörens modifierare; dealt = taken i 106 rader och de 4 andra förklarade (3 kråkor, 1 Hidden Strength); 8 steal-par lika. Invariantflaggor 4, båda sorterna äldre än releasen och bara observation: 3 "min strike, mindre taken" på en Ventrues Hidden Strength (invarianten drar inte av en motståndares prevention — alla 6 sådana flaggor i R2-rökarna sitter på en) och 1 pool-drift +2 hos Ventrue från Wider Views transfer-bränning (`this.pool += burnGain` skriver bara en not, ingen pool-händelse — v0.6.37).

Tester: sektion 141 (36 påståenden; ett minnesrelä mellan två bottar med 300 ms fördröjning för loppen, en hold mot en människa, pacing-slagen, tallyn, Roundhouse, stealen, granskningen, händelsetyperna, rushen, combat ends-raden, den färska taken-raden, 141o: en duell mellan två bottar som slutar på en superior Grapple, sedan samma Nosferatus nästa strid mot en ny Tremere, och 141p: en inferior Grapple, sedan Tremeren som såg den när den snipar i nästa strid). Mot v0.6.201 med dess egen cardfx: 32 röda, 4 vakter gröna på båda, ingen abort; de fem nya är röda på bytena före fixen också (31/5). F18-värdetesterna uppdaterade (Roundhouse 4, Slam 3, rush-räckvidd 8, 107d, 127k); 137f till den nya hold-regeln; 97d till enradsformen; test-cardfx 265/0 (6 röda mot v1.9.1-kompilatorn).

Grindar på slutbytena (elysium-bot.js 1d0ffac5…, test-bot-logic.js 6f2451ab…): node --check på varje ändrad fil; sviten 2043/0 ×3 (ensam); canary 57/0, HB1 11/0, hotseat 10/0, test-cardfx 265/0; check-versions överens. Destruktivt: sektion 141 på v0.6.201 4/32 (32 röda, 4 vakter, ingen abort), på bytena före läckfixen 31/5.

Handoff: `HANDOFF-to-main-2026-10-16-v0_6_202.md` — tre nya bot-emitterade rader och combat ends-formen för §12, inget att bygga; riggen och PLAYTEST.md: en strid mellan bottar pacas nu och säger varje steg; känd gräns: Deep Song i en strid med en människa (faserna behåller turens seat som agerande); och en notering om det gamla läckaget, som rör spel med människor också (en bott som inte manövrerade direkt efter en Grapple-strid i deras rigg var det).

Hittat i rökarnas blödningsräkning, INTE fixat (äldre — sedan v0.6.144): en bleed som studsas sent och sedan blockeras av sitt nya mål försvinner. Aktören vägrar alla block i sitt reactions-only-fönster ("blocks were declined this action"), fast studskorten (Deflection, Redirection, Telepathic Misdirection) säger att det nya målet "can attempt to block"; målet som ropade Block! släpper sedan bleeden som "contested, unresolved". 21 bleeds på rundans 12 rökmatcher, 3 av dem på v0.6.201 (en egen rök med den gamla botten, seed 4003 ×2) — alltså inte R2:s verk. Sedan den sena studsen 20 sep har varje studsdeck haft en gratis annullering i arenan; september- och oktoberläsningarna av deckbalansen kan luta på det. `ana-ledger.py` räknar det nu (en bleed `through` som ingen plats tog, med orsak). Förslag till Johan (kör?) i READ-ME-FIRST-2026-10-16c §6: aktören släpper in det nya målets block efter en studs; ett vägrat block kostar inte målet bleeden; en sektion med tre bottar på reläet; VANISHED = 0 som grind.

Medan R2 byggdes skeppade main klient v2.6.159 och v2.6.160 (PR #17, #18) med två svar till oss: Reduce-raden, bryggans reläer (`edgeTake` m.fl.), de fyra debug-punkterna från 15 okt och punkt 5 som "ögat" i Structured — allt vi hade öppet. Inget på tråden ändrar R2. Jag tar dem i nästa runda: deras canary-fall §5 (Reduce-raden) in i vår `test-bot-canary.js`, de skrivskyddade kopiorna till v2.6.160, guidens meningar (v2.6.159 i stället för "v2.6.158 och tidigare", ⌂ Home + Hold on för Reduce-raden vid hotseat, ögat) och hotseat-verktygets lyft (`AVR_CMB0`, `AVR_CMB_KEYS`, `tallyCombatMerge`). Som artighet körde jag deras nuvarande klientsvit och canary (v2.6.160) med v0.6.202-bunten bredvid: klientsviten 298/1 (bara embed-driften, inga skip), mains canary 69/0, och check-versions överens på det sammanslagna trädet.

Inte byggt (granskningens "Not done"): nätet vid strike (en hand strike räknas 0 på long), en motmanöver till close, Deep Song mot människa i faserna, och strike-steget är oförändrat (båda strikes annonseras och löses tillsammans).

## [JOHANS SVAR PÅ R1-OSÄKERHETERNA — bot v0.6.200 → v0.6.201] (16 oktober 2026, eftermiddag)

Johan mergade PR #15 (R1) och svarade på mina osäkerheter: (1) alla mänskliga spelare ska se bottarnas debug-händer, utan att vi lappar runt ett grundsystem som är sunt i botten — hans förslag: använd den befintliga visa-hand-funktionen och låt bottarna aldrig välja att inspektera andra bottars händer som visas genom endast debug; (2) en Reduce-rad (−1 …) på klientens Bleed-meny som interimslösning när en människa reducerar en botts bleed med ett kort botten inte känner — senare kurerade reduce-kort; (3) att sätta mål är spelarfostran, tvinga inte mål (flödet); (4) reduce-raden låg bara som önskemål i handoffen. Mitt förslag, en liten v0.6.201 före R2, godkändes: "yes kör på!".

Byggt som v0.6.201: (1) debug-handen går till HELA bordet igen (`openHand to:'all'`, som grundsystemet har det — varje människa ser den, spelare och åskådare, online och offline; rostens åskådarlista ingår i publiken, så en åskådare som ansluter mitt i partiet får handen direkt), och de ANDRA bottarna tittar bort från en seat som annonserat DEBUG-läge (`_lookAway`; `_debugSeats` nycklas på den frysta annonseringsraden `NAME (bot) is in DEBUG mode` och dess avsändare — även en äldre botts formulering; `leaves DEBUG mode` avslutar). Att titta bort = ingen handintel (grant ignoreras, en redan lagrad öppen hand släpps) och ingen Revelations [aus]-väntan besvaras av granten (målets privata revealHand svarar). Enda undantaget: min egen Revelations [AUS] på den seaten medan kortet är i spel (`_myRevAus`, sätts när botten lägger ut det) — vyn slutar med kortet. v0.6.200:s seat-för-seat-grants (åskådarna såg inget) är borta. (2) En MÄNSKLIG targets `NAME reduces the bleed by N.` (kortnamn inom parentes valfritt) sänker den agerande bottens bleed, aldrig under 0; 0 säger "goes through at 0" och flyttar ingen Edge, som i v0.6.200. Poolskada är ingen bleed och reduceras inte. (3) Händelsetyperna `reduce` och `debug` i samma release (händelseloggdoktrinen). Guiden: debugstycket (hela bordet, bottarna tittar bort), en Reduce-mening (raden är beställd av klientprojektet; tills den finns anger bottens rad hela beloppet och människan justerar sin egen pool), en skarpare målmening ("Set the target first" när handlingen riktas mot någon annan än preyn — Johans punkt 3: fostran, inte tvång). Handoff: `HANDOFF-to-main-2026-10-16-v0_6_201.md` — debugtooltipen stämmer igen (v0.6.200:s ändringsönskemål och `to:'humans'` dras tillbaka), Reduce-raden som konkret beställning, de två frysta debug-raderna till §12; v0.6.200-handoffen pekar på den nya.

Hittat under bygget, innan sviten kördes: mitt första reduceBy-mönster matchade även bottens EGEN reduce-rad (`NAME plays CARD — reduces the bleed by 2 (now 1).` — "(now 1)" lästes som kortnamn), så samma reduktion räknades två gånger (3 → 1 → 0). Upptäckt när jag läste koden mot 139d; mönstret utesluter nu tankstrecket och "(now N)", och 140d har en vakt för just det. Lärdom.

Hittat av releasens egen arenarök (seed 4002, 1 match): en Creeping Sabotage-tick tog Ventrue till 0 pool utan att den oustades — den dränerade sin Blood Doll till 1 och spelade två turer till. Creep-offrets hanterare saknade oust-kontroll; den oustar direkt nu (och predatorn får bountyn). Två syskon saknar den fortfarande — Smiling Jack betald ur pool utan vampyr, och Fames dränering vid egen unlock — v0.6.140:s granskning av ofrivilliga poolförluster är fortfarande skyldig (R2-kandidat). Lärdom.

Tester: sektion 140 (21 påståenden; tre LIVE mot riktiga servern — debug-granten når människan medan den andra botten tittar bort, en sen åskådare får handen direkt, och Alices Reduce-rad tar bottens bleed på 1 till 0 utan Edge; 140j är creep-oustet). Destruktivt mot v0.6.200 i en separat katalog: 13 röda, de 8 vakterna gröna på båda, ingen abort; en mutant utan åskådarlistan fälls av två påståenden. Åskådarfallet hittades i min egen genomgång efter första svitkörningen (servern skickar ingen grant till den som ansluter senare — bara bottens nästa sändning når henne). 139i omskriven till helbordsgranten (43/0 ensam).

Grindar: sviten 2006/0 ×3 på slutbytena; sektion 140 ensam 21/0, mot v0.6.200 13 röda + 8 vakter, ingen abort (en mutant utan åskådarlistan fälls av 140g och 140i); kanariefågeln 57/0; HB1 11/0; hotseat 10/0; mains klientsvit med v0.6.201 bredvid 287/1 (den väntade inbäddningsdriften, alla 11 LIVE-bottester gröna); check-versions grönt; test-cardfx inte körd (cardfx oförändrad). Arenarök (de fyra startdeckarna, Expert, pool 30, seed 4002): två matcher på slutbytena (261 s och 370 s), inga timeouts; ledgern parar varje bleed (lika, eller mer genom aktörens modifierare), stöldparen lika, creep-raderna parade; ana-inv 2 flaggor, båda det kända "mitt slag 1, Ventrue-motståndaren tog 0" (R2:s lead). Den första röken (en match på bytena före fixet, samma seed) är den som hittade creep-oustet; ingen tick nådde 0 i de två sista — 140j fäster det.

Inte byggt, ett förslag till Johan: en chattrad `reduce N` (som `bleed N`) skulle fungera redan i dag, utan att vänta på klientens rad.

Johans svar efter leveransen (PR #16, 16 okt): (1) fritt fram att kombinera fixar som passar i samma runda — creep-fixet var rätt; regeln står nu i bot/CLAUDE.md (designfrågor går fortfarande via förslag och "kör"). (2) En bott som ansluter efter debug-raden — går det ens? Kontrollerat i klienten och servern: online lägger klienten bara till bottar i lobbyn (`netBotWhy`: "only in the lobby"), offline vid Start, och en bott vars anslutning blinkar återansluter med sin token i samma process (`reconnect:true`) och minns raden. Kvar finns bara en kommandoradsbott som startas om och tar tillbaka sin plats via namnet (serverns name-reclaim) — en ny process utan minne. Känd gräns, inget byggt. (3–4) Reduce-raden och den offline debug-handen följs upp i klientprojektet via handoffarna (v0.6.201 §2; 15 okt §3 punkt 1, upprepad i v0.6.201 §4). (5) följs upp senare.

## [R1: REGLER OCH LÅSNINGAR — bot v0.6.199 → v0.6.200] (16 oktober 2026)

Johans svar (16 okt): ordningen R1→R2→R3→R4; bot-mot-bot-striden pacas när en människa sitter vid bordet (R2); Adaptives hopp stannar utanför Standard; poolfrågan stannar per bott vid politiska handlingar (svaret är varje botts insats i omröstningen) — senare ett enkelt "how will you allocate the damage?"-system (design efter R4); Haven Uncovered spelas inte förrän botten kan rusha igenom den (R4); vi kör riggen själva med `--dir`; ett hold stoppar även bottens egna stridsdrag (R2); debug gäller bara människor; de okurerade mastrarna väntar till R4. PR #14 (R0) är mergad.

Byggt som v0.6.200 (R1): (1) punkt 8 — Turn-based: SISTA Pass i ett bestritt odirigerat block avslutar det, vem som än säger det (en bott som passade sist väntade på en klocka som Turn-based aldrig armerar); påminnelsen läses när den avfyras och tiger när ingen återstår. (2) Punkt 9 — människans automatiska taken-rad (klienten skriver den när bordet stegar förbi Damage, alltså efter bottens ph 5) svarar bara på skadesteget. (3) Punkt 1 — en dirigerad handling är målets sak: `_obs` bär sikte (klientens ` Target: NAME's X.`, ärvt av kortets egen action-rad från spelraden före) och om handlingen är dirigerad (`_actDirected`: verb, eller spelade läget `dir` — 597 lägen i cardfx har det); bara målet (annars aktörens prey) frågar om kostnad eller får blocka; en seat tvärs över bordet tiger om alla odirigerade handlingar. (4) Punkt 15 — en reducerad bleed förblir reducerad på båda sidor (aktören läser målets reduce-rad, målet räknar aktörens +N ovanpå sin egen reduktion); en bleed på 0 flyttar ingen Edge och säger "goes through at 0". (5) Punkt 20 — Edgen sägs på tråden (`edgeTake`), en annan seats `edgeTake` släcker min, `edgePass` ger mig den. (6) Punkt 22 + Johans Tremere — ett kort är dött bara när ingen av mina vampyrer kan använda det: redo, torpor eller okontrollerad, annars kortlekens krypta (`_deadJudgeVamps`, alla fem anropsställen). (7) Creeping Sabotage räknas en gång (predatorns "ticks"-note borta; händelseloggen skiljer line / note / ack). (8) Stöldraden säger vad som rann av vid kapaciteten. (9) Debug bara för människor: `to:'all'` när ingen annan bott sitter vid bordet, annars seat för seat till människorna (publiken följer rostern, en seat som lämnar den revokeras ensam — ingen blinkning för människorna); Revelations [AUS] öppnar fortfarande för alla; `--debug` / `--no-debug-weights` på kommandoraden; botten läser rummets helper policy och vägrar debug vid ett Tournament-bord.

Tester: sektion 139 (42 påståenden, bland dem ett LIVE-test mot riktiga servern: en bleed som reduceras till 0 tar ingen Edge, en bleed på 1 tar den och `edgeTake` når människan). Destruktivt mot v0.6.199 i en separat katalog: 31 röda, de 11 vakterna gröna på båda, ingen abort. Test 127y läser nu den frysta creep-raden (den gamla note-formen räknas inte längre — avsikten).

Hittat under bygget: (0) i min egen granskning av ändringen: målet släppte sin Edge vid VARJE poolförlust som löstes genom det frågade fönstret — en människas referendum som kostade botten pool tog dess Edge. En odirigerad handling flyttar aldrig Edgen nu (`directed` följer med den frågade pendingen); ett eget påstående i 139d. (0b) arenaröken (v0.6.200 mot v0.6.199, 2 + 2 matcher, seed 4001) hittade en äldre bugg i samma familj: Larissas +1-bleed (VB) höjde handlingens siffra men inte agerande-posten som skapats före den, så bleed-totalen, modifierarna och resolve-raden bar den oboostade siffran — en bott-target tog 1 på hennes annonserade 2. Fixat + ett påstående; `ana-ledger.py` skiljer nu en reducerad bleed (`less, target reduced`) från en oförklarad (`LESS, UNEXPLAINED`). (a) min första vakt för "prey säger No block" testade fel väg — den riktiga raden armerar preyns eget odirigerade fönster (B1) först, så `_openAskedWindow` nås aldrig; vakten sätter `_obs` för hand nu. (b) Write-verktyget gör om `\u2019` till tecknet i filen; mina python-patchar måste matcha det riktiga tecknet. (c) Klienten har ingen reduce-rad för en MÄNNISKA som reducerar en botts bleed — botten behåller sin siffra (och tar Edgen även vid 0); människan sköter sin egen pool så inget går förlorat. Önskemål till main, inte en bugg.

Handoff: `HANDOFF-to-main-2026-10-16-v0_6_200.md` — bryggan behöver relaya `edgeTake` nu, debugtooltipen och PLAYTEST.md:s Edge-rad är inaktuella, 15 okt-punkterna om debug står kvar.

Grindar: sviten 1985/0 ×3 på slutbytena; kanariefågeln 57/0; HB1 11/0; hotseat 10/0; mains klientsvit med v0.6.200 bredvid 287/1 (den väntade inbäddningsdriften, alla 11 LIVE-bottester gröna); check-versions grönt. Arenarök (de fyra startdeckarna, Expert, pool 30): v0.6.200 mot v0.6.199 på seed 4001 (2 + 2 matcher) och 2 matcher till på slutbytena (seed 4002), inga timeouts; ledgern parar varje bleed (lika, mer genom aktörens modifierare, mindre genom målets egen reduktion), stöldparen lika; ana-inv 1 / 2 / 8 flaggor — mest "mitt slag 1, Ventrue-motståndaren tog 0" i båda versionerna, en rad i en Nosferatu-strid (stridsrundan, R2) och en pool-drift från en utrustnings poolkostnad som saknar händelse (`_doEquip`, äldre än den här releasen). Ny lead: Ventrue-mönstret och `_doEquip` till R2/R3.

## [SPELTESTET GRANSKAT + R0 — bot v0.6.198 → v0.6.199] (14–15 oktober 2026)

Mains speltest (PR #13: deras nya rigg spelade ett helt parti, en människa mot Hanna/Tremere och Viktor/Nosferatu, Standard 3 s sedan Turn-based) gav 24 punkter. Granskat punkt för punkt med tre oberoende läsningar av koden och probes mot en kopia av v0.6.198, sedan stickprovat: 16 riktiga bot-buggar plus ett sidofynd, var och en med rad, fix och runda i `docs/reviews/REVIEW-playtest-2026-10-14.md`. Det viktigaste: "Any presses?" väntar inte (människans automatiska taken-rad kommer efter att steg 5 öppnat och tas som svar i vilket steg som helst — inte bottens eget eko som main gissade), dödläget i Turn-based (blocket avgörs bara om den SISTA passaren är en människa), båda bottarna svarar på en riktad handling (ingen blockrätt prövas; en icke-målbott kan till och med förlora pool), Protected District nollställs av aktörens "+0 (= 3)", Immortal Grapple och range är ett race (200 ms väntan mot sändköns tempo — osynligt i arenan vid paceMs 0), Roundhouse kompileras som absolut skada, botten skickar aldrig `edgeTake`, frågor armerar sin klocka när de köas och inte när de skickas. Stölden (punkt 19) är regelrätt. Sidofynd: varje Creeping Sabotage-tick räknas tre gånger i `_knownLosses()` och blåser upp dynFloor i bot-mot-bot — arena och bänkar också.

Johan (14 okt): KRCG var blockerad i sandlådan, han laddade upp `vtes.json` och skapade sedan det privata repot `dtagent2000/VTES-Elysium-data` för tredjepartsdata (vtes.json v3, vtes-v5.json som referens, TWDA). Hans nya vtes.json var KRCG:s v5-format, som kompilatorn inte läser — v3 behålls; en v5-adapter först när KRCG fasar ut v3. Mitt fel som rättades 15 okt: TWDA-filen var VDB-formatet och heter `twda-vdb.json` för profilskriptet, inte `twda.json` (lärdom).

Johan (15 okt): "kör R0", plus två rapporter. (1) En testare ser inte bottarnas händer eller ash heap i debug-läge, offline eller på egen server. Utrett (läst och kört i huvudlös Chromium mot en kopia av servern): trådvägen fungerar; offline visar klienten aldrig handen (`openHandCardsFor` läser platshållarbrädet för en bott-plats), `botDebugAllowed()` läser offline-rutan även online (falskt "Tournament mode"), första bott-växlingen offline gråar Debug; ash heapen fungerar men syns bara via poolglobens meny. Klientpunkterna i handoffen; botpunkterna (`--debug` på kommandoraden med vägran i Tournament, den öppna handen bara till människor) i R1; guiden rättad nu. (2) Konstiga discards, t.ex. Tremere som kastade Theft of Vitae och sedan saknade strike: utan redo vampyr räknas hela handen som död och första kortet går (punkt 22) — alla Tremere-vampyrer har [tha], så Theft är bara "död" just då. R1.

Byggt som v0.6.199 (R0): `_openSlot` stannar efter 200 index och ett fullt Classic-led staplar nästa kort runt ledets punkter (`_stackSlot`) — mains enda hårda stopp; sektion 138 kör Classic-proberna i en barnprocess så v0.6.198 FALLERAR i stället för att hänga sviten. Guiden: mains §F, Release hold per bott, "curated to 100 %" rättat (fyra V5-masters gör inget än), taken-raden är en rapport, debug-handen och ash heapen förklarade. De skrivskyddade kopiorna är klient v2.6.158 / srv-2.6.46 / protokoll v2.6.158 — en fixtur (h17) flyttade sin stealth-tally in i handlingens tur (srv-2.6.42+ rensar räknaren vid varje tur); inget annat i sviten rörde sig. Datarader i root + bot CLAUDE.md, README, SKILLS; `bot/.gitignore` för TWDA-filerna. Gates: svit 1942/0 ×3, canary 57/0 och hotseat 10/0 mot v2.6.158, HB1 11/0, test-cardfx 261/0 (ingen drift). Handoff: `HANDOFF-to-main-2026-10-15-v0_6_199.md`.

## [HOLD ON STOPPAR ALLA KLOCKOR — bot v0.6.197 → v0.6.198] (12 oktober 2026)

Granskningen av VTES-Player levererades (11 okt, `REVIEW-vtes-player-2026-10-11.md`): deras bottar är enklare beslutsfattare än våra, deras metoder bättre på ställen (para benchen, räkna flips, §8-lagen inför metalagret, mät metalagret per beslut). Johan: "då finns det ett värde i att fortsätta i vår riktning ändå" — ja.

Mains svar på v0.6.195–197 (klient v2.6.141, reviderat 12 okt): allt kört grönt hos dem (klientsviten 241/0, kanariefågeln 57/0, live-tempotestet för första gången). Två saker till oss. (1) Johans princip, överenskommen med main: ett Hold on stoppar varje bottklocka som väntar på en människa, och klockan börjar om från början när holden släpps. Mains läsning av koden: block- och reaktionsfönstret och röstningen höll redan, men poolfrågan (steg ett svarade No — och botten sa No block — medan människan höll) och stridsstegen + skadesteget (steget gick ut, skrev nästa ph och gick vidare) gjorde det inte, och Turn-baserats påminnelse fortsatte under en hold. (2) Stöld mot en människa: klienten applicerar aldrig stridsskada på brädet, så i runda 2+ kan brädet visa blodet från före skadan — deras taken-rad ("now M") är färskare tills brädet ändras.

Byggt som v0.6.198: `_holdFreeze` (fryser varje öppen väntan: timer, deadline, påminnelse; en SKRIVEN "hold on" pausar nu blockfönstret precis som snabbfrasen), `_holdThaw` (släppet — från `_holdHook`, panelens Release hold och `_releaseDeparted` — armerar allt FRÄSCHT), arm-funktionerna kollar `_held()`, ingen stoppursringning vid ett hållet bord, en bott som är frusen inne i sitt blockfönster, ett steg eller sin röstning säger holden själv, den sena bounce-graceperioden står under en hold (`_heldTimeout`), en hållen väntan mäts inte av Adaptive och raden får `held: 1`, och ett släpp från vem som helst avslutar varje hållares egen paus tillsammans med bordets hold. En oberoende granskning av diffen hittade ett allvarligt fel — en paus som överlevde släppet lämnade röstningen utan klocka och utan knapp, och svalde målets Pass i blockfönstret — och fyra mindre (tysta frysningar, ett nytt parti som inte tinade, graceperioden som inte startade om när en hold kom och gick inom den, held-märken som följde med); alla rättade och fästa i 137. Stöldtaket läser människans taken-rad inom striden tills brädets blod ändras (`rec.bloodAt`, `_combatAt`). Ett beteendeskifte, fäst i 96e: en hållares röst (eller "No") i min röstning är ett svar, inte ett släpp — klockan står tills en flödesfras släpper. Svit 1933/0 (avsnitt 137, 73 påståenden, arton mutanter fångade, ingen genom att hänga), kanariefågeln 57/0 och hotseat 10/0 mot klient v2.6.141.

Rättelse: ▶ har varit ett filter sedan klient v2.6.139 — jag sa till Johan igår att den bara stegade block- och poolfrågan; källan var vår egen lista, inte klienten. Lärdom i learnings (12 okt).

## [KALIBRERINGEN + REFERENDUM-RADEN — bot v0.6.196 → v0.6.197] (11 oktober 2026)

Johan: "Vi kan köra på din rekommendation" (referendum-raden) "ska vi ta det tillsammans med nästa steg?" — ja. (1) Den fjärde tysta poolförändringen: bottens EGEN referendum-sving sägs nu som väljarnas ("I gain 3 pool from the referendum. Pool: 23."); raden typas av send() in i händelseloggen och ÄR därför ledger-posten (den explicita pushen behålls bara vid pool 0, där oust talar). De tre andra kan inte hända med dagens fyra starters. (2) TWD-profilen fick en femte andel, `press` (kort med press-läge eller en allierad som ger press, t.ex. Underbridge Stray), APPENDED — de fyra gamla andelarna oförändrade värde för värde; profilen byggdes om från samma källor (först verifierat byte-identisk med den gamla koden). (3) Kalibreringen (Johans beslut 28 sep: blockdoktrinen och Malkavians vink läser redan den TWDA-matade oppCombat — kalibrering, inte nya tegelstenar). Läst ur 72 matcher (1 842 block, 653 Malkavian-strider): Swallowed by the Night som manöver 50 gånger mot 45 som stealth, två tredjedelar av vinkarna på 4+ blod mot en handstrike för 1; ett block med intercept-kort vägde aldrig striden — torpor efter blockarens blod (ur react-snapshoten, inte härlett — den härledda siffran läste 0-blods-blockare som 1-blods, se learnings): 0 blod 75–95 %, 1 blod mot Nosferatu 50 %, 2 blod 35 %, 4+ ~1 %. Byggt: `waveNarrow` (vinka bara vid torporhot, eller när en manöver avslutar en farlig strid — P(press) < 0,5 ur press-andelen; aldrig mot ranged) och `blockCost` (blocket väger strid mot blöden; skademodell anpassad på blocken: landar 85 %, 1 + Poisson(λ), λ = 2,1 × (oppCombat − 0,29)). Bänk: vinken Malkavian-pinnad 24 + 24 (kontrollen = negN-matcherna lästa på Malkavians säte): +1,36 mot +1,53, inom bruset; regeln slog till 23 gånger, manövrar 15 → 7 → default 1. Första block-armen var INERT (96 prisade block, 0 veton): priset såg aldrig en LÅST blockare (wake-vägen, 14 av armens 0–1-blodsblock) och "desperat" slog till på jakter vid låg pool. Fixat (`_wakeRouteBlocker`, desperation bara för pool-skada) och ombänkat: bcN2 −0,11 mot negN2 +0,28 — men den INERTA armen på samma seeds gav −0,09 mot +0,20 (identiska beslut), och parat aktiv mot inert = −0,03 ± 0,43 → ingen förlust, default 1; 19 block släppta, variantens torpor 41 → 36. Upptäckt på vägen, inte fixat: ett sent steal-rad-race (1–2 % av stölderna: offrets runda har gått vidare när raden kommer) — öppen tråd. Lärdom: ett härlett mått kan vända ett fynd — läs registrerat tillstånd.

## [JOHANS TRE SVAR — bot v0.6.195 → v0.6.196] (10 oktober 2026)

Johan: (1) bygg combat ends efter förväntad / statistisk skada ("om motståndaren agerar blir det ju lättare att avgöra"); (2) vad är bästa lösningen för skadesteget?; (3) lista de fyra tysta poolförändringarna igen. (1) byggt som `decide('combat-end')` med värde i blod: sparat (deras skada + steal, högst mitt blod) + torpor 3 + [PRE]-unlock 1 − kortets eget blod (Majesty 1) − min egen strike (halv för wave) mot kortets värde behållet (0,6 × bordets farligaste förväntade strike / kopiorna på hand); KÄND strike när de deklarerat först (den agerande sidan först — Johans poäng), annars FÖRVÄNTAD 1 + 2 × oppCombat (TWDA-informerad); aggravated / torpor alltid, deras dodge aldrig. Bänk (designfilen återskapad från projektets design-balanced-serie-bal1.txt): ceV −0,11 ± 0,49 mot negV −0,12 ± 0,50, 24 + 24 Ventrue-pinnat — ingen förlust; 68 håll, 30 spelade mot kontrollens 49. Default 1. Under bygget hittat: en steal mot min vampyr drogs när raden kom — innan min strike valts — och kom aldrig tillbaka vid min dodge / combat ends (stjälaren ångrade sin vinst rätt → blod försvann; 2 rundor i den gamla bänken). Fixat (regel, ovillkorligt). (2) Skadesteget: ingen väntan när inget når människans minion, annars 1 × slidern. (3) Listan läst ur koden: politisk poolkostnad, allys poolkostnad, återlämnad poolkostnad vid block — inget av dem kan hända med dagens fyra starters — och bottens egen referendum-sving (Ventrue; syns i resultatradens villkor men saknar "I gain N pool"-raden). Johans beslut om raderna väntar. Verifieringen vid botbordet (mekanikserien `fix`, 12 matcher, seeds 9101–9112): 0 rundor där en vampyr avslutade striden / dodgade och ändå tappade blod till en steal; första combat-end-beslutet visar den parkerade stealen (Alice Chen 2 blod mot en steal på 2 — Majesty spelad, inget stulet). Men ledgerns PAR (stjälarens rad mot offrets, inte serietotalerna som förklarats som "capping") visade nästa fel: stjälaren fick kortets fulla tal även från en vampyr med 0 eller 1 blod — ungefär var femte steal-runda, i alla armar, kontrollen inkluderad, sedan v0.6.19. Regelboken: Steal Blood "moves blood counters ... from the target". Fixat ovillkorligt (`_stealAvail`): vinsten, radens `stole` och strike-valet använder min(kort, deras blod) — mot en tom vampyr behålls Theft och näven slår (1 skada de inte kan läka = torpor). `fix2` på samma seeds: stealparen 34/34 lika (59 = 59), 0 symptomrundor, handskakning 490/491, invariant-flaggor på kontrollens nivå (32 mot 31), en timeout (ett 38-turs slutspel, inget stopp). `ana-ledger.py` parar nu stealrader. Suite 1838/0. Lärdom: lös en effekt vid regelns ögonblick, inte när raden kommer — och testa en förklaring på paren innan den godtas. pkill -f med ett mönster i den egna kommandoraden dödade skalet — SKILLS.

## [MAINS SVAR GRANSKAT — bot v0.6.194 → v0.6.195] (9 oktober 2026, kväll)

Mains svar på v0.6.193 (klient v2.6.139 / srv-2.6.43): kunskapslagret är på i webbläsaren, tempots wire är byggd (helt tillstånd från servern, seedad Standard 3 s vid varje bord med bottar, ▶ bredvid 🤖 = ge botten ordet), en fråga om Majesty, ett erbjudande om `res: 1`, START-HERE föråldrad. Granskat mot v0.6.194: wiren stämmer exakt (testad med deras former; deras loggrad typas som `other`). Men en tidtagning av en hel stridsrunda mot en snabb människa hittade 20 s-glapp efter stegen: handskakningens väntan (`_awaitOppPress` / `_awaitOppStrike` / Tastes `_awaitOppTaken`) körde fortfarande askSecs efter att människan svarat — "No" på "Any presses?" i varje strid. v0.6.195: `_lineGraceMs` (0,3 / 1 / 1,5 s under ett tempo mot en människa), och svarsfönstret för människans press to end efter min press blir en ställd fråga på tempot (den tysta väntan var deras enda chans). `res: 1` på stridsstängningen (klientens egen konvention). TWD-skripten skriver `.js`-syskon; JSON-filerna återskapade byte-identiskt. START-HERE uppdaterad. Majesty: avsiktligt enligt Johans provisoriska regel (alltid), hans statistikriktning väntar på hans beslut. Gates: suite 1812/0, canary 57/0, hotseat 10/0, cardfx 261/0. Handoff: `HANDOFF-to-main-2026-10-09-v0_6_195.md` (ersätter den oskickade v0.6.194-handoffen).

## [TEMPOT — bot v0.6.193 → v0.6.194] (9 oktober 2026)

Sandboxen var nollställd: arbetskatalogen återskapades från 28 sep-zippen plus projektfilerna (table.js, hotseat-verktyget, hotseat-gaten, deckarna); baslinjen v0.6.193 kördes grön (1749/0, 57/0, 10/0) innan något ändrades. Senaste handoffen till main (v0.6.193 + tempospecen) levererades på nytt.

Johans nästa steg: tempot i botten enligt `spec-bot-tempo-2026-09-27.md`. Kartläggningen av väntfunktionerna gav siffran bakom spelarnas klagomål: klienten spawnar bottar med `askSecs: 20`, och ett stridssteg väntade `max(6, askSecs × 3)` = 60 s. Byggt: ett tempo-objekt (`_waitPlan`) för varje väntan på en MÄNNISKA (blockfönster, reaktionsfönster, poolfrågan, röstklockan, de sju stridsstegen, skadesteget), satt av `botcfg` (partiella skrivningar, första skrivningen fyller med Standard/3,0); Standard = slidern (stridssteg 2×), Adaptive = 1,5 × människans medianssvarstid under taket + regelstrikta skip (ingen fråga människan inte lagligt kan svara på — en låst vampyr med kort på hand kan vakna, så den frågas), Turn-based = ingen klocka, Bot-knappen ger ordet (`resolve-phase`, `resolve-vote` nya rungs i `status()`/`step()`), påminnelse 120 s / pass 240 s. Ingen botcfg = exakt som förut; bot-mot-bot orört. `wait`-spårrader + `ana-wait.py`. CLI `--tempo` på bot och table.js (v1.2.0) tills klienten skickar botcfg. Gates: suite 1803/0 (sektion 128, 54 assertions; batteriet avbryter på v0.6.193), canary 57/0, hotseat 10/0, cardfx 261/0. Handoff till main: `HANDOFF-to-main-2026-10-09-v0_6_194.md` (panelen, meddelandet, relayn, de tre besluten).

Lärdom: en härledd default multiplicerar någon annans knopp (askSecs × 3 med klientens askSecs 20) — se learnings 9 okt.

## [GUIDERNA + CHASE-PRESSEN — bot v0.6.160 → v0.6.161] (22–23 september 2026, samma chatt)

v0.6.160 THE VICTIM OF A STEAL: Johans fråga om hur Theft räknas visade att offret för en steal aldrig tappat blod sedan v0.6.19. Fixat; cmb6 blev det mest balanserade bordet (Tremere 0/1 → 3/12, offren jagar långt mer). cmb6m (Malkavian-sätet utan combatMind, 9 matcher): Malkavians vink var INTE orsaken till dominansen.

Johan frågade om bottarna spelar rimligt mot regler, strategi och Black Chantrys guider. Läst: Nosferatu-, Tremere- och Malkavian-guiderna (help sheets på blackchantry.com). Avvikelser: Tremere-guiden har Theft + press (Apportation) som kärna och manöver till long främst mot Nosferatu — vår snipe gör tvärtom; Malkavian-guiden ser Swallowed-manövern som smal (0 blod, eller mot en Nosferatu som inte kan pressa) — stämmer med cmb6m; Nosferatu-guiden: Stray-press när motståndaren manövrerar till long, Grapple mot Majesty/Theft-lekar; alla tre guiderna säger blockera inte Nosferatu/Tremere om du inte måste — vår blockdoktrin blockerar med tomma vampyrer.

Johans beslut: blockdoktrinen och Tremeres Apportation-val väntar till kunskaps-/metalagret (dynamisk förväntan om motståndarlekar, inte hårdkodade hörn); Nosferatus Grapple mot combat-ends täcks redan av skaderegeln när det spelar roll; Stray-pressen byggs nu → v0.6.161 THE CHASE PRESS. Malkavian-vinkens avsmalning (guidens två villkor) är inte beslutad.

## [KOMPLETT COMBAT-LÄSNING — bot v0.6.159] (22 september 2026, samma chatt)

Johan bad om nästa combatrunda för en komplett analys. De omatchade ronderna i cmb4 var en KAPPLÖPNING: mottagaren av en press startar nästa rond direkt medan pressaren sitter kvar i sitt eget press-fönster — lika långa fönster gav "opp-silent" på ena sidan och en ensam extrarond på andra. Fix `_strikeWaitMs(continued)`, rond 2+ väntar två fönster. cmb5: 342/343. Sex serier på samma seeds i REPORT-combat-komplett.md: mekaniken verifierad rakt igenom (0 bortkastade Grapples, Taste 9/9 efter kortrond, Tremere och Malkavian manövrerar). ÖPPET: Tremere har blivit svagare fyra serier i rad (14 → 10, 2, 7, 1 VP) — föreslaget experiment: samma seeds med combatMind=0 bara på Tremere-sätet. Malkavians dominans är en race-fråga, Nosferatu är strukturellt svag (ingen manöver i startern).

## [SEIZE THE MOMENT — bot v0.6.158] (22 september 2026, samma chatt)

Johans ruling: en torpor-säker rush ska trumfa permanents-first om den sannolikt går igenom (inte blockas av en annan vampyr) — "combat handlar om att ta tillfällen i akt". Byggt: rush plockas på 97 (över permFirst, under 99+-strukturvalen) när skadan överstiger målets blod i en rond, eller med Grapple bakom en skadekälla över två, och målets kontrollant saknar ANDRA olåsta vampyrer/allies (`_rushLikelyThrough`); aldrig med rusher på 0 blod. Sektion 127. Suite 1649/0 ×3, canary 37/0, hotseat 10/0.

serie-cmb4 (seeds 9981–9992): Nosferatu rushade 7 gånger (cmb3: 1, cmb2b: 4), 6 gick igenom, 1 blockerad; "seize the moment" avgjorde 3 av dem, alla igenom; permFirst vann bara 2 av 12 rush-lägen. Malkavian tog 12 torpors (cmb3: 8). Nosferatu 0 VP — n = 12, lekens svaghet mot bleedern står kvar. Handskakning 337/344 (98 %) — 7 omatchade ronder att titta på nästa gång (ingen spökrond hos Nosferatu).

## [RUSH-KITET + TYST LONG — bot v0.6.157] (22 september 2026, samma chatt)

Johan bad om en sammanfattning och om det gick att deploya. Svar: ja, med ett förbehåll — botten går oftare till long, och mot en tyst människa antogs regelbokens näve för 1 där den ska ge 0. Johan: kör förbehållet först, sedan Nosferatus rush-prio. Byggt: `_oppHasRanged` + tyst motståndare på long = 0; `_rushExpectation` får kitet (grapple / strikeCard / crows / reach — Grapple bakom en skadekälla dubblar räckvidden), rush-poängen ×1.5 / 1.15 / 0.75, målvalet läser samma räckvidd. Sektion 126. Suite 1642/0 ×3, canary 37/0, hotseat 10/0.

serie-cmb3 (seeds 9981–9992) vs cmb2b, `ana-rush.py`: poängen rangordnar som avsett (kit 2 mot ett 1-blods mål: 6.05; utan kit 0.75×), men FYND: 7 av 13 rush-lägen avgjordes av `permFirst` (strukturellt val, poäng 98) — bl.a. en Grapple + Roundhouse-rush mot ett mål på 1 blod förlorade mot att lägga ut Raven Spy. Rush valdes 1 gång (fists mot 1 blod, ett riktigt torpor-skott). Tabellsiffrorna (Tremere 2 VP) är trajektoriebrus, v0.6.157 ändrar inget för Tremere mot bottar. Fråga till Johan: ska ett torpor-säkert rush-läge (kit ≥ 2, reach ≥ målets blod) bryta "permanents first"?

## [COMBAT MIND — bot v0.6.156] (22 september 2026, ny chatt)

Johan: kvarvarande stora block i ordning — combat-förfining och cardfx-svepet först (bottarnas grundnivå), sedan kunskapslagret (twd_decks.json), sist metalagret. Yardstick-lekar V5 Nosferatu och V5 Tremere. Läsa före bygge: serie-cmb1 (balanserad design, seeds 9981–9992, v0.6.155) lästes med nya `ana-combat.py` → REPORT-serie-cmb1.md: Grapple 8 av 17 med nävar, superior Grapples press aldrig konsumerad, Taste 8 av 12 efter nävar, Tremere noll manövrar på 133 ronder (`wantLong` krävde rangeLong-kort; Theft är bara "ranged"), Malkavian noll combatspel, Hidden Strength spelad som press, 52 ronder med blod ≤ 1 (blockbeslutet), tracen saknar range/motståndarslag/skada.

Johans regler per lek (i minnet och i CHANGELOG): Grapple bara bakom Roundhouse/Crows/strength; buntade pressar; press vid kortrond eller torpor-skott; Tremere manövrerar först, pressar med fler Thefts / Magnum; alltid press mot 0 blod; Malkavian sparar Swallowed till vinken; Ventrue pressar EMOT, fortsätter bara för torpor mot icke-combatlek. Bott först, klientspec sedan.

FYND UNDER BYGGET: sedan v0.6.114 (16 sep) nådde ingen press / manöver / Grapple / Crows en motståndarbot — fraserna gick till log-tier (eller togs bort som "dubbletter"), parsers körde bara i `_onChat`. En pressande bot slogs ensam i rond 2 och Theft stal blod från ingen. Åtta seriers combat-del sedan dess är kontaminerad (bal1–bal8, home2, null4). Fix: `_parseCombatNarration` matad från båda tiers + frusna fraser som `note()`. Johans beslut: beslutsfynden står (bottens egen kod), bordsutfallen inte; tre serier på samma seeds isolerar effekterna — cmb1 (gamla bytes) → cmb1b (nya bytes, `combatMind=0`: bara handskakningen) → cmb2 (allt). cmb1b: 338/338 ronder matchade på båda sidor.

Byggt (knob `combatMind`, 0 = v0.6.155): `_wantGrapple`, `_bundledPress` (superior Grapple, Hidden Strength [FOR] som prevent — `_bestPreventFor` föredrar press-moden vid lika), `_wantPress` (torpor-skott ur motståndarens EGEN taken-rad `now M`/torpor — bordet kan vara ett slag efter; kortrond; snipe räknar steal 1; wave bara torpor-skott), `_wantPressToEnd`, deras "presses to end" cancelar min, `_bestPressFor` utan prevent-buntar, Taste vid förlust ≥ 2, `DECK_STRATEGY.combat` chase/snipe/wave i `_wantLong`, handstrikes på long = 0 (Roundhouse ej erbjuden, näven "for 0" på strikeC), steal på long även vid full kapacitet, stealth-prio rent kort före Swallowed, `combat-round`-trace-rad + `ana-combat2.py` med integritetsmått. Fyra småfel hittade av egna tester/förhandsläsning och lagade i samma release. Sektion 125 (32 asserts); 37h/i/k/n låser v0.6.155 under `combatMind: 0`. Suite 1632/0 ×3, canary 37/0, hotseat 10/0. Arena v1.4.3.

cmb2 (slutbytes, `serie-cmb2b/`): se REPORT-serie-cmb2.md — Grapple nu bakom Roundhouse, Tremere manövrerar (Apportation som manöver först), Malkavian vinkar, Ventrue Majesty som förut; Nosferatu TAPPAR mot vinkande lekar eftersom startern saknar manövrar (nävar 0 på long) — lekens svaghet, uppföljning i rush-prion (`decide('action')`: rusha med Crows + Grapple/Roundhouse på hand i stället för att vänta på att bli vinkad bort). Sandlådelärdomar: håll seriens bytes stilla (fixar i `next/`, omkörning), en detached chain dör vid vändgränsen (cmb2-pre tappade match 11–12).

Nästa: klientspec till main (strike-snabbfraser i frusna grammatiken, `rng`/`pr` i tally, Range Close/Long + Set range, Press End/Continue, striketyper i räknare + vampyrmeny), sedan fasrutinen (`combatPhases`) när klienten har kontrollerna, sedan cardfx-svepet i egen chatt.

## [SJÄLVGRANSKNING — bot v0.6.153] (22 september 2026, samma chatt)

Johan bad om osäkra ställen. Tre namngivna: domarklockan hölls inte medan ett uppskjutet duellkort väntade ut beat + chat-hold (med `--ask-secs 3` kunde "block succeeds" deklareras över kortets huvud), två bubblor tätt ihop ("Who blocks?" + ahead-raden), och oklart om klientens `fx` bär `who`. Han sa kör på 1+2 ihopbakat: `_askTimeout` väntar i 400 ms-steg (max 20) medan `_deferredPending()` håller, en främmande tally-rörelse under min kontest startar om klockan, och ahead-raden bär who-blocks-tipset själv och släcker gracen. Ingen beslutslogik ändrad. Suite 1589/0 ×3 (sektion 123). Johan laddade upp klient v2.6.125: canary 37/0, hotseat-gate 10/0; `who`-frågan stängd genom läsning av bridgen (alla verb bär `who`, fx inkluderat) — pausankaret ser samma händelser offline som online.

## [ANDNINGEN — bot v0.6.152] (22 september 2026, ny chatt)

Johan testade 1v1 mot malkavian: Govern på superior lade +1 stealth på Tallyn (1-0), men vid hans Block! spelade botten direkt ett stealthkort. Rotorsak: first look kördes i samma tick som ropet (före klientens 120 ms-tally) och golvade `need` till 1. Andra fyndet: pausen (`_pace`) mätte bara från bottens EGEN senaste handling, så ett "No block" 6 s efter Block? hittade pausen förbrukad och nästa steg fyrade omedelbart; blockduellens kort var dessutom helt opausade. Byggt: pausankaret = senaste bordshändelsen (min eller någon annans), paceMs 1500, reactPaceMs = paceMs, `_afterBeat`; first look efter pausen och "<vamp> currently has N stealth" när räknaren redan är min (väntar på spelad intercept); intercept via chatt `N` / `+N` från blockaren (Johans design). Suite 1582/0 ×3 (sektion 122; fixture 11 kräver nu ahead-raden + `+1` via chatt). Canary/hotseat-gate/HB1 ej körda (klient-html saknas i projektet). Nästa: Johans människobord offline på v0.6.152, sedan kunskapslagret.

## [MAIN SVARADE PÅ PARITETSSPECEN — bot v0.6.151] (21 september 2026, samma chatt)

Main skeppade alla åtta spec-punkter (klient v2.6.124, srv-2.6.38) och lämnade tillbaka fem fynd. Omkört med v0.6.150: verktyget `asis` — inga släppta verb, tallyNet 0; grinden 9/0 (tally JA, bounty JA); canary 37/0; HB1 11/0. B1 stämde och var en äkta bugg ÄVEN ONLINE: `_onGiven` matchade värdvampyren på namn, tråden bär kort-id — en människas Fame / Pentex på bottens vampyr armerade aldrig hakarna; vår egen fixtur (102c) hade fel trådform inbakad. B2 stämde och var MÄTT: 9 oust-avläsningar / 3 egna bounties genom en brygga som reläar bounty — `_oust()` skickar nu bounty före pool-0-boarden. Svar till main: C3 nej (30 s-hjärtslag), C4 `wall` kvar som fixtur, D — filtret för bottars 'Hold on…' KAN TAS BORT (läst + soakat utan filter: 9 bord, 349 reläade holds, 0 fastnade). Johans beslut: B4 (un-oust) noteras som öppen avvägning tills feedback efterfrågar den. CLAUDE.md 70.

## [SISTA SVEPET AV NIVÅNAMNEN — bot v0.6.150] (21 september 2026, samma chatt)

Johan frågade en sista gång före handovern. Jag svepte efter ställen där de gamla namnen fortfarande talar till en MÄNNISKA och hittade tre: START-HERE-BOTS.html (bundlas till main; kallade Grinder 'the default'), elysium-bot-table.js (standardrotation shark,grinder,novice; hade varnat 'unknown persona' för ett giltigt alias och döpt platserna till Shark / Grinder) och bottens egen kommandorad (utan --persona = basvärden, inte expert). Alla lagade. Medvetet orört: `new Bot({})` utan persona behåller basvärdena — svitens fixturer står på det. Lärdom: ett namnbyte är inte klart förrän man grepat efter namnet i allt som LEVERERAS, inte bara i det som körs. CLAUDE.md 69j.

## [ERFARENHETSNIVÅERNA — bot v0.6.149] (21 september 2026, samma chatt)

Johan: persona-toggeln är SIMULERAD ERFARENHET → nivåerna heter nu Novice / Experienced / Expert (förr novice / grinder / shark), och EXPERT är standard för klientens bottar. Bottarna är inte publikt lanserade, så klienten byter skarpt i samma handover (spec punkt 5). I botten: nya nycklar, gamla namn som alias (`personaKey`), okänd sträng → expert med loggrad (föll förr tyst till basvärden), manifestet bär det kanoniska namnet. Värdena orörda — samma beslut. Svitens ~135 gamla strängar står kvar med flit som aliasbevis. Ärlig lucka: namnen lovar ren erfarenhet, men `aggression` 0,8 / 1,0 / 1,2 är temperament — tas i persona-genomgången. LÄSREGEL för äldre docs: shark = expert, grinder = experienced. CLAUDE.md 69i.

## [SJÄLVGRANSKNING FÖRE HANDOVERN — bot v0.6.148] (21 september 2026, samma chatt)

Johan frågade om något i koden såg osäkert ut. Jag läste om mina ändringar och hittade tre saker, alla lagade: (1) tally-nätets spegel ADDERADE en andra blockerande minions intercept till den förstas och gav den ingen första titt — nu nycklat på minionens namn i raden (intercept hör till minionen, som `_setTallyB`); (2) verktygets lista över släppta verb var hårdkodad och hade fortsatt rapportera `tally` som släppt efter att main skeppat den — läses nu ur den lyfta källan; (3) grindens rundtak 30 → 60 mot flakighet. Kontrollerat utan anmärkning: ingen falsk oust vid given, raden kommer alltid efter ropet, bältet är längre än rop → wake → intercept, klienten dubblar aldrig bottens bounty. Kvar och kända: CLAUDE.md 69h.

## [HOTSEAT-NÄTET — bot v0.6.147] (21 september 2026, ny chatt)

Johan ville aligna botthanteringen online ↔ offline/hotseat (snabbast att testa där, och solo-spelare tar den vägen). Jag läste klient v2.6.121 själv och BYGGDE ett mätverktyg i stället för att bara läsa: `elysium-bot-hotseat.js` lyfter `hotBridge` + `hotFanOut` ordagrant ur klientfilen och kör riktiga bottar genom dem som `hotRunBotTurns` gör.
FYND på v0.6.146: bordet FRYSER 4 av 4 vid första turen som lämnas till en oustad bott (svepet går på `_cfg`, väntar på `pass` utan timeout; botten ignorerade turen) · tally-hålet i siffror (0 stealth-kort, 0 andra-tittar på 35 blockförsök) · NYTT och störst: klienten skickar aldrig `deckName` (online OCH offline) → inga axlar, hållning 'resisting', ingen stealth-axel, ingen permFirst vid något mänskligt bord sedan v0.6.107 · bounty / roster saknas, `awardBountyHot` skriver i en blob bot-platser inte har · Ventrue saknas i menyn, persona-default `grinder`, `openHand` släpps.
BYGGT (bakåtkompatibelt, botten först): oustad bott passar · lekidentitet ur objekt / namn / lista · TALLY-NÄTET (ingen främmande tally sedan ropet → motpartens siffra ur loggraderna, lokal spegel, första + andra titten; står still när en relä bär tally: 0 utlösningar mot 25) · oust + bounty utan server (bara `srv` = hotseat-bridge). Grind `test-bot-hotseat.js` H1–H9, svitsektion 121. Handover: `spec-hotseat-parity-2026-09-21.md`.
SANDLÅDELÄRDOM: bakgrundsprocesser dör när chattvändan tar slut — `setsid nohup` + pollning med `sleep` i SAMMA vända. Persona-default är Johans beslut (min rekommendation: shark tills persona-genomgången är gjord). CLAUDE.md 69.

## [ONLINE MOT HOTSEAT — DE ÄR INTE LIKVÄRDIGA] (21 september 2026, samma chatt — läst, inget byggt)

Johan frågade om bottarna beter sig likadant online och i hotseat. LÄST i klient v2.6.121:s `hotBridge`: bussen (v2.6.95+) fläktar en botts log / say / chat / board / fx till övriga bottar och människans log / say till alla bottar; pass, drag, giv, tur fungerar; players() bär bot-flaggan.
HÅLET: `tally` släpps — `_fromBot` slutar med `default: break; // tally/bounty/openHand/... tolerated silently`, och människans räknare skickas bara online. Min relay-spec 11 sep hade tally i regel 1; main byggde bussen utan den. Följd: blockdomar mellan bottar räknas på halva talliet,
och sedan v0.6.143 är det VÄRRE genom mitt eget bygge: första stealth-titten VÄNTAR på bot-blockarens tally (som aldrig kommer → inget stealth-kort spelas mot en bot-blockare i hotseat) och båda andra-tittarna är tally-drivna (avfyras aldrig). Saknas också: bounty / roster-vid-ändring,
give / given. INGET TEST TÄCKER DETTA: HB1 kör bottens eget batteri utan brygga, canaryn har ingen hotBridge-assert. Alla releaser 18–21 sep är mätta ENBART på servern. Förslag: tally-fläkt till main · ett SKYDDSNÄT i botten (ingen tally inom kort frist → gamla första titten) ·
en bryggharness i sviten. CLAUDE.md 66.

## [RÄTTELSE: kort utan effekt] (21 september 2026, samma chatt)

Jag listade "mest spelade kort helt utan effekt hos oss" och fick med Kine Resources Contested, Parity Shift, Information Highway och Ashur Tablets — kort som bottarna SPELAR. Johan såg det direkt. Felet: mitt skript tittade bara på `modes`; effekter ligger också i `ref`
(omröstningsvillkor), `actGrant`, `handler` och `archetype`. RÄTTAT: 86 % (inte 81 %) av bibliotekskopiorna i TWD 2019+ har en modellerad effekt. Verkligt mest spelade UTAN effekt: Villein 4127 kopior, Delaying Tactics 922, Direct Intervention 796, Emerald Legionnaire 741,
Heart of Nizchetus 663, Giant's Blood 653, Banishment 478, Seduction 442, Obedience 405, Jake Washington 365, Archon Investigation 351, Carfax Abbey 351, Torn Signpost 343, Call of the Hungry Dead 321. (Seduction är `src: hand` men bär bara en note — värd en egen titt.)
Lärdom: kontrollera ett skripts definition av "har effekt" mot ETT kort jag vet att botten spelar innan jag rapporterar en lista.

## [MULTIKLAN: DISCIPLINERNA ÄR ARKETYPEN] (21 september 2026, samma chatt — testat, inget byggt)

Johan: i multiklanlekar är det disciplinerna som spelar roll och kan räknas som arketyper; klan och disciplin har båda värde, disciplinspridningen blir viktigare ju mer blandade klanerna är; men en multiklanlek pekas nog ut snabbt (specifika vampyrkombinationer — anarklekar,
nyare sabbatlekar med Paths, traditionella obfuscate + dominate). TESTAT på de 1138 TWD-lekarna utan klan (200 undanhållna, antal bounce-kort): globalt snitt 3,56 → disciplinspridningen som de två första vampyrerna delar 2,74 → efter 1 exakt vampyr 2,65 → 2 vampyrer 1,75 →
3 vampyrer 1,41; effektivt antal kandidatlekar 179 → 22 → 9 (av 4562). Båda halvorna av hans påstående håller. Vanligaste disciplinpar: obf + pre 112, ani + pre 53, aus + obf 51, dom + obf 45. FÖRBEHÅLL: alla 1138 har trait "star" — "ingen klan" kan betyda "stjärnvampyrlek"
snarare än strikt multiklan; fältets betydelse ska kontrolleras. → kunskapsfilen nycklas på klan (om den finns) + gruppfönster + kryptans disciplinsignatur. CLAUDE.md 65c-MULTICLAN.

## [KRYPTGRUPPEN SOM NYCKEL] (21 september 2026, samma chatt — testat, inget byggt)

Johan: vampyrernas GRUPP spelar mycket stor roll för vilken lek som spelas — grupp 6-malkaver har inte längre Dementation som klandisciplin utan Dominate; gruppen avslöjar mycket särskilt för äldre lekar och i skiftet legacy → V5. TESTAT på 202 Malkavian-TWD efter högsta
kryptgrupp: G1–2 Dominate 19–35 bibliotekskort / Dementation 0 · G3–5 Dementation 6–20 / Dominate 0–4 · G6–7 Dominate 19–31 / Dementation 0 — tre olika lekar under ett klannamn, rent delade av gruppen. Som prediktor (398 undanhållna lekar, antal bounce-kort): bara klan 2,12 →
klan + GRUPPEN på EN vampyr 1,60 (lika mycket som två exakta vampyrer, 1,58). Grupperingsregeln är ett HÅRT filter: 4559 av 4562 TWD-krypter ligger inom två angränsande grupper. → kunskapsfilen nycklas på klan + gruppfönster. CLAUDE.md 65c-GROUP.

## [KUNSKAPSLAGRETS DATA — TWD + STARTERS] (21 september 2026, samma chatt — läst och förtestat, inget byggt)

Johan laddade upp `twd_decks.json` och föreslog: TWD + startlekarna (ur vtes.json) som bas; för varje vampyr och kort motståndaren spelar ökar träffsäkerheten för vilken arkivlek den liknar, och odds viktas dit; startlekarna som GRUND tills korten säger mer
(V5-starters är hyfsat representativa; en klan kan spelas på flera sätt — malkavian stealth + vote). Jag svarade också på hans pre-alpha-fråga (malkavian och ventrue kan bjuda på en bra match vid ett starterbord; osäkerheten är det mänskliga bordet — spela 3–4 matcher själv först).
LÄST: 4562 TWD-lekar 1995–2026 (1609 från 2019+), ALLA kort-id:n löser mot vår vtes.json; vtes.json ger 101 precon-lekar (hela V5-familjen). Hans exempel stämmer: 91 % av Ventrue-TWD kör Deflection, snitt 6,4. FÖRTEST (leave-one-out, 150 lekar, förutsäg antal bounce-kort):
fel 2,26 med bara klansnittet → 1,58 efter TVÅ VAMPYRER → 1,15 efter 6 bibliotekskort → 1,10 efter 10. Kryptan är starkaste tidiga beviset. Förslag (CLAUDE.md 65d): offline-byggd kompakt kunskapsfil, prior som KNAPP (starters vid utfyllnadsbord, TWD vid turneringslikt),
uppdatering per sedd vampyr / spelat kort, MIXTUR i stället för "mest lik lek", validering offline FÖRE någon match.

## [KUNSKAPSLAGRET — JOHANS KONCEPT] (21 september 2026, samma chatt — analys, inget byggt)

Johan: malkavian är erkänt den starkaste originalstartern (har vunnit turneringar ur boxen) — väntat att den drar ifrån när logiken vässas, kanske ned igen med ett metalager; den ska spela så bra den kan, en stark malkav passar syftet (1–2 bottar som fyller platser).
Att dela upp pumpar är bra särskilt när bounce väntas; FÖR: mindre risk; MOT: stealth kan behövas på två handlingar och man offrar chansen till full stack (Govern + Conditioning) två gånger — explosiv bleed mot säkrare frammarsch; båda rätt ibland, det är ODDS om min
egen lek OCH motståndarens. KONCEPTET: om min lek är oddsen exakta, om motståndaren är de REAKTIVA (det bordet sett); ett KUNSKAPSLAGER gör dem PROAKTIVA (TWD-snitt per arketyp, spelade kopior avdragna, kvarvarande kort → P(på hand)); tills TWD finns: en liten bank ur
DISCIPLINERNA och våra bottlekar — Dominate och Auspex bär bounce. KONTROLLERAT: i hela cardfx ligger bounce i exakt dom (3) och aus (2); våra lekar bounce 10 / 8 / 6 / 4 / 0 / 0; P(>= 1 bounce på 7 kort) = 0,50 vid 7 av 77, 0,37 efter 4 spelade. Förslag i tre nivåer
(K0 disciplin-priors · K1 lekmallar · K2 odds) + konsumenter i CLAUDE.md 64e.

## [SERIE-BAL8 — RESERVEN ÄR NÄSTAN OVERKSAM, OCH BAL7 VAR DELVIS TUR] (21 september 2026, samma chatt)

v0.6.146 på balanserad design (seeds 9981–9992) mot bal7. 12 av 12 last-standing, 0 timeouts, median 8,5 varv (en match på 17), prisdomaren ren. D1 FÖLL: reserven var ≠ 1 i bara 4 av 28 beslut (14 %) — reserv 2 ×3 ("poolen nära kritiska nivån"), reserv 0 ×1
("bytet nära fall"). PUMP-REGELN SLOG ALDRIG TILL: min 40 %-gräns kräver ungefär tre tunga träffar på sex mot MIG; verkliga pumpandelar här är 10–25 %. "Rikt bibliotek" slog heller aldrig till. D2 höll (33 bounces), D3 höll (fem på total 4+, varav en 6:a), D6 höll.
MÅTTSTOCKEN IGEN: bal7 och bal8 skiljer sig i FYRA beslut om total 1 — ändå gick malkavian från 4 vinster / 21 VP till 8 / 29 och ventrue från 5 / 17 till 0 / 6. bal7:s "jämnaste bord" var delvis tur. Poolat 24 matcher: malkavian 12 v / 50 VP (2,08 per match) ·
ventrue 5 / 23 · tremere 5 / 17 · nosferatu 2 / 6. Det som HÅLLER över båda serierna på beslutsnivå: bounces 33–37 (bal6 18), fångster på 4+, clog ~80, draw-stealth 31–35. BEHÅLL v0.6.146 (ofarlig, bättre spår) men ärligt: timingen (144) och den överblivna bouncen (145)
ändrade beteendet stort och upprepbart; den dynamiska reserven (146) gjorde det inte. Rapport: `serie-bal8/REPORT.md`.

## [DEN DYNAMISKA BOUNCE-RESERVEN] — bot v0.6.146 (21 september 2026, samma chatt)

Johan: Taste of Vitae ska paras med en stor skaderunda (Crows och / eller Roundhouse) — läst: 47 av 73 Taste-spel följde en runda med bara händer eller ensam Grapple (CLAUDE.md 61); Fame-kedjan och Taste NOTERAS, "stackars Nosferatu får vänta lite".
Hans beslut: kör klart BOUNCE-stråket först och gör tröskeln mer dynamisk enligt mitt förslag — det påverkar ventrue, malkavian och tremere. BYGGT: `_bounceReserve()` = hur många bounce-kort som ska STANNA på handen efter att en total på 1 skickats vidare:
1 som grund; +1 när predatorn landar 3+ på 40 % av sina bleeds (`_pPump`, ur REALISERADE träffar, prior 0,25 × 4); +1 när min pool ligger inom 4 från kritiska nivån och bytet är friskt (pool > 15); −1 när mitt kvarvarande bibliotek är 10 %+ bounce och predatorn sällan
pumpar; 0 när bytet är 1,5 turer från fall. `bounceSpare N` låser den fasta v0.6.145-tröskeln, 0 = aldrig på total 1. defence-plan-raden bär nu bounceN och reserve. Bounce-andelar i biblioteken: ventrue 7,8 %, malkavian ~11 % → jag satte "rikt bibliotek" vid 10 %
(min bedömning, omätt). Sektion 120 (11), `diag-120.js`. Suite 1525/0 ×3, canary 37/0, HB1 11/0. `serie-bal8/PREDICTIONS.md` (D1–D6) registrerad — väntad effekt LITEN (regeln rör bara totaler på 1).

## [NOSFERATU: RÄTT FÖRSVAR, OFÄRDIG OFFENSIV] (21 september 2026, samma chatt — läsning, inget byggt)

Johan frågade om min personliga syn på tröskeln och bordet (svar: tröskeln rätt tänkt men grov — ser handen, inte biblioteket, predatorns pumpfrekvens eller min egen situation; bordet beter sig för första gången som ett V:TES-bord; aktören är naiv mot den nya
bouncen) och sedan: spelar nosferatu rätt men är svag, eller spelar den fel? LÄST ur bal7: FÖRSVARET spelas rätt (permanenter först, 36 intercept + 20 wakes + 16 unlock-reaktioner, slåss ordentligt när den blockas / blockar, varje kort spelas). OFFENSIVEN är
OFÄRDIG: Fame spelades 8 ggr — i de 32 action-beslut som följde erbjöds en rush 3 ggr (aldrig på ett Fame-märkt mål) och förlorade alla 3 mot Deep Songs bleed; rusher 14 erbjudna / 3 valda / 1 genomförd / 0 torpor; helpsheetens slutspel har aldrig körts. Orsak:
Fame (master, spelas när den finns) och rushen beslutas SEPARAT. Dessutom svag till sin konstruktion vid ett bottbord: 41 pool utdelad på 12 matcher, 32 jakter på 89 turer, 1,66 kroppar, faller median tur 6,5. Förslag CLAUDE.md 60d.

## [SERIE-BAL7 — DET JÄMNASTE BORDET HITTILLS] (21 september 2026, samma chatt)

v0.6.145 på balanserad design (seeds 9951–9962) mot bal6 och bal5. 12 av 12 last-standing, 0 timeouts, median 8 varv, prisdomaren 78 kort / MISMATCH 0. M1, M3–M6 HÖLL; M2 en kort (bounce-spare 11 mot förutsagda 12; bounce-kept 14 < 15 höll).
Bounces 18 → 37 (bal5 53). TIO bounces på total 4+, varav en 5:a och en 6:A — Johans "6-bleed som skickas vidare" har nu hänt. malkavian 33 → 21 VP (4 vinster), ventrue 5 vinster / 17 VP, tremere 1 → 10 VP (3 vinster), nosferatu 0 VP.
Försvarsplanen: clog 80 · draw-stealth 31 · bounce-total 26 · bounce-kept 14 · bounce-spare 11. malkavian är fortfarande en riktig stealth-bleedare (95 av 115 block besvarade med stealth, 198 pool utdelad) men springer inte längre ifrån bordet.
BEHÅLL. Johans dom om själva tröskeln (en bounce över på hand) återstår. Rapport: `serie-bal7/REPORT.md`.

## [SERIE-BAL6 + DEN ÖVERBLIVNA BOUNCEN] — bot v0.6.145 · arena v1.4.1 (20 september 2026, samma chatt)

serie-bal6 (v0.6.144, balanserad, seeds 9901–9912): TIMINGEN i Johans doktrin höll — 16 av 18 bounces på total 2+, FYRA fångade en pumpad 4:a (bal5: största bouncade bleed 3), draw-stealth 24 ggr: 14 slutade i LYCKAT block, 8 misslyckades med stealth utlockad
och bouncades sedan på totalen, 2 tog bleeden. 199 totalfönster utan att matcherna blev längre (median 8 varv). MEN "aldrig på total 1" var för hårt för DE HÄR lekarna: bounces 53 → 18 (tremere 15 → 2, malkavian 25 → 5), bounce-kept 25 ggr varav 8 med 2+ bounces
på hand; malkavian 9 vinster / 33 VP (bal5 7 / 30), delade ut 218 pool. En bounce som hålls för evigt cloggar FÖRSVARARENS hand — spegelbilden av Johans clogg. Min egen rättelse: mina två första L4-skript motsade varandra (sökfönster som rann in i nästa action);
siffrorna ovan följer varje försök genom SIN EGEN action. BYGGT v0.6.145: timingen kvar; total 1 bouncas när ännu en bounce blir kvar på handen (`bounceSpare` 2; 0 = v0.6.144), den sista väntar på en tyngre bleed. Sektion 119 (15). Suite 1514/0 ×3, canary 37/0,
HB1 11/0. `serie-bal7/PREDICTIONS.md` (M1–M6) registrerad.

## [DEN SENA BOUNCEN + CLOGGEN] — bot v0.6.144 · arena v1.4.0 (20 september 2026, samma chatt)

Johans domar: wake + bounce BARA på bleeds som slutar på 2+ efter modifierarna; ett nytt reaktionsfönster öppnas när en modifier spelas, så bouncen får alltid spelas efter; att bounca direkt — särskilt 1-bleeds — är ett nybörjarmisstag; erfarna spelare frågar
ALLTID efter bleedtotalen efter att blocks declined, därför pumpar man efter blocks declined; botten bör fråga efter bleed modifiers innan bleeden resolvas; en bott pumpar MYCKET SÄLLAN sin bleed efter att den blivit bouncad (bara stark metaanledning); lektypen
läses tidigt ur klan, discipliner på vampyrerna och spelade kort (senare TWD-baslinjen: 3 spelade Govern av normalt 9 → 6 kvar → en sannolikhet). Han vill att botten frågar ÄVEN människor om totalen; svar med snabbfraser.
BYGGT: försvarare — bounce på TOTALEN (taggar bounce-total / bounce-kept), aldrig vid annonsen, aldrig på 1 utom vid kanten; med bounce på hand får en framtung bleed ett blockFÖRSÖK först (draw-stealth); CLOGG mot stealth-bleedare som bleedar exakt 1 (tills poolen
inte har råd med den pump bordet sett). Aktör — en opumpad bleed öppnar ETT reactions-only-fönster på sin total (frusna L12.add med +0, ingen protokolländring); en BOUNCAD bleed pumpas inte. Mot mänsklig AKTÖR: botten frågar "Any bleed modifiers?" och bouncar
efter 4 s betänketid. Snabbfraser i reactions-only-fönster: No = No reaction, Yes = vänta på mig. Totalfönster för mänskligt MÅL: byggt bakom `askHumansTotal` (av) — "No block" = bara blocket avböjt → hör totalen; "No reaction" / "Pass" = allt avböjt; svitens
testspelare säger "No block" överallt och tiger sedan, så påslaget kräver ett svit-städjobb. Två gamla sektioner (modifier efter bounce; wake före bounce vid annonsen) körs nu med lateBounce 0. Emits defence-plan, bleed-total. Sektion 119 (12).
Suite 1511/0 ×3, canary 37/0, HB1 11/0. Rök på slutliga bytes: 9 varv, inga glapp > 12 s, 26 totalfönster, clog 15, draw-stealth 2, bounce-kept 3. `serie-bal6/PREDICTIONS.md` (L1–L8) registrerad.

## [FÖRSVARSSIDAN MOT EN STEALTH-BLEEDARE — LÄSNING] (20 september 2026, samma chatt — inget byggt)

Mellanarkiv levererat (`elysium-bots-arkiv-2026-09-20-v0.6.143.zip`, 297 filer). Johans doktrin för försvaret: besluten ska följa statistiken OCH vetskapen att predatorn är en stealth-bleedare — CLOGGA (släpp 1-bleeds utan blockförsök så
stealth-korten fastnar på deras hand, trots risken för Conditioning); en FRAMTUNG bleed (Govern) är värd ett blockförsök ändå så de måste lägga stealth — extra bra med bounce efteråt; clogg är en chansning man till slut inte har råd med. Hans fråga:
förblir vampyren olåst efter ett misslyckat block och kan bounca i reaktionssteget efter +bleed-modifierarna? LÄST: JA — ett misslyckat försök låser inte (redan rätt i koden) och `_reactWindow()` öppnas igen efter "fails"; ett reactions-only-fönster
öppnas också efter aktörens modifierare. MEN `block-as-target` säger `hasBounce → bounce` FÖRST: med bounce på hand blockar botten aldrig först, den bouncar vid ANNONSEN. MÄTT (bal5, malkavians byte): bounce 11 av 11 som första svar, 6 av dem på en
1-bleed; de bouncade bleedsen slutade på 1 (13), 0 (6), 3 (4) — en bounce har ALDRIG fångat en pumpad bleed. Utan bounce gjordes blockförsök på 1-bleeds i 25 av 70 fönster — motsatsen till clogg. Förslag i CLAUDE.md 56d.

## [SERIE-BAL5 — MALKAVIAN ÄR EN STEALTH-BLEEDARE NU] (20 september 2026, samma chatt)

v0.6.143 på balanserad design (seeds 9701–9712) mot bal4; mäter v0.6.141–143 tillsammans. 12 av 12 last-standing, 0 timeouts, prisdomaren ren. V1–V6, V8, V10 HÖLL; V7 (prevent-x) FÖLL (1 gång — Hidden Strength möter mest träffar på 1).
MALKAVIAN: svarar på block med stealth 74 av 90 (bal4 37 av 111), 57 av 58 sådana actions GICK IGENOM, blockad andel 28 % → 10 % (18 punkter — över måttstocken 11–13), delade ut 191 pool i bleed (mer än de tre andra tillsammans), 7 vinster / 30 VP (bal4 5 / 21).
`need` >= 2 i 39 % av besluten; "cannot-reach" 45 ggr (korten behålls mot väggar); längsta utbyte 7 KORT; blockaren svarade med ett andra kort 5 ggr men hade inget mer intercept i 85 av 90 tittar — starterlekarnas försvar är tunt mot en stack.
Second Tradition 0,4 → 1,1 per match. BORDET HAR TIPPAT: ventrue tog 0 VP i de fyra matcherna med malkavian bakom sig. Behåll. Öppen fråga: försvararsidan (bounce är det verkliga svaret på stealth-bleed). Rapport: `serie-bal5/REPORT.md`.

## [ANDRA TITTEN — BÅDA SIDOR] — bot v0.6.143 LEVERERAD · arena v1.3.9 (20 september 2026, samma chatt)

Johans "kör" på min rekommendation (läs flödet först). LÄSNINGEN: stealth-beslutet togs EN gång per blockförsök (`!a.contested`) och avfyrades på blockarens "Block!"-rop, före dess intercept och tally. BYGGT: `_stealthSecondLook` — varje tally-rörelse
under en pågående blockstrid där blocket LYCKAS väcker aktören: behov = intercept − stealth + 1; når stacken → nästa kort (max 4 tittar); når den inte → "cannot-reach", korten behålls. Mot en BOT-blockare väntar första titten på talliet; en människas
rop behåller gamla första titten. Rök 2 (samma bord / seed som rök 1): `need` 1/2/3 (var 1 i 20 av 20), 5 av 5 stealth-strider igenom (var 6 av 13). SEDAN Johans två punkter: (1) "att bottar bara lägger ETT intercept-kort även om de har fler är en klar
begränsning / bugg — gäller det combat också?" → combat: NEJ, 47 av 318 strider hade 2+ kort (Grapple + Roundhouse 8, Crows + Grapple + Roundhouse 1, Apportation + Theft 10); intercept och stealth var ensamma om ett-kort-regeln. BYGGT: `_interceptSecondLook`
(speglad: blocket MISSLYCKAS → räcker min intercept-stack? → nästa kort; "not-worth-two" för en 1-bleed). (2) 1-bleeden är RESERVERAD för att skapa förutsättningar åt en starkare handling UTAN stealth på hand (ev. med 1 stealth om orolig) — annars rulla kort
för fler +bleed → probe-villkoret ändrat till maxS = 0, eller maxS = 1 mot intercept-tungt byte (jag hade gjort det till standard — fel). Rök 3: blockarens andra titt 7 ggr (alla "no-intercept"), längsta utbyte 2 kort. Sektion 117 (25) + 118 (11).
Suite 1499/0 ×3, canary 37/0, HB1 11/0. `serie-bal5/PREDICTIONS.md` (V1–V10) registrerad; serien mäter v0.6.141–143 TILLSAMMANS (Johans val).

## [STEALTH-BLEEDAREN: BYGGD, RÖKAD, INTE REDO] — bot v0.6.143 i sandlådan (20 september 2026, samma chatt)

Johan bad mig teoretisera kring svagheterna FÖRE serien, och frågade sedan om jag kommit på något mer. Tre saker: (1) HÅL: i probe-ordningen kunde FÖRSTA aktören spela Govern själv — ingen probe alls → en PUNCHER reserveras sist,
proberna får inte röra det tunga kortet (`ctx.cardReserved`); (2) en blockad HUNT (n 0) räknades i bleed-liggaren → rättat; (3) oro: är talliet färskt när stealth-beslutet läser det? → en rökmatch FÖRE de tolv.
RÖKEN (`serie-stealth-smoke1/`, malkavian med nosferatu som byte) svarade NEJ: `need` var 1 i 20 av 20 beslut. `_onBlockAttempt` avfyras på blockarens "Block!"-ROP, som en bot skickar INNAN den spelat intercept och skrivit talliet;
när attempt-raden sedan kommer returnerar hanteraren tidigt — aktören får ALDRIG en andra titt och spelar aldrig ett andra stealth-kort. "Stacken" är alltså fiktiv i dagens protokoll: ett kort per blockförsök, i blindo.
Malkavian tävlade 14 ggr, 13 "strong-stack" — 7 av dem blockades ändå. Dessutom: probe-order 0 ggr på 12 varv (bytets vampyrer som agerade på sin tur är LÅSTA på min). INTE LEVERERAT. Rätt fix: en ANDRA TITT när attempt-raden / talliet
kommer (CLAUDE.md 53c) — rör handskakningen i PROTOCOL §12, läs flödet först.

## [HIDDEN STRENGTHS X + SECOND TRADITION SOM WAKE] — bot v0.6.142 (20 september 2026, samma chatt)

Johan: ta Hidden Strength och Second Tradition FÖRST, testa dem sedan tillsammans med stealth-delen. Byggt: Hidden Strength betalar X blod för att förhindra HELA den inkommande träffen (tryckt: X+1; vampyren behåller 1 blod;
emit `prevent-x`), enligt Johan — ingen egentlig nackdel, mest mot aggraverad skada, och det nekar Pulled Fangs-klassens effekter. cardfx: curated-posten bär `fx.preventX` (omkompilerad, fortfarande 96; test-cardfx 255/0).
OBS: botten vet idag INTE om inkommande skada är aggraverad (ingen sådan flagga i strike-läsningen) — regeln är därför "förhindra allt du har råd med", inte "aggraverad först". `_wakesInHand` räknar ett Second Tradition-klass-kort
som wake när en redo kropp MED TITEL har råd med det → planens hemmakvot, kritiska poolen och act-again-prissättningen ser det. Sektion 116 (10), `diag-116.js`. Suite 1463/0 ×3, canary 37/0, HB1 11/0. INGEN serie körd på denna
version — mäts tillsammans med stealth-releasen (CLAUDE.md 51c) enligt Johans önskan.

## [JOHANS STEALTH-BLEED-DOKTRIN] (20 september 2026, samma chatt — förslag, inget byggt)

Johan höll med om stack-resonemanget och gav doktrinen: alla lekar — aggressiva särskilt — måste CHANSA, enda vägen att vinna är bytets pool till 0. 2 stealth på hand = hyfsat, 3 + bleed-kort = riktigt bra, 1 = chansning; man kan
alltid toppdecka det man behöver vid ersättningsdraget. Stealth-bleedlekar är DESIGNADE att gå framåt hårdare: spela aggressivare och lita på att korten churnar. Håll ändå tillbaka med förstånd: slösa inte en Govern utan stealth när bytet har
en vampyr uppe — kör den hellre på superior, eller SMÅBLEEDA FÖRST med en annan vampyr (hotet om Conditioning lockar fram ett block / en wake) och kör sedan Govern utan stealth och chansa på att inga wakes finns kvar — försvararen behöver
då 2–3 kort i stället för 1–2. Målet: dra ur motståndarens wakes och intercept utan att slösa egna kort, tills två bleeds på totalt 12 sitter. Chumpbleed + combat ends / dodge / manöver på hand är ännu bättre. Koden idag: stealth-beslutet
ser ETT kort och P(intercept); agerandeordningen är "sämsta blockaren först", blind för bleed-storlek. Förslag i fyra delar (stack-tävlan · probe-sedan-slag · håll Govern · chumpbleedare med combat-skydd) + observerbarhet först — CLAUDE.md 51.

## [SERIE-BAL4] (20 september 2026, samma chatt)

v0.6.141 på balanserad design (seeds 9501–9512) mot bal3. 12 av 12 last-standing, 0 timeouts, prisdomaren ren. S1 FÖLL: malkavian svarar på block med stealth 26 % → 33 % (+7 punkter, inom måttstocken 11–13 = obevisat);
S3 FÖLL (blockad andel 29 → 28 %); S4 FÖLL (tremere 27 → 25 %). S2 höll (1,5 → 2,6 stealth-kort per match) men leken tog också 299 actions mot 206 — per action 10 → 12 %. S5 höll: `survival` 5 ggr (alla ventrue), vampyren
blockade i 3, ventrue levde 4 av 5 varv. LÄSNINGEN: insats-fixen fungerar som skriven men är INTE bromsen — en modifierare fanns på hand vid 60 av 176 stealth-beslut och svaret var ändå nej 43 ggr, för insatsvikten är kapad vid 1
och `insight × P(intercept)` med P = 0,9 ger 0,23 oavsett. BROMSEN: botten ger upp så fort blockaren troligen har ett intercept-kort — och vid det här bordet spelar tre lekar Eyes of Argus / intercept 2–4 ggr per match. En stealth-bleedspelare
räknar i stället STEALTH PÅ HAND mot det intercept blockaren rimligen kan lägga till (en stack, inte ett kort). Ej byggt — designfråga till Johan. malkavian 5 vinster / 21 VP (bäst hittills) — inget jag tillskriver ändringen. Rapport: `serie-bal4/REPORT.md`.

## [VAD EN BLEED KAN BLI + KANTEN FÖR FREAK DRIVE] — bot v0.6.141 (20 september 2026, samma chatt)

Johan frågade vad jag själv tyckte om Freak Drive efter uppdateringen. Läst ur 38 beslut (bal3 + home2): HÅLLET 30 ggr — 22 ofarliga (aldrig något fönster utan olåst kropp; 23 hade wake på hand), men i 8 fanns sådana fönster,
i 4 satt en bounce oanvändbar på handen, och i 4 av 30 OUSTADES ventrue samma varv (skattningar 0,10 / 0,33 / 0,00 / 0,16 mot pris 1). SPELAT för kroppen 4 ggr — vampyren blockade eller bouncade alla 4. Min läsning: i ren pool är
skattningen rimlig, men den ser inte KANTEN. Johans "kör": (1) `spend-stealth` väger ANNONSERAD bleed + bästa bleed-modifierare vampyren kan spela (bara bleeds — en hunt har inget mål och får ingen pump); (2) act-again utan action
kvar spelas för ÖVERLEVNAD när poolen är vid / under kritiska nivån eller inom predatorns burst OCH en predatorträff saknar mötande kropp; priset i övrigt orört. Mitt eget fel under bygget: en `//`-kommentar mitt i en rad åt upp
slutklammern — `node --check` fångade det. Sektion 115 (9), diag-115 faller 6/3 på v0.6.140. Suite 1453/0 ×3, canary 37/0, HB1 11/0. `serie-bal4/PREDICTIONS.md` (S1–S7) registrerad — EJ KÖRD.

## [SERIE-BAL3 — VAD LEKARNA FAKTISKT SPELAR] (20 september 2026, samma chatt)

Första serien med FULLSTÄNDIGA play-spår (match 1–6 v0.6.139, 7–12 v0.6.140; 12 av 12 last-standing, 0 timeouts, prisdomaren 77 kort / MISMATCH 0). Ny `ana-cards.py`. Mot Johans fyra lekbilder:
VENTRUE = verktygslåde-grinder: JA (Majesty 2,5 / match, Deflection 2,0, KRC 1,8, Freak Drive 1,8, Hidden Strength 1,3; tunt: Second Tradition 0,4). TREMERE = bleed / combat-hybrid: JA, mer än jag sa
(Theft of Vitae 5,1, Bonding 2,3, Apportation 1,7, Mirror Walk 1,0, 20 press). NOSFERATU = farlig i strid: närmare än jag sa (Roundhouse 2,8, Taste of Vitae 1,8, Immortal Grapple 1,0, 43 intercept-spel, 15 unlock-
reaktioner) — det som saknas är att STARTA och AVSLUTA striderna (Deep Song 1,1, Fame 0,2, 3 VP). MALKAVIAN = stealth-bleed: INTE ÄN — T1 FÖLL, min första läsning stod sig: 1,5 stealth-kort per match, svarar på
block med stealth 20 av 78, 29 % blockat. ORSAK läst ur beslutet: `spend-stealth` kräver aggr × (1 − insight × P(int)) × insatsvikt >= 0,5 och insatsen är den ANNONSERADE bleeden → en 1-bleed kräver P(int) <= 0,18,
och mot en blockare som ser stark ut försöker den aldrig. En stealth-bleedlek gör tvärtom: får IGENOM den lilla bleeden och pumpar den efteråt (Conditioning +3). Förslag: insats = annonserad bleed + bästa
modifierare på hand. Rapport: `serie-bal3/REPORT.md`.

## [FRYSNINGEN] — bot v0.6.140 (20 september 2026, samma chatt)

serie-bal3 match 7 tog 600 s med 8 varv: 451 s TYSTNAD. Ventrue hade Fame på sin egen Oshri; han blockades på ventrues egen tur → torpor → Fame brände de sista 3 poolen → pool 0. FEL 1: Fame-kroken kollade aldrig oust —
botten spelade FYRA actions till på 0 pool (bleed, två Freak Drive, en rescue, en KRC) och oustades först när dess egen omröstning löstes. FEL 2 (frysningen): en bot som oustas på SIN EGEN tur skickade aldrig `pass`
(`if(!this.out)` runt pass-raden), och servern lämnar turen vidare bara från sätet som har den → bordet frös tills arenans timeout. Gammal bugg, sällsynt. Rättat: pass skickas även när jag är ute (serverns pass-hanterare
tar emot tur-sätet oavsett `out` och hoppar över oustade — PINNAT i test 114b mot elysium-server.js); Fame oustar direkt vid 0. Sektion 114 (4), diag-114 faller 3/1 på v0.6.139. Suite 1444/0 ×3, canary 37/0, HB1 11/0.
TILL MAIN: samma frysning hotar hotseat / mänskliga bord med bottar; ett skyddsnät i servern (lämna turen vidare när turinnehavaren oustas) vore rätt plats — inte Bots fil. serie-bal3 fortsätter: match 1–6 = v0.6.139,
7–12 = v0.6.140 (rättningen rör bara oust-på-egen-tur-vägen; serien är beskrivande) — märks i rapporten.

## [DET TRACEN INTE KUNDE SE] — bot v0.6.139 · cardfx curated 96 (20 september 2026, samma chatt)

Johans "kör" på Second Tradition + trace-luckan; Hidden Strength ska tittas på efteråt. KODLÄSNINGEN RÄTTADE MIG: Second Tradition var INTE "aldrig spelad" — intercept-kort spelas i `_commitBlock` men
gav aldrig någon `play`-rad. ELVA handspel-ställen var tysta (intercept, bleed-modifierare, stealth, cancel-block, bounce-vägens wake, unlock-reaktioner, press / maneuver / grapple / prevent / efter-strid).
Alla ger nu `play {card, window}`. Därmed föll också två av mina påståenden från i går: "Immortal Grapple aldrig sedd" och "Hidden Strength aldrig sedd" var TRACE-ARTEFAKTER — i röken
`serie-trace-smoke1/` (1 match, ingen utfallsslutsats) syns Immortal Grapple ×2, Hidden Strength ×2, Conditioning ×2, Lost in Crowds, Cats' Guidance ×3, Guard Dogs, The Warrens ×2, Taste of Vitae.
VERKLIGA fel i Second Tradition, rättade: (1) titelkravet kontrollerades ALDRIG i intercept-letaren — vilken vampyr som helst kunde spela kortet (`_titleOk`); (2) kortets andra tryckta läge saknades
(auto-nivån hade bara +2): en LÅST prince / justicar bränner 1 blod för att låsa upp och blocka med +2 intercept, vilken action som helst — curated-post (96), `when:lockedBlock`, `fx.payBlood 1`, prövas före
en vanlig wake; syntes live i röken (react-unlock ×1, react-intercept ×1). Sektion 113 (13), diag-113; test-cardfx 255/0 (pinnen 95 → 96 + 2 nya). Suite 1440/0 ×3, canary 37/0, HB1 11/0.
Prisdomaren ser nu fler kort (röken: 39 spelade, MISMATCH 0; Hidden Strength är X-kostnad = ej kontrollerad, modellerad som gratis golv).

## [MÅLET + LEKKÄNSLAN] (20 september 2026, samma chatt — inget byggt)

Johan: målet är inte hundra procents säkerhet eller en schackdator, utan ett KOMPETENT HOT vid bordet som kan fylla ut när man är spelare kort — bottar som spelar korten korrekt med bra
prioriteringar, bedömt med god känsla ur observation; hobbyprojekt, så noggrant som ramarna tillåter; masskörningar behövs inte så länge observationerna känns trygga. Han frågade efter min känsla
per lek. Ur 24 matcher: VENTRUE = verktygslåde-grinder, mest komplett (75 omröstningar, Majesty 51, Deflection 45, Freak Drive 47). TREMERE = bleed + blodstöld (Govern 79, Theft of Vitae 69) men
combat-kitet syns knappt (Apportation 0, .44 Magnum aldrig utrustad). MALKAVIAN = mer Dominate-bleed-och-bounce än STEALTH-bleed (svarar på block med stealth bara 22 av 70 ggr, 29 % av dess actions
blockas). NOSFERATU försvarar nu men är inget combat-HOT än (13 rusher på 24 matcher, Immortal Grapple aldrig sedd, Fame-slutspelet aldrig kört). OBSERVERBARHETSLUCKA hittad: bleed-modifierare och
stealth-kort ger ingen `play`-rad med kortnamn → osynliga per kort, OCH prisdomaren ser dem aldrig. CLAUDE.md 43.

## [SERIE-HOME2 + MÅTTSTOCKEN] (20 september 2026, samma chatt)

v0.6.138 parad mot A (seeds 7001–7012): 0 timeouts, median 8,0 varv (B 10,5) — framåtväxeln fungerar. nosferatu hemma 9 % → 63 %, block 67 → 83, poolskada 58 → 64, VP 4 → 6. malkavian 7 % hemma
(B 26 %), Johans bounce-regel slog till 3 ggr (Deflection 1, Telepathic Misdirection 2). act-again: 3 unlocked-body + 2 de-clog av 16 lägen utan action. Prisdomaren ren. Regressionsregeln (omskriven) ej utlöst.
MÅTTSTOCKEN: tremere och ventrue kör SAMMA hemmakvots-kod här som i A (grinding är oprissatt igen) — ändå rörde sig deras hemma-andel 11–13 punkter, block −24 / −29, ventrues poolskada −16 %, tremeres VP 9 → 14.
Det är vad två 12-matchersserier av samma logik på samma seeds skiljer sig med. ALLA effekter mindre än så under hela dagen är obevisade. Över bruset står: nosferatus hemma-andel (två gånger), B:s timeout,
malkavians 26 % → 7 %, act-again 0 → 3. DOM: behåll v0.6.138 framför v0.6.137; om den är BÄTTRE än originalet på resultat går inte att säga på 12 matcher per arm. Körning C struken.
Johan frågade vad jag är osäker på — svaret (keep-blocker håller de SISTA aktörerna, inte de prissatta; predHits läser annonserad bleed medan hitMax läser realiserad; bounce värderas bara som sparad pool fast den
också är offensiv mot bytet; växelkursen hänger på en prognos som är låg för lekar som bleedar 1; och upplösningen i 12-matchersserier) står i CLAUDE.md 42.

## [FRAMÅTVÄXELN] — bot v0.6.138 (20 september 2026, samma chatt)

Johans "kör" på de fyra ändringarna + hans RACING-REGEL: en racinglek har som syfte att gå framåt och lämnar sällan kroppar uppe annat än med BOUNCE på handen, UTAN wake samtidigt,
mot en lek som gör minst snitt 2 i poolskada, när vampyren själv bara presterar 1–2 i bleed; vid en 1-bleed väger blocket tyngre, beroende på predatorns statistik. Byggt: DISABLING
(nosferatu) behåller prissättningen per kropp + FRAMÅTVÄXEL (bänkövertag 2+ mot bytet halverar värdet av att stanna; från fyra kroppar går alltid två framåt); GRINDING (tremere, ventrue)
behåller designkvoten UTAN prissättning ovanpå; RACING (`_raceHome`): EN kropp uppe bara enligt Johans regel, jämfört i POOL (0,9 × predatorns största väntade träff mot kroppens egen
action × genomslag) — "alla prissätter på kanten" är borttaget; act-again jämför i POOL (det kroppen stoppar mot kort + blod = 1). Sektion 112 (11) + 111c ändrad, diag-112 faller 7/4 på
v0.6.137. Suite 1427/0 ×3, canary 37/0, HB1 11/0. `serie-home2/PREDICTIONS.md` (G1–G8, parad mot A) + OMSKRIVEN REGRESSIONSREGEL (poolskada per match −20 % OCH VP inte upp) — EJ KÖRD.
Öppen fråga i denna release: ventrue VANN på prissättningen i B (166 → 224) och är nu oprissatt igen (G6).

## [SERIE-HOME: A MOT B] (20 september 2026, samma chatt)

Parade serier, seeds 7001–7012, balanserad design. A = originalet (homeWeight=0), B = v0.6.137. Ny `ana-home.py`. nosferatu: hemma >= 1 vid unlock 9 % → 73 %, block 67 → 109,
fönster utan olåst kropp 42 → 32, poolskada 58 → 85 men VP 4 → 2,5. ventrue bättre på alla rader (VP 18 → 23). TREMERE: utdelad poolskada 106 → 70 (−34 %), VP 9 → 7, men median oust-tur
7,5 → 9 → regressionsregeln utlöses INTE bokstavligen — sköldpadda i andan. malkavian hemma 6 → 26 % (33 av 37 prissatta vid / under kritiska nivån — "alla prissätter på kanten").
B: EN TIMEOUT (match 4: 23 varv; nosferatu höll i 33 av 38 turer med FEM kroppar mot malkavians tre och kunde inte avsluta; en bot deckades → 4 "library is empty"). Matchlängd median
8,5 → 10,5 varv. H5 FÖLL pga MITT kalibreringsfel: den olåsta kroppens värde (0–0,35, skalat med 1 / myTto) kan aldrig nå kortpriset 0,45 → Freak Drive utan action kvar HÅLLS nu alltid
(12 not-worth-it, 3 de-clog, 0 unlocked-body) — tvärtemot Johans syn. J1 (Johans fråga) HÖLL: kantinflueringar föregår 4 av 36 resp. 5 av 35 ousts, uppenbara 0 resp. 1 → för aggressivt
influerande är INTE det som oustar lekarna. DOM: inte redo att behållas som byggd. Förslag (ej byggt): framåtväxel vid bänkövertag · grinding-lekar behåller designkvoten UTAN prissättning
ovanpå · act-again jämför i POOL · racing på kanten mäts åt båda håll. Körning C EJ KÖRD (inte värd 12 matcher på en version vars prissättning ska ändras). Rapport: `serie-home1/REPORT.md`.

## [HEMMAKVOTEN PRISSATT PER KROPP + ACT-AGAIN] — bot v0.6.137 · arena v1.3.8 (19 september 2026, samma chatt — release 2 av 2)

Johans "kör" på specen + två tillägg: (1) racing-aspekten får utvärderas om lekarna åker ut pga FÖR AGGRESSIVT INFLUERANDE; (2) bedöm hur "uppenbart" det hade varit —
svårt att förutse långt i förväg, men influerar man ut en vampyr nära förväntad oustgräns måste man ha statistiken på sin sida (egen frekvens lyckade offensiva handlingar,
egen snittpoolskada framåt). Byggt enligt `spec-home-pricing-2026-09-19.md`: `predHits`, `_actValue`, `_priceHome` i planen för kontrollhållningarna (grinding, disabling)
och för ALLA vid / under kritiska nivån; racing behåller v0.6.119b-spärren (test 111c: sewer = originalets hemmakvot). `decide('act-again')` utan laglig action kvar:
save-for-lunge > unlocked-body (wake på hand → prissätter ANDRA träffen) > de-clog > not-worth-it, grenen i tracen. Knapp `homeWeight` (1; 0 = originalet, både kvot och
act-again). Sektion 111 (15), diag-111 faller 4/4 på v0.6.136. Suite 1416/0 ×3, canary 37/0, HB1 11/0. Min första fixtur isolerade inte ändringen (gamla spärren höll
redan 2 hemma vid 2,33 turer) — rättad till 4 turer. RISK sedd i fixturen: nosferatu håller 2 av 3 hemma vid 24 pool mot två 3-bleeders → sköldpadde-risk; REGRESSIONSREGELN
(poolskada −20 % utan senare oust → tillbaka till gamla spärren) är registrerad FÖRE datan. Tre parade serier på seeds 7001–7012 (ctl / home1 / r0), H1–H7, R1 och Johans
fråga J1 (edge raises: skulle-ha-levt / uppenbart / statistiken-på-sin-sida) registrerade — INGEN KÖRD ÄN.

## [SPEC FÖR RELEASE 2] (19 september 2026, samma chatt — inget byggt)

`spec-home-pricing-2026-09-19.md`: hemmakvoten prissatt per kropp (stanna = stopp-odds × predatorns k:te väntade träff, wakes fyller de första platserna, bounce lyfter
första hemmavarande; agera = kroppens bästa action i pool × min genomslagsandel; växelkurs = planens wDef / wOff; knapp `homeWeight`, 0 = originalet). RACING-hållningar
behåller v0.6.119b-spärren (regressionsvakten — sewer-läxan), vid eller under kritiska nivån prissätter ALLA. `decide('act-again')` i Johans ordning. Mätning: tre PARADE
balanserade körningar på seeds 7001–7012 (kontroll / ändringen / critRisk=0), förutsägelser före körning A, uttalad regressionsregel. Väntar på Johans "kör".

## [SERIE-CRIT1] (19 september 2026, samma chatt)

v0.6.136 på seeds 4001–4012 mot doll1 (C1–C6 registrerade först). Nivån över golvet i 69 av 295 planer = 23 % (C1 25–60 % FÖLL knappt); fördelning
6 ×226 · 7 ×28 · 8 ×14 · 9 ×20 · 10–12 ×7; max 12, taket 15 aldrig nått. Snitt-burst 5,66, snitt-stoppat 1,49 — vid ett starterbord var Johans "vi kan testa 6"
redan nära rätt tre gånger av fyra; den dynamiska delen slår till mot en predator med två–tre bevisade bleeders (burst 9–13) mot låsta kroppar, precis där
lekar dog från 8–9 pool i bal1 / bal2. Survival-dräneringar 50 → 79, 27 vid pool 7+. Oavsiktlig loop 0, hållna 20 %. Prisdomaren ren. BEHÅLL — måttet är
redo att LÄSAS av release 2. Den parade critRisk=0-körningen läggs i release 2 (med bara dräneringen som konsument mäter en kontroll nästan ingenting).

## [DEN KRITISKA POOLEN] — bot v0.6.136 · arena v1.3.7 (19 september 2026, samma chatt — release 1 av 2)

Johans "kör" på punkt 1 + två tillägg: (a) release 2 (hemmakvoten) MÅSTE kunna jämföras mot originalutfallen så den inte blir en regression; (b) golvet kan
se olika ut per bot — vad leken klarar av och hur riskbenägen den kan / bör vara (malkavian klarar mindre, men en kropp till kan vara en lyckad chansning som
ger fler ousts i längden; mät båda, kan vara metaberoende). Byggt: table model håller STÖRSTA träffen per minion (annonserad, höjd till den REALISERADE av
`_noteHit` — Conditioning kommer efter annonsen); `predBurst` = varje redo predator-minion landar sin största; `_critPool()` = golv + critRisk × (burst − det jag
kan stoppa nu − golv), tak 15; stoppar = olåsta kroppar med planens egna blockodds, wakes för låsta, bounce på hand. Konsument i denna release: BARA
survival-dräneringen; `plan.reads.crit` i varje trace. INTE influence-golvet (en kropp till är chansningen Johan vill ha MÄTT, inte förbjuden). Knapp `critRisk`
(1; 0 = fasta golvet = originalet). Sektion 110 (12), diag-110 faller 0/1 på v0.6.135. Suite 1401/0 ×3, canary 37/0, HB1 11/0. `serie-crit1/PREDICTIONS.md`
(C1–C6, seeds 4001–4012, baslinje doll1) registrerad — EJ KÖRD; parad kontroll med critRisk=0 är skyldig efteråt.

## [HEMMAKVOT + KRITISK POOL — ANALYS] (19 september 2026, samma chatt — inget byggt)

Johans dom: 6 som kritisk gräns kan testas, men den bör vara DYNAMISK — predatorns statistik (offensiva handlingar, snittpoolskada per offensiv handling,
maxpoolskada; en dominate-lek med Govern + Conditioning når 6 på en handling), dess snitt-stealth mot vad jag kan prestera, och mina aktuella defensiva
möjligheter. Mätt på 24 balanserade matcher: lekar dör FRÅN pool 5–9 på en enda predatortur (nosferatu 8 → −2, 6 → 0 fem gånger), största enskilda träff 6.
`_homeQuota()` ger 0 för alla lekar som inte är 'grinding' — nosferatu ('disabling') hade plan.home 0 vid 168 av 172 unlocks. Table model saknar MAX (bara
summa / antal). Förslag i tre lager i CLAUDE.md 36e: statistik (bleedMax, skada per tur, predReach / predBurst, `_critPool()`), allmänt (hemmakvot för alla
posturer, prissatt per kropp mot kroppens bästa action; act-again läser samma blockvärde), persona (inget).

## [SERIE-BAL2] (19 september 2026, samma chatt)

v0.6.135 på den balanserade designen (seeds 6001–6012) mot bal1. ALLA "spelar rätt"-förutsägelser höll: nosferatus första vampyr passning 0,55 → 0,85
(cap 4,25 → 5,33), alla lekar upp (mal 0,51 → 0,61 · tre 0,61 → 0,82 · ven 0,56 → 0,66), första vampyren högst en halv tur senare (nosferatu precis på
gränsen, 1,50 → 2,00), redo kroppar egen tur 5 faller ingenstans > 0,3 (ventrue −0,24 att bevaka), nosferatus rusher 9 valda / 8 kvalificerade. Prisdomaren ren.
BEHÅLL. Det som INTE ändrades: nosferatu tar fortfarande minst (4 VP, först ute 6 av 12) — öppningen var en verklig avvikelse och är rättad, men inte skälet
till att leken förlorar. Två balanserade serier bredvid varandra: ventrue 4 → 8 vinster; poolat 24 matcher: ventrue 12 v / 1,67 VP per match · tremere 7 / 1,25 ·
malkavian 2 / 0,67 · nosferatu 3 / 0,42. Matcherna blir längre (två på 12 varv; en tog 406 s) — frikopplad + pollad körning krävs nu alltid. Rapport: `serie-bal2/REPORT.md`.

## [LEKPASSNING I INFLUENCE-PLANERAREN] — bot v0.6.135 · arena v1.3.6 (19 september 2026, samma chatt)

Johans "kör" på nosferatus öppning. Analysen först: planeraren öppnade billigast-först (Baixinho / Ryan först i 13 av 24 nosferatu-matcher — de två som kan
spela MINST av sitt eget bibliotek); tempot var inte problemet (1:a/2:a/3:e vampyren median tur 2/3/4). Byggt i ALLMÄNNA lagret, inte som nosferatu-regel:
`_deckFit(c)` = andelen av lekens disciplin-låsta bibliotek vampyren kan spela (superior 1, inferior 0,5), och planeraren lägger till fitWeight (8) ×
(1:ans passning + halva 2:ans). Nosferatu: Horace 0,95 · Larissa / Dowager 0,84 · Lenny 0,80 · … · Ryan 0,50 · Baixinho 0,34 = helpsheetens ordning utan att
en disciplin nämns. Ventrue: Madison / Alice / Naomi / Sybren 0,80+, Brock 0,22. OBS hacking delar sig 0 / 0,5 — INTE neutralt för weenie; dess serie är skyldig
innan hacking mäts igen. Min bedömning: 0,4 passning väger upp EN turs tempo, inte två (knapp `fitWeight`, 0 = gamla planeraren). Sektion 109 (9), diag-109
faller 0/1 på v0.6.134. Suite 1389/0 ×3, canary 37/0, HB1 11/0. `serie-bal2/PREDICTIONS.md` (F1–F7, balanserad design, seeds 6001–6012) registrerad — EJ KÖRD.
Baslinje bal1 (ny `ana-open.js`): 1:a vampyrens passning nos 0,55 · mal 0,51 · tre 0,61 · ven 0,56; redo kroppar egen tur 5: 2,25 / 2,33 / 2,50 / 2,42.

## [SERIE-DOLL1] (19 september 2026, samma chatt)

v0.6.134 på seeds 4001–4012 mot rush1 (D1–D5 registrerade först). 118 dräneringsbeslut: 36 hållna (31 %: last-blood 25, keeps-action 11), survival 50
(43 av dem pool <= 6), nothing-better 6, spare 26. Den OAVSIKTLIGA loopen: 0 fall. De 4 kvarvarande "dränera + jaga tre turer i rad" är alla Johans två
fall (survival ×3, nothing-better ×1). D1 (ventrue jakter/tur < 0,28) FÖLL: 0,33 → 0,31; D4 (ventrue actions/tur upp) FÖLL: 1,97 → 1,62 — jag
överskattade effekten ur EN livlig match; buggen var sällsynt. Behåll. Prisdomaren ren. Körteknik-fel av mig: `pgrep -f elysium-bot-arena` matchade
mitt EGET kommando (texten stod i anropet) → två anrop startade ingenting; poll-skript ska anropas ensamma på raden. Rapport: `serie-doll1/REPORT.md`.

## [BLOOD DOLL SOM BESLUT] — bot v0.6.134 (19 september 2026, samma chatt)

Johans "kör" + hans nyanser: nära oust kan dräneringen vara värd det ändå; likaså när vampyren saknar vettiga actions och ändå kan jaga — gör
bedömningen flexibel. Byggt som `decide('income-drain')` (statistiklagret, alla lekar, Blood Doll-klassen): SURVIVAL (pool <= floor eller <= 1,5 turer
från fall) dränerar allt · en värd som ändå ska jaga dräneras gratis · en dränering som skulle trycka värden UNDER jakt-tröskeln görs bara om den saknar
kort-action värd turen (political / bleed-kort / permanent) · annars bara blod utöver reserven för korten på hand (dyraste blodkostnad, max 3) · aldrig
sista blodet utanför survival. Läser hunt-or-bleeds EGEN formel (två regler som inte är överens jagar varandra — det VAR buggen). Emit `income-drain {tag}`.
Sektion 108 (10), diag-108 faller 0/1 på v0.6.133. Suite 1380/0 ×3, canary 37/0, HB1 11/0. `serie-doll1/PREDICTIONS.md` (D1–D5) registrerad — EJ KÖRD.
Baslinje: jakter per egen tur i rush1: ventrue 0,33 · malkavian 0,39 · nosferatu 0,34 · tremere 0,12.

## [BLOOD DOLL-LOOPEN] (19 september 2026, samma chatt — fynd, inget byggt)

Johan frågade om Chelsea Blake (serie-bal1 match 2, "hunt på blood 1/5" tre turer i rad) hade varit i strid. Ja — tre tidiga strider tog henne 4 → 1.
Men det som HÖLL henne där är `decide('income-direction')`: Blood Doll flyttar 1 blod till poolen så fort värden har NÅGOT blod, så varje tur
2 → 1, hunt-regeln skickar henne på jakt 1 → 2, och hon agerar aldrig mer. +1 pool per tur för en hel vampyrs action. Föreslagen regel: dränera
bara blod värden kan avvara (aldrig ner till/under hunt-tröskeln) om inte poolen är i fara. Johans ram för nosferatu: kan vi visa att botten spelar
leken förnuftigt och korrekt är svagheten en LEK-obalans som en människa täcker med allianser — målet är en checklista, inte en vinstprocent. CLAUDE.md 33d/33f.

## [DEN BALANSERADE BASLINJEN — SERIE-BAL1] (19 september 2026, samma chatt)

Johan: behåll `permFirst`, kör den balanserade serien. Design: de 6 cykliska ordningarna × 2, `--fixed-seats`, varje predator→byte-par 4 ggr,
varje lek startar 3 ggr (mitt första utkast gav 3/5/1/3 starter — omräknat FÖRE första matchen), seeds 5001–5012, B1–B7 registrerade först.
UTFALL: ventrue 4 vinster / 17 VP · tremere 4 / 16 · malkavian 2 / 9 · nosferatu 2 / 6. De skeva seedsen VAR det mesta av ventrues dominans:
10 av dess 17 VP kommer ur de 4 matcherna med nosferatu som predator. Alla lekar gör bäst ifrån sig med nosferatu bakom sig — nosferatus
OFFENSIV är bordets mjuka punkt. Nosferatu tar 0 VP med ventrue eller malkavian bakom sig, 6 med tremere. Ingen startspelareffekt (säte 1: 2 vinster).
Omröstningar: 35 kallade, 34 % blockade, 22 av 23 igenom. Prisdomaren ren. Körteknik: en frikopplad match + pollning (`poll-bal.sh`) överlever
OFTAST anropsgränsen men inte alltid (match 7 dog en gång) — `progress.txt` är sanningen. Att titta på: ventrue i match 2 (ingen vampyr före tur 3,
Chelsea Blake huntar tre turer i rad på "blood 1/5"). Rapport: `serie-bal1/REPORT.md`.

## [SERIE-RUSH1 + FYNDET OM SEEDSEN] (19 september 2026, samma chatt)

serie-rush1 (v0.6.133, seeds 4001–4012, permFirst på, R1–R8 registrerade först): rusher 12 → 5, bleeds igenom 24 → 56 (38 → 71 pool),
median oust-tur 6 → 7, redo kroppar 1,51 → 1,79, NOSFERATU 3 VP OCH 1 VINST — de första på 36 matcher. R3 (torpor per rush) ej uppnådd, n = 4.
Ventrue 10 vinster / 35 VP, malkavian 1, tremere 0. Prisdomaren ren. Johan frågade om placeringen slumpas: JA, per seed — och bordsordningen
är verifierat IDENTISK i alla tre serierna. DÄRMED FYNDET: seedsen 4001–4012 sätter NOSFERATU SOM VENTRUES PREDATOR I 8 AV 12 matcher
(tremere 3, malkavian 1). Ventrues dominans och nosferatus nollor är båda uppblåsta av det. Ett 4-leksbord har 6 cykliska ordningar — en rättvis
serie kör varje ordning lika ofta (`--fixed-seats`, 6 × 2). Rapport: `serie-rush1/REPORT.md`.

## [RUSHEN SOM INTE KUNDE RÄKNA] — bot v0.6.133 (19 september 2026, samma chatt)

Johans ram för arbetet framåt: TRE LAGER — (1) statistiken (gynnar alla bottars tänkande), (2) allmän combathantering (gynnar combatlekar),
(3) lekpersonan (informerar nosferatu-startern specifikt). Byggt i den ordningen: BUGG rättad (`target.tBlood` → `target.blood`; Johans
v0.6.74-regel lever nu), allmän combat: `_rushExpectation` räknar skada BREDVID striken (burna Murder of Crows, Carrion Crows på hand — kodläsningen
visade att permanentbygget var osynligt för rushen), egen risk (rushare på 0 / 1 blod: ×0,3 / ×0,7), `scores.rushParts` i varje trace.
Enemy rescue bara på BYTETS Fame-märkta vampyrer (Johan). Grapple-hanteringen FINNS (kodläst) — den spelades 0 ggr för att den sällan låg på hand.
Persona-fynd: bara Horace Radcliffe har [ANI]+[POT] — den enda som både rushar och slår 3 med Roundhouse. Sektion 107 (11) matar FINDERNS eget mål
(sviten handbyggde ctx förut — därför levde buggen); diag-107 faller 0/2 på v0.6.132. Suite 1370/0 ×3, canary 37/0, HB1 11/0.
`serie-rush1/PREDICTIONS.md` (R1–R8) registrerad — SERIEN EJ KÖRD ÄN. Ej byggt: rush i samma valuta som bleed (väntad poolskada; målvikten
0,12 × w dominerar fortfarande), låsnings-värdet av Deep Song framåt (kräver en uppföljande bleeder), motståndarens combat-ends i table model.

## [RUSHARNA I STRID — EN DÖD REGEL] (19 september 2026, samma chatt, analys — inget byggt)

Johan frågade hur rusherna följs upp i strid. Svar ur båda serierna: 21 genomförda nosferatu-rusher → 3 torpor, alla tre på mål med 0 blod;
16 av 21 gick in UTAN ett enda combatkort på handen; spelat i striderna: Roundhouse 5, Carrion Crows 2, Immortal Grapple 0. ORSAK: BUGG —
`decide('action')` läser `ctx.rush.target.tBlood`, fältet finns inte (målet bär `blood`), så tb = 0 och mult = 1,35 alltid; Johans regel från
v0.6.74 ("utan combatkort vill man ha mål med 0–1 blod") har aldrig fungerat live. Varje why säger "expDmg N vs 0". Dessutom väger
målvikten (0,12 × w, w upp till 22) 3–7 poäng mot Deep Songs bleed på ~2, så rushen vinner alltid. Johans domar: enemy rescue kräver Fame
(inte nödvändigtvis min) och görs normalt bara på BYTETS vampyrer; hemmakvoten följer hand + statistik (wake på hand → bygg; nosferatus bleed
på 1 knappt värd ett förlorat block, men bytets pool måste ner — en vikt, inget förbud); Deep Song som bleed när combatkort saknas. CLAUDE.md 30.

## [PERMANENTER FÖRST + SERIE-PERM1] — bot v0.6.132 · arena v1.3.5 (19 september 2026, samma chatt)

Johans "kör" på permanentbygget; utvärderas mot originalet på utfall och spelflöde. Byggt: en lek vars manifest säger `permFirst`
(nosferatu) lägger en permanent på handen i spel FÖRE en bleed (strukturell 98, under stock 99 / rescue 99,5; aldrig på lunge-tur eller med
bytet <= 1,5 turer bort); knapp `permFirst` 1/0. Sektion 106 (9), diag-106 faller på v0.6.131. Suite 1359/0 ×3, canary 37/0, HB1 11/0.
Johan rättade mig: sewer är INTE en rush-lek (Inside Dirt-spåret); "rush-lek" = combatcentrerad lek som hoppar in i strid. Ingen av våra lekar är det.
SERIE-PERM1 (Q1–Q7 registrerade först, nollans seeds): regeln gör det den säger (byggactions 17 → 32, plain bleeds 48 → 24) men UTFALLET
är inte bättre: nosferatu 0 VP igen, först ute 7 av 12 (nollan 3), bleeds igenom 41 → 24, torpor hos de andra oförändrat (14 → 15).
Ventrue 7, malkavian 4, tremere 1. Prisdomaren ren. DET VERKLIGA FYNDET: nosferatu har 1,5 redo vampyrer vid sin unlock i båda serierna,
och 45–49 blockfönster per serie slutar "ingen intercept på hand och ingen olåst kropp" — en kontrollek utan kroppar hemma. Rusherna: 11, alla
bakåt. Rapport: `serie-perm1/REPORT.md`. Johan dömer keep / tune / revert. Freak Drive-viktningen (wake + Freak Drive = två block) väntar.

## [PRISDOMAREN ÅTERBYGGD + JOHANS SYN PÅ NOLLAN] — gen-trace-harvest v1.2.1 (19 september 2026, samma chatt)

Johans uppladdade harvest var v1.1.0 (identisk med projektets) — v1.2.0 nådde aldrig projektet. Domaren återbyggd ur changeloggens
beskrivning som v1.2.1; serie-null4: 59 spelade kort, 58 rätt prissatta, MISMATCH 0 (destruktivt verifierad). Johan: Freak Drive utan
kvarvarande action är INTE nödvändigtvis en bugg (kropp uppe för block/bounce, eller cykla kort) — vikta: spara till lunge-tur > värdet av
olåst kropp (bounce/Second Tradition på hand × predatorns aggressivitet) > de-clogga. Ventrues 8 vinster = ett kvitto på att leken fungerar;
rikta blicken mot de andra lekarna. Enemy rescue bara för Fame-ägaren eller av stark metaanledning. Nosferatu granskad mot Black Chantrys
helpsheet: bygger inte permanenter först (Murder of Crows förlorar mot plain bleed ~20 ggr), 10 rusher på 12 matcher, Fame-kedjan körs aldrig.
Skuld 28c-dom, 28e stängd, 28h ny. Inget byggt i boten — förslag väntar på Johans "kör".

## [OMRÖSTNINGEN FÖRE BÄNKEN + 4-STARTERNOLLAN] — bot v0.6.131 · arena v1.3.4 · gen-null-review v1.0.0 (18–19 september 2026, ny chatt från README 18i)

Johans syn på skuld 23b: Parity Shift är otroligt starkt mot bytet (bränner 3, ger 3); KRC kan vara värt mer än "bloat" om bytet hamnar
inom oust range — givet röstövertag. Byggt så (`_polOverBuild`): bygg-först viker när pass >= 0,8 OCH omröstningen är ekonomi (ger mig
pool) eller räckvidd (oustar bytet / lämnar det <= 1,5 av mina turer från fall). Ren skada på friskt byte förlorar mot bänken; egen rescue
(99,5) går före (min bedömning). Knapp `polOverBuild` 1/0 i manifestet. Sektion 105 (12), diag-105 faller på v0.6.130. Suite 1350/0 ×3,
canary 37/0 (klient v2.6.121), HB1 11/0. Hans dom 27b: bränd Edge lämnas INTE tillbaka — stängd.
FÖRUTSÄGELSERNA P1–P10 registrerades i `serie-null4/PREDICTIONS.md` FÖRE första matchen. NOLLAN: 12 matcher, seeds 4001–4012, en process
per match (en frikopplad kedja dör vid anropsgränsen; ett anrop får ta 300 s; en match 112–250 s). UTFALL: ventrue 8 vinster / 26 VP
(2,17 per match), malkavian 2 / 12, tremere 2 / 10, nosferatu 0 / 0. P1 FÖLL (bordet är inte jämnt), P8 FÖLL (23b-taggen 0 av 12 — alla
7 stock-över-omröstning var KRC på friskt byte, precis det regeln lämnar åt bänken; Parity Shift mötte aldrig ett stock-erbjudande),
P7 FÖLL (keep-blocker 3 av 23; slöseriet är nu FREAK DRIVE UTAN LAGLIG ACTION, 8 av 39 — `decide('act-again')` frågar aldrig turledgern:
BUGG, nästa release). Höll: P2 (första omröstningen senast action 3 i 11 av 12), P3 (median 5), P4 (29 % blockade), P5 (40 av 40 röstade
gick igenom — ingen vid bordet har röster att stoppa med), P9 (Sybren 8, Alexa 1, Dawn 3, block-barred 5; röstskatten aldrig sedd).
P10: 0 err / 0 timeout; PRISDOMAREN EJ KÖRD — projektets gen-trace-harvest.js är v1.1.0, v1.2.0 finns inte i projektet.
Rapport: `serie-null4/REPORT.md`. Inget trimmat mot serien.

## [LIVE-PROBEN + KOSTNAD VID FRAMGÅNG] — bot v0.6.130 (18 september 2026, samma chatt)

Johan: 26c stämmer — människor "parkerar" blodet för att kunna betala i slutet; bottarna ska följa reglerna men hålla reserven. Byggt:
`_park` vid announce, `_returnParked` vid block (före striden) i ALLA grenar. Live-proben (`diag-give-probe.js`, riktig server, 3 bottar):
11 give / 11 given — tråden var aldrig trasig. Felet i 26a var ett SÄTESLOKALT id ('m3') på mastern; mottagaren hade ett eget 'm3' och min
dubblettvakt kastade gåvan tyst. Båda mina misstankar (rate limit, err) var fel — rate limiten STÄNGER dessutom socketen, den tappar inte
meddelanden. Rättat i båda ändar. Sviten fångade en rad > 4 kB (82c): BOT_VERSION-raden hade samlat på sig gamla noter; trimmad.
Bot-diablerie (26g) tas i egen session.

## [JOHANS DOMAR, REGELBOKEN, TURLEDGERN] — bot v0.6.129 (18 september 2026, samma chatt)

Johans svar på bedömningarna: gränsen 3 ok; Dawn även på omröstningar som ger 3 på bytet (om bytet faktiskt kan blocka: snittintercept ~1 +
olåst kropp, eller trolig oust); egen rescue = +1 stealth; Alexa kastar bara som sista utväg för att få IGENOM en röstning; en politisk
action per vampyr och tur, aldrig samma namngivna kort två gånger; allies kan inte diablerisera; en bot får diablerisera bara med majoritet av
fasta röster inkl. Edge (noterat, inte byggt — skuld 26g); fixa svagheterna 1–3. Regelboken (vekn.net) hämtad och läst: bekräftar min
tolkning av aggraverad skada, rescue-stealth, leave torpor-block — och visar att botten saknade EN BLEED PER MINION PER TUR (alla Freak
Drive-ombleeds sedan v0.6.123 var olagliga). Byggt: turledgern, m.m. RÖKEN `serie-ledger-smoke1/` (seed 51): Troublemaker avfyrades på riktigt
och Belinde låstes — men mottagaren fick aldrig `given`. ÖPPEN BUGG, skuld 26a: första sak nästa session. Regelboken säger också att
action-kostnad betalas först vid framgång (mot Johans dom, skuld 26c) — inte ändrat.

## [JOHANS DAWN-REGEL + LEAVE TORPOR + GIVEN + TROUBLEMAKER] — bot v0.6.128 (18 september 2026, samma chatt)

Johan laddade upp canaryn (37/0 på v0.6.127 och v0.6.128). Hans regel för Daring the Dawn: spelas bara om det är MITIGERBART
(vampyren kan själv Freak Drive + ta sig ur torpor, en annan kropp kan göra rescue, eller Ventrues röster dominerar så en
diablerist förlorar blodsjakten) eller KLART VÄRT (actionen oustar). Byggt så; mitt tillägg: en mitigerbar spelning kräver också
bleed-potential ≥ 3. Det krävde en action till som botten saknade: LEAVE TORPOR (vampyrens egen, +1 stealth, 2 blod) — och
Freak Drive i torpor. Sedan skuld 21: `given`-hanteraren och Anarch Troublemaker (ge till bytet vid min unlock, lås upp till två
av dess olåsta vampyrer, lockM-familjen). Ventrue-täckning 77/77 — inga döda eller tabled-kort kvar. Sviten fångade en
källordnings-pin (80e) på första körningen; rättad, sedan 1310/0 ×2. Rök `serie-given-smoke1/` (seed 41): ingen krasch,
Troublemaker drogs aldrig. OKONTROLLERAT: hotseat-routing av `give`; aggraverad skada väntar fortfarande på Johans dom.

## [KRYPTSVEPET + AVSLUTAREN + RESCUE] — bot v0.6.127, cardfx v1.9.0 (18 september 2026, ny chatt från README 18g)

Johans prioritering: gör klart korten (cardfx) för Ventrue FÖRE matchtester — Troublemaker, Daring the Dawn, ev. Majesty-vikt,
kryptförmågor. Beslut i chatten: Majesty vilar (byggs med persona-steget); inga döda kort — Daring the Dawn ska spelas; se över
rescue from torpor; svep biblioteket och tagga framåtsyftande (målet: V5-utgåvorna först). BYGGT: kryptsvepet (bara 6 av 36
startervampyrer har text — Sybren, Alexa, Silverson nu levande; Lenny/Larissa/Dowager fanns), `blockBar` på 34 kort +
`selfDmg`/`selfTorpor` på 5, Daring the Dawn som avslutare (dödlig bleed, bytet har olåst vampyr) med ny grammatikrad,
och den egna rescue-actionen — botten hade INGEN: en torporerad vampyr låg kvar hela matchen. Svepet hittade två fel i datan
(Daring = aggr-slagare, Day Operation = torpor-sändare), en regression i arvet (Cheat the Fates, rättad: pinnen ärver hela
läget) och en latent bugg (enemyRescue åt hand[0]). Rök `serie-crypt-smoke1/` (1 match, seed 31, ventrue vann — ingen slutsats):
3 torpor, 2 recover via ownRescue, 7 omröstningar, 6 act-again. INTE sett i arenan: Sybren, Alexa, skatten, Daring. Canary EJ
körd (filen saknas i projektet). Johan ska döma: aggraverad självskada (skuld 24a). KVAR före nollan: `given` + Troublemaker (skuld 21).

## [SJÄLVGRANSKNINGENS PUNKT 6–9 + JOHANS DOMAR] — bot v0.6.126 (18 september 2026, samma chatt)

Johans domar: Carrion Crows mot Majesty är RÄTT som byggt. `given`-hanteraren + Troublemaker OCH punkt 6–9 ska
in FÖRE nollan. Punkt 4–5 (Freak Drive alltid, Majesty alltid) preliminärt godkända — men ska kopplas till lekens
persona; för Majesty: läs motståndarnas skadestatistik (en spelare som statistiskt gör 1 skada mot en som gör 4 →
spara korten mot den farliga). Skuld 22. BYGGT nu, punkt 6–9: (6) KRC-splitten lägger aldrig mer på bytet än det
HAR — resten går till sidoplatsen med minst titelröster (vid lika: inte mitt bytes byte, vars oust skulle ge mitt
byte 6 pool); (7) en BLOCKAD omröstning lämnar tillbaka kortets egen blod-/poolkostnad (parkerad vid announce);
(8) en MÄNNISKAS politiska action öppnar blockfönster bara hos anroparens byte och predator — en tvärsbordsplats
behåller pending (insatsen styr dess röst, It resolves landar poolen) men får inget blocksteg och säger inget
(inte ens "No block"); (9) minion-loopen läser som den kör: act-again-kollen är ETT synligt steg överst i varje
varv, utgångstestet under det, `_actAgainTail` borta. Sektion 100 (12), diag-100 (faller 4 av 12 på v0.6.125).
Suite 1233/0 ×3, canary 37/0, HB1 11/0. Ingen arenarök: 6–8 ändrar inget som röken kan visa på två matcher, och 9
är beteendeneutral (97c täcker kön). KVAR före nollan: `given` + Troublemaker (skuld 21) — nästa steg.

## [DE SISTA VENTRUE-KORTEN] — bot v0.6.125 · coverage v1.1.34 · curated 92 (18 september 2026, samma chatt, sista rundan)

Johan: en full lek innan nollan. Tre högar byggda, Troublemaker utvärderad (skuld 21), Daring the Dawn kvar som
ärligt dött kort. (1) RIKTNINGSBESLUTET — Blood Dolls / Vessels omvända mode (`poolToBlood`): en värd på 0 BLOD
matas med 1 pool ur en bekväm pool (≥ max(10, poolFloor + 4)) i kortets egen fas → ingen tvångsjakt. Medvetet smalt
så det inte kan pendla mot dräneringen, som är orörd. Sviten fångade första tröskeln: dess eget 0-blods-scenario
(pool 5, poolFloor 0 i den botten) slutade jaga — golvet är nu absolut också. (2) VOTER CAPTIVATION —
`_maybeMarginBlood` efter MIN antagna omröstning, FÖRE act-again-kollen: +1 blod per marginalröst upp till
kapacitet, [PRE] skickar överskottet (eller en tunn pools hela andel) upp till 2 till poolen. Motorn testad i kedja:
KRC 3–0 → Captivation 1→4 blod → Freak Drive → upplåst på 3 blod; utan Captivation hade hon inte kunnat betala.
(3) VISIT FROM THE CAPUCHIN — `enterCounters` 4, per-räknare-term i `_handSizePermanentTotal`, drar upp direkt,
och `_flushDraws` bränner en räknare I STÄLLET för att dra (kortets egen ersättning undantagen, bränns vid 0).
Båda nya korten kurerade (familjer om 2 resp. 1 i databasen — inget att svepa).

Täckning: Ventrue FULL 75 / 77 (kvar: Troublemaker TABLED, Daring the Dawn INERT). Bonus av `poolToBlood`:
tremere och nosferatu 77 / 77, malkavian 71 + 2 HANDLER. Rök serie-pol-smoke5 (2 matcher, seed 23): Capuchin
sedd (4 drag, 4 räknare brända); Captivation och riktningsbeslutet INTE sedda — Ventrue utslagen först båda
gångerna med 3 action-beslut per match. Ingen bugg i det (pol-kandidaten fanns, pass 0.08 mot 9 röster emot
respektive slagen av grinder-stock), men en datapunkt för nollan: leken dör innan den hinner rösta.
Grindar: suite 1221/0 ×3 · diag-99 18/0 (faller på v0.6.124) · test-cardfx 241/0 · canary 37/0 · HB1 11/0.

## [SJÄLVGRANSKNINGEN] — bot v0.6.124 (18 september 2026, samma chatt, avslut)

Johans fråga efter steg 4: "finns det något du är osäker på eller tycker ser konstigt ut?" Tolv punkter; han valde
1–3 direkt, resten dokumenterat (CLAUDE.md skuld 20a–h). LAGAT: (1) rösträkningen — bottarnas absoluta
tally-skrivningar skrev över varandra och skulle ha raderat en människas +2: nu röstar de i ringordning från
anroparen (`_refStaggerMs`, en takt isär), läser tallyn som den står DÅ (`_voteCounter`) och speglar sin egen
skrivning (`_voteMirror`). Fynd på köpet: Protected District raderade sedan v0.6.111 titelrösterna som lagts raden
innan (båda utgick från öppningskantens b). (2) Villkorens livslängd — 180 s-klockan borta; de dör med actionen
(resultatrad, anroparens It resolves, ny terms-rad, någon ANNANS politiska announce). (3) Röstaren symmetrisk —
saldo minus bytets < 0 → EMOT (mitt byte som matar sig självt var ett avstående); `_bestPoliticalFor` prissätter
bordet med samma regel, så Parity Shift mot ett bord där min predator har röster blir det långskott det är.
Ventrue HQ:s röstlås äntligen testat (låser för +3, 3–4 blir 6–4). Sektion 98 (15), diag-98 (avbryter på
v0.6.123). Suite 1203/0 ×3, canary 37/0, HB1 11/0.

## [POLITIKBENET, STEG 4: ACT AGAIN + COMBAT ENDS] — bot v0.6.123 · cardfx v1.8.0 · coverage v1.1.33 (18 september 2026, samma chatt)

Freak Drive 6 + Majesty 6 = de sista 12 döda korten i Ventrue-startern. Svept som FAMILJ (Johans regel): nämnaren
för act-again är NÄR kortet får spelas → moderyttare `when: actSuccess | actBlocked | actFailed` på upplåsande
action modifiers (6 kort: Freak Drive, Forced March, Instantaneous Transformation, Domain of Evernight, Truth of a
Thousand Lies, Zephyr [CEL]); negativa exempel = allt som hänger på actiontyp, annan minion, betalning eller "at the
end of the turn". `oncePerTurn` ur "can play only one … each turn". `strikeCE` = den SPELBARA delmängden av
combatEnds (45 av 64 kort; bara Majesty i våra lekar).

Botten: `_maybeActAgain` körs mellan aktörerna och en gång efter den sista (`_actAgainTail` som for-loopens andra
villkor) — alltså efter att actionen är HELT över, combat inräknat. Utfallet läses ur samma två emits som
strategilagrets ledger (`through` / `blocked`) och KONSUMERAS, så en vampyr som hålls hemma vid återbesöket köas
aldrig om. Upplåst vampyr går tillbaka på den levande aktörskön (Warsaw-precedensen): keep-a-blocker och planen
avgör om den agerar igen eller stannar hemma. Hålls vid 1 blod (0 blod = bara en tvångsjakt), max två extra
actions per vampyr och tur, fallerad omröstning = varken lyckad eller blockad. Majesty: dodge-formad strike-rad +
`Combat ends — KORT.` (motståndarbotten pressar inte), [PRE] låser upp, och en vampyr som låsts upp i blockens
combat återbesöks utan kort. Immortal Grapple spärrar.

Rök serie-pol-smoke3 (3 matcher, samma seed 11, INGEN utfallsslutsats): Freak Drive 4 (3 efter lyckad, 1 efter
block), Majesty 4 (2 gav ny tur), 11 omröstningar: 3 antagna, 8 blockade (förra röken 1 av 7). LÄST på
beslutsnivå: block-evals 12 → 2 block i smoke2, 18 → 9 i smoke3; varje nej i smoke2 var "no usable intercept in
hand", varje ja i smoke3 hade intercept på hand — skillnaden är HÄNDERNA, inte Freak Drive eller tröskeln. Rimligt
försvar: insats 3, stealth 1, Ventrue har ingen stealth att svara med. Registreras som fråga inför nollan.

Grindar: suite 1188/0 ×3 · diag-97 24/0 (avbryter på v0.6.122) · test-cardfx 239/0 · canary 37/0 (klient
v2.6.121) · HB1 11/0. Täckning Ventrue: FULL 69 / 77 (kvar: Blood Dolls poolToBlood, Voter Captivation 2,
Troublemaker, Capuchin, Daring the Dawn). Nästa: fyra-starter-nollan med registrerade prediktioner → skuld 17.

## [POLITIKBENET, STEG 2 + 3: OMRÖSTNINGEN] — bot v0.6.122 (18 september 2026, samma chatt)

Johan bekräftade decklistan (identisk med min rekonstruktion) och röstklockan: Hold on = betänketid, tallyn ELLER
klientens Votes-meny för röster, och en människa ska kunna trycka igenom med It resolves / tallyns Resolve så att
botten förkunnar utfallet direkt.

Byggt: `_refDeltas` (villkor + PUBLIKT bord → delta per plats), `_bestPoliticalFor` (titelkrav via req.titles,
req.unmodelled = aldrig, pass-estimat ur titelrösterna på bordet), `decide('action').pol`, `_callReferendum`
(terms-rad FÖRST → frozen announce → odirigerat blocksteg för byte + predator → polling → frozen Vote-rad →
resultatrad → It resolves), röstaren v0 (`_refVoteDir`), röstklockan (`_refPoll`), boostar (Bewitching Oration,
Ventrue HQ) som hålls tills räkningen kräver dem, mottagarsidan (`_onRefTerms` / `_refWindow` / `_onRefResult`:
insatsen känd → poolfrågan ställs ALDRIG; deltat landar från resultatraden, en gång, båda tecknen), arketypen
`ventrue`. Rättat på vägen: en bot som just röstat sade också "No votes from me" (District-grenens abstain-exit).

Designval värt att minnas: anroparen RÄKNAR de frysta `casts N votes`-raderna och skriver den auktoritativa
summan — bottarnas absoluta tally-skrivningar tävlar mot varandra på öppnings-kanten (förlorade uppdateringar).

Rök (INGEN utfallsslutsats): serie-pol-smoke2, 3 matcher, fyra starterlekar, pool 30, seed 11. 7 referendum
kallade: 6 antagna, 1 blockad (+1 blockad i en tidigare enmatchsrök); röster FÖR från en tvärsbords-nosferatu
(dess byte förlorade), EMOT från de drabbade; polls stängda på "everyone has spoken" varje gång; en 2-spelar-KRC
lade korrekt 1 på anroparen själv. Ventrue: utslagen först, 1 VP, vann med 4 VP.
Grindar: diag-96 42/0 (avbryter på v0.6.121), suite och canary — se READ-ME.
Kvar: steg 4 act-again (Freak Drive/Majesty), fyra-starter-nollan med registrerade prediktioner, tremere-testet.

## [POLITIKBENET, STEG 1: REFERENDUM-VILLKOR + GATEN] — bot v0.6.121 · cardfx v1.7.0 · coverage v1.1.31 (18 september 2026, ny chatt)

Johans riktning: hacking/sewer är för starka för att starterlekarna ska hinna "leka" → ta in Ventrue nu, enkel och
onyanserad röstning först, målet är simuleringar med FYRA starterlekar. Hans arbetsregel för korten: leta minsta
gemensamma nämnare och tagga i svep — poolskada (KRC, Parity Shift, Ancilla: samma sak, olika belopp och bas),
pool-gain/ekonomi (Parity Shifts andra halva, fångar Consanguineous Boon).

Byggt: nämnaren är "en antagen omröstning ändrar varje Methuselahs POOL" → `e.ref.pool` = termer
{sign, scope: alloc|each|chosen|self|move, n, per?, min?, others?, from?} + `ref.tags` (poolDmg/poolGain) + `ref.fx`
(de gamla auto-nycklarna). EN extraktor över alla 177 politiska kort: 14 får `ref.pool`, 7 bara tagg (villkorade
tillägg, löpande dräneringar, disciplin-delad text, X — "en fel term vilseleder"). Utfallsnycklar lämnar
`modes[].fx` på politiska kort = skuld 14 stängd i DATAN; `_mayPlay(..., asReferendum)` stänger den i botten också
(håller mot en äldre kompilering — 95b). `fxThreatOf` läser villkoren via `_refWorstPool`.

Fynd på vägen: (1) frågestegen "Will this action cost me pool?" är en chattfråga till en MÄNNISKA — vid ett rent
bottbord svarar ingen, stake = 0, ingen röstar emot och ingen blockar; anroparen måste logga villkoren maskinläsbart
(terms-raden, steg 2). (2) De andra starterlekarna HAR röster: malkavian 3 prinsar, tremere 2 prinsar + 2 primogen,
nosferatu 1 prins + 3 primogen + Protected District — omröstningarna blir riktiga. (3) Täckningsverktyget
certifierade Freak Drive och Majesty som spelbara: `unlock` har EN konsument (_bestUnlockReactFor, kräver reaktion +
`when`). Lagat i v1.1.31; Ventrue är ärligt FULL 39 / 77, inte 49. (4) `deck-ventrue.json` fanns inte — skapad ur
täckningsrapportens kvantiteter (77 + 12).

Grindar: test-cardfx 231/0 · diag-95 11/0 (faller 7 av 11 på gamla filer) · suite 1119/0 · CANARY 37/0 mot klient
v2.6.121 (första körningen sedan v0.6.117 — Johan laddade upp klientfilen). Ingen arenaserie: inget spelbeteende
ändrat för de fem befintliga lekarna (ingen av dem har politiska kort).
Nästa: steg 2 anroparen (`_callReferendum`, `_refDeltas`, terms-raden + spec till huvudprojektet) → steg 3
röstregeln → steg 4 act-again-konsument (Freak Drive, Majesty) → fyra-starter-nollan → tremere-testet (skuld 17).

## [SERIE-B2S5] — v0.6.120 mätt mot registrerad prediktion (18 september 2026, avslut)

HÖLL: wake-fönstren stängda (2 av 103 "ingen kropp men wake på hand", nollan 17 av 91), 24 wake-plays på
blockvägen (nos 10, malk 6, trem 5, hacking 3), malkavian T1 22 % (precis på linjen).
FÖLL: tremere T1 17 % (pred. ≥ 28, nollan 24), malkavians stealth-andel 43 % (pred. ≤ 33; 7 sheds räcker inte —
en discard per tur hinner inte ikapp 20 stealth-kort av 77 mot ett bord som blockar 20 %), malkavian through 26.
Hacking 5 av 5, 22 VP — 17 av 20 totalt. Läsning i specen §5.1: hålet är lagat men var inte den bindande
begränsningen för blockANDELEN; stealth-överskottet löses av vad leken SPELAR, inte av hur fort den slänger.
Nästa chatt: politisk typ-gate → Ventrue → nolla med fyra starterlekar → öppningsboken mätt mot den.

## [WAKE-BLOCKET + STEALTH-ÖVERSKOTTET] — v0.6.120 (18 september 2026, samma chatt)

Johans fråga: spelas starterlekarna rimligt? Svar ur 15 matcher: nej, inte än — tre hål UNDER strategilagret.
(1) Wakes backade aldrig ett bart block: bare-block-grenen läste bara olåsta kroppar, medan intercept-grenen
alltid räknat med wake. 96 av 330 "no unlocked body"-fönster hade en wake på hand. Lagat: `_wakeBlockers`,
`_wakeCardFor` (Eyes of Argus väcker bara på [AUS] — den blinda `_wakeCard` gav den till vem som helst),
EV betalar 0.35 för kortet, en wake på hand räknas som en kropp hemma (Johan: "har man wake kan man spela mer
aggressivt"). RÄTTELSE av min egen siffra: "en wake på 15 matcher" var fel mätt — blockvägens wake emittade
aldrig `play`; nu gör den det. (2) Malkavians hand 54 % stealth: `_stealthGlutIndex` — max tre (Johans tal),
dubbletter först så resten kan gå på samma action, fyra om bytet blockar ≥ 40 % av mina bleeds.
(3) Öppningen — INTE byggd: följ hjälpbladens rekommendation i playbooken men MÄT (Johan: cap 8 i stället för
cap 7 kan kosta en hel tur om transfers inte går jämnt upp). Skuld 13.

Ventrue/Toreador bedömda mot täckningsrapporterna + Black Chantrys hjälpblad: Ventrue går nu (26 % politik),
Toreador inte (52 %). FÖRST: `t: political` måste stängas ute ur pool-damage-findern (KRC skulle spelas utan
omröstning). Skuld 14. Suite 1108/0 (en körning). Rök: serie-b2s4, 2 matcher — ingen utfallsslutsats.

## [STRATEGILAGRET] — v0.6.119c + arena v1.3.3 (18 september 2026, fräsch chatt)

Start: de tre specarna fanns INTE i projektet (table-model, persona, feedback-loop) — byggt mot
sammanfattningarna i CLAUDE.md/journalen. Projektets cardfx-kopior prissatte fortfarande Underbridge
Stray till 1 pool (baseline-suiten 1052/2 på projektets egna filer) — curated rättad, omkompilerad,
diff = ett kort.

Nollans läsning per deck (manifest): tremere utnyttjar 63 % av sina kroppar (0.71 hemma/tur), 14 bleeds
på fem matcher; malkavian 17 bleed-actions; alla tappar ~5 pool per egen tur; bordet är dött runda 6–7.

Byggt: `this.plan` (fas + posture + target + home + floor + reads), `_strategize()` vid unlock och
minion-fasens huvud, egen anfallsliggare (`_myForecast`, `preyTto`), fyra konsumenter, en emit (`plan`),
ingen persona i lagret (93i). Prediktion registrerad FÖRE körning (specen §3).

Tre snitt på en dag, vart och ett efter en mätning (samma seeds som nollan, all-shark):
- **119 / serie-b2s3** — home som EV per kropp: höll racing-decken hemma mot svärmen. Sewer use 89 → 70 %,
  through 80 → 52, dog ändå samma tur. Hacking 4 vinster.
- **119b / serie-b2s3b** — home = minsta antal kroppar som köper en HEL predator-tur. Mot en svärm köper
  inget en tur → decken racear. Sewer tillbaka (72). Men tremere 36 → 19, färre raises; hacking 5 av 5.
- **119c** — planens influence-golv räknas och emittas men konsumeras bara med `o.planFloor` (ingen
  överlevnadsvinst, färre kroppar).

**Utfall mot prediktionen:** huvudlinjen (slow through ≥ 125) FÖLL två gånger (106, 82 mot 94).
Refuteringsklausulen gäller: allokering är inte där anfallet förloras. Klassvikterna är inerta —
de långsamma decken når aldrig preyTto ≤ 2 med två kroppar. Hacking har vunnit 12 av 15 matcher över
nollan + två serier. Skillnaden mellan b2s3 och b2s3b (106 vs 82) är lika stor som effekterna vi letar
efter: fem matcher räcker inte för att skilja varianter åt.

Lärdomar: (1) arenans default-timeout 120 s ogiltigförklarade tyst en 5p30-match — nu 600 s (v1.3.3);
(2) `pkill -f <mönster>` i sandlådan dödar det egna skalet; (3) en fräsch chatt ska börja med att
kontrollera att leveransens filer faktiskt nådde projektet (specarna, cardfx).

Öppet: prognoskalibreringen (skuld 5) INTE ommätt — scriptet från 18 sep finns inte i projektet. Canary
ej körd (ingen klientfil). Nästa: playbooks/öppningsbok (steg 4) — och Johans fråga om hacking-leken är
för snabb för starter-lekarna vid pool 30.

## [RENT INFÖR B2] — v0.6.118d + arena v1.3.2 (18 september 2026, sent)

Johans två punkter: (1) arenans sammanfattning per deck — nu en egen
tabell (wins/VP/först ut/dealt/taken/windows/blocks) och `byDeck` i
summary.json; (2) prognosen kalibrerad mot nollpunkten. Mätningen: träff-
grad 0.72–0.81 för alla fem decken (default 0.8 → 0.75), och forecast/
actual per bordsrunda 0.66 — prognosen ÖVER-läser nu när bottarna bar-
blockar (b2s1:s under-läsning var svärmen mot en som inte blockade).
Roten till skevheten: träffgraden delade blockerade med ALLA actions,
hunts inräknade. Johans lösning: handlingsklasser — offensiv / ekonomi /
utility — i liggaren; träffgrad = blockerade / offensiva. Sektion 92j.
Suite 1054/0. Skulderna 1–7 står i CLAUDE.md inför överlämningen.

## [B2:S RIKTIGA NOLLPUNKT] — all-shark, slumpade säten (18 september 2026)

Pre-flight: Stray = 1 blod (Johans domslut), canary 37/0 mot klient
v2.6.114 (första sedan v0.6.113), 5c-flaken lagad, suite 1051/0 ×3,
shark som default i arenan.

Buggen sharken hittade: med EN persona i listan blev slumpsittningen ett
säte lång → alla fem bottar fick hacking. Fem hacking-lekar mot varandra
i 20 minuter. Domaren (7 distinkta kort på 384 spel) och seats-raden
(`seats 1..1`) avslöjade det. Fixat (v1.3.1). Andra lärdomen: en detached
arena överlever inte en turgräns i sandlådan — serien delades på två
seeds (20260918: m1–2, 20260919: m3–5).

**Nollpunkten (serie-b2null-all, 5 matcher, alla shark, slumpade säten):**
hacking 3 vinster / 16 VP / aldrig först ut; sewer 1 vinst; malkavian 1
vinst men först ut 2 ggr; tremere 0 VP; nosferatu 0 VP men bordets bästa
blockerare (45 % T1). Bleed-through: hacking 157, sewer 80, tremere 36,
nosferatu 33, malkavian 25. Rundor 6/6/7/6/7. Domaren 0 mismatch på 41
kort. Hacking vinner oavsett säte — det är inte geometri längre.

Det B2:s strategilager ska ändra, mätt mot den här: (1) tremere/nosferatu
från 0 VP — de har försvar men inget anfallstempo; (2) malkavians bleed-
through från 25 — dom/obf ska inte vara bordets svagaste anfall; (3)
hackings vinstandel ned mot 1–2 av 5 utan att hacking försämras.

## [FYRA LAGER] — persona-specen omskriven (18 september 2026)

Johan gav modellen: fyra kunskapslager — egen lek, kort & arketyper, meta,
erfarenhet — och ett exempel (Govern-linjen mot lunge på 6) som visar
auktoritetsordningen 3 > 1 > 2 och hur tre personor ur samma underlag
spelar tre olika spel utan slump: novice ser inte L3, grinder ser L3
delvis, shark allt. Personan är vilka lager som är på plus planerings-
horisont (1 / 2 / 3+); planminnet är committed lines med omprövning, inte
sökning. Beslut: stödpinnen (pool-frågan i ask-stegen) är L3:s politiska
källa tills politikbenet finns; tre personor räcker. Specen ligger klar;
ordningen i §5 styr B2 framåt: strategilager → linjer i L1 → planminne →
lagerväxlar + ref → slips.

## [KORRIGERING] — mina per-deck-läsningar av b2s1/b2s2 var fel (17 september 2026, sent)

Jag läste traces per BOT-NAMN (Shark, Shark-2, Grinder, Grinder-2). Namnen
sätts efter persona-ORDNING efter rotationen — så i match 2 och 3 spelade
"Shark" nosferatu och "Shark-2" hacking, och i match 3 spelade "Grinder"
tremere. Rätt läsning via manifest-emiten (deck per bot per match):

- **Hacking vann alla sex matcherna** (5 VP varje gång) — inte 1 av 3.
  Nosferatu vann aldrig. "Nosferatu-hypotesen" var därmed ett icke-problem;
  torpor-räkningen (1/0/2) står ändå.
- **Nosferatu blockar mest** vid bordet: 52 % / 46 % av sina T1-fönster.
  Toolbox-decket är redan den bästa försvararen.
- **Sewer gick först ut i alla sex.** Hackings byte alla sex (fast grannskap).
- Bleed-through per serie: hacking 114/99, nosferatu 30/38, malkavian 24/7,
  tremere 19/20, sewer 12/19.
- "Sewer-kvotanomalin" var Grinder = tremere i match 3. Ingen anomali.

Lärdom, i learnings: nyckla aldrig en traceläsning på botnamn — manifestet
bär deck och säte per match. Harvest v1.2.1 skriver nu "who played what"
överst. Med slumpade säten (arena v1.3.0) är namnen ännu mindre stabila.

## [SLUMPADE SÄTEN] — arena v1.3.0 (17 september 2026, natt)

Johan frågade om placeringarna slumpas. Nej: rotationen flyttade paren ett
säte per match men grannarna följde med — hacking → sewer → malkavian →
tremere → nosferatu → hacking i varje match av b2s1 och b2s2. Malkavians
7 pool igenom var alltså "bleeda tremere-wallen tre gånger", inte deckets
kapacitet. Nu: slumpad placering per match ur ett run-seed (skrivs i
headern, `--seed N` upprepar), `--fixed-seats` för matchup-experiment,
seats-raden under varje match läses predator → prey. b2s1/b2s2:s per-deck-
rader ska läsas som geometribundna.

## [HEMMAKVOTEN + NOSFERATU-HYPOTESEN] — v0.6.118b, andra mätningen (17 september 2026, natt)

Johan frågade om tremere och nosferatu, de blockorienterade. Per-deck-
läsningen av b2s1: tremere blockade 22 % — men sju av tio block var
BARA kroppar; "ingen olåst kropp" i 27 av 46 fönster. Korten var aldrig
flaskhalsen. Hemmakvoten: grinding-deck håller 1 kropp hemma by design
(2 vid ≥ 4 ready), sämsta blockeraren agerar först så den som stannar är
den värd att behålla.

Nosferatu-hypotesen (andra bar-blockar in i combat och torporas) prövad
mot traces och FÖRKASTAD: torpor 1/0/2 i hela serien, två av dem Shark-2:s
egna. Shark-2 vann genom att bleeda 42 och 31 igenom.

b2s2 ×3: tremere no-body 27 → 13, block 21 → 28 %. Fortfarande 6/7/6
rundor och de långsamma decken först ut. Det som förklarar tabellen:
bleed-through per serie — hacking 57, nosferatu 80, sewer 21, tremere 18,
malkavian 7. De förlorar på anfall, inte försvar. B2 nästa = offence.
En flaky e2e-abort (5c, shuffle) på första suite-körningen, grön på
omkörning: 1050/0. Anomali: 3 kvot-keeps för sewer, som inte ska ha kvot.

## [BORDSMODELLEN] — v0.6.118, B2:s fundament och steg 1, första mätningen (17 september 2026, kväll)

Byggt enligt specen med Johans tre svar: knoppen gäller bara den bara
blockeringen (all intercept-logik kvar för alla), utrustning räknas,
trösklar är statistik (per-minion-prognos, combat-konsekvens-EV).

Två saker koden lärde mig. (1) Auto-tier-combatkort utan modellerad fx
(Torn Signpost) gav noll kategorier — en `combatCard`-kategori så askhögen
ändå talar. (2) Prognosen räknade bara OLÅSTA motståndarminions — på
bottens egen tur är predatorns minions låsta från sin tur, så tto blev 99
och håll-en-blockerare sköt aldrig i de två första matcherna. Alla ready
minions räknas nu; serien kördes om.

Fyra fixtures "genuine decline" (29a, 30, 85f, 86i) måste nu annonsera
stealth 1 — vid 0 blockar botten, vilket är poängen.

**Mätning (serie-b2s1 ×3, nollpunktsreceptet):** sewer-bytets T1-block
3/14, 4/14, 1/10 (var 0/11); 10 av 14 fönster fortfarande "ingen olåst
kropp" — decket bleedar med alla och håll-en-blockerare håller bara
sista kroppen vid tto ≤ 2. Matcher 7/7/6 rundor (var 6). Hacking svepte
5 VP i 1 av 3 (var 1 av 1); Nosferatu-Shark-2 vann 2. Bytet gick ändå
först alla tre. Prediktionen: blockfrekvensen upp men under 30 %,
överlevnad ej förbi runda 6. tto-sekvensen (1.43 → 0.64 på en predator-
tur) säger att prognosen under-läser en weenie-svärm: default-träffgrad
0.8 är för snäll och +bleed-modifiers finns inte i liggaren. Det är
B2 steg 2. Prisdomaren: 38 kort, 169 spel, 0 mismatch.

## [B2:S NOLLPUNKT] — 5p30 med prisdomaren, och varför weenie-bleedern svepte (17 september 2026)

Johan bad om en 5p30 som test av domaren. Standardreceptet: shark/
grinder/novice/grinder/shark på hacking/sewer/malkavian/tremere/nosferatu,
pool 30, trace `serie-5p30/match-1-mu5fgte0.jsonl` (775 rader, 118 s).
Domaren: 21 kort, 46 spel, 20 rätt, 0 mismatch, Creeping Sabotage X.
Revelations ×2, Magic of the Smith ×1, Vessel ×4, Parthenon ×2 betalade.

Resultat: Shark (hacking) 5 VP på sex rundor, Grinder → Novice → Grinder-2
→ Shark-2. Johan: "ganska extremt för en weenie bleeder — de är svaga
för blocks, och när poolen sjunker MÅSTE man börja blocka".

Traceläsning av bytet (Grinder, sewer): 11 T1-fönster, 11 gånger samma
utgång: `no usable intercept in hand` (rad 3143 i block-as-target).
Shark spelade INGEN stealth hela matchen (Computer Hacking ×13, stealth
0). Skulk stod olåst med 4 blod. En bar blockering vid 0 stealth är
regelsäker (0 ≥ 0) — men koden returnerar före `urgency`-raden (pool-
desperationen) så den vägdes aldrig. Sewer-decket har noll intercept-
kort per design, så det KAN aldrig blocka i dagens modell. Dessutom:
Grinder låste båda vampyrerna på egen tur vid pool 6 (posture).

Det är doktrinens §3.3 (bare block/chump) + §2.4 (posture) + T1-axeln
(desperation) — B2:s tre första drag, nu med ett uppmätt fall.

**Registrerad nollpunkt för B2** (evaluation doctrine §6): denna match.
Prediktion att pröva efter B2 steg 1 (bar blockering vid stealthA 0 med
olåst kropp, `urgency` FÖRE intercept-returen, en blockerare kvar olåst
när predatorn är en känd bleeder): hacking-deckets byte överlever förbi
runda 6, och bytets T1-blockfrekvens går från 0/11 till >30 %. Hacking-
deckets oust-tempo är kontrollvariabeln — inte VP-summan.

Tidigare serier var missvisande om VINNAREN (prisfelet) men giltiga för
beteende och korthantering; från den här matchen börjar räkningen om.

## [PRISDOMAREN] — varför ingen 5p30 såg de 27 gratiskorten (17 september 2026, harvest v1.2.0, batch v1.0.1)

Johan frågade det uppenbara: hur kunde arenan spela hunting grounds
gratis sedan juli utan att något syntes? Svaret är att arenan saknar
domare — alla bottar läser samma cardfx och bokför sin egen pool, så
ett fel pris betalas av alla lika och ingen kurva rör sig. Batteriet
testade "betalar botten `cost`?" och aldrig "stämmer `cost` med kortet?".

Harvesten prissätter nu varje spelat kort (play/through/blocked +
master-play-decides) från två källor som måste vara överens: vtes.json
och elysium-cardfx.json. Bevisat på en 3-bot-quickie (tremere/malkavian/
nosferatu, 76 s): kostnaden borttagen → MISMATCH 1, levererad fil → 0.
Batch-scaffolden fick en ekonomigate före strategidomen. Beslut med
Johan: prisdomaren FÖRE B2 — B2:s serie ska mätas på en ekonomi vi
litar på.

Projektfilen elysium-cardfx.json var redan v1.6.14 när jag tittade —
Johan hade laddat upp leveransen; "gamla" cardfx fick tillverkas genom
att stryka en kostnad.

## [DE TALADE FASERNA + DEN ÄRVDA KOSTNADEN] — brusfinliret och 27 gratiskort (16 september 2026, bot v0.6.117, cardfx v1.6.14)

Johan visade två loggklipp. Online: dubbletter kring bottens
influence — `Nassir: blood 1 → 4`, `revealed Nassir`, `uncontrolled →
ready`, `pool 23 → 20` bredvid bottens egen `Influence: Nassir rises`.
Offline: samma parti helt rent, förutom två rader som var bottens
EGNA dubbletter (`Astrid plays X.` + `X.`, `Turn passed.` + `passes.`).

**Dubbletterna var inte helpers.** Raderna kommer från serverns
resource ledger (`ledgerDiff`/`ledgerLive`, srv v2.5.66) — anti-cheat-
spåret, ovillkorligt, bara online (hotseat-pubs går inte via servern).
Så helper-gaten rörs inte; det som går bort är bottens egna dubbletter,
offline som online. Sorteringen av ~90 `note()`-anrop i tre högar: ren
dubblett (stryk), förklarar VARFÖR (behåll som log), sånt en människa
säger högt (chat). Johans influence-mening är hög 3:s förebild; loopen
har sex utgångar så meningen samlas i en collector och sägs i `finally`.

**Hunting Ground betalade inte 2 pool — och 26 kort till.** Curated-
overlayen är whole-entry replacement; curated-entryn för hunting-
ground-familjen (19 juli) skrev bara `modes`. Mätt mot Johans vtes.json:
27 curerade kort saknade sin datakostnad. Compilern ärver nu numerisk
kostnad när curated tiger, och rapporterar inherited / mismatch / X.
Fame, Information Highway och Smiling Jack som jag gissade var betal-
kort i chatten är gratis enligt datan — gissningen var fel, mätningen
rätt. Revelations och Magic of the Smith fick sin blood-kostnad tillbaka
och var därmed två nya obetalda kostnader i botten (v0.6.116-mönstret).

Suite 1002/0 ×3. Två fixtures lärde mig att seat 2 turn 1 kan höja två
cap-1-vampyrer i samma mening, och att playbook-namnet `zip` sägs som
det står. Canary ej körd (klientfilen saknas här).

Öppet för Johan: Underbridge Stray (curated pool 1 vs data blood 1);
`The bleed goes through` kvar på log tier; `Blocked by X. Combat
begins.` orörd (hand-off med blockerarens namn, sektion 36).

## [SJÄLVGRANSKNINGEN] — två fynd i fyra rader jag själv skrev (16 september 2026, bot v0.6.115)

Johan ställde den stående frågan efter en grön leverans, och båda
fynden satt i v0.6.114:s stoppurskod, skriven samma kväll.

**`null` betydde två saker.** `a.deadline === null` var för min ringkod
"ingen deadline ännu" och för Hold on-koden (rad 4363) "en människa
håller fönstret". Ringningen läste den första betydelsen och armade
en klocka på ett hållet fönster — det stängde efter ~7 s trots hålla-
knappen. En grep på `deadline = null` gav svaret; det borde ha gjorts
innan raden skrevs. Nu: ringningen stämplar aldrig om ett pausat
fönster.

**Tre arm-sajter mot femton omstarter.** Stoppuret armades bara när
fönstret öppnades; `_restartAskTimer` körs vid all bordsaktivitet och
återställde till fullt askSecs. En reaction spelad efter ringningen gav
tillbaka de 20 sekunder v0.6.114 tog bort — i exakt det fall som
inträffar vid ett bord och inte i ett test. Tystnad börjar om vid
aktivitet, alltså armar varje omstart om stoppuret. Ett fönster slutar
nu ≤ reactClockMs + reactSecs + grace efter *senaste* aktivitet.

Sektion 89 +5 (89g); diag-89 27/0, 2 röda mot v0.6.114 — exakt de två
buggarna. **964/0 ×3, canary 37/0, HB1 11/11.**

Övrigt granskat och lämnat: notes mot andra bottars L12-grammatik
(genomgånget, grönt i bot-vs-bot-sektionerna, nu en explicit regel i
CLAUDE.md), Block!-spam i reactions-only-fönstret (harmlöst, begränsas
av fix 2), tally-spegeln mot vote-edgen (invariant).

## [DE TRE NIVÅERNA] — 129 chattrader, en fråga, och fyra bordsfixar (16 september 2026, bot v0.6.114)

Johans runda före testet hade fem punkter. Den största var bruset:
klienten renderar `log` utan bubbla, `chat` som lugn bubbla och `say`
som snabbfras-animation, men boten pratade på chat-nivå om nästan allt
— ett kortspel nådde bordet tre gånger (fx-klon, frusen loggrad och en
bubbla som sa samma sak). Inventeringen av 129 `chat()`-sajter blev
enkel så fort frågan var rätt ställd: **kräver raden att en människa
GÖR något?** Frågor och instruktioner behåller bubblan (20 sajter).
Allt annat är händelser, och en händelse som redan har fx eller
loggrad är en `note()` (86) eller ingenting (10 rena dubbletter).
"Blocked. Combat begins." överlevde som note — den säger något som
varken fx:en eller verdictraden säger lika kort. Johans två egna val:
influence-raderna är log (fasraden ramar redan in dem), bleed-resolve
är log tills det känns för diskret.

**Actor-fältet fanns redan.** Frågan om att markera minionen som
spelar såg ut som en klientfråga tills `cardFx` visade `fx.actor`
renderat som `[vampyr] ➤ [kort]` med caption. Boten hade skickat
`actor: null` på 50 sajter. 32 blev vampyren, masters/events/rise
ingen.

**Kommentaren som förklarade buggen.** `cheapest.faceDown = false //
blood is being placed — the vampire is now visible` såg ut som en regel
i femton versioner. Identiteten är dold till rise; markörerna är
publika. Rise-grenen flippar, rise-fx:en är bordets flipp.

**Regeln fanns på ena sidan.** Försvararen visste sedan steg 5 att
block aldrig återöppnas efter en modifier; aktören frågade "Reactions?"
genom det vanliga blockfönstret, som fortfarande contestade ett Block!.
Nu ett reactions-only-fönster som avvisar Block! högt.

**Två klockor utan koppling.** askSecs (20 s) och rummets stoppur (5 s)
löpte oberoende; bordet satt genom skillnaden. Vid ringningen stämplas
deadline om till stoppurets slut + 2 s, aldrig senare än den som redan
hölls. Nu betyder nedräkningen det den ser ut att betyda.

Sviten: 31 fixtures som läste chat blev log (`.msg` → `.html`); tre
bot-vs-bot-assertions blev blinda eftersom servern inte ekar en
avsändares egna loggrader — beviset flyttade till motståndarens feed.
En `waitFor` → `waitAny` (bounce-raden före re-announcen). `status()`
var upptaget av widget-seamen, därav `note()`.

Grind: sektion 89 (22 assertions, `diag-89.js`; kastar på v0.6.113 vid
första `note()`-anropet). **959/0 ×3, canary 37/0 mot v2.6.114, HB1
11/11.** Min "17 Blocked-rader" var en felräkning: 13 fanns, 13 finns.

**Osäkert:** `NAME attempts to block.`-loggraden utan shout i ett
reactions-only-fönster går bara till räknaren (troligen harmlöst);
`_restartAskTimer` vid ny aktivitet efter ringningen återgår till fullt
askSecs utan att arma om stoppuret (som förut, men syns mer nu); och
om bleed-resolve som log är för tyst avgörs vid bordet.

## [THE HELPER GATE] — faserna som tystnade när låset började hålla (16 september 2026, bot v0.6.113, arena v1.2.9)

Johans observation var inverterad på ett sätt som bara kan betyda en
felaktig proxy: med Helpers-låset TRASIGT (helpers av) stegade bottarna
igenom sina faser i loggen; med låset FIXAT (helpers på) blev de tysta.
`_announcePhase` visade sig gatad på `caps.tally` — "har jag sett en
resolver-räknare på tråden" — och samma flagga gatade `_announceTallyA`,
båda blockverdicten i `block-as-target` och `Block!`-hanteraren.

**Varför proxyn slog fel:** klientens `avrFreeAvailable()` är sann exakt
när alla tre res-helpers är av. Då ligger den nakna `free`-räknaren
framme från första rendern och varje ±-klick skickar en tally. Med
helpers på är strippen dold tills någon öppnar Block/Vote/Combat. Så
v2.6.111-buggen hade försett boten med sin seed av misstag, via Johans
lokala tournament-inställning. Offline har hotBridge aldrig relayat
tally alls — hotseat-bottar har alltså aldrig annonserat faser och aldrig
blockat. Och arenan hade träffat samma sak 16 juli och seedat en tally
i stället för att laga roten; kommentaren beskrev chicken-and-egg:et
exakt och blev ändå aldrig ett ärende.

**Det större fyndet** var inte fasraderna utan att blockandet var
avstängt: `!caps.tally → 'classic table (no resolver) — let it through'`
på båda vägarna. Vid ett helpers-on-bord online blockade bottarna
ingenting förrän någon råkat öppna en räknare. Proben (12 assertions,
sen sektion 88) bekräftade allt inklusive att `joined{helperPolicy}` och
`helperPolicy`-broadcasten aldrig lästes.

**Designvalet, med Johan:** dela frågan i två. Spellogik (blocka?)
läser aldrig helper-state. Strukturerad narration (fasrader, egna
stealth/intercept-siffror på den delade räknaren, §12-verdictet) är
bottens EGET protokoll — motsvarigheten till att säga "Unlock" högt så
bordet kan Hold on — och är ovillkorlig, samma klass som `Turn passed.`.
`Block!` öppnar alltid referendumet; klockan deklarerar ur bottens egen
tally om ingen människa löser först — boten är resolver-hållare när
ingen annan är det. `_writeTally` speglar sina skrivningar lokalt med
serverns merge-regel så det funkar där inget eko finns. Alternativet —
läsa policyn från tråden — valdes bort (inga nya kontrakt, ingen
"saknad nyckel"-semantik, bottbord är helpers-on per konstruktion) men
är dokumenterat i `elysium-bot-helper-gate-decision.md` med sitt
trigger-villkor.

**En fixture föll:** sektion 1:s "board shows a ready vampire" använde
`waitFor`, som hoppar permanent över allt den passerar. Phase-raden
flyttade rise-boarden före Influence-chatten, väntan matchade en senare
board och svalde `turn`. Retarget till `waitAny`, som finns för exakt
det. Probemetoden (wrappa `bot.send` + `onEvent`, dumpa `host.inbox` med
index i catchen) står i SKILLS.

Grind: sektion 88 (16 assertions, `diag-88.js`), destruktivt 7 röda mot
v0.6.112. **937/0 ×3, canary 37/0 mot klient v2.6.114, HB1 11/11.**
Arena utan seed: 17 blockfönster, 3 block vägda, 0 `classic table`.
Handover: `HANDOFF-to-main-project-2026-09-16.md` — främst en
webbläsarkoll: helpers-on-bord får nu en `mode:'block'`-tally vid varje
bot-announce, vilket pinnar Played-fliken oftare.

**Osäkert:** exakt vilket klick som seedade Johans gamla session (free-
räknaren är troligast, vilken resolver-touch som helst räckte), och om
det tätare Played-pinnandet upplevs som struktur eller brus.

## [JOHANS FEEDBACKRUNDA R4] — debugläget: 34 mutationssajter, en hook (15 september 2026, bot v0.6.112)

Johan frågade om öppen hand är en ögonblicksbild eller live. Svaret
fanns bara genom att läsa BÅDA sidorna av tråden: servern lagrar
ingenting och routar bara givarens kortlista, vilket läser som
ögonblicksbild — men mottagarklienten skriver över sin lagrade grant
och ritar om direkt, så en ompush ÄR en liveuppdatering. Klientens egen
kommentar på handlern säger det rakt ut. Ingen halva ensam besvarar
frågan, och svaret avgjorde hela designen.

**Det avgörande fyndet:** handen muteras på 34 ställen i filen. Att
haka `_syncOpenHand` på var och en är precis hur man missar den 35:e,
och felet är tyst — Johan hade suttit och utvärderat botens beslut mot
fel kortlista utan att någonsin få veta det. Men alla 34 slutar redan i
`push()`, och `push()` trattas genom en enda köad flush. En hook där
täcker allt per konstruktion. Det visade sig dessutom vara exakt vad
klienten själv gör: `refreshOpenHands()` hänger på `schedulePush()` av
samma skäl. När en funktion behöver observera "varje ändring av X",
leta efter tratten X redan rinner genom i stället för att räkna upp
källorna.

Signaturvakt på handen så att en board-push som inte rörde den aldrig
går ut. Ordningskänslig med flit: en omordnad hand är en annan vy.

Viktningen hakar i `decide()`, som redan är den enda tratten varje
bedömning passerar. Den går som `log`, aldrig chat — referensmaterial
man scrollar i, och på chatt-nivå hade den dränkt bordet den ska
förklara.

**Debug annonserar sig själv i chatten vid givet.** Ett bord som kan se
botens hand måste veta det, och den som mest behöver få veta är den som
INTE satte flaggan. Ett tyst debugläge är inte ett debugläge, det är
ett orättvist bord. Armeringen sker vid giv och inte vid konstruktion,
eftersom `openHand` är started-gated på servern.

Grind: sektion 87 (20 assertions), destruktivt 7 röda mot v0.6.111.
**921/0 x3, canary 37/0, HB1 11/11.**

Levererat tillsammans med `HANDOFF-to-main-project-2026-09-15.md`:
reglaget är en klientkontroll, och den måste tvingas av i Tournament
mode eftersom boten inte kan se bordets läge.

**Feedbackrundan R1-R4 är därmed klar.** Inget i den är längre blockerat
på oss.

**Efterskrift (samma dag): förbehållet jag skrev var fel.** Jag varnade
Johan för att loggen troligen skulle bli gles eftersom "flera grenar
returnerar inget `why`". När han bad mig skriva ner det räknade jag i
stället: 25 returpunkter över de 15 decide-grenarna, varav exakt TVÅ
renderar ingenting — `react-delay` (en varaktighet, inte ett omdöme)
och `hunt-or-bleed`s tomma inget-att-göra-retur. `block-as-target` bär
`why` på alla sina elva returer. Loggen är alltså tät som standard.

Min första mätning sa 1 av 15 tysta grenar, min andra sa fyra — båda
fel, för regexen `(\w+)\s*:` ser inga nycklar i JavaScripts
shorthand (`return { pick, why, scores }`). Det tredje försöket, som
matchade hela returuttrycket, gav den riktiga siffran.

Lärdomen är inte om regexer: **ett förbehåll man skriver in i ett
projekts dokument blir något nästa läsare planerar runt.** Ett omätt
förbehåll planterar en falsk oro som överlever samtalet. Räkna först,
skriv sen. Siffrorna står nu i koden bredvid `_logWeight`, i CLAUDE.md
och i context, tillsammans med regeln: saknas en `why` fyller man på i
seamen, aldrig i renderaren — en renderare som hittar på resonemang
hade fått Johan att utvärdera ett skäl boten aldrig hade.

## [JOHANS FEEDBACKRUNDA R3] — politiken: kravet som redan var byggt, och rösterna som stod i datan (15 september 2026, bot v0.6.111)

Johans politikpunkt hade två halvor och den svåraste visade sig kosta
noll rader. **"Botten bör hålla i den informationen tills voteringen är
klar och handlingen är Resolved, varpå den reducerar sin pool precis
som med bleed"** — det gör R2:s `pending` redan. Den överlever ett
godtyckligt intervall och dras vid aktörens `It resolves`, så ett helt
referendum passerar under den utan att någon rör något. Det är
avkastningen på att ha valt den tråkiga representationen i R2: svaret
blev ett *befintligt objekt* i stället för ett nytt tillstånd, och en
runda senare betalade det sig.

Det R3 faktiskt lade till var att en politisk handling öppnar stegen
**själv** (`o.politicsAsk`), i stället för att vänta på ett "Any
blocks?" som ett bord på väg in i en votering sällan pausar för.

**Rösterna stod i datan.** Jag var på väg att hårdkoda en
title→votes-tabell (Primogen 1, Prince 2, Justicar 3…) när en grep
visade att cryptposterna i cardfx bär både `title` och `votes` per
vampyr — inklusive korten vars röster inte följer titeln. En tabell
hade varit tyst fel på exakt de ovanliga korten som betyder något.
Låsta titlade minions räknas (regelboken, och klientens egen not på
menyvalet), torpor gör det inte.

**Riktningen är R2:s svar, inte ett nytt omdöme:** kostar det mig pool
→ rösta emot, kostar det inget → avstå. Boten kan inte modellera
bordets diplomati, och att uppfinna en preferens den inte kan försvara
är sämre än tystnad. Johans egen ram för hela submenyn var "viss
reaktion åtminstone", inte en politikmotor. Persona-viktning,
förhandling och röstbyten är nästa dimension, medvetet inte v1.

En placeringsfälla: `_castTitleVotes` måste köra **före**
Protected District-grenen, vars tre avstå-returer annars hade svalt
den helt — en tyst no-op som inget påstående om själva rösten hade
fångat.

Grind: sektion 86 (19 assertions) grön första körningen, destruktivt
bekräftad mot v0.6.110. **901/0 ×3, canary 37/0, HB1 11/11.**

Osäkert: boten röstar bara emot, aldrig för — så ett referendum som
gynnar den passerar utan dess hjälp. Avsiktligt i v1, men första gången
någon spelar en Kine Resources Contested som *inte* träffar boten
kommer den se passiv ut vid bordet. Och `_refVotes` räknas men används
inte till något beslut ännu; den ligger där för politikmotorn.

## [JOHANS FEEDBACKRUNDA R2] — bordet kan nu fråga botten: frågestegen som blev en bleed, och Who blocks?-nåden (15 september 2026, bot v0.6.110)

Johans två beslut styrde formen: (A) svaret på "Will this action
cause me to lose pool?" lever bara med den pågående handlingen — borta
vid aktörens `It resolves` eller när nästa handling skriver över
minnet; (B) en obesvarad fråga går på `askSecs`-klockan och faller
tillbaka på "blockar inte". Han lade också en framtidstanke: ett
matchlångt minne som rensas vid spelslut, som relationskontext för att
läsa spelares taktik och diplomati. Inte schemalagd; noterad i context.

**Det viktiga fyndet innan en rad kod:** frågestegen behövde ingen
egen scorer. "Den här handlingen kostar mig N pool om den resolvar" är
exakt vad en bleed på N redan är för boten — ett `pending` av sorten
T1 med `amount = N` får den befintliga directed-scorern att väga den
(`urgency = amount/pool`), `_reactWindow` säger Hold on och beslutar,
`_commitBlock`/Pass följer, och `_applyPending` drar poolen vid `It
resolves`. Enda nya beslutskoden är de två frågorna. Bounce spärras
för den nya sorten — en okänd handling är ingen bleed.

**Korttidsminnet** var det som faktiskt saknades: boten mindes inte ens
att en människa gjort något. `L12.actObs` matchar klientens
menygrammatik plus ett kortspel och lägger senaste handling från annan
plats i `_obs`. Det öppnar inget fönster; det finns för att ett senare
"Any blocks?" ska veta VILKEN handling bordet menar.

**Who blocks?-nåden** har tre fall, inte ett: rop-sedan-rad,
rad-sedan-rop, rop ensamt. De två första ska köra handlern exakt en
gång och aldrig fråga; bara det tredje frågar (efter
`o.whoBlocksGraceMs`, 2500). Stämplar på ask-objektet (`_sayBlockFrom`,
`_lineBlockFrom`) är det som skiljer dem åt. `NAME blocks.` parsas
BREDVID `attempts to block.` — beslutet vi tog: båda, aldrig välja.

Grind: sektion 85 (25 assertions) grön första körningen, destruktivt
bekräftad mot v0.6.109 (SAY 8, inget minne, tystnad på prompt, ingen
pq-rung). Sviten hittade en sak: releasenoten bröt 82c:s 4 kB-tak.
**882/0 ×3, canary 37/0 mot v2.6.107, HB1 11/11.**

Nästa: R3 politik på `calls a political action.` — stegen återanvänds
orörd, talet hålls tills referendumet är resolved. Sedan R4 debug.

Osäkert: `L12.actObs` fångar `plays X.` brett — även ett masterkort
spelat av en människa hamnar i minnet. Ofarligt (minnet beslutar
inget), men ett "Any blocks?" direkt efter ett master-spel skulle ge
frågan på fel sak; bordet svarar bara No. Och frågan går till hela
bordet, inte bara aktören — avsiktligt (bordet är domare), men värt att
se live om det förvirrar.

## [JOHANS FEEDBACKRUNDA R1] — widget-sömmen, två tempoknoppar och fem synlighetsfynd; Vessel-diagnosen i handovern visade sig fel (14 september 2026, bot v0.6.109)

Johan testade bottarna online för första gången och kom tillbaka med
13 punkter. Huvudprojektet hade redan skeppat sin halva (klient
v2.6.107, srv-2.6.37) och lämnat över `HANDOFF-to-bot-project-2026-09-14.md`.
Sessionen började med att korsläsa handovern mot originalfeedbacken
och mot koden — vilket lönade sig på tre ställen.

**Handovern hade fel om Vessel.** Den gissade på cardfx-datan
("verify against KRCG before changing anything; we did not have
elysium-cardfx.json on hand"). Vi har filen: både `elysium-cardfx.json`
och `cardfx-curated.json` bär `cost.pool: 1`. `_bestMasterFor` läser
den, spelplatsen drar den, `push()` syncar den. Botten har alltid
betalat. Det Johan såg var osynlighet: spelraden säger bara "plays
Vessel on X.", och eftersom Vessel är en trifle köper bonushandlingen
ofta ett andra masterkort vars egen inkomst lämnar tillbaka poolen i
samma fas — nettot ser ut som noll. Fixen blev en additiv statusrad,
inte en dataändring. **Lärdomen: en rapport om att något inte händer
kan lika gärna vara en rapport om att det inte syns.**

**#4 var inte heller en logikordning.** Handovern bad oss "run the
unlock itself first". Den körde redan först — loopen ligger överst i
`_unlockPhase`, före fasannonsen. Buggen var `push()`-ordningen:
ingenting syncades förrän inkomsten pushade, så Edge- och Vessel-raderna
landade på filten innan korten syntes vändas upp. En `push()` efter
unlock-loopen räckte. Attributionen fanns dessutom redan i loggen;
det som saknades var det visuella, så fasinkomsten `fxClone`:ar nu
kortet som orsakade effekten.

**#7b var mycket smalare än "124 chat-sajter".** Paret var rad 3189
(chatten) och `_askBlock` i minionloopen. Raderna direkt ovanför
loggade redan båda halvorna, så chatten raderades i stället för att
degraderas till log — det fanns ingenting i den som loggen inte redan
sa.

**Widget-sömmen (#1) fick en frusen regel innan den fick kod:** `step()`
får aldrig producera ett utfall botten inte kunnat nå själv. Den regeln
betalade sig direkt. Första utkastet lät ask-rungen anropa
`_answer('no')` — vilket hade svalt ett vinnande block i en *contested*
runda, eftersom timerns egen kropp i det läget deklarerar verdiktet ur
tallyn i stället. Lösningen blev att bryta ut timerns kropp till
`_askTimeout()` och låta knappen anropa den. Nu är "samma utfall som
klockan" inte en ambition utan en identitet. Holds är steppbara och
saknar deadline med flit; en beat och en egen reaktionsruta är
läsbara men inte steppbara.

**Grinden — och det jag först hade fel om.** `test-bot-logic.js`
aborterade i sektion 5 ("combat resolution line"). Den gjorde det lika
mycket på orörd v0.6.108, så jag skrev "miljö" i fyra dokument och
verifierade sektion 84 i ett utbrutet harness (`diag-84.js`, 25/0,
destruktivt 0/9 mot gamla boten). När Johan bad mig köra sviten igen
gick jag tillbaka till journalen: **v0.6.108 skeppades med sviten
okörd** ("nätverket var av, `ws` saknades"). Min baslinje var alltså
ingen baslinje. Orsaken: `chat()`:s persona-rewrite skyddar
combat-prefixet med `.replace(/Trainbot combat/, name + ' combat')`
FÖRST — en no-op när botten faktiskt heter Trainbot (default-namnet) —
varpå nästa replace manglar det till "Trainbot (bot) combat". Varje
mottagarbots `^(?:\S+ combat — )?(.+?) presses to` kapturerade då
"Trainbot (bot) combat — Lisa" som vampyrnamn. Bot-mot-bot-combat har
varit trasig vid varje människobord med default-namn sedan 12 sep;
arenan roterar namn och såg det aldrig. Sentinel-fix.

Sedan sviten kunde gå i mål hittade den ytterligare åtta stale
fixturer, alla v0.6.108-doktrin som sviten aldrig hann ikapp: fyra
combat-prefix-matchningar på bottar som inte heter Trainbot (20/36/38),
60b (tre assertions som kodifierade den atomära influence-modellens
"gå inte under golvet → gör inget" där planner-specen rad 123 säger
"investera ner till golvet, aldrig genom det" — boten gör rätt), och
76a (v0.6.107:s "acka Hold on vid hooken" där v0.6.108 flyttade acken
till gaten). Sviten kräver dessutom ALLA ägda filer bredvid sig — en
saknad `elysium-bot-arena.js` aborterar vid 46 och ser ut som ett
testfel.

**Slutligt: 857/0 ×3, canary 37/0 mot klient v2.6.107, HB1 11/11.**
Lärdomen står i learnings: "det failar på gamla också" friar bara om
gamla var känt grön.

**Egen granskning före överlämning gav två till.** Ask-deadlinen
överlevde en `Hold on…`-paus: pausen nollar `a.timer` men rörde inte
`a.deadline`, så `status()` hade rapporterat en stämpel från före pausen
— widgeten skulle räknat ned en pausad ruta förbi noll och blivit
stående där. Stämpeln dör nu med timern, och en pausad ask rapporterar
`until: null` precis som ett hold. Och sektion 6:s test på
Reaction-timern hade 8000 ms tak, vilket med stoppuret flyttat till
7000 lämnade 1 sekunds marginal — exakt den latensflake-form sektion 5
redan dokumenterar. Vidgat till 12000. Båda var mina egna, båda hittades
genom att läsa diffen en gång till i stället för att lita på att
testerna var gröna: 25/0 säger ingenting om det jag aldrig mätte.

Nästa: R2 (SAY 8/9, `NAME blocks.`-parsern, frågestegen "Will this
action cause me to lose pool?" → "How much?", "Who blocks?"-nåden),
sedan R3 politik ovanpå samma stege, sedan R4 debug-läget — vars
klientreglage är en huvudprojektfråga, så boten först.

Osäkert: `_askTimeout()` läser `this._ask` vid entry där closuren förr
fångade `a` — om en gammal timer överlever in i en NY ask opererar den
nu på den nya (förr på den gamla). Jag har inte hittat en väg dit
(varje `_answer` nollar och clearar), men det är en beteendeskillnad
jag inte kan bevisa bort utan full svit. `pending.reactAt` sätts bara
när `_reactWindow` faktiskt kört, så widgeten kan se en `pending` utan
countdown en kort stund — avsiktligt, men värt att titta på live.



Sessionen startade i offline play på elysium.cards med 2 bottar och 1
spelare, och gick från regelriktighet i influence till det som faktiskt
står i vägen för en människa vid bordet.

**Influence — tre fel i samma domän.** `this.inf += ...` nollställdes
aldrig mellan rundor, så botten *sparade* transfers, vilket
grundreglerna inte tillåter. Staggern `min(availInf, this.seat)` gällde
dessutom bara botens allra första egna runda; den riktiga staggern är
bordsvid, så seat 1 i ett 2-spelarbord fick 4 transfers på sin andra
runda där reglerna ger 3. Nu: `tableTurn = (ownTurns-1)*nPlayers + seat`,
capped på 4, och `this.inf =` i stället för `+=`. Tredje felet var
följdfelet: hela `_influenceLoop` väntade tills `inf >= need` och gjorde
hela raisen atomiskt, så botten lade aldrig ut blod stegvis. Nu spenderas
`min(inf, need, pool-floor)` per varv, vampyren står kvar i uncontrolled
med synligt blod tills den når capacity och reser sig då. Klienten
renderade redan blod i uncontrolled (`COUNTER_ZONES`) och har samma
transfer-ramp sedan v2.6.67, så det behövdes ingen klientändring.

**`_planInfluence` — Johans tre axlar.** `_pickRaise` var en girig
single-pick som såg tempo och handsynergi men aldrig transfermatematiken
mellan flera vampyrer. Den nya plannern simulerar fyllordningar över det
*kända* transferschemat (1-3-4-4… för seat 1 i 2-spelarspel) och poängsätter
tempo (när första vampyren reser sig, tyngst) / efficiency / synergi.
Fulla permutationer vid ≤4 kandidater, prunad top-12 vid fler; ~600
aritmetiska steg, försumbart. Viktig korrigering under vägen: överblivna
transfers är inte spill utan crypt draws — för weenie bleed är ett
konstant inflöde av vampyrer nästan ett måste. Mätt i simuleringen:
waste 23 → 3 med draws modellerade. `_pickRaise` behölls orörd för
testkompatibilitet. Design: `elysium-bot-influence-planner-spec.md`.
Vikterna (3.0 / 1.0 / 2.0 / 1.5) är otestade i skarpt spel och är det
som arenan bör kalibrera först.

**Flerbottsbruset.** Med 2+ bottar greetade alla samtidigt, alla
kvitterade samma "Hold on", alla svarade på ett bart `help`, och alla tog
skada av ett bart `bleed 3` — grammatiken var skriven för enbottsspel.
`_isSpokesBot()` (lägst seat) äger nu de bordsvida svaren, håll-kvittensen
flyttade till gaten (se nedan), och skadegrammatiken är scopad till
avsändarens prey med `@Name bleed N` som sikte. All chatt bär
personanamnet med `(bot)`-suffix; combat-prefixet lämnas bart eftersom de
fem inkommande parsrarna matchar `\S+ combat —`. Greetingen lär ut den
scopade formen när flera bottar sitter, så en feltajmad bleed är
självförklarande — bot-ackarna namnger sig själva.

**Hållet — tre halva regler blir en.** Klientöverlämningen
(`elysium-bot-handoff-2026-09-12.md`, punkt 1/3/4) pekade på tre buggar
som visade sig vara samma sak: håll-systemet var utspritt över
`_holdHook`, pause-grenen i `_onSay` och `_pace`-gaten, och vart och ett
hade sin egen halva regel. Punkt 3 var dessutom en kritik av `iAmRelevant`
som infördes tidigare i *den här* sessionen — korrekt kritik: ett håll som
landade när ingen bot var relevant annonserades aldrig, och påminnaren
armerades aldrig. Lösningen blev inte deras föreslagna omvärdering vid
turskifte utan en flytt: `_holdHook` är rent tracking, och `_holdGate()`
i `_pace` annonserar. Den bot som faktiskt står blockerad *är* per
definition rätt bot att tala, så relevans-heuristiken försvinner helt och
anti-flood blir exakt av sig självt. Release från vilken icke-bot som
helst tömmer hela det namnnycklade setet (Bob kan släppa Alices håll på
hotseat). Punkt 1 var värre än överlämningen visste: min soft-promotion
från samma session låg ofiltrerad i samma gren, så en bots "Hold on…"
både parkerade timern *och* blåste upp `eligible` — vilket förklarar
`passed: []` i deras mätta deadlock. Bot-filtret täcker båda raderna;
ask-svaren är orörda så bot-vs-bot-modellen lever.

**Punkt 2** löstes som `_pendingTurn` med en staleness-guard
(`turnSeat === seat` vid avspelning, inte bara vid köandet), vilket också
täcker kastvägen som överlämningen inte nämnde.

**Kvar att göra.** Ingen `_pace`-ceiling lades in — se learnings. Sviten
och 5p30-serien är inte körda i den här sessionen (nätverket var av, `ws`
saknades); riktade smoke-tester för varje ändring är gröna men den skarpa
utvärderingen ligger hos Johan. Klientsidan ska underrättas om att
v2.6.95-workarounden kan tas bort.


## [B1 — UNDIRECTED-FÖNSTRET] — bottarna får rätt att blocka varandras odirigerade aktioner: prey först, predator sedan, hotklasserna styr (11 september 2026, bot v0.6.107, arena v1.2.8, svit 831/0 ×3)

Doktrinens §3/§5 byggd. Grammatikfamiljen `L12.u*` parsar bottens egna
frysta announce-rader (hunts / equips|employs / recruits / blood onto
an uncontrolled vampire / puts it in play / [tha] fetches / on
themselves (+N strength)) i `_parseUndirected`: aktörens PREY (nextLive
av aktören) armerar en pending `kind:'undirected'` och öppnar fönstret
direkt; aktörens PREDATOR armerar med `waitingFor = preyns namn` och
öppnar på preyns Pass/No block (`_onSay`); en åskådare får inget. Ett
2-live-player-bord kollapsar båda rollerna på mig → öppnar direkt.
Actor-sidan: `_askBlock` för de odirigerade kinds (UND_KINDS + hunt)
listar båda berättigade blockarna och resolvar 'no' först när ALLA
passat — inte vid timeouten (throughput-vinsten) — men en mänsklig prey
som aldrig trycker Pass lämnar askSecs som tak, precis som förr.

Hotklasserna i `decide('block-as-target')`, egen gren för `ctx.T !==
'T1'`: `_threatClassOf` läser fx-nycklar och aktörens pubb (Bowl/Raven
→ T2, .44/Preternatural/Crows/Kevlar → T3, recruit → T4b, stock hos min
predator → T4, hunt vid 0 blod eller famed → T5, Creeping Sabotage-
tabling → T1 amount 3 för preyn, annars T6); poäng = odds × w(T) × dirW
× combatFit − lockCost, × deckAxis / blockShy; posture och axis läses ur
`DECK_STRATEGY.axes` (första konsumenten!); novice väger bara T1/T2.
Den dirigerade T1-vägen är byte-identisk — axlarna dit är B2:s sak med
registrerad arenaprediktion, för att inte flytta 800 tester utan mätning.
Rush-fönstret: en Deep Song mot min vampyr öppnar ett fönster om jag har
en annan olåst minion (eller wake); avböjande = `_complyRush` (lås +
strid, som förr). `block-eval` emittas för varje fönster; arenan v1.2.8
räknar fönster, beslutade blockar, per klass och roll, och skriver en
summaryrad.

Bevis: sektion 83 (25 tester): 3 röda + abort mot v0.6.106, 25/0 mot
v0.6.107 — inklusive 83h end-to-end: en tremere-prey med Eyes of Argus
säger Hold on… → Block! → spelar kortet mot en Bowl-equip. Svit 831/0
×3 utan att ett enda befintligt live-test rördes. 3-bot-arena
(tremere/nosferatu/hacking, pool 15): 19 block-eval varav 4 odirigerade
fönster — två hunts som prey (T5, släppta), EN hunt som predator
(T5, BLOCKAD av den disabling nosferatun) och en Creeping-tabling som
prey (T1); 3 892 ms/spelartur, alltså ingen genomströmningsförlust.

Registrerad prediktion (doktrinen §6): tremere/nosferatu blockar ≥ 50 %
av T2/T3-aktioner när en interceptor är olåst; malkavian-blockar
inom ±1 per match; wall-axeln blockar predatorns hunts under tryck;
5p30 ms/spelartur ≥ 20 % lägre med nosferatu vid bordet.

Nästa: B2 — faser (early/mid/late), aktionsordning, öppningsbok,
per-lek-playbooks och default-personas (§4.1), Haven Uncovered
data+konsument, income-direction, Spying Mission bank/nullify, samt
T1-axlarna med egen prediktion. Fortfarande hos huvudprojektet: §12-not
för `NAME attempts to block.`; människoklientens grammatik för
odirigerade aktioner (bottar parsar bara sina egna rader tills dess).

Osäkert: predatorns fönster hänger på att preyns Pass kommer som `say`
— en människa som svarar i chatten ("no") öppnar det inte (actorns ask
resolvar via chatten, predatorn blir utan tur — samma som förr);
T-vikterna är doktrinens gissningar tills serien mätt dem; och
`_parseUndirected` rensar en eventuell äldre pending ("superseded"),
vilket är rätt eftersom en ny announce betyder att förra aktionen är
över, men det är ett antagande om ordning på wire.

## [A3 — ROBUSTHETEN] — asken kommer ihåg sitt mål, försvunna människor släpper taget, boten återansluter med sin token, blockarnamnet flyttar till en fryst rad (11 september 2026, bot v0.6.106, table v1.1.0, svit 805/0 ×3, smoke 11/11)

Kodkollen före rundan: inga `PERSONAS[`-läsningar utanför konstruktorn,
inga `players[].pub`, `Math.random` bara i en kommentar — rent efter A2.

#3: roster-hooken jämförde `preySeat()` med `out` — död sedan v0.3.5
eftersom `preySeat()` redan hoppar över utslagna säten. Asken bär nu sitt
eget `target` (satt i `_askBlock`), och hooken resolvar 'no' när det
sätet inte längre är `live` (ousted eller vakant). 82a: 1002 ms → <300.

#5: `_releaseDeparted(players)` i roster-handlern: den som rostern visar
offline/vakant/out plockas ur `_holdBy` (▶ Resuming-chatt, påminnaren
stoppas) och ur `_ask.pausedBy` (klockan startar om). Boten kan inte
längre frysa bakom en människa som gick.

#7: den föräldralösa 10 kB-raden (v0.6.9–0.6.21) är ute ur filen och
ligger verbatim i `elysium-bot-history-v0.6.9-0.6.21.md` (huvudprojektets
arkiv kan ha den också). Längsta raden är nu 1 430 tecken.

#11: token-reconnect. Servern har stött rejoin med token hela tiden
(rad 1338: lösenord behövs inte, sätet reclaimas, allas bräden spelas
upp). `connect(rejoin)` skickar `join` med token; `_maybeReconnect` körs
från transportens close-callback med backoff 500 ms × 2^(n−1), fem
försök, aldrig efter `close()` (som nu sätter `_closing` och rensar
timers), aldrig i lobbyn eller efter oust, `o.reconnect === false`
stänger av. Två fällor hittade i servern före koden: en `deck`-upload
mitt i matchen kör `dealNow` (ny hand, tömt bräde, `p.out` nollas) — så
`joined` på en rejoin skickar INGET deck, pushar brädet och startar
egen tur om `turn === seat`; och `wsConnect`s eget `close()` triggar
inte close-callbacken, så joined-vakthunden (6 s) anropar
`_maybeReconnect` själv. Hotseat-bryggan äger sin transport och
anropar `close()` → ingen reconnect där.

#12: `elysium-bot-table.js` v1.1.0 — `--decks a,b,c` roterar
ARCHETYPES över sätena (förr spelade varje live-bordsbot DEFAULT_DECK),
main-guard och export av `parseArgs`/`resolveDeck`.

#14: blockarnamnet rider nu frysta log-rader: `NAME attempts to block.`
(ny, bot-emitterad) och `NAME plays CARD: +N intercept.` (fanns redan).
`_noteBlockAttempt(vamp, own)` är enda sajten: andras via `_onLog`, egna
vid `_commitBlock` (servern ekar aldrig egna log-rader). B-55e-b:s
chatt-parse är pensionerad — "Trainbot:"-prefixet är narration igen och
fritt att byta. Fem fixturer (73d, 73g, 79c, 81d + 82f:s negativa)
omformade till log-bäraren.

Bevis: sektion 82 (16 tester): 5 röda + abort mot v0.6.105/table
v1.0.0, 16/0 mot det nya paret; svit 761/2 (79c/81d hängde på den
pensionerade chattbäraren — omformade, det VAR kopplingen) → 805/0 ×3.

BEHOV TILL HUVUDPROJEKTET (§12): en ny bot-emitterad fryst rad,
`NAME attempts to block.`; bakåtkompatibel (bara bottar parsar den), en
canary-fall önskas. Fortfarande obesvarat: att hotBridge inte ekar
bottens egna log-rader; människoklientens hunt/equip/recruit-grammatik
inför B1.

Nästa: B1 — undirected-fönstret + hotklasserna + `block-eval` +
arenamåtten (doktrinen §3/§5/§6), nu när react-vägen A1–A3 lagat är
stabil. Läs doktrinen och registret först.

Deploy-granskningen (Johans fråga före deploy): en injicerad transport
(hotseat-bryggan, sviterna) äger sin livscykel — en re-dial via bryggan
kunde sätta en dubblett — så reconnect är OPT-IN där (`o.reconnect ===
true`, test 82d:s nya negativa), default på bara för den inbyggda
ws://-uppringningen. START-HERE nämner `--decks`; doktrinen §5.7 bär
blockarnamnets nya bärare som B1-invariant. Svit 806/0 ×3.

Osäkert: reconnecten är bevisad mot en fejktransport, inte mot en
riktig serveromstart (kräver en live-runda: starta om servern mitt i en
bot-match och se sätet återtas); `_releaseDeparted` släpper också en
människa som bara blinkar offline (nätverkshack) — hon får säga Hold on
igen; och `NAME attempts to block.` visas som logg-rad även för
människor — avsiktligt, det är informativt.

## [SPÅR C — KURATIONEN] — fyra datafel rättade mot vtes.json, läsarna byggda, en stale-namn-regression från A1 fångad av jakten (11 september 2026, bot v0.6.105, curated 90, svit 789/0 ×3, test-cardfx 212/0)

Jakten före rundan hittade en regression A1 hade infört: `_expectedOppVamp`
läste `_combatOppName || _lastBlockerName`, och `_combatOppName` sattes
vid `_resolveCombat`-entry men rensades aldrig — efter en strid mot X
stod X kvar och utrankade nästa aktions blockare Y, så Y:s tidiga strike
(före `_resolveCombat`-entry) avvisades och boten föll tillbaka på
assume-1. Fönstret är smalt (~150 ms + pace mellan verdikt och entry)
men riktigt; test 81d är rött mot v0.6.104. Nu dör namnet med striden
(finally) och vid varje egen announce/commit/rush-comply (rensningen).

Kurationen (bara `cardfx-curated.json` → compile → json/js; kompilatorn
v1.6.13 orörd, återkompileringen av det gamla overlayet var byte-
identisk minus tidsstämpel innan ändringarna gjordes): Spying Mission
kurerad — auto-tiern hade läst [OBF] som `bleed:2`; kortet gör bleeden
misslyckad och bankar +2 till nästa bleed mot samma Methuselah →
`{bleedNullify, bleedBank:2}`; boten erbjuder den inte längre som
modifier (81b), [obf] +1 stealth kvar. Foreshadowing Destruction —
[DOM] +3 bara vid mål ≤ 9 pool → `req.targetPoolMax 9`, som
`_bestBleedModifierFor` läser mot målets senast pushade pool och faller
STÄNGT vid okänd pool (81a: 12 pool → +1, 9 pool → +3, okänd → +1).
Blood Doll/Vessel tvåvägs (`poolToBlood`, Blood Doll vid master, Vessel
vid unlock, Vessel fortfarande trifle) — konsument = B2:s income-
direction; tills dess ignoreras nyckeln. Haven Uncovered väntar på B2
(data + konsument tillsammans: data ensam skulle antingen tabla den lös
som nu eller klogga handen).

Bevis: test-cardfx 207 → 212 (räknaren 88 → 90 destruktivt + fyra
entry-asserts). Sektion 81 (8 tester): 6 röda mot paret v0.6.104 + gamla
cardfx, 8/0 mot det nya paret. Svit ×4: 788/1 (78c, pace-skalningens
tidsflake, F-Q2-klassen — CLAUDE noterar den), sedan 789/0 ×3.
Täckningsrapporterna regenererade (T5-regeln): Blood Doll, Vessel och
Spying Mission FULL → PARTIAL tills B2 konsumerar de nya lägena —
rapporten bedömer konsumtion, inte sanning: Spying Mission var "FULL"
medan boten annonserade fantompool (lärdom i learnings).

Registrerad prediktion: Malkavian-boten annonserar aldrig mer
`adds +2 bleed` via Spying Mission eller +3 Foreshadowing mot mål över
9 pool — mätbart som noll sådana L12.add-rader i nästa 5p30-serie.

Nästa: A3 (#3 ghost-prey-hooken, #5 hold-släpp vid disconnect, #7 rad
71, #11 token-reconnect, #12 table.js --decks, #14 prefix-kopplingen),
sedan B1. Klientändringar krävs inte.

Osäkert: `req.targetPoolMax` läses mot `table[target].pub.pool` — en
människas pool i pubben är den senast pushade; om människan justerat
pool utan push (klienten pushar vid varje ändring, så teoretiskt) kan
+3 erbjudas vid 10. Och `poolToBlood`-läget syns som PARTIAL i tre
rapporter tills B2 — avsiktligt, inte glömt.

## [A2 — SYSKONSVEPET] — Jack-offersidan läser pubbarna, persona-sajterna läser sanningen, Blood Doll lämnar sista bloden (11 september 2026, bot v0.6.104, svit 781/0 ×3)

#8 (medel): `_menaceUnlockEngine`s offersida läste `this.players[].pub` —
rostern bär aldrig pubbar (de bor i `this.table[seat].pub`, `_onBoard`s
lager), så ingen bot har någonsin betalat för en motståndares Smiling
Jack. Samma roster-mot-table-bugg som lagades i `_tableThreat`/
`_rushCandidates` i v0.6.57; syskonet missades, och fixturerna 49d och
62a hade kodifierat fel form (`players[0].pub`, `players[2] = jackPub`)
så guarden var falskt grön. Nu läser sidan `Object.entries(this.table)`
med eget-säte-vakt, och fixturerna bygger `u.table[seat] = { pub }` som
`_onBoard` gör.

#6/#10 (låg): chip-savern i `_reactWindow` och Jack-golvet läste
`PERSONAS[this.o.persona]` — undefined för allt utom en namnsträng, så
objektpersonor och arenans knob-overrides nådde aldrig dit
(grinderReadyTarget-klassen från v0.6.16, sajt två och tre). Nu
`this.persona`. Regel i learnings: ingen `PERSONAS`-läsning utanför
konstruktorn.

#13 (låg, taktisk): `_applyPhaseIncome` dränerade alltid Blood Doll/
Vessel medan blod > 0, även sista bloden — en 0-blods Malkavian kan inte
betala Deflection/Conditioning/Govern (alla kostar 1). Golv: sista
bloden stannar medan pool > poolFloor; vid eller under golvet vinner
överlevnaden och dräneringen sker. Tvåvägs-läget (`poolToBlood`, vtes-
verifierat) är spår C + ett `income-direction`-beslut i B2.

Riders från A1:s osäkerhetsstycke: per-aktör-läsningen av prey ligger nu
EFTER `await pace()` (människobordens pace är också rosterns fönster),
och `_settleOusts` bevakar bara preyn (en tvärbordsmänniska parkerad på
0 utan att trycka ousted kostar inte varje bot-tur en väntan).

Bevis: sektion 80 (9 tester): 6 röda mot v0.6.103, 9/0 mot v0.6.104
(tre är invarianter som håller åt båda håll: eget-säte-vakten, vanlig
dränering, överlevnadsdräneringen). Svit 781/0 ×3.

Registrerad prediktion (doktrinen): i nästa 5p30-serie visar nosferatus
motståndare poolförlust efter att Jack tablats (de betalade inget förr)
och nosferatus VP/match stiger; Malkavian-minions står oftare på ≥ 1
blod (färre tvångshunts). Utvärderas i samma serie som A1.

Nästa: C (kurationen — rör bara cardfx-filerna) eller A3; sedan B1–B3.
Klientändringar krävs inte.

Osäkert: Jack-offersidan räknar nu ALLA motståndares tablade Jack
(kortet är unikt, så i praktiken en) — om två spelare tablar var sin
kopia och kontesterar löser bordet det, boten betalar för båda tills
kontesten avgjorts; och golvet läser `poolFloor` (6) som tröskel — vid
startpool 12 i arenan är det halva poolen, så lågpool-serier dränerar
oftare än 5p30 gör.

## [A1 — GRANSKNINGENS NU-RUNDA] — handshaken blir motståndarscopad, preyn läses per aktör, Block! bara med en blockare (11 september 2026, bot v0.6.103, svit 772/0 ×3)

Bakgrund: dagens djupgranskning (`elysium-bot-review-2026-09-11.md`, 16
fynd + fyra cardfx-datafel) och doktrindokumentet
(`elysium-bot-block-doctrine.md`) ligger nu i projektet; Johan sa "kör"
på A1 = #1 + #2 + #4.

#1 (hög): bystander-kontamineringen. `_onLog`/`_onChat` stashade
strike/press/maneuver/grapple/crows-rader från VILKEN combat som helst
vid bordet, och nästa egna combat konsumerade stashen före väntan.
Reproducerad offline och i en riktig 3-bot-arena (2 av 5 konsumtioner
stale: Grinder tog Mustafa Rahmans strike mitt i sin fight mot Smudge,
och Smudges riktiga strike rullade in i NÄSTA combat). Fixen har två
halvor: `_clearCombatStashes()` vid varje egen announce
(`_announceTallyA`), varje block-commit och rush-comply, plus dealt/oust
— aldrig vid `_resolveCombat`-entry, för försvararens tidiga rad är
legitim (dodge-grenens kommentar); och `_stashAccept(vamp)` vid varje
stash-sajt: i combat måste raden namnge `_expectedOppVamp()`
(`_combatOppName` på försvarssidan; actor-sidan härleder nu namnet från
B-55e-b-parsern via `_actingVamp`), utanför combat bara en armerad
(`_combatArmed`, satt i `_onBlockAttempt`/`_commitBlock`/rush-comply)
förväntad motståndares tidiga rad. Motståndarens Carrion Crows ingår i
stash-setet (en tidig crows-announce raderades förr av den sent
inträdande anfallaren). Press/maneuver/taken/crows/grapple-parsrarna
fångar nu det RENA vampyrnamnet (press-regexen fångade "Trainbot combat
— Lisa"; taken-regexen fångade hela strike-satsen). Rush-actor passar
`act.target.name`, rush-defender `m[1]`, som motståndare.

#2 (medel): stale prey. `bleed-target` beslutades EN gång per
minion-fas; efter en oust bleedade resten av fasen ett spöke. Djupare:
vid paceMs 0 finns ingen macrotask-yield mellan "It resolves" och nästa
`_askBlock`, så rostern kan inte ens läsas — per-aktör-läsning räcker
inte. Nu: `prey` läses om per aktör, `_settleOust(seat, n)` väntar
begränsat (`_settleMs`: 300–1500 ms, pace-skalat, 600 vid 0) på att
rostern markerar sätet out när målets senast pushade pool inte
överlever slaget (bleed- och pool-grenarna), och `_settleOusts` vid
minion-fasens start fångar creep/Jack-ousts från min egen unlock.

#4 (medel): beslut/exekvering-drift (tredje gången: v0.4.1, v0.4.3).
`interceptPotential` exkluderar nu attempted och Pentex som
`_pickBlocker`; `_commitBlock` är omstrukturerad som HITTA rutt (pick,
unlock-react, wake, Stray — bara finders) → `say('Block!')` → SPELA
rutten, med belt-Pass om rutten faller under en await. Den synliga
ordningen Block! → wake-reveal → intercept (v0.4.5:s beat) bevaras — ett
första utkast sa Block! sist och föll på 14d:s cursorordning.

Bevis: sektion 79 (19 tester): 11 röda + abort mot v0.6.102, 19/0 mot
v0.6.103 (den fristående körningen i SKILLS). Fyra fixturer (37a, 37l,
37n, 46e) matade motståndarrader utan combat-kontext — de kodifierade
felet — och sätter nu `_inCombat = true` (14a/b/d-precedenten). Svit
772/0 ×3 (190 s per körning). Instrumenterad 3-bot-arena efter fixen:
5 konsumtioner, 0 stale. Post-fix 5p30 (hacking/sewer/malkavian/
tremere/nosferatu, shark/grinder/novice/grinder/novice, pool 30):
Shark/hacking svepte 4 ousts på 6 rundor, 213,5 s, 6 672 ms/spelartur,
blocked-emits 4/4 med blockarnamn, 87 bleed-target-beslut (per aktör) —
spår `serie-a1/match-1-mtwwnyph.jsonl`. EN punkt, ingen serie; hacking
som predator föll först-mönstret står. Canary hoppade (klienten saknas
här — ladda upp v2.6.88 + protokollet + srv-2.6.35 före nästa runda).

Registrerad prediktion (doktrinen): noll stale stash-konsumtioner i
3-bot-prober (observerat 0/5 mot 2/5) och inga spökbleeds efter en oust
mitt i fasen — utvärderas i nästa 5p30-serie tillsammans med A2.

Nästa: A2 (#8 Jack-offersidan + fixturen 3936, #6/#10 PERSONAS-sajterna,
Blood Doll-golvet), C (kurationen), A3, sedan B1–B3. Klientändringar
krävs inte för A1; två verifieringsfrågor till huvudprojektet står i
context.

Osäkert: `_settleMs` 600 ms per potentiell oust vid paceMs 0 syns i
arenatempot men är inte utvärderat i serie; `_combatArmed` kan stå kvar
efter ett misslyckat block tills nästa announce — ofarligt eftersom
varje combat-ingång rensar först; `_expectedOppVamp` på actor-sidan
litar på att en bot-blockare alltid chattar sitt namn före verdikten
(alla tre rungarna gör det).

## [SYSTERPROJEKTET] — Elysium Bots blir ett eget projekt: filerna flyttar, regeln "konsumera releaser" sätts (9 september 2026, bot v0.6.102)

Johan: huvudprojektet nära fullt och bot-arbetet växer ur kostymen.
Splitten mätt först: 45 av 85 filer var bot-ägda, 3,0 av 5,5 MB.
Kopplingen mellan sidorna visade sig tunn — botsviten behöver varken
klient eller harness, och huvudprojektets enda beroende på boten var
fyra testA-tester i klientsviten (HB2b/HB2c/hold/range) som nu är
`testB`: de hoppar högljutt över sig själva när elysium-bot.js saknas
(83/0 + 4 hoppade) och kör fullt när den releasade boten ligger
bredvid (87/0). Hit flyttade: boten, arenan, table, gen-verktygen,
cardfx-pipelinen, decks, botsviterna, bot-designkanon, START-HERE-BOTS.
READ-ONLY-kopior av huvudprojektets releaser bor här enbart som
runtime/kontrakt: elysium-server.js (arenan spawnar den),
ELYSIUM-PROTOCOL.md, elysium-hotseat-bots-plan.md — de redigeras ALDRIG
här. Regeln i båda CLAUDE-filerna: konsumera releaser, redigera aldrig
det andra projektets filer; tvärgående ändringar = två sessioner
(kontrakt först, sedan boten — eller boten först om bakåtkompatibelt).
CLAUDE-arena.md är nu detta projekts CLAUDE.md, SKILLS-arena dess
SKILLS.md; journal/context/learnings/changelog nya här, seedade nedan.

## Förhistoria — bot-relaterade poster i huvudprojektets journal (titlar; fulltext i huvudprojektets elysium-session-journal.md och arkivet)

- [HISTORIKUTDRAGET] — projektet nära fullt: releasekedjorna flyttas ut ur koden, in i arkiv + CHANGELOG (9 september 2026, klient v2.6.73 / server srv-2.6.32 / bot v0.6.102, kommentar-only)
- [MERGENS SISTA TRE FILER] — bot-chattens protokoll, SKILLS och dispatch-svit anlände; mergens största osäkerhet stängd (9 september 2026, dokument, ingen versionsbump)
- [START-GRINDEN + BOTEN PÅ SÄTE 1] — två offline-fynd direkt efter mergen (9 september 2026, klient v2.6.72)
- [MERGEN] — två linjer blir en: bot-spåret + telemetri-spåret, hotseat-Hold-on härdad, planen för nästa kapitel i eget dokument (9 september 2026, klient v2.6.71 / server srv-2.6.31 / bot v0.6.101 / digest v1.4)
- [SLUTSVEPET — GRANSKNING + TVÅ TÄTNINGAR] — klock-ordningen friad, Hold on lufttät i svansen, fx-kinden namngiven som vilande (9 augusti 2026, bot v0.6.101 amend)
- [SEN-BUBBLANS EFTERKONTROLL — TVÅ VAMPYRER I EN DIFF] — chat-gapets interaktion med __board-dedupen löst i primitiven; det pacade flerturstestet vidgas ärligt (9 augusti 2026, bot v0.6.101)
- [INFLUENCE-DOMEN — EKONOMIN FRIAD, SPENDERLUCKAN DÖMD, EGEN UTSAGA RÄTTAD] — boten HAR säteskodad ramp (rad 4622); det som saknas är partial fills (9 augusti 2026, diagnos; implementation = bot-rundan)
- [BEAT-MODELLEN DEL 2 — JOHANS TRE LIVE-FYND STÄNGER LOOPEN] — bubbel-avlösning på wire-nivå, chat-hold i _pace, klockan efter deklarationerna; 78d-grinden fångade min nivåmiss FÖRE leverans (9 augusti 2026, bot v0.6.100)
- [BEAT-MODELLEN DEL 1 — SKEPPAD SAMMA KVÄLL] — primitiven + intra-stegs-gapet: stackningen dör, sekvensretaggen är del 2 (8 augusti 2026, bot v0.6.99)
- [BEAT-MODELLEN — DESIGNBESLUT LÅST] — bottens meddelandeflöde blir multidimensionellt: fx-beat → chat-beat → klocka, i avlösning i stället för stack (8 augusti 2026, beslutat; implementeras som bot v0.6.99 i nästa pass)
- [CLASSIC-ÖPPNINGEN — JOHANS FRÅGA AVSLÖJADE EKONOMIBUGGEN] — boten betalade för sina fyra setup-vampyrer; nu gratis som människans (8 augusti 2026, bot v0.6.98)
- [SYSKONSVEPET — HELA BUGKLASSEN JAGAD] — fullt fältaudit brygga↔bot↔server; EN syskon dömd: joined.boardMode + classic-given (8 augusti 2026, klient v2.6.69)
- [TEARDOWNEN — ROND-3-FÅNGSTEN ÄNTLIGEN HEDRAD] — leave seat dödar bottarna: instanser, timers, brygga och ▶-knapp (8 augusti 2026, klient v2.6.68)
- [RAMPEN — JOHANS REGELKORRIGERING STÅR] — transfers räknar SPELETS turer, inte säten; svepet gör turräknaren bot-ärlig (8 augusti 2026, klient v2.6.67)
- [RUNDA 4 — FYRA UR JOHANS SVEP] — hemresan på riktigt, EM löst med ETT ord, regeldomen om transfers, promptlugn (8 augusti 2026, klient v2.6.66)
- [ÖVERLÄMNINGEN — BUGGEN ETT LAGER DJUPARE] — Pass var hotseatens riktiga turväxling: rotationen hoppar nu bot-säten, svepet kör där, och say-relayn ger Hold on liv (8 augusti 2026, klient v2.6.65)
- [KAMERAN — BOTTEN LEVER PÅ JOHANS BORD] — "inget händer på brädet" var en VY-lucka, inte en tillståndslucka: svepet auto-besöker agerande boten och lämnar tillbaka kameran; paceMs 3100 (8 augusti 2026, klient v2.6.64)
- [LEXIKALT PANSAR — KOLLISIONEN] — Johans egen fil obducerad (byte-identisk!), rökande pistolen: klientens `const net` möter bottens — hela boten bor nu i en IIFE (8 augusti 2026, bot v0.6.97; klienten orörd v2.6.63)
- [LOADER-FORENSIK — JOHANS SPAWN-FAIL] — dialogen gjorde sitt jobb, roten jagad: exportvakt på IS_NODE + loader som verifierar och namnger kraschen (8 augusti 2026, klient v2.6.63, bot v0.6.96)
- [HB2c.1 — JOHANS FÖRSTA LIVE-RUNDA] — buggen rotorsaksfixad (auto-svep på fas-wrappen + spawn-observabilitet) och tre önskemål skeppade (8 augusti 2026, klient v2.6.62)
- [HB2c-FILE — DUBBELKLICKSBOTTAR] — file://-vägran borta: fyra filer i en mapp = fulla hotseat-bottar, noll server (8 augusti 2026, klient v2.6.61, cardfx-compile v1.6.13)
- [HB2c-PAKETERING — SERVERROUTEN] — hostade miljön kan nu serva bottarna: srv-2.6.28, exakt-match-route + deploy-ritual (8 augusti 2026; omstart krävs)
- [HB2c — 🤖-TOGGLEN + RUNTIME-LADDNING + ▶-SVEPET] — hotseat-bottar når UI:t; alpha-luckorna namngivna för HB2d (8 augusti 2026, klient v2.6.60)
- [HB2b-AMEND — STÅENDE FRÅGAN FÅNGAR TVÅ] — caps-lögnen (500/60 → serverns lästa 250/64) + routing-bevisluckan stängd (8 augusti 2026, samma version v2.6.59)
- [HB2b — BRYGGKÄRNAN] — en RIKTIG bot korsar bryggan: join→deck→dealt(7/4)→tur-1→pass, pubben landar via remote-player-vägen (8 augusti 2026, klient v2.6.59; bot byteorörd v0.6.95)
- [HOLD — "HOLD ON…" PAUSAR BOTTARNA] — Johans snabbfras-önskemål landar som den generella bordshållningen; människo-exklusiv, gaten i _pace (8 augusti 2026, bot v0.6.95)
- [HB2a — KONTRAKTET + ARKITEKTUREN] — Johans browser grön; analysrundan hittar __board-sentinelen och KORRIGERAR min egen enumeration: 19 ut / 24 in; planen skriven (8 augusti 2026; ren analys, ingen kod ändrad)
- [HB1 — BROWSER-SPIKEN] — diag-sidan + smoken: batteriet 11/11 i sandlådan, browserhalvan är Johans (8 augusti 2026; nya filer v0.1.0, boten byteorörd på v0.6.94)
- [HB0 — BOTEN BLIR MILJÖAGNOSTISK] — hotseat-bots-spåret öppnar: samma fil laddar nu i webbläsaren, noll beteendeförändring under Node (8 augusti 2026, bot v0.6.94)
- [SAMLAD DOM] — Bottarna agerar rimligt; nålen flyttas av en LEK, inte av kod (5 augusti 2026, sen natt)
- [SKÖRDESERIEN] — Doktrinens första fulla tabell: en grön, en falsifierad, en otillskrivbar vinst, en tom bevakning (5 augusti 2026, morgon)
- [B-55e-b + UTVÄRDERINGSDOKTRINEN] — Blockarnamnet i emiten; ärligt krympt scope; Johans doktrin i arena-lagen (4 augusti 2026, natt)
- [L-SVEPETS GATE] — Fem icke-literal-nycklar, konservativt säker riktning, actGrant står ensamt (4 augusti 2026)
- [L-SVEPET] — Bibliotekets aspekt-audit: idén var redan ~95% byggd, nu synlig + sista gapen stängda (4 augusti 2026)
- [ARENA-VEKN-FIXEN] — v1.2.5: flest VP vinner, survival-VP:n på plats, EN retro-relabel (4 augusti 2026)
- [FEMLEKARSSERIEN] — Wall-konceptleken pensionerad, sätet avslöjat som boven, tremere-boten BEVISAT adaptiv (4 augusti 2026)
