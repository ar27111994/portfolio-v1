import re, os
from pathlib import Path

os.chdir(str(Path(__file__).resolve().parent.parent))

selectors = set()
for css_file in ['src/styles/global-layout.css', 'src/styles/global-components.css']:
    with open(css_file) as f:
        for line in f:
            for m in re.finditer(r'\.([a-zA-Z_-]+)\b', line):
                selectors.add(m.group(1))

comp_classes = set()
for root, dirs, files in os.walk('src/components'):
    for f in files:
        if f.endswith('.astro'):
            content = open(os.path.join(root, f)).read()
            for m in re.finditer(r'class="([^"]+)"', content):
                for c in m.group(1).split():
                    if c and '{' not in c and '`' not in c:
                        comp_classes.add(c)

missing = comp_classes - selectors
unused = selectors - comp_classes

print(f'CSS: {len(selectors)}  Components: {len(comp_classes)}')
print(f'Missing ({len(missing)}): {sorted(missing)}')
print(f'Unused ({len(unused)}): {sorted(unused)}')
