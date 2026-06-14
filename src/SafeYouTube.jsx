import { useState, useCallback } from 'react';
import { FaSearch, FaPlay } from 'react-icons/fa';
import { getApiBaseUrl } from './utils/api';
import './SafeYouTube.css';

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

const extractVideoId = (input) => {
  const trimmed = input.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return YOUTUBE_ID_RE.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && YOUTUBE_ID_RE.test(v)) return v;

      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];

      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    return null;
  }

  return null;
};

const formatPublishedDate = (isoDate) => {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const SafeYouTube = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [pageToken, setPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const playVideo = useCallback((video) => {
    setActiveVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const runSearch = async (searchQuery, token = null) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const directId = extractVideoId(trimmed);
    if (directId && !token) {
      setError('');
      setHasSearched(true);
      setResults([]);
      setPageToken(null);
      setLoading(true);

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/youtube/video/${directId}`);
        const data = await res.json();

        if (res.ok) {
          playVideo(data);
        } else {
          playVideo({
            id: directId,
            title: 'YouTube Video',
            channel: '',
            thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
            publishedAt: '',
            description: '',
          });
          if (!res.ok && res.status !== 404) {
            setError(data.message || 'Could not load video details.');
          }
        }
      } catch {
        playVideo({
          id: directId,
          title: 'YouTube Video',
          channel: '',
          thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
          publishedAt: '',
          description: '',
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (token) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
      setHasSearched(true);
      setResults([]);
      setPageToken(null);
    }

    try {
      const params = new URLSearchParams({ q: trimmed });
      if (token) params.set('pageToken', token);

      const res = await fetch(`${getApiBaseUrl()}/api/youtube/search?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Search failed. Please try again.');
      }

      const videos = data.items || [];
      setResults((prev) => (token ? [...prev, ...videos] : videos));
      setPageToken(data.nextPageToken || null);

      if (!token && videos.length > 0) {
        playVideo(videos[0]);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      if (!token) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  const embedUrl = activeVideo
    ? `https://www.youtube-nocookie.com/embed/${activeVideo.id}?modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`
    : null;

  return (
    <section className="safe-youtube-section" id="learn">
      <h1 className="work-title">Learn</h1>
      <p className="work-desc safe-youtube-desc">
        Search and watch any YouTube video here — no login, no comments, no likes, and no uploads.
        Paste a YouTube link or type what you want to learn.
      </p>

      <form className="safe-youtube-search" onSubmit={handleSubmit}>
        <div className="safe-youtube-search-box">
          <FaSearch className="safe-youtube-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube or paste a video link..."
            aria-label="Search YouTube"
            autoComplete="off"
          />
          <button type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <p className="safe-youtube-error" role="alert">{error}</p>}

      {embedUrl && (
        <div className="safe-youtube-player-wrap">
          <div className="safe-youtube-player">
            <iframe
              key={activeVideo.id}
              src={embedUrl}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="safe-youtube-now-playing">
            <h2>{activeVideo.title}</h2>
            {activeVideo.channel && <p className="safe-youtube-channel">{activeVideo.channel}</p>}
          </div>
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && !error && !extractVideoId(query) && (
        <p className="safe-youtube-empty">No videos found. Try a different search.</p>
      )}

      {results.length > 0 && (
        <div className="safe-youtube-results">
          <h3 className="safe-youtube-results-title">Results</h3>
          <ul className="safe-youtube-grid">
            {results.map((video) => (
              <li key={video.id}>
                <button
                  type="button"
                  className={`safe-youtube-card ${activeVideo?.id === video.id ? 'active' : ''}`}
                  onClick={() => playVideo(video)}
                >
                  <div className="safe-youtube-thumb-wrap">
                    <img src={video.thumbnail} alt="" loading="lazy" />
                    <span className="safe-youtube-play-badge" aria-hidden="true">
                      <FaPlay />
                    </span>
                  </div>
                  <div className="safe-youtube-card-body">
                    <h4>{video.title}</h4>
                    <p className="safe-youtube-card-channel">{video.channel}</p>
                    {video.publishedAt && (
                      <p className="safe-youtube-card-date">{formatPublishedDate(video.publishedAt)}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {pageToken && (
            <button
              type="button"
              className="safe-youtube-load-more"
              onClick={() => runSearch(query, pageToken)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default SafeYouTube;
