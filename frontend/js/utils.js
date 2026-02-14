// ==========================================
// Utility helpers
// ==========================================

const Utils = (() => {
  const PLAYER_KEY = 'bingo_player_id';
  const PLAYER_NAME_KEY = 'bingo_player_name';

  return {
    getPlayerId() {
      return localStorage.getItem(PLAYER_KEY);
    },

    setPlayerId(id) {
      localStorage.setItem(PLAYER_KEY, id);
    },

    getPlayerName() {
      return localStorage.getItem(PLAYER_NAME_KEY);
    },

    setPlayerName(name) {
      localStorage.setItem(PLAYER_NAME_KEY, name);
    },

    clearPlayer() {
      localStorage.removeItem(PLAYER_KEY);
      localStorage.removeItem(PLAYER_NAME_KEY);
    },

    showToast(message, type = 'info') {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = `toast toast-${type} show`;
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    },

    showLoading(container) {
      container.innerHTML = `
        <div class="spinner-container fade-in">
          <div class="spinner"></div>
          <p class="spinner-text">Loading...</p>
        </div>
      `;
    },

    isValidUUID(str) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    },
  };
})();
