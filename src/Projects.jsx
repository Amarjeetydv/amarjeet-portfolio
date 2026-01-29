import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";

const myProjects = [
  {
    name: "auto-theft-guard",
    description: "A real-time fuel theft detection and vehicle lock management system with automated alerts and comprehensive monitoring. Features automatic vehicle locking on theft detection, continuous fuel monitoring, interactive dashboard, real-time statistics, and fleet management with MySQL triggers for instant detection.",
    repoUrl: "https://github.com/Amarjeetydv/auto-theft-guard",
    liveUrl: null,
    stack: ["React", "Bootstrap", "Node.js", "Express.js", "MySQL"],
  },
  {
    name: "amarjeet-portfolio",
    description: "My personal portfolio website built with React and Vite. Features a modern, responsive design with sections for About, Skills, Projects, Education, and Contact. Includes dynamic project fetching and modern UI components.",
    repoUrl: "https://github.com/Amarjeetydv/amarjeet-portfolio",
    liveUrl: null,
    stack: ["React", "JavaScript", "CSS", "Vite", "GitHub API"],
  },
  {
    name: "cafe management system",
    description: "A comprehensive cafe management system with frontend and backend functionality. Features user authentication, menu management, order processing, and administrative controls.",
    repoUrl: "https://github.com/Amarjeetydv/cafe-management-system",
    liveUrl: null,
    stack: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
  },
  {
    name: "amarjeet bootstrap project",
    description: "A modern, responsive frontend template for logistics or business websites, built with Bootstrap 4 and Font Awesome. Features multiple HTML templates, custom styles, interactive carousels, and a professional layout.",
    repoUrl: "https://github.com/Amarjeetydv/amarjeet-bootstrap-frontend",
    liveUrl: "https://amarjeetydv.github.io/amarjeet-bootstrap-frontend/",
    stack: ["HTML"],
  },
  {
    name: "amarjeet-css-project",
    description: "A collection of modern HTML and CSS UI components, including sliders, footers, and input forms. Features responsive design, Font Awesome icons, and demo pages for each component.",
    repoUrl: "https://github.com/Amarjeetydv/amarjeet-css-project",
    liveUrl: "https://amarjeetydv.github.io/amarjeet-css-project/",
    stack: ["HTML"],
  },
];

const Projects = () => {
  return (
    <section className="my-work-section" id="projects">
      <h2 className="work-title">My Work</h2>
      <p className="work-desc">
        Explore a curated collection of my digital creations. From web applications to coding experiments, this is where I bring ideas to life.
      </p>
      <div className="work-list">
        {myProjects.map((project) => (
          <div className={`work-card ${project.featured ? 'featured' : ''}`} key={project.name}>
            <div className="work-content">
              <h3 className="work-project-title"><a href={project.repoUrl} target="_blank" rel="noopener noreferrer">{project.name}</a></h3>
              <p className="work-project-desc">{project.description}</p>
              <div className="work-tech-stack">{project.stack.map((tech) => (<span key={tech} className="work-lang-badge">{tech}</span>))}</div>
            </div>
            <div className="project-links">
              <a href={project.repoUrl} className="project-link-btn" target="_blank" rel="noopener noreferrer"><FaGithub /> GitHub</a>
              {project.liveUrl && (<a href={project.liveUrl} className="project-link-btn" target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt /> Live Demo</a>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
