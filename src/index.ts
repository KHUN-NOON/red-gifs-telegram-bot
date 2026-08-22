import "reflect-metadata";
import app from "./app.ts";
import { env } from "./configs/env.ts";

const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down server...");

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
