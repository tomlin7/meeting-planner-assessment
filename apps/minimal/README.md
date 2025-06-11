# Meeting Planner GUI (Streamlit)

This is the graphical user interface for the Smart Meeting Planner. It lets you input user schedules, find meeting times, and visualize calendars.

## Prerequisites

- Python 3.8+
- [uv](https://github.com/astral-sh/uv) (fast Python package manager)
- The backend server running (see ../server/README.md)

## Setup

1. Install `uv` if you don't have it:
   ```sh
   pip install uv
   ```
2. Sync dependencies:
   ```sh
   uv sync
   ```

## Environment Variables

- You can configure the frontend using a `.env` file.
- Copy `.env.example` to `.env` and edit as needed.
- For example, you can set `API_URL` to point to your backend server:
  ```env
  API_URL=http://localhost:8000
  ```

## Running the GUI

Start the Streamlit app:

```sh
uv run streamlit run main.py
```

The GUI will open in your browser at [http://localhost:8501](http://localhost:8501)

## Stopping the GUI

Press `Ctrl+C` in the terminal.

## Troubleshooting

- Make sure the backend server is running before using the GUI
- If you change dependencies, re-run `uv sync`
