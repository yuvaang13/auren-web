# Auren website

Public marketing site for **Auren** — the last-mile guardrail for AI agents.

- **Stack:** pure static HTML + CSS + JS. No frameworks, no build step, no webfonts. Works offline and deploys anywhere (GitHub Pages, Netlify, Vercel, plain static hosting).
- **Files:** `index.html` (copy + structure), `styles.css` (theme), `script.js` (menu, reveal-on-scroll, FAQ via native `<details>`, OS-aware download highlight).

## Preview

```bash
cd website
python3 -m http.server 8080
# open http://127.0.0.1:8080
```

## Download buttons

Both buttons link straight at release assets (click = download starts):

- Mac → `https://github.com/yuvaang13/auren-web/releases/download/v0.4.0-beta/auren-0.4.0-arm64.dmg`
- Windows → `https://github.com/yuvaang13/auren-web/releases/download/v0.4.0-beta/auren-0.4.0-win-portable.zip` (portable — unzip and run `auren.exe`)

When cutting a new version, upload the new assets to a new release and update the four `href`s in `index.html` (hero + CTA).

## Deploy (GitHub Pages)

```bash
# from this directory (auren-web repo root)
git add -A && git commit -m "update site" && git push origin main
```

Then enable **Settings → Pages → Deploy from branch → `main` / root**.
