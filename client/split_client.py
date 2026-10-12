#!/usr/bin/env python3
# B1 / Phase 2 - split the single-file client into a shell + ordered JS fragments.
# Leaf modules (Phase 2 step 8: sfx, fx, tokens, decklab; plus Phase 1's esc-crypto).
# Phase 2 step 10 (core seams), extracted byte-identically: net.js and hotseat.js.
# state/render/input remain interleaved (usage-order) and are deferred to the relocation pass.
#
# RE-ANCHORED (2.4.3 cleanup): an earlier refactor moved buildPub() out of the
# networking layer and down into the post-hotseat render/serialization area, so the
# old "net ends at buildPub" cut no longer held (buildPub now sits AFTER the hotseat
# block, which broke the source-order assert). The fix:
#   - net.js now ends at the hotseat block start (HS_START) instead of at buildPub.
#   - the redundant app slice that used to sit between net and hotseat is gone (net
#     flows straight into hotseat now).
#   - the whole post-hotseat chunk (Reaction window + buildPub + render glue) is one
#     app fragment again.
# The buildPub anchor is therefore no longer needed as a cut point.
#
# In source order:
#   decklab-editor -> tokens-engine -> esc-crypto -> net -> hotseat -> sfx-audio -> fx-anim
# Glue between named fragments is numbered app-1..app-N. Pure text op: fragments reassemble byte-for-byte.
import io, os, glob

SRC = '/tmp/original.html'
OUTDIR = '/home/claude/elysium-src'
os.makedirs(OUTDIR, exist_ok=True)
for f in glob.glob(os.path.join(OUTDIR, '*')):   # clear stale fragments so a renumbered manifest leaves no orphans
    os.remove(f)

full = io.open(SRC, encoding='utf-8').read()

SCRIPT_OPEN, SCRIPT_CLOSE = "<script>\n", "\n</script>"
assert full.count(SCRIPT_OPEN) == 1, "expected exactly one '<script>\\n'"
i = full.index(SCRIPT_OPEN) + len(SCRIPT_OPEN)
j = full.rindex(SCRIPT_CLOSE)
head, js, tail = full[:i], full[i:j], full[j:]
assert head + js + tail == full

# ---- anchors, in source order. Each fragment is cut [start : end). Plain-ASCII find-strings. ----
DL_START  = "/* ---------- Deck lab: preconstructed starters + editor ---------- */"
DL_END    = "function resetForDeal(){"                                         # first non-lab fn (dealing) after the editor
TOK_START = "/* ---------- Tokens: a small family of draggable felt tokens."   # section comment (ASCII prefix)
TOK_END   = "function edgeHandoffHotseat(toSeat, dropPos){"                    # first non-engine fn after removeEdgeToken
ESC_START = "const ESC = (function(){"
ESC_END   = "})();\nfunction inRoom(){"                                        # ESC's closer is followed by inRoom()
HS_START  = "/* ---------- Placeholder opponent names for the offline (hotseat) setup window ---------- */"
HS_END    = "/* ---------- Reaction window (Alt-view): a focused combat/reaction spotlight mirrored across boards ---------- */"
SFX_START = "// -- Quick React: action sounds (subtle, with a little weight & dimension) --"
FX_START  = "// -- Quick React: action FX -- an enlarged clone of the card, centre-screen --"
SETLOCKED = "function setLocked(c, val, verb){"                                # first non-FX fn after cardFx

for nm, a in [("DL_START",DL_START),("DL_END",DL_END),("TOK_START",TOK_START),("TOK_END",TOK_END),
              ("ESC_START",ESC_START),("HS_START",HS_START),("HS_END",HS_END),
              ("SFX_START",SFX_START),("FX_START",FX_START),("SETLOCKED",SETLOCKED)]:
    assert js.count(a) == 1, nm + " anchor not unique"
assert js.count(ESC_END) == 1, "ESC_END not unique"

p_dl0  = js.index(DL_START)
p_dl1  = js.index(DL_END)
p_tok0 = js.index(TOK_START)
p_tok1 = js.index(TOK_END)
p_esc0 = js.index(ESC_START)
p_esc1 = js.index(ESC_END) + len("})();\n")    # keep the closing })();\n inside ESC; net starts at inRoom()
p_hs0  = js.index(HS_START)                    # hotseat block start (offline core + setup window)
p_hs1  = js.index(HS_END)                      # hotseat block end (Quick React reaction window begins)
p_sfx0 = js.index(SFX_START)
p_fx0  = js.index(FX_START)
p_fx1  = js.index(SETLOCKED)
assert p_dl0 < p_dl1 <= p_tok0 < p_tok1 <= p_esc0 < p_esc1 <= p_hs0 <= p_hs1 <= p_sfx0 < p_fx0 < p_fx1, "anchors out of source order"

app1    = js[:p_dl0]            # start    -> deck lab
decklab = js[p_dl0:p_dl1]      # LEAF: deck lab (preconstructed starters + editor)
app2    = js[p_dl1:p_tok0]     # deck lab -> tokens
tokens  = js[p_tok0:p_tok1]    # LEAF: felt-token engine
app3    = js[p_tok1:p_esc0]    # tokens   -> ESC
esc     = js[p_esc0:p_esc1]    # LEAF: hand-escrow crypto
net     = js[p_esc1:p_hs0]     # CORE SEAM: net layer + hand-escrow + view-switching glue, up to hotseat
hotseat = js[p_hs0:p_hs1]      # FEATURE: offline pass-and-play core + setup window (giveHot stays in app glue)
app4    = js[p_hs1:p_sfx0]     # Reaction window + buildPub (public serialization) + render glue -> SFX
sfx     = js[p_sfx0:p_fx0]     # LEAF: procedural action audio
fx      = js[p_fx0:p_fx1]      # LEAF: action/card animation FX
app5    = js[p_fx1:]           # setLocked -> end

assert app1+decklab+app2+tokens+app3+esc+net+hotseat+app4+sfx+fx+app5 == js, "fragments do not reassemble to the original JS"
assert decklab.startswith("/* ---------- Deck lab:") and decklab.rstrip().endswith("});")
assert tokens.startswith("/* ---------- Tokens:")    and tokens.rstrip().endswith("}")
assert esc.startswith("const ESC = (function(){")    and esc.endswith("})();\n")
assert net.startswith("function inRoom(){")          and net.rstrip().endswith("}")
assert hotseat.startswith("/* ---------- Placeholder opponent names") and hotseat.rstrip().endswith(");")
assert app4.startswith("/* ---------- Reaction window")               and app4.rstrip().endswith("}")
assert sfx.startswith("// -- Quick React: action sounds") and sfx.rstrip().endswith("}")
assert fx.startswith("// -- Quick React: action FX")     and fx.rstrip().endswith("}")

PH = "/*@@ELYSIUM_APP_JS@@*/"
assert PH not in full
shell = head + PH + tail

def w(name, text):
    io.open(os.path.join(OUTDIR, name), 'w', encoding='utf-8').write(text)
    return len(text)

w('shell.html', shell)
order = [('app-1.js', app1), ('decklab-editor.js', decklab), ('app-2.js', app2),
         ('tokens-engine.js', tokens), ('app-3.js', app3), ('esc-crypto.js', esc),
         ('net.js', net), ('hotseat.js', hotseat), ('app-4.js', app4),
         ('sfx-audio.js', sfx), ('fx-anim.js', fx), ('app-5.js', app5)]
for name, text in order:
    w(name, text)
w('manifest.txt', "\n".join(n for n, _ in order) + "\n")

leaves = {'decklab-editor.js', 'tokens-engine.js', 'esc-crypto.js', 'sfx-audio.js', 'fx-anim.js'}
cores  = {'net.js'}
feats  = {'hotseat.js'}
print("split OK (%d fragments)" % len(order))
for name, text in order:
    tag = "  <- leaf" if name in leaves else ("  <- core seam" if name in cores else ("  <- feature" if name in feats else ""))
    print("  %-18s %7d chars%s" % (name, len(text), tag))
print("  reassembly asserted byte-for-byte")
