/* AZAFRÁN — currency switcher.
   Any element with data-amt="68" data-cur="EUR" (and optional data-suffix=" / m")
   is shown in the currency the visitor picks in the header. The choice is
   remembered on this device.

   RATES are approximate and for display only: how many units of each currency
   equal 1 euro. Update them whenever you like. */
(function () {
  'use strict';

  var RATES = { EUR: 1, USD: 1.08, GBP: 0.85, INR: 90, AED: 3.97, AUD: 1.65, CAD: 1.48, CHF: 0.95, JPY: 163, SGD: 1.45 };
  var NAMES = { EUR: 'EUR · €', USD: 'USD · $', GBP: 'GBP · £', INR: 'INR · ₹', AED: 'AED · د.إ', AUD: 'AUD · A$', CAD: 'CAD · C$', CHF: 'CHF', JPY: 'JPY · ¥', SGD: 'SGD · S$' };
  var SYMBOLS = { '€': 'EUR', '₹': 'INR', '$': 'USD', '£': 'GBP' };
  var KEY = 'azafran-currency';

  var current = 'EUR';
  try {
    var saved = localStorage.getItem(KEY);
    if (saved && RATES[saved]) current = saved;
  } catch (err) {}

  function code(c) { return SYMBOLS[c] || (RATES[c] ? c : 'EUR'); }

  function convert(amount, from) {
    return Number(amount) / RATES[code(from)] * RATES[current];
  }

  /* fmt(35, 'EUR') -> "$38". Whole numbers by default; pass precise=true to
     keep cents (used for fee lines). */
  function fmt(amount, from, precise) {
    var value = convert(amount, from);
    var digits = (current === 'JPY' || current === 'INR' || !precise) ? 0 : 2;
    try {
      return new Intl.NumberFormat(current === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency', currency: current, minimumFractionDigits: 0, maximumFractionDigits: digits
      }).format(value);
    } catch (err) {
      return current + ' ' + Math.round(value);
    }
  }

  function apply(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll ? scope.querySelectorAll('[data-amt]') : [];
    Array.prototype.forEach.call(nodes, function (n) {
      n.textContent = fmt(n.getAttribute('data-amt'), n.getAttribute('data-cur') || 'EUR', n.hasAttribute('data-precise')) + (n.getAttribute('data-suffix') || '');
    });
    if (scope !== document && scope.matches && scope.matches('[data-amt]')) {
      scope.textContent = fmt(scope.getAttribute('data-amt'), scope.getAttribute('data-cur') || 'EUR') + (scope.getAttribute('data-suffix') || '');
    }
  }

  function set(c) {
    if (!RATES[c]) return;
    current = c;
    try { localStorage.setItem(KEY, c); } catch (err) {}
    apply(document);
    Array.prototype.forEach.call(document.querySelectorAll('.cur-select'), function (s) { s.value = c; });
    window.dispatchEvent(new CustomEvent('azafran:currency', { detail: c }));
  }

  /* Put the selector in the header (the router swaps the header on every
     page change, so this runs on each page). */
  function initCurrency() {
    var nav = document.querySelector('.site-nav');
    if (nav && !nav.querySelector('.cur-select')) {
      var box = document.createElement('label');
      box.className = 'cur-box';
      var span = document.createElement('span');
      span.className = 'sr-only';
      span.textContent = 'Currency';
      var sel = document.createElement('select');
      sel.className = 'cur-select';
      sel.setAttribute('aria-label', 'Choose currency');
      Object.keys(RATES).forEach(function (c) {
        var o = document.createElement('option');
        o.value = c;
        o.textContent = NAMES[c] || c;
        sel.appendChild(o);
      });
      sel.value = current;
      sel.addEventListener('change', function () { set(sel.value); });
      box.appendChild(span);
      box.appendChild(sel);
      nav.insertBefore(box, nav.firstChild);
    }
    apply(document);
  }

  window.AZAFRAN = window.AZAFRAN || {};
  window.AZAFRAN.fmt = fmt;
  window.AZAFRAN.applyCurrency = apply;
  window.AZAFRAN.currency = function () { return current; };
  window.AZAFRAN.initCurrency = initCurrency;
})();
