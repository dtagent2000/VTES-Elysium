#!/bin/bash
# run-section.sh <bot.js> <section.js> [cardfx.json] -- run ONE self-contained section of test-bot-logic.js against ANY bot file, with
# the suite's own preamble (ok, sleep, SI, mkClient, connectWithRetry -- cut from test-bot-logic.js at run time) and a fresh server on a
# random port, in a temp dir with that bot, the cardfx, the twd files, the decks and the read-only server beside it. (16 Oct 2026, v0.6.203)
#
# The destructive check of a new section, sub-minute instead of the ~300 s suite:
#   python3 -c "s=open('test-bot-logic.js').read(); i=s.index('    /* 142)'); j=s.index('\n    }\n', s.index('LAST LINE OF 142', i))+7; open('/tmp/s142.js','w').write(s[i:j])"
#   bash tools/run-section.sh elysium-bot.js /tmp/s142.js                                   # the new bytes: green
#   git show origin/main:bot/elysium-bot.js > /tmp/old.js && bash tools/run-section.sh /tmp/old.js /tmp/s142.js   # red?
# Cut a section from its "/* NNN)" line to its OWN closing brace -- not to the next console.log, which lands past an outer block.
# A section that uses a helper defined in another section (mkP, duel141 ...) needs that helper in the file too.
# A pre-change bot may lack a method the section calls: guard the call (typeof) so the old bytes fail clean instead of aborting.
set -u
B=$(cd "$(dirname "$0")/.." && pwd)
BOT=$(readlink -f "$1"); SEC=$(readlink -f "$2"); FX=$(readlink -f "${3:-$B/elysium-cardfx.json}")
D=$(mktemp -d "${TMPDIR:-/tmp}/elsec-XXXX")
cp "$BOT" "$D/elysium-bot.js"; cp "$FX" "$D/elysium-cardfx.json"
cp "$B/elysium-twd-profile.json" "$B/elysium-twd-archetypes.json" "$B/elysium-server.js" "$D/"
cp "$B"/deck-*.json "$D/" 2>/dev/null
{
cat <<'H'
'use strict';
const { spawn } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { Bot, wsConnect, SAY } = require('./elysium-bot.js');
const SI = ph => SAY.indexOf(ph);
const PORT = 8600 + Math.floor(Math.random() * 300); const URL = 'ws://127.0.0.1:' + PORT;
let passN = 0, failN = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); cond ? passN++ : failN++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
H
awk '/^function mkClient\(/{on=1} on{print} on && /^async function connectWithRetry/{cw=1} cw && /^}/{exit}' "$B/test-bot-logic.js"
cat <<'H'
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'elsec-srv-'));
  const srvCopy = path.join(tmp, 'elysium-server.js'); fs.copyFileSync(path.join(__dirname, 'elysium-server.js'), srvCopy);
  const srv = spawn(process.execPath, [srvCopy, String(PORT)], { cwd: tmp, stdio: ['ignore', 'pipe', 'pipe'] });
  const shutdown = code => { try{ srv.kill('SIGTERM'); }catch(e){} setTimeout(() => process.exit(code), 300); };
  try {
H
cat "$SEC"
cat <<'H'
    console.log('\n' + passN + '/' + failN);
    shutdown(failN ? 1 : 0);
  } catch(err){ console.error('ABORT: ' + err.message + '\n' + err.stack); console.log('\n' + passN + '/' + (failN + 1)); shutdown(1); }
})();
H
} > "$D/tsec.js"
cd "$D" && timeout "${SEC_TIMEOUT:-300}" node tsec.js
