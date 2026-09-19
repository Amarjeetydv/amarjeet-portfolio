import { useState, useEffect } from 'react';
import { FaTimes, FaSearchPlus, FaSearchMinus, FaRedo, FaExternalLinkAlt, FaFilePdf, FaImage } from 'react-icons/fa';

const ProofModal = ({ isOpen, onClose, proof }) => {
  const [zoom, setZoom] = useState(1);

  // Reset zoom whenever a new proof is opened
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen, proof]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !proof) return null;

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    setZoom(1);
  };

  const isPdf = proof.type === 'pdf';

  return (
    <div
      className="proof-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-modal-title"
    >
      <div
        className={`proof-modal-container ${isPdf ? 'proof-modal-container--pdf' : 'proof-modal-container--image'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="proof-modal-header">
          <div className="proof-modal-title-group">
            {isPdf ? (
              <FaFilePdf className="proof-modal-type-icon proof-modal-type-icon--pdf" aria-hidden="true" />
            ) : (
              <FaImage className="proof-modal-type-icon proof-modal-type-icon--image" aria-hidden="true" />
            )}
            <h3 id="proof-modal-title" className="proof-modal-title">
              {proof.title}
            </h3>
          </div>

          <div className="proof-modal-actions">
            {!isPdf && (
              <div className="proof-zoom-controls" aria-label="Image zoom controls">
                <button
                  type="button"
                  className="proof-control-btn"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                  disabled={zoom <= 0.5}
                >
                  <FaSearchMinus />
                </button>
                <button
                  type="button"
                  className="proof-control-btn proof-control-btn--text"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  aria-label="Reset Zoom"
                >
                  <FaRedo style={{ fontSize: '0.75rem', marginRight: '3px' }} />
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  className="proof-control-btn"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  aria-label="Zoom In"
                  disabled={zoom >= 2.5}
                >
                  <FaSearchPlus />
                </button>
              </div>
            )}

            <a
              href={proof.url}
              target="_blank"
              rel="noopener noreferrer"
              className="proof-control-btn proof-control-btn--link"
              title="Open document in new tab"
              aria-label="Open document in new tab"
            >
              <FaExternalLinkAlt />
            </a>

            <button
              type="button"
              className="proof-modal-close-btn"
              onClick={onClose}
              title="Close viewer (Esc)"
              aria-label="Close viewer"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="proof-modal-body">
          {isPdf ? (
            <div className="proof-pdf-container">
              <iframe
                src={`${proof.url}#toolbar=1&navpanes=0&scrollbar=1`}
                title={proof.title}
                className="proof-pdf-iframe"
              />
              <div className="proof-pdf-mobile-fallback">
                <p>Viewing PDF on mobile or tablet:</p>
                <a
                  href={proof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proof-mobile-open-btn"
                >
                  Open Appointment Letter PDF <FaExternalLinkAlt style={{ marginLeft: '6px' }} />
                </a>
              </div>
            </div>
          ) : (
            <div className="proof-image-container">
              <div
                className="proof-image-scroll-wrapper"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
              >
                <img
                  src={proof.url}
                  alt={proof.title}
                  className="proof-image-element"
                  loading="eager"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProofModal;
