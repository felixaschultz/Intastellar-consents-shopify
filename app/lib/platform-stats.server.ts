/**
 * Public, aggregated figures from the Intastellar Consents Platform, shown on
 * the marketing landing page. Fetched server-side so the numbers are in the
 * SSR HTML (crawlable), and cached in memory so the landing page doesn't wait
 * on intastellarconsents.com for every request.
 */
const PLATFORM_STATS_URL = "https://www.intastellarconsents.com/api/platform-stats-public";
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 3000;

export type PlatformStats = {
  asOf: string;
  consentRecords30d: number;
  countries30d: number;
  acceptAllPct: number;
  declineAllPct: number;
  sitesScanned: number;
  medianTrackingServices: number;
  /** Optional: shown only when the API provides it. */
  euAcceptPct: number | null;
  topTrackers: Array<{ name: string; pct: number }>;
};

let cached: { value: PlatformStats | null; expiresAt: number } | null = null;

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parse(body: unknown): PlatformStats | null {
  if (!body || typeof body !== "object") return null;
  const { published, as_of, figures } = body as {
    published?: unknown;
    as_of?: unknown;
    figures?: Record<string, unknown>;
  };
  if (published !== true || typeof as_of !== "string" || !figures) return null;

  const consentRecords30d = toNumber(figures.consent_records_30d);
  const countries30d = toNumber(figures.countries_30d);
  const acceptAllPct = toNumber(figures.accept_all_pct);
  const declineAllPct = toNumber(figures.decline_all_pct);
  const sitesScanned = toNumber(figures.sites_scanned);
  const medianTrackingServices = toNumber(figures.median_tracking_services);
  if (
    consentRecords30d === null ||
    countries30d === null ||
    acceptAllPct === null ||
    declineAllPct === null ||
    sitesScanned === null ||
    medianTrackingServices === null
  ) {
    return null;
  }

  const topTrackers = Array.isArray(figures.top_trackers)
    ? figures.top_trackers
        .filter(
          (t): t is { name: string; pct: number } =>
            typeof t?.name === "string" && toNumber(t?.pct) !== null,
        )
        .slice(0, 6)
        .map(({ name, pct }) => ({ name, pct }))
    : [];

  return {
    asOf: as_of,
    consentRecords30d,
    countries30d,
    acceptAllPct,
    declineAllPct,
    sitesScanned,
    medianTrackingServices,
    euAcceptPct: toNumber(figures.eu_accept_pct),
    topTrackers,
  };
}

/** Returns null when the API is unreachable, unpublished, or malformed. */
export async function getPlatformStats(): Promise<PlatformStats | null> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: PlatformStats | null = null;
  try {
    const response = await fetch(PLATFORM_STATS_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (response.ok) value = parse(await response.json());
  } catch (error) {
    console.warn("[platform-stats] fetch failed", error);
  }

  // Keep serving the last good figures if a refresh fails.
  if (!value && cached?.value) value = cached.value;
  cached = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}
