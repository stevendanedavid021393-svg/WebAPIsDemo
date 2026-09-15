# Web APIs Demo — Geolocation + Web Storage

A small, dependency-free HTML/CSS/JS page demonstrating two browser APIs:

- **[Geolocation API](https://www.w3schools.com/js/js_api_geolocation.asp)** —
  retrieves the user's current coordinates via `navigator.geolocation.getCurrentPosition`.
- **[Web Storage API](https://www.w3schools.com/js/js_api_web_storage.asp)** —
  persists the last retrieved location in the browser using `localStorage`,
  and reloads it on page load.

## Error handling

- **Geolocation**: checks for API support before use, and handles all three
  `GeolocationPositionError` codes (`PERMISSION_DENIED`, `POSITION_UNAVAILABLE`,
  `TIMEOUT`) with a distinct user-facing message for each, plus a fallback for
  any unknown error.
- **Web Storage**: every `localStorage` read/write is wrapped in a
  `try/catch`, since it can throw (private browsing, storage disabled, quota
  exceeded, corrupted JSON) even though it's rarely unavailable.

## Running it

No build step — just open `index.html` in a browser, or serve the folder
with any static file server, e.g.:

```bash
npx serve .
```

Click **Get My Location** and allow the permission prompt. The result is
displayed on screen and saved locally; reload the page to see it recalled
from storage, or click **Clear Saved Location** to remove it.
