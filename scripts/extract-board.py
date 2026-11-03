#!/usr/bin/env python3
"""Turn a prototype board (design/prototype/<Name>.dc.html) into the site's three files:
  src/boards/<key>.html   the template, without the shared header, footer and cursor
  src/boards/<key>.js     the component logic, verbatim, as a module
  src/styles/pages/<key>.css  the board's own stylesheet, verbatim
Links to other boards become site routes; /_blob/ images are copied to public/img/ with a file extension.
Usage: python3 scripts/extract-board.py HomeSutra home
"""
import os, re, sys, shutil, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
PROTO = os.path.join(SITE, '..', 'design', 'prototype')
ROUTES = {'HomeSutra': '/', 'HomeHi': '/hi/', 'Pothi': '/manuscripts/', 'PothiRecord': '/manuscripts/4642/', 'Nakshatra': '/nakshatra/',
          'Learn': '/learn/', 'Katha': '/our-story/', 'Visit': '/visit/', 'Journal': '/journal/', 'JournalPost': '/journal/sky-guide/',
          'Dana': '/support/', 'NotFound': '/404.html', 'System': '/system/'}

THREE_ID = 'a403dadf537a806e344cdc5c9735369f'

def ext_of(path):
    kind = subprocess.run(['file', '-b', path], capture_output=True, text=True).stdout
    return 'jpg' if 'JPEG' in kind else 'png' if 'PNG' in kind else 'webp' if 'Web/P' in kind else 'json' if 'JSON' in kind else 'js' if 'JavaScript' in kind or 'text' in kind.lower() else 'bin'

def cut_block(t, start, tag):
    """remove the element that begins at `start` (an opening tag) through its matching close"""
    i = t.find(start)
    if i < 0: return t
    depth, j = 0, i
    pat = re.compile(r'<(/?)' + tag + r'\b[^>]*>')
    for m in pat.finditer(t, i):
        depth += -1 if m.group(1) else 1
        if depth == 0: j = m.end(); break
    return t[:i] + t[j:]


# editable content lives in src/content; the board reads it instead of the literal written in the prototype
CONTENT = {
    'pothi': [('    var ROWS = [', '    ];\n', 'register.json', 'CONTENT_register', '    var ROWS = CONTENT_register;\n', None)],
    'journal': [('    var POSTS = [', '    ];\n', 'journal.json', 'CONTENT_journal', '    var POSTS = CONTENT_journal.map(function (p) { return Object.assign({}, p, { t: now - p.daysAgo * day }); });\n', 'daysAgo')],
    'record': [('    var READ = {', '    };\n', 'records/4642.reading.json', 'CONTENT_reading', '    var READ = CONTENT_reading;\n', None),
               ('    var cat = [', '    ];\n', 'records/4642.catalogue.json', 'CONTENT_catalogue', '    var cat = CONTENT_catalogue;\n', None)],
}
def apply_content(key, js):
    imports = []
    for start, end, file, name, repl, rel in CONTENT.get(key, []):
        i = js.find(start)
        if i < 0: raise SystemExit('content block not found: ' + start)
        j = js.index(end, i) + len(end)
        literal = js[i:j].split('=', 1)[1].strip().rstrip(';')
        path = os.path.join(SITE, 'src', 'content', file)
        if not os.path.exists(path):  # first extraction seeds the file; after that the file is the source
            os.makedirs(os.path.dirname(path), exist_ok=True)
            code = 'var now = 0, day = 1; var v = (' + literal + ');'
            if rel: code += ' v = v.map(function (p) { var o = Object.assign({}, p); o.daysAgo = -o.t; delete o.t; return o; });'
            code += ' process.stdout.write(JSON.stringify(v, null, 2));'
            out = subprocess.run(['node', '-e', code], capture_output=True, text=True, check=True).stdout
            open(path, 'w', encoding='utf-8').write(out + '\n')
        js = js[:i] + repl + js[j:]
        imports.append('import ' + name + " from '../content/" + file + "';")
    return js, imports

def main(name, key):
    t = open(os.path.join(PROTO, name + '.dc.html'), encoding='utf-8').read()
    x = t[t.index('<x-dc>') + 6:t.index('</x-dc>')]
    css = x[x.index('<style>') + 7:x.index('</style>')]
    tpl = x[x.index('</helmet>') + 9:]
    js = t[t.index('data-dc-script'):]; js = js[js.index('>') + 1:js.index('</script>')]
    # shared parts come from the layout
    tpl = cut_block(tpl, '<header style="position: fixed;', 'header')
    tpl = cut_block(tpl, '<footer style="position: relative; z-index: 3;', 'footer')
    tpl = cut_block(tpl, '<svg ref="{{cur.svg}}"', 'svg')
    tpl = re.sub(r'\n\s*<!-- =* ?header ?=* ?-->\n', '\n', tpl)
    js = js.replace('    try { this.cursorInit(); } catch (e) {}\n', '')
    js = re.sub(r"    // final pass · solid header on scroll.*?\n    try \{ var hd = .*?\n    try \{ var tagL = .*?\n", '', js, flags=re.S)
    # links and images
    def link(m): return ROUTES.get(m.group(1), '/') + (m.group(2) or '')
    rx = re.compile(r'\b([A-Z][A-Za-z]+)\.dc\.html(#[\w-]+)?')
    tpl, js = rx.sub(link, tpl), rx.sub(link, js)
    ids = set(re.findall(r'[0-9a-f]{32}', tpl + js))
    os.makedirs(os.path.join(SITE, 'public', 'img'), exist_ok=True)
    for i in ids:
        src = os.path.join(PROTO, '_blob', i)
        if not os.path.exists(src): continue
        if i == THREE_ID: continue  # three.js comes from npm (pinned to the same r149)
        e = ext_of(src)
        folder = 'img' if e in ('jpg', 'png', 'webp') else 'data' if e == 'json' else 'vendor' if e == 'js' else None
        if not folder: continue
        os.makedirs(os.path.join(SITE, 'public', folder), exist_ok=True)
        shutil.copy(src, os.path.join(SITE, 'public', folder, i + '.' + e))
        tpl = tpl.replace('/_blob/' + i, '/' + folder + '/' + i + '.' + e)
        js = js.replace('/_blob/' + i, '/' + folder + '/' + i + '.' + e)
        if folder == 'img': js = js.replace("'" + i + "'", "'" + i + '.' + e + "'")
    js = js.replace("'/_blob/'", "'/img/'")
    js, imports = apply_content(key, js)
    out = os.path.join(SITE, 'src', 'boards'); os.makedirs(out, exist_ok=True)
    open(os.path.join(out, key + '.html'), 'w', encoding='utf-8').write(tpl.strip() + '\n')
    open(os.path.join(out, key + '.js'), 'w', encoding='utf-8').write(
        '// Component logic for this page, verbatim from design/prototype/' + name + '.dc.html.\n'
        '// Generated by scripts/extract-board.py; edit the prototype rules in PORTING.md before editing this.\n'
        '/* eslint-disable */\n' + ''.join(i + '\n' for i in imports) + 'export default function (DCLogic) {\n' + js.strip() + '\nreturn Component;\n}\n')
    os.makedirs(os.path.join(SITE, 'src', 'styles', 'pages'), exist_ok=True)
    open(os.path.join(SITE, 'src', 'styles', 'pages', key + '.css'), 'w', encoding='utf-8').write(
        '/* ' + name + ' board stylesheet, verbatim from the prototype */\n' + css.strip() + '\n')
    print(key, 'template', len(tpl), 'logic', len(js), 'css', len(css), 'images', len(ids))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
