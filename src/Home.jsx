import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import myphoto from './assets/myphoto.jpg';
import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaCode,
  FaDatabase,
  FaReact,
  FaChevronRight,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';

const roles = ["React & Node.js Specialist", "Database Design Enthusiast", "REST API Architect"];

const Home = () => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const i = loopNum % roles.length;
    const fullText = roles[i];

    const handleType = () => {
      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
        return;
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(400); // Pause before typing next
        return;
      }

      const nextText = isDeleting
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1);

      setText(nextText);
      setTypingSpeed(isDeleting ? 45 : 120);
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <div className="home-sections-wrapper">
      {/* Balanced Two-Column Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-container">
          <div className="hero-grid-layout">
            {/* Left Column content copy */}
            <div className="hero-copy">
              <span className="hero-greeting">HELLO, I'M</span>

              <h1 className="hero-title">
                Software Engineer & <span className="gradient-name">Full Stack Developer</span>
              </h1>

              <div className="hero-role-typing">
                <span className="role-prefix">&gt; </span>
                <span className="role-text">{text}</span>
                <span className="role-cursor">|</span>
              </div>

              <p className="hero-tagline">
                MCA student and full-stack developer focused on building practical web applications and APIs.
              </p>

              <div className="hero-cta-group">
                <Link to="/projects" className="hero-btn-primary">
                  View My Work <FaChevronRight size={10} />
                </Link>
                <a
                  href="/Amarjeet_Yadav_Resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-btn-outline"
                >
                  View My CV <FaExternalLinkAlt size={10} />
                </a>
              </div>

              {/* Horizontal Social Links under CTA group */}
              <div className="hero-social-row" aria-label="Social connections">
                <a href="https://github.com/Amarjeetydv" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <FaGithub /> <span>GitHub</span>
                </a>
                <a href="https://linkedin.com/in/amarjeet-yadav-978820291" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <FaLinkedin /> <span>LinkedIn</span>
                </a>
                <a href="mailto:amarjeetyadav043590@gmail.com" aria-label="Email">
                  <FaEnvelope /> <span>Email</span>
                </a>
                <a href="https://leetcode.com/u/Amarjeet__Yadav/" target="_blank" rel="noopener noreferrer" aria-label="LeetCode">
                  <SiLeetcode /> <span>LeetCode</span>
                </a>
              </div>
            </div>

            {/* Right Column visuals */}
            <div className="hero-visual">
              <div className="profile-visual-container">
                <div className="profile-glowing-ring" aria-hidden="true" />
                <img src={myphoto} alt="Amarjeet Yadav" className="hero-photo-circular" />

                {/* Subtle Decorative floating nodes */}
                <div className="tech-node tech-node-1" title="Code" aria-hidden="true">
                  <FaCode />
                </div>
                <div className="tech-node tech-node-2" title="Database" aria-hidden="true">
                  <FaDatabase />
                </div>
                <div className="tech-node tech-node-3" title="React" aria-hidden="true">
                  <FaReact />
                </div>
              </div>
            </div>
          </div>

          {/* Mouse scroll down indicator */}
          <div className="scroll-down-indicator" aria-hidden="true">
            <span>Scroll Down</span>
            <div className="mouse-icon">
              <div className="mouse-wheel"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Centered About Me Section */}
      <section id="about" className="about-section">
        <h1 className="work-title">About Me</h1>
        <div className="about-title-underline" aria-hidden="true"></div>
        <p className="work-desc">
          Overview of my education, technical focus, and skills.
        </p>

        <div className="about-grid">
          <div className="about-main-text-card">
            <p>
              I am an <strong>MCA student at Lovely Professional University</strong> focusing on software engineering, database design, and full-stack web development. I enjoy building practical web applications using React, Node.js, Express, and databases.
            </p>
            <p>
              My development focus centers on writing clean code, designing solid relational database schemas, and building structured REST APIs.
            </p>
          </div>

          <div className="about-highlights">
            <article className="about-highlight-card">
              <FaCode className="highlight-icon" />
              <h3>Full Stack Developer</h3>
              <p>Focused on React, Node.js, Express, PHP, and database management solutions.</p>
            </article>

            <article className="about-highlight-card">
              <FaCode className="highlight-icon" />
              <h3>DSA Enthusiast</h3>
              <p>Focused on algorithmic problem-solving and structured code solutions.</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
