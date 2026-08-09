import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { FaGithub, FaLinkedin, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import { useCustomCursor } from './hooks/useCustomCursor';
import Technical3DBackground from './components/Technical3DBackground';

const Layout = ({ sections, theme, toggleTheme }) => {
  useCustomCursor();
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isHomeRoute = location.pathname === '/';

  // Redirect to Home (/) and scroll to the top on initial load/hard refresh
  useEffect(() => {
    if (!window.__initialRedirectDone) {
      window.__initialRedirectDone = true;
      navigate('/', { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight * 0.5);
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
      <Technical3DBackground theme={theme} />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-blob bg-blob-1" aria-hidden="true" />
      <div className="bg-blob bg-blob-2" aria-hidden="true" />
      <div className="bg-blob bg-blob-3" aria-hidden="true" />
      <Navbar sections={sections} theme={theme} toggleTheme={toggleTheme} />
      <main className={`content ${isHomeRoute ? 'home-main' : ''}`}>
        <Outlet />
      </main>
      <footer className="site-footer-redesigned">
        <div className="footer-main-container">
          <div className="footer-column footer-brand-col">
            <h3>Amarjeet Yadav</h3>
            <p className="footer-brand-tagline">
              MCA Student & Software Engineer. Building scalable web platforms and robust backend API architectures.
            </p>
          </div>
          
          <div className="footer-column footer-links-col">
            <h4>Quick Links</h4>
            <ul>
              {sections.map(section => (
                <li key={section.id}>
                  <Link to={section.path}>{section.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="footer-column footer-contact-col">
            <h4>Contact Info</h4>
            <p>📧 <a href="mailto:amarjeetyadav043590@gmail.com">amarjeetyadav043590@gmail.com</a></p>
            <p>📞 <a href="tel:+919305917283">+91 93059 17283</a></p>
            <div className="footer-social-icons">
              <a href="https://github.com/Amarjeetydv" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
              <a href="https://linkedin.com/in/amarjeet-yadav-978820291" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
              <a href="https://www.facebook.com/profile.php?id=100083695459596" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
              <a href="https://x.com/YadavPrade66061?t=YaB_XMLECI7jmVnaloxduQ&s=09" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
              <a href="https://www.instagram.com/_amarjeet_30/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
              <a href="https://leetcode.com/u/Amarjeet__Yadav/" target="_blank" rel="noopener noreferrer" aria-label="LeetCode"><SiLeetcode /></a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} Amarjeet Yadav. All Rights Reserved.</p>
        </div>
      </footer>
      {showBackToTop && (<button type="button" className="back-to-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">&uarr;</button>)}
    </>
  );
};

export default Layout;
