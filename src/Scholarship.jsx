import React from 'react';
import './EducationTimeline.css'; // Reuse card styling for visual consistency

const Scholarship = () => {
  return (
    <section id="scholarship" className="my-work-section" aria-label="Academic Achievements">
      <h1 className="work-title">Academic Achievements</h1>
      <p className="work-desc">
        Scholarships, recognition of academic potential, and entrance exam achievements.
      </p>
      
      <div className="cert-grid" style={{ marginTop: '2.5rem', justifyContent: 'center' }}>
        <article className="cert-card" style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="cert-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.25rem' }}>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/d/df/Lovely_Professional_University_logo.png" 
                alt="Lovely Professional University logo" 
                style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <h3 className="cert-title" style={{ fontSize: '1.2rem', margin: 0 }}>60% Scholarship through LPUNEST</h3>
                <p className="cert-issuer" style={{ color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.9rem', margin: '4px 0 0' }}>Lovely Professional University</p>
              </div>
            </div>
            
            <p className="cert-meta" style={{ fontWeight: '500', marginBottom: '1rem', fontSize: '0.85rem' }}>June 2025</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1rem 0', padding: '10px 15px', background: 'rgba(59, 130, 246, 0.06)', borderLeft: '3px solid var(--primary-color)', borderRadius: '0 8px 8px 0' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)', lineHeight: '1' }}>60%</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-color)', fontWeight: '500', lineHeight: '1.3' }}>Scholarship Awarded</span>
            </div>
            
            <p className="cert-meta" style={{ marginTop: '1rem', lineHeight: '1.6', color: 'var(--text-muted-color)', fontSize: '0.9rem' }}>
              Awarded a 60% scholarship by Lovely Professional University based on my performance in the LPUNEST examination, recognizing my academic potential and performance for admission to the MCA program.
            </p>
          </div>
          
          <a 
            href="/LPUNEST_Scholarship.pdf" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="cert-view-btn"
            style={{ 
              display: 'block', 
              textAlign: 'center', 
              textDecoration: 'none', 
              marginTop: '1.5rem', 
              fontWeight: '600'
            }}
          >
            View Certificate
          </a>
        </article>
      </div>
    </section>
  );
};

export default Scholarship;
