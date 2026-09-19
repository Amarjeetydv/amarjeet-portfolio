import { useState } from 'react';
import './EducationTimeline.css'; // Reuses timeline vertical axis & connectors
import './Experience.css'; // Dedicated styling for professional ATS experience cards & proof modal
import { FaCalendarAlt, FaMapMarkerAlt, FaBriefcase, FaBuilding, FaCheckCircle, FaUsers, FaArrowRight } from 'react-icons/fa';
import ProofModal from './components/ProofModal';

const experienceList = [
  {
    id: "lecturer-cse",
    role: "Lecturer – Computer Science & Engineering",
    organization: "Ideal Foundation",
    institution: "Ideal Institute of Technology, Wada",
    employmentType: "Full-time",
    workMode: "On-site",
    location: "Wada, Maharashtra, India",
    duration: "Sep 2026 – Present",
    isCurrent: true,
    description: "Lecturer in the Computer Science & Engineering Department at Ideal Institute of Technology, Wada, under Ideal Foundation.",
    responsibilities: [
      "Teaching Computer Science and related subjects to undergraduate students.",
      "Delivering lectures, practical sessions, and hands-on programming exercises.",
      "Assisting students in understanding programming, databases, software engineering, and core computing concepts.",
      "Preparing course materials, assignments, and practical activities to support effective learning.",
      "Supporting students in developing problem-solving, programming, and technical skills.",
      "Contributing to academic activities, student development, and departmental responsibilities."
    ],
    skills: ["Undergraduate Teaching"],
    proof: {
      title: "Appointment Letter – Ideal Foundation",
      type: "pdf",
      url: "/Ideal_Appointment_Letter_Redacted_Public.pdf",
      buttonText: "View Appointment Letter"
    }
  },
  {
    id: "cr-lpu",
    role: "Class Representative",
    organization: "Lovely Professional University",
    duration: "Mar 2026 – Aug 2026",
    workMode: "On-site",
    roleType: "Student Leadership / Representative Role",
    isCurrent: false,
    description: "Represented MCA students and served as a communication bridge between students and faculty. Coordinated academic communication, addressed student concerns, supported class activities, and contributed to a collaborative learning environment.",
    skills: ["Leadership and Communication"],
    proof: {
      title: "Class Representative Verification (Term 2) – Lovely Professional University",
      type: "image",
      url: "/term2.jpeg",
      buttonText: "View Proof"
    }
  },
  {
    id: "cr-sca-lpu",
    role: "Class Representative",
    organization: "School of Computer Applications, LPU",
    duration: "Aug 2025 – Feb 2026",
    location: "Phagwara, Punjab, India",
    workMode: "On-site",
    roleType: "Student Leadership / Representative Role",
    isCurrent: false,
    description: "Appointed as Class Representative for the Autumn Term 2025–26 at Lovely Professional University. Coordinated between students and faculty and supported class communication and class responsibilities.",
    skills: ["Leadership and Communication"],
    proof: {
      title: "Class Representative Verification (Term 1) – School of Computer Applications, LPU",
      type: "image",
      url: "/term1.jpeg",
      buttonText: "View Proof"
    }
  }
];

const Experience = () => {
  const [selectedProof, setSelectedProof] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenProof = (proof) => {
    setSelectedProof(proof);
    setIsModalOpen(true);
  };

  const handleCloseProof = () => {
    setIsModalOpen(false);
    setSelectedProof(null);
  };

  return (
    <section id="experience" className="my-work-section" aria-label="Experience">
      <h1 className="work-title">Experience</h1>
      <p className="work-desc">
        Professional teaching experience, academic responsibilities, and student leadership roles.
      </p>

      <div className="timeline experience-timeline">
        {experienceList.map((item) => (
          <article className="timeline-item" key={item.id}>
            <div className="timeline-dot" aria-hidden="true" />
            <div className={`exp-card timeline-content ${item.isCurrent ? 'exp-card--current' : ''}`}>
              
              {/* Header: Title, Organization, and Badges */}
              <div className="exp-header">
                <div className="exp-role-wrapper">
                  <h2 className="exp-role-title">{item.role}</h2>
                  <div className="exp-org-name">
                    <FaBuilding aria-hidden="true" style={{ fontSize: '0.9rem', flexShrink: 0 }} />
                    <span>{item.organization}</span>
                  </div>
                  {item.institution && (
                    <p className="exp-institution-name">{item.institution}</p>
                  )}
                </div>

                <div className="exp-badge-container">
                  {item.isCurrent && (
                    <span className="exp-present-badge">
                      <span className="exp-pulse-dot" aria-hidden="true" />
                      Present
                    </span>
                  )}
                  {item.roleType && (
                    <span className="exp-type-badge">
                      <FaUsers aria-hidden="true" style={{ marginRight: '4px', fontSize: '0.75rem', flexShrink: 0, marginTop: '2px' }} />
                      <span>{item.roleType}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata Row: Duration, Location, Employment Type / Mode */}
              <div className="exp-meta-row">
                <div className="exp-meta-item">
                  <FaCalendarAlt className="exp-meta-icon" aria-hidden="true" />
                  <span>{item.duration}</span>
                </div>
                {item.location && item.location !== 'On-site' && (
                  <div className="exp-meta-item">
                    <FaMapMarkerAlt className="exp-meta-icon" aria-hidden="true" />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.employmentType && (
                  <div className="exp-meta-item">
                    <FaBriefcase className="exp-meta-icon" aria-hidden="true" />
                    <span>{item.employmentType}{item.workMode ? ` • ${item.workMode}` : ''}</span>
                  </div>
                )}
                {!item.employmentType && item.workMode && (
                  <div className="exp-meta-item">
                    <FaBriefcase className="exp-meta-icon" aria-hidden="true" />
                    <span>{item.workMode}</span>
                  </div>
                )}
              </div>

              {/* Overview Description */}
              {item.description && (
                <p className="exp-description">{item.description}</p>
              )}

              {/* Responsibilities List (if available) */}
              {item.responsibilities && item.responsibilities.length > 0 && (
                <div className="exp-responsibilities">
                  <h3 className="exp-responsibilities-heading">Responsibilities:</h3>
                  <ul className="exp-responsibilities-list">
                    {item.responsibilities.map((resp, idx) => (
                      <li key={idx} className="exp-responsibility-item">
                        <FaCheckCircle className="exp-bullet-icon" aria-hidden="true" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Tags & Proof Action Button */}
              <div className="exp-footer-row">
                {item.skills && item.skills.length > 0 && (
                  <div className="exp-skills-row" aria-label="Skills">
                    {item.skills.map((skill) => (
                      <span key={skill} className="exp-skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {item.proof && (
                  <div className="exp-proof-action">
                    <button
                      type="button"
                      className="exp-proof-btn"
                      onClick={() => handleOpenProof(item.proof)}
                      aria-label={`${item.proof.buttonText} for ${item.role} at ${item.organization}`}
                    >
                      <span>{item.proof.buttonText}</span>
                      <FaArrowRight className="exp-proof-arrow" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </article>
        ))}
      </div>

      {/* Verification Document & Image Modal Viewer */}
      <ProofModal
        isOpen={isModalOpen}
        onClose={handleCloseProof}
        proof={selectedProof}
      />
    </section>
  );
};

export default Experience;
