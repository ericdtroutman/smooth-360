# Smooth 360

A smoother 360° viewer for warhammer.com product pages. It adds a **Smooth 360** button to any product that has a spin. Tapping it opens a full-screen viewer with:

- the same turn for every pixel you drag, plus momentum when you flick
- cross-fading between Games Workshop's photos, which are taken 30° apart
- camera height on vertical drag (4 heights, up to straight overhead)
- pinch, scroll-wheel and keyboard controls
- a **Recent models** list on the install page with the last 4 spins you opened, so you can view them again without going back to warhammer.com. The userscript keeps this list in sync.

**Install page:** https://ericdtroutman.github.io/smooth-360/

## Files

| File | What it is |
| --- | --- |
| `spin.js` | The viewer source. Edit this one. |
| `smooth-360.user.js` | Userscript build for Userscripts (iOS), Tampermonkey and Violentmonkey. |
| `index.html` | Install page served by GitHub Pages, with the bookmarklet built in. |
| `build.py` | Rebuilds the userscript and the page's bookmarklet from `spin.js`. |

After editing `spin.js`, run `python3 build.py`, bump `VERSION` in `build.py`, and commit. Installed userscripts update themselves from the Pages URL.

## How it finds the spin

Product pages link to frames at `/app/resources/catalog/product/threeSixty/<spin-id>/RR-CC.jpg`. In that path, `RR` is the camera height and `CC` is the angle. The viewer reads `<spin-id>` from the page, checks how many rows and columns exist, and preloads them all. It only runs on warhammer.com and doesn't send anything anywhere.

Not affiliated with Games Workshop.
