# AdaptLearn – Cognitive Accessibility Extension

Chrome/Edge (Manifest V3) extension that applies **Dyslexia**, **ADHD Focus**, and **Low Vision** styling on any website. No AI or network calls; all transformations are CSS and minimal DOM.

## Load the extension (unpacked)

1. Open Chrome or Edge and go to `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select the folder that contains this README (the `extension` folder inside the project).

The extension icon should appear in the toolbar. Click it to open the popup.

## Popup controls

- **Enable extension** – Master switch. When off, no styles are applied.
- **Dyslexia mode** – OpenDyslexic font, increased letter-spacing and line-height, paragraph spacing.
- **ADHD focus mode** – Click a paragraph (or block) on the page to dim the rest and highlight it; **Clear focus** in the popup removes the highlight.
- **Low vision mode** – Higher contrast, bolder links.
- **Font size** – Slider (100%–160%).
- **Reset** – Restore all settings to defaults.
- **Clear focus** – Remove ADHD focus highlight from the current tab.

Settings are saved in `chrome.storage.sync` and apply across tabs and reloads.

## Quick test checklist

1. **Enable** the extension in the popup, then open a text-heavy page (e.g. a Wikipedia article).
2. **Dyslexia mode** – Turn on; body text should use OpenDyslexic and feel more spaced.
3. **Font size** – Move the slider; page base font size should change.
4. **ADHD focus** – Turn on, then click a paragraph; that block should stay bright and the rest of the page dim. Click **Clear focus** to remove the highlight.
5. **Low vision** – Turn on; background and link contrast should increase.
6. Reload the page and confirm your toggles and font size are still applied.
7. **Reset** – Click Reset and confirm all options return to defaults and styles are cleared when extension is off.

## Font (OpenDyslexic)

The extension bundles `opendyslexic-latin-400-normal.woff2` from `@fontsource/opendyslexic`. If the font is missing:

- From the project root, ensure the font package is installed and copy the file:
  ```bash
  npm install @fontsource/opendyslexic --save-dev
  ```
  Then copy:
  - `node_modules/@fontsource/opendyslexic/files/opendyslexic-latin-400-normal.woff2`
  to:
  - `extension/assets/fonts/opendyslexic-latin-400-normal.woff2`

## Scope and limits

- Does **not** run on Chrome Web Store restricted URLs (e.g. `chrome://`, `edge://`). Popup actions for those tabs will no-op.
- Form controls (`input`, `textarea`, `select`, `button`) and `code`/`pre` are excluded from the dyslexia font to avoid breaking layouts.
- ADHD focus picks the nearest block (e.g. `p`, `li`, `article`) with at least ~20 characters of text.

## File layout

- `manifest.json` – MV3 manifest, permissions, content script, popup, web_accessible_resources.
- `contentScript.js` – Reads storage, applies classes/CSS variables to `document.documentElement`, handles ADHD click-to-focus and messages.
- `styles.css` – `@font-face` for OpenDyslexic; styles for `.adaptn-enabled`, `.adaptn-dyslexia`, `.adaptn-lowvision`, `.adaptn-adhd`, `.adaptn-focus-target`.
- `popup/popup.html`, `popup.css`, `popup.js` – Popup UI and storage + tab messaging.
- `background.js` – Optional relay; popup talks to the active tab directly.
- `assets/fonts/` – OpenDyslexic woff2.
