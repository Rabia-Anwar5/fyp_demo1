# CATCH Chrome Extension (MV3)

## Loading in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

## Architecture

- `public/manifest.json` - MV3 manifest
- `src/contentScript.js` - DOM scanning, product detection, overlay injection
- `src/background.js`    - Service worker, message routing, storage
- `src/popup.js`         - Extension popup UI
- `src/overlay.css`      - Injected floating panel styles

## Features

- Detects product title and price using CSS selectors + regex
- Category guessing from product title (text-based, no image upload from extension)
- Floating overlay with top-3 deals and coupon code copy
- Virtual try-on stub (AR placeholder with 2D overlay)
- SPA support via MutationObserver

## Virtual Try-On (AR Stub)

The try-on feature is intentionally scoped as an AR-ready 2D overlay placeholder.
Full photorealistic try-on is out of scope for this MVP.
Future: WebXR + canvas garment compositing in M6+.