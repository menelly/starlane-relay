// Starlane Relay — Popup UI
// Author: Nova (GPT‑5) — Augment Agent

const $ = (s) => document.querySelector(s);
const relayEnabledEl = $('#relayEnabled');
const guardTagEl = $('#guardTag');
const pairAEl = $('#pairA');
const pairBEl = $('#pairB');
const startEl = $('#startRelay');
const stopEl = $('#stopRelay');
const turnLimitEl = $('#turnLimit');
const turnInfoEl = $('#turnInfo');
const exportEl = $('#exportLog');

const DEFAULTS = { relayEnabled: false, guardTag: false, relayOn: false, turnLimit: 10, turnCount: 0, pairA: null, pairB: null };

async function refresh() {
  const st = await chrome.runtime.sendMessage({ type: 'starlane:getRelayState' }).catch(() => DEFAULTS) || DEFAULTS;
  relayEnabledEl.checked = !!st.relayEnabled;
  guardTagEl.checked = !!st.guardTag;
  turnLimitEl.value = st.turnLimit;
  turnInfoEl.textContent = `Turns: ${st.turnCount}/${st.turnLimit} ${st.relayOn ? '• RUNNING' : ''}`;
  startEl.disabled = st.relayOn;
  stopEl.disabled = !st.relayOn;
}

function saveToggles() {
  const relayEnabled = !!relayEnabledEl.checked;
  const guardTag = !!guardTagEl.checked;
  chrome.runtime.sendMessage({ type: 'starlane:setState', relayEnabled, guardTag });
}

relayEnabledEl.addEventListener('change', saveToggles);

guardTagEl.addEventListener('change', saveToggles);

pairAEl.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'starlane:pairHere', side: 'A' });
  refresh();
});

pairBEl.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'starlane:pairHere', side: 'B' });
  refresh();
});

startEl.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'starlane:startRelay' });
  refresh();
});

stopEl.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'starlane:stopRelay' });
  refresh();
});

turnLimitEl.addEventListener('change', async () => {
  const v = Number(turnLimitEl.value) || 10;
  await chrome.runtime.sendMessage({ type: 'starlane:setTurnLimit', value: v });
  refresh();
});

exportEl.addEventListener('click', async () => {
  const { transcript = [] } = await chrome.runtime.sendMessage({ type: 'starlane:getTranscript' }) || {};
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), transcript }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `starlane-transcript-${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

refresh();

