// api/all-balls.js
import { withCors, validateInput } from '../middleware.js';

// Whitelist of allowed API endpoints
const ALLOWED_API_BASE = 'https://bowwwl.com/restapi/balls/v2';

// ─── In-memory cache ──────────────────────────────────────────────────────────
// The upstream API no longer supports a "return all" query parameter; it now
// paginates. We loop through all pages here and cache the result so that:
//   a) Subsequent requests are served instantly (no upstream calls).
//   b) The initial page-loop completes within Vercel Hobby's 10-second limit by
//      fetching PAGE_BATCH_SIZE pages concurrently instead of sequentially.
//
// Estimated dataset: ~3 000 balls, ~60 pages → 6 concurrent batches of 10 ≈ 1–2 s.
// TTL of 24 hours is appropriate because new balls are released roughly weekly.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PAGE_BATCH_SIZE = 10; // pages fetched concurrently per batch

let ballsCache = null;
let cacheExpiry = 0;
// Shared promise so concurrent requests during a cold-start share a single fetch
// rather than each triggering their own full pagination loop.
let cacheFillPromise = null;

async function fetchPage(page) {
  const res = await fetch(`${ALLOWED_API_BASE}?page=${page}`, {
    headers: { 'User-Agent': 'bowwwl-proxy/1.0' },
    // Per-page timeout of 8 s leaves headroom within the 10-s function limit.
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchAllPages() {
  const all = [];
  let startPage = 0;

  while (true) {
    // Fetch a batch of pages in parallel.
    const pageNums = Array.from({ length: PAGE_BATCH_SIZE }, (_, i) => startPage + i);
    const results = await Promise.all(pageNums.map(fetchPage));

    let done = false;
    for (const pageData of results) {
      if (pageData.length === 0) {
        done = true;
        break;
      }
      all.push(...pageData);
    }

    if (done) break;
    startPage += PAGE_BATCH_SIZE;
  }

  // Sort once here so every subsequent request reads an already-sorted cache.
  return all.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
}

async function getOrRefreshCache() {
  if (ballsCache && Date.now() < cacheExpiry) {
    return ballsCache;
  }

  // Deduplicate: if a fill is already in progress, wait for the same promise.
  if (!cacheFillPromise) {
    cacheFillPromise = fetchAllPages()
      .then((data) => {
        ballsCache = data;
        cacheExpiry = Date.now() + CACHE_TTL_MS;
        cacheFillPromise = null;
        return data;
      })
      .catch((err) => {
        cacheFillPromise = null;
        throw err;
      });
  }

  return cacheFillPromise;
}

// ─────────────────────────────────────────────────────────────────────────────

async function handler(req, res) {
  // Validate optional query parameters for client-side filtering.
  let updatedFilter = null;
  let weightFilter = null;

  if (req.query.updated) {
    const updatedValidation = validateInput(req.query.updated, 'alphanumeric', 50);
    if (!updatedValidation.valid) {
      return res
        .status(400)
        .json({ error: `Invalid updated parameter: ${updatedValidation.error}` });
    }
    updatedFilter = updatedValidation.value;
  }

  if (req.query.weight) {
    const weightValidation = validateInput(req.query.weight, 'number');
    if (!weightValidation.valid) {
      return res
        .status(400)
        .json({ error: `Invalid weight parameter: ${weightValidation.error}` });
    }
    if (weightValidation.value < 0 || weightValidation.value > 20) {
      return res.status(400).json({ error: 'Weight must be between 0 and 20' });
    }
    weightFilter = weightValidation.value;
  }

  try {
    let data = await getOrRefreshCache();

    // Apply optional filters against the cached dataset.
    if (updatedFilter !== null) {
      // `updated` is likely a Unix timestamp (number) but could be an ISO string.
      // Use numeric comparison when both sides parse as finite numbers; otherwise
      // fall back to lexicographic string comparison (works for ISO date strings).
      const updatedNum = Number(updatedFilter);
      if (!isNaN(updatedNum) && isFinite(updatedNum)) {
        data = data.filter((ball) => Number(ball.updated ?? 0) >= updatedNum);
      } else {
        data = data.filter((ball) => String(ball.updated ?? '') >= updatedFilter);
      }
    }
    if (weightFilter !== null) {
      data = data.filter((ball) => Number(ball.weight) === weightFilter);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error.message);
    // AbortSignal.timeout() throws a DOMException with name 'TimeoutError' in
    // Node 18+ / modern fetch; keep 'AbortError' as fallback for older runtimes.
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: 'Failed to load all balls' });
    }
  }
}

export default withCors(handler);

