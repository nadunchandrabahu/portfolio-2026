import { initBotId } from "botid/client/core";

// Vercel BotID: attaches its invisible challenge to chat requests, which the
// /api/chat route verifies with checkBotId() (CLAUDE.md 8.4, 9). Skipped in
// development.
initBotId({
  protect: [{ path: "/api/chat", method: "POST" }],
});
