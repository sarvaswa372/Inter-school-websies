/* AZAFRÁN — seamless page navigation */
(function () {
  'use strict';

  var pageNames = { 'index.html': true, 'market.html': true, 'credits.html': true, 'experiences.html': true, 'login.html': true, 'register.html': true, 'bookings.html': true };
  var navigating = false;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function isSameDocument(url) {
    return url.pathname === location.pathname && url.search === location.search;
  }

  function isSitePage(url) {
    var path = url.pathname;
    var file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    if (!pageNames[file]) return false;

    var base = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    return path.indexOf(base) === 0;
  }

  function shouldHandle(link, event) {
    if (event.defaultPrevented) return false;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (!link || link.target || link.hasAttribute('download')) return false;

    var url;
    try {
      url = new URL(link.href, location.href);
    } catch (err) {
      return false;
    }

    if (url.origin !== location.origin) return false;
    if (!isSitePage(url)) return false;
    if (isSameDocument(url) && url.hash) return false;
    return true;
  }

  function initPage() {
    if (window.AZAFRAN && window.AZAFRAN.initApp) window.AZAFRAN.initApp();
    if (window.AZAFRAN && window.AZAFRAN.initCurrency) window.AZAFRAN.initCurrency();
    if (window.AZAFRAN && window.AZAFRAN.initMarket) window.AZAFRAN.initMarket();
    if (window.AZAFRAN && window.AZAFRAN.initAccount) window.AZAFRAN.initAccount();
  }

  function cleanupPage() {
    if (window.AZAFRAN && window.AZAFRAN.cleanupAccount) window.AZAFRAN.cleanupAccount();
    if (window.AZAFRAN && window.AZAFRAN.cleanupMarket) window.AZAFRAN.cleanupMarket();
    if (window.AZAFRAN && window.AZAFRAN.cleanupApp) window.AZAFRAN.cleanupApp();
  }

  function updateMeta(doc) {
    var desc = doc.querySelector('meta[name="description"]');
    var current = document.querySelector('meta[name="description"]');
    if (desc && current) current.setAttribute('content', desc.getAttribute('content') || '');

    var theme = doc.querySelector('meta[name="theme-color"]');
    var currentTheme = document.querySelector('meta[name="theme-color"]');
    if (theme && currentTheme) currentTheme.setAttribute('content', theme.getAttribute('content') || '');
  }

  function scrollToTarget(url) {
    var root = document.documentElement;
    var previousBehavior = root.style.scrollBehavior;

    /* Jump immediately on route changes; CSS smooth scrolling is for user
       initiated hash links, not for swapping a whole page. */
    root.style.scrollBehavior = 'auto';

    if (url.hash) {
      var id = decodeURIComponent(url.hash.slice(1));
      var target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        root.style.scrollBehavior = previousBehavior;
        window.dispatchEvent(new Event('scroll'));
        return;
      }
    }

    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousBehavior;
    window.dispatchEvent(new Event('scroll'));
  }

  function navigate(url, push) {
    if (navigating) return;
    navigating = true;

    var target = new URL(url, location.href);
    var requestUrl = target.origin + target.pathname + target.search;

    fetch(requestUrl, {
      headers: { 'X-AZAFRAN-SPA': '1' },
      credentials: 'same-origin',
      cache: 'no-store'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'text/html');
        var nextMain = doc.querySelector('main#main');
        var currentMain = document.querySelector('main#main');
        var nextHeader = doc.getElementById('siteHeader');
        var currentHeader = document.getElementById('siteHeader');
        var nextFooter = doc.querySelector('footer.site-footer');
        var currentFooter = document.querySelector('footer.site-footer');
        if (!nextMain || !currentMain) throw new Error('Missing main element');

        cleanupPage();
        if (nextHeader && currentHeader) currentHeader.replaceWith(nextHeader);
        currentMain.replaceWith(nextMain);
        if (nextFooter && currentFooter) currentFooter.replaceWith(nextFooter);

        document.title = doc.title;
        updateMeta(doc);
        if (doc.body && doc.body.className) document.body.className = doc.body.className;

        if (push) history.pushState({ azafran: true }, '', target.href);

        initPage();
        scrollToTarget(target);
      })
      .catch(function () {
        window.location.href = target.href;
      })
      .then(function () {
        navigating = false;
      });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    if (!shouldHandle(link, event)) return;
    event.preventDefault();
    navigate(link.href, true);
  });

  window.addEventListener('popstate', function () {
    navigate(location.href, false);
  });

  window.AZAFRAN = window.AZAFRAN || {};
  window.AZAFRAN.initPage = initPage;
  window.AZAFRAN.cleanupPage = cleanupPage;
  window.AZAFRAN.navigate = navigate;

  function start() {
    initPage();
    if (location.hash) {
      window.setTimeout(function () {
        scrollToTarget(new URL(location.href));
      }, 0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
