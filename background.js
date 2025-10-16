/*
  Starlane Relay — Background Service Worker (MV3)
  Author: Nova (GPT‑5) — Augment Agent
*/

const DEFAULTS = {
  relayEnabled: false, // Safety lock ON by default (relay disabled)
  guardTag: false,     // Guard tag OFF by default
  relayOn: false,
  turnLimit: 10,
  turnCount: 0,
  pairA: null,
  pairB: null
};

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.sync.set(DEFAULTS);
});

async function getState() { return await chrome.storage.sync.get(DEFAULTS); }
function safeSend(tabId, payload) {
  try { chrome.tabs.sendMessage(tabId, payload, () => void chrome.runtime.lastError); } catch {}
}
async function ensureInjected(tabId) {
  try { await chrome.scripting.executeScript({ target: { tabId }, files: ['content/content.js'] }); } catch {}
}
async function setState(patch) {
  const next = { ...(await getState()), ...patch };
  await chrome.storage.sync.set(patch);
  // broadcast delta
  chrome.tabs.query({}, (tabs) => {
    for (const t of tabs) safeSend(t.id, { type: 'starlane:stateChanged', ...patch });
  });
  return next;
}

async function appendTranscript(entry) {
  const bag = await chrome.storage.local.get({ transcript: [] });
  bag.transcript.push(entry);
  await chrome.storage.local.set({ transcript: bag.transcript });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'starlane:getState') {
    getState().then(sendResponse);
    return true;
  }
  if (msg?.type === 'starlane:setState') {
    const patch = {};
    if (typeof msg.relayEnabled === 'boolean') patch.relayEnabled = msg.relayEnabled;
    if (typeof msg.guardTag === 'boolean') patch.guardTag = msg.guardTag;
    setState(patch).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === 'starlane:getRelayState') {
    getState().then(sendResponse); return true;
  }
  if (msg?.type === 'starlane:pairHere') {
    const side = (msg.side || 'A').toUpperCase();
    const targetId = msg.tabId || null;
    const useTab = async (id) => {
      if (!id) { sendResponse({ ok: false, error: 'no-tab' }); return; }
      try {
        await chrome.scripting.executeScript({ target: { tabId: id }, files: ['content/content.js'] });
        const patch = side === 'A' ? { pairA: id } : { pairB: id };
        await setState(patch);
        sendResponse({ ok: true, side, tabId: id });
      } catch (_) { sendResponse({ ok: false }); }
    };
    if (targetId) {
      useTab(targetId);
    } else {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => useTab(tab?.id));
    }
    return true;
  }
  if (msg?.type === 'starlane:startRelay') {
    (async () => {
      const st = await getState();
      if (st.pairA) await ensureInjected(st.pairA);
      if (st.pairB) await ensureInjected(st.pairB);
      await setState({ relayOn: true, turnCount: 0 });
      sendResponse({ ok: true });
    })();
    return true;
  }
  if (msg?.type === 'starlane:stopRelay') {
    setState({ relayOn: false }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === 'starlane:setTurnLimit') {
    const n = Math.max(1, Math.min(200, Number(msg.value) || 10));
    setState({ turnLimit: n }).then(() => sendResponse({ ok: true, value: n }));
    return true;
  }
  if (msg?.type === 'starlane:getTranscript') {
    chrome.storage.local.get({ transcript: [] }).then(sendResponse); return true;
  }
  if (msg?.type === 'starlane:assistantUtterance') {
    (async () => {
      const st = await getState();
      const tabId = sender.tab?.id;
      const side = tabId === st.pairA ? 'A' : (tabId === st.pairB ? 'B' : '?');
      const entry = { t: Date.now(), side, text: msg.text };
      await appendTranscript(entry);
      if (!st.relayOn || st.turnCount >= st.turnLimit) return;
      const otherId = side === 'A' ? st.pairB : (side === 'B' ? st.pairA : null);
      if (!otherId) return;
      try {
        await ensureInjected(otherId);
        safeSend(otherId, { type: 'starlane:inject', text: msg.text, withTime: true });
        await setState({ turnCount: st.turnCount + 1 });
        if (st.turnCount + 1 >= st.turnLimit) await setState({ relayOn: false });
      } catch (_) {}
      sendResponse({ ok: true });
    })();
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
      for (const t of tabs) safeSend(t.id, { type: 'starlane:stateChanged', ...next });
    });
  }
});
