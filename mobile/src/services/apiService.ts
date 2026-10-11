/**
 * CATCH Mobile - API Service
 * Handles communication with ai-service and logic-service.
 * Implements retry/backoff for resilience.
 */
import axios, { AxiosInstance } from "axios";

const AI_SERVICE_URL  = process.env.EXPO_PUBLIC_AI_SERVICE_URL  ?? "http://localhost:8000";
const LOGIC_SERVICE_URL = process.env.EXPO_PUBLIC_LOGIC_SERVICE_URL ?? "http://localhost:3001";

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  });

  // Retry interceptor (max 2 retries with exponential backoff)
  client.interceptors.response.use(
    (r) => r,
    async (err) => {
      const cfg = err.config;
      if (!cfg || cfg.__retryCount >= 2) return Promise.reject(err);
      cfg.__retryCount = (cfg.__retryCount ?? 0) + 1;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, cfg.__retryCount)));
      return client.request(cfg);
    }
  );

  return client;
}

export const aiClient    = createClient(AI_SERVICE_URL);
export const logicClient = createClient(LOGIC_SERVICE_URL);

export interface RecognitionResult {
  request_id: string;
  status: "recognized" | "uncertain" | "error";
  message?: string;
  category?: string;
  subcategory?: string;
  confidence?: number;
  bounding_boxes?: Array<{ x1: number; y1: number; x2: number; y2: number; label: string; conf: number }>;
  fabric?: {
    type?: string;
    quality_tier?: string;
    confidence?: number;
  };
  item_context_id?: string;
  latency?: Record<string, number>;
}

export interface Deal {
  deal_id: string;
  store_name: string;
  original_price: number;
  discounted_price: number;
  net_saving: number;
  saving_percent: number;
  coupon_code: string | null;
  expiry: string;
  terms: string;
  rank: number;
  why_top?: string;
  stock_status: string;
  last_updated?: string;
}

export interface DealsResponse {
  deals: Deal[];
  total_deals_found: number;
  deals_filtered_out: number;
  filter_reasons: string[];
  request_id: string;
}

/**
 * Upload an image and get recognition results.
 * @param imageUri - local URI from expo-camera or image picker
 * @param userId - optional user ID for analytics
 */
export async function recognizeImage(
  imageUri: string,
  userId?: string,
  mallId?: string
): Promise<RecognitionResult> {
  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    type: "image/jpeg",
    name: "capture.jpg",
  } as any);
  if (userId) formData.append("user_id", userId);
  if (mallId) formData.append("location", JSON.stringify({ mall_id: mallId }));

  const resp = await aiClient.post<RecognitionResult>("/api/v1/recognize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return resp.data;
}

/**
 * Fetch ranked deals for a recognised item.
 */
export async function fetchDeals(
  itemContextId: string,
  category: string,
  subcategory: string,
  options: { fabricType?: string; userId?: string; mallId?: string; referencePrice?: number } = {}
): Promise<DealsResponse> {
  const resp = await logicClient.post<DealsResponse>("/api/v1/deals", {
    item_context_id: itemContextId,
    category,
    subcategory,
    fabric_type: options.fabricType,
    user_id: options.userId,
    location: options.mallId ? { mall_id: options.mallId } : undefined,
    reference_price: options.referencePrice,
  });
  return resp.data;
}