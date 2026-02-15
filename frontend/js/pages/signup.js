// ==========================================
// Signup Page
// ==========================================

const SignupPage = (() => {
  function render(container) {
    container.innerHTML = `
      <div class="signup-container fade-in">
        <div class="signup-logo">
          <span class="material-symbols-outlined">qr_code_scanner</span>
        </div>
        <h2 class="signup-title">Bingo</h2>
        <p class="signup-subtitle">Sign up to join the game and start scanning!</p>
        <form class="signup-form" id="signup-form">
          <div class="form-group">
            <label class="form-label" for="signup-name">Your Name</label>
            <input class="form-input" id="signup-name" type="text" placeholder="Enter your name" required autocomplete="name" />
          </div>
          <div class="form-group">
            <label class="form-label" for="signup-phone">Phone Number</label>
            <input class="form-input" id="signup-phone" type="tel" placeholder="Enter 10-digit phone number" required autocomplete="tel" maxlength="10" pattern="[0-9]{10}" inputmode="numeric" />
          </div>
          <button class="btn-primary" type="submit" id="signup-btn">
            <span class="material-symbols-outlined">person_add</span>
            Join the Game
          </button>
        </form>
      </div>
    `;

    document
      .getElementById("signup-form")
      .addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("signup-btn");
    const name = document.getElementById("signup-name").value.trim();
    const phone = document.getElementById("signup-phone").value.trim();

    if (!name || !phone) {
      Utils.showToast("Please fill in all fields", "error");
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      Utils.showToast("Phone number must be exactly 10 digits", "error");
      return;
    }

    btn.disabled = true;
    btn.innerHTML =
      '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';

    try {
      const player = await API.register(name, phone);
      Utils.setPlayerId(player.id);
      Utils.setPlayerName(player.name);

      // Show QR code before going to board
      showQRSuccess(document.getElementById("app"), player);
    } catch (err) {
      Utils.showToast(err.message || "Registration failed", "error");
      btn.disabled = false;
      btn.innerHTML =
        '<span class="material-symbols-outlined">person_add</span> Join the Game';
    }
  }

  function showQRSuccess(container, player) {
    container.innerHTML = `
      <div class="signup-container fade-in">
        <div class="result-icon result-icon--success">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <h2 class="signup-title">Welcome, ${escapeHtml(player.name)}!</h2>
        <p class="signup-subtitle">Here's your unique QR code. Show it to other players when they scan you.</p>
        <div class="qr-display">
          ${
            player.qr_code_url
              ? `<img src="${player.qr_code_url}" alt="Your QR Code" />`
              : `<p style="color:var(--text-muted)">QR code generating...</p>`
          }
          <p>Player ID: ${player.id.substring(0, 8)}...</p>
        </div>
        <div class="signup-form">
          <button class="btn-primary" onclick="window.location.hash='#board'">
            <span class="material-symbols-outlined">grid_view</span>
            Go to My Bingo Board
          </button>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { render };
})();
