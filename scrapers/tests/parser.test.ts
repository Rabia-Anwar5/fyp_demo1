/**
 * Unit tests for Storefront HTML Parser
 */
import { StorefrontHtmlParser } from "../src/parsers/htmlParser";

describe("StorefrontHtmlParser", () => {
  test("parses product card with sale price and discount badge", () => {
    const html = `
      <div class="product-card" data-product-id="Zara-8821" data-stock-qty="8">
        <h2 class="product-name">Tailored Wool Jacket</h2>
        <div class="price-container">
          <del class="original-price">$120.00</del>
          <span class="sale-price">$89.99</span>
        </div>
        <div class="promo-banner">Special 25% Off - Use Code WINTER25</div>
      </div>
    `;

    const parsed = StorefrontHtmlParser.parseProduct(html, "store_zara_01");

    expect(parsed.store_id).toBe("store_zara_01");
    expect(parsed.source_item_id).toBe("Zara-8821");
    expect(parsed.title).toBe("Tailored Wool Jacket");
    expect(parsed.category).toBe("apparel");
    expect(parsed.subcategory).toBe("jacket");
    expect(parsed.current_price).toBe(89.99);
    expect(parsed.original_price).toBe(120.0);
    expect(parsed.in_stock).toBe(true);
    expect(parsed.stock_count).toBe(8);
    expect(parsed.promo_code).toBe("WINTER25");
    expect(parsed.discount_percent).toBe(25);
  });

  test("detects out-of-stock items accurately", () => {
    const html = `
      <div class="item" data-sku="HM-9901">
        <h3 class="title">Slim Denim Jeans</h3>
        <span class="current-price">$45.00</span>
        <div class="out-of-stock-label">Currently Out of Stock</div>
      </div>
    `;

    const parsed = StorefrontHtmlParser.parseProduct(html, "store_hm_02");

    expect(parsed.source_item_id).toBe("HM-9901");
    expect(parsed.title).toBe("Slim Denim Jeans");
    expect(parsed.category).toBe("apparel");
    expect(parsed.subcategory).toBe("pants");
    expect(parsed.current_price).toBe(45.0);
    expect(parsed.in_stock).toBe(false);
    expect(parsed.stock_count).toBe(0);
  });

  test("handles minimal HTML with fallback regex", () => {
    const html = `
      <div>
        <title>Sony Wireless Headphone</title>
        <p>Best audio experience. Price: $79.50</p>
      </div>
    `;

    const parsed = StorefrontHtmlParser.parseProduct(html, "store_sony");

    expect(parsed.title).toBe("Sony Wireless Headphone");
    expect(parsed.category).toBe("electronics");
    expect(parsed.subcategory).toBe("audio");
    expect(parsed.current_price).toBe(79.5);
    expect(parsed.in_stock).toBe(true);
  });
});
