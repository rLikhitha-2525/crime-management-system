# Crime App Documentation

This is the domain app that stores and serves crime report data.

## Files

- `models.py` - `CrimeReport` model definition
- `serializers.py` - DRF serializer for `CrimeReport`
- `views.py` - API endpoints
- `admin.py` - Django admin registration
- `migrations/` - schema migrations

## Data model: `CrimeReport`

Fields:

- `title` (`CharField`)
- `description` (`TextField`)
- `crime_type` (`CharField`)
- `latitude` (`FloatField`)
- `longitude` (`FloatField`)
- `status` (`BooleanField`, default `False`)
- `created_at` (`DateTimeField`, auto now add)

## API behavior

### `submit_crime` -> `POST /api/report/`

- validates request body with serializer
- saves report if valid
- returns message response

### `get_crimes` -> `GET /api/crimes/`

- returns only approved rows (`status=True`)

### `get_alerts` -> `GET /api/alerts/`

- filters last 7 days approved reports
- rounds coordinates to 2 decimals
- groups by area key (`lat_lng`)
- marks area as high risk if count >= 5

### `predict_crime` -> `GET /api/predict/`

- uses all reports
- rounds coordinates to 2 decimals
- groups by area key (`lat_lng`)
- marks hotspot if count >= 3
