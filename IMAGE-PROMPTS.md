# Roamance — photos to find and download

The site already has a slot for every photo. Until a photo is there, it draws a simple placeholder in the brand colours. To add a photo, save it in `assets/img/` with the **exact filename** listed below. It shows up straight away, with no code changes.

The home page hero is the engraved backwater drawing. It is drawn in code, so it needs no photo.

---

## 1. Prompt to paste into Claude Desktop

Copy everything in the box below into Claude Desktop (with web search and file access turned on).

```
I'm building a website for an Indian travel agency, "Roamance Trips and Holidays"
(tagline: "Your Holidays, Closer to Heart"). Please search for and download REAL travel
photographs (not AI-generated, not illustrations) for each file in the list below.

WHERE TO SEARCH (free for commercial use, no attribution required):
- unsplash.com (Unsplash License)
- pexels.com (Pexels License)
- pixabay.com (photos only)
Don't use Google Images, Pinterest, Instagram, Shutterstock previews, or anything watermarked.
Don't use anything tagged "AI generated".

HOW THE PHOTOS SHOULD LOOK (this matters most, because the site must not feel AI-made or stock-y):
- Real, documentary-style travel photography, the kind a good travel magazine would print.
- Natural light: early morning, golden hour, overcast or blue hour. Soft, slightly warm tones.
- No over-saturated HDR, no teal-and-orange grading, no lens-flare cliché, no drone shots that
  look like a screensaver, no perfect "plastic" resort renders.
- People seen from behind, side-on or at a distance, candid, not posing at the camera.
  Prefer Indian travellers for family, couple and planning shots.
- Uncluttered compositions with some calm empty space (headlines sit near some images).
- Every photo in a set should feel like it came from the same trip: similar warmth and contrast.

FOR EACH FILE:
1. Pick the best photo for the brief. Download the largest free size.
2. Crop it to the ratio given and resize it to the pixel size given (centre the subject).
3. Save it as a JPG (quality ~78) named EXACTLY as listed, into:
   C:\TheVincis\roamance travels\assets\img\
   Keep each file under ~350 KB (under 500 KB for the 2400px ones).
4. Afterwards, write C:\TheVincis\roamance travels\assets\img\CREDITS.md with a table:
   filename | photographer | source site | photo page URL | licence.

THE LIST:
(paste the table from section 2 of IMAGE-PROMPTS.md here, or tell Claude to read that file)

When you're done, show me a contact sheet (list of filenames with a one-line description of each)
and flag any you weren't happy with so I can choose replacements.
```

> Tip: Claude Desktop can open this file itself. Just say *"read C:\TheVincis\roamance travels\IMAGE-PROMPTS.md and follow section 1 for every row in section 2"*.

---

## 2. The photo list

Ratio and size are what the layout expects. Photos are cropped to fill, so keep the subject near the centre.

### Home page (`/`)

| Filename | Ratio · size | What to search for | Brief |
|---|---|---|---|
| `home-intro.jpg` | 16:10 · 1600×1000 | "travel planning map notebook", "hands on map coffee" | Hands over a paper map or travel journal with a coffee, warm daylight, top-down or 45°. |
| `cat-domestic.jpg` | 3:4 · 1200×1600 | "Munnar tea plantation", "Western Ghats mist" | Tea hills in morning mist, a lone figure or small path. Calm and green. |
| `cat-international.jpg` | 3:4 · 1200×1600 | "Hallstatt", "Swiss alpine village", "Lauterbrunnen" | Alpine village under peaks, soft light. No crowds. |
| `cat-honeymoon.jpg` | 3:4 · 1200×1600 | "couple walking beach sunset from behind" | Couple seen from behind on a quiet shoreline at dusk. |
| `cat-family.jpg` | 3:4 · 1200×1600 | "Indian family travel viewpoint", "family holiday hills" | Parents and kids at a viewpoint or on a trail, candid. |
| `cat-personalised.jpg` | 3:4 · 1200×1600 | "travel journal passport camera flat lay" | Journal, passport, camera and map on a wooden table. |
| `dest-kerala.jpg` | 4:5 · 1200×1500 | "Alleppey houseboat backwaters" | Houseboat on palm-lined backwaters, early light. |
| `dest-goa.jpg` | 4:5 · 1200×1500 | "Goa beach palms golden hour", "Palolem" | Quiet palm-fringed beach, not a party scene. |
| `dest-kashmir.jpg` | 4:5 · 1200×1500 | "Dal Lake shikara mountains", "Srinagar shikara" | Shikara on Dal Lake with mountains behind. |
| `dest-bali.jpg` | 4:5 · 1200×1500 | "Tegallalang rice terraces", "Bali rice field" | Rice terraces with palms, soft morning light. |
| `dest-europe.jpg` | 4:5 · 1200×1500 | "Lake Como village", "Lucerne old town", "Annecy" | Lakeside European town beneath the mountains. |
| `dest-maldives.jpg` | 4:5 · 1200×1500 | "Maldives overwater villas" | Overwater villas over a turquoise lagoon, calm sky. |
| `home-local.jpg` | 4:5 · 1200×1500 | "travel agent consultation", "people planning trip laptop" | Two or three people looking over a plan or laptop together, warm and friendly. |

### About Us (`/about-us/`)

| Filename | Ratio · size | What to search for | Brief |
|---|---|---|---|
| `about-hero.jpg` | 21:9 · 2400×1030 | "friends boat sunset India", "Kerala canoe sunset" | Wide cinematic shot of people sharing a quiet moment on water at sunset. |
| `about-philosophy.jpg` | 3:4 · 1200×1600 | "Indian grandparents grandchildren travel", "multigenerational family holiday" | Generations laughing together, candid. |
| `about-luxury.jpg` | 16:10 · 1600×1000 | "infinity pool sea view boutique resort" | Calm infinity pool facing the sea, no people or one figure far away. |

### Tour Packages (`/tour-packages/`)

| Filename | Ratio · size | What to search for | Brief |
|---|---|---|---|
| `pkg-domestic.jpg` | 4:3 · 1600×1200 | "Jaipur Amber Fort golden hour", "Udaipur palace lake" | Rajasthan heritage at golden hour. |
| `pkg-international.jpg` | 4:3 · 1600×1200 | "European old town street mountains" | Cobbled old-town street with mountains or a cathedral in view. |
| `pkg-honeymoon.jpg` | 4:3 · 1600×1200 | "couple villa deck sunset" | Couple on a private deck at sunset, from behind. |
| `pkg-family.jpg` | 4:3 · 1600×1200 | "family walking beach sunset" | Family walking along a beach at sunset. |
| `pkg-luxury.jpg` | 4:3 · 1600×1200 | "luxury overwater villa interior", "resort deck ocean" | Elegant overwater villa or deck, refined and calm. |
| `pkg-customised.jpg` | 4:3 · 1600×1200 | "paper map compass route", "planning trip map pins" | Map with a compass or marked route. |

### Gallery (`/gallery/`). Use 4:3 · 1600×1200 for all of these

| Filename | Caption on the site | What to search for |
|---|---|---|
| `gal-india-1.jpg` | Slow down in Kerala's backwaters. | Houseboat in palm-lined Kerala backwaters |
| `gal-india-2.jpg` | Mornings on Dal Lake. | Shikara gliding on Dal Lake, Kashmir |
| `gal-india-3.jpg` | Golden light in Rajasthan. | Sandstone fort at sunset (Jaisalmer / Jodhpur) |
| `gal-india-4.jpg` | Unhurried days in Goa. | Quiet Goan beach with coconut palms |
| `gal-world-1.jpg` | Discover Dubai after sunset. | Dubai skyline illuminated at dusk |
| `gal-world-2.jpg` | Green terraces in Bali. | Terraced rice fields, Bali |
| `gal-world-3.jpg` | Lakeside towns of Europe. | Colourful lakeside town beneath the Alps |
| `gal-world-4.jpg` | Turquoise calm in the Maldives. | Overwater villas on a lagoon |
| `gal-family-1.jpg` | Time together, beautifully spent. | Family walking along a beach at sunset |
| `gal-family-2.jpg` | Hill-station afternoons. | Kids in a tea garden / hill station |
| `gal-family-3.jpg` | Sandcastles and sea breeze. | Parent and child building a sandcastle |
| `gal-family-4.jpg` | Shared discoveries. | Family exploring an old-town street |
| `gal-romance-1.jpg` | A sunset just for two. | Couple watching sunset on a beach |
| `gal-romance-2.jpg` | Quiet island evenings. | Candle-lit dinner table on the beach |
| `gal-romance-3.jpg` | Mountain air, warm hands. | Couple in a snowy mountain village |
| `gal-romance-4.jpg` | Drifting slowly, together. | Couple on a houseboat deck, Kerala |

### Contact Us (`/contact-us/`)

| Filename | Ratio · size | What to search for | Brief |
|---|---|---|---|
| `contact.jpg` | 4:3 · 1600×1200 | "passport notebook coffee desk travel" | Passport, notes and coffee on a desk, warm window light. |

### Social share image

| Filename | Ratio · size | Brief |
|---|---|---|
| `og-cover.jpg` | 1.91:1 · 1200×630 | Your best Kerala backwater or beach photo. It appears when a page link is shared on WhatsApp or social media. |

**Total: 40 photos.**

---

## 3. Before launch

- **Use your own trip photos when you can.** Real Roamance trips (shared with travellers' permission) do more for trust than any stock photo. Swap them in with the same filenames.
- **Stock photos must not look like customers.** The Gallery already says "photographs are illustrative and do not show Roamance travellers". Remove that line only once the gallery is all genuine trip photos.
- **Alt text:** each slot already has descriptive alt text. If a photo ends up showing something different, update the `alt="…"` in the page's HTML to match it.
- Keep `assets/img/CREDITS.md`. Neither Unsplash nor Pexels requires credit, but the record shows where each image came from.
