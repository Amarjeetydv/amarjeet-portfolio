import React from 'react';
import './Patents.css';
import { FaRegLightbulb, FaHashtag, FaCalendarAlt, FaUser, FaUniversity } from 'react-icons/fa';

const patentList = [
  {
    title: "Wearable Posture Correction and Muscle Fatigue Sensor System",
    applicationNo: "202611061268",
    filingDate: "January 25, 2026",
    status: "Patent Pending",
    coInventor: "Dr. Rishabh Garg",
    institution: "Lovely Professional University",
    description: "An intelligent wearable system designed to monitor posture alignment and muscle fatigue in real time using posture sensing, EMG-based muscle activity monitoring, adaptive feedback, and machine-learning-based analysis.",
    tags: ["Wearable Technology", "EMG", "Machine Learning", "IoT", "Sensors"]
  },
  {
    title: "Smart Electricity Saver for Hostel Rooms Using Motion and Presence Detection",
    applicationNo: "202611037718",
    filingDate: "January 21, 2026",
    status: "Patent Pending",
    coInventor: "Dr. Rishabh Garg",
    institution: "Lovely Professional University",
    description: "A smart embedded system designed to reduce electricity wastage in hostel rooms through motion and presence detection, automated appliance control, and energy-efficient power management.",
    tags: ["Embedded Systems", "IoT", "PIR Sensor", "Automation", "Energy Efficiency"]
  }
];

const Patents = () => {
  return (
    <section className="patents-section" id="patents" aria-label="Patents & Innovation">
      <h1 className="work-title">Patents & Innovation</h1>
      <p className="work-desc">
        Patent applications filed for innovative solutions in wearable technology, healthcare, IoT, and smart automation.
      </p>
      
      <div className="patents-grid">
        {patentList.map((patent, index) => (
          <article className="patent-card" key={index}>
            <div className="patent-status-badge" aria-label={`Status: ${patent.status}`}>
              <FaRegLightbulb className="patent-meta-icon" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} aria-hidden="true" />
              {patent.status}
            </div>
            
            <h3 className="patent-title">{patent.title}</h3>
            
            <p className="patent-description">{patent.description}</p>
            
            <div className="patent-meta-container">
              <div className="patent-meta-item">
                <FaHashtag className="patent-meta-icon" aria-hidden="true" />
                <span><span className="patent-meta-label">Application No.:</span> {patent.applicationNo}</span>
              </div>
              <div className="patent-meta-item">
                <FaCalendarAlt className="patent-meta-icon" aria-hidden="true" />
                <span><span className="patent-meta-label">Filing Date:</span> {patent.filingDate}</span>
              </div>
              <div className="patent-meta-item">
                <FaUser className="patent-meta-icon" aria-hidden="true" />
                <span><span className="patent-meta-label">Co-Inventor:</span> {patent.coInventor}</span>
              </div>
              <div className="patent-meta-item">
                <FaUniversity className="patent-meta-icon" aria-hidden="true" />
                <span><span className="patent-meta-label">Institution:</span> {patent.institution}</span>
              </div>
            </div>
            
            <div className="patent-tech-stack" aria-label="Technologies and fields">
              {patent.tags.map((tag) => (
                <span className="patent-tag" key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Patents;
