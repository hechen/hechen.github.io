(() => {
  const film = document.querySelector('#duo-shortcut video');
  if (!film) return;
  const root = document.documentElement;
  const light = new URL(film.querySelector('source').src);
  let appearance = 'light';

  function matchAppearance() {
    const next = root.dataset.appearance || (root.classList.contains('dark') ? 'dark' : 'light');
    if (appearance === next) return;
    appearance = next;
    const url = new URL('duo-punch-' + next + '.mp4', light);
    film.poster = new URL('duo-punch-' + next + '.jpg', light).href;
    film.src = url.href;
  }
  matchAppearance();
  new MutationObserver(matchAppearance).observe(root, {
    attributes: true, attributeFilter: ['class', 'data-appearance']
  });

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || motion.matches) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    if (!motion.matches && film.paused && !film.played.length) film.play().catch(() => {});
  }, { threshold: 0.65 });
  observer.observe(film);
})();
