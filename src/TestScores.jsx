import React from 'react';
import './EducationTimeline.css'; // Reuse timeline styles for visual consistency

const scoresList = [
  {
    exam: "MAH-MCA CET 2025",
    score: "95.29 Percentile",
    date: "May 2025",
    description: "Secured 95.29 percentile in MAH-MCA CET 2025, demonstrating strong analytical, logical reasoning, and quantitative aptitude skills."
  }
];

const TestScores = () => {
  return (
    <section id="scores" className="my-work-section" aria-label="Test Scores">
      <h1 className="work-title">Test Scores</h1>
      <p className="work-desc">
        Performance in standard entrance examinations and logical reasoning assessments.
      </p>
      
      <div className="timeline" style={{ marginTop: '2.5rem' }}>
        {scoresList.map((item, idx) => (
          <article className="timeline-item" key={idx}>
            <div className="timeline-dot" aria-hidden="true" />
            <div className="timeline-content">
              <h3 className="timeline-content__degree">{item.exam}</h3>
              <div className="timeline-content__grade" style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                Score: {item.score}
              </div>
              <p className="timeline-content__meta" style={{ margin: 0 }}>Date: {item.date}</p>
              <p className="timeline-content__description" style={{ marginTop: '0.75rem' }}>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TestScores;
