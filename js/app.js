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

let loginInProgress = false;

export async function startTmdbLogin() {
  if (loginInProgress) return;
  loginInProgress = true;

  try {
    const response = await fetch(
      `${CONFIG.TMDB_BASE_URL}/authentication/token/new?api_key=${CONFIG.TMDB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Could not create request token.');
    }

    const data = await response.json();
    console.log('FULL TOKEN RESPONSE:', data);

    if (!data.request_token) {
      throw new Error('TMDB did not return a request token.');
    }

    sessionStorage.setItem('tmdb_request_token', data.request_token);

    const authUrl =
      `https://www.themoviedb.org/authenticate/${encodeURIComponent(data.request_token)}`;

    console.log('TMDB auth URL:', authUrl);

    const link = document.createElement('a');
    link.href = authUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Approve CineScope in the new tab, then return here and click "I Approved It".');
    loginInProgress = false;
  } catch (error) {
    console.error('TMDB login start error:', error);
    showToast('Could not start TMDB sign in.', 'error');
    loginInProgress = false;
  }
}

export async function handleTmdbAuthCallback() {
  const url = new URL(window.location.href);
  const approved = url.searchParams.get('approved');
  const requestTokenFromUrl = url.searchParams.get('request_token');
  const denied = url.searchParams.get('denied');

  if (denied) {
    showToast('TMDB sign in was cancelled.', 'error');
    clearTmdbCallbackParams(url);
    return;
  }

  if (approved !== 'true' || !requestTokenFromUrl) {
    return;
  }

  try {
    const sessionResponse = await fetch(
      `${CONFIG.TMDB_BASE_URL}/authentication/session/new?api_key=${CONFIG.TMDB_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_token: requestTokenFromUrl
        })
      }
    );

    if (!sessionResponse.ok) {
      throw new Error('Could not create TMDB session.');
    }

    const sessionData = await sessionResponse.json();

    if (!sessionData.session_id) {
      throw new Error('TMDB did not return a session ID.');
    }

    sessionStorage.setItem('tmdb_session_id', sessionData.session_id);

    const accountResponse = await fetch(
      `${CONFIG.TMDB_BASE_URL}/account/account_id?api_key=${CONFIG.TMDB_API_KEY}&session_id=${sessionData.session_id}`
    );

    if (!accountResponse.ok) {
      throw new Error('Could not load TMDB account details.');
    }

    const accountData = await accountResponse.json();

    if (!accountData.id) {
      throw new Error('TMDB did not return an account ID.');
    }

    sessionStorage.setItem('tmdb_account_id', String(accountData.id));

    clearTmdbCallbackParams(url);
    showToast('Signed in successfully.', 'success');
    window.location.hash = 'lists';
  } catch (error) {
    console.error('TMDB auth callback error:', error);
    showToast('Could not complete TMDB sign in.', 'error');
    clearTmdbCallbackParams(url);
  }
}

function clearTmdbCallbackParams(url) {
  url.searchParams.delete('approved');
  url.searchParams.delete('request_token');
  url.searchParams.delete('denied');
  window.history.replaceState({}, '', url.pathname + url.hash);
}

export async function finishTmdbLoginFromStoredToken() {
  const requestToken = sessionStorage.getItem('tmdb_request_token');

  if (!requestToken) {
    showToast('No approved TMDB token was found.', 'error');
    return false;
  }

  try {
    const sessionResponse = await fetch(
      `${CONFIG.TMDB_BASE_URL}/authentication/session/new?api_key=${CONFIG.TMDB_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_token: requestToken
        })
      }
    );

    if (!sessionResponse.ok) {
      throw new Error('Could not create TMDB session.');
    }

    const sessionData = await sessionResponse.json();

    console.log("SESSION DATA:", sessionData);

    if (!sessionData.session_id) {
      throw new Error('TMDB did not return a session ID.');
    }

    sessionStorage.setItem(
      'tmdb_session_id',
      sessionData.session_id
    );

    const accountResponse = await fetch(
      `${CONFIG.TMDB_BASE_URL}/account/account_id?api_key=${CONFIG.TMDB_API_KEY}&session_id=${sessionData.session_id}`
    );

    if (!accountResponse.ok) {
      throw new Error('Could not load account details.');
    }

    const accountData = await accountResponse.json();

    console.log("ACCOUNT DATA:", accountData);

    if (!accountData.id) {
      throw new Error('No account ID returned.');
    }

    sessionStorage.setItem(
      'tmdb_account_id',
      String(accountData.id)
    );

    showToast('Signed in successfully.', 'success');

    window.location.hash = 'lists';

    return true;

  } catch (error) {
    console.error(
      'TMDB finish login error:',
      error
    );

    showToast(
      'Could not complete TMDB sign in.',
      'error'
    );

    return false;
  }
}


// ── Router ───────────────────────────────────────────────────────
function router() {
  const hash = window.location.hash.slice(1) || 'home';

  if (hash === 'home' || hash === '' || hash === '/') {
    import('./views/home.js').then(m => m.renderHome());

  } else if (hash.startsWith('search')) {
    const qs = hash.includes('?') ? hash.split('?')[1] : '';
  const searchParams = new URLSearchParams(qs);

  const params = {
    q: searchParams.get('q') || '',
    page: searchParams.get('page') || '1'
  };

    import('./views/search.js').then(m => m.renderSearch(params));

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
