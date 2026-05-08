# esuna

**A voice-first web app for the visually impaired**

🌐 **[Try it now → esuna.llll-ll.com](https://esuna.llll-ll.com)**

---

esuna lets you enjoy news, radio, podcasts, social media, and more — entirely through voice and a simple 9-grid interface.  
Named after the Final Fantasy recovery spell, esuna is designed so that losing your sight doesn't mean losing your hobbies.

## Features

- **9-grid UI** — Every screen follows the same layout. Position 1 always goes back; position 9 always explains the screen.
- **Full voice readout** — All content is read aloud. No need to look at the screen.
- **Keyboard navigation** — Use number keys 1–9, arrow keys, Enter, and Escape.
- **PWA** — Install to your home screen for offline-ready access.
- **No account required** — Open the URL and start using immediately.

## Supported Content

| Service | Status |
|---|---|
| Hatena Bookmark | ✅ Working |
| Mastodon (public timeline) | ✅ Working |
| Bluesky (What's Hot feed) | ✅ Working |
| RSS news feeds | ✅ Working |
| Aozora Bunko (novels) | ⚠️ Unstable |
| Podcast | ✅ Working |
| NHK Radio (HLS streaming) | ✅ Working |
| 5ch | 🚧 Planned |
| X / Twitter | ❌ API not available |
| radiko | 🚧 Planned |

## How to Use

### Basic Controls

| Key | Action |
|---|---|
| `1`–`9` | Select grid position directly |
| Arrow keys | Move between positions |
| `Enter` | Confirm |
| `Escape` | Stop speech / go back |

### 9-Grid Layout

```
┌───────┬───────────────┬───────┐
│   1   │       2       │   3   │
│  Back │   Previous    │  Next │
├───────┼───────────────┼───────┤
│   4   │       5       │   6   │
│  Info │  Main item    │Action │
├───────┼───────────────┼───────┤
│   7   │       8       │   9   │
│  Sub  │     Stop      │Guide  │
└───────┴───────────────┴───────┘
```

Every screen follows this grid. Once you learn it, navigating any page feels the same.

## For Developers

### Tech Stack

- **Frontend**: Vite + SolidJS + TypeScript + Web Speech API + hls.js
- **Backend**: Hono on Cloudflare Workers + TypeScript

### Local Setup

```bash
git clone https://github.com/kako-jun/esuna.git

# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173

# Backend (separate terminal)
cd backend && npm install && npm run dev
# → http://localhost:8787
```

### Deploy

- **Frontend**: Cloudflare Pages — auto-deploys on push to `main`
- **Backend**: `cd backend && npx wrangler deploy`

## License

MIT — [@kako-jun](https://github.com/kako-jun)
