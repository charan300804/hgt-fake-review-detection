# Consolidated Codebase Audit Report: HGT Fraud Detection System

This document consolidates the findings of specialized automated and manual audits of the codebase, covering both the **Next.js Frontend / API Layer** and the **FastAPI Python ML Service**.

---

## 📊 Executive Summary
*   **Overall Code Quality**: **Medium-Low**
    *   *Frontend*: Good layout animation and database connection caching, but suffers from Next.js routing bypasses (rendering subpages inside an SPA state shell) which crashes direct route entry.
    *   *Backend*: Features modular graph validators and memory-caching helpers, but contains severe blocking operations in async endpoints and GNN design flaws.
*   **Overall Security Risk**: **High (Action Required)**
    *   *Critical Vulnerabilities*: A severe Server-Side Request Forgery (SSRF) / Open Proxy vulnerability in the `Caddyfile` and `app/api/predict/route.ts` via the unsanitized `XTransformPort` parameter.
    *   *Information Disclosure*: Raw database errors and catch exception stack traces are returned directly to client HTTP responses on multiple routes.
*   **Performance Risk**: **High**
    *   *Event Loop Blockage*: Synchronous, CPU-heavy PyTorch inference and NLP regex preprocessing run inside `async def` FastAPI routes, blocking concurrent connections.
    *   *Database Overhead*: Lack of compound/unique indexes on key MongoDB search queries, coupled with constant connection creations (disabling PyMongo pooling), adds substantial network latency.

---

## 🔒 1. Security & Vulnerability Analysis

### 🔴 CRITICAL: SSRF / Port Scanning via Caddy & Next.js Proxy
*   **Files**: [Caddyfile](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/Caddyfile) & [src/app/api/predict/route.ts](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/src/app/api/predict/route.ts)
*   **Vulnerability**: The Caddy configuration dynamically reverse-proxies requests using a query parameter `XTransformPort`:
    ```caddy
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort}
    }
    ```
    Similarly, Next.js's backend proxy endpoint directly uses `XTransformPort` to send local HTTP fetches without validation:
    ```typescript
    const port = searchParams.get('XTransformPort') || ML_SERVICE_PORT;
    const response = await fetch(`http://localhost:${port}${endpoint}${path}`);
    ```
*   **Impact**: External attackers can scan internal ports on the server (e.g. MongoDB on port 27017, SSH on port 22, etc.) or proxy requests to private administrative routes, completely bypassing firewalls.
*   **Remedy**:
    1.  Hardcode the proxy target ports or load them from environment variables.
    2.  Remove all support for `XTransformPort` query params from public endpoints.

### 🔴 CRITICAL: Non-Portable Hardcoded Windows Paths & User Leakage
*   **Files**: [mongo_seed.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mongo_seed.py#L13) & [fast_seed.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/fast_seed.py#L6)
*   **Vulnerability**: Database seed scripts hardcode the absolute path:
    ```python
    base_dir = r"c:\Users\SHIVA CHARAN\OneDrive\Desktop\Karunakar\project"
    ```
*   **Impact**: Breaks script execution on any machine besides the original developer's, and leaks internal OS user names.
*   **Remedy**: Resolve paths dynamically using `os.path.dirname(os.path.abspath(__file__))`.

### ⚠️ WARNING: Insecure CORS Configuration
*   **File**: [mini-services/ml-service/index.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mini-services/ml-service/index.py)
*   **Vulnerability**: FastAPI uses `allow_origins=["*"]`.
*   **Remedy**: Limit allowed origins using a dedicated configuration or environment variable.

### ⚠️ WARNING: Information Disclosure (Raw Exceptions in Responses)
*   **Files**: Multiple Next.js API endpoints (`src/app/api/reviews/route.ts`, `src/app/api/users/route.ts`) and FastAPI endpoints.
*   **Vulnerability**: Code block returns `error.message` or `str(e)` directly to public HTTP responses in try-catch structures.
*   **Impact**: Exposes database structures, field types, and connection details.
*   **Remedy**: Log traceback internally and return generic error messages (e.g., `"Internal Server Error"`).

---

## ⚡ 2. Performance & Database Analysis

### 🔴 CRITICAL: CPU-Bound Processing Blocking Event Loop
*   **File**: [mini-services/ml-service/index.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mini-services/ml-service/index.py)
*   **Issue**: FastAPI prediction routes (`/predict` and `/predict/batch`) are declared as `async def` but run CPU-heavy preprocessing (regex/NLTK tokenization), TF-IDF projections, and forward passes through the PyTorch HGT model. Since Python has a Global Interpreter Lock (GIL), synchronous CPU-bound operations inside async functions lock the event loop, rendering the server unable to handle other HTTP requests.
*   **Remedy**: Declare these routes as standard synchronous `def` (allowing FastAPI to run them in a separate thread pool) or use `asyncio.to_thread`.

### 🔴 CRITICAL: In-Process GNN Model Training
*   **File**: [mini-services/ml-service/index.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mini-services/ml-service/index.py#L501)
*   **Issue**: Running PyTorch training loops inside a FastAPI background task will consume all CPU/RAM resources, leading to severe latency spikes for web clients or Out-Of-Memory (OOM) crashes.
*   **Remedy**: Offload model training to a separate worker script or task worker queue (e.g., Celery).

### ⚠️ WARNING: Missing Database Indexes (MongoDB)
*   **Files**: [mongo_seed.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mongo_seed.py) & [mini-services/ml-service/index.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mini-services/ml-service/index.py)
*   **Issue**: The seed script uploads 40K records but creates no indexes. The prediction endpoint searches by `review_id` and compound user/product keys. Without indexes, MongoDB performs collection scans (COLLSCAN) for every query.
*   **Remedy**: Add indexes on `review_id` (unique) and compound indexes on `(user_id, product_id)` during seeding.

### ⚠️ WARNING: Disabling Connection Pooling
*   **File**: [mini-services/ml-service/index.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mini-services/ml-service/index.py)
*   **Issue**: Methods create a new `MongoClient` connection on every fetch and call `client.close()`. This disables PyMongo's built-in connection pooler and creates significant connection handshake latency.
*   **Remedy**: Initialize `MongoClient` once globally at startup and reuse it.

---

## 🛠️ 3. Software Architecture & Code Quality

### ⚠️ WARNING: SPA Shell Routing Anti-Pattern & Client Crashes
*   **File**: [src/app/page.tsx](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/src/app/page.tsx)
*   **Issue**: Bypasses Next.js routing by using state-based page switching (`currentPage`), yet exposes separate pages as public routes (`/about`, `/dashboard`). Accessing these routes directly (e.g. `/about`) and clicking navigation buttons throws a runtime `TypeError` because the `onNavigate` handler is missing.
*   **Remedy**: Migrate to the standard Next.js App Router navigation or restructure subpages into dedicated components rather than standalone app routes.

### ⚠️ WARNING: GNN Relation Conflation in HGT Conv
*   **File**: [mini-services/ml-service/hgt_model.py](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mini-services/ml-service/hgt_model.py)
*   **Issue**: Projections in `HGTConv` use keys based only on source and destination node types: `f"{src_type}__{dst_type}"`, omitting the relationship type (`rel_type`). If multiple edge types exist between node types (e.g., `writes` vs `likes`), they will share the exact same weights. Also, relation-specific attention matrices ($W^{ATT}_{rel}$) are omitted.
*   **Remedy**: Update keys to include `rel_type` (e.g., `f"{src_type}__{rel_type}__{dst_type}"`) and implement proper HGT attention weights.

### ⚠️ WARNING: Bypassed Code Safety & Unpinned Packages
*   **Files**: [eslint.config.mjs](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/eslint.config.mjs), [tsconfig.json](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/tsconfig.json), [requirements.txt](file:///c:/Users/SHIVA%20CHARAN/OneDrive/Desktop/Karunakar/project/mini-services/ml-service/requirements.txt)
*   **Issue**:
    *   TypeScript features `"noImplicitAny": false` and Next.js has `ignoreBuildErrors: true` enabled.
    *   ESLint has rules deactivated (e.g., `@typescript-eslint/no-explicit-any`).
    *   Python's `torch-geometric` package is not version-pinned, leading to environment installation failures due to compiled C++ library dependencies.
*   **Remedy**: Pin python dependency versions, re-enable standard code safety lints, and remove build-error bypasses.

---

## 📋 4. Action Plan Summary

1.  **Security Hotfix**: hardcode or use environment variables for `ML_SERVICE_PORT`, remove `XTransformPort` parameters, and sanitize error disclosures.
2.  **Performance Fix**: Use relative paths in python scripts, use synchronous `def` in FastAPI prediction controllers to execute in thread pools, and initialize MongoDB client once globally.
3.  **Database Fix**: Define unique indexes on `review_id` and compound indexes on `(user_id, product_id)`.
4.  **Routing Fix**: Move SPA route pages into a component directory (e.g., `src/components/views/*`) to prevent routing crashes, or refactor to standard Next.js `<Link>` routing.
5.  **GNN Fix**: Add `rel_type` into key names in `hgt_model.py` to correctly compute HGT type-specific parameters.
