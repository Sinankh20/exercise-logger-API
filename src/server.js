import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./db.js";
import cors from "cors";
import { prisma } from "./db.js";
import { authRouter } from "./routes/authRouter.js";
import routines from "./routes/routines.js";
import history from "./routes/history.js";

import { swaggerDocs } from "../swagger.js";

config();
connectDB();

const app = express();
const port = process.env.PORT || 5001;

app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
      credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

swaggerDocs(app);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Confirms the server is running and can reach the database.
 *     responses:
 *       200:
 *         description: Server and database are up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/routines", routines);
app.use("/api/history", history);

app.use((err, req, res, next) => {
  if (!err.status) console.error(err.message);
  res
    .status(err.status || 500)
    .json({ error: err.status ? err.message : "Server error" });
});

const server = app.listen(port, () =>
  console.log(`API running on port ${port}`)
);

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err.message);
  await disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});