#!/usr/bin/env python3
"""Convert WordPress WXR export to Astro MDX files."""
import xml.etree.ElementTree as ET
import re, os, sys, html, math
from pathlib import Path
from datetime import datetime

WXR  = Path('/home/sergej/Downloads/airbrushdoc-assets/airbrushdoccom.WordPress.2026-04-28.xml')
OUT  = Path('/home/sergej/Downloads/airbrushdoc/src/content/blog')
OUT.mkdir(parents=True, exist_ok=True)

NS = {
    'wp':      'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'dc':      'http://purl.org/dc/elements/1.1/',
}

def reading_time(text):
    words = len(re.findall(r'\w+', text))
    return max(1, math.ceil(words / 200))

def get_meta(item, key):
    for m in item.findall('wp:postmeta', NS):
        k = m.find('wp:meta_key', NS)
        v = m.find('wp:meta_value', NS)
        if k is not None and k.text == key and v is not None:
            return v.text or ''
    return ''

def html_to_md(raw):
    if not raw:
        return ''
    text = html.unescape(raw)

    # Remove WP block comments
    text = re.sub(r'<!-- /?wp:[^>]*?-->', '', text)

    # Gallery blocks — convert to placeholder
    text = re.sub(
        r'<figure[^>]*class="[^"]*wp-block-gallery[^"]*"[^>]*>.*?</figure>',
        '\n[GALLERY]\n',
        text, flags=re.DOTALL
    )

    # Figure with img
    def fig(m):
        src = re.search(r'src="([^"]+)"', m.group(0))
        alt = re.search(r'alt="([^"]*)"', m.group(0))
        cap = re.search(r'<figcaption[^>]*>(.*?)</figcaption>', m.group(0), re.DOTALL)
        s = src.group(1) if src else ''
        a = html.unescape(alt.group(1)) if alt else ''
        c = re.sub('<[^>]+>', '', cap.group(1)).strip() if cap else ''
        if c:
            return f'\n![{a}]({s})\n*{c}*\n'
        return f'\n![{a}]({s})\n'
    text = re.sub(r'<figure[^>]*>.*?</figure>', fig, text, flags=re.DOTALL)

    # img tags
    text = re.sub(r'<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*/?>',
                  lambda m: f'![{html.unescape(m.group(2))}]({m.group(1)})', text)
    text = re.sub(r'<img[^>]+src="([^"]+)"[^>]*/?>',
                  lambda m: f'![]({m.group(1)})', text)

    # Headings
    for n in range(6, 0, -1):
        text = re.sub(rf'<h{n}[^>]*>(.*?)</h{n}>', lambda m, n=n: '\n' + '#'*n + ' ' + re.sub('<[^>]+>', '', m.group(1)).strip() + '\n', text, flags=re.DOTALL)

    # Bold/italic
    text = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', text, flags=re.DOTALL)
    text = re.sub(r'<b[^>]*>(.*?)</b>', r'**\1**', text, flags=re.DOTALL)
    text = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', text, flags=re.DOTALL)
    text = re.sub(r'<i[^>]*>(.*?)</i>', r'*\1*', text, flags=re.DOTALL)

    # Links
    text = re.sub(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
                  lambda m: f'[{re.sub("<[^>]+>", "", m.group(2)).strip()}]({m.group(1)})', text, flags=re.DOTALL)

    # Lists
    text = re.sub(r'<ul[^>]*>(.*?)</ul>', lambda m: m.group(1) + '\n', text, flags=re.DOTALL)
    text = re.sub(r'<ol[^>]*>(.*?)</ol>', lambda m: m.group(1) + '\n', text, flags=re.DOTALL)
    text = re.sub(r'<li[^>]*>(.*?)</li>', lambda m: '- ' + re.sub('<[^>]+>', '', m.group(1)).strip() + '\n', text, flags=re.DOTALL)

    # Blockquote
    text = re.sub(r'<blockquote[^>]*>(.*?)</blockquote>',
                  lambda m: '\n> ' + re.sub('<[^>]+>', '', m.group(1)).strip().replace('\n', '\n> ') + '\n',
                  text, flags=re.DOTALL)

    # Code
    text = re.sub(r'<pre[^>]*><code[^>]*>(.*?)</code></pre>',
                  lambda m: '\n```\n' + html.unescape(m.group(1)).strip() + '\n```\n', text, flags=re.DOTALL)
    text = re.sub(r'<code[^>]*>(.*?)</code>',
                  lambda m: '`' + html.unescape(m.group(1)) + '`', text, flags=re.DOTALL)

    # Tables
    def table(m):
        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', m.group(0), re.DOTALL)
        md = []
        for i, row in enumerate(rows):
            cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.DOTALL)
            cells = [re.sub('<[^>]+>', '', c).strip() for c in cells]
            md.append('| ' + ' | '.join(cells) + ' |')
            if i == 0:
                md.append('| ' + ' | '.join(['---'] * len(cells)) + ' |')
        return '\n' + '\n'.join(md) + '\n'
    text = re.sub(r'<table[^>]*>.*?</table>', table, text, flags=re.DOTALL)

    # Paragraphs
    text = re.sub(r'<p[^>]*>(.*?)</p>', lambda m: '\n' + re.sub('<[^>]+>', '', m.group(1)).strip() + '\n', text, flags=re.DOTALL)
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<hr[^>]*/?>',  '\n---\n', text)

    # Strip remaining tags
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)

    # Collapse whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def safe_slug(s):
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9\-]', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

def yaml_str(s):
    if not s:
        return '""'
    s = s.replace('\\', '\\\\').replace('"', '\\"')
    return f'"{s}"'

tree = ET.parse(WXR)
root = tree.getroot()
channel = root.find('channel')
items = channel.findall('item')

posts = [i for i in items
         if i.find('wp:post_type', NS) is not None
         and i.find('wp:post_type', NS).text == 'post'
         and i.find('wp:status', NS) is not None
         and i.find('wp:status', NS).text == 'publish']

print(f'Found {len(posts)} published posts')

written = 0
for item in posts:
    title_el = item.find('title')
    title = html.unescape(title_el.text or '') if title_el is not None else 'Untitled'

    slug_el = item.find('wp:post_name', NS)
    slug = slug_el.text.strip() if slug_el is not None and slug_el.text else safe_slug(title)

    date_el = item.find('wp:post_date', NS)
    try:
        pub = datetime.strptime(date_el.text.strip(), '%Y-%m-%d %H:%M:%S') if date_el is not None else datetime.now()
    except:
        pub = datetime.now()
    pub_str = pub.strftime('%Y-%m-%d')

    content_el = item.find('content:encoded', NS)
    raw_content = content_el.text or '' if content_el is not None else ''
    md_content = html_to_md(raw_content)

    excerpt_el = item.find('excerpt:encoded', NS)
    excerpt = ''
    if excerpt_el is not None and excerpt_el.text:
        excerpt = re.sub('<[^>]+>', '', html.unescape(excerpt_el.text)).strip()
    if not excerpt and md_content:
        # First real paragraph
        for line in md_content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('!') and not line.startswith('['):
                excerpt = line[:160]
                break

    # SEO description from Rank Math
    seo_desc = get_meta(item, 'rank_math_description') or get_meta(item, '_yoast_wpseo_metadesc') or excerpt
    seo_desc = seo_desc[:160] if seo_desc else ''

    # Categories
    cats = [c.text for c in item.findall('category') if c.get('domain') == 'category' and c.text]
    category = safe_slug(cats[0]) if cats else 'general'

    # Tags
    tags = [t.text for t in item.findall('category') if t.get('domain') == 'post_tag' and t.text]

    # Featured image URL from meta
    thumb_id = get_meta(item, '_thumbnail_id')
    hero_image = ''
    if thumb_id:
        for att in items:
            att_type = att.find('wp:post_type', NS)
            att_id   = att.find('wp:post_id', NS)
            if att_type is not None and att_type.text == 'attachment' and att_id is not None and att_id.text == thumb_id:
                url_el = att.find('wp:attachment_url', NS)
                if url_el is not None and url_el.text:
                    fname = url_el.text.split('/')[-1]
                    hero_image = f'/images/wp-uploads/{fname}'
                break

    rt = reading_time(md_content)

    # FAQs from Rank Math
    faq_meta = get_meta(item, 'rank_math_rich_snippet_faq')
    faqs_yaml = ''
    if faq_meta:
        qs = re.findall(r'"question"\s*:\s*"([^"]+)"', faq_meta)
        ans = re.findall(r'"answer"\s*:\s*"([^"]+)"', faq_meta)
        if qs and ans:
            lines = []
            for q, a in zip(qs, ans):
                lines.append(f'  - q: {yaml_str(q)}')
                lines.append(f'    a: {yaml_str(a)}')
            faqs_yaml = 'faqs:\n' + '\n'.join(lines)

    tags_yaml = '[' + ', '.join(f'"{t}"' for t in tags) + ']' if tags else '[]'

    frontmatter = f'''---
title: {yaml_str(title)}
description: {yaml_str(seo_desc)}
pubDate: {pub_str}
category: "{category}"
tags: {tags_yaml}
readingTime: {rt}
draft: false'''

    if hero_image:
        frontmatter += f'\nheroImage: "{hero_image}"'
    if faqs_yaml:
        frontmatter += f'\n{faqs_yaml}'

    frontmatter += '\n---\n'

    out_file = OUT / f'{slug}.md'
    out_file.write_text(frontmatter + '\n' + md_content + '\n', encoding='utf-8')
    written += 1

print(f'Written {written} MDX files to {OUT}')
