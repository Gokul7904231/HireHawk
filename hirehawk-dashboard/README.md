# HireHawk Agentic Recruitment Dashboard

A standalone, responsive, dark-themed React dashboard demonstrating real-time recruiter agent executions, candidate profile configurations, and claims adjudication validation.

## Architecture

The dashboard serves as the user interface of the HireHawk system, communicating with:
1. **Cloudflare Worker / Supabase Tracker**: Queries application status lists, updates pipelines, and retrieves database statistics.
2. **FastAPI LangGraph Agent Backend**: Receives job descriptions, streams live multi-agent execution steps over Server-Sent Events (SSE), and captures candidate manual breakpoint decisions (Human-in-the-Loop).

---

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styles**: Tailwind CSS
- **Data Query**: TanStack React Query (v5)
- **Charts / Visuals**: Custom SVG Radial Gauges and matching progress indicators
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + JSDOM

---

## Folder Structure

```
hirehawk-dashboard/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── vercel.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   ├── tracker.ts        # worker & FastAPI HTTP clients
│   │   └── stream.ts         # SSE streaming client
│   ├── components/
│   │   ├── Sidebar.tsx       # navigation & status checks
│   │   ├── MetricCards.tsx   # stats counters
│   │   ├── AppTable.tsx      # application table
│   │   ├── AgentPanel.tsx    # streaming agent console
│   │   ├── FitScoreBar.tsx   # visual fit score circle gauge
│   │   ├── ClaimsTrace.tsx   # claims trace viewer
│   │   └── CompanyIntel.tsx  # company metadata card
│   ├── hooks/
│   │   ├── useTracker.ts     # query hooks for API endpoints
│   │   └── useAgentStream.ts # hook for managing agent streams
│   ├── types/
│   │   └── index.ts          # shared TS interfaces
│   └── styles/
│       └── index.css         # tailwind directives
└── tests/
    ├── setup.ts              # test environment configuration
    ├── MetricCards.test.tsx
    ├── AppTable.test.tsx
    └── AgentPanel.test.tsx
```

---

## Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
cd hirehawk-dashboard
npm install
```

### 2. Environment Configuration
Create a `.env` file matching the template:
```env
VITE_MOCK=true
VITE_WORKER_URL=http://localhost:8787
VITE_FASTAPI_URL=http://localhost:8000
```
- **`VITE_MOCK=true`**: Bypasses any local backend dependencies. All statistics, application listings, details, settings, and agent step stream sequences are fully functional mock generators inside the frontend client. Excellent for demonstration and offline development.
- **`VITE_MOCK=false`**: Contacts the active local Cloudflare Worker and FastAPI server directly.

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Running Unit Tests
```bash
npm run test
```
All tests run in mock mode and assert sorting, query filtering, and asynchronous streaming.
