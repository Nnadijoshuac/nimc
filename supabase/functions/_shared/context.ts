// Request context shared by the public functions: client IP, bot detection,
// and a coarse device/browser/OS read of the user agent (no fingerprinting).

import { createClient } from "npm:@supabase/supabase-js@2";

export const serviceClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

export function clientIp(req: Request): string | null {
  const forwardedFor = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")[0]
    .trim();
  // Column is inet; anything that doesn't look like an address would fail the insert.
  return /^[0-9a-fA-F:.]{3,45}$/.test(forwardedFor) ? forwardedFor : null;
}

const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|telegram|curl|wget|python|axios|node-fetch/i;

export const isBot = (ua: string) => !ua || BOT_UA.test(ua);

export function parseUserAgent(ua: string) {
  const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua)
    ? "tablet"
    : /mobi|iphone|ipod|android/i.test(ua)
      ? "mobile"
      : "desktop";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /chrome|crios/i.test(ua)
          ? "Chrome"
          : /firefox|fxios/i.test(ua)
            ? "Firefox"
            : /safari/i.test(ua)
              ? "Safari"
              : "Other";

  const os = /windows/i.test(ua)
    ? "Windows"
    : /iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /android/i.test(ua)
        ? "Android"
        : /mac os/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Other";

  return { device, browser, os };
}

/** utm_source, else the referring site's host, else "direct". */
export function trafficSource(
  referrer: string | null | undefined,
  utm: { source?: string; medium?: string; campaign?: string },
  ownHosts: string[],
) {
  const clip = (v?: string) => (v ? v.slice(0, 100) : null);
  if (utm.source) {
    return {
      source: clip(utm.source.toLowerCase()),
      medium: clip(utm.medium),
      campaign: clip(utm.campaign),
    };
  }
  let host: string | null = null;
  try {
    host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : null;
  } catch {
    host = null;
  }
  if (!host || ownHosts.some((h) => host === h || host!.endsWith(`.${h}`))) {
    return { source: "direct", medium: null, campaign: null };
  }
  const medium = /google|bing|yahoo|duckduckgo|baidu|yandex/.test(host)
    ? "organic"
    : /facebook|instagram|t\.co|twitter|x\.com|linkedin|tiktok|youtube|whatsapp/.test(
          host,
        )
      ? "social"
      : "referral";
  return { source: host, medium, campaign: null };
}

export const OWN_HOSTS = ["ninsupportatalanta.com", "localhost"];

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
