import mammoth from "mammoth";
import path from "path";
import { createRequire } from "module";
import pdf from "pdf-parse";

const require = createRequire(import.meta.url);

export async function extractTextFromUpload(file) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".pdf") {
    const data = await pdfParse(file.buffer);
    return (data.text || "").trim();
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return (result.value || "").trim();
  }

  throw new Error(`Unsupported file type: ${ext}. Please upload PDF or DOCX.`);
}
