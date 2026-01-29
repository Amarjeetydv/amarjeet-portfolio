import myphoto from './assets/myphoto.jpg';

const About = () => {
  return (
    <section id="about">
      <div className="hero-section">
        <img src={myphoto} alt="Amarjeet Yadav" className="hero-photo" />
        <h1 className="hero-title">
          Amarjeet Yadav
        </h1>
        <p className="hero-tagline">Full Stack Developer crafting digital experiences from concept to deployment.</p>
      </div>

      <h2 className="work-title">About Me</h2>
      <div className="about-content">
        <p>
          I’m <span className="highlight-text">Amarjeet Yadav</span>, a passionate <span className="strong-text">Full Stack Developer</span> and MCA student at LPU.
        </p>
        <p className="skill-tag-container">
          <span className="skill-tag-label">Top Skills:</span> <span className="skill-tag">React · Node.js · JavaScript · MySQL · UI/UX Design · PHP · C++ · Python</span>
        </p>
        <p>
          I thrive on building digital solutions that blend <span className="highlight-text">creativity</span> with <span className="highlight-text">robust engineering</span>. My journey includes hands-on experience with modern web technologies, a keen interest in global affairs, and a commitment to <span className="highlight-text">continuous learning</span>.
        </p>
        <p>
          Curious by nature, I enjoy exploring new tech, reading about world events, and collaborating on projects that make a real impact.
        </p>
        <p><span className="strong-text">Let’s connect and create something meaningful together!</span></p>
      </div>
      <div className="about-buttons">
        <a href="https://drive.google.com/file/d/1duGuRp6joowM3oQdeoLTyLjq2PRWHACW/view?usp=sharing" target="_blank" rel="noopener noreferrer">
          <button type="button">View/Download Resume</button>
        </a>
      </div>
    </section>
  );
};

export default About;
