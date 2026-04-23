/**
 * Quick Socket.io smoke test (same handshake as the Android app).
 *
 * 1) Backend must be running: `npm run dev`
 * 2) Paste a valid API key into `apiKey` below
 * 3) Run: `node test-socket.js`
 */
import { io } from "socket.io-client";

const url = "https://simapi-tzyo.onrender.com";
const apiKey = "sim_live_ac45118c8e9b46714145bf9b62f85c453a45110afcd66354";

console.log("[test-socket] Starting…");
console.log("[test-socket] Target:", url);

if (!apiKey || apiKey.length < 20) {
  console.error("[test-socket] Missing hardcoded apiKey in test-socket.js");
  process.exit(1);
}

const socket = io(url, {
  auth: {
    // Must match server: registerSocket.ts reads `handshake.auth.apiKey`
    apiKey,
  },
  // Allow polling + websocket — websocket-only can fail on some Windows / proxy setups.
  transports: ["websocket", "polling"],
  reconnection: false,
  timeout: 15_000,
});

socket.on("connect", () => {
  console.log("[test-socket] Connected. socket.id =", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("[test-socket] connect_error:", err.message);
  if (err.description) {
    console.error("[test-socket] details:", err.description);
  }
  process.exitCode = 1;
});

socket.on("disconnect", (reason) => {
  console.log("[test-socket] disconnect:", reason);
});

socket.on("send_message", (payload) => {
  console.log("[test-socket] send_message event:", payload);
});
