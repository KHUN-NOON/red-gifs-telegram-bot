import "reflect-metadata";
import "./configs/di/container.ts";
import express, { type Express } from "express";
import cors from "cors";
import rootRouter from "./routes/index.ts";
import "./configs/env.ts";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rootRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Error handler should be last
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);

    res.status(500).json({
      message: "Internal server error",
    });
  },
);

console.log("🚀 ExpressJs app is bootstrapped and ready!");

export default app;
