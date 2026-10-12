# PROJECT-INSTRUCTIONS.md — texter att klistra in som projektinstruktioner (9 september 2026)

*Två block, ett per projekt. De ersätter den nuvarande enradaren ("läs alltid senaste
*-session-journal.md …"). Håll dem korta: detaljerna bor i respektive CLAUDE.md, som
instruktionen pekar på. Uppdatera blocken bara när en regel ändras, inte per release.*

---

## Elysium (huvudprojektet)

```
Läs ALLTID först, nyaste poster först: CLAUDE.md, elysium-session-journal.md,
elysium-project-context.md, elysium-learnings.md. Uppdatera alla fyra + SKILLS.md
+ elysium-CHANGELOG.md efter varje implementation (write-then-rename, räkna
poster efteråt). Svenska i chatten, engelska i kod och docs.

ÄGANDE: detta projekt äger klienten (elysium-vtes-bord.html, inkl. hotBridge och
hotseat-bot-UI:t), servern, harnessen, klient-/serversviterna, ELYSIUM-PROTOCOL.md,
ops och docsen. Boten, arenan, cardfx och bot-docsen ägs av systerprojektet
"Elysium Bots" — deras filer redigeras ALDRIG här. Vi konsumerar deras releaser
(bot vN, cardfx) och antecknar versionen i PROJECT-MANIFEST.md §E2. Behöver en
ändring båda sidor: gör kontraktet (protokoll/server/klient) här först, releasa,
och låt botprojektet konsumera i nästa session — aldrig båda i samma vända.

GATES före varje leverans, i ordning: node --check → test-client-logic.js →
test-server-dispatch.js → test-protocol-doc.js → test-error-endpoint.js →
test-bot-canary.js (kontraktstestet mot bottens parsers; hoppar utan den
releasade boten — ladda upp den när en frusen loggrad ändras) →
B1 (split_client.py → elysium-build.js → byte-identisk) → check-versions.js
("everything agrees"). De fyra HB-testerna i klientsviten hoppar över sig själva
om elysium-bot.js saknas — i sessioner som rör hotBridge: be om den releasade
boten och kör dem. Nya tester verifieras destruktivt mot filen före ändringen.

LEVERANS: fulla filer via outputs + present_files (klienten först). Inga
patchskript — det finns bara en linje. VERSION-raden bär bara aktuell
releasenot; föregående flyttas till elysium-CHANGELOG.md vid varje bump.
Version = bytes: samma nummer får aldrig betyda två olika filer.

Ingen deploy utan webbläsarkoll (ops-runboken). Avsluta varje implementations-
runda med ett ärligt "är det något du är osäker på?"-svar utan att bli tillfrågad.
Vid hur-ska-vi-göra-frågor: analysera först, föreslå, vänta på "kör".
```

---

## Elysium Bots (systerprojektet)

```
Läs ALLTID först, nyaste poster först: CLAUDE.md, elysium-bot-session-journal.md,
elysium-bot-project-context.md, elysium-bot-learnings.md. Uppdatera alla fyra
+ SKILLS.md + elysium-bot-CHANGELOG.md efter varje implementation. Svenska i
chatten, engelska i kod och docs.

ÄGANDE: detta projekt äger elysium-bot.js, elysium-bot-arena.js,
elysium-bot-table.js, gen-*-verktygen, cardfx-pipelinen (cardfx-compile.js,
cardfx-curated.json → elysium-cardfx.json/.js), arena-lekarna, botsviterna,
bot-designkanon och START-HERE-BOTS.html. Klient, server, harness och protokoll
ägs av huvudprojektet "Elysium". Kopiorna här av elysium-server.js,
ELYSIUM-PROTOCOL.md och elysium-hotseat-bots-plan.md är READ-ONLY (arenan
spawnar servern; protokollet är kontraktet) — redigera dem ALDRIG. Behöver
boten ett nytt trådverb eller en klient-/serverändring: skriv behovet i
journalen och context, låt huvudprojektet skeppa kontraktet först, konsumera
sedan — eller skeppa boten först om ändringen är bakåtkompatibel. Aldrig
båda i samma vända.

GATES före varje leverans: node --check på varje ändrad fil → test-bot-logic.js
×3 ensam (timeout 210) → test-bot-canary.js (kräver den releasade klienten +
protokollet bredvid; hoppar högljutt annars) → test-cardfx.js när cardfx ändrats
(kräver vtes.json bredvid) → diag-hb1-smoke.js när bottens webbläsaryta ändrats.
Nya tester verifieras destruktivt. Arena-ändringar utvärderas i nästa
stridsrapport per doktrinen (change · prediction · observed · verdict).
Bot-namn roterar mellan matcher — lek och säte läses ur trace-manifesten, aldrig
ur namn eller emissionsordning.

RELEASE: bumpa BOT_VERSION (raden bär bara aktuell releasenot; föregående går
till elysium-bot-CHANGELOG.md), uppdatera versionshandslaget i CLAUDE.md, och
leverera det huvudprojektet bundlar: elysium-bot.js, elysium-cardfx.json,
elysium-cardfx.js, START-HERE-BOTS.html. Fulla filer via outputs +
present_files; inga patchskript.

Avsluta varje implementationsrunda med ett ärligt "är det något du är osäker
på?"-svar utan att bli tillfrågad. Vid hur-ska-vi-göra-frågor: analysera
först, föreslå, vänta på "kör".
```
