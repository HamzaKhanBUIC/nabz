import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/api/app";

describe("server skeleton", () => {
  const app = createApp();

  it("answers the health check", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("answers an unknown route with the contract's error shape", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
    expect(typeof res.body.error.message).toBe("string");
  });

  it("answers a malformed JSON body with 400 invalid_input", async () => {
    const res = await request(app).post("/api/health").set("Content-Type", "application/json").send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("allows a browser page on localhost and refuses other origins", async () => {
    const local = await request(app).get("/api/health").set("Origin", "http://localhost:5173");
    expect(local.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    const other = await request(app).get("/api/health").set("Origin", "https://example.com");
    expect(other.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
