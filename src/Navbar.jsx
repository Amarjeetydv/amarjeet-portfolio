import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';
import { FaSun, FaMoon } from "react-icons/fa";
import { getApiBaseUrl } from './utils/api';

const Navbar = ({ sections, theme, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Helper to retrieve initial active tab from the URL path on direct loads
  const getInitialSection = () => {
    if (location.pathname === '/learn') return 'learn';
    const pathId = location.pathname.substring(1);
    return pathId || 'home';
  };

  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const storedId = localStorage.getItem('portfolio_chat_conversation_id');
      if (!storedId) {
        setUnreadCount(0);
        return;
      }
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/chat/${storedId}/unread-count`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count in Navbar:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);

    const handleChatRead = () => {
      setUnreadCount(0);
    };

    window.addEventListener('portfolio_chat_read', handleChatRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('portfolio_chat_read', handleChatRead);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  // Synchronize routing path navigations with the active section highlight
  useEffect(() => {
    if (location.pathname === '/learn') {
      setActiveSection('learn');
    } else {
      const pathId = location.pathname.substring(1);
      setActiveSection(pathId || 'home');
    }
  }, [location.pathname]);

  // Scroll Spy logic using IntersectionObserver
  useEffect(() => {
    if (location.pathname !== '/') return;

    const sectionDomIds = ['hero', 'about', 'skills', 'education', 'certifications', 'projects', 'patents', 'contact'];
    
    const observerOptions = {
      root: null,
      // Sets an offset to account for the sticky header height (80px) and page margins
      rootMargin: '-85px 0px -40% 0px',
      threshold: [0, 0.1, 0.2, 0.3]
    };

    const sectionElements = sectionDomIds
      .map(id => document.getElementById(id))
      .filter(el => el !== null);

    const observerCallback = (entries) => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort entries by visibility ratio descending to find primary section
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topEntry = visibleEntries[0];
        let activeId = topEntry.target.id;
        if (activeId === 'hero') {
          activeId = 'home';
        }
        setActiveSection(activeId);
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sectionElements.forEach(el => observer.observe(el));

    // Fallback: force 'home' active when user is scrolled to the absolute top
    const handleScrollFallback = () => {
      if (window.scrollY < 100) {
        setActiveSection('home');
      }
    };
    window.addEventListener('scroll', handleScrollFallback, { passive: true });

    return () => {
      sectionElements.forEach(el => observer.unobserve(el));
      observer.disconnect();
      window.removeEventListener('scroll', handleScrollFallback);
    };
  }, [location.pathname]);

  return (
    <header className="navbar-header">
      <div className="navbar-nav-container">
        <NavLink to="/" className="navbar-logo" onClick={handleLinkClick}>
          <span className="logo-title-accent">Mr.</span> Amarjeet Yadav
        </NavLink>
        
        {/* Desktop Navigation */}
        <nav className="navbar-desktop-menu">
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <NavLink
                  to={section.path}
                  className={() => (activeSection === section.id ? 'active' : '')}
                  onClick={handleLinkClick}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {section.label}
                    {section.id === 'contact' && unreadCount > 0 && (
                      <span className="navbar-unread-container">
                        <span className="navbar-unread-emoji">🔴</span>
                        <span className="navbar-unread-count">{unreadCount}</span>
                      </span>
                    )}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Action buttons on the right */}
        <div className="navbar-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <FaSun className="theme-toggle-icon sun" />
            <FaMoon className="theme-toggle-icon moon" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            className={`hamburger-button ${isOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      <div 
        className={`navbar-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <nav className={`navbar-mobile-menu ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} inert={!isOpen ? true : undefined}>
        <ul>
          {sections.map((section) => (
            <li key={section.id}>
              <NavLink
                to={section.path}
                className={() => (activeSection === section.id ? 'active' : '')}
                onClick={handleLinkClick}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {section.label}
                  {section.id === 'contact' && unreadCount > 0 && (
                    <span className="navbar-unread-container">
                      <span className="navbar-unread-emoji">🔴</span>
                      <span className="navbar-unread-count">{unreadCount}</span>
                    </span>
                  )}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
