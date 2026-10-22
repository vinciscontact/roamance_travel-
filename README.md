# Roamance Trips and Holidays — website

A static site with no build step. Motion uses the Son Daven system (GSAP 3.13, ScrollTrigger, SplitText and Lenis), in the Roamance brand colours: logo yellow `#fbde22`, charcoal `#3d4341` and warm white. The home hero is an interactive dotted world map with the logo eagle (`assets/js/hero.js`).

## Preview locally
```bash
python -m http.server 5173
```
Then open http://localhost:5173. All links are relative, so the site works at a domain root or in a sub-folder such as GitHub Pages.

## Things to edit
| What | Where |
|---|---|
| Phone, WhatsApp, email, address, city, hours, map, social links, form endpoint | `assets/js/config.js`. Empty values are hidden on the site automatically. |
| Photos | `assets/img/`. See **IMAGE-PROMPTS.md** for the filenames and a ready-made prompt. |
| Colours | `assets/css/sd-base.css` (`--sd-paper`, `--sd-ink`, `--sd-accent`) |
| Logo | `assets/img/logo-sprite.svg` (vector symbols `#bird`, `#word`, `#tag`, coloured by CSS) and `assets/img/logo.svg` (full logo) |
| Page copy | Edit the `index.html` files directly, **or** edit `tools/build_pages.py` and run `python tools/build_pages.py .` (this regenerates all pages and overwrites direct edits). |

## Pages
`/`, `/about-us/`, `/tour-packages/` (anchors: `#domestic #international #honeymoon #family #luxury #customised`), `/gallery/`, `/contact-us/`, plus the policy pages and `404.html`.

## Before launch
- Fill in `config.js` with verified details. Set `formEndpoint` (Formspree, Getform, Web3Forms and similar). Without it, the form opens WhatsApp or email instead, and never fakes a success message.
- Replace the three policy pages with approved text. They are `noindex` until then.
- Once the domain is confirmed: add `<link rel="canonical">` to each page, add a `sitemap.xml`, and enable the Sitemap line in `robots.txt`.
- Add the city to page titles if you are targeting local search, for example "Travel Agency in Bengaluru".
- Hosting: upload the folder as it is (GitHub Pages, Hostinger `public_html`, Netlify, Vercel or Cloudflare Pages). `404.html` is picked up automatically on most hosts.
- GitHub Pages: Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. `.nojekyll` is included so every file is served as is.
