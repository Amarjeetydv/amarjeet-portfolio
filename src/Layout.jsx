import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { FaGithub, FaLinkedin, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import { useCustomCursor } from './hooks/useCustomCursor';

const Technical3DBackground = lazy(() => import('./components/Technical3DBackground'));

const Layout = ({ sections, theme, toggleTheme }) => {
  useCustomCursor();
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation();
  const isHomeRoute = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const isNearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;
      setShowBackToTop(window.scrollY > 300 && !isNearBottom);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // On route change, scroll smoothly to the target section or top
  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith('/contact/chat') || path === '/learn') {
      window.scrollTo(0, 0);
      return;
    }

    if (path === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sectionId = path.substring(1); // e.g. 'projects', 'skills'

    // Use a tiny timeout to ensure DOM has rendered
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80; // height of sticky navbar
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo(0, 0);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    document.body.classList.toggle('home-page', isHomeRoute);
    return () => document.body.classList.remove('home-page');
  }, [isHomeRoute]);

  return (
    <>
      <Suspense fallback={null}>
        <Technical3DBackground theme={theme} />
      </Suspense>
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-blob bg-blob-1" aria-hidden="true" />
      <div className="bg-blob bg-blob-2" aria-hidden="true" />
      <div className="bg-blob bg-blob-3" aria-hidden="true" />
      <Navbar sections={sections} theme={theme} toggleTheme={toggleTheme} />
      <main className={`content ${isHomeRoute ? 'home-main' : ''}`}>
        <Outlet />
      </main>
      <footer className="site-footer-redesigned">
        <div className="footer-inner-container">
          <div className="footer-main-grid">
            <div className="footer-column footer-brand-col">
              <h3 className="footer-brand-name">Amarjeet Yadav</h3>
              <p className="footer-brand-subtitle">
                Software Engineer & Full Stack Developer
              </p>
              <p className="footer-brand-tagline">
                MCA Student & Computer Science Educator. Passionate about building high-performance web applications, scalable backend architectures, and intelligent digital systems.
              </p>
              <div className="footer-social-icons">
                <a href="https://github.com/Amarjeetydv" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
                <a href="https://linkedin.com/in/amarjeet-yadav-978820291" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                <a href="https://leetcode.com/u/Amarjeet__Yadav/" target="_blank" rel="noopener noreferrer" aria-label="LeetCode"><SiLeetcode /></a>
                <a href="https://x.com/YadavPrade66061?t=YaB_XMLECI7jmVnaloxduQ&s=09" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
                <a href="https://www.instagram.com/_amarjeet_30/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
                <a href="https://www.facebook.com/profile.php?id=100083695459596" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
              </div>
            </div>

            <div className="footer-column footer-links-col">
              <h4 className="footer-col-title">Quick Navigation</h4>
              <ul className="footer-links-grid">
                {sections.map(section => (
                  <li key={section.id}>
                    <Link to={section.path}>{section.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column footer-contact-col">
              <h4 className="footer-col-title">Get In Touch</h4>
              <div className="footer-contact-items">
                <a href="mailto:amarjeetyadav043590@gmail.com" className="footer-contact-link">
                  <span className="footer-contact-icon">📧</span>
                  <span>amarjeetyadav043590@gmail.com</span>
                </a>
                <a href="tel:+919305917283" className="footer-contact-link">
                  <span className="footer-contact-icon">📞</span>
                  <span>+91 93059 17283</span>
                </a>
              </div>
              <div className="footer-status-pill">
                <span className="footer-status-dot"></span>
                <span>Open for Software Engineering opportunities</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p className="footer-copyright">© {new Date().getFullYear()} Amarjeet Yadav. All Rights Reserved.</p>
            <p className="footer-built-with">Crafted with React & Modern Web Technologies</p>
          </div>
        </div>
      </footer>
      {showBackToTop && (
        <button 
          type="button" 
          className="back-to-top-btn" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          aria-label="Back to top"
        >
          <svg
            className="back-to-top-arrow-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M12 19V5M5 12L12 5L19 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </>
  );
};

export default Layout;
