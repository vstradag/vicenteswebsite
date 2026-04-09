import { Navigate, useParams } from "react-router-dom";
import type { ArtworkSlug } from "../data/artworks";
import { isArtworkSlug } from "../data/artworks";
import "./Artwork.css";

/** Production deploy of the static gaze app (Vercel). */
const DEFAULT_SUPERFICIAL_TENSION_URL = "https://superficial-tension.vercel.app/";

/**
 * Where the iframe loads the piece from.
 * - Set `VITE_SUPERFICIAL_TENSION_URL` to a full URL (with or without trailing slash).
 * - Set to `same-origin` or `local` to use `/superficial-tension/` on this site (run
 *   `scripts/sync-superficial-tension.sh` first so `public/superficial-tension/` exists).
 * - If unset, defaults to the Vercel URL above.
 */
function resolveSuperficialTensionEmbedUrl(): string {
  const raw = import.meta.env.VITE_SUPERFICIAL_TENSION_URL?.trim();
  if (raw === "same-origin" || raw === "local") {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${base}/superficial-tension/`;
  }
  if (raw) {
    return raw.endsWith("/") ? raw : `${raw}/`;
  }
  return DEFAULT_SUPERFICIAL_TENSION_URL;
}

function embedUrlForSlug(slug: ArtworkSlug): string {
  switch (slug) {
    case "super-tension":
      return resolveSuperficialTensionEmbedUrl();
    default:
      return resolveSuperficialTensionEmbedUrl();
  }
}

const ArtworkPiece = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || !isArtworkSlug(slug)) {
    return <Navigate to="/artwork" replace />;
  }

  const embedUrl = embedUrlForSlug(slug);

  return (
    <div className="artwork-piece-full">
      <iframe
        className="artwork-piece-iframe"
        src={embedUrl}
        title="Super tension — interactive gaze"
        allow="fullscreen; autoplay"
      />
    </div>
  );
};

export default ArtworkPiece;
