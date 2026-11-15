import { createApp } from "./api/app";

const port = Number(process.env.PORT ?? 8787);
// Local runs stay on this machine; a hosted API (Render) sets HOST=0.0.0.0.
const host = process.env.HOST ?? "127.0.0.1";

createApp().listen(port, host, () => {
  console.log(`nabz backend listening on http://${host}:${port}`);
});
