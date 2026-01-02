import { useMemo, useState } from "react";

export default function App() {
  const [file, setFile] = useState(null);

  const [resumeText, setResumeText] = useState("");
  const [uploading, setUploading] = useState(false);

  const [jobQuery, setJobQuery] = useState("software engineer");
  const [searching, setSearching] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  const canSearch = useMemo(() => resumeText.trim().length > 0, [resumeText]);

  async function uploadPdf() {
    setError("");
    setJobs([]);

    if (!file) {
      setError("Pick a PDF first.");
      return;
    }

    try {
      setUploading(true);

      const form = new FormData();
      form.append("file", file);

      const resp = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data?.error || `Upload failed (${resp.status})`);
      }

      // Expect backend returns { text: "..." } (adjust if your field name differs)
      const text = data?.text || data?.resumeText || "";
      if (!text) throw new Error("Upload succeeded but no text returned.");

      setResumeText(text);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setUploading(false);
    }
  }

  async function findJobs() {
    setError("");
    setJobs([]);

    if (!canSearch) {
      setError("Upload a resume first (so I have resume text to match).");
      return;
    }

    try {
      setSearching(true);

      const resp = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          query: jobQuery,
          limit: 25,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error || `Match failed (${resp.status})`);
      }

      setJobs(data?.results || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>Resume → Job Matches</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Upload your resume PDF, then find matching real job openings ranked by embedding similarity.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={uploadPdf} disabled={uploading || !file}>
          {uploading ? "Uploading..." : "Upload + Parse PDF"}
        </button>
      </div>

      {resumeText ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600 }}>Parsed resume text (preview)</div>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              maxHeight: 160,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              background: "#fafafa",
            }}
          >
            {resumeText.slice(0, 1200)}
            {resumeText.length > 1200 ? "\n\n…(truncated)" : ""}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={jobQuery}
          onChange={(e) => setJobQuery(e.target.value)}
          placeholder="Search query (e.g., data analyst, product manager)"
          style={{ padding: 8, minWidth: 320 }}
        />
        <button onClick={findJobs} disabled={searching || !canSearch}>
          {searching ? "Searching..." : "Find matching jobs"}
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#ffecec", color: "#7a0000" }}>
          {error}
        </div>
      ) : null}

      {jobs?.length ? (
        <div style={{ marginTop: 22 }}>
          <h2 style={{ marginBottom: 10 }}>Top matches</h2>

          <div style={{ display: "grid", gap: 12 }}>
            {jobs.map((j) => (
              <div key={j.id} style={{ padding: 14, border: "1px solid #ddd", borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{j.title}</div>
                    <div style={{ color: "#444" }}>
                      {j.company} • {j.location || "Location not listed"} • {j.category || "Uncategorized"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>
                      Score: {(j.score ?? 0).toFixed(3)}
                    </div>
                    {j.publishedAt ? <div style={{ color: "#666", fontSize: 12 }}>{j.publishedAt}</div> : null}
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <a href={j.url} target="_blank" rel="noreferrer">
                    View job posting
                  </a>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Possible connections</div>
                  {j.connections?.length ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {j.connections.map((c, idx) => (
                        <li key={idx}>
                          <span style={{ fontWeight: 600 }}>{c.name}</span> — {c.title} ({c.relationship})
                          {c.profileUrl ? (
                            <>
                              {" "}
                              •{" "}
                              <a href={c.profileUrl} target="_blank" rel="noreferrer">
                                profile
                              </a>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: "#666" }}>No saved connections for this company (yet).</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
