#!/bin/bash
# test-doc-budget.sh -- the destructive check of tools/doc-budget.sh (20 Oct 2026). Each case breaks ONE thing in a fresh copy of
# the repo's docs + bot/ and expects doc-budget to print FAIL and exit 1; the baseline copy must PASS. ~1 min (11 copies of bot/).
# Run from anywhere: bash bot/tools/test-doc-budget.sh   -- exit 0 = every case red and the baseline green.
set -u
SRC=$(cd "$(dirname "$0")/../.." && pwd); W=$(mktemp -d "${TMPDIR:-/tmp}/dbtest-XXXX"); T="$W/repo"; bad=0
fresh(){
  rm -rf "$T"; mkdir -p "$T/client/docs"
  cp "$SRC/CLAUDE.md" "$SRC/elysium-vtes-bord.html" "$SRC/elysium-server.js" "$T/"
  cp -r "$SRC/client/docs/handoffs" "$T/client/docs/"
  (cd "$SRC" && tar --exclude='./bot/serie-*' --exclude='./bot/bench-*' -cf - ./bot) | tar -xf - -C "$T"
}
pad(){ python3 -c "import sys; open(sys.argv[1],'a').write('x'*int(sys.argv[2]))" "$1" "$2"; }
run(){
  out=$(bash "$T/bot/tools/doc-budget.sh" 2>&1); ec=$?
  fl=$(printf '%s\n' "$out" | grep '^FAIL' | head -1)
  if [ "$ec" = 1 ] && [ -n "$fl" ]; then echo "red   $1 :: ${fl#FAIL  }"; else echo "GREEN $1 :: exit $ec  <-- the check missed it"; bad=1; fi
}
fresh; if bash "$T/bot/tools/doc-budget.sh" > /dev/null; then echo "green baseline"; else echo "RED baseline <-- fix the docs first"; bad=1; fi
fresh; pad "$T/bot/docs/STATUS.md" 2000;                                                  run "STATUS over its budget"
fresh; printf '%s\n' 'See `docs/NOPE.md`.' >> "$T/bot/docs/BOARD.md";                    run "BOARD names a missing file"
fresh; rm "$T/bot/ana-ledger.py";                                                          run "a named tool deleted"
fresh; rm "$T/bot/docs/HARNESS.md";                                                        run "a standing page deleted"
fresh; printf '%s\n' 'See `bot/docs/NOPE.md`.' >> "$T/CLAUDE.md";                         run "root CLAUDE.md names a missing bot path"
fresh; sed -i.bak "s/BOT_VERSION = '\([0-9.]*\)'/BOT_VERSION = '9.9.9'/" "$T/bot/elysium-bot.js";        run "BOT_VERSION bumped, STATUS not"
fresh; sed -i.bak "s/const VERSION = '\([0-9.]*\)'/const VERSION = '9.9.9'/" "$T/bot/elysium-server.js"; run "the read-only server copy refreshed, STATUS not"
fresh; sed -i.bak "s/const VERSION='\([0-9.]*\)'/const VERSION='9.9.9'/" "$T/elysium-vtes-bord.html";     run "the root client released, STATUS not"
fresh; sed -i.bak "s/FXC_VERSION = '\([0-9.]*\)'/FXC_VERSION = '9.9.9'/" "$T/bot/cardfx-compile.js";      run "the compiler bumped, STATUS not"
fresh; pad "$T/CLAUDE.md" 12000;                                                           run "the bootstrap over 50 KB"
fresh; python3 -c "
import os, sys
T = sys.argv[1]
for f, lim in [('CLAUDE.md', 25000), ('docs/STATUS.md', 5000), ('docs/BOARD.md', 15000), ('docs/RULINGS.md', 42000),
               ('docs/LESSONS.md', 20000), ('docs/ARCHITECTURE.md', 15000), ('docs/HARNESS.md', 8000), ('docs/HOWTO.md', 20000)]:
    p = os.path.join(T, 'bot', f); n = os.path.getsize(p); open(p, 'a').write('x' * max(0, lim - 50 - n))
" "$T";                                                                                     run "the total over 140 KB, each page within its own"
rm -rf "$W"
[ "$bad" = 0 ] && echo "test-doc-budget: every case red, baseline green" || echo "test-doc-budget: FAIL"
exit $bad
