// View 2 — Search Results

export function renderSearch(params = {}) {
  const query = params.q || "";
  const page = Number(params.page) || 1;

  const app = document.getElementById("app");

  app.innerHTML = `
    <section class="search-header">
      <h1>Search Movies</h1>
      <div class="search-bar-large">
        <input id="search-input-page" type="text" placeholder="Search movies..." value="${query}">
        <button id="search-btn-page">Search</button>
      </div>
    </section>

    <section class="container section">
      <div id="search-results" class="movie-grid"></div>
      <div id="pagination" class="pagination"></div>
    </section>
  `;

  document.getElementById("search-btn-page").addEventListener("click", () => {
    const newQuery = document.getElementById("search-input-page").value.trim();
    if (newQuery) {
      window.location.hash = `#search?q=${encodeURIComponent(newQuery)}&page=1`;
    }
  });

  document.getElementById("search-input-page").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const newQuery = e.target.value.trim();
      if (newQuery) {
        window.location.hash = `#search?q=${encodeURIComponent(newQuery)}&page=1`;
      }
    }
  });

  if (query) {
    fetchSearchResults(query, page);
  }
}

function fetchSearchResults(query, page) {
  const url = `${CONFIG.TMDB_BASE_URL}/search/movie?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;

  console.log("Search URL:", url);

  fetch(url)
    .then(res => {
      console.log("Response status:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("TMDB data:", data);
      renderResults(data.results);
      renderPagination(query, data.page, data.total_pages);
    })
    .catch(err => {
      console.error("Search error:", err);
    });
}

function renderResults(movies) {
  const container = document.getElementById("search-results");

  if (!movies || movies.length === 0) {
    container.innerHTML = `<p>No results found.</p>`;
    return;
  }

  let html = "";

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];

    const poster = movie.poster_path
      ? CONFIG.IMG_BASE + movie.poster_path
      : "";

    html += `
      <div class="movie-card" data-id="${movie.id}">
        <div class="movie-card-poster">
          ${
            poster
              ? `<img src="${poster}" class="movie-card-img">`
              : `<div class="movie-card-placeholder">🎬</div>`
          }
          <div class="movie-card-overlay">
            <div class="movie-card-overlay-btn">View Details</div>
          </div>
        </div>

        <div class="movie-card-info">
          <h3 class="movie-card-title">${movie.title || "Untitled"}</h3>
          <div class="movie-card-meta">
            <span>${movie.release_date ? movie.release_date.substring(0,4) : "N/A"}</span>
            <span class="movie-card-rating">★ ${movie.vote_average?.toFixed(1) || "N/A"}</span>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  const cards = document.querySelectorAll(".movie-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      window.location.hash = `#detail/${id}`;
    });
  });
}

function renderPagination(query, currentPage, totalPages) {
  const container = document.getElementById("pagination");

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  html += `<button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}">&lt;</button>`;

  for (let p = currentPage - 2; p <= currentPage + 2; p++) {
    if (p > 0 && p <= totalPages) {
      html += `<button class="pagination-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
    }
  }

  html += `<button class="pagination-btn" ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}">&gt;</button>`;

  container.innerHTML = html;

  const buttons = container.querySelectorAll(".pagination-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (!btn.disabled) {
        const newPage = btn.getAttribute("data-page");
        window.location.hash = `#search?q=${encodeURIComponent(query)}&page=${newPage}`;
      }
    });
  });
}
