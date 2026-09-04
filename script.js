// Theme toggle — stored choice wins, otherwise follow system preference.
// The initial theme is applied by an inline script in <head> to avoid a flash.
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
  });
}

// Copy email to clipboard (contact page)
const copyBtn = document.querySelector('[data-copy-email]');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copyEmail);
      const label = copyBtn.querySelector('[data-copy-label]') || copyBtn;
      const original = label.textContent;
      label.textContent = 'Copied!';
      setTimeout(() => { label.textContent = original; }, 1600);
    } catch {
      window.location.href = `mailto:${copyBtn.dataset.copyEmail}`;
    }
  });
}

// Footer year
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Hero backdrops: a WebGPU contour field behind the page title, loaded only
// where it is welcome. Every guard below is a reason not to download the
// ~50 kB of shader runtime.
const heroCanvases = document.querySelectorAll('[data-hero-canvas]');
if (
  heroCanvases.length &&
  navigator.gpu &&
  window.matchMedia('(min-width: 768px)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  import('/hero-canvas.js')
    .then(({ startHeroCanvas }) => {
      heroCanvases.forEach((canvas) => {
        // No adapter, no backdrop, no noise about it.
        startHeroCanvas(canvas).catch(() => canvas.remove());
      });
    })
    .catch(() => heroCanvases.forEach((canvas) => canvas.remove()));
}
