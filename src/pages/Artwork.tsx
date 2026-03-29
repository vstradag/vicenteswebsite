import { Link } from "react-router-dom";
import { ARTWORK_SLUGS, getArtworkTitle } from "../data/artworks";
import type { ArtworkSlug } from "../data/artworks";
import "./MyWorks.css";
import "./Artwork.css";

const Artwork = () => {
  return (
    <div className="myworks-page artwork-page artwork-page--index">
      <div className="myworks-header artwork-header">
        <Link to="/" className="back-button" data-cursor="disable">
          ← Back to Home
        </Link>
        <h1>
          <span>Artwork</span>
        </h1>
        <p className="artwork-index-lead">
          Choose a piece from the menu above, or open one here.
        </p>
        <ul className="artwork-index-list">
          {ARTWORK_SLUGS.map((slug: ArtworkSlug) => (
            <li key={slug}>
              <Link
                to={`/artwork/${slug}`}
                className="artwork-index-link"
                data-cursor="disable"
              >
                {getArtworkTitle(slug)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Artwork;
