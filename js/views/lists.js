// View 4 — Authentication & Personal Lists

import { CONFIG, showToast, startTmdbLogin, finishTmdbLoginFromStoredToken } from '../app.js';
import { buildMovieCard } from './home.js';

export async function renderLists() {
  const sessionId = sessionStorage.getItem('tmdb_session_id');
  const accountId = sessionStorage.getItem('tmdb_account_id');

  if (!sessionId || !accountId) {
    renderLoggedOutState();
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="spinner-fullpage">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const [favoritesData, watchlistData] = await Promise.all([
      fetchFavoriteMovies(accountId, sessionId),
      fetchWatchlistMovies(accountId, sessionId)
    ]);

    renderListsPage(
      favoritesData.results || [],
      watchlistData.results || []
    );
  } catch (error) {
    console.error('Lists error:', error);
    app.innerHTML = `
      <div class="error-page">
        <h1>Error</h1>
        <p>Could not load your lists right now.</p>
        <button class="btn btn-outline" id="lists-retry-btn">Try Again</button>
      </div>
    `;

    document.getElementById('lists-retry-btn')?.addEventListener('click', renderLists);
  }
}

function renderLoggedOutState() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container section">
      <div class="empty-state">
        <div class="empty-state-icon">🔐</div>
        <h3>Sign in to view your lists</h3>
        <p>Your Favorites and Watchlist will appear here after TMDB login is connected.</p>
        <div style="margin-top: 1.25rem; display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-primary" id="tmdb-login-btn">Sign In with TMDB</button>
          <button class="btn btn-outline" id="tmdb-complete-login-btn">I Approved It</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('tmdb-login-btn')?.addEventListener('click', () => {
    startTmdbLogin();
  });

  document.getElementById('tmdb-complete-login-btn')?.addEventListener('click', async () => {
    await finishTmdbLoginFromStoredToken();
  });
}

function renderListsPage(favorites, watchlist) {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container section">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
        <div>
          <h1 style="margin-bottom:0.35rem;">My Lists</h1>
          <p style="color:var(--text-secondary);">Manage your Favorites and Watchlist.</p>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button class="btn btn-outline" id="lists-refresh-btn">Refresh</button>
          <button class="btn btn-danger" id="lists-signout-btn">Sign Out</button>
        </div>
      </div>

      <div class="lists-tabs">
        <button class="list-tab active" data-tab="favorites">Favorites</button>
        <button class="list-tab" data-tab="watchlist">Watchlist</button>
      </div>

      <section id="favorites-panel">
        <div class="movie-grid" id="favorites-grid"></div>
      </section>

      <section id="watchlist-panel" style="display:none;">
        <div class="movie-grid" id="watchlist-grid"></div>
      </section>
    </div>
  `;

  renderMovieGrid('favorites-grid', favorites, 'No favorite movies yet.');
  renderMovieGrid('watchlist-grid', watchlist, 'No watchlist movies yet.');

  const tabs = document.querySelectorAll('.list-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(button => button.classList.remove('active'));
      tab.classList.add('active');

      const selectedTab = tab.getAttribute('data-tab');
      document.getElementById('favorites-panel').style.display =
        selectedTab === 'favorites' ? 'block' : 'none';
      document.getElementById('watchlist-panel').style.display =
        selectedTab === 'watchlist' ? 'block' : 'none';
    });
  });

  document.getElementById('lists-refresh-btn')?.addEventListener('click', renderLists);

  document.getElementById('lists-signout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('tmdb_session_id');
    sessionStorage.removeItem('tmdb_account_id');
    showToast('Signed out.', 'success');
    renderLists();
  });
}

function renderMovieGrid(containerId, movies, emptyMessage) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (!movies.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🎬</div>
        <h3>Nothing here yet</h3>
        <p>${emptyMessage}</p>
      </div>
    `;
    return;
  }

  movies.forEach(movie => {
    container.appendChild(buildMovieCard(movie));
  });
}

async function fetchFavoriteMovies(accountId, sessionId) {
  const url =
    `${CONFIG.TMDB_BASE_URL}/account/${accountId}/favorite/movies` +
    `?api_key=${CONFIG.TMDB_API_KEY}&session_id=${sessionId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load favorite movies.');
  }

  return await response.json();
}

async function fetchWatchlistMovies(accountId, sessionId) {
  const url =
    `${CONFIG.TMDB_BASE_URL}/account/${accountId}/watchlist/movies` +
    `?api_key=${CONFIG.TMDB_API_KEY}&session_id=${sessionId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load watchlist movies.');
  }

  return await response.json();
}
