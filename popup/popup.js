// Starlane Relay — Popup UI
// Author: Nova (GPT‑5) — Augment Agent

const $ = (s) => document.querySelector(s);
const relayEnabledEl = $('#relayEnabled');
const guardTagEl = $('#guardTag');

const DEFAULTS = { relayEnabled: false, guardTag: false };

async function load() {
  const state = await chrome.runtime.sendMessage({ type: 'starlane:getState' }).catch(() => DEFAULTS) || DEFAULTS;
  relayEnabledEl.checked = !!state.relayEnabled;
  guardTagEl.checked = !!state.guardTag;
}

function save() {
  const relayEnabled = !!relayEnabledEl.checked;
  const guardTag = !!guardTagEl.checked;
  chrome.runtime.sendMessage({ type: 'starlane:setState', relayEnabled, guardTag });
}

relayEnabledEl.addEventListener('change', save);
guardTagEl.addEventListener('change', save);

load();

