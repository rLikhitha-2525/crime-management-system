# HTML Pages Documentation

This document explains each frontend HTML page and its purpose.

## `index.html` (Dashboard)

Purpose:

- show approved crimes on a Leaflet map
- show total crimes and high-risk area counts
- show crime-type distribution chart

Connected scripts:

- `js/api.js`
- `js/map.js`

## `report.html` (Report Crime)

Purpose:

- provide input form fields for a new crime report

Current fields:

- title
- description
- crime type
- latitude
- longitude

Connected scripts:

- `js/api.js`
- `js/report.js` (placeholder logic)

## `login.html` (Authentication UI)

Purpose:

- provide login/logout UI shell

Current fields:

- email
- password

Connected scripts:

- `js/auth.js` (placeholder logic)

## `admin.html` (Admin Panel)

Purpose:

- display pending reports list (UI scaffold)
- expose approve/reject action buttons (UI scaffold)

Connected scripts:

- `js/api.js`
- `js/admin.js` (placeholder logic)

## Shared layout rules

All pages include:

- common Bootstrap navbar
- links to dashboard/report/admin/login pages
- shared stylesheet `css/styles.css`
