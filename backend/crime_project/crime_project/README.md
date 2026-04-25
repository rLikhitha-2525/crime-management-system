# Django Project Config Documentation

This folder contains Django project-level configuration and routing.

## Files

- `settings.py` - project settings (apps, middleware, DB, timezone)
- `urls.py` - top-level URL routes
- `asgi.py` - ASGI entrypoint
- `wsgi.py` - WSGI entrypoint

## `settings.py` highlights

- Uses SQLite database (`db.sqlite3`)
- Registers apps:
  - `crime_app`
  - `rest_framework`
- Timezone set to `Asia/Kolkata`
- `DEBUG=True` in current state

## `urls.py` routes

- `admin/` -> Django admin
- `api/report/` -> create report
- `api/crimes/` -> approved crimes
- `api/alerts/` -> high-risk areas
- `api/predict/` -> predicted hotspots

## Deployment note

Before production use:

- replace secret key
- disable debug mode
- set allowed hosts
- add proper static/media handling
