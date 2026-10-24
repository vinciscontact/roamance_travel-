import os, re, sys
ROOT = sys.argv[1]
PAPER, CREAM, CHARCOAL = '#fffdf2', '#fbde22', '#2e3231'
INK = CREAM   # default torn-edge colour = the cream band it leads into

NAV = [('/', 'Home'), ('/about-us/', 'About Us'), ('/tour-packages/', 'Tour Packages'), ('/gallery/', 'Gallery'), ('/contact-us/', 'Contact Us')]

def img(name, art, alt, extra=''):
    lazy = '' if 'loading=' in extra else 'loading="lazy" '
    return (f'<img src="/assets/img/{name}.jpg" alt="{alt}" data-art="{art}" {lazy}decoding="async" '
            f'onerror="this.dataset.missing=1"{(" " + extra) if extra else ""}>')

def torn(side, seed, color=INK):
    m = 'margin-bottom:-1px' if side == 'bottom' else 'margin-top:-1px'
    return f'<div data-sd-torn="{side}" data-sd-torn-seed="{seed}" style="color:{color};{m}"></div>'

def plus(attr='data-sd-expand-icon'):
    return f'<span class="plus" aria-hidden="true"><i {attr}></i></span>'

def faq(items):
    out = []
    for q, a, wrap in items:
        w = f' data-biz-wrap="{wrap}"' if wrap else ''
        out.append(f'''      <div class="acc" data-sd-acc{w}><button data-sd-acc-btn aria-expanded="false">{q} {plus("data-sd-acc-icon")}</button>
        <div data-sd-acc-body><p data-sd-acc-p>{a}</p></div></div>''')
    return '\n'.join(out)

FAQ = {
  'what': ('What is Roamance Trips and Holidays?', 'Roamance Trips and Holidays is a travel business focused on thoughtfully planned holidays, personal attention and clear communication. Our approach puts travellers and their experiences at the centre of holiday planning.', ''),
  'types': ('What types of holidays can I enquire about?', 'You can enquire about domestic holidays, international trips, family holidays, honeymoons, solo travel and luxury escapes. <a href="/contact-us/">Contact our team</a> to discuss availability and suitable options.', ''),
  'quote': ('How do I request a holiday quotation?', 'Share your preferred destination, departure city, travel dates, number of travellers and approximate budget. These details help us discuss suitable options and prepare a relevant quotation.', ''),
  'custom': ('Can I request a customised itinerary?', 'Yes. Tell us your preferred destinations, pace, accommodation preferences and experiences. Our team will discuss the arrangements available for your trip.', ''),
  'incl': ('What is included in a tour package?', 'Inclusions vary by package. Refer to your quotation for accommodation, transport, meals, activities and other arrangements. Review the exclusions and booking terms before confirming.', ''),
  'cost': ('How much does a holiday package cost?', 'The cost depends on your destination, dates, trip duration, number of travellers, accommodation and selected arrangements. <a href="/contact-us/">Request a quotation</a> based on your travel preferences.', ''),
  'visa': ('Are flights and visa fees included?', 'Check your specific quotation. Flights, visa fees, insurance, taxes and other charges should be identified as included, excluded or separately payable.', ''),
  'where': ('Where is Roamance Trips and Holidays located?', 'Roamance Trips and Holidays is located at <span data-biz="fullAddress"></span>. Call us on <span data-biz="phone" data-fallback="the number on our contact page"></span><span data-biz-wrap="email"> or email <span data-biz="email"></span></span> for holiday enquiries.', 'address'),
}

def faq_section(keys, title='Questions, Answered', bg='light'):
    return f'''<section class="pad wrap" data-sd-bg="{bg}" id="faq">
  <div class="faq">
    <div data-sd-reveal-group>
      <p class="eyebrow" data-sd-reveal="lines">Frequently asked</p>
      <h2 class="h2-s" data-sd-reveal="words" style="margin-top:14px">{title}</h2>
    </div>
    <div>
{faq([FAQ[k] for k in keys])}
    </div>
  </div>
</section>'''

def head(title, desc, path, noindex=False):
    robots = '<meta name="robots" content="noindex, follow">' if noindex else '<meta name="robots" content="index, follow">'
    return f'''<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
{robots}
<meta name="theme-color" content="{PAPER}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Roamance Trips and Holidays">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="/assets/img/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<!-- Add <link rel="canonical" href="https://YOUR-DOMAIN{path}"> once the production domain is confirmed -->
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%232e3231'/%3E%3Ctext x='32' y='45' text-anchor='middle' font-family='Arial,sans-serif' font-size='38' fill='%23fbde22'%3ER%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/sd-base.css">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>'''

LOGO = ('<svg class="lw-bird" data-flip aria-hidden="true"><use href="/assets/img/logo-sprite.svg#bird"/></svg>'
        '<span class="lw-text" data-flip><svg class="lw-word" aria-hidden="true"><use href="/assets/img/logo-sprite.svg#word"/></svg>'
        '<svg class="lw-tag" aria-hidden="true"><use href="/assets/img/logo-sprite.svg#tag"/></svg></span>')

def chrome(path, pre_line):
    links = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == path else ''
        links.append(f'<a href="{href}"{cur} class="swap" data-sd-hover-swap><span data-sd-hover-text>{label}</span><span data-sd-hover-text aria-hidden="true">{label}</span></a>')
    menu = ''.join(f'<a href="{h}" data-sd-menu-h>{l}</a>' for h, l in NAV)
    return f'''
<!-- PRELOADER (first visit only) -->
<div class="pre theme-dark" data-sd-preloader>
  <div>
    <a href="/" class="logo" data-sd-preloader-logo aria-label="Roamance Trips and Holidays — home">{LOGO}</a>
    <p class="eyebrow pre-line" data-sd-preloader-p>{pre_line}</p>
  </div>
  <span class="pre-pct" data-sd-preloader-percent>0%</span>
</div>

<header data-sd-header data-sd-theme-target>
  <div data-sd-header-bg></div>
  <div class="hdr">
    <div class="logo-slot" data-sd-logo-slot></div>
    <nav aria-label="Main">{''.join(links)}</nav>
    <div class="hdr-cta">
      <a href="/contact-us/" class="btn" data-sd-magnetic="20"><span data-sd-magnetic-inner>Plan My Holiday</span></a>
      <button class="burger" data-sd-menu-open aria-label="Open menu"><i data-sd-burger="top"></i><i data-sd-burger="mid"></i><i data-sd-burger="bot"></i></button>
    </div>
  </div>
</header>
'''

def footer(extra_js=''):
    links = ''.join(f'<li><a href="{h}">{l}</a></li>' for h, l in NAV)
    menu = ''.join(f'<a href="{h}" data-sd-menu-h>{l}</a>' for h, l in NAV)
    return f'''
{torn('bottom', 27, CHARCOAL)}
<footer class="foot theme-charcoal" data-sd-bg="charcoal">
  <div class="foot-content wrap">
    <div class="foot-cols">
      <div>
        <div class="foot-logo" aria-hidden="true"><svg class="lw-bird"><use href="/assets/img/logo-sprite.svg#bird"/></svg><svg class="lw-word"><use href="/assets/img/logo-sprite.svg#word"/></svg></div>
        <p data-biz-wrap="phone email"><a data-biz-wrap="phone" data-biz-href="phone" data-biz="phone"></a><span data-biz-wrap="phone"> &nbsp;·&nbsp; </span><a data-biz-wrap="email" data-biz-href="email" data-biz="email"></a></p>
        <p data-biz-wrap="address" data-biz="fullAddress"></p>
      </div>
      <div><h4>Explore</h4><ul data-sd-dim-group>{links}</ul></div>
      <div><h4>Policies</h4><ul data-sd-dim-group><li><a href="/privacy-policy/">Privacy Policy</a></li><li><a href="/terms-and-conditions/">Terms &amp; Conditions</a></li><li><a href="/cancellation-refund-policy/">Cancellation &amp; Refund Policy</a></li></ul></div>
    </div>
    <div class="foot-base"><span>© <span data-year></span> Roamance Trips and Holidays</span><span>Designed by <a class="credit-link" href="https://vincisglobal.com" target="_blank" rel="noopener" data-sd-no-transition>TheVincis</a></span></div>
  </div>
</footer>

<div data-sd-menu class="theme-charcoal" role="dialog" aria-label="Menu">
  <div class="menu-inner">
    <nav data-sd-dim-group aria-label="Menu">{menu}</nav>
    <div class="menu-meta" data-sd-menu-ctn>
      <a data-biz-wrap="phone" data-biz-href="phone" data-biz="phone"></a>
      <a data-biz-wrap="email" data-biz-href="email" data-biz="email"></a>
    </div>
  </div>
</div>

<div class="tip" data-sd-tip="open">Open</div>
<div class="tip" data-sd-tip="drag">Drag</div>
<div class="sd-transition" data-sd-transition><div data-sd-transition-over></div></div>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/CustomEase.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Flip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.15/dist/lenis.min.js"></script>
<script src="/assets/js/config.js"></script>
<script src="/assets/js/sd-engine.js"></script>
{extra_js}<script src="/assets/js/site.js"></script>
</body>
</html>
'''

# Relative links, so the site works at a domain root AND in a sub-folder (GitHub Pages project sites).
# 404.html can be served at any depth, so it gets a <base> pointing at the site root instead.
BASE_SCRIPT = ('<script>document.write(\'<base href="\'+(location.hostname.endsWith(".github.io")'
               '?"/"+location.pathname.split("/")[1]+"/":"/")+\'">\')</script>')

import hashlib
def _ver(rel):
    with open(os.path.join(ROOT, rel), 'rb') as f: return hashlib.md5(f.read()).hexdigest()[:8]
ASSETS = ['assets/css/sd-base.css', 'assets/css/site.css', 'assets/js/config.js', 'assets/js/sd-engine.js', 'assets/js/site.js', 'assets/js/world-dots.js', 'assets/js/hero.js', 'assets/img/logo-sprite.svg']

def relativise(html, path):
    for rel in ASSETS:   # cache-busting: visitors get fresh CSS/JS whenever a file changes
        html = html.replace(f'"/{rel}"', f'"/{rel}?v={_ver(rel)}"').replace(f'"/{rel}#', f'"/{rel}?v={_ver(rel)}#')
    depth = path.strip('/').count('/') + 1 if path.strip('/') and path != '/404' else 0
    prefix = '../' * depth if depth else './'
    html = re.sub(r'(href|src|content)="/(?!/)', lambda m: f'{m.group(1)}="{prefix}', html)
    if path == '/404':
        html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + BASE_SCRIPT, 1)
    return html

def inline_sprite(html):
    """Embed the logo symbols in the page so the loader shows the logo instantly (no extra request)."""
    sprite = open(os.path.join(ROOT, 'assets/img/logo-sprite.svg'), encoding='utf-8').read()
    sprite = sprite.replace('<svg xmlns="http://www.w3.org/2000/svg">', '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false">')
    sprite = re.sub(r'<!--.*?-->\n?', '', sprite)
    html = html.replace('<body>\n', '<body>\n' + sprite + '\n', 1)
    return html.replace('href="/assets/img/logo-sprite.svg#', 'href="#')

def page(path, title, desc, pre_line, body, noindex=False):
    extra = ('<script src="/assets/js/world-dots.js"></script>\n<script src="/assets/js/hero.js"></script>\n') if path == '/' else ''
    html = head(title, desc, path, noindex) + chrome(path, pre_line) + '\n<main id="main">\n' + body + '\n</main>\n' + footer(extra)
    return relativise(inline_sprite(html), path)

def cta_band(h, p, btn, href='/contact-us/', bg='light'):
    cls = ' theme-dark' if bg == 'dark' else ''
    return f'''<section class="pad wrap cta-band{cls}" data-sd-bg="{bg}" data-sd-reveal-group>
  <h2 data-sd-reveal="words">{h}</h2>
  <p class="lede" data-sd-reveal="lines">{p}</p>
  <div class="btn-row" data-sd-reveal="block"><a class="btn" href="{href}" data-sd-magnetic="25"><span data-sd-magnetic-inner>{btn}</span></a></div>
</section>'''

# ------------------------------------------------------------------ HOME
CATS = [
  ('Domestic Holidays', 'India, up close', 'Hill stations, heritage towns, quiet beaches and backwaters, at a pace that suits you.', 'Enquire', '/contact-us/', 'cat-domestic', 'hills', 'Traveller standing on a tea plantation hill at sunrise'),
  ('International Holidays', 'Beyond India', 'New cultures and landscapes, planned around your interests and the time you have.', 'Enquire', '/contact-us/', 'cat-international', 'alps', 'Lakeside alpine village with a church spire beneath misty mountains'),
  ('Honeymoon &amp; Romantic Getaways', 'Just the two of you', 'Peaceful retreats or new discoveries, to begin your next chapter together.', 'Enquire', '/contact-us/', 'cat-honeymoon', 'couple', 'Couple walking hand in hand along the shore at sunset'),
  ('Family Holidays', 'Everyone, together', 'Plans that work for every age in the group, with room for laughter and rest.', 'Enquire', '/contact-us/', 'cat-family', 'family', 'Family watching the waves together on a beach'),
  ('Personalised Holidays', 'Built from scratch', 'Share your destination, dates and budget, and we will shape the itinerary with you.', 'Enquire', '/contact-us/', 'cat-personalised', 'plan', 'Hands marking a route on a city map beside glasses and pencils'),
]
cards = []
for i, (name, h, p, cta, href, im, art, alt) in enumerate(CATS, 1):
    cards.append(f'''        <li class="card theme-charcoal" data-sd-hscroll-card data-sd-expand data-sd-tip-btn="open" tabindex="0">
          {img(im, art, alt, 'loading="eager"')}
          <div class="card-top"><span class="num eyebrow">0{i}</span>{plus()}</div>
          <h3 data-sd-expand-name>{name}</h3>
          <div class="card-info" data-sd-expand-info>
            <h3 data-sd-expand-h>{h}</h3><div class="rule" data-sd-expand-rule></div>
            <p data-sd-expand-p>{p}</p>
            <a class="link" href="{href}">{cta}</a>
            <span class="plus" aria-hidden="true"><i style="transform:translate(-50%,-50%) rotate(0deg)"></i></span>
          </div>
        </li>''')

DESTS = [
  ('Kerala', 'India', 'domestic', 'dest-kerala', 'backwater', 'Houseboat travelling through palm-lined Kerala backwaters'),
  ('Goa', 'India', 'domestic', 'dest-goa', 'beach', 'Palm-fringed beach in Goa at golden hour'),
  ('Kashmir', 'India', 'domestic', 'dest-kashmir', 'snow', 'Colourful shikaras moored on Dal Lake, Kashmir'),
  ('Bali', 'International', 'international', 'dest-bali', 'hills', 'Green rice terraces in Bali surrounded by palms'),
  ('Europe', 'International', 'international', 'dest-europe', 'alps', 'Village between steep mountains and a lake in Europe'),
  ('Maldives', 'International', 'international', 'dest-maldives', 'island', 'Overwater villas above a turquoise Maldives lagoon'),
]
dests = '\n'.join(f'''    <a class="dest" href="/tour-packages/#{sec}"><div class="frame">{img(im, art, alt)}</div><div class="dest-meta"><h3>{n}</h3><span>{reg}</span></div></a>''' for n, reg, sec, im, art, alt in DESTS)

REASONS = [
  ('People Before Profit', 'Your happiness and experience guide the way we plan your journey.'),
  ('Clarity at Every Step', 'Understand your itinerary, package inclusions, exclusions and costs before you book.'),
  ('Thoughtful Personal Attention', 'We listen to your preferences and help you make informed travel choices.'),
  ('Luxury With a Heart', 'For us, a special holiday combines comfort, memorable experiences and the reassurance of being cared for.'),
]
reasons = '\n'.join(f'''      <div class="reason" data-sd-reveal="block"><span class="idx" data-sd-index-text></span><h3>{h}</h3><p>{p}</p></div>''' for h, p in REASONS)

home = f'''<section class="hero-area theme-dark" data-sd-hero-out data-sd-bg="dark">
  <div class="hero-sticky">
    <div class="hero-card" data-sd-hero-card data-hero-map>
      <div class="hero-media" data-sd-intro-media><canvas id="hero-map" aria-hidden="true"></canvas></div>
      <div class="eagle" data-eagle aria-hidden="true">
        <svg viewBox="612 8 342 455"><path class="eagle-tail" data-eagle-tail d="M786.0,453.8 768.2,428.0 762.6,421.0 760.0,416.0 709.7,343.0 709.3,341.0 714.0,337.9 799.0,292.6 804.0,290.8 804.5,295.0 803.5,296.0 803.5,304.0 802.5,305.0 802.5,314.0 801.5,315.0 801.5,323.0 800.5,324.0 800.5,332.0 799.5,333.0 799.5,341.0 798.5,342.0 798.5,351.0 797.5,352.0 797.5,360.0 796.5,361.0 796.5,369.0 795.5,370.0 795.5,378.0 794.5,379.0 794.5,388.0 793.5,389.0 793.5,397.0 792.5,398.0 792.5,406.0 791.5,407.0 791.5,415.0 790.5,416.0 790.5,425.0 789.5,426.0 789.5,434.0 788.5,435.0 788.5,443.0 787.5,444.0 787.4,452.0 786.0,453.8Z"/><path class="eagle-wing" data-eagle-wing d="M836.0,337.1 834.0,337.7 833.4,336.0 833.4,324.0 832.6,314.0 830.2,297.0 828.5,290.0 828.5,286.0 826.0,274.0 820.5,252.0 813.3,229.0 805.1,208.0 796.5,189.0 785.3,168.0 772.4,147.0 757.3,126.0 743.3,109.0 727.5,92.0 708.0,73.8 690.0,59.0 668.0,43.3 648.0,30.7 619.1,15.0 617.4,14.0 618.0,13.2 625.0,14.7 651.0,22.9 691.0,38.6 723.0,53.9 757.0,73.9 770.0,82.7 787.0,95.6 808.8,115.0 828.0,136.1 837.1,148.0 848.8,166.0 850.0,166.7 865.0,154.9 878.0,147.6 890.0,143.8 902.0,143.0 908.0,143.7 915.0,145.9 924.9,151.0 936.0,160.4 946.2,173.0 948.0,177.0 935.0,175.0 926.0,175.4 920.0,177.7 915.5,182.0 893.1,234.0 872.5,277.0 853.0,312.7 845.1,325.0 836.0,337.1ZM790.0,457.7 789.0,457.7 787.0,455.3 786.6,453.0 787.5,452.0 787.5,444.0 788.5,443.0 788.5,435.0 789.5,434.0 789.5,426.0 790.5,425.0 790.5,416.0 791.5,415.0 791.5,407.0 792.5,406.0 792.5,398.0 793.5,397.0 793.5,389.0 794.5,388.0 794.5,379.0 795.5,378.0 795.5,370.0 796.5,369.0 796.5,361.0 797.5,360.0 797.5,352.0 798.5,351.0 798.5,342.0 799.5,341.0 799.5,333.0 800.5,332.0 800.5,324.0 801.5,323.0 801.5,315.0 802.5,314.0 802.5,305.0 803.5,304.0 803.5,296.0 804.5,295.0 805.0,290.2 816.0,284.6 817.5,286.0 822.2,306.0 823.8,321.0 825.2,350.0 824.3,365.0 805.6,416.0 804.5,421.0 801.6,427.0 798.6,437.0 794.6,446.0 793.1,452.0 790.0,457.7Z"/></svg>
      </div>
      <p class="hero-hint eyebrow" aria-hidden="true"><span class="hint-desk">Move your cursor to guide the eagle</span><span class="hint-touch">Tap anywhere to guide the eagle</span></p>
    </div>
    <div class="hero-copy" data-sd-hero-stage>
      <div data-sd-hero-copy>
        <h1 data-sd-intro="h">Your Holidays,<br> Closer to Heart.</h1>
      </div>
      <div class="hero-side" data-sd-intro="ctn">
        <p class="lede">Domestic and international holidays, planned around the moments that matter to you.</p>
        <div class="btn-row"><a class="btn" href="/tour-packages/" data-sd-magnetic="20"><span data-sd-magnetic-inner>Explore Journeys</span></a><a class="btn ghost" href="/contact-us/">Plan My Holiday</a></div>
      </div>
    </div>
  </div>
</section>
{torn('top', 2, CREAM)}

<section class="pad wrap" data-sd-bg="light" id="about">
  <div class="grid2 intro">
    <div class="frame r-16x10">{img('home-intro', 'plan', 'Latte beside an open map, ready for travel planning')}</div>
    <div data-sd-reveal-group>
      <p class="eyebrow" data-sd-reveal="lines">Our approach</p>
      <h2 class="h2-s" data-sd-reveal="words">Every holiday begins with understanding you.</h2>
      <ul class="asks" data-sd-reveal="lines"><li>Where do you dream of going?</li><li>What makes a holiday special for you?</li><li>Who will be sharing it?</li></ul>
      <p data-sd-reveal="lines">Your answers shape the plan, from the places and the pace to the people it is for. We stay with you from the first enquiry to your return home.</p>
    </div>
  </div>
</section>
{torn('bottom', 3)}

<section class="theme-dark" data-sd-bg="dark" id="journeys">
  <div class="wrap" style="padding-top:clamp(52px,8vh,104px)">
    <h2 class="h2-s" data-sd-reveal="words" style="margin-bottom:0">Your Next Journey Starts Here</h2>
  </div>
  <section class="hs" data-sd-hscroll>
    <div class="sd-sticky">
      <ul data-sd-hscroll-track style="list-style:none;margin:0">
{chr(10).join(cards)}
      </ul>
    </div>
  </section>
</section>
{torn('top', 9)}

<section class="pad wrap" data-sd-bg="light" id="destinations">
  <h2 class="h2-s drift" data-sd-parallax="drift"><span>Popular</span><span>Destinations</span></h2>
  <div class="dest-grid" data-sd-slider-reveal>
{dests}
  </div>
</section>

<section data-sd-grow data-sd-bg="light" id="why">
  <div class="grow-title"><h2 data-sd-grow-title>Why Travel<br>With Roamance?</h2></div>
  <div class="grow-gap" data-sd-grow-gap></div>
  <div class="wrap" style="padding-bottom:clamp(52px,8vh,104px)">
    <div class="reasons" data-sd-reveal-group data-sd-index>
{reasons}
    </div>
  </div>
</section>

{faq_section(['custom', 'incl', 'cost', 'visa', 'where'])}
'''

# ------------------------------------------------------------------ ABOUT
about = f'''<section class="phero" data-sd-bg="light">
  <p class="eyebrow" data-sd-intro="p" style="margin-bottom:20px">About Roamance</p>
  <h1 data-sd-intro="h">More Than a Journey. A Family That Travels With You.</h1>
  <div class="phero-media" data-sd-intro-media>{img('about-hero', 'backwater', 'Lone rower crossing a calm lake at golden hour', 'loading="eager"')}</div>
</section>

<section class="pad wrap" data-sd-bg="light" style="padding-top:0">
  <div class="grid2 top">
    <div data-sd-reveal-group>
      <p class="eyebrow" data-sd-reveal="lines">01 — Our story</p>
      <h2 data-sd-reveal="words" style="margin-top:16px">Our Story</h2>
    </div>
    <div data-sd-reveal-group>
      <div class="rule" data-sd-reveal="rule"></div>
      <p class="lede" data-sd-reveal="lines">Roamance Trips and Holidays began with a simple intention: to give every traveller a memorable, high-quality travel experience rooted in genuine care.</p>
      <p data-sd-reveal="lines" style="margin-top:18px">We believe travel is about more than visiting places. It is about discovering the world, sharing precious moments and returning home with stories that stay with you.</p>
      <p data-sd-reveal="lines" style="margin-top:18px">Our purpose goes beyond a booking. We want every journey to reflect the trust you place in us.</p>
    </div>
  </div>
</section>
{torn('bottom', 5)}

<section class="pad wrap theme-dark" data-sd-bg="dark">
  <div class="grid2 top">
    <div class="frame r-3x4">{img('about-philosophy', 'family', 'Grandmother in a sari hugging her laughing granddaughter',)}</div>
    <div>
      <div data-sd-reveal-group>
        <p class="eyebrow" data-sd-reveal="lines">02 — Our philosophy</p>
        <h2 data-sd-reveal="words" style="margin-top:16px">People Before Profit</h2>
      </div>
      <p class="quote" style="text-align:left;margin:40px 0 0" data-sd-highlight>Every traveller matters to us.</p>
      <div data-sd-reveal-group style="margin-top:28px">
        <p data-sd-reveal="lines">When you choose Roamance, we want you to feel welcomed, valued and respected. We take the time to understand your expectations so we can help plan a holiday that reflects what matters most to you.</p>
        <p data-sd-reveal="lines" style="margin-top:18px">Your happiness is at the heart of why we do what we do.</p>
      </div>
    </div>
  </div>
</section>
{torn('top', 13)}

<section class="pad wrap" data-sd-bg="light">
  <div data-sd-reveal-group style="max-width:1100px">
    <p class="eyebrow" data-sd-reveal="lines">03 — Our promise</p>
    <h2 data-sd-reveal="words" style="margin-top:16px">Openness, Honesty and Clarity</h2>
  </div>
  <div class="grid2 top" style="margin-top:48px" data-sd-reveal-group>
    <p class="lede" data-sd-reveal="lines">Trust begins with clear information.</p>
    <div>
      <div class="rule" data-sd-reveal="rule" style="margin-top:0"></div>
      <p data-sd-reveal="lines">Your holiday is an investment of money, time and anticipation. You deserve to understand what you are paying for, what your package includes and which expenses may be additional.</p>
      <p data-sd-reveal="lines" style="margin-top:18px">We aim to explain our recommendations, communicate commitments clearly and help you make confident decisions before you travel.</p>
    </div>
  </div>
</section>

<section class="pad wrap" data-sd-bg="light" style="padding-top:clamp(24px,4vh,48px)">
  <div class="grid2 top">
    <div class="frame r-16x10">{img('about-luxury', 'island', 'Infinity pool overlooking the sea and a rocky headland')}</div>
    <div data-sd-reveal-group>
      <p class="eyebrow" data-sd-reveal="lines">04 — Luxury with a heart</p>
      <div class="rule" data-sd-reveal="rule"></div>
      <p class="lede" data-sd-reveal="lines">Luxury means different things to different travellers.</p>
      <p data-sd-reveal="lines" style="margin-top:18px">It may be a beautiful hotel, an extraordinary destination or a special experience. It may also be an unhurried itinerary, thoughtful arrangements and the comfort of knowing your preferences have been heard.</p>
      <p data-sd-reveal="lines" style="margin-top:18px">At Roamance, we believe personal attention and warm hospitality are essential parts of a memorable holiday.</p>
    </div>
  </div>
</section>

{torn('bottom', 33)}
<section class="pad wrap cta-band theme-dark" data-sd-bg="dark" data-sd-reveal-group>
  <p class="eyebrow" data-sd-reveal="lines">05 — Our intention</p>
  <h2 data-sd-reveal="words" style="margin-top:18px">One Family. Countless Journeys.</h2>
  <p class="lede" data-sd-reveal="lines">Whether you are planning a family holiday, honeymoon, solo adventure or international escape, our intention remains the same: to make your journey meaningful, trustworthy and memorable.</p>
  <p data-sd-reveal="lines" style="margin-top:18px">We want you to return with more than photographs — with happiness, beautiful stories and the desire to explore again.</p>
  <div class="btn-row" data-sd-reveal="block"><a class="btn" href="/contact-us/" data-sd-magnetic="25"><span data-sd-magnetic-inner>Plan Your Journey With Us</span></a></div>
</section>
'''

# ------------------------------------------------------------------ TOUR PACKAGES
PKS = [
  ('domestic', 'Domestic Tour Packages', 'Explore India’s landscapes, heritage and local experiences. Choose a relaxing break, a sightseeing holiday or a journey that combines discovery with time to unwind.', 'Enquire About Domestic Holidays', 'pkg-domestic', 'backwater', 'City Palace on Lake Pichola in Udaipur, with a boat in front', 'Kerala · Goa · Kashmir'),
  ('international', 'International Tour Packages', 'Discover destinations beyond India with a holiday that brings together your travel interests, available time and preferred experiences.', 'Enquire About International Holidays', 'pkg-international', 'alps', 'Cobbled old-town street in Europe with mountains beyond', 'Bali · Europe · Maldives'),
  ('honeymoon', 'Honeymoon Packages', 'Begin a new chapter with meaningful time together. Share your idea of the perfect honeymoon, and let us help you explore suitable destinations and experiences.', 'Plan Our Honeymoon', 'pkg-honeymoon', 'couple', 'Couple sitting together watching the sunset', ''),
  ('family', 'Family Holiday Packages', 'Bring everyone together for a holiday filled with shared experiences. Tell us your group size, age groups and preferences so we can help plan a suitable itinerary.', 'Plan Our Family Holiday', 'pkg-family', 'family', 'Family holding hands on a beach at sunset', ''),
  ('luxury', 'Luxury Holidays', 'Explore premium stays and carefully selected experiences with personal attention to the details that matter to you.', 'Discuss a Luxury Escape', 'pkg-luxury', 'island', 'Resort pool deck with loungers beside a wooden lodge', ''),
  ('customised', 'Customised Tour Packages', 'Have something specific in mind? Share your destination, departure city, dates, number of travellers and approximate budget. We will discuss the available options and help you shape your itinerary.', 'Request a Personalised Quote', 'pkg-customised', 'plan', 'Compass on a paper map among autumn leaves', ''),
]
def pk(i, d, dark=False):
    sid, h, p, cta, im, art, alt, tag = d
    tagline = f'<p class="eyebrow" data-sd-reveal="lines" style="margin-top:14px">{tag}</p>' if tag else ''
    return f'''  <article class="pk{' flip' if i % 2 else ''}" id="{sid}">
    <div class="pk-media">{img(im, art, alt,)}</div>
    <div data-sd-reveal-group>
      <span class="idx" data-sd-reveal="lines">0{i + 1} / 06</span>
      <h2 data-sd-reveal="words">{h}</h2>
      <div class="rule" data-sd-reveal="rule"></div>
      <p data-sd-reveal="lines">{p}</p>
      {tagline}
      <div data-sd-reveal="block"><a class="btn" href="/contact-us/"><span>{cta}</span></a></div>
    </div>
  </article>'''
pk_nav = ''.join(f'<a href="#{d[0]}">{d[1].replace(" Tour Packages", "").replace(" Holiday Packages", "").replace(" Packages", "").replace(" Holidays", "")}</a>' for d in PKS)
checks = ''.join(f'<li data-sd-reveal="block">{c}</li>' for c in ['Itinerary', 'Accommodation', 'Transport', 'Meals', 'Activities', 'Inclusions', 'Exclusions', 'Booking terms'])
tours = f'''<section class="phero" data-sd-bg="light">
  <p class="eyebrow" data-sd-intro="p" style="margin-bottom:20px">Tour Packages</p>
  <h1 data-sd-intro="h">Find a Holiday That Feels Like You.</h1>
  <div class="grid2 top" style="margin-top:32px" data-sd-intro="ctn">
    <p class="lede">Explore domestic and international tour packages shaped around your interests, preferred pace and budget.</p>
    <p>Whether you dream of a peaceful retreat, a cultural discovery or a celebration with loved ones, Roamance Trips and Holidays helps you take the next step.</p>
  </div>
  <nav class="pk-nav" aria-label="Package types" data-sd-intro="ctn">{pk_nav}</nav>
</section>

<section class="pad wrap" data-sd-bg="light" style="padding-top:clamp(24px,4vh,48px)">
{pk(0, PKS[0])}
{pk(1, PKS[1])}
</section>
{torn('bottom', 7)}
<section class="pad wrap theme-dark" data-sd-bg="dark">
{pk(2, PKS[2])}
{pk(3, PKS[3])}
</section>
{torn('top', 15)}
<section class="pad wrap" data-sd-bg="light">
{pk(4, PKS[4])}
{pk(5, PKS[5])}
</section>

{torn('bottom', 19)}
<section class="pad wrap theme-dark" data-sd-bg="dark">
  <div class="grid2" data-sd-reveal-group>
    <h2 data-sd-reveal="words">Know Your Package Before You Book</h2>
    <div>
      <p data-sd-reveal="lines">Review your proposed itinerary, accommodation, transport arrangements, meals, activities, inclusions, exclusions and applicable booking terms.</p>
      <p data-sd-reveal="lines" style="margin-top:18px">Package prices and availability depend on your travel dates and selected arrangements. Your quotation will explain the details relevant to your journey.</p>
    </div>
  </div>
  <ul class="checks" data-sd-reveal-group>{checks}</ul>
</section>
{torn('top', 23)}

{faq_section(['types', 'custom', 'incl', 'cost', 'visa'])}

{cta_band('Tell Us Where You Would Love to Go.', 'Share your destination, dates and budget, and we will discuss the options with you.', 'Request a Personalised Quote')}
'''

# ------------------------------------------------------------------ GALLERY
GAL = {
  'india': ('Explore India', [
    ('gal-india-1', 'backwater', 'Slow down in Kerala’s backwaters.', 'Small boat crossing palm-lined Kerala backwaters'),
    ('gal-india-2', 'snow', 'Mornings on Dal Lake.', 'Shikara gliding across Dal Lake at sunset'),
    ('gal-india-3', 'desert', 'Golden light in Rajasthan.', 'Mehrangarh Fort above the city of Jodhpur'),
    ('gal-india-4', 'beach', 'Unhurried days in Goa.', 'Quiet Goan beach lined with coconut palms')]),
  'world': ('International Escapes', [
    ('gal-world-1', 'city', 'Discover Dubai after sunset.', 'Dubai skyline illuminated at dusk'),
    ('gal-world-2', 'hills', 'Green terraces in Bali.', 'Terraced rice fields at Tegallalang, Bali'),
    ('gal-world-3', 'alps', 'Lakeside towns of Europe.', 'Hallstatt village on the lake beneath green mountains'),
    ('gal-world-4', 'island', 'Turquoise calm in the Maldives.', 'Wooden walkway leading to overwater villas')]),
  'family': ('Family Moments', [
    ('gal-family-1', 'family', 'Time together, beautifully spent.', 'Family standing together at the water’s edge at sunset'),
    ('gal-family-2', 'hills', 'Hill-station afternoons.', 'Father holding his daughter at a hill-station viewpoint'),
    ('gal-family-3', 'beach', 'Sandcastles and sea breeze.', 'Child digging in the sand beside a bucket'),
    ('gal-family-4', 'family', 'Shared discoveries.', 'Family walking down a cobbled street beside a canal')]),
  'romance': ('Romantic Getaways', [
    ('gal-romance-1', 'couple', 'A sunset just for two.', 'Couple silhouetted on a beach at sunset'),
    ('gal-romance-2', 'island', 'Quiet island evenings.', 'Draped canopy set up for two on a quiet shore'),
    ('gal-romance-3', 'alps', 'Mountain air, warm hands.', 'Couple looking out at snow-capped mountains'),
    ('gal-romance-4', 'backwater', 'Drifting slowly, together.', 'Couple in a canoe on a calm green lake')]),
}
btns = ''.join(f'<button data-sd-tab="{k}"{" class=\"is-active\"" if i == 0 else ""}>{v[0]}</button>' for i, (k, v) in enumerate(GAL.items()))
panels = []
for k, (label, items) in GAL.items():
    figs = ''.join(f'<figure><div class="frame">{img(im, art, alt)}</div><figcaption>{cap}</figcaption></figure>' for im, art, cap, alt in items)
    panels.append(f'<div class="g-panel" data-sd-tab-panel="{k}" role="tabpanel" aria-label="{label}"><div class="g-grid">{figs}</div></div>')
gallery = f'''<section class="phero" data-sd-bg="light">
  <p class="eyebrow" data-sd-intro="p" style="margin-bottom:20px">Gallery</p>
  <h1 data-sd-intro="h">Beautiful Places. Meaningful Moments.</h1>
  <div class="grid2 top" style="margin-top:32px" data-sd-intro="ctn">
    <p class="lede">Every journey has a story. Explore destinations, travel experiences and moments that inspire the next adventure.</p>
    <p>From scenic landscapes to shared celebrations, discover what makes travelling so memorable.</p>
  </div>
</section>

<section class="wrap" data-sd-bg="light" style="padding-bottom:clamp(72px,13vh,170px)">
  <div data-sd-tabs>
    <div class="pill" data-sd-pill role="tablist" aria-label="Gallery categories"><span class="pill-bg" data-sd-pill-bg></span>{btns}</div>
    <div class="g-tabs">
      {''.join(panels)}
    </div>
  </div>
  <p class="credit" style="margin-top:28px">Destination inspiration. Photographs are illustrative and do not show Roamance travellers.</p>
</section>

{torn('bottom', 31)}
{cta_band('Picture Your Next Holiday', 'Found a destination you love? Tell us what caught your eye, and let’s explore the possibilities for your own journey.', 'Plan a Similar Experience', bg='dark')}
'''

# ------------------------------------------------------------------ CONTACT
contact = f'''<section class="phero" data-sd-bg="light">
  <p class="eyebrow" data-sd-intro="p" style="margin-bottom:20px">Contact Us</p>
  <h1 data-sd-intro="h">Every Memorable Holiday Begins With a Conversation.</h1>
  <div class="grid2 top" style="margin-top:32px" data-sd-intro="ctn">
    <p class="lede">Tell us where you would love to go. We will help you explore the possibilities.</p>
    <p>Whether you are planning a domestic holiday, international trip, honeymoon or family getaway, Roamance Trips and Holidays would love to hear from you.</p>
  </div>
</section>

<section class="wrap" data-sd-bg="light" style="padding-bottom:clamp(24px,4vh,48px)">
  <div class="ct">
    <div>
      <div data-sd-reveal-group>
        <h2 data-sd-reveal="words" style="font-size:clamp(34px,4vw,64px)">Speak With Roamance</h2>
        <div class="rule" data-sd-reveal="rule" style="margin-top:28px"></div>
      </div>
      <ul class="ct-list" data-sd-reveal="block">
        <li data-biz-wrap="phone"><span>Call</span><a data-biz-href="phone" data-biz="phone"></a></li>
        <li data-biz-wrap="whatsapp"><span>WhatsApp</span><a data-biz-href="whatsapp">Chat with our team</a></li>
        <li data-biz-wrap="email"><span>Email</span><a data-biz-href="email" data-biz="email"></a></li>
        <li data-biz-wrap="address"><span>Visit</span><span style="all:unset" data-biz="fullAddress"></span></li>
        <li data-biz-wrap="hours"><span>Hours</span><span style="all:unset" data-biz="hours"></span></li>
      </ul>
      <div class="btn-row" style="margin-top:24px" data-biz-wrap="phone whatsapp mapUrl">
        <a class="btn" data-biz-wrap="phone" data-biz-href="phone"><span>Call Us</span></a>
        <a class="btn ghost" data-biz-wrap="whatsapp" data-biz-href="whatsapp">Chat on WhatsApp</a>
        <a class="btn ghost" data-biz-wrap="mapUrl" data-biz-href="mapUrl">Get Directions</a>
      </div>
      <div class="frame r-4x3" style="margin-top:40px">{img('contact', 'plan', 'Passport on an open notebook next to a cup of tea')}</div>
    </div>

    <form id="enquiry" class="form" novalidate>
      <h2 class="full" style="font-size:clamp(34px,4vw,64px)" data-sd-reveal="words">Tell Us About Your Holiday</h2>
      <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
      <div class="field"><label for="f-phone">Phone number</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
      <div class="field full"><label for="f-email">Email address</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="f-dep">Departure city</label><input id="f-dep" name="departure" type="text" autocomplete="address-level2"></div>
      <div class="field"><label for="f-dest">Preferred destination</label><input id="f-dest" name="destination" type="text" placeholder="Kerala, Bali, Europe…"></div>
      <div class="field"><label for="f-dates">Tentative travel dates</label><input id="f-dates" name="dates" type="text" placeholder="e.g. 12–18 Dec"></div>
      <div class="field" style="justify-content:flex-end"><label style="display:flex;gap:10px;align-items:center;padding:.9em 0;text-transform:none;letter-spacing:0;font-size:.95em;font-weight:400"><input type="checkbox" name="flexible" value="yes" style="width:auto"> My dates are flexible</label></div>
      <div class="field"><div class="split"><div class="field" style="padding:0"><label for="f-ad">Adults</label><input id="f-ad" name="adults" type="number" min="1" value="2" inputmode="numeric"></div><div class="field" style="padding:0"><label for="f-ch">Children</label><input id="f-ch" name="children" type="number" min="0" value="0" inputmode="numeric"></div></div></div>
      <div class="field"><div class="split"><div class="field" style="padding:0"><label for="f-bud">Approx. budget (₹)</label><input id="f-bud" name="budget" type="number" min="0" step="1000" inputmode="numeric"></div><div class="field" style="padding:0"><label for="f-basis">Basis</label><select id="f-basis" name="budgetBasis"><option value="total">Total</option><option value="per person">Per person</option></select></div></div></div>
      <div class="field full"><label for="f-notes">Special preferences or requirements</label><textarea id="f-notes" name="notes" placeholder="Pace, hotel style, occasions, dietary needs, accessibility…"></textarea></div>
      <div class="full">
        <p class="consent">By submitting this form, you agree to be contacted about your enquiry. Please read our <a href="/privacy-policy/">Privacy Policy</a>.</p>
        <button class="btn" type="submit" style="margin-top:22px">Send My Travel Enquiry</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </div>
    </form>
  </div>
</section>

<div data-biz-wrap="city">
{torn('bottom', 11)}
<section class="pad wrap theme-dark" data-sd-bg="dark">
  <div class="grid2" data-sd-reveal-group>
    <h2 data-sd-reveal="words">Holiday Planning in <span data-biz="city"></span></h2>
    <p data-sd-reveal="lines">Connect with Roamance Trips and Holidays in <span data-biz="city"></span> for domestic and international tour package enquiries, honeymoon planning and personalised holiday discussions.</p>
  </div>
</section>
{torn('top', 25)}
</div>

{faq_section(['quote', 'custom', 'where'])}
'''

def policy(name, path):
    body = f'''<section class="phero" data-sd-bg="light">
  <p class="eyebrow" data-sd-intro="p" style="margin-bottom:20px">Policies</p>
  <h1 data-sd-intro="h">{name}</h1>
  <div class="prose" style="margin-top:40px" data-sd-intro="ctn">
    <p class="lede">This policy is being finalised and will be published here soon.</p>
    <p>For any questions in the meantime, please <a href="/contact-us/" style="text-decoration:underline">contact our team</a>.</p>
  </div>
</section>'''
    return page(path, f'{name} — Roamance Trips and Holidays', f'{name} for Roamance Trips and Holidays.', 'Your Holidays, Closer to Heart.', body, noindex=True)

notfound = '''<section class="phero" data-sd-bg="light" style="min-height:80vh">
  <p class="eyebrow" data-sd-intro="p" style="margin-bottom:20px">Page not found</p>
  <h1 data-sd-intro="h">This Road Leads Nowhere.</h1>
  <div style="margin-top:40px" data-sd-intro="ctn"><a class="btn" href="/"><span>Back to Home</span></a></div>
</section>'''

PAGES = {
  'index.html': page('/', 'Roamance Trips and Holidays — Travel Agency in Chennai', 'Plan domestic and international holidays with Roamance in Chennai. Explore family trips, honeymoons and personalised travel with thoughtful care.', 'More than a journey — a family that travels with you', home),
  'about-us/index.html': page('/about-us/', 'About Roamance — Holidays With Personal Care', 'Meet Roamance Trips and Holidays. Discover our people-first approach to travel, clear communication and meaningful holiday experiences.', 'People before profit', about),
  'tour-packages/index.html': page('/tour-packages/', 'Domestic &amp; International Tour Packages — Roamance', 'Explore domestic and international holiday options with Roamance. Enquire about family trips, honeymoons, luxury escapes and customised itineraries.', 'Find a holiday that feels like you', tours),
  'gallery/index.html': page('/gallery/', 'Travel Gallery — Roamance Trips and Holidays', 'Explore destination photographs and travel inspiration from Roamance. Find ideas for your next family holiday, romantic getaway or international trip.', 'Beautiful places, meaningful moments', gallery),
  'contact-us/index.html': page('/contact-us/', 'Contact Roamance — Holiday Planning in Chennai', 'Contact Roamance Trips and Holidays in Anna Nagar West, Chennai. Share your destination, dates and budget to discuss your next domestic or international holiday.', 'Every holiday begins with a conversation', contact),
  'privacy-policy/index.html': policy('Privacy Policy', '/privacy-policy/'),
  'terms-and-conditions/index.html': policy('Terms &amp; Conditions', '/terms-and-conditions/'),
  'cancellation-refund-policy/index.html': policy('Cancellation &amp; Refund Policy', '/cancellation-refund-policy/'),
  '404.html': page('/404', 'Page Not Found — Roamance', 'This page could not be found.', 'Your Holidays, Closer to Heart.', notfound, noindex=True),
}
for rel, html in PAGES.items():
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p) or ROOT, exist_ok=True)
    open(p, 'w', encoding='utf-8').write(html)
    print('wrote', rel, len(html))
