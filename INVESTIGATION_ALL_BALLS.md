# Investigation: All Balls Endpoint No Longer Returns Full Dataset

## Problem

The `/api/all-balls` proxy endpoint calls:

```
GET https://bowwwl.com/restapi/balls/v2?_format=json
```

and expects the upstream API to return a flat JSON array of **all** bowling balls.
The upstream API has changed its behaviour — it now responds with only the **first page** of
results regardless of the `_format=json` query parameter. There is no advertised total page
count, so the number of pages is unknown.

---

## Current Code Behaviour

| File | URL pattern | What it does |
|------|-------------|--------------|
| `api/all-balls.js` | `…/balls/v2?_format=json` | Expects a full array; broken since upstream changed |
| `api/balls-pages.js` | `…/balls/v2?page={N}` | Returns one page at a time; still works |

The paginated endpoint (`balls-pages.js`) is still functional — it returns one page of results
per request. No header or response field currently communicates the total page count.

---

## Workaround Options

### Option 1 — Pagination Loop at Request Time (no cache)

On every call to `/api/all-balls`, loop through `page=0, 1, 2, …` until the upstream API
returns an empty array (or an error / non-array response), then concatenate and return all
results.

**Pros**
- Always returns fresh data.
- No additional infrastructure required (no Redis, no DB).
- Simple to implement.

**Cons**
- **Slow**: Every client request triggers N sequential upstream requests. If there are ~20 pages
  this could take 10–20+ seconds.
- **Fragile**: A transient upstream error mid-loop returns partial data or an error to the
  client.
- **Rate-limit risk**: A burst of concurrent client requests multiplies upstream load by N.
- The current Vercel serverless function has a maximum execution time (default 10 s on Hobby,
  60 s on Pro). A large dataset could time out.

---

### Option 2 — In-Memory Cache with Lazy Pagination Loop (recommended for now)

Run the pagination loop once (or on a TTL expiry) and cache the result in a module-level
variable inside the serverless function.

```
let ballsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchAllBalls() {
  const all = [];
  let page = 0;
  while (true) {
    const res = await fetch(`…/balls/v2?page=${page}`);
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    page++;
  }
  return all;
}
```

**Pros**
- Client requests after the first warm-up return almost instantly.
- Only one upstream burst per TTL window.
- No external dependencies.

**Cons**
- **Cold-start latency**: The very first request (or any request after TTL expiry) is slow.
- **Memory pressure**: Vercel serverless instances are ephemeral and short-lived. Each new
  instance starts cold, so in practice the cache is rarely warm.
- **Stale data**: Balls added/updated between TTL refreshes are not reflected immediately.
- **Concurrent cold-start storms**: Multiple simultaneous first requests can each trigger a
  full upstream loop before any one of them has finished populating the cache (no mutex).

---

### Option 3 — Scheduled Background Cache (e.g. Vercel Cron Job)

A Vercel Cron Job (or any scheduler) runs the pagination loop periodically and stores the full
result in a persistent store (KV store, Redis, database, or even a static file in object
storage such as Vercel Blob / S3).

**Pros**
- Client latency is always fast (reads from cache).
- No cold-start penalty for the end-user.
- Stale data window is bounded and controlled.
- Decouples upstream API instability from end-user experience.

**Cons**
- Requires additional infrastructure (KV store / Blob storage).
- More complex setup and operational overhead.
- Cron interval must be tuned to keep data fresh enough.
- Vercel Cron is available on Pro plan only (Hobby is limited to one cron per day).

---

### Option 4 — Expose Pagination to the Client

Remove the `/api/all-balls` concept entirely and let the client call `/api/balls-pages?page=N`
in a loop, stopping when it receives an empty page.

**Pros**
- No server-side aggregation needed.
- Simpler proxy; less work per request.
- Client controls retry and error handling.

**Cons**
- Breaks the existing `all-balls` contract that consumers depend on.
- Moves complexity to every client that needs all balls.
- Browser clients are subject to CORS preflight overhead on each page request.
- No obvious stopping condition is surfaced to the client unless an empty-array response is
  documented as the sentinel.

---

### Option 5 — Ask the Upstream API Owner for a Bulk Endpoint

Contact the bowwwl.com team and ask them to restore a `?_format=json` (all-results) mode or
to add a `/restapi/balls/v2/count` endpoint that returns the total number of pages/records.

**Pros**
- Clean solution with no workaround code.
- Potentially a `?items_per_page=1000` or `?nopager` parameter exists but is undocumented.

**Cons**
- Depends on a third party acting on the request.
- No guarantee of timeline or delivery.
- Blocking while waiting.

---

## Recommendation

**Short-term**: Implement **Option 2** (in-memory cache with lazy pagination loop). It requires
only a change to `api/all-balls.js`, has no new dependencies, and dramatically improves
response times for warm cache hits. Acknowledge the cold-start risk in code comments and set a
reasonable TTL (e.g. 1 hour).

**Medium-term**: Consider **Option 3** (scheduled background cache) once the dataset size and
freshness requirements are better understood, or if cold-start latency proves to be a real
problem in production.

**Parallel**: Pursue **Option 5** by opening a conversation with the bowwwl.com team to check
whether undocumented bulk-fetch parameters exist.

---

## Open Questions

1. What is the approximate total number of bowling balls in the database?  
   Knowing this helps estimate memory usage and loop iteration count.
2. How frequently are balls added/updated?  
   Determines the acceptable cache TTL.
3. Is the upstream API likely to add a `total_pages` or `X-WP-TotalPages` response header in
   future? Many Drupal/WordPress REST APIs include these.
4. What is the current Vercel plan tier?  
   Affects the serverless execution time limit and Cron availability.
