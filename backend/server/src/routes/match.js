import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { searchJobs } from "../services/jobs.js";
import { embedText, cosineSimilarity } from "../services/embeddings.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadConnections() {
  const p = path.join(__dirname, "..", "data", "connections.json");
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

function stripHtml(html) {
  return (html ?? "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findConnectionsForCompany(connections, company) {
  const c = (company ?? "").toLowerCase().trim();
  if (!c) return [];
  return connections.filter((x) => (x.company ?? "").toLowerCase().trim() === c);
}

// POST /api/match
// body: { resumeText: string, query?: string, limit?: number }
router.post("/", async (req, res) => {
  try {
    const { resumeText, query, limit } = req.body ?? {};
    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({ error: "resumeText is required (string)." });
    }

    // 1) fetch real jobs
    const jobs = await searchJobs({
      query: query || "software engineer", // fallback
      limit: Number(limit) || 25,
    });

    // 2) embed resume once
    const resumeEmbedding = await embedText(resumeText);

    // 3) embed each job (title+company+location+desc)
    const scored = [];
    for (const job of jobs) {
      const jobText =
        `${job.title}\n${job.company}\n${job.location}\n${job.category}\n\n` +
        stripHtml(job.description).slice(0, 12000);

      const jobEmbedding = await embedText(jobText);
      const score = cosineSimilarity(resumeEmbedding, jobEmbedding);

      scored.push({ ...job, score });
    }

    scored.sort((a, b) => b.score - a.score);

    // 4) attach connections by company
    const connections = await loadConnections();
    const top = scored.slice(0, 10).map((j) => ({
      ...j,
      connections: findConnectionsForCompany(connections, j.company),
    }));

    return res.json({
      queryUsed: query || "software engineer",
      countFetched: jobs.length,
      results: top,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

export default router;
