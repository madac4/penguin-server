import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import v1Router from "./api/v1/index";
import { openApiSpec } from "./docs/openapi.spec";

const app = express();

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(","),
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = process.env.API_PREFIX ?? "/api/v1";
app.use(API_PREFIX, v1Router);

// ─── OpenAPI Spec endpoint ────────────────────────────────────────────────────
app.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiSpec);
});

// ─── Scalar API Docs ──────────────────────────────────────────────────────────
app.use(
  "/docs",
  apiReference({
    spec: { url: "/openapi.json" },
    theme: "purple",
    layout: "modern",
    defaultHttpClient: {
      targetKey: "javascript",
      clientKey: "fetch",
    },
    metaData: {
      title: "Penguin CMS — API Reference",
    },
  }),
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

export default app;
