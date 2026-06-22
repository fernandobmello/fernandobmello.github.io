# fernandobmello.com

Personal academic website for Fernando B. Mello — political scientist
(University Carlos III – Madrid).

Static site: plain HTML, CSS, and a small amount of JavaScript. No build step.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing

- `index.html` — all content (bio, research, publications, books, teaching, contact)
- `styles.css` — styling and layout
- `script.js` — nav behavior and scroll reveals
- `assets/portrait.jpg` — profile photo (a monogram placeholder shows if missing)
- `CNAME` — custom domain for GitHub Pages (`www.fernandobmello.com`)

## Deployment

Served via GitHub Pages from the `main` branch. Pushing to `main` publishes.
