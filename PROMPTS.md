# PROMPTS.md — Development log for Book Nook

This file records the important prompts used during development, what each produced, and one genuine AI-generated mistake with its fix.

## Prompt 1 — Full project brief (user)

> "Build a complete, polished, responsive Book Tracker web application called 'Book Nook' using plain HTML, CSS, and JavaScript…" (full specification: theme, layout, functional requirements, responsive design, file structure, code quality, testing, docs, deployment).

**Outcome:** Created the complete project from scratch in one pass:
- `index.html` — header/brand, 4 stat cards, add-book form, searchable/filterable library, empty + no-results states, delete-confirmation dialog, toast.
- `style.css` — cream/forest-green cozy theme, card/panel styling, two-column → stacked responsive layout, focus states, pastel stat cards, CSS-illustrated book covers.
- `app.js` — add/validate, newest-first render, case-insensitive search, status filter, status updates, delete with confirmation, live stats, localStorage persistence with corrupt-data tolerance, safe DOM rendering.
- `README.md`, `PROMPTS.md` (this file), `.gitignore`.

## Prompt 2 — Verification pass (implicit in the brief: "verify the functionality, fix any issues")

> Applied as a self-review step after implementation: re-read every requirement, then ran automated static + logic checks (see below).

**Outcome:**
- Wrote a Node-based check script (temporary, not shipped) that verified: required files exist, no `innerHTML` with user data, `localStorage` usage present, status/filter/search logic behaves, newest-first sort holds, corrupted-storage handling works, IDs unique, validation trims whitespace.
- Fixed issues found (see "AI mistake" below). Only after checks passed was the work reported as complete.

## Verification actually performed

1. `node --check app.js` — syntax valid.
2. Static scan — `index.html` references `style.css` + `app.js`; all `id`s referenced in JS exist in HTML; no `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write` anywhere; `localStorage.getItem/setItem` wrapped in `try/catch`.
3. Logic harness — extracted pure rules (validation, filtering, sorting, stats, storage parsing) into a Node test that exercised: valid add, empty title/author, whitespace trimming, case-insensitive search, each filter, status change preserving fields, newest-first order, stats math, corrupt JSON → `[]`, non-array JSON → `[]`, malformed records dropped, unique IDs.
4. Responsive/accessibility review — media queries at 960px (stack columns, hide desktop quote, 2-col stats) and 560px (compact cards, full-width actions); labels, `aria-pressed`, `aria-live`, `aria-invalid`, skip link, visible focus rings, `prefers-reduced-motion`.

## AI-generated mistake (genuine example)

**The mistake:** The first draft of `updateStats()` computed the "books shown" line like this:

```js
libraryCount.textContent = pluralize(visible.length, "book") + " on your shelf";
```

`visible` was a local variable inside `renderBooks()`, not in scope inside `updateStats()` — so the page threw `ReferenceError: visible is not defined` on every render and **nothing displayed at all**.

**How it was identified:** The Node syntax check passed (no syntax error), but a smoke test of the render path failed immediately with the `ReferenceError`. Reading the stack trace pointed straight at `updateStats()`.

**The fix:** Called the existing `getVisibleBooks()` helper from inside `updateStats()` instead of referencing the out-of-scope variable:

```js
pluralize(getVisibleBooks().length, "book") + ...
```

**Lesson:** Keep shared derivations in a single helper function and call it where needed, rather than reaching across function scopes. Smoke-test the real render path, not just syntax.
