# Problems

- Task 23 / F3 blocker: Browser-based manual replay is not executable in current environment.
  - Playwright MCP expects `/opt/google/chrome/chrome` (missing).
  - Available cached browsers require missing system libs (`libnspr4.so`, `libnss3.so`, `libasound.so.2`, `libwebkitgtk-6.0.so.4`).
  - No elevated capability to install required libraries.
  - API/runtime/build verifications passed, but visual browser replay remains pending.
