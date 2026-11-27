# Sessionsjournal — Elysium, klient/server-halvan

*Journalen skrivs på svenska, med den nyaste posten först. De 190 posterna från 4 augusti till 26 november 2026 är frysta, hela och ordagranna, i det privata data-repot (`dtagent2000/VTES-Elysium-data`, `client-history/elysium-session-journal-2026-11-26.md`; se `docs/history/README.md`). Från 27 november bär journalen inga chattcitat och inga namn på privatpersoner, och ägaren nämns efter roll.*

## [DET PUBLIKA REPOT] (27 november 2026, klient v2.6.190 / srv-2.6.54, bara kommentarer)

Repot är publikt. Ägaren satte avgränsningen för vår halva den 26 november. Hans namn får stå kvar i det som redan
fanns. Andras namn och privata samtal ska bort, alltså chattcitat och vidarebefordrade meddelanden, även där ett beslut
vilar på dem. Beslutet står då kvar med egna ord, och de ordagranna orden som spelar roll sparas i det privata data-repot.

Jag mätte först. Bottsidans skanner, vidgad till våra filer, och två egna sökningar gav en bild. Den ena sökningen
letade efter citat strax efter ägarens namn, den andra efter versala ord som varken är kortnamn eller vanliga ord:
- ägarens namn på omkring 1 700 ställen (tillåtet);
- omkring 250 rader med svenska citat och ett hundratal engelska, och ungefär 80 % av dem i historiken i fyra
  kumulativa filer;
- fyra privatpersoner, alla spelare vars frågor eller filer kom till oss genom ägaren.

Jag föreslog att frysa historiken och skriva om resten på plats. Ägaren valde det, och hans namn får stå kvar i
klientens UI-exempel (namnfältets platshållare och exemplen i offline-dialogen).

Fryst, hela och ordagranna som på main vid `a94072b`, i data-repots `client-history/`: journalen, de 274
release-posterna i `client/CLAUDE.md`, kontextdokumentets 214 poster och START-HERE:s gamla avsnitt. De fyra filerna
börjar om här. `client/CLAUDE.md` gick från 463 till omkring 50 KB, och den laddas hel i varje session.

Omskrivet på plats: changelogen, learnings, 24 kommentarer i klienten, två kommentarer och VERSION-raden i servern,
sex testtitlar, ett assert-meddelande och åtta kommentarer i sviterna, planerna, SKILLS, digesten (v1.5.1) och fyra
svar till bottsidan.
Varje rad jag rörde nämner ägaren efter roll. Orden som togs bort finns i data-repots
`client-cleanup-2026-11-27-words.md`, per fil och rad på `a94072b`. Learnings 122 svenska rader, ett gammalt
titelindex med punkter, är översatta till engelska.

Releasen v2.6.190 och srv-2.6.54 ändrar bara kommentarer. Beviset är att acorns tokens för varje skript i klienten är
v2.6.189:s utom VERSION-strängen, och att serverns är srv-2.6.53:s utom dess VERSION-sträng. Stilarna och markupen är
lika när kommentarerna är borta. v2.6.189 och srv-2.6.53 mot de nya sviterna ger 433/0 och 103/0 med samma rader.

Vakten är `client/tools/public-scan.py`, vår kopia av bottsidans skanner. Den hittar ägarens namn och de privata
namnen (sparade som hashar), svenska citat, ett citerat spann strax efter ägaren, rollen eller ett namn, och svensk
prosa utanför journalen. CI kör den på en PR:s nya rader och på commit-meddelandena.

Grindar: klient 433/0 (bot v0.6.241 bredvid, inga överhoppade), dispatch 103/0, protokoll 6/0, kanariefågel 283/0,
endpoint 40/0, soak `--control` löste ut, bottsidans hotseat-grind i en scratch-kopia 12/0, båda embed-kontrollerna,
B1 byte-identisk, check-versions grön, skannerns självtest 23/0 och `--diff` ren på grenen. Watchdog-testet körs
efter commit, eftersom det jämför roten med HEAD.

Bottsidan fick ett svar, `docs/handoffs/REPLY-to-bot-2026-11-27-public-repository.md`: vår halva är klar, inget
ändras på tråden, och de kan hämta sina läskopior från v2.6.190.

Osäkert:
- Engelska citat hittas med mönster. Ett andra, bredare svep hittade fem till, och skannerns granskningslista över hela trädet fyra till. Fler kan finnas,
  särskilt där citatet inte står nära ägaren, rollen eller ett namn.
- Namnsökningen bygger på versala ord som varken är kortnamn eller vanliga ord. Ett riktigt namn som också är ett
  kortnamn eller ett vanligt ord kan ha slunkit igenom. Namnen i långnamnstestet räknade jag som påhittade.
- Bottsidans läskopior i `bot/` har den gamla texten tills de hämtar v2.6.190.
- Skannerns regel för engelska citat larmar också på en UI-sträng strax efter ägaren eller rollen. I ny text skriver
  man då om meningen.
