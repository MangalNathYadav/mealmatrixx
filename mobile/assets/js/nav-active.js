// Multi-page bottom navigation active state handler
// Determines current page by file name and applies 'active' class accordingly.
(function() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const map = {
    'dashboard.html': 'dashboard.html',
    'meal-history.html': 'dashboard.html', // group under dashboard
    'meal-details.html': 'dashboard.html', // hypothetical
    'add-meal.html': 'add-meal.html',
    'nutrition-goals.html': 'nutrition-goals.html',
    'goals-edit.html': 'nutrition-goals.html', // hypothetical goals sub-page
    'advanced-features.html': 'advanced-features.html',
    'profile.html': 'profile.html',
    'settings.html': 'profile.html' // hypothetical settings under profile
  };
  const current = map[path];
  if (!current) return;
  const navBar = document.querySelector('.bottom-nav');
  const items = Array.from(document.querySelectorAll('.bottom-nav a.bottom-nav-item'));
  if (!navBar || !items.length) return;

  // Ensure indicator element exists
  let indicator = navBar.querySelector('.bottom-nav-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'bottom-nav-indicator';
    navBar.appendChild(indicator);
  }

  function activate(href) {
    items.forEach(el => el.classList.toggle('active', el.getAttribute('href') === href));
    const activeEl = items.find(el => el.classList.contains('active'));
    if (activeEl) {
      const rect = activeEl.getBoundingClientRect();
      const parentRect = navBar.getBoundingClientRect();
      const width = rect.width * 0.5; // 50% width centered under icon
      const left = rect.left - parentRect.left + (rect.width - width)/2;
      indicator.style.transform = `translateX(${left}px)`;
      indicator.style.width = width + 'px';
    }
  }

  // Initial
  activate(current);

  // Attach click transitions (progressive enhancement)
  items.forEach(el => {
    el.addEventListener('click', () => {
      activate(el.getAttribute('href'));
    });
  });

  // Recalculate on resize/orientation
  window.addEventListener('resize', () => activate(items.find(i => i.classList.contains('active'))?.getAttribute('href') || current));
})();
