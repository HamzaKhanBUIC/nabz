# T1: Our own test page

Feature F11. Owner: `core-builder`. Code: `tools/console/` (served at `/dev`).

## What it is

A plain page for us to test the backend by hand in a browser. It is not the product's interface and carries no design work. The frontend developer gets the contract, not this page; she may read its tap-timing code as a reference.

## Rules

- One `index.html`, one `console.js`, one small stylesheet. No framework, no build step, no CDN.
- It calls only the public API in `docs/api-contract.md`. If the page needs something the API doesn't give, the API is missing it; fix the contract, don't work around it.
- Served only when `NODE_ENV` is not `production`.
- Dark background, text at 16 px or more, every status shown as label + icon name, never colour alone.

## Sections

| Section | Uses | Shows |
|---|---|---|
| Today | `GET /api/mission`, `GET /api/today` | Mission day, delay to Earth, current card |
| Tap test | `GET /api/checkin/protocol`, `POST /api/checkins` | The 3-minute test; then metrics, zone, card, raw JSON |
| Send a sample day | `POST /api/checkins` with a file from `contract/examples/` | Same result without tapping for 3 minutes |
| Trend | `GET /api/trends` | Points and band as a simple inline SVG, plus a table |
| Blood pressure | guide + `POST /api/measurements/bp` | Steps with timers, symptom ticks, result, next action |
| Emergency | `GET /api/emergency/procedures` | The five procedures, step by step |
| Reset | deletes nothing itself | Tells us to delete `data/runtime/` to start clean |

## Tap timing (the part worth copying)

- Schedule the target a little early, then show it inside `requestAnimationFrame` and record that frame's timestamp as onset.
- Read `event.timeStamp` on `pointerdown` and on `keydown` for Space. `rtMs = Math.round(event.timeStamp − onset)`.
- A press before onset is logged as `{early: true, rtMs: null}`. No press before the timeout is logged as `{early: false, rtMs: null}`. Every trial is logged.

## Verify

Manual: complete a tap test at `/dev`; screenshot showing the zone and the card. Send the day-120 sample; the card is `reaction-slow-short-sleep`.
