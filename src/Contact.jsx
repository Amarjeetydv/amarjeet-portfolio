import { useState, useEffect } from 'react';

const Contact = () => {
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (status.message && status.type !== 'info') {
      const timer = setTimeout(() => {
        setStatus({ type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setAttachment(null);
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!allowedTypes.includes(file.type)) {
      setStatus({ type: 'error', message: 'Invalid file type. Please upload a PDF, JPG, or PNG.' });
      e.target.value = null;
      return;
    }
    if (file.size > maxSize) {
      setStatus({ type: 'error', message: 'File is too large. Maximum size is 5MB.' });
      e.target.value = null;
      return;
    }
    setStatus({ type: '', message: '' });
    setAttachment(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', message: 'Sending...' });
    const formData = new FormData(e.target);
    formData.delete('attachment');
    if (attachment) {
      formData.append('attachment', attachment);
    }
    try {
      let baseUrl = import.meta.env.VITE_API_URL;
      if (!baseUrl) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          baseUrl = 'http://localhost:5000';
        } else {
          baseUrl = 'https://amarjeet-portfolio.onrender.com';
        }
      }
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/contact`;
      console.log('Attempting to send message to API at:', apiUrl);
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Message sent successfully!' });
        e.target.reset();
        setAttachment(null);
      } else {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.message || 'Failed to send message. Please try again.';
        setStatus({ type: 'error', message: errorMessage });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ type: 'error', message: 'Failed to connect to the server. Ensure the backend is running.' });
    }
  };

  return (
    <section className="my-work-section" id="contact">
      <h1 className="work-title">Contact</h1>
      <p className="work-desc">
        Get in touch with me! I'm always interested in new opportunities and collaborations. Let's discuss how we can work together.
      </p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Name:
          <input type="text" name="name" placeholder="Enter your full name" required autoComplete="name" />
        </label>
        <label>
          Email:
          <input type="email" name="email" placeholder="Enter your email address" required autoComplete="email" />
        </label>
        <label>
          Message:
          <textarea name="message" placeholder="Write your message here..." required />
        </label>
        <label>
          Attach a file (optional)
          <input type="file" name="attachment" onChange={handleFileChange} />
          <small style={{ color: 'var(--text-muted-color)', marginTop: '0.5rem' }}>Allowed types: PDF, JPG, PNG. Max size: 5MB.</small>
        </label>
        <button type="submit" disabled={status.type === 'info'} style={{ position: 'relative', overflow: 'hidden' }}>
          {status.type === 'info' ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span className="spinner"></span> Sending...
            </span>
          ) : 'Send Message'}
        </button>
      </form>

      {/* Toast Notification */}
      {status.message && status.type !== 'info' && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: 'var(--surface-color, #242424)',
          color: 'var(--text-color, #f0f0f0)',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          border: `1px solid ${status.type === 'success' ? 'var(--primary-color, #a259ff)' : '#ff4d4d'}`,
          animation: 'slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          maxWidth: '90vw',
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{ fontSize: '1.5rem' }}>
            {status.type === 'success' ? '✅' : '⚠️'}
          </span>
          <span style={{ fontWeight: 500 }}>{status.message}</span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
};

export default Contact;
