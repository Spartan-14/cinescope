// View 2 — Search Results
// TODO (Reece): implement search UI, TMDB API calls, and pagination

export function renderSearch(query) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container" style="padding-top:4rem;padding-bottom:4rem;text-align:center">
      <div class="empty-state">
        <div class="empty-state-icon"> </div>
        <h3>Search</h3>
        <p>Search view coming soon.</p>
      </div>
    </div>
  `;
}
