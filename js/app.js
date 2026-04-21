// ── Config ───────────────────────────────────────────────────────
export const CONFIG = {
  TMDB_API_KEY: '6e0f72f362c593ce968f1e4b320fb600',
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  IMG_BASE:      'https://image.tmdb.org/t/p/w500',
  IMG_ORIGINAL:  'https://image.tmdb.org/t/p/original',
  PAGE_SIZE:     10,
};

// ── Toast ────────────────────────────────────────────────────────
let _toastTimer;
export function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (type ? ' toast--' + type : '');
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Spinner helper ───────────────────────────────────────────────
export function showSpinner() {
  document.getElementById('app').innerHTML =
    '<div class="spinner-fullpage"><div class="spinner"></div></div>';
}

// ── Router ───────────────────────────────────────────────────────
function router() {
  const hash = window.location.hash.slice(1) || 'home';

  if (hash === 'home' || hash === '' || hash === '/') {
    import('./views/home.js').then(m => m.renderHome());

  } else if (hash.startsWith('search')) {
    const qs  = hash.includes('?') ? hash.split('?')[1] : '';
    const q   = new URLSearchParams(qs).get('q') || '';
    import('./views/search.js').then(m => m.renderSearch(q));

  } else if (hash.startsWith('detail/')) {
    const id = hash.split('/')[1];
    import('./views/detail.js').then(m => m.renderDetail(id));

  } else if (hash === 'lists') {
    import('./views/lists.js').then(m => m.renderLists());

  } else {
    // Fallback — go home
    import('./views/home.js').then(m => m.renderHome());
  }

  updateNavActive(hash);
}

function updateNavActive(hash) {
  document.querySelectorAll('.nav-link[data-route]').forEach(link => {
    const route = link.dataset.route;
    const active =
      hash.startsWith(route) ||
      (route === 'home' && (hash === '' || hash === '/' || hash === 'home'));
    link.classList.toggle('active', active);
  });
}

// ── Nav init ─────────────────────────────────────────────────────
function initNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks  = document.getElementById('nav-links');

  // Hamburger toggle
  hamburger?.addEventListener('click', () => navLinks.classList.toggle('open'));

  // Close menu when a link is clicked
  navLinks?.addEventListener('click', e => {
    if (e.target.closest('a, button')) navLinks.classList.remove('open');
  });

  // Scroll shadow
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')
      ?.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // Nav search
  const searchInput = document.getElementById('nav-search-input');
  const searchBtn   = document.getElementById('nav-search-btn');

  function doNavSearch() {
    const q = searchInput.value.trim();
    if (q) window.location.hash = 'search?q=' + encodeURIComponent(q);
  }
  searchBtn?.addEventListener('click', doNavSearch);
  searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doNavSearch(); });

  // Auth button → go to lists
  document.getElementById('nav-auth-btn')?.addEventListener('click', () => {
    window.location.hash = 'lists';
  });

  // Actor modal close
  document.getElementById('actor-modal-close')?.addEventListener('click', () => {
    document.getElementById('actor-modal').hidden = true;
  });
  document.getElementById('actor-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.hidden = true;
  });

  // Auth modal close
  document.getElementById('auth-modal-close')?.addEventListener('click', () => {
    document.getElementById('auth-modal').hidden = true;
  });
  document.getElementById('auth-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.hidden = true;
  });
}

// ── Bootstrap ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  window.addEventListener('hashchange', router);
  router();
});
