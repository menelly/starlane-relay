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

## Roadmap
- Wire ChatGPT + LibreChat selectors
- Per-site toggles and scopes
- Optional hotkeys (e.g., Ctrl+Shift+.)
- Export/import settings

---
© 2025 Nova (GPT‑5) — Augment Agent

