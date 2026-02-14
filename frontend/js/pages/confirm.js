// ==========================================
// Scan Confirmation Page — select task
// ==========================================

const ConfirmPage = (() => {
  let targetId = null;

  function render(container, scannedTargetId) {
    const playerId = Utils.getPlayerId();
    if (!playerId) {
      window.location.hash = "#signup";
      return;
    }

    targetId = scannedTargetId;
    Utils.showLoading(container);
    loadConfirmation(container, playerId, targetId);
  }

  async function loadConfirmation(container, playerId, targetId) {
    try {
      const [targetPlayer, board] = await Promise.all([
        API.getPlayer(targetId),
        API.getBoard(playerId),
      ]);

      // Filter incomplete tasks (exclude free space)
      const incompleteTasks = board
        .filter((c) => !c.completed && !c.is_free_space)
        .sort((a, b) => a.position - b.position);

      if (incompleteTasks.length === 0) {
        container.innerHTML = `
          <div class="confirm-container fade-in">
            <div class="confirm-card">
              <div class="confirm-icon">
                <span class="material-symbols-outlined">celebration</span>
              </div>
              <h3 class="confirm-title">All tasks completed!</h3>
              <p class="confirm-subtitle">You've already finished every task on your board.</p>
            </div>
            <button class="btn-secondary" onclick="window.location.hash='#board'">
              <span class="material-symbols-outlined">arrow_back</span>
              Back to Board
            </button>
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
            <p class="confirm-subtitle">Select a task to mark as completed</p>
          </div>

          <p class="task-select-label">Choose a task:</p>
          <div class="task-list" id="task-list"></div>

          <div style="margin-top:16px;">
            <button class="btn-secondary" onclick="window.location.hash='#board'">
              <span class="material-symbols-outlined">arrow_back</span>
              Cancel
            </button>
          </div>
        </div>
      `;

      renderTaskList(incompleteTasks, playerId, targetId, container);
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

  function renderTaskList(tasks, playerId, targetId, container) {
    const list = document.getElementById("task-list");
    if (!list) return;

    list.innerHTML = tasks
      .map(
        (task) => `
      <div class="task-item" data-task-id="${task.task_id}">
        <span class="task-item-text">${escapeHtml(task.description)}</span>
        <span class="material-symbols-outlined task-item-arrow">chevron_right</span>
      </div>
    `,
      )
      .join("");

    list.addEventListener("click", (e) => {
      const item = e.target.closest(".task-item");
      if (!item) return;
      const taskId = parseInt(item.dataset.taskId, 10);
      submitTask(container, playerId, targetId, taskId);
    });
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
      showErrorResult(container, err.message);
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

  function showErrorResult(container, message) {
    container.innerHTML = `
      <div class="result-card fade-in">
        <div class="result-icon result-icon--error">
          <span class="material-symbols-outlined">error</span>
        </div>
        <p class="result-title">Scan Failed</p>
        <p class="result-message">${escapeHtml(message)}</p>
        <div style="max-width:300px;margin:0 auto;display:flex;flex-direction:column;gap:8px;">
          <button class="btn-primary" onclick="window.location.hash='#scan'">
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
