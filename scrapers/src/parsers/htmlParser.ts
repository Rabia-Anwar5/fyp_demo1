/**
 * Storefront HTML Parser
 * Extracts product metadata, pricing, stock levels, and promotional codes
 * from storefront HTML markup (used for both static BS4 and Puppeteer DOM extraction).
 */

export interface ParsedStoreProduct {
  store_id: string;
  source_item_id: string;
  title: string;
  category: string;
  subcategory: string;
  current_price: number;
  original_price: number;
  currency: string;
  in_stock: boolean;
  stock_count?: number;
  promo_code?: string;
  discount_percent?: number;
  promo_text?: string;
}

export class StorefrontHtmlParser {
  /**
   * Parse a raw product card or detail page HTML string.
   * Handles semantic microdata, CSS classes, and regex fallbacks.
   */
  static parseProduct(html: string, storeId: string = "store_generic"): ParsedStoreProduct {
    // 1. Title extraction
    const titleMatch =
      html.match(/<h[1-3][^>]*class=["'][^"']*(?:title|product-name|item-title)[^"']*["'][^>]*>(.*?)<\/h[1-3]>/i) ||
      html.match(/<title>(.*?)<\/title>/i) ||
      html.match(/data-product-name=["']([^"']+)["']/i);
    const title = titleMatch ? this.cleanText(titleMatch[1]) : "Unknown Product";

    // 2. Item ID / SKU
    const idMatch =
      html.match(/data-product-id=["']([^"']+)["']/i) ||
      html.match(/data-sku=["']([^"']+)["']/i) ||
      html.match(/id=["']item-([a-zA-Z0-9_-]+)["']/i);
    const source_item_id = idMatch ? idMatch[1] : `item_${Math.abs(this.hashCode(title))}`;

    // 3. Price extraction
    // Looks for sale/discounted price first
    const salePriceMatch =
      html.match(/class=["'][^"']*(?:sale-price|special-price|current-price|price-now)[^"']*["'][^>]*>\s*([$€£¥RM\d,.\s]+)<\//i) ||
      html.match(/data-price=["']([\d.]+)["']/i);

    const origPriceMatch =
      html.match(/class=["'][^"']*(?:regular-price|original-price|price-was|was-price)[^"']*["'][^>]*>\s*([$€£¥RM\d,.\s]+)<\//i) ||
      html.match(/<del[^>]*>\s*([$€£¥RM\d,.\s]+)<\/del>/i);

    const fallbackPriceMatch = html.match(/(?:[$€£¥RM]|USD|EUR)\s?([\d,]+\.?\d{0,2})/i);

    const current_price = salePriceMatch
      ? this.extractNumericPrice(salePriceMatch[1])
      : fallbackPriceMatch
      ? this.extractNumericPrice(fallbackPriceMatch[1])
      : 0;

    const original_price = origPriceMatch
      ? this.extractNumericPrice(origPriceMatch[1])
      : current_price;

    // 4. Currency
    const currencyMatch = html.match(/[$€£¥]|(?:USD|EUR|GBP|MYR|SGD)/i);
    const currency = currencyMatch ? currencyMatch[0].trim() : "USD";

    // 5. Stock status
    const outOfStockMatch =
      html.match(/class=["'][^"']*(?:out-of-stock|sold-out|unavailable)[^"']*["']/i) ||
      html.match(/out\s+of\s+stock/i);
    const in_stock = !outOfStockMatch;

    // Optional stock quantity count
    const stockQtyMatch = html.match(/data-stock-qty=["'](\d+)["']/i) || html.match(/only\s+(\d+)\s+left\s+in\s+stock/i);
    const stock_count = stockQtyMatch ? parseInt(stockQtyMatch[1], 10) : (in_stock ? 15 : 0);

    // 6. Promotional coupons or badges
    const promoCodeMatch =
      html.match(/data-promo-code=["']([A-Z0-9_-]+)["']/i) ||
      html.match(/use\s+code\s+([A-Z0-9]{3,15})\b/i) ||
      html.match(/coupon:\s*([A-Z0-9]{3,15})\b/i);
    const promo_code = promoCodeMatch ? promoCodeMatch[1].toUpperCase() : undefined;

    const promoBadgeMatch = html.match(/class=["'][^"']*(?:badge|promo-banner|discount-tag)[^"']*["'][^>]*>(.*?)<\//i);
    const promo_text = promoBadgeMatch ? this.cleanText(promoBadgeMatch[1]) : undefined;

    // Calculate discount percent
    let discount_percent = 0;
    if (original_price > current_price && original_price > 0) {
      discount_percent = Math.round(((original_price - current_price) / original_price) * 100);
    } else if (promo_text) {
      const pctMatch = promo_text.match(/(\d+)%\s*off/i);
      if (pctMatch) discount_percent = parseInt(pctMatch[1], 10);
    }

    // Heuristic category mapping from title
    const lowerTitle = title.toLowerCase();
    let category = "apparel";
    let subcategory = "other";
    if (lowerTitle.includes("jacket") || lowerTitle.includes("coat") || lowerTitle.includes("blazer")) {
      category = "apparel";
      subcategory = "jacket";
    } else if (lowerTitle.includes("shirt") || lowerTitle.includes("tee") || lowerTitle.includes("top")) {
      category = "apparel";
      subcategory = "shirt";
    } else if (lowerTitle.includes("denim") || lowerTitle.includes("jean") || lowerTitle.includes("pant")) {
      category = "apparel";
      subcategory = "pants";
    } else if (lowerTitle.includes("headphone") || lowerTitle.includes("audio") || lowerTitle.includes("earbud")) {
      category = "electronics";
      subcategory = "audio";
    } else if (lowerTitle.includes("bag") || lowerTitle.includes("backpack") || lowerTitle.includes("purse")) {
      category = "accessories";
      subcategory = "bag";
    }

    return {
      store_id: storeId,
      source_item_id,
      title,
      category,
      subcategory,
      current_price,
      original_price,
      currency,
      in_stock,
      stock_count,
      promo_code,
      discount_percent,
      promo_text,
    };
  }

  private static cleanText(text: string): string {
    return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  }

  private static extractNumericPrice(priceStr: string): number {
    const cleaned = priceStr.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
