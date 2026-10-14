# 📚 Book Nook — Your personal reading list

**🌐 Live demo:** <https://iamkarthik2004.github.io/book-tracker/>

> If the link above shows a 404, GitHub Pages hasn't been enabled yet — see
> [Deploy to GitHub Pages](#-deploy-to-github-pages) below (takes ~1–2 minutes after enabling).

A complete, polished, responsive **Book Tracker** web app built with plain **HTML5, CSS3, and vanilla JavaScript**. No frameworks, no backend, no dependencies — just open `index.html` and start tracking your reading.

## ✨ Features

- **Add books** with title, author, and status (`To read` / `Reading` / `Finished`)
- **Inline validation** — clear messages when title or author is empty (whitespace trimmed)
- **Search** across titles and authors (case-insensitive)
- **Status filters** — All, To read, Reading, Finished
- **Newest-first ordering** with creation timestamps
- **Change status** per book via dropdown (other fields preserved)
- **Delete with confirmation** dialog (Escape/backdrop to cancel)
- **Live statistics** — Total, To Read, Reading, Finished
- **localStorage persistence** — books survive page refreshes; corrupt data handled gracefully
- **Illustrated covers** — deterministic pastel cover per book (pure CSS, no images)
- **Empty & no-results states** with a one-click reset
- **Responsive** — two-column layout on desktop, stacked on tablet/mobile
- **Accessible** — labels, skip link, focus states, ARIA live regions, keyboard-friendly dialog
- **Safe rendering** — all user content inserted via `textContent` / DOM APIs (no raw HTML injection)

## 🗂 Project structure

```text
book-tracker/
├── index.html   # Structure: header, stats, form, library, dialog
├── icon.png     # Brand logo (header) and favicon
├── style.css    # Cozy cream + forest-green theme, responsive layout
├── app.js       # All functionality: CRUD, search, filter, stats, storage
├── README.md    # This file
├── PROMPTS.md   # Development prompts log
└── .gitignore   # OS/editor noise
```

## ▶️ Run the app

No build step, no install.

**Option 1 — open directly:**

1. Download or clone this repository.
2. Double-click `index.html` (or right-click → Open with your browser).

**Option 2 — local server (recommended, avoids `file://` quirks):**

```bash
# Python 3
python3 -m http.server 8000
# then visit http://localhost:8000
```

```bash
# Node.js
npx serve .
```

## 🧪 Manual test checklist

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Add valid book | Appears at top, stats +1, toast confirms |
| 2 | Submit empty title/author | Inline error under the field, nothing saved |
| 3 | Search by title / author | Matching books shown |
| 4 | Search with UPPERCASE | Same matches (case-insensitive) |
| 5 | Filter each status | Only that status shown |
| 6 | Change a book's status | Badge + stats update, title/author kept |
| 7 | Refresh page | Books and statuses restored |
| 8 | Delete a book | Confirmation first; stats update after confirm |
| 9 | Delete all books | Empty-state illustration + message |
| 10 | Search with no match | No-results message + clear button |
| 11 | Very long title/author | Card wraps cleanly, no horizontal scroll |
| 12 | Narrow mobile width (~360px) | Sections stack, 44px+ tap targets |

## 🚀 Deploy to GitHub Pages

These steps need your GitHub account — nothing here is automated.

1. **Create the repository**
   - Go to <https://github.com/new>
   - Name it `book-tracker`, set it to **Public**, skip templates, click **Create repository**.
2. **Push this project**
   ```bash
   cd book-tracker
   git init
   git add .
   git commit -m "Add Book Nook reading tracker"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/book-tracker.git
   git push -u origin main
   ```
   Replace `<YOUR-USERNAME>` with your GitHub username.
3. **Enable Pages**
   - Open your repo → **Settings** → **Pages**.
   - Under **Build and deployment**, Source = **Deploy from a branch**.
   - Branch = `main`, folder = `/ (root)`, click **Save**.
4. **Visit your site** after ~1–2 minutes at:
   `https://<YOUR-USERNAME>.github.io/book-tracker/`

## 🔒 Privacy & storage

All data lives in your browser under the `bookNook.books.v1` localStorage key. Clearing site data removes your books. No network requests except optional Google Fonts (with system-font fallbacks if offline).

## 🎨 Design tokens

| Role | Value |
|------|-------|
| Background | Warm cream `#FAF5EB`, ivory `#FFFDF8` |
| Primary | Forest green `#2D5A3D` |
| Accents | Terracotta `#D97D4E`, peach `#F9DEC9`, sage `#B5C9B0`, gold `#E9B44C` |
| Headings | Playfair Display (serif) |
| Body | Inter (sans-serif) |
