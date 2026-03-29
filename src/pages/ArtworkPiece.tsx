import { Navigate, useParams } from "react-router-dom";
import type { ArtworkSlug } from "../data/artworks";
import { isArtworkSlug } from "../data/artworks";
import "./Artwork.css";

const DEFAULT_SUPERFICIAL_TENSION_URL = "https://superficial-tension.vercel.app/";

function embedUrlForSlug(slug: ArtworkSlug): string {
  const base =
    import.meta.env.VITE_SUPERFICIAL_TENSION_URL?.trim() ||
    DEFAULT_SUPERFICIAL_TENSION_URL;
  const normalized = base.endsWith("/") ? base : `${base}/`;
  switch (slug) {
    case "super-tension":
      return normalized;
    default:
      return normalized;
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
