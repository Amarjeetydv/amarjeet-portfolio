import { useState, useEffect } from 'react'
import './App.css'
import myphoto from './assets/myphoto.jpg'
import coreldrawIcon from './assets/coreldraw.svg';
import EducationTimeline from './EducationTimeline';
import { FaCode, FaJs, FaHtml5, FaCss3Alt, FaDatabase } from "react-icons/fa";

const sections = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]

// Data-driven skills array
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
      { name: 'AJAX', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jquery/jquery-original.svg', proficiency: 70 },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', proficiency: 75 },
      { name: 'Express.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', proficiency: 70 },
      { name: 'PHP', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', proficiency: 75 },
      { name: 'MySQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', proficiency: 70 },
      { name: '.NET', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dot-net/dot-net-original.svg', proficiency: 60 },
    ],
  },
  {
    category: 'Programming Languages',
    items: [
      { name: 'C', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg', proficiency: 80 },
      { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg', proficiency: 75 },
      { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', proficiency: 70 },
      { name: 'Visual Basic', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/40/VB.NET_Logo.svg', proficiency: 60 },
      { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg', proficiency: 65 },
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

// Custom project data with stack/tech for each project
const myProjects = [
  {
    name: "cafe-frontend",
    description: "A responsive Angular web app for cafe management. Features include user authentication, dashboard analytics, product/category/bill management, and a modern UI with a mobile-first approach.",
    url: "https://github.com/Amarjeetydv/cafe-frontend",
    stack: ["Angular", "SCSS", "REST API"],
  },
  {
    name: "cafe-backend",
    description: "A RESTful Node.js/Express backend for the Cafe Management System. Handles user authentication, product/category/bill CRUD operations, and dashboard analytics.",
    url: "https://github.com/Amarjeetydv/cafe-backend",
    stack: ["Node.js", "Express", "MySQL"], // Updated to MySQL
  },
  {
    name: "DSA-Practice",
    description: "Collection of C++ programs for practicing data structures, algorithms, and coding patterns.",
    url: "https://github.com/Amarjeetydv/DSA-Practice",
    stack: ["C++"],
  },
  {
    name: "amarjeet-css-project",
    description: "A collection of modern HTML and CSS UI components, including sliders, footers, and input forms. Features responsive design, Font Awesome icons, and demo pages for each component.",
    url: "https://github.com/Amarjeetydv/amarjeet-css-project",
    stack: ["HTML", "CSS", "UI Components"],
  },
  {
    name: "amarjeet-bootstrap-frontend",
    description: "A modern, responsive frontend template for logistics or business websites, built with Bootstrap 4 and Font Awesome. Features multiple HTML templates, custom styles, interactive carousels, and a professional layout.",
    url: "https://github.com/Amarjeetydv/amarjeet-bootstrap-frontend",
    stack: ["HTML", "Bootstrap", "CSS", "Font Awesome"],
  },
];

function App() {
  // Set default activeSection to 'about' so About section opens by default
  const [activeSection, setActiveSection] = useState('about');

  // State for GitHub projects
  const [projects, setProjects] = useState([]);

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

  return (
    <div className="portfolio-container">
      <nav className="menu">
        <div className="profile">
          {/* Replace with your actual photo */}
          <img src={myphoto} alt="Amarjeet Yadav" className="profile-photo" />
          <div className="intro-block" style={{ margin: '0.5rem 0' }}>
            <span className="intro-text" style={{ display: 'block', textAlign: 'center' }}>
              hey I'm<br />
              <span>
                <span className="animated-name" style={{ fontWeight: 'bold', fontSize: '2.5rem', color: '#a259ff', marginBottom: '0.5rem', display: 'inline-block' }}>amarjeet yadav</span>  a,
              </span><br />
              <span className="role-subheading typewriter" style={{ display: 'inline-block', wordBreak: 'normal', maxWidth: '100%', whiteSpace: 'nowrap', overflowWrap: 'normal', letterSpacing: 'normal', color: '#a259ff' }}>Full Stack Developer</span>
            </span>
          </div>
          <div className="social-links">
            <a href="https://github.com/Amarjeetydv" target="_blank" rel="noopener noreferrer" aria-label="GitHub" onClick={() => console.log('GitHub link clicked')}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.67.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/></svg>
            </a>
            <a href="https://linkedin.com/in/amarjeet-yadav-978820291" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" onClick={() => console.log('LinkedIn link clicked')}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 11.28h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.89v1.36h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v5.59z"/></svg>
            </a>
            <a href="https://www.facebook.com/profile.php?id=100083695459596" target="_blank" rel="noopener noreferrer" aria-label="Facebook" onClick={() => console.log('Facebook link clicked')}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.733 0-1.325.592-1.325 1.326v21.348c0 .733.592 1.326 1.325 1.326h11.495v-9.294h-3.128v-3.622h3.128v-2.672c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12v9.294h6.116c.733 0 1.325-.593 1.325-1.326v-21.349c0-.734-.592-1.326-1.325-1.326z"/></svg>
            </a>
            <a href="https://x.com/YadavPrade66061?t=YaB_XMLECI7jmVnaloxduQ&s=09" target="_blank" rel="noopener noreferrer" aria-label="Twitter" onClick={() => console.log('Twitter link clicked')}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.38 4.482c-4.083-.205-7.697-2.162-10.125-5.134a4.822 4.822 0 0 0-.664 2.475c0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417a9.867 9.867 0 0 1-6.102 2.104c-.396 0-.787-.023-1.175-.069a13.945 13.945 0 0 0 7.548 2.212c9.057 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.457-2.548z"/></svg>
            </a>
            <a href="https://www.instagram.com/ay043590?igsh=MWxncjMzNGMxZWlxcQ==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" onClick={() => console.log('Instagram link clicked')}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608-.058-1.266-.069-1.646-.069-4.85s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308 1.266-.058 1.688-.07 4.85-.07zm0-2.163c-3.259 0-3.667.012-4.947.07-1.276.058-2.687.334-3.678 1.325-.991.991-1.267 2.402-1.325 3.678-.058 1.28-.07 1.688-.07 4.947s.012 3.667.07 4.947c.058 1.276.334 2.687 1.325 3.678.991.991 2.402 1.267 3.678 1.325 1.28.058 1.688.07 4.947.07s3.667-.012 4.947-.07c1.276-.058 2.687-.334 3.678-1.325.991-.991 1.267-2.402 1.325-3.678.058-1.28.07-1.688.07-4.947s-.012-3.667-.07-4.947c-.058-1.276-.334-2.687-1.325-3.678-.991-.991-2.402-1.267-3.678-1.325-1.28-.058-1.688-.07-4.947-.07zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            <a href="https://www.youtube.com/@amarjeetcomposer8339" target="_blank" rel="noopener noreferrer" aria-label="YouTube" onClick={() => console.log('YouTube link clicked')}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.391.569A2.994 2.994 0 0 0 .502 6.186C0 8.08 0 12 0 12s0 3.92.502 5.814a2.994 2.994 0 0 0 2.107 2.117C4.5 20.5 12 20.5 12 20.5s7.5 0 9.391-.569a2.994 2.994 0 0 0 2.107-2.117C24 15.92 24 12 24 12s0-3.92-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
        <ul>
          {sections.map((section) => (
            <li key={section.id} className={activeSection === section.id ? 'active' : ''}>
              <button onClick={() => setActiveSection(section.id)}>{section.label}</button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="content">
        {activeSection === 'about' && (
          <section id="about">
            <h1>About Me</h1>
            <p style={{ color: '#232323' }}>
              I’m <span style={{ fontWeight: 600, color: '#a259ff' }}>Amarjeet Yadav</span>, a passionate <span style={{ fontWeight: 600 }}>Full Stack Developer</span> and MCA student at LPU.<br /><br />
              <span style={{ background: '#e0e7ff', color: '#222', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>Top Skills:</span> <span style={{ fontWeight: 500, color: '#0073b1' }}>React</span>, <span style={{ fontWeight: 500, color: '#0073b1' }}>Node.js</span>, <span style={{ fontWeight: 500, color: '#0073b1' }}>JavaScript</span>, <span style={{ fontWeight: 500, color: '#0073b1' }}>MySQL</span>, <span style={{ fontWeight: 500, color: '#0073b1' }}>UI/UX Design</span>, <span style={{ fontWeight: 500, color: '#0073b1' }}>PHP</span>, <span style={{ fontWeight: 500, color: '#0073b1' }}>C++</span>, <span style={{ fontWeight: 500, color: '#0073b1' }}>Python</span><br /><br />
              I thrive on building digital solutions that blend <span style={{ fontWeight: 500, color: '#a259ff' }}>creativity</span> with <span style={{ fontWeight: 500, color: '#a259ff' }}>robust engineering</span>. My journey includes hands-on experience with modern web technologies, a keen interest in global affairs, and a commitment to <span style={{ fontWeight: 500, color: '#a259ff' }}>continuous learning</span>.<br /><br />
              Curious by nature, I enjoy exploring new tech, reading about world events, and collaborating on projects that make a real impact.<br /><br />
              <span style={{ fontWeight: 600 }}>Let’s connect and create something meaningful together!</span>
            </p>
            <div style={{ marginTop: '1.5rem' }}>
              <a href="https://www.canva.com/design/DAGrJ6qnMgA/6rqBNKVqnm4mnzqRpN6oDQ/view?utm_content=DAGrJ6qnMgA&utm_campaign=designshare&utm_medium=link&utm_source=editor" target="_blank" rel="noopener noreferrer">
                <button type="button">View/Download Resume</button>
              </a>
              <a href="https://www.canva.com/design/DAGrpAyB_Do/vFAYFDcvZSMK2EaCBwwyNQ/view?utm_content=DAGrpAyB_Do&utm_campaign=designshare&utm_medium=link&utm_source=editor" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '1rem' }}>
                <button type="button">View/Download CV</button>
              </a>
            </div>
          </section>
        )}
        {activeSection === 'projects' && (
          <section className="my-work-section">
            <h2 className="work-title" style={{ textAlign: 'center' }}>My Work</h2>
            <p className="work-desc">
              Explore a curated collection of my digital creations. From web applications to coding experiments, this is where I bring ideas to life.
            </p>
            <div className="work-list">
              {myProjects.map((project) => (
                <div className="work-card" key={project.name}>
                  <div className="work-content">
                    <h3 className="work-project-title">
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        {project.name}
                      </a>
                    </h3>
                    <p className="work-project-desc">{project.description}</p>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {project.stack.map((tech) => (
                        <span key={tech} className="work-lang-badge">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <a className="work-link" href={project.url} target="_blank" rel="noopener noreferrer">
                    &#8599;
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
        {activeSection === 'skills' && (
          <section id="skills">
            <h1 style={{ textAlign: 'center' }}>Skills</h1>
            <div className="skills-carousel">
              {skillsData.map((cat) => (
                <div className="skills-category" key={cat.category}>
                  <h2>{cat.category}</h2>
                  <ul>
                    {cat.items.map((skill) => (
                      <li key={skill.name} className="skill-item">
                        <img src={skill.icon} alt={skill.name} className="skill-icon" />
                        <span>{skill.name}</span>
                        <div className="proficiency-bar">
                          <div className="proficiency-fill" style={{ width: `${skill.proficiency}%` }}></div>
                        </div>
                        <span className="proficiency-label">{skill.proficiency}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {activeSection === 'education' && (
          <section id="education">
            <EducationTimeline />
          </section>
        )}
        {activeSection === 'contact' && (
          <section id="contact">
            <h1>Contact</h1>
            <form className="contact-form" onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const data = {
                name: form.name.value,
                email: form.email.value,
                message: form.message.value,
              };
              const res = await fetch('https://amarjeet-portfolio.onrender.com/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              if (res.ok) {
                alert('Message sent!');
                form.reset();
              } else {
                alert('Failed to send message.');
              }
            }}>
              <label>
                Name:
                <input type="text" name="name" required />
              </label>
              <label>
                Email:
                <input type="email" name="email" required />
              </label>
              <label>
                Message:
                <textarea name="message" required />
              </label>
              <button type="submit">Send</button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
