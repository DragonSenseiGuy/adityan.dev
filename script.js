// Theme toggle. The initial theme is applied by an inline script in <head>.
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

// Hero backdrops. The shader runtime is ~150 kB minified, so it is only
// fetched when every guard below passes.
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
        startHeroCanvas(canvas).catch(() => canvas.remove());
      });
    })
    .catch(() => heroCanvases.forEach((canvas) => canvas.remove()));
}
