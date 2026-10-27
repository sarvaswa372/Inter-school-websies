/* AZAFRÁN — accounts, experiences, bookings (talks to the Node backend) */
(function () {
  'use strict';

  var me = null;
  var meLoaded = null;

  function api(url, method, body) {
    var opt = { method: method || 'GET', headers: {}, credentials: 'same-origin' };
    if (body !== undefined) {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(body);
    }
    return fetch(url, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        return { ok: r.ok, status: r.status, data: j };
      });
    });
  }

  /* Show a price in whichever currency the visitor chose in the header. */
  function money(n, cur, precise) {
    if (window.AZAFRAN && window.AZAFRAN.fmt) return window.AZAFRAN.fmt(n, cur, precise);
    return cur + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  /* A <span> that re-converts itself when the currency changes. */
  function priceSpan(n, cur, suffix) {
    var s = el('span', 'price-amt');
    s.setAttribute('data-amt', n);
    s.setAttribute('data-cur', cur);
    if (suffix) s.setAttribute('data-suffix', suffix);
    s.textContent = money(n, cur) + (suffix || '');
    return s;
  }

  var onCurrency = [];
  window.addEventListener('azafran:currency', function () {
    onCurrency.forEach(function (fn) { fn(); });
  });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function go(url) {
    if (window.AZAFRAN && window.AZAFRAN.navigate) window.AZAFRAN.navigate(url, true);
    else window.location.href = url;
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) { t = el('div', 'toast'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('is-on');
    window.setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }

  function nextTarget() {
    var next = new URLSearchParams(location.search).get('next') || '';
    return /^[a-z]+\.html$/.test(next) ? next : 'experiences.html';
  }

  /* ---------- who is logged in ---------- */
  function loadMe() {
    meLoaded = api('/api/me').then(function (r) {
      me = r.ok ? r.data.user : null;
    }).catch(function () { me = null; });
    return meLoaded;
  }

  function renderNav() {
    var box = document.getElementById('authNav');
    if (!box) return;
    box.textContent = '';
    var page = location.pathname.split('/').pop() || 'index.html';

    function link(href, text) {
      var a = el('a', 'nav-link', text);
      a.href = href;
      if (href === page) a.setAttribute('aria-current', 'page');
      box.appendChild(a);
    }

    if (me) {
      link('bookings.html', 'My bookings');
      var out = el('button', 'nav-link nav-btn', 'Log out (' + me.username + ')');
      out.type = 'button';
      out.addEventListener('click', function () {
        api('/api/logout', 'POST', {}).then(function () {
          me = null;
          renderNav();
          toast('You are logged out.');
          if (page === 'bookings.html') go('index.html');
        });
      });
      box.appendChild(out);
    } else {
      link('login.html', 'Log in');
    }
  }

  /* ---------- log in / register ---------- */
  function initAuthForm() {
    var form = document.getElementById('authForm');
    if (!form) return;
    var msg = document.getElementById('authMsg');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      msg.textContent = '';
      var pw = document.getElementById('apw').value;
      var pw2 = document.getElementById('apw2');
      if (pw2 && pw2.value !== pw) { msg.textContent = 'The two passwords do not match.'; return; }
      var mode = form.dataset.mode === 'register' ? 'signup' : 'login';
      api('/api/' + mode, 'POST', { username: document.getElementById('auser').value, password: pw })
        .then(function (res) {
          if (!res.ok) { msg.textContent = res.data.error || 'Something went wrong.'; return; }
          me = res.data.user;
          renderNav();
          go(nextTarget());
        })
        .catch(function () { msg.textContent = 'Could not reach the server. Start it with: node server.js'; });
    });
  }

  /* ---------- experiences + booking ---------- */
  function initExperiences() {
    var grid = document.getElementById('expGrid');
    if (!grid) return;
    var dlg = document.getElementById('bookDialog');
    var form = document.getElementById('bookForm');
    var done = document.getElementById('bookDone');
    var err = document.getElementById('bookErr');
    var items = [];
    var fee = 0.15;
    var current = null;
    var filter = 'all';

    function countryName(c) { return c === 'spain' ? 'Spain' : 'India'; }

    function render() {
      grid.textContent = '';
      var shown = items.filter(function (e) { return filter === 'all' || e.country === filter; });
      shown.forEach(function (e) {
        var card = el('article', 'exp-card ' + e.country);
        var img = el('img', 'exp-img');
        img.src = e.image; img.alt = ''; img.loading = 'lazy'; img.width = 600; img.height = 400;
        card.appendChild(img);
        var body = el('div', 'exp-body');
        body.appendChild(el('span', 'exp-where', e.city + ', ' + countryName(e.country)));
        body.appendChild(el('h3', 'exp-title', e.title));
        body.appendChild(el('p', 'exp-dur', e.duration));
        body.appendChild(el('p', 'exp-why', e.why));
        var meta = el('div', 'exp-meta');
        var pr = el('span', 'exp-price');
        pr.appendChild(priceSpan(e.price, e.currency, ' / guest'));
        meta.appendChild(pr);
        var b = el('button', 'btn btn-saffron btn-sm', 'Book');
        b.type = 'button';
        b.dataset.id = e.id;
        meta.appendChild(b);
        body.appendChild(meta);
        card.appendChild(body);
        grid.appendChild(card);
      });
      var count = document.getElementById('expCount');
      if (count) count.textContent = shown.length + ' experiences';
    }

    function updateSummary() {
      if (!current) return;
      var guests = Math.min(10, Math.max(1, parseInt(document.getElementById('bookGuests').value, 10) || 1));
      var total = current.price * guests;
      document.getElementById('bookSum').textContent =
        'Total ' + money(total, current.currency, true) + '. Your host receives ' +
        money(total * (1 - fee), current.currency, true) + ' and AZAFRÁN keeps ' +
        money(total * fee, current.currency, true) + '. Prices are converted at approximate rates.';
    }

    function openBooking(id) {
      current = items.filter(function (e) { return String(e.id) === String(id); })[0];
      if (!current) return;
      form.reset();
      form.hidden = false;
      done.hidden = true;
      err.textContent = '';
      document.getElementById('bookTitle').textContent = current.title;
      document.getElementById('bookSub').textContent = current.city + ', ' + countryName(current.country) + ' · ' + current.duration;
      document.getElementById('bookDate').min = new Date().toLocaleDateString('en-CA');
      updateSummary();
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    }

    function closeDlg() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }

    onCurrency.push(updateSummary);

    api('/api/experiences').then(function (res) {
      if (!res.ok) throw new Error('bad');
      items = res.data.items || [];
      fee = res.data.fee || 0.15;
      render();
    }).catch(function () {
      grid.textContent = 'Could not reach the server. Start it with: node server.js';
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-exp-filter]'), function (chip) {
      chip.addEventListener('click', function () {
        filter = chip.getAttribute('data-exp-filter');
        Array.prototype.forEach.call(document.querySelectorAll('[data-exp-filter]'), function (c) {
          var on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        render();
      });
    });

    grid.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('button[data-id]') : null;
      if (!btn) return;
      var id = btn.dataset.id;
      (meLoaded || loadMe()).then(function () {
        if (!me) { go('login.html?next=experiences.html'); return; }
        openBooking(id);
      });
    });

    document.getElementById('bookGuests').addEventListener('input', updateSummary);
    document.getElementById('bookCancel').addEventListener('click', closeDlg);
    document.getElementById('bookClose').addEventListener('click', closeDlg);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      err.textContent = '';
      api('/api/bookings', 'POST', {
        experience_id: current.id,
        date: document.getElementById('bookDate').value,
        guests: Number(document.getElementById('bookGuests').value)
      }).then(function (res) {
        if (res.status === 401) { closeDlg(); me = null; renderNav(); go('login.html?next=experiences.html'); return; }
        if (!res.ok) { err.textContent = res.data.error || 'Something went wrong.'; return; }
        var b = res.data;
        document.getElementById('bookDoneMsg').textContent =
          'Booking #' + b.id + ' confirmed for “' + b.experience + '” on ' + b.date + ' for ' + b.guests +
          ' guest(s). Total ' + money(b.total, b.currency) + '. This is a prototype, so no payment was taken.';
        form.hidden = true;
        done.hidden = false;
      }).catch(function () { err.textContent = 'Could not reach the server.'; });
    });

    /* Host application */
    var hf = document.getElementById('hostForm');
    if (hf) {
      hf.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var m = document.getElementById('hostMsg');
        m.textContent = '';
        api('/api/hosts', 'POST', {
          name: document.getElementById('hostName').value,
          city: document.getElementById('hostCity').value,
          offer: document.getElementById('hostOffer').value
        }).then(function (res) {
          if (res.ok) { m.textContent = 'Thank you! Your application was saved.'; hf.reset(); }
          else m.textContent = res.data.error || 'Something went wrong.';
        }).catch(function () { m.textContent = 'Could not reach the server.'; });
      });
    }
  }

  /* ---------- my bookings ---------- */
  function initBookings() {
    var box = document.getElementById('myBookings');
    if (!box) return;
    (meLoaded || loadMe()).then(function () {
      box.textContent = '';
      if (!me) {
        var p = el('p', 'credits-intro');
        var a = el('a', 'text-link', 'Log in');
        a.href = 'login.html?next=bookings.html';
        p.appendChild(a);
        p.appendChild(document.createTextNode(' to see your bookings.'));
        box.appendChild(p);
        return;
      }
      api('/api/my/bookings').then(function (res) {
        if (!res.ok) { box.textContent = 'Could not load your bookings.'; return; }
        var list = res.data.bookings || [];
        if (!list.length) {
          var p = el('p', 'credits-intro', 'No bookings yet. ');
          var a = el('a', 'text-link', 'Find an experience →');
          a.href = 'experiences.html';
          p.appendChild(a);
          box.appendChild(p);
          return;
        }
        list.forEach(function (b) {
          var row = el('div', 'my-booking');
          row.appendChild(el('p', 'my-title', b.title));
          var meta = el('p', 'my-meta', b.city + ' · ' + b.date + ' · ' + b.guests + ' guest(s) · ');
          meta.appendChild(priceSpan(b.total, b.currency));
          meta.appendChild(document.createTextNode(' · Booking #' + b.id));
          row.appendChild(meta);
          box.appendChild(row);
        });
      }).catch(function () { box.textContent = 'Could not reach the server.'; });
    });
  }

  function initAccount() {
    onCurrency = [];
    (meLoaded || loadMe()).then(function () {
      renderNav();
      initAuthForm();
      initExperiences();
      initBookings();
    });
  }

  window.AZAFRAN = window.AZAFRAN || {};
  window.AZAFRAN.initAccount = initAccount;
  window.AZAFRAN.cleanupAccount = function () {};

  /* The router calls initAccount on every page it shows, including the first one. */
})();
