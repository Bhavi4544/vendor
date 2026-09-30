# Vendor Roster: VFX Vendor Registration Portal

A small responsive web app with two views:

- **Register** (`index.html`): a vendor fills in company, contact, services, team and portfolio details and gets a reference number (VND-1001, VND-1002, ...).
- **Admin** (`admin.html`): an administrator sees every vendor, searches by company name, filters by service or status, opens a vendor for full details and sets the status to Pending, Approved or Rejected.

## Run it

No install or build step.

1. Unzip the project.
2. Open `index.html` in a browser (Chrome, Edge, Firefox or Safari).
3. Use the **Register** / **Admin** switch in the header to move between the two views.

Optional, to serve it over http:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Google Fonts load when online; without a connection the app falls back to system fonts.

## Try the admin view quickly

Open **Admin** with no data and press **Add sample vendors**. Four fictional studios are added so search, filters, sorting and status changes can be tried straight away.

## Features against the brief

| Requirement | Where |
| --- | --- |
| Registration form with grouped sections and required-field messages | `index.html`, `js/register.js`, `js/validate.js` |
| Email format, positive team size, at least one service | `js/validate.js` |
| Entered values kept when validation fails | the form is never rebuilt (`js/register.js`) |
| Confirmation with reference number | success view in `index.html` |
| Data survives refresh | localStorage, `js/storage.js` |
| Admin list with company, contact, location, main service, team size, status | `admin.html`, `js/admin.js` |
| Search by company name, filter by service and status | toolbar and status cards in `admin.html` |
| Vendor details panel and status update | details panel in `js/admin.js` |
| Empty, success and error states | empty list, no matches, save error, confirmation |
| Desktop and mobile layouts | responsive rules in `css/style.css` (the table becomes cards on small screens) |

Extras: sorting (newest, oldest, A to Z, largest team), status counts that act as filters, keyboard support (Esc closes the details panel, focus stays inside it), and the admin list refreshes when a vendor registers in another tab.

## Project structure

```
index.html        Registration view and confirmation
admin.html        Admin view and vendor details panel
css/style.css     All styles, one shared design system
js/config.js      Services, statuses and other shared settings
js/storage.js     The only file that touches localStorage
js/validate.js    Validation rules (no DOM access)
js/register.js    Registration page behaviour
js/admin.js       Admin page behaviour
```

## Technology and decisions

Plain HTML, CSS and JavaScript, with no framework, so it runs by opening a file and the code stays easy to read. All storage goes through `js/storage.js`, so adding a backend later means changing only that file. Vendor text is escaped before it is shown in the admin view.

## Incomplete or not included

- Data lives in the browser's localStorage, so it is per browser and per device. There is no backend or database.
- The admin view has no login, so anyone who opens `admin.html` can use it.
- File upload is not included; the portfolio is a link, as the brief allows.
- No automated tests.
