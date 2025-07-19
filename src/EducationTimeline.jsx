import React from "react";
import "./EducationTimeline.css";

const educationData = [
  // Certifications (with credential button)
  {
    degree: "Advance Diploma In Full Stack Developer",
    institution: "Global Information Technology Council",
    issued: "Mar 2024",
    credentialId: "DV-92051091",
    credentialUrl: "#", // Replace with actual credential link if available
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
    credentialUrl: "#", // Replace with actual credential link if available
    type: "certification"
  },
  {
    degree: "Debate Competition Participation Certificate",
    institution: "Doon Institute of Engineering & Technology",
    issued: "Sep 2023",
    credentialUrl: "#", // Replace with actual credential link if available
    type: "certification"
  },
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
              <h3 style={{ color: '#a259ff', fontWeight: 700 }}>{item.degree}</h3>
              <p className="institution" style={{ fontWeight: 500, color: '#0073b1' }}>{item.institution}</p>
              {item.duration && <p className="duration" style={{ color: '#232323', fontWeight: 500 }}>{item.duration}</p>}
              {item.grade && <p className="grade" style={{ background: '#e0e7ff', color: '#222', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, margin: '0.2rem 0' }}>Grade: {item.grade}</p>}
              {item.issued && <p className="issued" style={{ color: '#232323', fontWeight: 500 }}>Issued {item.issued}</p>}
              {item.credentialId && (
                <p className="credential-id" style={{ color: '#232323', fontWeight: 500 }}>Credential ID: {item.credentialId}</p>
              )}
              {item.description && <p className="description" style={{ color: '#232323' }}>{item.description}</p>}
              {item.skills && (
                <p className="skills" style={{ color: '#0073b1', fontWeight: 500 }}>
                  <span style={{ background: '#e0e7ff', color: '#222', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>Skills:</span> {item.skills.join(" · ")}
                </p>
              )}
              {/* Only show credential button for certifications */}
              {item.type === "certification" && (
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
