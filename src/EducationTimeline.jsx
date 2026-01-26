import React from "react";
import "./EducationTimeline.css";

const educationData = [
  // Certifications (with credential button)
  // Education (no credential button)
  {
    degree: "Master of Computer Applications (MCA)",
    institution: "School of Computer Applications, Lovely Professional University, Phagwara, Punjab, India",
    duration: "Jun 2025 – Jun 2027",
    description: "Recently enrolled to deepen my expertise in software development, system design, and emerging technologies. Excited to explore advanced concepts in full stack development, cloud computing, and real-world tech applications.",
    type: "education"
  },
  {
    degree: "Bachelor of Computer Applications (BCA) (First Division)",
    institution: "Doon Institute of Engineering & Technology, Rishikesh, Uttarakhand, India",
    duration: "Aug 2022 – Jun 2025",
    grade: "76.15% (First Division)",
    description: "Actively engaged in hands-on learning and collaborative projects, with a strong foundation in software development and system design. Took initiative in academic and extracurricular leadership, contributing to a dynamic academic environment. Gained practical experience across front-end and back-end tech, technologies, and participated in coding competitions.",
    skills: [
      "Microsoft Office",
      "Leadership",
      "SQL",
      "C",
      "C++",
      "Programming Language",
      "Software Design Patterns",
      "Python (Programming Language)",
      "Node.js",
      "Communication",
      "MySQL",
      "Cascading Style Sheets (CSS)",
      "ChatGPT",
      "Adobe Photoshop",
      "JavaScript",
      "Lean Software Development",
      "Php"
    ],
    type: "education"
  },
  {
    degree: "Advance Diploma In Full Stack Developer",
    institution: "Global Information Technology Council",
    issued: "Mar 2024",
    credentialId: "DV-92051091",
    credentialUrl: "https://drive.google.com/file/d/1at2h5V0bNFg_l9gtnmJid8sACv8k4kou/view", // Updated with actual credential link
    skills: [
      "Node.js",
      "Python (Programming Language)",
      "Laravel",
      "Php",
      "React.js",
      "Lean Software Development",
      "Git",
      "SQL",
      "MySQL"
    ],
    type: "certification"
  },
  {
    degree: "Certificate of Workshop on Python",
    institution: "UptoSkills",
    issued: "Sep 2023",
    credentialUrl: "https://drive.google.com/file/d/1aevQ1Svw57vjvP8_Qnfg0V2xauxb6KZ_/view", // Updated with actual credential link
    type: "certification"
  },
  {
    degree: "Debate Competition Participation Certificate",
    institution: "Doon Institute of Engineering & Technology",
    issued: "Sep 2023",
    credentialUrl: "https://drive.google.com/file/d/1i98dT-02E7mCtK0crRdFJ6FF_LA3U2_L/view", // Updated with actual credential link
    type: "certification"
  },
  {
    degree: "Senior School Certificate (Class XII, Science, PCM with Physical Education)",
    institution: "S G R R Public School, Bhaniyawala, Dehradun, Uttarakhand, India",
    duration: "Apr 2020 – May 2022",
    grade: "77.67%",
    description: "Completed Class 12 (CBSE) with a Science stream, including Physics, Chemistry, Mathematics, and Physical Education. Participated in academic science events and school-level sports activities as part of Physical Education.",
    type: "education"
  },
  {
    degree: "Secondary School Examination (Class X, General Education – English, Hindi, Mathematics, Science, Social Science)",
    institution: "Shri Guru Ram Rai Public School, Rishikesh, Dehradun, Uttarakhand, India",
    duration: "Apr 2018 – Mar 2020",
    grade: "84%",
    description: "Successfully completed CBSE Class 10th with an overall score of 84%. Enrolled in Hindi and Social Science Olympiads, participated in quiz and academic competitions. Skilled and well rounded understanding of English, Hindi, Social Science, Science, and Mathematics.",
    type: "education"
  }
];

const EducationTimeline = () => {
  return (
    <section className="education-timeline">
      <h2>Education & Certifications</h2>
      <div className="timeline">
        {educationData.map((item, idx) => (
          <div className="timeline-item" key={idx}>
            <div className="timeline-dot" />
            <div className="timeline-content">
              <h3 className="timeline-content__degree">{item.degree}</h3>
              <p className="timeline-content__institution">{item.institution}</p>
              {item.duration && <p className="timeline-content__meta">{item.duration}</p>}
              {item.grade && <p className="timeline-content__grade">Grade: {item.grade}</p>}
              {item.issued && <p className="timeline-content__meta">Issued {item.issued}</p>}
              {item.credentialId && (
                <p className="timeline-content__meta">Credential ID: {item.credentialId}</p>
              )}
              {item.description && <p className="timeline-content__description">{item.description}</p>}
              {item.skills && (
                <p className="timeline-content__skills">
                  <span className="timeline-content__skills-label">Skills:</span> {item.skills.join(" · ")}
                </p>
              )}
              {/* Only show credential button for certifications */}
              {item.type === "certification" && item.credentialUrl && (
                <a
                  href={item.credentialUrl}
                  className="credential-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Show credential
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EducationTimeline;
