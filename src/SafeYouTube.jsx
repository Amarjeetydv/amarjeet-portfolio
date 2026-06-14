import { useState, useCallback, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import { getApiBaseUrl } from './utils/api';
import {
  loadWatchHistory,
  loadSearchHistory,
  loadLastVideo,
  addToWatchHistory,
  addToSearchHistory,
  updateWatchProgress,
  saveLastVideo,
  clearWatchHistory,
  clearSearchHistory,
  extractVideoIdFromInput,
  formatWatchTime,
} from './utils/safeYouTubeHistory';
import YouTubePlayer from './YouTubePlayer';
import './SafeYouTube.css';

const SafeYouTube = () => {
  const playerWrapRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [pageToken, setPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [watchHistory, setWatchHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    setWatchHistory(loadWatchHistory());
    setSearchHistory(loadSearchHistory());

    const last = loadLastVideo();
    if (last?.id) {
      setActiveVideo(last);
      setStartSeconds(last.progressSeconds || 0);
    }
  }, []);

  const playVideo = useCallback((video, resumeAt = 0) => {
    const resumeSeconds = Math.max(0, Math.floor(resumeAt || 0));
    setActiveVideo(video);
    setStartSeconds(resumeSeconds);
    setWatchHistory(addToWatchHistory(video, resumeSeconds));
    saveLastVideo(video, resumeSeconds);

    requestAnimationFrame(() => {
      playerWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleProgress = useCallback((videoId, currentSeconds) => {
    if (!videoId || currentSeconds < 1) return;
    updateWatchProgress(videoId, currentSeconds);
    saveLastVideo(
      activeVideo?.id === videoId ? activeVideo : { id: videoId, title: 'YouTube Video' },
      currentSeconds
    );
    setWatchHistory((prev) =>
      prev.map((item) =>
        item.id === videoId
          ? { ...item, progressSeconds: Math.floor(currentSeconds), watchedAt: new Date().toISOString() }
          : item
      )
    );
  }, [activeVideo]);

  const runSearch = async (searchQuery, token = null) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (!token) {
      setQuery(trimmed);
    }

    const directId = extractVideoIdFromInput(trimmed);
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
          playVideo(data, 0);
        } else {
          playVideo({
            id: directId,
            title: 'YouTube Video',
            channel: '',
            thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
          }, 0);
          if (res.status !== 404) {
            setError(data.message || 'Could not load video details.');
          }
        }
      } catch {
        playVideo({
          id: directId,
          title: 'YouTube Video',
          channel: '',
          thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
        }, 0);
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
      setSearchHistory(addToSearchHistory(trimmed));
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
        playVideo(videos[0], 0);
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

  const handleClearWatchHistory = () => {
    clearWatchHistory();
    setWatchHistory([]);
  };

  const handleClearSearchHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const renderVideoRow = (video, { resumeAt = 0, badge = null } = {}) => {
    const isActive = activeVideo?.id === video.id;

    return (
      <button
        type="button"
        className={`yt-video-row ${isActive ? 'active' : ''}`}
        onClick={() => playVideo(video, resumeAt)}
      >
        <div className="yt-video-thumb">
          <img
            src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
            alt=""
            loading="lazy"
          />
          {resumeAt > 0 && (
            <span className="yt-video-duration">{formatWatchTime(resumeAt)}</span>
          )}
        </div>
        <div className="yt-video-meta">
          {badge && <span className="yt-video-badge">{badge}</span>}
          <h4>{video.title}</h4>
          {video.channel && <p>{video.channel}</p>}
        </div>
      </button>
    );
  };

  return (
    <section className="safe-youtube-section" id="learn">
      <div className="yt-app">
        <header className="yt-header">
          <h1 className="yt-logo">Learn</h1>
          <form className="yt-search-form" onSubmit={handleSubmit}>
            <div className="yt-search-bar">
              <FaSearch className="yt-search-icon" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search YouTube"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="yt-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" className="yt-search-submit" disabled={loading || !query.trim()}>
              {loading ? '...' : 'Go'}
            </button>
          </form>
        </header>

        {error && <p className="yt-error" role="alert">{error}</p>}

        {activeVideo && (
          <div className="yt-player-section" ref={playerWrapRef}>
            <div className="yt-player">
              <YouTubePlayer
                videoId={activeVideo.id}
                startSeconds={startSeconds}
                onProgress={handleProgress}
              />
            </div>
            <div className="yt-now-playing">
              <h2>{activeVideo.title}</h2>
              {activeVideo.channel && <p>{activeVideo.channel}</p>}
            </div>
          </div>
        )}

        {searchHistory.length > 0 && (
          <section className="yt-section">
            <div className="yt-section-head">
              <h3>Recent searches</h3>
              <button type="button" onClick={handleClearSearchHistory}>Clear</button>
            </div>
            <div className="yt-chip-row">
              {searchHistory.map((term) => (
                <button key={term} type="button" className="yt-chip" onClick={() => runSearch(term)}>
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}

        {watchHistory.length > 0 && (
          <section className="yt-section">
            <div className="yt-section-head">
              <h3>History</h3>
              <button type="button" onClick={handleClearWatchHistory}>Clear</button>
            </div>
            <div className="yt-video-list">
              {watchHistory.map((video, index) =>
                renderVideoRow(video, {
                  resumeAt: video.progressSeconds,
                  badge: index === 0 && video.progressSeconds > 0 ? 'Continue' : null,
                })
              )}
            </div>
          </section>
        )}

        {hasSearched && !loading && results.length === 0 && !error && !extractVideoIdFromInput(query) && (
          <p className="yt-empty">No videos found. Try a different search.</p>
        )}

        {results.length > 0 && (
          <section className="yt-section">
            <div className="yt-section-head">
              <h3>Results</h3>
            </div>
            <div className="yt-video-list">
              {results.map((video) => renderVideoRow(video))}
            </div>
            {pageToken && (
              <button
                type="button"
                className="yt-load-more"
                onClick={() => runSearch(query, pageToken)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Show more'}
              </button>
            )}
          </section>
        )}
      </div>
    </section>
  );
};

export default SafeYouTube;
