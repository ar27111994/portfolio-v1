import json, os, sys

covers_dir = 'public/upwork-covers'
json_path = 'src/data/upwork-portfolio.json'

with open(json_path, encoding='utf-8') as f:
    data = json.load(f)

patched = 0
for item in data['items']:
    slug = item.get('id', '')
    atts = item.get('attachments', [])
    img_atts = [a for a in atts if a.get('type') == 'image']

    try:
        disk_files = sorted(
            [f for f in os.listdir(covers_dir) if f.startswith(slug + '-') and f.endswith('.jpg')],
            key=lambda f: int(f[len(slug)+1:-4]) if f[len(slug)+1:-4].isdigit() else 999
        )
    except Exception:
        disk_files = []

    if not disk_files:
        continue

    disk_idx = 0
    for att in img_atts:
        if not att.get('localImage') and disk_idx < len(disk_files):
            att['localImage'] = f'/upwork-covers/{disk_files[disk_idx]}'
            patched += 1
            disk_idx += 1

with open(json_path, 'w', encoding='utf-8', newline='\n') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write('\n')

# Verify
with open(json_path, encoding='utf-8') as f:
    check = json.load(f)

total = sum(1 for item in check['items'] for a in item.get('attachments', []) if a.get('localImage'))
no_local = [item['id'] for item in check['items']
            if not any(a.get('localImage') for a in item.get('attachments', []) if a.get('type') == 'image')]

print(f"Patched: {patched}")
print(f"Total localImage: {total}")
print(f"No local image: {no_local}")

for item in check['items']:
    if item['id'] == 'goggle-hunt':
        att0 = item['attachments'][0]
        print(f"goggle-hunt[0] localImage: {att0.get('localImage', 'MISSING')}")
