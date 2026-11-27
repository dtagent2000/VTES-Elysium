#!/usr/bin/env python3
"""public-scan.py -- main's name and quote scan for the public repository (client v2.6.190, 27 Nov 2026). v1.0.0

Main's copy of the bot project's bot/tools/public-scan.py v1.1.0 (their RULINGS D-141, D-142), with main's files and main's
scope. The repository is public: it carries no chat quotes and no names of private persons. The owner's scope for main's
half (26 Nov 2026): the owner's name may stay on the lines that existed then, and new text names the owner by role. Each hit
is printed as its place and its kind, never the words, so the output can go into a PR body. The rules:
  owner     a word (or a part of a camelCase word) whose lower-case sha256 is one of the owner's names (OWNER): a hit on a
            line a change adds; in --tree the lines that existed are counted apart and allowed. A crypt card that shares
            the word is allowed by the sha256 of the pair (ALLOWED_PAIRS)
  name      a word whose lower-case sha256 is a private person's name found by main's cleanup round (PRIVATE): always a hit
  quote     a span of two or more words between quote marks that reads as Swedish, the chat's language (the bot's rule:
            two of its common words, or one and a Swedish letter in a span of at most 30 words; a quote that wraps is read
            with the next two lines; a one-word term such as the go-ahead word is not a quote)
  quote-en  a span of two or more words between quote marks that opens at most 60 characters after the owner's name, the
            role (the owner, owner's) or a private name on the same line: a quoted request in English. In --tree it is
            reported for review and does not fail (a UI string after the owner's name on an old line is the usual case)
  sv        a line of Swedish prose with no quote marks (three distinct common Swedish words), outside the session journal,
            which main writes in Swedish
This file itself is read by the name rules only (its word list and its test strings). The hashes keep the words out of a
reader's sight and out of a text search; they are not a secret, and git history keeps the old text by the owner's choice.

Scanned: main's files -- client/, the root's release files (the client, the server, START-HERE.html, the start scripts),
README.md, LICENSE, main's workflows and the root CLAUDE.md (shared: each side edits its own lines); with --diff also the
messages of the range's commits. Not scanned: the bot's files (bot/, .claude/, the bundle at the root); their own scan reads them.
Usage: python3 client/tools/public-scan.py [--diff REF | --diff A..B | --tree] [--self-test]
  --diff REF   the lines the working tree adds against REF (staged, unstaged and untracked files too) and the messages of
               REF..HEAD; the default is origin/main
  --diff A..B  the lines the commits A..B add and their messages (CI's HEAD^1..HEAD on a pull request's merge commit)
  --tree       every tracked file the scan reads: the hits that fail, then the allowed owner lines and the quote-en lines
               to review, as counts per file
Exit 1 on a hit that fails, 2 on a usage error.
"""
import hashlib, os, re, subprocess, sys

OWNER = {   # sha256 of the lower-case word: the owner's names, as the bot project's scan holds them
    'd9a31550033ee07d6e14302eea8202c07c266b633154513d817ca8bb91de40d1',
    '3470c3badec253e68895721ee5d190f6d964377856485449e0a3d6bd3b00db82',
    '79bbe3aaee3096d9024c1cdd53c6d6cb155d7e72cc4d67f3ab9eab573c899fd3',
    '74028dcdd9ec8860dfe06ec08196a92203f79779284f59a057041f8dc2951dff',
}
ALLOWED_PAIRS = {   # sha256 of 'word next' in lower case: a crypt card whose name begins with the owner's word
    '41700266f4dc1aa924e99f260b8995d72b680ca7029bfe140da2a2e5e831a407',
}
PRIVATE = {   # sha256 of the lower-case word: the private persons main's cleanup round found (players who reached us through
              # the owner, and their genitives); add a name here when a later round finds one
    '71301ec053f6999bfc827b917500047baf87527e6c74d8742f2dc24ca240053c',
    'c76e337ce910c4324d66027f974ee230641ab1f7e87aae0dfe81c709a7925658',
    '9009daa00463d3af781caff274aff055fdf2f32da6ead8c68106981e3adbcac8',
    'd288baf1a98b562e6ee59fc05aac81b885dda467bee89bae8ddb40a00690e8d3',
    'd56b16f08c0b2c6edad6982eaeaf336262ce326ebf8b3487fcdd97f61298a2d1',
    '26e2d2c52e40d1c8e0edaea505eae7fe7d4b08703bb761e0f2bb1a707aa8bdd3',
    '4113c2de66946606926a2bc51ccc147c0a8710572be0f3fb6c5c9a5916c0ed3a',
    '86ea418df29f8c82a8d4ed7547fb4c9f1e9fb998b14dff522e4c19a4efa954c1',
    'c0d19e4483571ff07cb01a4d3f5484102d7f333c4cafa64a2821f55031ea6041',
    '61d6f281634e5c7f9fd06a1e9115d2b587f2f57403b7c99c5ea542008a6c7a0b',
}
SWEDISH = set('''och att jag inte det är på för med ska kan du eller nog också gärna tycker tänker låter kör bra ju då hur vad
när någon några alla ingen inget inga sedan sen eftersom alltså bara mycket lite här där igen detta dessa som från vill vara blir
finns gör går ser tror kanske hej japp nej absolut superbra jättebra kul vi ett mot över efter innan utan hela helt redan
fortfarande varje mer flera många har hade blev kommer skulle kunna måste behöver verkar känns kolla testa spela köra lägga göra
säga ditt dina mitt vårt vår våra sitt hennes deras oss mig sig spelet kortet korten leken botten människorna slutar börja först
sist tyst rätt fel klart'''.split())
SV_LETTER = re.compile(r'[åäöÅÄÖ]')
DOUBLE = '"“”„«»'   # the double marks and the typographic ones: one kind, so a pair that mixes them is read
SINGLE = re.compile(r"(?:^|(?<=[\s(\[=,:{+]))['‘’](?=[^\s'])([^'‘’\n]{2,300}?)(?<=[^\s'])['’](?=[\s.,;:!?)\]}+]|$)")
WORD = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+")
PART = re.compile(r"[A-ZÀ-ÖØ-Þ]?[a-zß-öø-ÿ]+|[A-ZÀ-ÖØ-Þ]+(?![a-zß-öø-ÿ])")
ROLE = re.compile(r"\b(?:the owner|owner's|owner)\b", re.I)
MAIN_ROOT = {'elysium-vtes-bord.html', 'elysium-server.js', 'START-HERE.html', 'README.md', 'LICENSE', 'CLAUDE.md',
             '.github/workflows/client-gates.yml', '.github/workflows/served-check.yml'}
JOURNAL = {'client/docs/elysium-session-journal.md'}   # Swedish by design: no sv rule, every other rule
SELF = {'client/tools/public-scan.py'}                # its own word list and test strings: the name rules only


def owned(path):
    return path.startswith('client/') or path in MAIN_ROOT or path.startswith('start-')


def sha(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def _swedish(span, need):
    ws = [w.lower() for w in WORD.findall(span)]
    sv = len(set(ws) & SWEDISH)
    return len(ws), (sv >= need or (need == 2 and len(ws) <= 30 and sv >= 1 and SV_LETTER.search(span) is not None))


def _words(line):
    """(word, end) for every word and every part of a camelCase word."""
    out = []
    for m in WORD.finditer(line):
        w = m.group(0); out.append((w, m.end(), m))
        if not w.islower() and not w.isupper():
            for p in PART.finditer(w):
                if p.group(0) != w: out.append((p.group(0), m.start() + p.end(), None))
    return out


def name_hits(line, owner=None, private=None, pairs=None):
    """(owner hits, private hits) on one line."""
    owner = OWNER if owner is None else owner; private = PRIVATE if private is None else private
    pairs = ALLOWED_PAIRS if pairs is None else pairs
    o = p = 0; words = WORD.findall(line); flat = _words(line)
    for w, end, m in flat:
        h = sha(w.lower())
        if h in owner:
            if m is not None:
                i = words.index(w) if w in words else -1
                if 0 <= i < len(words) - 1 and sha((w + ' ' + words[i + 1]).lower()) in pairs: continue
            o += 1
        elif h in private:
            p += 1
    return o, p


def spans(text, limit):
    """(start, end, inner) for every span between two double marks, and every single-marked pair, that starts before limit."""
    out = []
    pos = [i for i, c in enumerate(text) if c in DOUBLE]
    for k in range(len(pos) - 1):
        a, b = pos[k], pos[k + 1]
        if a >= limit or b - a < 4 or b - a > 2000: continue
        out.append((a, b, text[a + 1:b]))
    for m in SINGLE.finditer(text[:limit]):
        out.append((m.start(), m.end(), m.group(1)))
    return out


def quote_kinds(text, limit, cues):
    """'quote' when a span reads as Swedish; else 'quote-en' when a span of 2+ words opens within 60 characters after a cue."""
    en = False
    for a, b, inner in spans(text, limit):
        n, sv = _swedish(inner, 2)
        if n >= 2 and sv: return 'quote (%d words)' % n
        if n >= 2 and any(0 <= a - c <= 60 for c in cues): en = True
    return 'quote-en' if en else None


def scan_lines(lines, mode='full', owner=None, private=None, pairs=None):
    """(line number, kind) for every hit; mode 'full', 'journal' (no sv) or 'self' (the name rules only)."""
    owner = OWNER if owner is None else owner; private = PRIVATE if private is None else private
    hits = []
    for i, l in enumerate(lines):
        o, p = name_hits(l, owner, private, pairs)
        hits.extend((i + 1, 'owner') for _ in range(o)); hits.extend((i + 1, 'name') for _ in range(p))
        if mode == 'self': continue
        cues = [m.end() for m in ROLE.finditer(l)] + [end for w, end, _ in _words(l) if sha(w.lower()) in owner or sha(w.lower()) in private]
        nxt = ' '.join(lines[i + 1:i + 3])
        k = quote_kinds(l + ' ' + nxt, len(l), cues)
        if k: hits.append((i + 1, k))
        elif mode == 'full':
            n, sv = _swedish(l, 3)
            if sv: hits.append((i + 1, 'sv (Swedish prose)'))
    return hits


def scan_line(line, owner=None, private=None, pairs=None, mode='full'):
    return [k for _, k in scan_lines([line], mode, owner, private, pairs)]


def mode_of(path):
    return 'self' if path in SELF else ('journal' if path in JOURNAL else 'full')


def git(*args):
    return subprocess.run(['git'] + list(args), capture_output=True, text=True, check=True).stdout


def added_hunks(spec):
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
    # invented names stand in for the hashed ones, so this file names nobody
    ow = 'Zorblax'; pv = 'Quimby'; OW = {sha(ow.lower())}; PV = {sha(pv.lower())}; PR = {sha((ow + ' quillfeather').lower())}
    sl = lambda s, mode='full': scan_line(s, OW, PV, PR, mode)
    q, lq, rq = chr(34), chr(0x201c), chr(0x201d)   # the marks built here, so a scan of this file finds no quote
    a = chr(0xe4); o = chr(0xf6)
    check(sl('approved by ' + ow + ' on 18 Sep') == ['owner'], 'the owner by name')
    check(sl(ow + "'s ruling") == ['owner'], 'the owner with an apostrophe s')
    check(sl('the crypt card ' + ow + ' Quillfeather (G4)') == [], 'a crypt card that shares the owner\'s word')
    check(sl('a question from ' + pv + ' through the owner') == ['name'], 'a private name')
    check(sl('a fixture ' + pv + 'Sundin') == ['name'], 'a private name as a camelCase part')
    check(sl('the owner: ' + q + 'det regnar i dag och vi stannar inne' + q) == ['quote (8 words)'], 'a Swedish quote')
    check(sl(lq + 'hej och vi' + rq) == ['quote (3 words)'], 'a curly Swedish quote')
    check(sl('the owner asked for ' + q + 'a quieter button' + q + ' here') == ['quote-en'], 'an English quote after the role')
    check(sl("the owner's note: 'make it quieter please'") == ['quote-en'], 'an English quote in single marks after the role')
    check(sl(ow + ': ' + q + 'make it quieter' + q) == ['owner', 'quote-en'], 'an English quote after the owner\'s name')
    check(sl('the owner chose the panel; the label reads ' + q + 'Unlock all cards?' + q) == ['quote-en'],
          'a UI string close after the role is flagged too (rephrase it)')
    check(sl('the log says ' + q + 'Lisa bounces the bleed to Hanna.' + q) == [], 'an English table line with no cue')
    check(sl('the owner chose ' + q + 'redirects' + q + ' over nothing') == [], 'one word is a term, not a quote')
    check(sl("the owner's ruling and the bots' readers: Prevent X+1 damage") == [], 'apostrophes are not marks')
    check(sl('vi ska nog spela det imorgon') == ['sv (Swedish prose)'], 'Swedish prose')
    check(sl('vi ska nog spela det imorgon', 'journal') == [], 'Swedish prose in the journal')
    check(sl('ägaren: ' + q + 'vi kör på det' + q, 'journal') == ['quote (4 words)'], 'a Swedish quote in the journal')
    check(sl(ow + ' och vi ska spela', 'self') == ['owner'], 'this file: the name rules only')
    check([k for _, k in scan_lines(['the owner: ' + q + 'det regnar i dag', 'och vi stannar inne' + q], 'full', OW, PV, PR)]
          == ['quote (8 words)'], 'a quote over a line break')
    check(sl(q + 'Frau Sch' + a + 'del' + q + ' and ' + q + 'Lyyli Y' + o + 'syd' + a + 'n' + q) == [], 'card names with an umlaut')
    check(owned('client/CLAUDE.md') and owned('elysium-server.js') and owned('start-elysium.sh') and owned('CLAUDE.md')
          and not owned('bot/docs/RULINGS.md') and not owned('elysium-bot.js') and not owned('.claude/agents/x.md'), 'owned paths')
    check(mode_of('client/docs/elysium-session-journal.md') == 'journal' and mode_of('client/tools/public-scan.py') == 'self'
          and mode_of('client/SKILLS.md') == 'full', 'the modes')
    check(parse_log('abc1234' + chr(1) + 'line one\nline two\n' + chr(0)) == [('abc1234', ['line one', 'line two'])], 'commit messages')
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
    hits = []; allowed = {}; review = {}
    path_hit = lambda p: sum(name_hits(p.replace('-', ' ').replace('_', ' ').replace('/', ' '))) > 0
    if mode == 'tree':
        for p in git('ls-files').split('\n'):
            if not p or not owned(p) or not os.path.isfile(p): continue
            if path_hit(p): hits.append((p, 0, 'name in the path'))
            try:
                with open(p, encoding='utf-8') as f: lines = f.read().split('\n')
            except (UnicodeDecodeError, OSError): continue
            for n, h in scan_lines(lines, mode_of(p)):
                if h == 'owner': allowed[p] = allowed.get(p, 0) + 1
                elif h == 'quote-en': review[p] = review.get(p, 0) + 1
                else: hits.append((p, n, h))
    else:
        new_paths = git('-c', 'core.quotePath=false', 'diff', '--name-only', '--no-renames', '--diff-filter=A', spec).split('\n')
        if '..' not in spec: new_paths += git('ls-files', '--others', '--exclude-standard').split('\n')
        for p in new_paths:
            if p and owned(p) and path_hit(p): hits.append((p, 0, 'name in the path'))
        for p, rows in added_hunks(spec):
            if not owned(p): continue
            for n, h in scan_lines([l for _, l in rows], mode_of(p)):
                hits.append((p, rows[n - 1][0], h))
        for h, body in commit_messages(spec):
            for n, k in scan_lines(body):
                hits.append(('commit ' + h, n, k))
    for p, n, h in hits:
        print('%s:%d: %s' % (p, n, h))
    for p in sorted(allowed):
        print('ALLOWED %s: %d (the owner\'s name on lines that existed)' % (p, allowed[p]))
    for p in sorted(review):
        print('REVIEW %s: %d (a quoted span after the owner, the role or a name)' % (p, review[p]))
    files = len({p for p, _, _ in hits})
    print('public-scan: %s (%d hits in %d files%s; %s)' % ('PASS' if not hits else 'FAIL', len(hits), files,
          (', %d allowed and %d to review' % (sum(allowed.values()), sum(review.values()))) if mode == 'tree' else '',
          'the tree' if mode == 'tree' else 'the lines ' + spec + ' adds, and its commits\' messages'))
    return 1 if hits else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
