import { CONFIG } from '../app.js';

// Module-level state so genre filter can re-render without re-fetching
let allMovies = [];
let genreMap  = {}; // id → name

// Entry point 
export async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="spinner-fullpage"><div class="spinner"></div></div>';

  try {
    // 1. Fetch popular movies (3 pages in parallel)
    const [r1, r2, r3] = await Promise.all([
      fetch(`${CONFIG.TMDB_BASE_URL}/movie/popular?api_key=${CONFIG.TMDB_API_KEY}&page=1`).then(r => r.json()),
      fetch(`${CONFIG.TMDB_BASE_URL}/movie/popular?api_key=${CONFIG.TMDB_API_KEY}&page=2`).then(r => r.json()),
      fetch(`${CONFIG.TMDB_BASE_URL}/movie/popular?api_key=${CONFIG.TMDB_API_KEY}&page=3`).then(r => r.json()),
    ]);
    allMovies = [...r1.results, ...r2.results, ...r3.results];

    // 2. Fetch genre list for pill labels
    const gData = await fetch(
      `${CONFIG.TMDB_BASE_URL}/genre/movie/list?api_key=${CONFIG.TMDB_API_KEY}`
    ).then(r => r.json());
    genreMap = {};
    gData.genres.forEach(g => { genreMap[g.id] = g.name; });

    renderHomeHTML(allMovies);
  } catch {
    app.innerHTML =
      '<div class="error-page"><h1>Error</h1><p>Could not load movies. Check your connection and try again.</p></div>';
  }
}

// Build page structure 
function renderHomeHTML(movies) {
  const app  = document.getElementById('app');
  const hero = movies[0];

  // Structural HTML only — no user data in this string
  app.innerHTML = `
    <section class="hero">
      <div class="hero-bg" id="hero-bg"></div>
      <div class="container">
        <div class="hero-content">
          <span class="hero-badge">Now Popular</span>
          <h1 class="hero-title"  id="hero-title"></h1>
          <div class="hero-meta">
            <span class="hero-rating" id="hero-rating"></span>
            <span id="hero-year"></span>
            <span id="hero-genres-text"></span>
          </div>
          <p class="hero-overview" id="hero-overview"></p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" id="hero-details-btn">View Details</button>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      <div class="genre-bar" id="genre-bar"></div>
      <section class="section">
        <div class="section-title"><span>Popular Movies</span></div>
        <div class="movie-grid" id="movie-grid"></div>
      </section>
    </div>
  `;

  // Fill hero safely using textContent / style
  if (hero) {
    if (hero.backdrop_path) {
      document.getElementById('hero-bg').style.backgroundImage =
        `url(${CONFIG.IMG_ORIGINAL}${hero.backdrop_path})`;
    }
    document.getElementById('hero-title').textContent    = hero.title || '';
    document.getElementById('hero-rating').textContent   = '★ ' + (hero.vote_average?.toFixed(1) || 'N/A');
    document.getElementById('hero-year').textContent     = hero.release_date?.slice(0, 4) || '';
    document.getElementById('hero-genres-text').textContent =
      getMovieGenreNames(hero).slice(0, 2).join(' · ');
    document.getElementById('hero-overview').textContent = hero.overview || '';
    document.getElementById('hero-details-btn').addEventListener('click', () => {
      window.location.hash = 'detail/' + hero.id;
    });
  }

  buildGenrePills(movies);
  renderGrid(movies);
}

// Genre pills 
function buildGenrePills(movies) {
  const bar = document.getElementById('genre-bar');
  if (!bar) return;

  // Collect genre IDs present in the result set (preserve order of first appearance)
  const seen  = new Set();
  const genreIds = [];
  movies.forEach(m => {
    (m.genre_ids || []).forEach(id => {
      if (!seen.has(id) && genreMap[id]) { seen.add(id); genreIds.push(id); }
    });
  });

  // "All" pill
  const allPill = makePill('All', true, () => {
    setActivePill(allPill);
    renderGrid(allMovies);
  });
  bar.appendChild(allPill);

  genreIds.forEach(id => {
    const pill = makePill(genreMap[id], false, () => {
      setActivePill(pill);
      renderGrid(allMovies.filter(m => (m.genre_ids || []).includes(id)));
    });
    bar.appendChild(pill);
  });
}

function makePill(label, active, onClick) {
  const btn = document.createElement('button');
  btn.className = 'genre-pill' + (active ? ' active' : '');
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function setActivePill(activePill) {
  document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
  activePill.classList.add('active');
}

// Movie grid 
function renderGrid(movies) {
  const grid = document.getElementById('movie-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!movies.length) {
    const msg = document.createElement('p');
    msg.style.cssText = 'color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem';
    msg.textContent = 'No movies found for this genre.';
    grid.appendChild(msg);
    return;
  }

  movies.forEach(movie => grid.appendChild(buildMovieCard(movie)));
}

// Movie card (exported for reuse in search & lists) 
export function buildMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  // Poster area
  const posterWrap = document.createElement('div');
  posterWrap.className = 'movie-card-poster';

  if (movie.poster_path) {
    const img = document.createElement('img');
    img.className   = 'movie-card-img';
    img.src         = CONFIG.IMG_BASE + movie.poster_path;
    img.alt         = '';
    img.loading     = 'lazy';
    posterWrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className  = 'movie-card-placeholder';
    ph.textContent = '🎬';
    posterWrap.appendChild(ph);
  }

  // Hover overlay
  const overlay = document.createElement('div');
  overlay.className = 'movie-card-overlay';
  const overlayBtn = document.createElement('div');
  overlayBtn.className  = 'movie-card-overlay-btn';
  overlayBtn.textContent = 'View Details';
  overlay.appendChild(overlayBtn);
  posterWrap.appendChild(overlay);

  // Info row
  const info = document.createElement('div');
  info.className = 'movie-card-info';

  const title = document.createElement('div');
  title.className  = 'movie-card-title';
  title.textContent = movie.title || 'Untitled';

  const meta = document.createElement('div');
  meta.className = 'movie-card-meta';

  const year = document.createElement('span');
  year.textContent = movie.release_date?.slice(0, 4) || '';

  const rating = document.createElement('span');
  rating.className  = 'movie-card-rating';
  rating.textContent = movie.vote_average ? '★ ' + movie.vote_average.toFixed(1) : '';

  meta.appendChild(year);
  meta.appendChild(rating);
  info.appendChild(title);
  info.appendChild(meta);

  card.appendChild(posterWrap);
  card.appendChild(info);

  // Navigation
  const navigate = () => { window.location.hash = 'detail/' + movie.id; };
  card.addEventListener('click', navigate);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); }
  });

  return card;
}

// Helpers 
function getMovieGenreNames(movie) {
  return (movie.genre_ids || []).map(id => genreMap[id]).filter(Boolean);
}
