#!/usr/bin/env python3
"""public-scan.py -- the public repository's name and quote scan (RULINGS D-141, D-142; HARNESS "Review until clean"). v1.1.1

The repository is public: it carries no chat quotes and no names of private persons. The scan finds both without naming anyone
itself. Three rules, each hit printed as its place and its kind only, never the words, so the output can go into a PR body:
  name    a word (or a part of a camelCase or snake_case word) whose lower-case sha256 is in NAMES; a crypt card that shares the
          word is allowed by the sha256 of the pair (ALLOWED_PAIRS)
  quote   a span of two or more words between quote marks that reads as Swedish, the chat's language: two of its common words,
          or one and a Swedish letter in a span of at most 30 words (a longer span between two unrelated marks with one stray
          word is not a quote). The double marks (" and the typographic ones, Swedish same-mark and low-high too) are one
          kind, so a pair that mixes them is read, and every span between two of them is tried, so an odd mark earlier on the
          line does not hide one; the single marks pair on one line (an apostrophe is not a mark). A quote that wraps is read with
          the next two lines. A one-word term (the go-ahead word) is not a quote.
  sv      a line of Swedish prose with no quote marks: three distinct common Swedish words.
The pages written in Swedish by a tool, and the tools that write them (SWEDISH_OK), are read by the name rule only. The hashes
keep the words out of a reader's sight and out of a text search; they are not a secret (a name list or the public card list
reverses an unsalted hash of a name), and git history keeps the old text by the owner's choice.

Scanned: the files the bot owns -- bot/ (but the read-only copies of main's release and the third-party data), .claude/, the
bot's workflow and the root CLAUDE.md (shared: each side edits its own lines) -- and with --diff the messages of the range's
commits. Not scanned: main's files (client/, the root's client, server, guides and README).
Usage: python3 bot/tools/public-scan.py [--diff REF | --diff A..B | --tree] [--self-test]
  --diff REF   the lines the working tree adds against REF (staged, unstaged and untracked files too) and the messages of
               REF..HEAD; the default is origin/main
  --diff A..B  the lines the commits A..B add and their messages (a reviewer's range; CI's HEAD^1..HEAD on a pull request's
               merge commit reads its lines and, at the checkout's depth, the head commit's message only)
  --tree       every tracked file the scan reads, a count per file; a file WAITING lists is reported apart and does not fail
               the scan (none since the bundle's cleanup release, v0.6.242)
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
finns gör går ser tror kanske hej japp nej absolut superbra jättebra kul vi ett mot över efter innan utan hela helt redan
fortfarande varje mer flera många har hade blev kommer skulle kunna måste behöver verkar känns kolla testa spela köra lägga göra
säga ditt dina mitt vårt vår våra sitt hennes deras oss mig sig spelet kortet korten leken botten människorna slutar börja först
sist tyst rätt fel klart'''.split())
SV_LETTER = re.compile(r'[åäöÅÄÖ]')
DOUBLE = '"\u201c\u201d\u201e\u00ab\u00bb'   # " “ ” „ « »: one kind, so a pair that mixes them is read
SINGLE = re.compile(r"(?:^|(?<=[\s(\[=,:{+]))['\u2018\u2019](?=[^\s'])([^'\u2018\u2019\n]{2,300}?)(?<=[^\s'])['\u2019](?=[\s.,;:!?)\]}+]|$)")
# a single-marked pair on one line: it opens after a space, a bracket or an operator and closes before one (an apostrophe is not)
WORD = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+")
PART = re.compile(r"[A-ZÀ-ÖØ-Þ]?[a-zß-öø-ÿ]+|[A-ZÀ-ÖØ-Þ]+(?![a-zß-öø-ÿ])")
READ_ONLY = {'bot/elysium-server.js', 'bot/ELYSIUM-PROTOCOL.md', 'bot/elysium-vtes-bord.html', 'bot/elysium-hotseat-bots-plan.md',
             'bot/test-bot-canary.js'}   # main's release copies (ARCHITECTURE "Shared with main")
THIRD_PARTY = re.compile(r'^bot/(vtes|vtes-v5|expansions|twda|twda-vdb)\.json$')
WAITING = set()   # files whose hits may wait for a cleanup of their own; empty since the bundle's cleanup release (v0.6.242)
SWEDISH_OK = re.compile(r'^bot/(docs/coverage/deck-coverage-.*\.md|docs/specs/cardfx-sweep-audit\.md|gen-deck-coverage\.js|'
                        r'gen-sweep-audit\.js|tools/public-scan\.py)$')   # Swedish written by a tool (the coverage and audit
                        # pages and their writers), and this file's own word list and test strings


def owned(path):
    if path in READ_ONLY or THIRD_PARTY.match(path):
        return False
    return path.startswith('bot/') or path.startswith('.claude/') or path in ('.github/workflows/bot-gates.yml', 'CLAUDE.md')


def sha(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def _swedish(span, need):
    """(words, reads as Swedish): need distinct common words -- a quote 2, or 1 and a Swedish letter in a span of at most 30
    words, so a long English stretch between two unrelated marks with one stray word is not a quote; a line 3."""
    ws = [w.lower() for w in WORD.findall(span)]
    sv = len(set(ws) & SWEDISH)
    return len(ws), (sv >= need or (need == 2 and len(ws) <= 30 and sv >= 1 and SV_LETTER.search(span) is not None))


def name_hits(line, names=None, pairs=None):
    names = NAMES if names is None else names; pairs = ALLOWED_PAIRS if pairs is None else pairs
    hits = 0; words = WORD.findall(line)
    for i, w in enumerate(words):
        parts = [w] + ([p for p in PART.findall(w) if p != w] if not w.islower() and not w.isupper() else [])
        for p in parts:
            if sha(p.lower()) in names:
                if p == w and i + 1 < len(words) and sha((w + ' ' + words[i + 1]).lower()) in pairs:
                    continue
                hits += 1
    return hits   # snake_case parts are words already: WORD stops at an underscore


def quote_spans(text, limit):
    """(start, end, words) for every span between two double marks, or a single-marked pair, that starts before limit and reads
    as Swedish."""
    out = []
    pos = [i for i, c in enumerate(text) if c in DOUBLE]
    for k in range(len(pos) - 1):
        a, b = pos[k], pos[k + 1]
        if a >= limit or b - a < 4 or b - a > 2000: continue
        n, sv = _swedish(text[a + 1:b], 2)
        if n >= 2 and sv: out.append((a, b, n))
    for m in SINGLE.finditer(text[:limit]):
        n, sv = _swedish(m.group(1), 2)
        if n >= 2 and sv: out.append((m.start(), m.end(), n))
    return out


def scan_lines(lines, swedish_ok=False, names=None, pairs=None):
    """(line number, kind) for every hit in a list of lines (each line read with the next, for a quote that wraps)."""
    hits = []
    for i, l in enumerate(lines):
        hits.extend((i + 1, 'name') for _ in range(name_hits(l, names, pairs)))
        if swedish_ok: continue
        nxt = ' '.join(lines[i + 1:i + 3])   # the next two lines: a quote that wraps
        spans = quote_spans(l + ' ' + nxt, len(l))
        for a, b, n in spans:
            hits.append((i + 1, 'quote (%d words)' % n)); break   # one quote hit a line is enough
        if not spans:
            n, sv = _swedish(l, 3)
            if sv: hits.append((i + 1, 'sv (Swedish prose)'))
    return hits


def scan_line(line, names=None, pairs=None):
    """The kinds of hit on one line alone."""
    return [k for _, k in scan_lines([line], False, names, pairs)]


def git(*args):
    return subprocess.run(['git'] + list(args), capture_output=True, text=True, check=True).stdout


def added_hunks(spec):
    """(path, [(line number, text)]) for every run of added lines in the diff; untracked files whole when spec is a single ref."""
    out = []
    cmd = ['-c', 'core.quotePath=false', 'diff', '--unified=0', '--no-color', '--no-renames', spec] if '..' in spec else \
          ['-c', 'core.quotePath=false', 'diff', '--unified=0', '--no-color', '--no-renames', spec, '--']
    path = None; n = 0; cur = None
    for raw in git(*cmd).split('\n'):
        if raw.startswith('+++ '):
            path = raw[6:] if raw.startswith('+++ b/') else None; cur = None
        elif raw.startswith('@@'):
            m = re.search(r'\+(\d+)', raw); n = int(m.group(1)) if m else 0; cur = None
        elif raw.startswith('+') and path is not None:
            if cur is None: cur = (path, []); out.append(cur)
            cur[1].append((n, raw[1:])); n += 1
    if '..' not in spec:
        for p in git('ls-files', '--others', '--exclude-standard').split('\n'):
            if p and os.path.isfile(p):
                try:
                    with open(p, encoding='utf-8') as f:
                        out.append((p, [(i, l.rstrip('\n')) for i, l in enumerate(f, 1)]))
                except (UnicodeDecodeError, OSError):
                    pass
    return out


def parse_log(raw):
    """(short hash, message lines) from `git log --format=%h%x01%B%x00`."""
    out = []
    for rec in raw.split('\x00'):
        rec = rec.strip('\n')
        if '\x01' in rec:
            h, body = rec.split('\x01', 1); out.append((h, body.split('\n')))
    return out


def commit_messages(spec):
    rng = spec if '..' in spec else spec + '..HEAD'
    try:
        return parse_log(git('log', '--format=%h%x01%B%x00', rng))
    except subprocess.CalledProcessError:
        return []


def self_test():
    ok = 0; bad = 0
    def check(cond, what):
        nonlocal ok, bad
        if cond: ok += 1
        else: bad += 1; print('FAIL', what)
    # an invented name stands in for the hashed ones, so this file names nobody
    nm = 'Zorblax'; NM = {sha(nm.lower())}; PR = {sha((nm + ' quillfeather').lower())}
    sl = lambda s: scan_line(s, NM, PR)
    check(sl('approved by ' + nm + ' on 18 Sep') == ['name'], 'the name')
    check(sl(nm + "'s ruling") == ['name'], 'the name with an apostrophe s')
    check(sl(nm.upper() + ' ruled') == ['name'], 'the name in capitals')
    check(sl('a fixture ' + nm + 'Sundin and ' + nm.lower() + '_seat') == ['name', 'name'], 'camelCase and snake_case parts')
    check(sl('the crypt card ' + nm + ' Quillfeather (G4)') == [], 'a crypt card that shares the word')
    check(sl(nm + 'ian Mossgrove (G4)') == [], 'a longer name is another word')
    q, lq, rq, lo = chr(34), chr(0x201c), chr(0x201d), chr(0x201e)   # the marks built here, so the scan of this file finds no quote
    a = chr(0xe4); o = chr(0xf6); aa = chr(0xe5)
    check(sl('the owner: ' + q + 'det regnar i dag och vi stannar inne' + q) == ['quote (8 words)'], 'a Swedish quote')
    check(sl(lq + 'hej och vi' + rq) == ['quote (3 words)'], 'a curly Swedish quote')
    check(sl(rq + 'hej och vi' + rq) == ['quote (3 words)'], 'a Swedish same-mark quote')
    check(sl(lo + 'hej och vi' + lq) == ['quote (3 words)'], 'a low-high quote')
    check(sl('an odd ' + q + ' mark, then ' + q + 'det regnar och vi stannar' + q) == ['quote (5 words)'], 'an odd mark first')
    check(sl(q + 'hej och vi' + rq) == ['quote (3 words)'] and sl(lq + 'hej och vi' + q) == ['quote (3 words)'], 'mixed double marks')
    check(sl("x='hej och vi'") == ['quote (3 words)'] and sl(chr(0x2019) + 'hej och vi' + chr(0x2019)) == ['quote (3 words)'],
          'a single mark after an operator, and the same-mark single quote')
    check([k for _, k in scan_lines([q + 'det regnar', 'i dag och', 'vi stannar inne' + q], False, NM, PR)] == ['quote (8 words)'],
          'a quote over three lines')
    check(parse_log('abc1234' + chr(1) + 'line one\nline two\n' + chr(0) + '\ndef5678' + chr(1) + 'other\n' + chr(0)) ==
          [('abc1234', ['line one', 'line two']), ('def5678', ['other'])], 'the commit messages are parsed')
    check(sl('wait for ' + q + 'k' + o + 'r' + q) == [], 'one word is a term, not a quote')
    check(sl(q + 'Frau Sch' + a + 'del' + q + ' and ' + q + 'Lyyli Y' + o + 'syd' + a + 'n' + q) == [], 'card names with an umlaut')
    check(sl(q + 'leken slutar med kortet' + q) == ['quote (4 words)'], 'Swedish with no Swedish letter')
    check(sl(q + ' '.join(['och vi'] * 100) + q) == ['quote (200 words)'], 'a long quote (about 700 characters)')
    check(sl(q + 'x' + q + ' ' + ' '.join(['a long English stretch'] * 20) + ' with k' + o + 'r once ' + q + 'y' + q) == [],
          'a long English stretch between two quotes, with one stray word')
    check(sl(q + 'jag hade inte tid men regnet sl' + o + 'g mot taken' + q) == ['quote (9 words)'],
          'a 9-word Swedish quote')
    check(sl(q + 'rain fell in the town f' + o + 'r hours and nobody came out' + q) == ['quote (11 words)'],
          'an 11-word quote with one common word and a Swedish letter')
    check(sl(q + 'vi testade the new release on the server och the bots were fine all evening' + q) == ['quote (15 words)'],
          'a mixed-language quote over 8 words with two common words')
    check(sl('The lead-in says what was decided, and then the owner wrote: ' + q + 'vi ska nog g' + o + 'ra det imorgon') ==
          ['sv (Swedish prose)'], 'a long line with an English lead-in and the opening of a quote')
    check([k for _, k in scan_lines(['the owner: ' + q + 'det regnar i dag', 'och vi stannar inne' + q + ' (D-1)'], False, NM, PR)]
          == ['quote (8 words)'], 'a quote over a line break')
    check(sl('vi ska nog spela det ' + 'imorgon') == ['sv (Swedish prose)'], 'Swedish prose without marks')
    check(sl('vi ska spela imorgon') == ['sv (Swedish prose)'] and sl('vi ska imorgon') == [], 'a line needs three common words')
    check(sl('the client line "Lisa bounces the bleed to Hanna."') == [], 'an English table line')
    check(sl("the owner's ruling, the bots' readers and it's the 'go' word: Prevent X+1 damage") == [], 'apostrophes are not marks')
    check(sl("a label 'R" + chr(0xc4) + "TTELSE: kort utan effekt' in single marks") == ['quote (4 words)'], 'a Swedish label in single marks')
    check(scan_lines(['vi ska nog spela det'], True, NM, PR) == [], 'a Swedish tool page: names only')
    check(owned('bot/docs/RULINGS.md') and owned('.claude/agents/x.md') and owned('CLAUDE.md') and not owned('client/CLAUDE.md'),
          'owned paths')
    check(not owned('bot/elysium-vtes-bord.html') and not owned('bot/test-bot-canary.js') and not owned('bot/vtes.json'),
          'main\'s copies and the data are not scanned')
    check(sl(('deck-coverage-x-' + nm.lower() + '-y.md').replace('-', ' ')) == ['name'], 'a name in a path')
    check(SWEDISH_OK.match('bot/docs/coverage/deck-coverage-v5-starter-x.md') and not SWEDISH_OK.match('bot/docs/RULINGS.md'),
          'the Swedish tool pages')
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
    path_hit = lambda p: name_hits(p.replace('-', ' ').replace('_', ' ').replace('/', ' ')) > 0
    if mode == 'tree':
        for p in git('ls-files').split('\n'):
            if not p or not owned(p) or not os.path.isfile(p): continue
            if path_hit(p): hits.append((p, 0, 'name in the path'))
            try:
                with open(p, encoding='utf-8') as f: lines = f.read().split('\n')
            except (UnicodeDecodeError, OSError): continue
            for n, h in scan_lines(lines, bool(SWEDISH_OK.match(p))):
                if p in WAITING: waiting[p] = waiting.get(p, 0) + 1
                else: hits.append((p, n, h))
    else:
        new_paths = git('-c', 'core.quotePath=false', 'diff', '--name-only', '--no-renames', '--diff-filter=A', spec).split('\n')
        if '..' not in spec: new_paths += git('ls-files', '--others', '--exclude-standard').split('\n')
        for p in new_paths:
            if p and owned(p) and path_hit(p): hits.append((p, 0, 'name in the path'))
        for p, rows in added_hunks(spec):
            if not owned(p): continue
            for n, h in scan_lines([l for _, l in rows], bool(SWEDISH_OK.match(p))):
                hits.append((p, rows[n - 1][0], h))
        for h, body in commit_messages(spec):
            for n, k in scan_lines(body):
                hits.append(('commit ' + h, n, k))
    for p, n, h in hits:
        print('%s:%d: %s' % (p, n, h))
    for p in sorted(waiting):
        print('WAITING %s: %d (the bundle\'s cleanup release)' % (p, waiting[p]))
    files = len({p for p, _, _ in hits})
    print('public-scan: %s (%d hits in %d files%s; %s)' % ('PASS' if not hits else 'FAIL', len(hits), files,
          ', %d waiting in %d files' % (sum(waiting.values()), len(waiting)) if waiting else '',
          'the tree' if mode == 'tree' else 'the lines ' + spec + ' adds, and its commits\' messages'))
    print('RESULT: %d hits in %d files%s' % (len(hits), files, ' (%d waiting)' % sum(waiting.values()) if waiting else ''))   # gates.sh's count
    return 1 if hits else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
