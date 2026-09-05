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

Both buttons currently point at the main repo's releases page:

- Mac → `https://github.com/yuvaang13/Auren-Guardrail-for-AI-agents/releases`
- Windows → same page

Once per-OS assets are published, point each button at its direct asset URL (`.dmg` / setup `.exe`). The `data-dl="mac|win"` attributes are hooks for analytics if you add any later.

## Deploy (GitHub Pages)

```bash
# from this directory (auren-web repo root)
git add -A && git commit -m "update site" && git push origin main
```

Then enable **Settings → Pages → Deploy from branch → `main` / root**.
