// ==========================================
// Bingo Board Page
// ==========================================

const BoardPage = (() => {
  let pollTimer = null;
  let lastGameState = null;

  function render(container) {
    const playerId = Utils.getPlayerId();
    if (!playerId) {
      window.location.hash = "#signup";
      return;
    }

    Utils.showLoading(container);
    loadBoard(container, playerId);
  }

  async function loadBoard(container, playerId) {
    try {
      const [board, gameState, player] = await Promise.all([
        API.getBoard(playerId),
        API.getGameState(),
        API.getPlayer(playerId),
      ]);

      // Store initial game state
      lastGameState = gameState;

      // Check if game ended
      if (!gameState.game_active) {
        window.location.hash = "#gameover";
        return;
      }

      // Update header with player info
      updateHeader(player);

      const completedCount = board.filter((c) => c.completed).length;
      const totalCount = board.length;

      container.innerHTML = `
        <div class="fade-in">
          <!-- Progress -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Board Progress</span>
              <span class="progress-count">${completedCount} / ${totalCount}</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${((completedCount / totalCount) * 100).toFixed(1)}%"></div>
            </div>
          </div>

          <p class="board-hint">Tap a task to scan a player</p>
          <!-- Bingo Grid -->
          <div class="bingo-grid" id="bingo-grid"></div>
        </div>
      `;

      renderGrid(board);
      startPolling(container, playerId);
    } catch (err) {
      container.innerHTML = `
        <div class="result-card fade-in">
          <div class="result-icon result-icon--error">
            <span class="material-symbols-outlined">error</span>
          </div>
          <p class="result-title">Failed to load board</p>
          <p class="result-message">${escapeHtml(err.message)}</p>
          <button class="btn-primary" onclick="window.location.hash='#board'" style="max-width:300px;margin:0 auto;">
            Try Again
          </button>
        </div>
      `;
    }
  }

  function renderGrid(board) {
    const grid = document.getElementById("bingo-grid");
    if (!grid) return;

    // Sort by position
    const sorted = [...board].sort((a, b) => a.position - b.position);

    grid.innerHTML = sorted
      .map((cell) => {
        if (cell.completed) {
          return `
          <div class="bingo-cell bingo-cell--completed">
            <span class="material-symbols-outlined bingo-cell-icon">check_circle</span>
            <span class="bingo-cell-text">${escapeHtml(cell.description)}</span>
          </div>
        `;
        }

        return `
        <div class="bingo-cell bingo-cell--incomplete" data-task-id="${cell.task_id}">
          <span class="material-symbols-outlined bingo-cell-icon" style="color:var(--primary);">radio_button_unchecked</span>
          <span class="bingo-cell-text">${escapeHtml(cell.description)}</span>
        </div>
      `;
      })
      .join("");

    grid.addEventListener("click", (e) => {
      const cell = e.target.closest(".bingo-cell--incomplete");
      if (!cell) return;
      const taskId = parseInt(cell.dataset.taskId, 10);
      if (!Number.isFinite(taskId)) return;
      Utils.showToast("Task selected. Scan a player.", "info");
      window.location.hash = `#scan/${taskId}`;
    });
  }

  function updateHeader(player) {
    const info = document.getElementById("header-player-info");
    if (!info) return;
    info.innerHTML = `
      <span class="header-player-name">${escapeHtml(player.name)}</span>
      <button class="header-qr-btn" id="show-my-qr" title="Show my QR Code">
        <span class="material-symbols-outlined">qr_code_2</span>
      </button>
    `;
    document
      .getElementById("show-my-qr")
      .addEventListener("click", () => showQRModal(player));
  }

  function showQRModal(player) {
    // Remove existing modal
    const existing = document.getElementById("qr-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "qr-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-card fade-in">
        <h3 class="modal-title">Your QR Code</h3>
        <p class="modal-sub">Show this to other players so they can scan you</p>
        ${
          player.qr_code_url
            ? `<img src="${player.qr_code_url}" alt="QR Code" />`
            : `<p style="padding:20px;color:var(--text-muted);">QR code not available</p>`
        }
        <button class="modal-close" id="close-qr-modal">Close</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.id === "close-qr-modal") {
        modal.remove();
      }
    });
  }

  function startPolling(container, playerId) {
    stopPolling();
    pollTimer = setInterval(async () => {
      try {
        const gameState = await API.getGameState();

        // Check if game state changed from active to inactive
        if (
          lastGameState &&
          lastGameState.game_active &&
          !gameState.game_active
        ) {
          stopPolling();
          // Game just ended - fetch winners and show notification
          const winners = await API.getWinners();
          showWinnerNotification(winners);
          return;
        }

        lastGameState = gameState;
      } catch (_) {
        // Ignore polling errors
      }
    }, 15000); // Poll every 15 seconds
  }

  function showWinnerNotification(winners) {
    // Remove existing modal if any
    const existing = document.getElementById("winner-modal");
    if (existing) existing.remove();

    // Get unique winners
    const uniqueWinners = [...new Set(winners.map((w) => w.player_name))];
    const winnerText =
      uniqueWinners.length === 1
        ? `${uniqueWinners[0]} won!`
        : `${uniqueWinners.join(", ")} won!`;

    const modal = document.createElement("div");
    modal.id = "winner-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-card fade-in">
        <div style="text-align:center;margin-bottom:20px;">
          <span class="material-symbols-outlined" style="font-size:48px;color:var(--success);">celebration</span>
        </div>
        <h3 class="modal-title" style="color:var(--success);">🎉 Bingo!</h3>
        <p class="modal-sub">${escapeHtml(winnerText)}</p>

        <div style="margin-top:20px;padding:15px;background:var(--bg-light);border-radius:8px;">
          <p style="margin:0 0 10px 0;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Winners</p>
          ${uniqueWinners
            .map(
              (name) => `
            <p style="margin:5px 0;font-weight:600;color:var(--primary);">✓ ${escapeHtml(name)}</p>
          `,
            )
            .join("")}
        </div>

        <button class="modal-close" id="close-winner-modal" style="margin-top:20px;">View Results</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.id === "close-winner-modal") {
        modal.remove();
        window.location.hash = "#gameover";
      }
    });
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { render, stopPolling };
})();
