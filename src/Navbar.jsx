import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import { FaSun, FaMoon } from "react-icons/fa";

const Navbar = ({ sections, theme, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false); // Close menu on link click
  };

  return (
    <div className="navbar-container">
      {/* Backdrop Overlay */}
      <div 
        className={`navbar-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div className="navbar-controls">
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
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <FaSun className="theme-toggle-icon sun" />
          <FaMoon className="theme-toggle-icon moon" />
        </button>
      </div>
      <nav className={`navbar-menu ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} inert={!isOpen ? true : undefined}>
        <ul>
          {sections.map((section) => (
            <li key={section.id}>
              <NavLink
                to={section.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={handleLinkClick}
                end={section.path === '/'}
              >
                {section.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
