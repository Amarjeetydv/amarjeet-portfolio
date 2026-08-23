import React from 'react';
import './EducationTimeline.css'; // Reuse timeline styles for visual consistency

const experienceList = [
  {
    role: "Class Representative",
    organization: "Lovely Professional University",
    duration: "November 2025 – Present",
    description: "Representing MCA students and serving as a communication bridge between students and faculty. Coordinating academic communication, addressing student concerns, supporting class activities, and contributing to a collaborative learning environment.",
    skills: ["Leadership", "Communication", "Coordination", "Teamwork"]
  }
];

const Experience = () => {
  return (
    <section id="experience" className="my-work-section" aria-label="Experience">
      <h1 className="work-title">Experience</h1>
      <p className="work-desc">
        Leadership roles, professional experience, and academic responsibilities.
      </p>
      
      <div className="timeline" style={{ marginTop: '2.5rem' }}>
        {experienceList.map((item, idx) => (
          <article className="timeline-item" key={idx}>
            <div className="timeline-dot" aria-hidden="true" />
            <div className="timeline-content">
              <h3 className="timeline-content__degree">{item.role}</h3>
              <p className="timeline-content__institution">{item.organization}</p>
              {item.duration && <p className="timeline-content__meta">{item.duration}</p>}
              
              {item.skills && (
                <div 
                  className="cert-skills" 
                  style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px', 
                    marginBottom: '0.75rem', 
                    marginTop: '0.5rem' 
                  }}
                  aria-label="Skills acquired"
                >
                  {item.skills.map(skill => (
                    <span 
                      key={skill} 
                      className="cert-skill-tag"
                      style={{ 
                        fontSize: '0.8rem',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        color: 'var(--primary-hover-color)',
                        padding: '3px 10px',
                        borderRadius: '50px',
                        fontWeight: '600'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              
              {item.description && <p className="timeline-content__description">{item.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Experience;
