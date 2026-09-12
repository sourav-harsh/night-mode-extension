(() => {
  if (window.__nightModeInjected) return;
  window.__nightModeInjected = true;

  const DEFAULTS = {
    enabled: false,
    mode: "invert",
    brightness: 90,
    temperature: 50,
  };

  const STYLE_ID = "night-mode-style";
  const OVERLAY_ID = "night-mode-overlay";

  let state = { ...DEFAULTS };

  function getHost() {
    return location.hostname;
  }

  function getInvertFilter() {
    const t = state.temperature;

    let filter = "invert(1) hue-rotate(180deg)";

    if (t > 50) {
      const sepia = ((t - 50) / 50) * 0.35;

      filter += ` sepia(${sepia.toFixed(3)})`;
    } else if (t < 50) {
      const amount = (50 - t) / 50;

      filter += ` hue-rotate(${(-amount * 15).toFixed(2)}deg)`;
      filter += ` saturate(${(1 + amount * 0.2).toFixed(3)})`;
    }

    filter += ` brightness(${(state.brightness / 100).toFixed(3)})`;

    return filter;
  }

  function getOverlayColor() {
    const t = state.temperature;

    const warm = Math.max(0, t - 50) / 50;
    const cool = Math.max(0, 50 - t) / 50;

    const r = Math.round(8 + warm * 24);
    const g = Math.round(8 + warm * 8 + cool * 4);
    const b = Math.round(10 + cool * 26);

    const alpha = Math.min(
        0.88,
        ((100 - state.brightness) / 100) * 0.95 + 0.08
    );

    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  }

  function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(OVERLAY_ID)?.remove();

    document.documentElement.classList.remove(
        "night-mode-invert"
    );

    document.documentElement.classList.remove(
        "night-mode-dim"
    );
  }

  function applyInvert() {
    const style = document.createElement("style");

    style.id = STYLE_ID;

    style.textContent = `
      html.night-mode-invert {
        filter: ${getInvertFilter()} !important;
        background: #ffffff !important;
      }

      /*
       * Compensate media elements because the parent
       * html element is inverted.
       */
      html.night-mode-invert img,
      html.night-mode-invert video,
      html.night-mode-invert canvas,
      html.night-mode-invert iframe,
      html.night-mode-invert svg,
      html.night-mode-invert picture {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      /*
       * Don't destroy common browser-like UI elements.
       */
      html.night-mode-invert input,
      html.night-mode-invert textarea,
      html.night-mode-invert select,
      html.night-mode-invert button {
        color-scheme: dark;
      }
    `;

    (document.head || document.documentElement).appendChild(style);

    document.documentElement.classList.add(
        "night-mode-invert"
    );
  }

  function applyDim() {
    const overlay = document.createElement("div");

    overlay.id = OVERLAY_ID;

    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "2147483647",
      pointerEvents: "none",
      background: getOverlayColor(),
    });

    (document.body || document.documentElement).appendChild(
        overlay
    );

    document.documentElement.classList.add(
        "night-mode-dim"
    );
  }

  function apply() {
    removeStyles();

    if (!state.enabled) {
      // console.log("[NightMode] Disabled");
      return;
    }

    // console.log("[NightMode] Applying:", state);

    if (state.mode === "invert") {
      applyInvert();
    } else if (state.mode === "dim") {
      applyDim();
    }
  }

  /*
   * Load saved site settings.
   */
  try {
    chrome.storage.local.get("sites", (data) => {
      const saved = data?.sites?.[getHost()];

      if (saved) {
        state = {
          ...DEFAULTS,
          ...saved,
        };

        // console.log(
        //     "[NightMode] Loaded saved state:",
        //     state
        // );

        apply();
      }
    });
  } catch (error) {
    console.error(
        "[NightMode] Storage error:",
        error
    );
  }

  /*
   * Receive messages from popup.
   */
  chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {

        if (message?.type === "nm:ping") {
          sendResponse({
            ok: true,
          });

          return false;
        }

        if (message?.type === "nm:update") {
          state = {
            ...DEFAULTS,
            ...(message.state || {}),
          };

          // console.log(
          //     "[NightMode] Update received:",
          //     state
          // );

          apply();

          sendResponse({
            ok: true,
          });

          return false;
        }

        return false;
      }
  );
})();
