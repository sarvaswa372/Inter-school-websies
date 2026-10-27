/* AZAFRÁN — shared interactions */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var smooth = reduceMotion.matches ? 'auto' : 'smooth';

  /* Fire-and-forget POST to the backend. Silent when the site is served
     without the Node server (forms still show their thank-you state). */
  function send(url, body) {
    try {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      }).catch(function () {});
    } catch (err) { return null; }
  }

  var header = null;
  var progress = null;
  var revealObserver = null;
  var revealTimer = null;
  var revealItems = [];

  /* ------------------------------------------------------------------
     Sticky header state + reading progress
     ------------------------------------------------------------------ */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 18);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ------------------------------------------------------------------
     Signup — prefill role / city from links and URL
     ------------------------------------------------------------------ */
  function setSignup(role, city) {
    var roleSelect = document.getElementById('role');
    var citySelect = document.getElementById('city');
    if (role && roleSelect) {
      var matchRole = Array.prototype.some.call(roleSelect.options, function (o) { return o.value === role; });
      if (matchRole) roleSelect.value = role;
    }
    if (city && citySelect) {
      var matchCity = Array.prototype.some.call(citySelect.options, function (o) { return o.value === city; });
      if (matchCity) citySelect.value = city;
    }
  }

  function syncSignupFromUrl() {
    var params = new URLSearchParams(window.location.search);
    setSignup(params.get('role'), params.get('city'));
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('[data-role], [data-city]') : null;
    if (!link) return;
    var role = link.getAttribute('data-role');
    var city = link.getAttribute('data-city');
    if (!role && !city) return;
    event.preventDefault();
    setSignup(role, city);
    var section = document.getElementById('signup');
    if (section) {
      section.scrollIntoView({ behavior: smooth, block: 'start' });
      window.setTimeout(function () {
        var firstField = document.getElementById('name');
        if (firstField) firstField.focus({ preventScroll: true });
      }, 650);
    }
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || !form.id) return;

    if (form.id === 'signupForm') {
      event.preventDefault();

      var nameField = form.querySelector('#name');
      var emailField = form.querySelector('#email');
      var citySelect = form.querySelector('#city');

      if (nameField && !nameField.value.trim()) {
        nameField.reportValidity();
        return;
      }
      if (emailField && !emailField.value.trim()) {
        emailField.reportValidity();
        return;
      }
      if (emailField && emailField.value && !emailField.checkValidity()) {
        emailField.reportValidity();
        return;
      }

      send('/api/signups', {
        name: nameField ? nameField.value : '',
        email: emailField ? emailField.value : '',
        role: (form.querySelector('#role') || {}).value,
        city: citySelect ? citySelect.value : ''
      });

      var fields = form.querySelector('.form-fields');
      var done = form.querySelector('.form-done');
      var doneCity = form.querySelector('[data-done-city]');
      if (doneCity && citySelect) doneCity.textContent = citySelect.value === 'Online' ? 'the online bazaar' : citySelect.value;
      if (fields) fields.hidden = true;
      if (done) {
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus({ preventScroll: true });
        done.scrollIntoView({ behavior: smooth, block: 'center' });
      }
      return;
    }

    if (form.id === 'newsForm') {
      event.preventDefault();
      var input = form.querySelector('#newsEmail');
      if (!input) return;
      if (!input.value.trim() || !input.checkValidity()) {
        input.reportValidity();
        return;
      }
      send('/api/newsletter', { email: input.value });
      input.value = '';
      input.placeholder = "You're on the list — thank you.";
      input.disabled = true;
      var btn = form.querySelector('button');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.5 9.5 7 13l7.5-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
    }
  });

  /* ------------------------------------------------------------------
     Reveal on scroll — lines and blocks slide in from the right
     ------------------------------------------------------------------ */
  function initReveals() {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (revealTimer) {
      window.clearTimeout(revealTimer);
      revealTimer = null;
    }

    revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal, .reveal-lines'));

    function showAll() {
      revealItems.forEach(function (el) { el.classList.add('is-in'); });
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
      revealObserver = observer;

      revealItems.forEach(function (el) { observer.observe(el); });

      /* Anything already above the fold gets a gentle staggered entrance. */
      revealTimer = window.setTimeout(function () {
        revealItems.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.92) el.classList.add('is-in');
        });
      }, 80);
    } else {
      showAll();
    }
  }


  /* ------------------------------------------------------------------
     Feature cards — overlapped stack. Click brings a card to the front,
     clicking it again (or anywhere else) sends it back.
     ------------------------------------------------------------------ */
  function setFront(card) {
    Array.prototype.forEach.call(document.querySelectorAll('.feature-grid .feature.is-front'), function (c) {
      if (c !== card) c.classList.remove('is-front');
    });
    if (card) card.classList.add('is-front');
  }

  /* Capture phase, so a link on a card that is still at the back only
     brings the card forward; the link works on the next click. */
  document.addEventListener('click', function (event) {
    var card = event.target.closest ? event.target.closest('.feature-grid .feature') : null;
    if (!card) { setFront(null); return; }
    var link = event.target.closest('a');
    if (!card.classList.contains('is-front')) {
      event.preventDefault();
      event.stopPropagation();
      setFront(card);
      return;
    }
    if (!link) card.classList.remove('is-front');
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setFront(null);
    var card = event.target && event.target.matches && event.target.matches('.feature-grid .feature') ? event.target : null;
    if (card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      if (card.classList.contains('is-front')) card.classList.remove('is-front'); else setFront(card);
    }
  });

  function initFeatureCards() {
    Array.prototype.forEach.call(document.querySelectorAll('.feature-grid .feature'), function (c) {
      c.setAttribute('tabindex', '0');
    });
  }

  function initApp() {
    header = document.getElementById('siteHeader');
    progress = document.querySelector('.progress span');
    onScroll();
    initReveals();
    syncSignupFromUrl();
    initFeatureCards();
  }

  function cleanupApp() {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (revealTimer) {
      window.clearTimeout(revealTimer);
      revealTimer = null;
    }
    revealItems = [];
  }

  window.AZAFRAN = window.AZAFRAN || {};
  window.AZAFRAN.send = send;
  window.AZAFRAN.initApp = initApp;
  window.AZAFRAN.cleanupApp = cleanupApp;
})();
