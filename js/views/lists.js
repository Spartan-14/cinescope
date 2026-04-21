// View 4 — Authentication & Personal Lists
// TODO (Reece): implement TMDB auth flow, favorites, and watchlist

export function renderLists() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container" style="padding-top:4rem;padding-bottom:4rem;text-align:center">
      <div class="empty-state">
        <div class="empty-state-icon"> </div>
        <h3>My Lists</h3>
        <p>Authentication &amp; lists coming soon.</p>
      </div>
    </div>
  `;
}
