import React from 'react';
import './EducationTimeline.css'; // Reuse cert card designs for visual consistency

const honorsList = [
  {
    title: "LeetCode 50 Days Badge",
    issuer: "LeetCode",
    date: "July 2026",
    description: "Earned the LeetCode 50 Days Badge by maintaining a consistent coding practice streak, demonstrating discipline, problem-solving ability, and commitment to Data Structures & Algorithms."
  },
  {
    title: "GitHub Pull Shark Achievement",
    issuer: "GitHub",
    date: "April 2026",
    description: "Earned the GitHub Pull Shark achievement by successfully contributing through pull requests and demonstrating practical experience with collaborative software development and Git-based workflows."
  }
];

const Honors = () => {
  return (
    <section id="honors" className="my-work-section" aria-label="Honors & Awards">
      <h1 className="work-title">Honors & Awards</h1>
      <p className="work-desc">
        Recognition of coding consistency, problem solving, and open-source platform achievements.
      </p>
      
      <div className="cert-grid" style={{ marginTop: '2.5rem' }}>
        {honorsList.map((honor, idx) => (
          <article className="cert-card" key={idx} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="cert-content">
              <h3 className="cert-title">{honor.title}</h3>
              <p className="cert-issuer" style={{ color: 'var(--primary-color)', fontWeight: '600', marginBottom: '0.5rem' }}>{honor.issuer}</p>
              <p className="cert-meta">Date: {honor.date}</p>
              <p className="cert-meta" style={{ marginTop: '0.75rem', lineHeight: '1.5', color: 'var(--text-muted-color)', fontSize: '0.88rem' }}>
                {honor.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Honors;
