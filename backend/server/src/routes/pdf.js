import express from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";

const router = express.Router();

// keep file in memory so we can access req.file.buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded (field name must be 'file')." });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are supported." });
    }

    const parser = new PDFParse({ data: req.file.buffer });

    const result = await parser.getText(); // <-- v2 API
    await parser.destroy();

    return res.json({
      ok: true,
      filename: req.file.originalname,
      text: result.text,
      // you can also return result.total, etc if you want
    });
  } catch (err) {
    console.error("PDF upload/parse error:", err);
    return res.status(500).json({
      error: "Failed to parse PDF.",
      detail: err?.message ?? String(err),
    });
  }
});

export default router;
