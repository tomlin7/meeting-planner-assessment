# Meeting Planner Server (FastAPI)

This is the backend server for the Smart Meeting Planner. It provides REST APIs for managing user schedules, suggesting meeting times, and booking meetings.

## Prerequisites

- Python 3.8+
- [uv](https://github.com/astral-sh/uv) (fast Python package manager)

## Setup

1. Install `uv` if you don't have it:
   ```sh
   pip install uv
   ```
2. Sync dependencies:
   ```sh
   uv sync
   ```

## Running the Server

Start the FastAPI server with auto-reload:

```sh
uv run uvicorn main:app --reload
```

The server will be available at [http://localhost:8000](http://localhost:8000)

## Example API Endpoints

- `POST /slots` — Upload user busy slots
- `GET /suggest` — Get suggested meeting times
- `GET /calendar/{userId}` — Get a user's busy slots
- `POST /book` — Book a meeting slot

See the main.py file for full API details and payload formats.

## Stopping the Server

Press `Ctrl+C` in the terminal.

## Troubleshooting

- Make sure no other process is using port 8000.
- If you change dependencies, re-run `uv sync`.
