import { Link } from "react-router-dom";
import { config } from "../config";
import "./MyWorks.css";

const MyWorks = () => {
  return (
    <div className="myworks-page">
      <div className="myworks-header">
        <Link to="/" className="back-button" data-cursor="disable">
          ← Back to Home
        </Link>
        <h1>
          All <span>Publications</span>
        </h1>
        <p>A collection of my publications</p>
      </div>

      <div className="myworks-grid">
        {config.projects.map((project) => {
          const proj = project as { url?: string; results?: string; year?: number };
          const cardContent = (
            <>
              <div className="myworks-card-number">{proj.year ?? ""}</div>
              <div className="myworks-card-image">
                <img src={project.image} alt={project.title} />
              </div>
              <div className="myworks-card-info">
                <h3>{project.title}</h3>
                <p className="myworks-card-category">{project.category}</p>
                <p className="myworks-card-description">{project.description}</p>
                <p className="myworks-card-tech">{proj.results ?? project.technologies}</p>
              </div>
            </>
          );
          return proj.url ? (
            <a
              key={project.id}
              className="myworks-card"
              href={proj.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
            >
              {cardContent}
            </a>
          ) : (
            <div key={project.id} className="myworks-card" data-cursor="disable">
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyWorks;
