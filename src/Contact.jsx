import { useState } from 'react';

const Contact = () => {
  const [attachment, setAttachment] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setAttachment(null);
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a PDF, JPG, or PNG.');
      e.target.value = null;
      return;
    }
    if (file.size > maxSize) {
      alert('File is too large. Maximum size is 5MB.');
      e.target.value = null;
      return;
    }
    setAttachment(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        alert('Message sent!');
        e.target.reset();
        setAttachment(null);
      } else {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.message || 'Failed to send message. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to connect to the server. Ensure the backend is running.');
    }
  };

  return (
    <section className="my-work-section" id="contact">
      <h2 className="work-title">Contact</h2>
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
        <button type="submit">Send</button>
      </form>
    </section>
  );
};

export default Contact;
