import { CONFIG, showToast } from '../app.js';

// ── Entry point ──────────────────────────────────────────────────
export async function renderDetail(movieId) {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="spinner-fullpage"><div class="spinner"></div></div>';

  try {
    const data = await fetch(
      `${CONFIG.TMDB_BASE_URL}/movie/${encodeURIComponent(movieId)}` +
      `?api_key=${CONFIG.TMDB_API_KEY}&append_to_response=credits`
    ).then(r => r.json());

    renderDetailHTML(data);
  } catch {
    app.innerHTML = `
      <div class="error-page">
        <h1>Error</h1>
        <p>Could not load movie details. Please try again.</p>
        <button class="btn btn-outline" id="err-back">← Back</button>
      </div>`;
    document.getElementById('err-back')?.addEventListener('click', goBack);
  }
}

// ── Render page ──────────────────────────────────────────────────
function renderDetailHTML(data) {
  const app  = document.getElementById('app');
  const cast = (data.credits?.cast || []).slice(0, 15);

  // Structural HTML — no user data here
  app.innerHTML = `
    <div>
      <div class="movie-detail-hero">
        <div class="movie-detail-backdrop" id="detail-backdrop"></div>
        <div class="movie-detail-hero-inner">
          <div class="movie-detail-poster" id="detail-poster-wrap"></div>
          <div class="movie-detail-meta">
            <h1 class="movie-detail-title"   id="detail-title"></h1>
            <p  class="movie-detail-tagline" id="detail-tagline"></p>
            <div class="movie-detail-rating">★ <span id="detail-rating"></span></div>
            <div class="movie-detail-facts"  id="detail-facts"></div>
            <div class="movie-detail-genres" id="detail-genres"></div>
            <p  class="movie-detail-overview" id="detail-overview"></p>
            <div class="movie-detail-actions">
              <button class="btn btn-outline" id="detail-back-btn">← Back</button>
            </div>
          </div>
        </div>
      </div>

      <div class="movie-detail-body">
        <section class="section">
          <div class="section-title"><span>Cast</span></div>
          <div class="cast-scroll" id="cast-scroll"></div>
        </section>
      </div>
    </div>
  `;

  // ── Backdrop ──────────────────────────────────────────────────
  if (data.backdrop_path) {
    document.getElementById('detail-backdrop').style.backgroundImage =
      `url(${CONFIG.IMG_ORIGINAL}${data.backdrop_path})`;
  }

  // ── Poster ────────────────────────────────────────────────────
  const posterWrap = document.getElementById('detail-poster-wrap');
  if (data.poster_path) {
    const img = document.createElement('img');
    img.src     = CONFIG.IMG_BASE + data.poster_path;
    img.alt     = '';
    img.loading = 'lazy';
    posterWrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.style.cssText = 'height:270px;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--bg-elevated);border-radius:var(--radius-md)';
    ph.textContent = '🎬';
    posterWrap.appendChild(ph);
  }

  // ── Text fields (all via textContent) ─────────────────────────
  document.getElementById('detail-title').textContent    = data.title    || '';
  document.getElementById('detail-tagline').textContent  = data.tagline  || '';
  document.getElementById('detail-rating').textContent   = data.vote_average?.toFixed(1) || 'N/A';
  document.getElementById('detail-overview').textContent = data.overview || '';

  // ── Facts ─────────────────────────────────────────────────────
  const factsEl = document.getElementById('detail-facts');
  const year    = data.release_date?.slice(0, 4);
  const runtime = data.runtime
    ? Math.floor(data.runtime / 60) + 'h ' + (data.runtime % 60) + 'm'
    : null;

  if (year)    appendFact(factsEl, 'Year',    year);
  if (runtime) appendFact(factsEl, 'Runtime', runtime);
  if (data.original_language) appendFact(factsEl, 'Language', data.original_language.toUpperCase());

  // ── Genres ────────────────────────────────────────────────────
  const genresEl = document.getElementById('detail-genres');
  (data.genres || []).forEach(g => {
    const tag = document.createElement('span');
    tag.className  = 'genre-tag';
    tag.textContent = g.name;
    genresEl.appendChild(tag);
  });

  // ── Back button ───────────────────────────────────────────────
  document.getElementById('detail-back-btn').addEventListener('click', goBack);

  // ── Cast ──────────────────────────────────────────────────────
  renderCast(cast);
}

// ── Cast row ─────────────────────────────────────────────────────
function renderCast(cast) {
  const scroll = document.getElementById('cast-scroll');
  if (!scroll || !cast.length) return;

  cast.forEach(member => {
    const card = document.createElement('div');
    card.className = 'cast-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    // Photo
    if (member.profile_path) {
      const img = document.createElement('img');
      img.className   = 'cast-card-img';
      img.src         = CONFIG.IMG_BASE + member.profile_path;
      img.alt         = '';
      img.loading     = 'lazy';
      card.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className  = 'cast-card-img';
      ph.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--bg-elevated)';
      ph.textContent = '👤';
      card.appendChild(ph);
    }

    // Info
    const info = document.createElement('div');
    info.className = 'cast-card-info';

    const name = document.createElement('div');
    name.className  = 'cast-card-name';
    name.textContent = member.name || '';

    const character = document.createElement('div');
    character.className  = 'cast-card-character';
    character.textContent = member.character || '';

    info.appendChild(name);
    info.appendChild(character);
    card.appendChild(info);

    const open = () => showActorModal(member.id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    scroll.appendChild(card);
  });
}

// ── Actor modal ──────────────────────────────────────────────────
async function showActorModal(actorId) {
  const modal   = document.getElementById('actor-modal');
  const content = document.getElementById('actor-modal-content');

  content.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  modal.hidden = false;

  try {
    const [person, credits] = await Promise.all([
      fetch(`${CONFIG.TMDB_BASE_URL}/person/${encodeURIComponent(actorId)}?api_key=${CONFIG.TMDB_API_KEY}`).then(r => r.json()),
      fetch(`${CONFIG.TMDB_BASE_URL}/person/${encodeURIComponent(actorId)}/movie_credits?api_key=${CONFIG.TMDB_API_KEY}`).then(r => r.json()),
    ]);

    // Structural HTML only
    content.innerHTML = `
      <div class="actor-profile">
        <div class="actor-photo" id="actor-photo"></div>
        <div class="actor-info">
          <h3 class="actor-name"      id="actor-name"></h3>
          <div class="actor-known-for" id="actor-dept"></div>
          <p   class="actor-bio"       id="actor-bio"></p>
          <div class="actor-facts"     id="actor-facts"></div>
        </div>
      </div>
      <div class="actor-credits">
        <div class="actor-credits-title">Known For</div>
        <div class="cast-scroll" id="actor-movies"></div>
      </div>
    `;

    // Photo
    const photoEl = document.getElementById('actor-photo');
    if (person.profile_path) {
      const img = document.createElement('img');
      img.src     = CONFIG.IMG_BASE + person.profile_path;
      img.alt     = '';
      img.loading = 'lazy';
      photoEl.appendChild(img);
    } else {
      photoEl.style.cssText = 'width:150px;height:225px;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--bg-elevated);border-radius:var(--radius-md)';
      photoEl.textContent = '👤';
    }

    // Text
    document.getElementById('actor-name').textContent = person.name || '';
    document.getElementById('actor-dept').textContent = person.known_for_department || '';
    document.getElementById('actor-bio').textContent  = person.biography || 'No biography available.';

    // Facts
    const factsEl = document.getElementById('actor-facts');
    if (person.birthday) {
      const loc = person.place_of_birth ? ', ' + person.place_of_birth : '';
      appendFact(factsEl, 'Born', person.birthday + loc);
    }
    if (person.deathday) appendFact(factsEl, 'Died', person.deathday);

    // Known-for movies
    const topMovies = (credits.cast || [])
      .filter(m => m.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10);

    const moviesScroll = document.getElementById('actor-movies');
    topMovies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'cast-card';

      const img = document.createElement('img');
      img.className   = 'cast-card-img';
      img.src         = CONFIG.IMG_BASE + movie.poster_path;
      img.alt         = '';
      img.loading     = 'lazy';

      const info = document.createElement('div');
      info.className = 'cast-card-info';
      const titleEl = document.createElement('div');
      titleEl.className  = 'cast-card-name';
      titleEl.textContent = movie.title || '';
      info.appendChild(titleEl);

      card.appendChild(img);
      card.appendChild(info);
      card.addEventListener('click', () => {
        modal.hidden = true;
        window.location.hash = 'detail/' + movie.id;
      });
      moviesScroll.appendChild(card);
    });

  } catch {
    content.innerHTML = '';
    const msg = document.createElement('p');
    msg.style.cssText = 'padding:2rem;color:var(--text-muted);text-align:center';
    msg.textContent = 'Could not load actor details.';
    content.appendChild(msg);
  }
}

// ── Shared helpers ───────────────────────────────────────────────
function appendFact(container, label, value) {
  const span = document.createElement('span');
  span.className = 'movie-detail-fact';
  const strong = document.createElement('strong');
  strong.textContent = label + ': ';
  span.appendChild(strong);
  span.appendChild(document.createTextNode(value));
  container.appendChild(span);
}

function goBack() {
  if (window.history.length > 1) history.back();
  else window.location.hash = 'home';
}
