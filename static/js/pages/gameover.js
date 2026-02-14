// ==========================================
// Game Over Page
// ==========================================

const GameOverPage = (() => {
  function render(container) {
    Utils.showLoading(container);
    loadGameOver(container);
  }

  async function loadGameOver(container) {
    try {
      const [winners, gameState] = await Promise.all([
        API.getWinners(),
        API.getGameState(),
      ]);

      // If game is still active, go back to board
      if (gameState.game_active) {
        window.location.hash = '#board';
        return;
      }

      const playerId = Utils.getPlayerId();
      const playerName = Utils.getPlayerName();
      const isWinner = winners.some(w => w.player === playerId);

      container.innerHTML = `
        <div class="gameover-container fade-in">
          <div class="gameover-icon">
            <span class="material-symbols-outlined">${isWinner ? 'emoji_events' : 'flag'}</span>
          </div>
          <h2 class="gameover-title">${isWinner ? 'You Won!' : 'Game Over'}</h2>
          <p class="gameover-subtitle">
            ${isWinner
              ? 'Congratulations! You are one of the winners!'
              : 'The game has ended. Thanks for playing!'
            }
          </p>

          ${winners.length > 0 ? `
            <div class="winners-list">
              <p class="winners-title">Winners</p>
              ${winners.map(w => `
                <div class="winner-item${w.player === playerId ? ' style="border-color:var(--primary);background:var(--primary-light);"' : ''}">
                  <span class="winner-name">${escapeHtml(w.player_name)}</span>
                  <span class="winner-badge">${formatWinType(w.win_type)}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color:var(--text-muted);font-size:14px;">No winners recorded.</p>
          `}

          <div style="width:100%;max-width:300px;margin-top:32px;">
            <button class="btn-secondary" onclick="window.location.hash='#board'">
              <span class="material-symbols-outlined">grid_view</span>
              View My Board
            </button>
          </div>
        </div>
      `;

      if (isWinner) {
        launchConfetti();
      }
    } catch (err) {
      container.innerHTML = `
        <div class="result-card fade-in">
          <div class="result-icon result-icon--error">
            <span class="material-symbols-outlined">error</span>
          </div>
          <p class="result-title">Error</p>
          <p class="result-message">${escapeHtml(err.message)}</p>
          <button class="btn-primary" onclick="window.location.hash='#board'" style="max-width:300px;margin:0 auto;">
            Back to Board
          </button>
        </div>
      `;
    }
  }

  function formatWinType(type) {
    if (type === 'row') return 'Row';
    if (type === 'column') return 'Column';
    if (type === 'full') return 'Full Board';
    return type;
  }

  function launchConfetti() {
    const colors = ['#257bf4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (2 + Math.random() * 3) + 's';
      piece.style.animationDelay = Math.random() * 1 + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 6000);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render };
})();
