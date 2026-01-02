import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded (field name must be 'file')" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are supported" });
    }

    // pdf-parse v2 API
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    await parser.destroy();

    const text = (result?.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    return res.json({ text });
  } catch (err) {
    console.error("PDF upload error:", err);
    return res.status(500).json({
      error: "Failed to parse PDF",
      detail: err?.message || String(err),
    });
  }
});

export default router;
