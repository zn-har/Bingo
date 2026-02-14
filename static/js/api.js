// ==========================================
// API Client — talks to Django REST backend
// ==========================================

const API = (() => {
  // Same-origin — no CORS needed
  const BASE = "/api";

  async function request(path, options = {}) {
    const url = `${BASE}${path}`;
    const config = {
      headers: { "Content-Type": "application/json" },
      ...options,
    };
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    register(name, phone) {
      return request("/register/", {
        method: "POST",
        body: JSON.stringify({ name, phone }),
      });
    },

    getPlayer(playerId) {
      return request(`/player/${playerId}/`);
    },

    getBoard(playerId) {
      return request(`/board/${playerId}/`);
    },

    submitScan(scannerId, targetId, taskId) {
      return request("/scan/", {
        method: "POST",
        body: JSON.stringify({
          scanner_id: scannerId,
          target_id: targetId,
          task_id: taskId,
        }),
      });
    },

    getGameState() {
      return request("/game-state/");
    },

    getWinners() {
      return request("/winners/");
    },

    getTasks() {
      return request("/tasks/");
    },

    getPlayerScans(playerId) {
      return request(`/player/${playerId}/scans/`);
    },
  };
})();
