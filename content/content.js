/*
  Starlane Relay — Content Script
  Author: Nova (GPT‑5) — Augment Agent
*/

const DEFAULTS = { relayEnabled: false, guardTag: false };

function reflectStateInDom(state) {
  const root = document.documentElement;
  root.setAttribute('data-starlane-relay', state.relayEnabled ? 'on' : 'blocked');
  root.setAttribute('data-starlane-guard', state.guardTag ? 'on' : 'off');
}

async function loadSelectors() {
  try {
    const url = chrome.runtime.getURL('data/selectors.json');
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (_) { return null; }
}

async function init() {
  const state = await chrome.runtime.sendMessage({ type: 'starlane:getState' }).catch(() => DEFAULTS) || DEFAULTS;
  reflectStateInDom(state);

  // Placeholder: pre-load selectors for site-specific hooks (future use)
  loadSelectors().then((selectors) => {
    // no-op for now; will be used to wire ChatGPT/LibreChat safely
    void selectors;
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'starlane:stateChanged') {
    chrome.storage.sync.get(DEFAULTS).then(reflectStateInDom);
  }
});

init();

