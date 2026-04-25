# Frontend Documentation

The frontend is a vanilla multi-page UI that consumes Django REST endpoints from `http://127.0.0.1:8000/api/`.

## Structure

```text
frontend/
├── index.html
├── report.html
├── login.html
├── admin.html
├── css/
│   ├── styles.css
│   └── README.md
├── js/
│   ├── api.js
│   ├── map.js
│   ├── auth.js
│   ├── report.js
│   ├── admin.js
│   └── README.md
├── html/
│   └── README.md
└── assets/
```

## Pages

- `index.html`: dashboard map, stats, crime chart
- `report.html`: submit-crime form UI
- `login.html`: login/logout UI shell
- `admin.html`: admin moderation table shell

See `frontend/html/README.md` for per-page details.

## Running frontend

1. Run backend first at `http://127.0.0.1:8000`
2. Open `frontend/index.html` in your browser
3. Navigate between pages using the navbar

## Dependencies (CDN)

- Bootstrap 5
- Leaflet (dashboard page)
- Chart.js (dashboard page)

## Notes

- Business logic has been moved out of HTML and into `js/`.
- API URL is centralized in `js/api.js`.
