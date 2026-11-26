#!/bin/bash
# release.sh -- the release ritual's mechanics (HARNESS "The release ritual"; RULINGS D-139, 26 Nov 2026). From anywhere:
#   1. BOT_VERSION in bot/elysium-bot.js (the line carries the version only; the note is the CHANGELOG's, by hand);
#   2. START-HERE-BOTS.html: the version chip, the footer's version and its date (the footer's counts stay the round's to check);
#   3. the bundle copied from bot/ to the repository root (deploy = copy, never an edit at the root), each copy compared;
#   4. main's check-versions.js run in client/ (a read-only use of main's gate: the root equals the two halves);
#   5. the release bytes' sha256 for the PR.
# It refuses on main and a version that is not above BOT_VERSION. STATUS, the CHANGELOG entry and a handoff to main (when main
# must act) stay the round's.
# Usage: bash bot/tools/release.sh X.Y.Z
set -u
B=$(cd "$(dirname "$0")/.." && pwd -P); R=$(cd "$B/.." && pwd -P)
new="${1:-}"
case "$new" in [0-9]*.[0-9]*.[0-9]*) ;; *) echo "usage: release.sh X.Y.Z" >&2; exit 2 ;; esac
[ "$(git -C "$R" rev-parse --abbrev-ref HEAD)" = main ] && { echo "release.sh: on main -- branch first (bot/CLAUDE.md)" >&2; exit 2; }
old=$(grep -oE "BOT_VERSION = '[0-9]+\.[0-9]+\.[0-9]+'" "$B/elysium-bot.js" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
[ -n "$old" ] || { echo "release.sh: no BOT_VERSION line in bot/elysium-bot.js" >&2; exit 2; }
above=$(printf '%s\n%s\n' "$old" "$new" | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)
{ [ "$above" = "$new" ] && [ "$new" != "$old" ]; } || { echo "release.sh: $new is not above BOT_VERSION $old" >&2; exit 2; }
BUNDLE="elysium-bot.js elysium-cardfx.json elysium-cardfx.js elysium-twd-profile.json elysium-twd-profile.js elysium-twd-archetypes.json elysium-twd-archetypes.js START-HERE-BOTS.html"
fail=0
# 1-2. the version strings (a plain substitution of the one line each; anything else stays as it is)
sed -i "s/^const BOT_VERSION = '$old';/const BOT_VERSION = '$new';/" "$B/elysium-bot.js"
grep -q "^const BOT_VERSION = '$new';" "$B/elysium-bot.js" || { echo "FAIL  BOT_VERSION not set"; fail=1; }
today=$(LC_ALL=C date +'%-d %B %Y')
sed -i -E "s/bot v$old · client/bot v$new · client/; s#bot <b>v$old</b>#bot <b>v$new</b>#; s/ · [0-9]{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{4}\. Bots are/ · $today. Bots are/" "$B/START-HERE-BOTS.html"
n=$(grep -c "v$new" "$B/START-HERE-BOTS.html"); [ "$n" -ge 2 ] && echo "ok    START-HERE-BOTS.html: chip and footer v$new, $today" || { echo "FAIL  START-HERE-BOTS.html: $n of 2 version strings set"; fail=1; }
echo "ok    BOT_VERSION $old -> $new"
# 3. deploy = copy
for f in $BUNDLE; do
  cp "$B/$f" "$R/$f" && cmp -s "$B/$f" "$R/$f" || { echo "FAIL  root $f"; fail=1; }
done
[ "$fail" = 0 ] && echo "ok    the bundle copied to the root (8 files, byte copies)"
# 4. main's gate, read-only
if [ -f "$R/client/check-versions.js" ]; then
  cv=$(cd "$R/client" && node check-versions.js 2>&1); rc=$?
  [ "$rc" = 0 ] && echo "ok    client/check-versions.js: $(printf '%s' "$cv" | tail -1)" || { echo "FAIL  client/check-versions.js:"; printf '%s\n' "$cv" | grep -E '!|drift' | head -12; fail=1; }
fi
# 5. the PR's bytes
echo "Release bytes (sha256 prefixes): $(cd "$B" && for f in elysium-bot.js test-bot-logic.js elysium-cardfx.json; do printf '`bot/%s` `%s` · ' "$f" "$(sha256sum "$f" | cut -c1-8)"; done | sed 's/ · $//')."
echo "Still the round's: STATUS (the version line), the CHANGELOG entry, the footer's counts in START-HERE-BOTS.html, a handoff to main"
echo "when main must act, the gates on these bytes (CI's suite x3: bash bot/tools/ci-status.sh)."
exit $fail
