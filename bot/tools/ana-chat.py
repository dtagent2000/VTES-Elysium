#!/usr/bin/env python3
"""tools/ana-chat.py v1.0.0 (25 Nov 2026, bot v0.6.240, the chat round: BOARD, RULINGS D-136 / D-137) -- THE CHAT ANALYSER.

Reads a tools/chat-record.js recording and says what the table SHOWED: every bubble, how long the client keeps it on screen, how
long it holds the floor (D-137: one speaker at a time; a seat's bubble waits until another seat's has left the screen, a short
phrase holds the floor 1.5 s), and which bubbles started over another seat's.

  usage (from bot/): python3 tools/ana-chat.py REC.jsonl [AFTER.jsonl] [--lines] [--gate]
    one file     the report; --lines adds every chat line (digits as N, one example each) for a ruling line by line
    two files    both reports and the before / after table of the headline numbers and of the chat lines
    --gate       exit 1 when the LAST file has a bubble that started while another seat held the floor, or a bot's
                 "(bot):" prefix, or a human's instruction tail on a bots-only table (the round's done-when)

The bubble, as the client draws it (elysium-vtes-bord.html sayBubble / sayBubbleMs / chatBubble / maybeVerdictPulse):
  chat     the text clamped at 180 characters + '...'; on screen max(3000, min(9000, 3000 + (n - 20) * 45)) ms at the
           player's multiplier 1.0 (a local setting nobody else can know); it holds the floor as long as it is on screen
  say      the quick phrase (the index into SAY, the client's own table); on screen by the same formula; holds the floor 1.5 s
  verdict  a frozen verdict LOG line ('Block: Stealth N vs Intercept M -- block fails.', 'Vote: ...') pulses 'Block fails!' in
           the quick phrases' bubble; it is counted as a short phrase
The client keeps three bubbles at once and evicts the oldest for a fourth (cut short = evicted before its time).
"""
import json, sys, re, collections

SAY = ['Hold on…', 'No block', 'Block!', 'No reaction', 'It resolves', 'Yes', 'No', 'Pass', 'Any blocks?', 'Any reaction?']
SHORT_FLOOR_MS = 1500
VERDICT_RE = [(re.compile(r'^Block: Stealth -?\d+ vs Intercept -?\d+ — block (succeeds|fails)\.$'), lambda m: 'Block ' + m.group(1) + '!'),
              (re.compile(r'^Vote: \d+ for vs \d+ against — vote (passes|fails)\.$'), lambda m: 'Vote ' + m.group(1) + '!')]
PREFIX_RE = re.compile(r'^[^:]{1,40} \(bot\): ')
# the human's instruction tails (D-137: a bot's question to a bot carries none); on a bots-only table every one is addressed to a bot
TAIL_RE = re.compile(r'say "block" or "no"|say "no reaction"|say "no"|or say Pass|say Pass|Right-click|I wait for you|\(\d+ s\)|press the Bot button|'
                     r'say "no" or "it resolves"|or play yours|tell me if your side|Tell me if your side')


def bubble_ms(text):
    n = len(text)
    return max(3000, min(9000, 3000 + max(0, n - 20) * 45))


def load(path):
    meta, rows = None, []
    with open(path, encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            r = json.loads(line)
            if r.get('t') == 'meta':
                meta = r
            else:
                rows.append(r)
    return meta or {}, rows


def bubbles(rows):
    out = []
    for r in rows:
        if r['t'] == 'chat':
            raw = r.get('text') or ''
            shown = raw if len(raw) <= 180 else raw[:180] + '…'
            d = bubble_ms(shown)
            out.append(dict(r, kind='chat', text=raw, end=r['ms'] + d, floor=r['ms'] + d))
        elif r['t'] == 'say':
            i = r.get('i', -1)
            tx = SAY[i] if isinstance(i, int) and 0 <= i < len(SAY) else '?'
            out.append(dict(r, kind='say', text=tx, end=r['ms'] + bubble_ms(tx), floor=r['ms'] + SHORT_FLOOR_MS))
        elif r['t'] == 'log':
            for rx, mk in VERDICT_RE:
                m = rx.match(r.get('text') or '')
                if m:
                    tx = mk(m)
                    out.append(dict(r, kind='verdict', text=tx, line=r.get('text'), end=r['ms'] + bubble_ms(tx), floor=r['ms'] + SHORT_FLOOR_MS))
                    break
    out.sort(key=lambda b: b['ms'])
    return out


def pattern(text):
    t = PREFIX_RE.sub('', text)
    return re.sub(r'\d+', 'N', t)


def analyse(path):
    meta, rows = load(path)
    bub = bubbles(rows)
    R = {'path': path, 'meta': meta, 'rows': len(rows), 'bubbles': bub}
    span = (rows[-1]['ms'] - rows[0]['ms']) / 60000.0 if len(rows) > 1 else 0.0
    R['span_min'] = span
    R['kinds'] = collections.Counter(b['kind'] for b in bub)
    turns = sorted({(r.get('round'), r.get('turn')) for r in rows if r.get('turn')})
    R['turns'] = len(turns)
    # time per turn: from a turn's first row to the next turn's first row
    first = {}
    for r in rows:
        k = (r.get('round'), r.get('turn'))
        if r.get('turn') and k not in first:
            first[k] = r['ms']
    starts = sorted(first.values())
    R['turn_secs'] = [(b - a) / 1000.0 for a, b in zip(starts, starts[1:])]
    over_screen, over_floor, fast, evicted = [], [], [], []
    on = []          # the client's three slots: bubbles still on screen, oldest first
    maxon = 0
    for i, b in enumerate(bub):
        on = [a for a in on if a['end'] > b['ms']]
        if len(on) >= 3:
            ev = on.pop(0)
            evicted.append((ev, b))
        on.append(b)
        vis = [a for a in bub[:i] if a['end'] > b['ms']]
        maxon = max(maxon, len(vis) + 1)
        other = [a for a in vis if a['seat'] != b['seat']]
        if other:
            over_screen.append((b, other))
        hold = [a for a in bub[:i] if a['floor'] > b['ms'] and a['seat'] != b['seat']]
        if hold:
            over_floor.append((b, hold))
        prev = bub[i - 1] if i else None
        if prev and prev['seat'] != b['seat'] and b['ms'] - prev['ms'] < SHORT_FLOOR_MS:
            fast.append((prev, b))
    R.update(over_screen=over_screen, over_floor=over_floor, fast=fast, evicted=evicted, maxon=maxon)
    chats = [b for b in bub if b['kind'] == 'chat']
    R['prefixed'] = [b for b in chats if PREFIX_RE.match(b['text'])]
    R['tails'] = [b for b in chats if TAIL_RE.search(b['text'])]
    R['chat_patterns'] = collections.Counter(pattern(b['text']) for b in chats)
    R['chat_example'] = {}
    for b in chats:
        R['chat_example'].setdefault(pattern(b['text']), b['text'])
    R['say_counts'] = collections.Counter(b['text'] for b in bub if b['kind'] == 'say')
    R['decides'] = sum(1 for r in rows if r['t'] == 'decide')   # the Reaction stopwatch rung (a countdown on every screen); recordings before chat-record's decide rows show 0
    # the silences: the longest gaps between two consecutive rows of any kind (a wait nobody can see)
    gaps = []
    for a, b in zip(rows, rows[1:]):
        gaps.append((b['ms'] - a['ms'], a, b))
    gaps.sort(key=lambda g: -g[0])
    R['gaps'] = gaps[:8]
    return R


def short(r, n=60):
    t = r.get('text') if r.get('t') != 'say' else SAY[r['i']] if 0 <= r.get('i', -1) < len(SAY) else '?'
    if t is None:
        t = r['t'] + ':' + str(r.get('kind') or r.get('mode') or '')
    return (t or '')[:n]


def report(R, lines=False):
    m = R['meta']
    o = m.get('o', {})
    print('== %s' % R['path'])
    print('bot v%s, client v%s; seed %s, %s rounds asked (%s played), pace %s ms, askSecs %s; %s%s' % (
        m.get('bot', '?'), m.get('client', '?'), o.get('seed'), o.get('rounds'), m.get('rounds', '?'), o.get('paceMs'), o.get('askSecs'),
        'finished' if m.get('finished') else 'ran its rounds', (', STUCK ' + json.dumps(m.get('stuck'))) if m.get('stuck') else ''))
    bub, k = R['bubbles'], R['kinds']
    print('rows %d over %.1f min; %d turns, %.1f s a turn (median %.1f)' % (R['rows'], R['span_min'], R['turns'],
          sum(R['turn_secs']) / max(1, len(R['turn_secs'])), sorted(R['turn_secs'])[len(R['turn_secs']) // 2] if R['turn_secs'] else 0))
    print('bubbles %d (chat %d, say %d, verdict %d): %.1f a minute' % (len(bub), k['chat'], k['say'], k['verdict'], len(bub) / max(R['span_min'], 1e-9)))
    print('  started while another seat HELD THE FLOOR (D-137): %d of %d' % (len(R['over_floor']), len(bub)))
    print('  started while another seat\'s bubble was ON SCREEN: %d of %d (%.0f%%)' % (len(R['over_screen']), len(bub), 100.0 * len(R['over_screen']) / max(1, len(bub))))
    print('  started < 1.5 s after another seat\'s bubble: %d' % len(R['fast']))
    print('  most bubbles on screen at once: %d; cut short by the client\'s three-bubble limit: %d' % (R['maxon'], len(R['evicted'])))
    print('  chat bubbles with a "<Name> (bot):" prefix: %d of %d' % (len(R['prefixed']), k['chat']))
    print('  chat bubbles with a human\'s instruction tail: %d of %d' % (len(R['tails']), k['chat']))
    print('  the Reaction stopwatch rung (decide): %d' % R['decides'])
    if R['over_floor']:
        c = collections.Counter(pattern(b['text'])[:48] for b, _ in R['over_floor'])
        print('\n  over the floor, by text (top 12):')
        for t, v in c.most_common(12):
            print('    %3d  %s' % (v, t))
        print('  the first 8:')
        for b, hold in R['over_floor'][:8]:
            h = hold[-1]
            print('    %7.1fs %-7s %-44s over %-7s %-34s (%+.0f ms into its floor)' % (b['ms'] / 1000.0, b['who'], b['text'][:44], h['who'], h['text'][:34], b['ms'] - h['ms']))
    print('\n  say phrases: ' + ', '.join('%s %d' % (t, v) for t, v in R['say_counts'].most_common()))
    print('\n  the longest silences (no message of any kind):')
    for g, a, b in R['gaps'][:6]:
        print('    %5.1f s after %7.1fs %-7s %-5s %-46s -> %-7s %s' % (g / 1000.0, a['ms'] / 1000.0, a.get('who'), a['t'], short(a, 46), b.get('who'), short(b, 40)))
    if lines:
        print('\n  chat lines (%d kinds; digits as N):' % len(R['chat_patterns']))
        for t, v in sorted(R['chat_patterns'].items(), key=lambda x: (-x[1], x[0])):
            print('    %3d  %s' % (v, R['chat_example'][t][:170]))
    print()


def compare(A, B):
    print('== before -> after')
    table = [
        ('bubbles a minute', len(A['bubbles']) / max(A['span_min'], 1e-9), len(B['bubbles']) / max(B['span_min'], 1e-9)),
        ('over the floor', len(A['over_floor']), len(B['over_floor'])),
        ('over another seat\'s bubble on screen', len(A['over_screen']), len(B['over_screen'])),
        ('cut short (three-bubble limit)', len(A['evicted']), len(B['evicted'])),
        ('most on screen at once', A['maxon'], B['maxon']),
        ('"(bot):" prefixes', len(A['prefixed']), len(B['prefixed'])),
        ('instruction tails', len(A['tails']), len(B['tails'])),
        ('Reaction stopwatch rings (decide)', A['decides'], B['decides']),
        ('seconds a turn (mean)', sum(A['turn_secs']) / max(1, len(A['turn_secs'])), sum(B['turn_secs']) / max(1, len(B['turn_secs']))),
    ]
    for name, a, b in table:
        print('  %-40s %8.1f -> %8.1f' % (name, a, b))
    print('\n  chat lines, before | after (digits as N; the prefix dropped from the key):')
    keys = sorted(set(A['chat_patterns']) | set(B['chat_patterns']), key=lambda t: (-(A['chat_patterns'][t] + B['chat_patterns'][t]), t))
    for t in keys:
        print('    %3d | %3d  %s' % (A['chat_patterns'][t], B['chat_patterns'][t], t[:150]))
    print()


def main(argv):
    files = [a for a in argv if not a.startswith('--')]
    if not files or len(files) > 2:
        print(__doc__)
        return 2
    rs = [analyse(f) for f in files]
    for r in rs:
        report(r, lines='--lines' in argv)
    if len(rs) == 2:
        compare(rs[0], rs[1])
    if '--gate' in argv:
        L = rs[-1]
        bad = len(L['over_floor']) + len(L['prefixed']) + len(L['tails'])
        print('GATE %s: %d over the floor, %d prefixed, %d tails (%s)' % ('FAIL' if bad else 'PASS', len(L['over_floor']), len(L['prefixed']), len(L['tails']), L['path']))
        return 1 if bad else 0
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
