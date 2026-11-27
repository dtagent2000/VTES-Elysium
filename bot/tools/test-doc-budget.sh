#!/bin/bash
# test-doc-budget.sh -- the destructive check of tools/doc-budget.sh (20 Oct 2026; 27 Nov 2026: the budgets' file, their rise
# against a base and the round record's check, RULINGS D-145). Each case breaks ONE thing in a fresh copy of the repo's docs + bot/
# and expects doc-budget to print its FAIL line and exit 1; the baseline copy and the allowed moves must PASS. ~1 min.
# Two cases run outside a pull request (DOC_BUDGET_ROOT_DRIFT=warn): main's newer release only warns, an impossible one still fails.
# The baseline runs in the caller's mode (CI warns outside pull requests, so main's next release cannot turn it red there).
# Run from anywhere: bash bot/tools/test-doc-budget.sh   -- exit 0 = every case red, the baseline and the allowed moves green.
set -u
MODE=${DOC_BUDGET_ROOT_DRIFT:-fail}   # the caller's mode: the baseline runs in it
unset DOC_BUDGET_ROOT_DRIFT   # the strict default (a pull request's) for every case below; the warn cases set it themselves
SRC=$(cd "$(dirname "$0")/../.." && pwd); W=$(mktemp -d "${TMPDIR:-/tmp}/dbtest-XXXX"); T="$W/repo"; bad=0
BUD="$T/bot/tools/doc-budgets.txt"
fresh(){
  rm -rf "$T"; mkdir -p "$T/client/docs"
  cp "$SRC/CLAUDE.md" "$SRC/elysium-vtes-bord.html" "$SRC/elysium-server.js" "$T/"
  cp -r "$SRC/client/docs/handoffs" "$T/client/docs/"
  (cd "$SRC" && tar --exclude='./bot/serie-*' --exclude='./bot/bench-*' -cf - ./bot) | tar -xf - -C "$T"
}
based(){   # a fresh copy as a git repository whose first commit is the base the rise check reads
  fresh; git -C "$T" init -q && git -C "$T" add -A && git -C "$T" -c user.name=t -c user.email=t@t commit -qm base
}
pad(){ python3 -c "import sys; open(sys.argv[1],'a').write('x'*int(sys.argv[2]))" "$1" "$2"; }
setbud(){ python3 - "$BUD" "$1" "$2" "${3:-}" <<'PY'   # setbud KEY BYTES [RULING]
import re, sys
p, k, n, rid = sys.argv[1:5]
t = open(p, encoding='utf8').read()
t, c = re.subn(r'(?m)^(%s)([ \t]+)[0-9]+.*$' % re.escape(k), lambda m: m.group(1) + m.group(2) + n + ('  ' + rid if rid else ''), t)
assert c == 1, (k, c)
open(p, 'w', encoding='utf8').write(t)
PY
}
bud(){ awk -v k="$1" '!/^#/ && $1 == k {print $2; exit}' "$BUD"; }
run(){   # $1 the case, $2 the text its own FAIL line carries: any FAIL is no proof, the bootstrap's few spare bytes trip first (6 Nov)
  out=$(bash "$T/bot/tools/doc-budget.sh" ${BASEARG:-} 2>&1); ec=$?
  fl=$(printf '%s\n' "$out" | grep '^FAIL' | grep -F -- "$2" | head -1)
  if [ "$ec" = 1 ] && [ -n "$fl" ]; then echo "red   $1 :: ${fl#FAIL  }"; else echo "GREEN $1 :: exit $ec, no FAIL line with '$2'  <-- the check missed it"; bad=1; fi
}
green(){   # $1 the case: an allowed move, doc-budget must pass
  out=$(bash "$T/bot/tools/doc-budget.sh" ${BASEARG:-} 2>&1); ec=$?
  if [ "$ec" = 0 ]; then echo "green $1"; else echo "RED   $1 :: $(printf '%s\n' "$out" | grep '^FAIL' | head -1)  <-- an allowed move failed"; bad=1; fi
}
fresh; if DOC_BUDGET_ROOT_DRIFT=$MODE bash "$T/bot/tools/doc-budget.sh" > /dev/null; then echo "green baseline ($MODE)"; else echo "RED baseline ($MODE) <-- fix the docs first"; bad=1; fi
fresh; n=$(wc -c < "$T/bot/docs/STATUS.md"); lim=$(bud bot/docs/STATUS.md); pad "$T/bot/docs/STATUS.md" $(( n < lim + 1 ? lim + 1 - n : 1 ))   # to 1 byte over
run "STATUS over its budget" "STATUS.md is"
fresh; printf '%s\n' 'See `docs/NOPE.md`.' >> "$T/bot/docs/BOARD.md";                    run "BOARD names a missing file" "names docs/NOPE.md"
fresh; rm "$T/bot/ana-ledger.py";                                                          run "a named tool deleted" "names ana-ledger.py"
fresh; rm "$T/bot/docs/HARNESS.md";                                                        run "a standing page deleted" "docs/HARNESS.md"
fresh; printf '%s\n' 'See `bot/docs/NOPE.md`.' >> "$T/CLAUDE.md";                         run "root CLAUDE.md names a missing bot path" "names bot/docs/NOPE.md"
fresh; sed -i.bak "s/BOT_VERSION = '\([0-9.]*\)'/BOT_VERSION = '9.9.9'/" "$T/bot/elysium-bot.js";        run "BOT_VERSION bumped, STATUS not" "Bot v9.9.9"
fresh; sed -i.bak "s/const VERSION = '\([0-9.]*\)'/const VERSION = '9.9.9'/" "$T/bot/elysium-server.js"; run "the read-only server copy refreshed, STATUS not" "srv-9.9.9"
fresh; sed -i.bak "s/const VERSION='\([0-9.]*\)'/const VERSION='9.9.9'/" "$T/elysium-vtes-bord.html";     run "the root client released, STATUS not" "client v9.9.9"
fresh; sed -i.bak "s/FXC_VERSION = '\([0-9.]*\)'/FXC_VERSION = '9.9.9'/" "$T/bot/cardfx-compile.js";      run "the compiler bumped, STATUS not" "cardfx compiler v9.9.9"
# outside a pull request (CI's DOC_BUDGET_ROOT_DRIFT=warn): main's newer release is a warning, a release the root cannot have had still fails
fresh; sed -i.bak "s/const VERSION='\([0-9.]*\)'/const VERSION='9.9.9'/" "$T/elysium-vtes-bord.html"
out=$(DOC_BUDGET_ROOT_DRIFT=warn bash "$T/bot/tools/doc-budget.sh" 2>&1); ec=$?
if [ "$ec" = 0 ] && printf '%s\n' "$out" | grep -q '^WARN.*client v9.9.9'; then echo "ok    the root client released, STATUS not, outside a pull request :: a warning, exit 0"; else echo "RED   the root client released, outside a pull request :: exit $ec, no WARN line  <-- the warn mode missed it"; bad=1; fi
fresh; sed -i.bak "s/const VERSION='\([0-9.]*\)'/const VERSION='0.0.1'/" "$T/elysium-vtes-bord.html"
out=$(DOC_BUDGET_ROOT_DRIFT=warn bash "$T/bot/tools/doc-budget.sh" 2>&1); ec=$?; fl=$(printf '%s\n' "$out" | grep '^FAIL' | grep -F 'a release the root cannot have had' | head -1)
if [ "$ec" = 1 ] && [ -n "$fl" ]; then echo "red   STATUS names a release newer than the root, outside a pull request :: ${fl#FAIL  }"; else echo "GREEN STATUS newer than the root, outside a pull request :: exit $ec  <-- the check missed it"; bad=1; fi
fresh; boot=$(cat "$T/CLAUDE.md" "$T/bot/CLAUDE.md" "$T/bot/docs/STATUS.md" "$T/bot/docs/BOARD.md" | wc -c)
pad "$T/CLAUDE.md" $(( $(bud bootstrap) + 1 - boot ));                                     run "the bootstrap over its budget" "bootstrap is"
# The total: every page inside its own budget and the bootstrap inside its own, the sum over the ceiling. The budgets come from
# tools/doc-budgets.txt. The pages outside the bootstrap are padded to 50 bytes under their own; then BOARD, STATUS and
# bot/CLAUDE.md in turn, each as far as its own budget and the bootstrap's allow. A ceiling the pages' own budgets cannot reach is a
# dead check: the case says so and fails.
fresh; python3 - "$T" <<'PY'; run "the total over its ceiling, each page within its own" "standing pages total"
import os, sys
T = sys.argv[1]; rows = [l.split() for l in open(os.path.join(T, 'bot', 'tools', 'doc-budgets.txt'), encoding='utf8') if l.strip() and not l.startswith('#')]
lim = dict((r[0], int(r[1])) for r in rows)
ceiling, bootcap = lim.pop('total'), lim.pop('bootstrap')
path = lambda f: os.path.join(T, f)
size = lambda f: os.path.getsize(path(f))
grow = lambda f, n: open(path(f), 'a').write('x' * max(0, n))
BOOT = ['bot/docs/BOARD.md', 'bot/docs/STATUS.md', 'bot/CLAUDE.md']
assert all(f in lim for f in BOOT), sorted(lim)
for f in lim:
    if f not in BOOT: grow(f, lim[f] - 50 - size(f))
for f in BOOT:
    boot = os.path.getsize(os.path.join(T, 'CLAUDE.md')) + sum(size(g) for g in BOOT)
    grow(f, min(lim[f] - 50 - size(f), bootcap - 50 - boot))
total = sum(size(f) for f in lim)
if total <= ceiling: print('      the pages can reach %d bytes inside their own budgets and the bootstrap; the ceiling of the total is %d -- a dead check, lower it' % (total, ceiling))
PY
# the round record (tools/round.py check, run by doc-budget): a generated block gone, an entry over its cap
fresh; python3 -c "
import re, sys; p = sys.argv[1]; t = open(p, encoding='utf8').read()
open(p, 'w', encoding='utf8').write(re.sub(r'<!-- /?round\.py:gates -->\n?', '', t))" "$T/bot/docs/STATUS.md"
run "STATUS without its generated gates block" "no generated gates block"
fresh; printf '\n- **Too long (1 Jan 2026; PR #0)** — %s\n  *Gates:* g\n  *Egress:* e\n  *Report:* `reports/REPORT-c1-2026-11-27.md`.\n' "$(printf 'x%.0s' $(seq 1 1600))" >> "$T/bot/docs/elysium-bot-CHANGELOG.md"
run "a CHANGELOG entry over its cap" "the cap"
# the budgets' rise against a base (one in, one out, D-145): the total or the bootstrap only with a D-line the base lacks
BASEARG="--base HEAD~1"
commit(){ git -C "$T" -c user.name=t -c user.email=t@t commit -qam "$1"; }
based; setbud total $(( $(bud total) + 1000 )); commit raise;                              run "the total rises with no ruling named" "without a new ruling"
based; setbud total $(( $(bud total) + 1000 )) D-1; commit raise;                         run "the total rises naming a ruling the base has" "without a new ruling"
based; setbud bootstrap $(( $(bud bootstrap) + 1000 )); commit raise;                      run "the bootstrap rises with no ruling named" "without a new ruling"
based; setbud bot/docs/HOWTO.md $(( $(bud bot/docs/HOWTO.md) + 500 )); commit raise;       run "a page's budget rises, none falls" "together rise"
based; donor=$(for f in $(awk '!/^#/ && NF >= 2 && $1 != "total" && $1 != "bootstrap" && $1 != "bot/docs/HOWTO.md" {print $1}' "$BUD"); do
  echo "$(( $(bud "$f") - $(wc -c < "$T/$f") )) $f"; done | sort -n | tail -1 | cut -d' ' -f2)   # the page with the most room lends 100 bytes
setbud bot/docs/HOWTO.md $(( $(bud bot/docs/HOWTO.md) + 100 )); setbud "$donor" $(( $(bud "$donor") - 100 )); commit borrow
green "a page borrows from another (HOWTO from $donor, one down, one up)"
based; printf '%s\n' '- **D-999** (2026-12-31, the owner) — a test ruling.' >> "$T/bot/docs/RULINGS.md"
setbud total $(( $(bud total) + 1000 )) D-999; setbud bot/docs/RULINGS.md $(( $(bud bot/docs/RULINGS.md) + 1000 )); commit raise
green "the total rises with a new D-line, and a page with it"
BASEARG=""
rm -rf "$W"
[ "$bad" = 0 ] && echo "test-doc-budget: every case red, the baseline and the allowed moves green" || echo "test-doc-budget: FAIL"
exit $bad
