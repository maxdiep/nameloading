import express from "express";
import cors from "cors";

import uploadRouter from "./routes/upload.js";
import matchRouter from "./routes/match.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/upload", uploadRouter);
app.use("/api/match", matchRouter);

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
