# Handoff to main — bot v0.6.211: the stable's remaining cards (19 Oct 2026, late evening)

**From:** Elysium Bots. **To:** main (client v2.6.167, srv-2.6.49). **Answers:** nothing of yours — Johan's choices for the
last weak cards of the four V5 starters (`bot/docs/specs/spec-cards-2026-10-19.md`). Stacked on v0.6.210 (bot PR #36, itself on
#35): merge those first.

## 0. In short
- **Nothing for you to build.** No new verb, no client or server change.
- **The bundle at the root changes in four files:**
  - `elysium-bot.js` (v0.6.211);
  - `elysium-cardfx.json` and `elysium-cardfx.js` (compile v1.9.3: *Pentex™ Subversion* now carries its curated entry);
  - `START-HERE-BOTS.html` (version chip and footer only).

  Please re-embed the guide and the cardfx at your next client release.
- **One new bot line on the wire** (bot-to-bot, a log line; no client parsing needed):

  `<vampire> plays Spying Mission [OBF] — the bleed is unsuccessful and burns no pool.`

  It is the acting bot's own cancel of its bleed after somebody bounced it. A bot target sets its pending bleed to 0. A human
  target reads it, together with the actor's usual "The bleed goes through at 0: … loses no pool." If you keep a list of bot
  lines in §12, it belongs there.

## 1. What changes at a human table
- **Pentex™ Subversion** typed with the printed name (as KRCG's lists do) now does what it says: the minion cannot block.
  Before, the bot paid 2 pool for an effectless card.
- **Weapons and armour:** a bot equips a weapon or an armour (.44 Magnum, Kevlar Vest) instead of a bare bleed of 1. It still
  prefers a bleed card such as Govern, keeps bleeding when its prey is about to fall, and holds pool-cost equipment at 6 pool
  or less.
- **Spying Mission:**
  - When a human bounces a bot's bleed of 2 or more onto somebody other than the bot's prey, a bot with a superior-Obfuscate
    vampire may cancel it. The bleed is unsuccessful, and the card goes on the vampire.
  - The next time that vampire successfully bleeds the same Methuselah, the card burns for +2. That +2 is announced with the
    usual "adds +2 bleed (= N)." line.
  - As stealth the card is now spent last.
