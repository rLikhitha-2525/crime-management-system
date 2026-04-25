# JavaScript Documentation

Frontend JS is split by responsibility.

## `api.js`

Purpose:

- centralize backend API calls
- keep one `BASE_URL`
- expose reusable API helpers via `window.CrimeAPI`

Functions:

- `getCrimes()`
- `getAlerts()`
- `getPredictions()`
- `submitCrime(data)`

## `map.js`

Purpose:

- dashboard-only rendering logic
- initialize Leaflet map
- render markers, high-risk circles, predicted hotspot circles
- update stats + render chart

Depends on:

- `api.js`
- Leaflet CDN
- Chart.js CDN

## `report.js`

Current status:

- placeholder file for report submission flow

Planned:

- capture report form values
- validate input
- call `CrimeAPI.submitCrime(...)`

## `auth.js`

Current status:

- placeholder file for login/logout flow

Planned:

- login API integration
- token/local-session storage
- logout helper

## `admin.js`

Current status:

- placeholder file for admin moderation flow

Planned:

- fetch pending reports
- approve/reject actions
