import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import myphoto from './assets/myphoto.jpg';

const roles = ["Full Stack Developer", "React Developer", "MERN Developer"];

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
        // Finished typing, pause before deleting
        setTimeout(() => setIsDeleting(true), 2000);
        return;
      } else if (isDeleting && text === '') {
        // Finished deleting, switch to next role
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500); // Pause before typing next
        return;
      }

      const nextText = isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1);

      setText(nextText);
      setTypingSpeed(isDeleting ? 40 : 150); // Deleting is faster
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <section id="home" className="home-container">
      <div className="home-content">
        <div className="profile-img-wrapper">
          <img src={myphoto} alt="Portrait of Amarjeet Yadav" className="hero-photo" />
        </div>
        
        <div className="intro-text">
          <h1 className="hero-title">Amarjeet Yadav</h1>
          <h2 className="hero-role">
            {text}
            <span className="hero-cursor" aria-hidden="true"></span>
          </h2>
          <p className="hero-tagline">
            Building scalable, user-centric web applications with modern technologies.
          </p>
        </div>

        <nav className="hero-cta-group" aria-label="Quick access">
          <a 
            href="https://drive.google.com/file/d/1duGuRp6joowM3oQdeoLTyLjq2PRWHACW/view?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="cta-button"
          >
            Resume
          </a>
          <Link to="/projects" className="cta-button">Projects</Link>
          <Link to="/skills" className="cta-button">Skills</Link>
          <Link to="/contact" className="cta-button">Contact</Link>
        </nav>
      </div>
    </section>
  );
};

export default Home;
