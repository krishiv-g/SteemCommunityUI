const CDN_BASE = "https://steemitimages.com/u";

export function getAvatarUrl(username: string): string {
  return `${CDN_BASE}/${username}/avatar`;
}
