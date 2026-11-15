# Hosting Nabz (free)

The API runs on Render (free web service), and the site on Vercel (Hobby). The browser only talks to
the Vercel site; Vercel forwards `/api/*` to Render, so there is no CORS setup and the sign-in token
stays on one origin. Both deploy from `main` on GitHub.

## 1. API on Render

New > Web Service > connect the GitHub repo.

| Setting | Value |
|---|---|
| Branch | `main` |
| Root directory | (empty) |
| Language | Node |
| Build command | `npm ci` |
| Start command | `npm start` |
| Instance type | Free |
| Health check path | `/api/health` |
| Environment | `HOST=0.0.0.0`, `NODE_VERSION=24` |

Render sets `PORT` itself. Check: `https://<service>.onrender.com/api/health` returns `{"ok":true}`.

Free-plan limits: the service sleeps after 15 minutes without requests (about a minute to wake), and
crew data added through the app resets on every restart or deploy (the seeded fixtures stay).

## 2. Site on Vercel

Add New > Project > import the same repo.

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework | Next.js (detected) |
| Environment | `API_PROXY_TARGET=https://<service>.onrender.com`, `NEXT_PUBLIC_DEMO=1` |

Leave `NEXT_PUBLIC_API_URL` unset: with `API_PROXY_TARGET` set, the build uses same-origin `/api`.
Environment changes need a redeploy to take effect.

## 3. Keep the API awake

Add a free UptimeRobot HTTP(s) monitor on `https://<service>.onrender.com/api/health`, every 5 minutes.
One always-on service uses about 744 of Render's 750 free hours a month. If the monitor stops, the
first visit after a quiet spell waits for the API to wake.

## Other hosts

`huggingface/` holds a single-container Docker setup (API and site in one container). Hugging Face
now needs a PRO plan for Docker Spaces; the same Dockerfile also runs on any Docker host (for example
an Oracle VM).
