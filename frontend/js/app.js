// ==========================================
// App Router — hash-based SPA routing
// ==========================================

const App = (() => {
  const appEl = () => document.getElementById("app");
  const header = () => document.getElementById("app-header");
  const bottomBar = () => document.getElementById("bottom-bar");

  function init() {
    window.addEventListener("hashchange", route);
    route();
  }

  function route() {
    // Cleanup previous page resources
    BoardPage.stopPolling();
    ScannerPage.cleanup();

    const hash = window.location.hash || "";
    const container = appEl();

    // Default UI state: show header & bottom bar
    header().classList.remove("hidden");
    bottomBar().classList.remove("hidden");

    // Not signed up => force signup
    if (!Utils.getPlayerId() && !hash.startsWith("#signup")) {
      header().classList.add("hidden");
      bottomBar().classList.add("hidden");
      window.location.hash = "#signup";
      return;
    }

    if (hash.startsWith("#confirm/")) {
      const targetId = hash.split("/")[1];
      if (Utils.isValidUUID(targetId)) {
        ConfirmPage.render(container, targetId);
        bottomBar().classList.add("hidden");
      } else {
        Utils.showToast("Invalid player ID", "error");
        window.location.hash = "#board";
      }
      return;
    }

    switch (hash) {
      case "#signup":
        header().classList.add("hidden");
        bottomBar().classList.add("hidden");
        SignupPage.render(container);
        break;

      case "#scan":
        ScannerPage.render(container);
        break;

      case "#gameover":
        bottomBar().classList.add("hidden");
        GameOverPage.render(container);
        break;

      case "#board":
      default:
        if (!Utils.getPlayerId()) {
          window.location.hash = "#signup";
        } else {
          BoardPage.render(container);
        }
        break;
    }
  }

  return { init };
})();

// Boot the app
document.addEventListener("DOMContentLoaded", App.init);
