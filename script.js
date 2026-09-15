// ---------------------------------------------------------------------------
// Demo: Geolocation API + Web Storage API, with error handling for both.
//
// Flow:
//   1. User clicks "Get My Location" -> navigator.geolocation.getCurrentPosition()
//   2. On success, the coordinates are shown on screen AND saved to
//      localStorage (Web Storage API) so they survive a page reload.
//   3. On page load, any previously saved location is read back and shown.
//   4. "Clear Saved Location" removes the stored entry.
// ---------------------------------------------------------------------------

// Key used to store/retrieve the location object in localStorage.
const STORAGE_KEY = 'lastKnownLocation';

// --- Cache references to the DOM elements we'll read/update -----------------
const locateBtn = document.getElementById('locate-btn');
const clearBtn = document.getElementById('clear-btn');
const statusEl = document.getElementById('status'); // shows in-progress / success / error messages
const resultEl = document.getElementById('result'); // <dl> that is hidden until a location is retrieved
const latEl = document.getElementById('lat');
const lngEl = document.getElementById('lng');
const accuracyEl = document.getElementById('accuracy');
const timestampEl = document.getElementById('timestamp');
const savedLocationEl = document.getElementById('saved-location'); // shows what's currently in localStorage

/**
 * Updates the status message area.
 * @param {string} message - text to display to the user.
 * @param {'error'|'success'|undefined} type - optional style variant (adds a CSS class).
 */
function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = 'status' + (type ? ' ' + type : '');
}

/**
 * Renders a successful geolocation result into the on-screen <dl>.
 * @param {{latitude: number, longitude: number, accuracy: number}} coords
 * @param {number} timestamp - epoch ms when the position was captured.
 */
function showResult({ latitude, longitude, accuracy }, timestamp) {
  latEl.textContent = latitude.toFixed(5);
  lngEl.textContent = longitude.toFixed(5);
  accuracyEl.textContent = `${Math.round(accuracy)} meters`;
  timestampEl.textContent = new Date(timestamp).toLocaleString();
  resultEl.hidden = false; // reveal the result block (starts hidden in HTML)
}

// --- Web Storage API, wrapped with error handling ---------------------------
// localStorage can throw (private browsing, storage disabled, quota
// exceeded), so every read/write goes through these helpers.

/**
 * Persists a location object to localStorage as JSON.
 * @param {object} data - { latitude, longitude, accuracy, timestamp }
 * @returns {boolean} true if the save succeeded, false otherwise.
 */
function saveLocation(data) {
  try {
    // localStorage only stores strings, so the object must be serialized.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    // Can happen if storage is full, disabled, or blocked (e.g. private mode).
    console.error('Failed to save location to localStorage:', err);
    setStatus(
      'Location retrieved, but it could not be saved locally (storage may be full or disabled).',
      'error'
    );
    return false;
  }
}

/**
 * Reads the last saved location (if any) from localStorage and displays it
 * in the "Last Saved Location" card. Called on page load and after every
 * save/clear so that section always reflects current storage state.
 */
function loadSavedLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Nothing has been saved yet (or it was cleared).
      savedLocationEl.textContent = 'No location saved yet.';
      return;
    }
    // Parse back into an object; this can throw if the stored value is
    // somehow malformed (e.g. edited manually in devtools).
    const data = JSON.parse(raw);
    savedLocationEl.textContent =
      `Lat: ${data.latitude.toFixed(5)}, Lng: ${data.longitude.toFixed(5)}\n` +
      `Saved: ${new Date(data.timestamp).toLocaleString()}`;
  } catch (err) {
    console.error('Failed to read saved location from localStorage:', err);
    savedLocationEl.textContent =
      'Could not read saved location (local storage unavailable or data corrupted).';
  }
}

/**
 * Removes the saved location from localStorage and refreshes the UI.
 */
function clearSavedLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    loadSavedLocation(); // refresh the "Last Saved Location" card to show it's empty
    setStatus('Saved location cleared.', 'success');
  } catch (err) {
    console.error('Failed to clear saved location:', err);
    setStatus('Could not clear saved location.', 'error');
  }
}

// --- Geolocation API, wrapped with error handling ---------------------------

/**
 * Click handler for the "Get My Location" button. Requests the current
 * position from the browser, then renders and persists the result.
 */
function handleLocateClick() {
  // Not every browser/context (e.g. non-HTTPS pages) exposes the API at all.
  if (!('geolocation' in navigator)) {
    setStatus('Geolocation is not supported by this browser.', 'error');
    return;
  }

  // Disable the button while the request is in flight to avoid duplicate calls.
  locateBtn.disabled = true;
  setStatus('Requesting your location…');

  navigator.geolocation.getCurrentPosition(
    // Success callback: runs once the browser has a position.
    (position) => {
      locateBtn.disabled = false;
      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = position.timestamp;

      setStatus('Location retrieved successfully.', 'success');
      showResult({ latitude, longitude, accuracy }, timestamp);
      saveLocation({ latitude, longitude, accuracy, timestamp });
      loadSavedLocation(); // reflect the newly saved value in the "saved" card
    },
    // Error callback: runs if the user denies permission, the position can't
    // be determined, or the request times out.
    (error) => {
      locateBtn.disabled = false;
      // GeolocationPositionError codes: 1 = PERMISSION_DENIED,
      // 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT.
      let message;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Permission denied. Please allow location access and try again.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable right now.';
          break;
        case error.TIMEOUT:
          message = 'The request to get your location timed out.';
          break;
        default:
          message = 'An unknown error occurred while retrieving your location.';
      }
      console.error('Geolocation error:', error);
      setStatus(message, 'error');
    },
    // Options: prefer GPS-level accuracy, wait up to 10s, and never reuse a
    // cached position (maximumAge: 0 forces a fresh reading every click).
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

// --- Wire up event listeners --------------------------------------------
locateBtn.addEventListener('click', handleLocateClick);
clearBtn.addEventListener('click', clearSavedLocation);

// Show any previously saved location as soon as the page loads.
loadSavedLocation();
