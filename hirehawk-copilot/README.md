# HireHawk Copilot Setup & Development Guide

This directory contains the source code for the **HireHawk Copilot** system.

```
hirehawk-copilot/
├── extension/    # WXT Chrome MV3 Extension (React + TS)
└── worker/       # Cloudflare Worker Backend (Router + API integrations)
```

---

## 1. Prerequisites

- **Node.js**: v18+ (v22 recommended)
- **NPM** or **Yarn**

---

## 2. Cloudflare Worker Setup (`worker/`)

### Installation
```bash
cd worker
npm install
```

### Environment Configurations
Create a `.dev.vars` file in `worker/` for local live execution:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_or_service_key_here
GEMINI_MOCK=false
SUPABASE_MOCK=false
```

### Run Locally
Start the Wrangler dev server on port `8787` (expected by the extension client):
```bash
npm run dev
```

### Run Unit Tests
```bash
npm run test
```

---

## 3. Chrome Extension Setup (`extension/`)

### Installation
```bash
cd extension
npm install
```

### Build & Run Locally
To compile the WXT build package and watch for popup/content script changes:
```bash
npm run dev
```
This will compile the extension bundles into `extension/.output/chrome-mv3`.

### Loading the Extension in Chrome
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Toggle the **Developer mode** switch in the top-right corner.
4. Click **Load unpacked** in the top-left.
5. Select the `hirehawk-copilot/extension/.output/chrome-mv3` folder.

### Run Unit Tests
```bash
npm run test
```

### Run Playwright E2E Tests
To run Playwright browser tests:
```bash
npx playwright test
```
*(Note: WXT must be built into `.output/chrome-mv3` before running E2E tests).*
