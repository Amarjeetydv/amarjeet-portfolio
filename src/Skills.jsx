import { useState } from 'react';
import coreldrawIcon from './assets/coreldraw.svg';

const skillsData = [
  {
    category: 'Frontend',
    items: [
      { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', proficiency: 95 },
      { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg', proficiency: 90 },
      { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', proficiency: 85 },
      { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', proficiency: 80 },
      { name: 'Bootstrap', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg', proficiency: 80 },
      { name: 'Laravel', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg', proficiency: 70 },
      { name: 'jQuery', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jquery/jquery-original.svg', proficiency: 75 },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', proficiency: 75 },
      { name: 'Express.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', proficiency: 70 },
      { name: 'PHP', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', proficiency: 75 },
      { name: 'MySQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', proficiency: 70 },
    ],
  },
  {
    category: 'Programming Languages',
    items: [
      { name: 'C', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg', proficiency: 80 },
      { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg', proficiency: 75 },
      { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', proficiency: 70 },
      { name: 'Visual Basic', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/40/VB.NET_Logo.svg', proficiency: 60 },
    ],
  },
  {
    category: 'UI/UX',
    items: [
      { name: 'CorelDRAW', icon: coreldrawIcon, proficiency: 70 },
      { name: 'Adobe XD', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xd/xd-plain.svg', proficiency: 60 },
      { name: 'Photoshop', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg', proficiency: 80 },
      { name: 'Canva', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg', proficiency: 80 },
    ],
  },
  {
    category: 'Tools',
    items: [
      { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', proficiency: 80 },
      { name: 'Vite', icon: 'https://vitejs.dev/logo.svg', proficiency: 65 },
    ],
  },
];

const Skills = () => {
  const [selectedCategory, setSelectedCategory] = useState(skillsData[0].category);

  return (
    <section className="my-work-section" id="skills">
      <h2 className="work-title">Skills</h2>
      <p className="work-desc">
        Explore my technical expertise across different domains. From frontend frameworks to backend technologies, here's what I bring to the table.
      </p>
      <div className="skills-tabs">
        {skillsData.map(cat => (<button key={cat.category} className={`skill-tab ${selectedCategory === cat.category ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.category)}>{cat.category}</button>))}
      </div>
      <div className="skills-container">
        {skillsData.find(cat => cat.category === selectedCategory)?.items.map(skill => (
          <div className="skill-item" key={skill.name}>
            <div className="skill-header">
              <img src={skill.icon} alt={skill.name} className="skill-icon" />
              <span className="skill-name">{skill.name}</span>
              <span className="skill-percentage">{skill.proficiency}%</span>
            </div>
            <div className="skill-progress"><div className="skill-progress-fill" style={{ width: `${skill.proficiency}%` }}></div></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;
