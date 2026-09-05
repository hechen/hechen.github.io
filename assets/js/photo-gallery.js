(() => {
  document.querySelectorAll('[data-photo-gallery]').forEach(gallery => {
    if (gallery.dataset.ready) return;
    gallery.dataset.ready = 'true';
    const thumbs = [...gallery.querySelectorAll('[data-gallery-thumb]')];
    const open = gallery.querySelector('[data-gallery-open]');
    const stageImage = open.querySelector('img');
    const dialog = gallery.querySelector('dialog');
    const viewerImage = gallery.querySelector('[data-viewer-image]');
    let current = 0;
    const show = index => {
      current = (index + thumbs.length) % thumbs.length;
      const selected = thumbs[current];
      const alt = selected.querySelector('img').alt;
      stageImage.src = selected.href;
      stageImage.alt = alt;
      open.href = selected.href;
      viewerImage.src = selected.href;
      viewerImage.alt = alt;
      gallery.querySelector('[data-gallery-caption]').textContent = alt;
      gallery.querySelector('[data-viewer-caption]').textContent = alt;
      gallery.querySelector('[data-gallery-count]').textContent = `${current + 1} / ${thumbs.length}`;
      gallery.querySelector('[data-viewer-count]').textContent = `${current + 1} / ${thumbs.length}`;
      thumbs.forEach((thumb, i) => {
        if (i === current) thumb.setAttribute('aria-current', 'true');
        else thumb.removeAttribute('aria-current');
      });
    };
    thumbs.forEach((thumb, index) => thumb.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      show(index);
    }));
    open.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialog.showModal) return;
      event.preventDefault();
      show(current);
      dialog.showModal();
    });
    gallery.querySelector('[data-gallery-close]').addEventListener('click', () => dialog.close());
    gallery.querySelector('[data-gallery-prev]').addEventListener('click', () => show(current - 1));
    gallery.querySelector('[data-gallery-next]').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        show(current + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    let touchStart;
    const surface = gallery.querySelector('.photo-viewer-stage');
    surface.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      touchStart = { x: event.clientX, y: event.clientY };
    });
    surface.addEventListener('pointercancel', () => { touchStart = null; });
    surface.addEventListener('pointerup', event => {
      if (!touchStart) return;
      const dx = event.clientX - touchStart.x;
      const dy = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    });
  });
})();
