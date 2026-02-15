// ==========================================
// Scan Confirmation Page — select task
// ==========================================

const ConfirmPage = (() => {
  let targetId = null;
  let selectedTaskId = null;

  function render(container, scannedTargetId, taskId) {
    const playerId = Utils.getPlayerId();
    if (!playerId) {
      window.location.hash = "#signup";
      return;
    }

    const parsedTaskId = parseInt(taskId, 10);
    if (!Number.isFinite(parsedTaskId)) {
      Utils.showToast("Select a task from the board first", "info");
      window.location.hash = "#board";
      return;
    }

    targetId = scannedTargetId;
    selectedTaskId = parsedTaskId;
    Utils.showLoading(container);
    loadConfirmation(container, playerId, targetId, selectedTaskId);
  }

  async function loadConfirmation(container, playerId, targetId, taskId) {
    try {
      const [targetPlayer, board] = await Promise.all([
        API.getPlayer(targetId),
        API.getBoard(playerId),
      ]);

      const selectedTask = board.find((c) => c.task_id === taskId);
      if (
        !selectedTask ||
        selectedTask.completed
      ) {
        container.innerHTML = `
          <div class="result-card fade-in">
            <div class="result-icon result-icon--error">
              <span class="material-symbols-outlined">error</span>
            </div>
            <p class="result-title">Task unavailable</p>
            <p class="result-message">That task is already completed or no longer available.</p>
            <div style="max-width:300px;margin:0 auto;">
              <button class="btn-primary" onclick="window.location.hash='#board'">
                <span class="material-symbols-outlined">grid_view</span>
                Back to Board
              </button>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="confirm-container fade-in">
          <div class="confirm-card">
            <div class="confirm-icon">
              <span class="material-symbols-outlined">person</span>
            </div>
            <h3 class="confirm-title">You scanned ${escapeHtml(targetPlayer.name)}</h3>
            <p class="confirm-subtitle">Confirm the task you want to complete</p>
          </div>

          <p class="task-select-label">Selected task:</p>
          <div class="task-list">
            <div class="task-item" style="pointer-events:none;">
              <span class="task-item-text">${escapeHtml(selectedTask.description)}</span>
              <span class="material-symbols-outlined task-item-arrow">check</span>
            </div>
          </div>

          <div style="margin-top:16px;">
            <button class="btn-primary" id="confirm-task">
              <span class="material-symbols-outlined">check_circle</span>
              Confirm Task
            </button>
            <button class="btn-secondary" id="cancel-task" style="margin-top:8px;">
              <span class="material-symbols-outlined">arrow_back</span>
              Cancel
            </button>
          </div>
        </div>
      `;

      document.getElementById("confirm-task").addEventListener("click", () => {
        submitTask(container, playerId, targetId, taskId);
      });
      document.getElementById("cancel-task").addEventListener("click", () => {
        window.location.hash = "#board";
      });
    } catch (err) {
      container.innerHTML = `
        <div class="result-card fade-in">
          <div class="result-icon result-icon--error">
            <span class="material-symbols-outlined">error</span>
          </div>
          <p class="result-title">Player not found</p>
          <p class="result-message">${escapeHtml(err.message)}</p>
          <div style="max-width:300px;margin:0 auto;">
            <button class="btn-secondary" onclick="window.location.hash='#board'">
              <span class="material-symbols-outlined">arrow_back</span>
              Back to Board
            </button>
          </div>
        </div>
      `;
    }
  }

  async function submitTask(container, playerId, targetId, taskId) {
    // Disable the list
    const items = container.querySelectorAll(".task-item");
    items.forEach((el) => {
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";
    });

    try {
      const result = await API.submitScan(playerId, targetId, taskId);

      // Check for wins
      if (result.new_wins && result.new_wins.length > 0) {
        showWinResult(container, result.new_wins);
      } else {
        showSuccessResult(container);
      }

      // Check if game ended
      if (!result.game_active) {
        setTimeout(() => {
          window.location.hash = "#gameover";
        }, 2000);
      }
    } catch (err) {
      showErrorResult(container, err.message, taskId);
    }
  }

  function showSuccessResult(container) {
    container.innerHTML = `
      <div class="result-card fade-in">
        <div class="result-icon result-icon--success">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <p class="result-title">Task Completed!</p>
        <p class="result-message">Nice work! Keep scanning to fill your board.</p>
        <div style="max-width:300px;margin:0 auto;">
          <button class="btn-primary" onclick="window.location.hash='#board'">
            <span class="material-symbols-outlined">grid_view</span>
            Back to Board
          </button>
        </div>
      </div>
    `;
  }

  function showWinResult(container, winTypes) {
    const winLabel = winTypes
      .map((w) => {
        if (w === "row") return "Row";
        if (w === "column") return "Column";
        if (w === "full") return "Full Board";
        return w;
      })
      .join(", ");

    container.innerHTML = `
      <div class="result-card fade-in">
        <div class="result-icon result-icon--success">
          <span class="material-symbols-outlined">emoji_events</span>
        </div>
        <p class="result-title">BINGO!</p>
        <p class="result-message">You completed a ${escapeHtml(winLabel)}! Congratulations!</p>
        <div style="max-width:300px;margin:0 auto;">
          <button class="btn-primary" onclick="window.location.hash='#board'">
            <span class="material-symbols-outlined">grid_view</span>
            Back to Board
          </button>
        </div>
      </div>
    `;

    // Trigger confetti
    launchConfetti();
  }

  function showErrorResult(container, message, taskId) {
    container.innerHTML = `
      <div class="result-card fade-in">
        <div class="result-icon result-icon--error">
          <span class="material-symbols-outlined">error</span>
        </div>
        <p class="result-title">Scan Failed</p>
        <p class="result-message">${escapeHtml(message)}</p>
        <div style="max-width:300px;margin:0 auto;display:flex;flex-direction:column;gap:8px;">
          <button class="btn-primary" onclick="window.location.hash='#scan/${taskId}'">
            <span class="material-symbols-outlined">qr_code_scanner</span>
            Try Again
          </button>
          <button class="btn-secondary" onclick="window.location.hash='#board'">
            <span class="material-symbols-outlined">arrow_back</span>
            Back to Board
          </button>
        </div>
      </div>
    `;
  }

  function launchConfetti() {
    const colors = [
      "#257bf4",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#a855f7",
      "#ec4899",
    ];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = 2 + Math.random() * 3 + "s";
      piece.style.animationDelay = Math.random() * 1 + "s";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 6000);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { render };
})();
