#!/usr/bin/env python3
"""Download all media attachments from live WordPress site."""
import xml.etree.ElementTree as ET
import urllib.request, urllib.error, os, sys, time
from pathlib import Path

WXR = Path('/home/sergej/Downloads/airbrushdoc-assets/airbrushdoccom.WordPress.2026-04-28.xml')
OUT = Path('/home/sergej/Downloads/airbrushdoc/public/images/wp-uploads')
OUT.mkdir(parents=True, exist_ok=True)

NS = {'wp': 'http://wordpress.org/export/1.2/'}

tree = ET.parse(WXR)
root = tree.getroot()
channel = root.find('channel')
items = channel.findall('item')

attachments = []
for item in items:
    pt = item.find('wp:post_type', NS)
    if pt is None or pt.text != 'attachment':
        continue
    url_el = item.find('wp:attachment_url', NS)
    if url_el is not None and url_el.text:
        attachments.append(url_el.text.strip())

print(f'Found {len(attachments)} attachments')

headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; AirbrushDOC-migration/1.0)',
}

skipped = downloaded = failed = 0
for i, url in enumerate(attachments, 1):
    fname = url.split('/')[-1]
    # Strip WP size suffixes for deduplication (keep originals only)
    dest = OUT / fname
    if dest.exists():
        skipped += 1
        continue
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read()
        dest.write_bytes(data)
        downloaded += 1
        if downloaded % 50 == 0:
            print(f'  [{i}/{len(attachments)}] downloaded {downloaded}, skipped {skipped}, failed {failed}')
    except Exception as e:
        failed += 1
        if failed <= 20:
            print(f'  FAIL {url}: {e}')
    time.sleep(0.05)

print(f'\nDone — downloaded: {downloaded}, skipped: {skipped}, failed: {failed}')
print(f'Output: {OUT}')
