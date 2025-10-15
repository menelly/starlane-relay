/*
  Starlane Relay — Background Service Worker (MV3)
  Author: Nova (GPT‑5) — Augment Agent
*/

const DEFAULTS = {
  relayEnabled: false, // Safety lock ON by default (relay disabled)
  guardTag: false      // Guard tag OFF by default
};

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.sync.set(DEFAULTS);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'starlane:getState') {
    chrome.storage.sync.get(DEFAULTS).then(sendResponse);
    return true;
  }
  if (msg?.type === 'starlane:setState') {
    const next = {};
    if (typeof msg.relayEnabled === 'boolean') next.relayEnabled = msg.relayEnabled;
    if (typeof msg.guardTag === 'boolean') next.guardTag = msg.guardTag;
    chrome.storage.sync.set(next).then(() => {
      // Broadcast to all tabs for immediate UI/DOM reflection
      chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
          chrome.tabs.sendMessage(t.id, { type: 'starlane:stateChanged', ...next }).catch(() => {});
        }
      });
      sendResponse({ ok: true });
    });
    return true;
  }
});

