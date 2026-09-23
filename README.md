# Thirumoorthi Samiyappan — Portfolio

A self-contained static portfolio with a light theme, readable typography, responsive layouts, and subtle animations that respect reduced-motion preferences.

## Pages

- About Me: `index.html`
- Projects: `projects.html`
- Reference Hub: `references.html`
- Certifications: `certifications.html`
- Foundations and Professional learning guides and local practice rounds

The certification resources are supplementary, unofficial study material. Practice rounds provide answer feedback and are not official certification exams.

## Local preview

Run `python -m http.server 8000` from the repository root, then open `http://localhost:8000`.

## Updating the pages

Edit the content in `generate.py`, then run `python generate.py` to regenerate the HTML pages. Styles, shared JavaScript, and the portrait are maintained separately in `style.css`, `app.js`, and `portrait.jpg`. Practice scripts are embedded in their respective pages by the generator.

## Hosting

The committed root files are ready for GitHub Pages. No package installation or build service is required. Keep `.nojekyll` so the static files are served directly.
