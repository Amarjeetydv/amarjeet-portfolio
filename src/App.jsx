import { useState, useEffect, lazy, Suspense } from 'react'
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
import Patents from './Patents.jsx';
import Contact from './Contact.jsx';
const SafeYouTube = lazy(() => import('./SafeYouTube.jsx'));
import SEO from './SEO.jsx';
import { seoConfig } from './seoConfig.js';

const sections = [
  { id: 'home', path: '/', label: 'Home' },
  { id: 'about', path: '/about', label: 'About' },
  { id: 'skills', path: '/skills', label: 'Skills' },
  { id: 'education', path: '/education', label: 'Education' },
  { id: 'certifications', path: '/certifications', label: 'Certifications' },
  { id: 'projects', path: '/projects', label: 'Projects' },
  { id: 'patents', path: '/patents', label: 'Patents' },
  { id: 'contact', path: '/contact', label: 'Contact' },
  { id: 'learn', path: '/learn', label: 'Learn' },
];

const UnifiedPortfolio = () => (
  <div className="unified-sections">
    <div id="home"><Home /></div>
    <div id="skills"><Skills /></div>
    <div id="education"><EducationPage /></div>
    <div id="certifications"><CertificationsPage /></div>
    <div id="projects"><Projects /></div>
    <div id="patents"><Patents /></div>
    <div id="contact"><Contact /></div>
  </div>
);

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
            <UnifiedPortfolio />
          </>
        } />
        <Route path="about" element={
          <>
            <SEO {...seoConfig.home} />
            <UnifiedPortfolio />
          </>
        } />
        <Route path="projects" element={
          <>
            <SEO {...seoConfig.projects} />
            <UnifiedPortfolio />
          </>
        } />
        <Route path="patents" element={
          <>
            <SEO {...seoConfig.patents} />
            <UnifiedPortfolio />
          </>
        } />
        <Route path="skills" element={
          <>
            <SEO {...seoConfig.skills} />
            <UnifiedPortfolio />
          </>
        } />
        <Route path="education" element={
          <>
            <SEO {...seoConfig.education} />
            <UnifiedPortfolio />
          </>
        } />
        <Route path="certifications" element={
          <>
            <SEO {...seoConfig.certifications} />
            <UnifiedPortfolio />
          </>
        } />
        <Route path="contact" element={
          <>
            <SEO {...seoConfig.contact} />
            <UnifiedPortfolio />
          </>
        } />
        <Route path="contact/chat/:conversationId" element={
          <>
            <SEO {...seoConfig.contact} />
            <Contact />
          </>
        } />
        <Route path="learn" element={
          <>
            <SEO {...seoConfig.learn} />
            <Suspense fallback={<div className="chat-loading"><span className="spinner"></span> Loading...</div>}>
              <SafeYouTube />
            </Suspense>
          </>
        } />
      </Route>
    </Routes>
  )
}

export default App
