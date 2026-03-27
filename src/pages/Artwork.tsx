import { Link } from "react-router-dom";
import "./MyWorks.css";
import "./Artwork.css";

const Artwork = () => {
  return (
    <div className="myworks-page artwork-page">
      <div className="myworks-header artwork-header">
        <Link to="/" className="back-button" data-cursor="disable">
          ← Back to Home
        </Link>
        <h1>
          <span>Artwork</span>
        </h1>
        <p className="artwork-under-construction">Under construction</p>
        <p className="artwork-hint">
          This space will host videos, interactive pieces, and experiments.
        </p>
      </div>
    </div>
  );
};

export default Artwork;
