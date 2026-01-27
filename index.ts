import express, { Request, Response } from "express";
import { checkDb } from "./lib/db-check";

const app = express();
const PORT = 8080;

// app.use(cors());

app.get("/api/home", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Home API!" });
});

async function start() {
  await checkDb(); // 👈 ensures DB is reachable before starting

  app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
