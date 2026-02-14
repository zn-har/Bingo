// ==========================================
// QR Scanner Page
// ==========================================

const ScannerPage = (() => {
  let scanner = null;

  function render(container) {
    const playerId = Utils.getPlayerId();
    if (!playerId) {
      window.location.hash = '#signup';
      return;
    }

    // Hide header and bottom bar for full-screen scanner
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('bottom-bar').classList.add('hidden');

    container.innerHTML = `
      <div class="scanner-overlay" id="scanner-overlay">
        <div class="scanner-header">
          <span class="scanner-title">Scan QR Code</span>
          <button class="scanner-close" id="scanner-close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="scanner-viewport">
          <div id="qr-reader"></div>
          <div class="scanner-hint">Point your camera at a player's QR code</div>
        </div>
      </div>
    `;

    document.getElementById('scanner-close').addEventListener('click', goBack);
    startScanner();
  }

  async function startScanner() {
    try {
      scanner = new Html5Qrcode('qr-reader');

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        () => {} // Ignore scan failures (no QR found in frame)
      );
    } catch (err) {
      const container = document.getElementById('scanner-overlay');
      if (container) {
        container.innerHTML = `
          <div class="scanner-header">
            <span class="scanner-title">Camera Error</span>
            <button class="scanner-close" id="scanner-close-err">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:20px;color:white;text-align:center;">
            <span class="material-symbols-outlined" style="font-size:48px;margin-bottom:16px;opacity:0.7;">no_photography</span>
            <p style="font-size:16px;font-weight:600;margin-bottom:8px;">Camera Access Denied</p>
            <p style="font-size:13px;opacity:0.7;max-width:280px;">Please allow camera access in your browser settings to scan QR codes.</p>
          </div>
        `;
        document.getElementById('scanner-close-err').addEventListener('click', goBack);
      }
    }
  }

  async function onScanSuccess(decodedText) {
    // Stop scanning immediately to prevent multiple reads
    await stopScanner();

    const scannedId = decodedText.trim();

    if (!Utils.isValidUUID(scannedId)) {
      Utils.showToast('Invalid QR code', 'error');
      goBack();
      return;
    }

    // Check self-scan
    if (scannedId === Utils.getPlayerId()) {
      Utils.showToast('You cannot scan your own QR code!', 'error');
      goBack();
      return;
    }

    // Navigate to confirmation with scanned ID
    window.location.hash = `#confirm/${scannedId}`;
  }

  async function stopScanner() {
    if (scanner) {
      try {
        await scanner.stop();
      } catch (_) {}
      scanner = null;
    }
  }

  function goBack() {
    stopScanner();
    // Restore header and bottom bar
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('bottom-bar').classList.remove('hidden');
    window.location.hash = '#board';
  }

  function cleanup() {
    stopScanner();
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('bottom-bar').classList.remove('hidden');
  }

  return { render, cleanup };
})();
