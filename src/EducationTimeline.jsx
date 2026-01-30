import React from "react";
import "./EducationTimeline.css";

const educationList = [
  {
    degree: "Master of Computer Applications (MCA)",
    institution: "School of Computer Applications, Lovely Professional University, Phagwara, Punjab, India",
    duration: "Jun 2025 – Jun 2027",
  },
  {
    degree: "Bachelor of Computer Applications (BCA)",
    institution: "Doon Institute of Engineering & Technology, Rishikesh, Uttarakhand, India",
    duration: "Aug 2022 – Jun 2025",
    Score: "76.15%",
  },
  {
    degree: "Senior Secondary School Examination (Class XII)",
    institution: "S G R R Public School, Bhaniyawala, Dehradun, Uttarakhand, India",
    duration: "Apr 2020 – May 2022",
    description: "Subjects: Physics, Chemistry, Mathematics (PCM), Hindi, English, Physical Education",
    Score: "77.67%",
  },
  {
    degree: "Secondary School Examination (Class X)",
    institution: "Shri Guru Ram Rai Public School, Rishikesh, Dehradun, Uttarakhand, India",
    duration: "Apr 2018 – Mar 2020",
    description: "Subjects: English, Hindi, Mathematics, Science, Social Science",
    Score: "84%",
  }
];

const certificationList = [
  {
    title: "Tech Blitz 2025 – Hackathon Participation",
    issuer: "Coding Ninjas LPU",
    link: "https://credsverse.com/credentials/cc1a04b2-c940-4c58-9ae9-131cada99a59",
    issued: "October 01, 2025",
    type: "Hackathon"
  },
  {
    title: "Advance Diploma In Full Stack Developer",
    issuer: "Global Information Technology Council",
    issued: "Mar 2024",
    credentialId: "DV-92051091",
    link: "https://drive.google.com/file/d/1at2h5V0bNFg_l9gtnmJid8sACv8k4kou/view",
    skills: ["Node.js", "Python", "Laravel", "Php", "React.js", "Git", "SQL"]
  },
  {
    title: "Certificate of Workshop on Python",
    issuer: "UptoSkills",
    issued: "Sep 2023",
    link: "https://drive.google.com/file/d/1aevQ1Svw57vjvP8_Qnfg0V2xauxb6KZ_/view",
  },
  {
    title: "Debate Competition Participation Certificate",
    issuer: "Doon Institute of Engineering & Technology",
    issued: "Sep 2023",
    link: "https://drive.google.com/file/d/1i98dT-02E7mCtK0crRdFJ6FF_LA3U2_L/view",
  }
];

export const Certifications = () => {
  return (
    <div className="cert-grid">
      {certificationList.map((cert, idx) => (
        <article className="cert-card" key={idx}>
          <div className="cert-content">
            <h3 className="cert-title">{cert.title}</h3>
            <p className="cert-issuer">{cert.issuer}</p>
            {cert.issued && <p className="cert-meta">Issued: {cert.issued}</p>}
            {cert.credentialId && <p className="cert-meta">ID: {cert.credentialId}</p>}
            {cert.skills && (
              <div className="cert-skills">
                {cert.skills.map(skill => <span key={skill} className="cert-skill-tag">{skill}</span>)}
              </div>
            )}
          </div>
          <a href={cert.link} target="_blank" rel="noopener noreferrer" className="cert-view-btn">
            View Certificate
          </a>
        </article>
      ))}
    </div>
  );
};

const EducationTimeline = () => {
  return (
    <div className="timeline">
      {educationList.map((item, idx) => (
        <article className="timeline-item" key={idx}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <h3 className="timeline-content__degree">{item.degree}</h3>
            <p className="timeline-content__institution">{item.institution}</p>
            {item.duration && <p className="timeline-content__meta">{item.duration}</p>}
            {item.Score && <p className="timeline-content__grade">Score: {item.Score}</p>}
            {item.description && <p className="timeline-content__description">{item.description}</p>}
          </div>
        </article>
      ))}
    </div>
  );
};

export default EducationTimeline;
