// ---------------------------------------------------------------------------
// Demo: Geolocation API + Web Storage API, with error handling for both.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'lastKnownLocation';

const locateBtn = document.getElementById('locate-btn');
const clearBtn = document.getElementById('clear-btn');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const latEl = document.getElementById('lat');
const lngEl = document.getElementById('lng');
const accuracyEl = document.getElementById('accuracy');
const timestampEl = document.getElementById('timestamp');
const savedLocationEl = document.getElementById('saved-location');

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = 'status' + (type ? ' ' + type : '');
}

function showResult({ latitude, longitude, accuracy }, timestamp) {
  latEl.textContent = latitude.toFixed(5);
  lngEl.textContent = longitude.toFixed(5);
  accuracyEl.textContent = `${Math.round(accuracy)} meters`;
  timestampEl.textContent = new Date(timestamp).toLocaleString();
  resultEl.hidden = false;
}

// --- Web Storage API, wrapped with error handling -------------------------
// localStorage can throw (private browsing, storage disabled, quota
// exceeded), so every read/write goes through these helpers.

function saveLocation(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to save location to localStorage:', err);
    setStatus(
      'Location retrieved, but it could not be saved locally (storage may be full or disabled).',
      'error'
    );
    return false;
  }
}

function loadSavedLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      savedLocationEl.textContent = 'No location saved yet.';
      return;
    }
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

function clearSavedLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    loadSavedLocation();
    setStatus('Saved location cleared.', 'success');
  } catch (err) {
    console.error('Failed to clear saved location:', err);
    setStatus('Could not clear saved location.', 'error');
  }
}

// --- Geolocation API, wrapped with error handling --------------------------

function handleLocateClick() {
  if (!('geolocation' in navigator)) {
    setStatus('Geolocation is not supported by this browser.', 'error');
    return;
  }

  locateBtn.disabled = true;
  setStatus('Requesting your location…');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locateBtn.disabled = false;
      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = position.timestamp;

      setStatus('Location retrieved successfully.', 'success');
      showResult({ latitude, longitude, accuracy }, timestamp);
      saveLocation({ latitude, longitude, accuracy, timestamp });
      loadSavedLocation();
    },
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
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

locateBtn.addEventListener('click', handleLocateClick);
clearBtn.addEventListener('click', clearSavedLocation);

// Show any previously saved location as soon as the page loads.
loadSavedLocation();
