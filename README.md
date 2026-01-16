# 🔥 Trend-to-Idea Agent

An end-to-end AI agent that discovers trending topics through web research and generates platform-specific content ideas—all with real-time streaming, human-in-the-loop approval, and LangGraph orchestration.

## ✨ Features

- **LangGraph Orchestration**: State machine workflow with conditional routing
- **Convex Backend**: Real-time persistence and event streaming
- **Web Research**: Up-to-date trend discovery via **DuckDuckGo (FREE - no API key!)**
- **HITL Checkpoint**: System stops after research for explicit user approval
- **Streaming UX**: 
  - Main chat streams research progress and findings
  - Sidebar streams content ideas separately
- **Transparent Steps**: Visual progress indicator showing current workflow stage
- **Refine & Restart**: Adjust constraints or start over without losing context

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Next.js UI                          │
│  ┌──────────────────┐              ┌──────────────────────┐ │
│  │   ChatPanel      │              │   IdeaSidebar        │ │
│  │  (surface=main)  │              │  (surface=sidebar)   │ │
│  └──────────────────┘              └──────────────────────┘ │
│           ↑                                   ↑              │
│           │ Real-time subscriptions           │              │
│           └───────────────┬───────────────────┘              │
└───────────────────────────┼──────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Convex DB     │
                    │  - runs table  │
                    │  - events table│
                    └───────▲────────┘
                            │
                    ┌───────┴────────┐
                    │  Orchestrator  │
                    │  (Convex Action│
                    └───────▲────────┘
                            │
                    ┌───────┴────────┐
                    │   LangGraph    │
                    │   Workflow     │
                    └────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌──────▼──────┐    ┌──────▼──────┐
   │DuckDuckGo│      │   Gemini    │    │  Convex     │
   │ (FREE!)  │      │  Synthesis  │    │  Events     │
   └──────────┘      └─────────────┘    └─────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Gemini API key (already configured in `.env.local`)
- **No other API keys needed!** (Web research uses free DuckDuckGo)

## 🚀 Setup

### 1. Install Dependencies

```bash
cd trend-to-idea-agent
npm install
```

### 2. Set Up Convex

Start Convex development server (this will generate the `_generated` files):

```bash
npx convex dev
```

Follow the prompts:
- Choose "Start without an account (run Convex locally)" for local development
- Or login to deploy to Convex cloud

This will:
- Create `convex/_generated/` directory
- Populate `.env.local` with `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`

### 3. Run the Application

The `.env.local` file already has Gemini configured. Convex URLs will be auto-populated when you run `npx convex dev`.

In a separate terminal (keep `npx convex dev` running):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

1. **Enter a Query**: Type what trends you're interested in (e.g., "AI developments this week")

2. **Watch Research**: The system will:
   - Plan research strategy
   - Search for trending topics
   - Stream findings in real-time
   - Synthesize a report with top 5-10 trends

3. **HITL Checkpoint**: Review the research report and choose:
   - **Approve**: Generate content ideas
   - **Refine**: Adjust timeframe/region/keywords and re-search
   - **Restart**: Start over from scratch

4. **View Ideas**: After approval, platform-specific content ideas stream into the sidebar

## 🔄 Workflow Steps

```
Planning → Researching → Report Ready → Awaiting Approval → Generating Ideas → Done
```

Each step is visualized in the UI with icons and progress indicators.

## 📊 Data Model

### Runs Table
```typescript
{
  status: "idle" | "planning" | "researching" | "report_ready" | "awaiting_approval" | "ideating" | "done" | "error",
  userQuery: string,
  constraints: {
    timeframe?: "24h" | "7d" | "30d",
    region?: "Global" | "US" | "Europe" | "Asia" | "Latin America",
    include?: string[],
    exclude?: string[]
  },
  researchReport?: {
    trends: Array<{
      title: string,
      description: string,
      confidence: number,
      sources: Array<{
        url: string,
        title: string,
        snippet: string,
        publishedDate?: string
      }>
    }>,
    generatedAt: string
  },
  approval?: "approved" | "refine" | "restart" | null,
  refinement?: string,
  createdAt: number,
  approvedAt?: number
}
```

### Events Table
```typescript
{
  runId: Id<"runs">,
  ts: number,
  surface: "main" | "sidebar",
  type: "status" | "log" | "finding" | "report" | "error" | "idea",
  payload: any
}
```

## 🧩 Key Components

- **`lib/langgraph/graph.ts`**: LangGraph workflow definition
- **`lib/langgraph/nodes.ts`**: All graph nodes (planResearch, fetchTrends, etc.)
- **`convex/orchestrator.ts`**: Convex action that runs the graph
- **`components/ChatPanel.tsx`**: Main chat UI (subscribes to surface=main)
- **`components/IdeaSidebar.tsx`**: Ideas panel (subscribes to surface=sidebar)
- **`components/ApprovalControls.tsx`**: HITL approval buttons
- **`components/StepIndicator.tsx`**: Visual workflow progress

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Convex (real-time database + actions)
- **Orchestration**: LangGraph (TypeScript)
- **LLM**: Google Gemini 2.0 Flash
- **Research**: DuckDuckGo (free, no API key!)

## 🔧 Development

### Project Structure

```
trend-to-idea-agent/
├── app/
│   ├── page.tsx              # Main UI
│   ├── layout.tsx            # Root layout with ConvexProvider
│   └── ConvexProvider.tsx    # Convex client wrapper
├── components/
│   ├── ChatPanel.tsx         # Main chat (surface=main)
│   ├── IdeaSidebar.tsx       # Ideas panel (surface=sidebar)
│   ├── ApprovalControls.tsx  # HITL buttons
│   └── StepIndicator.tsx     # Progress visualization
├── lib/
│   ├── langgraph/
│   │   ├── state.ts          # State interface
│   │   │   ├── nodes.ts          # Graph nodes
│   │   └── graph.ts          # Graph definition
│   └── research/
│       └── search.ts         # DuckDuckGo search client
├── convex/
│   ├── schema.ts             # Database schema
│   ├── runs.ts               # Runs mutations/queries
│   ├── events.ts             # Events mutations/queries
│   └── orchestrator.ts       # LangGraph orchestrator action
└── .env.local                # Environment variables
```

### Adding New Platforms

Edit `lib/langgraph/nodes.ts` → `spawnIdeaAgent` → update the `platforms` array:

```typescript
const platforms = ["Twitter", "LinkedIn", "Blog Post", "YouTube", "Instagram", "TikTok", "YourPlatform"];
```

### Customizing Research

Edit `lib/langgraph/nodes.ts` → `fetchTrends` to adjust:
- Number of results per query
- Search depth
- Result filtering logic

## 🐛 Troubleshooting

### "Cannot find module '_generated'" errors

Run `npx convex dev` to generate Convex types.

### Research returns no results

- Check `TAVILY_API_KEY` is set correctly
- Verify API key has credits
- Try a broader query

### Ideas not generating

- Ensure you clicked "Approve" after the research report
- Check browser console for errors
- Verify `GOOGLE_API_KEY` is valid

### Real-time updates not working

- Ensure `NEXT_PUBLIC_CONVEX_URL` is set
- Check Convex dev server is running
- Refresh the page

## 📝 Tradeoffs & Design Decisions

1. **Tavily vs MCP Server**: Using Tavily for simplicity and fresh results. Can swap for custom MCP server if needed.

2. **Orchestrator in Convex Action**: Keeps logic server-side. Alternative: run in Next.js API route.

3. **Streaming via Events Table**: Simple but creates many DB writes. Alternative: WebSocket for ephemeral events.

4. **No Auth**: Minimal scope. Add Clerk/Auth0 for production.

5. **No History UI**: Focusing on single-run UX. Can add run list later.

6. **LangGraph TypeScript**: Using `@langchain/langgraph` for type safety. Python version would have more examples.

## 🚢 Deployment

### Deploy to Convex Cloud

```bash
npx convex deploy
```

Update `.env.local` with production URLs.

### Deploy to Vercel

```bash
vercel deploy
```

Add environment variables in Vercel dashboard.

## 📄 License

MIT

## 🤝 Contributing

This is a reference implementation. Feel free to fork and customize!

---

**Built with ❤️ using LangGraph, Convex, and Gemini**
