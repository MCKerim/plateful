export const IMAGE_COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 900,
  maxSizeMB: 0.5,
  useWebWorker: true,
  initialQuality: 0.85,
};

// React Query configuration
export const QUERY_STALE_TIME = 1000 * 30; // 30 seconds - responsive to household changes
export const QUERY_GC_TIME = 1000 * 60 * 10; // 10 minutes - keep unused cache for navigation

// Default category ID used when category lookup fails
export const DEFAULT_CATEGORY_ID = 5; // "Other" category

// Regex to remove common TLDs when generating recipe title from URL
export const COMMON_TLD_REGEX = /\.com$|\.de$|\.net$|\.org$/i;
