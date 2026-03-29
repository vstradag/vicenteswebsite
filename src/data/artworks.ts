/** Registered pieces for /artwork/:slug (titles and routing only). */
export const ARTWORK_SLUGS = ["super-tension"] as const;

export type ArtworkSlug = (typeof ARTWORK_SLUGS)[number];

export function isArtworkSlug(s: string): s is ArtworkSlug {
  return (ARTWORK_SLUGS as readonly string[]).includes(s);
}

export function getArtworkTitle(slug: ArtworkSlug): string {
  switch (slug) {
    case "super-tension":
      return "Super tension";
    default:
      return slug;
  }
}
