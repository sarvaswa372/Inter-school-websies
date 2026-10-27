AZAFRAN - India x Espana cultural exchange (merged site)
========================================================

Folder layout
  Website/   all pages and assets (index, market, experiences, login, register,
             bookings, credits; assets/ has styles, scripts, images, fonts, music)
  Bakend/    server.js (Node.js backend), data.json (data), check.js (self-test)

Run it (needs Node.js 18 or newer, nothing else to install)
  Windows:  double-click start-server.bat
  Any OS:   cd Bakend, then:  node server.js
  Open:     http://localhost:3000/

Do not open the .html files directly or with another static server: the
bookings, accounts and forms need the Node server.

Self-test:  cd Bakend, then:  node check.js

What the backend does
  - Accounts: sign up, log in, log out (passwords hashed, HttpOnly cookie)
  - Experiences and bookings (login needed to book; "My bookings" page)
  - Host applications, festival sign-ups and newsletter emails are saved
  - Platform fee is 15%: the host keeps 85% (change "fee" in data.json)
  - Admin totals: set ADMIN_KEY first, then call /api/admin/summary with the
    header x-admin-key.   Windows:  set ADMIN_KEY=choose-a-secret
    Mac/Linux:  ADMIN_KEY=choose-a-secret node server.js

Everything people submit is stored in Bakend/data.json.
This is a prototype: no real payments are taken.
