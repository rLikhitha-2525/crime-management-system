# Backend Documentation

Backend is a Django + Django REST Framework service under `backend/crime_project`.

## Structure

```text
backend/
└── crime_project/
    ├── manage.py
    ├── crime_app/
    │   └── README.md
    └── crime_project/
        └── README.md
```

## Setup

From `backend/crime_project`:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install django djangorestframework
python manage.py migrate
python manage.py runserver
```

Optional admin user:

```powershell
python manage.py createsuperuser
```

## Service URLs

- API base: `http://127.0.0.1:8000/api/`
- Admin: `http://127.0.0.1:8000/admin/`

## API endpoints

- `POST /api/report/`
- `GET /api/crimes/`
- `GET /api/alerts/`
- `GET /api/predict/`

See `backend/crime_project/crime_app/README.md` for endpoint behavior details.
