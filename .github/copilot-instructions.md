# Copilot instructions for ia_ejercicio_web ✅

## Quick project summary
- Minimal FastAPI application with an in-memory data store for extracurricular **activities**.
- Backend: `src/app.py` (FastAPI `app` instance). Frontend: static site served from `src/static/` (`index.html`, `app.js`, `styles.css`).
- No database or tests present in the repo as of now; data is lost on process restart.

---

## Architecture & important patterns 🔧
- Single-process, in-memory model: `activities` is a module-level dict in `src/app.py` used as the source of truth. Key facts:
  - Activity identifier: **activity name** (string) used as the dict key.
  - Student identifier: **email** (string) in the `participants` list.
  - Activity object shape (example):

```json
"Chess Club": {
  "description": "...",
  "schedule": "...",
  "max_participants": 12,
  "participants": ["michael@mergington.edu"]
}
```

- Static files are mounted at `/static` via `app.mount(...)`. Root (`/`) redirects to `/static/index.html`.
- API surface (primary endpoints):
  - GET `/activities` → returns the full `activities` dict.
  - POST `/activities/{activity_name}/signup?email=...` → appends the email to `participants` and returns `{ "message": "..." }`.
  - 404 semantics: signup raises `HTTPException(status_code=404)` if the activity name doesn't exist.

---

## Developer workflows & commands ⚙️
- Recommended dev server (supports code reload):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
.venv/bin/uvicorn src.app:app --reload
# or: uvicorn src.app:app --reload
```

- Built-in API docs after running the server:
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

- Note: `src/README.md` suggests `python app.py`; `app.py` does not have an if __name__ == "__main__" runner, so prefer the `uvicorn` command above.

---

## Project-specific conventions & caveats ⚠️
- Mutating global state: signup handler directly mutates `activity["participants"]`. This is fine for the toy app, but:
  - Be aware of concurrency and process-worker semantics—using multiple workers or deploying in production will not share this in-memory state.
  - There is no duplicate-checking or capacity enforcement (calling signup repeatedly will keep appending).
- Frontend expectations: the static `app.js` expects the API shapes above (GET returns activity map; POST returns JSON with `message` on success or `detail` on error).

---

## Suggested tests & examples for agents 📋
- Repo has no tests. Use `pytest` + `fastapi.testclient` to test handlers. Example skeleton:

```python
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    r = client.get('/activities')
    assert r.status_code == 200
    assert "Chess Club" in r.json()

def test_signup_adds_participant():
    r = client.post('/activities/Chess%20Club/signup?email=test@mergington.edu')
    assert r.status_code == 200
    assert 'Signed up test@mergington.edu' in r.json()['message']
```

- Keep `pytest.ini` behavior in mind (`pythonpath = .`) so tests can import `src` directly.

---

## Guidance for common changes or improvements 💡
- If adding persistence: move `activities` into a module that abstracts storage (e.g., in-memory -> file -> DB) and inject it into path operations or use dependency overrides in tests.
- If adding validation: enforce max participants and duplicate checks in `signup_for_activity` and return 400 with a clear `detail` message to match frontend expectations.
- If adding tests for concurrency or production behavior: note that `uvicorn` with multiple workers requires external storage (not module-level dict).

---

## Files to look at when making changes
- `src/app.py` (core app and API handlers)
- `src/static/app.js` (frontend API interactions and UI expectations)
- `src/README.md` and root `README.md` (run instructions; slight inconsistency exists—prefer `uvicorn`)
- `requirements.txt` (dependencies: `fastapi`, `uvicorn`)

---

If any of the short points above are unclear or you'd like me to expand sections (eg. add a test suite PR template or a small persistence refactor example), tell me which area to expand and I'll iterate. ✍️