# Sessionsjournal — Elysium, klient/server-halvan

*Journalen skrivs på svenska, med den nyaste posten först. De 190 posterna från 4 augusti till 26 november 2026 är frysta, hela och ordagranna, i det privata data-repot (`dtagent2000/VTES-Elysium-data`, `client-history/elysium-session-journal-2026-11-26.md`; se `docs/history/README.md`). Från 27 november bär journalen inga chattcitat och inga namn på privatpersoner, och ägaren nämns efter roll.*

## [BLOD PÅ HJULET] (27 november 2026, klient v2.6.191, srv-2.6.54 oförändrad)

Ägaren bad om tre kontroller och frågade samtidigt efter handoffs från bottsidan.

Handoffen var bot v0.6.242, bottsidans städrelease inför det publika repot. Den bad bara om att vi bäddar in deras nya
guide. Vår svit gav 432/1 bredvid paketet, och den röda var just embed-kollen. Sewer-lekens nya namn är redan vår
menyetikett, och ingen kod eller test hos oss läser det gamla.

Ägaren svarade på O-46. Sudden Reversal är ovanligt, så bordet ska inte vänta vid varje masterkort. Takten står kvar som
den är, ett tyst fönster där en spelare som har kortet säger Hold on. Svaret gick till bottsidan i svaret på v0.6.242.
O-53 fortsätter ägaren att fundera på.

1. En tangent som hålls medan man scrollar på ett kort flyttar blod mellan kortet och poolen. Upp flyttar 1 från poolen
till kortet, ner flyttar 1 tillbaka. Ägaren föreslog Shift som standard, och Settings ▸ Table väljer mellan Shift, Ctrl,
Alt och Av. Tom pool eller ett kort utan blod stoppar flytten med en toast. I Influence med helpers på går en okontrollerad
vampyr genom hjälparens transfer, så transfers räknas precis som med vanlig scroll.

Ägaren ville ha en loggrad först när man scrollat klart. Raden skrivs en sekund efter sista hacket, så även en långsam
scroll blir en rad. Brädet skickas ändå till bordet direkt. Förut red publiceringen på loggraden, så nu sparar varje hack
själv.

En fälla: Chrome och macOS gör Shift + hjul till horisontell scroll, med deltaY 0 och steget i deltaX. Kortets gamla
hanterare räknade därför varje Shift-hack nedåt, och filtens zoom zoomade ut varje gång. Steget läses nu från båda
axlarna. Medan tangenten hålls rör varken filten eller poolglobarna hjulet, så en scroll som glider av kortet gör
ingenting. Ctrl är undantaget, eftersom en touchpads pinch kommer som Ctrl + hjul.

2. Två genvägar gör samma flytt. De är obundna från start och ligger under Shortcuts, advanced. De gäller det markerade
kortet som + och − gör, annars kortet under pekaren (ägarens val), annars en toast. Binder man + och − till dem släpper
de vanliga ±1-raderna tangenterna.

3. Ett dubbelklick på mittenknappen återställer vyn med samma funktion som ⛶-knapparna, i helikoptervyn och på
Classic-brädet. Webbläsare skickar dblclick bara för vänsterknappen, så klienten räknar själv: två tryck inom 0,5 s och
6 px, utan rörelse emellan. Andra trycket panorerar inget men håller pekaren till släppet, som en pan gör. Det gamla
pan-testet från v2.6.181 råkade spela ett dubbelklick, så det nollställer nu klickminnet och säger varför.

Fixed controls listar nu flytten (raden följer inställningen), båda mittenknappsgesterna och filtens hjul som zoom. Där
stod tidigare vynivåer, men hjulet slutade byta nivå för länge sedan.

Grindar: klient 439/0 (bot v0.6.242 bredvid, inga överhoppade). v2.6.190 mot den nya sviten ger 432/7, alltså
embed-kollen och de sex nya testerna. Tolv mutationer av den nya koden fångades alla. Den tolfte krävde en kontroll efter
släppet, eftersom requestAnimationFrame aldrig körs i harnessen. Dispatch 103/0, protokoll 6/0, kanariefågel 283/0,
endpoint 40/0, soak `--control` löste ut, båda embed-kontrollerna, B1 byte-identisk, check-versions grön, public-scan
ren. I headless Chrome med riktiga hjul-, tangent- och mittenknappshändelser gick 17 av 17 kontroller igenom, och v2.6.190
föll på gesterna.

Osäkert:
- Shift + hjul med en riktig mus i Chrome på Windows är inte provat. Headless Chromes syntetiska Shift + hjul förblir
  vertikalt, så den horisontella formen skickade jag för hand.
- Firefox, Safari och en riktig touchpad är inte körda. Med Ctrl som tangent flyttar en pinch över ett kort blod.
- Den som har slagit på Hold Shift to peek at the log får loggen uppfälld när Shift hålls för flytten. Raden i Settings
  säger det.
- Flytten gäller alla kort i spel som tar tokens, också allierade, vars röda tokens är liv. Det följer sandlådans regel.
- Dubbelklickets fönster på 0,5 s är en gissning för en stel hjulknapp.

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
