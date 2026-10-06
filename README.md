# Regatta

A browser sailing game built around Wilk’s Laser model. Six boats race an arcade course with wind puffs, trim, right-of-way penalties, and buoy rounding.

## Put it on GitHub Pages

1. Extract the ZIP on your computer.
2. Create a GitHub repository, or open the repository you want to use.
3. Upload the extracted contents into the repository root. `index.html` must sit at the top level, beside `assets`, `vendor`, and `utils`. Upload the files, not the ZIP itself.
4. Open the repository’s **Settings → Pages**.
5. Choose **Deploy from a branch**, select **main** and **/(root)**, then **Save**.
6. Wait for the Pages deployment to finish and open the website address GitHub displays.

The `.nojekyll` file is included. No npm install, build command, server, API key, or ChatGPT account is needed to play. All game files and the supplied Laser.glb model are included. Relative paths support a repository subdirectory and a custom domain.

GitHub’s official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Play

Open **How to sail** in the game for a quick desktop/mobile guide, or visit `help.html`.

- Hover over the wooden tiller to sail; move off it to pause.
- Mouse left turns right; mouse right turns left; centre holds straight.
- Hold the left mouse button to trim in, or the right button to ease out. A/D also trim.
- Hold the middle button and drag to look around. All sails hide while it is held; steering centres. Release returns to the aft view.
- Restart Race opens course, lap, and wind-speed choices. Click Start, then return to the tiller for the countdown.
- Be fully behind the line at the starting gun. An early starter must return behind it and cross again.
- Round the marks on their exterior capture side. The next-mark dial and map guide the course.
- Results also show each boat’s accumulated first-through-sixth-place counts, saved in this browser. Reset history clears those counts.
- The race ends after fifth place finishes. Results assign the remaining boat sixth and mark it unfinished.

## Local preview

Opening `index.html` directly as a local file may prevent the model/modules from loading. Serve the folder instead:

```sh
python -m http.server 8000
```

Then open http://localhost:8000.

## Files

`index.html`, `style.css`, and `app.js` are the interface and scene. Other top-level modules contain sailing physics, AI, course/race scoring, wind, scenery, and the map. `assets/Laser.glb` is the boat model. `vendor` and `utils` contain the local Three.js runtime and loader dependencies. `THIRD-PARTY-LICENSES.txt` includes the Three.js MIT licence.

The package is a standalone website export. It does not include the ChatGPT hosting configuration or source repository credentials. No custom domain is set in this package; configure one in GitHub Pages when you choose it.

## AI diagnostics

`AI-TESTING.md` explains how to run repeatable headless races, replay failures, and tune navigation. The included Node scripts need no npm dependencies.
