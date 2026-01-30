# ATiQ: The Self-Healing, Local-First AI IDE

> **"I built a self-repairing AI IDE that runs entirely in the browser."**

ATiQ is a privacy-first, local-only alternative to tools like Bolt.new. Build, debug, and ship with an AI pair who fixes its own mistakes—without your code or keys ever leaving the browser.

- **BYOK-first**: Users bring their own Anthropic key. No SaaS lock-in, no recurring bill.
- **Local-only trust**: Runs in WebContainers; nothing leaves your machine.
- **Production polish**: Prepped for Vercel with COOP/COEP headers for SharedArrayBuffer.

## ✨ Features

- **Streaming Vibe**: Real-time XML parsing for instant feedback.
- **Anti-Crash**: Automated Runtime Repair & Circuit Breaker to keep your dev session alive.
- **Privacy-First**: 100% Local. Your code never leaves your browser.
- **BYOK (Bring Your Own Key)**: Use your own Anthropic API key. No subscriptions, no hidden fees.
- **Persistent**: Auto-save & ZIP Export support.

## 🚀 Getting Started

1. Clone the repository.
2. Install dependencies: `pnpm install`
3. Run the development server: `pnpm dev`
4. Open `http://localhost:3000`
5. When prompted, paste your Anthropic API key (stored locally in the browser).

## 🔑 BYOK (Bring Your Own Key)

- The key never leaves your browser—stored in `localStorage` under `anthropic-api-key`.
- Accepts keys starting with `sk-` (Anthropic).
- You can clear/replace it anytime via the key modal.

## ☁️ Deploy to Vercel

The repo includes `vercel.json` with the required COOP/COEP headers to enable WebContainers and `SharedArrayBuffer` in production. Deploy normally with Vercel and the runtime will remain local-first.

## 🛠️ Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude Sonnet 3.5 (via direct API)
- **Runtime**: WebContainers (Node.js in the browser)

## license

MIT
