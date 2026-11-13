#!/bin/bash
# tools/tokens-in-browser.sh v1.0.0 (13 Nov 2026, bot v0.6.222) -- the bot's own tokens and a Smiling Jack's counters as a HUMAN sees
# them: the real client in headless Chromium on the real server (main's play-test rig, client/playtest/, run as it is -- read, never
# edited), one in-page bot whose board is given a Toreador Grand Ball pair and a Jack; the human visits the bot's seat and the script
# reads each card's chip and its hover text, then screenshots the seat. A diagnostic, not a gate (Playwright and the card data).
#   usage (from the repository root): bash bot/tools/tokens-in-browser.sh <vtes.json> <expansions.json> [out dir] [repo dir]
#   the card data stay OUTSIDE the repository (root CLAUDE.md, "Data that is not in git"); exit 0 = every chip as expected
set -u
VTES=${1:?vtes.json}; EXP=${2:?expansions.json}; OUT=${3:-/tmp/tokens-in-browser}; REPO=${4:-$(pwd)}
CP=${CPORT:-8792}; SP=${SPORT:-8791}
rm -rf "$OUT"; mkdir -p "$OUT"
cat > "$OUT/scenario.json" <<'EOF'
{ "about": "tools/tokens-in-browser.sh: a human and one bot; the bot's board then gets a Grand Ball pair and a Smiling Jack in the page",
  "room": "tokens", "board": "structured",
  "human": { "name": "Johan", "deck": "bot:malkavian", "seat": 1 },
  "bots": [ { "name": "Viktor", "deck": "ventrue", "persona": "expert" } ] }
EOF
cd "$REPO" || exit 2
node client/playtest/playtest-rig.js --out "$OUT/run" --vtes "$VTES" --exp "$EXP" --offline --port "$SP" --control "$CP" > "$OUT/rig.log" 2>&1 &
RIG=$!
for i in $(seq 1 90); do grep -q "RIG READY" "$OUT/rig.log" && break; sleep 1; done
grep -q "RIG READY" "$OUT/rig.log" || { echo "the rig did not start (see $OUT/rig.log)"; kill $RIG 2>/dev/null; exit 2; }
CPORT=$CP timeout 180 node client/playtest/playtest.js setup "$OUT/scenario.json" > "$OUT/setup.txt" 2>&1 || { echo "setup failed (see $OUT/setup.txt)"; kill $RIG 2>/dev/null; exit 2; }
CPORT=$CP timeout 60 node client/playtest/playtest.js js "
const b = netBots['Viktor'] && netBots['Viktor'].bot; if(!b) return { err: 'no in-page bot Viktor' };
const V = (id, name, x, o) => Object.assign({ id, name, kind: 'crypt', zone: 'ready', locked: false, faceDown: false, blood: 3, cap: 6, attached: [], x, y: 260 }, o || {});
b.board.push(V('tkv1', 'Catalina Vega (G6)', 420), V('tkv2', 'Min-seo (G6)', 560, { locked: true }));
b.board.push({ id: 'tkg1', name: 'Toreador Grand Ball', kind: 'lib', zone: 'ready', faceDown: false, locked: false, blood: 0, x: 700, y: 120, gbFree: 'tkv1', gbLock: 'tkv2' });
b.board.push({ id: 'tkj1', name: 'Smiling Jack, The Anarch', kind: 'lib', zone: 'ready', faceDown: false, locked: false, x: 840, y: 120, counters: ['pool', 'pool', 'pool'] });
b.push(); await new Promise(r => setTimeout(r, 2500));
switchView(2, true); await new Promise(r => setTimeout(r, 2000));
const out = {};
for(const e of Array.from(document.querySelectorAll('.card.rc')).filter(x => /^tk/.test(x.dataset.cid || ''))){
  const ch = e.querySelector('.cchips .cchip'), tip = ch && ch.querySelector('.ctip');
  out[e.dataset.cid] = { chip: ch ? (ch.childNodes[0] && ch.childNodes[0].textContent) : null, tip: tip ? tip.textContent : null };
  if(tip && (e.dataset.cid === 'tkg1' || e.dataset.cid === 'tkv1')){ tip.style.opacity = '1'; tip.style.transform = 'scale(1)'; }   // two tooltips open for the screenshot
}
return { client: VERSION, chips: out };" > "$OUT/chips.json" 2>&1
curl -s -m 20 -X POST "http://127.0.0.1:$CP/shot?name=tokens-seat2" -d '{}' > "$OUT/shot.json"
curl -s -m 5 -X POST "http://127.0.0.1:$CP/quit" -d '{}' > /dev/null; wait $RIG 2>/dev/null
python3 - "$OUT/chips.json" <<'EOF'
import json, sys
j = json.load(open(sys.argv[1])); v = (j.get('v') or {}); c = v.get('chips') or {}
want = {'tkv1': ('GBN', 'Grand Ball: non-bleed actions unblockable'), 'tkv2': ('GBD', 'Grand Ball: does not unlock'),
        'tkg1': ('2', '• Unblockable: Catalina Vega (G6)• Locked: Min-seo (G6)'), 'tkj1': ('3', '• pool• pool• pool')}
bad = [k for k, (chip, tip) in want.items() if (c.get(k) or {}).get('chip') != chip or (c.get(k) or {}).get('tip') != tip]
print('client v%s: %s' % (v.get('client'), 'every chip and hover text as the bot sent them' if not bad else 'WRONG ' + json.dumps({k: c.get(k) for k in bad})))
sys.exit(1 if bad else 0)
EOF
