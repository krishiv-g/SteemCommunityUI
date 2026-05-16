const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://worldofxpilar.com';
const SITE_TAG = '#WoX';
const SITE_HASHTAG_LINK = `[${SITE_TAG}](${SITE_URL})`;

// Unique marker — strip anything from here to end when reading back
const FOOTER_MARKER = `\n\n---\n> *This content was created on ${SITE_HASHTAG_LINK}`;

/**
 * Returns the standard WoX attribution footer to append to every Steem post body.
 */
export function getPostFooter(): string {
  return `${FOOTER_MARKER} and first appeared on ${SITE_URL} .*`;
}

/**
 * Appends the WoX attribution footer to a post body.
 */
export function withFooter(body: string): string {
  return body.trimEnd() + getPostFooter();
}

/**
 * Strips the WoX attribution footer from a body read back from Steem.
 * Safe to call on any body — no-op if the footer isn't present.
 */
export function stripFooter(body: string): string {
  const idx = body.indexOf(FOOTER_MARKER);
  return idx === -1 ? body : body.slice(0, idx).trimEnd();
}
