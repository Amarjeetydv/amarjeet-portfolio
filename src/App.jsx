import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import './App.css'
import './Theme.css'

// Layout and Page Components
import Layout from './Layout';
import Home from './Home.jsx';
import Projects from './Projects.jsx';
import Skills from './Skills.jsx';
import EducationPage from './EducationPage.jsx';
import CertificationsPage from './CertificationsPage.jsx';
import Contact from './Contact.jsx';
import SEO from './SEO.jsx';
import { seoConfig } from './seoConfig.js';

const sections = [
  { id: 'home', path: '/', label: 'Home' },
  { id: 'projects', path: '/projects', label: 'Projects' },
  { id: 'skills', path: '/skills', label: 'Skills' },
  { id: 'education', path: '/education', label: 'Education' },
  { id: 'certifications', path: '/certifications', label: 'Certifications' },
  { id: 'contact', path: '/contact', label: 'Contact' },
];

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Routes>
      <Route path="/" element={<Layout sections={sections} theme={theme} toggleTheme={toggleTheme} />}>
        <Route index element={
          <>
            <SEO {...seoConfig.home} />
            <Home />
          </>
        } />
        <Route path="projects" element={
          <>
            <SEO {...seoConfig.projects} />
            <Projects />
          </>
        } />
        <Route path="skills" element={
          <>
            <SEO {...seoConfig.skills} />
            <Skills />
          </>
        } />
        <Route path="education" element={
          <>
            <SEO {...seoConfig.education} />
            <EducationPage />
          </>
        } />
        <Route path="certifications" element={
          <>
            <SEO {...seoConfig.certifications} />
            <CertificationsPage />
          </>
        } />
        <Route path="contact" element={
          <>
            <SEO {...seoConfig.contact} />
            <Contact />
          </>
        } />
      </Route>
    </Routes>
  )
}

export default App
