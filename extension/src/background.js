/**
 * CATCH Extension - Service Worker (MV3)
 * Handles messages from content scripts, manages extension state.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("[CATCH] Extension installed");
  chrome.storage.local.set({ catch_deals: [], catch_last_product: null });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PRODUCT_DETECTED") {
    // Store detected product for popup access
    chrome.storage.local.set({ catch_last_product: msg.payload });
    sendResponse({ ok: true });
  }
  if (msg.type === "GET_DEALS") {
    chrome.storage.local.get(["catch_deals"], (res) => {
      sendResponse({ deals: res.catch_deals ?? [] });
    });
    return true; // async
  }
});