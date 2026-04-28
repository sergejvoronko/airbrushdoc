#!/usr/bin/env python3
"""
Convert all jpg/jpeg/png in wp-uploads to webp, delete originals,
then rewrite .jpg/.jpeg/.png → .webp references in all markdown posts.
"""
import subprocess
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

UPLOADS = Path('/home/sergej/Downloads/airbrushdoc/public/images/wp-uploads')
BLOG    = Path('/home/sergej/Downloads/airbrushdoc/src/content/blog')
QUALITY = 85
WORKERS = 8

EXTS = {'.jpg', '.jpeg', '.png'}

def convert(src: Path) -> tuple[Path, bool, str]:
    dst = src.with_suffix('.webp')
    if dst.exists():
        src.unlink()
        return src, True, 'skipped (webp exists, deleted original)'
    result = subprocess.run(
        ['cwebp', '-q', str(QUALITY), '-quiet', str(src), '-o', str(dst)],
        capture_output=True, text=True
    )
    if result.returncode == 0 and dst.exists():
        src.unlink()
        return src, True, 'converted'
    else:
        return src, False, result.stderr.strip() or 'unknown error'

def main():
    files = [f for f in UPLOADS.iterdir() if f.suffix.lower() in EXTS]
    total = len(files)
    print(f'Found {total} files to convert (jpg/jpeg/png → webp)')

    ok = fail = skip = 0
    failures = []

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(convert, f): f for f in files}
        for i, future in enumerate(as_completed(futures), 1):
            src, success, msg = future.result()
            if success:
                if 'skipped' in msg:
                    skip += 1
                else:
                    ok += 1
            else:
                fail += 1
                failures.append(f'{src.name}: {msg}')
            if i % 200 == 0 or i == total:
                print(f'  {i}/{total} — converted:{ok} skipped:{skip} failed:{fail}')

    print(f'\nConversion done: {ok} converted, {skip} skipped, {fail} failed')
    if failures:
        print('Failures:')
        for f in failures[:20]:
            print(f'  {f}')

    # Rewrite references in markdown posts
    print('\nRewriting image references in markdown posts...')
    md_files = list(BLOG.glob('*.md')) + list(BLOG.glob('*.mdx'))
    updated = 0
    for md in md_files:
        text = md.read_text(encoding='utf-8')
        new_text = text
        for ext in ('.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'):
            # Only replace within wp-uploads paths
            import re
            new_text = re.sub(
                r'(/images/wp-uploads/[^\s\)\]"\']+)' + re.escape(ext),
                r'\1.webp',
                new_text
            )
        if new_text != text:
            md.write_text(new_text, encoding='utf-8')
            updated += 1

    print(f'Updated {updated} markdown files')

if __name__ == '__main__':
    main()
