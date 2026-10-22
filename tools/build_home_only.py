"""Build a home-page-only copy of the site for roamancetheholidays.com (Hostinger).

Usage:  python tools/build_pages.py .  &&  python tools/build_home_only.py
Output: dist-home/  (upload its contents to public_html)  +  dist-home.zip

Links to pages that don't exist on the home-only site are rewritten to sections of the home page,
and the enquiry form from the Contact page is added to the home page so "Plan My Holiday" works.
"""
import os, re, shutil, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'dist-home')
DOMAIN = 'https://roamancetheholidays.com/'

html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
contact = open(os.path.join(ROOT, 'contact-us', 'index.html'), encoding='utf-8').read()

def sub1(pattern, repl, text, flags=0):
    new, n = re.subn(pattern, repl, text, count=1, flags=flags)
    assert n, pattern
    return new

# 1. section anchors the menu can scroll to
html = sub1(r'<section class="pad wrap" data-sd-bg="light">\n  <p class="eyebrow center"', '<section class="pad wrap" data-sd-bg="light" id="about">\n  <p class="eyebrow center"', html)
html = sub1(r'<section class="theme-dark" data-sd-bg="dark">', '<section class="theme-dark" data-sd-bg="dark" id="journeys">', html)
html = sub1(r'<section class="pad" data-sd-bg="light">\n  <h2 class="drift', '<section class="pad" data-sd-bg="light" id="destinations">\n  <h2 class="drift', html)

# 2. enquiry form + contact details from the Contact page, placed before the FAQ
form = re.search(r'<section class="wrap" data-sd-bg="light" style="padding-bottom:clamp\(72px,13vh,170px\)">.*?</section>', contact, re.S).group(0)
form = form.replace('<section class="wrap" data-sd-bg="light"', '<section class="wrap pad" data-sd-bg="light" id="contact"', 1)
form = form.replace('style="padding-bottom:clamp(72px,13vh,170px)"', '', 1).replace('../assets/', './assets/')
form = re.sub(r'Please read our <a href="[^"]*">Privacy Policy</a>\.', 'We use your details only to respond to your enquiry.', form)
html = sub1(r'(<section class="pad wrap" data-sd-bg="light" id="faq">)', form.replace('\\', '\\\\') + '\n\n' + r'\1', html)

# 3. rewrite links to pages that aren't on this site
links = {
    './about-us/': '#about', './gallery/': '#destinations', './contact-us/': '#contact',
    './tour-packages/': '#journeys',
}
html = re.sub(r'href="\./tour-packages/#[a-z]+"', 'href="#contact"', html)   # "Explore India" etc. → enquire
for a, b in links.items():
    html = html.replace(f'href="{a}"', f'href="{b}"')
html = html.replace('href="./"', 'href="#main"')
html = re.sub(r'<div><h4>Policies</h4>.*?</div>', '', html, count=1, flags=re.S)
html = re.sub(r'<p class="credit wrap"[^>]*>Europe.*?</p>', lambda m: m.group(0), html)

# 4. production head: canonical + absolute social image
html = html.replace('<!-- Add <link rel="canonical" href="https://YOUR-DOMAIN/"> once the production domain is confirmed -->',
                    f'<link rel="canonical" href="{DOMAIN}">\n<meta property="og:url" content="{DOMAIN}">')
html = html.replace('content="./assets/img/og-cover.jpg"', f'content="{DOMAIN}assets/img/og-cover.jpg"')

leftover = re.findall(r'href="\./(?!assets/)[^"]*"', html)
assert not leftover, leftover

# 5. copy only the files the home page uses
if os.path.isdir(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
used = set(re.findall(r'(?:src|href|content)="(?:\./|' + re.escape(DOMAIN) + r')(assets/[^"?#]+)', html))
used |= {'assets/img/logo.svg', 'assets/img/CREDITS.md'}
for rel in sorted(used):
    src = os.path.join(ROOT, rel); dst = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst)
open(os.path.join(OUT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {DOMAIN}sitemap.xml\n')
open(os.path.join(OUT, 'sitemap.xml'), 'w').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'  <url><loc>{DOMAIN}</loc></url>\n</urlset>\n')
open(os.path.join(OUT, '.htaccess'), 'w').write('''# Roamance — Hostinger (Apache/LiteSpeed)
DirectoryIndex index.html
ErrorDocument 404 /index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>
''')

zpath = os.path.join(ROOT, 'dist-home.zip')
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, _, files in os.walk(OUT):
        for f in files:
            full = os.path.join(base, f); z.write(full, os.path.relpath(full, OUT))
print('files:', sum(len(f) for _, _, f in os.walk(OUT)), '| zip KB:', os.path.getsize(zpath) // 1024)
