const CDN_BASE = "https://extcnd.blazedit.xyz/steemit/u";

export function getAvatarUrl(username: string): string {
  return `${CDN_BASE}/${username}/avatar`;
}
