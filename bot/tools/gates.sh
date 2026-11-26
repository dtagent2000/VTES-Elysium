#!/bin/bash
# gates.sh -- the local gates a change needs, and one summary for the PR (HARNESS "The round"; RULINGS D-139, 26 Nov 2026).
# The fixed local gates always run; two more when the diff (committed, staged, unstaged, untracked) touches them; the rest by flag.
# The arena smoke, a new section's destructive check and main's client suite stay by hand (CLAUDE.md "Gates"):
#   always     node --check on every bot/ script · the correctness lint (as CI) · the canary twice (bot/'s copies; the root's release
#              with client/ELYSIUM-PROTOCOL.md) · test-cardfx · gen-precon --check · the self-tests (card ledger, review sheet,
#              the cross-check, ana-gates, public-scan) · HB1 · doc-budget · public-scan (the name and quote scan on the lines the change adds, D-142)
#   when hit   test-bot-hotseat.js (~1 min) when the bot, the hotseat tool or a read-only copy changed; test-doc-budget.sh when
#              the doc check changed
#   --sim      the footprint: the 240-match client design (the four starters, every seating x 10 deals) on the base's bundle and on
#              this one, in two frozen copies of this bot/ (HOWTO); ana-sim-diff.py, and ana-gates.py on the new run. When BOT_VERSION
#              differs, the new traces are read again with the version put back (a clean-up round must be IDENTICAL).
#   --smokes   the 14 V5 smokes (each other precon with the four starters, 12 random seatings from seed 1), ana-gates.py on each
#   --suite N  N full suite runs, each in a frozen snapshot (6 GB heap, timeout 900): only when CI cannot run (D-139)
#   --all      both when-hit gates, whatever the diff (the flags stay flags)
# Output: OUT/summary.md (the PR's table: a row per gate, the release bytes' sha256, the totals; rewritten after every gate, so a
# poll sees progress) and OUT/<gate>.log. Exit 1 on a FAIL or a SKIPPED (a gate that skips did not run). OUT defaults to
# /tmp/gates-<branch>-<time> and is never inside the repository. Run --sim, --smokes or --suite in the background and poll.
# Usage: bash bot/tools/gates.sh [--base REF] [--out DIR] [--sim] [--smokes] [--suite N] [--all]
set -u
B=$(cd "$(dirname "$0")/.." && pwd -P); R=$(cd "$B/.." && pwd -P)
base=origin/main; out=""; sim=0; smokes=0; suite=0; all=0
while [ $# -gt 0 ]; do
  case "$1" in
    --base) base="$2"; shift ;;
    --out) out="$2"; shift ;;
    --sim) sim=1 ;;
    --smokes) smokes=1 ;;
    --suite) suite="$2"; case "$suite" in ''|*[!0-9]*) echo "gates.sh: --suite takes a number" >&2; exit 2 ;; esac; shift ;;
    --all) all=1 ;;
    -h|--help) sed -n '2,19p' "$0"; exit 0 ;;
    *) echo "gates.sh: unknown argument $1" >&2; exit 2 ;;
  esac
  shift
done
branch=$(git -C "$R" rev-parse --abbrev-ref HEAD 2>/dev/null | tr '/' '-')
[ -n "$out" ] || out="/tmp/gates-$branch-$(date +%H%M%S)"
OUT=$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$out")   # resolved before anything is created
case "$OUT/" in "$R/"*) echo "gates.sh: OUT ($OUT) is inside the repository" >&2; exit 2 ;; esac
mkdir -p "$OUT" || { echo "gates.sh: cannot make $OUT" >&2; exit 2; }
MB=$(git -C "$R" merge-base "$base" HEAD 2>/dev/null) || { echo "gates.sh: no merge base with $base (git fetch --depth=50 origin main)" >&2; exit 2; }
changed=$( { git -C "$R" diff --name-only "$MB"; git -C "$R" ls-files --others --exclude-standard; } | sort -u )
hit(){ [ "$all" = 1 ] || printf '%s\n' "$changed" | grep -qE "$1"; }

ROWS="$OUT/.rows"; : > "$ROWS"; t_start=$(date +%s)
count(){   # the gate's own count line, as its tool prints it (a composite gate's own RESULT line first)
  local l="$1" c
  c=$(grep -E '^RESULT: ' "$l" | tail -1 | cut -c9-); [ -n "$c" ] && { echo "$c"; return; }
  c=$(grep -oE '^[0-9]+/[0-9]+ — (all green|FAIL)' "$l" | tail -1 | cut -d' ' -f1); [ -n "$c" ] && { echo "$c"; return; }
  c=$(grep -oE '[0-9]+ pass / [0-9]+ fail / [0-9]+ skip' "$l" | tail -1 | awk '{print $1"/"$4" ("$7" skip)"}'); [ -n "$c" ] && { echo "$c"; return; }
  c=$(grep -oE '[0-9]+ of [0-9]+ checks passed' "$l" | tail -1 | awk '{print $1"/"$3-$1}'); [ -n "$c" ] && { echo "$c"; return; }   # passed/failed, as the others
  c=$(grep -oE '[0-9]+ checks, [0-9]+ failed' "$l" | tail -1 | awk '{print $1-$3"/"$3}'); [ -n "$c" ] && { echo "$c"; return; }
  c=$(grep -oE '[0-9]+ precons, no problems' "$l" | tail -1); [ -n "$c" ] && { echo "$c"; return; }
  c=$(grep -oE '^[0-9]+ matches: .*' "$l" | tail -1); [ -n "$c" ] && { echo "$c"; return; }
  c=$(grep -oE '^gates: (PASS|FAIL) \([0-9]+ of [0-9]+\)' "$l" | tail -1); [ -n "$c" ] && { echo "$c"; return; }
  grep -qE '^doc-budget: PASS' "$l" && { grep -oE 'bootstrap [0-9]+ / [0-9]+' "$l" | head -1; return; }
  c=$(grep -oE '[0-9]+ problems? \([0-9]+ errors?' "$l" | tail -1); [ -n "$c" ] && { echo "$c"; return; }
  tail -1 "$l" | cut -c1-80
}
summary(){
  local p f s
  p=$(grep -c '| PASS |' "$ROWS"); f=$(grep -c '| FAIL |' "$ROWS"); s=$(grep -c '| SKIPPED |' "$ROWS")
  {
    echo "# gates.sh on \`$branch\` ($(git -C "$R" rev-parse --short HEAD)$( { git -C "$R" diff --quiet HEAD 2>/dev/null && [ -z "$(git -C "$R" ls-files --others --exclude-standard)" ]; } || echo ' + the working tree')) against \`$base\` ($(git -C "$R" rev-parse --short "$MB"))"
    echo
    echo "| Gate | Result | Count | Time |"; echo "|---|---|---|---|"; cat "$ROWS"
    echo
    echo "Release bytes (sha256 prefixes): $(cd "$B" && for f in elysium-bot.js test-bot-logic.js elysium-cardfx.json; do printf '`bot/%s` `%s` · ' "$f" "$(sha256sum "$f" | cut -c1-8)"; done | sed 's/ · $//')."
    echo "Changed files against the base: $(printf '%s\n' "$changed" | grep -c .) ($(printf '%s\n' "$changed" | grep -c '^bot/') under bot/). The suite x3 is CI's (D-139): \`bash bot/tools/ci-status.sh\`."
    echo
    echo "gates: PASS $p · FAIL $f · SKIPPED $s ($(( $(date +%s) - t_start )) s)"
  } > "$OUT/summary.md"
}
gate(){   # gate NAME SKIPCHECK(0|1) CMD... -- runs CMD in bot/, logs to OUT/NAME.log, adds the row
  local name=$1 skipchk=$2; shift 2
  local log="$OUT/$name.log" t0 rc res
  t0=$(date +%s); ( cd "$B" && "$@" ) > "$log" 2>&1; rc=$?
  res=PASS; [ "$rc" = 0 ] || res=FAIL
  [ "$skipchk" = 1 ] && grep -q 'SKIPPED' "$log" && res=SKIPPED
  printf '| %s | %s | %s | %s s |\n' "$name" "$res" "$(count "$log")" "$(( $(date +%s) - t0 ))" >> "$ROWS"
  summary
}

# ---- the gates (functions run in bot/) ----
g_check(){ local f bad=0 n=0; for f in *.js tools/*.js; do [ -f "$f" ] || continue; n=$((n + 1)); node --check "$f" || { echo "node --check failed: $f"; bad=$((bad + 1)); }; done; echo "RESULT: $((n - bad)) of $n scripts parse"; [ "$bad" = 0 ]; }
g_lint(){ npx --yes eslint@10.13.0 -c tools/eslint.config.mjs --suppressions-location tools/eslint-suppressions.json . && echo "lint: clean"; }
g_canary_root(){ local d; d=$(mktemp -d); cp test-bot-canary.js elysium-bot.js elysium-cardfx.json "$d/" && cp "$R/elysium-vtes-bord.html" "$R/client/ELYSIUM-PROTOCOL.md" "$d/" && (cd "$d" && node test-bot-canary.js); local rc=$?; rm -rf "$d"; return $rc; }
g_vtes(){ [ -s vtes.json ] || { echo "vtes.json missing: bash tools/setup.sh"; return 1; }; "$@"; }
g_docs(){ bash tools/doc-budget.sh; }
g_suite(){   # one frozen snapshot: bot/ copied, the root's client one level up (154f), the sha that ran beside the log
  local d="$OUT/snap-$1"; rm -rf "$d"; mkdir -p "$d/bot"; cp "$R/elysium-vtes-bord.html" "$d/"
  (tar --exclude='./serie-*' --exclude='./bench-*' -cf - .) | tar -xf - -C "$d/bot"
  (cd "$d/bot" && sha256sum elysium-bot.js test-bot-logic.js elysium-cardfx.json > ../sha.txt && timeout 900 node --max-old-space-size=6144 test-bot-logic.js)
  local rc=$?; grep -qE '\([0-9]+[a-z]* skipped:' "$OUT/suite-$1.log" 2>/dev/null && { echo "a section skipped: its input is missing"; return 1; }; return $rc
}
BUNDLE="elysium-bot.js elysium-cardfx.json elysium-cardfx.js elysium-twd-profile.json elysium-twd-profile.js elysium-twd-archetypes.json elysium-twd-archetypes.js"
g_sim(){   # the footprint: two frozen copies of this bot/, the base's bundle in A, these bytes in B; one sim and one client for both
  local s="$OUT/sim" f va vb rc=0 norm=""; rm -rf "$s"; mkdir -p "$s/base" "$s/head"
  (tar --exclude='./serie-*' --exclude='./bench-*' -cf - .) | tar -xf - -C "$s/base"; (cd "$s/base" && tar -cf - .) | tar -xf - -C "$s/head"
  for f in $BUNDLE; do git -C "$R" show "$MB:bot/$f" > "$s/base/$f" 2>/dev/null || { echo "the base has no bot/$f"; return 1; }; done
  (cd "$s/head" && sha256sum elysium-bot.js test-bot-logic.js elysium-cardfx.json) > "$s/head.sha"   # the bytes that ran
  (cd "$s/base" && node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue --seeds 10 --trace "$s/A" > "$s/A.out" 2>&1) || { echo "the base's sim failed: $s/A.out"; return 1; }
  (cd "$s/head" && node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue --seeds 10 --trace "$s/B" > "$s/B.out" 2>&1) || { echo "the sim failed: $s/B.out"; return 1; }
  python3 ana-gates.py "$s/B" > "$OUT/sim-gates.log" 2>&1 || rc=1
  python3 ana-sim-diff.py "$s/A" "$s/B" > "$OUT/sim-diff.log" 2>&1 || { echo "ana-sim-diff failed: $OUT/sim-diff.log"; rc=1; }
  va=$(grep -oE "BOT_VERSION = '[0-9.]+'" "$s/base/elysium-bot.js" | grep -oE '[0-9.]+[0-9]'); vb=$(grep -oE "BOT_VERSION = '[0-9.]+'" "$s/head/elysium-bot.js" | grep -oE '[0-9.]+[0-9]')
  if [ "$va" != "$vb" ]; then   # a release: the traces read again with the version put back (a clean-up round must then be IDENTICAL)
    mkdir -p "$s/Bn"; for f in "$s"/B/match-*.jsonl; do sed "s/${vb//./\\.}/$va/g" "$f" > "$s/Bn/$(basename "$f")"; done   # the dots escaped: 0.6.299 must not match 0,6,299
    python3 ana-sim-diff.py "$s/A" "$s/Bn" > "$OUT/sim-normalized.log" 2>&1 || { echo "ana-sim-diff failed on the normalized traces"; rc=1; }
    norm=" · $va -> $vb, with the version put back: $(tail -1 "$OUT/sim-normalized.log")"
  fi
  echo "RESULT: $(tail -1 "$OUT/sim-diff.log")$norm · ana-gates $(tail -1 "$OUT/sim-gates.log" | sed 's/^gates: //') · bytes $(cut -c1-8 "$s/head.sha" | paste -sd' ')"
  return $rc
}
g_smokes(){
  local k bad=0 n=0 line="" r
  for k in $(node gen-precon.js --list 2>/dev/null | grep -oE '^[a-z]+' | grep -vxE 'malkavian|tremere|nosferatu|ventrue'); do
    n=$((n + 1))
    node elysium-bot-sim.js --decks "$k,malkavian,tremere,nosferatu,ventrue" --seatings random --matches 12 --seed 1 --trace "$OUT/v5/$k" > "$OUT/v5-$k.out" 2>&1 || { line="$line $k:sim-failed"; bad=$((bad + 1)); continue; }
    r=$(python3 ana-gates.py "$OUT/v5/$k" | tail -1); case "$r" in *PASS*) ;; *) bad=$((bad + 1)); line="$line $k:${r#gates: }" ;; esac
  done
  echo "RESULT: $((n - bad)) of $n smokes PASS${line:+ ·$line}"; [ "$n" -gt 0 ] && [ "$bad" = 0 ]
}

summary
gate check 0 g_check
gate lint 0 g_lint
gate canary 1 node test-bot-canary.js
gate canary-root 1 g_canary_root
gate cardfx 0 g_vtes node test-cardfx.js
gate precon 0 g_vtes node gen-precon.js --check
gate ledger-self 0 node gen-card-ledger.js --self-test
gate sheet-self 1 node gen-review-sheet.js --self-test
gate cross-self 0 node gen-cross-check.js --self-test
gate ana-gates-self 0 python3 ana-gates.py --self-test
gate hb1 0 node diag-hb1-smoke.js
hit '^bot/(elysium-bot\.js|elysium-bot-hotseat\.js|elysium-vtes-bord\.html|elysium-server\.js|ELYSIUM-PROTOCOL\.md|test-bot-hotseat\.js)$' && gate hotseat 1 node test-bot-hotseat.js
gate doc-budget 0 g_docs
gate public-scan-self 0 python3 tools/public-scan.py --self-test
gate public-scan 0 python3 tools/public-scan.py --diff "$MB"
hit '^bot/tools/(test-)?doc-budget\.sh$' && gate test-doc-budget 0 bash tools/test-doc-budget.sh
[ "$sim" = 1 ] && gate sim-240 0 g_sim
[ "$sim" = 0 ] && printf '%s\n' "$changed" | grep -qE '^bot/(elysium-bot\.js|elysium-cardfx\.json|cardfx-curated\.json|cardfx-compile\.js)$' && { printf '| sim-240 | NOT RUN | the bot or cardfx changed: a behaviour change needs --sim | - |\n' >> "$ROWS"; summary; }
[ "$smokes" = 1 ] && gate v5-smokes 0 g_smokes
i=1; while [ "$i" -le "$suite" ]; do gate "suite-$i" 0 g_vtes g_suite "$i"; i=$((i + 1)); done   # 178a4 passes silently without vtes.json
summary
cat "$OUT/summary.md"
grep -qE '\| (FAIL|SKIPPED) \|' "$ROWS" && exit 1
exit 0
