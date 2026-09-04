import { memo } from 'react';

const isImageAttachment = (url, name) => {
  const target = (name || url || '').toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(target) || /\/image\/upload\//i.test(url || '');
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const renderFormattedText = (text) => {
  if (!text) return null;
  if (!text.includes('`') && !text.includes('http://') && !text.includes('https://')) {
    return text;
  }

  const parts = [];
  const segments = text.split(/(```[\s\S]*?```)/g);

  segments.forEach((segment, idx) => {
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const codeContent = segment.slice(3, -3).replace(/^\n+|\n+$/g, '');
      parts.push(
        <pre key={`code-${idx}`} className="chat-code-block">
          <code>{codeContent}</code>
        </pre>
      );
    } else {
      const inlineParts = segment.split(/(`[^`]+`)/g);
      inlineParts.forEach((inlineSeg, iIdx) => {
        if (inlineSeg.startsWith('`') && inlineSeg.endsWith('`') && inlineSeg.length > 2) {
          parts.push(
            <code key={`inline-${idx}-${iIdx}`} className="chat-inline-code">
              {inlineSeg.slice(1, -1)}
            </code>
          );
        } else if (inlineSeg) {
          const urlParts = inlineSeg.split(/(https?:\/\/[^\s]+)/g);
          urlParts.forEach((urlSeg, uIdx) => {
            if (urlSeg.startsWith('http://') || urlSeg.startsWith('https://')) {
              parts.push(
                <a
                  key={`url-${idx}-${iIdx}-${uIdx}`}
                  href={urlSeg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-message-link"
                >
                  {urlSeg}
                </a>
              );
            } else if (urlSeg) {
              parts.push(urlSeg);
            }
          });
        }
      });
    }
  });

  return parts;
};

const ChatMessageBubble = memo(function ChatMessageBubble({ msg }) {
  const isVisitor = msg.sender === 'visitor';

  return (
    <div className={`chat-bubble ${isVisitor ? 'chat-bubble-visitor' : 'chat-bubble-admin'}`}>
      <div className="chat-bubble-label">{isVisitor ? 'You' : 'Amarjeet'}</div>
      {msg.message_text && msg.message_text !== '(attachment)' && (
        <div className="chat-bubble-text">{renderFormattedText(msg.message_text)}</div>
      )}
      {msg.attachment_url && (
        <div className="chat-attachment-block">
          {isImageAttachment(msg.attachment_url, msg.attachment_name) && (
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
                loading="lazy"
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
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.35rem',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <span className="chat-bubble-time">{formatTime(msg.created_at)}</span>
        {msg.status && (
          <span
            className={`chat-bubble-status ${msg.status}`}
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {msg.status === 'sending' && (
              <span className="spinner" style={{ width: '10px', height: '10px', borderWidth: '1px' }}></span>
            )}
            {msg.status === 'pending' || msg.status === 'sending' ? 'Pending' : ''}
            {msg.status === 'failed' && (
              <span style={{ color: '#f87171' }}>
                Failed ·{' '}
                <button
                  type="button"
                  onClick={() => msg.onRetry && msg.onRetry(msg.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    font: 'inherit',
                    fontWeight: 600,
                  }}
                >
                  Retry
                </button>
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
});

export default ChatMessageBubble;
