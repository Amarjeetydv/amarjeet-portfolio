import { useState, useEffect } from 'react'
import './App.css'
import myphoto from './assets/myphoto.jpg'
import coreldrawIcon from './assets/coreldraw.svg';
import EducationTimeline from './EducationTimeline';
import { FaCode, FaJs, FaHtml5, FaCss3Alt, FaDatabase, FaGithub, FaExternalLinkAlt, FaLinkedin, FaFacebook, FaTwitter, FaInstagram, FaSun, FaMoon, FaLaptop } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";

const sections = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]

const skillsData = [
  {
    category: 'Frontend',
    items: [
      { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', proficiency: 95 },
      { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg', proficiency: 90 },
      { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', proficiency: 85 },
      { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', proficiency: 80 },
      { name: 'Bootstrap', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg', proficiency: 80 },
      { name: 'Laravel', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg', proficiency: 70 },
      { name: 'jQuery', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jquery/jquery-original.svg', proficiency: 75 },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', proficiency: 75 },
      { name: 'Express.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', proficiency: 70 },
      { name: 'PHP', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', proficiency: 75 },
      { name: 'MySQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', proficiency: 70 },
    ],
  },
  {
    category: 'Programming Languages',
    items: [
      { name: 'C', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg', proficiency: 80 },
      { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg', proficiency: 75 },
      { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', proficiency: 70 },
      { name: 'Visual Basic', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/40/VB.NET_Logo.svg', proficiency: 60 },
    ],
  },
  {
    category: 'UI/UX',
    items: [
      { name: 'CorelDRAW', icon: coreldrawIcon, proficiency: 70 },
      { name: 'Adobe XD', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xd/xd-plain.svg', proficiency: 60 },
      { name: 'Photoshop', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg', proficiency: 80 },
      { name: 'Canva', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg', proficiency: 80 },
    ],
  },
  {
    category: 'Tools',
    items: [
      { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', proficiency: 80 },
      { name: 'Vite', icon: 'https://vitejs.dev/logo.svg', proficiency: 65 },
    ],
  },
];

const languageIcons = {
  JavaScript: <FaJs color="#f7df1e" />,
  HTML: <FaHtml5 color="#e34c26" />,
  CSS: <FaCss3Alt color="#2965f1" />,
  SCSS: <FaCss3Alt color="#c6538c" />,
  "C++": <FaCode color="#00599C" />,
  default: <FaDatabase color="#a259ff" />,
};

const myProjects = [
  {
    name: "auto-theft-guard",
    description: "A real-time fuel theft detection and vehicle lock management system with automated alerts and comprehensive monitoring. Features automatic vehicle locking on theft detection, continuous fuel monitoring, interactive dashboard, real-time statistics, and fleet management with MySQL triggers for instant detection.",
    repoUrl: "https://github.com/Amarjeetydv/auto-theft-guard",
    liveUrl: null, // No live URL provided
    stack: ["React", "Bootstrap", "Node.js", "Express.js", "MySQL"],
    featured: true, // Highlight this project
  },
  {
    name: "amarjeet-portfolio",
    description: "My personal portfolio website built with React and Vite. Features a modern, responsive design with sections for About, Skills, Projects, Education, and Contact. Includes dynamic project fetching and modern UI components.",
    repoUrl: "https://github.com/Amarjeetydv/amarjeet-portfolio",
    liveUrl: null, // Set to null to remove redundant "Live Demo" button
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

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: 'smooth' });
};

function App() {
  const [activeSection, setActiveSection] = useState('about');
  const [selectedCategory, setSelectedCategory] = useState(skillsData[0].category);
  const [projects, setProjects] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [attachment, setAttachment] = useState(null);
  // Simplified theme state to only handle light/dark, defaulting to dark.
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Simplified theme application logic
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme'); // Default is dark theme
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch("https://api.github.com/users/Amarjeetydv/repos")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (repo) => repo.name !== "amarjeet-portfolio"
        );
        setProjects(filtered);
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show button if user has scrolled down more than half the viewport height
      setShowBackToTop(window.scrollY > window.innerHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setAttachment(null);
      return;
    }

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a PDF, JPG, or PNG.');
      e.target.value = null; // Clear the input
      return;
    }

    if (file.size > maxSize) {
      alert('File is too large. Maximum size is 5MB.');
      e.target.value = null; // Clear the input
      return;
    }
    setAttachment(file);
  };

  return (
    <>
      <div className="portfolio-container">
        <nav className="menu">
          <div className="profile">
            <img src={myphoto} alt="Amarjeet Yadav" className="profile-photo" />
            <div className="intro-block">
              <div className="animated-intro">Hi, I'm <span className="animated-name-inline">Amarjeet Yadav</span>, an <span className="highlight-role">Aspiring Full Stack Developer</span>.</div>
            </div>
          </div>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <button onClick={() => scrollToSection(section.id)}>{section.label}</button>
              </li>
            ))}
          </ul>
        </nav>
      
        <main className="content">
          <section id="about">
            {/* Hero Section - for immediate impact */}
            <div className="hero-section">
            <h1 className="hero-title">
              Amarjeet Yadav
            </h1>
            <p className="hero-tagline">Full Stack Developer crafting digital experiences from concept to deployment.</p>
            <div className="hero-cta-group">
              <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }} className="cta-button">Hire Me</a>
              <a href="#projects" onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }} className="cta-button secondary">View Projects</a>
            </div>
          </div>
  
          <h2 className="work-title">About Me</h2>
          <div className="about-content">
            <p>
              I’m <span className="highlight-text">Amarjeet Yadav</span>, a passionate <span className="strong-text">Full Stack Developer</span> and MCA student at LPU.
            </p>
            <p className="skill-tag-container">
              <span className="skill-tag-label">Top Skills:</span> <span className="skill-tag">React · Node.js · JavaScript · MySQL · UI/UX Design · PHP · C++ · Python</span>
            </p>
            <p>
              I thrive on building digital solutions that blend <span className="highlight-text">creativity</span> with <span className="highlight-text">robust engineering</span>. My journey includes hands-on experience with modern web technologies, a keen interest in global affairs, and a commitment to <span className="highlight-text">continuous learning</span>.
            </p>
            <p>
              Curious by nature, I enjoy exploring new tech, reading about world events, and collaborating on projects that make a real impact.
            </p>
            <p><span className="strong-text">Let’s connect and create something meaningful together!</span></p>
          </div>
            <div className="about-buttons">
              <a href="https://drive.google.com/file/d/1duGuRp6joowM3oQdeoLTyLjq2PRWHACW/view?usp=sharing" target="_blank" rel="noopener noreferrer">
                <button type="button">View/Download Resume</button>
              </a>
            </div>
        </section>

        <section className="my-work-section" id="projects">
            <h2 className="work-title">My Work</h2>
            <p className="work-desc">
              Explore a curated collection of my digital creations. From web applications to coding experiments, this is where I bring ideas to life.
            </p>
            <div className="work-list">
              {myProjects.map((project) => (
                <div className={`work-card ${project.featured ? 'featured' : ''}`} key={project.name}>
                  <div className="work-content">
                    <h3 className="work-project-title">
                      <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                        {project.name}
                      </a>
                    </h3>
                    <p className="work-project-desc">{project.description}</p>
                    <div className="work-tech-stack">
                      {project.stack.map((tech) => (
                        <span key={tech} className="work-lang-badge">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <div className="project-links">
                    <a href={project.repoUrl} className="project-link-btn" target="_blank" rel="noopener noreferrer">
                      <FaGithub /> GitHub
                    </a>
                    {project.liveUrl && (
                      <a href={project.liveUrl} className="project-link-btn" target="_blank" rel="noopener noreferrer">
                        <FaExternalLinkAlt /> Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </section>

        <section className="my-work-section" id="skills">
            <h2 className="work-title">Skills</h2>
            <p className="work-desc">
              Explore my technical expertise across different domains. From frontend frameworks to backend technologies, here's what I bring to the table.
            </p>
            <div className="skills-tabs">
              {skillsData.map(cat => (
                <button
                  key={cat.category}
                  className={`skill-tab ${selectedCategory === cat.category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.category)}
                >
                  {cat.category}
                </button>
              ))}
            </div>
            <div className="skills-container">
              {skillsData.find(cat => cat.category === selectedCategory)?.items.map(skill => (
                <div className="skill-item" key={skill.name}>
                  <div className="skill-header">
                    <img src={skill.icon} alt={skill.name} className="skill-icon" />
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-percentage">{skill.proficiency}%</span>
                  </div>
                  <div className="skill-progress">
                    <div 
                      className="skill-progress-fill" 
                      style={{ width: `${skill.proficiency}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        <section id="education">
            <EducationTimeline />
        </section>

        <section className="my-work-section" id="contact">
            <h2 className="work-title">Contact</h2>
            <p className="work-desc">
              Get in touch with me! I'm always interested in new opportunities and collaborations. Let's discuss how we can work together.
            </p>
            <form className="contact-form" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              formData.delete('attachment');
              if (attachment) {
                formData.append('attachment', attachment);
              }

              try {
                // Use local server for development, production server for deployment
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const apiUrl = isLocal ? 'http://localhost:3001/api/contact' : 'https://amarjeet-portfolio.onrender.com/api/contact';

                const res = await fetch(apiUrl, {
                  method: 'POST',
                  body: formData,
                });

                if (res.ok) {
                  alert('Message sent!');
                  e.target.reset();
                  setAttachment(null);
                } else {
                  alert('Failed to send message. Please try again.');
                }
              } catch (error) {
                console.error('Error submitting form:', error);
                alert('Failed to connect to the server. Ensure the backend is running.');
              }
            }}>
              <label>
                Name:
                <input type="text" name="name" placeholder="Enter your full name" required autoComplete="name" />
              </label>
              <label>
                Email:
                <input type="email" name="email" placeholder="Enter your email address" required autoComplete="email" />
              </label>
              <label>
                Message:
                <textarea name="message" placeholder="Write your message here..." required  />
              </label>
              <label>
                Attach a file (optional)
                <input type="file" name="attachment" onChange={handleFileChange} />
                <small style={{ color: 'var(--text-muted-color)', marginTop: '0.5rem' }}>
                  Allowed types: PDF, JPG, PNG. Max size: 5MB.
                </small>
              </label>
              <button type="submit">Send</button>
            </form>
          </section>

        <footer className="site-footer">
        <h2>Follow me</h2>
          <div className="social-links">
            <a href="https://github.com/Amarjeetydv" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub size={24} />
            </a>

            <a href="https://linkedin.com/in/amarjeet-yadav-978820291" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin size={24} />
            </a>

            <a href="https://www.facebook.com/profile.php?id=100083695459596" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebook size={24} />
            </a>

            <a href="https://x.com/YadavPrade66061?t=YaB_XMLECI7jmVnaloxduQ&s=09" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter size={24} />
            </a>

            <a href="https://www.instagram.com/_amarjeet_30/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram size={24} />
            </a>

            <a href="https://leetcode.com/u/Amarjeet__Yadav/" target="_blank" rel="noopener noreferrer" aria-label="LeetCode">
              <SiLeetcode size={24} />
            </a>
          </div>     
          <p className="footer-copy">© {new Date().getFullYear()} Amarjeet Yadav. All Rights Reserved.</p>
        </footer>

        {showBackToTop && (
          <button
            type="button"
            className="back-to-top-btn"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="Back to top"
          >
            &uarr;
          </button>
        )}
      </main>
    </div>
    <div className="theme-toggle">
      <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} aria-label="Light Mode"><FaSun /></button>
      <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} aria-label="Dark Mode"><FaMoon /></button>
    </div>
    </>
  )
}

export default App
