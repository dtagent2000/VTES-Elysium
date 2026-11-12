#!/bin/bash
# test-doc-budget.sh -- the destructive check of tools/doc-budget.sh (20 Oct 2026). Each case breaks ONE thing in a fresh copy of
# the repo's docs + bot/ and expects doc-budget to print FAIL and exit 1; the baseline copy must PASS. ~1 min (13 copies of bot/).
# Two cases run outside a pull request (DOC_BUDGET_ROOT_DRIFT=warn): main's newer release only warns, an impossible one still fails.
# Run from anywhere: bash bot/tools/test-doc-budget.sh   -- exit 0 = every case red and the baseline green.
set -u
unset DOC_BUDGET_ROOT_DRIFT   # the strict default (a pull request's) for every case below; the warn cases set it themselves (12 Nov 2026)
SRC=$(cd "$(dirname "$0")/../.." && pwd); W=$(mktemp -d "${TMPDIR:-/tmp}/dbtest-XXXX"); T="$W/repo"; bad=0
fresh(){
  rm -rf "$T"; mkdir -p "$T/client/docs"
  cp "$SRC/CLAUDE.md" "$SRC/elysium-vtes-bord.html" "$SRC/elysium-server.js" "$T/"
  cp -r "$SRC/client/docs/handoffs" "$T/client/docs/"
  (cd "$SRC" && tar --exclude='./bot/serie-*' --exclude='./bot/bench-*' -cf - ./bot) | tar -xf - -C "$T"
}
pad(){ python3 -c "import sys; open(sys.argv[1],'a').write('x'*int(sys.argv[2]))" "$1" "$2"; }
run(){   # $1 the case, $2 the text its own FAIL line carries: any FAIL is no proof, the bootstrap's few spare bytes trip first (6 Nov)
  out=$(bash "$T/bot/tools/doc-budget.sh" 2>&1); ec=$?
  fl=$(printf '%s\n' "$out" | grep '^FAIL' | grep -F -- "$2" | head -1)
  if [ "$ec" = 1 ] && [ -n "$fl" ]; then echo "red   $1 :: ${fl#FAIL  }"; else echo "GREEN $1 :: exit $ec, no FAIL line with '$2'  <-- the check missed it"; bad=1; fi
}
fresh; if bash "$T/bot/tools/doc-budget.sh" > /dev/null; then echo "green baseline"; else echo "RED baseline <-- fix the docs first"; bad=1; fi
fresh; pad "$T/bot/docs/STATUS.md" 2000;                                                  run "STATUS over its budget" "STATUS.md is"
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
fresh; pad "$T/CLAUDE.md" 12000;                                                           run "the bootstrap over 50 KB" "bootstrap is"
fresh; python3 -c "
import os, sys
T = sys.argv[1]
for f, lim in [('docs/RULINGS.md', 60000), ('docs/LESSONS.md', 20000), ('docs/ARCHITECTURE.md', 15000), ('docs/HARNESS.md', 8000),
               ('docs/HOWTO.md', 20000)]:   # the pages outside the bootstrap: padding the bootstrap's own would trip its 50 KB first (29 Oct)
    p = os.path.join(T, 'bot', f); n = os.path.getsize(p); open(p, 'a').write('x' * max(0, lim - 50 - n))
" "$T";                                                                                     run "the total over 160 KB, each page within its own" "standing pages total"
rm -rf "$W"
[ "$bad" = 0 ] && echo "test-doc-budget: every case red, baseline green" || echo "test-doc-budget: FAIL"
exit $bad
