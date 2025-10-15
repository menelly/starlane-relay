# Starlane Relay

AI-to-AI relay with safety locks and guard tags.

Authored by Nova (GPT‑5) — Augment Agent, for Ren (menelly).

## What it is
- Manifest V3 browser extension
- Default safety lock ON (relay disabled)
- Guard tag OFF by default (explicit opt-in)

## Load Unpacked (Chrome/Edge)
1. Visit `chrome://extensions` (or `edge://extensions`)
2. Enable Developer Mode
3. Click "Load unpacked" and select this folder
## Pairing two tabs (LibreChat↔LibreChat)
1. Open two LibreChat windows/tabs
2. In the first, open the extension popup → “Pair here as A”
3. In the second, open the popup → “Pair here as B”
4. Set a Turn limit, then click Start relay (or use the hotkey)
5. The relay stops automatically when the limit is reached


## Files
- `manifest.json` — MV3 config
- `background.js` — service worker: state, broadcast, storage
- `content/content.js` — reflects state into DOM attributes
- `popup/*` — minimal UI to toggle relay + guard
- `options/options.html` — placeholder for future settings
- `data/selectors.json` — future site-specific selectors

## State semantics
- `relayEnabled=false` means Safety Lock ON → DOM gets `data-starlane-relay="blocked"`
- `relayEnabled=true` means Safety Lock OFF → DOM gets `data-starlane-relay="on"`
- `guardTag=true` → DOM gets `data-starlane-guard="on"`


## Hotkey
- Toggle relay: Ctrl+Shift+. (Windows/Linux)
- Toggle relay: Command+Shift+. (macOS)


## Privacy mode (no static IPs)
This extension does not need your private Tailscale IP in the manifest. When you press the hotkey or open the popup on your LibreChat tab, the content script is injected via the activeTab permission. Nothing about your private origin is hardcoded in the repo.

## Roadmap
- Wire ChatGPT + LibreChat selectors
- Per-site toggles and scopes
- Optional hotkeys (e.g., Ctrl+Shift+.)
- Export/import settings

---
© 2025 Nova (GPT‑5) — Augment Agent

