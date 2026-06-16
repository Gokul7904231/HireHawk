from pathlib import Path
import re

root = Path('.').resolve()
ignore_dirs = {'.git', '.vscode', 'node_modules', '__pycache__', '.venv', 'venv', '.wrangler', '.output'}
text_suffixes = {
    '.py', '.md', '.yaml', '.yml', '.json', '.jsonc', '.ts', '.tsx', '.js', '.jsx', '.sh', '.ps1', '.txt', '.ini', '.cfg', '.toml', '.html', '.css'
}
replacements = [
    ('HireHawk', 'HireHawk'),
    ('hirehawk', 'hirehawk'),
    ('HIREHAWK', 'HIREHAWK'),
]

changed_files = []
for path in sorted(root.rglob('*')):
    if any(part in ignore_dirs for part in path.parts):
        continue
    if not path.is_file():
        continue
    if path.suffix.lower() not in text_suffixes:
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    new_text = text
    for old, new in replacements:
        new_text = new_text.replace(old, new)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        changed_files.append(str(path))

rename_pairs = [
    ('hirehawk-copilot', 'hirehawk-copilot'),
    ('hirehawk-agent', 'hirehawk-agent'),
    ('hirehawk-dashboard', 'hirehawk-dashboard'),
    ('hirehawk', 'hirehawk'),
]
renamed_paths = []
for old_name, new_name in rename_pairs:
    old_path = root / old_name
    new_path = root / new_name
    if old_path.exists() and not new_path.exists():
        old_path.rename(new_path)
        renamed_paths.append(f'{old_path} -> {new_path}')

# Rename rules file if still exists
rule_old = root / 'hirehawk' / '.agent' / 'rules' / 'hirehawk.md'
rule_new = root / 'hirehawk' / '.agent' / 'rules' / 'hirehawk.md'
if rule_old.exists() and not rule_new.exists():
    rule_old.rename(rule_new)
    renamed_paths.append(f'{rule_old} -> {rule_new}')

# Rename docs file if still exists
docs_old = root / 'docs' / 'hirehawk_mcp.md'
docs_new = root / 'docs' / 'hirehawk_mcp.md'
if docs_old.exists() and not docs_new.exists():
    docs_old.rename(docs_new)
    renamed_paths.append(f'{docs_old} -> {docs_new}')

print('Changed files:', len(changed_files))
for f in changed_files:
    print(f)
print('Renamed paths:', len(renamed_paths))
for p in renamed_paths:
    print(p)
