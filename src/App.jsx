import { useState } from 'react'
import './App.css'
import myphoto from './assets/myphoto.jpg'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]

function App() {
  const [activeSection, setActiveSection] = useState('about')

  return (
    <div className="portfolio-container">
      <nav className="menu">
        <div className="profile">
          {/* Replace with your actual photo */}
          <img src={myphoto} alt="Amarjeet Yadav" className="profile-photo" />          <h2>Amarjeet Yadav</h2>
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
            <p>I am a passionate student and web developer. Welcome to my portfolio!</p>
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
          <section id="projects">
            <h1>Projects</h1>
            <p>Project details will be listed here.</p>
          </section>
        )}
        {activeSection === 'skills' && (
          <section id="skills">
            <h1>Skills</h1>
            <ul>
              <li>HTML</li>
              <li>CSS</li>
              <li>JavaScript</li>
              <li>React</li>
              <li>Node.js</li>
              <li>MySQL</li>
            </ul>
          </section>
        )}
        {activeSection === 'education' && (
          <section id="education">
            <h1>Education</h1>
            <p>Education details will be listed here.</p>
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
