# archive-HOWTO — sections moved out of the standing HOWTO (one in, one out, RULINGS D-145)

Moved by the 11.11 round (27 Nov 2026, bot v0.6.245) to make room under the standing pages' ceiling; verbatim.

## One-off tools (each reproduces a committed report; not gates)
`ana-combat-sum.py` (`REPORT-combat-series-table.txt`) · `REPORT-bench-controls.md` (the arena bench) ·
`sweep-pilot.py`, `sweep-pass2.py`, `sweep-full.py` (the cardfx sweeps, `REPORT-cardfx-sweep-*.md`) · `diag-give-probe.js`
(a live give / given probe through the server, ~70 s; copy it for any feature whose two halves meet only through the server) ·
`diag-a1-stash-probe.js` · `gen-plan-review.js` · `gen-sweep-audit.js` · `gen-forecast-calibration.js` (to revive, BOARD).
Series and benches run on the sim (above); an arena series is `elysium-bot-arena.js` itself,
one process per match.
