# Elysium Bots — delivery 27 September 2026 (a): THE MIRROR BENCH (tools; bot unchanged at v0.6.185)

The mirror bench is the design's Part 5. It tells a real strength difference apart from noise, and it has been validated with both controls. Full results and instructions are in `REPORT-bench-controls.md`.

## Validation

| Arm | Matches | Variant seat's VP minus the table's average | 95 % interval | Wins (expected) |
|---|---|---|---|---|
| Negative control (A vs A) | 48 | +0.14 | −0.31 … +0.59 | 12 (12.0) |
| Crippled bot (poolFloor 22) | 12 | −0.81 | −1.14 … −0.49 | 0 (3.0) |
| Novice persona | 16 | +0.25 | −0.60 … +1.10 | 5 (4.0) |

## What the controls show

- **Two identical bots come out even.** The negative control is a dead heat.
- **A real handicap shows clearly.** The crippled bot won none of its 12 matches.
- **A persona barely moves strength.** The novice arm is inside the noise.
- **Seat position matters.** Never read a bench before the variant has sat in every seat.

## The rule

A strength claim needs 48 matches, with the variant in every seat, read against the negative control. That gives about ±0.5 VP. This rule is now in CLAUDE.md.

## Add / replace

- **Add:** `bench.sh` (resumable), `ana-bench.py`, `make-bench-report.sh`, `REPORT-bench-controls.md`, this file.
- **Replace:** `CLAUDE.md`, `elysium-bot-CHANGELOG.md`.

## Next

The knowledge layer. Each of its questions will be measured on the bench.
