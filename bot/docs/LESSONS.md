# LESSONS — the ~300 learnings distilled (20 Oct 2026). Numbered L-n (never renumbered; a new line takes the next number). Each line names its dated story in `history/elysium-bot-learnings-2026-10-20.md` (the date is the key there). Read before building anything with timing, tests or measurements. A new line only for a new CLASS of lesson.

## Before you build
- L-1 **Find the general measure before writing the deck rule** (19 Sep): "two superior-Animalism vampires first" was a special case of "raise the vampire that can play your library" (`_deckFit`).
- L-2 **Johan's three layers**: statistics → general handling → deck persona; put the change in the lowest layer it belongs to (19 Sep).
- L-3 **When Johan states a doctrine, do not generalise it past his words** (20 Sep): probe-first became the default when he had reserved it for "no stealth in hand".
- L-4 **A new general level gets ONE consumer first** (19 Sep, the critical pool); spend a paired control only where the knob has consumers.
- L-5 **Before shipping a rule with a threshold, count how often the condition is TRUE in an existing series** (21 Sep): the pump rule and the rich-library rule never fired.
- L-6 **Read the rulebook section before building on a rule from memory** (18 Sep): the cost-on-success reading overturned a day of design.
- L-7 **When a mechanism already exists, the card is a term in it**; before inventing a decision, ask what existing object the answer could BECOME (15–18 Sep).
- L-8 **Look for the field before designing the feature; check whether the neighbouring project already chose an architecture** (15–16 Sep).
- L-9 **A pricing question comes before a bug**: "the card never shows up" (Kevlar, 429 offers, 0 taken) was a flat price, and the knob experiment should have waited for the doctrine question (19 Oct).
- L-10 **A tie-break is where a card's second job lives**; when two keep-rules can meet on one tie, say which wins and tell Johan (19 Oct).
- L-11 **Keep the rejected alternative as a document, not a code path** (16 Sep, the helper gate).
- L-12 **Ask what the bot CANNOT do, not only which cards are inert** (18 Sep: a rule about a card's cost usually needs an action the bot lacks).

## Tests that lie
- L-13 **A hook called by a unit test proves the hook, not its call site** (16 Oct, twice in one release: Arcane Library's lock, the probe reservation). Test a phase effect through the phase.
- L-14 **A hand-built ctx in a test proves the scorer, not the wiring** (19 Sep, `tBlood`); feed the finder's own target.
- L-15 **A fixture written from YOUR side's assumption proves the assumption, not the contract** (21 Sep, `attachTo` by name vs the wire's card id).
- L-16 **A test can lock a bug in** (19 Oct): section 19c had asserted "with 1 pool both assets are affordable" since July. A boundary in a test deserves the rules question "what happens AT the boundary?".
- L-17 **A baseline is only a baseline if it was ever green** (14 Sep): v0.6.108 shipped unrun, and the "environmental" abort was its own regression.
- L-18 **An extracted harness is evidence for what it covers and silence about everything else**; conflating it with a green suite is how a project starts lying to itself (14 Sep).
- L-19 **A guard clause in a test is a silent skip; cases that are all negatives test the fixture; grep for the rule's VERB in the test** (VTES-Player, 11 Oct).
- L-20 **A guard can test the wrong path and pass for the wrong reason**; a test you write for your own design choice cannot find that choice's hole (12–16 Oct).
- L-21 **A test pins the behaviour of its day**: when a behaviour change breaks an old live section, read WHAT it pinned before touching it (20 Sep, 16 Oct).
- L-22 **A section that calls a brand-new method throws on the old bytes** — a destructive proof that the method is new, nothing more; name it as such (16 Sep).
- L-23 **A two-sided effect needs a test from BOTH sides** (22 Sep, the steal); a unit test of each half is not a test of the wire (18 Sep, give / given).
- L-24 **Source-shape assertions are tripwires for insertion order** (18 Sep, 80e) and the suite guards the docs too (15 Sep).

## Timing
- L-25 **No await between a line and the window it opens** (17 Oct): a 150 ms sleep before the window lost answers at pace 0 for four weeks (v0.6.144 → v0.6.206; the pacing sleeps after a window stay); two windows in three ran out their clock.
- L-26 **A guard about what the table has seen keys on the line the answer answers, not on my queue** (17 Oct).
- L-27 **A wait's clock starts when its question reaches the wire; a send queue is not a timeline** (15–16 Oct).
- L-28 **Time the whole flow, not the wait you changed** (9 Oct); a shortened wait that was somebody's only window becomes an asked step.
- L-29 **Pace the thing the rule is about** (17 Oct, the chat beat): the beat was separating everything, not two bubbles.
- L-30 **A race at human pace is invisible at paceMs 0** (15 Oct); reproduce it on the 300 ms relay. A synchronous spin cannot be raced in-process.
- L-31 **A wait that guards a race must wait for an EVENT, not for time** (16 Oct); two clocks with no coupling means the longer one always wins (16 Sep).
- L-32 **Two pause mechanisms are one rule only where they agree** (12 Oct, the hold): a pause outliving the release hung the poll.
- L-33 **Resolve an effect at its rules moment, not when its line arrives** (10 Oct, the steal); an emit with side effects is a commitment — put it at the rules moment (16 Oct, `through`).
- L-34 **When you change an order, re-read every wait that assumed the old one** (16 Oct, the strike peek).
- L-35 **A flag about a FUTURE step dies where its scope ends** (16 Oct, a final-round Grapple leaked into the next combat).
- L-36 **A pause measured from your own last act is invisible after a long wait** (22 Sep): anchor the beat on the table's last event.
- L-37 **`null` means two things in the same field; count the arm sites against the restart sites** before shipping a timing change (16 Sep).

## Reading traces and measurements
- L-38 **"Never seen" means "never emitted" until the emit is proven** (20 Sep): eleven play sites wrote no row; every per-card reading of that week was redone. Guessed emit fields lie; the trace is the judge.
- L-39 **Pair the rows, don't explain the totals** (10 Oct): the steal totals were "explained" as capping while the stealer gained from an empty vampire.
- L-40 **Check the work by asking what the table did, not whether the totals add up** (19 Oct): 35 bots played on at 0 pool under matching totals.
- L-41 **Two series on near-identical logic are the cleanest yardstick there is — and they said 4 wins vs 8** (20–21 Sep); 12 matches a side resolve only large decision-level effects; an unchanged deck in a paired series is a free noise estimate.
- L-42 **Find the binding term before tuning a product** (20 Sep): in `a × b × c ≥ t` check which factor is small in the refusals.
- L-43 **Read the distribution, not the mean** (19 Sep); per-turn rates lie when match length changes; a per-match count rises when a deck lives longer.
- L-44 **"Plays it right" and "wins" are separate claims with separate predictions** (19 Sep); register falsifiable predictions BEFORE measuring; write the regression rule before the data, and make it un-dodgeable (a two-clause rule was dodged by the very failure it guarded).
- L-45 **Random seating from 12 seeds is not balanced seating**; reusing seeds pairs the seating — good for versions, bad for ranking decks (19 Sep).
- L-46 **A deterministic table turns "is it noise?" into "which decision changed?"**; a dropped decision shifts every later index (19 Oct).
- L-47 **Volume finds the rare endgame**; static coverage says what the bot CAN play, the traces say what it DOES (19 Oct).
- L-48 **Measure where the time goes before making a loop faster** (19 Oct: 3 s of CPU in a 212 s match → the virtual clock).
- L-49 **An inferred input can invert a finding** (11 Oct): take a minion's state from the last snapshot, not from arithmetic.
- L-50 **A timeout is a bug report, not a long game** (20 Sep): one long gap = protocol, many rounds = strategy.
- L-51 **Read the why strings literally; an odd repeated why is a loop until proven otherwise** (19 Sep, the Blood Doll loop).
- L-52 **Count in the arena, weigh in a lab** (17 Oct); prove a knob fires before reading its arm (27 Sep, the inert `dyn` arm read as "no loss").
- L-53 **Sanity-check a classifier against one known case before reporting its list** (21 Sep: the "no fx" list named cards the bots play).
- L-54 **A smoke is not a pattern; 100 % is a finding too; restraint is a finding too** (Sep).
- L-82 **A design that never changes the table cannot see a rule that only bites at another table** (29 Oct): Chantry's last-pool rescue never fired in 240 four-seat matches and showed in the first 168 five-seat ones. Vary the table size and the decks, not only the seats and the deals.

## Contracts, parsers and state
- L-55 **A parser and its phrase are one contract; move the phrase's tier and the parser goes deaf** (22 Sep: six days of series with no combat handshake).
- L-56 **Specific before generic, and test a parser on the line as SENT** (16 Oct, `NAME (bot)`); a looser pattern for a new line can swallow an old line on the same words.
- L-57 **Lines are the contract, fields the accelerator** (23 Sep); two carriers for one fact means parsing both, not choosing (15 Sep).
- L-58 **A stash that overwrites cannot hold two sources**; one field, one meaning; a value written as a total undoes every adjustment it did not see (16 Oct).
- L-59 **A refusal the refused party cannot hear is a silent state split** (16 Oct, the vanished bleed).
- L-60 **A rule fixed at one site is wrong at its neighbour**; a doctrine applied in one place is not applied (12 Sep, 16 Oct).
- L-61 **Any id that crosses seats must be table-unique; a silent `return` in a handler is a lost card** (18 Sep, give / given).
- L-62 **A rollback knob must not carry rules** (23 Sep); a derived default multiplies somebody else's knob (9 Oct).
- L-63 **A policy belongs at the receiver when the sender cannot know the audience** (16 Oct, the debug hand).
- L-64 **Every path that sets `out` must still release the turn; every pool loss needs the oust check beside it** (20 Sep, the freeze).
- L-65 **"Dead" needs the widest honest judge** (16 Oct: every vampire of mine, else the deck's crypt).
- L-66 **A comment that explains a bug is still a bug; a clever loop condition is a comment that did not get written** (16–18 Sep).
- L-67 **A name variant in the curated layer is a silent miss for the other spelling** (19 Oct, Pentex); a comment that says "client-identical" is a claim — pin it with a test against the client's own code (19 Oct).
- L-68 **A trailing `//` comment is a statement killer** (26 Sep); never tail-append to a line ending in a comment.

## Tools and ways of working
- L-69 **The smoke of the release is part of the release** (16 Oct): every R2–R4 release's own smoke found a bug its suite did not.
- L-70 **An audit marked "owed" is a list of live bugs** (16 Oct, the v0.6.140 pool-loss audit).
- L-71 **Read the other side's code before saying what it does** (12 Oct, the bridge); measure the OTHER runtime with its own code, not a model of it (21 Sep, the lifted `hotBridge`).
- L-72 **Every option the arena passes is a parity risk** (21 Sep: the client passed no `deckName` for five weeks).
- L-73 **A rename is done when you have grepped everything that SHIPS** (21 Sep, the persona names in START-HERE).
- L-74 **Keep the series' bytes still** (22 Sep); read the PR's state before promising to add to it (17 Oct).
- L-75 **A data file's name is a contract with the script that reads it** (15 Oct, `twda.json` vs `twda-vdb.json`).
- L-76 **A tool that "exists" in a changelog may not exist in the project** (19 Sep, the price referee).
- L-77 **The standing question ("anything I'm unsure about") is not a formality** — it has caught three silent-wrongness classes (em-dash anchors, a no-op filter, a seat race).
- L-78 **A chat review's findings must land in a project file the same day** (11 Sep); a release that skips its gate leaves the next session a false baseline (14 Sep).
- L-79 **Seat and deck attribution comes from manifests, never from names or emission order** (4 Aug, bitten twice).
- L-80 **Split by OWNERSHIP, then consume releases** (9 Sep); never share files between two projects again.
- L-81 **Three brains is the disease, not the bots** (carried in from main): one source of truth per fact.
