import "reflect-metadata";
import "tsyringe";
import app from "./app.ts";
import { env } from "./configs/env.ts";
import "./configs/di/container.ts";

// Only listen locally (Vercel sets process.env.VERCEL = "1" or process.env.NODE_ENV = "production")
if (!process.env.VERCEL) {
  const PORT = env.port || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = () => {
    console.log("Shutting down server...");
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Export the app instance so Vercel can run it as a serverless handler
export default app;
