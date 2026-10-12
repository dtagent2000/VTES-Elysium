# Elysium Bots — TO-DO och överlämning (21 september 2026, bot v0.6.146 · arena v1.4.1 · cardfx curated 96)

*Skriven för en NY chatt. Allt här har full kontext i `CLAUDE.md` (punktnummer inom parentes) och i `elysium-bot-session-journal.md` (överst = senast). Inget nedan är påbörjat om det inte står så.*

## 0. Läs först i en ny chatt
1. `READ-ME-FIRST-2026-09-21c.md` → denna fil → `CLAUDE.md` punkt 57–69 (69 = hotseat-nätet + erfarenhetsnivåerna, bot v0.6.150).
2. **Ladda upp `twd_decks.json` igen** (10 MB, 4562 TWD-lekar) — den låg som uppladdning i chatten, INTE i projektet. `vtes.json` och klienten (`elysium-vtes-bord.html`, v2.6.121) likaså om de inte redan ligger i projektet.
3. Arkivet `elysium-bots-arkiv-2026-09-21b-v0.6.146.zip` innehåller allt som ändrats 18–21 sep, alla serier och denna fil; `elysium-bots-2026-09-21c-v0.6.150.zip` innehåller allt som ändrats i paritetschatten därefter.
4. Arbetsregler som gällt hela veckan: analysera → föreslå → vänta på Johans "kör"; förutsägelser registreras FÖRE en serie; en rökmatch före varje serie som rör protokoll / spelsteg; grindar på slutliga bytes (svit ×3, canary, HB1); balanserad design för lekpåståenden
   (`serie-bal1/design.txt`, `./poll-balN.sh N`); **måttstocken: två 12-matchersserier av samma logik skiljer 11–13 punkter på ett beslutsmått och mycket mer på VP (bal7 → bal8: malkavian 4 → 8 vinster) — håll påståenden på beslutsnivå eller poola.**

## 0b. HANDOVERN TILL KLIENTPROJEKTET (main) — ligger INTE i denna fil
Den är ett eget dokument: **`spec-hotseat-parity-2026-09-21.md`** (8 punkter: frysningen i `hotRunBotTurns` → fläkta `tally` → `bounty` + roster → `deckName` / lekmenyn ur `ElysiumBot.ARCHETYPES` + Ventrue → nivånamnen Novice / Experienced / Expert med EXPERT som standard → `openHand`, `give` → en grind på deras sida → ordning). Lämna över den tillsammans med `elysium-bot.js` v0.6.150 och `START-HERE-BOTS.html`. Specen bär också den äldre begäran till SERVERN (lämna turen vidare när turinnehavaren oustas, §3 nedan / CLAUDE.md 46c) och noten om serverns `bounty`-predator. När main skeppat: ladda upp den nya klientfilen i bottchatten → `test-bot-hotseat.js` + canaryn körs om mot den.

## 0c. LÄGET EFTER MAINS SVAR (21 sep, bot v0.6.151)
Main har skeppat HELA specen (klient v2.6.124 / srv-2.6.38); omkört och grönt; deras två fynd i botten är lagade; vårt svar ligger i `reply-to-main-parity-2026-09-21.md` (inkl. klartecken att ta bort bryggans filter för bottars 'Hold on…'). **Pariteten är STÄNGD på bott-mot-bott-nivå.** Kvar: Johans mänskliga bord offline (§3). **ÖPPEN AVVÄGNING (Johan): ingen un-oust-mottagare (mains B4) — tas om feedback efterfrågar den; form: ögonblicksbild som återställs bara efter VÄRD-oust.** Inte planerat: `recall`-mottagare (B5).

## 1. ONLINE ↔ HOTSEAT-PARITET (CLAUDE.md 66 → 69) — **BOTTSIDAN KLAR i v0.6.147–150 (21 sep; personas heter nu novice / experienced / expert, Expert är standard — Johans beslut); kvar: main skeppar `spec-hotseat-parity-2026-09-21.md`, sedan körs `test-bot-hotseat.js` om mot den klienten. Johan: persona-default (grinder i klienten, shark i alla serier).** Ursprunglig text:
- **Hålet:** klientens `hotBridge` släpper `tally` (`default: break; // tally/bounty/openHand/... tolerated silently`); människans räknare skickas bara online. Blockdomar mellan bottar räknas på halva talliet. **Sedan v0.6.143 värre (mitt bygge):** första stealth-titten VÄNTAR på en bot-blockares tally
  (kommer aldrig i hotseat → inget stealth-kort mot bot-blockare) och båda andra-tittarna är tally-drivna. Saknas också i bryggan: `bounty` / roster-vid-ändring, `give` / `given`.
- **Inget test täcker det:** HB1 kör bottens batteri utan brygga; canaryn har ingen hotBridge-assert. v0.6.131–146 är mätta ENBART på servern.
- **Att göra:** (a) SKYDDSNÄT i botten: ingen tally inom kort frist efter en bot-blockares rop → gamla första titten; andra-tittarna valfria. (b) BRYGGHARNESS i sviten: två Bot-instanser på en in-process-buss med bryggans exakta relay-regler (lästa ur klientkällan). (c) TILL MAIN: fläkta `tally` som servern gör
  (till alla andra + eko till avsändaren; människans räknare → bottarna; bottens tally → människans räknare) + bounty / roster + give. (d) kör om canaryn mot den klient main skeppar.

## 2. KUNSKAPSLAGRET (CLAUDE.md 64–65) — nästa stora steg
- **Johans koncept:** oddsen om MIN lek är exakta; om MOTSTÅNDAREN är de reaktiva (det bordet sett). TWD + startlekarna gör dem PROAKTIVA; botten uppdaterar sin bild per sedd vampyr och spelat kort; startlekarna är GRUNDEN tills korten säger mer.
- **Mätt:** alla TWD-kort-id löser mot vtes.json; vtes.json ger 101 precon-lekar. 91 % av Ventrue-TWD kör Deflection (snitt 6,4). Förtest (förutsäg antal bounce-kort): klan 2,26 → två vampyrer 1,58 → +6 bibliotekskort 1,15. **GRUPPEN på EN vampyr: 2,12 → 1,60** (Malkavian G1–2 Dominate / G3–5 Dementation /
  G6–7 Dominate; 4559 av 4562 krypter inom två angränsande grupper = hårt filter). **Multiklan:** disciplinspridning 3,56 → 2,74; två vampyrer → 22 kandidatlekar, tre → 9. TWD-bibliotek 2019+ är 74 % V5 (krypta 39 %); 86 % av bibliotekskopiorna har en modellerad effekt hos oss.
- **Att göra, i ordning:** (a) rena KORTKLASSER ur korttext för hela biblioteket (bounce, wake, intercept, stealth, bleed-pump, combat ends, röster, rush), kurering går före — KONTROLLERA mot kända kort (min första textklassare var grov: 'stealth' 625, Dramatic Upheaval som bounce; min "kort utan effekt"-lista var fel
  tills Johan såg det — effekter ligger i modes / ref / actGrant / handler / archetype). (b) OFFLINE-BYGGSTEG → kompakt `elysium-knowledge.json`, nycklad på klan + gruppfönster + kryptans disciplinsignatur; bantad för webbläsaren. (c) OFFLINE-VALIDERING per klass före någon match + "känns våra sex bottlekar igen, efter hur
  många kort?". (d) prior som KNAPP (starters vid utfyllnadsbord, TWD vid turneringslikt; nyare väger mer). (e) MIXTUR, inte "mest lik lek": P(klass på hand) = Σ w_k × hypergeometrisk. (f) kontrollera att table model sparar motståndarens kortnamn per plats; kontrollera vad "ingen klan" betyder (alla 1138 har trait 'star').
- **Konsumenter, i värdeordning:** aktörens PUMP-UPPDELNING mot en känd bouncare (Johan: för = mindre bounce-risk; mot = stealth på två handlingar + offrad full stack; det är en oddsjämförelse) · cloggens stealth-bleedar-läsning · `spend-stealth`s P(intercept) · bounce-reservens pumpregel.

## 3. FÖRE PRE-ALPHA (utöver §1)
- Ett mänskligt bord: Johan spelar 3–4 matcher med malkavian + ventrue (väntetider i frågefönster, fastnanden, chatt). Håll nosferatu utanför; tremere gränsfall.
- `askHumansTotal` PÅ (57c): byggt men av — svitens mänskliga testspelare säger "No block" överallt och tiger sedan → lär den svara på andra frågan (~50 sektioner). Johan vill ha den på. Snabbfraser: No / No reaction stänger direkt, Yes = vänta på mig.
- 4 s betänketid mot mänsklig AKTÖR (`modGraceMs`): otestad live.
- TILL MAIN: servern bör lämna turen vidare när turinnehavaren oustas (frysningen, 46c).

## 4. NOSFERATU (väntar enligt Johans beslut; CLAUDE.md 60–61)
- **Fame-kedjan körs aldrig:** Fame spelad 8 ggr på 12 matcher, 0 Fame-rusher. Håll Fame tills en rush mot en slagbar vampyr hos BYTET är redo, lägg den DÄR, prissätt Fame-rushen i pool (3 + 1 per unlock i torpor), enemy rescue sluter kedjan. Lägg Fame-målet i master-play-emiten. Mät "körs kedjan", inte VP.
- **Taste of Vitae:** 47 av 73 spel efter en runda utan skadekort. Johan: para med Crows och / eller Roundhouse. Spela vid vinst 2+ (eller vid 0–1 blod / 2+ kopior på hand); med Taste på hand väljer strike-valet skadekortet DEN rundan; skriv ut vinsten i tracen.
- Större: flagga för aggraverad skada (Hidden Strength "aggraverad först", 52), rushens låsningsvärde, motståndarens combat ends.

## 5. BOUNCE-STRÅKET — läget
- KLART och mätt: andra titten båda sidor + stack-tävlan (143; malkavian blockad andel 28 → 10 %), sen bounce + clog + draw-stealth + totalfönster (144), överbliven bounce (145; bounces 18 → 37, fångster på 4–6), dynamisk reserv (146; nästan overksam — pumpregeln 40 % slog aldrig till).
- **Johans domar som väntar:** tröskeln "en bounce över" (står på 2 + dynamisk reserv); sänk eller ta bort pumpregeln.
- Kvar: aktörens pumpdisciplin (→ §2), bouncens RIKTNING (alltid mitt byte idag).

## 6. MINDRE / STÄDNING
Ventrue coverage-dokument ej omgenererat · skuld 18 (KRC vid pass 0,85 förlorar mot plain bleed) · Silversons röstskatt osedd live · "save-for-lunge" aldrig utlöst · bot-diablerie (26g) · dom om aggraverad självskada (24a) · hemmakvotens mjuka punkter (42c) · körning C critRisk=0 struken ·
weenie-lekarna (hacking / sewer) behöver egen serie · formell helpsheet-granskning av tremere och malkavian · kurering: **Villein (4127 kopior i TWD 2019+)**, Delaying Tactics, Direct Intervention, Emerald Legionnaire, Heart of Nizchetus, Giant's Blood, Banishment; Seduction bär bara en note; på sikt hela V5-biblioteket.

## 7. MINA OMÄTTA GISSNINGAR I KODEN (notade, inte akuta)
×0,6 per blockförsök och vid andra titten · "en 1-bleed jagas inte med två intercept-kort" · chansningsgränserna (3+, eller 2+ med 25 % toppdeck) · "kort + blod = 1 pool" · bänkövertagets halvering · pumpgränsen 40 % / 25 % · "inom 4 från kritiska nivån" · rikt bibliotek 10 % · prior för osedd minion · modGraceMs 4000 · tally-nätets 500 ms rad-till-tally och 1500 ms stå-still-fönster, bältet 60 % av askSecs (v0.6.147).

## 8. Johans ståndpunkter att bära med sig
Målet: kompetenta bottar som så långt möjligt beter sig som människor i SPELSTEG och PRIORITERINGAR — ett hot som fyller 1–2 platser, inte en schackmotor; välgrundad känsla ur observation räcker. Malkavian är erkänt starkaste originalstartern — den SKA spela så bra den kan; väntat att den drar ifrån och kanske tas ned av ett metalager.
Bounce spelas på TOTALEN efter +bleed-modifierarna; wake + bounce bara på 2+; en bott pumpar mycket sällan en bouncad bleed; 1-bleeden är reserverad för att bana väg åt en tyngre handling utan stealth på hand. Lektyp läses ur klan, GRUPP, discipliner och spelade kort.

## 9. DE ÄLDRE SKULDERNA (före 18 sep) — utvärderade 21 sep mot dagens kod och traces
*Numren är CLAUDE.md:s "Known debts at the B2 hand-over" + "Open items ledger". Status är min bedömning; det jag kontrollerade i kod / trace står utmärkt.*

**STÄNGDA av veckans arbete (kan strykas ur ledgern):**
- 1 kostnad vid annons → `_park` / `_returnParked` (v0.6.130). Rest: rekryteringens POOL betalas fortfarande vid resolve — flytta när grenen rörs.
- 13a wakes bakom bare block (v0.6.120) · 14 (v0.6.121) · 21 / 25 Anarch Troublemaker byggd (v0.6.128) · 23a "fråga keep-a-blocker FÖRE Freak Drive betalas" → act-again prissatt (v0.6.137–138, kantregel v0.6.141) · 24a aggraverad självskada (regelboken, 26b) · 27b Edge som kostnad.
- 18 politikbenets 4-starter-null: KÖRD (`serie-null4`). 8 strategilagrets misslyckade förutsägelse: lärdomen (måttstocken) är införlivad.
- F-Q2 svit-flake (~1 av 5): sviten kördes ~45 gånger i veckan; varje rött utfall hade en orsak i min egen ändring. Flaken har inte visat sig — stryk eller behåll som bevakning.

**ÖVERSPELADE (ersatta av något annat — stryk eller skriv om):**
- 9 `planFloor` av: den kritiska poolen (v0.6.136) gör jobbet; koden ligger kvar oanvänd (2 träffar) → ta bort vid tillfälle.
- 17 tremeres försvar som regressionskandidat: testet (villkorad mot ovillkorad kvot) kördes aldrig, och hemmakvoten är sedan dess ombyggd två gånger (137–138) plus hela bounce-stråket. Frågan är inaktuell i sin form; tremere är fortfarande blek (5 vinster / 17 VP på 24 matcher) — läs om den med DAGENS traces i stället.
- 3 `_oppPrior`-vikterna (disciplintäckning × 0,6 m.m.): ersätts av KUNSKAPSLAGRET (§2) — priors ur klan / grupp / discipliner / TWD i stället för mina gissade vikter.
- 13c öppningen: deck fit (v0.6.135) och permanenter först (v0.6.132) är byggda; öppningsBOKEN (t.ex. Horace Radcliffe) kvarstår.

**FORTFARANDE ÖPPNA och relevanta:**
- 2 **persona-trösklar inne i taktiken** — och jag har LAGT TILL fler i veckan trots "must NOT add more": chansningen i stack-tävlan läser `P.aggression >= 1.2`, m.fl. Persona-specens §5 (nu projektfil) är fortfarande okontrollerad mot koden (skuld 12). Värt en egen genomgång innan fler personor än shark används.
- 5 / 11 **prognoskalibreringen** inte ommätt: `gen-forecast-calibration.js` finns i projektet, men är inte körd sedan block-, bounce- och stealth-beteendet ändrades kraftigt. Billigt att köra på bal7 + bal8.
- 7 **mänskligt bord otestat** (keep-a-blocker ser passivt ut; bare block sägs som "Block!" utan kort) → nu dessutom frågefönster, betänketid, totalfrågan. Se §3.
- 10 **H = 3 och kvoten som bara gäller när `myTto <= 2H`**: KONTROLLERAT — villkoret står kvar i `_strategize` (rad ~1969). Johan skulle bekräfta ändringen från 118b-regeln; det har aldrig skett.
- 15 **`_wakeCard()` vampyrblind**: KONTROLLERAT — fortfarande 6 anrop (bounce-, röst-, reduce-vägarna och blockfönstrets `wakeAvail`). Intercept- och unlock-vägarna fick `_titleOk` i v0.6.139. Viktigare nu när "wake + bounce på totalen" är doktrin: en wake kan räknas som tillgänglig för en vampyr som inte kan spela den.
- 16 **metaspaken: bouncens MÅL mot bordets hot** (i stället för alltid bytet) + `crossRushWeight` 0 — samma sak som min "bouncens riktning". Hör till metalagret.
- 18-rest **KRC vid pass 0,85 förlorar mot plain bleed** (`_refValue`-vikterna); `polOverBuild` (v0.6.131) löste bara bygg-mot-omröstning.
- 20a–h **politikbenets självgranskning** (röstsummans restglapp m.fl.): orörda i veckan, "justera inte före nullen" — nullen är körd, så de är nu fria att ta.
- 22c **Majesty efter motståndarnas skadestatistik** (Johans riktning) — inte byggt; `hitMax` / `_pPump` finns nu som underlag.
- 25e–f **`give` i hotseat**: nu BEKRÄFTAT frånvarande i bryggan (CLAUDE.md 66c).
- 26g bot-diablerie · 31c rushen prissatt i pool · 33b nosferatus offensiv (→ §4).
- Ledgern: **hacking-leken som predator** fäller sitt byte först (16 / 16 i augusti) — alla lekpåståenden i veckan gäller de FYRA startlekarna; hacking / sewer behöver egen balanserad serie. **B-55e-b** (blockad rad med `by: null`): KONTROLLERAT — 2 av 187 blockade rader i bal8, nästan borta men inte helt. **B-55f-b** intercept-bankning: öppen, och mer aktuell nu när blockaren kan lägga ett andra kort.

**KOSMETISKT (låt ligga):** 4 action-klasserna · 6 ash-heap-dedupen.

**Kontrollerat utan anmärkning:** 13b stealth-glut-regeln ("aldrig fler än TRE stealth-kort, och OLIKA") är förenlig med stack-tävlan — den stöder den snarare (olika namn = spelbara på samma action).
