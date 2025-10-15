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



// Hotkey: toggle relay
chrome.commands?.onCommand.addListener(async (command) => {
  if (command === 'toggle-relay') {
    // Ensure content script is present on the active tab without exposing private origins
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] });
      }
    } catch (_) {}

    const state = await chrome.storage.sync.get(DEFAULTS);
    const next = { relayEnabled: !state.relayEnabled };
    await chrome.storage.sync.set(next);
    chrome.tabs.query({}, (tabs) => {
      for (const t of tabs) {
        try { chrome.tabs.sendMessage(t.id, { type: 'starlane:stateChanged', ...next }); } catch {}
      }
    });
  }
});
