import React, { useEffect, useState } from "react";

const DEFAULTS = {
  enabled: false,
  mode: "invert",
  brightness: 90,
  temperature: 50,
};

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
  checked ? "bg-indigo-500" : "bg-zinc-600"
}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
  checked ? "translate-x-5" : "translate-x-0"
}`}
      />
    </button>
  );
}

function Slider({ label, value, min, max, onChange, format }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        <span className="text-xs tabular-nums text-zinc-400">
          {format(value)}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(DEFAULTS);
  const [hostname, setHostname] = useState("");
  const [supported, setSupported] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
          setSupported(false);
          setReady(true);
          return;
        }

        const host = new URL(tab.url).hostname;
        setHostname(host);

        // Load saved settings for this website
        const data = await chrome.storage.local.get("sites");
        const saved = data?.sites?.[host];

        setState({
          ...DEFAULTS,
          ...(saved || {}),
        });

        // Check whether content script is actually injected
        try {
          const response = await chrome.tabs.sendMessage(tab.id, {
            type: "nm:ping",
          });

          console.log("[NightMode] Content script ready:", response);
        } catch (error) {
          console.error(
            "[NightMode] Content script ping failed:",
            error
          );
        }
      } catch (error) {
        console.error("[NightMode] Initialization failed:", error);
        setSupported(false);
      }

      setReady(true);
    }

    initialize();
  }, []);

  async function update(patch) {
    const next = {
      ...state,
      ...patch,
    };

    // Update popup immediately
    setState(next);

    try {
      // Save per-site settings
      const data = await chrome.storage.local.get("sites");

      const sites = data?.sites || {};

      if (hostname) {
        sites[hostname] = next;
      }

      await chrome.storage.local.set({
        sites,
      });

      // Get current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        return;
      }

      // Send the ACTUAL state to the content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "nm:update",
          state: next,
        });

        // console.log("[NightMode] Update applied:", response);
      } catch (error) {
        console.error(
          "[NightMode] Failed to send update:",
          error
        );
      }
    } catch (error) {
      console.error("[NightMode] Failed to save settings:", error);
    }
  }

  if (!ready) {
    return (
      <div className="bg-zinc-900 p-6 text-sm text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-4 text-zinc-100">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌙</span>

          <div>
            <h1 className="text-sm font-semibold">
              Night Mode
            </h1>

            <p className="text-[11px] text-zinc-400">
              {supported
                ? hostname
                : "This page can't be darkened"}
            </p>
          </div>
        </div>

        <Toggle
          checked={state.enabled}
          onChange={(value) =>
            update({ enabled: value })
          }
        />
      </div>

      {!supported && (
        <p className="mb-3 rounded-md bg-zinc-800 p-2 text-[11px] text-zinc-400">
          Chrome internal pages and the Web Store can't be
          modified. Try any regular website — your settings
          are saved per site.
        </p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-zinc-800 p-1">
        {[
          {
            id: "invert",
            label: "Smart invert",
          },
          {
            id: "dim",
            label: "Dim overlay",
          },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() =>
              update({ mode: mode.id })
            }
            className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
  state.mode === mode.id
      ? "bg-indigo-500 text-white"
      : "text-zinc-400 hover:text-zinc-200"
}`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Slider
          label="Brightness"
          min={40}
          max={100}
          value={state.brightness}
          onChange={(value) =>
            update({ brightness: value })
          }
          format={(value) => `${value}%`}
        />

        <Slider
          label="Color temperature"
          min={0}
          max={100}
          value={state.temperature}
          onChange={(value) =>
            update({ temperature: value })
          }
          format={(value) =>
            value > 60
              ? "Warm"
              : value < 40
              ? "Cool"
              : "Neutral"
          }
        />
      </div>

      <p className="mt-4 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
        Tip: press{" "}
        <kbd className="rounded bg-zinc-800 px-1">
          Alt+Shift+D
        </kbd>{" "}
        to toggle night mode. Settings are remembered for
        this site.
      </p>
    </div>
  );
}

