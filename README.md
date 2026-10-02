# See Through Works: the site

The public website of the **See Through Works** Facebook Page: everyday things, seen from the inside.
Live at https://eriksoto01.github.io/see-through-works/ (GitHub Pages, published from the `main` branch).

A static site with no dependencies and no external requests: one `index.html` (CSS and JS inline), a `404.html`, and an
`assets/` folder. Every URL is relative. Dark by design in both light and dark system themes (the studio look of the Shorts).
There are no videos on the site: the reels live on the Facebook Page.

## What is on the page
| Section | What it does |
| --- | --- |
| Hero | Headline over two slowly turning gears, and a picture of a solid object with a round lens that shows the mechanism inside it. Mouse, touch or arrow keys move the lens; it drifts on its own until someone touches it. Four objects to pick from. |
| Look inside | One card per object: the solid object, then its inside on hover (on phones, as the card crosses the middle of the screen). A tap opens the inside view with the answer in two sentences; previous / next buttons and arrow keys. |
| Myth or fact? | Ten statements, one at a time. Pick Myth or Fact, get the stamp and the reason, see a score at the end. |
| Brain teasers | Six mechanical puzzles with answer buttons. Get a gear question right and the gears turn, in mesh, at the right ratios. |
| Did you know | A sideways strip of twelve of the fact cards made for the Page. |
| About | Three short paragraphs, and a Follow box once the Page address is set. |

## Run it locally
    python3 -m http.server 4181 --bind 127.0.0.1     # then open http://127.0.0.1:4181/
In the workspace this is the `how-it-works-site` preview entry.

## Rebuild after new Shorts or new brand art
    node tools/build.js                 # card pictures, lens pictures, brand files, fact cards, and the catalogue in index.html
    node tools/build.js slug            # only the pictures of one object
    node tools/build.js --data-only     # only refresh brand files, fact cards and the catalogue
It reads the Shorts studio, which must sit next to this folder as `../how-it-works-shorts`. Every Short with a `meta.json` and
a file in the studio's `FINAL/` is included, and needs its two-sentence answer in `tools/answers.json`.
`XRAY` in `tools/build.js` picks the moment that shows each object's inside best; `LENS` lists the hero objects.

## Things you will want to edit (all near the bottom of `index.html`)
- `SITE.facebook`: the Page's address. While it is empty the Follow buttons stay hidden.
- `SITE.firstRows`: how many cards show before "Show all".
- The myth list `M`, the teaser list `T` and the fact-card list `F`.

## Publishing
Pushing to `main` publishes. For anything beyond a typo, work on a branch and open a pull request.
