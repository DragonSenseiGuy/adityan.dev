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
