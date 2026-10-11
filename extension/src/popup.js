/**
 * CATCH Extension Popup
 */
document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const dealsEl  = document.getElementById("deals-list");
  const scanBtn  = document.getElementById("scan-btn");

  // Load last detected product + deals
  chrome.storage.local.get(["catch_last_product", "catch_deals"], (res) => {
    const product = res.catch_last_product;
    const deals = res.catch_deals ?? [];

    if (product?.title) {
      statusEl.textContent = `Detected: ${product.title.substring(0, 50)}...`;
    } else {
      statusEl.textContent = "No product detected on this page.";
    }

    renderDeals(deals);
  });

  scanBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "MANUAL_SCAN" });
        statusEl.textContent = "Scanning...";
        setTimeout(() => {
          chrome.storage.local.get(["catch_deals"], (res) => renderDeals(res.catch_deals ?? []));
        }, 2000);
      }
    });
  });

  function renderDeals(deals) {
    if (!deals || deals.length === 0) {
      dealsEl.innerHTML = '<div class="empty">No deals found yet. Try scanning the page.</div>';
      return;
    }
    dealsEl.innerHTML = deals.slice(0, 5).map(d => `
      <div class="deal-card">
        <div class="saving">${d.saving_percent}% off — Save ${d.net_saving?.toFixed(2) ?? "-"}</div>
        ${d.coupon_code ? `<div class="code">Code: ${d.coupon_code}</div>` : ""}
        <div class="store">${d.store_name}</div>
      </div>`).join("");
  }
});