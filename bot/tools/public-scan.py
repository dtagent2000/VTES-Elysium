#!/usr/bin/env python3
"""public-scan.py -- the public repository's name and quote scan (RULINGS D-141, D-142; HARNESS "Review until clean"). v1.0.0

The repository is public: it carries no chat quotes and no names of private persons. This scan finds both without naming anyone
itself: a name is kept as the sha256 of the lower-case word (a card name that shares the word is allowed by the sha256 of the
pair), and a chat quote is a span of two or more words in double or curly quotes that reads as Swedish, the chat's language: two of
its common words, or one and a Swedish letter (the docs are English; a one-word term such as the go-ahead word is not a quote). A hit prints its place and its kind only, never the
words, so the scan's output can go into a PR body.

Scanned: the files the bot owns -- bot/ (but the read-only copies of main's release and the third-party data), .claude/ and the
bot's workflow. Not scanned: main's files (client/, the root's client, server and guides, the root CLAUDE.md and README).
Usage: python3 bot/tools/public-scan.py [--diff REF | --diff A..B | --tree] [--self-test]
  --diff REF   the lines the working tree adds against REF (staged, unstaged and untracked files too); the default is origin/main
  --diff A..B  the lines the commits A..B add (a reviewer's range; CI's HEAD^1..HEAD on a pull request's merge commit)
  --tree       every tracked file the scan reads, a count per file; the files WAITING lists (the bundle's cleanup release) are
               reported apart and do not fail the scan
Exit 1 on a hit (in --tree, a hit outside WAITING), 2 on a usage error.
"""
import hashlib, os, re, subprocess, sys

NAMES = {   # sha256 of the lower-case word: the owner's first name and its Swedish genitive, and the two other names of the owner's
           # that the repository held before the cleanup round (D-142)
    'd9a31550033ee07d6e14302eea8202c07c266b633154513d817ca8bb91de40d1',
    '3470c3badec253e68895721ee5d190f6d964377856485449e0a3d6bd3b00db82',
    '79bbe3aaee3096d9024c1cdd53c6d6cb155d7e72cc4d67f3ab9eab573c899fd3',
    '74028dcdd9ec8860dfe06ec08196a92203f79779284f59a057041f8dc2951dff',
}
ALLOWED_PAIRS = {   # sha256 of 'word next' in lower case: a crypt card whose name begins with the word
    '41700266f4dc1aa924e99f260b8995d72b680ca7029bfe140da2a2e5e831a407',
}
SWEDISH = set('''och att jag inte det är på för med ska kan du eller nog också gärna tycker tänker låter kör bra ju då hur vad
när någon några alla ingen inget inga sedan sen eftersom alltså bara mycket lite här där igen detta dessa som från vill vara blir
finns gör går ser tror kanske tack hej japp nej absolut superbra jättebra kul vi ett mot över efter innan utan hela helt redan
fortfarande varje mer flera många har hade blev kommer skulle kunna måste behöver verkar känns vet kolla testa spela köra lägga göra
säga ditt din dina mitt min mina vårt vår våra sitt sin hans hennes deras oss dig mig sig spelet kortet korten leken botten
människorna slutar börja först sist tyst rätt fel klart'''.split())
SV_LETTER = re.compile(r'[åäöÅÄÖ]')
QUOTE = re.compile(r'"([^"\n]{3,400})"|“([^”\n]{3,400})”|‘([^’\n]{3,400})’|«([^»\n]{3,400})»')
WORD = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+")
READ_ONLY = {'bot/elysium-server.js', 'bot/ELYSIUM-PROTOCOL.md', 'bot/elysium-vtes-bord.html', 'bot/elysium-hotseat-bots-plan.md',
             'bot/test-bot-canary.js'}   # main's release copies (ARCHITECTURE "Shared with main")
THIRD_PARTY = re.compile(r'^bot/(vtes|vtes-v5|expansions|twda|twda-vdb)\.json$')
WAITING = {   # the bundle and the sources it is compiled from: their comments and notes are the bundle's cleanup release (BOARD)
    'bot/elysium-bot.js', 'bot/elysium-cardfx.json', 'bot/elysium-cardfx.js', 'bot/START-HERE-BOTS.html', 'bot/cardfx-curated.json',
    'bot/deck-sewer.json',
}


def owned(path):
    if path in READ_ONLY or THIRD_PARTY.match(path):
        return False
    return path.startswith('bot/') or path.startswith('.claude/') or path == '.github/workflows/bot-gates.yml'


def sha(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def scan_line(line):
    """The kinds of hit on one line: a list of 'name' and 'quote (N words)'."""
    hits = []
    words = WORD.findall(line)
    for i, w in enumerate(words):
        if sha(w.lower()) in NAMES:
            if i + 1 < len(words) and sha((w + ' ' + words[i + 1]).lower()) in ALLOWED_PAIRS:
                continue
            hits.append('name')
    for m in QUOTE.finditer(line):
        span = next(g for g in m.groups() if g is not None)
        ws = [w.lower() for w in WORD.findall(span)]
        if len(ws) < 2:
            continue
        sv = len(set(ws) & SWEDISH)
        if sv >= 2 or (sv >= 1 and SV_LETTER.search(span)):   # a name with an umlaut (Frau Schädel) is not Swedish
            hits.append('quote (%d words)' % len(ws))
    return hits


def git(*args):
    return subprocess.run(['git'] + list(args), capture_output=True, text=True, check=True).stdout


def added_lines(spec):
    """(path, line number, text) for every line the diff adds; untracked files in full when spec is a single ref."""
    out = []
    cmd = ['-c', 'core.quotePath=false', 'diff', '--unified=0', '--no-color', '--no-renames', spec] if '..' in spec else \
          ['-c', 'core.quotePath=false', 'diff', '--unified=0', '--no-color', '--no-renames', spec, '--']
    path = None; n = 0
    for raw in git(*cmd).split('\n'):
        if raw.startswith('+++ '):
            path = raw[6:] if raw.startswith('+++ b/') else None
        elif raw.startswith('@@'):
            m = re.search(r'\+(\d+)', raw); n = int(m.group(1)) if m else 0
        elif raw.startswith('+') and path is not None:
            out.append((path, n, raw[1:])); n += 1
    if '..' not in spec:
        for p in git('ls-files', '--others', '--exclude-standard').split('\n'):
            if p and os.path.isfile(p):
                try:
                    with open(p, encoding='utf-8') as f:
                        out.extend((p, i, l.rstrip('\n')) for i, l in enumerate(f, 1))
                except (UnicodeDecodeError, OSError):
                    pass
    return out


def self_test():
    ok = 0; bad = 0
    def check(cond, what):
        nonlocal ok, bad
        if cond: ok += 1
        else: bad += 1; print('FAIL', what)
    name = ''.join(['J', 'o', 'h', 'a', 'n'])
    check(scan_line('approved by ' + name + ' on 18 Sep') == ['name'], 'the name')
    check(scan_line(name + "'s ruling") == ['name'], 'the name with an apostrophe s')
    check(scan_line(name.upper() + ' ruled') == ['name'], 'the name in capitals')
    check(scan_line('the crypt card ' + name + ' Wrede (G4)') == [], 'the crypt card that shares the word')
    check(scan_line(name + 'nes Castelein (G4)') == [], 'a longer name is another word')
    q, lq, rq = chr(34), chr(0x201c), chr(0x201d)   # the quote marks built here, so the scan of this file finds no quote
    check(scan_line('the owner: ' + q + 'det regnar i dag och vi stannar inne' + q) == ['quote (8 words)'], 'a Swedish quote')
    check(scan_line(lq + 'hej och tack' + rq) == ['quote (3 words)'], 'a curly Swedish quote')
    check(scan_line('wait for ' + q + 'k' + chr(0xf6) + 'r' + q) == [], 'one word is a term, not a quote')
    check(scan_line(q + 'Frau Sch' + chr(0xe4) + 'del' + q + ' and ' + q + 'Lyyli Y' + chr(0xf6) + 'syd' + chr(0xe4) + 'n' + q) == [],
          'card names with an umlaut are not Swedish')
    check(scan_line(q + 'leken slutar med kortet' + q) == ['quote (4 words)'], 'Swedish with no Swedish letter')
    check(scan_line('the client line "Lisa bounces the bleed to Hanna."') == [], 'an English table line')
    check(scan_line('the text "Prevent X+1 damage"') == [], 'English card text')
    check(owned('bot/docs/RULINGS.md') and owned('.claude/agents/x.md') and not owned('client/CLAUDE.md'), 'owned paths')
    check(not owned('bot/elysium-vtes-bord.html') and not owned('bot/test-bot-canary.js') and not owned('bot/vtes.json'),
          'main\'s copies and the data are not scanned')
    check(scan_line(('deck-coverage-x-' + name.lower() + '-y.md').replace('-', ' ')) == ['name'], 'a name in a path')
    print('%d checks, %d failed' % (ok + bad, bad))
    return 1 if bad else 0


def main(argv):
    mode = 'diff'; spec = 'origin/main'
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == '--diff' and i + 1 < len(argv): spec = argv[i + 1]; i += 1
        elif a == '--tree': mode = 'tree'
        elif a == '--self-test': return self_test()
        elif a in ('-h', '--help'): print(__doc__); return 0
        else: print('public-scan.py: unknown argument ' + a, file=sys.stderr); return 2
        i += 1
    os.chdir(git('rev-parse', '--show-toplevel').strip())
    hits = []; waiting = {}
    if mode == 'tree':
        for p in git('ls-files').split('\n'):
            if not p or not owned(p) or not os.path.isfile(p): continue
            for h in scan_line(p.replace('-', ' ').replace('_', ' ')):
                if h == 'name': hits.append((p, 0, 'name in the path'))
            try:
                with open(p, encoding='utf-8') as f: lines = f.read().split('\n')
            except (UnicodeDecodeError, OSError): continue
            for n, l in enumerate(lines, 1):
                for h in scan_line(l):
                    if p in WAITING: waiting[p] = waiting.get(p, 0) + 1
                    else: hits.append((p, n, h))
    else:
        new_paths = git('-c', 'core.quotePath=false', 'diff', '--name-only', '--no-renames', '--diff-filter=A', spec).split('\n')
        if '..' not in spec: new_paths += git('ls-files', '--others', '--exclude-standard').split('\n')
        for p in new_paths:
            if p and owned(p) and 'name' in scan_line(p.replace('-', ' ').replace('_', ' ')):
                hits.append((p, 0, 'name in the path'))
        for p, n, l in added_lines(spec):
            if not owned(p): continue
            for h in scan_line(l): hits.append((p, n, h))
    for p, n, h in hits:
        print('%s:%d: %s' % (p, n, h))
    for p in sorted(waiting):
        print('WAITING %s: %d (the bundle\'s cleanup release)' % (p, waiting[p]))
    files = len({p for p, _, _ in hits})
    print('public-scan: %s (%d hits in %d files%s; %s)' % ('PASS' if not hits else 'FAIL', len(hits), files,
          ', %d waiting in %d files' % (sum(waiting.values()), len(waiting)) if waiting else '',
          'the tree' if mode == 'tree' else 'the lines ' + spec + ' adds'))
    print('RESULT: %d hits in %d files%s' % (len(hits), files, ' (%d waiting)' % sum(waiting.values()) if waiting else ''))   # gates.sh's count
    return 1 if hits else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
