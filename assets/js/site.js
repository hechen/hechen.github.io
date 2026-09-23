/* Theme toggle, masthead state, and scroll reveals for the whole site. */
(function () {
  'use strict';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function stored(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function store(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }

  function apply(dark) {
    root.classList.toggle('dark', dark);
    root.dataset.theme = dark ? 'dark' : 'light';
    // Code blocks follow the page unless the reader picked a code theme.
    if (!stored('chen-code-theme')) {
      var code = dark ? 'github-dark' : 'github-light';
      ['github-light', 'github-dark', 'dracula'].forEach(function (name) {
        root.classList.toggle('code-theme-' + name, name === code);
      });
      document.querySelectorAll('.code-theme-select').forEach(function (select) { select.value = code; });
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
    var giscus = document.querySelector('iframe.giscus-frame');
    if (giscus) giscus.contentWindow.postMessage({ giscus: { setConfig: { theme: dark ? 'transparent_dark' : 'light' } } }, 'https://giscus.app');
  }

  apply(root.classList.contains('dark'));
  document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      var dark = !root.classList.contains('dark');
      store('chen-theme', dark ? 'dark' : 'light');
      apply(dark);
    });
  });
  media.addEventListener('change', function (event) { if (!stored('chen-theme')) apply(event.matches); });

  var masthead = document.querySelector('[data-masthead]');
  if (masthead) {
    var onScroll = function () { masthead.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); observer.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px 12% 0px' });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
