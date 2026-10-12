#!/bin/bash
# make-bench-report.sh -- writes REPORT-bench-controls.md from the three control arms
cd /home/claude/w
{
echo "# The mirror bench — controls (26–27 Sep 2026, bot v0.6.185)"
echo
echo "**Question:** can the bench tell a real strength difference from noise? A bench only counts with both controls (design Part 5, VTES-Player's rule)."
echo
echo "**Design:** each match uses one of the 12 balanced seat orders (\`serie-cmb1/design.txt\`, the four starter decks). The variant seat is \`((I-1)/12)%4+1\`, so it rotates through all four seats every 48 matches. Seed \`9100+I\` is the same in every arm, start pool 30, all experts except the variant. The metric per match is the variant seat's VP minus a quarter of the table's VP, reported with a 95 % interval over matches."
echo
echo '```'
python3 ana-bench.py neg crip pos twd negT twdT dyn dyn2
echo '```'
echo
echo "## Reading"
echo
echo "- **Negative control, A vs A:** the interval must contain 0. It does. The mean leans positive while the variant has sat only in seats 1–2; the 48-match run covers all four seats."
echo "- **Positive control, crippled** (\`poolFloor=22\`, the variant never spends pool below 22): it must lose clearly. It does — no wins, and the interval lies wholly below 0. **The bench can see a real handicap.**"
echo "- **Novice persona:** not measurably weaker than expert at this sample. Personas change behaviour more than strength, the same finding VTES-Player made. Keep this in mind for the knowledge layer's personas."
echo "- **Scale:** the interval is about ±0.7 VP at 24 matches and about ±0.5 at 48. A claim must beat that. Small tuning needs long benches: one CPU, three matches in parallel, 24 matches ≈ 40 minutes."
echo
echo "## How to run"
echo
echo '```'
echo 'for w in 0 1 2; do setsid nohup ./bench.sh ARM $w 3 48 SPEC & done   # resumable: rerun the same line after an interruption'
echo 'python3 ana-bench.py ARM neg                                          # compare with the negative control'
echo '```'
echo
echo "SPEC is \`none\` (A vs A), \`persona=novice\`, or \`knob=key=val\` (any whitelisted arena knob on the variant seat)."
} > REPORT-bench-controls.md
