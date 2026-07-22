// Scroll reveal — skipped entirely when the user prefers reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.07}s`;
    observer.observe(el);
  });
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
}

// Project filters (projects page)
const filterBar = document.querySelector('.filter-bar');
if (filterBar) {
  const buttons = filterBar.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card[data-category]');

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

    const filter = btn.dataset.filter;
    cards.forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.style.display = show ? '' : 'none';
    });
  });
}

// Copy email to clipboard (contact page)
const copyBtn = document.querySelector('[data-copy-email]');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copyEmail);
      const label = copyBtn.querySelector('.cc-value');
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
