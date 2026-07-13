import re, sys, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from sections import section_for_line, is_excluded

SRC = os.path.join(REPO, 'index.html')
with open(SRC, encoding='utf-8') as f:
    lines = f.readlines()
text = ''.join(lines)

# ---------- helper: find nearest enclosing function/context name for a line ----------
FUNC_RE = re.compile(r'^\s*function\s+([A-Za-z_$][\w$]*)\s*\(')
CONST_FN_RE = re.compile(r'^\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function\s*\(|\([^)]*\)\s*=>|async\s*\()')
ONCLICK_RE = re.compile(r'\$\(\'([A-Za-z0-9]+)\'\)\.onclick')

def nearest_context(lineno):
    # scan backward up to 400 lines for a function/const-fn declaration
    lo = max(0, lineno-400)
    for i in range(lineno-1, lo, -1):
        ln = lines[i]
        m = FUNC_RE.match(ln)
        if m:
            return m.group(1)
        m = CONST_FN_RE.match(ln)
        if m:
            return m.group(1)
    return None

def line_of_offset(offset):
    return text.count('\n', 0, offset) + 1

records = []  # dict: main_ar, main_en, sub_ar, sub_en, current_ar, current_en, kind, key

# ============ 1) I18N DICTIONARY ============
i18n_start = text.index('const I18N={')
# grab the ar{...} and en{...} blocks by brace matching
def extract_block(start_marker, from_idx):
    idx = text.index(start_marker, from_idx)
    brace_start = text.index('{', idx)
    depth = 0
    i = brace_start
    while i < len(text):
        if text[i] == '{': depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                return text[brace_start+1:i], brace_start
        i += 1
    raise RuntimeError('unbalanced')

ar_block, ar_pos = extract_block(' ar:{', i18n_start)
en_block, en_pos = extract_block(' en:{', i18n_start)

PAIR_RE = re.compile(r'(\w+):"((?:[^"\\]|\\.)*)"')
ar_pairs = dict(PAIR_RE.findall(ar_block))
en_pairs = dict(PAIR_RE.findall(en_block))

i18n_lineno = line_of_offset(i18n_start)
common_keys = [k for k in ar_pairs if k in en_pairs]
for key in common_keys:
    prefix = re.match(r'^[a-z]+', key)
    records.append({
        'kind': 'قاموس I18N',
        'key': key,
        'ar': ar_pairs[key],
        'en': en_pairs[key],
        'line': i18n_lineno,
    })

i18n_end = line_of_offset(en_pos + len(en_block) + 1)  # end of I18N block, as a line number

# ============ 2) L('ar','en') calls ============
# Matches L('....','....')  allowing escaped quotes, across the whole file
L_RE = re.compile(r"L\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)")
for m in L_RE.finditer(text):
    pos = m.start()
    lineno = line_of_offset(pos)
    if lineno < i18n_end:  # skip anything inside/before I18N noise (I18N has no L() calls anyway)
        continue
    if is_excluded(lineno):
        continue
    ar_val, en_val = m.group(1), m.group(2)
    if not ar_val.strip() and not en_val.strip():
        continue
    records.append({
        'kind': 'نص مضمّن L()',
        'key': None,
        'ar': ar_val,
        'en': en_val,
        'line': lineno,
    })

# ============ 3) ar:'...', en:'...' object-literal pairs (e.g. FEATURES arrays) ============
# Pattern: ar:'....'  ...  en:'....'  on same statement (allow dar/den in between, ignore those)
AREN_RE = re.compile(r"\bar:\s*'((?:[^'\\]|\\.)*)'\s*,\s*en:\s*'((?:[^'\\]|\\.)*)'")
for m in AREN_RE.finditer(text):
    pos = m.start()
    lineno = line_of_offset(pos)
    if is_excluded(lineno):
        continue
    ar_val, en_val = m.group(1), m.group(2)
    if not ar_val.strip() and not en_val.strip():
        continue
    records.append({
        'kind': "نص مضمّن ar:/en:",
        'key': None,
        'ar': ar_val,
        'en': en_val,
        'line': lineno,
    })

# ============ 3b) dar:'...', den:'...' object-literal pairs (feature subtitles) ============
DAREN_RE = re.compile(r"\bdar:\s*'((?:[^'\\]|\\.)*)'\s*,\s*den:\s*'((?:[^'\\]|\\.)*)'")
for m in DAREN_RE.finditer(text):
    pos = m.start()
    lineno = line_of_offset(pos)
    if is_excluded(lineno):
        continue
    ar_val, en_val = m.group(1), m.group(2)
    if not ar_val.strip() and not en_val.strip():
        continue
    records.append({
        'kind': "نص مضمّن dar:/den: (وصف فرعي)",
        'key': None,
        'ar': ar_val,
        'en': en_val,
        'line': lineno,
    })

# ============ 3c) L(`...`,`...`) template-literal calls (dynamic, contain ${...}) ============
L_TPL_RE = re.compile(r"L\(\s*`((?:[^`\\]|\\.)*)`\s*,\s*`((?:[^`\\]|\\.)*)`\s*\)")
for m in L_TPL_RE.finditer(text):
    pos = m.start()
    lineno = line_of_offset(pos)
    if is_excluded(lineno):
        continue
    ar_val, en_val = m.group(1), m.group(2)
    if not ar_val.strip() and not en_val.strip():
        continue
    records.append({
        'kind': "نص ديناميكي L() (يحتوي ${...})",
        'key': None,
        'ar': ar_val,
        'en': en_val,
        'line': lineno,
    })

# ============ 4) LANG==='ar'?'...':'...'  ternary strings ============
TERN_RE = re.compile(r"LANG===?'ar'\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'")
for m in TERN_RE.finditer(text):
    pos = m.start()
    lineno = line_of_offset(pos)
    if is_excluded(lineno):
        continue
    ar_val, en_val = m.group(1), m.group(2)
    if not ar_val.strip() and not en_val.strip():
        continue
    records.append({
        'kind': "نص مضمّن LANG?:",
        'key': None,
        'ar': ar_val,
        'en': en_val,
        'line': lineno,
    })

print("total raw records:", len(records))

# de-duplicate by (kind,key,ar,en,line) not needed line unique enough; but same string appears multiple times possibly - keep line to differentiate location
# Now attach section + sub-context
out = []
seen = set()
for r in records:
    ar_main, en_main = section_for_line(r['line'])
    ctx = nearest_context(r['line'])
    dedup_key = (r['kind'], r['key'], r['ar'], r['en'], r['line'])
    if dedup_key in seen:
        continue
    seen.add(dedup_key)
    out.append({
        **r,
        'main_ar': ar_main,
        'main_en': en_main,
        'ctx': ctx or '',
    })

print("total unique records:", len(out))
with open(os.path.join(HERE, 'records.json'),'w',encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

# quick sanity: how many per main section
from collections import Counter
c = Counter((r['main_ar']) for r in out)
for k,v in c.most_common():
    print(v, k)
