#!/usr/bin/env python3
"""tools/round.py v1.0.0 -- the round record (RULINGS D-145, 27 Nov 2026; HARNESS "The round", "One place for each fact").

A round's figures are written once. tools/gates.sh writes OUT/record.json beside OUT/summary.md (`record`, after every gate);
`save` writes it as docs/round-record.json, the round's one source (the lead commits it), and renders its copies from it:
STATUS's generated blocks and the round's CHANGELOG entry's *Gates:* and *Egress:* lines; `render pr` prints the PR's gate
section. `check` fails when a copy differs from a fresh render (the versions block from the code too; with
DOC_BUDGET_ROOT_DRIFT=warn a newer root release only warns) or a CHANGELOG entry leaves its template; tools/doc-budget.sh runs
it, so do tools/gates.sh and CI. STATUS's deploy state comes from git and GitHub and is not checked (it needs the network).

  round.py record OUT --branch B --head H --dirty 0|1 --base REF --merge-base SHA --seconds N --flags F --changed N --changed-bot N
  round.py save OUT [--ci] [--egress TEXT] [--note TEXT]   (--ci reads tools/ci-status.sh on HEAD: pushed, CI completed)
  round.py status            STATUS's three blocks: versions, deploy state, gates
  round.py render line|gates|pr
  round.py check             exit 1 when a copy drifted or an entry left the template (a WARN line does not fail)
  round.py --self-test
"""
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

VERSION = '1.0.0'
CAP = 1500                       # bytes per CHANGELOG entry, its continuation lines included (D-145)
BYTES = ('elysium-bot.js', 'test-bot-logic.js', 'elysium-cardfx.json')
PENDING = '(pending)'
BLOCKS = ('versions', 'deploy', 'gates')


class Paths:
    def __init__(self, bot):
        self.bot = bot
        self.root = os.path.dirname(bot)
        self.docs = os.path.join(bot, 'docs')
        self.record = os.path.join(self.docs, 'round-record.json')
        self.status = os.path.join(self.docs, 'STATUS.md')
        self.changelog = os.path.join(self.docs, 'elysium-bot-CHANGELOG.md')


HERE = Paths(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(path):
    with open(path, encoding='utf8') as f:
        return f.read()


def write(path, text):
    with open(path, 'w', encoding='utf8') as f:
        f.write(text)


def git(paths, *args):
    try:
        return subprocess.run(['git', '-C', paths.root] + list(args), capture_output=True, text=True, check=True).stdout.strip()
    except (subprocess.CalledProcessError, OSError):
        return ''


# ---- the record ---------------------------------------------------------------------------------------------------------------
def build_record(out, meta, paths=HERE):
    """OUT/.rows.tsv (gates.sh: gate, result, count, seconds) + the run's facts -> the record."""
    rows = []
    tsv = os.path.join(out, '.rows.tsv')
    if os.path.exists(tsv):
        for line in read(tsv).splitlines():
            p = line.split('\t')
            if len(p) == 4:
                rows.append({'gate': p[0], 'result': p[1], 'count': p[2], 'seconds': int(p[3]) if p[3].isdigit() else p[3]})
    totals = {}
    for k in ('PASS', 'FAIL', 'SKIPPED', 'NOT RUN'):
        totals[k] = sum(1 for r in rows if r['result'] == k)
    hashes = {}
    for f in BYTES:
        fp = os.path.join(paths.bot, f)
        hashes[f] = hashlib.sha256(open(fp, 'rb').read()).hexdigest()[:8] if os.path.exists(fp) else '?'
    return {
        'schema': 1, 'tool': 'tools/gates.sh', 'date': meta.get('date') or datetime.date.today().isoformat(),
        'branch': meta.get('branch', '?'), 'head': meta.get('head', '?'), 'dirty': meta.get('dirty') in ('1', 1, True),
        'base': meta.get('base', '?'), 'merge_base': meta.get('merge_base', '?'),
        'flags': [f for f in (meta.get('flags') or '').split() if f],
        'changed': {'all': int(meta.get('changed') or 0), 'bot': int(meta.get('changed_bot') or 0)},
        'bytes': hashes, 'gates': rows, 'totals': totals, 'seconds': int(meta.get('seconds') or 0),
    }


def load_record(paths=HERE):
    return json.loads(read(paths.record)) if os.path.exists(paths.record) else None


# ---- renderings ---------------------------------------------------------------------------------------------------------------
def _date(rec):
    try:
        d = datetime.date.fromisoformat(rec['date'])
        return '%d %s' % (d.day, d.strftime('%b'))
    except (KeyError, ValueError):
        return rec.get('date', '?')


def _run(rec):
    flags = ''.join(' --' + f for f in rec.get('flags', []))
    tree = ' + the working tree' if rec.get('dirty') else ''
    b = rec.get('bytes', {})
    return '`tools/gates.sh%s` on `%s` `%s`%s (%s; bytes `%s` / `%s` / cardfx `%s`)' % (
        flags, rec.get('branch', '?'), rec.get('head', '?'), tree, _date(rec),
        b.get('elysium-bot.js', '?'), b.get('test-bot-logic.js', '?'), b.get('elysium-cardfx.json', '?'))


def _totals(rec):
    t = rec.get('totals', {})
    s = 'PASS %d · FAIL %d · SKIPPED %d' % (t.get('PASS', 0), t.get('FAIL', 0), t.get('SKIPPED', 0))
    return s + (' · NOT RUN %d' % t['NOT RUN'] if t.get('NOT RUN') else '')


def _row(g):
    """'gate [RESULT] count', the count without its tool's own name ('lint: clean' -> 'lint clean') or a repeat of the result."""
    c = str(g.get('count', ''))
    if c.lower().startswith(g['gate'].lower()):
        c = c[len(g['gate']):].lstrip(': ').strip()
    res = '' if g['result'] == 'PASS' else g['result']
    return ' '.join(x for x in (g['gate'], res, '' if c == res else c) if x)


def _ci(rec):
    ci = rec.get('ci')
    if not ci:
        return "CI's suite ×3: not read"
    runs = ci.get('runs') or []
    if len(runs) == 3 and len(set(runs)) == 1:
        s = "CI's suite %s ×3" % runs[0]
    else:
        s = "CI's suite " + (', '.join(runs) if runs else 'no runs')
    return s + ', `bot-gates` %s on `%s`' % (ci.get('gates', '?'), ci.get('head', '?'))


def render_line(rec):
    """The CHANGELOG entry's gate line: the totals, the footprint and every row that did not pass; the full table is the PR's."""
    special = [g for g in rec.get('gates', []) if g['gate'] == 'sim-240' or g['result'] != 'PASS']
    s = '%s: %s' % (_run(rec), _totals(rec))
    if special:
        s += ' (' + '; '.join(_row(g) for g in special) + ')'
    s += '. ' + _ci(rec) + '.'
    if rec.get('note'):
        s += ' ' + rec['note']
    return s


def render_gates(rec):
    """STATUS's gates block: every row."""
    rows = ' · '.join(_row(g) for g in rec.get('gates', []))
    s = '## Last gates (`docs/round-record.json`)\n%s: %s — %s. %s.' % (_run(rec), _totals(rec), rows, _ci(rec))
    if rec.get('note'):
        s += ' ' + rec['note']
    return s


def render_pr(rec, summary=None):
    out = []
    if summary:
        out.append(summary.rstrip())
    else:
        out += ['| Gate | Result | Count | Time |', '|---|---|---|---|']
        out += ['| %s | %s | %s | %s s |' % (g['gate'], g['result'], g['count'], g['seconds']) for g in rec.get('gates', [])]
        out += ['', '%s: %s' % (_run(rec), _totals(rec))]
    out += ['', _ci(rec) + '.']
    if rec.get('note'):
        out.append(rec['note'])
    if rec.get('egress'):
        out += ['', 'Egress: ' + rec['egress']]
    return '\n'.join(out)


# ---- versions and the deploy state --------------------------------------------------------------------------------------------
TOOLS = (   # (the label STATUS prints, the file under bot/ or the root, the pattern; the first match's x.y.z)
    ('**Bot v%s**', 'bot/elysium-bot.js', r"BOT_VERSION = '[0-9.]+'"),
    ('arena v%s', 'bot/elysium-bot-arena.js', r'arena v[0-9.]+ '),
    ('sim table v%s', 'bot/elysium-bot-sim.js', r"SIM_VERSION = '[0-9.]+'"),
    ('cardfx compiler v%s', 'bot/cardfx-compile.js', r"FXC_VERSION = '[0-9.]+'"),
    ('hotseat tool v%s', 'bot/elysium-bot-hotseat.js', r'elysium-bot-hotseat\.js v[0-9.]+'),
    ('coverage tool v%s', 'bot/gen-deck-coverage.js', r'gen-deck-coverage\.js v[0-9.]+'),
    ('card ledger v%s', 'bot/gen-card-ledger.js', r'gen-card-ledger\.js v[0-9.]+'),
    ('review sheet v%s', 'bot/gen-review-sheet.js', r"const VERSION = '[0-9.]+'"),
    ('cross-check v%s', 'bot/gen-cross-check.js', r"const VERSION = '[0-9.]+'"),
    ('precon generator v%s', 'bot/gen-precon.js', r'gen-precon\.js v[0-9.]+'),
    ('`krcg-v5.js` v%s', 'bot/krcg-v5.js', r"const VERSION = '[0-9.]+'"),
    ('`ana-gates.py` v%s', 'bot/ana-gates.py', r"VERSION = '[0-9.]+'"),
    ('the chat tools v%s', 'bot/tools/ana-chat.py', r'ana-chat\.py v[0-9.]+'),
    ('`tools/public-scan.py` v%s', 'bot/tools/public-scan.py', r'Review until clean"\)\. v[0-9.]+'),
    ('`tools/round.py` v%s', 'bot/tools/round.py', r"VERSION = '[0-9.]+'"),
)


def _ver(root, rel, pattern, text=None):
    p = os.path.join(root, rel)
    if text is None:
        if not os.path.exists(p):
            return '?'
        text = read(p)
    m = re.search(pattern, text)
    v = re.search(r'[0-9]+\.[0-9]+\.[0-9]+', m.group(0)) if m else None
    return v.group(0) if v else '?'


def render_versions(paths=HERE):
    parts = []
    for label, rel, pat in TOOLS:
        s = label % _ver(paths.root, rel, pat)
        if rel.endswith('cardfx-compile.js'):
            try:
                s += ', curated %d' % json.loads(read(os.path.join(paths.bot, 'elysium-cardfx.json')))['counts']['curated']
            except (OSError, KeyError, ValueError):
                pass
        parts.append(s)
    copies = 'the read-only copies in bot/ are client v%s / protocol v%s / srv-%s' % (
        _ver(paths.root, 'bot/elysium-vtes-bord.html', r"const VERSION='[0-9.]+'"),
        _ver(paths.root, 'bot/ELYSIUM-PROTOCOL.md', r'reflects client \*\*v[0-9.]+'),
        _ver(paths.root, 'bot/elysium-server.js', r"const VERSION = '[0-9.]+'"))
    rootrel = "the root's release is client v%s / srv-%s (the canary's second run)" % (
        _ver(paths.root, 'elysium-vtes-bord.html', r"const VERSION='[0-9.]+'"),
        _ver(paths.root, 'elysium-server.js', r"const VERSION = '[0-9.]+'"))
    return ' · '.join(parts) + ' · ' + copies + '; ' + rootrel + '.'


def _repo(paths, remote='origin'):
    url = git(paths, 'remote', 'get-url', remote)
    m = re.search(r'[/:]([^/:]+/[^/]+?)(?:\.git)?$', url)
    return m.group(1) if m else ''


def _open_prs(repo):
    if not repo or not shutil.which('gh'):
        return None
    try:
        out = subprocess.run(['gh', 'api', 'repos/%s/pulls?state=open&per_page=20' % repo, '--jq',
                              '.[] | "#\\(.number) `\\(.head.ref)`\\(if .draft then " (draft)" else "" end)"'],
                             capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return [l for l in out.stdout.splitlines() if l.strip()] if out.returncode == 0 else None


def render_deploy(paths=HERE, today=None, prs=None, data_prs=None):
    main = git(paths, 'rev-parse', '--short', 'origin/main') or '?'
    show = lambda f: git(paths, 'show', 'origin/main:' + f)
    bot = _ver(paths.root, 'elysium-bot.js', r"BOT_VERSION = '[0-9.]+'", show('elysium-bot.js'))
    cli = _ver(paths.root, 'elysium-vtes-bord.html', r"const VERSION='[0-9.]+'", show('elysium-vtes-bord.html'))
    srv = _ver(paths.root, 'elysium-server.js', r"const VERSION = '[0-9.]+'", show('elysium-server.js'))
    if prs is None:
        prs = _open_prs(_repo(paths))
    if data_prs is None:
        data_prs = _open_prs(os.environ.get('ROUND_DATA_REPO', 'dtagent2000/vtes-elysium-data'))
    d = today or datetime.date.today()
    s = '**Deploy state** (read at the round\'s end, %d %s): `main` `%s` carries bot v%s at the root, with client v%s / srv-%s. ' % (
        d.day, d.strftime('%b'), main, bot, cli, srv)
    s += 'Open pull requests: ' + ('not read here (no GitHub API)' if prs is None else (', '.join(prs) or 'none'))
    s += '; the private data repo: ' + ('not read' if data_prs is None else (', '.join(data_prs) or 'none')) + '.'
    return s


# ---- STATUS's blocks and the CHANGELOG's entries ------------------------------------------------------------------------------
def _marks(name):
    return '<!-- round.py:%s -->' % name, '<!-- /round.py:%s -->' % name


def get_block(text, name):
    a, b = _marks(name)
    m = re.search(re.escape(a) + r'\n(.*?)\n' + re.escape(b), text, re.S)
    return m.group(1) if m else None


def set_block(text, name, body):
    a, b = _marks(name)
    if get_block(text, name) is None:
        raise SystemExit('round.py: STATUS has no %s ... %s block' % (a, b))
    return re.sub(re.escape(a) + r'\n.*?\n' + re.escape(b), lambda m: a + '\n' + body + '\n' + b, text, count=1, flags=re.S)


def entries(text):
    """The CHANGELOG's entries: (start line, the entry's lines). An entry starts at '- **' and runs to the next or the end."""
    lines = text.split('\n')
    out, cur = [], None
    for i, l in enumerate(lines):
        if l.startswith('- **'):
            if cur:
                out.append(cur)
            cur = [i, [l]]
        elif cur and (l.startswith('  ') or l == ''):
            cur[1].append(l)
        elif cur:
            out.append(cur)
            cur = None
    if cur:
        out.append(cur)
    for e in out:
        while e[1] and e[1][-1] == '':
            e[1].pop()
    return out


def _field(entry_lines, name):
    for l in entry_lines:
        s = l.strip()
        if s.startswith('*%s:* ' % name):
            return s[len('*%s:* ' % name):]
    return None


def save(out, paths=HERE, ci=None, egress=None, note=None, today=None, prs=None, data_prs=None):
    rec = json.loads(read(os.path.join(out, 'record.json')))
    prev = load_record(paths)
    if not egress and prev and prev.get('branch') == rec.get('branch') and prev.get('egress'):
        egress = prev['egress']           # a later save on the branch keeps the review's line unless a new one is given
    if ci:
        rec['ci'] = ci
    if egress:
        rec['egress'] = egress
    if note:
        rec['note'] = note
    # the round's entry: the newest, pending or already this branch's (a save after the review's fixes)
    text = read(paths.changelog)
    es = entries(text)
    if not es:
        raise SystemExit('round.py: the CHANGELOG has no entry: write the round\'s entry first, *Gates:* %s' % PENDING)
    start, lines = es[0]
    g = _field(lines, 'Gates')
    if g is None or not (g.startswith(PENDING) or ('on `%s` ' % rec['branch']) in g):
        raise SystemExit("round.py: the newest CHANGELOG entry is not this round's (its *Gates:* is neither %s nor on `%s`): "
                         "write the round's entry first" % (PENDING, rec['branch']))
    write(paths.record, json.dumps(rec, indent=1, ensure_ascii=False) + '\n')
    all_lines = text.split('\n')
    for k in range(start, start + len(lines)):
        s = all_lines[k].strip()
        if s.startswith('*Gates:* '):
            all_lines[k] = all_lines[k][:len(all_lines[k]) - len(s)] + '*Gates:* ' + render_line(rec)
        elif s.startswith('*Egress:* ') and rec.get('egress'):
            all_lines[k] = all_lines[k][:len(all_lines[k]) - len(s)] + '*Egress:* ' + rec['egress']
    write(paths.changelog, '\n'.join(all_lines))
    status(paths, today=today, prs=prs, data_prs=data_prs)
    return rec


def status(paths=HERE, today=None, prs=None, data_prs=None):
    text = read(paths.status)
    text = set_block(text, 'versions', render_versions(paths))
    text = set_block(text, 'deploy', render_deploy(paths, today=today, prs=prs, data_prs=data_prs))
    rec = load_record(paths)
    if rec:
        text = set_block(text, 'gates', render_gates(rec))
    write(paths.status, text)


ROOTREL = re.compile(r"the root's release is client v[0-9.?]+ / srv-[0-9.?]+")


def check(paths=HERE):
    """[(ok, message)]: the record's copies, the versions block and the CHANGELOG's template; ok None = a warning.
    tools/doc-budget.sh prints them."""
    res = []
    rec = load_record(paths)
    st = read(paths.status) if os.path.exists(paths.status) else ''
    cl = read(paths.changelog) if os.path.exists(paths.changelog) else ''
    for name in BLOCKS:
        if get_block(st, name) is None:
            res.append((False, 'STATUS has no generated %s block (%s)' % (name, ' ... '.join(_marks(name)))))
    have_v, want_v = get_block(st, 'versions'), render_versions(paths)
    if have_v is not None and have_v != want_v:
        if os.environ.get('DOC_BUDGET_ROOT_DRIFT') == 'warn' and ROOTREL.sub('', have_v) == ROOTREL.sub('', want_v):
            res.append((None, "STATUS's versions block names another root release than the root's (main released since the last "
                              "bot round, which re-renders it)"))
        else:
            res.append((False, "STATUS's versions block differs from the code's versions: tools/round.py status"))
    elif have_v is not None:
        res.append((True, "STATUS's versions block renders the code"))
    es = entries(cl)
    for start, lines in es:
        head = re.sub(r'^- \*\*(.*?)\*\*.*$', r'\1', lines[0])[:60]
        size = len('\n'.join(lines).encode('utf8')) + 1
        if size > CAP:
            res.append((False, 'the CHANGELOG entry "%s" is %d bytes, the cap %d (the details go to its report)' % (head, size, CAP)))
        for f in ('Gates', 'Egress', 'Report'):
            v = _field(lines, f)
            if v is None:
                res.append((False, 'the CHANGELOG entry "%s" has no *%s:* line' % (head, f)))
            elif v.startswith(PENDING):
                res.append((False, 'the CHANGELOG entry "%s": *%s:* is still %s (tools/round.py save)' % (head, f, PENDING)))
        rp = _field(lines, 'Report')
        m = re.search(r'`([^`]+)`', rp or '')
        if rp and not (m and os.path.exists(os.path.join(paths.docs, m.group(1)))):
            res.append((False, 'the CHANGELOG entry "%s" names a report that does not exist: %s' % (head, rp)))
    if rec is None:
        res.append((True, 'no round record yet (docs/round-record.json): the copies are not checked'))
        return res
    want = render_gates(rec)
    have = get_block(st, 'gates')
    if have is not None:
        res.append((have == want, "STATUS's gates block %s the round record" % ('renders' if have == want else 'differs from')))
    line = render_line(rec)
    carriers = [lines for _, lines in es if _field(lines, 'Gates') == line]
    if not carriers:
        res.append((False, 'no CHANGELOG entry carries the round record\'s gate line (on `%s` `%s`): tools/round.py save'
                    % (rec.get('branch'), rec.get('head'))))
    else:
        res.append((True, 'the CHANGELOG entry carries the round record\'s gate line'))
        if _field(carriers[0], 'Egress') != rec.get('egress'):
            res.append((False, "the CHANGELOG entry's *Egress:* is not the round record's (tools/round.py save --egress)"))
    return res


# ---- CI ------------------------------------------------------------------------------------------------------------------------
def read_ci(paths=HERE, ref='HEAD'):
    sh = os.path.join(paths.bot, 'tools', 'ci-status.sh')
    p = subprocess.run(['bash', sh, ref], capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit('round.py: CI is not green and complete on %s (ci-status.sh exit %d):\n%s' % (ref, p.returncode, p.stdout + p.stderr))
    runs = re.findall(r'^\s+([0-9]+/[0-9]+) — ', p.stdout, re.M)
    gates = re.search(r'^\s+bot-gates\s+\S+\s+(\S+)', p.stdout, re.M)
    return {'head': git(paths, 'rev-parse', '--short', ref), 'runs': runs, 'gates': gates.group(1) if gates else '?'}


# ---- the self-test -------------------------------------------------------------------------------------------------------------
def self_test():
    fails, n = [], [0]

    def ok(cond, what):
        n[0] += 1
        if not cond:
            fails.append(what)

    tmp = tempfile.mkdtemp(prefix='round-self-')
    try:
        bot = os.path.join(tmp, 'bot')
        os.makedirs(os.path.join(bot, 'docs', 'reports'))
        os.makedirs(os.path.join(bot, 'tools'))
        P = Paths(bot)
        write(os.path.join(bot, 'elysium-bot.js'), "const BOT_VERSION = '9.8.7';\n")
        write(os.path.join(bot, 'docs', 'reports', 'REPORT-x-2026-01-01.md'), '# x\n')
        out = os.path.join(tmp, 'out')
        os.makedirs(out)
        write(os.path.join(out, '.rows.tsv'), 'check\tPASS\t35 of 35 scripts parse\t1\nsim-240\tPASS\tSAME-PLAY 240\t300\n'
                                               'v5-smokes\tFAIL\t13 of 14 smokes PASS\t90\nlint\tPASS\tlint: clean\t5\n'
                                               'doc-budget\tFAIL\tdoc-budget: FAIL\t1\n')
        rec = build_record(out, {'branch': 'topic', 'head': 'abc1234', 'dirty': '0', 'base': 'origin/main', 'merge_base': 'def5678',
                                 'seconds': '400', 'flags': 'sim smokes', 'changed': '3', 'changed_bot': '3', 'date': '2026-01-02'}, P)
        ok(rec['totals'] == {'PASS': 3, 'FAIL': 2, 'SKIPPED': 0, 'NOT RUN': 0}, 'the totals count the rows')
        ok(_row(rec['gates'][3]) == 'lint clean' and _row(rec['gates'][4]) == 'doc-budget FAIL',
           "a row drops its tool's own name and a repeated result")
        ok(rec['bytes']['elysium-bot.js'] != '?' and rec['bytes']['test-bot-logic.js'] == '?', 'the bytes: a file present, a file missing')
        write(os.path.join(out, 'record.json'), json.dumps(rec))
        line = render_line(rec)
        ok('PASS 3 · FAIL 2 · SKIPPED 0' in line and 'sim-240 SAME-PLAY 240' in line and 'v5-smokes FAIL 13 of 14' in line
           and 'check' not in line and 'lint' not in line, 'the gate line: totals, the footprint, the failed rows, no passed row')
        ok('--sim --smokes' in line and '2 Jan' in line, 'the gate line: the flags and the date')
        status_t = '# STATUS\n\n<!-- round.py:versions -->\nx\n<!-- /round.py:versions -->\n\n<!-- round.py:deploy -->\nx\n' \
                   '<!-- /round.py:deploy -->\n\n<!-- round.py:gates -->\nold\n<!-- /round.py:gates -->\n\n## Next\nhand\n'
        write(P.status, status_t)
        entry = ('- **The topic round (2 Jan 2026, bot v9.8.7, no bot change; PR #1)** — what and why.\n  *Gates:* %s\n'
                 '  *Egress:* %s\n  *Report:* `reports/REPORT-x-2026-01-01.md`.\n') % (PENDING, PENDING)
        cl_t = '# CHANGELOG\n\nheader\n\n' + entry
        write(P.changelog, cl_t)
        msgs = check(P)
        ok(any(not o and PENDING in m for o, m in msgs), 'check: a pending entry fails')
        ok(any(o and 'no round record yet' in m for o, m in msgs), 'check: no record yet is a note')
        save(out, P, ci={'head': 'abc1234', 'runs': ['2841/0'] * 3, 'gates': 'success'}, egress='0 findings in 1 pass',
             today=datetime.date(2026, 1, 2), prs=['#1 `topic` (draft)'], data_prs=[])
        msgs = check(P)
        ok(all(o for o, m in msgs), 'check: after save every copy renders the record (%s)' % [m for o, m in msgs if not o])
        st = read(P.status)
        ok('**Bot v9.8.7**' in st and '#1 `topic` (draft)' in st and 'hand' in st, 'status: versions, deploy and the hand part')
        ok("CI's suite 2841/0 ×3, `bot-gates` success" in read(P.changelog), 'save: CI read into the gate line')
        # drift: STATUS's block edited by hand
        write(P.status, st.replace('PASS 3 · FAIL 2', 'PASS 5 · FAIL 0'))
        ok(any(not o and 'differs' in m for o, m in check(P)), 'check: a hand-edited STATUS block fails')
        write(P.status, st)
        # drift: the entry's gate line edited by hand
        cl = read(P.changelog)
        write(P.changelog, cl.replace('2841/0 ×3', '2842/0 ×3'))
        ok(any(not o and 'carries' in m for o, m in check(P)), 'check: a hand-edited gate line fails')
        # the cap and the template
        write(P.changelog, cl.replace('what and why.', 'what and why ' + 'x' * CAP + '.'))
        ok(any(not o and 'the cap' in m for o, m in check(P)), 'check: an entry over the cap fails')
        write(P.changelog, cl.replace('  *Report:* `reports/REPORT-x-2026-01-01.md`.\n', ''))
        ok(any(not o and 'no *Report:*' in m for o, m in check(P)), 'check: an entry without its report line fails')
        write(P.changelog, cl.replace('REPORT-x-2026', 'REPORT-y-2026'))
        ok(any(not o and 'does not exist' in m for o, m in check(P)), 'check: a missing report fails')
        write(P.changelog, cl)
        # save refuses another round's entry
        write(P.changelog, cl.replace('on `topic`', 'on `other`'))
        try:
            save(out, P, today=datetime.date(2026, 1, 2), prs=[], data_prs=[])
            ok(False, "save: refuses when the newest entry is another round's")
        except SystemExit:
            ok(True, '')
        write(P.changelog, cl)
        # a later save on the same branch (after the review's fixes) re-renders
        rec2 = dict(rec, head='bcd2345')
        write(os.path.join(out, 'record.json'), json.dumps(rec2))
        save(out, P, today=datetime.date(2026, 1, 2), prs=[], data_prs=[])
        ok('`bcd2345`' in read(P.changelog) and all(o for o, m in check(P)), 'save: a second save on the branch re-renders')
        ok(get_block(read(P.status), 'versions').startswith('**Bot v9.8.7**'), 'the versions block starts with the bot')
        # the versions block: a hand edit fails; a newer root release only warns outside a pull request
        st = read(P.status)
        write(P.status, st.replace('**Bot v9.8.7**', '**Bot v9.9.9**'))
        ok(any(o is False and 'versions block differs' in m for o, m in check(P)), 'check: a hand-edited versions block fails')
        write(P.status, st)
        write(os.path.join(tmp, 'elysium-vtes-bord.html'), "const VERSION='2.6.1';\n")
        write(os.path.join(tmp, 'elysium-server.js'), "const VERSION = '2.6.1';\n")
        status(P, today=datetime.date(2026, 1, 2), prs=[], data_prs=[])
        write(os.path.join(tmp, 'elysium-vtes-bord.html'), "const VERSION='2.6.2';\n")
        os.environ['DOC_BUDGET_ROOT_DRIFT'] = 'warn'
        warned = check(P)
        del os.environ['DOC_BUDGET_ROOT_DRIFT']
        ok(any(o is None for o, m in warned) and all(o is not False for o, m in warned), 'check: a newer root release warns in the warn mode')
        ok(any(o is False and 'versions block differs' in m for o, m in check(P)), 'check: ... and fails on a pull request')
        write(os.path.join(tmp, 'elysium-vtes-bord.html'), "const VERSION='2.6.1';\n")
        # the egress line: typed by hand with no egress in the record fails
        r3 = load_record(P)
        r3.pop('egress', None)
        write(P.record, json.dumps(r3))
        ok(any(o is False and '*Egress:* is not' in m for o, m in check(P)), "check: an egress line the record does not carry fails")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    for f in fails:
        print('FAIL  ' + f)
    print('round.py v%s --self-test: %d checks, %d failed' % (VERSION, n[0], len(fails)))
    return 1 if fails else 0


# ---- main ----------------------------------------------------------------------------------------------------------------------
def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        print(__doc__)
        return 0
    cmd, args = argv[0], argv[1:]
    if cmd == '--self-test':
        return self_test()
    if cmd == 'record':
        out, meta, i = args[0], {}, 1
        while i < len(args) - 1:
            meta[args[i].lstrip('-').replace('-', '_')] = args[i + 1]
            i += 2
        write(os.path.join(out, 'record.json'), json.dumps(build_record(out, meta), indent=1, ensure_ascii=False) + '\n')
        return 0
    if cmd == 'save':
        out, opts, i = args[0], {}, 1
        while i < len(args):
            if args[i] == '--ci':
                opts['ci'] = read_ci()
                i += 1
            else:
                opts[args[i].lstrip('-')] = args[i + 1]
                i += 2
        save(out, ci=opts.get('ci'), egress=opts.get('egress'), note=opts.get('note'))
        print('round.py: docs/round-record.json saved; STATUS and the CHANGELOG entry rendered')
        return 0
    if cmd == 'status':
        status()
        return 0
    if cmd == 'render':
        rec = load_record()
        if rec is None:
            raise SystemExit('round.py: no docs/round-record.json')
        what = args[0] if args else 'line'
        if what == 'pr':
            summ = os.path.join(args[1], 'summary.md') if len(args) > 1 else None
            print(render_pr(rec, read(summ) if summ and os.path.exists(summ) else None))
        else:
            print(render_gates(rec) if what == 'gates' else render_line(rec))
        return 0
    if cmd == 'check':
        res = check()
        for o, m in res:
            print(('ok    ' if o else 'WARN  ' if o is None else 'FAIL  ') + m)
        return 0 if all(o is not False for o, m in res) else 1
    print('round.py: unknown command %s' % cmd, file=sys.stderr)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
