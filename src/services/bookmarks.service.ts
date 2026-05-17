export interface Bookmark {
  id: string;
  username: string;
  author: string;
  permlink: string;
  title: string;
  cover_image: string;
  created_at: string;
}

export async function fetchBookmarks(username: string): Promise<Bookmark[]> {
  const res = await fetch(`/api/bookmarks?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error("Failed to fetch bookmarks");
  return res.json();
}

export async function addBookmark(data: {
  username: string;
  author: string;
  permlink: string;
  title: string;
  cover_image?: string;
}): Promise<Bookmark> {
  const res = await fetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add bookmark");
  return res.json();
}

export async function removeBookmark(id: string): Promise<void> {
  const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove bookmark");
}

export async function isBookmarked(
  username: string,
  author: string,
  permlink: string
): Promise<Bookmark | null> {
  const all = await fetchBookmarks(username);
  return all.find((b) => b.author === author && b.permlink === permlink) ?? null;
}
