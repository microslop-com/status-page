# MICROSLOP STATUS — Infrastructure Slop Monitor

> Real-time monitoring of Microsoft infrastructure slop. Track outages, degraded services, and the eternal loading spinner.

## Live Site

**[status.microslop.com](https://status.microslop.com)**

## How It Works

This is a **static site** (Next.js with `output: "export"`) deployed to GitHub Pages via GitHub Actions.

- Pings **8 real Microsoft service endpoints** directly from your browser every 30 seconds
- Measures **round-trip time (RTT)** per service with automatic status classification
- No backend required — all health checks run client-side
- Admin mode via `Ctrl+Shift+A` to manage incidents and override statuses

### Status Thresholds

| RTT | Status | Color |
|-----|--------|-------|
| < 1500ms | NOMINAL | Green |
| 1500–3000ms | DEGRADED | Amber |
| > 3000ms / unreachable | CRASHED | Red |

### Monitored Services

- Microsoft Teams
- Outlook
- Azure Portal
- OneDrive
- Copilot AI
- GitHub
- Windows Update
- Billing Systems (always green — billing never goes down)

## Development

```bash
# Install
bun install

# Dev server
bun dev

# Build static site
bun run build

# Preview build
cd out && bunx serve .
```

## Deployment

This repo uses **GitHub Actions** to build and deploy automatically on every push to `main`.

> **Important**: In your GitHub repo settings under **Settings → Pages → Source**, select **"GitHub Actions"** (not "Deploy from a branch"). The workflow handles building and deploying the static site.

## Tech Stack

- Next.js 16 (static export)
- Tailwind CSS 4
- shadcn/ui
- Framer Motion
- PWA-ready (manifest + service worker)
