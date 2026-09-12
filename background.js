// Night Mode service worker: hotkey toggle.
const DEFAULTS = { enabled: false, mode: "invert", brightness: 90, temperature: 50 };

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-nightmode") return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) return;
    let hostname;
    try {
      hostname = new URL(tab.url).hostname;
    } catch (_) {
      return;
    }
    if (!hostname) return;

    const data = await chrome.storage.local.get("sites");
    const sites = data.sites || {};
    const current = { ...DEFAULTS, ...(sites[hostname] || {}) };
    current.enabled = !current.enabled;
    sites[hostname] = current;
    await chrome.storage.local.set({ sites });

    try {
      await chrome.tabs.sendMessage(tab.id, { type: "nm:update", state: current });
    } catch (_) {
      /* content script not available on this page */
    }
  } catch (_) {
    /* noop */
  }
});
