export class Skeleton {
  static bookCard() {
    return `
      <div class="skeleton-card skeleton-book-card">
        <div class="skeleton skeleton-cover"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text" style="width: 50%;"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      </div>
    `;
  }

  static bookGrid(count = 6) {
    return `
      <div class="books-grid">
        ${Array(count).fill(this.bookCard()).join('')}
      </div>
    `;
  }
}

