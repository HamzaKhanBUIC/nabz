import { createApp } from "./api/app";

const port = Number(process.env.PORT ?? 8787);

createApp().listen(port, "127.0.0.1", () => {
  console.log(`crewpulse backend listening on http://localhost:${port}`);
});
