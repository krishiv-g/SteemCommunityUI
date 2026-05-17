export interface Draft {
  id: string;
  username: string;
  title: string;
  body: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export async function fetchDrafts(username: string): Promise<Draft[]> {
  const res = await fetch(`/api/drafts?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error("Failed to fetch drafts");
  return res.json();
}

export async function createDraft(data: {
  username: string;
  title?: string;
  body?: string;
  tags?: string[];
}): Promise<Draft> {
  const res = await fetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create draft");
  return res.json();
}

export async function updateDraft(
  id: string,
  data: { title?: string; body?: string; tags?: string[] }
): Promise<Draft> {
  const res = await fetch(`/api/drafts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update draft");
  return res.json();
}

export async function deleteDraft(id: string): Promise<void> {
  const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete draft");
}
