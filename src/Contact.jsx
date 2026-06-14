import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from './utils/api';

const CHAT_STORAGE_KEY = 'portfolio_chat_conversation_id';

const isImageAttachment = (url, name) => {
  const target = (name || url || '').toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(target) || /\/image\/upload\//i.test(url || '');
};

const Contact = () => {
  const { conversationId: routeConversationId } = useParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState('form');
  const [conversationId, setConversationId] = useState(null);
  const [visitorName, setVisitorName] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const formFileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async (id) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/chat/${id}/messages`);
      if (!res.ok) return false;

      const data = await res.json();
      setVisitorName(data.visitorName || '');
      setMessages(data.messages || []);
      return true;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const initChat = async () => {
      const storedId = localStorage.getItem(CHAT_STORAGE_KEY);
      const idToLoad = routeConversationId || storedId;

      if (!idToLoad) return;

      const found = await fetchMessages(idToLoad);
      if (found) {
        setConversationId(idToLoad);
        setMode('chat');
        localStorage.setItem(CHAT_STORAGE_KEY, idToLoad);
      } else if (routeConversationId) {
        setStatus({ type: 'error', message: 'Chat not found. Please start a new conversation.' });
      }
    };

    initChat();
  }, [routeConversationId, fetchMessages]);

  useEffect(() => {
    if (mode !== 'chat' || !conversationId) return;

    const poll = setInterval(() => {
      fetchMessages(conversationId);
    }, 4000);

    return () => clearInterval(poll);
  }, [mode, conversationId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    const maxSize = 5 * 1024 * 1024;
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

  const clearAttachment = () => {
    setAttachment(null);
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = '';
    }
    if (formFileInputRef.current) {
      formFileInputRef.current.value = '';
    }
  };

  const renderAttachmentInMessage = (msg) => {
    if (!msg.attachment_url) return null;

    const showImage = isImageAttachment(msg.attachment_url, msg.attachment_name);

    return (
      <div className="chat-attachment-block">
        {showImage && (
          <a
            href={msg.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-attachment-image-link"
          >
            <img
              src={msg.attachment_url}
              alt={msg.attachment_name || 'Attachment'}
              className="chat-attachment-image"
            />
          </a>
        )}
        <a
          href={msg.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-attachment-link"
        >
          📎 {msg.attachment_name || 'View attachment'}
        </a>
      </div>
    );
  };

  const renderPendingAttachment = () => {
    if (!attachment) return null;

    return (
      <div className="attachment-pending">
        <span className="attachment-pending-name" title={attachment.name}>
          📎 {attachment.name}
        </span>
        <button type="button" className="attachment-pending-remove" onClick={clearAttachment} aria-label="Remove attachment">
          ✕
        </button>
      </div>
    );
  };

  const startChat = (id, name, initialMessage) => {
    setConversationId(id);
    setVisitorName(name);
    setMessages([initialMessage]);
    setMode('chat');
    localStorage.setItem(CHAT_STORAGE_KEY, id);
    navigate(`/contact/chat/${id}`, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', message: 'Sending...' });
    setIsSending(true);

    const formData = new FormData(e.target);
    formData.delete('attachment');
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/contact`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const name = formData.get('name');
        startChat(data.conversationId, name, data.chatMessage);
        setStatus({ type: 'success', message: 'Message sent! Stay on this page to see replies.' });
        e.target.reset();
        setAttachment(null);
      } else {
        const errorData = await res.json().catch(() => null);
        setStatus({ type: 'error', message: errorData?.message || 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ type: 'error', message: 'Failed to connect to the server. Ensure the backend is running.' });
    } finally {
      setIsSending(false);
    }
  };

  const sendChatMessage = async () => {
    if (!conversationId || (!chatInput.trim() && !attachment)) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append('message', chatInput.trim() || '(attachment)');

    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/chat/${conversationId}/messages`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.chatMessage]);
        setChatInput('');
        setAttachment(null);
        if (chatFileInputRef.current) {
          chatFileInputRef.current.value = '';
        }
      } else {
        const errorData = await res.json().catch(() => null);
        setStatus({ type: 'error', message: errorData?.message || 'Failed to send message.' });
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      setStatus({ type: 'error', message: 'Failed to connect to the server.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    sendChatMessage();
  };

  const handleNewConversation = () => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setMode('form');
    setConversationId(null);
    setMessages([]);
    setChatInput('');
    setAttachment(null);
    navigate('/contact', { replace: true });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="my-work-section" id="contact">
      <h1 className="work-title">Contact</h1>
      <p className="work-desc">
        {mode === 'chat'
          ? 'Your conversation is live. Stay on this page — replies from Amarjeet will appear here.'
          : "Get in touch with me! I'm always interested in new opportunities and collaborations."}
      </p>

      {mode === 'form' ? (
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
            <input ref={formFileInputRef} type="file" name="attachment" onChange={handleFileChange} />
            <small style={{ color: 'var(--text-muted-color)', marginTop: '0.5rem' }}>
              Allowed types: PDF, JPG, PNG. Max size: 5MB.
            </small>
            {renderPendingAttachment()}
          </label>
          <button type="submit" disabled={isSending} style={{ position: 'relative', overflow: 'hidden' }}>
            {isSending ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span className="spinner"></span> Sending...
              </span>
            ) : 'Send Message'}
          </button>
        </form>
      ) : (
        <div className="chat-container">
          <div className="chat-header">
            <div>
              <strong>Chat with Amarjeet</strong>
              {visitorName && <span className="chat-visitor-name"> · {visitorName}</span>}
            </div>
            <button type="button" className="chat-new-btn" onClick={handleNewConversation}>
              New conversation
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty">No messages yet. Send a message to start the conversation.</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.sender === 'visitor' ? 'chat-bubble-visitor' : 'chat-bubble-admin'}`}
              >
                <div className="chat-bubble-label">
                  {msg.sender === 'visitor' ? 'You' : 'Amarjeet'}
                </div>
                {msg.message_text && msg.message_text !== '(attachment)' && (
                  <p className="chat-bubble-text">{msg.message_text}</p>
                )}
                {renderAttachmentInMessage(msg)}
                <span className="chat-bubble-time">{formatTime(msg.created_at)}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleChatSubmit}>
            {renderPendingAttachment()}
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
            />
            <div className="chat-input-actions">
              <label className="chat-file-label">
                📎 Attach
                <input
                  ref={chatFileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </label>
              <button type="submit" disabled={isSending || (!chatInput.trim() && !attachment)}>
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}

      {status.message && status.type !== 'info' && (
        <div className="contact-toast" data-type={status.type}>
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
