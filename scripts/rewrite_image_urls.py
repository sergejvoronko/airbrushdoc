#!/usr/bin/env python3
"""Rewrite wp-content/uploads URLs in converted MD posts to local /images/wp-uploads/ paths."""
import re
from pathlib import Path

BLOG = Path('/home/sergej/Downloads/airbrushdoc/src/content/blog')
WP_BASE = 'https://airbrushdoc.com/wp-content/uploads'
LOCAL_BASE = '/images/wp-uploads'

# Also handle scaled/resized variants — strip -NNNxNNN suffix before extension
SIZE_RE = re.compile(r'-\d+x\d+(\.\w+)$')

def localise(url):
    if WP_BASE not in url:
        return url
    fname = url.split('/')[-1]
    # Strip query strings
    fname = fname.split('?')[0]
    return f'{LOCAL_BASE}/{fname}'

total_files = 0
total_replacements = 0

for md in sorted(BLOG.glob('*.md')):
    text = md.read_text(encoding='utf-8')
    new_text = re.sub(
        r'https://airbrushdoc\.com/wp-content/uploads/[^\s\)"\']+',
        lambda m: localise(m.group(0)),
        text
    )
    count = text.count(WP_BASE) - new_text.count(WP_BASE)
    if count:
        md.write_text(new_text, encoding='utf-8')
        total_replacements += count
        total_files += 1

print(f'Rewrote {total_replacements} URLs across {total_files} files')
