# AAHOA Dashboards

This repository contains multiple static dashboards. GitHub Pages is configured to publish only the HOC weekly dashboard from:

- [hoc-weekly-dashboard/index.html](/Users/mayurpatel/Documents/New%20project/hoc-weekly-dashboard/index.html)

Weekly update flow for the HOC dashboard:

1. Replace or update [hoc-weekly-dashboard/data/weekly-hoc-report.json](/Users/mayurpatel/Documents/New%20project/hoc-weekly-dashboard/data/weekly-hoc-report.json)
2. Commit and push to the `main` branch
3. GitHub Pages redeploys automatically

---

# Events Analytics Dashboard

A lightweight web-based analytics dashboard for an events department. It compares event performance across three years and supports both bundled sample data and user uploads.

## Features

- Upload `.csv`, `.xlsx`, or `.xls` event datasets
- Multi-sheet Excel workbooks are supported and can be grouped by tab
- Summary KPI cards:
  - Total Attendance
  - Total Cost
  - Total Revenue
  - Cost per Attendee
  - Net Profit / Loss
- Charts:
  - Attendance trend by year
  - AV cost by event
  - Catering cost vs attendance
  - Cost per attendee by event
  - Budget vs actual comparison
  - Revenue vs cost
- Year-over-year comparison table
- Filters for year, event type, and event name
- Clean, business-style dashboard UI

## Files

- [index.html](/Users/mayurpatel/Documents/New project/index.html)
- [app.js](/Users/mayurpatel/Documents/New project/app.js)
- [styles.css](/Users/mayurpatel/Documents/New project/styles.css)
- [sample-data/events-sample-data.csv](/Users/mayurpatel/Documents/New project/sample-data/events-sample-data.csv)
- [sample-data/aahoa-2024-2025-combined.csv](/Users/mayurpatel/Documents/New project/sample-data/aahoa-2024-2025-combined.csv)
- [sample-data/aahoa-2024-normalized.csv](/Users/mayurpatel/Documents/New project/sample-data/aahoa-2024-normalized.csv)
- [sample-data/aahoa-2025-normalized.csv](/Users/mayurpatel/Documents/New project/sample-data/aahoa-2025-normalized.csv)

## Run Locally

This project does not require a build step. It runs as a static site in the browser.

1. Open a terminal in `/Users/mayurpatel/Documents/New project`
2. Start a simple local server:

```bash
python3 -m http.server 4173
```

3. Open [http://localhost:4173](http://localhost:4173) in your browser

## Publish Free With GitHub Pages

This dashboard is now set up for free static hosting on GitHub Pages.

Files added for deployment:

- [.github/workflows/deploy-github-pages.yml](/Users/mayurpatel/Documents/New project/.github/workflows/deploy-github-pages.yml)
- [.nojekyll](/Users/mayurpatel/Documents/New project/.nojekyll)

To publish it:

1. Create a new GitHub repository
2. Push this project to the repository on the `main` branch
3. In GitHub, open `Settings` -> `Pages`
4. Under `Build and deployment`, choose `GitHub Actions`
5. Push any change to `main`, or run the `Deploy To GitHub Pages` workflow manually
6. GitHub will give you a free public URL like `https://your-username.github.io/your-repo-name/`

Notes:

- This project is a plain static site, so GitHub Pages is free for public repositories
- The dashboard already uses relative paths, so it works well on Pages
- If you want a custom domain later, GitHub Pages also supports that

## AAHOA Workbook Support

The dashboard now supports multi-tab workbook imports like the 2024 and 2025 AAHOA expense sheets.

- The dashboard now opens on a combined 2024-2025 AAHOA dataset, and the `Year` filter switches between years
- `Regionals` is normalized to `HOCs`
- Each remaining tab stays its own event group, such as `HOCs`, `Town Halls`, `HYPE`, or `SNAC`
- `HerO + YP Receptions` is ignored automatically
- All board meeting tabs are excluded completely
- Revenue is set aside for these normalized AAHOA datasets
- Prepared normalized files are included for both individual years and the combined 2024-2025 view

## Expected Data Columns

The dashboard is flexible about header names, but these are the most useful columns:

- `Year`
- `Event Name`
- `Event Type`
- `Attendance`
- `AV Cost`
- `Catering Cost`
- `Venue Cost`
- `Marketing Cost`
- `Other Cost`
- `Total Cost`
- `Budget`
- `Revenue`

If `Total Cost` is not included, the dashboard calculates it from AV, catering, venue, marketing, and other cost columns.

## Notes

- The first sheet in an uploaded Excel workbook is used.
- The bundled sample dataset covers 2022, 2023, and 2024.
- All calculations update live when filters change.
