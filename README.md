# Minimal Meeting Planner - Assessment

## 1. How exactly did you use AI while building this?

- **Tools Used:**
  - GPT-4 (via cursor)
- **Workflow:**
  - I described the project requirements and endpoints.
  - Then asked the AI to scaffold the FastAPI backend.
  - Fixed the code to actually run without errors, fixed type errors.
  - Then asked the AI to generate a prototype GUI with streamlit
  - AI included unnecessary imports and some redundant comments, fixed them.
  - Corrected AI to fetch suggestions for specific users
  - It did not implement booking functionality or a frontend.
  - Fixed small type errors manually
  - Wrote a basic README, and asked AI to enhance it.

## 2. If given two more days, what would you refactor or add first, and why?

- Optimize the free slot finding logic for efficiency.
- Add unit tests for edge cases.
- Add a better frontend (React + Vite) - already done in [apps/react](./apps/react)
- Persist data with SQlite
- Add authentication for user-specific calendar access.

These changes would make the app more reliable and production-ready.
