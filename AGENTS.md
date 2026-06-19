# Repository Guidelines

A concise, practical guide for AI assistants working in this repository. Generated from a parallel scan of the core app, frontend, configs, and docs.

## Project Overview

`filesharing` (v0.5.0) is a small single-file Flask application for password-protected file and text sharing. Users log in with a single shared password, then upload/download/delete files (up to 100 MB each) and read/write a single shared text snippet. There is no database, no multi-user model, and no blueprints — all server logic lives in `flask_app.py`.

## Architecture & Data Flow

```
Browser ──HTTP──▶ flask_app.py (Flask routes)
                      │
                      ├── session (flask_session/ filesystem) ── 'logged_in' flag
                      ├── uploads/<filename>          (file storage on disk)
                      └── shared_texts/TEXT_SHARE_FILE.txt  (single shared text)
                      │
                      └── renders templates/*.html, serves static/{js,css}
```

- **Entry point**: `flask_app.py:250` `if __name__ == '__main__'` → `app.run(host='0.0.0.0', port=5000, debug=True)`.
- **Config**: `app.config.from_object(Config)` (`flask_app.py:17`); `Config` is defined in `config.py`.
- **Sessions**: server-side filesystem sessions via `flask-session` (`SESSION_TYPE="filesystem"`). Auth state is a single boolean `session['logged_in']`; there is no user identity.
- **Storage**: files persist on disk under `UPLOAD_FOLDER` (`./uploads/`); the shared text is a single overwrite-on-write file at `shared_texts/TEXT_SHARE_FILE.txt` (`flask_app.py:26`).
- **Frontend coupling**: templates are server-rendered with Jinja2 for the initial page; subsequent file/text operations are vanilla-JS `fetch` calls to hardcoded endpoint paths in `static/js/main.js` (no `url_for` in JS).

### Routes

| Path | Methods | Handler | Purpose |
|---|---|---|---|
| `/` | GET | `index` | Render main page (redirects to `/login` if not authed) |
| `/login` | GET, POST | `login` | Password login form |
| `/logout` | GET | `logout` | Clear session |
| `/upload` | POST | `upload_file` | Save uploaded file (JSON response) |
| `/download/<filename>` | GET | `download_file` | Stream a file |
| `/delete/<filename>` | POST | `delete_file` | Remove a file (JSON response) |
| `/files` | GET | `list_files` | JSON file listing |
| `/share_text` | POST | `share_text` | Overwrite shared text (JSON response) |
| `/get_text` | GET | `get_text` | Read shared text (JSON response) |

### Auth model
A shared password compared with `==` against `app.config['PASSWORD']` (`flask_app.py:113`). There are **no decorators** — each protected route repeats `if 'logged_in' not in session: ...` inline. API routes return JSON `401`; page routes redirect to `/login`.

## Key Directories

| Path | Purpose |
|---|---|
| `flask_app.py` | Entire server: routes, helpers, `__main__`. |
| `config.py` | `Config` class: secrets, upload limits, session type. |
| `templates/` | `index.html` (main page) and `login.html`. Standalone — no Jinja inheritance. |
| `static/js/main.js` | ~386 lines vanilla JS: upload, delete, file list refresh, text share/load, drag-drop, toast, loading overlay. |
| `static/css/style.css` | ~823 lines flat CSS with custom properties; breakpoints at 768px and 480px. |
| `uploads/` | Runtime file storage. `.gitkeep` tracked; contents gitignored. |
| `shared_texts/` | Holds `TEXT_SHARE_FILE.txt` (seed content `sandofree`). |
| `pyproject.toml` | Sole project/config file. No `[tool.*]`, no `[build-system]`, no scripts. |
| `uv.lock` | Lockfile (rev 3). Pins Flask 3.1.2, flask-session 0.8.0. |

## Development Commands

The project uses [uv](https://docs.astral.sh/uv/) exclusively — do **not** use `pip` or `venv` directly.

```bash
uv sync                       # Install dependencies from uv.lock
uv run flask_app.py           # Run the app (0.0.0.0:5000, debug=True)
uv run pytest                 # Run tests (none currently exist)
uv run black .                # Format
uv run ruff check .           # Lint
```

Python version: **>=3.13** (`.python-version` says `3.13`; uv manages it).

> Note: `pytest`, `black`, and `ruff` are referenced in commands but are **not declared** in `pyproject.toml` and have no config. Install them ad-hoc with `uv run --with <tool> <tool> ...` or add dev dependencies before relying on them.

## Code Conventions & Common Patterns

- **Single-file server**: no package layout, no `src/`, no `__init__.py`. Add new routes directly to `flask_app.py`.
- **Docstrings are in Chinese**; identifiers and log strings are English/Chinese mixed. Match the surrounding language when editing.
- **Custom `secure_filename`** (`flask_app.py:30`) replaces non-alphanumeric characters (excluding `.`-`_`) with `_` — do **not** import Werkzeug's `secure_filename`; the local one is intentional.
- **Filename collision handling**: on upload, `base_<n>.ext` suffixing loop (`flask_app.py:149-153`).
- **API responses**: all JSON, shape `{'success': bool, 'message': str, ...}`. Errors use HTTP `400` / `401` / `404`.
- **No error handlers** (`@app.errorhandler`) and **no try/except** around filesystem I/O — a missing file or permission error will surface as a 500.
- **Auth checks** are repeated inline per route (no decorator). When adding a protected route, copy the `if 'logged_in' not in session:` guard.
- **Frontend**: vanilla JS, no framework. Endpoint paths are **hardcoded strings** in `main.js` (`/upload`, `/files`, `/delete/<name>`, `/share_text`, `/get_text`). When changing a route, update both `flask_app.py` and `main.js`.
- **Templates**: no inheritance. `url_for` is used only for static assets and the download link inside `index.html`; login uses a native form POST.
- **CSS**: flat hyphenated class names (`.file-item`, `.upload-area`, `.btn`, `.toast`, `.modal`, `.loading-overlay`, `.login-card`), CSS custom properties for theming. No BEM.
- **No CSRF protection** anywhere. Forms and fetch calls rely solely on the session cookie.

## Important Files

- `flask_app.py` — entry point and all routes/helpers.
- `config.py` — `Config` class:
  - `SECRET_KEY` (env `SECRET_KEY`, hardcoded fallback)
  - `PASSWORD` (env `FILESHARING_PASSWORD`, hardcoded fallback)
  - `UPLOAD_FOLDER` = `./uploads/`
  - `MAX_CONTENT_LENGTH` = 100 MB
  - `SESSION_TYPE = "filesystem"`, `SESSION_PERMANENT = True`
- `pyproject.toml` — dependencies: `flask`, `flask-session` (unpinned in manifest, locked in `uv.lock`).
- `static/js/main.js` — all client-side logic; single global `selectedFile`.
- `shared_texts/TEXT_SHARE_FILE.txt` — single shared text buffer; overwritten on each `/share_text` POST.

## Runtime / Tooling Preferences

- **Runtime**: Python 3.13+ via `uv run`. Do not invoke `python`/`pip`/`venv` directly.
- **Package manager**: `uv` only (`uv sync` against `uv.lock`).
- **Lockfile index**: `uv.lock` resolves from `pypi.tuna.tsinghua.edu.cn` (Tsinghua mirror).
- **Dev tooling** (black/ruff/pytest) is not declared in `pyproject.toml`; add as dev dependencies before introducing CI gates.

## Testing & QA

- **No test suite exists.** There are no `test_*.py`, `tests/`, `conftest.py`, or pytest config in the repo.
- **No scripts** (`scripts/`, `Makefile`, shell files).
- Smoke-test changes by running `uv run flask_app.py` and exercising the routes manually (login → upload → list → download → delete → share_text → get_text).
- When adding functionality, follow the existing JSON-response contract and add a route + frontend call pair together; manually verify both before declaring done.

## Known Issues to Be Aware Of

- `flask_app.py:164` references `app.config["ALLOWED_EXTENSIONS"]`, which is **never defined** in `Config`. That branch is currently unreachable (the preceding `if file and file.filename:` is always true after the empty-filename check), but adding extension validation will KeyError unless `ALLOWED_EXTENSIONS` is also added to `config.py`.
- `debug=True` and hardcoded fallbacks for `SECRET_KEY` / `PASSWORD` in `config.py` — do not deploy as-is; prefer setting the `SECRET_KEY` and `FILESHARING_PASSWORD` environment variables.
- `/download/<filename>` and `/delete/<filename>` take the filename from the URL path; combine with the local `secure_filename` carefully if extending.
