// Remotive public feed example: https://remotive.com/api/remote-jobs?search=... :contentReference[oaicite:3]{index=3}

export async function searchJobs({ query, limit = 25 } = {}) {
  const q = (query ?? "").trim();

  const url = new URL("https://remotive.com/api/remote-jobs");
  if (q) url.searchParams.set("search", q);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Jobs API failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();

  // Normalize shape
  const jobs = (data?.jobs ?? []).map((j) => ({
    id: j.id,
    url: j.url,
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location,
    category: j.category,
    publishedAt: j.publication_date,
    description: j.description, // HTML string
  }));

  return jobs;
}
