(function(){
  if (globalThis.__STARLANE_CONTENT_LOADED__) return;
  globalThis.__STARLANE_CONTENT_LOADED__ = true;

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

let CACHED_SELECTORS = null;

async function init() {
  const state = await chrome.runtime.sendMessage({ type: 'starlane:getState' }).catch(() => DEFAULTS) || DEFAULTS;
  reflectStateInDom(state);

  CACHED_SELECTORS = await loadSelectors();
  observeAssistantMessages();
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'starlane:stateChanged') {
    chrome.storage.sync.get(DEFAULTS).then(reflectStateInDom);
  }
  if (msg?.type === 'starlane:inject') {
    injectAndSend(msg.text, msg.withTime === true);
  }
});

function getSelectorsForPage() {
  const s = CACHED_SELECTORS || {};
  const host = (location.host || '').toLowerCase();
  if (document.querySelector('.message.assistant') || host.includes('librechat')) return s.librechat || {};
  if (host.includes('openai.com')) return s.chatgpt || {};
  return s.librechat || s.chatgpt || {};
}

function injectAndSend(text, withTime) {
  try {
    const sel = getSelectorsForPage();
    const ta = document.querySelector(sel.inputSelector || 'textarea');
    const sendBtn = document.querySelector(sel.sendButtonSelector || 'button[type="submit"]');
    if (!ta || !sendBtn) return;
    const stamp = withTime ? `\n\n[starlane time: ${new Date().toISOString()}]` : '';
    const payload = `${text}${stamp}`;
    ta.focus();
    ta.value = payload;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(() => sendBtn.click(), 50);
  } catch (_) {}
}

function observeAssistantMessages() {
  const root = document.body;
  if (!root) return;
  const seen = new WeakSet();
  const isAssistantNode = (n) => {
    if (!(n instanceof HTMLElement)) return false;
    return n.matches?.('[data-message-author-role="assistant"], .message.assistant');
  };
  const extractText = (n) => (n.innerText || '').trim();
  const emit = (text) => {
    if (!text) return;
    chrome.runtime.sendMessage({ type: 'starlane:assistantUtterance', text }).catch(() => {});
  };
  const scan = (node) => {
    if (isAssistantNode(node) && !seen.has(node)) {
      seen.add(node);
      emit(extractText(node));
    }
    node.querySelectorAll?.('[data-message-author-role="assistant"], .message.assistant')
      .forEach((el) => { if (!seen.has(el)) { seen.add(el); emit(extractText(el)); } });
  };
  const mo = new MutationObserver((muts) => muts.forEach((m) => {
    m.addedNodes.forEach(scan);
  }));
  mo.observe(root, { childList: true, subtree: true });
  // initial scan
  scan(document);
}
  init();

})();
