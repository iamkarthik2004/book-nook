/* ============================================================
   Book Nook — application logic (vanilla JS + localStorage)
   - Unique IDs + creation timestamps per book
   - Safe rendering via DOM APIs (textContent), never innerHTML
     with user data
   ============================================================ */
"use strict";

const STORAGE_KEY = "bookNook.books.v1";
const VALID_STATUSES = ["to-read", "reading", "finished"];
const STATUS_LABELS = { "to-read": "To read", reading: "Reading", finished: "Finished" };

// --- State ---
let books = [];
let activeFilter = "all";
let searchQuery = "";
let pendingDeleteId = null;
let lastFocusedElement = null;

// --- DOM references ---
const form = document.getElementById("add-book-form");
const titleInput = document.getElementById("title-input");
const authorInput = document.getElementById("author-input");
const statusInput = document.getElementById("status-input");
const titleError = document.getElementById("title-error");
const authorError = document.getElementById("author-error");
const searchInput = document.getElementById("search-input");
const bookList = document.getElementById("book-list");
const emptyState = document.getElementById("empty-state");
const noResults = document.getElementById("no-results");
const libraryCount = document.getElementById("library-count");
const clearSearchBtn = document.getElementById("clear-search");
const filterButtons = Array.from(document.querySelectorAll(".chip"));
const modalBackdrop = document.getElementById("modal-backdrop");
const modalBookName = document.getElementById("modal-book-name");
const modalCancel = document.getElementById("modal-cancel");
const modalConfirm = document.getElementById("modal-confirm");
const toast = document.getElementById("toast");
let toastTimer = null;

/* ---------------- Storage ---------------- */

/** Load books from localStorage, tolerating missing/corrupt data. */
function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Keep only well-formed entries so one bad record can't break the app.
    return parsed.filter(isValidBook);
  } catch (err) {
    console.warn("Book Nook: could not read saved books, starting fresh.", err);
    return [];
  }
}

/** A stored book is valid only with the expected shape. */
function isValidBook(b) {
  return (
    b !== null &&
    typeof b === "object" &&
    typeof b.id === "string" &&
    b.id.length > 0 &&
    typeof b.title === "string" &&
    typeof b.author === "string" &&
    VALID_STATUSES.includes(b.status) &&
    typeof b.createdAt === "number" &&
    Number.isFinite(b.createdAt)
  );
}

/** Persist books; warn (but don't crash) when storage is unavailable/full. */
function saveBooks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (err) {
    console.warn("Book Nook: could not save books.", err);
    showToast("Couldn't save changes — browser storage is unavailable.");
  }
}

/* ---------------- Helpers ---------------- */

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

/** Pick a deterministic cover style + motif from the book id. */
function coverStyleFor(book) {
  let hash = 0;
  for (let i = 0; i < book.id.length; i++) {
    hash = (hash * 31 + book.id.charCodeAt(i)) >>> 0;
  }
  const motifs = ["❦", "✿", "☾", "❧", "✎", "♞"];
  return { variant: hash % 6, motif: motifs[hash % motifs.length] };
}

function initialsFor(title) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "BN";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function pluralize(n, word) {
  return n + " " + word + (n === 1 ? "" : "s");
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

/* ---------------- Validation ---------------- */

function setFieldError(inputEl, errorEl, message) {
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    inputEl.setAttribute("aria-invalid", "true");
  } else {
    errorEl.textContent = "";
    errorEl.hidden = true;
    inputEl.removeAttribute("aria-invalid");
  }
}

function validateBookInput(title, author) {
  const errors = {};
  if (!title) errors.title = "Please enter the book title.";
  if (!author) errors.author = "Please enter the author name.";
  return errors;
}

/* ---------------- Rendering ---------------- */

function getVisibleBooks() {
  const q = searchQuery.trim().toLowerCase();
  return books
    .filter((b) => activeFilter === "all" || b.status === activeFilter)
    .filter(
      (b) =>
        q === "" ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    )
    .sort((a, b) => b.createdAt - a.createdAt); // newest first
}

function updateStats() {
  const counts = {
    total: books.length,
    "to-read": 0,
    reading: 0,
    finished: 0,
  };
  for (const b of books) {
    if (counts[b.status] !== undefined) counts[b.status] += 1;
  }
  document.getElementById("stat-total").textContent = counts.total;
  document.getElementById("stat-toread").textContent = counts["to-read"];
  document.getElementById("stat-reading").textContent = counts.reading;
  document.getElementById("stat-finished").textContent = counts.finished;
  libraryCount.textContent =
    books.length === 0
      ? "0 books on your shelf"
      : pluralize(getVisibleBooks().length, "book") +
        (searchQuery || activeFilter !== "all" ? " shown" : " on your shelf");
}

/** Build one book card using only safe DOM methods. */
function createBookCard(book) {
  const card = document.createElement("article");
  card.className = "book-card";
  card.dataset.id = book.id;

  // Illustrated cover
  const cover = document.createElement("div");
  const { variant, motif } = coverStyleFor(book);
  cover.className = "cover c" + variant;
  cover.setAttribute("aria-hidden", "true");
  const initials = document.createElement("span");
  initials.className = "cover-initials";
  initials.textContent = initialsFor(book.title);
  const motifEl = document.createElement("span");
  motifEl.className = "cover-motif";
  motifEl.textContent = motif;
  cover.append(initials, motifEl);

  // Main info
  const main = document.createElement("div");
  main.className = "book-main";
  const titleEl = document.createElement("div");
  titleEl.className = "book-title";
  titleEl.textContent = book.title;
  const authorEl = document.createElement("p");
  authorEl.className = "book-author";
  authorEl.textContent = "by " + book.author;
  const meta = document.createElement("div");
  meta.className = "book-meta";
  const badge = document.createElement("span");
  badge.className = "badge " + book.status;
  badge.textContent = STATUS_LABELS[book.status];
  const date = document.createElement("span");
  date.className = "date-added";
  date.textContent = "Added " + formatDate(book.createdAt);
  meta.append(badge, date);
  main.append(titleEl, authorEl, meta);

  // Actions: status changer + delete
  const actions = document.createElement("div");
  actions.className = "book-actions";
  const statusSelect = document.createElement("select");
  statusSelect.className = "book-status";
  statusSelect.setAttribute("aria-label", "Change status for " + book.title);
  statusSelect.dataset.id = book.id;
  for (const value of VALID_STATUSES) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = STATUS_LABELS[value];
    if (book.status === value) opt.selected = true;
    statusSelect.appendChild(opt);
  }
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "icon-btn";
  deleteBtn.dataset.id = book.id;
  deleteBtn.setAttribute("aria-label", "Delete " + book.title);
  deleteBtn.textContent = "🗑 Delete";
  actions.append(statusSelect, deleteBtn);

  card.append(cover, main, actions);
  return card;
}

function renderBooks() {
  bookList.replaceChildren();
  const visible = getVisibleBooks();

  emptyState.hidden = books.length !== 0;
  noResults.hidden = !(books.length > 0 && visible.length === 0);
  bookList.style.display = visible.length === 0 ? "none" : "";

  for (const book of visible) {
    bookList.appendChild(createBookCard(book));
  }
  updateStats();
}

/* ---------------- Actions ---------------- */

function addBook(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const status = VALID_STATUSES.includes(statusInput.value) ? statusInput.value : "to-read";

  const errors = validateBookInput(title, author);
  setFieldError(titleInput, titleError, errors.title || "");
  setFieldError(authorInput, authorError, errors.author || "");
  if (errors.title || errors.author) {
    (errors.title ? titleInput : authorInput).focus();
    return;
  }

  books.push({ id: createId(), title, author, status, createdAt: Date.now() });
  saveBooks();
  renderBooks();
  form.reset();
  titleInput.focus();
  showToast('Added "' + title + '" to your library.');
}

function changeBookStatus(id, newStatus) {
  if (!VALID_STATUSES.includes(newStatus)) return;
  const book = books.find((b) => b.id === id);
  if (!book || book.status === newStatus) return;
  book.status = newStatus; // other fields untouched
  saveBooks();
  renderBooks();
  showToast('Moved "' + book.title + '" to ' + STATUS_LABELS[newStatus] + ".");
}

function requestDelete(id) {
  const book = books.find((b) => b.id === id);
  if (!book) return;
  pendingDeleteId = id;
  lastFocusedElement = document.activeElement;
  modalBookName.textContent = '"' + book.title + '"';
  modalBackdrop.hidden = false;
  modalCancel.focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  pendingDeleteId = null;
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function confirmDelete() {
  if (!pendingDeleteId) return;
  const index = books.findIndex((b) => b.id === pendingDeleteId);
  if (index !== -1) {
    const [removed] = books.splice(index, 1);
    saveBooks();
    renderBooks();
    showToast('Removed "' + removed.title + '" from your library.');
  }
  closeModal();
}

function setFilter(filter) {
  activeFilter = VALID_STATUSES.includes(filter) || filter === "all" ? filter : "all";
  for (const btn of filterButtons) {
    const isActive = btn.dataset.filter === activeFilter;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  }
  renderBooks();
}

/* ---------------- Events ---------------- */

form.addEventListener("submit", addBook);

// Clear validation messages as the user types
titleInput.addEventListener("input", () => setFieldError(titleInput, titleError, ""));
authorInput.addEventListener("input", () => setFieldError(authorInput, authorError, ""));

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value;
  renderBooks();
});

for (const btn of filterButtons) {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
}

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchQuery = "";
  setFilter("all");
  searchInput.focus();
});

// Event delegation: one listener covers all status dropdowns + delete buttons,
// including cards added later.
bookList.addEventListener("change", (event) => {
  const select = event.target.closest(".book-status");
  if (select && select.dataset.id) {
    changeBookStatus(select.dataset.id, select.value);
  }
});

bookList.addEventListener("click", (event) => {
  const btn = event.target.closest(".icon-btn");
  if (btn && btn.dataset.id) {
    requestDelete(btn.dataset.id);
  }
});

modalCancel.addEventListener("click", closeModal);
modalConfirm.addEventListener("click", confirmDelete);
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

/* ---------------- Init ---------------- */
books = loadBooks();
renderBooks();
